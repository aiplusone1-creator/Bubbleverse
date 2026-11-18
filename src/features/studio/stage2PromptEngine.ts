/**
 * Bubbleverse Stage 2 Prompt Architecture & Studio Production Engine
 * Implements the Playbook Hybrid AI Pipeline (Nano Banana / Gemini + Midjourney + Flux)
 * calibrated for Amazon KDP 8.5" x 8.5" (300 DPI, 2588 x 2625 px full bleed).
 */

export type PromptEngineMode = 'nano_banana' | 'midjourney' | 'flux';

export interface CharacterDna {
  childName: string;
  childAge: string;
  childGender: 'boy' | 'girl';
  hairAndFeatures: string;
  signatureOutfit: string;
  artStyle: string;
  midjourneyCrefUrl?: string;
}

export interface StudioProductionChecklist {
  photoApproved: boolean;
  characterSheetLocked: boolean;
  artCompleted: boolean;
  whatsappDraftSent: boolean;
  parentApproved: boolean;
  kdpPdfExported: boolean;
}

export interface PrintResolutionCheck {
  width: number;
  height: number;
  status: 'print_300dpi' | 'upscale_recommended' | 'low_res';
  labelAr: string;
  labelEn: string;
}

export interface Stage2SceneInput {
  pageNumber: number;
  totalPages: number;
  action: string;
  environment: string;
  storyText?: string;
}

export interface Stage2StoryBeatPage {
  pageNumber: number;
  text: string;
  action: string;
  environment: string;
  imagePrompt: string;
  imageUrl: string;
  suggestedFileName: string;
}

export interface ProductionPromptPackOptions {
  storyTitle: string;
  orderReference?: string;
  storyLang: 'ar' | 'en';
  dna: CharacterDna;
  engine: PromptEngineMode;
  pages: Array<{
    pageNumber: number;
    text: string;
    imagePrompt: string;
  }>;
}

export interface WhatsAppHelperOptions {
  customerName: string;
  childName: string;
  reference: string;
  trackingUrl: string;
  phone: string;
  country: 'EG' | 'SA' | 'AE';
}

export interface WhatsAppHelperMessage {
  textAr: string;
  textEn: string;
  urlAr: string;
  urlEn: string;
  text: string;
  url: string;
}

export interface WhatsAppHelperBundle {
  normalizedPhone: string;
  requestClearerPhoto: WhatsAppHelperMessage;
  sendDraftForApproval: WhatsAppHelperMessage;
  confirmPrintingStarted: WhatsAppHelperMessage;
}

export interface AiIntegrationSettings {
  provider: 'gemini' | 'nano_banana' | 'openai' | 'flux' | 'custom';
  enabled: boolean;
  apiKey: string;
  model: string;
  customEndpoint?: string;
}

export interface EnhanceStoryWithAiOptions {
  aiConfig: AiIntegrationSettings;
  dna: CharacterDna;
  storyTitle: string;
  storyLang: 'ar' | 'en';
  pageCount: number;
  engine: PromptEngineMode;
  existingPages?: Array<{ pageNumber: number; text: string; imageUrl?: string }>;
  timeoutMs?: number;
  fetcher?: typeof fetch;
}

export interface EnhanceStoryWithAiResult {
  pages: Stage2StoryBeatPage[];
  source: 'ai' | 'local';
  notice?: string;
}

export const DEFAULT_PRODUCTION_CHECKLIST: StudioProductionChecklist = {
  photoApproved: false,
  characterSheetLocked: false,
  artCompleted: false,
  whatsappDraftSent: false,
  parentApproved: false,
  kdpPdfExported: false,
};

export const DEFAULT_STORY_FALLBACK_IMAGES: readonly string[] = [
  '/showcase/career/career-astronaut.jpg',
  '/bubble-books/space.webp',
  '/bubble-books/jungle.webp',
  '/bubble-books/ocean.webp',
  '/catalog/bedtime-magic.jpg',
  '/catalog/dinosaur-valley.jpg',
];

const KDP_COMPOSITION_DIRECTIVE =
  "Keep the child's face and important details strictly inside the center 75% safe zone (away from 0.375\" KDP 8.5\"×8.5\" trim edges). Leave softer darker space near the bottom 25% for storybook text card.";

const STAGE2_NEGATIVE_DIRECTIVE =
  'No text, no letters, no speech bubbles, no watermark, no borders, no cropped head, no extra fingers.';

const MIDJOURNEY_CREF_PLACEHOLDER = '[CharacterSheetURL]';

export function createDefaultProductionChecklist(
  overrides?: Partial<StudioProductionChecklist>
): StudioProductionChecklist {
  return {
    ...DEFAULT_PRODUCTION_CHECKLIST,
    ...(overrides ?? {}),
  };
}

export function countChecklistCompleted(
  checklist?: Partial<StudioProductionChecklist>
): { completed: number; total: number } {
  const keys: Array<keyof StudioProductionChecklist> = [
    'photoApproved',
    'characterSheetLocked',
    'artCompleted',
    'whatsappDraftSent',
    'parentApproved',
    'kdpPdfExported',
  ];
  const completed = keys.reduce((acc, key) => (checklist?.[key] ? acc + 1 : acc), 0);
  return { completed, total: keys.length };
}

export function createDefaultCharacterDna(overrides?: Partial<CharacterDna>): CharacterDna {
  return {
    childName: 'آدم',
    childAge: '5',
    childGender: 'boy',
    hairAndFeatures: 'curly dark hair, expressive warm eyes, natural joyful smile',
    signatureOutfit: 'turquoise-and-navy junior explorer jacket with star patches and blue sneakers',
    artStyle: '3D Pixar Storybook, rich pastel lighting, expressive character features',
    midjourneyCrefUrl: '',
    ...(overrides ?? {}),
  };
}

function normalizeAgeDescriptor(rawAge: string): string {
  const trimmed = rawAge.trim();
  if (!trimmed) return '5-year-old';
  const digitMatch = trimmed.match(/\d+/);
  if (digitMatch) {
    return `${digitMatch[0]}-year-old`;
  }
  return trimmed;
}

function normalizeCharacterDna(dna: CharacterDna): {
  childName: string;
  ageDescriptor: string;
  genderWord: 'boy' | 'girl';
  hairAndFeatures: string;
  signatureOutfit: string;
  artStyle: string;
  midjourneyCrefUrl: string;
} {
  return {
    childName: dna.childName.trim() || 'Hero',
    ageDescriptor: normalizeAgeDescriptor(dna.childAge),
    genderWord: dna.childGender === 'girl' ? 'girl' : 'boy',
    hairAndFeatures:
      dna.hairAndFeatures.trim() || 'natural hair, warm eyes, and cheerful smile',
    signatureOutfit:
      dna.signatureOutfit.trim() ||
      'turquoise-and-navy storybook adventure jacket with star patches and sneakers',
    artStyle:
      dna.artStyle.trim() ||
      "3D Pixar-style children's storybook, soft warm cinematic lighting",
    midjourneyCrefUrl: dna.midjourneyCrefUrl?.trim() || '',
  };
}

function formatPaddedNumber(value: number): string {
  return String(Math.max(1, Math.floor(value))).padStart(2, '0');
}

