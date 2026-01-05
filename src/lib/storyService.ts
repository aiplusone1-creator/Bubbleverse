import { supabase } from '@/integrations/supabase/client';

interface StoryConfig {
  storyLength: string;
  format: string;
  artStyle: string;
  characters: Array<{ id: string; name: string; role: string; imageUrl?: string }>;
  interests: string[];
  plotMode: 'auto' | 'manual';
  customPlot: string;
}

interface GeneratedPage {
  pageNumber: number;
  sceneDescription: string;
  dialogueText: string;
  panelLayoutType: string;
}

interface GenerateStoryResult {
  success: boolean;
  title: string;
  pages: GeneratedPage[];
  config: {
    storyLength: string;
    format: string;
    artStyle: string;
    pageCount: number;
  };
}

export const generateStory = async (config: StoryConfig): Promise<GenerateStoryResult> => {
  console.log('Calling generate-story edge function with config:', config);
  
  const { data, error } = await supabase.functions.invoke('generate-story', {
    body: {
      storyLength: config.storyLength,
      format: config.format,
      artStyle: config.artStyle,
      characters: config.characters.map(c => ({ name: c.name, role: c.role })),
      interests: config.interests,
      plotMode: config.plotMode,
      customPlot: config.customPlot,
    }
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(error.message || 'Failed to generate story');
  }

  if (data.error) {
    console.error('Story generation error:', data.error);
    throw new Error(data.error);
  }

  console.log('Story generated successfully:', data);
  return data;
};

export const saveStoryToDatabase = async (
  config: StoryConfig, 
  generatedData: GenerateStoryResult
): Promise<string> => {
  console.log('Saving story to database...');
  
  // Create the story record
  const { data: story, error: storyError } = await supabase
    .from('stories')
    .insert({
      title: generatedData.title,
      status: 'completed',
      story_length_mode: config.storyLength,
      story_format: config.format,
      art_style: config.artStyle,
      plot_mode_manual: config.plotMode === 'manual',
      user_plot_input: config.customPlot || null,
      child_interests: config.interests.join(', '),
    })
    .select()
    .single();

  if (storyError) {
    console.error('Error saving story:', storyError);
    throw new Error('Failed to save story');
  }

  console.log('Story saved:', story);

  // Save characters
  if (config.characters.length > 0) {
    const charactersToInsert = config.characters.map(c => ({
      story_id: story.id,
      name: c.name,
      role: c.role,
      original_image_url: c.imageUrl || null,
    }));

    const { error: charError } = await supabase
      .from('characters')
      .insert(charactersToInsert);

    if (charError) {
      console.error('Error saving characters:', charError);
    }
  }

  // Save pages
  const pagesToInsert = generatedData.pages.map(p => ({
    story_id: story.id,
    page_number: p.pageNumber,
    scene_description: p.sceneDescription,
    dialogue_text: p.dialogueText,
    panel_layout_type: p.panelLayoutType,
  }));

  const { error: pagesError } = await supabase
    .from('pages')
    .insert(pagesToInsert);

  if (pagesError) {
    console.error('Error saving pages:', pagesError);
  }

  console.log('Story saved with ID:', story.id);
  return story.id;
};
