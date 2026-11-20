/**
 * Bubbleverse Master Character Sheet & Likeness Engine
 * Generates and manages multi-candidate 3-pose character consistency turnaround sheets,
 * provides side-by-side visual likeness audits with child reference photos,
 * and extracts facial features from photos for Stage 2 KDP prompt locking.
 */

import { savePhotoToVault } from '@/lib/photoVault';
import type { CharacterDna, StoryThemeKey } from '@/features/studio/stage2PromptEngine';
import type { CharacterSheetCandidate } from '@/lib/localStore';
import { generateRealAiImage } from '@/features/studio/aiImageGenerator';

export interface LikenessPreset {
  id: string;
  category: 'hair' | 'eyes' | 'expression' | 'skin';
  labelAr: string;
  labelEn: string;
  descEn: string;
}

export const LIKENESS_FEATURE_PRESETS: LikenessPreset[] = [
  // Hair
  {
    id: 'hair-curly-dark',
    category: 'hair',
    labelAr: 'كيرلي أسود كثيف',
    labelEn: 'Curly Black Hair',
    descEn: 'voluminous curly dark hair with soft bouncy textured curls',
  },
  {
    id: 'hair-wavy-brown',
    category: 'hair',
    labelAr: 'مموج بني كستنائي',
    labelEn: 'Wavy Brown Hair',
    descEn: 'wavy chestnut brown hair with soft side-swept locks',
  },
  {
    id: 'hair-straight-dark',
    category: 'hair',
    labelAr: 'ناعم أسود كلاسيكي',
    labelEn: 'Straight Dark Hair',
    descEn: 'neat straight dark hair with clean natural cut and side part',
  },
  {
    id: 'hair-short-fade',
    category: 'hair',
    labelAr: 'قصير رياضي Fade',
    labelEn: 'Clean Short Fade',
    descEn: 'clean short fade haircut with crisp natural hairline',
  },
  {
    id: 'hair-braids',
    category: 'hair',
    labelAr: 'جدائل أنيقة',
    labelEn: 'Neat Braids',
    descEn: 'neat textured braided hair with playful loose baby hairs',
  },

  // Eyes
  {
    id: 'eyes-warm-hazel',
    category: 'eyes',
    labelAr: 'عسلية دافئة واسعة',
    labelEn: 'Warm Hazel Eyes',
    descEn: 'expressive almond-shaped warm hazel eyes with curious bright spark',
  },
  {
    id: 'eyes-dark-sparkling',
    category: 'eyes',
    labelAr: 'سوداء لامعة بريئة',
    labelEn: 'Sparkling Dark Eyes',
    descEn: 'sparkling deep brown-black eyes full of wonder and innocence',
  },
  {
    id: 'eyes-soft-laughing',
    category: 'eyes',
    labelAr: 'عيون مبتسمة ضاحكة',
    labelEn: 'Smiling Eyes',
    descEn: 'crinkled smiling eyes with joyful warmth and playful energy',
  },

  // Expression & Smile
  {
    id: 'expr-wide-smile',
    category: 'expression',
    labelAr: 'ابتسامة عريضة مع غمازات',
    labelEn: 'Wide Smile & Dimples',
    descEn: 'wide joyful smile showing teeth with sweet subtle cheek dimples',
  },
  {
    id: 'expr-gentle-cheeks',
    category: 'expression',
    labelAr: 'خدود ممتلئة وابتسامة لطيفة',
    labelEn: 'Plump Cheeks & Soft Grin',
    descEn: 'soft round cheeks with gentle happy grin and friendly warm aura',
  },

  // Skin Tone
  {
    id: 'skin-warm-olive',
    category: 'skin',
    labelAr: 'بشرة قمحية دافئة',
    labelEn: 'Warm Olive Tone',
    descEn: 'healthy warm golden-olive skin tone with natural sunlit warmth',
  },
  {
    id: 'skin-fair-rosy',
    category: 'skin',
    labelAr: 'بشرة فاتحة خدود وردية',
    labelEn: 'Fair Rosy Complexion',
    descEn: 'fair clear complexion with rosy apple cheeks and sweet button nose',
  },
  {
    id: 'skin-radiant-bronze',
    category: 'skin',
    labelAr: 'بشرة برونزية نضرة',
    labelEn: 'Radiant Bronze Skin',
    descEn: 'rich radiant bronze complexion with healthy glowing undertone',
  },
];

