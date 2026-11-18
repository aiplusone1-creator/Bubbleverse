import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const outputPdfPath = path.join(repoRoot, 'docs', 'BUBBLEVERSE_FIRST_STORY_PLAYBOOK.pdf');
const publicPdfPath = path.join(repoRoot, 'public', 'docs', 'BUBBLEVERSE_FIRST_STORY_PLAYBOOK.pdf');

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

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>Bubbleverse — First Real Story Playbook (8.5" × 8.5" KDP &amp; Local Print)</title>
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
      line-height: 1.58;
      font-size: 9.8pt;
    }

    .page {
      width: 210mm;
      height: 297mm;
      padding: 15mm 16mm 14mm 16mm;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      background: #ffffff;
    }

    .page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    /* Cover Page */
    .cover-page {
      background: linear-gradient(155deg, #0b1026 0%, #141033 52%, #090d1e 100%);
      color: #f8fafc;
      padding: 20mm 18mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .cover-glow-top {
      position: absolute;
      top: -35mm;
      left: -20mm;
      width: 140mm;
      height: 140mm;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 217, 255, 0.22) 0%, rgba(0, 217, 255, 0) 70%);
    }

    .cover-glow-bot {
      position: absolute;
      bottom: -40mm;
      right: -25mm;
      width: 150mm;
      height: 150mm;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(244, 114, 182, 0.22) 0%, rgba(244, 114, 182, 0) 70%);
    }

    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(0, 217, 255, 0.14);
      border: 1px solid rgba(0, 217, 255, 0.45);
      color: #67e8f9;
      font-weight: 700;
      font-size: 9pt;
    }

    .cover-title {
      font-size: 27pt;
      font-weight: 900;
      line-height: 1.3;
      margin: 14px 0 10px 0;
      color: #ffffff;
    }

    .gradient-text {
      background: linear-gradient(90deg, #00d9ff 0%, #a78bfa 50%, #f472b6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .cover-sub {
      font-size: 11.5pt;
      color: #cbd5e1;
      max-width: 165mm;
      margin: 0 0 18px 0;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 14px;
    }

    .cover-meta-card {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 14px;
      padding: 11px 13px;
    }

    .cover-meta-label {
      font-size: 8pt;
      color: #94a3b8;
      margin-bottom: 3px;
    }

    .cover-meta-value {
      font-size: 10.5pt;
      font-weight: 800;
      color: #ffffff;
      direction: ltr;
      unicode-bidi: isolate;
      text-align: right;
    }

    .toc-box {
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(167, 139, 250, 0.35);
      border-radius: 18px;
      padding: 16px 18px;
      position: relative;
      z-index: 2;
    }

    .toc-title {
      font-size: 11pt;
      font-weight: 800;
      color: #67e8f9;
      margin: 0 0 10px 0;
    }

    .toc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
    }

    .toc-item {
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 9.2pt;
      color: #e2e8f0;
      padding: 5px 0;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.12);
    }

    .toc-num {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00d9ff, #8b5cf6);
      color: #090d1e;
      font-weight: 900;
      font-size: 8.5pt;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .cover-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      padding-top: 10px;
      font-size: 8.5pt;
      color: #94a3b8;
      position: relative;
      z-index: 2;
    }

    /* Interior Page Header & Footer */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 7px;
      margin-bottom: 12px;
    }

    .chapter-tag {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      background: #ecfeff;
      border: 1px solid #67e8f9;
      color: #0e7490;
      font-size: 8pt;
      font-weight: 800;
    }

    .header-brand {
      font-size: 8.5pt;
      font-weight: 800;
      color: #64748b;
      direction: ltr;
    }

    h2 {
      font-size: 16pt;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 8px 0;
      line-height: 1.3;
    }

    h3 {
      font-size: 11pt;
      font-weight: 800;
      color: #4c1d95;
      margin: 11px 0 5px 0;
    }

    p {
      margin: 0 0 7px 0;
      color: #334155;
    }

    .ltr {
      direction: ltr;
      unicode-bidi: isolate;
      display: inline-block;
      font-family: 'Consolas', 'Segoe UI', monospace;
    }

    .ltr-text {
      direction: ltr;
      unicode-bidi: isolate;
      display: inline-block;
    }

    td.ltr {
      display: table-cell;
      direction: ltr;
      unicode-bidi: isolate;
      text-align: left;
      font-family: 'Consolas', 'Segoe UI', monospace;
      white-space: nowrap;
    }

    .card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 10px 12px;
      margin-bottom: 9px;
    }

    .card-accent {
      background: linear-gradient(135deg, #f5f3ff 0%, #ecfeff 100%);
      border: 1px solid #a5b4fc;
      border-radius: 12px;
      padding: 10px 12px;
      margin-bottom: 9px;
    }

    .card-dark {
      background: #0f172a;
      color: #f1f5f9;
      border-radius: 12px;
      padding: 10px 13px;
      margin-bottom: 9px;
    }

    .card-dark p, .card-dark code {
      color: #e2e8f0;
    }

    .step-list {
      display: flex;
      flex-direction: column;
      gap: 7px;
      margin-bottom: 8px;
    }

    .step-row {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-right: 4px solid #06b6d4;
      border-radius: 10px;
      padding: 8px 11px;
    }

    .step-badge {
      width: 24px;
      height: 24px;
      border-radius: 8px;
      background: #0f172a;
      color: #38bdf8;
      font-weight: 900;
      font-size: 9pt;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .step-body > strong {
      color: #0f172a;
      font-size: 9.8pt;
      display: block;
      margin-bottom: 2px;
    }

    .step-body span {
      color: #475569;
      font-size: 8.9pt;
    }

    .prompt-box {
      direction: ltr;
      text-align: left;
      background: #0b1120;
      color: #e0f2fe;
      border: 1px solid #38bdf8;
      border-radius: 10px;
      padding: 9px 11px;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 8.2pt;
      line-height: 1.48;
      margin: 6px 0 9px 0;
      white-space: pre-wrap;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 7px 0 10px 0;
      font-size: 8.6pt;
    }

    th {
      background: #0f172a;
      color: #f8fafc;
      padding: 6.5px 8px;
      text-align: right;
      font-weight: 700;
    }

    td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      color: #1e293b;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .three-col {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .template-pill {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-top: 3px solid #8b5cf6;
      border-radius: 10px;
      padding: 8px 10px;
    }

    .template-pill strong {
      display: block;
      color: #0f172a;
      font-size: 9pt;
      margin-bottom: 3px;
    }

    .template-pill p {
      font-size: 8.2pt;
      margin: 0;
    }

    .wa-template {
      background: #ecfdf5;
      border: 1px solid #6ee7b7;
      border-right: 4px solid #10b981;
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 8.8pt;
      color: #064e3b;
      line-height: 1.55;
    }

    .checklist {
      list-style: none;
      padding: 0;
      margin: 4px 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 12px;
    }

    .checklist li {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px 9px;
      font-size: 8.6pt;
      color: #1e293b;
    }

    .page-footer {
      position: absolute;
      bottom: 9mm;
      left: 16mm;
      right: 16mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 5px;
      font-size: 8pt;
      color: #64748b;
    }

    .diagram-wrap {
      background: #0b1026;
      border-radius: 12px;
      padding: 10px;
      margin: 7px 0 9px 0;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- ===================================================================== -->
  <!-- PAGE 1: COVER PAGE                                                    -->
  <!-- ===================================================================== -->
  <section class="page cover-page">
    <div class="cover-glow-top"></div>
    <div class="cover-glow-bot"></div>

    <div style="position: relative; z-index: 2;">
      <div class="brand-pill">✦ BUBBLEVERSE PRODUCTION PLAYBOOK • EDITION 1.0</div>
      <h1 class="cover-title">
        الدليل التشغيلي الشامل لإنتاج<br/>
        <span class="gradient-text">أول قصة حقيقية مطبوعة</span>
      </h1>
      <p class="cover-sub">
        خطة تنفيذية كاملة خطوة بخطوة (Case Scenario SOP) من لحظة دخول العميل على موقع Bubbleverse
        وحتى استلامه كتابه المطبوع والمغلف بمقاس <span class="ltr">8.5" × 8.5"</span> المطابق لمعايير
        <strong>Amazon KDP</strong> والمطابع المحلية الاحترافية.
      </p>

      <div class="cover-meta-grid">
        <div class="cover-meta-card">
          <div class="cover-meta-label">المقاس النهائي بعد القص</div>
          <div class="cover-meta-value">8.5" × 8.5" (215.9mm)</div>
        </div>
        <div class="cover-meta-card">
          <div class="cover-meta-label">مقاس KDP مع الهوامش</div>
          <div class="cover-meta-value">8.625" × 8.75" (Bleed)</div>
        </div>
        <div class="cover-meta-card">
          <div class="cover-meta-label">خط إنتاج الرسومات</div>
          <div class="cover-meta-value">Nano Banana + Flux</div>
        </div>
      </div>
    </div>

    <div class="toc-box">
      <h2 class="toc-title">خارطة طريق الدليل (5 مراحل تشغيلية متكاملة)</h2>
      <div class="toc-grid">
        <div class="toc-item"><span class="toc-num">1</span> سيناريو العميل الأول: من الموقع إلى تأكيد العربون</div>
        <div class="toc-item"><span class="toc-num">2</span> ورشة الذكاء الاصطناعي الهجينة وثبات ملامح الطفل</div>
        <div class="toc-item"><span class="toc-num">3</span> المواصفات الهندسية لـ Amazon KDP 8.5"×8.5" وحساب الكعب</div>
        <div class="toc-item"><span class="toc-num">4</span> بوابة اعتماد الواتساب وتشغيل صانع PDF في لوحة الإدارة</div>
        <div class="toc-item"><span class="toc-num">5</span> أمر تشغيل المطبعة، فحص الجودة (QC)، التغليف والشحن</div>
        <div class="toc-item"><span class="toc-num">★</span> قوالب Prompts جاهزة + رسالة اعتماد للعميل</div>
      </div>
    </div>

    <div class="cover-footer">
      <span>Bubbleverse Studio • Local-First B2C Storybook Engine</span>
      <span class="ltr">/admin/pdf-builder • 300 DPI Press Ready</span>
    </div>
  </section>

  <!-- ===================================================================== -->
  <!-- PAGE 2: CHAPTER 1 — END-TO-END CASE SCENARIO                          -->
  <!-- ===================================================================== -->
  <section class="page">
    <div class="page-header">
      <span class="chapter-tag">المرحلة 01 • رحلة العميل الأولى (Case Scenario)</span>
      <span class="header-brand">BUBBLEVERSE FIRST STORY PLAYBOOK</span>
    </div>

    <h2>سيناريو عملي كامل: من أول زيارة للموقع حتى بدء إنتاج القصة</h2>
    <p>
      لنطبق الرحلة على حالة واقعية نموذجية: <strong>الأم "سارة"</strong> دخلت على موقع Bubbleverse لطلب
      أول قصة مطبوعة مقاس <span class="ltr">8.5" × 8.5"</span> لابنها <strong>"زين" (5 سنوات)</strong> كهدية عيد ميلاد.
    </p>

    <div class="step-list">
      <div class="step-row">
        <div class="step-badge">1</div>
        <div class="step-body">
          <strong>الدخول واكتشاف التجربة (<span class="ltr">/</span> و <span class="ltr">/stories</span>)</strong>
          <span>تشاهد الأم مقارنة "قبل وبعد" لتحويل صورة الطفل إلى بطل قصة حقيقي، وتختار مغامرة من الكتالوج (مثلاً: رائد الفضاء الصغير) أو تضغط "اصنع قصة مخصصة" لفتح المعالج التفاعلي.</span>
        </div>
      </div>

      <div class="step-row">
        <div class="step-badge">2</div>
        <div class="step-body">
          <strong>تخصيص بيانات البطل ورفع الصور بخصوصية كاملة</strong>
          <span>تُدخل اسم الطفل ("زين")، العمر، النوع، لغة القصة (عربي أو إنجليزي)، نوع الطباعة (كتاب مطبوع فاخر <span class="ltr">8.5" × 8.5"</span>)، وتكتب <strong>رسالة الإهداء الشخصي</strong> التي ستُطبع في الصفحة الأولى. عند رفع 1–3 صور واضحة للطفل، تُحفظ محلياً في <span class="ltr">photoVault</span> بأمان تام ولا تُنشر علناً.</span>
        </div>
      </div>

      <div class="step-row">
        <div class="step-badge">3</div>
        <div class="step-body">
          <strong>إتمام الطلب والعربون (Guest Checkout + WhatsApp)</strong>
          <span>تفتح سلة المشتريات وتُدخل الاسم ورقم الواتساب والعنوان. يُصدر الموقع كود تتبّع فوري مثل <span class="ltr">BV-EG-482910</span> مع تفاصيل دفع عربون 50% (InstaPay / Vodafone Cash في مصر أو STC Pay / Mada في السعودية) ويفتح رسالة واتساب مُنسّقة تلقائياً.</span>
        </div>
      </div>

      <div class="step-row">
        <div class="step-badge">4</div>
        <div class="step-body">
          <strong>استلام الطلب وتأكيد الدفع في لوحة الإدارة (<span class="ltr">/admin/orders</span>)</strong>
          <span>بمجرد استلام إيصال تحويل العربون على الواتساب، تدخل لوحة الإدارة، تراجع صورة الطفل ورسالة الإهداء، وتُغيّر حالة الطلب من <span class="ltr">pending_deposit</span> إلى <span class="ltr">deposit_confirmed</span> ثم <span class="ltr">in_preparation</span>. يظهر التحديث فوراً للعميلة في صفحة تتبع الطلب (<span class="ltr">/track</span>).</span>
        </div>
      </div>

      <div class="step-row">
        <div class="step-badge">5</div>
        <div class="step-body">
          <strong>تجهيز السيناريو وأوامر الرسم (<span class="ltr">/admin/studio</span>)</strong>
          <span>تضغط "فتح في الاستوديو" من داخل الطلب، فيتم سحب اسم الطفل واللغة وعدد الصفحات (15 إلى 24 صفحة) تلقائياً. تراجع نص كل صفحة ليحمل اسم "زين" بأسلوب دافئ مناسب لعمر 5 سنوات، وتنسخ أوامر الرسم المنظمة لبدء التوليد.</span>
        </div>
      </div>
    </div>

    <div class="card-accent">
      <h3>معايير قبول صورة الطفل من العميل (قبل البدء بالرسم)</h3>
      <div class="two-col" style="font-size: 8.8pt;">
        <div>
          <strong>✅ صور ممتازة لثبات الملامح:</strong><br/>
          • إضاءة نهارية واضحة أمام الوجه بدون ظلال حادة.<br/>
          • الطفل ينظر مباشرة للكاميرا بابتسامة طبيعية.<br/>
          • صورتان إلى 3 صور (أمامية + زاوية ثلاثة أرباع).
        </div>
        <div>
          <strong>❌ صور يجب طلب بديل لها فوراً:</strong><br/>
          • صور بنظارة شمسية أو قبعة تخفي الشعر والجبهة.<br/>
          • صور مهزوزة، بعيدة جداً، أو بفلتر سناب شات قوي.<br/>
          • لقطات جانبية كاملة لا تظهر شكل العينين والأنف.
        </div>
      </div>
    </div>

    <div class="card">
      <strong>قاعدة ذهبية لإدارة الوقت (SLA للعميل الأول):</strong>
      إجمالي وقت الإنتاج الفعلي للكتاب الأول يتراوح بين <strong>2 إلى 4 ساعات عمل مركّز</strong> (تجهيز النص 20 دقيقة + توليد ومراجعة 15–20 لوحة 90 دقيقة + تجميع PDF في <span class="ltr">/admin/pdf-builder</span> 15 دقيقة). أعطِ العميل موعداً رسمياً 24–48 ساعة لإرسال المسودة الرقمية و3–5 أيام عمل للطباعة والشحن.
    </div>

    <div class="page-footer">
      <span>Bubbleverse First Real Story Playbook • 8.5" × 8.5"</span>
      <span class="ltr">Page 2 / 6</span>
    </div>
  </section>

  <!-- ===================================================================== -->
  <!-- PAGE 3: CHAPTER 2 — HYBRID AI ILLUSTRATION PIPELINE                   -->
  <!-- ===================================================================== -->
  <section class="page">
    <div class="page-header">
      <span class="chapter-tag">المرحلة 02 • ورشة الرسومات المتسقة (Hybrid AI Workflow)</span>
      <span class="header-brand">NANO BANANA / GEMINI + FLUX FALLBACK</span>
    </div>

    <h2>توليد 15–24 لوحة مربّعة (1:1) بثبات كامل لملامح الطفل</h2>
    <p>
      سر نجاح كتاب Bubbleverse هو أن يشعر الأب والأم من أول نظرة: <strong>"ده ابني فعلاً في كل صفحة!"</strong>.
      نستخدم خط إنتاج هجين عملي يبدأ بـ <strong>Nano Banana / Gemini Image Generation</strong> كمحرك أساسي،
      مع <strong>Flux / Midjourney</strong> كخطة بديلة للمشاهد المعقدة.
    </p>

    <h3>الخطوة 1: إنشاء ورقة ثبات الشخصية (Character Consistency Sheet)</h3>
    <p>
      قبل رسم أي مشهد من القصة، ارفع صور الطفل المرجعية إلى Nano Banana / Gemini واطلب توليد
      <strong>ورقة مرجعية واحدة (Character Reference Sheet)</strong> تُثبّت الملامح، تسريحة الشعر، لون البشرة،
      والملابس الرسمية للبطل في هذه القصة. احفظ هذه الورقة وأرفقها مع كل برومبت تالي!
    </p>

    <div class="prompt-box">MASTER CHARACTER SHEET PROMPT (Nano Banana / Gemini — Aspect Ratio 1:1):
Create a clean 3D Pixar-style children's storybook character turnaround sheet of the child in the uploaded reference photos (5-year-old boy Zain). Keep exact facial structure, eye shape, skin tone, smile, and curly dark hair faithfully consistent. Show 3 poses side-by-side on a soft neutral cream studio background: (1) front facing smiling, (2) 3/4 view holding a glowing bubble, (3) happy excited expression. Wearing a turquoise-and-navy junior astronaut jacket with star patches, blue sneakers. Soft warm cinematic lighting, crisp details, no text, no watermark.</div>

    <h3>الخطوة 2: توليد صفحات القصة (15–24 لوحة مربعة 1:1)</h3>
    <p>
      في كل مشهد جديد، أرفق <strong>ورقة ثبات الشخصية + صورة مرجعية للطفل</strong>، واستخدم هذا القالب الثابت.
      لاحظ جملة <strong>Composition Safe Space</strong> التي تترك مساحة بصرية مريحة للنص أو للقص:
    </p>

    <div class="prompt-box">SCENE PROMPT FORMULA (1:1 Square — Full Bleed Print Safe):
[CHARACTER LOCK: Exact same 5-year-old boy from the attached character sheet, same face, hair, and turquoise astronaut jacket]
[ACTION]: Floating joyfully next to a friendly glowing purple planet, reaching toward a shimmering cyan soap bubble.
[ENVIRONMENT &amp; LIGHTING]: Dreamy cosmic sky with pastel nebula clouds, golden stardust, soft Pixar volumetric lighting.
[COMPOSITION]: Keep the child's face and important details strictly inside the center 75% safe zone (away from 0.375" trim edges). Leave softer darker sky space near the bottom 25% for storybook text card.
[NEGATIVE]: No text, no letters, no speech bubbles, no watermark, no borders, no cropped head, no extra fingers.</div>

    <div class="two-col">
      <div class="card">
        <h3 style="margin-top: 0;">الخطوة 3: متى تستخدم Flux / Midjourney Fallback؟</h3>
        <p style="font-size: 8.6pt;">
          • إذا أظهر المشهد تفاعلاً حركياً معقداً أو شخصيتين معاً.<br/>
          • عند الرغبة في ستايل <strong>Watercolor</strong> فني ناعم جداً.<br/>
          • في Midjourney استخدم <span class="ltr">--cref [CharacterSheetURL] --cw 85 --ar 1:1</span>.<br/>
          • في Flux استخدم <strong>Flux Kontext / PuLID Face Lock</strong> بنفس الورقة المرجعية.
        </p>
      </div>
      <div class="card-accent">
        <h3 style="margin-top: 0;">الخطوة 4: الترقيم والتكبير لـ 300 DPI</h3>
        <p style="font-size: 8.6pt;">
          • سمّ الملفات بترقيم واضح: <span class="ltr">01-cover.png, 02-scene.png ... 20-scene.png</span> (صانع PDF يرتّبها رقمياً تلقائياً).<br/>
          • كبّر كل صورة (Upscale 2x/4x) لتصل على الأقل إلى <span class="ltr">2588 × 2625 px</span>.<br/>
          • <strong>معلومة طباعة مهمة:</strong> الطباعة الورقية أغمق بنحو 8–10% من شاشة الهاتف — ارفع إضاءة الظلال قليلاً قبل التصدير!
        </p>
      </div>
    </div>

    <div class="page-footer">
      <span>Bubbleverse First Real Story Playbook • Hybrid AI Pipeline</span>
      <span class="ltr">Page 3 / 6</span>
    </div>
  </section>

  <!-- ===================================================================== -->
  <!-- PAGE 4: CHAPTER 3 — AMAZON KDP 8.5" × 8.5" TECHNICAL BLUEPRINT        -->
  <!-- ===================================================================== -->
  <section class="page">
    <div class="page-header">
      <span class="chapter-tag">المرحلة 03 • المواصفات الهندسية لـ Amazon KDP 8.5" × 8.5"</span>
      <span class="header-brand">TRIM • BLEED • SAFE ZONE • SPINE CALCULATOR</span>
    </div>

    <h2>المقاسات الدقيقة بعد القص والتغليف (إنش • ملليمتر • بكسل 300 DPI)</h2>
    <table>
      <thead>
        <tr>
          <th>العنصر الهندسي</th>
          <th>المقاس بالإنش (Inches)</th>
          <th>المقاس بالملليمتر (mm)</th>
          <th>البكسل عند 300 DPI</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>المقاس النهائي بعد القص (Final Trim)</strong></td>
          <td class="ltr">8.500" × 8.500"</td>
          <td class="ltr">215.90 × 215.90 mm</td>
          <td class="ltr">2550 × 2550 px</td>
        </tr>
        <tr>
          <td><strong>صفحة KDP داخلية مع هوامش القص (Full Bleed)</strong></td>
          <td class="ltr">8.625" × 8.750"</td>
          <td class="ltr">219.08 × 222.25 mm</td>
          <td class="ltr">2588 × 2625 px</td>
        </tr>
        <tr>
          <td>هامش القص الخارجي (Bleed — أعلى، أسفل، خارجي)</td>
          <td class="ltr">0.125"</td>
          <td class="ltr">3.175 mm</td>
          <td class="ltr">38 px</td>
        </tr>
        <tr>
          <td>منطقة الأمان للنصوص والوجوه (Outer Safe Margin)</td>
          <td class="ltr">0.375"</td>
          <td class="ltr">9.525 mm</td>
          <td class="ltr">113 px</td>
        </tr>
        <tr>
          <td>هامش التجليد الداخلي عند الكعب (Inside Gutter)</td>
          <td class="ltr">0.500"</td>
          <td class="ltr">12.70 mm</td>
          <td class="ltr">150 px</td>
        </tr>
        <tr>
          <td>صندوق الباركود / QR الآمن على الغلاف الخلفي</td>
          <td class="ltr">2.000" × 1.200"</td>
          <td class="ltr">50.80 × 30.48 mm</td>
          <td class="ltr">600 × 360 px</td>
        </tr>
      </tbody>
    </table>

    <!-- Embedded SVG Print Diagram: Interior + Cover Wrap RTL vs LTR -->
    <div class="diagram-wrap" dir="ltr">
      <svg viewBox="0 0 760 225" width="100%" height="182" direction="ltr" style="direction: ltr;" xmlns="http://www.w3.org/2000/svg">
        <!-- Left Diagram: Interior Bleed/Trim/Safe/Gutter -->
        <text x="125" y="18" fill="#67e8f9" font-size="11" font-weight="700" text-anchor="middle" font-family="Segoe UI, sans-serif">INTERIOR PAGE (8.625" × 8.75")</text>
        <rect x="35" y="28" width="180" height="182" rx="4" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
        <!-- Trim box -->
        <rect x="44" y="37" width="171" height="164" fill="#0f172a" stroke="#00d9ff" stroke-width="2"/>
        <!-- Gutter strip (right side for RTL odd page) -->
        <rect x="195" y="37" width="20" height="164" fill="rgba(251,191,36,0.25)" stroke="#fbbf24" stroke-dasharray="4 3"/>
        <!-- Safe box -->
        <rect x="58" y="51" width="137" height="136" fill="none" stroke="#f472b6" stroke-width="1.6" stroke-dasharray="6 4"/>
        <text x="126" y="116" fill="#f8fafc" font-size="11" font-weight="700" text-anchor="middle" font-family="Segoe UI, sans-serif">SAFE ZONE</text>
        <text x="126" y="132" fill="#f472b6" font-size="9.5" text-anchor="middle" font-family="Segoe UI, sans-serif">Text &amp; Faces Inside</text>
        <text x="205" y="122" fill="#fbbf24" font-size="8.5" font-weight="700" text-anchor="middle" transform="rotate(-90 205 122)" font-family="Segoe UI, sans-serif">GUTTER 0.5"</text>
        <text x="125" y="220" fill="#94a3b8" font-size="9" text-anchor="middle" font-family="Segoe UI, sans-serif">Cyan: Trim 8.5" • Pink: Safe 0.375" • Bleed: 0.125"</text>

        <!-- Right Diagram: Cover Wrap RTL vs LTR -->
        <text x="515" y="18" fill="#f472b6" font-size="11" font-weight="700" text-anchor="middle" font-family="Segoe UI, sans-serif">KDP FULL COVER WRAP (FRONT + SPINE + BACK + BLEED)</text>

        <!-- RTL Arabic Cover Wrap -->
        <text x="515" y="36" fill="#67e8f9" font-size="9.5" font-weight="700" text-anchor="middle" font-family="Segoe UI, sans-serif">Arabic RTL Binding (Right-to-Left Book)</text>
        <rect x="285" y="42" width="460" height="72" rx="4" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
        <rect x="293" y="49" width="212" height="58" fill="#172554" stroke="#00d9ff" stroke-width="1.5"/>
        <rect x="505" y="49" width="20" height="58" fill="#4c1d95" stroke="#fbbf24" stroke-dasharray="3 2"/>
        <rect x="525" y="49" width="212" height="58" fill="#1e1b4b" stroke="#00d9ff" stroke-width="1.5"/>
        <text x="399" y="81" fill="#ffffff" font-size="10.5" font-weight="800" text-anchor="middle" font-family="Segoe UI, sans-serif">FRONT COVER (8.5")</text>
        <text x="515" y="81" fill="#fbbf24" font-size="7.5" font-weight="700" text-anchor="middle" transform="rotate(-90 515 81)" font-family="Segoe UI, sans-serif">SPINE</text>
        <text x="640" y="75" fill="#e2e8f0" font-size="10" font-weight="700" text-anchor="middle" font-family="Segoe UI, sans-serif">BACK COVER (8.5")</text>
        <rect x="536" y="82" width="46" height="20" rx="2" fill="#ffffff"/>
        <text x="559" y="95" fill="#0f172a" font-size="6.5" font-weight="700" text-anchor="middle" font-family="Segoe UI, sans-serif">BARCODE</text>

        <!-- LTR English Cover Wrap -->
        <text x="515" y="132" fill="#a78bfa" font-size="9.5" font-weight="700" text-anchor="middle" font-family="Segoe UI, sans-serif">English LTR Binding (Left-to-Right Book)</text>
        <rect x="285" y="138" width="460" height="72" rx="4" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
        <rect x="293" y="145" width="212" height="58" fill="#1e1b4b" stroke="#00d9ff" stroke-width="1.5"/>
        <rect x="505" y="145" width="20" height="58" fill="#4c1d95" stroke="#fbbf24" stroke-dasharray="3 2"/>
        <rect x="525" y="145" width="212" height="58" fill="#172554" stroke="#00d9ff" stroke-width="1.5"/>
        <text x="390" y="171" fill="#e2e8f0" font-size="10" font-weight="700" text-anchor="middle" font-family="Segoe UI, sans-serif">BACK COVER (8.5")</text>
        <rect x="448" y="178" width="46" height="20" rx="2" fill="#ffffff"/>
        <text x="471" y="191" fill="#0f172a" font-size="6.5" font-weight="700" text-anchor="middle" font-family="Segoe UI, sans-serif">BARCODE</text>
        <text x="515" y="177" fill="#fbbf24" font-size="7.5" font-weight="700" text-anchor="middle" transform="rotate(-90 515 177)" font-family="Segoe UI, sans-serif">SPINE</text>
        <text x="631" y="177" fill="#ffffff" font-size="10.5" font-weight="800" text-anchor="middle" font-family="Segoe UI, sans-serif">FRONT COVER (8.5")</text>
      </svg>
    </div>

    <h3>معادلة حساب سُمك الكعب (Spine Width) ومرجع الصفحات الشائع</h3>
    <p>
      <strong>المعادلة:</strong> <span class="ltr">Spine = Interior_Pages × Paper_Caliper</span>
      — ويكون العرض الكلي لغلاف KDP الورقي: <span class="ltr">Total_Width = 0.125 + 8.5 + Spine + 8.5 + 0.125</span> (بارتفاع <span class="ltr">8.75"</span>).
    </p>
    <table>
      <thead>
        <tr>
          <th>نوع الورق</th>
          <th>سُمك الصفحة الواحدة</th>
          <th>كتاب 24 صفحة (حد KDP)</th>
          <th>كتاب 32 صفحة</th>
          <th>كتاب 40 صفحة</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Amazon KDP Premium Color</td>
          <td class="ltr">0.002347"</td>
          <td class="ltr">0.056" (1.43 mm)</td>
          <td class="ltr">0.075" (1.91 mm)</td>
          <td class="ltr">0.094" (2.38 mm)</td>
        </tr>
        <tr>
          <td>مطبعة محلية — كوشيه مطفي 150 جم</td>
          <td class="ltr">0.002360"</td>
          <td class="ltr">0.057" (1.44 mm)</td>
          <td class="ltr">0.076" (1.92 mm)</td>
          <td class="ltr">0.094" (2.40 mm)</td>
        </tr>
        <tr>
          <td>مطبعة محلية — كوشيه ثقيل 170 جم</td>
          <td class="ltr">0.002760"</td>
          <td class="ltr">0.066" (1.68 mm)</td>
          <td class="ltr">0.088" (2.24 mm)</td>
          <td class="ltr">0.110" (2.80 mm)</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size: 8.5pt; color: #64748b;">
      * ملاحظة KDP: الطباعة على الكعب النصي متاحة فقط للكتب التي تبلغ 79 صفحة فأكثر (أو كعب ≥ 0.20" في الهاردكفر).
      للكتب المصورة (24–40 صفحة) يترك الكعب بلون متناسق بدون نص، ويقوم موديول <span class="ltr">/admin/pdf-builder</span> بحساب كل ذلك تلقائياً.
    </p>

    <div class="page-footer">
      <span>Bubbleverse First Real Story Playbook • KDP 8.5" × 8.5" Specs</span>
      <span class="ltr">Page 4 / 6</span>
    </div>
  </section>

  <!-- ===================================================================== -->
  <!-- PAGE 5: CHAPTER 4 — ADMIN PDF COMPOSER & WHATSAPP APPROVAL            -->
  <!-- ===================================================================== -->
  <section class="page">
    <div class="page-header">
      <span class="chapter-tag">المرحلة 04 • صانع PDF في لوحة الإدارة + اعتماد الواتساب</span>
      <span class="header-brand">/ADMIN/PDF-BUILDER WORKFLOW</span>
    </div>

    <h2>تجميع الكتاب تلقائياً داخل لوحة الإدارة (<span class="ltr">/admin/pdf-builder</span>)</h2>
    <p>
      بعد تجهيز رسوماتك (15–24 صورة مربعة)، لا تحتاج إلى Photoshop أو InDesign لرصّ الصفحات!
      افتح قسم <strong>"صانع كتب KDP (8.5×8.5)"</strong> من القائمة الجانبية في لوحة الإدارة واتبع الخطوات:
    </p>

    <div class="step-list">
      <div class="step-row">
        <div class="step-badge">1</div>
        <div class="step-body">
          <strong>استيراد بيانات الطلب أو مسودة الاستوديو بضغطة واحدة</strong>
          <span>اختر الطلب من القائمة المنسدلة بالأعلى: يتم تلقائياً سحب اسم الطفل، عنوان القصة، لغة واتجاه التجليد (RTL للعربي / LTR للإنجليزي)، رسالة الإهداء، وصورة الطفل من <span class="ltr">photoVault</span>.</span>
        </div>
      </div>
      <div class="step-row">
        <div class="step-badge">2</div>
        <div class="step-body">
          <strong>رفع كل الصور دفعة واحدة (Bulk Drag &amp; Drop) وإعادة الترتيب</strong>
          <span>اسحب مجلد الصور كاملاً وأفلته في منطقة الرفع. يرتّب النظام الملفات رقمياً (<span class="ltr">1, 2 … 20</span>)، ويمكنك اختيار "استبدال الصور مع إبقاء النص" إذا كنت قد كتبت النصوص مسبقاً في Story Studio.</span>
        </div>
      </div>
      <div class="step-row">
        <div class="step-badge">3</div>
        <div class="step-body">
          <strong>اختيار قالب الصفحات الداخلية (للكتاب كاملاً أو لكل صفحة على حدة)</strong>
          <span>بدّل بمرونة بين القوالب الثلاثة الاحترافية حسب تصميم رسوماتك:</span>
        </div>
      </div>
    </div>

    <div class="three-col" style="margin-bottom: 9px;">
      <div class="template-pill">
        <strong>1. لوحة كاملة + صندوق نص</strong>
        <p>صورة Full-Bleed مع بطاقة نص شفافة أنيقة أعلى أو أسفل الصفحة داخل منطقة الأمان <span class="ltr">0.375"</span>.</p>
      </div>
      <div class="template-pill">
        <strong>2. صفحتان متقابلتان (Split)</strong>
        <p>لوحة كاملة في صفحة + النص التحريري على ورق كريمي أو ليلي في الصفحة المقابلة (يضاعف الصفحات لـ 24–32 بسهولة).</p>
      </div>
      <div class="template-pill">
        <strong>3. لوحة صافية فقط</strong>
        <p>صورة edge-to-edge بدون أي نص مضاف — مثالي عندما يكون النص مرسوماً ومطبوعاً داخل الصورة مسبقاً.</p>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top: 0;">هيكل الكتاب التلقائي (Automated Book Anatomy — كل جزء قابل للتفعيل/الإيقاف)</h3>
      <div style="font-size: 8.7pt; color: #334155;">
        <strong>① الغلاف الأمامي:</strong> صورة الغلاف + اسم البطل + عنوان القصة داخل منطقة الأمان. &nbsp;|&nbsp;
        <strong>② صفحة الإهداء:</strong> صورة الطفل الدائرية + رسالة الوالدين. &nbsp;|&nbsp;
        <strong>③ صفحات القصة:</strong> بالترتيب المعتمد. &nbsp;|&nbsp;
        <strong>④ صفحة الختام:</strong> "النهاية السعيدة" + رسالة فخر بالبطل. &nbsp;|&nbsp;
        <strong>⑤ الغلاف الخلفي:</strong> نبذة القصة + شعار Bubbleverse + صندوق الباركود/QR الآمن (<span class="ltr">2.0"×1.2"</span>).
      </div>
    </div>

    <h3>بوابة اعتماد المسودة مع العميل على الواتساب (قبل دفع تكلفة الطباعة!)</h3>
    <p>
      اختر دقة <strong>150 DPI (مسودة سريعة للواتساب)</strong> واضغط <strong>"ملف واحد للمطبعة المحلية"</strong> لتنزيل بروفة خفيفة الحجم، ثم أرسلها للعميل بهذه الرسالة الجاهزة:
    </p>
    <div class="wa-template">
      «أهلاً أستاذة سارة ✨ مسودة قصة البطل <strong>زين</strong> جاهزة الآن للمراجعة قبل الطباعة! 📖🚀<br/>
      يرجى مراجعة: (1) كتابة الاسم والتشكيل، (2) نص الإهداء في الصفحة الأولى، (3) ملامح زين في الرسومات.<br/>
      لكِ جولة تعديل مجانية لأي ملاحظة بسيطة قبل إرسال الملف للمطبعة. بمجرد ردك بكلمة <strong>"معتمدة للطباعة"</strong> سنبدأ الطباعة والتغليف فوراً بمقاس 8.5×8.5 إنش! 💜»
    </div>

    <p style="margin-top: 7px; font-size: 8.7pt;">
      بعد موافقة العميلة، غيّر الدقة إلى <strong>300 DPI (طباعة احترافية)</strong> وتأكد أن خيار <strong>"تضمين خطوط القص في PDF"</strong> مُطفأ (OFF)، ثم صدّر:
      (أ) <strong>KDP Interior PDF + KDP Cover Wrap PDF</strong> للنشر على أمازون KDP، أو (ب) <strong>ملف واحد كامل للمطبعة المحلية</strong>.
    </p>

    <div class="page-footer">
      <span>Bubbleverse First Real Story Playbook • Admin PDF Composer &amp; Approval</span>
      <span class="ltr">Page 5 / 6</span>
    </div>
  </section>

  <!-- ===================================================================== -->
  <!-- PAGE 6: CHAPTER 5 — PRINT HANDOFF, QC, PACKAGING & DELIVERY           -->
  <!-- ===================================================================== -->
  <section class="page">
    <div class="page-header">
      <span class="chapter-tag">المرحلة 05 • الطباعة، فحص الجودة، التغليف والشحن</span>
      <span class="header-brand">PRINT SHOP WORK ORDER &amp; 8-POINT QC</span>
    </div>

    <h2>بطاقة أمر التشغيل للمطبعة المحلية (مصر / السعودية)</h2>
    <p>
      انسخ هذه المواصفات وأرسلها مباشرة إلى المطبعة الرقمية مع ملف <span class="ltr">300 DPI PDF</span> المُصدَّر من لوحة الإدارة لضمان جودة تضاهي دور النشر العالمية:
    </p>

    <table>
      <thead>
        <tr>
          <th>البند الفني</th>
          <th>المواصفة الموصى بها لـ Bubbleverse</th>
          <th>السبب التشغيلي</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>المقاس بعد القص</strong></td>
          <td class="ltr">8.5" × 8.5" (21.59 × 21.59 cm)</td>
          <td>مطابق لمقاس كتب الأطفال المربعة على Amazon KDP</td>
        </tr>
        <tr>
          <td><strong>الورق الداخلي</strong></td>
          <td>كوشيه مطفي / سلك (Matte/Silk Art) <strong>150–170 جم</strong></td>
          <td>ألوان مشبعة بدون لمعة مزعجة تحت إضاءة غرفة النوم</td>
        </tr>
        <tr>
          <td><strong>الغلاف الخارجي (هاردكفر)</strong></td>
          <td>كرتون رمادي <strong>2.5 مم</strong> + كوشيه 150 جم + سلوفان مطفي حراري</td>
          <td>ملمس فاخر متين يتحمل الاستخدام اليومي للأطفال</td>
        </tr>
        <tr>
          <td><strong>الغلاف الخارجي (سوفت كفر)</strong></td>
          <td>كوشيه <strong>300–350 جم</strong> + سلوفان مطفي (Matte Lamination)</td>
          <td>خيار اقتصادي أنيق سريع التنفيذ</td>
        </tr>
        <tr>
          <td><strong>التجليد (Binding)</strong></td>
          <td>غراء حراري مرن (PUR) أو خياطة + هاردكفر (ممنوع الدبوس للكتب الفاخرة)</td>
          <td>يفتح الكتاب بسلاسة دون تفكك الصفحات</td>
        </tr>
        <tr>
          <td><strong>إعدادات الطباعة</strong></td>
          <td>طباعة <span class="ltr">Actual Size 100%</span> (بدون Fit to Page) — ألوان CMYK / Indigo</td>
          <td>الحفاظ على دقة الهوامش ومنطقة الأمان <span class="ltr">0.375"</span></td>
        </tr>
      </tbody>
    </table>

    <h3>قائمة فحص الجودة قبل الشحن <span class="ltr-text">(8-Point Pre-Shipment QC)</span></h3>
    <ul class="checklist">
      <li>☐ <strong>1. تطابق الاسم والإهداء:</strong> مراجعة تهجئة اسم الطفل في الغلاف والصفحة الأولى.</li>
      <li>☐ <strong>2. نظافة القص (Trim):</strong> عدم وجود خطوط بيضاء على الحواف أو نص مقصوص.</li>
      <li>☐ <strong>3. ترتيب الصفحات واتجاه الفتح:</strong> العربي يُفتح من اليمين لليسار، والإنجليزي العكس.</li>
      <li>☐ <strong>4. جودة الألوان والتفاصيل:</strong> ألوان زاهية بدون بكسلة أو خطوط حبر (Banding).</li>
      <li>☐ <strong>5. متانة الكعب والغراء:</strong> فتح الكتاب 180 درجة بلطف للتأكد من ثبات التجليد.</li>
      <li>☐ <strong>6. نظافة الغلاف:</strong> لا توجد خدوش على السلوفان المطفي أو انبعاج في الزوايا.</li>
      <li>☐ <strong>7. التغليف الهدائي الآمن:</strong> ورق تغليف + كارت شكر باسم الطفل + غلاف فقاعات واقي للزوايا.</li>
      <li>☐ <strong>8. بوليصة الشحن وتحصيل المتبقي:</strong> تأكيد العنوان والهاتف ومبلغ الـ 50% المتبقي (COD/تحويل).</li>
    </ul>

    <div class="card-dark" style="margin-top: 10px;">
      <h3 style="color: #67e8f9; margin-top: 0;">إغلاق الطلب وبناء أول قصة نجاح (Post-Delivery Loop)</h3>
      <p style="font-size: 8.8pt; margin-bottom: 5px;">
        1. بمجرد تسليم المندوب للكتاب، حدّث حالة الطلب في <span class="ltr">/admin/orders</span> إلى <span class="ltr">delivered</span>.<br/>
        2. بعد 24 ساعة، أرسل رسالة لطيفة للأم تطلب رأيها في رد فعل الطفل عند رؤية نفسه بطلاً للكتاب (وصورة للكتاب بدون إظهار وجه الطفل إذا رغبت بالنشر في قسم التقييمات!).<br/>
        3. كل كتاب أول ناجح يُصنع بهذه الخطوات يتحول إلى دليل عملي قابل للتكرار لـ 100 طلب قادم بنفس الجودة والثبات.
      </p>
    </div>

    <div class="page-footer">
      <span>Bubbleverse Studio • Ready to Ship Your First 8.5" × 8.5" Storybook</span>
      <span class="ltr">Page 6 / 6</span>
    </div>
  </section>

</body>
</html>`;

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bv-playbook-'));
const tempHtmlPath = path.join(tempDir, 'playbook.html');

try {
  fs.mkdirSync(path.dirname(outputPdfPath), { recursive: true });
  fs.writeFileSync(tempHtmlPath, html, 'utf8');

  const browser = findBrowserBinary();
  const fileUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;

  execFileSync(
    browser,
    [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--allow-file-access-from-files',
      '--no-pdf-header-footer',
      `--print-to-pdf=${outputPdfPath}`,
      fileUrl,
    ],
    { stdio: 'pipe', timeout: 30000 }
  );

  const stat = fs.statSync(outputPdfPath);
  const head = fs.readFileSync(outputPdfPath).subarray(0, 8).toString('ascii');
  if (!head.startsWith('%PDF-')) {
    throw new Error(`Generated file does not have a valid PDF header: ${head}`);
  }

  // Keep a public copy in sync so /admin/pdf-builder can open/print the Playbook directly
  fs.mkdirSync(path.dirname(publicPdfPath), { recursive: true });
  fs.copyFileSync(outputPdfPath, publicPdfPath);

  console.log(
    `Generated ${path.relative(repoRoot, outputPdfPath)} & ${path.relative(repoRoot, publicPdfPath)} (${stat.size} bytes, header=${head.trim()})`
  );
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
