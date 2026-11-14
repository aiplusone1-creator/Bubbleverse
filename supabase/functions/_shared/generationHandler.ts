import { readJson, requestKey, RequestError } from './requestValidation.ts';

export type Operation = 'generate-story' | 'enhance-plot';
export interface GenerationAccess {
  reserve(operation: Operation, key: string): Promise<void>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

export function createGenerationHandler<Input>(options: {
  operation: Operation;
  validate(value: unknown): Input;
  authorize(header: string): Promise<GenerationAccess>;
  assertProviderConfigured(): void;
  generate(input: Input): Promise<unknown>;
}) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    try {
      const body = await readJson(req);
      const header = req.headers.get('Authorization');
      if (!header?.startsWith('Bearer ')) throw new RequestError('Unauthorized - Please sign in', 401);
      const access = await options.authorize(header);
      const input = options.validate(body);
      const key = requestKey(req);
      options.assertProviderConfigured();
      await access.reserve(options.operation, key);
      return json(await options.generate(input));
    } catch (error) {
      if (error instanceof RequestError) return json({ error: error.message }, error.status);
      console.error('Generation operation failed', options.operation);
      return json({ error: 'Generation failed. Please try again later.' }, 500);
    }
  };
}
