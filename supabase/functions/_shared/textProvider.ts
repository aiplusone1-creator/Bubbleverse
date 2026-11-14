import { RequestError } from './requestValidation.ts';

export interface TextRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  maxTokens: number;
  temperature?: number;
}

export interface TextProvider {
  assertConfigured(): void;
  generateText(request: TextRequest): Promise<string>;
}

export interface GeminiProviderOptions {
  baseUrl?: string;
}

/**
 * Direct Google Gemini API adapter.
 * Uses Google AI Studio's official OpenAI-compatible chat completions endpoint:
 * https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
 * Accepts GEMINI_API_KEY, normalizes model names (removes legacy prefixes),
 * and enforces strict timeout, credit classification, and bounded response parsing.
 * ZERO Lovable dependencies or fallback paths.
 */
export function createGeminiProvider(
  apiKey: string | undefined,
  fetcher: typeof fetch = fetch,
  options: GeminiProviderOptions = {},
): TextProvider {
  const baseUrl = options.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  const assertConfigured = () => {
    if (!apiKey) throw new RequestError('Text generation is not configured', 503);
  };
  return {
    assertConfigured,
    async generateText(request) {
      assertConfigured();
      let response: Response;
      const model = request.model.replace(/^google\//, '');
      try {
        response = await fetcher(baseUrl, {
          method: 'POST',
          signal: AbortSignal.timeout(45000),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: request.messages,
            max_tokens: request.maxTokens,
            ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
          }),
        });
      } catch {
        throw new RequestError('Text provider is unavailable. Please try again later.', 503);
      }
      if (!response.ok) {
        await response.body?.cancel();
        if (response.status === 429) throw new RequestError('Rate limit exceeded. Please try again later.', 429);
        if (response.status === 402 || response.status === 403) {
          throw new RequestError('Generation credits are unavailable.', 402);
        }
        throw new RequestError('Text provider request failed', 502);
      }
      try {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content.trim() && content.length <= 200000) {
          return content.trim();
        }
      } catch {
        /* invalid upstream response; never expose its body */
      }
      throw new RequestError('Invalid text provider response', 502);
    },
  };
}

// Canonical export for text generation provider
export const createTextProvider = createGeminiProvider;