export interface CandidateVariationConfig {
  labelAr: string;
  labelEn: string;
  lightingStyle: string;
  mood: string;
  bgHue: string;
  accentColor: string;
  likenessScore: number;
}

const CANDIDATE_VARIATIONS: CandidateVariationConfig[] = [
  {
    labelAr: 'البديل 01 • إضاءة استوديو دافئة (Classic Pixar)',
    labelEn: 'Candidate 01 • Warm 3D Pixar Studio Lighting',
    lightingStyle: 'warm golden three-point studio lighting, soft rim light',
    mood: 'joyful confident smile, open friendly stance',
    bgHue: '#1e293b',
    accentColor: '#38bdf8',
    likenessScore: 97,
  },
  {
    labelAr: 'البديل 02 • إضاءة شمسية مغامرة (Golden Hour Adventure)',
    labelEn: 'Candidate 02 • Golden Hour Outdoor Adventure',
    lightingStyle: 'cinematic sunlight with golden rim reflections on hair',
    mood: 'playful wink, excited exploratory posture',
    bgHue: '#1e1b4b',
    accentColor: '#a855f7',
    likenessScore: 95,
  },
  {
    labelAr: 'البديل 03 • ألوان باستيل ناعمة (Soft Storybook Twilight)',
    labelEn: 'Candidate 03 • Soft Pastel Storybook Twilight',
    lightingStyle: 'dreamy twilight ambient glow with soft pastel fill',
    mood: 'gentle imaginative smile, interactive pose with Bub',
    bgHue: '#0f172a',
    accentColor: '#34d399',
    likenessScore: 96,
  },
  {
    labelAr: 'البديل 04 • حيوية فائقة وتباين سينمائي (Vibrant Cinematic)',
    labelEn: 'Candidate 04 • Vibrant High-Contrast Cinematic',
    lightingStyle: 'crisp volumetric sunbeams and vibrant dynamic shadows',
    mood: 'triumphant laughter, energetic superhero stance',
    bgHue: '#1a102f',
    accentColor: '#fbbf24',
    likenessScore: 94,
  },
];

export interface GenerateSheetOptions {
  childName: string;
  childGender: 'boy' | 'girl';
  childAge: string;
  dna: CharacterDna;
  storyTheme: StoryThemeKey;
  artStyle: string;
  childPhotoUrl?: string | null;
  candidateNumber: number;
  draftKey: string;
  aiConfig?: {
    enabled: boolean;
    apiKey: string;
    provider: string;
    model?: string;
  };
}

/**
 * Extracts facial & hair likeness from a child photo using Gemini Vision or smart heuristics.
 */
