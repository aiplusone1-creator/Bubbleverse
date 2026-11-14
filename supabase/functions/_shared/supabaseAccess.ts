import { createClient } from 'npm:@supabase/supabase-js@2.89.0';
import { RequestError, requireUsableProfile, requireReservation } from './requestValidation.ts';
import type { GenerationAccess } from './generationHandler.ts';

export async function authorizeGeneration(header: string): Promise<GenerationAccess> {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) throw new RequestError('Authentication service is not configured', 503);
  const client = createClient(url, key, { global: { headers: { Authorization: header } } });
  const { data, error } = await client.auth.getClaims(header.slice('Bearer '.length));
  if (error || !data?.claims?.sub) throw new RequestError('Unauthorized - Invalid session', 401);
  const { data: profile, error: profileError } = await client.from('profiles').select('is_banned')
    .eq('user_id', data.claims.sub).maybeSingle();
  requireUsableProfile(profile, profileError);
  return {
    async reserve(operation, requestKey) {
      const { data, error } = await client.rpc('reserve_ai_request', {
        p_operation: operation, p_request_key: requestKey,
      });
      requireReservation(data, error);
    },
  };
}