export function buildMasterCharacterSheetPrompt(
  dna: CharacterDna,
  engine: PromptEngineMode
): string {
  const norm = normalizeCharacterDna(dna);
  const corePrompt =
    `Create a clean ${norm.artStyle} children's storybook character turnaround sheet of the child in the uploaded reference photos (${norm.ageDescriptor} ${norm.genderWord} ${norm.childName}). ` +
    `Keep exact facial structure, eye shape, skin tone, smile, and ${norm.hairAndFeatures} faithfully consistent. ` +
    `Show 3 poses side-by-side on a soft neutral cream studio background: ` +
    `(1) front facing smiling, (2) 3/4 view holding a glowing bubble, (3) happy excited expression. ` +
    `Wearing ${norm.signatureOutfit}. ` +
    `Soft warm cinematic lighting, crisp details, 1:1 square aspect ratio, no text, no watermark.`;

  if (engine === 'midjourney') {
    return (
      `MASTER CHARACTER SHEET PROMPT (Midjourney — Aspect Ratio 1:1):\n` +
      `${corePrompt} --ar 1:1 --stylize 150 --no text watermark`
    );
  }

  if (engine === 'flux') {
    return (
      `MASTER CHARACTER SHEET PROMPT (Flux Kontext / PuLID Face Lock — Aspect Ratio 1:1):\n` +
      `Flux Kontext / PuLID Face Lock reference — ${corePrompt}`
    );
  }

  return (
    `MASTER CHARACTER SHEET PROMPT (Nano Banana / Gemini — Aspect Ratio 1:1):\n` +
    corePrompt
  );
}

export function buildStage2ScenePrompt(
  dna: CharacterDna,
  scene: Stage2SceneInput,
  engine: PromptEngineMode
): string {
  const norm = normalizeCharacterDna(dna);
  const pageNum = formatPaddedNumber(scene.pageNumber);
  const totalNum = formatPaddedNumber(scene.totalPages);
  const action =
    scene.action.trim() ||
    `Exploring a wondrous storybook moment with joyful curiosity, reaching toward a glowing cyan soap bubble.`;
  const environment =
    scene.environment.trim() ||
    `Dreamy magical storybook scenery with warm volumetric lighting, pastel sky clouds, and golden sparkles.`;

  const blocks = [
    `[CHARACTER LOCK]: Exact same ${norm.ageDescriptor} ${norm.genderWord} ${norm.childName} from the attached master character sheet and uploaded reference photos — same exact facial structure, eye shape, skin tone, ${norm.hairAndFeatures}, wearing ${norm.signatureOutfit}. Art style: ${norm.artStyle}.`,
    `[ACTION]: ${action}`,
    `[ENVIRONMENT & LIGHTING]: ${environment}`,
    `[COMPOSITION]: ${KDP_COMPOSITION_DIRECTIVE}`,
    `[NEGATIVE]: ${STAGE2_NEGATIVE_DIRECTIVE}`,
  ];

  if (engine === 'midjourney') {
    const crefTarget = norm.midjourneyCrefUrl || MIDJOURNEY_CREF_PLACEHOLDER;
    return [
      `SCENE ${pageNum}/${totalNum} PROMPT (Midjourney — 1:1 Square Full-Bleed KDP 8.5"×8.5" Print Safe):`,
      ...blocks,
      `--cref ${crefTarget} --cw 85 --ar 1:1 --no text watermark border`,
    ].join('\n');
  }

  if (engine === 'flux') {
    return [
      `SCENE ${pageNum}/${totalNum} PROMPT (Flux Kontext / PuLID — 1:1 Square Full-Bleed KDP 8.5"×8.5" Print Safe):`,
      `Flux Kontext / PuLID Face Lock reference — 1:1 square full-bleed illustration (2588×2625 px 300 DPI target).`,
      ...blocks,
    ].join('\n');
  }

  return [
    `SCENE ${pageNum}/${totalNum} PROMPT (Nano Banana / Gemini — 1:1 Square Full-Bleed KDP 8.5"×8.5" Print Safe):`,
    ...blocks,
  ].join('\n');
}

interface StoryBeatTemplate {
  arBoy: (name: string, theme: string) => string;
  arGirl: (name: string, theme: string) => string;
  en: (name: string, theme: string) => string;
  action: (name: string) => string;
  environment: (theme: string) => string;
}

