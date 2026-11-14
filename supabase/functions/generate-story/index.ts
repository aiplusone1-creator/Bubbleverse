import { createGenerationHandler } from '../_shared/generationHandler.ts';
import { authorizeGeneration } from '../_shared/supabaseAccess.ts';
import { createGeminiProvider } from '../_shared/textProvider.ts';
import { validateStoryRequest } from '../_shared/requestValidation.ts';
import { generateStory } from '../_shared/storyGeneration.ts';

const provider = createGeminiProvider(Deno.env.get('GEMINI_API_KEY'));
Deno.serve(createGenerationHandler({
  operation: 'generate-story',
  validate: validateStoryRequest,
  authorize: authorizeGeneration,
  assertProviderConfigured: provider.assertConfigured,
  generate: input => generateStory(input, provider),
}));