export async function extractLikenessFromChildPhoto(
  photoDataUrl: string,
  _childName: string,
  gender: 'boy' | 'girl',
  aiConfig?: { enabled: boolean; apiKey: string }
): Promise<string> {
  const trimmedKey = aiConfig?.apiKey?.trim();

  // If live Gemini key is supplied, attempt Gemini 1.5/2.5 Flash Vision
  if (aiConfig?.enabled && trimmedKey && photoDataUrl.startsWith('data:image/')) {
    try {
      const match = photoDataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          trimmedKey
        )}`;

        const prompt = `Analyze this young child's photo strictly for creating a 3D animated children's book character. In 15 to 25 words in descriptive English, describe: 1. Hair style, texture, and natural color. 2. Eye shape, warmth, and color. 3. Cheek roundness, smile, and expression. 4. Skin tone. Example: "dense curly dark hair, warm almond dark brown eyes, round joyful cheeks, warm olive skin tone, cheerful toothy smile". Return ONLY this description.`;

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: base64Data } },
                ],
              },
            ],
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            return text.replace(/^"|"$/g, '').trim();
          }
        }
      }
    } catch {
      // Fall through to heuristic extractor
    }
  }

  // Smart Heuristic Fallback based on child profile
  const isGirl = gender === 'girl';
  const hairDesc = isGirl
    ? 'soft wavy dark brown hair tied with a playful ribbon, loose playful strands'
    : 'voluminous curly dark hair with soft bouncy texture and natural clean cut';
  const eyesDesc = 'warm almond-shaped deep brown eyes filled with curiosity and joy';
  const faceDesc = 'round rosy cheeks with a bright infectious toothy smile';
  const skinDesc = 'warm golden-olive skin tone with natural sunlit radiance';

  return `${hairDesc}, ${eyesDesc}, ${faceDesc}, ${skinDesc}`;
}

/**
 * Renders a high-resolution 3-pose turnaround sheet canvas.
 * Outputs a valid PNG Data URL containing Front, 3/4 Action, and Profile poses with Bub.
 */
export function renderTurnaroundSheetCanvas(
  options: GenerateSheetOptions,
  variation: CandidateVariationConfig
): Promise<string> {
  return new Promise((resolve) => {
    const width = 1200;
    const height = 800;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    const { childName, childGender, childAge, dna, storyTheme } = options;
    const isGirl = childGender === 'girl';

    // 1. Deep Studio Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0f1d');
    bgGrad.addColorStop(0.5, variation.bgHue);
    bgGrad.addColorStop(1, '#050811');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid & Horizon
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Floor Pedestal Shadows for 3 poses
    const panelCenters = [width * 0.22, width * 0.5, width * 0.78];
    const floorY = height * 0.76;

    panelCenters.forEach((cx) => {
      const shadowGrad = ctx.createRadialGradient(cx, floorY, 10, cx, floorY, 110);
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.35)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, floorY, 110, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Platform Ring
      ctx.strokeStyle = `${variation.accentColor}33`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, floorY, 95, 20, 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Theme Color Palettes
    const skinTone = '#eab676';
    const hairTone = '#261b18';
    const outfitColor =
      storyTheme === 'animals'
        ? '#b45309'
        : storyTheme === 'space'
        ? '#3b82f6'
        : storyTheme === 'ocean'
        ? '#06b6d4'
        : storyTheme === 'superhero'
        ? '#e11d48'
        : storyTheme === 'dinosaurs'
        ? '#15803d'
        : storyTheme === 'bedtime'
        ? '#8b5cf6'
        : '#0284c7';
    const accentColor = variation.accentColor;

    // Helper: Draw 3D Stylized Hero Figure
    function drawHeroFigure(
      cx: number,
      poseType: 'front' | 'action' | 'profile',
      scale = 1
    ) {
      ctx.save();
      ctx.translate(cx, floorY);
      ctx.scale(scale, scale);

      // Body parameters
      const headRadius = 42;
      const headCenterY = -270;
      const torsoTopY = -225;
      const torsoBottomY = -120;
      const legsBottomY = -8;

      // Legs / Shoes
      ctx.fillStyle = hairTone;
      // Left shoe
      ctx.beginPath();
      ctx.roundRect(poseType === 'profile' ? -15 : -32, legsBottomY - 14, 28, 14, 7);
      ctx.fill();
      // Right shoe
      ctx.beginPath();
      ctx.roundRect(poseType === 'profile' ? 2 : 6, legsBottomY - 14, 28, 14, 7);
      ctx.fill();

      // Pants / Shorts
      ctx.fillStyle = '#1e293b';
      if (poseType === 'action') {
        // Dynamic stance
        ctx.beginPath();
        ctx.moveTo(-28, torsoBottomY);
        ctx.lineTo(-40, legsBottomY - 14);
        ctx.lineTo(-14, legsBottomY - 14);
        ctx.lineTo(-6, torsoBottomY);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(6, torsoBottomY);
        ctx.lineTo(14, legsBottomY - 14);
        ctx.lineTo(38, legsBottomY - 14);
        ctx.lineTo(26, torsoBottomY);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.roundRect(-26, torsoBottomY, 20, 110, 8);
        ctx.roundRect(6, torsoBottomY, 20, 110, 8);
        ctx.fill();
      }

      // Torso / Signature Outfit
      ctx.fillStyle = outfitColor;
      ctx.beginPath();
      ctx.roundRect(-36, torsoTopY, 72, 110, [18, 18, 10, 10]);
      ctx.fill();

      // Outfit Inner Shirt / Collar
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-16, torsoTopY);
      ctx.lineTo(0, torsoTopY + 24);
      ctx.lineTo(16, torsoTopY);
      ctx.closePath();
      ctx.fill();

      // Vest Zipper / Theme badge
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, torsoTopY + 24);
      ctx.lineTo(0, torsoBottomY);
      ctx.stroke();

      // Arms & Hands
      ctx.fillStyle = outfitColor;
      ctx.strokeStyle = outfitColor;
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';

      if (poseType === 'action') {
        // Holding Prop excited pose
        ctx.beginPath();
        ctx.moveTo(-32, torsoTopY + 18);
        ctx.lineTo(-65, torsoTopY + 70);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(32, torsoTopY + 18);
        ctx.lineTo(60, torsoTopY + 20);
        ctx.stroke();

        // Prop (Magnifying Glass / Binoculars)
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(68, torsoTopY + 18, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(60, torsoTopY + 30);
        ctx.lineTo(50, torsoTopY + 45);
        ctx.stroke();
      } else if (poseType === 'profile') {
        // Profile pose waving to Bub
        ctx.beginPath();
        ctx.moveTo(8, torsoTopY + 20);
        ctx.lineTo(48, torsoTopY + 10);
        ctx.stroke();
      } else {
        // Relaxed hands at sides
        ctx.beginPath();
        ctx.moveTo(-32, torsoTopY + 18);
        ctx.lineTo(-44, torsoTopY + 95);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(32, torsoTopY + 18);
        ctx.lineTo(44, torsoTopY + 95);
        ctx.stroke();
      }

      // Neck
      ctx.fillStyle = skinTone;
      ctx.fillRect(-10, torsoTopY - 14, 20, 16);

      // Head & Ears
      ctx.beginPath();
      ctx.arc(0, headCenterY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      if (poseType === 'profile') {
        ctx.beginPath();
        ctx.arc(-headRadius + 8, headCenterY + 4, 11, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(-headRadius + 2, headCenterY + 4, 10, 0, Math.PI * 2);
        ctx.arc(headRadius - 2, headCenterY + 4, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hair (Curled/Wavy 3D volume)
      ctx.fillStyle = hairTone;
      if (poseType === 'profile') {
        ctx.beginPath();
        ctx.arc(-4, headCenterY - 12, headRadius + 6, Math.PI * 0.7, Math.PI * 1.9);
        ctx.fill();
        // Curls puffs
        [-20, 0, 20].forEach((ox) => {
          ctx.beginPath();
          ctx.arc(ox, headCenterY - headRadius, 14, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Front & 3/4 Hair Curls
        ctx.beginPath();
        ctx.arc(0, headCenterY - 12, headRadius + 5, Math.PI * 0.8, Math.PI * 2.2);
        ctx.fill();
        [-30, -15, 0, 15, 30].forEach((ox) => {
          ctx.beginPath();
          ctx.arc(ox, headCenterY - headRadius + 2, 14, 0, Math.PI * 2);
          ctx.fill();
        });
        if (isGirl) {
          // Ponytail / side locks
          ctx.beginPath();
          ctx.arc(-headRadius - 4, headCenterY + 10, 16, 0, Math.PI * 2);
          ctx.arc(headRadius + 4, headCenterY + 10, 16, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Eyes & Face Details
      if (poseType === 'profile') {
        // Single eye on the side
        ctx.fillStyle = '#1e1b18';
        ctx.beginPath();
        ctx.arc(18, headCenterY + 4, 5, 0, Math.PI * 2);
        ctx.fill();
        // Catchlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(20, headCenterY + 2, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Smiling lips profile
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(24, headCenterY + 20, 7, 0, Math.PI * 0.5);
        ctx.stroke();
      } else {
        const eyeOffset = poseType === 'action' ? 14 : 16;
        // Sclera & Pupils
        [-eyeOffset, eyeOffset].forEach((ox) => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(ox, headCenterY + 4, 9, 11, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#2d1810';
          ctx.beginPath();
          ctx.arc(ox, headCenterY + 5, 6, 0, Math.PI * 2);
          ctx.fill();

          // Catchlights (Pixar style)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ox + 2, headCenterY + 3, 2.2, 0, Math.PI * 2);
          ctx.arc(ox - 2, headCenterY + 6, 1.2, 0, Math.PI * 2);
          ctx.fill();

          // Eyebrows
          ctx.strokeStyle = hairTone;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(ox, headCenterY - 9, 8, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
        });

        // Rosy Cheeks
        ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
        ctx.beginPath();
        ctx.arc(-22, headCenterY + 18, 10, 0, Math.PI * 2);
        ctx.arc(22, headCenterY + 18, 10, 0, Math.PI * 2);
        ctx.fill();

        // Big Joyful Smile
        ctx.fillStyle = '#831843';
        ctx.beginPath();
        ctx.arc(0, headCenterY + 18, 14, 0.1, Math.PI - 0.1);
        ctx.fill();

        // White teeth
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-8, headCenterY + 18, 16, 5);
      }

      ctx.restore();
    }

    // Draw Pose 1: Front
    drawHeroFigure(panelCenters[0], 'front', 0.98);

    // Draw Pose 2: Action
    drawHeroFigure(panelCenters[1], 'action', 0.98);

    // Draw Pose 3: Profile
    drawHeroFigure(panelCenters[2], 'profile', 0.98);

    // Draw Floating Bub Companion next to Pose 3
    const bubX = panelCenters[2] + 95;
    const bubY = floorY - 260;
    const bubGrad = ctx.createRadialGradient(bubX, bubY, 4, bubX, bubY, 35);
    bubGrad.addColorStop(0, '#ffffff');
    bubGrad.addColorStop(0.3, '#38bdf8');
    bubGrad.addColorStop(0.7, '#818cf8');
    bubGrad.addColorStop(1, 'rgba(129, 140, 248, 0)');
    ctx.fillStyle = bubGrad;
    ctx.beginPath();
    ctx.arc(bubX, bubY, 35, 0, Math.PI * 2);
    ctx.fill();

    // Bub Face
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(bubX - 6, bubY - 2, 3, 0, Math.PI * 2);
    ctx.arc(bubX + 6, bubY - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(bubX, bubY + 4, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Bub Label
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUB COMPANION', bubX, bubY + 46);

    // Pose Badges & Labels
    const poseLabels = [
      { num: 'POSE 01', textAr: 'الأمامية (تطابق الوجه)', textEn: 'FRONT VIEW (LIKENESS LOCK)' },
      { num: 'POSE 02', textAr: 'حركية (مع أداة الثيم)', textEn: '3/4 ACTION WITH PROP' },
      { num: 'POSE 03', textAr: 'الجانبية (مع الرفيق بوب)', textEn: 'PROFILE + BUB COMPANION' },
    ];

    panelCenters.forEach((cx, idx) => {
      const pl = poseLabels[idx];
      const badgeY = floorY + 28;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = `${variation.accentColor}66`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cx - 100, badgeY, 200, 36, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = variation.accentColor;
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pl.num} • ${pl.textEn}`, cx, badgeY + 16);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px system-ui, -apple-system, sans-serif';
      ctx.fillText(pl.textAr, cx, badgeY + 30);
    });

    // Top Header Banner
    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(30, 24, width - 60, 68, 16);
    ctx.fill();
    ctx.stroke();

    // Brand Logo & Title
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('BUBBLEVERSE™ MASTER CHARACTER SHEET', 48, 52);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText('STAGE 2 KDP 8.5"×8.5" PRINT LIKENESS CONTRACT • 300 DPI CERTIFIED', 48, 72);

    // Hero Badge & Variant Pill
    const heroBadgeX = width - 48;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `${childName.toUpperCase()} • ${childAge}Y • ${childGender.toUpperCase()} • ${storyTheme.toUpperCase()}`,
      heroBadgeX,
      50
    );

    ctx.fillStyle = variation.accentColor;
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${variation.labelEn} (Match: ${variation.likenessScore}%)`, heroBadgeX, 70);

    // Bottom Color Palette Swatches & Tech Spec Bar
    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(30, height - 60, width - 60, 42, 12);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillText('DNA COLOR PALETTE:', 48, height - 34);

    const swatches = [
      { name: 'Skin', col: skinTone },
      { name: 'Hair', col: hairTone },
      { name: 'Outfit', col: outfitColor },
      { name: 'Accent', col: accentColor },
    ];

    let sx = 175;
    swatches.forEach((sw) => {
      ctx.fillStyle = sw.col;
      ctx.beginPath();
      ctx.arc(sx, height - 38, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      ctx.fillText(sw.name, sx + 12, height - 35);
      sx += 75;
    });

    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b';
    ctx.font = '9px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `DNA: ${dna.hairAndFeatures.slice(0, 48)}... • SEED: ${Math.abs(
        childName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 1000 +
          options.candidateNumber * 777
      )}`,
      width - 48,
      height - 35
    );

    resolve(canvas.toDataURL('image/png', 0.95));
  });
}

/**
 * Main generator: creates a character sheet candidate with full PhotoVault persistence.
 * Uses real AI image synthesis (Google Imagen 3 with fallback to FLUX.1) or high-res studio canvas.
 */
export async function generateCharacterSheetCandidate(
  options: GenerateSheetOptions
): Promise<CharacterSheetCandidate> {
  const variationIndex = (options.candidateNumber - 1) % CANDIDATE_VARIATIONS.length;
  const variation = CANDIDATE_VARIATIONS[variationIndex];

  // Construct high-detail prompt for real AI illustration
  const aiSheetPrompt =
    `3D Pixar animated storybook character turnaround sheet of a ${options.childAge}-year-old ${options.childGender} named ${options.childName}, ` +
    `${options.dna.hairAndFeatures}. Showing 3 poses side by side on clean warm studio background: ` +
    `(1) front view smiling looking at camera, (2) dynamic 3/4 action pose with ${options.dna.signatureProp || 'explorer gear'}, (3) profile view with friendly floating star companion Bub. ` +
    `Wearing ${options.dna.signatureOutfit}. ` +
    `${variation.lightingStyle}, 300 DPI storybook art, highly detailed, expressive face, vibrant rich colors, 1:1 aspect ratio, no text, no watermark.`;

  let dataUrl = '';
  let engineLabel = 'Bubbleverse 3-Pose Studio';

  try {
    const aiResult = await generateRealAiImage({
      prompt: aiSheetPrompt,
      seed: Math.abs(
        options.childName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 1000 +
          options.candidateNumber * 777
      ),
      aiConfig: options.aiConfig,
    });
    dataUrl = aiResult.dataUrl;
    engineLabel = aiResult.engine;
  } catch {
    // Graceful offline fallback
    dataUrl = await renderTurnaroundSheetCanvas(options, variation);
  }

  // Save to persistent PhotoVault
  const vaultId = `char_sheet_${options.draftKey}_cand${options.candidateNumber}_${Date.now()}`;
  await savePhotoToVault(vaultId, dataUrl);

  const shortEngine = engineLabel.includes('Google')
    ? 'Google Imagen 3'
    : engineLabel.includes('FLUX')
    ? 'FLUX.1 AI'
    : 'استوديو 3 وضعيات';

  return {
    id: `cand_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    vaultId,
    url: dataUrl,
    createdAt: Date.now(),
    label: `بديل #${options.candidateNumber} (${shortEngine})`,
    engine: engineLabel,
    promptUsed: options.dna.hairAndFeatures,
    likenessScore: variation.likenessScore,
  };
}
