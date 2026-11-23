import { buildPdfFromJpegPages, type PdfImagePageInput } from './binaryPdfWriter';
import { canApproveBook, listBookSheets, type BookArt, type BookSheet, type StudioBook } from '../studio/bookProduction';

const layoutSize = 1000;
const outputSize = 1275;
const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadBookArtwork(art: BookArt): Promise<HTMLImageElement> {
  const existing = imageCache.get(art.url);
  if (existing) return existing;
  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('BOOK_ART_UNAVAILABLE'));
    image.src = art.url;
  }).catch((error) => {
    imageCache.delete(art.url);
    throw error;
  });
  if (imageCache.size >= 12) {
    const oldest = imageCache.keys().next().value;
    if (oldest) imageCache.delete(oldest);
  }
  imageCache.set(art.url, pending);
  return pending;
}

async function drawArtwork(context: CanvasRenderingContext2D, art: BookArt) {
  const image = await loadBookArtwork(art);
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const x = (image.naturalWidth - side) / 2;
  const y = (image.naturalHeight - side) / 2;
  context.drawImage(image, x, y, side, side, 0, 0, layoutSize, layoutSize);
}

function getLines(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  return text.split(/\n/).flatMap((paragraph) => {
    const lines: string[] = [];
    let line = '';
    for (const word of paragraph.trim().split(/\s+/)) {
      if (!word) continue;
      if (context.measureText(word).width > maxWidth) throw new Error('BOOK_TEXT_OVERFLOW');
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    return [...lines, line];
  });
}

function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  weight: number,
  family: string,
  width: number,
  height: number,
  maxSize: number,
  minSize: number,
) {
  for (let size = maxSize; size >= minSize; size -= 2) {
    context.font = `${weight} ${size}px ${family}`;
    let lines: string[];
    try {
      lines = getLines(context, text, width);
    } catch {
      continue;
    }
    const lineHeight = size * 1.65;
    if (lines.length * lineHeight <= height) return { lines, lineHeight };
  }
  throw new Error('BOOK_TEXT_OVERFLOW');
}

function drawLines(context: CanvasRenderingContext2D, lines: string[], lineHeight: number, y: number) {
  lines.forEach((line, index) => context.fillText(line, layoutSize / 2, y + lineHeight * index));
}

export async function renderDigitalBookSheet(
  canvas: HTMLCanvasElement,
  book: StudioBook,
  sheet: BookSheet,
  pixels: number,
): Promise<void> {
  await document.fonts.ready;
  canvas.width = pixels;
  canvas.height = pixels;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('BOOK_RENDER_UNAVAILABLE');
  context.scale(pixels / layoutSize, pixels / layoutSize);
  const rtl = book.language === 'ar';
  const family = rtl ? '"Segoe UI", Tahoma, sans-serif' : '"Segoe UI", system-ui, sans-serif';
  context.direction = rtl ? 'rtl' : 'ltr';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  if (sheet.kind !== 'text') {
    if (!sheet.scene.art) throw new Error('BOOK_ART_UNAVAILABLE');
    await drawArtwork(context, sheet.scene.art);
    if (sheet.kind === 'art') return;
    const shade = context.createLinearGradient(0, 390, 0, 1000);
    shade.addColorStop(0, '#0a122900');
    shade.addColorStop(0.45, '#0a122999');
    shade.addColorStop(1, '#0a1229');
    context.fillStyle = shade;
    context.fillRect(0, 390, layoutSize, 610);
    context.fillStyle = '#fff6df';
    const title = fitText(context, book.coverTitle ?? book.title, 750, family, 850, 260, 74, 42);
    drawLines(context, title.lines, title.lineHeight, 730 - (title.lines.length - 1) * title.lineHeight / 2);
    context.font = `600 32px ${family}`;
    context.fillText('Bubbleverse', 500, 920);
    return;
  }

  context.fillStyle = '#fff4df';
  context.fillRect(0, 0, layoutSize, layoutSize);
  context.fillStyle = '#9c674a';
  context.font = `500 33px ${family}`;
  context.fillText('✦', 500, 215);
  context.fillStyle = '#24314d';
  const heading = fitText(context, sheet.scene.title, 700, family, 820, 150, 61, 37);
  drawLines(context, heading.lines, heading.lineHeight, 302);
  context.fillStyle = '#2e303c';
  const body = fitText(context, sheet.scene.text, 500, family, 795, 450, 54, 36);
  const textCenter = heading.lines.length > 1 ? 606 : 573;
  drawLines(context, body.lines, body.lineHeight, textCenter - (body.lines.length - 1) * body.lineHeight / 2);
  context.fillStyle = '#746454';
  context.font = `500 32px ${family}`;
  const sceneNumber = book.scenes.findIndex((scene) => scene.id === sheet.scene.id) + 1;
  context.fillText(new Intl.NumberFormat(rtl ? 'ar-EG' : 'en').format(sceneNumber), 500, 900);
}

export async function verifyDigitalBook(book: StudioBook): Promise<void> {
  if (!canApproveBook(book)) throw new Error('BOOK_INCOMPLETE');
  const canvas = document.createElement('canvas');
  try {
    for (const sheet of listBookSheets(book)) {
      await renderDigitalBookSheet(canvas, book, sheet, 300);
    }
  } finally {
    canvas.width = canvas.height = 0;
  }
}

export async function renderDigitalBookPdf(book: StudioBook): Promise<Blob> {
  if (!canApproveBook(book) || book.approvedRevision !== book.revision) throw new Error('BOOK_NOT_APPROVED');
  const canvas = document.createElement('canvas');
  const pages: PdfImagePageInput[] = [];
  try {
    for (const sheet of listBookSheets(book)) {
      await renderDigitalBookSheet(canvas, book, sheet, outputSize);
      const jpeg = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('BOOK_ENCODE_FAILED')), 'image/jpeg', 0.91);
      });
      pages.push({
        jpegBytes: new Uint8Array(await jpeg.arrayBuffer()),
        pixelWidth: outputSize,
        pixelHeight: outputSize,
        pageWidthPt: 612,
        pageHeightPt: 612,
      });
    }
    const bytes = buildPdfFromJpegPages(pages, { title: book.title, author: 'Bubbleverse' });
    return new Blob([Uint8Array.from(bytes).buffer], { type: 'application/pdf' });
  } finally {
    canvas.width = canvas.height = 0;
  }
}
