import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
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
    
    if (claimsError || !claimsData?.claims) {
      console.log('Invalid token or claims:', claimsError);
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid session' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    // Check if user is banned
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_banned')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile?.is_banned) {
      console.log('Banned user attempted to enhance plot:', userId);
      return new Response(JSON.stringify({ error: 'Your account has been suspended' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    // ===== END AUTHENTICATION CHECK =====

    const { plot, interests } = await req.json();
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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
      const errorText = await response.text();
      console.error('AI API Error:', errorText);
      throw new Error(`AI API Error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedPlot = data.choices?.[0]?.message?.content;

    if (!enhancedPlot) {
      throw new Error('No response from AI');
    }

    console.log('Plot enhanced successfully for user:', userId);

    return new Response(JSON.stringify({ enhancedPlot }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in enhance-plot function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