const STORY_ARC_24_BEATS: readonly StoryBeatTemplate[] = [
  {
    arBoy: (n, t) =>
      `في صباح دافئ تتسلل فيه خيوط الشمس الذهبية، استيقظ البطل ${n} بابتسامة مشرقة، وشعر أن اليوم يحمل بداية حكاية «${t}».`,
    arGirl: (n, t) =>
      `في صباح دافئ تتسلل فيه خيوط الشمس الذهبية، استيقظت البطلة ${n} بابتسامة مشرقة، وشعرت أن اليوم يحمل بداية حكاية «${t}».`,
    en: (n, t) =>
      `On a warm morning streaked with golden sunlight, ${n} woke up with a bright smile, sensing that "${t}" was about to begin.`,
    action: (n) =>
      `${n} sitting happily by a sunlit bedroom window, stretching with wide curious eyes as a tiny glowing cyan bubble floats nearby.`,
    environment: (t) =>
      `Cozy storybook bedroom bathed in golden morning sunbeams, floating dust motes, subtle visual hints of "${t}", warm cinematic lighting.`,
  },
  {
    arBoy: (n) =>
      `نظر ${n} نحو النافذة المفتوحة، فشاهد فقاعة كبيرة تتلألأ بألوان قوس قزح وتدور بخفة وكأنها تدعوه إلى عالم من الخيال.`,
    arGirl: (n) =>
      `نظرت ${n} نحو النافذة المفتوحة، فشاهدت فقاعة كبيرة تتلألأ بألوان قوس قزح وتدور بخفة وكأنها تدعوها إلى عالم من الخيال.`,
    en: (n) =>
      `Peeking toward the open window, ${n} spotted a shimmering iridescent bubble drifting gently, inviting them into a world of wonder.`,
    action: (n) =>
      `${n} leaning playfully toward an iridescent rainbow soap bubble hovering just above the windowsill, reaching out with wonder.`,
    environment: (t) =>
      `Soft pastel morning sky outside the window, shimmering bubble reflections previewing "${t}", gentle golden-hour glow.`,
  },
  {
    arBoy: (n) =>
      `ارتدى ${n} ملابسه المفضلة للمغامرة، وربط حذاءه بحماس وثقة، ثم قال بصوت شجاع: أنا مستعد لاكتشاف ما وراء الفقاعة!`,
    arGirl: (n) =>
      `ارتدت ${n} ملابسها المفضلة للمغامرة، وربطت حذاءها بحماس وثقة، ثم قالت بصوت شجاع: أنا مستعدة لاكتشاف ما وراء الفقاعة!`,
    en: (n) =>
      `${n} put on their favorite adventure outfit, laced up their shoes with confidence, and declared bravely: "I am ready to explore!"`,
    action: (n) =>
      `${n} standing proudly at the doorstep in their signature outfit, hands on hips with an excited confident grin as sparkles swirl around.`,
    environment: (t) =>
      `Enchanted garden pathway at sunrise, glowing petals and shimmering mist leading into the world of "${t}", soft volumetric light.`,
  },
  {
    arBoy: (n, t) =>
      `وما إن لمس ${n} الفقاعة اللامعة بأطراف أصابعه، حتى انفتحت بوابة مضيئة نقلته في لحظة ساحرة إلى قلب «${t}».`,
    arGirl: (n, t) =>
      `وما إن لمست ${n} الفقاعة اللامعة بأطراف أصابعها، حتى انفتحت بوابة مضيئة نقلتها في لحظة ساحرة إلى قلب «${t}».`,
    en: (n, t) =>
      `The moment ${n} gently touched the shimmering bubble, a swirling portal of starlight opened straight into the heart of "${t}".`,
    action: (n) =>
      `${n} stepping joyfully through a luminous giant soap-bubble portal with arms outstretched and sparkling eyes.`,
    environment: (t) =>
      `Breathtaking panoramic entrance to "${t}", swirling pastel nebula light, floating cyan bubbles, magical Pixar volumetric illumination.`,
  },
  {
    arBoy: (n) =>
      `عند البوابة المضيئة، رحّب بـ ${n} رفيق لطيف يضيء مثل نجمة صغيرة، وقدّم له خريطة سحرية مرسومة بخيوط النور.`,
    arGirl: (n) =>
      `عند البوابة المضيئة، رحّب بـ ${n} رفيق لطيف يضيء مثل نجمة صغيرة، وقدّم لها خريطة سحرية مرسومة بخيوط النور.`,
    en: (n) =>
      `Just beyond the glowing archway, a friendly little star-lit companion greeted ${n} and offered a map drawn in shimmering light.`,
    action: (n) =>
      `${n} kneeling warmly to greet a tiny adorable glowing firefly creature holding a miniature luminous star map.`,
    environment: (t) =>
      `Dreamy clearing inside "${t}" filled with soft glowing blossoms, twilight turquoise and lavender hues, cozy magical depth.`,
  },
  {
    arBoy: (n) =>
      `تقدّم ${n} بخطوات رشيقة فوق جسر من البلورات الملونة، وكل خطوة كانت تصدر نغمة موسيقية ناعمة تملأ المكان بهجة.`,
    arGirl: (n) =>
      `تقدّمت ${n} بخطوات رشيقة فوق جسر من البلورات الملونة، وكل خطوة كانت تصدر نغمة موسيقية ناعمة تملأ المكان بهجة.`,
    en: (n) =>
      `${n} stepped gracefully across a bridge of luminous crystal stones, each footstep chiming with a soft joyful melody.`,
    action: (n) =>
      `${n} balancing playfully with arms wide while walking across glowing rainbow crystal stepping stones, laughing happily.`,
    environment: (t) =>
      `Sparkling crystal bridge arching over a dreamy valley in "${t}", pastel mist below, warm glowing reflections and magical notes of light.`,
  },
  {
    arBoy: (n) =>
      `وصل ${n} إلى حديقة الفوانيس الطائرة، حيث تسبح أضواء دافئة في الهواء كأنها أحلام صغيرة تنتظر من يبتسم لها.`,
    arGirl: (n) =>
      `وصلت ${n} إلى حديقة الفوانيس الطائرة، حيث تسبح أضواء دافئة في الهواء كأنها أحلام صغيرة تنتظر من يبتسم لها.`,
    en: (n) =>
      `Soon ${n} arrived at the Garden of Floating Lanterns, where warm glowing orbs drifted like gentle wishes across the sky.`,
    action: (n) =>
      `${n} gazing upward in awe, gently cradling a warm golden floating lantern bubble between both hands.`,
    environment: (t) =>
      `Lush enchanted lantern garden themed around "${t}", dozens of warm amber and cyan floating orbs, deep twilight sky in the lower frame.`,
  },
  {
    arBoy: (n) =>
      `فجأة، سمع ${n} صوتاً خافتاً خلف شجرة متلألئة؛ كان هناك صديق صغير تاه عن بيته ويبحث عن يدٍ حنونة تساعده.`,
    arGirl: (n) =>
      `فجأة، سمعت ${n} صوتاً خافتاً خلف شجرة متلألئة؛ كان هناك صديق صغير تاه عن بيته ويبحث عن يدٍ حنونة تساعده.`,
    en: (n) =>
      `Suddenly, ${n} heard a soft whimper behind a shimmering tree—a tiny lost creature hoping for a kind friend to help it home.`,
    action: (n) =>
      `${n} peeking gently around a glowing storybook tree with an empathetic caring expression, spotting a shy little fluffy cloud-cub.`,
    environment: (t) =>
      `Quiet glowing grove in "${t}", soft moonlight filtering through iridescent leaves, gentle blue-violet shadow atmosphere.`,
  },
  {
    arBoy: (n) =>
      `جلس ${n} بلطف بجانب الصديق الصغير ومسح حزنه بابتسامة دافئة، ووعده أن يسيرا معاً حتى يجدا الطريق الصحيح.`,
    arGirl: (n) =>
      `جلست ${n} بلطف بجانب الصديق الصغير ومسحت حزنه بابتسامة دافئة، ووعدته أن يسيرا معاً حتى يجدا الطريق الصحيح.`,
    en: (n) =>
      `${n} knelt kindly beside the little friend, sharing a reassuring smile and promising to travel together until they found the way home.`,
    action: (n) =>
      `${n} offering a gentle comforting hand to the tiny fluffy companion while showing the glowing map together.`,
    environment: (t) =>
      `Warm sheltered meadow in "${t}" lit by golden fireflies and soft lantern glow, heartwarming intimate storybook framing.`,
  },
  {
    arBoy: (n) =>
      `أمام بوابة الألغاز المغنّية، توقّف ${n} ليفكّر بهدوء وذكاء، متأملاً الرموز المضيئة المنقوشة على القوس الحجري.`,
    arGirl: (n) =>
      `أمام بوابة الألغاز المغنّية، توقّفت ${n} لتفكّر بهدوء وذكاء، متأملةً الرموز المضيئة المنقوشة على القوس الحجري.`,
    en: (n) =>
      `Before the Singing Riddle Archway, ${n} paused thoughtfully, studying the glowing star symbols carved along the ancient stones.`,
    action: (n) =>
      `${n} holding a finger thoughtfully to their chin while examining glowing geometric star tiles on a magical storybook archway.`,
    environment: (t) =>
      `Majestic enchanted archway in "${t}" adorned with glowing cyan runes and soft swirling stardust, rich dramatic backlight.`,
  },
  {
    arBoy: (n) =>
      `بفكرة عبقرية، لمس ${n} الأجراس المضيئة بالترتيب الصحيح، فعزفت البوابة لحناً عذباً وانفتحت ببطء أمامهما.`,
    arGirl: (n) =>
      `بفكرة عبقرية، لمست ${n} الأجراس المضيئة بالترتيب الصحيح، فعزفت البوابة لحناً عذباً وانفتحت ببطء أمامهما.`,
    en: (n) =>
      `With a clever spark of insight, ${n} tapped the glowing chimes in harmony, and the archway swung open with a joyful chord.`,
    action: (n) =>
      `${n} touching a shimmering crystal chime as ripples of golden and turquoise musical light burst forth and unlock the gate.`,
    environment: (t) =>
      `Opening enchanted portal revealing deeper wonders of "${t}", radiant beams of warm light contrasting with soft darker foreground.`,
  },
  {
    arBoy: (n) =>
      `حلّق ${n} بسعادة وسط غيوم ناعمة كالقطن، ترافقه فقاعات زرقاء متوهجة تعكس ضحكاته الصافية في السماء الواسعة.`,
    arGirl: (n) =>
      `حلّقت ${n} بسعادة وسط غيوم ناعمة كالقطن، ترافقها فقاعات زرقاء متوهجة تعكس ضحكاتها الصافية في السماء الواسعة.`,
    en: (n) =>
      `${n} floated joyfully among cotton-soft pastel clouds, reaching out toward shimmering cyan bubbles dancing across the sky.`,
    action: (n) =>
      `${n} floating joyfully beside a friendly glowing sky-cloud, reaching happily toward a shimmering cyan soap bubble.`,
    environment: (t) =>
      `Dreamy pastel skyscape inside "${t}" with cotton nebula clouds, golden stardust, and soft Pixar volumetric lighting.`,
  },
  {
    arBoy: (n) =>
      `عندما ظهر ضباب فضي كثيف في الطريق، أمسك ${n} بالخريطة المضيئة بثبات وأرشد صديقه بخطوات واثقة دون خوف.`,
    arGirl: (n) =>
      `عندما ظهر ضباب فضي كثيف في الطريق، أمسكت ${n} بالخريطة المضيئة بثبات وأرشدت صديقها بخطوات واثقة دون خوف.`,
    en: (n) =>
      `When silvery mist swirled across the trail, ${n} held up the glowing star map steadily and guided their friend without fear.`,
    action: (n) =>
      `${n} holding the radiant star map aloft like a compass, leading the little companion bravely through glowing silver mist.`,
    environment: (t) =>
      `Mysterious silver-blue misty labyrinth in "${t}", warm golden map glow illuminating the path ahead, soft cinematic fog.`,
  },
  {
    arBoy: (n) =>
      `داخل كهف الكريستال الهادئ، أطلق ${n} فقاعة نور دافئة فتلألأت الجدران بألف لون مذهل أضاء قلبيهما بالفرح.`,
    arGirl: (n) =>
      `داخل كهف الكريستال الهادئ، أطلقت ${n} فقاعة نور دافئة فتلألأت الجدران بألف لون مذهل أضاء قلبيهما بالفرح.`,
    en: (n) =>
      `Inside the quiet Crystal Cavern, ${n} released a warm glowing bubble that painted every sparkling wall with dazzling rainbow light.`,
    action: (n) =>
      `${n} lifting a glowing golden bubble upward as prismatic crystal reflections dance across their delighted face.`,
    environment: (t) =>
      `Awe-inspiring crystal cavern themed to "${t}", glowing amethyst and aqua crystal formations, rich deep shadows below for text contrast.`,
  },
  {
    arBoy: (n) =>
      `ركب ${n} وصديقه قارباً خشبياً صغيراً فوق نهر النجوم الساكن، حيث تتلألأ انعكاسات السماء تحت المجاديف بلطف.`,
    arGirl: (n) =>
      `ركبت ${n} وصديقها قارباً خشبياً صغيراً فوق نهر النجوم الساكن، حيث تتلألأ انعكاسات السماء تحت المجاديف بلطف.`,
    en: (n) =>
      `${n} and their little friend sailed a cozy leaf-shaped boat across the River of Starlight, watching constellations ripple beneath them.`,
    action: (n) =>
      `${n} gently paddling a cozy enchanted wooden boat with the tiny companion perched happily at the bow.`,
    environment: (t) =>
      `Mirror-calm starlight river winding through "${t}", glowing lily pads, twilight indigo reflections and golden star shimmer.`,
  },
  {
    arBoy: (n) =>
      `بدأ ${n} تسلق تلّ النجوم خطوةً بعد خطوة؛ ورغم طول الطريق، لم يستسلم بل ابتسم وشجّع صديقه على الاستمرار.`,
    arGirl: (n) =>
      `بدأت ${n} تسلق تلّ النجوم خطوةً بعد خطوة؛ ورغم طول الطريق، لم تستسلم بل ابتسمت وشجّعت صديقها على الاستمرار.`,
    en: (n) =>
      `Step by determined step, ${n} climbed Starlight Hill, never giving up and cheering their little friend along every mossy ledge.`,
    action: (n) =>
      `${n} climbing glowing mossy stone steps up a magical hill, turning back with an encouraging smile to lend a hand.`,
    environment: (t) =>
      `Winding starlit hillside trail in "${t}", glowing ferns and distant glowing summit under a vast dreamy twilight sky.`,
  },
  {
    arBoy: (n) =>
      `وعندما هبّت ريح عاتية تحاول إبعادهما، وقف ${n} بشجاعة حقيقية وحمى صديقه الصغير بقلبٍ مليء بالثقة واللطف.`,
    arGirl: (n) =>
      `وعندما هبّت ريح عاتية تحاول إبعادهما، وقفت ${n} بشجاعة حقيقية وحمت صديقها الصغير بقلبٍ مليء بالثقة واللطف.`,
    en: (n) =>
      `When a swirling gust of wind swept across the ridge, ${n} stood tall with true courage, sheltering their small friend with steady calm.`,
    action: (n) =>
      `${n} standing courageously on a breezy lookout ledge, shielding the tiny companion gently as glowing leaves swirl dramatically.`,
    environment: (t) =>
      `Dramatic storybook ridge in "${t}" with swirling sapphire-and-violet wind ribbons and a bright golden horizon breaking through.`,
  },
  {
    arBoy: (n) =>
      `تعلّم ${n} في تلك اللحظة سراً عظيماً: الشجاعة الحقيقية لا تعني غياب الخوف، بل تعني أن تواصل المسير بحبٍ وقلبٍ طيب.`,
    arGirl: (n) =>
      `تعلّمت ${n} في تلك اللحظة سراً عظيماً: الشجاعة الحقيقية لا تعني غياب الخوف، بل تعني أن تواصلي المسير بحبٍ وقلبٍ طيب.`,
    en: (n) =>
      `In that shining moment, ${n} discovered a timeless secret: real bravery blooms whenever you move forward with kindness in your heart.`,
    action: (n) =>
      `${n} placing a hand over their heart with a serene proud smile as a warm golden aura of tiny glowing bubbles rises gently around them.`,
    environment: (t) =>
      `Calm glowing clearing in "${t}" as the wind settles into peaceful golden sparkles and radiant pastel dawn light.`,
  },
  {
    arBoy: (n) =>
      `أخيراً، وصل ${n} إلى قمة الأمنيات المضيئة، حيث عاد الصديق الصغير إلى عائلته وسط فرحة غامرة ودموع سعادة.`,
    arGirl: (n) =>
      `أخيراً، وصلت ${n} إلى قمة الأمنيات المضيئة، حيث عاد الصديق الصغير إلى عائلته وسط فرحة غامرة ودموع سعادة.`,
    en: (n) =>
      `At last, ${n} reached the Summit of Wishes, where the little creature reunited joyfully with its family beneath a glowing canopy of stars.`,
    action: (n) =>
      `${n} beaming proudly with clasped hands while watching the little companion happily hug its glowing family.`,
    environment: (t) =>
      `Breathtaking panoramic crest of "${t}" bathed in aurora ribbons and warm golden starlight, lush deep dusk foreground.`,
  },
  {
    arBoy: (n) =>
      `انطلق احتفال الفقاعات الكبير تكريماً لبطولة ${n}! تراقصت الأضواء والنجوم وصفّق الجميع لذكائه وطيبة قلبه.`,
    arGirl: (n) =>
      `انطلق احتفال الفقاعات الكبير تكريماً لبطولة ${n}! تراقصت الأضواء والنجوم وصفّق الجميع لذكائها وطيبة قلبها.`,
    en: (n) =>
      `A dazzling Grand Bubble Celebration erupted in honor of ${n}, with cheering friends and golden star-bubbles dancing overhead!`,
    action: (n) =>
      `${n} laughing and cheering joyfully with arms raised high at the center of a magical festival of floating glowing bubbles.`,
    environment: (t) =>
      `Festive starlight plaza inside "${t}", floating lanterns, pastel confetti bubbles, radiant celebratory Pixar lighting.`,
  },
  {
    arBoy: (n) =>
      `تقدّم أصدقاء العالم السحري وقدّموا لـ ${n} وسام النجمة المضيئة، تذكاراً أبدياً للشجاعة واللطف والخيال الجميل.`,
    arGirl: (n) =>
      `تقدّم أصدقاء العالم السحري وقدّموا لـ ${n} وسام النجمة المضيئة، تذكاراً أبدياً للشجاعة واللطف والخيال الجميل.`,
    en: (n) =>
      `The grateful friends presented ${n} with the luminous Keepsake Star Medal, a forever treasure honoring courage, kindness, and wonder.`,
    action: (n) =>
      `${n} proudly holding a shimmering golden star-bubble keepsake charm, glowing warmly with a beaming heartfelt smile.`,
    environment: (t) =>
      `Intimate golden-lit ceremony circle in "${t}", soft bokeh starlights and warm dreamy atmosphere with calm lower frame.`,
  },
  {
    arBoy: (n) =>
      `لوّح ${n} بحب وامتنان لكل الأصدقاء الجدد تحت سماء بنفسجية هادئة، ووعدهم أن يزورهم دائماً في أحلامه الجميلة.`,
    arGirl: (n) =>
      `لوّحت ${n} بحب وامتنان لكل الأصدقاء الجدد تحت سماء بنفسجية هادئة، ووعدتهم أن تزورهم دائماً في أحلامها الجميلة.`,
    en: (n) =>
      `Beneath a tranquil lavender twilight sky, ${n} waved fondly to every new friend, promising to meet again in joyful dreams.`,
    action: (n) =>
      `${n} waving goodbye warmly with one hand while holding the glowing star keepsake in the other, looking back with affection.`,
    environment: (t) =>
      `Serene twilight farewell hillside in "${t}", soft lavender and rose sunset clouds, glowing silhouettes of friendly companions.`,
  },
  {
    arBoy: (n) =>
      `احتضنت فقاعة سحرية دافئة البطل ${n} وحملته برفق عبر سماء الغروب الذهبية في طريق العودة الآمن إلى بيته.`,
    arGirl: (n) =>
      `احتضنت فقاعة سحرية دافئة البطلة ${n} وحملتها برفق عبر سماء الغروب الذهبية في طريق العودة الآمن إلى بيتها.`,
    en: (n) =>
      `A gentle luminous bubble lifted ${n} softly across the golden sunset sky, gliding peacefully homeward.`,
    action: (n) =>
      `${n} floating cozily inside a giant translucent iridescent bubble, smiling peacefully while gazing down at glowing clouds.`,
    environment: (t) =>
      `Golden sunset sky bridging "${t}" and home, warm amber horizon fading into soft deep twilight blue at the bottom.`,
  },
  {
    arBoy: (n, t) =>
      `وعندما عاد ${n} إلى غرفته الدافئة قبل النوم، ابتسم بهدوء وهو يعلم أن حكاية «${t}» ستبقى نجمة مضيئة في قلبه للأبد.`,
    arGirl: (n, t) =>
      `وعندما عادت ${n} إلى غرفتها الدافئة قبل النوم، ابتسمت بهدوء وهي تعلم أن حكاية «${t}» ستبقى نجمة مضيئة في قلبها للأبد.`,
    en: (n, t) =>
      `Back in a cozy sunlit-to-moonlit bedroom at bedtime, ${n} smiled warmly, knowing "${t}" would shine in their heart forever.`,
    action: (n) =>
      `${n} tucked warmly beside a glowing bedtime storybook and the tiny keepsake star bubble, smiling serenely in a heartwarming closing scene.`,
    environment: (t) =>
      `Cozy moonlit children's bedroom with warm bedside lamp glow, faint starry reflections of "${t}" outside the window, soft dark lower framing.`,
  },
];

