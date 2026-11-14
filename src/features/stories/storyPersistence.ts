import { toStorySavePayload, type GeneratedStory, type StoryConfig, type StorySavePayload } from './types.ts';

export interface StoryRepository {
  saveStory(requestKey: string, payload: StorySavePayload): Promise<string>;
}

// In-memory retry identity only; durable jobs/reload recovery are separate work.
export function createStorySaver(makeKey: () => string = () => crypto.randomUUID()) {
  const attempts = new WeakMap<GeneratedStory, {
    owner: string; key: string; serialized: string; promise?: Promise<string>;
  }>();
  return async (repository: StoryRepository, owner: string, config: StoryConfig,
    story: GeneratedStory, requestKey?: string): Promise<string> => {
    if (!story.pages.length) throw new Error('Cannot save a story without pages');
    const payload = toStorySavePayload(config, story);
    const serialized = JSON.stringify(payload);
    let attempt = attempts.get(story);
    if (attempt && (attempt.owner !== owner || attempt.serialized !== serialized ||
      (requestKey !== undefined && requestKey !== attempt.key))) {
      throw new Error('Story save identity or content changed; start a new save explicitly');
    }
    if (!attempt) {
      attempt = { owner, key: requestKey ?? makeKey(), serialized };
      attempts.set(story, attempt);
    }
    if (!attempt.promise) {
      const current = attempt;
      current.promise = Promise.resolve().then(() => repository.saveStory(current.key, payload));
      // Preserve the identity after failure so a lost response can be retried safely.
      current.promise.catch(() => { current.promise = undefined; });
    }
    return attempt.promise;
  };
}
