/**
 * Bubbleverse Hybrid AI Image Generator
 * Provides production-grade image synthesis for Character Sheets and Story Scenes.
 * 1. Sanitizes and transforms studio prompts into direct, child-likeness-anchored prompts
 *    that prevent stranger/adult generation and enforce Pixar 3D storybook consistency.
 * 2. Attempts Hugging Face FLUX.1 Serverless with automatic 503 model-loading and 429 backoff.
 * 3. Attempts Google Imagen 3 if a Gemini / Google API key is configured.
 * 4. Seamlessly falls back to FLUX.1 / Sana / Turbo via Pollinations.ai (100% free, no credit card required)
 *    with timeouts and multi-tier model fallbacks.
 * 5. Converts all outputs to full-resolution Data URLs and stores them in PhotoVault.
 */

import type { CharacterDna } from '@/features/studio/stage2PromptEngine';

export interface GenerateAiImageOptions {
  prompt: string;
  seed?: number;
  width?: number;
  height?: number;
  dna?: Partial<CharacterDna>;
  aiConfig?: {
    enabled?: boolean;
    apiKey?: string;
    provider?: string;
    model?: string;
  };
}

export interface GenerateAiImageResult {
  dataUrl: string;
  engine: string;
  notice?: string;
}

/**
 * Strips technical studio metadata, KDP frame directions, and administrative tags,
 * translating the prompt into a pure, child-anchored 3D Pixar storybook illustration prompt.
 * Crucially eliminates stranger/adult generation by strictly enforcing child likeness, age,
 * and outfit in the very first tokens of the prompt.
 */
export function transformStudioPromptForImageModel(
  rawPrompt: string,
  dna?: Partial<CharacterDna>
): string {
  if (!rawPrompt || typeof rawPrompt !== 'string') {
    return '';
  }

  const promptText = rawPrompt.trim();

  // 1. Extract core components if studio tags exist
  const actionMatch = promptText.match(/\[ACTION\]:\s*([^\n]+)/i);
  const envMatch = promptText.match(/\[ENVIRONMENT\s*&\s*LIGHTING\]:\s*([^\n]+)/i);
  const charLockMatch = promptText.match(/\[CHARACTER LOCK\]:\s*([^\n]+)/i);

  // If no studio tags are found, clean up any leading headers/markdown and return
  if (!actionMatch && !envMatch && !charLockMatch) {
    return promptText
      .replace(/^(SCENE\s*\d+\/\d+\s*PROMPT[^\n]*\n*)/i, '')
      .replace(/^(Flux\s*Kontext[^\n]*\n*)/i, '')
      .replace(/^(MASTER\s*CHARACTER\s*SHEET[^\n]*\n*)/i, '')
      .trim();
  }

  // 2. Resolve Child Likeness Anchor
  let childName = dna?.childName?.trim() || 'Hero';
  let childAge = dna?.childAge?.trim() || '5-year-old';
  if (/^\d+$/.test(childAge)) {
    childAge = `${childAge}-year-old`;
  }
  const childGender = dna?.childGender === 'girl' ? 'girl' : 'boy';
  let hairAndFeatures = dna?.hairAndFeatures?.trim() || '';
  let signatureOutfit = dna?.signatureOutfit?.trim() || '';

  // If DNA was not explicitly provided, extract from [CHARACTER LOCK] block
  if (charLockMatch) {
    const lockText = charLockMatch[1];

    const ageGenderNameMatch = lockText.match(
      /(\d+-year-old|\d+)\s*(boy|girl)\s+([A-Za-z\u0600-\u06FF]+)/i
    );
    if (ageGenderNameMatch) {
      if (!dna?.childAge) {
        childAge = ageGenderNameMatch[1].includes('-year-old')
          ? ageGenderNameMatch[1]
          : `${ageGenderNameMatch[1]}-year-old`;
      }
      if (!dna?.childName) childName = ageGenderNameMatch[3];
    }

    if (!hairAndFeatures) {
      const featuresMatch = lockText.match(
        /(?:skin tone,\s*|with\s*)([A-Za-z0-9\s,]+?)(?:,\s*wearing|\.\s*Art style|$)/i
      );
      if (featuresMatch) {
        hairAndFeatures = featuresMatch[1].trim();
      }
    }

    if (!signatureOutfit) {
      const outfitMatch = lockText.match(/wearing\s+([^.]+?)(?:\.\s*Art style|$)/i);
      if (outfitMatch) {
        signatureOutfit = outfitMatch[1].trim();
      }
    }
  }

  const action = actionMatch
    ? actionMatch[1].trim()
    : `${childName} exploring a magical storybook moment with joyful wonder.`;

  const environment = envMatch
    ? envMatch[1].trim()
    : 'Dreamy enchanted storybook setting with soft golden volumetric lighting and floating magical sparkles.';

  // Build the clean likeness anchor
  const childDescriptor = `an adorable ${childAge} ${childGender} named ${childName}`;
  const featuresPart = hairAndFeatures
    ? `with ${hairAndFeatures}`
    : 'with cheerful sparkling eyes and warm smile';
  const outfitPart = signatureOutfit ? `, wearing ${signatureOutfit}` : '';

  // Compose the high-potency, distraction-free prompt
  return (
    `3D Pixar Disney style children's storybook illustration of ${childDescriptor} ${featuresPart}${outfitPart}. ` +
    `${action}. ` +
    `${environment}. ` +
    `Vibrant warm colors, soft volumetric cinematic lighting, magical cozy atmosphere, centered 1:1 square composition, 8k render, masterpiece children's book art, ` +
    `no adult, no stranger, no ugly, no deformed, no extra limbs, no watermark, no text, no borders.`
  );
}

