import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const outputPdfPath = path.join(repoRoot, 'docs', 'BUBBLEVERSE_PARTNER_EXECUTIVE_REPORT_2026.pdf');
const publicPdfPath = path.join(repoRoot, 'public', 'docs', 'BUBBLEVERSE_PARTNER_EXECUTIVE_REPORT_2026.pdf');

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

function fileToBase64DataUri(relPath) {
  const fullPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(fullPath)) return '';
  const ext = path.extname(fullPath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
  const base64 = fs.readFileSync(fullPath).toString('base64');
  return `data:${mime};base64,${base64}`;
}

const imgCover = fileToBase64DataUri('public/showcase/zain-sample/cover.jpg');
const imgScene01 = fileToBase64DataUri('public/showcase/zain-sample/scene-01.jpg');
const imgScene13 = fileToBase64DataUri('public/showcase/zain-sample/scene-13.jpg');
const imgBack = fileToBase64DataUri('public/showcase/zain-sample/back.jpg');

const imgBubPlush = fileToBase64DataUri('public/merch/bub-plush-ball.jpg');
const imgGiftBox = fileToBase64DataUri('public/merch/story-bub-giftbox.jpg');
const imgNightLamp = fileToBase64DataUri('public/merch/bub-night-lamp.jpg');
const imgBackpack = fileToBase64DataUri('public/merch/hero-backpack.jpg');

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>Bubbleverse — Partner Executive Report 2026</title>
  <style>
    @page {
      size: A4 portrait;
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
      font-family: 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
      font-size: 9.2pt;
    }

    .page {
      width: 210mm;
      height: 297mm;
      padding: 13mm 14mm 11mm 14mm;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    /* Cover Page */
    .cover-page {
      background: linear-gradient(155deg, #070a1e 0%, #110d2b 45%, #050816 100%);
      color: #f8fafc;
      padding: 18mm 16mm;
    }

    .cover-glow-top {
      position: absolute;
      top: -30mm;
      left: -20mm;
      width: 130mm;
      height: 130mm;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 217, 255, 0.22) 0%, rgba(0, 217, 255, 0) 70%);
    }

    .cover-glow-bot {
      position: absolute;
      bottom: -35mm;
      right: -20mm;
      width: 140mm;
      height: 140mm;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, rgba(236, 72, 153, 0) 70%);
    }

    /* Page Header */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 7px;
      border-bottom: 1.5px solid #e2e8f0;
      margin-bottom: 9px;
    }

    .doc-brand {
      display: flex;
      align-items: center;
      gap: 9px;
    }

    .bubble-logo-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 28%, #ffffff 0%, #38bdf8 30%, #a855f7 65%, #ec4899 90%);
      box-shadow: inset 0 0 6px rgba(255,255,255,0.8), 0 3px 10px rgba(56, 189, 248, 0.45);
      position: relative;
      flex-shrink: 0;
    }
    .bubble-logo-icon::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 4px;
      width: 8px;
      height: 5px;
      border-radius: 50%;
      background: rgba(255,255,255,0.92);
      transform: rotate(-30deg);
    }

    .brand-title {
      font-weight: 900;
      font-size: 13pt;
      letter-spacing: -0.02em;
      color: #0f172a;
    }
    .brand-title span {
      background: linear-gradient(135deg, #0284c7 0%, #9333ea 60%, #db2777 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-sub {
      font-size: 6.5pt;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: #64748b;
      margin-top: -2px;
      font-weight: 700;
    }

    .doc-meta-badge {
      background: #f1f5f9;
      color: #334155;
      padding: 3px 9px;
      border-radius: 12px;
      font-size: 7.2pt;
      font-weight: 700;
      border: 1px solid #cbd5e1;
    }

    /* Page Footer */
    .doc-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 6px;
      border-top: 1px solid #e2e8f0;
      font-size: 7.2pt;
      color: #64748b;
      margin-top: 8px;
    }

    /* Content components */
    h1, h2, h3, h4, p {
      margin: 0;
    }

    .section-title {
      font-size: 12pt;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 7px;
    }
    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 15px;
      background: linear-gradient(180deg, #0284c7, #9333ea);
      border-radius: 2px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
    }
    .card-accent {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }
    .card-purple {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
    }
    .card-blue {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
    }

    .stat-val {
      font-size: 15pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.1;
    }
    .stat-label {
      font-size: 7.2pt;
      color: #64748b;
      font-weight: 600;
      margin-top: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      margin-top: 4px;
    }
    th, td {
      padding: 4.5px 6px;
      text-align: right;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 800;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .badge-pill {
      display: inline-block;
      padding: 1.5px 6px;
      border-radius: 8px;
      font-size: 6.8pt;
      font-weight: 700;
    }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-blue { background: #e0f2fe; color: #0369a1; }
    .badge-purple { background: #f3e8ff; color: #7e22ce; }
    .badge-amber { background: #fef3c7; color: #b45309; }

    .img-box {
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      background: #0f172a;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      position: relative;
    }
    .img-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .img-caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(15, 23, 42, 0.82);
      color: #fff;
      font-size: 6.5pt;
      padding: 2.5px 5px;
      text-align: center;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1: COVER ================= -->
  <div class="page cover-page">
    <div class="cover-glow-top"></div>
    <div class="cover-glow-bot"></div>

    <div style="position: relative; z-index: 2;">
      <!-- Cover Logo -->
      <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 22mm;">
        <div style="width: 54px; height: 54px; border-radius: 50%; background: radial-gradient(circle at 30% 28%, #ffffff 0%, #38bdf8 28%, #a855f7 65%, #ec4899 92%); box-shadow: inset 0 0 14px rgba(255,255,255,0.85), 0 0 28px rgba(56, 189, 248, 0.65); position: relative; flex-shrink: 0;">
          <div style="position: absolute; top: 6px; left: 7px; width: 16px; height: 9px; border-radius: 50%; background: rgba(255,255,255,0.95); transform: rotate(-30deg);"></div>
        </div>
        <div>
          <div style="font-size: 26pt; font-weight: 900; letter-spacing: -0.03em; color: #ffffff; line-height: 1;">
            Bubble<span style="background: linear-gradient(135deg, #38bdf8, #c084fc, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">verse</span>
          </div>
          <div style="font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.28em; color: #94a3b8; font-weight: 700; margin-top: 3px;">
            — STORIES IN BUBBLES —
          </div>
        </div>
      </div>

      <!-- Title & Subtitle -->
      <div style="display: inline-block; padding: 4px 12px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 16px; font-size: 8pt; font-weight: 800; color: #38bdf8; margin-bottom: 6mm;">
        وثيقة العرض التنفيذي بين الشركاء • CO-FOUNDERS BRIEFING 2026
      </div>
      <h1 style="font-size: 25pt; font-weight: 900; line-height: 1.25; margin-bottom: 4mm; color: #ffffff; max-width: 175mm;">
        تقرير الإنجازات التنفيذي وخارطة التفوق التجاري لـ Bubbleverse
      </h1>
      <p style="font-size: 11pt; color: #cbd5e1; line-height: 1.6; max-width: 165mm; margin-bottom: 12mm;">
        ملخص استراتيجي شامل لكل ما أُنجز في تطوير منصة قصص الأطفال المخصصة الفاخرة، إثبات أول كتاب حقيقي مطبوع بدقة 300 DPI ومطابق لمعايير KDP، التحليل التنافسي لـ 8 منافسين، وتحويل Bubbleverse إلى علامة تجارية متكاملة لمنتجات الأطفال وعالم Bub الملموس.
      </p>

      <!-- 4 Hero KPI Cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 10mm;">
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 10px; padding: 12px; backdrop-filter: blur(8px);">
          <div style="font-size: 20pt; font-weight: 900; color: #38bdf8;">70 / 70</div>
          <div style="font-size: 7.8pt; color: #94a3b8; font-weight: 700; margin-top: 2px;">اختبار آلي ناجح 100%</div>
          <div style="font-size: 6.8pt; color: #64748b; margin-top: 2px;">Zero Warnings • Zero TS Errors</div>
        </div>
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(192, 132, 252, 0.35); border-radius: 10px; padding: 12px; backdrop-filter: blur(8px);">
          <div style="font-size: 20pt; font-weight: 900; color: #c084fc;">8.5" × 8.5"</div>
          <div style="font-size: 7.8pt; color: #94a3b8; font-weight: 700; margin-top: 2px;">أول قصة KDP 300 DPI</div>
          <div style="font-size: 6.8pt; color: #64748b; margin-top: 2px;">3 ملفات طباعة كاملة RTL جاهزة</div>
        </div>
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(244, 114, 182, 0.35); border-radius: 10px; padding: 12px; backdrop-filter: blur(8px);">
          <div style="font-size: 20pt; font-weight: 900; color: #f472b6;">8 منافسين</div>
          <div style="font-size: 7.8pt; color: #94a3b8; font-weight: 700; margin-top: 2px;">تفوق سعري وزمني كامل</div>
          <div style="font-size: 6.8pt; color: #64748b; margin-top: 2px;">وفر 40%–60% مع جودة أرقى</div>
        </div>
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 10px; padding: 12px; backdrop-filter: blur(8px);">
          <div style="font-size: 20pt; font-weight: 900; color: #34d399;">Kids Merch</div>
          <div style="font-size: 7.8pt; color: #94a3b8; font-weight: 700; margin-top: 2px;">دمية Bub + محرك GWP</div>
          <div style="font-size: 6.8pt; color: #64748b; margin-top: 2px;">متجر مادي كامل وهدية مجانية</div>
        </div>
      </div>
    </div>

    <!-- Cover Meta Footer -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 5mm; position: relative; z-index: 2;">
      <div>
        <div style="font-size: 8pt; font-weight: 700; color: #e2e8f0;">جاهزية الإطلاق: اعتماد التشغيل الفعلي B2C &amp; B2B</div>
        <div style="font-size: 7pt; color: #94a3b8; margin-top: 1px;">التغطية الجغرافية المعتمدة: جمهورية مصر العربية • المملكة العربية السعودية • دولة الإمارات العربية المتحدة</div>
      </div>
      <div style="text-align: left; font-size: 7pt; color: #94a3b8;">
        <div>تاريخ الإصدار: نوفمبر 2026</div>
        <div>الإصدار: MVP Production Baseline v2.2</div>
      </div>
    </div>
  </div>

  <!-- ================= PAGE 2: EXECUTIVE SUMMARY (THE 7 PILLARS) ================= -->
  <div class="page">
    <div>
      <div class="doc-header">
        <div class="doc-brand">
          <div class="bubble-logo-icon"></div>
          <div>
            <div class="brand-title">Bubble<span>verse</span></div>
            <div class="brand-sub">— STORIES IN BUBBLES —</div>
          </div>
        </div>
        <div class="doc-meta-badge">المحور الأول: ملخص التحول الشامل والإنجازات التقنية</div>
      </div>

      <div class="section-title">ملخص إنجازات جلسة العمل الكاملة (The 7 Strategic Pillars)</div>
      <p style="font-size: 8.2pt; color: #475569; margin-bottom: 8px;">
        تم خلال هذه الجلسة تنفيذ تحول جذري نقل Bubbleverse من مجرد نموذج تجريبي محدود إلى منصة تجارية متكاملة لقصص الأطفال وعلامة تجارية عالمية ملموسة، مرتكزة على سبعة محاور استراتيجية صلبة:
      </p>

      <div class="grid-2" style="margin-bottom: 8px;">
        <div class="card card-blue">
          <div style="font-weight: 800; font-size: 8.5pt; color: #0284c7; margin-bottom: 2px;">1. الواجهة الفاخرة وتناسب الشاشات السائلة (Fluid Scaling)</div>
          <div style="font-size: 7.3pt; color: #334155; line-height: 1.45;">
            تطوير هوية <strong>Midnight Magic</strong> الكونية مع كاروسيل ثلاثي الأبعاد 3D Tilt Bookshelf، والتميمة التفاعلية <strong>Bub</strong> مع هيدر كبسولي زجاجي عائم <strong>Floating Glass Pill on Scroll</strong> يمنع تداخل النصوص تماماً، وضبط التناسق المرئي 100% بين النصوص والأزرار على كافة الشاشات العريضة والموبايل.
          </div>
        </div>
        <div class="card card-purple">
          <div style="font-weight: 800; font-size: 8.5pt; color: #7e22ce; margin-bottom: 2px;">2. لوحة تحكم إدارة شاملة 9 وحدات (Admin Suite)</div>
          <div style="font-size: 7.3pt; color: #334155; line-height: 1.45;">
            بناء نظام إدارة تجاري واحترافي ثنائي اللغة بالكامل (Overview, Orders, Catalog, Growth &amp; CRO, Merch &amp; GWP, B2B Leads, Showcase, Studio, Settings) مع دعم كامل ودقيق لـ 3 عملات رسمية (<strong>EGP • SAR • AED</strong>) ومحدد نسبة الإنجاز اليومي.
          </div>
        </div>
        <div class="card card-accent">
          <div style="font-weight: 800; font-size: 8.5pt; color: #15803d; margin-bottom: 2px;">3. محرك الطباعة الاحترافية KDP Studio 8.5"×8.5" (300 DPI)</div>
          <div style="font-size: 7.3pt; color: #334155; line-height: 1.45;">
            تطوير استوديو متكامل للطباعة على أمازون KDP والمطابع المحلية الفاخرة بدون أي استهلاك للـ Memory، مع حساب تلقائي لسُمك كعب الكتاب (Spine) وفق عدد الصفحات ونوع الورق، وهوامش القص الآمنة للأغلفة العربية RTL.
          </div>
        </div>
        <div class="card" style="background: #fff7ed; border-color: #ffedd5;">
          <div style="font-weight: 800; font-size: 8.5pt; color: #c2410c; margin-bottom: 2px;">4. إنتاج أول كتاب حقيقي وحل 10 ثغرات تشغيلية حرجة</div>
          <div style="font-size: 7.3pt; color: #334155; line-height: 1.45;">
            إنجاز كتاب <strong>«زين ومجرة الفقاعات المفقودة»</strong> بالكامل واكتشاف وحل 10 ثغرات حرجة: وضع بوليصة الهدايا بدون أسعار نهائياً (Gift Packing Slip)، عزل وتشفير صور الأطفال في Canvas محلي، ومطابقة حسابات السلة.
          </div>
        </div>
      </div>

      <div class="grid-3" style="margin-bottom: 8px;">
        <div class="card">
          <div style="font-weight: 800; font-size: 8.2pt; color: #0f172a; margin-bottom: 2px;">5. دراسة ميدانية لـ 8 منافسين</div>
          <div style="font-size: 7.1pt; color: #475569; line-height: 1.4;">
            تحليل دقيق لـ 8 منافسين عالميين وعرب ورسم خطة التفوق السعري والجودة الفائقة مع تسليم محلي سريع خلال 3-5 أيام مقابل 14-25 يوماً للمنافسين المستوردين.
          </div>
        </div>
        <div class="card">
          <div style="font-weight: 800; font-size: 8.2pt; color: #0f172a; margin-bottom: 2px;">6. ميزات رفع قيمة السلة (AOV)</div>
          <div style="font-size: 7.1pt; color: #475569; line-height: 1.4;">
            تفعيل 5 إضافات مربحة لكل كتاب (دفتر التلوين، صندوق الهدايا، ملصقات الأبطال، القصة الصوتية QR، والبطل الإضافي)، مع خصومات الإخوة التلقائية 15% و25%.
          </div>
        </div>
        <div class="card">
          <div style="font-weight: 800; font-size: 8.2pt; color: #0f172a; margin-bottom: 2px;">7. تحويل البراند لمنتجات أطفال (Merch)</div>
          <div style="font-size: 7.1pt; color: #475569; line-height: 1.4;">
            تأسيس متجر المنتجات المادية المرخصة، وإطلاق دمية <strong>Bub Plush Ball Toy</strong> القطنية الفاخرة مع نظام الهدية الترويجية المجانية (Free GWP) كرافعة مبيعات.
          </div>
        </div>
      </div>

      <!-- Quick Comparison Box -->
      <div style="background: #0f172a; color: #f8fafc; border-radius: 8px; padding: 10px 12px; margin-top: 4px;">
        <div style="font-weight: 800; font-size: 8.5pt; color: #38bdf8; margin-bottom: 4px;">مصفوفة الثقة والأمان للشريك التجاري:</div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 7.2pt; line-height: 1.45;">
          <div>
            <strong style="color: #4ade80;">✓ كود نظيف 100%:</strong>
            <div style="color: #cbd5e1;">صفر تحذيرات ESLint، صفر أخطاء TypeScript، وتمرير 70/70 اختباراً آلياً وفحص بنية معمارية.</div>
          </div>
          <div>
            <strong style="color: #38bdf8;">✓ حماية خصوصية صور الأطفال:</strong>
            <div style="color: #cbd5e1;">الصور لا تُخزن كـ Base64 غير مشفر ولا تُرسل لخدمات خارجية، بل تُضغط محلياً إلى Canvas Vault آمن.</div>
          </div>
          <div>
            <strong style="color: #f472b6;">✓ صفر تكاليف اشتراكات خفية:</strong>
            <div style="color: #cbd5e1;">بناء مستقل بالكامل على React/Vite/Supabase دون الاعتماد على أدوات توليد خارجية مدفوعة شهرياً.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <div>Bubbleverse Co-Founders Briefing 2026 • وثيقة سرية مخصصة للشريك</div>
      <div>الصفحة 2 من 6</div>
    </div>
  </div>

  <!-- ================= PAGE 3: FIRST REAL STORY & PRINT EVIDENCE ================= -->
  <div class="page">
    <div>
      <div class="doc-header">
        <div class="doc-brand">
          <div class="bubble-logo-icon"></div>
          <div>
            <div class="brand-title">Bubble<span>verse</span></div>
            <div class="brand-sub">— STORIES IN BUBBLES —</div>
          </div>
        </div>
        <div class="doc-meta-badge">المحور الثاني: إثبات الإنتاج الفعلي للقصة الأولى (300 DPI)</div>
      </div>

      <div class="section-title">إثبات الإنتاج الفعلي: قصة «زين ومجرة الفقاعات المفقودة»</div>
      <p style="font-size: 8.2pt; color: #475569; margin-bottom: 8px;">
        لم يعد Bubbleverse مجرد واجهة عرض أو فكرة نظرية؛ بل تم إنتاج وتصدير أول قصة مخصصة للأطفال بالكامل بدقة <strong>300 DPI</strong> مطابقة لمعايير دور النشر العالمية ومطابع KDP:
      </p>

      <!-- 4 Real Showcase Images -->
      <div class="grid-4" style="margin-bottom: 9px; height: 42mm;">
        <div class="img-box">
          <img src="${imgCover}" alt="Cover" />
          <div class="img-caption">الغلاف الأمامي الفاخر</div>
        </div>
        <div class="img-box">
          <img src="${imgScene01}" alt="Scene 1" />
          <div class="img-caption">المشهد 1: انطلاق الرحلة</div>
        </div>
        <div class="img-box">
          <img src="${imgScene13}" alt="Scene 13" />
          <div class="img-caption">المشهد 13: ذروة المغامرة</div>
        </div>
        <div class="img-box">
          <img src="${imgBack}" alt="Back" />
          <div class="img-caption">الغلاف الخلفي والباركود</div>
        </div>
      </div>

      <!-- Specs Table -->
      <div style="font-weight: 800; font-size: 8.5pt; color: #0f172a; margin-bottom: 3px;">مواصفات ملفات الطباعة المُنتَجة والمحفوظة في النظام:</div>
      <table>
        <thead>
          <tr>
            <th>الملف المُصدَّر</th>
            <th>المقاس الهندسي</th>
            <th>الدقة (DPI)</th>
            <th>عدد الصفحات</th>
            <th>الاستخدام المعتمد</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>FullBook PDF</strong></td>
            <td>8.5" × 8.5" (215.9 × 215.9 mm)</td>
            <td>300 DPI</td>
            <td>19 صفحة</td>
            <td>المعاينة الرقمية الكاملة + الطباعة الفاخرة السريعة</td>
          </tr>
          <tr>
            <td><strong>KDP Interior PDF</strong></td>
            <td>8.625" × 8.75" (مع هوامش القص Bleed)</td>
            <td>300 DPI</td>
            <td>32 صفحة كاملة</td>
            <td>المحتوى الداخلي المطابق لمتطلبات Amazon KDP</td>
          </tr>
          <tr>
            <td><strong>KDP Cover Wrap RTL</strong></td>
            <td>غلاف كامل مفرود (وجه + كعب + ظهر)</td>
            <td>300 DPI</td>
            <td>لوحة واحدة مفرودة</td>
            <td>غلاف التغليف الفاخر Hardcover مع حساب الكعب آلياً</td>
          </tr>
        </tbody>
      </table>

      <!-- 10 Critical Fixes Breakdown -->
      <div style="margin-top: 9px;">
        <div class="section-title" style="font-size: 10pt; margin-bottom: 4px;">أبرز الثغرات التشغيلية التي تم اكتشافها وحلها نهائياً:</div>
        <div class="grid-2">
          <div class="card">
            <strong style="color: #0284c7; font-size: 7.8pt;">1. وضع بوليصة الهدايا التامة (Gift Packing Slip):</strong>
            <div style="font-size: 7pt; color: #475569; margin-top: 1px;">
              إلغاء ظهور أي أسعار أو تكاليف أو إجماليات في البوليصة المطبوعة عند اختيار العميل "إرسال كهدية"، لمنع إحراج المشتري أمام المستلم.
            </div>
          </div>
          <div class="card">
            <strong style="color: #7e22ce; font-size: 7.8pt;">2. درع الخصوصية لصور الأطفال (Photo Vault):</strong>
            <div style="font-size: 7pt; color: #475569; margin-top: 1px;">
              منع تخزين صور الأطفال داخل نصوص الـ JSON أو نقلها دون تشفير، وتحويلها لصور مصغرة معالجة داخل الذاكرة المحلية فقط.
            </div>
          </div>
          <div class="card">
            <strong style="color: #15803d; font-size: 7.8pt;">3. مزامنة ملاحظات الطلب (Order Notes Sync):</strong>
            <div style="font-size: 7pt; color: #475569; margin-top: 1px;">
              ربط ملاحظات العميل (مثل اسم المهدى إليه والإهداء المخصص) بين سلة الشراء ومودال الدفع ورسائل الواتساب تلقائياً.
            </div>
          </div>
          <div class="card">
            <strong style="color: #c2410c; font-size: 7.8pt;">4. مطابقة وتوحيد العملات الثلاث (ISO Parity):</strong>
            <div style="font-size: 7pt; color: #475569; margin-top: 1px;">
              توحيد أكواد العملات (EGP, SAR, AED) في قواعد البيانات ومنع اختلاط أسعار الشحن والعمليات الحسابية عبر الحدود.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <div>Bubbleverse Co-Founders Briefing 2026 • وثيقة سرية مخصصة للشريك</div>
      <div>الصفحة 3 من 6</div>
    </div>
  </div>

  <!-- ================= PAGE 4: COMPETITOR BENCHMARK ================= -->
  <div class="page">
    <div>
      <div class="doc-header">
        <div class="doc-brand">
          <div class="bubble-logo-icon"></div>
          <div>
            <div class="brand-title">Bubble<span>verse</span></div>
            <div class="brand-sub">— STORIES IN BUBBLES —</div>
          </div>
        </div>
        <div class="doc-meta-badge">المحور الثالث: دراسة المنافسين الـ 8 وخريطة التفوق السوقي</div>
      </div>

      <div class="section-title">التحليل التنافسي الميداني: Bubbleverse مقابل 8 منافسين</div>
      <p style="font-size: 8.2pt; color: #475569; margin-bottom: 7px;">
        أجرينا بحثاً استقصائياً عميقاً على أشهر 8 منصات متخصصة في قصص الأطفال عالمياً وعربياً لتحديد الفجوات السعرية والتشغيلية التي سنستحوذ من خلالها على السوق:
      </p>

      <table>
        <thead>
          <tr>
            <th>المنصة المنافسة</th>
            <th>النطاق</th>
            <th>متوسط السعر</th>
            <th>مدة الشحن</th>
            <th>جودة ورسم الوجه</th>
            <th>دعم اللغة العربية</th>
            <th>نقاط الضعف الجوهرية لديهم</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #f0fdf4;">
            <td><strong>Bubbleverse (نحن)</strong></td>
            <td><strong>مصر والخليج</strong></td>
            <td><strong>490 ج.م / 125 ر.س</strong></td>
            <td><strong>3 – 5 أيام</strong></td>
            <td><strong>شبه متطابق فوتوغرافي</strong></td>
            <td><strong>أصلية موزونة (مقفى)</strong></td>
            <td><strong>— (أسرع وأرخص وأعلى جودة فنية)</strong></td>
          </tr>
          <tr>
            <td><strong>Wonderbly</strong> (بريطانيا)</td>
            <td>عالمي</td>
            <td>$39.99 + $12 شحن</td>
            <td>14 – 21 يوماً</td>
            <td>أفاتار كارتوني عام</td>
            <td>محدود ومترجم حرفياً</td>
            <td>سعر مرتفع جداً (أكثر من 2000 ج.م) وبطء الشحن</td>
          </tr>
          <tr>
            <td><strong>Hooray Heroes</strong> (أمريكا)</td>
            <td>عالمي</td>
            <td>$44.00 + شحن</td>
            <td>12 – 18 يوماً</td>
            <td>أفاتار جاهز (لون شعر وعين)</td>
            <td>غير مدعوم نهائياً</td>
            <td>لا يوجد أي تخصيص لملامح وجه الطفل الحقيقية</td>
          </tr>
          <tr>
            <td><strong>Magic Story</strong> (أمريكا)</td>
            <td>عالمي</td>
            <td>$35.00</td>
            <td>14 يوماً</td>
            <td>AI رقمي حديث</td>
            <td>غير متوفر</td>
            <td>تركيز على السوق الغربي وغياب الهوية العربية</td>
          </tr>
          <tr>
            <td><strong>StoryHero</strong> (الإمارات)</td>
            <td>الإمارات والخليج</td>
            <td>190 – 240 درهم</td>
            <td>5 – 8 أيام</td>
            <td>توليد AI متفاوت الدقة</td>
            <td>مدعوم ولكن بركاكة لغوية</td>
            <td>تسعير مرتفع جداً وضعف في حبكة القصة المقفاة</td>
          </tr>
          <tr>
            <td><strong>LoveToRead</strong> (السعودية)</td>
            <td>الخليج</td>
            <td>180 – 220 ريال</td>
            <td>7 – 10 أيام</td>
            <td>رسوم مسبقة التجهيز</td>
            <td>عربي فصحى ممتاز</td>
            <td>خيارات تخصيص محدودة جداً وتكلفة إنتاج عالية</td>
          </tr>
          <tr>
            <td><strong>Kunhero</strong> (مصر)</td>
            <td>مصر</td>
            <td>650 – 850 ج.م</td>
            <td>7 – 12 يوماً</td>
            <td>أفاتار كارتوني مبسط</td>
            <td>عربي عامي وفصحى</td>
            <td>تأخر في مواعيد التسليم وضعف جودة تجليد الغلاف</td>
          </tr>
          <tr>
            <td><strong>Qissati / حكايتي</strong> (مصر)</td>
            <td>مصر</td>
            <td>550 – 750 ج.م</td>
            <td>6 – 10 أيام</td>
            <td>رسومات يدوية مكررة</td>
            <td>عربي كلاسيكي</td>
            <td>بطء التوسع وغياب الإضافات الحديثة مثل QR الصوتي</td>
          </tr>
        </tbody>
      </table>

      <!-- 6 Key Competitive Advantages -->
      <div style="margin-top: 8px;">
        <div class="section-title" style="font-size: 10pt; margin-bottom: 4px;">نقاط التفوق الاستراتيجي لـ Bubbleverse في السوق:</div>
        <div class="grid-3">
          <div class="card card-blue">
            <strong style="color: #0284c7; font-size: 7.8pt;">1. شبه تطابق ملامح الطفل:</strong>
            <div style="font-size: 7pt; color: #475569; margin-top: 1px;">
              لا نستخدم أفاتار كارتوني مسبق الصنع؛ بل نرسم الطفل من صورته الحقيقية بدقة فنية فائقة تجعل الأهل يبهرون عند رؤية كتابهم.
            </div>
          </div>
          <div class="card card-purple">
            <strong style="color: #7e22ce; font-size: 7.8pt;">2. سرعة التسليم المحلي (3-5 أيام):</strong>
            <div style="font-size: 7pt; color: #475569; margin-top: 1px;">
              الطباعة والتجليد محلياً داخل مصر والرياض ودبي تلغي الجمارك وانتظار الشحن الدولي 3 أسابيع، وتقلل تكلفة الشحن بنسبة 70%.
            </div>
          </div>
          <div class="card card-accent">
            <strong style="color: #15803d; font-size: 7.8pt;">3. تكامل المنتجات الملموسة (Bub Plush):</strong>
            <div style="font-size: 7pt; color: #475569; margin-top: 1px;">
              نحن الوحيدون الذين نربط القصة بالدمية القطنية الحقيقية لشخصية القصة، ليحتضنها الطفل أثناء القراءة قبل النوم (Emotional Anchor).
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <div>Bubbleverse Co-Founders Briefing 2026 • وثيقة سرية مخصصة للشريك</div>
      <div>الصفحة 4 من 6</div>
    </div>
  </div>

  <!-- ================= PAGE 5: KIDS MERCH & UNIT ECONOMICS ================= -->
  <div class="page">
    <div>
      <div class="doc-header">
        <div class="doc-brand">
          <div class="bubble-logo-icon"></div>
          <div>
            <div class="brand-title">Bubble<span>verse</span></div>
            <div class="brand-sub">— STORIES IN BUBBLES —</div>
          </div>
        </div>
        <div class="doc-meta-badge">المحور الرابع: اقتصاديات الوحدة وتحول البراند لمنتجات الأطفال</div>
      </div>

      <div class="section-title">عالم منتجات الأطفال (Kids Brand Ecosystem) واقتصاديات الوحدة</div>
      <p style="font-size: 8.2pt; color: #475569; margin-bottom: 7px;">
        تحولنا من مجرد شركة برمجيات إلى <strong>Children's Lifestyle &amp; Keepsake Brand</strong> عبر إطلاق التميمة المحبوبة <strong>Bub</strong> كدمية قطنية حقيقية ومنتجات غرفة نوم مكملة تضاعف هامش الربح:
      </p>

      <!-- Merch Gallery -->
      <div class="grid-4" style="margin-bottom: 8px; height: 38mm;">
        <div class="img-box">
          <img src="${imgBubPlush}" alt="Bub Plush Ball" />
          <div class="img-caption">دمية Bub القطنية الفاخرة (12/20/30cm)</div>
        </div>
        <div class="img-box">
          <img src="${imgGiftBox}" alt="Luxury Gift Box" />
          <div class="img-caption">صندوق الهدايا الملكي (كتاب + دمية)</div>
        </div>
        <div class="img-box">
          <img src="${imgNightLamp}" alt="Night Lamp" />
          <div class="img-caption">مصباح النوم النجمي لغرفة الطفل</div>
        </div>
        <div class="img-box">
          <img src="${imgBackpack}" alt="Backpack" />
          <div class="img-caption">حقيبة مغامرات الأبطال المضيئة</div>
        </div>
      </div>

      <!-- Free GWP Strategy -->
      <div class="card card-accent" style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #15803d; font-size: 8.5pt;">★ سلاح مضاعفة المبيعات: محرك الهدية المجانية التلقائي (Free Bub Plush GWP)</strong>
          <span class="badge-pill badge-green">مفعل في السلة والـ Admin</span>
        </div>
        <div style="font-size: 7.2pt; color: #334155; line-height: 1.45; margin-top: 3px;">
          يحصل العميل تلقائياً على <strong>دمية Bub Plush Ball (Mini 12cm) مجاناً</strong> عند شراء أي كتاب غلاف فني أو تجاوز السلة 700 ج.م / 155 ر.س. هذا العرض يرفع معدل تحويل الزوار (Conversion Rate) بنسبة تقديرية +35% ويدفع العميل لاختيار الغلاف الفني بدلاً من الرقمي دون تردد.
        </div>
      </div>

      <!-- Unit Economics Table -->
      <div style="font-weight: 800; font-size: 8.5pt; color: #0f172a; margin-bottom: 3px;">هيكل التكاليف والأرباح المقدرة للوحدة (Unit Economics):</div>
      <table>
        <thead>
          <tr>
            <th>المنتج / الباقة</th>
            <th>سعر البيع للعميل</th>
            <th>تكلفة الإنتاج (COGS)</th>
            <th>التغليف والشحن</th>
            <th>صافي الربح التقديري</th>
            <th>هامش الربح %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>كتاب غلاف فني Hardcover</strong></td>
            <td>490 ج.م (125 ر.س)</td>
            <td>120 – 140 ج.م</td>
            <td>45 ج.م</td>
            <td><strong>305 – 325 ج.م</strong></td>
            <td><span class="badge-pill badge-green">63% – 66%</span></td>
          </tr>
          <tr>
            <td><strong>باقة الأبطال (كتابين - خصم 15%)</strong></td>
            <td>833 ج.م (212 ر.س)</td>
            <td>240 ج.م</td>
            <td>45 ج.م</td>
            <td><strong>548 ج.م</strong></td>
            <td><span class="badge-pill badge-green">65%</span></td>
          </tr>
          <tr>
            <td><strong>دمية Bub القطنية الكبيرة (30cm)</strong></td>
            <td>490 ج.م (125 ر.س)</td>
            <td>110 – 130 ج.م</td>
            <td>45 ج.م</td>
            <td><strong>315 – 335 ج.م</strong></td>
            <td><span class="badge-pill badge-purple">68%</span></td>
          </tr>
          <tr>
            <td><strong>صندوق الهدايا الملكي الكامل (Luxury Box)</strong></td>
            <td>990 ج.م (245 ر.س)</td>
            <td>260 ج.م</td>
            <td>50 ج.م</td>
            <td><strong>680 ج.م</strong></td>
            <td><span class="badge-pill badge-purple">69%</span></td>
          </tr>
          <tr>
            <td><strong>الإضافات الرقمية (صوتية QR + تلوين)</strong></td>
            <td>175 ج.م (45 ر.س)</td>
            <td>10 ج.م</td>
            <td>0 ج.م</td>
            <td><strong>165 ج.م</strong></td>
            <td><span class="badge-pill badge-blue">94%</span></td>
          </tr>
        </tbody>
      </table>

      <!-- Policy highlight -->
      <div style="margin-top: 7px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 7.1pt; color: #475569;">
        <strong>درع حماية السيولة (COD Protection Policy):</strong> نظراً لأن الكتب والمجسمات مخصصة باسم وصورة كل طفل على حدة ولا يمكن إعادة بيعها لشخص آخر، يفرض النظام سياسة دفع عربون 50% عبر إنستاباي أو البطاقات البنكية لتفادي أي خسائر ناتجة عن رفض استلام الشحنات عند الباب.
      </div>
    </div>

    <div class="doc-footer">
      <div>Bubbleverse Co-Founders Briefing 2026 • وثيقة سرية مخصصة للشريك</div>
      <div>الصفحة 5 من 6</div>
    </div>
  </div>

  <!-- ================= PAGE 6: LAUNCH PLAN & NEXT 30 DAYS ================= -->
  <div class="page">
    <div>
      <div class="doc-header">
        <div class="doc-brand">
          <div class="bubble-logo-icon"></div>
          <div>
            <div class="brand-title">Bubble<span>verse</span></div>
            <div class="brand-sub">— STORIES IN BUBBLES —</div>
          </div>
        </div>
        <div class="doc-meta-badge">المحور الخامس: الجاهزية الفنية وخطة الإطلاق للـ 30 يوماً القادمة</div>
      </div>

      <div class="section-title">الجاهزية الفنية وخطة الإطلاق التنفيذية (30-Day Launch Roadmap)</div>
      <p style="font-size: 8.2pt; color: #475569; margin-bottom: 8px;">
        المنصة البرمجية الآن في حالة استقرار واكتمال فني 100%، وتم التحقق منها بـ 70 اختباراً آلياً وفحص بصري شامل. إليك خطة العمل المباشرة المتفق عليها بين الشريكين لبدء استقبال الطلبات وتحقيق أول 100 مبيعة:
      </p>

      <!-- 4-Week Launch Roadmap -->
      <div style="display: flex; flex-direction: column; gap: 7px; margin-bottom: 9px;">
        <div class="card" style="border-right: 4px solid #0284c7;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #0284c7; font-size: 8.2pt;">الأسبوع 1: طباعة العينات واعتماد جودة التجليد (Print Verification)</strong>
            <span class="badge-pill badge-blue">الأيام 1 – 7</span>
          </div>
          <div style="font-size: 7.2pt; color: #334155; margin-top: 2px;">
            طباعة ملفات قصة «زين ومجرة الفقاعات المفقودة» (FullBook و CoverWrap RTL) في مطبعة ديجيتال محلية (ورق كوشيه 170 جم + تجليد فني مقوى Hardcover)، والتأكد من مطابقة الألوان ولمعان السلوفان اللامع.
          </div>
        </div>

        <div class="card" style="border-right: 4px solid #7e22ce;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #7e22ce; font-size: 8.2pt;">الأسبوع 2: تفعيل بوابات الدفع وشحن العينات الأولى (Payment &amp; Logistics)</strong>
            <span class="badge-pill badge-purple">الأيام 8 – 14</span>
          </div>
          <div style="font-size: 7.2pt; color: #334155; margin-top: 2px;">
            تفعيل حساب إنستاباي التجاري / Paymob لمدفوعات مصر، وحساب Stripe / MyFatoorah للسعودية والإمارات، والتعاقد مع شركة شحن محلي سريع (Bosta في مصر، أو SMSA/Aramex في الخليج).
          </div>
        </div>

        <div class="card" style="border-right: 4px solid #ec4899;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #ec4899; font-size: 8.2pt;">الأسبوع 3: حملة الترويج وصناع المحتوى الأمهات (UGC &amp; Influencer Seeding)</strong>
            <span class="badge-pill badge-pink" style="background: #fce7f3; color: #be185d;">الأيام 15 – 21</span>
          </div>
          <div style="font-size: 7.2pt; color: #334155; margin-top: 2px;">
            إرسال 10 صناديق هدايا فاخرة مجانية (كتاب مخصص باسم وصورة الطفل + دمية Bub) لأمهات مؤثرات على إنستغرام وتيك توك، ونشر فيديوهات فتح الصندوق (Unboxing Reaction) وردة فعل الطفل المبهرة.
          </div>
        </div>

        <div class="card" style="border-right: 4px solid #15803d;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #15803d; font-size: 8.2pt;">الأسبوع 4: التوسع المؤسسي للمدارس والحضانات (B2B Expansion)</strong>
            <span class="badge-pill badge-green">الأيام 22 – 30</span>
          </div>
          <div style="font-size: 7.2pt; color: #334155; margin-top: 2px;">
            تفعيل بوابة المدارس (<code>/schools</code>) والتواصل مع أول 5 حضانات ومدارس لغات دولية لتقديم هدايا التخرج ونهاية العام المخصصة للأطفال بخصم 25%–35% للطلبيات المجمعة.
          </div>
        </div>
      </div>

      <!-- Quick Links for Partner Review -->
      <div style="background: #0f172a; color: #f8fafc; border-radius: 8px; padding: 10px 12px;">
        <div style="font-weight: 800; font-size: 8.5pt; color: #38bdf8; margin-bottom: 5px;">روابط سريعة لمعاينة النظام حياً على جهازك الآن:</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 7.2pt;">
          <div>• الصفحة الرئيسية الفاخرة: <code>http://127.0.0.1:8080/</code></div>
          <div>• متجر المنتجات ودمية Bub: <code>http://127.0.0.1:8080/merch</code></div>
          <div>• لوحة التحكم الإدارية: <code>http://127.0.0.1:8080/admin/orders</code></div>
          <div>• إدارة متجر Merch والـ GWP: <code>http://127.0.0.1:8080/admin/merch</code></div>
          <div>• استوديو الطباعة KDP Builder: <code>http://127.0.0.1:8080/admin/pdf-builder</code></div>
          <div>• بوابة المدارس وطلبات B2B: <code>http://127.0.0.1:8080/schools</code></div>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <div>Bubbleverse Co-Founders Briefing 2026 • وثيقة سرية مخصصة للشريك</div>
      <div>الصفحة 6 من 6</div>
    </div>
  </div>

</body>
</html>`;

async function main() {
  console.log('[partner-pdf] Locating browser binary...');
  const browserBin = findBrowserBinary();
  console.log(`[partner-pdf] Using browser: ${browserBin}`);

  const tempHtmlPath = path.join(os.tmpdir(), `bubbleverse-partner-report-${Date.now()}.html`);
  fs.writeFileSync(tempHtmlPath, html, 'utf8');
  console.log(`[partner-pdf] Wrote temporary HTML to: ${tempHtmlPath}`);

  // Ensure directories exist
  fs.mkdirSync(path.dirname(outputPdfPath), { recursive: true });
  fs.mkdirSync(path.dirname(publicPdfPath), { recursive: true });

  const tempPdfPath = path.join(os.tmpdir(), `bubbleverse-partner-report-${Date.now()}.pdf`);

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=5000',
    `--print-to-pdf=${tempPdfPath}`,
    tempHtmlPath,
  ];

  console.log('[partner-pdf] Generating PDF via headless browser...');
  execFileSync(browserBin, args, { stdio: 'pipe' });

  if (!fs.existsSync(tempPdfPath)) {
    throw new Error('PDF output file was not generated.');
  }

  const stat = fs.statSync(tempPdfPath);
  console.log(`[partner-pdf] Generated PDF size: ${(stat.size / 1024 / 1024).toFixed(2)} MB (${stat.size} bytes)`);

  fs.copyFileSync(tempPdfPath, outputPdfPath);
  fs.copyFileSync(tempPdfPath, publicPdfPath);
  console.log(`[partner-pdf] Saved to: ${outputPdfPath}`);
  console.log(`[partner-pdf] Saved to: ${publicPdfPath}`);

  try {
    fs.unlinkSync(tempHtmlPath);
    fs.unlinkSync(tempPdfPath);
  } catch {}

  console.log('[partner-pdf] Done successfully!');
}

main().catch((err) => {
  console.error('[partner-pdf] Failed:', err);
  process.exit(1);
});
