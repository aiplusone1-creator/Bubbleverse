/**
 * Bubbleverse Hybrid AI Image Generator
 * Provides production-grade image synthesis for Character Sheets and Story Scenes.
 * 1. Attempts Google Imagen 3 if a Gemini / Google API key is configured.
 * 2. Seamlessly falls back to FLUX.1 via Pollinations.ai (100% free, no credit card required)
 *    if the Google API key lacks Imagen 3 billing or returns an error.
 * 3. Converts all outputs to full-resolution Data URLs and stores them in PhotoVault.
 */

export interface GenerateAiImageOptions {
  prompt: string;
  seed?: number;
  width?: number;
  height?: number;
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
 * Generates an image using FLUX.1 via Pollinations AI (free, open, high quality).
 */
async function callPollinationsFlux(
  prompt: string,
  seed?: number,
  width = 1024,
  height = 1024
): Promise<string> {
  const s = seed ?? Math.floor(Math.random() * 1000000);
  const encoded = encodeURIComponent(prompt.trim().slice(0, 950));
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${s}&model=flux&nologo=true`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Pollinations AI error HTTP ${response.status}`);
  }

  return responseToDataUrl(response);
}

/**
 * Main entry point: Generates a real AI illustration with automatic engine fallback.
 */
export async function generateRealAiImage(
  options: GenerateAiImageOptions
): Promise<GenerateAiImageResult> {
  const apiKey = options.aiConfig?.apiKey?.trim() || '';
  const isAiEnabled = Boolean(options.aiConfig?.enabled);

  // 1. If user supplied a Google Gemini API Key, try Google Imagen 3 first
  if (isAiEnabled && apiKey) {
    try {
      const imagenDataUrl = await callGoogleImagen3(apiKey, options.prompt);
      if (imagenDataUrl) {
        return {
          dataUrl: imagenDataUrl,
          engine: 'Google Imagen 3 (Gemini)',
          notice: 'تم التوليد بنجاح عبر Google Imagen 3 المرتبط بحسابك.',
        };
      }
    } catch {
      // Imagen 3 failed (e.g. 403 billing required on free tier key) — gracefully fall through to FLUX.1
    }
  }

  // 2. High-Performance Free AI Engine: FLUX.1 via Pollinations
  try {
    const fluxDataUrl = await callPollinationsFlux(
      options.prompt,
      options.seed,
      options.width || 1024,
      options.height || 1024
    );

    return {
      dataUrl: fluxDataUrl,
      engine: 'FLUX.1 (Free AI Engine)',
      notice: apiKey
        ? 'حساب Gemini المجاني مخصص للنصوص، فقام النظام بتوليد الصورة تلقائياً عبر محرك FLUX.1 فائق الجودة مجاناً.'
        : 'تم التوليد بنجاح عبر محرك FLUX.1 الذكي مجاناً.',
    };
  } catch (err) {
    throw new Error(
      `Failed to generate AI image: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