function selectBeatIndices(pageCount: number): number[] {
  const totalAvailable = STORY_ARC_24_BEATS.length;
  const count = Math.max(1, Math.floor(pageCount));
  if (count === 1) return [0];
  if (count === 2) return [0, totalAvailable - 1];
  if (count >= totalAvailable) {
    return Array.from({ length: totalAvailable }, (_, i) => i);
  }

  // Always start on beat 0 (opening) and end on beat 23 (closing), evenly picking distinct middle beats.
  const indices: number[] = [0];
  const innerNeeded = count - 2;
  const innerPoolSize = totalAvailable - 2; // 22 middle beats (1..22)
  for (let i = 0; i < innerNeeded; i += 1) {
    const mapped = 1 + Math.floor(((i + 0.5) * innerPoolSize) / innerNeeded);
    const prev = indices[indices.length - 1];
    const remainingSlots = innerNeeded - 1 - i;
    const maxAllowed = totalAvailable - 2 - remainingSlots;
    const nextIdx = Math.min(maxAllowed, Math.max(prev + 1, mapped));
    indices.push(nextIdx);
  }
  indices.push(totalAvailable - 1);
  return indices;
}

export function buildFullStoryArc(
  dna: CharacterDna,
  pageCount: number,
  storyLang: 'ar' | 'en',
  themeTitle: string,
  engine: PromptEngineMode
): Stage2StoryBeatPage[] {
  const norm = normalizeCharacterDna(dna);
  const safeCount = Math.max(1, Math.min(48, Math.floor(pageCount) || 15));
  const cleanTheme =
    themeTitle.trim() ||
    (storyLang === 'ar'
      ? `مغامرة ${norm.childName} في عالم الفقاعات السحري`
      : `${norm.childName}'s Magical Bubbleverse Adventure`);

  const beatIndices = selectBeatIndices(safeCount);
  const pages: Stage2StoryBeatPage[] = [];

  for (let i = 0; i < safeCount; i += 1) {
    const pageNumber = i + 1;
    let text: string;
    let action: string;
    let environment: string;

    if (i < beatIndices.length) {
      const beat = STORY_ARC_24_BEATS[beatIndices[i]];
      text =
        storyLang === 'ar'
          ? norm.genderWord === 'girl'
            ? beat.arGirl(norm.childName, cleanTheme)
            : beat.arBoy(norm.childName, cleanTheme)
          : beat.en(norm.childName, cleanTheme);
      action = beat.action(norm.childName);
      environment = beat.environment(cleanTheme);
    } else {
      const bonusNum = i - beatIndices.length + 1;
      text =
        storyLang === 'ar'
          ? norm.genderWord === 'girl'
            ? `في فصل إضافي مميز (${bonusNum}) من حكاية «${cleanTheme}»، واصلت ${norm.childName} رسم ذكريات ساحرة تملأ قلبها بالبهجة.`
            : `في فصل إضافي مميز (${bonusNum}) من حكاية «${cleanTheme}»، واصل ${norm.childName} رسم ذكريات ساحرة تملأ قلبه بالبهجة.`
          : `In a special bonus memory (#${bonusNum}) of "${cleanTheme}", ${norm.childName} discovered yet another sparkling wonder to treasure forever.`;
      action = `${norm.childName} sharing a joyful bonus celebration moment (#${bonusNum}) surrounded by floating glowing bubbles.`;
      environment = `Enchanted starlit panorama of "${cleanTheme}" with warm pastel glow and soft darker lower framing.`;
    }

    const imagePrompt = buildStage2ScenePrompt(
      dna,
      {
        pageNumber,
        totalPages: safeCount,
        action,
        environment,
        storyText: text,
      },
      engine
    );

    pages.push({
      pageNumber,
      text,
      action,
      environment,
      imagePrompt,
      imageUrl: DEFAULT_STORY_FALLBACK_IMAGES[i % DEFAULT_STORY_FALLBACK_IMAGES.length],
      suggestedFileName: `${formatPaddedNumber(pageNumber)}-scene.png`,
    });
  }

  return pages;
}

