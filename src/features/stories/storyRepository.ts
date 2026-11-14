import { supabase } from '@/integrations/supabase/client';
import type { StoryRepository } from './storyPersistence';

export function createStoryRepository(userId: string): StoryRepository {
  return {
    async createDraft(config, title) {
      const { data, error } = await supabase.from('stories').insert({
        user_id: userId, title, status: 'draft', language: config.language,
        story_length_mode: config.storyLength, story_format: config.format,
        art_style: config.artStyle, plot_mode_manual: config.plotMode === 'manual',
        user_plot_input: config.customPlot || null, child_interests: config.interests.join(', '),
      }).select('id').single();
      if (error || !data) throw new Error('Failed to save story');
      return data.id;
    },
    async saveCharacters(storyId, characters) {
      const { error } = await supabase.from('characters').insert(characters.map(c => ({
        story_id: storyId, user_id: userId, name: c.name, role: c.role,
        original_image_url: c.imageUrl || null,
      })));
      if (error) throw new Error('Failed to save story characters');
    },
    async savePages(storyId, pages) {
      const { error } = await supabase.from('pages').insert(pages.map(p => ({
        story_id: storyId, user_id: userId, page_number: p.pageNumber,
        scene_description: p.sceneDescription, dialogue_text: p.dialogueText,
        panel_layout_type: p.panelLayoutType,
      })));
      if (error) throw new Error('Failed to save story pages');
    },
    async setStatus(storyId, status) {
      const { data, error } = await supabase.from('stories').update({ status })
        .eq('id', storyId).eq('user_id', userId).select('id').single();
      if (error || !data) throw new Error('Failed to update story status');
    },
  };
}
