export interface StorybookPDFOptions {
  title: string;
  childName: string;
  language: 'ar' | 'en';
  artStyle: string;
  schoolName?: string;
  schoolLogo?: string;
  pages: {
    pageNumber: number;
    text: string;
    imageUrl: string;
  }[];
}

export function generateStorybookPDFHTML(options: StorybookPDFOptions): string {
  const isRTL = options.language === 'ar';
  const pagesHTML = options.pages
    .map(
      (p) => `
    <div class="page-spread page-content">
      <div class="illustration-container">
        <img src="${p.imageUrl}" alt="Illustration ${p.pageNumber}" class="illustration" />
        <div class="vignette-overlay"></div>
      </div>
      <div class="text-card-overlay">
        <p class="story-text">${p.text}</p>
        <span class="page-number">${p.pageNumber}</span>
      </div>
    </div>
  `
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${options.language}" dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <title>${options.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@500;700;800&family=Cairo:wght@400;600;700;900&family=Fredoka:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: 210mm 210mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #0d111c;
      font-family: ${isRTL ? "'Cairo', 'Baloo Bhaijaan 2', sans-serif" : "'Fredoka', sans-serif"};
      color: #fff;
    }
    .page-spread {
      width: 210mm;
      height: 210mm;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
    }
    
    /* Cover Page */
    .cover-page {
      background: linear-gradient(135deg, #1e1138 0%, #0d111c 100%);
      justify-content: space-between;
      align-items: center;
      padding: 20mm;
      text-align: center;
    }
    .cover-badge {
      display: inline-block;
      padding: 4px 16px;
      border-radius: 9999px;
      background: rgba(0, 217, 255, 0.15);
      border: 1px solid rgba(0, 217, 255, 0.35);
      color: #00d9ff;
      font-size: 13pt;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .cover-illustration {
      width: 130mm;
      height: 130mm;
      border-radius: 24px;
      object-fit: cover;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6), 0 0 40px rgba(167, 139, 250, 0.25);
      border: 3px solid rgba(255, 255, 255, 0.15);
    }
    .cover-title {
      font-size: 26pt;
      font-weight: 900;
      color: #ffffff;
      text-shadow: 0 4px 15px rgba(0, 0, 0, 0.7);
      margin: 8mm 0 2mm 0;
      line-height: 1.25;
    }
    .cover-hero-tag {
      font-size: 15pt;
      color: #f472b6;
      font-weight: 700;
    }
    
    /* Content Pages */
    .page-content {
      position: relative;
      background: #000;
    }
    .illustration-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    .illustration {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .vignette-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 55%;
      background: linear-gradient(to top, rgba(13, 17, 28, 0.95) 0%, rgba(13, 17, 28, 0.6) 60%, transparent 100%);
    }
    .text-card-overlay {
      position: absolute;
      bottom: 15mm;
      left: 15mm;
      right: 15mm;
      background: rgba(13, 17, 28, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      border-radius: 18px;
      padding: 6mm 8mm;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .story-text {
      font-size: 16pt;
      line-height: 1.6;
      font-weight: 600;
      color: #fff;
      margin: 0;
      text-align: ${isRTL ? 'right' : 'left'};
    }
    .page-number {
      position: absolute;
      bottom: 3mm;
      ${isRTL ? 'left: 6mm;' : 'right: 6mm;'}
      font-size: 11pt;
      font-weight: 700;
      color: #00d9ff;
      font-family: monospace;
    }

    /* Back Cover */
    .back-cover {
      background: linear-gradient(135deg, #0d111c 0%, #17112b 100%);
      justify-content: center;
      align-items: center;
      padding: 25mm;
      text-align: center;
    }
    .back-logo {
      font-size: 28pt;
      font-weight: 900;
      color: #00d9ff;
      margin-bottom: 5mm;
    }
    .back-quote {
      font-size: 15pt;
      color: #cbd5e1;
      max-width: 140mm;
      line-height: 1.6;
      margin-bottom: 12mm;
    }
  </style>
</head>
<body>
  <!-- Cover Spread -->
  <div class="page-spread cover-page">
    <div class="cover-badge">${options.schoolName || 'BUBBLEVERSE EXCLUSIVE EDITION'}</div>
    <div>
      <img src="${options.pages[0]?.imageUrl || '/bubble-books/space.webp'}" alt="Cover" class="cover-illustration" />
      <h1 class="cover-title">${options.title}</h1>
      <div class="cover-hero-tag">${isRTL ? `بطولة: ${options.childName}` : `Starring: ${options.childName}`}</div>
    </div>
    <div style="font-size: 10pt; color: #94a3b8;">Bubbleverse Storybook Engine • 210×210mm Standard Edition</div>
  </div>

  <!-- Story Page Spreads -->
  ${pagesHTML}

  <!-- Back Cover -->
  <div class="page-spread back-cover">
    <div class="back-logo">Bubbleverse</div>
    <p class="back-quote">
      ${
        isRTL
          ? `صُممت هذه القصة خصيصاً للبطل ${options.childName} لتلهمه الشجاعة وتفتح أمامه آفاق الخيال اللامحدود.`
          : `Created especially for ${options.childName} to inspire wonder, courage, and boundless imagination.`
      }
    </p>
    <div style="border-top: 1px solid rgba(255,255,255,0.15); padding-top: 5mm; font-size: 10pt; color: #64748b;">
      All Rights Reserved © Bubbleverse ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>`;
}

export interface ConsistencyPromptContract {
  subjectName: string;
  artStyle: string;
  sceneDescription: string;
  referenceFaceUrl?: string;
}

export function buildConsistencyPrompt(contract: ConsistencyPromptContract): string {
  const styleKeywords = {
    '3D Pixar': '3D Pixar style, cute round expressive features, subsurface scattering, octane render, soft ambient lighting',
    Watercolor: 'delicate children book watercolor, pastel paper texture, ink outlines, dreamy atmospheric lighting',
    Anime: 'Studio Ghibli aesthetic, vibrant expressive anime style, high detail background, anime lighting',
    Comic: 'vibrant graphic novel comic style, crisp inked lineart, halftone dots, dynamic composition',
  }[contract.artStyle] || 'whimsical children book illustration, vibrant colors, magical lighting';

  return `[CHARACTER: child hero ${contract.subjectName}, consistent face identity and hairstyle] ${contract.sceneDescription}, ${styleKeywords}, full bleed square composition, high detail, masterpiece, 8k resolution, cinematic atmosphere.`;
}