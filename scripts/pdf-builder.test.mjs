import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import {
  calculateCoverWrapDimensions,
  calculateInteriorDimensions,
  expandBookInteriorSheets,
  getInteriorPageGuides,
  sortFilesNaturally,
} from '../src/features/pdf/kdpSpecs.ts';
import { buildPdfFromJpegPages } from '../src/features/pdf/binaryPdfWriter.ts';

const baseAnatomy = {
  includeFrontCover: true,
  includeDedication: true,
  includeStoryPages: true,
  includeKeepsakeEnding: true,
  includeBackCover: true,
  includeBarcodeBox: true,
};

function makeStoryPage(index, overrides = {}) {
  return {
    id: `p_${index}`,
    imageUrl: `/bubble-books/space.webp`,
    fileName: `scene-${index}.png`,
    text: `Scene ${index} text`,
    layoutOverride: 'default',
    overlayPosition: 'bottom',
    ...overrides,
  };
}

test('KDP interior dimensions calculate exact 8.625x8.75 bleed and 8.5x8.5 trim in points and mm', () => {
  const bleed = calculateInteriorDimensions(true);
  assert.equal(bleed.widthInches, 8.625);
  assert.equal(bleed.heightInches, 8.75);
  assert.equal(bleed.widthPt, 621);
  assert.equal(bleed.heightPt, 630);
  assert.equal(bleed.widthMm, 219.08);
  assert.equal(bleed.heightMm, 222.25);

  const trim = calculateInteriorDimensions(false);
  assert.equal(trim.widthInches, 8.5);
  assert.equal(trim.heightInches, 8.5);
  assert.equal(trim.widthPt, 612);
  assert.equal(trim.heightPt, 612);

  // Local print single-file uniform 4-side bleed (8.75" x 8.75")
  const localBleed = calculateInteriorDimensions(true, 'uniform_four_side');
  assert.equal(localBleed.widthInches, 8.75);
  assert.equal(localBleed.heightInches, 8.75);
  assert.equal(localBleed.widthPt, 630);
  assert.equal(localBleed.heightPt, 630);
  const localGuides = getInteriorPageGuides(1, 'rtl', true, 'uniform_four_side');
  assert.equal(localGuides.trimRect.x, 0.125);
  assert.equal(localGuides.trimRect.y, 0.125);
  assert.deepEqual(localGuides.trimBoxPt, [9, 9, 621, 621]);
  assert.equal(localGuides.gutterSide, 'right');
});

test('alternating recto/verso gutter and bleed sides respect Arabic RTL and English LTR binding', () => {
  // LTR Page 1: right-hand page -> gutter LEFT, outer bleed RIGHT
  const ltrP1 = getInteriorPageGuides(1, 'ltr', true);
  assert.equal(ltrP1.gutterSide, 'left');
  assert.equal(ltrP1.outerBleedSide, 'right');
  assert.equal(ltrP1.trimRect.x, 0);
  assert.equal(ltrP1.safeRect.x, 0.5);
  assert.equal(ltrP1.safeRect.width, 7.625); // 8.5 - 0.5 - 0.375

  // LTR Page 2: left-hand page -> gutter RIGHT, outer bleed LEFT
  const ltrP2 = getInteriorPageGuides(2, 'ltr', true);
  assert.equal(ltrP2.gutterSide, 'right');
  assert.equal(ltrP2.outerBleedSide, 'left');
  assert.equal(ltrP2.trimRect.x, 0.125);
  assert.equal(ltrP2.safeRect.x, 0.5); // 0.125 + 0.375

  // RTL Page 1: left-hand page -> gutter RIGHT, outer bleed LEFT
  const rtlP1 = getInteriorPageGuides(1, 'rtl', true);
  assert.equal(rtlP1.gutterSide, 'right');
  assert.equal(rtlP1.outerBleedSide, 'left');
  assert.equal(rtlP1.trimRect.x, 0.125);
  assert.equal(rtlP1.safeRect.x, 0.5);

  // RTL Page 2: right-hand page -> gutter LEFT, outer bleed RIGHT
  const rtlP2 = getInteriorPageGuides(2, 'rtl', true);
  assert.equal(rtlP2.gutterSide, 'left');
  assert.equal(rtlP2.outerBleedSide, 'right');
  assert.equal(rtlP2.trimRect.x, 0);
  assert.equal(rtlP2.safeRect.x, 0.5);
});