export function reformatScenePromptForEngine(
  existingPrompt: string,
  dna: CharacterDna,
  pageNumber: number,
  totalPages: number,
  engine: PromptEngineMode,
  storyText?: string
): string {
  const actionMatch = existingPrompt.match(/\[ACTION\]:\s*([^\n]+)/i);
  const envMatch = existingPrompt.match(/\[ENVIRONMENT\s*&\s*LIGHTING\]:\s*([^\n]+)/i);

  const fallbackBeatIndex =
    Math.max(0, Math.min(STORY_ARC_24_BEATS.length - 1, pageNumber - 1));
  const fallbackBeat = STORY_ARC_24_BEATS[fallbackBeatIndex];
  const norm = normalizeCharacterDna(dna);

  const action = actionMatch?.[1]?.trim() || fallbackBeat.action(norm.childName);
  const environment =
    envMatch?.[1]?.trim() || fallbackBeat.environment(`${norm.childName}'s Bubbleverse`);

  return buildStage2ScenePrompt(
    dna,
    {
      pageNumber,
      totalPages,
      action,
      environment,
      storyText,
    },
    engine
  );
}

export function buildProductionPromptPackText(options: ProductionPromptPackOptions): string {
  const norm = normalizeCharacterDna(options.dna);
  const engineLabel =
    options.engine === 'midjourney'
      ? 'Midjourney (--cref --cw 85 --ar 1:1)'
      : options.engine === 'flux'
      ? 'Flux Kontext / PuLID Face Lock (1:1)'
      : 'Nano Banana / Gemini Image Generation (1:1)';

  const lines: string[] = [
    '======================================================================',
    'BUBBLEVERSE STAGE 2 PRODUCTION PROMPT PACK — KDP 8.5" × 8.5" (300 DPI)',
    '======================================================================',
    `Book Title      : ${options.storyTitle.trim() || `${norm.childName}'s Storybook`}`,
    ...(options.orderReference?.trim()
      ? [`Order Reference : ${options.orderReference.trim()}`]
      : []),
    `Hero Profile    : ${norm.childName} (${norm.ageDescriptor} ${norm.genderWord})`,
    `Story Language  : ${options.storyLang === 'ar' ? 'Arabic (RTL)' : 'English (LTR)'}`,
    `Prompt Engine   : ${engineLabel}`,
    `Total Scenes    : ${options.pages.length}`,
    `Print Spec      : Amazon KDP 8.5"×8.5" Trim (2550×2550 px) / Full Bleed 8.625"×8.75" (2588×2625 px @ 300 DPI)`,
    `Print Tip       : Paper prints 8–10% darker than phone screens — lift deep shadows slightly before export.`,
    '',
    '----------------------------------------------------------------------',
    'STEP 1 — MASTER CHARACTER CONSISTENCY SHEET (GENERATE & LOCK FIRST)',
    '----------------------------------------------------------------------',
    buildMasterCharacterSheetPrompt(options.dna, options.engine),
    '',
    '----------------------------------------------------------------------',
    'STEP 2 — NUMBERED STORY SCENES (ATTACH CHARACTER SHEET + CHILD PHOTO)',
    '----------------------------------------------------------------------',
  ];

  for (const page of options.pages) {
    const fileName = `${formatPaddedNumber(page.pageNumber)}-scene.png`;
    lines.push(
      '',
      `### ${fileName} (Page ${page.pageNumber} / ${options.pages.length})`,
      `STORY TEXT: ${page.text.trim()}`,
      'PROMPT:',
      page.imagePrompt.trim(),
      '----------------------------------------------------------------------'
    );
  }

  return `${lines.join('\n')}\n`;
}

