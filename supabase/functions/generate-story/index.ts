import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StoryRequest {
  storyLength: string;
  format: string;
  artStyle: string;
  customArtStyle?: string;
  language: string; // Added language parameter
  characters: Array<{ name: string; role: string }>;
  interests: string[];
  plotMode: 'auto' | 'manual';
  customPlot?: string;
}

interface StoryPage {
  pageNumber: number;
  sceneDescription: string;
  dialogueText: string;
  panelLayoutType: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Missing or invalid Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized - Please log in to generate stories' }), { 
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
      console.log('Banned user attempted to generate story:', userId);
      return new Response(JSON.stringify({ error: 'Your account has been suspended' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    // ===== END AUTHENTICATION CHECK =====

    const { storyLength, format, artStyle, customArtStyle, language, characters, interests, plotMode, customPlot } = await req.json() as StoryRequest;
    
    // Resolve the final art style (use custom if provided)
    const finalArtStyle = artStyle === 'custom' && customArtStyle ? customArtStyle : artStyle;
    
    // Resolve the language (default to English)
    const storyLanguage = language || 'English';
    
    console.log('Generating story with config:', { storyLength, format, artStyle: finalArtStyle, language: storyLanguage, characters, interests, plotMode });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Determine page count based on story length
    const pageRanges: Record<string, { min: number; max: number }> = {
      short: { min: 8, max: 10 },
      medium: { min: 12, max: 18 },
      epic: { min: 18, max: 25 },
    };
    const range = pageRanges[storyLength] || pageRanges.medium;
    const pageCount = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

    // Build character descriptions with names emphasized
    const heroCharacter = characters.find(c => c.role === 'hero') || characters[0];
    const heroName = heroCharacter?.name || 'A brave young hero';
    const characterDescriptions = characters.map(c => `${c.name} (${c.role})`).join(', ');
    const interestsList = interests.length > 0 ? interests.join(', ') : 'adventure, friendship, discovery';
    
    // ===== CRITICAL: STRICT LANGUAGE ENFORCEMENT =====
    const systemPrompt = `You are a professional children's book author writing EXCLUSIVELY in **${storyLanguage}**.

**CRITICAL LANGUAGE RULE:** You MUST write the ENTIRE story text, ALL dialogue, and ALL narrative strictly in **${storyLanguage}**. 
${storyLanguage !== 'English' ? `Do NOT use English at all. Every single word of the story content must be in ${storyLanguage}.` : ''}

Your stories are:
- Age-appropriate and positive for children aged 4-10
- Full of wonder and adventure
- Include clear moral lessons subtly woven in
- Feature vivid, imaginative scenes perfect for illustration

**CHARACTER INTEGRATION RULE:** The main hero's name is "${heroName}". You MUST:
- Use the name "${heroName}" frequently throughout the story (at least once per page)
- Make "${heroName}" the central character in every scene
- Have other characters address "${heroName}" by name in dialogue

**INTERESTS INTEGRATION RULE:** The story MUST prominently feature these interests: ${interestsList}
- Weave these interests naturally into the plot as central themes
- Create scenes that directly involve these interests
- Make the interests part of the adventure/problem-solving

**ART STYLE:** All scene descriptions must be written for "${finalArtStyle}" art style.
- Include "${finalArtStyle}" visual elements in every scene description
- Describe scenes in a way that matches this specific art style

You will generate a complete story with exactly ${pageCount} pages. Each page should have:
1. A scene description for the illustrator (detailed visual description in ${finalArtStyle} style)
2. Dialogue or narrative text to appear on the page (IN ${storyLanguage} ONLY)
3. A panel layout type (for comics: "single", "two-panel", "three-panel", "action-splash")

Format your response as a JSON array of pages.`;

    // ===== STRUCTURED USER PROMPT WITH EXPLICIT DATA =====
    const structuredData = `
===== STORY CONFIGURATION =====
Hero Name: ${heroName}
All Characters: ${characterDescriptions || heroName}
Hero Interests: ${interestsList}
Art Style: ${finalArtStyle}
Story Format: ${format === 'comic' ? 'comic book' : 'storybook'}
Story Language: ${storyLanguage}
Number of Pages: ${pageCount}
${plotMode === 'manual' && customPlot ? `Story Theme/Plot: ${customPlot}` : ''}
================================`;

    const userPrompt = plotMode === 'manual' && customPlot
      ? `${structuredData}

Create a ${pageCount}-page ${format === 'comic' ? 'comic book' : 'storybook'} story.

**MANDATORY REQUIREMENTS:**
1. Write ALL text and dialogue in ${storyLanguage} ONLY
2. The hero "${heroName}" must be named and featured on EVERY page
3. The custom plot "${customPlot}" must be the main storyline
4. Scene descriptions must specify "${finalArtStyle}" art style elements

Return ONLY a JSON array with this structure:
[
  {
    "pageNumber": 1,
    "sceneDescription": "Detailed visual description for ${finalArtStyle} style illustration, featuring ${heroName}...",
    "dialogueText": "The text/dialogue in ${storyLanguage}...",
    "panelLayoutType": "single"
  }
]`
      : `${structuredData}

Create a ${pageCount}-page ${format === 'comic' ? 'comic book' : 'storybook'} story.

**MANDATORY REQUIREMENTS:**
1. Write ALL text and dialogue in ${storyLanguage} ONLY
2. The hero "${heroName}" must be named and featured on EVERY page
3. The interests "${interestsList}" must be central themes in the plot
4. Scene descriptions must specify "${finalArtStyle}" art style elements

Incorporate the child's name "${heroName}" and their specific interests "${interestsList}" directly into the plot as core elements.

Return ONLY a JSON array with this structure:
[
  {
    "pageNumber": 1,
    "sceneDescription": "Detailed visual description for ${finalArtStyle} style illustration, featuring ${heroName}...",
    "dialogueText": "The text/dialogue in ${storyLanguage}...",
    "panelLayoutType": "single"
  }
]`;

    console.log('Calling Lovable AI for story generation...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response received');

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON from the response
    let pages: StoryPage[];
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        pages = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw content:', content);
      throw new Error('Failed to parse story content');
    }

    // Generate a title from the first page - IN THE SAME LANGUAGE
    const titleResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { 
            role: 'user', 
            content: `Based on this story's first page, generate a short, catchy title (max 6 words) in ${storyLanguage}.

IMPORTANT: The title MUST be written in ${storyLanguage} language only.
            
Scene: ${pages[0]?.sceneDescription}
Text: ${pages[0]?.dialogueText}

Respond with ONLY the title in ${storyLanguage}, no quotes or explanation.`
          }
        ],
      }),
    });

    let title = storyLanguage === 'Arabic' ? 'مغامرتي السحرية' : 'My Magical Adventure';
    if (titleResponse.ok) {
      const titleData = await titleResponse.json();
      const generatedTitle = titleData.choices?.[0]?.message?.content?.trim();
      if (generatedTitle) {
        title = generatedTitle.replace(/['"]/g, '').slice(0, 50);
      }
    }

    console.log('Story generated successfully:', { title, pageCount: pages.length, userId });

    return new Response(JSON.stringify({ 
      success: true,
      title,
      pages,
      config: {
        storyLength,
        format,
        artStyle,
        pageCount: pages.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-story function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
