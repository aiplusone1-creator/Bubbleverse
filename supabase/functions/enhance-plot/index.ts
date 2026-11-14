import { RequestError, readJson, requestKey, requireUsableProfile, requireReservation, validateEnhanceRequest } from '../_shared/requestValidation.ts';
import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input = validateEnhanceRequest(await readJson(req));
    const idempotencyKey = requestKey(req);
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Please log in to enhance plots' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = claimsData.claims.sub;

    // Check if user is banned
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_banned')
      .eq('user_id', userId)
      .maybeSingle();

    requireUsableProfile(profile, profileError);
    // ===== END AUTHENTICATION CHECK =====

    const { plot, interests } = input;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const { data: reservation, error: reservationError } = await supabase.rpc('reserve_ai_request', {
      p_operation: 'enhance-plot', p_request_key: idempotencyKey,
    });
    requireReservation(reservation, reservationError);

    const interestsText = interests?.length > 0
      ? `The story should incorporate these themes: ${interests.join(', ')}.`
      : '';

    const systemPrompt = `You are a creative children's story plot enhancer. Your task is to take a basic plot idea and transform it into a more engaging, detailed, and imaginative story premise suitable for children.

Guidelines:
- Keep the core idea from the original plot
- Add vivid details and interesting twists
- Make it age-appropriate and magical
- Include clear story arc elements (beginning, challenge, resolution)
- Keep it concise but compelling (2-3 paragraphs max)
- Use simple, engaging language
${interestsText}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(45000),
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please enhance this story plot:\n\n"${plot}"` }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      await response.body?.cancel();
    console.error('Generation operation failed');
      throw new Error(`AI API Error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedPlot = data.choices?.[0]?.message?.content;

    if (!enhancedPlot) {
      throw new Error('No response from AI');
    }


    return new Response(JSON.stringify({ enhancedPlot }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Generation operation failed');
    const errorMessage = error instanceof RequestError ? error.message : 'Plot enhancement failed. Please try again later.';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: error instanceof RequestError ? error.status : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
