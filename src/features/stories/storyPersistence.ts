import type { Character, GeneratedStory, StoryConfig, StoryPage } from './types.ts';

export interface StoryRepository {
  createDraft(config: StoryConfig, title: string): Promise<string>;
  saveCharacters(storyId: string, characters: Character[]): Promise<void>;
  savePages(storyId: string, pages: StoryPage[]): Promise<void>;
  setStatus(storyId: string, status: 'completed' | 'failed'): Promise<void>;
}

// Completion follows every successful write. A failed write must never appear as
// successful. This is not a transaction: a server-side atomic save remains planned.
export async function persistStory(repository: StoryRepository, config: StoryConfig, story: GeneratedStory) {
  if (!story.pages.length) throw new Error('Cannot save a story without pages');
  const id = await repository.createDraft(config, story.title);
  try {
    if (config.characters.length) await repository.saveCharacters(id, config.characters);
    await repository.savePages(id, story.pages);
    await repository.setStatus(id, 'completed');
    return id;
  } catch (error) {
    try { await repository.setStatus(id, 'failed'); } catch { /* preserve the original failure */ }
    throw error;
  }
}
