export interface PdfImagePageInput {
  jpegBytes: Uint8Array;
  pixelWidth: number;
  pixelHeight: number;
  pageWidthPt: number;
  pageHeightPt: number;
  trimBoxPt?: [number, number, number, number];
  bleedBoxPt?: [number, number, number, number];
}

export interface PdfDocumentMetadata {
  title?: string;
  author?: string;
  creator?: string;
}

const encoder = new TextEncoder();

function encodePdfUtf16Hex(value: string): string {
  // Encode as PDF UTF-16BE hex string with BOM so Arabic/Unicode metadata renders accurately
  let hex = 'FEFF';
  for (let i = 0; i < value.length; i++) {
    hex += value.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0');
  }
  return `<${hex}>`;
}

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3).replace(/\.?0+$/, '');
}

function fmtBox(box: [number, number, number, number]): string {
  return `[${fmtNum(box[0])} ${fmtNum(box[1])} ${fmtNum(box[2])} ${fmtNum(box[3])}]`;
}

/**
 * Assembles a standards-compliant PDF 1.4 binary containing full-bleed JPEG pages
 * with exact PostScript point MediaBox, BleedBox, and TrimBox coordinates.
 */
export function buildPdfFromJpegPages(
  pages: readonly PdfImagePageInput[],
  metadata: PdfDocumentMetadata = {}
): Uint8Array {
  if (!pages.length) {
    throw new Error('Cannot build PDF with zero pages');
  }

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    if (!(p.jpegBytes instanceof Uint8Array) || p.jpegBytes.byteLength === 0) {
      throw new Error(`Page ${i + 1} is missing JPEG bytes`);
    }
    if (
      !Number.isFinite(p.pixelWidth) ||
      p.pixelWidth <= 0 ||
      !Number.isFinite(p.pixelHeight) ||
      p.pixelHeight <= 0 ||
      !Number.isFinite(p.pageWidthPt) ||
      p.pageWidthPt <= 0 ||
      !Number.isFinite(p.pageHeightPt) ||
      p.pageHeightPt <= 0
    ) {
      throw new Error(`Page ${i + 1} has invalid dimensions`);
    }
  }

  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    byteLength += bytes.byteLength;
  };

  const pushAscii = (str: string) => {
    pushBytes(encoder.encode(str));
  };

  // PDF 1.4 header + binary marker comment
  pushAscii('%PDF-1.4\n');
  pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  // Object numbering:
  // 1: Catalog
  // 2: Pages
  // 3: Info
  // For each page i: imgId = 4 + i*3, contentId = 5 + i*3, pageId = 6 + i*3
  const totalObjects = 3 + pages.length * 3;
  const offsets: number[] = new Array(totalObjects + 1).fill(0);

  const pageIds: number[] = pages.map((_, i) => 6 + i * 3);

  // 1 0 obj — Catalog
  offsets[1] = byteLength;
  pushAscii('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2 0 obj — Pages root
  offsets[2] = byteLength;
  const kidsRef = pageIds.map((id) => `${id} 0 R`).join(' ');
  pushAscii(`2 0 obj\n<< /Type /Pages /Kids [${kidsRef}] /Count ${pages.length} >>\nendobj\n`);

  // 3 0 obj — Document Info
  offsets[3] = byteLength;
  const titleHex = encodePdfUtf16Hex(metadata.title || 'Bubbleverse Storybook');
  const authorHex = encodePdfUtf16Hex(metadata.author || 'Bubbleverse Studio');
  const creatorHex = encodePdfUtf16Hex(metadata.creator || 'Bubbleverse KDP 8.5x8.5 Composer');
  pushAscii(
    `3 0 obj\n<< /Title ${titleHex} /Author ${authorHex} /Creator ${creatorHex} /Producer ${encodePdfUtf16Hex(
      'Bubbleverse Print Engine'
    )} >>\nendobj\n`
  );

  // Page triplets
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const imgId = 4 + i * 3;
    const contentId = 5 + i * 3;
    const pageId = 6 + i * 3;

    // Image XObject
    offsets[imgId] = byteLength;
    pushAscii(
      `${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${Math.round(
        page.pixelWidth
      )} /Height ${Math.round(
        page.pixelHeight
      )} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${
        page.jpegBytes.byteLength
      } >>\nstream\n`
    );
    pushBytes(page.jpegBytes);
    pushAscii('\nendstream\nendobj\n');

    // Page content stream drawing full-page image
    const wPt = fmtNum(page.pageWidthPt);
    const hPt = fmtNum(page.pageHeightPt);
    const streamBody = `q\n${wPt} 0 0 ${hPt} 0 0 cm\n/Im0 Do\nQ\n`;
    const streamBytes = encoder.encode(streamBody);

    offsets[contentId] = byteLength;
    pushAscii(`${contentId} 0 obj\n<< /Length ${streamBytes.byteLength} >>\nstream\n`);
    pushBytes(streamBytes);
    pushAscii('endstream\nendobj\n');

    // Page dictionary
    const mediaBox: [number, number, number, number] = [0, 0, page.pageWidthPt, page.pageHeightPt];
    const bleedBox = page.bleedBoxPt ?? mediaBox;
    const trimBox = page.trimBoxPt ?? mediaBox;

    offsets[pageId] = byteLength;
    pushAscii(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox ${fmtBox(
        mediaBox
      )} /BleedBox ${fmtBox(bleedBox)} /TrimBox ${fmtBox(
        trimBox
      )} /Resources << /XObject << /Im0 ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
    );
  }

  // XRef table (20-byte fixed-width entries per PDF specification)
  const xrefOffset = byteLength;
  pushAscii(`xref\n0 ${totalObjects + 1}\n`);
  pushAscii('0000000000 65535 f \r\n');
  for (let objNum = 1; objNum <= totalObjects; objNum++) {
    pushAscii(`${offsets[objNum].toString().padStart(10, '0')} 00000 n \r\n`);
  }

  pushAscii(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  // Merge chunks into a single Uint8Array
  const output = new Uint8Array(byteLength);
  let cursor = 0;
  for (const chunk of chunks) {
    output.set(chunk, cursor);
    cursor += chunk.byteLength;
  }
  return output;
}