/**
 * Attempts to generate an image using Google Imagen 3 on Google AI Studio.
 */
async function callGoogleImagen3(
  apiKey: string,
  prompt: string
): Promise<string | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(
    apiKey
  )}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
        outputOptions: { mimeType: 'image/jpeg' },
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const base64Image =
    data?.predictions?.[0]?.bytesBase64Encoded ||
    data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (base64Image) {
    return `data:image/jpeg;base64,${base64Image}`;
  }

  return null;
}

/**
 * Converts a fetch Response (Blob or ArrayBuffer) into a Base64 data URL.
 * Supports both browser (FileReader) and Node.js environments.
 */
async function responseToDataUrl(response: Response): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to data URL'));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error('Blob read error'));
      reader.readAsDataURL(blob);
    });
  }

  // Node.js runtime fallback
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}

/**
 * Generates an image using Hugging Face Serverless Inference.
 * Free with any Hugging Face token (hf_...).
 * Handles HTTP 503 (model loading with estimated_time) and HTTP 429 (rate-limit backoff) automatically.
 */
async function callHuggingFace(
  token: string,
  prompt: string,
  model = 'black-forest-labs/FLUX.1-schnell',
  maxRetries = 2
): Promise<string | null> {
  const cleanToken = token.trim();
  if (!cleanToken) return null;

  const endpoints = [
    `https://router.huggingface.co/hf-inference/models/${model}`,
    `https://api-inference.huggingface.co/models/${model}`,
  ];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cleanToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              width: 1024,
              height: 1024,
            },
          }),
        });

        // 1. Success
        if (response.ok) {
          return await responseToDataUrl(response);
        }

        // 2. Model is loading (HTTP 503)
        if (response.status === 503) {
          try {
            const errJson = await response.json();
            const waitSec =
              typeof errJson?.estimated_time === 'number'
                ? Math.min(Math.max(errJson.estimated_time, 3), 12)
                : 4;
            await new Promise((r) => setTimeout(r, waitSec * 1000));
            continue;
          } catch {
            await new Promise((r) => setTimeout(r, 4000));
            continue;
          }
        }

        // 3. Rate limited (HTTP 429)
        if (response.status === 429) {
          const backoff = (attempt + 1) * 3500;
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }

        // 4. Endpoint not found -> try secondary endpoint
        if (response.status === 404) {
          continue;
        }
      } catch {
        // Network timeout / transient fetch failure
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  return null;
}

/**
 * Generates an image using Pollinations AI (free, open, high quality).
 * Attempts FLUX first with 35s timeout, then falls back to Sana/Turbo if FLUX rate-limits.
 */