export function normalizeWhatsAppPhone(phone: string, country: 'EG' | 'SA' | 'AE'): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (!digits) return '';

  if (country === 'EG') {
    if (digits.startsWith('20')) return digits;
    if (digits.startsWith('0')) return `20${digits.slice(1)}`;
    if (digits.length === 10 && digits.startsWith('1')) return `20${digits}`;
    return digits;
  }

  if (country === 'AE') {
    if (digits.startsWith('971')) return digits;
    if (digits.startsWith('0')) return `971${digits.slice(1)}`;
    if (digits.length === 9 && digits.startsWith('5')) return `971${digits}`;
    return digits;
  }

  if (digits.startsWith('966')) return digits;
  if (digits.startsWith('0')) return `966${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith('5')) return `966${digits}`;
  return digits;
}

function buildWaMeUrl(normalizedPhone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

export function buildWhatsAppHelperMessages(
  options: WhatsAppHelperOptions
): WhatsAppHelperBundle {
  const normalizedPhone = normalizeWhatsAppPhone(options.phone, options.country);
  const isGulf = options.country === 'SA' || options.country === 'AE';
  const customer = options.customerName.trim() || (isGulf ? 'عميلنا العزيز' : 'حضرتك');
  const child = options.childName.trim() || 'البطل الصغير';
  const ref = options.reference.trim() || 'BV-ORDER';
  const trackUrl = options.trackingUrl.trim();
  const greetingAr = isGulf
    ? `السلام عليكم وحياكم الله أ/ ${customer} 🌷\nمعكم فريق Bubbleverse بخصوص طلب قصة البطل "${child}" (رقم الطلب: ${ref}).`
    : `أهلاً بحضرتك أ/ ${customer} 🌷\nمع حضرتك فريق Bubbleverse بخصوص طلب قصة البطل "${child}" (رقم الطلب: ${ref}).`;

  const photoRequestAr =
    `${greetingAr}\n\n` +
    `لكي تطلع رسومات "${child}" متطابقة 100% في كل صفحات الكتاب، نرجو إرسال صورتين إلى 3 صور أوضح للطفل بهذه المواصفات البسيطة:\n` +
    `✅ إضاءة نهارية واضحة أمام الوجه بدون ظلال قوية.\n` +
    `✅ الطفل ينظر مباشرة للكاميرا (صورة أمامية + زاوية ثلاثة أرباع لو متاح).\n` +
    `❌ بدون نظارة شمسية أو قبعة تخفي الشعر والجبهة.\n` +
    `❌ بدون فلاتر سناب شات قوية أو صور مهزوزة/بعيدة.\n\n` +
    `بمجرد استلام الصورة نبدأ فوراً في إعداد ورقة ثبات الشخصية ✨`;

  const photoRequestEn =
    `Hello ${customer} 🌷\n` +
    `This is the Bubbleverse team regarding ${child}'s personalized storybook (Order: ${ref}).\n\n` +
    `To lock ${child}'s exact likeness across every page, could you please share 2–3 clearer photos following these quick tips?\n` +
    `✅ Bright natural daylight facing the child (no harsh shadows).\n` +
    `✅ Front-facing look directly at the camera (plus an optional 3/4 angle).\n` +
    `❌ No sunglasses or hats covering the hair/forehead.\n` +
    `❌ No heavy beauty/Snapchat filters or blurry/distant shots.\n\n` +
    `As soon as we receive them, we'll start illustrating ${child}'s character sheet right away ✨`;

  const draftApprovalAr =
    `${greetingAr}\n\n` +
    `بشرى جميلة! 🎉 مسودة قصة "${child}" أصبحت جاهزة للمراجعة قبل الطباعة الفاخرة بمقاس 8.5"×8.5".\n` +
    `نرجو مراجعة المسودة والتأكد من:\n` +
    `1️⃣ صحة كتابة اسم "${child}" في الغلاف وكل الصفحات.\n` +
    `2️⃣ تطابق ملامح الطفل في الرسومات.\n` +
    `3️⃣ نص الإهداء الخاص بكم.\n` +
    (trackUrl ? `\nرابط متابعة الطلب: ${trackUrl}\n` : '\n') +
    `بانتظار ردكم الكريم بالاعتماد أو أي تعديل بسيط لنبدأ الطباعة فوراً 💛`;

  const draftApprovalEn =
    `Hello ${customer} 🎉\n` +
    `Wonderful news! ${child}'s personalized storybook draft (Order: ${ref}) is ready for your review before we start printing the luxury 8.5"×8.5" edition.\n\n` +
    `Please double-check:\n` +
    `1. Exact spelling of "${child}" across the cover and pages.\n` +
    `2. ${child}'s likeness across the illustrations.\n` +
    `3. Your personal dedication message.\n` +
    (trackUrl ? `\nOrder tracking link: ${trackUrl}\n` : '\n') +
    `Reply with your approval (or any quick tweak) and we will send it straight to print 💛`;

  const printingStartedAr =
    `${greetingAr}\n\n` +
    `يسعدنا إبلاغكم أنه تم اعتماد مسودة قصة "${child}" وبدأت الآن مرحلة الطباعة الاحترافية بمقاس 8.5"×8.5" والتغليف الفاخر من Bubbleverse! 📚✨\n` +
    (trackUrl ? `يمكنكم متابعة حالة الطلب والشحن في أي وقت عبر الرابط:\n${trackUrl}\n\n` : '\n') +
    `نتحمس جداً لوصول القصة وإسعاد قلب "${child}" 💛`;

  const printingStartedEn =
    `Hello ${customer} 📚✨\n` +
    `Exciting update! ${child}'s approved 8.5"×8.5" storybook (Order: ${ref}) has officially entered professional printing & luxury Bubbleverse gift packaging!\n` +
    (trackUrl ? `You can track production and shipping progress anytime here:\n${trackUrl}\n\n` : '\n') +
    `We can't wait for ${child} to hold their very own storybook 💛`;

  const makeMsg = (textAr: string, textEn: string): WhatsAppHelperMessage => ({
    textAr,
    textEn,
    urlAr: buildWaMeUrl(normalizedPhone, textAr),
    urlEn: buildWaMeUrl(normalizedPhone, textEn),
    text: textAr,
    url: buildWaMeUrl(normalizedPhone, textAr),
  });

  return {
    normalizedPhone,
    requestClearerPhoto: makeMsg(photoRequestAr, photoRequestEn),
    sendDraftForApproval: makeMsg(draftApprovalAr, draftApprovalEn),
    confirmPrintingStarted: makeMsg(printingStartedAr, printingStartedEn),
  };
}

