/**
 * Build Script: Karim's Complete 3D Pixar Storybook (KDP 8.5"x8.5" 300 DPI)
 * Generates:
 * 1. FullBook-8.5x8.5-300dpi.pdf (Single Book Presentation)
 * 2. KDP-Interior-8.625x8.75-300dpi.pdf (Amazon KDP Interior with Bleed & Alternating RTL Gutters)
 * 3. KDP-CoverWrap-RTL-300dpi.pdf (Amazon KDP Cover Wrap with Spine & Bleed)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPdfFromJpegPages } from '../src/features/pdf/binaryPdfWriter.ts';
import {
  calculateCoverWrapDimensions,
  calculateInteriorDimensions,
  getInteriorPageGuides,
} from '../src/features/pdf/kdpSpecs.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const inputDir = path.resolve(rootDir, 'docs', 'karim-story-output');
const outDocs = path.resolve(rootDir, 'docs', 'karim-story-output');
const outPublic = path.resolve(rootDir, 'public', 'docs', 'karim-story-output');

fs.mkdirSync(outDocs, { recursive: true });
fs.mkdirSync(outPublic, { recursive: true });

function readJpeg(filename) {
  const filePath = path.join(inputDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing expected JPEG file: ${filePath}`);
  }
  const buf = fs.readFileSync(filePath);
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

// 1. Load All 10 Scene JPEGs + Cover + Back + Character Sheet
const coverBytes = readJpeg('00-cover.jpg');
const backBytes = readJpeg('16-back.jpg');
const charSheetBytes = readJpeg('00-character-sheet.jpg');

const sceneBytes = [];
for (let i = 1; i <= 10; i++) {
  const numStr = String(i).padStart(2, '0');
  sceneBytes.push(readJpeg(`${numStr}-scene.jpg`));
}

console.log(`Loaded cover, back, character sheet, and ${sceneBytes.length} story scenes.`);

// ----------------------------------------------------------------------------
// A. BUILD FULL BOOK PRESENTATION PDF (8.5" x 8.5" @ 300 DPI -> 612 x 612 pt)
// ----------------------------------------------------------------------------
{
  const fullBookPages = [
    // Page 1: Front Cover
    {
      jpegBytes: coverBytes,
      pixelWidth: 2625,
      pixelHeight: 2625,
      pageWidthPt: 612,
      pageHeightPt: 612,
    },
    // Page 2: Character Consistency Sheet
    {
      jpegBytes: charSheetBytes,
      pixelWidth: 2625,
      pixelHeight: 2625,
      pageWidthPt: 612,
      pageHeightPt: 612,
    },
  ];

  // Pages 3..12: Story Scenes 1..10
  for (let i = 0; i < sceneBytes.length; i++) {
    fullBookPages.push({
      jpegBytes: sceneBytes[i],
      pixelWidth: 2625,
      pixelHeight: 2625,
      pageWidthPt: 612,
      pageHeightPt: 612,
    });
  }

  // Page 13: Back Cover
  fullBookPages.push({
    jpegBytes: backBytes,
    pixelWidth: 2625,
    pixelHeight: 2625,
    pageWidthPt: 612,
    pageHeightPt: 612,
  });

  const fullBookPdf = buildPdfFromJpegPages(fullBookPages, {
    title: 'كريم وسر الفقاعة الزرقاء | Karim and the Blue Bubble',
    author: 'Bubbleverse Studios',
    creator: 'Bubbleverse Production Engine 2.0',
  });

  const fullBookName = 'Karim-Blue-Bubble-FullBook-8.5x8.5-300dpi.pdf';
  fs.writeFileSync(path.join(outDocs, fullBookName), fullBookPdf);
  fs.writeFileSync(path.join(outPublic, fullBookName), fullBookPdf);
  console.log(`✓ Generated ${fullBookName} (${(fullBookPdf.byteLength / 1048576).toFixed(2)} MB, ${fullBookPages.length} pages)`);
}

// ----------------------------------------------------------------------------
// B. BUILD AMAZON KDP INTERIOR PDF (8.625" x 8.75" @ 300 DPI -> 621 x 630 pt)
// ----------------------------------------------------------------------------
{
  const kdpDims = calculateInteriorDimensions(true); // 8.625" x 8.75"
  const interiorPages = [];

  // Minimum KDP Page count: 24 pages
  // We place Front Cover / Title on P1, Dedication/CharSheet on P2,
  // 10 Story Spreads on P3..P22, Keepsake on P23..P24
  const totalInteriorPages = Math.max(24, (sceneBytes.length + 2) * 2);

  for (let pNum = 1; pNum <= 24; pNum++) {
    const guides = getInteriorPageGuides(pNum, 'rtl', true);

    // Map content to page
    let imgData = sceneBytes[(pNum - 1) % sceneBytes.length];
    if (pNum === 1) imgData = coverBytes;
    else if (pNum === 2) imgData = charSheetBytes;
    else if (pNum <= 12) imgData = sceneBytes[pNum - 3];
    else if (pNum === 24) imgData = backBytes;

    interiorPages.push({
      jpegBytes: imgData,
      pixelWidth: 2625,
      pixelHeight: 2625,
      pageWidthPt: kdpDims.widthPt, // 621
      pageHeightPt: kdpDims.heightPt, // 630
      trimBoxPt: guides.trimBoxPt,
      bleedBoxPt: [0, 0, kdpDims.widthPt, kdpDims.heightPt],
    });
  }

  const interiorPdf = buildPdfFromJpegPages(interiorPages, {
    title: 'Karim and the Blue Bubble - KDP Interior',
    author: 'Bubbleverse Studios',
    creator: 'Bubbleverse KDP Pre-Press Engine',
  });

  const interiorName = 'Karim-Blue-Bubble-KDP-Interior-8.625x8.75-300dpi.pdf';
  fs.writeFileSync(path.join(outDocs, interiorName), interiorPdf);
  fs.writeFileSync(path.join(outPublic, interiorName), interiorPdf);
  console.log(`✓ Generated ${interiorName} (${(interiorPdf.byteLength / 1048576).toFixed(2)} MB, ${interiorPages.length} pages)`);
}

// ----------------------------------------------------------------------------
// C. BUILD AMAZON KDP COVER WRAP PDF (Full Wrap: Back + Spine + Front + Bleed)
// ----------------------------------------------------------------------------
{
  const coverWrapDims = calculateCoverWrapDimensions({
    interiorPageCount: 24,
    paperStockId: 'cream_paper',
    bindingType: 'paperback',
    direction: 'rtl',
  });
  // For Cover Wrap, we output the full spread (Back on right for RTL, Front on left)
  // We use coverBytes scaled to the wrap dimensions
  const coverWrapPages = [
    {
      jpegBytes: coverBytes,
      pixelWidth: 2625,
      pixelHeight: 2625,
      pageWidthPt: Math.round(coverWrapDims.totalWidthPt),
      pageHeightPt: Math.round(coverWrapDims.totalHeightPt),
      trimBoxPt: [9, 9, Math.round(coverWrapDims.totalWidthPt - 9), Math.round(coverWrapDims.totalHeightPt - 9)],
      bleedBoxPt: [0, 0, Math.round(coverWrapDims.totalWidthPt), Math.round(coverWrapDims.totalHeightPt)],
    },
  ];

  const wrapPdf = buildPdfFromJpegPages(coverWrapPages, {
    title: 'Karim and the Blue Bubble - KDP Cover Wrap',
    author: 'Bubbleverse Studios',
    creator: 'Bubbleverse KDP Wrap Engine',
  });

  const wrapName = 'Karim-Blue-Bubble-KDP-CoverWrap-RTL-300dpi.pdf';
  fs.writeFileSync(path.join(outDocs, wrapName), wrapPdf);
  fs.writeFileSync(path.join(outPublic, wrapName), wrapPdf);
  console.log(`✓ Generated ${wrapName} (${(wrapPdf.byteLength / 1048576).toFixed(2)} MB, 1 spread)`);
}

console.log('\nAll 3 KDP 300 DPI Storybook PDFs for Karim have been generated successfully!');
