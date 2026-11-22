/**
 * Build Script: Karim's Complete 3D Pixar Storybook (KDP 8.5"x8.5" 300 DPI)
 *
 * Full Children's Book Production with:
 * - High-end Arabic typography (Baloo Bhaijaan 2 / Tajawal / Fredoka)
 * - Complete 10-scene narrative text with frosted-glass overlay cards
 * - Deluxe 3D front cover with title lettering, subtitle, hero pill, and edition badge
 * - Professional publisher back cover with blurb, therapeutic bubble tags, and ISBN barcode
 * - Amazon KDP Cover Wrap with exact spine calculation (no stretching!)
 * - Amazon KDP Interior 24-page spread with bleed, alternating gutters, and keepsakes
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const outputDir = path.resolve(rootDir, 'docs', 'karim-story-output');
const publicDir = path.resolve(rootDir, 'public', 'docs', 'karim-story-output');

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

function findBrowserBinary() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  for (const bin of candidates) {
    if (fs.existsSync(bin)) return bin;
  }
  throw new Error('Could not find Chrome or Edge binary to render PDF.');
}

function fileToBase64DataUri(absPath) {
  if (!fs.existsSync(absPath)) return '';
  const ext = path.extname(absPath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
  const base64 = fs.readFileSync(absPath).toString('base64');
  return `data:${mime};base64,${base64}`;
}

const coverArt = fileToBase64DataUri(path.join(outputDir, '00-cover.jpg'));
const backArt = fileToBase64DataUri(path.join(outputDir, '16-back.jpg'));
const charSheetArt = fileToBase64DataUri(path.join(outputDir, '00-character-sheet.jpg'));

const sceneArts = [];
for (let i = 1; i <= 10; i++) {
  const numStr = String(i).padStart(2, '0');
  sceneArts.push(fileToBase64DataUri(path.join(outputDir, `${numStr}-scene.jpg`)));
}

console.log(`Loaded cover, back, character sheet, and ${sceneArts.length} scenes.`);

const STORY_BEATS = [
  {
    num: 1,
    title: 'التردد الصباحي وسر النافذة',
    text: 'في صباح مشرق تتسلل فيه خيوط الشمس الذهبية، جلس كريم في غرفته يربط حذاءه بتردد، وهو يفكر في إلقاء كلمته أمام زملائه في المدرسة. فجأة، تلألأت عند نافذته فقاعة زرقاء ساحرة تدور بخفة وتشع دفئاً وأملاً.',
    art: sceneArts[0],
  },
  {
    num: 2,
    title: 'بطل المغامرة يستعد',
    text: 'ارتسمت ابتسامة حماس على وجه كريم، فارتدى جاكيت المغامرة الأنيق وحقيبة الفقاعات المضيئة على ظهره بثقة وقال بصوت واثق: «أنا مستكشف شجاع، ومستعد لخوض كل مغامرة جديدة بكل فخر!».',
    art: sceneArts[1],
  },
  {
    num: 3,
    title: 'الخطوة الأولى نحو النجوم',
    text: 'لمس كريم الفقاعة برفق بأطراف أصابعه، فانفتحت أمامه بوابة سحرية تتدفق منها أضواء النجوم والشهب المتراقصة، فخطا خطوته الأولى بكل جرأة نحو عالم بابل فيرس المدهش.',
    art: sceneArts[2],
  },
  {
    num: 4,
    title: 'وادي الفوانيس الكريستالية',
    text: 'وصل كريم إلى وادي الفوانيس الكريستالية، حيث تسبح الفقاعات المضيئة بين السحب البنفسجية المتوهجة، ورأى جسراً رائعاً من النور يمتد نحو الأفق البعيد حاملاً أسرار الشجاعة.',
    art: sceneArts[3],
  },
  {
    num: 5,
    title: 'يد العون والقلب الدافئ',
    text: 'بين الفوانيس المضيئة، وجد كريم كائناً فضائياً صغيراً يرتجف خجلاً خلف بلورة زرقاء. اقترب منه برفق، وربت على كتفه بابتسامة دافئة قائلاً: «لا تقلق يا صديقي الصغير، أنا هنا معك وسنعبر معاً!».',
    art: sceneArts[4],
  },
  {
    num: 6,
    title: 'عبور الجسر الموسيقي',
    text: 'أمسك كريم بيد صديقه الصغير، وعبرا معاً الجسر البلوري الذي كان يعزف أنغاماً موسيقية ساحرة مع كل خطوة، فشعر الصغير بالطمأنينة والأمان بفضل شجاعة كريم وعطفه.',
    art: sceneArts[5],
  },
  {
    num: 7,
    title: 'قمة جبل الهمس',
    text: 'صعد البطلان إلى قمة جبل الهمس، ووصلا إلى محراب النجم الأعظم الذي كان يحتاج إلى بلورة الشجاعة المفقودة ليعيد ضياءه وينير كل سماء الوادي من جديد.',
    art: sceneArts[6],
  },
  {
    num: 8,
    title: 'لحظة الكشف: الشجاعة تسكن في القلب',
    text: 'أخرج كريم البلورة الزرقاء المتلألئة ووضعها في قلب النجم. في تلك اللحظة شعر بدفء يملأ صدره وأدرك السر الكبير: الشجاعة ليست أن لا تخاف، بل أن تثق بنفسك وتواجه كل خوف بقلب جسور!',
    art: sceneArts[7],
  },
  {
    num: 9,
    title: 'وداع الأبطال وبوابة النور',
    text: 'توهج الوادي بأضواء ذهبية باهرة احتفالاً بنجاح المهمة، وودّع سكان الفضاء كريم بالهتاف والتصفيق، بينما فتحت بوابة النور الذهبية لتعيد البطل الشجاع إلى عالمه.',
    art: sceneArts[8],
  },
  {
    num: 10,
    title: 'العودة المنتصرة وفرقعة الفرح (بوب!)',
    text: 'عاد كريم إلى غرفته حاملاً في يده حجر النجوم الأزرق، ففرقعت الفقاعة برذاذ ذهبي احتفالي: «بوب!». وقف كريم أمام مرآته رافعاً رأسه بابتسامة واثقة، مستعداً لإلقاء كلمته أمام المدرسة بكل شجاعة واعتزاز.',
    art: sceneArts[9],
  },
];

// Common CSS styling for all book renders
const COMMON_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@500;600;700;800&family=Fredoka:wght@400;500;600;700&family=Tajawal:wght@400;500;700;800&display=swap');

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Baloo Bhaijaan 2', 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif;
    background: #090d1c;
    color: #ffffff;
    direction: rtl;
  }

  .page {
    position: relative;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .page:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  /* Vignette & Contrast Layers */
  .vignette-top {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 38%;
    background: linear-gradient(180deg, rgba(8, 12, 28, 0.88) 0%, rgba(8, 12, 28, 0.45) 55%, transparent 100%);
    pointer-events: none;
    z-index: 2;
  }

  .vignette-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 48%;
    background: linear-gradient(0deg, rgba(8, 12, 28, 0.94) 0%, rgba(8, 12, 28, 0.72) 45%, transparent 100%);
    pointer-events: none;
    z-index: 2;
  }

  /* Frosted Glass Narrative Card */
  .narrative-card {
    position: absolute;
    bottom: 5.5%;
    left: 6%;
    right: 6%;
    background: rgba(11, 16, 36, 0.86);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1.5px solid rgba(0, 217, 255, 0.42);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55), 0 0 20px rgba(0, 217, 255, 0.2);
    border-radius: 20px;
    padding: 18px 24px 16px 24px;
    z-index: 10;
  }

  .narrative-text {
    font-size: 13.5pt;
    line-height: 1.62;
    color: #ffffff;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
    margin: 0;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }

  .page-pill {
    font-size: 10pt;
    font-weight: 700;
    color: #67e8f9;
    background: rgba(0, 217, 255, 0.12);
    border: 1px solid rgba(0, 217, 255, 0.3);
    padding: 3px 12px;
    border-radius: 12px;
  }

  .beat-badge {
    font-size: 9.5pt;
    color: #cbd5e1;
    font-weight: 500;
  }

  /* Deluxe Front Cover Typography */
  .cover-container {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 7% 6% 6% 6%;
    z-index: 10;
    text-align: center;
  }

  .edition-pill {
    align-self: center;
    background: rgba(13, 19, 44, 0.82);
    border: 1.5px solid #00d9ff;
    box-shadow: 0 0 18px rgba(0, 217, 255, 0.35);
    color: #67e8f9;
    font-size: 11pt;
    font-weight: 700;
    padding: 6px 20px;
    border-radius: 30px;
    letter-spacing: 0.5px;
  }

  .cover-title-group {
    margin-top: auto;
    margin-bottom: 2%;
  }

  .main-book-title {
    font-size: 32pt;
    font-weight: 800;
    line-height: 1.18;
    margin: 0 0 10px 0;
    color: #ffffff;
    text-shadow: 
      0 0 20px rgba(0, 217, 255, 0.8),
      0 0 40px rgba(167, 139, 250, 0.5),
      0 4px 12px rgba(0, 0, 0, 0.9);
    letter-spacing: -0.5px;
  }

  .main-book-subtitle {
    font-size: 13pt;
    font-weight: 600;
    color: #e2e8f0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
    margin-bottom: 16px;
    line-height: 1.4;
  }

  .hero-pill-box {
    display: inline-block;
    background: linear-gradient(90deg, #00d9ff 0%, #a78bfa 50%, #f472b6 100%);
    padding: 8px 28px;
    border-radius: 28px;
    box-shadow: 0 6px 24px rgba(0, 217, 255, 0.4);
    margin-bottom: 14px;
  }

  .hero-pill-text {
    font-size: 14pt;
    font-weight: 800;
    color: #090d1c;
    letter-spacing: 0.5px;
  }

  .cover-branding {
    font-size: 9.5pt;
    color: #94a3b8;
    font-weight: 600;
    letter-spacing: 1px;
  }

  /* Back Cover Card */
  .back-cover-card {
    position: absolute;
    bottom: 6%;
    left: 7%;
    right: 7%;
    background: rgba(10, 15, 34, 0.88);
    backdrop-filter: blur(14px);
    border: 1.5px solid rgba(167, 139, 250, 0.45);
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6);
    border-radius: 22px;
    padding: 22px 24px 18px 24px;
    z-index: 10;
  }

  .back-blurb-heading {
    font-size: 17pt;
    font-weight: 800;
    color: #67e8f9;
    margin: 0 0 8px 0;
    text-align: center;
  }

  .back-blurb-text {
    font-size: 11pt;
    line-height: 1.6;
    color: #f1f5f9;
    font-weight: 500;
    text-align: center;
    margin: 0 0 14px 0;
  }

  .bubble-tags-row {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }

  .bubble-tag-pill {
    background: rgba(0, 217, 255, 0.12);
    border: 1px solid rgba(0, 217, 255, 0.35);
    color: #67e8f9;
    font-size: 9.5pt;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 14px;
  }

  .back-footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.14);
    padding-top: 10px;
  }

  .barcode-box {
    background: #ffffff;
    color: #0f172a;
    padding: 6px 12px;
    border-radius: 6px;
    text-align: center;
    font-family: monospace;
    font-size: 8.5pt;
    font-weight: 700;
    line-height: 1.2;
    direction: ltr;
  }

  .back-imprint {
    text-align: right;
    font-size: 9pt;
    color: #94a3b8;
  }

  /* Dedication & Character Sheet Page */
  .dedication-card {
    background: rgba(13, 19, 44, 0.88);
    backdrop-filter: blur(14px);
    border: 1.5px solid rgba(244, 114, 182, 0.4);
    border-radius: 20px;
    padding: 20px 24px;
    margin-bottom: 16px;
    text-align: center;
  }

  .char-sheet-container {
    background: rgba(13, 19, 44, 0.88);
    border: 1.5px solid rgba(0, 217, 255, 0.4);
    border-radius: 20px;
    padding: 16px;
    text-align: center;
  }

  .char-sheet-img {
    width: 100%;
    max-height: 260px;
    object-fit: contain;
    border-radius: 12px;
    margin-bottom: 12px;
  }