async function callPollinationsFree(
  prompt: string,
  seed?: number,
  width = 1024,
  height = 1024
): Promise<string> {
  const s = seed ?? Math.floor(Math.random() * 1000000);
  const encoded = encodeURIComponent(prompt.trim().slice(0, 950));

  // 1. Try FLUX model first (with 35s timeout)
  try {
    const fluxUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${s}&model=flux&nologo=true`;
    const res = await fetch(fluxUrl, { signal: AbortSignal.timeout(35000) });
    if (res.ok) {
      return await responseToDataUrl(res);
    }
  } catch {
    // Continue to default / sana model
  }

  // 2. Try default / Sana model (unrestricted free with 25s timeout)
  try {
    const defaultUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${s}&nologo=true`;
    const response = await fetch(defaultUrl, { signal: AbortSignal.timeout(25000) });
    if (response.ok) {
      return await responseToDataUrl(response);
    }
  } catch {
    // Continue to turbo model
  }

  // 3. Ultra-fast Turbo model fallback (highest availability)
  try {
    const turboUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${s}&model=turbo&nologo=true`;
    const turboRes = await fetch(turboUrl, { signal: AbortSignal.timeout(20000) });
    if (turboRes.ok) {
      return await responseToDataUrl(turboRes);
    }
  } catch {
    // Exhausted
  }

  throw new Error(
    'سيرفرات التوليد المجانية تشهد ضغطاً مؤقتاً. انتظر دقيقة ثم أعد المحاولة، أو تأكد من تفعيل رمز Hugging Face في صفحة الربط.'
  );
}

/**
 * Main entry point: Generates a real AI illustration with automatic engine fallback
 * and deterministic child likeness enforcement.
 */
export async function generateRealAiImage(
  options: GenerateAiImageOptions
): Promise<GenerateAiImageResult> {
  // Transform raw studio prompt into pure, child-anchored storybook format
  const aiPrompt = transformStudioPromptForImageModel(options.prompt, options.dna);

  const apiKey = options.aiConfig?.apiKey?.trim() || '';
  const provider = options.aiConfig?.provider || '';
  const isAiEnabled = Boolean(options.aiConfig?.enabled);

  // 1. If user supplied a Hugging Face Token (hf_...), use FLUX.1-schnell with auto-retry & backoff
  if (isAiEnabled && (apiKey.startsWith('hf_') || provider === 'huggingface')) {
    try {
      const hfDataUrl = await callHuggingFace(apiKey, aiPrompt);
      if (hfDataUrl) {
        return {
          dataUrl: hfDataUrl,
          engine: 'Hugging Face (FLUX.1)',
          notice: 'تم التوليد بنجاح عبر محرك FLUX.1 من Hugging Face مع تثبيت ملامح البطل.',
        };
      }
    } catch {
      // Fall through to open free engines
    }
  }

  // 2. If user supplied a Google Gemini API Key, try Google Imagen 3
  if (isAiEnabled && apiKey && apiKey.startsWith('AIza')) {
    try {
      const imagenDataUrl = await callGoogleImagen3(apiKey, aiPrompt);
      if (imagenDataUrl) {
        return {
          dataUrl: imagenDataUrl,
          engine: 'Google Imagen 3 (Gemini)',
          notice: 'تم التوليد بنجاح عبر Google Imagen 3 المرتبط بحسابك.',
        };
      }
    } catch {
      // Imagen 3 failed (e.g. 403 billing required on free tier key) — gracefully fall through
    }
  }

  // 3. High-Performance Free AI Engine: Pollinations (FLUX / Sana / Turbo)
  try {
    const freeDataUrl = await callPollinationsFree(
      aiPrompt,
      options.seed,
      options.width || 1024,
      options.height || 1024
    );

    return {
      dataUrl: freeDataUrl,
      engine: 'FLUX / Sana 3D (Free AI)',
      notice: apiKey
        ? 'تم توليد الصورة تلقائياً عبر محرك الرسم الذكي المجاني مع تثبيت ملامح البطل.'
        : 'تم التوليد بنجاح عبر محرك الذكاء الاصطناعي المجاني.',
    };
  } catch (err) {
    throw new Error(
      `تعذر توليد الصورة: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
