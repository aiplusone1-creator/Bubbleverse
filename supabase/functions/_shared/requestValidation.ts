export class RequestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const languageNames: Record<string, string> = {
  ar: 'Arabic', en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', ru: 'Russian', zh: 'Chinese', ja: 'Japanese',
  ko: 'Korean', hi: 'Hindi', tr: 'Turkish', nl: 'Dutch', pl: 'Polish',
  sv: 'Swedish', id: 'Indonesian', th: 'Thai', vi: 'Vietnamese', he: 'Hebrew',
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RequestError('Expected an object');
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, max: number, optional = false): string {
  if (optional && (value === undefined || value === '')) return '';
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new RequestError(`Invalid ${field}`);
  }
  return value.trim();
}

function choice(value: unknown, field: string, options: string[]): string {
  if (typeof value !== 'string' || !options.includes(value)) throw new RequestError(`Invalid ${field}`);
  return value;
}

function interests(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 10) throw new RequestError('Invalid interests');
  return value.map(item => text(item, 'interest', 80));
}

export async function readJson(req: Request, maxBytes = 32768): Promise<unknown> {
  if (req.method !== 'POST') throw new RequestError('Method not allowed', 405);
  if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new RequestError('Expected application/json', 415);
  }
  const length = req.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw new RequestError('Request too large', 413);
  if (!req.body) throw new RequestError('Missing body');
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestError('Request too large', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new RequestError('Invalid JSON'); }
}

export function requestKey(req: Request): string {
  const key = req.headers.get('x-idempotency-key');
  if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    throw new RequestError('A UUID v4 x-idempotency-key is required');
  }
  return key;
}

export function validateStoryRequest(value: unknown) {
  const data = object(value);
  const storyLength = choice(data.storyLength, 'story length', ['short', 'medium', 'epic']);
  const format = choice(data.format, 'format', ['comic', 'storyboard']);
  const artStyle = choice(data.artStyle, 'art style', ['disney', 'pixar', 'watercolor', 'anime', 'realistic', 'comic', 'pastel', 'horror', 'custom']);
  const customArtStyle = text(data.customArtStyle, 'custom art style', 300, artStyle !== 'custom');
  const language = choice(data.language, 'language', Object.keys(languageNames));
  if (!Array.isArray(data.characters) || data.characters.length < 1 || data.characters.length > 6) throw new RequestError('Use 1–6 characters');
  const characters = data.characters.map(item => {
    const character = object(item);
    return {
      name: text(character.name, 'character name', 80),
      role: choice(character.role, 'character role', ['hero', 'parent', 'pet', 'friend']),
    };
  });
  if (!characters.some(c => c.role === 'hero')) throw new RequestError('A hero is required');
  const plotMode = choice(data.plotMode, 'plot mode', ['auto', 'manual']);
  return {
    storyLength, format, artStyle, customArtStyle,
    language: languageNames[language], characters,
    interests: interests(data.interests), plotMode,
    customPlot: text(data.customPlot, 'plot', 3000, plotMode !== 'manual'),
  };
}

export function validateEnhanceRequest(value: unknown) {
  const data = object(value);
  return { plot: text(data.plot, 'plot', 3000), interests: interests(data.interests ?? []) };
}

export function requireUsableProfile(profile: { is_banned: boolean | null } | null, error: unknown) {
  if (error || !profile || typeof profile.is_banned !== 'boolean') {
    throw new RequestError('Unable to verify account access', 503);
  }
  if (profile.is_banned) throw new RequestError('Your account has been suspended', 403);
}

export function requireReservation(result: unknown, error: unknown) {
  if (error) throw new RequestError('Unable to reserve generation quota', 503);
  if (result === 'disabled') throw new RequestError('Generation is temporarily paused', 503);
  if (result === 'duplicate') throw new RequestError('This request has already been submitted', 409);
  if (result === 'limited') throw new RequestError('Generation limit reached. Please try again tomorrow.', 429);
  if (result !== 'reserved') throw new RequestError('Unable to reserve generation quota', 503);
}

export function validateStoryPages(value: unknown, expectedCount: number) {
  if (!Array.isArray(value) || value.length !== expectedCount) throw new RequestError('Invalid generated page count', 502);
  return value.map((item, index) => {
    const page = object(item);
    if (page.pageNumber !== index + 1) throw new RequestError('Invalid generated page order', 502);
    return {
      pageNumber: index + 1,
      sceneDescription: text(page.sceneDescription, 'generated scene', 6000),
      dialogueText: text(page.dialogueText, 'generated text', 4000),
      panelLayoutType: choice(page.panelLayoutType, 'generated layout', ['single', 'two-panel', 'three-panel', 'action-splash']),
    };
  });
}