test('cover wrap spine calculator and panel placement orient Front/Back/Barcode accurately for RTL and LTR', () => {
  const rtlCover = calculateCoverWrapDimensions({
    interiorPageCount: 32,
    paperStockId: 'kdp_premium_color',
    bindingType: 'paperback',
    direction: 'rtl',
  });
  // 32 * 0.002347 = 0.075104 -> 0.0751"
  assert.equal(rtlCover.spineWidthInches, 0.0751);
  // 0.125 + 8.5 + 0.0751 + 8.5 + 0.125 = 17.3251"
  assert.equal(rtlCover.totalWidthInches, 17.3251);
  assert.equal(rtlCover.totalHeightInches, 8.75);
  assert.ok(rtlCover.frontRect.x < rtlCover.spineRect.x);
  assert.ok(rtlCover.spineRect.x < rtlCover.backRect.x);
  assert.equal(rtlCover.barcodeRect.width, 2.0);
  assert.equal(rtlCover.barcodeRect.height, 1.2);
  // RTL barcode sits on the left side of the Back Cover (near spine)
  assert.equal(rtlCover.barcodeRect.x, Number((rtlCover.backRect.x + 0.5).toFixed(4)));

  const ltrCover = calculateCoverWrapDimensions({
    interiorPageCount: 32,
    paperStockId: 'kdp_premium_color',
    bindingType: 'paperback',
    direction: 'ltr',
  });
  assert.ok(ltrCover.backRect.x < ltrCover.spineRect.x);
  assert.ok(ltrCover.spineRect.x < ltrCover.frontRect.x);
  // LTR barcode sits on the right side of the Back Cover (near spine)
  assert.equal(ltrCover.barcodeRect.x, Number((ltrCover.backRect.x + 8.5 - 0.5 - 2.0).toFixed(4)));

  const hardcover = calculateCoverWrapDimensions({
    interiorPageCount: 32,
    paperStockId: 'local_art_170gsm',
    bindingType: 'hardcover',
    direction: 'rtl',
  });
  assert.equal(hardcover.bleedInches, 0.591);
  assert.ok(hardcover.spineWidthInches > rtlCover.spineWidthInches);
  assert.equal(hardcover.canPrintSpineText, true);
});

