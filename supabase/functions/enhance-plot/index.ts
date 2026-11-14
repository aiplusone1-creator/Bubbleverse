import { createGenerationHandler } from '../_shared/generationHandler.ts';
import { authorizeGeneration } from '../_shared/supabaseAccess.ts';
import { RequestError, validateEnhanceRequest } from '../_shared/requestValidation.ts';

Deno.serve(createGenerationHandler({
  operation: 'enhance-plot',
  validate: validateEnhanceRequest,
  authorize: authorizeGeneration,
  assertProviderConfigured() {
    throw new RequestError('Standalone plot enhancement is unavailable', 503);
  },
  generate() {
    throw new RequestError('Standalone plot enhancement is unavailable', 503);
  },
}));
