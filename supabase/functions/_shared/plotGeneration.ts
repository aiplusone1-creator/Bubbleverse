import type { validateEnhanceRequest } from './requestValidation.ts';
import type { TextProvider } from './textProvider.ts';

export async function enhancePlot(input: ReturnType<typeof validateEnhanceRequest>, provider: TextProvider) {
  const themes = input.interests.length ? `Incorporate these themes: ${input.interests.join(', ')}.` : '';
  const enhancedPlot = await provider.generateText({
    model: 'google/gemini-2.5-flash', maxTokens: 500,
    messages: [{ role: 'system', content: `You are a creative children's story plot enhancer.
Keep the core idea, add vivid details and an engaging beginning, challenge and resolution.
Use age-appropriate, simple language. Return at most 2–3 paragraphs. ${themes}` },
    { role: 'user', content: `Enhance this parent-provided story plot: ${JSON.stringify(input.plot)}` }],
  });
  return { enhancedPlot };
}
