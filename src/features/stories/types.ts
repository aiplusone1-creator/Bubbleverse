export interface Character {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
}

export interface StoryConfig {
  storyLength: string;
  format: string;
  artStyle: string;
  customArtStyle: string;
  language: string;
  characters: Character[];
  interests: string[];
  plotMode: 'auto' | 'manual';
  customPlot: string;
}

export interface StoryPage {
  pageNumber: number;
  sceneDescription: string;
  dialogueText: string;
  panelLayoutType: string;
}

export interface GeneratedStory {
  title: string;
  pages: StoryPage[];
}

export interface GenerateStoryResult extends GeneratedStory {
  success: boolean;
  config: { storyLength: string; format: string; artStyle: string; pageCount: number };
}

// UI photos/IDs stay out of the text-generation request.
export function toStoryRequest(config: StoryConfig) {
  return {
    storyLength: config.storyLength, format: config.format, artStyle: config.artStyle,
    customArtStyle: config.customArtStyle, language: config.language,
    characters: config.characters.map(({ name, role }) => ({ name, role })),
    interests: [...config.interests], plotMode: config.plotMode, customPlot: config.customPlot,
  };
}

// Durable text only. Private reference uploads have a separate future contract.
export function toStorySavePayload(config: StoryConfig, story: GeneratedStory) {
  return {
    config: toStoryRequest(config),
    story: { title: story.title, pages: story.pages.map(page => ({
      pageNumber: page.pageNumber, sceneDescription: page.sceneDescription,
      dialogueText: page.dialogueText, panelLayoutType: page.panelLayoutType,
    })) },
  };
}
export type StorySavePayload = ReturnType<typeof toStorySavePayload>;
