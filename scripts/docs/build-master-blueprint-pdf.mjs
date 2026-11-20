import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const outputPdfPath = path.join(repoRoot, 'docs', 'BUBBLEVERSE_MASTER_BLUEPRINT_2026.pdf');
const publicPdfPath = path.join(repoRoot, 'public', 'docs', 'BUBBLEVERSE_MASTER_BLUEPRINT_2026.pdf');

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
  const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
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
const imgDino = fileToBase64DataUri('public/catalog/dinosaur-valley.jpg');
const imgSpace = fileToBase64DataUri('public/bubble-books/space.webp');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Bubbleverse — Master Architecture Blueprint & System Constitution 2026</title>
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
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Arial', sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 8.8pt;
    }

    .page {
      width: 210mm;
      height: 297mm;
      padding: 12mm 14mm 10mm 14mm;
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
      padding: 16mm 16mm;
    }

    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      background: rgba(0, 217, 255, 0.15);
      border: 1px solid rgba(0, 217, 255, 0.35);
      border-radius: 9999px;
      color: #38bdf8;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .cover-title {
      font-size: 26pt;
      line-height: 1.15;
      font-weight: 900;
      margin: 14px 0 8px 0;
      background: linear-gradient(135deg, #ffffff 0%, #bae6fd 60%, #e0e7ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .cover-subtitle {
      font-size: 11.5pt;
      line-height: 1.4;
      color: #94a3b8;
      margin-bottom: 16px;
      max-width: 650px;
    }

    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .kpi-card-dark {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 10px 12px;
    }

    .kpi-val-dark {
      font-size: 15pt;
      font-weight: 800;
      color: #38bdf8;
      line-height: 1.2;
    }

    .kpi-lbl-dark {
      font-size: 7.5pt;
      color: #94a3b8;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }

    .header-title {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-meta {
      font-size: 7.5pt;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .footer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 8px;
      font-size: 7pt;
      color: #64748b;
    }

    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 8px;
    }

    .card-dark {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 10px 12px;
      color: #f1f5f9;
      margin-bottom: 8px;
    }

    .card-title {
      font-size: 9pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card-title-cyan {
      color: #0284c7;
    }

    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 9999px;
      font-size: 7pt;
      font-weight: 700;
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }

    .badge-purple {
      background: #f3e8ff;
      color: #7e22ce;
      border: 1px solid #e9d5ff;
    }

    .badge-emerald {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    .badge-amber {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.8pt;
      margin: 6px 0;
    }

    th {
      background: #0f172a;
      color: #ffffff;
      padding: 5px 8px;
      text-align: left;
      font-weight: 700;
      font-size: 7.2pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    .flow-box {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 7px 10px;
      text-align: center;
      font-weight: 700;
      font-size: 8pt;
      color: #1e293b;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .flow-box-cyan {
      background: #f0fdf4;
      border-color: #00d9ff;
      color: #0f172a;
    }

    .flow-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0284c7;
      font-weight: 800;
      font-size: 11pt;
    }

    .article-title {
      font-size: 9.5pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 3px;
      margin-top: 6px;
      margin-bottom: 4px;
    }

    .article-item {
      margin-bottom: 4px;
      font-size: 8pt;
      line-height: 1.35;
    }

    .article-item strong {
      color: #0369a1;
    }

    .seal-box {
      border: 2px dashed #0284c7;
      background: rgba(2, 132, 199, 0.04);
      border-radius: 12px;
      padding: 10px 14px;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- PAGE 1: EXECUTIVE COVER & TITLE -->
  <!-- ========================================================================= -->
  <div class="page cover-page">
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="cover-badge">★ OFFICIAL SYSTEM CONSTITUTION & ARCHITECTURE SPECIFICATION</span>
        <span style="font-size: 8.5pt; color: #94a3b8; font-weight: 700;">RELEASE 3.0 — 2026</span>
      </div>

      <div style="margin-top: 24px;">
        <div style="font-size: 13pt; color: #38bdf8; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
          BUBBLEVERSE™ TECHNOLOGY & PUBLISHING
        </div>
        <h1 class="cover-title">
          Master Architecture Blueprint<br/>& System Constitution
        </h1>
        <p class="cover-subtitle">
          The definitive technical, mathematical, and operational standard for personalized children's literature, Amazon KDP Hardcover 8.5"×8.5" manufacturing, Character DNA persistence, and Dark Cosmic Liquid Glass engineering.
        </p>
      </div>

      <!-- Core Spec Metric Pillars -->
      <div class="grid-4" style="margin-top: 18px;">
        <div class="kpi-card-dark">
          <div class="kpi-val-dark">8.5" × 8.5"</div>
          <div class="kpi-lbl-dark">Certified KDP Square Trim</div>
        </div>
        <div class="kpi-card-dark">
          <div class="kpi-val-dark">300 DPI</div>
          <div class="kpi-lbl-dark">Full-Bleed Print Preflight</div>
        </div>
        <div class="kpi-card-dark">
          <div class="kpi-val-dark">10 Themes</div>
          <div class="kpi-lbl-dark">Dynamic Outfit & Prop DNA</div>
        </div>
        <div class="kpi-card-dark">
          <div class="kpi-val-dark">10 Modules</div>
          <div class="kpi-lbl-dark">Admin Control Center</div>
        </div>
      </div>

      <!-- Flagship Physical Production Showcase Preview -->
      <div style="margin-top: 22px; background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 8.5pt; font-weight: 800; color: #bae6fd; text-transform: uppercase; letter-spacing: 0.5px;">
            Certified Physical Production Showcase: "Hero of the Lost Bubble Galaxy"
          </span>
          <span style="font-size: 7.5pt; color: #94a3b8;">Full 15-Page Hardcover Architecture</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
          <div style="border-radius: 8px; overflow: hidden; border: 1.5px solid rgba(0, 217, 255, 0.4); aspect-ratio: 1; background: #000;">
            ${imgCover ? `<img src="${imgCover}" style="width: 100%; height: 100%; object-fit: cover;" alt="Cover" />` : ''}
          </div>
          <div style="border-radius: 8px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.2); aspect-ratio: 1; background: #000;">
            ${imgScene01 ? `<img src="${imgScene01}" style="width: 100%; height: 100%; object-fit: cover;" alt="Scene 01" />` : ''}
          </div>
          <div style="border-radius: 8px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.2); aspect-ratio: 1; background: #000;">
            ${imgScene13 ? `<img src="${imgScene13}" style="width: 100%; height: 100%; object-fit: cover;" alt="Scene 13" />` : ''}
          </div>
          <div style="border-radius: 8px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.2); aspect-ratio: 1; background: #000;">
            ${imgBack ? `<img src="${imgBack}" style="width: 100%; height: 100%; object-fit: cover;" alt="Back" />` : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Cover Footer Authority Block -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(255, 255, 255, 0.12); padding-top: 12px;">
      <div>
        <div style="font-size: 8.5pt; font-weight: 800; color: #ffffff;">BUBBLEVERSE CORE ENGINEERING CHARTER</div>
        <div style="font-size: 7.5pt; color: #94a3b8;">Cairo • Riyadh • Dubai • Amazon KDP Ready • Strict Zero-Warning Build</div>
      </div>
      <div style="text-align: right; font-size: 7.5pt; color: #94a3b8;">
        <div>Document Ref: <strong>BV-ARCH-CONST-2026-V3</strong></div>
        <div>Confidential & Proprietary Enterprise Specification</div>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 2: CORE STORY ENGINE & PERSONALIZATION LOGIC -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="header-title">
          <span>01. Core Story Engine & Personalization Logic</span>
        </div>
        <div class="header-meta">Section 2 • Narrative & Likeness Architecture</div>
      </div>

      <!-- The 2 Operational Story Tracks -->
      <div class="card" style="background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%); border-color: #bae6fd;">
        <div class="card-title card-title-cyan">
          <span>The Two Operational Story Tracks: Pre-Scripted vs. Bespoke</span>
        </div>
        <p style="margin: 3px 0 6px 0; font-size: 8.2pt; color: #334155;">
          Bubbleverse scales personalization by deploying two synchronized manufacturing pipelines, ensuring brand safety, award-winning pedagogical values, and infinite creative freedom:
        </p>
        <div class="grid-2">
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="color: #0369a1; font-size: 8.5pt;">TRACK A: Pre-Scripted Catalog (Wonderbly Model)</strong>
              <span class="badge">Commercial Scale</span>
            </div>
            <ul style="margin: 0; padding-left: 14px; font-size: 7.8pt; color: #475569;">
              <li><strong>Narrative Spine:</strong> Pre-authored 3-act story arc vetted by child psychologists.</li>
              <li><strong>Personalization:</strong> Name, Gender, Age, Pronouns, Dedication, and Face Likeness.</li>
              <li><strong>Turnaround:</strong> Zero generation delay; instant storefront preview for parents.</li>
              <li><strong>Flagship Titles:</strong> <em>Hero of the Lost Bubble Galaxy</em>, <em>Dinosaur Guardian</em>.</li>
            </ul>
          </div>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="color: #7e22ce; font-size: 8.5pt;">TRACK B: Bespoke Wizard (Full Custom Story)</strong>
              <span class="badge badge-purple">100% Unique</span>
            </div>
            <ul style="margin: 0; padding-left: 14px; font-size: 7.8pt; color: #475569;">
              <li><strong>Manuscript:</strong> 100% unique script generated from parent's custom plot idea.</li>
              <li><strong>Interests:</strong> Dynamically weaves child's hobbies (dinosaurs, space, football, art).</li>
              <li><strong>Co-Heroes:</strong> Automatically incorporates siblings, pets, or family members.</li>
              <li><strong>Art Direction:</strong> Parent selects custom style (Pixar 3D, Anime, Watercolor).</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Character DNA Architecture -->
      <div class="card">
        <div class="card-title">
          <span>Character DNA & The 3-Pose Turnaround Sheet Architecture</span>
        </div>
        <p style="margin: 3px 0 6px 0; font-size: 8.2pt; color: #334155;">
          To guarantee zero visual drift across all 15–24 illustrations, the child's identity is codified into an immutable <code>CharacterDna</code> schema and anchored to a 3-pose Master Sheet:
        </p>
        <div class="grid-3" style="margin-top: 6px;">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; text-align: center;">
            <div style="font-weight: 800; color: #0284c7; font-size: 8.5pt;">POSE (1): Front Facing</div>
            <div style="font-size: 7.6pt; color: #64748b; margin-top: 2px;">Smiling directly at camera; anchors exact facial geometry, eye shape, and skin tone.</div>
          </div>
          <div style="background: #ffffff; border: 1.5px solid #00d9ff; border-radius: 8px; padding: 8px; text-align: center;">
            <div style="font-weight: 800; color: #00d9ff; font-size: 8.5pt;">POSE (2): 3/4 Dynamic View</div>
            <div style="font-size: 7.6pt; color: #0f172a; margin-top: 2px;">Thematic stance holding signature prop; anchors outfit silhouette and accessories.</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; text-align: center;">
            <div style="font-weight: 800; color: #0284c7; font-size: 8.5pt;">POSE (3): Excited Joy</div>
            <div style="font-size: 7.6pt; color: #64748b; margin-top: 2px;">Joyful emotional expression; anchors character expressiveness across dramatic climaxes.</div>
          </div>
        </div>
      </div>

      <!-- Zero-Repetition Manuscript Algorithm -->
      <div class="card">
        <div class="card-title">
          <span>Multi-Language Arc & Zero-Repetition Manuscript Engine</span>
        </div>
        <div style="font-size: 8.1pt; color: #334155; line-height: 1.4;">
          The engine features a deterministic beat matrix dividing each book into beginning, inciting incident, rising action, midpoint discovery, climax, and triumphant homecoming. In Arabic (<code>ar</code>) and English (<code>en</code>), sentences are checked against strict anti-repetition filters, ensuring every single page delivers fresh vocabulary tailored to the child's developmental age bracket.
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Bubbleverse™ Master Architecture Blueprint • Section 2: Narrative Engine</span>
      <span>Page 2 of 8</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 3: THE 10 DYNAMIC THEMES & STAGE 2 PROMPT FORMULA -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="header-title">
          <span>02. Dynamic Themes & 5-Block KDP Prompt Formula</span>
        </div>
        <div class="header-meta">Section 2.3 & 2.4 • Prompt Engineering Standards</div>
      </div>

      <!-- The 10 Dynamic Themes Matrix -->
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong style="font-size: 9.2pt; color: #0f172a;">The 10 Certified Story Themes & Persona Outfits:</strong>
          <span class="badge badge-emerald">Zero Hardcoded Bubbles • 100% Dynamic</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Theme Key</th>
              <th style="width: 18%;">Bilingual Title</th>
              <th style="width: 37%;">Signature Outfit (Boy / Girl)</th>
              <th style="width: 30%;">Signature Prop & Pose (2)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>dinosaurs</strong></td>
              <td>الديناصورات / Dinosaurs</td>
              <td>Safari paleontologist khaki vest, cargo shorts, trail boots</td>
              <td>Magnifying glass inspecting mini dino footprint</td>
            </tr>
            <tr>
              <td><strong>space</strong></td>
              <td>الفضاء / Cosmic Space</td>
              <td>Junior astronaut flight suit, mission patches, moon boots</td>
              <td>Glowing celestial star or brass telescope</td>
            </tr>
            <tr>
              <td><strong>ocean</strong></td>
              <td>أعماق البحار / Ocean</td>
              <td>Sea-teal marine windbreaker, nautical navy shorts</td>
              <td>Glowing iridescent ocean pearl or sea shell</td>
            </tr>
            <tr>
              <td><strong>fantasy</strong></td>
              <td>السحر والخيال / Fantasy</td>
              <td>Young apprentice magical tunic, starry midnight-blue cape</td>
              <td>Enchanted glowing crystal lantern or wand</td>
            </tr>
            <tr>
              <td><strong>superhero</strong></td>
              <td>الأبطال الخارقين / Hero</td>
              <td>Heroic hooded jacket with radiant star emblem, high-tops</td>
              <td>Confident heroic stance with hands on hips</td>
            </tr>
            <tr>
              <td><strong>animals</strong></td>
              <td>رعاية الحيوانات / Vet</td>
              <td>Mint-and-cream veterinary coat with paw-print pocket</td>
              <td>Woodland animal stethoscope or plush bunny</td>
            </tr>
            <tr>
              <td><strong>bedtime</strong></td>
              <td>ما قبل النوم / Bedtime</td>
              <td>Cozy starlight pajamas with embroidered cloud details</td>
              <td>Bedtime starlight plush or crescent moon</td>
            </tr>
            <tr>
              <td><strong>graduation</strong></td>
              <td>التخرج / Graduation</td>
              <td>Celebratory blazer, milestone badge, crisp white shirt</td>
              <td>Golden diploma certificate ribbon or cap</td>
            </tr>
            <tr>
              <td><strong>custom</strong></td>
              <td>قصة مخصصة / Custom</td>
              <td>Modern vibrant adventure jacket, clean white tee, sneakers</td>
              <td>Explorer stance with hands cheerfully on hips</td>
            </tr>
            <tr>
              <td><strong>bubble</strong></td>
              <td>مجرة الفقاعات / Bubbles</td>
              <td>Explorer jacket with luminous cyan piping & star patch</td>
              <td>Glowing floating starlight bubble</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- The 5-Block KDP Prompt Formula -->
      <div class="card-dark">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 800; color: #38bdf8; font-size: 9pt;">The Stage 2 5-Block KDP 8.5"×8.5" Prompt Formula</span>
          <span class="badge" style="background: rgba(0, 217, 255, 0.2); color: #bae6fd; border: 1px solid #38bdf8;">Production Standard</span>
        </div>
        <div style="font-family: monospace; font-size: 7.4pt; line-height: 1.4; color: #cbd5e1; background: rgba(0, 0, 0, 0.4); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.1);">
          <span style="color: #38bdf8;">[BLOCK 1: ART DIRECTION]</span> 3D Pixar Storybook, rich pastel lighting, expressive features. Storybook illustration for "Hero of the Lost Bubble Galaxy" — Page 03 of 15.<br/>
          <span style="color: #38bdf8;">[BLOCK 2: CHARACTER DNA]</span> Starring 5-year-old boy Adam (natural curly dark hair, warm eyes, joyful smile) wearing junior astronaut jumpsuit with mission patches. Faithful likeness to turnaround sheet.<br/>
          <span style="color: #38bdf8;">[BLOCK 3: ACTION & EMOTION]</span> Adam kneeling gently beside a crystal console, pressing a glowing beacon with an expression of pure awe.<br/>
          <span style="color: #38bdf8;">[BLOCK 4: ENVIRONMENT]</span> Cockpit of cozy starlight observatory spaceship, panoramic dome showing purple nebulae. Soft cinematic rim lighting.<br/>
          <span style="color: #f43f5e;">[BLOCK 5: KDP COMPOSITION & SAFEGUARD]</span> Keep child's face strictly in center 75% safe zone (away from 0.375" KDP 8.5"×8.5" trim edges). Leave softer darker space at bottom 25% for text card. No text, no letters, no watermark, no cropped head, no extra fingers. --ar 1:1
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Bubbleverse™ Master Architecture Blueprint • Section 2.4: Stage 2 Prompts</span>
      <span>Page 3 of 8</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 4: THE 10 ADMIN PANEL MODULES (PART 1: PRODUCTION) -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="header-title">
          <span>03. Admin Panel Modules: Production & Fulfillment</span>
        </div>
        <div class="header-meta">Section 3 • Modules 1–4 Breakdown</div>
      </div>

      <!-- Module 1: Story Production Studio -->
      <div class="card" style="border-left: 4px solid #0284c7;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="card-title">
            <span>Module 1: Story Production Studio (<code>/admin/studio</code>)</span>
          </div>
          <span class="badge">Primary Manufacturing Workstation</span>
        </div>
        <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
          The central manufacturing engine governing the guided 4-step pipeline: (1) Hero & Character DNA with PhotoVault dropzone, (2) Story Script & Manuscript Reviewer, (3) Scene Artwork with live 300 DPI prompt generators, and (4) 6-point checklist gate, WhatsApp draft approvals, and direct PDF handoff.
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 6px; font-size: 7.4pt; text-align: center;">
          <div style="background: #f1f5f9; padding: 4px; border-radius: 6px;"><strong>Step 1:</strong> DNA & Master Sheet</div>
          <div style="background: #f1f5f9; padding: 4px; border-radius: 6px;"><strong>Step 2:</strong> Manuscript Reviewer</div>
          <div style="background: #f1f5f9; padding: 4px; border-radius: 6px;"><strong>Step 3:</strong> 300 DPI Prompts</div>
          <div style="background: #f1f5f9; padding: 4px; border-radius: 6px;"><strong>Step 4:</strong> WhatsApp Proof & KDP</div>
        </div>
      </div>

      <!-- Module 2: Orders & Customer Vault -->
      <div class="card" style="border-left: 4px solid #7e22ce;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="card-title">
            <span>Module 2: Orders & Customer Vault (<code>/admin/orders</code>)</span>
          </div>
          <span class="badge badge-purple">Commerce & Fulfillment Hub</span>
        </div>
        <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
          Governs customer order records, status transitions (<code>pending_deposit</code> → <code>deposit_confirmed</code> → <code>in_preparation</code> → <code>draft_ready</code> → <code>sent_to_print</code> → <code>delivered</code>), WhatsApp quick-actions, add-on tracking (Coloring Book, Gift Box, Stickers, Audio Story, Co-Hero), and direct photo upload slots for parents who sent images via WhatsApp.
        </div>
      </div>

      <!-- Module 3: Story Catalog & Regional Pricing -->
      <div class="card" style="border-left: 4px solid #10b981;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="card-title">
            <span>Module 3: Story Catalog & Regional Pricing (<code>/admin/catalog</code>)</span>
          </div>
          <span class="badge badge-emerald">Catalog & Multi-Currency Engine</span>
        </div>
        <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
          Configures title metadata, age tiers (2–4, 4–7, 6–9+), pedagogical values, and independent pricing across Egypt (EGP), Saudi Arabia (SAR), and UAE (AED). Enforces automated volume tiers (1 book: 0%, 2 books: 15%, 3+ books: 25%) and deposit percentage floors.
        </div>
      </div>

      <!-- Module 4: Amazon KDP 8.5"x8.5" PDF Builder -->
      <div class="card" style="border-left: 4px solid #f59e0b;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="card-title">
            <span>Module 4: Amazon KDP 8.5"×8.5" Hardcover PDF Builder (<code>/admin/pdf-builder</code>)</span>
          </div>
          <span class="badge badge-amber">Industrial Printing Preflight</span>
        </div>
        <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
          Industrial preflight engine computing exact physical geometry: 8.5"×8.5" trim (612 pt), 0.125" bleed (621×630 pt canvas), spine wrap formula ($W = \text{pages} \times 0.002252" + 0.06"$), RTL binding for Arabic (right-hand recto gutters) and LTR for English, and binary PDF 1.4 xref table generation.
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Bubbleverse™ Master Architecture Blueprint • Section 3: Admin Modules 1–4</span>
      <span>Page 4 of 8</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 5: THE 10 ADMIN PANEL MODULES (PART 2: COMMERCE & SCALE) -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="header-title">
          <span>04. Admin Panel Modules: Commerce, Scale & AI Hub</span>
        </div>
        <div class="header-meta">Section 3 • Modules 5–10 Breakdown</div>
      </div>

      <!-- Modules 5 & 6 -->
      <div class="grid-2">
        <div class="card" style="border-left: 3px solid #0284c7; margin-bottom: 0;">
          <div class="card-title" style="font-size: 8.5pt;">Module 5: Merch & GWP Engine (<code>/admin/merch</code>)</div>
          <div style="font-size: 7.8pt; color: #475569;">
            Controls 6 flagship physical products (Bub Plush, Night Lamp, Gift Box, Backpack) and automated Gift-with-Purchase (GWP) rewards across 3 trigger modes (Cart Threshold, Book Bundle, Promo Code) with strict anti-infinite-loop guards.
          </div>
        </div>
        <div class="card" style="border-left: 3px solid #7e22ce; margin-bottom: 0;">
          <div class="card-title" style="font-size: 8.5pt;">Module 6: 3D Bookshelf (<code>/admin/showcase</code>)</div>
          <div style="font-size: 7.8pt; color: #475569;">
            Configures interactive 3D CSS transform book covers, realistic page edge thickness, rotation perspective depth, gold foil shaders, hero ribbons, and real-time social proof tickers on the storefront homepage.
          </div>
        </div>
      </div>

      <!-- Modules 7 & 8 -->
      <div class="grid-2" style="margin-top: 8px;">
        <div class="card" style="border-left: 3px solid #10b981; margin-bottom: 0;">
          <div class="card-title" style="font-size: 8.5pt;">Module 7: Growth & Retention CRM (<code>/admin/growth</code>)</div>
          <div style="font-size: 7.8pt; color: #475569;">
            Maximizes customer lifetime value (LTV) through automated Birthday Club reminder schedules (21 days prior), nursery/school bulk lead tracking, and instant bilingual WhatsApp seasonal campaign broadcasts.
          </div>
        </div>
        <div class="card" style="border-left: 3px solid #f59e0b; margin-bottom: 0;">
          <div class="card-title" style="font-size: 8.5pt;">Module 8: API Integrations Hub (<code>/admin/integrations</code>)</div>
          <div style="font-size: 7.8pt; color: #475569;">
            Central management of AI generation credentials (Gemini, OpenAI, Nano Banana, Custom endpoint), payment gateways (Paymob, Tap, Stripe), and express logistics couriers (Bosta, SMSA, Aramex).
          </div>
        </div>
      </div>

      <!-- Modules 9 & 10 -->
      <div class="grid-2" style="margin-top: 8px;">
        <div class="card" style="border-left: 3px solid #6366f1; margin-bottom: 0;">
          <div class="card-title" style="font-size: 8.5pt;">Module 9: Executive Analytics (<code>/admin/overview</code>)</div>
          <div style="font-size: 7.8pt; color: #475569;">
            Real-time business intelligence: Gross revenue (normalized EGP/SAR/AED), deposit collection ratios, average order value (AOV), fulfillment velocity (hours to print), and add-on attachment rates.
          </div>
        </div>
        <div class="card" style="border-left: 3px solid #ec4899; margin-bottom: 0;">
          <div class="card-title" style="font-size: 8.5pt;">Module 10: B2B & Schools Portal (<code>/admin/b2b</code>)</div>
          <div style="font-size: 7.8pt; color: #475569;">
            Institutional portal for international nurseries and private schools ordering graduation yearbooks in bulk. Features volume tier discounts (up to 40% off), custom crests, and corporate quotation generators.
          </div>
        </div>
      </div>

      <!-- Merch Assets & Physical Quality Preview -->
      <div style="margin-top: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-size: 8.5pt; color: #0f172a;">Flagship Merch Catalog & Keepsake Add-on Ecosystem:</strong>
          <span class="badge">B2C Upsell & Gift-Ready Bundles</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center;">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px;">
            <div style="width: 100%; aspect-ratio: 1; border-radius: 6px; overflow: hidden; margin-bottom: 4px;">
              ${imgBubPlush ? `<img src="${imgBubPlush}" style="width: 100%; height: 100%; object-fit: cover;" alt="Plush" />` : ''}
            </div>
            <strong style="font-size: 7.4pt; color: #0f172a;">Bub Stuffed Plush Ball</strong>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px;">
            <div style="width: 100%; aspect-ratio: 1; border-radius: 6px; overflow: hidden; margin-bottom: 4px;">
              ${imgNightLamp ? `<img src="${imgNightLamp}" style="width: 100%; height: 100%; object-fit: cover;" alt="Lamp" />` : ''}
            </div>
            <strong style="font-size: 7.4pt; color: #0f172a;">Luminous Night Lamp</strong>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px;">
            <div style="width: 100%; aspect-ratio: 1; border-radius: 6px; overflow: hidden; margin-bottom: 4px;">
              ${imgGiftBox ? `<img src="${imgGiftBox}" style="width: 100%; height: 100%; object-fit: cover;" alt="Box" />` : ''}
            </div>
            <strong style="font-size: 7.4pt; color: #0f172a;">Luxury Keepsake Box</strong>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px;">
            <div style="width: 100%; aspect-ratio: 1; border-radius: 6px; overflow: hidden; margin-bottom: 4px;">
              ${imgBackpack ? `<img src="${imgBackpack}" style="width: 100%; height: 100%; object-fit: cover;" alt="Backpack" />` : ''}
            </div>
            <strong style="font-size: 7.4pt; color: #0f172a;">Hero Kid Backpack</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Bubbleverse™ Master Architecture Blueprint • Section 3: Admin Modules 5–10</span>
      <span>Page 5 of 8</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 6: COMPLETE SYSTEM TOPOLOGY & FLOWCHARTS -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="header-title">
          <span>05. System Topologies & Multi-Level Flowcharts</span>
        </div>
        <div class="header-meta">Section 4 • End-to-End Architecture Maps</div>
      </div>

      <!-- Flowchart 1: Customer Journey -->
      <div class="card" style="padding: 8px 10px; margin-bottom: 6px;">
        <div style="font-weight: 800; color: #0369a1; font-size: 8pt; margin-bottom: 4px;">
          FLOWCHART 1: End-to-End Customer Storefront & Checkout Journey
        </div>
        <div style="display: flex; gap: 4px; align-items: center; justify-content: space-between;">
          <div class="flow-box" style="flex: 1;">1. Storefront<br/><span style="font-size: 6.5pt; font-weight: normal; color: #64748b;">3D Showcase / Stories</span></div>
          <div class="flow-arrow">→</div>
          <div class="flow-box" style="flex: 1.2;">2. Personalization<br/><span style="font-size: 6.5pt; font-weight: normal; color: #64748b;">Name, Age, Likeness Photo</span></div>
          <div class="flow-arrow">→</div>
          <div class="flow-box" style="flex: 1;">3. Cart & GWP<br/><span style="font-size: 6.5pt; font-weight: normal; color: #64748b;">Auto Free Gift Logic</span></div>
          <div class="flow-arrow">→</div>
          <div class="flow-box" style="flex: 1.1;">4. Guest Checkout<br/><span style="font-size: 6.5pt; font-weight: normal; color: #64748b;">Deposit (EGP/SAR/AED)</span></div>
          <div class="flow-arrow">→</div>
          <div class="flow-box flow-box-cyan" style="flex: 1;">5. WhatsApp & Track<br/><span style="font-size: 6.5pt; font-weight: normal; color: #64748b;">Live /track?ref=...</span></div>
        </div>
      </div>

      <!-- Flowchart 2: Production Studio Pipeline -->
      <div class="card" style="padding: 8px 10px; margin-bottom: 6px;">
        <div style="font-weight: 800; color: #7e22ce; font-size: 8pt; margin-bottom: 4px;">
          FLOWCHART 2: 4-Step Story Studio Production & WhatsApp Proofing Pipeline
        </div>
        <div style="display: flex; gap: 4px; align-items: center; justify-content: space-between;">
          <div class="flow-box" style="flex: 1.1;">Step 1: Hero DNA<br/><span style="font-size: 6.5pt; font-weight: normal; color: #64748b;">Photo Vault & 3-Pose Sheet</span></div>
          <div class="flow-arrow">→</div>
          <div class="flow-box" style="flex: 1.1;">Step 2: Manuscript<br/><span style="font-size: 6.5pt; font-weight: normal; color: #64748b;">15-24 Beats Arc Review</span></div>
          <div class="flow-arrow">→</div>
          <div class="flow-box" style="flex: 1.1;">Step 3: Artwork Studio<br/><span style="font-size: 6.5pt; font-weight: normal; color: #64748b;">300 DPI Prompts & Upload</span></div>
          <div class="flow-arrow">→</div>
          <div class="flow-box" style="flex: 1.1;">Step 4: Quality Gate<br/><span style="font-size: 6.5pt; font-weight: normal; color: #64748b;">6-Point Checklist Check</span></div>
          <div class="flow-arrow">→</div>
          <div class="flow-box flow-box-cyan" style="flex: 1.1;">Parent WhatsApp<br/><span style="font-size: 6.5pt; font-weight: normal; color: #64748b;">Approval -> KDP PDF</span></div>
        </div>
      </div>

      <!-- Flowchart 3: Data Topology -->
      <div class="card" style="padding: 8px 10px; margin-bottom: 6px;">
        <div style="font-weight: 800; color: #0f172a; font-size: 8pt; margin-bottom: 4px;">
          FLOWCHART 3: Privacy Vault, Client LocalStore & External API Infrastructure
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px;">
            <strong style="color: #0369a1; font-size: 7.5pt;">Client Frontend (Vite/React)</strong>
            <div style="font-size: 7pt; color: #64748b; margin-top: 2px;">
              • Dark Cosmic UI / LiquidSelect<br/>
              • LocalStorage Orders & Config<br/>
              • Client Binary PDF 1.4 Engine
            </div>
          </div>
          <div style="background: #ffffff; border: 1.5px solid #00d9ff; border-radius: 6px; padding: 6px;">
            <strong style="color: #00d9ff; font-size: 7.5pt;">Private Storage & Security Vault</strong>
            <div style="font-size: 7pt; color: #64748b; margin-top: 2px;">
              • IndexedDB PhotoVault (Zero base64 in state)<br/>
              • Supabase Private S3 Photo Bucket<br/>
              • Supabase RLS Row-Level Security
            </div>
          </div>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px;">
            <strong style="color: #7e22ce; font-size: 7.5pt;">External Services & Couriers</strong>
            <div style="font-size: 7pt; color: #64748b; margin-top: 2px;">
              • Gemini / OpenAI API Gateway<br/>
              • Paymob, Tap & Stripe Gateways<br/>
              • Bosta & SMSA Express APIs
            </div>
          </div>
        </div>
      </div>

      <!-- Flowchart 4: Grand Unified Architecture -->
      <div class="card-dark" style="padding: 8px 10px; margin-bottom: 0;">
        <div style="font-weight: 800; color: #38bdf8; font-size: 8pt; margin-bottom: 4px;">
          FLOWCHART 4: Grand Unified Manufacturing & Industrial Print Topology
        </div>
        <div style="font-size: 7.2pt; color: #cbd5e1; line-height: 1.35;">
          Storefront Order Intake → Encrypted PhotoVault (Zero Child Photos in Public State) → Story Production Studio (DNA Lock + Dynamic Theme Auto-Adaptation + Stage 2 5-Block Prompt Engineering) → 300 DPI Preflight Check → WhatsApp Parent Proofing → Amazon KDP 8.5"×8.5" Hardcover PDF Compiler (Exact Bleed + Spine Formula + Recto/Verso Gutters) → Industrial Offset Print & Bind → Courier Delivery Tracking across Egypt, Saudi Arabia, and UAE.
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Bubbleverse™ Master Architecture Blueprint • Section 4: Flowcharts</span>
      <span>Page 6 of 8</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 7: THE OFFICIAL CONSTITUTION (ARTICLES I - V) -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="header-title">
          <span>06. The Bubbleverse System Constitution (Articles I–V)</span>
        </div>
        <div class="header-meta">Section 5 • Mandatory Engineering Law</div>
      </div>

      <div style="background: rgba(2, 132, 199, 0.05); border: 1px solid #0284c7; border-radius: 8px; padding: 6px 10px; margin-bottom: 8px;">
        <strong style="font-size: 8pt; color: #0284c7;">PREAMBLE & SUPREMACY CLAUSE:</strong>
        <span style="font-size: 7.4pt; color: #334155;">
          This Constitution is the permanent engineering and operational law of Bubbleverse™. All developers, software engineers, and autonomous coding agents (Cursor, Claude Code, Copilot, Codex, Gemini, Antigravity) must strictly obey these Articles without deviation.
        </span>
      </div>

      <!-- Article I -->
      <div class="article-title">ARTICLE I: PRODUCT IDENTITY & BOUNDARIES</div>
      <div class="article-item">
        <strong>Section 1.1 (Core Mission):</strong> Bubbleverse is strictly an illustrated personalized hardcover children's storybook and keepsake company. All features must directly elevate child confidence, literacy, and family emotional connection.<br/>
        <strong>Section 1.2 (B2B Governance):</strong> B2B nursery and school portals are extensions of the core story engine; never fork or create separate disconnected architectures.<br/>
        <strong>Section 1.3 (Framework Bloat Prohibited):</strong> Never install external UI libraries or server frameworks merely because a generic tutorial recommends them.
      </div>

      <!-- Article II -->
      <div class="article-title">ARTICLE II: TECH STACK SOVEREIGNTY & ARCHITECTURAL GOVERNANCE</div>
      <div class="article-item">
        <strong>Section 2.1 (Immutable Core Stack):</strong> The client stack is strictly React 18/19, TypeScript, Vite, Tailwind CSS, Radix UI, and Lucide icons.<br/>
        <strong>Section 2.2 (Backend Boundaries):</strong> Supabase (PostgreSQL, RLS, Edge Functions) powers cloud persistence. All critical operations MUST retain standalone offline fallback (<code>localStore.ts</code> & <code>photoVault.ts</code>).<br/>
        <strong>Section 2.3 (Worktree Discipline):</strong> Work strictly inside the primary repository checkout. Never create Git worktrees or discard untracked assets as setup shortcuts.
      </div>

      <!-- Article III -->
      <div class="article-title">ARTICLE III: CHILD PHOTO PRIVACY & ZERO-LEAK VAULT PROTOCOL</div>
      <div class="article-item">
        <strong>Section 3.1 (Git Commit Immunity):</strong> Never commit child reference photos, parent names, or personal identities into Git commits or public PRs.<br/>
        <strong>Section 3.2 (Storage Isolation):</strong> Child photos must NEVER be placed in public Vite configs, static <code>/dist</code> folders, or unencrypted localStorage strings.<br/>
        <strong>Section 3.3 (PhotoVault Isolation):</strong> All child photos reside exclusively in client IndexedDB <code>photoVault</code> or private Supabase storage. Orders store ONLY string vault keys (<code>photoVaultId</code>).
      </div>

      <!-- Article IV -->
      <div class="article-title">ARTICLE IV: AMAZON KDP HARDCOVER MATHEMATICAL STANDARD</div>
      <div class="article-item">
        <strong>Section 4.1 (Physical Trim):</strong> All picture books must adhere strictly to 8.5" × 8.5" (215.9 mm × 215.9 mm = 612 pt × 612 pt).<br/>
        <strong>Section 4.2 (Bleed Requirement):</strong> 0.125" (9 pt) bleed on top, bottom, and outside edges (Canvas: 8.625" × 8.75" = 621 pt × 630 pt).<br/>
        <strong>Section 4.3 (Resolution Floor):</strong> Strict 300 DPI preflight (Minimum 2588 px × 2625 px). Reject low-res images with upscale notices.<br/>
        <strong>Section 4.4 (Binding Direction Parity):</strong> Arabic books use RTL binding (right-hand recto gutters); English uses LTR. Zero 210×210 mm European A4 leftovers.
      </div>

      <!-- Article V -->
      <div class="article-title">ARTICLE V: STAGE 2 AI PROMPT CONTRACT & CHARACTER DNA LOCKING</div>
      <div class="article-item">
        <strong>Section 5.1 (5-Block Structure):</strong> Every prompt must follow Block 1 (Art Direction), Block 2 (DNA Lock), Block 3 (Action), Block 4 (Environment), and Block 5 (Safe Zone & Negative Guards).<br/>
        <strong>Section 5.2 (Safe Zone Directive):</strong> Characters' faces must stay within the center 75% safe zone, leaving the bottom 25% clear for storybook text cards.<br/>
        <strong>Section 5.3 (Dynamic Theme Law):</strong> Outfits and props must dynamically adapt to the 10 certified themes. Hardcoding generic bubble outfits is an explicit violation.
      </div>
    </div>

    <div class="footer-bar">
      <span>Bubbleverse™ Master Architecture Blueprint • Constitution (Articles I–V)</span>
      <span>Page 7 of 8</span>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 8: THE OFFICIAL CONSTITUTION (ARTICLES VI - X) & SEAL -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="header-title">
          <span>07. The Bubbleverse System Constitution (Articles VI–X) & Seal</span>
        </div>
        <div class="header-meta">Section 5 • Mandatory Operational Law</div>
      </div>

      <!-- Article VI -->
      <div class="article-title">ARTICLE VI: MULTI-CURRENCY PRICING & COMMERCE INTEGRITY</div>
      <div class="article-item">
        <strong>Section 6.1 (ISO Currencies):</strong> The system supports three official currencies: Egyptian Pound (<code>EGP</code>), Saudi Riyal (<code>SAR</code>), and UAE Dirham (<code>AED</code>).<br/>
        <strong>Section 6.2 (Gulf Parity Derivation):</strong> AED derives from SAR at exact 1:1 parity without artificial rounding distortion.<br/>
        <strong>Section 6.3 (GWP Protection):</strong> Free Gift-with-Purchase items strictly have price set to 0 and are excluded from GWP threshold evaluation (zero infinite loops).
      </div>

      <!-- Article VII -->
      <div class="article-title">ARTICLE VII: LIQUID GLASS UI & DESIGN SYSTEM STANDARDS</div>
      <div class="article-item">
        <strong>Section 7.1 (Visual Identity):</strong> All surfaces must preserve Dark Cosmic Liquid Glass (<code>bg-slate-950/85</code>, <code>backdrop-blur-2xl</code>, cyan borders, <code>rounded-2xl</code>).<br/>
        <strong>Section 7.2 (No Windows 98 Controls):</strong> Raw unstyled OS controls (especially square gray select popovers) are outlawed. All dropdowns must use <code>LiquidSelect</code> with centered text alignment.<br/>
        <strong>Section 7.3 (Bilingual Typography):</strong> Full parity between Fredoka (Latin) and Cairo (Arabic) with mirrored RTL/LTR flex layouts.
      </div>

      <!-- Article VIII -->
      <div class="article-title">ARTICLE VIII: QUALITY ASSURANCE, VERIFICATION & ZERO-WARNING LAW</div>
      <div class="article-item">
        <strong>Section 8.1 (Zero-Warning Linting):</strong> <code>npm run check</code> must pass with 0 ESLint warnings and 0 TypeScript errors (<code>--max-warnings 0</code>).<br/>
        <strong>Section 8.2 (Test Inviolability):</strong> All 71+ unit tests (Commerce, Studio, PDF, GWP, Security, Architecture, Skills) must pass 100% prior to any release commit.<br/>
        <strong>Section 8.3 (Assertion Integrity):</strong> Never disable unit test assertions or modify test checksums merely to make checks pass artificially.
      </div>

      <!-- Article IX -->
      <div class="article-title">ARTICLE IX: OPERATIONAL POLICIES, MARGIN FLOORS & MANUFACTURING SOPS</div>
      <div class="article-item">
        <strong>Section 9.1 (Margin Protection):</strong> Retail book pricing must maintain minimum 65% gross margin over raw print and bind costs across all countries.<br/>
        <strong>Section 9.2 (Deposit Requirement):</strong> Custom orders require non-refundable deposit (20–50%) prior to high-res GPU generation.<br/>
        <strong>Section 9.3 (Checklist Verification):</strong> No book may be exported to print until all 6 Studio Checklist gates are verified.
      </div>

      <!-- Article X -->
      <div class="article-title">ARTICLE X: WHATSAPP PROOFING & CUSTOMER SATISFACTION GUARANTEE</div>
      <div class="article-item">
        <strong>Section 10.1 (Pre-Print Parent Approval):</strong> Every personalized storybook must be proofed by the parent via WhatsApp digital draft before printing.<br/>
        <strong>Section 10.2 (Reprint Protection):</strong> If a print defect occurs due to manufacturing error, a priority replacement copy must be dispatched within 48 hours at zero customer expense.
      </div>

      <!-- Official Engineering Seal -->
      <div class="seal-box" style="margin-top: 10px;">
        <div style="font-size: 8.5pt; font-weight: 800; color: #0284c7; letter-spacing: 0.5px; text-transform: uppercase;">
          ★ RATIFIED BY BUBBLEVERSE CORE ENGINEERING & SWARM ARCHITECTURE ★
        </div>
        <div style="font-size: 7.2pt; color: #64748b; margin-top: 3px;">
          Certified for Production • Amazon KDP 8.5"×8.5" Compliant • Zero-Warning Standard • Liquid Glass System Active
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <span>Bubbleverse™ Master Architecture Blueprint • Constitution (Articles VI–X) & Seal</span>
      <span>Page 8 of 8</span>
    </div>
  </div>

</body>
</html>`;

async function main() {
  console.log('Rendering Bubbleverse Master Architecture Blueprint & Constitution PDF (8 Pages)...');

  const browserBin = findBrowserBinary();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bv-master-blueprint-'));
  const tempHtmlPath = path.join(tempDir, 'master-blueprint.html');
  const tempPdfPath = path.join(tempDir, 'master-blueprint.pdf');

  fs.writeFileSync(tempHtmlPath, html, 'utf-8');

  execFileSync(browserBin, [
    '--headless',
    '--disable-gpu',
    '--run-all-compositor-stages-before-draw',
    '--no-pdf-header-footer',
    '--print-to-pdf-no-header',
    `--print-to-pdf=${tempPdfPath}`,
    tempHtmlPath,
  ]);

  if (!fs.existsSync(tempPdfPath)) {
    throw new Error('PDF output was not created by browser.');
  }

  // Ensure output directories exist
  fs.mkdirSync(path.dirname(outputPdfPath), { recursive: true });
  fs.mkdirSync(path.dirname(publicPdfPath), { recursive: true });

  fs.copyFileSync(tempPdfPath, outputPdfPath);
  fs.copyFileSync(tempPdfPath, publicPdfPath);

  const stats = fs.statSync(outputPdfPath);
  console.log(`Success! Rendered Master Blueprint PDF: ${outputPdfPath} (${(stats.size / 1024).toFixed(1)} kB)`);
  console.log(`Public Copy: ${publicPdfPath}`);

  // Cleanup
  fs.rmSync(tempDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error('Failed to generate Master Blueprint PDF:', err);
  process.exit(1);
});
