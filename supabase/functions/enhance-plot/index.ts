import { createGenerationHandler } from '../_shared/generationHandler.ts';
import { authorizeGeneration } from '../_shared/supabaseAccess.ts';
import { createGeminiProvider } from '../_shared/textProvider.ts';
import { validateEnhanceRequest } from '../_shared/requestValidation.ts';
import { enhancePlot } from '../_shared/plotGeneration.ts';

const provider = createGeminiProvider(Deno.env.get('GEMINI_API_KEY'));
Deno.serve(createGenerationHandler({
  operation: 'enhance-plot',
  validate: validateEnhanceRequest,
  authorize: authorizeGeneration,
  assertProviderConfigured: provider.assertConfigured,
  generate: input => enhancePlot(input, provider),
}));
