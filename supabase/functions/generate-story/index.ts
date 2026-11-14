import { createGenerationHandler } from '../_shared/generationHandler.ts';
import { authorizeGeneration } from '../_shared/supabaseAccess.ts';
import { RequestError, validateStoryRequest } from '../_shared/requestValidation.ts';

Deno.serve(createGenerationHandler({
  operation: 'generate-story',
  validate: validateStoryRequest,
  authorize: authorizeGeneration,
  assertProviderConfigured() {
    throw new RequestError('Order generation is unavailable', 503);
  },
  generate() {
    throw new RequestError('Order generation is unavailable', 503);
  },
}));
