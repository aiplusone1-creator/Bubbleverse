import { RequestError, validateStoryPages } from './requestValidation.ts';
import { buildStoryPrompts, type StoryInput } from './storyPrompts.ts';
import type { TextProvider } from './textProvider.ts';

const ranges: Record<string, [number, number]> = { short: [8, 10], medium: [12, 18], epic: [18, 25] };

export async function generateStory(input: StoryInput, provider: TextProvider, random = Math.random) {
  const [min, max] = ranges[input.storyLength];
  const count = min + Math.floor(random() * (max - min + 1));
  const prompts = buildStoryPrompts(input, count);
  const content = await provider.generateText({
    model: 'google/gemini-2.5-flash', maxTokens: 12000, temperature: 0.8,
    messages: [{ role: 'system', content: prompts.system }, { role: 'user', content: prompts.user }],
  });
  let pages: ReturnType<typeof validateStoryPages>;
  try {
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Missing array');
    pages = validateStoryPages(JSON.parse(match[0]), count);
  } catch { throw new RequestError('Invalid story response from provider', 502); }

  let title = input.language === 'Arabic' ? 'مغامرتي السحرية' : 'My Magical Adventure';
  // A title failure must not discard the already validated book or trigger a paid retry.
  try {
    const text = await provider.generateText({
      model: 'google/gemini-2.5-flash-lite', maxTokens: 100,
      messages: [{ role: 'user', content: `Write a catchy title of at most 6 words in ${input.language} only.
Scene: ${pages[0].sceneDescription}
Text: ${pages[0].dialogueText}
Return only the title, without quotes or explanation.` }],
    });
    const cleaned = text.replace(/['"]/g, '').trim().slice(0, 50);
    if (cleaned) title = cleaned;
  } catch { /* keep localized fallback; never repeat successful story generation */ }
  return {
    success: true, title, pages,
    config: { storyLength: input.storyLength, format: input.format, artStyle: input.artStyle, pageCount: pages.length },
  };
}