test('interior expansion supports all 3 layout templates, per-page overrides, anatomy toggles, and KDP 24-page pad', () => {
  const pages = [
    makeStoryPage(1, { layoutOverride: 'default' }),
    makeStoryPage(2, { layoutOverride: 'split_spread' }),
    makeStoryPage(3, { layoutOverride: 'full_bleed_clean' }),
  ];

  const expanded = expandBookInteriorSheets({
    storyPages: pages,
    defaultTemplate: 'full_bleed_overlay',
    anatomy: baseAnatomy,
    padToKdpMinimum: false,
  });

  // 1 dedication (P1) + 1 overlay (P2) + 1 alignment spacer (P3) + 2 split (P4-P5 facing!) + 1 clean (P6) + 1 keepsake (P7) = 7 sheets
  assert.equal(expanded.sheets.length, 7);
  assert.deepEqual(
    expanded.sheets.map((s) => s.kind),
    ['dedication', 'story_overlay', 'blank_endpaper', 'split_art', 'split_text', 'story_clean', 'keepsake']
  );
  // Every split_art MUST land on an even page and split_text on the immediately following odd page so they face each other!
  const splitArtSheet = expanded.sheets.find((s) => s.kind === 'split_art');
  const splitTextSheet = expanded.sheets.find((s) => s.kind === 'split_text');
  assert.equal(splitArtSheet.sheetNumber % 2, 0);
  assert.equal(splitTextSheet.sheetNumber, splitArtSheet.sheetNumber + 1);
  assert.equal(expanded.preflight.meetsKdpMinimum, false);
  assert.equal(expanded.preflight.isEvenPageCount, false);

  // Split spread with Dedication OFF still aligns Scene 1 onto facing spread Pages 2-3
  const splitNoDedication = expandBookInteriorSheets({
    storyPages: [makeStoryPage(1), makeStoryPage(2)],
    defaultTemplate: 'split_spread',
    anatomy: {
      ...baseAnatomy,
      includeDedication: false,
      includeKeepsakeEnding: false,
    },
    padToKdpMinimum: false,
  });
  assert.deepEqual(
    splitNoDedication.sheets.map((s) => [s.sheetNumber, s.kind]),
    [
      [1, 'blank_endpaper'],
      [2, 'split_art'],
      [3, 'split_text'],
      [4, 'split_art'],
      [5, 'split_text'],
    ]
  );

  // Split spread with Dedication ON needs ZERO extra alignment spacers (Dedication is P1, Scene 1 is P2-P3!)
  const splitWithDedication = expandBookInteriorSheets({
    storyPages: [makeStoryPage(1), makeStoryPage(2)],
    defaultTemplate: 'split_spread',
    anatomy: {
      ...baseAnatomy,
      includeDedication: true,
      includeKeepsakeEnding: true,
    },
    padToKdpMinimum: false,
  });
  assert.deepEqual(
    splitWithDedication.sheets.map((s) => [s.sheetNumber, s.kind]),
    [
      [1, 'dedication'],
      [2, 'split_art'],
      [3, 'split_text'],
      [4, 'split_art'],
      [5, 'split_text'],
      [6, 'keepsake'],
    ]
  );

  const padded = expandBookInteriorSheets({
    storyPages: pages,
    defaultTemplate: 'full_bleed_overlay',
    anatomy: baseAnatomy,
    padToKdpMinimum: true,
  });
  assert.equal(padded.sheets.length, 24);
  assert.equal(padded.preflight.meetsKdpMinimum, true);
  assert.equal(padded.preflight.isEvenPageCount, true);

  const storyOnly = expandBookInteriorSheets({
    storyPages: [makeStoryPage(1)],
    defaultTemplate: 'full_bleed_clean',
    anatomy: {
      ...baseAnatomy,
      includeDedication: false,
      includeKeepsakeEnding: false,
    },
    padToKdpMinimum: false,
  });
  assert.equal(storyOnly.sheets.length, 1);
  assert.equal(storyOnly.sheets[0].kind, 'story_clean');
  assert.equal(storyOnly.preflight.isEvenPageCount, false);
});

test('natural filename sorting orders page-2 before page-10', () => {
  const sorted = sortFilesNaturally([
    { name: 'page-10.png' },
    { name: 'page-2.png' },
    { name: 'page-1.png' },
    { name: 'page-20.png' },
    { name: 'page-3.png' },
  ]);
  assert.deepEqual(
    sorted.map((f) => f.name),
    ['page-1.png', 'page-2.png', 'page-3.png', 'page-10.png', 'page-20.png']
  );
});

