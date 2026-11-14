import { supabase } from '@/integrations/supabase/client';
import { toStoryRequest, type GenerateStoryResult, type StoryConfig } from './types';
import { createStoryRepository } from './storyRepository';
import { persistStory } from './storyPersistence';

export async function generateStory(config: StoryConfig, signal?: AbortSignal): Promise<GenerateStoryResult> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error('Please sign in to generate a story.');
  signal?.throwIfAborted();
  const { data, error } = await supabase.functions.invoke('generate-story', {
    signal,
    headers: { 'x-idempotency-key': crypto.randomUUID() }, body: toStoryRequest(config),
  });
  if (error) throw new Error(error.message || 'Failed to generate story');
  if (!data || data.error || data.success !== true || !Array.isArray(data.pages) || !data.pages.length) {
    throw new Error(data?.error || 'Invalid story response');
  }
  return data;
}

export async function saveStoryToDatabase(config: StoryConfig, story: GenerateStoryResult) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('User must be authenticated to save stories');
  return persistStory(createStoryRepository(user.id), config, story);
}
