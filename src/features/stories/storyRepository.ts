import { supabase } from '@/integrations/supabase/client';
import type { StoryRepository } from './storyPersistence';

export function createStoryRepository(userId: string): StoryRepository {
  return {
    async saveStory(requestKey, payload) {
      const { data, error } = await supabase.rpc('save_generated_story', {
        p_expected_owner: userId, p_request_key: requestKey, p_payload: payload,
      });
      if (error) {
        const messages: Record<string, string> = {
          PGRST202: 'Story saving is unavailable until the database migration is installed.',
          '42501': 'Your account cannot save this story. Please sign in again.',
          '22023': 'The story content is invalid and could not be saved.',
          PT409: 'This save request was already used for different content.',
          PT410: 'This story was deleted and cannot be recreated by retrying.',
        };
        throw new Error(messages[error.code] ?? 'Story could not be saved. Retry the same request.');
      }
      if (typeof data !== 'string' || !data) throw new Error('Invalid story save response');
      return data;
    },
  };
}