test('binary PDF 1.4 writer outputs valid headers, exact MediaBox/TrimBox/BleedBox, and byte-accurate xref offsets', () => {
  const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);
  const bytes = buildPdfFromJpegPages(
    [
      {
        jpegBytes: fakeJpeg,
        pixelWidth: 2588,
        pixelHeight: 2625,
        pageWidthPt: 621,
        pageHeightPt: 630,
        trimBoxPt: [9, 9, 621, 621],
        bleedBoxPt: [0, 0, 621, 630],
      },
      {
        jpegBytes: fakeJpeg,
        pixelWidth: 2588,
        pixelHeight: 2625,
        pageWidthPt: 621,
        pageHeightPt: 630,
        trimBoxPt: [0, 9, 612, 621],
        bleedBoxPt: [0, 0, 621, 630],
      },
    ],
    { title: 'مغامرة زين', author: 'Bubbleverse' }
  );

  const latin = Buffer.from(bytes).toString('latin1');
  assert.ok(latin.startsWith('%PDF-1.4\n'));
  assert.ok(latin.endsWith('%%EOF\n'));
  assert.ok(latin.includes('/Count 2'));
  assert.ok(latin.includes('/MediaBox [0 0 621 630]'));
  assert.ok(latin.includes('/TrimBox [9 9 621 621]'));
  assert.ok(latin.includes('/BleedBox [0 0 621 630]'));
  assert.ok(latin.includes('/Filter /DCTDecode'));
  assert.ok(latin.includes('/Title <FEFF'));

  // Verify startxref points directly to "xref\n"
  const startXrefMatch = latin.match(/startxref\n(\d+)\n%%EOF\n$/);
  assert.ok(startXrefMatch);
  const xrefPos = Number(startXrefMatch[1]);
  assert.equal(latin.slice(xrefPos, xrefPos + 5), 'xref\n');

  // Verify every object offset in xref points directly to "<id> 0 obj"
  const xrefSection = latin.slice(xrefPos).split('trailer')[0];
  const entries = xrefSection
    .split('\r\n')
    .filter((line) => /^\d{10} 00000 n $/.test(line));
  assert.equal(entries.length, 9); // 3 root objects + 2 pages * 3 objects
  entries.forEach((entry, idx) => {
    const objId = idx + 1;
    const offset = Number(entry.slice(0, 10));
    assert.equal(
      latin.slice(offset, offset + `${objId} 0 obj`.length),
      `${objId} 0 obj`
    );
  });

  // Edge cases fail loudly
  assert.throws(() => buildPdfFromJpegPages([]), /zero pages/i);
  assert.throws(
    () =>
      buildPdfFromJpegPages([
        {
          jpegBytes: new Uint8Array(),
          pixelWidth: 100,
          pixelHeight: 100,
          pageWidthPt: 612,
          pageHeightPt: 612,
        },
      ]),
    /missing JPEG/i
  );
  assert.throws(
    () =>
      buildPdfFromJpegPages([
        {
          jpegBytes: fakeJpeg,
          pixelWidth: 0,
          pixelHeight: 100,
          pageWidthPt: 612,
          pageHeightPt: 612,
        },
      ]),
    /invalid dimensions/i
  );
});

test('First Real Story Playbook PDF exists in docs/ and public/docs/ as a valid 6-page PDF document', () => {
  const playbookPath = path.resolve(process.cwd(), 'docs', 'BUBBLEVERSE_FIRST_STORY_PLAYBOOK.pdf');
  const publicPlaybookPath = path.resolve(
    process.cwd(),
    'public',
    'docs',
    'BUBBLEVERSE_FIRST_STORY_PLAYBOOK.pdf'
  );
  assert.ok(fs.existsSync(playbookPath), 'Playbook PDF must exist in docs/');
  assert.ok(fs.existsSync(publicPlaybookPath), 'Playbook PDF must be synced in public/docs/');
  const buf = fs.readFileSync(playbookPath);
  const pubBuf = fs.readFileSync(publicPlaybookPath);
  assert.ok(buf.byteLength > 50_000, 'Playbook PDF should contain rich rendered content');
  assert.equal(Buffer.compare(buf, pubBuf), 0, 'public/docs/ Playbook copy must match docs/');
  assert.equal(buf.subarray(0, 5).toString('ascii'), '%PDF-');
  const pageMatches = buf.toString('latin1').match(/\/Type\s*\/Page\b/g) || [];
  assert.equal(pageMatches.length, 6);
});
