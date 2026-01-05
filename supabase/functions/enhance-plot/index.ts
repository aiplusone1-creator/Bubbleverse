import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
