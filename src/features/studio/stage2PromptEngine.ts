/**
 * Bubbleverse Stage 2 Prompt Architecture & Studio Production Engine
 * Implements the Playbook Hybrid AI Pipeline (Nano Banana / Gemini + Midjourney + Flux)
 * calibrated for Amazon KDP 8.5" x 8.5" (300 DPI, 2588 x 2625 px full bleed).
 *
 * Upgraded with The 7 Therapeutic Bubbles Engine & The Golden Story Constitution:
 * - 4-Stage Dramatic Structure (Struggle -> Cocoon -> Epiphany NO POP -> Real-world Moral Choice & THE POP!)
 * - Organic subconscious Bubbleverse merchandise placement
 * - CRITICAL: The child alone is the hero. Zero mascot/Bub mentions in story scripts.
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
  storyTheme?: string;
  signatureProp?: string;
  pose2Description?: string;
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
  provider: 'gemini' | 'huggingface' | 'nano_banana' | 'openai' | 'flux' | 'custom';
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

// ============================================================================
// THE 7 THERAPEUTIC BUBBLES DEFINITIONS & CONTRACTS
// ============================================================================

export type SevenBubbleId =
  | 'red_calm'
  | 'orange_empathy'
  | 'yellow_honesty'
  | 'green_realworld'
  | 'blue_courage'
  | 'indigo_friendship'
  | 'purple_sharing';

export type TherapeuticBubbleId = SevenBubbleId;

export interface StoryBeatTemplate {
  arBoy: (name: string, theme: string) => string;
  arGirl: (name: string, theme: string) => string;
  en: (name: string, theme: string) => string;
  action: (name: string) => string;
  environment: (theme: string) => string;
}

export interface SevenBubbleDefinition {
  id: SevenBubbleId;
  color: 'Red' | 'Orange' | 'Yellow' | 'Green' | 'Blue' | 'Indigo' | 'Purple';
  colorHex: string;
  badgeClass: string;
  icon: string;
  labelAr: string;
  labelEn: string;
  struggleAr: string;
  struggleEn: string;
  virtueAr: string;
  virtueEn: string;
  realWorldSetupAr: string;
  realWorldSetupEn: string;
  popBreakthroughAr: string;
  popBreakthroughEn: string;
  lightingPrompt: string;
  colorPalette: string[];
  boyOutfit: string;
  girlOutfit: string;
  signatureProp: string;
  pose2Description: string;
  outfit: string;
  prop: string;
  pose2: string;
  merchandiseHintAr: string;
  merchandiseHintEn: string;
  beats: readonly StoryBeatTemplate[];
}

export type TherapeuticBubble = SevenBubbleDefinition;

export type StoryThemeKey =
  | 'dinosaurs'
  | 'space'
  | 'ocean'
  | 'fantasy'
  | 'superhero'
  | 'animals'
  | 'bedtime'
  | 'graduation'
  | 'custom'
  | 'bubble'
  | SevenBubbleId;

export interface ThemePreset {
  id: StoryThemeKey;
  labelAr: string;
  labelEn: string;
  keywords: string[];
  boyOutfit: string;
  girlOutfit: string;
  signatureProp: string;
  pose2Description: string;
}

// ----------------------------------------------------------------------------
// 7 Therapeutic Bubbles Catalog with complete 12-Beat 4-Stage Arcs
// ----------------------------------------------------------------------------

export const THE_SEVEN_BUBBLES: ReadonlyArray<SevenBubbleDefinition> = [
  // 1. RED BUBBLE: CALM & EMOTIONAL REGULATION
  {
    id: 'red_calm',
    color: 'Red',
    colorHex: '#EF4444',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: '🔴',
    labelAr: 'فقاعة الهدوء وضبط الغضب',
    labelEn: 'Bubble of Calm (Anger & Impulsivity)',
    struggleAr: 'العصبية والاندفاع وفقدان السيطرة على الغضب',
    struggleEn: 'Anger, Impulsivity & Emotional Regulation',
    virtueAr: 'التنفس العميق، ضبط النفس، وتحويل الغضب لسلام',
    virtueEn: 'Deep Breathing, Self-Regulation & Calm Courage',
    realWorldSetupAr:
      'أثناء اللعب في المنزل، سقط برج المكعبات العالي الذي بناه البطل بحماس، فشعر بحرارة الغضب تشتعل في صدره وقبضتيه تكادان تنفجران.',
    realWorldSetupEn:
      'In the playroom, a tall block tower crashed down. Frustration surged, hands clenched tight as a fiery heat rose in their chest.',
    popBreakthroughAr:
      'يأخذ البطل نفساً عميقاً هادئاً، يبتسم، ويقول: "لا بأس.. سأبنيه من جديد!" فتنفجر الفقاعة الحمراء في لمعة انتصار بهيجة!',
    popBreakthroughEn:
      'Taking a deep, peaceful breath, they smile: "It is okay, I can rebuild it even higher!" The red bubble pops into sparkling ruby celebration!',
    lightingPrompt:
      'Warm ruby-crimson and soft amber ambient lighting, soothing rose-gold light ribbons, gentle cinematic glow, deep calm shadows for text contrast.',
    colorPalette: ['#EF4444', '#F87171', '#FDA4AF', '#FFE4E6', '#991B1B'],
    boyOutfit:
      'cozy crimson-and-navy junior explorer hoodie with gentle star patches, soft denim pants, and comfortable sneakers',
    girlOutfit:
      'cozy ruby-and-cream explorer fleece jacket with star patches, comfortable pants, and soft sneakers',
    signatureProp: 'a warm glowing ruby calm-stone with soft pulsing light',
    pose2Description:
      '(2) 3/4 view taking a calm deep breath with a serene smile and hand placed gently over the heart',
    outfit:
      'cozy crimson-and-navy junior explorer hoodie with gentle star patches, soft denim pants, and comfortable sneakers',
    prop: 'a warm glowing ruby calm-stone with soft pulsing light',
    pose2:
      '(2) 3/4 view taking a calm deep breath with a serene smile and hand placed gently over the heart',
    merchandiseHintAr: 'سترة بابل فيرس للمغامرات وحقيبة المستكشف',
    merchandiseHintEn: 'Bubbleverse Junior Adventure Jacket and Explorer Backpack',
    beats: [
      // Stage 1: Real-world struggle
      {
        arBoy: (n) =>
          `في صباح دافئ، كان البطل ${n} يبني برجاً رائعاً من المكعبات، وفجأة اهتز البرج وسقط وتناثرت القطع في كل مكان!`,
        arGirl: (n) =>
          `في صباح دافئ، كانت البطلة ${n} تبني برجاً رائعاً من المكعبات، وفجأة اهتز البرج وسقط وتناثرت القطع في كل مكان!`,
        en: (n) =>
          `On a sunny morning, ${n} was carefully building a tall tower of blocks, when suddenly it wobbled and crashed to the floor!`,
        action: (n) =>
          `${n} looking down at a tumbled pile of colorful blocks on the playroom rug, hands clenched into little fists with frustration.`,
        environment: () =>
          `Cozy storybook playroom bathed in golden morning light, scattered building blocks on a soft carpet, warm cinematic shadows.`,
      },
      {
        arBoy: (n) =>
          `شعر ${n} بحرارة الغضب تتصاعد في صدره كبركان صغير، وكاد يصرخ ويركل الألعاب من شدة الضيق.`,
        arGirl: (n) =>
          `شعرت ${n} بحرارة الغضب تتصاعد في صدرها كبركان صغير، وكادت تصرخ وتركل الألعاب من شدة الضيق.`,
        en: (n) =>
          `A wave of fiery frustration rose in ${n}'s chest like a tiny storm cloud, wanting to shout and kick the toys away.`,
        action: (n) =>
          `${n} standing with puffed cheeks and furrowed brow, feeling the heat of frustration rising while breathing fast.`,
        environment: () =>
          `Playroom with soft red-tinted morning shadows gathering gently around the edges, emphasizing the rising emotional tension.`,
      },
      // Stage 2: Colored bubble forms around child
      {
        arBoy: (n) =>
          `وفجأة، انبثقت فقاعة بلورية حمراء دافئة وأحاطت بـ ${n} برفق، فتحوّل الصخب من حوله إلى هدوء تام كأنه داخل شرنقة آمنة.`,
        arGirl: (n) =>
          `وفجأة، انبثقت فقاعة بلورية حمراء دافئة وأحاطت بـ ${n} برفق، فتحوّل الصخب من حولها إلى هدوء تام كأنها داخل شرنقة آمنة.`,
        en: (n) =>
          `Suddenly, a warm translucent ruby bubble formed gently around ${n}, muffling the noise into a quiet, peaceful sanctuary.`,
        action: (n) =>
          `${n} surrounded inside a glowing translucent red soap bubble, wide curious eyes softening as calming warmth envelops them.`,
        environment: () =>
          `Magical transition space with glowing ruby-crimson light ribbons floating outside the translucent bubble, soft bokeh embers.`,
      },
      {
        arBoy: (n) =>
          `ارتفعت الفقاعة الحمراء بخفة حاملةً ${n} إلى وادي السكون، حيث تتهادى الأضواء الحمراء الناعمة كفراشات مضيئة.`,
        arGirl: (n) =>
          `ارتفعت الفقاعة الحمراء بخفة حاملةً ${n} إلى وادي السكون، حيث تتهادى الأضواء الحمراء الناعمة كفراشات مضيئة.`,
        en: (n) =>
          `The ruby bubble floated weightlessly, carrying ${n} into the Valley of Stillness, where gentle red embers drifted like peaceful fireflies.`,
        action: (n) =>
          `${n} floating serenely inside the intact glowing red bubble, gazing in awe at floating stardust embers.`,
        environment: () =>
          `Valley of Stillness with rolling ruby hills under a twilight rose sky, soft volumetric light, calming ambient warmth.`,
      },
      // Stage 3: Inside the bubble — insight & merchandise (NO POPPING)
      {
        arBoy: (n) =>
          `داخل الفقاعة، اكتشف ${n} سراً عجيباً: كلما أخذ نفساً عميقاً وبطيئاً، بردت النيران وتحولت الشرر إلى أزهار ياقوتية عطرة.`,
        arGirl: (n) =>
          `داخل الفقاعة، اكتشفت ${n} سراً عجيباً: كلما أخذت نفساً عميقاً وبطيئاً، بردت النيران وتحولت الشرر إلى أزهار ياقوتية عطرة.`,
        en: (n) =>
          `Inside the bubble, ${n} discovered a marvelous secret: taking a deep, slow breath cooled the fiery sparks into sweet ruby petals.`,
        action: (n) =>
          `${n} with hands over chest taking a long deep breath inside the bubble, watching swirling red sparks transform into soft glowing petals.`,
        environment: () =>
          `Enchanted ruby glade inside the bubble realm, floating crimson flowers and gentle soothing light rays.`,
      },
      {
        arBoy: (n) =>
          `تحسس ${n} سترة بابل فيرس المريحة وشعر بدفء عناقها، ثم فتح حقيبة المستكشف ليرى بوصلة الهدوء تشير دائماً إلى السلام.`,
        arGirl: (n) =>
          `تحسست ${n} سترة بابل فيرس المريحة وشعرت بدفء عناقها، ثم فتحت حقيبة المستكشف لترى بوصلة الهدوء تشير دائماً إلى السلام.`,
        en: (n) =>
          `Snuggling into their cozy Bubbleverse Adventure Jacket, ${n} felt grounded and safe, glancing at the compass of calm from their explorer backpack.`,
        action: (n) =>
          `${n} zipping up their cozy explorer jacket with a calm smile, feeling completely centered and peaceful inside the steady bubble.`,
        environment: () =>
          `Serene starlit ruby horizon inside the bubble, glowing constellation of a resting lion, rich calm atmosphere.`,
      },
      {
        arBoy: (n) =>
          `بدأ ${n} يعد بهدوء: «واحد.. اثنان.. ثلاثة»، ومع كل رقم شعر بقوته الحقيقية تكبر، والفقاعة تحميه بثبات دون أن تنكسر.`,
        arGirl: (n) =>
          `بدأت ${n} تعد بهدوء: «واحد.. اثنان.. ثلاثة»، ومع كل رقم شعرت بقوتها الحقيقية تكبر، والفقاعة تحميها بثبات دون أن تنكسر.`,
        en: (n) =>
          `Slowly ${n} counted: "One... two... three," feeling real inner strength bloom while the red bubble held steadfast and clear.`,
        action: (n) =>
          `${n} counting serenely on their fingers inside the intact glowing red bubble, radiant calm smile shining through.`,
        environment: () =>
          `Luminous ruby sanctuary with crystal-clear reflections, soft soothing music waves depicted as gentle golden-red ripples.`,
      },
      {
        arBoy: (n) =>
          `أدرك ${n} أن الغضب مجرد سحابة عابرة، وأن البطل الحقيقي هو من يتحكم في نفسه ويصنع السلام بابتسامته.`,
        arGirl: (n) =>
          `أدركت ${n} أن الغضب مجرد سحابة عابرة، وأن البطلة الحقيقية هي من تتحكم في نفسها وتصنع السلام بابتسامتها.`,
        en: (n) =>
          `${n} understood that anger was only a passing cloud, and true heroes are the ones who master their own storm with a gentle smile.`,
        action: (n) =>
          `${n} standing tall with relaxed shoulders and peaceful bright eyes, ready to face the world once more.`,
        environment: () =>
          `Dawn breaking through the ruby mist, revealing a golden doorway leading safely back to the playroom.`,
      },
      // Stage 4: Return to real world, heroic choice, AND THE POP!
      {
        arBoy: (n) =>
          `عادت الفقاعة الحمراء برفق بـ ${n} إلى غرفة الألعاب، ليجد نفسه مجدداً أمام المكعبات المبعثرة على السجادة.`,
        arGirl: (n) =>
          `عادت الفقاعة الحمراء برفق بـ ${n} إلى غرفة الألعاب، لتجد نفسها مجدداً أمام المكعبات المبعثرة على السجادة.`,
        en: (n) =>
          `The red bubble guided ${n} softly back into the playroom, right in front of the scattered blocks on the carpet.`,
        action: (n) =>
          `${n} standing back on the playroom floor, still surrounded by the translucent red bubble, looking calmly at the fallen blocks.`,
        environment: () =>
          `Familiar playroom bathed in warm sunlight, the translucent red bubble glowing gently around the child.`,
      },
      {
        arBoy: (n) =>
          `أخذ ${n} نفساً عميقاً هادئاً، وابتسم بدلاً من أن يغضب، وقال بصوت واثق: «لا بأس.. سأبني البرج من جديد وبشكل أقوى!»`,
        arGirl: (n) =>
          `أخذت ${n} نفساً عميقاً هادئاً، وابتسمت بدلاً من أن تغضب، وقالت بصوت واثق: «لا بأس.. سأبني البرج من جديد وبشكل أقوى!»`,
        en: (n) =>
          `Taking a slow, steady breath, ${n} smiled instead of frowning and said bravely: "It is okay! I will build it again even taller!"`,
        action: (n) =>
          `${n} kneeling down with a bright confident smile, gently picking up the first fallen building block with steady hands.`,
        environment: () =>
          `Bright sunlit playroom, golden light illuminating the child's smiling face as the red bubble begins to vibrate with joyful energy.`,
      },
      {
        arBoy: (n) =>
          `وفِي تلك اللحظة التي اختار فيها البطل ${n} الهدوء.. «بوب!» انفرجت الفقاعة الحمراء في لمعة مبهجة، وتناثرت آلاف النجوم الياقوتية الذهبية لتعلن انتصار الهدوء!`,
        arGirl: (n) =>
          `وفِي تلك اللحظة التي اختارت فيها البطلة ${n} الهدوء.. «بوب!» انفرجت الفقاعة الحمراء في لمعة مبهجة، وتناثرت آلاف النجوم الياقوتية الذهبية لتعلن انتصار الهدوء!`,
        en: (n) =>
          `At that very moment as ${n} chose peace—POP! The red bubble burst in a dazzling shower of golden-ruby sparkles, celebrating triumphant inner peace!`,
        action: (n) =>
          `${n} laughing joyfully with arms wide as glittering ruby and golden sparkles burst harmlessly around them in the bright sun.`,
        environment: () =>
          `Playroom bursting with radiant sparkling confetti-bubbles and warm Pixar volumetric celebration lighting.`,
      },
      {
        arBoy: (n) =>
          `بنى ${n} قلعة مذهلة تفوق كل ما بنى، وغمره شعور رائع بالفخر وهو يعلم أن سر القوة الحقيقية يبدأ دائماً من قلبه الهادئ.`,
        arGirl: (n) =>
          `بنت ${n} قلعة مذهلة تفوق كل ما بنت، وغمرها شعور رائع بالفخر وهي تعلم أن سر القوة الحقيقية يبدأ دائماً من قلبها الهادئ.`,
        en: (n) =>
          `${n} rebuilt a magnificent castle taller than ever, heart singing with pride, knowing true superpower begins with inner calm.`,
        action: (n) =>
          `${n} admiring a towering colorful block castle with a beaming triumphant smile, glowing in cozy afternoon warmth.`,
        environment: () =>
          `Cozy sun-drenched playroom with a grand completed block castle and soft warm ambient glow, perfect ending scene.`,
      },
    ],
  },

  // 2. ORANGE BUBBLE: EMPATHY & KINDNESS
  {
    id: 'orange_empathy',
    color: 'Orange',
    colorHex: '#F97316',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    icon: '🟠',
    labelAr: 'فقاعة التعاطف ومراعاة المشاعر',
    labelEn: 'Bubble of Empathy (Teasing & Hurting Others)',
    struggleAr: 'الميل للأذى، السخرية، وعدم الاكتراث بمشاعر الآخرين',
    struggleEn: 'Hurtfulness, Teasing & Lack of Emotional Awareness',
    virtueAr: 'التعاطف، وضع النفس مكان الآخرين، والكلمة الطيبة',
    virtueEn: 'Empathy, Perspective-Taking & Comforting Kindness',
    realWorldSetupAr:
      'في ساحة اللعب، تعثر صديق صغير وسقطت ألعابه في التراب وبكى، بينما كان البطل على وشك أن يضحك أو يتركه دون مبالاة.',
    realWorldSetupEn:
      'On the playground, a little friend tripped, dropping their favorite toys in the dirt and crying, while others were tempted to laugh or walk away.',
    popBreakthroughAr:
      'يمد البطل يده بحنان، يساعد الصديق الباكي، ويقول: "أنا معك، لا تحزن!" فتنفجر الفقاعة البرتقالية ببريق دافئ ملؤه المحبة!',
    popBreakthroughEn:
      'They kneel gently, offering a helping hand: "I am right here with you, let\'s fix it together!" The orange bubble pops in a burst of warm golden starlight!',
    lightingPrompt:
      'Warm golden-amber and peach volumetric lighting, tender sunset glow, soft emotional highlights, deep tranquil lower frame.',
    colorPalette: ['#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#9A3412'],
    boyOutfit:
      'warm amber-orange windbreaker jacket with golden explorer trims, comfortable cargo pants, and bright sneakers',
    girlOutfit:
      'warm peach-and-amber explorer coat with golden buttons, comfortable leggings, and bright sneakers',
    signatureProp: 'a glowing golden heart keepsake with warm amber light',
    pose2Description:
      '(2) 3/4 view offering a warm helping hand forward with an empathetic, loving expression',
    outfit:
      'warm amber-orange windbreaker jacket with golden explorer trims, comfortable cargo pants, and bright sneakers',
    prop: 'a glowing golden heart keepsake with warm amber light',
    pose2:
      '(2) 3/4 view offering a warm helping hand forward with an empathetic, loving expression',
    merchandiseHintAr: 'حقيبة مستكشف بابل فيرس وسترة بابل فيرس',
    merchandiseHintEn: 'Bubbleverse Explorer Backpack and Adventure Jacket',
    beats: [
      {
        arBoy: (n) =>
          `في حديقة الحي، كان ${n} يركض بحماس، حين رأى طفلاً صغيراً يتعثر وتسقط لعبته المفضلة وتنكسر في التراب.`,
        arGirl: (n) =>
          `في حديقة الحي، كانت ${n} تركض بحماس، حين رأت طفلاً صغيراً يتعثر وتسقط لعبته المفضلة وتنكسر في التراب.`,
        en: (n) =>
          `In the neighborhood park, ${n} was running joyfully when a little child tripped, dropping their favorite toy in the sandbox.`,
        action: (n) =>
          `${n} pausing on the playground path, watching a smaller child sitting in the sand with teary eyes beside a dropped toy.`,
        environment: () =>
          `Sunlit neighborhood playground with swings and sandbox, warm golden afternoon light with soft contrast.`,
      },
      {
        arBoy: (n) =>
          `تردد ${n} للحظة، وفكر أن يبتعد أو يضحك كما فعل بعض الصغار، وشعر بحيرة باردة في قلبه.`,
        arGirl: (n) =>
          `ترددت ${n} للحظة، وفكرت أن تبتعد أو تضحك كما فعل بعض الصغار، وشعرت بحيرة باردة في قلبها.`,
        en: (n) =>
          `${n} hesitated for a moment, tempted to laugh or walk away like the other kids, feeling a sudden chill of uncertainty.`,
        action: (n) =>
          `${n} standing still with a conflicted look, torn between looking away or stepping forward to help.`,
        environment: () =>
          `Playground scene with soft amber shadows casting long lines, isolating the moment of choice.`,
      },
      {
        arBoy: (n) =>
          `وفجأة، تشكلت حول ${n} فقاعة برتقالية دافئة كشعاع شمس غاربة، حملته بلطف إلى وادي المرايا الذهبية.`,
        arGirl: (n) =>
          `وفجأة، تشكلت حول ${n} فقاعة برتقالية دافئة كشعاع شمس غاربة، حملتها بلطف إلى وادي المرايا الذهبية.`,
        en: (n) =>
          `Suddenly, a warm orange bubble wrapped around ${n} like a sunset embrace, lifting them softly into the Valley of Golden Mirrors.`,
        action: (n) =>
          `${n} encased inside a luminous amber-orange soap bubble, gazing out with wonder as the surroundings shift magically.`,
        environment: () =>
          `Whimsical meadow glowing in warm amber and honey-peach sunset colors, soft luminous reflections swirling.`,
      },
      {
        arBoy: (n) =>
          `داخل الفقاعة، شاهد ${n} مرآة المشاعر؛ فرأى في انعكاسها دموع الطفل الصغير وشعر بما في قلبه من حزن ووحدة.`,
        arGirl: (n) =>
          `داخل الفقاعة، شاهدت ${n} مرآة المشاعر؛ فرأت في انعكاسها دموع الطفل الصغير وشعرت بما في قلبه من حزن ووحدة.`,
        en: (n) =>
          `Inside the bubble, ${n} peered into the Mirror of Feelings, feeling the sting of the little friend's sadness as if it were their own.`,
        action: (n) =>
          `${n} gently placing a hand against the inside of the orange bubble, eyes softening with deep caring empathy.`,
        environment: () =>
          `Enchanted pool of warm golden water reflecting emotional memories like glowing lanterns in the dusk.`,
      },
      {
        arBoy: (n) =>
          `أخرج ${n} من حقيبة المستكشف منديلاً لطيفاً ولعبة صغيرة، وأدرك أن القوة الحقيقية هي أن تكون بلسماً لقلب مجروح.`,
        arGirl: (n) =>
          `أخرجت ${n} من حقيبة المستكشف منديلاً لطيفاً ولعبة صغيرة، وأدركت أن القوة الحقيقية هي أن تكون بلسماً لقلب مجروح.`,
        en: (n) =>
          `From their Bubbleverse Explorer Backpack, ${n} pulled out a clean handkerchief and a tiny toy, realizing kindness is the greatest superpower.`,
        action: (n) =>
          `${n} reaching into their backpack inside the orange bubble, holding a warm comforting token with a heartfelt smile.`,
        environment: () =>
          `Warm amber garden with glowing blossoms that bloom only when gentle, loving words are whispered.`,
      },
      {
        arBoy: (n) =>
          `تألقت الفقاعة البرتقالية بنور زاهٍ دون أن تنكسر، وغمرت قلب ${n} بالدفء وهو يتدرب على نطق الكلمات الطيبة التي تمسح الدموع.`,
        arGirl: (n) =>
          `تألقت الفقاعة البرتقالية بنور زاهٍ دون أن تنكسر، وغمرت قلب ${n} بالدفء وهي تتدرب على نطق الكلمات الطيبة التي تمسح الدموع.`,
        en: (n) =>
          `The orange bubble glowed brighter without popping, warming ${n}'s heart as they practiced the healing words of comfort.`,
        action: (n) =>
          `${n} smiling warmly inside the intact orange bubble, cupping their hands in a gesture of caring protection.`,
        environment: () =>
          `Sunset peach and apricot clouds dancing outside the bubble, volumetric rays of tender light.`,
      },
      {
        arBoy: (n) =>
          `تعلم ${n} أن معاملة الآخرين كما يحب أن يعاملوه هي شعلة النور التي تجعل العالم مكاناً جميلاً لكل طفل.`,
        arGirl: (n) =>
          `تعلمت ${n} أن معاملة الآخرين كما تحب أن يعاملوها هي شعلة النور التي تجعل العالم مكاناً جميلاً لكل طفل.`,
        en: (n) =>
          `${n} learned the golden rule: treating others as you wish to be treated lights up the world with joy.`,
        action: (n) =>
          `${n} nodding with understanding, clutching the glowing amber heart keepsake close with a tender expression.`,
        environment: () =>
          `Golden twilight sky dotted with warm amber floating lanterns drifting peacefully.`,
      },
      {
        arBoy: (n) =>
          `حملت الفقاعة البرتقالية البطل ${n} في طريق العودة، وحافظت على تماسكها ونورها الصافي حتى هبطت في الحديقة.`,
        arGirl: (n) =>
          `حملت الفقاعة البرتقالية البطلة ${n} في طريق العودة، وحافظت على تماسكها ونورها الصافي حتى هبطت في الحديقة.`,
        en: (n) =>
          `The orange bubble carried ${n} safely back, keeping its glowing form intact until it touched down softly in the park.`,
        action: (n) =>
          `${n} gliding back to the park pathway, standing gracefully inside the translucent orange bubble.`,
        environment: () =>
          `The playground sandbox reappearing in warm late-afternoon sunlight, the crying child still seated there.`,
      },
      {
        arBoy: (n) =>
          `وجد ${n} نفسه مجدداً بجانب الطفل الباكي؛ فلم يتردد ولم يتراجع، بل تقدم بخطوات واثقة حانية.`,
        arGirl: (n) =>
          `وجدت ${n} نفسها مجدداً بجانب الطفل الباكي؛ فلم تتردد ولم تتراجع، بل تقدمت بخطوات واثقة حانية.`,
        en: (n) =>
          `Standing beside the crying friend once more, ${n} didn't hesitate for a single second.`,
        action: (n) =>
          `${n} kneeling gently in the sand beside the fallen friend, extending an open caring hand.`,
        environment: () =>
          `Sun-dappled sandbox, gentle warm breeze, the amber bubble shimmering tenderly around the children.`,
      },
      {
        arBoy: (n) =>
          `جلس ${n} في التراب إلى جواره، ومسح دموعه بلطف وقال مبتسماً: «لا تحزن يا صديقي، أنا هنا معك وسنصلح اللعبة معاً!»`,
        arGirl: (n) =>
          `جلست ${n} في التراب إلى جواره، ومسحت دموعه بلطف وقالت مبتسمة: «لا تحزن يا صديقي، أنا هنا معك وسنصلح اللعبة معاً!»`,
        en: (n) =>
          `${n} knelt down, wiped away the tear gently, and offered a warm smile: "Don't worry, my friend! I am right here, let's fix it together!"`,
        action: (n) =>
          `${n} offering their own favorite toy to the little friend while helping them stand up with a loving smile.`,
        environment: () =>
          `Intimate heartwarming park scene, the little friend's face lighting up with relief and surprise.`,
      },
      {
        arBoy: (n) =>
          `وفِي لحظة العطف التي مد فيها البطل ${n} يده.. «بوب!» انفرجت الفقاعة البرتقالية في لمعة سحرية وتطايرت قلوب ذهبية ملأت المكان بالدفء والضحكات!`,
        arGirl: (n) =>
          `وفِي لحظة العطف التي مدت فيها البطلة ${n} يدها.. «بوب!» انفرجت الفقاعة البرتقالية في لمعة سحرية وتطايرت قلوب ذهبية ملأت المكان بالدفء والضحكات!`,
        en: (n) =>
          `In that moment of pure kindness from ${n}—POP! The orange bubble burst into a shower of golden hearts and sunny sparkles of empathy!`,
        action: (n) =>
          `${n} laughing with open arms as glittering amber-gold sparkles cascade around both children on the playground.`,
        environment: () =>
          `Playground illuminated by radiant golden sunset sparkles, floating amber confetti, cheerful heartwarming atmosphere.`,
      },
      {
        arBoy: (n) =>
          `تعالت ضحكات الصديقين وهما يبنيان قصراً رائعاً من الرمال، وشعر ${n} بسعادة غامرة لأن التعاطف هو أجمل هدية نمنحها للآخرين.`,
        arGirl: (n) =>
          `تعالت ضحكات الصديقين وهما يبنيان قصراً رائعاً من الرمال، وشعرت ${n} بسعادة غامرة لأن التعاطف هو أجمل هدية نمنحها للآخرين.`,
        en: (n) =>
          `Laughter echoed as both friends built a wonderful sandcastle together, ${n}'s heart glowing with the everlasting warmth of true kindness.`,
        action: (n) =>
          `${n} high-fiving the smiling friend over a grand sandcastle in the warm twilight glow.`,
        environment: () =>
          `Golden-hour playground with two happy children playing together, long peaceful shadows, serene closing frame.`,
      },
    ],
  },

  // 3. YELLOW BUBBLE: HONESTY & INTEGRITY
  {
    id: 'yellow_honesty',
    color: 'Yellow',
    colorHex: '#EAB308',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: '🟡',
    labelAr: 'فقاعة الصدق والأمانة',
    labelEn: 'Bubble of Honesty (Lying & Hiding Mistakes)',
    struggleAr: 'الخوف من الاعتراف بالخطأ، الكذب لتفادي العقاب، وأخذ ما ليس له',
    struggleEn: 'Lying to Avoid Punishment, Hiding Mistakes & Dishonesty',
    virtueAr: 'شجاعة قول الصدق، راحة الضمير، وتحمل المسؤولية',
    virtueEn: 'Courage of Truthfulness, Clear Conscience & Accountability',
    realWorldSetupAr:
      'في صالة البيت، انكسرت زهرية أمي المفضلة أثناء اللعب، فخفق قلب البطل خوفاً وفكّر في إخفاء الحقيقة أو لوم غيره.',
    realWorldSetupEn:
      'In the living room, a favorite ceramic vase slipped and shattered during play. Panic struck, tempting them to hide the pieces or blame someone else.',
    popBreakthroughAr:
      'يقف البطل بشجاعة وينظر في عيني والديه قائلاً: "أنا آسف.. أنا من فعل ذلك وأردت أن أكون صادقاً!" فتنفجر الفقاعة بنور ذهبي وهاج!',
    popBreakthroughEn:
      'Looking bravely into their parents\' eyes, they say: "I am sorry, it was an accident by me. I want to tell the truth!" The yellow bubble pops with radiant starlight!',
    lightingPrompt:
      'Radiant sunbeam-gold and topaz illumination, bright crystal reflections, warm pure daylight, soft shadow floor for text contrast.',
    colorPalette: ['#EAB308', '#FACC15', '#FDE047', '#FEF08A', '#854D0E'],
    boyOutfit:
      'sunlit-yellow and navy junior detective explorer vest, crisp white shirt, and smart sneakers',
    girlOutfit:
      'sunlit-yellow and white explorer tunic with golden stitching, neat shorts, and bright sneakers',
    signatureProp: 'a radiant golden key of truth shining with pure sunbeams',
    pose2Description:
      '(2) 3/4 view holding a radiant golden key of truth with an honest, brave smile',
    outfit:
      'sunlit-yellow and navy junior detective explorer vest, crisp white shirt, and smart sneakers',
    prop: 'a radiant golden key of truth shining with pure sunbeams',
    pose2:
      '(2) 3/4 view holding a radiant golden key of truth with an honest, brave smile',
    merchandiseHintAr: 'مصباح بابل فيرس الليلي الدافئ وحقيبة المستكشف',
    merchandiseHintEn: 'Bubbleverse Bedtime Night Lamp and Explorer Backpack',
    beats: [
      {
        arBoy: (n) =>
          `كان البطل ${n} يلعب بالكرة في الصالة، فاصطدمت بزهرية جميلة وسقطت على الأرض وانكسرت إلى قطع صغيرة!`,
        arGirl: (n) =>
          `كانت البطلة ${n} تلعب بالكرة في الصالة، فاصطدمت بزهرية جميلة وسقطت على الأرض وانكسرت إلى قطع صغيرة!`,
        en: (n) =>
          `While ${n} was playing with a soft ball in the living room, it bounced into a pretty vase and shattered on the floor!`,
        action: (n) =>
          `${n} standing frozen in the living room with wide startled eyes, looking down at broken porcelain pieces on the rug.`,
        environment: () =>
          `Bright sunny family living room, broken vase on carpet, warm natural light through lace curtains.`,
      },
      {
        arBoy: (n) =>
          `خفق قلب ${n} بشدة وفكّر في إخفاء القطع تحت الأريكة أو القول بأن الريح أسقطتها لتفادي اللوم.`,
        arGirl: (n) =>
          `خفق قلب ${n} بشدة وفكّرت في إخفاء القطع تحت الأريكة أو القول بأن الريح أسقطتها لتفادي اللوم.`,
        en: (n) =>
          `${n}'s heart raced with fear, sorely tempted to hide the shards under the couch or blame the breeze.`,
        action: (n) =>
          `${n} hugging the ball tightly to their chest, bite on the lip, wrestling with a heavy knot of worry.`,
        environment: () =>
          `Living room with dramatic contrasting sunlight and deep shadows, highlighting internal turmoil.`,
      },
      {
        arBoy: (n) =>
          `في تلك اللحظة الحرجة، تدفقت خيوط شمسية ذهبية وشكلت فقاعة صفراء وهاجة أحاطت بـ ${n} بلطف.`,
        arGirl: (n) =>
          `في تلك اللحظة الحرجة، تدفقت خيوط شمسية ذهبية وشكلت فقاعة صفراء وهاجة أحاطت بـ ${n} بلطف.`,
        en: (n) =>
          `At that crucial second, radiant golden sunbeams spun into a luminous yellow bubble gently surrounding ${n}.`,
        action: (n) =>
          `${n} surrounded safely by a warm yellow translucent bubble, the worried expression relaxing into wonder.`,
        environment: () =>
          `Swirling golden-yellow light rays, floating dust motes turning into tiny brilliant stars inside the room.`,
      },
      {
        arBoy: (n) =>
          `ارتفعت الفقاعة الصفراء بـ ${n} إلى حديقة الحقيقة الصافية، حيث كل كلمة تقال تتحول إلى زهرة نور تضيء المكان.`,
        arGirl: (n) =>
          `ارتفعت الفقاعة الصفراء بـ ${n} إلى حديقة الحقيقة الصافية، حيث كل كلمة تقال تتحول إلى زهرة نور تضيء المكان.`,
        en: (n) =>
          `The yellow bubble floated upward carrying ${n} to the Garden of Clear Truth, where every spoken word blossomed into a flower of pure light.`,
        action: (n) =>
          `${n} floating inside the yellow bubble, gazing down at luminous crystalline flowers shimmering below.`,
        environment: () =>
          `Garden of Clear Truth with topaz and citrine crystalline paths under a brilliant daylight sky.`,
      },
      {
        arBoy: (n) =>
          `رأى ${n} أن الكذبة تشبه حجراً ثقيلاً أسود يثقل القلب، بينما الصدق يشبه أجنحة ذهبية تجعل الروح خفيفة تطير.`,
        arGirl: (n) =>
          `رأت ${n} أن الكذبة تشبه حجراً ثقيلاً أسود يثقل القلب، بينما الصدق يشبه أجنحة ذهبية تجعل الروح خفيفة تطير.`,
        en: (n) =>
          `${n} saw that lies were heavy dark stones that weigh down the chest, while honesty was a pair of golden wings.`,
        action: (n) =>
          `${n} placing a hand over their chest inside the bubble, feeling the heavy worry melt away into sunny lightness.`,
        environment: () =>
          `Hall of Golden Chimes where harmonious musical chimes ring whenever the truth is honored.`,
      },
      {
        arBoy: (n) =>
          `أضاء مصباح بابل فيرس الليلي بنور ذهبي دافئ، وذكّر ${n} بأن الأهل يحبوننا دائماً ويقدّرون شجاعتنا عندما نعترف بخطئنا.`,
        arGirl: (n) =>
          `أضاء مصباح بابل فيرس الليلي بنور ذهبي دافئ، وذكّر ${n} بأن الأهل يحبوننا دائماً ويقدّرون شجاعتنا عندما نعترف بخطئنا.`,
        en: (n) =>
          `The warm Bubbleverse Bedtime Night Lamp glowed on a shelf, reminding ${n} that parents' love is unconditional when truth is spoken.`,
        action: (n) =>
          `${n} smiling with quiet confidence, holding the golden key of truth steady inside the yellow bubble.`,
        environment: () =>
          `Warm cozy starlight atmosphere inside the bubble, soft amber and topaz volumetric glow.`,
      },
      {
        arBoy: (n) =>
          `بقيت الفقاعة الصفراء متماسكة وقوية تحمي ${n} دون أن تنفجر، وهي تمنحه الشجاعة لمواجهة الموقف برجولة وثقة.`,
        arGirl: (n) =>
          `بقيت الفقاعة الصفراء متماسكة وقوية تحمي ${n} دون أن تنفجر، وهي تمنحها الشجاعة لمواجهة الموقف بثقة ونبل.`,
        en: (n) =>
          `The yellow bubble stayed strong and intact, never popping yet, giving ${n} the bravery to stand tall and speak truth.`,
        action: (n) =>
          `${n} standing tall with squared shoulders and honest, sparkling eyes inside the radiant yellow sphere.`,
        environment: () =>
          `Luminous golden archway opening toward the familiar family room with comforting daylight.`,
      },
      {
        arBoy: (n) =>
          `هبطت الفقاعة بسلام إلى الصالة، ليعود ${n} إلى اللحظة ذاتها التي انكسرت فيها الزهرية.`,
        arGirl: (n) =>
          `هبطت الفقاعة بسلام إلى الصالة، لتعود ${n} إلى اللحظة ذاتها التي انكسرت فيها الزهرية.`,
        en: (n) =>
          `Gently the yellow bubble descended, placing ${n} right back into the living room beside the broken vase.`,
        action: (n) =>
          `${n} standing on the living room rug, wrapped in the shimmering yellow bubble as footsteps approach.`,
        environment: () =>
          `Living room with sunlight pouring through the window, mom and dad walking in with questioning smiles.`,
      },
      {
        arBoy: (n) =>
          `دخل والدا ${n} الصالة وسألا بلطف: «ماذا حدث هنا يا بطل؟»`,
        arGirl: (n) =>
          `دخل والدا ${n} الصالة وسألا بلطف: «ماذا حدث هنا يا بطلة؟»`,
        en: (n) =>
          `Parents stepped into the room and asked gently: "What happened here, ${n}?"`,
        action: (n) =>
          `${n} looking straight into parents' eyes with respect, taking a steady calming breath.`,
        environment: () =>
          `Sunlit living room with parents standing warmly in doorway, golden dust motes swirling peacefully.`,
      },
      {
        arBoy: (n) =>
          `نظر ${n} في عينيهما بشجاعة وقال: «أنا آسف.. كنت ألعب بالكرة فسقطت الزهرية دون قصد. أردت أن أكون صادقاً معكما!»`,
        arGirl: (n) =>
          `نظرت ${n} في عينيهما بشجاعة وقالت: «أنا آسفة.. كنت ألعب بالكرة فسقطت الزهرية دون قصد. أردت أن أكون صادقة معكما!»`,
        en: (n) =>
          `${n} looked right into their eyes and spoke bravely: "I am sorry. I was playing with the ball and it knocked the vase. I want to tell the truth!"`,
        action: (n) =>
          `${n} speaking with an open, honest countenance and hands at sides, courageous and sincere.`,
        environment: () =>
          `A room filled with radiant morning light, parents' faces breaking into tender, admiring smiles.`,
      },
      {
        arBoy: (n) =>
          `وفِي تلك اللحظة التي نطق فيها البطل ${n} بالصدق.. «بوب!» انفرجت الفقاعة الصفراء في سيل من النجوم الذهبية والأنوار الدافئة احتفالاً بالصدق العظيم!`,
        arGirl: (n) =>
          `وفِي تلك اللحظة التي نطقت فيها البطلة ${n} بالصدق.. «بوب!» انفرجت الفقاعة الصفراء في سيل من النجوم الذهبية والأنوار الدافئة احتفالاً بالصدق العظيم!`,
        en: (n) =>
          `At that heroic moment as ${n} spoke the truth—POP! The yellow bubble burst in a dazzling shower of golden confetti, celebrating the power of honesty!`,
        action: (n) =>
          `${n} laughing as parents envelop them in a giant warm hug while golden sparkles rain down joyously.`,
        environment: () =>
          `Living room transformed into a sparkling celebration of love and trust, rich volumetric Pixar light.`,
      },
      {
        arBoy: (n) =>
          `عانقه والداه بحب وقالا: «الزهرية يمكن تعويضها، لكن صدقك وأمانتك هما أغلى ما نملك!» فشعر ${n} بخفة وسعادة لا توصف.`,
        arGirl: (n) =>
          `عانقها والداها بحب وقالا: «الزهرية يمكن تعويضها، لكن صدقك وأمانتك هما أغلى ما نملك!» فشعرت ${n} بخفة وسعادة لا توصف.`,
        en: (n) =>
          `Hugging ${n} tightly, parents whispered: "Vases can be replaced, but your honesty is our greatest treasure!"`,
        action: (n) =>
          `${n} happily helping sweep the broken pieces together with parents, beaming with pure clear conscience.`,
        environment: () =>
          `Warm cheerful family room, sweeping up together, feeling lighter than a feather in the golden sun.`,
      },
    ],
  },

  // 4. GREEN BUBBLE: REAL-WORLD ADVENTURES & SOCIAL CONNECTION
  {
    id: 'green_realworld',
    color: 'Green',
    colorHex: '#22C55E',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: '🟢',
    labelAr: 'فقاعة مغامرات الواقع والتواصل',
    labelEn: 'Bubble of Real-World Wonder (Screen Addiction)',
    struggleAr: 'إدمان الشاشات، العزلة الرقمية، والانطوائية عن العائلة',
    struggleEn: 'Screen Addiction, Digital Trance & Social Isolation',
    virtueAr: 'حب استكشاف الطبيعة، اللعب الحركي، والتواصل الأسري',
    virtueEn: 'Real-World Wonder, Tactile Play & Outdoor Family Bonding',
    realWorldSetupAr:
      'كان البطل ملتصقاً بشاشة جهازه اللوحي بعينين شاردتين، رافضاً الخروج إلى الحديقة أو الحديث مع أسرته وسط طقس ربيعي بديع.',
    realWorldSetupEn:
      'Glued to a glowing tablet screen with tired glazed eyes, they tuned out the bright sunny garden, refusing to step outside with family.',
    popBreakthroughAr:
      'يغلق البطل الشاشة طواعية، يرتدي حذاءه الرياضي وينطلق للحديقة صائحاً: "هيا نستكشف العالم الحقيقي معاً!" فتنفجر الفقاعة الخضراء ببهجة ربيعية!',
    popBreakthroughEn:
      'They willingly shut off the tablet, lace up their shoes, and dash outside: "Let\'s explore the real world together!" The green bubble pops with emerald flower petals!',
    lightingPrompt:
      'Vibrant emerald, jade, and sun-dappled botanical lighting, fresh morning dew sparkles, rich natural contrast.',
    colorPalette: ['#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0', '#166534'],
    boyOutfit:
      'forest-green explorer scout jacket with botanical patches, khaki adventure shorts, and trail sneakers',
    girlOutfit:
      'emerald explorer scout jacket with leafy badges, outdoor cargo shorts, and trail sneakers',
    signatureProp: 'a brass scout magnifying glass inspecting a sparkling morning leaf',
    pose2Description:
      '(2) 3/4 view holding a brass scout magnifying glass looking excitedly at the viewer',
    outfit:
      'forest-green explorer scout jacket with botanical patches, khaki adventure shorts, and trail sneakers',
    prop: 'a brass scout magnifying glass inspecting a sparkling morning leaf',
    pose2:
      '(2) 3/4 view holding a brass scout magnifying glass looking excitedly at the viewer',
    merchandiseHintAr: 'حقيبة مستكشف بابل فيرس المجهزة بعدسة مكبرة وعلبة ماء',
    merchandiseHintEn: 'Bubbleverse Explorer Backpack packed with a magnifying glass and adventure gear',
    beats: [
      {
        arBoy: (n) =>
          `كان ${n} جالساً في غرفته المعتمة، وعيناه مسمّرتان على شاشة الجهاز اللوحي المتوهجة، بينما تغرد العصافير في الحديقة المشمسة.`,
        arGirl: (n) =>
          `كانت ${n} جالسة في غرفتها المعتمة، وعيناها مسمّرتان على شاشة الجهاز اللوحي المتوهجة، بينما تغرد العصافير في الحديقة المشمسة.`,
        en: (n) =>
          `${n} sat in a dim bedroom, eyes glued to the glowing tablet screen, ignoring the cheerful birds singing in the sunny yard.`,
        action: (n) =>
          `${n} slumped on a beanbag chair with blue light reflecting on their tired face, tapping a glass screen absently.`,
        environment: () =>
          `Dim bedroom with curtains drawn, harsh cyan tablet glow contrasting with a sliver of brilliant outdoor daylight.`,
      },
      {
        arBoy: (n) =>
          `نادت والدة ${n} عليه لتناول الفاكهة في الحديقة، لكنه تذمر وقال: «خمس دقائق فقط!» وهو يغرق أكثر في ألعاب الشاشة.`,
        arGirl: (n) =>
          `نادت والدة ${n} عليها لتناول الفاكهة في الحديقة، لكنها تذمرت وقالت: «خمس دقائق فقط!» وهي تغرق أكثر في ألعاب الشاشة.`,
        en: (n) =>
          `Mother called from the sunny doorway to share fresh fruit outside, but ${n} groaned: "Just five more minutes!" without looking up.`,
        action: (n) =>
          `${n} waving a dismissive hand toward the door without taking eyes off the bright screen, shoulders hunched.`,
        environment: () =>
          `Doorway glowing with warm natural green garden light while the room stays dim and isolated.`,
      },
      {
        arBoy: (n) =>
          `وفجأة، انبثقت فقاعة خضراء زمردية تفوح منها رائحة النعناع والمطر، وأحاطت بـ ${n} وغطت الشاشة بضباب ندي رقيق.`,
        arGirl: (n) =>
          `وفجأة، انبثقت فقاعة خضراء زمردية تفوح منها رائحة النعناع والمطر، وأحاطت بـ ${n} وغطت الشاشة بضباب ندي رقيق.`,
        en: (n) =>
          `Suddenly, an emerald-green bubble smelling of mint and fresh rain swirled up, enveloping ${n} and misting the glass screen gently.`,
        action: (n) =>
          `${n} looking up in surprise as a translucent leaf-green bubble forms around them, blocking the cold blue pixels.`,
        environment: () =>
          `Whimsical transformation with swirling botanical ribbons and dew drops floating in volumetric green light.`,
      },
      {
        arBoy: (n) =>
          `حلقت الفقاعة الخضراء بـ ${n} إلى غابة الحواس الحية، حيث تتمايل أغصان الأشجار العملاقة وتهب نسائم حقيقية تداعب الخدود.`,
        arGirl: (n) =>
          `حلقت الفقاعة الخضراء بـ ${n} إلى غابة الحواس الحية، حيث تتمايل أغصان الأشجار العملاقة وتهب نسائم حقيقية تداعب الخدود.`,
        en: (n) =>
          `The green bubble carried ${n} into the Living Forest of Wonder, where giant mossy trees swayed in real, fragrant breezes.`,
        action: (n) =>
          `${n} floating inside the green bubble with eyes wide open, breathing in fresh pine air with a delighted smile.`,
        environment: () =>
          `Breathtaking enchanted forest canopy with sunlight filtering through emerald leaves, waterfall mist in the background.`,
      },
      {
        arBoy: (n) =>
          `أخرج ${n} عدسة الاستكشاف من حقيبة بابل فيرس، وفحص قطرة ندى على ورقة شجر، فرأى فيها عالماً كاملاً يفوق كل الشاشات!`,
        arGirl: (n) =>
          `أخرجت ${n} عدسة الاستكشاف من حقيبة بابل فيرس، وفحصت قطرة ندى على ورقة شجر، فرأت فيها عالماً كاملاً يفوق كل الشاشات!`,
        en: (n) =>
          `Pulling a magnifying glass from their Bubbleverse Explorer Backpack, ${n} inspected a glistening dewdrop and spotted a tiny ladybug!`,
        action: (n) =>
          `${n} peering through a brass magnifying glass inside the bubble, face lit with genuine awe at real nature.`,
        environment: () =>
          `Enchanted macro-nature glade with glowing clover, dewdrops acting like prisms of rainbow light.`,
      },
      {
        arBoy: (n) =>
          `شعر ${n} بدفء الشمس الحقيقية على وجهه ونبض قلبه ينبض بالنشاط، وأدرك أن ركض دقيقة في الطبيعة أروع من ساعات خلف الزجاج.`,
        arGirl: (n) =>
          `شعرت ${n} بدفء الشمس الحقيقية على وجهها ونبض قلبها ينبض بالنشاط، وأدركت أن ركض دقيقة في الطبيعة أروع من ساعات خلف الزجاج.`,
        en: (n) =>
          `${n} felt the warmth of real sun on their cheeks and their heart beating with energy, realizing the real world is infinitely more magical.`,
        action: (n) =>
          `${n} stretching arms wide inside the bubble, taking a deep breath of fresh air with a joyful, awake expression.`,
        environment: () =>
          `Lush mossy hill overlooking a sparkling river, sunbeams dancing through giant cedar branches.`,
      },
      {
        arBoy: (n) =>
          `ظلت الفقاعة الخضراء متماسكة تحمي البطل ${n} برفق دون أن تنفجر، وهي تملأ وجدانه بحب المغامرة واللعب الحركي مع الأهل والأصدقاء.`,
        arGirl: (n) =>
          `ظلت الفقاعة الخضراء متماسكة تحمي البطلة ${n} برفق دون أن تنفجر، وهي تملأ وجدانها بحب المغامرة واللعب الحركي مع الأهل والأصدقاء.`,
        en: (n) =>
          `The emerald bubble stayed solid and clear without popping, filling ${n}'s soul with the thirst for outdoor running and real laughter.`,
        action: (n) =>
          `${n} practicing a cheerful runner's pose inside the bubble, laughing happily with renewed vibrant energy.`,
        environment: () =>
          `Golden-green meadow carpeted with blooming wildflowers under a clear azure sky.`,
      },
      {
        arBoy: (n) =>
          `عادت الفقاعة بـ ${n} إلى غرفته، ليجد نفسه جالساً أمام الجهاز اللوحي، لكن عينيه الآن تفيضان بالحيوية والنشاط.`,
        arGirl: (n) =>
          `عادت الفقاعة بـ ${n} إلى غرفتها، لتجد نفسها جالسة أمام الجهاز اللوحي، لكن عينيها الآن تفيضان بالحيوية والنشاط.`,
        en: (n) =>
          `The green bubble guided ${n} back to the bedroom, touching down beside the silent glowing tablet.`,
        action: (n) =>
          `${n} standing up energetically from the beanbag chair, looking down at the tablet with clarity.`,
        environment: () =>
          `Bedroom now feeling bright as sunlight filters through curtains, the green bubble hovering softly.`,
      },
      {
        arBoy: (n) =>
          `مد ${n} يده وبكل إرادة وعزم، ضغط على زر إيقاف الشاشة، فانطفأ الضوء الأزرق ليعلن بداية مغامرة حقيقية!`,
        arGirl: (n) =>
          `مدت ${n} يدها وبكل إرادة وعزم، ضغطت على زر إيقاف الشاشة، فانطفأ الضوء الأزرق ليعلن بداية مغامرة حقيقية!`,
        en: (n) =>
          `With a resolute smile, ${n} reached down and pressed the power button, clicking the screen off completely!`,
        action: (n) =>
          `${n} clicking off the tablet with a decisive triumphant smile, turning immediately toward the sunlit door.`,
        environment: () =>
          `Sunbeams breaking into the room, illuminating the dark screen now put away on the desk.`,
      },
      {
        arBoy: (n) =>
          `ربط ${n} حذاءه الرياضي، وارتدى حقيبة مستكشف بابل فيرس، وركض نحو الباب صائحاً: «أمي! أبي! هيا نخرج إلى الحديقة!»`,
        arGirl: (n) =>
          `ربطت ${n} حذاءها الرياضي، وارتدت حقيبة مستكشف بابل فيرس، وركضت نحو الباب صائحة: «أمي! أبي! هيا نخرج إلى الحديقة!»`,
        en: (n) =>
          `Lacing up sneakers and strapping on the Bubbleverse Explorer Backpack, ${n} bolted toward the door: "Mom! Dad! Let's go outside!"`,
        action: (n) =>
          `${n} leaping joyfully toward the sunlit garden doorway with open arms and boundless energy.`,
        environment: () =>
          `Sunny open garden patio filled with blooming flowers, welcoming parents smiling warmly in the yard.`,
      },
      {
        arBoy: (n) =>
          `وفِي عتبة الباب حيث انطلق البطل ${n}.. «بوب!» انفرجت الفقاعة الخضراء في رذاذ من أوراق الشجر الزمردية وبتلات الياسمين العطرة!`,
        arGirl: (n) =>
          `وفِي عتبة الباب حيث انطلقت البطلة ${n}.. «بوب!» انفرجت الفقاعة الخضراء في رذاذ من أوراق الشجر الزمردية وبتلات الياسمين العطرة!`,
        en: (n) =>
          `Right at the threshold as ${n} bounded outside—POP! The green bubble burst in an exhilarating shower of emerald petals and sparkling dewdrops!`,
        action: (n) =>
          `${n} leaping across the lawn as emerald leaf-sparkles swirl playfully around them in the warm breeze.`,
        environment: () =>
          `Vibrant sunny backyard garden bursting with radiant green grass, blooming flowerbeds, and golden sunlight.`,
      },
      {
        arBoy: (n) =>
          `ركض ${n} حافي القدمين على العشب الرطب ولعب الكرة مع عائلته، وشعر بسعادة حقيقية لا تضاهيها أي شاشة في العالم.`,
        arGirl: (n) =>
          `ركضت ${n} حافية القدمين على العشب الرطب ولعبت الكرة مع عائلتها، وشعرت بسعادة حقيقية لا تضاهيها أي شاشة في العالم.`,
        en: (n) =>
          `${n} dashed across the lawn, playing ball and chasing butterflies with family, heart brimming with real-world sunshine.`,
        action: (n) =>
          `${n} laughing and kicking a soccer ball across lush green grass with family, glowing with health and happiness.`,
        environment: () =>
          `Warm afternoon garden with family playing together, golden sunshine filtering through trees, blissful closing frame.`,
      },
    ],
  },

  // 5. BLUE BUBBLE: COURAGE & SELF-CONFIDENCE
  {
    id: 'blue_courage',
    color: 'Blue',
    colorHex: '#3B82F6',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    icon: '🔵',
    labelAr: 'فقاعة الشجاعة والثقة بالنفس',
    labelEn: 'Bubble of Courage (Shyness & Self-Doubt)',
    struggleAr: 'الخجل الشديد، الخوف من تجربة الجديد، والتردد أمام الآخرين',
    struggleEn: 'Shyness, Stage Fright & Fear of New Challenges',
    virtueAr: 'الشجاعة، الإقدام، الثقة بالنفس، والاعتزاز بالقدرات',
    virtueEn: 'Roaring Bravery, Self-Belief & Stepping Forward Boldly',
    realWorldSetupAr:
      'وقف البطل عند مدخل مسرح المدرسة والجميع ينتظر دوره، فارتجفت ركبتاه وهمس صوته الداخلي: "لا أستطيع.. سأفشل بالتأكيد!"',
    realWorldSetupEn:
      'Standing at the wings of the school stage with the audience waiting, knees trembled as an inner voice whispered: "I can\'t do it, I\'ll fail!"',
    popBreakthroughAr:
      'يرفع البطل رأسه، يبتسم بثقة، ويخطو خطوته الأولى على المسرح بصوت شجاع: "أنا قادر على ذلك!" فتنفجر الفقاعة الزرقاء بنجوم نصر مبهرة!',
    popBreakthroughEn:
      'Lifting their chin with a brave smile, they step boldly onto the stage: "I can do this!" The blue bubble pops in a burst of sapphire starbursts!',
    lightingPrompt:
      'Radiant sapphire, electric cyan, and celestial azure volumetric lighting, starry sparkles, majestic Pixar contrast.',
    colorPalette: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#1E40AF'],
    boyOutfit:
      'royal sapphire-and-navy adventure jacket with silver courage star crest, dark pants, and brave explorer boots',
    girlOutfit:
      'royal sapphire-and-cyan adventure jacket with silver courage star crest, comfortable pants, and brave explorer boots',
    signatureProp: 'a glowing sapphire courage medallion with radiant silver light',
    pose2Description:
      '(2) 3/4 view standing tall in a heroic pose holding a glowing sapphire courage medallion',
    outfit:
      'royal sapphire-and-navy adventure jacket with silver courage star crest, dark pants, and brave explorer boots',
    prop: 'a glowing sapphire courage medallion with radiant silver light',
    pose2:
      '(2) 3/4 view standing tall in a heroic pose holding a glowing sapphire courage medallion',
    merchandiseHintAr: 'سترة بابل فيرس للمغامرات بنجمة الشجاعة الفضية',
    merchandiseHintEn: 'Bubbleverse Junior Adventure Jacket with silver courage star',
    beats: [
      {
        arBoy: (n) =>
          `وقف ${n} خلف ستارة مسرح المدرسة والجمهور ينتظر في القاعة، وشعر بضربات قلبه تتسارع كدقات طبول متتالية.`,
        arGirl: (n) =>
          `وقفت ${n} خلف ستارة مسرح المدرسة والجمهور ينتظر في القاعة، وشعرت بضربات قلبها تتسارع كدقات طبول متتالية.`,
        en: (n) =>
          `Behind the velvet school stage curtain, ${n} waited while the auditorium buzzed with people, heart thumping like a drum.`,
        action: (n) =>
          `${n} peeking nervously through a small gap in the velvet stage curtain, clutching hands together tightly.`,
        environment: () =>
          `School auditorium backstage, warm stage footlights glowing beneath dark red velvet curtains.`,
      },
      {
        arBoy: (n) =>
          `ارتجفت ركبتا ${n} وهمس صوته الداخلي: «ربما أنسى كلماتي.. ربما يضحك عليّ الجميع.. ليتني أستطيع الاختباء!»`,
        arGirl: (n) =>
          `ارتجفت ركبتا ${n} وهمس صوتها الداخلي: «ربما أنسى كلماتي.. ربما يضحك عليّ الجميع.. ليتني أستطيع الاختباء!»`,
        en: (n) =>
          `With knees shaking, ${n}'s inner voice whispered: "What if I forget my lines? What if they laugh? I wish I could hide!"`,
        action: (n) =>
          `${n} holding a crumpled script sheet, looking down at their trembling shoes in self-doubt.`,
        environment: () =>
          `Backstage wings with dramatic amber spotlight shadows accentuating the quiet moment of nervousness.`,
      },
      {
        arBoy: (n) =>
          `وفجأة، تلألأت في الهواء فقاعة زرقاء ملكية كأنها قطعة من سماء الليل المرصعة بالنجوم، وأحاطت بـ ${n} بدرع مضيء.`,
        arGirl: (n) =>
          `وفجأة، تلألأت في الهواء فقاعة زرقاء ملكية كأنها قطعة من سماء الليل المرصعة بالنجوم، وأحاطت بـ ${n} بدرع مضيء.`,
        en: (n) =>
          `Suddenly, a royal sapphire-blue bubble swirled from the air like a piece of starry midnight, wrapping ${n} in a shield of light.`,
        action: (n) =>
          `${n} enveloped in a translucent glowing blue soap bubble, feeling an immediate wave of serene protective warmth.`,
        environment: () =>
          `Mystical backstage transformation, swirling cyan and sapphire dust particles illuminating the child.`,
      },
      {
        arBoy: (n) =>
          `صعدت الفقاعة الزرقاء بـ ${n} إلى قمة جبل الشجاعة، حيث النسور تحلق في الأعالي والرياح القوية تعزف لحناً بطولياً.`,
        arGirl: (n) =>
          `صعدت الفقاعة الزرقاء بـ ${n} إلى قمة جبل الشجاعة، حيث النسور تحلق في الأعالي والرياح القوية تعزف لحناً بطولياً.`,
        en: (n) =>
          `The blue bubble carried ${n} to the Summit of Courage, where soaring eagles rode the winds across majestic mountain peaks.`,
        action: (n) =>
          `${n} floating inside the sapphire bubble overlooking breathtaking soaring mountain ridges, eyes widening with wonder.`,
        environment: () =>
          `Epic mountain vista with dramatic blue sky, golden sunrise lighting the snowy crests, volumetric clouds.`,
      },
      {
        arBoy: (n) =>
          `ارتدى ${n} سترة بابل فيرس للمغامرات ولمس شارة الشجاعة الفضية على صدره، فشعر بزئير أسد قوي يولد في داخله.`,
        arGirl: (n) =>
          `ارتدت ${n} سترة بابل فيرس للمغامرات ولمست شارة الشجاعة الفضية على صدرها، فشعرت بزئير أسد قوي يولد في داخلها.`,
        en: (n) =>
          `Zipping up their Bubbleverse Adventure Jacket, ${n} touched the silver star crest, feeling a lion's brave roar awaken within.`,
        action: (n) =>
          `${n} pulling the collar of their blue adventure jacket upright, chin lifting with growing inner power inside the bubble.`,
        environment: () =>
          `Luminous blue crystalline ledge, glowing azure stepping stones appearing ahead over the clouds.`,
      },
      {
        arBoy: (n) =>
          `اكتشف ${n} أن الشجاعة لا تعني ألا نخاف، بل تعني أن نرفع رؤوسنا ونخطو الخطوة الأولى رغم الخوف.`,
        arGirl: (n) =>
          `اكتشفت ${n} أن الشجاعة لا تعني ألا نخاف، بل تعني أن نرفع رؤوسنا ونخطو الخطوة الأولى رغم الخوف.`,
        en: (n) =>
          `${n} realized that bravery doesn't mean having zero fear—it means feeling the flutter and taking the step anyway!`,
        action: (n) =>
          `${n} stepping forward inside the blue bubble onto glowing blue stones that appear right beneath their feet.`,
        environment: () =>
          `A pathway of starlight bridge floating through the blue sky, sparkling constellations guiding the way.`,
      },
      {
        arBoy: (n) =>
          `حافظت الفقاعة الزرقاء على لمعانها وقوتها دون أن تنفجر، وهي تملأ روح ${n} بالثقة الراسخة بأن صوته يستحق أن يُسمع.`,
        arGirl: (n) =>
          `حافظت الفقاعة الزرقاء على لمعانها وقوتها دون أن تنفجر، وهي تملأ روح ${n} بالثقة الراسخة بأن صوتها يستحق أن يُسمع.`,
        en: (n) =>
          `The blue bubble held strong and unyielding without bursting, filling ${n}'s heart with certainty that their voice mattered.`,
        action: (n) =>
          `${n} smiling brightly with hands on hips in a classic superhero stance inside the glowing sapphire bubble.`,
        environment: () =>
          `Radiant azure aura radiating outward, majestic cinematic lighting, deep rich shadows in the foreground.`,
      },
      {
        arBoy: (n) =>
          `هبطت الفقاعة بـ ${n} بهدوء عائدةً إلى ما وراء الستارة، ليعود إلى مسرح المدرسة في اللحظة التي يُنادى فيها اسمه!`,
        arGirl: (n) =>
          `هبطت الفقاعة بـ ${n} بهدوء عائدةً إلى ما وراء الستارة، لتعود إلى مسرح المدرسة في اللحظة التي يُنادى فيها اسمها!`,
        en: (n) =>
          `Softly the blue bubble brought ${n} back to the wings of the stage, right as the announcer called their name!`,
        action: (n) =>
          `${n} standing at the stage entrance, surrounded by the subtle glow of the blue bubble, breathing with quiet confidence.`,
        environment: () =>
          `School stage wings with the bright golden stage lights shining right onto the entrance marks.`,
      },
      {
        arBoy: (n) =>
          `نادى المعلم: «والآن، نرحب بالبطل ${n}!» فارتفعت الأصوات بالتشجيع في القاعة.`,
        arGirl: (n) =>
          `نادت المعلمة: «والآن، نرحب بالبطلة ${n}!» فارتفعت الأصوات بالتشجيع في القاعة.`,
        en: (n) =>
          `The microphone chimed: "And now, please welcome our brave hero, ${n}!" Cheers rose from the audience.`,
        action: (n) =>
          `${n} standing tall, smiling warmly as stage light illuminates their radiant face.`,
        environment: () =>
          `Auditorium filled with warm audience silhouettes, bright golden stage follow-spot ready.`,
      },
      {
        arBoy: (n) =>
          `رفع ${n} رأسه بفخر، وخطا خطوته الأولى على المسرح بثقة وثبات، وبدأ يتحدث بصوت واضح واثق ملأ القاعة روعة.`,
        arGirl: (n) =>
          `رفعت ${n} رأسها بفخر، وخطت خطوتها الأولى على المسرح بثقة وثبات، وبدأت تتحدث بصوت واضح واثق ملأ القاعة روعة.`,
        en: (n) =>
          `Head held high, ${n} stepped boldly out into the spotlight, speaking with a crystal-clear, confident voice!`,
        action: (n) =>
          `${n} standing center stage under the golden spotlight with expressive open hands and a beaming confident smile.`,
        environment: () =>
          `Grand illuminated theater stage, warm amber footlights, beaming spotlight, captivated smiling audience.`,
      },
      {
        arBoy: (n) =>
          `وفِي تلك اللحظة المجيدة التي تقدم فيها البطل ${n}.. «بوب!» انفرجت الفقاعة الزرقاء في شلال من النجوم الياقوتية الزرقاء والألعاب النارية الخفيفة!`,
        arGirl: (n) =>
          `وفِي تلك اللحظة المجيدة التي تقدمت فيها البطلة ${n}.. «بوب!» انفرجت الفقاعة الزرقاء في شلال من النجوم الياقوتية الزرقاء والألعاب النارية الخفيفة!`,
        en: (n) =>
          `At that shining climax as ${n} stepped boldly into the light—POP! The blue bubble burst in a cascade of sapphire starbursts and joyous sparkles!`,
        action: (n) =>
          `${n} taking a proud bow as glittering blue starlight sparkles rain down amidst a standing ovation.`,
        environment: () =>
          `Auditorium roaring with enthusiastic applause, celebratory blue and gold confetti sparkles drifting in air.`,
      },
      {
        arBoy: (n) =>
          `صفق الجميع بحرارة للبطل ${n}، وغمرته سعادة غامرة وهو يعلم أن الشجاعة تصنع المعجزات وتفتح أبواب النجاح.`,
        arGirl: (n) =>
          `صفق الجميع بحرارة للبطلة ${n}، وغمرتها سعادة غامرة وهي تعلم أن الشجاعة تصنع المعجزات وتفتح أبواب النجاح.`,
        en: (n) =>
          `Rounds of applause filled the hall, and ${n}'s heart soared with joy, knowing true courage can conquer any mountain.`,
        action: (n) =>
          `${n} waving happily to cheering parents and friends from the center of the brightly lit stage.`,
        environment: () =>
          `Warm celebratory theater hall, flowers presented, beaming smiles, triumphant closing storybook frame.`,
      },
    ],
  },

  // 6. INDIGO BUBBLE: FRIENDSHIP & BELONGING
  {
    id: 'indigo_friendship',
    color: 'Indigo',
    colorHex: '#6366F1',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    icon: '🌌',
    labelAr: 'فقاعة الصداقة وبناء الجسور',
    labelEn: 'Bubble of Friendship (Loneliness & Isolation)',
    struggleAr: 'الوحدة، صعوبة بدء الحديث مع الآخرين، والعزلة في التجمعات',
    struggleEn: 'Loneliness, Social Isolation & Shyness in Group Settings',
    virtueAr: 'المبادرة بالتحية، مد جسور الود، وبناء الصداقات الصادقة',
    virtueEn: 'Reaching Out First, Warm Inclusivity & Building Friendships',
    realWorldSetupAr:
      'في الحديقة العامة، جلس البطل وحيداً على المقعد يضم ركبتيه ويراقب أطفالاً يلعبون بالكرة، متمنياً لو يشاركهم لكنه خاف من الرفض.',
    realWorldSetupEn:
      'In the public park, they sat alone on a wooden bench hugging their knees, watching kids kick a ball and wishing to join in, yet afraid of rejection.',
    popBreakthroughAr:
      'يقف البطل بابتسامة مشرقة، يتقدم نحوهم ويقول بلطف: "مرحباً.. هل يمكنني اللعب معكم؟" فتنفجر فقاعة الصداقة بنيزك من الفرح!',
    popBreakthroughEn:
      'Standing up with a warm smile, they walk over kindly: "Hello! Can I play with you?" The indigo bubble pops in a cascade of cosmic stardust!',
    lightingPrompt:
      'Deep celestial indigo, cosmic violet, and starry twilight illumination, shimmering stardust, cozy magical contrast.',
    colorPalette: ['#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#3730A3'],
    boyOutfit:
      'cosmic indigo-and-midnight explorer windbreaker with constellation prints, neat dark jeans, and galaxy sneakers',
    girlOutfit:
      'cosmic indigo-and-lavender explorer coat with constellation embroidery, neat pants, and galaxy sneakers',
    signatureProp: 'a glowing constellation star-orb with starlit indigo sparkles',
    pose2Description:
      '(2) 3/4 view holding an illuminated friendship constellation star-orb with a welcoming warm smile',
    outfit:
      'cosmic indigo-and-midnight explorer windbreaker with constellation prints, neat dark jeans, and galaxy sneakers',
    prop: 'a glowing constellation star-orb with starlit indigo sparkles',
    pose2:
      '(2) 3/4 view holding an illuminated friendship constellation star-orb with a welcoming warm smile',
    merchandiseHintAr: 'حقيبة مستكشف بابل فيرس وسترة بابل فيرس السماوية',
    merchandiseHintEn: 'Bubbleverse Explorer Backpack and Starry Galaxy Jacket',
    beats: [
      {
        arBoy: (n) =>
          `جلس ${n} وحيداً على مقعد خشبي في الحديقة العامة، يضم ركبتيه ويشاهد أطفالاً يلعبون بالكرة ويضحكون معاً.`,
        arGirl: (n) =>
          `جلست ${n} وحيدة على مقعد خشبي في الحديقة العامة، تضم ركبتيها وتشاهد أطفالاً يلعبون بالكرة ويضحكون معاً.`,
        en: (n) =>
          `On a wooden park bench, ${n} sat alone hugging their knees, watching a group of children laughing and passing a soccer ball.`,
        action: (n) =>
          `${n} sitting quietly on a park bench, looking wistfully toward a group of laughing kids playing in the distance.`,
        environment: () =>
          `Park in late afternoon light, green lawn, wooden bench under an oak tree, long gentle shadows.`,
      },
      {
        arBoy: (n) =>
          `تمنى ${n} في أعماقه لو يركض إليهم، لكن خجلاً صامتاً همس في أذنه: «ربما لا يريدون صديقاً جديداً!»`,
        arGirl: (n) =>
          `تمنت ${n} في أعماقها لو تركض إليهم، لكن خجلاً صامتاً همس في أذنها: «ربما لا يريدون صديقة جديدة!»`,
        en: (n) =>
          `In their heart ${n} wished to join, but a quiet fear whispered: "Maybe they don't want a new friend."`,
        action: (n) =>
          `${n} looking down at their sneakers, clutching a small colorful ball in their lap with shy hesitation.`,
        environment: () =>
          `Park path with lavender twilight shades creeping softly across the grass, highlighting quiet loneliness.`,
      },
      {
        arBoy: (n) =>
          `وفجأة، دارت في الهواء فقاعة نيلية كونية كالنجوم اللامعة، واحتضنت ${n} برفق ونقلته إلى فضاء الصداقة الساحر.`,
        arGirl: (n) =>
          `وفجأة، دارت في الهواء فقاعة نيلية كونية كالنجوم اللامعة، واحتضنت ${n} برفق ونقلتها إلى فضاء الصداقة الساحر.`,
        en: (n) =>
          `Suddenly, an indigo celestial bubble spun from the twilight, enveloping ${n} and lifting them into the Realm of Starlit Connections.`,
        action: (n) =>
          `${n} floating inside an iridescent indigo-violet bubble filled with twinkling star constellations.`,
        environment: () =>
          `Cosmic dreamscape of deep indigo and violet clouds with glowing trails of starlight weaving together.`,
      },
      {
        arBoy: (n) =>
          `شاهد ${n} نجوماً وحيدة تسبح في الفضاء، وبمجرد أن مدت إحداها خيطاً من النور للأخرى، تشكلت كوكبة مذهلة أضاءت الكون!`,
        arGirl: (n) =>
          `شاهدت ${n} نجوماً وحيدة تسبح في الفضاء، وبمجرد أن مدت إحداها خيطاً من النور للأخرى، تشكلت كوكبة مذهلة أضاءت الكون!`,
        en: (n) =>
          `${n} watched solitary stars drift in the dark; the moment one extended a ray of light, a constellation burst into brilliance!`,
        action: (n) =>
          `${n} pointing with wonder toward connecting constellations inside the bubble, face illuminated by starlight.`,
        environment: () =>
          `Nebula of Connecting Hearts with silver and indigo bridges spanning between glowing starry clusters.`,
      },
      {
        arBoy: (n) =>
          `أخرج ${n} كرة ملونة من حقيبة المستكشف، واكتشف أن كلمة «مرحباً» هي خيط النور الذي يربط بين القلوب ويبني الصداقة.`,
        arGirl: (n) =>
          `أخرجت ${n} كرة ملونة من حقيبة المستكشف، واكتشفت أن كلمة «مرحباً» هي خيط النور الذي يربط بين القلوب ويبني الصداقة.`,
        en: (n) =>
          `Holding a bright ball from their Bubbleverse Explorer Backpack, ${n} learned that a simple "Hello" is the bridge that connects hearts.`,
        action: (n) =>
          `${n} holding a glowing ball with both hands inside the indigo bubble, practicing a warm friendly smile.`,
        environment: () =>
          `Intimate starlight gazebo inside the bubble, soft cosmic lanterns floating gently in calm air.`,
      },
      {
        arBoy: (n) =>
          `أدرك ${n} أن كل الأطفال يبحثون أيضاً عن صديق لطيف، وأن المبادرة بالابتسامة تمحو كل خوف من الرفض.`,
        arGirl: (n) =>
          `أدركت ${n} أن كل الأطفال يبحثون أيضاً عن صديقة لطيفة، وأن المبادرة بالابتسامة تمحو كل خوف من الرفض.`,
        en: (n) =>
          `${n} understood that other children are waiting for friends too, and a warm smile melts away every fear.`,
        action: (n) =>
          `${n} nodding with bright warm eyes, hugging the ball with joyful anticipation inside the bubble.`,
        environment: () =>
          `Glowing indigo pathway leading across lavender stardust back toward the park bench.`,
      },
      {
        arBoy: (n) =>
          `ظلت الفقاعة النيلية تحيط بـ ${n} بثبات دون أن تنكسر، وهي تملأ صدره بشجاعة اللقاء ودفء الود.`,
        arGirl: (n) =>
          `ظلت الفقاعة النيلية تحيط بـ ${n} بثبات دون أن تنكسر، وهي تملأ صدرها بشجاعة اللقاء ودفء الود.`,
        en: (n) =>
          `The indigo bubble remained safely whole without popping, filling ${n}'s heart with the warmth of belonging.`,
        action: (n) =>
          `${n} standing confidently inside the steady indigo bubble, ready to step forward with kindness.`,
        environment: () =>
          `Twilight indigo sky fading softly into the warm greens and ambers of the neighborhood park.`,
      },
      {
        arBoy: (n) =>
          `هبطت الفقاعة بـ ${n} برفق إلى المقعد الخشبي في الحديقة، وما زال الأطفال يلعبون بالكرة على بعد خطوات.`,
        arGirl: (n) =>
          `هبطت الفقاعة بـ ${n} برفق إلى المقعد الخشبي في الحديقة، وما زال الأطفال يلعبون بالكرة على بعد خطوات.`,
        en: (n) =>
          `Gently the indigo bubble placed ${n} back on the park bench, the other kids still kicking the ball nearby.`,
        action: (n) =>
          `${n} standing up from the bench with determination and a genuine friendly smile on their face.`,
        environment: () =>
          `Park at golden hour, grass lit by warm amber sunset, children playing in the open field.`,
      },
      {
        arBoy: (n) =>
          `تدحرجت الكرة بالصدفة نحو قدمي ${n}، فتوقفت اللعبة والتفت الجميع ينظرون إليه.`,
        arGirl: (n) =>
          `تدحرجت الكرة بالصدفة نحو قدمي ${n}، فتوقفت اللعبة والتفت الجميع ينظرون إليها.`,
        en: (n) =>
          `The ball suddenly rolled right toward ${n}'s feet, and the game paused as all eyes turned their way.`,
        action: (n) =>
          `${n} stopping the ball gently with one foot, looking up with bright welcoming eyes.`,
        environment: () =>
          `Sunset playground, the children looking toward the newcomer with curious, open expressions.`,
      },
      {
        arBoy: (n) =>
          `ابتسم ${n} ابتسامة دافئة، ومرر الكرة بمهارة نحوهم قائلاً بصوت مرح: «مرحباً! تمريرة جميلة.. هل يمكنني الانضمام إليكم؟»`,
        arGirl: (n) =>
          `ابتسمت ${n} ابتسامة دافئة، ومررت الكرة بمهارة نحوهم قائلة بصوت مرح: «مرحباً! تمريرة جميلة.. هل يمكنني الانضمام إليكم؟»`,
        en: (n) =>
          `${n} smiled warmly, passing the ball back smoothly: "Hello! Nice pass! Can I play with you?"`,
        action: (n) =>
          `${n} kicking the ball smoothly to the group with an inviting wave and a radiant smile.`,
        environment: () =>
          `Sun-drenched field, the kids lighting up with big friendly grins and welcoming waves.`,
      },
      {
        arBoy: (n) =>
          `وفِي تلك اللحظة التي رحب فيها الأصدقاء بـ ${n}.. «بوب!» انفرجت فقاعة الصداقة في زخات من بريق المجرات والنجوم البنفسجية وصاح الأطفال: «بالتأكيد! تعال!»`,
        arGirl: (n) =>
          `وفِي تلك اللحظة التي رحب فيها الأصدقاء بـ ${n}.. «بوب!» انفرجت فقاعة الصداقة في زخات من بريق المجرات والنجوم البنفسجية وصاح الأطفال: «بالتأكيد! تعالي!»`,
        en: (n) =>
          `At that welcoming moment as the friends embraced ${n}—POP! The indigo bubble burst in a joyful explosion of stardust as the kids shouted: "Yes! Come play!"`,
        action: (n) =>
          `${n} running eagerly onto the field to join the team as sparkling indigo stardust swirls in the sunset air.`,
        environment: () =>
          `Playground field exploding with celebratory stardust sparkles and joyful golden sunset backlight.`,
      },
      {
        arBoy: (n) =>
          `ركض ${n} وسجل هدفاً رائعاً وسط هتاف أصدقائه الجدد، واكتشف أن خطوة واحدة نحو الآخرين تكفي لصنع أجمل الصداقات.`,
        arGirl: (n) =>
          `ركضت ${n} وسجلت هدفاً رائعاً وسط هتاف أصدقائها الجدد، واكتشفت أن خطوة واحدة نحو الآخرين تكفي لصنع أجمل الصداقات.`,
        en: (n) =>
          `${n} scored a goal amid cheers from their new friends, knowing one friendly step is all it takes to build a bridge of friendship.`,
        action: (n) =>
          `${n} celebrating a goal with high-fives and big smiles surrounded by their new group of friends.`,
        environment: () =>
          `Sunset park field with happy children celebrating together, arms linked in friendship, heartwarming ending scene.`,
      },
    ],
  },

  // 7. PURPLE BUBBLE: SHARING & GENEROSITY
  {
    id: 'purple_sharing',
    color: 'Purple',
    colorHex: '#A855F7',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: '🟪',
    labelAr: 'فقاعة المشاركة والكرم',
    labelEn: 'Bubble of Sharing (Greed & Possessiveness)',
    struggleAr: 'الأنانية، حب التملك المفرط، والصراخ: "هذا لي وحدي!"',
    struggleEn: 'Selfishness, Possessiveness & Refusal to Share Toys/Snacks',
    virtueAr: 'الكرم، متعة العطاء، والمشاركة التي تضاعف السعادة عشر مرات',
    virtueEn: 'Generosity, Joy of Giving & Multiplying Joy Through Sharing',
    realWorldSetupAr:
      'في غرفة المعيشة، جلب البطل علبة ألوانه الجديدة اللامعة، وأحكم قبضته عليها صارخاً في وجه إخوته: "هذه لي وحدي! إياكم أن يلمسها أحد!"',
    realWorldSetupEn:
      'In the living room, clutching a brand-new box of shiny coloring markers tight to their chest, they yelled: "Mine! Nobody touch it, it\'s only for me!"',
    popBreakthroughAr:
      'يضع البطل علبة الألوان في الوسط، ويوزع الأقلام على إخوته بابتسامة كريمة: "تعالوا نلوّن معاً أجمل لوحة!" فتنفجر الفقاعة البنفسجية بأمطار من الحلوى والأنوار!',
    popBreakthroughEn:
      'Placing the markers in the center, they hand the best colors to their friends with a beaming smile: "Let\'s color together!" The purple bubble pops in a shower of lavender joy!',
    lightingPrompt:
      'Majestic royal amethyst, radiant lavender, and soft magenta volumetric lighting, pearlescent glow, rich cozy contrast.',
    colorPalette: ['#A855F7', '#C084FC', '#D8B4FE', '#E9D5FF', '#6B21A8'],
    boyOutfit:
      'regal amethyst-and-navy junior diplomat adventurer blazer with golden crest, dark trousers, and smart shoes',
    girlOutfit:
      'regal amethyst-and-rose junior diplomat adventurer blazer with golden crest, neat pleated skirt/trousers, and smart shoes',
    signatureProp: 'a glowing golden-and-amethyst sharing jewel offering soft purple light',
    pose2Description:
      '(2) 3/4 view holding an open glowing amethyst treasure box offering sparkling gems with a generous smile',
    outfit:
      'regal amethyst-and-navy junior diplomat adventurer blazer with golden crest, dark trousers, and smart shoes',
    prop: 'a glowing golden-and-amethyst sharing jewel offering soft purple light',
    pose2:
      '(2) 3/4 view holding an open glowing amethyst treasure box offering sparkling gems with a generous smile',
    merchandiseHintAr: 'مصباح بابل فيرس الليلي الدافئ وحقيبة المستكشف',
    merchandiseHintEn: 'Bubbleverse Bedtime Night Lamp and Explorer Backpack',
    beats: [
      {
        arBoy: (n) =>
          `حصل ${n} على علبة ألوان مائية لامعة جديدة، فجلس على طاولة الصالة يضمها بذراعيه رافضاً أن يقترب أحد.`,
        arGirl: (n) =>
          `حصلت ${n} على علبة ألوان مائية لامعة جديدة، فجلست على طاولة الصالة تضمها بذراعيها رافضة أن يقترب أحد.`,
        en: (n) =>
          `Having received a brand-new set of vibrant sparkling art markers, ${n} huddled over the table, guarding the box tightly.`,
        action: (n) =>
          `${n} hugging a big colorful art kit close to their chest with a possessive frown on their face.`,
        environment: () =>
          `Living room art table with blank paper sheets, siblings/friends looking on with sad longing eyes.`,
      },
      {
        arBoy: (n) =>
          `عندما مد أخوه يده ليأخذ قلماً واحداً، صرخ ${n} بانفعال: «لا! إنها لي وحدي، اذهبوا بعيداً!» فشعر بجفاء بارد في قلبه.`,
        arGirl: (n) =>
          `عندما مد أخوها يده ليأخذ قلماً واحداً، صرخت ${n} بانفعال: «لا! إنها لي وحدي، اذهبوا بعيداً!» فشعرت بجفاء بارد في قلبها.`,
        en: (n) =>
          `When a sibling reached for just one pencil, ${n} snapped: "No! It is all mine, go away!" leaving the room quiet and hurt.`,
        action: (n) =>
          `${n} shielding the marker box with both elbows, turning away while the other child looks down sadly.`,
        environment: () =>
          `Living room scene with cold shadows gathering around the table, contrasting with the colorful crayons.`,
      },
      {
        arBoy: (n) =>
          `وفجأة، انبثقت فقاعة بنفسجية ملكية ساحرة تتلألأ بأطياف اللافندر، واحتضنت ${n} وحملته إلى بستان العطاء العجيب.`,
        arGirl: (n) =>
          `وفجأة، انبثقت فقاعة بنفسجية ملكية ساحرة تتلألأ بأطياف اللافندر، واحتضنت ${n} وحملتها إلى بستان العطاء العجيب.`,
        en: (n) =>
          `Suddenly, a royal amethyst-purple bubble shimmering with pearlescent lavender wrapped gently around ${n}, lifting them away.`,
        action: (n) =>
          `${n} enveloped inside a glowing purple soap bubble, watching the room dissolve into an enchanted garden.`,
        environment: () =>
          `Orchard of Doubled Joy filled with crystal trees bearing glowing amethyst fruits and soft magenta mist.`,
      },
      {
        arBoy: (n) =>
          `شاهد ${n} شجرة سحرية؛ حين يأكل شخص ثمرتها وحده تتلاشى حلاوتها، وحين يقتسمها مع غيره تنبت مكانها عشر ثمرات سكرية!`,
        arGirl: (n) =>
          `شاهدت ${n} شجرة سحرية؛ حين تأكل شخص ثمرتها وحدها تتلاشى حلاوتها، وحين تقتسمها مع غيرها تنبت مكانها عشر ثمرات سكرية!`,
        en: (n) =>
          `${n} saw a magical tree: when someone ate its fruit alone, the sweetness faded; but when shared, ten more golden fruits blossomed!`,
        action: (n) =>
          `${n} offering half of a glowing purple fruit to a friendly little fawn inside the bubble realm, smiling in amazement.`,
        environment: () =>
          `Crystal boughs bursting into brilliant double-bloom, showering golden-amethyst sparkles of pure joy.`,
      },
      {
        arBoy: (n) =>
          `أضاء مصباح بابل فيرس الليلي الدافئ، وأدرك ${n} أن المشاركة لا تنقص مما نملك، بل تضاعف الفرح في كل زاوية.`,
        arGirl: (n) =>
          `أضاء مصباح بابل فيرس الليلي الدافئ، وأدركت ${n} أن المشاركة لا تنقص مما نملك، بل تضاعف الفرح في كل زاوية.`,
        en: (n) =>
          `Under the cozy light of the Bubbleverse Bedtime Night Lamp, ${n} realized sharing never makes you poorer—it multiplies happiness!`,
        action: (n) =>
          `${n} holding an open glowing treasure box inside the bubble, ready to share with open hands and a smiling face.`,
        environment: () =>
          `Serene starlit purple clearing, warm bedside lamp glow blending into magical amethyst luminescence.`,
      },
      {
        arBoy: (n) =>
          `تذكر ${n} كيف أن الرسم بمفرده يظل ناقصاً، بينما التلوين معاً يحول الصفحة البيضاء إلى لوحة قوس قزح لا تُنسى.`,
        arGirl: (n) =>
          `تذكرت ${n} كيف أن الرسم بمفردها يظل ناقصاً، بينما التلوين معاً يحول الصفحة البيضاء إلى لوحة قوس قزح لا تُنسى.`,
        en: (n) =>
          `${n} remembered that drawing alone feels quiet and grey, while coloring together turns a blank sheet into a rainbow masterpiece.`,
        action: (n) =>
          `${n} nodding with enlightened joy, imagining the colorful fun waiting back home.`,
        environment: () =>
          `Whimsical sky painted in swirls of magenta, violet, and gold brushstrokes, vibrant storybook atmosphere.`,
      },
      {
        arBoy: (n) =>
          `ظلت الفقاعة البنفسجية متماسكة تحمي البطل ${n} برفق دون أن تنكسر، وهي تملأ قلبه بكرم حقيقي ونبل كبير.`,
        arGirl: (n) =>
          `ظلت الفقاعة البنفسجية متماسكة تحمي البطلة ${n} برفق دون أن تنكسر، وهي تملأ قلبها بكرم حقيقي ونبل كبير.`,
        en: (n) =>
          `The purple bubble held graceful and whole without popping, filling ${n}'s heart with true royal generosity.`,
        action: (n) =>
          `${n} holding the marker box gently with relaxed open palms inside the steady purple bubble.`,
        environment: () =>
          `Amethyst aurora dancing outside the bubble, deep peaceful shadows contrasting with luminous purple ribbons.`,
      },
      {
        arBoy: (n) =>
          `عادت الفقاعة بـ ${n} برفق إلى طاولة الصالة، ليعود إلى علبة الألوان وإخوته الجالسين في صمت.`,
        arGirl: (n) =>
          `عادت الفقاعة بـ ${n} برفق إلى طاولة الصالة، لتعود إلى علبة الألوان وإخوتها الجالسين في صمت.`,
        en: (n) =>
          `Softly the purple bubble guided ${n} back to the living room table, right beside the colorful marker box.`,
        action: (n) =>
          `${n} standing by the table, surrounded by the faint glow of the purple bubble, eyes full of warmth.`,
        environment: () =>
          `Warm family living room with afternoon light, siblings sitting quietly by the table.`,
      },
      {
        arBoy: (n) =>
          `أزاح ${n} ذراعيه عن العلبة، ووضعها في منتصف الطاولة بابتسامة مشرقة تفيض بالحب.`,
        arGirl: (n) =>
          `أزاحت ${n} ذراعيها عن العلبة، ووضعتها في منتصف الطاولة بابتسامة مشرقة تفيض بالحب.`,
        en: (n) =>
          `${n} slid the box of markers right into the center of the table with a bright, welcoming smile.`,
        action: (n) =>
          `${n} pushing the marker kit forward, hands open in an inviting gesture to everyone around.`,
        environment: () =>
          `Sunlit table with white paper sheets, siblings looking up with surprise and delight.`,
      },
      {
        arBoy: (n) =>
          `قال ${n} بحماس: «تعالوا نرسم معاً! خذ أنت اللون الذهبي، وأنتِ خذي اللون الأزرق.. سنبني معاً أجمل قلعة!»`,
        arGirl: (n) =>
          `قالت ${n} بحماس: «تعالوا نرسم معاً! خذ أنت اللون الذهبي، وأنت خذ اللون الأزرق.. سنبني معاً أجمل قلعة!»`,
        en: (n) =>
          `${n} cheered: "Come on, let's draw together! You take the gold, and you take the blue—let's make a grand castle!"`,
        action: (n) =>
          `${n} handing the prettiest markers to smiling siblings with generous delight.`,
        environment: () =>
          `Warm afternoon room glowing with shared excitement as markers and hands meet over the paper.`,
      },
      {
        arBoy: (n) =>
          `وفِي لحظة العطاء التي فتح فيها البطل ${n} قلبه.. «بوب!» انفرجت الفقاعة البنفسجية في شلال من الشرائط البنفسجية والحلويات المتطايرة والضحكات!`,
        arGirl: (n) =>
          `وفِي لحظة العطاء التي فتحت فيها البطلة ${n} قلبها.. «بوب!» انفرجت الفقاعة البنفسجية في شلال من الشرائط البنفسجية والحلويات المتطايرة والضحكات!`,
        en: (n) =>
          `In that joyful act of giving as ${n} shared everything—POP! The purple bubble burst into a shower of lavender ribbons and sparkling shared giggles!`,
        action: (n) =>
          `${n} laughing heartily with siblings as celebratory purple and golden sparkles float gently over the art paper.`,
        environment: () =>
          `Living room filled with radiant Pixar volumetric celebration lighting, floating confetti, heartwarming mood.`,
      },
      {
        arBoy: (n) =>
          `امتلأت اللوحة بأبهى الألوان، ونام ${n} في سريره ليلاً وهو يشعر بقلبه يفيض بالرضا، لأن الفرح المشترك هو أعظم كنز في الوجود.`,
        arGirl: (n) =>
          `امتلأت اللوحة بأبهى الألوان، ونامت ${n} في سريرها ليلاً وهي تشعر بقلبها يفيض بالرضا، لأن الفرح المشترك هو أعظم كنز في الوجود.`,
        en: (n) =>
          `The collaborative painting turned out breathtaking, and ${n} fell asleep that night knowing shared joy is life's richest treasure.`,
        action: (n) =>
          `${n} tucked in cozy bed beside the glowing Bubbleverse Bedtime Night Lamp, sleeping peacefully with a satisfied smile.`,
        environment: () =>
          `Cozy moonlit children's bedroom with warm nightlight glow, framed shared drawing on the nightstand, peaceful night sky.`,
      },
    ],
  },
];

// Helper lookups for The 7 Bubbles
export function getSevenBubble(id: string): SevenBubbleDefinition | undefined {
  const norm = (id || '').trim().toLowerCase();
  return THE_SEVEN_BUBBLES.find(
    (b) =>
      b.id === norm ||
      b.id.replace('bubble_', '') === norm ||
      norm.includes(b.id) ||
      norm.includes(b.color.toLowerCase())
  );
}

export function getTherapeuticBubble(id: string): TherapeuticBubble | undefined {
  return getSevenBubble(id);
}

export function isSevenBubble(theme: string): theme is SevenBubbleId {
  const norm = (theme || '').trim().toLowerCase();
  return THE_SEVEN_BUBBLES.some(
    (b) => b.id === norm || b.id.replace('bubble_', '') === norm || norm.includes(b.id)
  );
}

export function isTherapeuticBubble(theme: string): theme is TherapeuticBubbleId {
  return isSevenBubble(theme);
}

export function resolveTherapeuticLightingPrompt(theme: string): string {
  const bubble = getSevenBubble(theme);
  return bubble?.lightingPrompt || '';
}

// ----------------------------------------------------------------------------
// CLASSIC STORY THEMES & ADAPTIVE PRESETS
// ----------------------------------------------------------------------------

export const THEME_PRESETS: ReadonlyArray<ThemePreset> = [
  // 7 Therapeutic Bubbles mapped directly as primary choices
  ...THE_SEVEN_BUBBLES.map((b) => ({
    id: b.id as StoryThemeKey,
    labelAr: `${b.icon} ${b.labelAr}`,
    labelEn: `${b.icon} ${b.labelEn}`,
    keywords: [
      b.id,
      b.color.toLowerCase(),
      b.labelAr,
      b.labelEn,
      b.struggleAr,
      b.struggleEn,
      b.virtueAr,
      b.virtueEn,
    ],
    boyOutfit: b.boyOutfit,
    girlOutfit: b.girlOutfit,
    signatureProp: b.signatureProp,
    pose2Description: b.pose2Description,
  })),

  // Classic adventure presets
  {
    id: 'dinosaurs',
    labelAr: 'الديناصورات وعالم ما قبل التاريخ',
    labelEn: 'Dinosaurs & Prehistoric World',
    keywords: [
      'dino',
      'dinosaur',
      'dinosaurs',
      'jurassic',
      'fossil',
      'fossils',
      't-rex',
      'raptor',
      'paleontologist',
      'ديناصور',
      'ديناصورات',
      'متحجرات',
      'جوراسي',
    ],
    boyOutfit:
      'safari paleontologist adventurer khaki vest with pockets, olive cargo shorts, brown boots, and dino scout badges',
    girlOutfit:
      'safari paleontologist adventurer khaki vest with pockets, explorer shorts, rugged boots, and dino scout badges',
    signatureProp: 'an explorer magnifying glass inspecting a friendly baby dinosaur footprint',
    pose2Description:
      '(2) 3/4 view holding an explorer magnifying glass with a friendly mini dinosaur peek',
  },
  {
    id: 'space',
    labelAr: 'الفضاء ورواد الفضاء',
    labelEn: 'Space & Cosmic Exploration',
    keywords: [
      'space',
      'astronaut',
      'galaxy',
      'stars',
      'star',
      'cosmic',
      'rocket',
      'mars',
      'planet',
      'planets',
      'فضاء',
      'رائد فضاء',
      'مجرة',
      'نجوم',
      'كواكب',
      'صاروخ',
    ],
    boyOutfit:
      'junior astronaut jumpsuit with planetary mission patches, cosmic navy trims, and silver moon boots',
    girlOutfit:
      'junior astronaut jumpsuit with planetary star patches, lavender and navy trims, and silver moon boots',
    signatureProp: 'a glowing miniature celestial star or brass telescope',
    pose2Description: '(2) 3/4 view holding a glowing miniature celestial star',
  },
  {
    id: 'ocean',
    labelAr: 'أعماق البحار والمحيطات',
    labelEn: 'Ocean & Deep Sea Wonder',
    keywords: [
      'ocean',
      'sea',
      'underwater',
      'whale',
      'dolphin',
      'coral',
      'marine',
      'submarine',
      'mermaid',
      'بحار',
      'محيط',
      'سمك',
      'حوت',
      'دلفين',
      'غواصة',
      'شعب مرجانية',
    ],
    boyOutfit:
      'marine explorer sea-teal windbreaker jacket with nautical navy shorts and water shoes',
    girlOutfit:
      'marine explorer aquamarine windbreaker jacket with nautical navy shorts and water shoes',
    signatureProp: 'a glowing iridescent ocean pearl or sea shell',
    pose2Description: '(2) 3/4 view holding a glowing iridescent sea pearl',
  },
  {
    id: 'fantasy',
    labelAr: 'السحر والخيال والغابة المسحورة',
    labelEn: 'Fantasy, Magic & Fairy Tales',
    keywords: [
      'fantasy',
      'magic',
      'wizard',
      'fairy',
      'enchanted',
      'castle',
      'dragon',
      'spell',
      'wand',
      'سحر',
      'خيال',
      'قلعة',
      'تنين',
      'جنية',
      'غابة سحرية',
      'عصا سحرية',
    ],
    boyOutfit:
      'young apprentice magical adventurer tunic with gold-trimmed starry midnight-blue cape and fantasy boots',
    girlOutfit:
      'young apprentice magical adventurer tunic with gold-trimmed starry amethyst cape and fantasy boots',
    signatureProp: 'a gently glowing wooden wizard wand with sparkling stardust',
    pose2Description: '(2) 3/4 view holding an enchanted glowing crystal lantern',
  },
  {
    id: 'superhero',
    labelAr: 'الأبطال الخارقين',
    labelEn: 'Superhero & Mighty Heroes',
    keywords: [
      'superhero',
      'hero',
      'cape',
      'powers',
      'avenger',
      'champion',
      'بطل خارق',
      'خارق',
      'قوة',
      'درع',
    ],
    boyOutfit:
      'vibrant primary-color superhero adventure suit with metallic gold chest emblem, flowing red cape, and heroic boots',
    girlOutfit:
      'vibrant primary-color superhero adventure suit with metallic gold star crest, flowing cape, and heroic boots',
    signatureProp: 'a glowing golden champion emblem',
    pose2Description: '(2) 3/4 view in an heroic pose holding a glowing golden champion emblem',
  },
  {
    id: 'animals',
    labelAr: 'الحيوانات والغابة والسفاري',
    labelEn: 'Safari, Jungle & Animal Friends',
    keywords: [
      'animal',
      'animals',
      'safari',
      'jungle',
      'lion',
      'forest',
      'wildlife',
      'zoo',
      'pet',
      'puppy',
      'kitten',
      'حيوان',
      'حيوانات',
      'سفاري',
      'غابة',
      'أسد',
    ],
    boyOutfit:
      'jungle wildlife scout button-up khaki shirt with animal guide patches, safari cap, and trail boots',
    girlOutfit:
      'jungle wildlife scout button-up khaki shirt with wildlife guide patches, safari cap, and trail boots',
    signatureProp: 'vintage brass safari binoculars with leather strap',
    pose2Description: '(2) 3/4 view holding brass safari binoculars looking warmly at the viewer',
  },
  {
    id: 'bedtime',
    labelAr: 'أحلام النوم ووقت النوم الهادئ',
    labelEn: 'Bedtime & Sweet Dreams',
    keywords: [
      'bedtime',
      'dream',
      'dreams',
      'sleep',
      'night',
      'moon',
      'lullaby',
      'cozy',
      'نوم',
      'أحلام',
      'سرير',
      'قمر',
      'تهويدة',
    ],
    boyOutfit: 'soft pastel cloud-and-star patterned cozy pajama set with fluffy slippers',
    girlOutfit: 'soft pastel cloud-and-star patterned cozy pajama set with fluffy slippers',
    signatureProp: 'a warm glowing crescent moon nightlight',
    pose2Description:
      '(2) 3/4 view hugging a soft plush pillow and holding a gently glowing warm moon nightlight',
  },
  {
    id: 'graduation',
    labelAr: 'المستقبل والمهن والنجاح',
    labelEn: 'Future Career & Little Achiever',
    keywords: [
      'graduation',
      'graduate',
      'school',
      'career',
      'doctor',
      'pilot',
      'scientist',
      'engineer',
      'تخرج',
      'مدرسة',
      'طبيب',
      'طيار',
      'مهندس',
      'عالم',
    ],
    boyOutfit: 'junior scholar achievement blazer with neat golden crest and smart sneakers',
    girlOutfit: 'junior scholar achievement blazer with neat golden crest and smart sneakers',
    signatureProp: 'a rolled golden diploma ribbon or miniature golden globe',
    pose2Description:
      '(2) 3/4 view proudly holding an illuminated miniature golden achievement globe',
  },
  {
    id: 'custom',
    labelAr: 'حبكة مخصصة / مغامرة خاصة',
    labelEn: 'Custom Plot / Unique Adventure',
    keywords: ['custom', 'plot', 'unique', 'خاص', 'مخصص', 'حبكة'],
    boyOutfit:
      'personalized junior explorer adventure jacket tailored to story plot and smart sneakers',
    girlOutfit:
      'personalized junior explorer adventure jacket tailored to story plot and smart sneakers',
    signatureProp: 'a luminous custom adventure keepsake',
    pose2Description: '(2) 3/4 view holding a luminous adventure keepsake with warm sparkles',
  },
  {
    id: 'bubble',
    labelAr: 'عالم الفقاعات السحري الكلاسيكي',
    labelEn: 'Classic Bubbleverse Realm',
    keywords: ['bubble', 'bubbles', 'فقاعة', 'فقاعات'],
    boyOutfit:
      'turquoise-and-navy junior explorer jacket with star patches and blue sneakers',
    girlOutfit:
      'rose-pink-and-navy junior explorer jacket with star patches and cute sneakers',
    signatureProp: 'a glowing bubble',
    pose2Description: '(2) 3/4 view holding a glowing bubble',
  },
];

export function detectStoryTheme(textHints: string): StoryThemeKey {
  const normalized = (textHints || '').toLowerCase();
  if (!normalized.trim()) return 'bubble';

  // Check 7 Therapeutic Bubbles first
  for (const bubble of THE_SEVEN_BUBBLES) {
    if (normalized.includes(bubble.id)) return bubble.id;
    if (normalized.includes(bubble.labelAr.toLowerCase())) return bubble.id;
    if (normalized.includes(bubble.labelEn.toLowerCase())) return bubble.id;
    if (normalized.includes(bubble.struggleAr.toLowerCase())) return bubble.id;
    if (normalized.includes(bubble.struggleEn.toLowerCase())) return bubble.id;
  }

  // Check behavioral keywords
  if (normalized.includes('هدوء') || normalized.includes('غضب') || normalized.includes('عصبية') || normalized.includes('calm') || normalized.includes('anger')) {
    return 'red_calm';
  }
  if (normalized.includes('تعاطف') || normalized.includes('مشاعر') || normalized.includes('أذى') || normalized.includes('empathy')) {
    return 'orange_empathy';
  }
  if (normalized.includes('صدق') || normalized.includes('أمانة') || normalized.includes('كذب') || normalized.includes('اعتراف') || normalized.includes('honesty') || normalized.includes('truth')) {
    return 'yellow_honesty';
  }
  if (normalized.includes('شاشة') || normalized.includes('شاشات') || normalized.includes('طبيعة') || normalized.includes('واقع') || normalized.includes('screen') || normalized.includes('outdoor')) {
    return 'green_realworld';
  }
  if (normalized.includes('شجاعة') || normalized.includes('ثقة') || normalized.includes('خجل') || normalized.includes('مسرح') || normalized.includes('courage') || normalized.includes('brave')) {
    return 'blue_courage';
  }
  if (normalized.includes('صداقة') || normalized.includes('وحدة') || normalized.includes('عزلة') || normalized.includes('أصدقاء') || normalized.includes('friendship') || normalized.includes('lonely')) {
    return 'indigo_friendship';
  }
  if (normalized.includes('مشاركة') || normalized.includes('كرم') || normalized.includes('عطاء') || normalized.includes('أنانية') || normalized.includes('بخل') || normalized.includes('sharing') || normalized.includes('generosity')) {
    return 'purple_sharing';
  }

  // Classic presets
  for (const preset of THEME_PRESETS) {
    if (preset.id === 'bubble' || preset.id === 'custom') continue;
    for (const kw of preset.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        return preset.id;
      }
    }
  }

  if (normalized.includes('custom') || normalized.includes('مخصص')) {
    return 'custom';
  }

  return 'bubble';
}

export function resolveThemeDna(
  themeInput?: StoryThemeKey | string,
  gender: 'boy' | 'girl' = 'boy'
): {
  storyTheme: StoryThemeKey | string;
  signatureOutfit: string;
  signatureProp: string;
  pose2Description: string;
} {
  // Check 7 Therapeutic Bubbles first
  const bubble = getSevenBubble(themeInput || '');
  if (bubble) {
    return {
      storyTheme: bubble.id,
      signatureOutfit: gender === 'girl' ? bubble.girlOutfit : bubble.boyOutfit,
      signatureProp: bubble.signatureProp,
      pose2Description: bubble.pose2Description,
    };
  }

  const matched =
    THEME_PRESETS.find((p) => p.id === themeInput) ||
    THEME_PRESETS.find((p) => p.keywords.some((kw) => (themeInput || '').toLowerCase().includes(kw))) ||
    THEME_PRESETS.find((p) => p.id === 'bubble')!;

  const signatureOutfit = gender === 'girl' ? matched.girlOutfit : matched.boyOutfit;
  return {
    storyTheme: matched.id,
    signatureOutfit,
    signatureProp: matched.signatureProp,
    pose2Description: matched.pose2Description,
  };
}

export function createDefaultCharacterDna(overrides?: Partial<CharacterDna>): CharacterDna {
  const gender = overrides?.childGender === 'girl' ? 'girl' : 'boy';
  const initialTheme = overrides?.storyTheme || 'bubble';
  const resolved = resolveThemeDna(initialTheme, gender);

  return {
    childName: 'آدم',
    childAge: '5',
    childGender: 'boy',
    hairAndFeatures: 'curly dark hair, expressive warm eyes, natural joyful smile',
    signatureOutfit: overrides?.signatureOutfit || resolved.signatureOutfit,
    artStyle: '3D Pixar Storybook, rich pastel lighting, expressive character features',
    midjourneyCrefUrl: '',
    storyTheme: initialTheme,
    signatureProp: overrides?.signatureProp || resolved.signatureProp,
    pose2Description: overrides?.pose2Description || resolved.pose2Description,
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
  storyTheme: string;
  signatureProp: string;
  pose2Description: string;
} {
  const genderWord: 'boy' | 'girl' = dna.childGender === 'girl' ? 'girl' : 'boy';
  const themeKey = dna.storyTheme || 'bubble';
  const resolved = resolveThemeDna(themeKey, genderWord);

  const signatureOutfit =
    dna.signatureOutfit?.trim() || resolved.signatureOutfit;

  const signatureProp =
    dna.signatureProp?.trim() || resolved.signatureProp;

  let pose2Description = dna.pose2Description?.trim();
  if (!pose2Description) {
    if (dna.signatureProp?.trim()) {
      pose2Description = `(2) 3/4 view holding ${dna.signatureProp.trim()}`;
    } else {
      pose2Description = resolved.pose2Description;
    }
  }

  return {
    childName: dna.childName.trim() || 'Hero',
    ageDescriptor: normalizeAgeDescriptor(dna.childAge),
    genderWord,
    hairAndFeatures:
      dna.hairAndFeatures.trim() || 'natural hair, warm eyes, and cheerful smile',
    signatureOutfit,
    artStyle:
      dna.artStyle.trim() ||
      "3D Pixar-style children's storybook, soft warm cinematic lighting",
    midjourneyCrefUrl: dna.midjourneyCrefUrl?.trim() || '',
    storyTheme: themeKey,
    signatureProp,
    pose2Description,
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
    `(1) front facing smiling, ${norm.pose2Description}, (3) happy excited expression. ` +
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

// ----------------------------------------------------------------------------
// CLASSIC 24-BEAT BACKUP STORY ARC (FOR LEGACY THEMES)
// ----------------------------------------------------------------------------

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
      `عند البوابة المضيئة، وجد ${n} خريطة سحرية مرسومة بخيوط النور تفتح أمامه دروباً عامرة بالأمل والمغامرة.`,
    arGirl: (n) =>
      `عند البوابة المضيئة، وجدت ${n} خريطة سحرية مرسومة بخيوط النور تفتح أمامها دروباً عامرة بالأمل والمغامرة.`,
    en: (n) =>
      `Just beyond the glowing archway, ${n} discovered a magical star map drawn in shimmering light, pointing toward brave new pathways.`,
    action: (n) =>
      `${n} kneeling warmly to inspect a miniature luminous star map resting atop an iridescent crystal stone.`,
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
      `فجأة، رأى ${n} شجرة متلألئة بحاجة إلى قطرات من نور المحبة لتعود أوراقها إلى النضارة والجمال.`,
    arGirl: (n) =>
      `فجأة، رأت ${n} شجرة متلألئة بحاجة إلى قطرات من نور المحبة لتعود أوراقها إلى النضارة والجمال.`,
    en: (n) =>
      `Suddenly, ${n} spotted a gentle glowing storybook tree whose leaves needed tender drops of light to bloom again.`,
    action: (n) =>
      `${n} peeking gently around a glowing storybook tree with an empathetic caring expression.`,
    environment: (t) =>
      `Quiet glowing grove in "${t}", soft moonlight filtering through iridescent leaves, gentle blue-violet shadow atmosphere.`,
  },
  {
    arBoy: (n) =>
      `جلس ${n} بلطف وشارك نوره الدافئ مع الشجرة، ففتحت أزهارها مبتسمة وفوّحت عطراً زكياً.`,
    arGirl: (n) =>
      `جلست ${n} بلطف وشاركت نورها الدافئ مع الشجرة، ففتحت أزهارها مبتسمة وفوّحت عطراً زكياً.`,
    en: (n) =>
      `${n} knelt kindly and offered warm comforting light, watching the blossoms open in joyful gratitude.`,
    action: (n) =>
      `${n} offering a gentle comforting hand toward glowing petals, showing pure care and patience.`,
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
      `بفكرة عبقرية، لمست ${n} الأجراس المضيئة بالترتيب الصحيح، فعزفت البوابة لحناً عذباً وانفتحت ببطء أمامها.`,
    en: (n) =>
      `With a clever spark of insight, ${n} tapped the glowing chimes in harmony, and the archway swung open with a joyful chord.`,
    action: (n) =>
      `${n} touching a shimmering crystal chime as ripples of golden and turquoise musical light burst forth and unlock the gate.`,
    environment: (t) =>
      `Opening enchanted portal revealing deeper wonders of "${t}", radiant beams of warm light contrasting with soft darker foreground.`,
  },
  {
    arBoy: (n) =>
      `حلّق ${n} بسعادة وسط غيوم ناعمة كالقطن، ترافقه فقاعات متوهجة تعكس ضحكاته الصافية في السماء الواسعة.`,
    arGirl: (n) =>
      `حلّقت ${n} بسعادة وسط غيوم ناعمة كالقطن، ترافقها فقاعات متوهجة تعكس ضحكاتها الصافية في السماء الواسعة.`,
    en: (n) =>
      `${n} floated joyfully among cotton-soft pastel clouds, reaching out toward shimmering bubbles dancing across the sky.`,
    action: (n) =>
      `${n} floating joyfully beside a friendly glowing sky-cloud, reaching happily toward a shimmering cyan soap bubble.`,
    environment: (t) =>
      `Dreamy pastel skyscape inside "${t}" with cotton nebula clouds, golden stardust, and soft Pixar volumetric lighting.`,
  },
  {
    arBoy: (n) =>
      `عندما ظهر ضباب فضي كثيف في الطريق، أمسك ${n} بالخريطة المضيئة بثبات وسار بخطوات واثقة دون خوف.`,
    arGirl: (n) =>
      `عندما ظهر ضباب فضي كثيف في الطريق، أمسكت ${n} بالخريطة المضيئة بثبات وسارت بخطوات واثقة دون خوف.`,
    en: (n) =>
      `When silvery mist swirled across the trail, ${n} held up the glowing star map steadily and stepped forward without fear.`,
    action: (n) =>
      `${n} holding the radiant star map aloft like a compass, walking bravely through glowing silver mist.`,
    environment: (t) =>
      `Mysterious silver-blue misty labyrinth in "${t}", warm golden map glow illuminating the path ahead, soft cinematic fog.`,
  },
  {
    arBoy: (n) =>
      `داخل كهف الكريستال الهادئ، أطلق ${n} فقاعة نور دافئة فتلألأت الجدران بألف لون مذهل أضاء قلبه بالفرح.`,
    arGirl: (n) =>
      `داخل كهف الكريستال الهادئ، أطلقت ${n} فقاعة نور دافئة فتلألأت الجدران بألف لون مذهل أضاء قلبها بالفرح.`,
    en: (n) =>
      `Inside the quiet Crystal Cavern, ${n} released a warm glowing bubble that painted every sparkling wall with dazzling rainbow light.`,
    action: (n) =>
      `${n} lifting a glowing golden bubble upward as prismatic crystal reflections dance across their delighted face.`,
    environment: (t) =>
      `Awe-inspiring crystal cavern themed to "${t}", glowing amethyst and aqua crystal formations, rich deep shadows below for text contrast.`,
  },
  {
    arBoy: (n) =>
      `ركب ${n} قارباً خشبياً صغيراً فوق نهر النجوم الساكن، حيث تتلألأ انعكاسات السماء تحت المجاديف بلطف.`,
    arGirl: (n) =>
      `ركبت ${n} قارباً خشبياً صغيراً فوق نهر النجوم الساكن، حيث تتلألأ انعكاسات السماء تحت المجاديف بلطف.`,
    en: (n) =>
      `${n} sailed a cozy leaf-shaped boat across the River of Starlight, watching constellations ripple beneath them.`,
    action: (n) =>
      `${n} gently paddling a cozy enchanted wooden boat across a calm mirror-like starlight stream.`,
    environment: (t) =>
      `Mirror-calm starlight river winding through "${t}", glowing lily pads, twilight indigo reflections and golden star shimmer.`,
  },
  {
    arBoy: (n) =>
      `بدأ ${n} تسلق تلّ النجوم خطوةً بعد خطوة؛ ورغم طول الطريق، لم يستسلم بل ابتسم واستمر بعزيمة قوية.`,
    arGirl: (n) =>
      `بدأت ${n} تسلق تلّ النجوم خطوةً بعد خطوة؛ ورغم طول الطريق، لم تستسلم بل ابتسمت واستمرت بعزيمة قوية.`,
    en: (n) =>
      `Step by determined step, ${n} climbed Starlight Hill, never giving up and keeping a bright smile along every path.`,
    action: (n) =>
      `${n} climbing glowing mossy stone steps up a magical hill, turning back with an encouraging confident smile.`,
    environment: (t) =>
      `Winding starlit hillside trail in "${t}", glowing ferns and distant glowing summit under a vast dreamy twilight sky.`,
  },
  {
    arBoy: (n) =>
      `وعندما هبّت ريح عاتية، وقف ${n} بشجاعة حقيقية وثبات راسخ، محافظاً على هدوئه ودفء قلبه.`,
    arGirl: (n) =>
      `وعندما هبّت ريح عاتية، وقفت ${n} بشجاعة حقيقية وثبات راسخ، محافظة على هدوئها ودفء قلبها.`,
    en: (n) =>
      `When a swirling gust of wind swept across the ridge, ${n} stood tall with true courage and calm composure.`,
    action: (n) =>
      `${n} standing courageously on a breezy lookout ledge, jacket fluttering gently as glowing leaves swirl dramatically.`,
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
      `أخيراً، وصل ${n} إلى قمة الأمنيات المضيئة، حيث تتلألأ شجرة الأمنيات الكبرى بنور يملأ الآفاق أملاً ومحبة.`,
    arGirl: (n) =>
      `أخيراً، وصلت ${n} إلى قمة الأمنيات المضيئة، حيث تتلألأ شجرة الأمنيات الكبرى بنور يملأ الآفاق أملاً ومحبة.`,
    en: (n) =>
      `At last, ${n} reached the Summit of Wishes, where the Great Wish Tree glowed beneath a majestic canopy of stars.`,
    action: (n) =>
      `${n} beaming proudly with clasped hands beneath a grand luminous storybook tree of wishes.`,
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

function selectBeatIndicesFromPool(poolSize: number, pageCount: number): number[] {
  const count = Math.max(1, Math.floor(pageCount));
  if (count === 1) return [0];
  if (count === 2) return [0, poolSize - 1];
  if (count >= poolSize) {
    return Array.from({ length: poolSize }, (_, i) => i);
  }

  const indices: number[] = [0];
  const innerNeeded = count - 2;
  const innerPoolSize = poolSize - 2;
  for (let i = 0; i < innerNeeded; i += 1) {
    const mapped = 1 + Math.floor(((i + 0.5) * innerPoolSize) / innerNeeded);
    const prev = indices[indices.length - 1];
    const remainingSlots = innerNeeded - 1 - i;
    const maxAllowed = poolSize - 2 - remainingSlots;
    const nextIdx = Math.min(maxAllowed, Math.max(prev + 1, mapped));
    indices.push(nextIdx);
  }
  indices.push(poolSize - 1);
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

  // Check if a Therapeutic Bubble is selected
  const therapeuticBubble = getSevenBubble(norm.storyTheme);
  const pool = therapeuticBubble ? therapeuticBubble.beats : STORY_ARC_24_BEATS;

  const cleanTheme =
    themeTitle.trim() ||
    (therapeuticBubble
      ? storyLang === 'ar'
        ? therapeuticBubble.labelAr
        : therapeuticBubble.labelEn
      : storyLang === 'ar'
      ? `مغامرة ${norm.childName} في عالم الفقاعات السحري`
      : `${norm.childName}'s Magical Bubbleverse Adventure`);

  const beatIndices = selectBeatIndicesFromPool(pool.length, safeCount);
  const pages: Stage2StoryBeatPage[] = [];

  for (let i = 0; i < safeCount; i += 1) {
    const pageNumber = i + 1;
    let text: string;
    let action: string;
    let environment: string;

    if (i < beatIndices.length) {
      const beat = pool[beatIndices[i]];
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

// ----------------------------------------------------------------------------
// AI STORY ENGINE UPGRADED WITH THE BUBBLEVERSE GOLDEN CONSTITUTION
// ----------------------------------------------------------------------------

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

  const therapeuticBubble = getSevenBubble(norm.storyTheme);
  const bubbleContext = therapeuticBubble
    ? `\nTHERAPEUTIC BUBBLE FRAMEWORK:\n` +
      `- Bubble Theme: "${therapeuticBubble.labelEn}" (${therapeuticBubble.labelAr})\n` +
      `- Color Code & Lighting: ${therapeuticBubble.color} (${therapeuticBubble.lightingPrompt})\n` +
      `- Psychological Challenge: ${therapeuticBubble.struggleEn} (${therapeuticBubble.struggleAr})\n` +
      `- Virtue & Inner Awakening: ${therapeuticBubble.virtueEn} (${therapeuticBubble.virtueAr})\n` +
      `- Real-World Setup: ${therapeuticBubble.realWorldSetupEn}\n` +
      `- The Pop Breakthrough: ${therapeuticBubble.popBreakthroughEn}\n`
    : '';

  try {
    const systemPrompt =
      'You are an award-winning children storybook author for Bubbleverse. ' +
      'You strictly obey the BUBBLEVERSE GOLDEN CONSTITUTION:\n' +
      '1. THE CHILD ALONE IS THE HERO: Under NO circumstances include "Bub" or any mascot in the story text. The child alone confronts and resolves the emotional hurdle through their own choices.\n' +
      '2. THE 4-STAGE DRAMATIC STRUCTURE:\n' +
      '   - Stage 1 (Setup & Struggle): Grounded in a relatable real-world challenge at home, school, or playground.\n' +
      '   - Stage 2 (Bubble Enclosure): A translucent glowing bubble in the theme color gently envelopes the child into a safe sanctuary where time pauses.\n' +
      '   - Stage 3 (Inner Journey & Epiphany): Wonder-filled exploration inside the bubble discovering the psychological insight. CRITICAL: THE BUBBLE MUST NOT POP YET!\n' +
      '   - Stage 4 (Real-World Return & The Pop): Return to the exact real-world scene. The child makes the heroic moral choice. THE MOMENT THE HEROIC CHOICE IS MADE: "بوب!" / "POP!" The bubble bursts into sparkling joy and laughter!\n' +
      '3. SUBCONSCIOUS MERCHANDISE PLACEMENT: Naturally feature one or two Bubbleverse items (Bubbleverse Explorer Backpack / حقيبة مستكشف بابل فيرس, Bubbleverse Adventure Jacket / سترة بابل فيرس للمغامرات, Bubbleverse Bedtime Night Lamp / مصباح بابل فيرس الليلي الدافئ) as authentic companion props, never as a sales pitch.\n' +
      '4. FORMAT: Return ONLY a valid JSON array of objects with keys: {"pageNumber": number, "text": string, "action": string, "environment": string}. No markdown outside JSON. Keep each page text 1-2 lyrical, emotionally resonant sentences.';

    const userPrompt =
      `Write a ${localPages.length}-page personalized storybook titled "${options.storyTitle}" for ` +
      `${norm.childName} (${norm.ageDescriptor} ${norm.genderWord}).\n` +
      `Story Language: ${options.storyLang === 'ar' ? 'Natural, lyrical Arabic (فصحى عذبة تراعي جنس الطفل وتستخدم "بوب!" عند فرقعة الفقاعة)' : 'Warm, rhythmic read-aloud English (using "POP!" when the bubble bursts)'}.\n` +
      `${bubbleContext}` +
      `Ensure each page is unique across the 4 dramatic stages, and "action" and "environment" provide vivid English prompt cues for 1:1 square KDP 8.5"x8.5" full-bleed illustrations.`;

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
        max_tokens: 3600,
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
          ? `تم تحسين نصوص وبرومبتات ${enhancedPages.length} صفحة عبر الذكاء الاصطناعي وفق الدستور الذهبي بنجاح.`
          : `Enhanced ${enhancedPages.length} pages with AI according to the Golden Story Constitution.`,
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

// Canonical alias for the Golden Story Constitution enhancer
export const enhanceStoryWithAi = generateStoryWithConfiguredAi;