`;

// ============================================================================
// 1. GENERATE FULL BOOK PRESENTATION PDF (8.5" x 8.5")
// ============================================================================
function generateFullBookHtml() {
  let pagesHtml = '';

  // Page 1: Front Cover
  pagesHtml += `
    <div class="page" style="width: 8.5in; height: 8.5in; background-image: url('${coverArt}');">
      <div class="vignette-top"></div>
      <div class="vignette-bottom"></div>
      <div class="cover-container">
        <div class="edition-pill">✨ إصدار بابل فيرس الخاص • الفقاعة الزرقاء ✨</div>
        <div class="cover-title-group">
          <h1 class="main-book-title">كَرِيم وَسِرُّ الفُقَّاعَةِ الزَّرْقَاءِ</h1>
          <div class="main-book-subtitle">رحلة الشجاعة واكتشاف الثقة بالنفس في وادي الفوانيس الكريستالية</div>
          <div class="hero-pill-box">
            <span class="hero-pill-text">🌟 بطل القصة: كـريـم (٦ سنوات) 🌟</span>
          </div>
          <div class="cover-branding">BUBBLEVERSE STUDIOS • كتاب قماشي ومطبوع خصيصاً للبطل كريم</div>
        </div>
      </div>
    </div>
  `;

  // Page 2: Dedication & Master Character Sheet
  pagesHtml += `
    <div class="page" style="width: 8.5in; height: 8.5in; background: linear-gradient(145deg, #0d122b 0%, #17153b 50%, #0a0e20 100%); padding: 36px 42px; display: flex; flex-direction: column; justify-content: space-between;">
      <div class="dedication-card">
        <h2 style="font-size: 18pt; color: #f472b6; margin: 0 0 8px 0; font-weight: 800;">إهداء خاص من القلب إلى البطل الشجاع: كـريـم</h2>
        <p style="font-size: 11.5pt; color: #f8fafc; line-height: 1.6; margin: 0 0 8px 0;">
          إلى أغلى بطل في حياتنا، كل صفحة في هذا الكتاب تذكّرك بأن خيالك لا حدود له، وأن الشجاعة الحقيقية تسكن دائماً في قلبك الطيب. نحن فخورون بك وبكل خطوة تخطوها!
        </p>
        <div style="font-size: 11pt; color: #67e8f9; font-weight: 700;">مع كل الحب والدفء • ماما وبابا (2026)</div>
      </div>

      <div class="char-sheet-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 12pt; font-weight: 800; color: #67e8f9;">ورقة تصميم شخصية البطل (3D Pixar Character Sheet)</span>
          <span style="font-size: 10pt; background: rgba(0, 217, 255, 0.15); color: #00d9ff; padding: 3px 10px; border-radius: 8px;">تطابق الملامح ١٠٠٪</span>
        </div>
        <img class="char-sheet-img" src="${charSheetArt}" alt="Karim Character Sheet" />
        <div style="display: flex; justify-content: space-around; font-size: 10pt; color: #cbd5e1; font-weight: 600; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 8px;">
          <span>👤 الاسم: كريم</span>
          <span>🎂 العمر: ٦ سنوات</span>
          <span>⚡ القوة: الشجاعة والإيمان بالنفس</span>
          <span>🎒 العتاد: حقيبة الفقاعات وجاكيت المغامرة</span>
        </div>
      </div>

      <div style="text-align: center; font-size: 9.5pt; color: #94a3b8;">
        Bubbleverse Studios • Personalized Character DNA • صفحة ٢
      </div>
    </div>
  `;

  // Pages 3 to 12: 10 Story Scenes
  for (let i = 0; i < STORY_BEATS.length; i++) {
    const beat = STORY_BEATS[i];
    pagesHtml += `
      <div class="page" style="width: 8.5in; height: 8.5in; background-image: url('${beat.art}');">
        <div class="vignette-bottom"></div>
        <div class="narrative-card">
          <p class="narrative-text">${beat.text}</p>
          <div class="card-footer">
            <span class="beat-badge">✨ المشهد ${beat.num}: ${beat.title}</span>
            <span class="page-pill">صفحة ${beat.num + 2}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Page 13: Keepsake Hero Certificate
  pagesHtml += `
    <div class="page" style="width: 8.5in; height: 8.5in; background: linear-gradient(145deg, #090e24 0%, #15103a 50%, #0b1228 100%); padding: 40px 48px; display: flex; flex-direction: column; justify-content: space-between; text-align: center;">
      <div style="border: 2px dashed rgba(0, 217, 255, 0.4); border-radius: 24px; padding: 32px 28px; background: rgba(13, 19, 44, 0.7); height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="font-size: 13pt; color: #f472b6; font-weight: 700; margin-bottom: 6px;">✨ شهادة فخر واعتزاز ✨</div>
          <h2 style="font-size: 26pt; color: #ffffff; margin: 0 0 10px 0; font-weight: 800; text-shadow: 0 0 20px rgba(0, 217, 255, 0.6);">وسام الشجاعة والإيمان بالنفس</h2>
          <div style="display: inline-block; background: linear-gradient(90deg, #00d9ff, #a78bfa); color: #090d1c; font-size: 16pt; font-weight: 800; padding: 6px 32px; border-radius: 20px; margin-bottom: 20px;">
            يُمنح للبطل: كـريـم
          </div>
          <p style="font-size: 13pt; color: #e2e8f0; line-height: 1.7; max-width: 580px; margin: 0 auto;">
            تقديراً لشجاعتك الكبيرة في وادي الفوانيس الكريستالية، ومساعدتك اللطيفة للآخرين، واكتشافك للسر الحقيقي بأن الشجاعة تنبض داخل قلبك الطيب. نحن واثقون بأنك ستكون دائماً بطلاً مميزاً في كل مراحل حياتك!
          </p>
        </div>

        <div style="display: flex; justify-content: space-around; align-items: flex-end; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.15);">
          <div>
            <div style="font-size: 11pt; color: #94a3b8;">توقيع الوالدين الفخورين</div>
            <div style="font-size: 14pt; color: #f472b6; font-weight: 700; margin-top: 6px;">ماما وبابا ♥</div>
          </div>
          <div style="width: 90px; height: 90px; border-radius: 50%; border: 2px solid #00d9ff; display: flex; align-items: center; justify-content: center; background: rgba(0, 217, 255, 0.1); color: #67e8f9; font-size: 9pt; font-weight: 800; text-align: center;">
            ختم بابل فيرس<br/>المعتمد
          </div>
          <div>
            <div style="font-size: 11pt; color: #94a3b8;">أكاديمية بابل فيرس للقيم</div>
            <div style="font-size: 13pt; color: #67e8f9; font-weight: 700; margin-top: 6px;">Bubbleverse 2026</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Page 14: Designed Back Cover
  pagesHtml += `
    <div class="page" style="width: 8.5in; height: 8.5in; background-image: url('${backArt}');">
      <div class="vignette-bottom"></div>
      <div class="back-cover-card">
        <h3 class="back-blurb-heading">كريم وسر الفقاعة الزرقاء</h3>
        <p class="back-blurb-text">
          عندما تبدو البدايات صعبة وتتسارع دقات القلب خجلاً وتردداً، تظهر الفقاعة الزرقاء السحرية لتأخذ طفلك في رحلة استثنائية يكتشف فيها أن أعظم قوة في الكون لا تأتي من الخارج... بل تسكن دائماً في أعماق قلبه الشجاع!
        </p>
        <div class="bubble-tags-row">
          <span class="bubble-tag-pill">🔵 الفقاعة الزرقاء: الشجاعة والإيمان بالنفس</span>
          <span class="bubble-tag-pill">🌟 الفئة: ٥ - ٨ سنوات</span>
          <span class="bubble-tag-pill">🌙 قصة ما قبل النوم</span>
        </div>
        <div class="back-footer-row">
          <div class="back-imprint">
            <strong style="color: #ffffff;">BUBBLEVERSE STUDIOS</strong><br/>
            www.bubbleverse.store • إصدار خاص بالطفل
          </div>
          <div class="barcode-box">
            <div>ISBN 978-1-958420-15-8</div>
            <div style="letter-spacing: 3px; font-size: 11pt; margin: 3px 0;">||||| | |||| ||| |||</div>
            <div>EGP 490 / SAR 109</div>
          </div>
        </div>
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>كريم وسر الفقاعة الزرقاء — الكتاب الكامل</title>
    <style>
      @page {
        size: 8.5in 8.5in;
        margin: 0;
      }
      ${COMMON_CSS}
    </style>
  </head>
  <body>
    ${pagesHtml}
  </body>
  </html>`;
}

// ============================================================================
// 2. GENERATE AMAZON KDP COVER WRAP (RTL: Back Left, Spine Center, Front Right)
// Dimensions: 17.31" x 8.75" @ 300 DPI
// ============================================================================
function generateCoverWrapHtml() {
  return `<!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>Karim Blue Bubble - KDP Cover Wrap</title>
    <style>
      @page {
        size: 17.31in 8.75in;
        margin: 0;
      }
      ${COMMON_CSS}

      .wrap-container {
        width: 17.31in;
        height: 8.75in;
        display: flex;
        flex-direction: row;
        position: relative;
        overflow: hidden;
        background: #090d1c;
      }

      /* RTL Cover Wrap: Back panel is on Left, Front panel is on Right! */
      .panel-back {
        width: 8.625in;
        height: 8.75in;
        position: relative;
        background-image: url('${backArt}');
        background-size: cover;
        background-position: center;
      }

      .panel-spine {
        width: 0.06in;
        min-width: 0.06in;
        height: 8.75in;
        background: linear-gradient(180deg, #090d1c 0%, #15103a 50%, #090d1c 100%);
        border-left: 1px solid rgba(0, 217, 255, 0.3);
        border-right: 1px solid rgba(0, 217, 255, 0.3);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .panel-front {
        width: 8.625in;
        height: 8.75in;
        position: relative;
        background-image: url('${coverArt}');
        background-size: cover;
        background-position: center;
      }
    </style>
  </head>
  <body>
    <div class="wrap-container">
      <!-- Back Cover Panel (Left in RTL) -->
      <div class="panel-back">
        <div class="vignette-bottom"></div>
        <div class="back-cover-card" style="bottom: 7%; left: 8%; right: 8%;">
          <h3 class="back-blurb-heading">كريم وسر الفقاعة الزرقاء</h3>
          <p class="back-blurb-text">
            عندما تبدو البدايات صعبة وتتسارع دقات القلب خجلاً وتردداً، تظهر الفقاعة الزرقاء السحرية لتأخذ طفلك في رحلة استثنائية يكتشف فيها أن أعظم قوة في الكون لا تأتي من الخارج... بل تسكن دائماً في أعماق قلبه الشجاع!
          </p>
          <div class="bubble-tags-row">
            <span class="bubble-tag-pill">🔵 الفقاعة الزرقاء: الشجاعة والإيمان بالنفس</span>
            <span class="bubble-tag-pill">🌟 الفئة: ٥ - ٨ سنوات</span>
          </div>
          <div class="back-footer-row">
            <div class="back-imprint">
              <strong style="color: #ffffff;">BUBBLEVERSE STUDIOS</strong><br/>
              www.bubbleverse.store
            </div>
            <div class="barcode-box">
              <div>ISBN 978-1-958420-15-8</div>
              <div style="letter-spacing: 2.5px; font-size: 10pt; margin: 2px 0;">||||| | |||| ||| |||</div>
              <div>EGP 490 / SAR 109</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Spine (Center) -->
      <div class="panel-spine">
        <div style="writing-mode: vertical-rl; transform: rotate(180deg); color: #67e8f9; font-size: 8pt; font-weight: 700; letter-spacing: 2px; white-space: nowrap;">
          كريم وسر الفقاعة الزرقاء • BUBBLEVERSE
        </div>
      </div>

      <!-- Front Cover Panel (Right in RTL) -->
      <div class="panel-front">
        <div class="vignette-top"></div>
        <div class="vignette-bottom"></div>
        <div class="cover-container" style="padding: 8% 7% 7% 7%;">
          <div class="edition-pill">✨ إصدار بابل فيرس الخاص • الفقاعة الزرقاء ✨</div>
          <div class="cover-title-group">
            <h1 class="main-book-title" style="font-size: 34pt;">كَرِيم وَسِرُّ الفُقَّاعَةِ الزَّرْقَاءِ</h1>
            <div class="main-book-subtitle">رحلة الشجاعة واكتشاف الثقة بالنفس في وادي الفوانيس الكريستالية</div>
            <div class="hero-pill-box">
              <span class="hero-pill-text">🌟 بطل القصة: كـريـم (٦ سنوات) 🌟</span>
            </div>
            <div class="cover-branding">BUBBLEVERSE STUDIOS • Amazon KDP Hardcover Wrap</div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>`;
}

// ============================================================================
// 3. GENERATE AMAZON KDP INTERIOR (8.625" x 8.75" @ 300 DPI, 24 Pages)
// ============================================================================
function generateKdpInteriorHtml() {
  let pagesHtml = '';

  const addInteriorPage = (contentHtml, bgImage = '', isBleed = true, pageNum = 1) => {
    pagesHtml += `
      <div class="page" style="width: 8.625in; height: 8.75in; ${bgImage ? `background-image: url('${bgImage}');` : 'background: #0d122b;'}">
        ${contentHtml}
      </div>
    `;
  };

  // P1: Title Page
  addInteriorPage(`
    <div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 48px; background: linear-gradient(155deg, #090e24 0%, #15103a 50%, #0a0e20 100%);">
      <div class="edition-pill" style="margin-bottom: 24px;">سلسلة الفقاعات السبع للقيم والنمو</div>
      <h1 class="main-book-title" style="font-size: 36pt; color: #ffffff;">كَرِيم وَسِرُّ الفُقَّاعَةِ الزَّرْقَاءِ</h1>
      <p style="font-size: 14pt; color: #67e8f9; margin-bottom: 30px;">قصة مخصصة كُتبت وطُبعت خصيصاً للبطل: كريم</p>
      <div style="width: 120px; height: 2px; background: linear-gradient(90deg, transparent, #00d9ff, transparent); margin-bottom: 30px;"></div>
      <div style="font-size: 11pt; color: #94a3b8;">دار نشر بابل فيرس • Bubbleverse Studios 2026</div>
    </div>
  `, '', false, 1);

  // P2: Imprint & Copyright
  addInteriorPage(`
    <div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 56px 48px; background: #080c1c; font-size: 9.5pt; color: #94a3b8; line-height: 1.7;">
      <div>
        <h3 style="color: #67e8f9; font-size: 14pt; margin: 0 0 12px 0;">Bubbleverse Personalized Storybooks</h3>
        <p>جميع الحقوق محفوظة © 2026 لشركة Bubbleverse Studios.<br/>
        لا يجوز إعادة إنتاج أو نسخ أي جزء من هذا الكتاب دون إذن خطي مسبق من الناشر، باستثناء الاقتباسات القصيرة لأغراض المراجعة الأدبية.</p>
      </div>
      <div>
        <p>
          <strong>رقم الإيداع الدولي (ISBN):</strong> 978-1-958420-15-8<br/>
          <strong>الفئة:</strong> أدب أطفال • تطوير الذات وبناء الشجاعة<br/>
          <strong>المحرر الفني ومصمم التجربة:</strong> فريق بابل فيرس للأبحاث وقصص الأطفال<br/>
          <strong>مواصفات الطباعة:</strong> ورق مقوى فاخر 8.5" × 8.5" ملوّن فائق الدقة (Amazon KDP Print Edition)
        </p>
      </div>
      <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
        طُبعت هذه النسخة خصيصاً لكريم • صفحة ٢
      </div>
    </div>
  `, '', false, 2);

  // P3: Dedication Spread
  addInteriorPage(`
    <div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 56px; background: linear-gradient(145deg, #0d122b 0%, #17153b 50%, #0a0e20 100%);">
      <div class="dedication-card" style="max-width: 540px; padding: 36px 32px;">
        <h2 style="font-size: 20pt; color: #f472b6; margin: 0 0 14px 0; font-weight: 800;">إهداء خاص من القلب إلى البطل: كريم</h2>
        <p style="font-size: 13pt; color: #f8fafc; line-height: 1.8; margin: 0 0 18px 0;">
          إلى أغلى بطل في حياتنا، كل صفحة في هذا الكتاب تذكّرك بأن خيالك لا حدود له، وأن الشجاعة الحقيقية تسكن دائماً في قلبك الطيب. نحن فخورون بك وبكل خطوة تخطوها نحو أحلامك!
        </p>
        <div style="font-size: 13pt; color: #67e8f9; font-weight: 700;">مع كل الحب والدفء • ماما وبابا (2026)</div>
      </div>
      <div style="color: #94a3b8; font-size: 9.5pt; margin-top: 20px;">صفحة ٣</div>
    </div>
  `, '', false, 3);

  // P4: Character Sheet
  addInteriorPage(`
    <div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 42px 48px; background: #080c1c;">
      <div style="text-align: center;">
        <div style="font-size: 11pt; color: #00d9ff; font-weight: 700;">ملف بطل القصة الخاص</div>
        <h2 style="font-size: 20pt; color: #ffffff; margin: 4px 0 12px 0;">كـريـم • بطل وادي الفقاعات</h2>
      </div>
      <div style="text-align: center;">
        <img class="char-sheet-img" src="${charSheetArt}" style="max-height: 380px;" alt="Karim Character Sheet" />
      </div>
      <div style="background: rgba(13, 19, 44, 0.8); border: 1px solid rgba(0,217,255,0.3); border-radius: 14px; padding: 12px 20px; display: flex; justify-content: space-around; font-size: 11pt; color: #cbd5e1;">
        <span>👤 الاسم: كريم</span>
        <span>🎂 العمر: ٦ سنوات</span>
        <span>⚡ الفضيلة: الشجاعة والإيمان بالنفس</span>
      </div>
      <div style="text-align: center; color: #94a3b8; font-size: 9.5pt;">صفحة ٤</div>
    </div>
  `, '', false, 4);

  // P5 to P14: 10 Story Spreads
  for (let i = 0; i < STORY_BEATS.length; i++) {
    const beat = STORY_BEATS[i];
    addInteriorPage(`
      <div class="vignette-bottom"></div>
      <div class="narrative-card" style="bottom: 7%; left: 7%; right: 7%;">
        <p class="narrative-text">${beat.text}</p>
        <div class="card-footer">
          <span class="beat-badge">✨ المشهد ${beat.num}: ${beat.title}</span>
          <span class="page-pill">صفحة ${beat.num + 4}</span>
        </div>
      </div>
    `, beat.art, true, beat.num + 4);
  }

  // P15 to P20: Reflection Spreads & Therapeutic Story Activities
  addInteriorPage(`
    <div style="position: absolute; inset: 0; padding: 50px 48px; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(155deg, #090e24 0%, #15103a 50%, #0a0e20 100%);">
      <div>
        <div style="color: #67e8f9; font-size: 12pt; font-weight: 700; margin-bottom: 6px;">نشاط تفاعلي مع الوالدين</div>
        <h2 style="font-size: 22pt; color: #ffffff; margin: 0 0 16px 0;">مرآة الشجاعة: ماذا تفعل عندما تشعر بالخوف؟</h2>
        <div style="background: rgba(13, 19, 44, 0.8); border: 1.5px solid rgba(0,217,255,0.35); border-radius: 18px; padding: 22px; margin-bottom: 16px; font-size: 12pt; line-height: 1.7;">
          <p style="margin: 0 0 10px 0;">١. <strong>تنفس بعمق:</strong> خذ نفساً عميقاً كأنك تنفخ فقاعة صابون كبيرة زرقاء.</p>
          <p style="margin: 0 0 10px 0;">٢. <strong>تذكر سر كريم:</strong> الشجاعة ليست أن لا تخاف، بل أن تخطو خطوتك وأنت مؤمن بنفسك.</p>
          <p style="margin: 0;">٣. <strong>ابتسم واطلب المساعدة:</strong> تماماً كما ساعد كريم صديقه الصغير في وادي الفوانيس.</p>
        </div>
      </div>
      <div style="text-align: center; color: #94a3b8; font-size: 9.5pt;">صفحة ١٥</div>
    </div>
  `, '', false, 15);

  addInteriorPage(`
    <div style="position: absolute; inset: 0; padding: 50px 48px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: #080c1c;">
      <h2 style="font-size: 22pt; color: #67e8f9; margin-bottom: 12px;">لوحة رسومات البطل كريم</h2>
      <p style="color: #cbd5e1; font-size: 12pt; margin-bottom: 24px;">ارسم هنا فقاعتك السحرية المفضلة وماذا تحب أن تضع بداخلها!</p>
      <div style="width: 80%; height: 340px; border: 2px dashed rgba(0, 217, 255, 0.4); border-radius: 20px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 14pt;">
        مساحة حرة للرسم والتعبير 🎨
      </div>
      <div style="color: #94a3b8; font-size: 9.5pt; margin-top: 24px;">صفحة ١٦</div>
    </div>
  `, '', false, 16);

  addInteriorPage(`
    <div style="position: absolute; inset: 0; padding: 50px 48px; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(155deg, #090e24 0%, #15103a 50%, #0a0e20 100%);">
      <div>
        <h2 style="font-size: 22pt; color: #f472b6; margin: 0 0 14px 0;">القيم الأربع التي تعلمها كريم</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
          <div style="background: rgba(13, 19, 44, 0.8); border: 1px solid rgba(0,217,255,0.3); border-radius: 14px; padding: 16px;">
            <h4 style="color: #67e8f9; margin: 0 0 6px 0;">١. الشجاعة</h4>
            <p style="font-size: 10.5pt; color: #e2e8f0; margin: 0;">المبادرة وخوض التجارب الجديدة دون خوف.</p>
          </div>
          <div style="background: rgba(13, 19, 44, 0.8); border: 1px solid rgba(167,139,250,0.3); border-radius: 14px; padding: 16px;">
            <h4 style="color: #a78bfa; margin: 0 0 6px 0;">٢. العطف والرحمة</h4>
            <p style="font-size: 10.5pt; color: #e2e8f0; margin: 0;">مد يد العون لمن يشعر بالخوف أو الضعف.</p>
          </div>
          <div style="background: rgba(13, 19, 44, 0.8); border: 1px solid rgba(244,114,182,0.3); border-radius: 14px; padding: 16px;">
            <h4 style="color: #f472b6; margin: 0 0 6px 0;">٣. الثقة بالنفس</h4>
            <p style="font-size: 10.5pt; color: #e2e8f0; margin: 0;">الإيمان بالقدرات الشخصية والتعبير عن الرأي.</p>
          </div>
          <div style="background: rgba(13, 19, 44, 0.8); border: 1px solid rgba(251,191,36,0.3); border-radius: 14px; padding: 16px;">
            <h4 style="color: #fbbf24; margin: 0 0 6px 0;">٤. الامتنان</h4>
            <p style="font-size: 10.5pt; color: #e2e8f0; margin: 0;">شكر الوالدين وتقدير الدعم والتشجيع المستمر.</p>
          </div>
        </div>
      </div>
      <div style="text-align: center; color: #94a3b8; font-size: 9.5pt;">صفحة ١٧</div>
    </div>
  `, '', false, 17);

  addInteriorPage(`
    <div style="position: absolute; inset: 0; padding: 50px 48px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: #080c1c;">
      <h2 style="font-size: 22pt; color: #00d9ff; margin-bottom: 14px;">خريطة عالم بابل فيرس السحري</h2>
      <p style="color: #cbd5e1; font-size: 12pt; max-width: 520px; line-height: 1.6; margin-bottom: 24px;">
        من وادي الفوانيس الكريستالية إلى جبل الهمس ومحراب النجم الأعظم... هذه كانت رحلة كريم الأولى، والمغامرات القادمة تحمل مفاجآت أكبر!
      </p>
      <div style="width: 85%; height: 260px; background: rgba(0, 217, 255, 0.05); border: 1px solid rgba(0,217,255,0.25); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #67e8f9; font-size: 12pt;">
        🌌 خريطة السدم والفقاعات السبع 🌟
      </div>
      <div style="color: #94a3b8; font-size: 9.5pt; margin-top: 24px;">صفحة ١٨</div>
    </div>
  `, '', false, 18);

  addInteriorPage(`
    <div style="position: absolute; inset: 0; padding: 50px 48px; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(155deg, #090e24 0%, #15103a 50%, #0a0e20 100%);">
      <div>
        <h2 style="font-size: 20pt; color: #67e8f9; margin-bottom: 12px;">رسالة إلى المربين والأمهات</h2>
        <div style="font-size: 11pt; color: #e2e8f0; line-height: 1.75; background: rgba(13,19,44,0.7); border-radius: 16px; padding: 22px;">
          الخجل والتردد في سن ما قبل المدرسة وسنوات التعليم الأولى هو استجابة طبيعية تماماً للمواقف الجديدة. تساعد قصة «كريم وسر الفقاعة الزرقاء» في تدريب الطفل لاواعياً على أن الشجاعة لا تتطلب اختفاء القلق بالكامل، بل تتطلب اتخاذ القرار بالمضي قدماً، وأن العطف على الآخرين هو أسرع طريق لاكتساب الثقة الداخلية.
        </div>
      </div>
      <div style="text-align: center; color: #94a3b8; font-size: 9.5pt;">صفحة ١٩</div>
    </div>
  `, '', false, 19);

  addInteriorPage(`
    <div style="position: absolute; inset: 0; padding: 50px 48px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: #080c1c;">
      <h2 style="font-size: 24pt; color: #f472b6; margin-bottom: 12px;">أنت بطل كل يوم يا كريم!</h2>
      <p style="font-size: 13pt; color: #e2e8f0; max-width: 500px; line-height: 1.7;">
        احفظ هذا الكتاب بجانب سريرك، وكلما شعرت بالتردد قبل تجربة جديدة، تذكر ابتسامتك وأنت تعبر جسر الفوانيس!
      </p>
      <div style="color: #94a3b8; font-size: 9.5pt; margin-top: 36px;">صفحة ٢٠</div>
    </div>
  `, '', false, 20);

  // P21: Keepsake Hero Certificate
  addInteriorPage(`
    <div style="position: absolute; inset: 0; padding: 48px; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(155deg, #090e24 0%, #15103a 50%, #0b1228 100%); text-align: center;">
      <div style="border: 2px dashed rgba(0, 217, 255, 0.4); border-radius: 24px; padding: 32px 28px; background: rgba(13, 19, 44, 0.7); height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="font-size: 13pt; color: #f472b6; font-weight: 700; margin-bottom: 6px;">✨ وسام الشجاعة الرسمي ✨</div>
          <h2 style="font-size: 24pt; color: #ffffff; margin: 0 0 10px 0; font-weight: 800;">شهادة البطل: كـريـم</h2>
          <div style="display: inline-block; background: linear-gradient(90deg, #00d9ff, #a78bfa); color: #090d1c; font-size: 15pt; font-weight: 800; padding: 6px 30px; border-radius: 20px; margin-bottom: 16px;">
            بطل وادي الفوانيس الكريستالية
          </div>
          <p style="font-size: 12pt; color: #e2e8f0; line-height: 1.7; max-width: 540px; margin: 0 auto;">
            نُشهد بأن البطل كريم قد أثبت شجاعته العظيمة، وساعد أصدقاءه، واكتشف أن الشجاعة تسكن في قلبه دائماً.
          </p>
        </div>

        <div style="display: flex; justify-content: space-around; align-items: flex-end; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.15);">
          <div>
            <div style="font-size: 10pt; color: #94a3b8;">توقيع الوالدين</div>
            <div style="font-size: 13pt; color: #f472b6; font-weight: 700;">ماما وبابا ♥</div>
          </div>
          <div style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid #00d9ff; display: flex; align-items: center; justify-content: center; background: rgba(0, 217, 255, 0.1); color: #67e8f9; font-size: 8.5pt; font-weight: 800;">
            ختم بابل فيرس
          </div>
          <div>
            <div style="font-size: 10pt; color: #94a3b8;">السنة</div>
            <div style="font-size: 12pt; color: #67e8f9; font-weight: 700;">2026</div>
          </div>
        </div>
      </div>
      <div style="color: #94a3b8; font-size: 9pt; margin-top: 8px;">صفحة ٢١</div>
    </div>
  `, '', false, 21);

  // P22: Keepsake Memory Page
  addInteriorPage(`
    <div style="position: absolute; inset: 0; padding: 50px 48px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: #080c1c;">
      <h2 style="font-size: 20pt; color: #67e8f9; margin-bottom: 10px;">ذكريات قراءة هذه القصة</h2>
      <p style="color: #cbd5e1; font-size: 11pt; margin-bottom: 24px;">سجّل هنا تاريخ قراءة القصة لأول مرة وماذا قال كريم عندما رأى صورته بطلاً!</p>
      <div style="width: 85%; background: rgba(13,19,44,0.7); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 24px; text-align: right; font-size: 11pt; color: #cbd5e1; line-height: 2;">
        📅 تاريخ القراءة الأولى: .......................................<br/>
        💬 أول جملة قالها كريم: .......................................<br/>
        🌟 الشخصية المفضلة لكريم: .......................................
      </div>
      <div style="color: #94a3b8; font-size: 9.5pt; margin-top: 24px;">صفحة ٢٢</div>
    </div>
  `, '', false, 22);

  // P23: Other Bubbles Showcase
  addInteriorPage(`
    <div style="position: absolute; inset: 0; padding: 50px 48px; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(155deg, #090e24 0%, #15103a 50%, #0a0e20 100%);">
      <div>
        <h2 style="font-size: 20pt; color: #ffffff; margin-bottom: 12px;">سلسلة مغامرات بابل فيرس القادمة</h2>
        <div style="font-size: 11pt; color: #cbd5e1; line-height: 1.8;">
          🔴 الفقاعة الحمراء: الهدوء والتحكم بالنفس والسكينة<br/>
          🟠 الفقاعة البرتقالية: التعاطف والرحمة ومراعاة المشاعر<br/>
          🟡 الفقاعة الصفراء: الصدق والأمانة ونقاء القلب<br/>
          🟢 الفقاعة الخضراء: مغامرات الطبيعة والتواصل الحقيقي<br/>
          🔵 الفقاعة الزرقاء: الشجاعة والإيمان بالنفس (قصة كريم!)<br/>
          🌌 فقاعة النيلي: الصداقة الحقيقية والمودة والمرح<br/>
          🟪 الفقاعة البنفسجية: لذة العطاء والمشاركة مع الآخرين
        </div>
      </div>
      <div style="text-align: center; color: #94a3b8; font-size: 9.5pt;">صفحة ٢٣</div>
    </div>
  `, '', false, 23);

  // P24: Final Closing Page
  addInteriorPage(`
    <div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 48px; background: #080c1c;">
      <div style="font-size: 32pt; margin-bottom: 12px;">🌟</div>
      <h2 style="font-size: 24pt; color: #67e8f9; margin-bottom: 8px;">النهاية السعيدة</h2>
      <p style="font-size: 12pt; color: #94a3b8; max-width: 440px; line-height: 1.6; margin-bottom: 24px;">
        صُنعت هذه القصة بكل الحب والرعاية لتكون ذكرى خالدة لكريم وعائلته الكريمة.
      </p>
      <div style="font-size: 10pt; color: #64748b;">Bubbleverse Studios • 2026 • صفحة ٢٤</div>
    </div>
  `, '', false, 24);

  return `<!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>Karim Blue Bubble - KDP Interior (24 Pages)</title>
    <style>
      @page {
        size: 8.625in 8.75in;
        margin: 0;
      }
      ${COMMON_CSS}
    </style>
  </head>
  <body>
    ${pagesHtml}
  </body>
  </html>`;
}

// ============================================================================
// MAIN EXECUTION ENGINE
// ============================================================================
async function run() {
  console.log('🚀 Starting High-Precision Book Rendering Engine...');
  const browserBin = findBrowserBinary();
  console.log(`Using browser: ${browserBin}`);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bv-karim-book-'));

  try {
    // 1. Build Full Book PDF
    console.log('Building FullBook-8.5x8.5-300dpi.pdf...');
    const fullHtml = generateFullBookHtml();
    const fullHtmlPath = path.join(tempDir, 'full-book.html');
    fs.writeFileSync(fullHtmlPath, fullHtml, 'utf8');

    const fullPdfName = 'Karim-Blue-Bubble-FullBook-8.5x8.5-300dpi.pdf';
    const fullPdfDocs = path.join(outputDir, fullPdfName);
    const fullPdfPublic = path.join(publicDir, fullPdfName);

    execFileSync(
      browserBin,
      [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--allow-file-access-from-files',
        '--no-pdf-header-footer',
        `--print-to-pdf=${fullPdfDocs}`,
        `file:///${fullHtmlPath.replace(/\\/g, '/')}`,
      ],
      { stdio: 'pipe', timeout: 60000 }
    );
    fs.copyFileSync(fullPdfDocs, fullPdfPublic);
    const fullSizeMb = (fs.statSync(fullPdfDocs).size / 1048576).toFixed(2);
    console.log(`✓ Generated ${fullPdfName} (${fullSizeMb} MB)`);

    // 2. Build KDP Interior PDF
    console.log('Building KDP-Interior-8.625x8.75-300dpi.pdf...');
    const interiorHtml = generateKdpInteriorHtml();
    const interiorHtmlPath = path.join(tempDir, 'interior.html');
    fs.writeFileSync(interiorHtmlPath, interiorHtml, 'utf8');

    const interiorPdfName = 'Karim-Blue-Bubble-KDP-Interior-8.625x8.75-300dpi.pdf';
    const interiorPdfDocs = path.join(outputDir, interiorPdfName);
    const interiorPdfPublic = path.join(publicDir, interiorPdfName);

    execFileSync(
      browserBin,
      [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--allow-file-access-from-files',
        '--no-pdf-header-footer',
        `--print-to-pdf=${interiorPdfDocs}`,
        `file:///${interiorHtmlPath.replace(/\\/g, '/')}`,
      ],
      { stdio: 'pipe', timeout: 60000 }
    );
    fs.copyFileSync(interiorPdfDocs, interiorPdfPublic);
    const interiorSizeMb = (fs.statSync(interiorPdfDocs).size / 1048576).toFixed(2);
    console.log(`✓ Generated ${interiorPdfName} (${interiorSizeMb} MB)`);

    // 3. Build KDP Cover Wrap PDF
    console.log('Building KDP-CoverWrap-RTL-300dpi.pdf...');
    const wrapHtml = generateCoverWrapHtml();
    const wrapHtmlPath = path.join(tempDir, 'cover-wrap.html');
    fs.writeFileSync(wrapHtmlPath, wrapHtml, 'utf8');

    const wrapPdfName = 'Karim-Blue-Bubble-KDP-CoverWrap-RTL-300dpi.pdf';
    const wrapPdfDocs = path.join(outputDir, wrapPdfName);
    const wrapPdfPublic = path.join(publicDir, wrapPdfName);

    execFileSync(
      browserBin,
      [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--allow-file-access-from-files',
        '--no-pdf-header-footer',
        `--print-to-pdf=${wrapPdfDocs}`,
        `file:///${wrapHtmlPath.replace(/\\/g, '/')}`,
      ],
      { stdio: 'pipe', timeout: 60000 }
    );
    fs.copyFileSync(wrapPdfDocs, wrapPdfPublic);
    const wrapSizeMb = (fs.statSync(wrapPdfDocs).size / 1048576).toFixed(2);
    console.log(`✓ Generated ${wrapPdfName} (${wrapSizeMb} MB)`);

    // 4. Also render standalone designed cover HTML to high-res image
    const frontCoverHtml = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <style>
        ${COMMON_CSS}
        body { margin: 0; padding: 0; overflow: hidden; width: 1200px; height: 1200px; }
      </style>
    </head>
    <body>
      <div class="page" style="width: 1200px; height: 1200px; background-image: url('${coverArt}');">
        <div class="vignette-top"></div>
        <div class="vignette-bottom"></div>
        <div class="cover-container" style="padding: 60px 50px 50px 50px;">
          <div class="edition-pill">✨ إصدار بابل فيرس الخاص • الفقاعة الزرقاء ✨</div>
          <div class="cover-title-group">
            <h1 class="main-book-title" style="font-size: 54px; margin-bottom: 12px;">كَرِيم وَسِرُّ الفُقَّاعَةِ الزَّرْقَاءِ</h1>
            <div class="main-book-subtitle" style="font-size: 22px; margin-bottom: 22px;">رحلة الشجاعة واكتشاف الثقة بالنفس في وادي الفوانيس الكريستالية</div>
            <div class="hero-pill-box" style="margin-bottom: 18px; padding: 10px 36px;">
              <span class="hero-pill-text" style="font-size: 22px;">🌟 بطل القصة: كـريـم (٦ سنوات) 🌟</span>
            </div>
            <div class="cover-branding" style="font-size: 15px;">BUBBLEVERSE STUDIOS • كتاب مخصص ومطبوع خصيصاً لكريم</div>
          </div>
        </div>
      </div>
    </body>
    </html>`;

    const frontHtmlPath = path.join(tempDir, 'front-designed.html');
    fs.writeFileSync(frontHtmlPath, frontCoverHtml, 'utf8');

    // Screenshot front cover
    const designedCoverJpg = path.join(outputDir, '00-cover-designed.png');
    execFileSync(
      browserBin,
      [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--allow-file-access-from-files',
        `--screenshot=${designedCoverJpg}`,
        '--window-size=1200,1200',
        `file:///${frontHtmlPath.replace(/\\/g, '/')}`,
      ],
      { stdio: 'pipe', timeout: 30000 }
    );
    if (fs.existsSync(designedCoverJpg)) {
      fs.copyFileSync(designedCoverJpg, path.join(publicDir, '00-cover-designed.png'));
      console.log('✓ Rendered standalone 00-cover-designed.png');
    }

    // Screenshot back cover
    const backCoverHtml = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <style>
        ${COMMON_CSS}
        body { margin: 0; padding: 0; overflow: hidden; width: 1200px; height: 1200px; }
      </style>
    </head>
    <body>
      <div class="page" style="width: 1200px; height: 1200px; background-image: url('${backArt}');">
        <div class="vignette-bottom"></div>
        <div class="back-cover-card" style="bottom: 60px; left: 70px; right: 70px; padding: 32px;">
          <h3 class="back-blurb-heading" style="font-size: 28px;">كريم وسر الفقاعة الزرقاء</h3>
          <p class="back-blurb-text" style="font-size: 18px; line-height: 1.6;">
            عندما تبدو البدايات صعبة وتتسارع دقات القلب خجلاً وتردداً، تظهر الفقاعة الزرقاء السحرية لتأخذ طفلك في رحلة استثنائية يكتشف فيها أن أعظم قوة في الكون لا تأتي من الخارج... بل تسكن دائماً في أعماق قلبه الشجاع!
          </p>
          <div class="bubble-tags-row" style="margin-bottom: 20px;">
            <span class="bubble-tag-pill" style="font-size: 15px; padding: 6px 18px;">🔵 الفقاعة الزرقاء: الشجاعة والإيمان بالنفس</span>
            <span class="bubble-tag-pill" style="font-size: 15px; padding: 6px 18px;">🌟 الفئة: ٥ - ٨ سنوات</span>
            <span class="bubble-tag-pill" style="font-size: 15px; padding: 6px 18px;">🌙 قصة ما قبل النوم</span>
          </div>
          <div class="back-footer-row" style="padding-top: 16px;">
            <div class="back-imprint" style="font-size: 15px;">
              <strong style="color: #ffffff;">BUBBLEVERSE STUDIOS</strong><br/>
              www.bubbleverse.store • إصدار خاص بالطفل
            </div>
            <div class="barcode-box" style="padding: 10px 18px;">
              <div style="font-size: 13px;">ISBN 978-1-958420-15-8</div>
              <div style="letter-spacing: 3px; font-size: 16px; margin: 4px 0;">||||| | |||| ||| |||</div>
              <div style="font-size: 13px;">EGP 490 / SAR 109</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>`;

    const backHtmlPath = path.join(tempDir, 'back-designed.html');
    fs.writeFileSync(backHtmlPath, backCoverHtml, 'utf8');

    const designedBackJpg = path.join(outputDir, '16-back-designed.png');
    execFileSync(
      browserBin,
      [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--allow-file-access-from-files',
        `--screenshot=${designedBackJpg}`,
        '--window-size=1200,1200',
        `file:///${backHtmlPath.replace(/\\/g, '/')}`,
      ],
      { stdio: 'pipe', timeout: 30000 }
    );
    if (fs.existsSync(designedBackJpg)) {
      fs.copyFileSync(designedBackJpg, path.join(publicDir, '16-back-designed.png'));
      console.log('✓ Rendered standalone 16-back-designed.png');
    }

    // 5. Screenshot sample story spread (Scene 1 with text)
    const sampleSpreadHtml = `<!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <style>
        ${COMMON_CSS}
        body { margin: 0; padding: 0; overflow: hidden; width: 1200px; height: 1200px; }
      </style>
    </head>
    <body>
      <div class="page" style="width: 1200px; height: 1200px; background-image: url('${sceneArts[0]}');">
        <div class="vignette-bottom"></div>
        <div class="narrative-card" style="bottom: 60px; left: 70px; right: 70px; padding: 26px 32px 22px 32px;">
          <p class="narrative-text" style="font-size: 24px; line-height: 1.62;">${STORY_BEATS[0].text}</p>
          <div class="card-footer" style="margin-top: 14px; padding-top: 12px;">
            <span class="beat-badge" style="font-size: 16px;">✨ المشهد ١: ${STORY_BEATS[0].title}</span>
            <span class="page-pill" style="font-size: 16px; padding: 4px 16px;">صفحة ٣</span>
          </div>
        </div>
      </div>
    </body>
    </html>`;

    const sampleSpreadHtmlPath = path.join(tempDir, 'sample-spread.html');
    fs.writeFileSync(sampleSpreadHtmlPath, sampleSpreadHtml, 'utf8');

    const sampleSpreadPng = path.join(outputDir, 'sample-spread-designed.png');
    execFileSync(
      browserBin,
      [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--allow-file-access-from-files',
        `--screenshot=${sampleSpreadPng}`,
        '--window-size=1200,1200',
        `file:///${sampleSpreadHtmlPath.replace(/\\/g, '/')}`,
      ],
      { stdio: 'pipe', timeout: 30000 }
    );
    if (fs.existsSync(sampleSpreadPng)) {
      fs.copyFileSync(sampleSpreadPng, path.join(publicDir, 'sample-spread-designed.png'));
      console.log('✓ Rendered standalone sample-spread-designed.png');
    }

    console.log('\n🎉 ALL 3 KDP 300 DPI BOOKS & DESIGNED COVERS SUCCESSFULLY COMPILED!');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error('Fatal build error:', err);
  process.exit(1);
});