export function checkImagePrintReadiness(width: number, height: number): PrintResolutionCheck {
  const safeWidth = Number.isFinite(width) && width > 0 ? Math.round(width) : 0;
  const safeHeight = Number.isFinite(height) && height > 0 ? Math.round(height) : 0;

  if (safeWidth >= 2500 && safeHeight >= 2500) {
    return {
      width: safeWidth,
      height: safeHeight,
      status: 'print_300dpi',
      labelAr: 'جاهز للطباعة 300 DPI',
      labelEn: '300 DPI Print Ready',
    };
  }

  if (safeWidth >= 1024 && safeHeight >= 1024) {
    return {
      width: safeWidth,
      height: safeHeight,
      status: 'upscale_recommended',
      labelAr: 'يُنصح بالتكبير 2× قبل طباعة KDP',
      labelEn: 'Upscale 2× before KDP print',
    };
  }

  return {
    width: safeWidth,
    height: safeHeight,
    status: 'low_res',
    labelAr: 'دقة منخفضة للطباعة',
    labelEn: 'Low Res for Print',
  };
}

interface RawAiBeatItem {
  pageNumber?: unknown;
  text?: unknown;
  action?: unknown;
  environment?: unknown;
}

function resolveAiTextEndpoint(
  config: AiIntegrationSettings
): { endpoint: string; model: string } | null {
  if (config.provider === 'gemini') {
    const rawModel = config.model.trim().replace(/^google\//i, '');
    const model =
      !rawModel || /imagen/i.test(rawModel) ? 'gemini-2.5-flash' : rawModel;
    return {
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model,
    };
  }

  if (config.provider === 'openai') {
    const rawModel = config.model.trim();
    const model = !rawModel || /image/i.test(rawModel) ? 'gpt-4o-mini' : rawModel;
    return {
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model,
    };
  }

  if (config.provider === 'custom' && config.customEndpoint?.trim()) {
    try {
      const parsed = new URL(config.customEndpoint.trim());
      if (
        (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
        !parsed.hostname.toLowerCase().includes('lovable')
      ) {
        return {
          endpoint: parsed.toString(),
          model: config.model.trim() || 'gpt-4o-mini',
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

function extractJsonArrayFromAiContent(rawContent: string): RawAiBeatItem[] | null {
  const cleaned = rawContent
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const tryParse = (candidate: string): RawAiBeatItem[] | null => {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (Array.isArray(parsed)) return parsed as RawAiBeatItem[];
      if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as { pages?: unknown }).pages)
      ) {
        return (parsed as { pages: RawAiBeatItem[] }).pages;
      }
      return null;
    } catch {
      return null;
    }
  };

  const direct = tryParse(cleaned);
  if (direct) return direct;

  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return tryParse(cleaned.slice(firstBracket, lastBracket + 1));
  }
  return null;
}

export async function generateStoryWithConfiguredAi(
  options: EnhanceStoryWithAiOptions
): Promise<EnhanceStoryWithAiResult> {
  const localPages = buildFullStoryArc(
    options.dna,
    options.pageCount,
    options.storyLang,
    options.storyTitle,
    options.engine
  );

  // Preserve any already-attached imageUrls on existing pages
  if (options.existingPages?.length) {
    const existingByNum = new Map(
      options.existingPages.map((p) => [p.pageNumber, p.imageUrl])
    );
    for (const page of localPages) {
      const preserved = existingByNum.get(page.pageNumber);
      if (preserved) {
        page.imageUrl = preserved;
      }
    }
  }

  const trimmedKey = options.aiConfig.apiKey.trim();
  if (!options.aiConfig.enabled || !trimmedKey) {
    return {
      pages: localPages,
      source: 'local',
      notice:
        options.storyLang === 'ar'
          ? 'لم يتم تفعيل مفتاح Gemini أو OpenAI في إعدادات الربط؛ تم استخدام القصة الاحترافية المحلية.'
          : 'No active Gemini or OpenAI key is configured in Integrations; used the local story arc.',
    };
  }

  const target = resolveAiTextEndpoint(options.aiConfig);
  if (!target) {
    return {
      pages: localPages,
      source: 'local',
      notice:
        options.storyLang === 'ar'
          ? 'مزود الذكاء الاصطناعي الحالي مخصص للصور فقط؛ اختر Gemini أو OpenAI لتحسين النصوص تلقائياً.'
          : 'The selected AI provider is image-focused; choose Gemini or OpenAI in Integrations for AI script enhancement.',
    };
  }

  const fetchImpl = options.fetcher ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    return {
      pages: localPages,
      source: 'local',
      notice: 'Fetch API unavailable; used local story arc.',
    };
  }

  const norm = normalizeCharacterDna(options.dna);
  const controller = new AbortController();
  const timeoutMs = Math.max(1000, Math.min(60000, options.timeoutMs ?? 25000));
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const systemPrompt =
      'You are an award-winning children storybook author for Bubbleverse. ' +
      'Return ONLY a valid JSON array with no markdown commentary. ' +
      'Each element must have: {"pageNumber": number, "text": string, "action": string, "environment": string}. ' +
      'Keep every page text emotionally warm, age-appropriate, unique (never repetitive), 1-2 short sentences. ' +
      'Write "action" and "environment" in vivid descriptive English for 1:1 storybook illustration prompts.';

    const userPrompt =
      `Write a ${localPages.length}-page personalized storybook titled "${options.storyTitle}" for ` +
      `${norm.childName} (${norm.ageDescriptor} ${norm.genderWord}). ` +
      `Write each page's "text" strictly in ${options.storyLang === 'ar' ? 'natural warm Arabic matching the child gender' : 'warm read-aloud English'}. ` +
      `Keep every page distinct across a complete beginning-middle-ending arc.`;

    const response = await fetchImpl(target.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trimmedKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: target.model,
        temperature: 0.7,
        max_tokens: 3200,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const sanitizedStatus = response.status;
      const notice =
        sanitizedStatus === 401 || sanitizedStatus === 403
          ? options.storyLang === 'ar'
            ? `تعذّر المصادقة مع مزود الذكاء الاصطناعي (HTTP ${sanitizedStatus}). تم استخدام القصة المحلية.`
            : `AI provider rejected credentials (HTTP ${sanitizedStatus}). Used local story arc.`
          : sanitizedStatus === 429
          ? options.storyLang === 'ar'
            ? 'تم تجاوز حد الطلبات لدى مزود الذكاء الاصطناعي (HTTP 429). تم استخدام القصة المحلية.'
            : 'AI provider rate limit reached (HTTP 429). Used local story arc.'
          : options.storyLang === 'ar'
          ? `تعذّر إتمام طلب الذكاء الاصطناعي (HTTP ${sanitizedStatus}). تم استخدام القصة المحلية.`
          : `AI request failed (HTTP ${sanitizedStatus}). Used local story arc.`;

      return { pages: localPages, source: 'local', notice };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = payload?.choices?.[0]?.message?.content;
    if (typeof rawContent !== 'string' || !rawContent.trim()) {
      return {
        pages: localPages,
        source: 'local',
        notice:
          options.storyLang === 'ar'
            ? 'لم يرجع مزود الذكاء الاصطناعي نصاً صالحاً؛ تم استخدام القصة المحلية.'
            : 'AI provider returned empty content; used local story arc.',
      };
    }

    const parsedItems = extractJsonArrayFromAiContent(rawContent);
    if (!parsedItems || parsedItems.length === 0) {
      return {
        pages: localPages,
        source: 'local',
        notice:
          options.storyLang === 'ar'
            ? 'تعذّر قراءة تنسيق استجابة الذكاء الاصطناعي؛ تم استخدام القصة المحلية.'
            : 'Could not parse AI script JSON; used local story arc.',
      };
    }

    const enhancedPages: Stage2StoryBeatPage[] = localPages.map((fallbackPage, index) => {
      const aiItem = parsedItems[index];
      const text =
        typeof aiItem?.text === 'string' && aiItem.text.trim().length > 0
          ? aiItem.text.trim()
          : fallbackPage.text;
      const action =
        typeof aiItem?.action === 'string' && aiItem.action.trim().length > 0
          ? aiItem.action.trim()
          : fallbackPage.action;
      const environment =
        typeof aiItem?.environment === 'string' && aiItem.environment.trim().length > 0
          ? aiItem.environment.trim()
          : fallbackPage.environment;

      const imagePrompt = buildStage2ScenePrompt(
        options.dna,
        {
          pageNumber: fallbackPage.pageNumber,
          totalPages: localPages.length,
          action,
          environment,
          storyText: text,
        },
        options.engine
      );

      return {
        ...fallbackPage,
        text,
        action,
        environment,
        imagePrompt,
      };
    });

    return {
      pages: enhancedPages,
      source: 'ai',
      notice:
        options.storyLang === 'ar'
          ? `تم تحسين نصوص وبرومبتات ${enhancedPages.length} صفحة عبر الذكاء الاصطناعي بنجاح.`
          : `Enhanced ${enhancedPages.length} pages with AI and formatted all Stage 2 prompts.`,
    };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      pages: localPages,
      source: 'local',
      notice: isAbort
        ? options.storyLang === 'ar'
          ? 'انتهت مهلة الاتصال بمزود الذكاء الاصطناعي؛ تم استخدام القصة المحلية.'
          : 'AI request timed out; used local story arc.'
        : options.storyLang === 'ar'
        ? 'تعذّر الاتصال بمزود الذكاء الاصطناعي؛ تم استخدام القصة المحلية.'
        : 'Unable to reach AI provider; used local story arc.',
    };
  } finally {
    clearTimeout(timer);
  }
}
