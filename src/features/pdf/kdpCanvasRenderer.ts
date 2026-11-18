import { buildPdfFromJpegPages, type PdfImagePageInput } from './binaryPdfWriter';
import {
  calculateCoverWrapDimensions,
  calculateInteriorDimensions,
  expandBookInteriorSheets,
  getInteriorPageGuides,
  inchesToPoints,
  KDP_SAFE_MARGIN_INCHES,
  KDP_TRIM_INCHES,
  type BindingDirection,
  type BindingType,
  type BookAnatomyConfig,
  type ComposerStoryPage,
  type CoverWrapDimensions,
  type ExpandedInteriorSheet,
  type InteriorBleedMode,
  type InteriorTheme,
  type PageLayoutTemplate,
  type PaperStockId,
  type RectInches,
} from './kdpSpecs';

export interface KdpBookProject {
  title: string;
  subtitle: string;
  childName: string;
  direction: BindingDirection;
  bleedEnabled: boolean;
  bindingType: BindingType;
  paperStockId: PaperStockId;
  customSpineInches?: number;
  interiorTheme: InteriorTheme;
  defaultTemplate: PageLayoutTemplate;
  padToKdpMinimum: boolean;
  anatomy: BookAnatomyConfig;
  frontCoverImageUrl: string;
  backCoverImageUrl?: string;
  frontCoverBadge: string;
  dedicationTitle: string;
  dedicationMessage: string;
  dedicationFrom: string;
  childPhotoUrl: string | null;
  keepsakeTitle: string;
  keepsakeMessage: string;
  backCoverBlurb: string;
  barcodeLabel: string;
  spineTitle: string;
  storyPages: ComposerStoryPage[];
}

export interface RenderCanvasOptions {
  dpi: number;
  showGuides: boolean;
  bleedMode?: InteriorBleedMode;
}

export type ExportProgressCallback = (completed: number, total: number, label: string) => void;

const imageCache = new Map<string, HTMLImageElement>();

function loadImageElement(url: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  const cached = imageCache.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (imageCache.size > 64) {
        const firstKey = imageCache.keys().next().value;
        if (firstKey) imageCache.delete(firstKey);
      }
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function ensureFontsReady(): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed with fallback system fonts if font readiness fails
    }
  }
}

function getFontFamily(direction: BindingDirection, display = false): string {
  if (direction === 'rtl') {
    return display
      ? "'Baloo Bhaijaan 2', 'Tajawal', 'Segoe UI', Tahoma, sans-serif"
      : "'Tajawal', 'Baloo Bhaijaan 2', 'Segoe UI', Tahoma, sans-serif";
  }
  return display
    ? "'Fredoka', 'Plus Jakarta Sans', system-ui, sans-serif"
    : "'Plus Jakarta Sans', 'Fredoka', system-ui, sans-serif";
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const boxRatio = dw / Math.max(1, dh);
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (imgRatio > boxRatio) {
    sw = img.naturalHeight * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / boxRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 16
): string[] {
  const paragraphs = text.replace(/\r/g, '').split('\n');
  const lines: string[] = [];

  for (const rawParagraph of paragraphs) {
    const paragraph = rawParagraph.trim();
    if (!paragraph) {
      if (lines.length > 0 && lines.length < maxLines) {
        lines.push('');
      }
      continue;
    }

    const words = paragraph.split(/\s+/);
    let current = '';

    for (const word of words) {
      // Break an overly long single token (e.g. URL) that exceeds maxWidth by itself
      if (ctx.measureText(word).width > maxWidth) {
        if (current) {
          lines.push(current);
          current = '';
          if (lines.length >= maxLines) break;
        }
        let chunk = '';
        for (const ch of Array.from(word)) {
          const nextChunk = chunk + ch;
          if (ctx.measureText(nextChunk).width <= maxWidth || !chunk) {
            chunk = nextChunk;
          } else {
            lines.push(chunk);
            chunk = ch;
            if (lines.length >= maxLines) break;
          }
        }
        if (lines.length >= maxLines) break;
        current = chunk;
        continue;
      }

      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
        if (lines.length >= maxLines) break;
      }
    }
    if (current && lines.length < maxLines) {
      lines.push(current);
    }
    if (lines.length >= maxLines) break;
  }

  return lines;
}

function drawPaperBackdrop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: InteriorTheme,
  dpi: number
) {
  if (theme === 'cream_paper') {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#FFFDF7');
    grad.addColorStop(0.5, '#FDF7EA');
    grad.addColorStop(1, '#F8F0DF');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Subtle soft pastel corner aura
    const aura = ctx.createRadialGradient(
      x + w * 0.85,
      y + h * 0.15,
      dpi * 0.1,
      x + w * 0.85,
      y + h * 0.15,
      w * 0.55
    );
    aura.addColorStop(0, 'rgba(0, 217, 255, 0.08)');
    aura.addColorStop(0.5, 'rgba(167, 139, 250, 0.06)');
    aura.addColorStop(1, 'rgba(255, 253, 247, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(x, y, w, h);
  } else {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#13102B');
    grad.addColorStop(0.5, '#0D1326');
    grad.addColorStop(1, '#090D1C');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    const aura = ctx.createRadialGradient(
      x + w * 0.5,
      y + h * 0.2,
      dpi * 0.2,
      x + w * 0.5,
      y + h * 0.2,
      w * 0.65
    );
    aura.addColorStop(0, 'rgba(0, 217, 255, 0.14)');
    aura.addColorStop(0.45, 'rgba(167, 139, 250, 0.11)');
    aura.addColorStop(1, 'rgba(9, 13, 28, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(x, y, w, h);
  }
}

function drawDecorativeStars(
  ctx: CanvasRenderingContext2D,
  safePx: { x: number; y: number; w: number; h: number },
  theme: InteriorTheme,
  dpi: number
) {
  const color = theme === 'cream_paper' ? 'rgba(124, 58, 237, 0.22)' : 'rgba(0, 217, 255, 0.35)';
  const accent = theme === 'cream_paper' ? 'rgba(236, 72, 153, 0.22)' : 'rgba(244, 114, 182, 0.35)';
  const points = [
    [0.08, 0.08, 0.06, color],
    [0.92, 0.09, 0.05, accent],
    [0.12, 0.91, 0.05, accent],
    [0.89, 0.9, 0.06, color],
    [0.5, 0.05, 0.035, color],
  ] as const;

  ctx.save();
  for (const [rx, ry, radiusIn, fill] of points) {
    const cx = safePx.x + safePx.w * rx;
    const cy = safePx.y + safePx.h * ry;
    const r = radiusIn * dpi;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function rectInToPx(rect: RectInches, dpi: number) {
  return {
    x: rect.x * dpi,
    y: rect.y * dpi,
    w: rect.width * dpi,
    h: rect.height * dpi,
  };
}

function drawCropAndSafeGuides(
  ctx: CanvasRenderingContext2D,
  trimRect: RectInches,
  safeRect: RectInches,
  gutterRect: RectInches | null,
  dpi: number,
  labelPrefix = '',
  tagAlign: 'left' | 'right' = 'left'
) {
  const trim = rectInToPx(trimRect, dpi);
  const safe = rectInToPx(safeRect, dpi);

  ctx.save();

  // Gutter shaded band (amber)
  if (gutterRect) {
    const gutter = rectInToPx(gutterRect, dpi);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.14)';
    ctx.fillRect(gutter.x, gutter.y, gutter.w, gutter.h);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
    ctx.lineWidth = Math.max(1, dpi * 0.012);
    ctx.setLineDash([dpi * 0.06, dpi * 0.04]);
    ctx.strokeRect(gutter.x, gutter.y, gutter.w, gutter.h);
  }

  // Trim line (cyan solid)
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(0, 217, 255, 0.92)';
  ctx.lineWidth = Math.max(1.5, dpi * 0.016);
  ctx.strokeRect(trim.x, trim.y, trim.w, trim.h);

  // Safe zone line (magenta dashed)
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.92)';
  ctx.lineWidth = Math.max(1.2, dpi * 0.014);
  ctx.setLineDash([dpi * 0.08, dpi * 0.05]);
  ctx.strokeRect(safe.x, safe.y, safe.w, safe.h);

  // Corner crop ticks at trim corners
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(0, 217, 255, 0.95)';
  ctx.lineWidth = Math.max(1.5, dpi * 0.018);
  const tick = dpi * 0.11;
  const corners = [
    [trim.x, trim.y, 1, 1],
    [trim.x + trim.w, trim.y, -1, 1],
    [trim.x, trim.y + trim.h, 1, -1],
    [trim.x + trim.w, trim.y + trim.h, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * tick, cy);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + dy * tick);
    ctx.stroke();
  }

  // Subtle legend badge tucked inside the top trim-to-safe margin strip (never overlaps safe content)
  const fontSize = Math.max(8, Math.round(dpi * 0.082));
  ctx.font = `600 ${fontSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.direction = 'ltr';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const tagText = gutterRect
    ? `${labelPrefix}TRIM 8.5"×8.5" | SAFE 0.375" | GUTTER 0.5"`
    : `${labelPrefix}TRIM 8.5"×8.5" | SAFE 0.375"`;
  const maxTagW = Math.max(dpi * 2, safe.w - dpi * 0.12);
  const tagW = Math.min(maxTagW, ctx.measureText(tagText).width + dpi * 0.16);
  const tagH = fontSize + dpi * 0.07;
  const tagX = tagAlign === 'right' ? safe.x + safe.w - tagW : safe.x;
  const tagY = trim.y + Math.max(dpi * 0.04, (safe.y - trim.y - tagH) / 2);
  ctx.fillStyle = 'rgba(9, 13, 28, 0.86)';
  drawRoundedRectPath(ctx, tagX, tagY, tagW, tagH, dpi * 0.04);
  ctx.fill();
  ctx.fillStyle = '#00D9FF';
  ctx.fillText(tagText, tagX + dpi * 0.08, tagY + tagH / 2, tagW - dpi * 0.16);

  ctx.restore();
}

async function drawFrontCoverPanel(
  ctx: CanvasRenderingContext2D,
  bleedAreaPx: { x: number; y: number; w: number; h: number },
  safeRectInches: RectInches,
  project: KdpBookProject,
  dpi: number
) {
  const safePx = rectInToPx(safeRectInches, dpi);
  const isRtl = project.direction === 'rtl';

  // Background gradient fallback
  const bg = ctx.createLinearGradient(
    bleedAreaPx.x,
    bleedAreaPx.y,
    bleedAreaPx.x + bleedAreaPx.w,
    bleedAreaPx.y + bleedAreaPx.h
  );
  bg.addColorStop(0, '#1D1138');
  bg.addColorStop(0.55, '#0F172A');
  bg.addColorStop(1, '#080C1C');
  ctx.fillStyle = bg;
  ctx.fillRect(bleedAreaPx.x, bleedAreaPx.y, bleedAreaPx.w, bleedAreaPx.h);

  const coverUrl = project.frontCoverImageUrl || project.storyPages[0]?.imageUrl || '';
  const coverImg = await loadImageElement(coverUrl);
  if (coverImg) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(bleedAreaPx.x, bleedAreaPx.y, bleedAreaPx.w, bleedAreaPx.h);
    ctx.clip();
    drawImageCover(ctx, coverImg, bleedAreaPx.x, bleedAreaPx.y, bleedAreaPx.w, bleedAreaPx.h);
    ctx.restore();
  }

  // Top & bottom subtle storybook vignettes for guaranteed title legibility
  const topVig = ctx.createLinearGradient(
    0,
    bleedAreaPx.y,
    0,
    bleedAreaPx.y + bleedAreaPx.h * 0.34
  );
  topVig.addColorStop(0, 'rgba(9, 13, 28, 0.78)');
  topVig.addColorStop(1, 'rgba(9, 13, 28, 0)');
  ctx.fillStyle = topVig;
  ctx.fillRect(bleedAreaPx.x, bleedAreaPx.y, bleedAreaPx.w, bleedAreaPx.h * 0.34);

  const botVig = ctx.createLinearGradient(
    0,
    bleedAreaPx.y + bleedAreaPx.h * 0.56,
    0,
    bleedAreaPx.y + bleedAreaPx.h
  );
  botVig.addColorStop(0, 'rgba(9, 13, 28, 0)');
  botVig.addColorStop(0.45, 'rgba(9, 13, 28, 0.72)');
  botVig.addColorStop(1, 'rgba(9, 13, 28, 0.94)');
  ctx.fillStyle = botVig;
  ctx.fillRect(
    bleedAreaPx.x,
    bleedAreaPx.y + bleedAreaPx.h * 0.56,
    bleedAreaPx.w,
    bleedAreaPx.h * 0.44
  );

  // Top badge pill inside safe zone
  const badgeText =
    project.frontCoverBadge.trim() ||
    (isRtl ? 'إصدار بابل فيرس الخاص' : 'BUBBLEVERSE EXCLUSIVE EDITION');
  const badgeFontSize = Math.round(dpi * 0.16);
  ctx.save();
  ctx.font = `700 ${badgeFontSize}px ${getFontFamily(project.direction, false)}`;
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const badgeW = Math.min(safePx.w * 0.85, ctx.measureText(badgeText).width + dpi * 0.65);
  const badgeH = dpi * 0.38;
  const badgeX = safePx.x + (safePx.w - badgeW) / 2;
  const badgeY = safePx.y + dpi * 0.18;

  ctx.fillStyle = 'rgba(13, 19, 38, 0.76)';
  drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 217, 255, 0.65)';
  ctx.lineWidth = Math.max(1.5, dpi * 0.018);
  ctx.stroke();

  ctx.fillStyle = '#67E8F9';
  ctx.fillText(badgeText, safePx.x + safePx.w / 2, badgeY + badgeH / 2, badgeW - dpi * 0.28);
  ctx.restore();

  // Bottom Title Block strictly inside safe zone
  ctx.save();
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const titleText =
    project.title.trim() ||
    (isRtl ? `مغامرة ${project.childName || 'البطل'}` : `${project.childName || 'Hero'}'s Adventure`);
  const titleFontSize = Math.round(dpi * 0.42);
  ctx.font = `800 ${titleFontSize}px ${getFontFamily(project.direction, true)}`;
  const titleLines = wrapLines(ctx, titleText, safePx.w * 0.92, 3);
  const lineH = titleFontSize * 1.24;
  const heroPillH = dpi * 0.44;
  const blockH = titleLines.length * lineH + heroPillH + dpi * 0.42;
  let cursorY = safePx.y + safePx.h - blockH - dpi * 0.14;

  // Title shadow & gradient fill
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = dpi * 0.12;
  ctx.shadowOffsetY = dpi * 0.03;
  ctx.fillStyle = '#FFFFFF';

  for (const line of titleLines) {
    ctx.fillText(line, safePx.x + safePx.w / 2, cursorY);
    cursorY += lineH;
  }

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Hero pill
  const heroLabel = isRtl
    ? `بطولة البطل: ${project.childName || 'طفلك'}`
    : `Starring: ${project.childName || 'Your Hero'}`;
  const heroFontSize = Math.round(dpi * 0.21);
  ctx.font = `700 ${heroFontSize}px ${getFontFamily(project.direction, false)}`;
  const pillW = Math.min(safePx.w * 0.86, ctx.measureText(heroLabel).width + dpi * 0.7);
  const pillX = safePx.x + (safePx.w - pillW) / 2;
  const pillY = cursorY + dpi * 0.14;

  const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
  pillGrad.addColorStop(0, '#00D9FF');
  pillGrad.addColorStop(0.52, '#A78BFA');
  pillGrad.addColorStop(1, '#F472B6');
  ctx.fillStyle = pillGrad;
  drawRoundedRectPath(ctx, pillX, pillY, pillW, heroPillH, heroPillH / 2);
  ctx.fill();

  ctx.fillStyle = '#090D1C';
  ctx.textBaseline = 'middle';
  ctx.fillText(heroLabel, safePx.x + safePx.w / 2, pillY + heroPillH / 2, pillW - dpi * 0.3);

  if (project.subtitle.trim()) {
    const subSize = Math.round(dpi * 0.15);
    ctx.font = `600 ${subSize}px ${getFontFamily(project.direction, false)}`;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.fillText(
      project.subtitle.trim(),
      safePx.x + safePx.w / 2,
      pillY + heroPillH + dpi * 0.18,
      safePx.w * 0.92
    );
  }
  ctx.restore();
}

async function drawBackCoverPanel(
  ctx: CanvasRenderingContext2D,
  bleedAreaPx: { x: number; y: number; w: number; h: number },
  safeRectInches: RectInches,
  barcodeRectInches: RectInches | null,
  project: KdpBookProject,
  dpi: number
) {
  const safePx = rectInToPx(safeRectInches, dpi);
  const isRtl = project.direction === 'rtl';

  // Deep cosmic Midnight Magic back cover (or custom full-bleed back cover artwork)
  const customBackImg = project.backCoverImageUrl
    ? await loadImageElement(project.backCoverImageUrl)
    : null;

  if (customBackImg) {
    drawImageCover(
      ctx,
      customBackImg,
      bleedAreaPx.x,
      bleedAreaPx.y,
      bleedAreaPx.w,
      bleedAreaPx.h
    );
    const backScrim = ctx.createLinearGradient(
      bleedAreaPx.x,
      bleedAreaPx.y,
      bleedAreaPx.x,
      bleedAreaPx.y + bleedAreaPx.h
    );
    backScrim.addColorStop(0, 'rgba(8, 12, 28, 0.14)');
    backScrim.addColorStop(0.38, 'rgba(8, 12, 28, 0.36)');
    backScrim.addColorStop(1, 'rgba(8, 12, 28, 0.68)');
    ctx.fillStyle = backScrim;
    ctx.fillRect(bleedAreaPx.x, bleedAreaPx.y, bleedAreaPx.w, bleedAreaPx.h);
  } else {
    const bg = ctx.createLinearGradient(
      bleedAreaPx.x,
      bleedAreaPx.y,
      bleedAreaPx.x + bleedAreaPx.w,
      bleedAreaPx.y + bleedAreaPx.h
    );
    bg.addColorStop(0, '#130F2A');
    bg.addColorStop(0.5, '#0D1326');
    bg.addColorStop(1, '#080C1C');
    ctx.fillStyle = bg;
    ctx.fillRect(bleedAreaPx.x, bleedAreaPx.y, bleedAreaPx.w, bleedAreaPx.h);

    // Subtle decorative glow orb
    const orb = ctx.createRadialGradient(
      safePx.x + safePx.w * 0.5,
      safePx.y + safePx.h * 0.25,
      dpi * 0.15,
      safePx.x + safePx.w * 0.5,
      safePx.y + safePx.h * 0.25,
      safePx.w * 0.55
    );
    orb.addColorStop(0, 'rgba(0, 217, 255, 0.18)');
    orb.addColorStop(0.55, 'rgba(167, 139, 250, 0.1)');
    orb.addColorStop(1, 'rgba(8, 12, 28, 0)');
    ctx.fillStyle = orb;
    ctx.fillRect(bleedAreaPx.x, bleedAreaPx.y, bleedAreaPx.w, bleedAreaPx.h);
  }

  // Thin editorial frame inside safe zone
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 217, 255, 0.25)';
  ctx.lineWidth = Math.max(1.2, dpi * 0.014);
  drawRoundedRectPath(
    ctx,
    safePx.x + dpi * 0.12,
    safePx.y + dpi * 0.12,
    safePx.w - dpi * 0.24,
    safePx.h - dpi * 0.24,
    dpi * 0.24
  );
  ctx.stroke();

  // Brand emblem & wordmark (shift right when custom back-cover art places subject in upper-left)
  const brandX = customBackImg ? safePx.x + safePx.w * 0.68 : safePx.x + safePx.w / 2;
  const brandY = customBackImg ? safePx.y + dpi * 1.15 : safePx.y + dpi * 0.85;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'ltr';
  const logoFontSize = Math.round(dpi * 0.42);
  ctx.font = `800 ${logoFontSize}px 'Fredoka', 'Plus Jakarta Sans', sans-serif`;
  const logoGrad = ctx.createLinearGradient(
    brandX - safePx.w * 0.25,
    brandY,
    brandX + safePx.w * 0.25,
    brandY
  );
  logoGrad.addColorStop(0, '#00D9FF');
  logoGrad.addColorStop(0.5, '#A78BFA');
  logoGrad.addColorStop(1, '#F472B6');
  ctx.fillStyle = logoGrad;
  ctx.fillText('Bubbleverse', brandX, brandY);

  const taglineFont = Math.round(dpi * 0.13);
  ctx.font = `600 ${taglineFont}px 'Plus Jakarta Sans', sans-serif`;
  ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
  ctx.fillText('STORIES IN BUBBLES • 8.5" × 8.5" EDITION', brandX, brandY + dpi * 0.34);

  // Small circular artwork vignette on back cover (only when no full-bleed custom back cover art is set)
  const thumbUrl = customBackImg
    ? ''
    : project.frontCoverImageUrl || project.storyPages[0]?.imageUrl || '';
  const thumbImg = thumbUrl ? await loadImageElement(thumbUrl) : null;
  let blurbStartY = customBackImg ? safePx.y + safePx.h * 0.44 : brandY + dpi * 0.85;
  if (thumbImg) {
    const thumbSize = dpi * 1.85;
    const tx = safePx.x + (safePx.w - thumbSize) / 2;
    const ty = brandY + dpi * 0.65;
    ctx.save();
    ctx.beginPath();
    ctx.arc(tx + thumbSize / 2, ty + thumbSize / 2, thumbSize / 2, 0, Math.PI * 2);
    ctx.clip();
    drawImageCover(ctx, thumbImg, tx, ty, thumbSize, thumbSize);
    ctx.restore();

    ctx.strokeStyle = 'rgba(0, 217, 255, 0.55)';
    ctx.lineWidth = Math.max(2, dpi * 0.028);
    ctx.beginPath();
    ctx.arc(tx + thumbSize / 2, ty + thumbSize / 2, thumbSize / 2, 0, Math.PI * 2);
    ctx.stroke();
    blurbStartY = ty + thumbSize + dpi * 0.42;
  }

  // Story Blurb
  const blurb =
    project.backCoverBlurb.trim() ||
    (isRtl
      ? `صُمّمت هذه القصة خصيصاً للبطل ${project.childName || 'الرائع'} لتلهمه الشجاعة والخيال وتبقى ذكرى ساحرة ترافقه مدى الحياة.`
      : `Crafted exclusively for ${project.childName || 'our young hero'} to spark courage, curiosity, and bedtime magic for years to come.`);

  const blurbFont = Math.round(dpi * 0.2);
  ctx.font = `500 ${blurbFont}px ${getFontFamily(project.direction, false)}`;
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#E2E8F0';
  const blurbLines = wrapLines(ctx, blurb, safePx.w * 0.78, 6);
  const blurbLH = blurbFont * 1.55;
  blurbLines.forEach((line, idx) => {
    ctx.fillText(line, safePx.x + safePx.w / 2, blurbStartY + idx * blurbLH);
  });

  // Barcode / QR safe box (Amazon KDP 2.0" × 1.2")
  if (project.anatomy.includeBarcodeBox && barcodeRectInches) {
    const bPx = rectInToPx(barcodeRectInches, dpi);
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRectPath(ctx, bPx.x, bPx.y, bPx.w, bPx.h, dpi * 0.08);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = Math.max(1, dpi * 0.012);
    ctx.stroke();

    // Decorative barcode stripes placeholder (safe white reserve for KDP auto-barcode or local QR)
    const barsLeft = bPx.x + dpi * 0.2;
    const barsTop = bPx.y + dpi * 0.16;
    const barsW = bPx.w - dpi * 0.4;
    const barsH = bPx.h * 0.54;
    ctx.fillStyle = '#0F172A';
    const pattern = [2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 2, 3, 1, 2, 1, 2, 1];
    const totalUnits = pattern.reduce((sum, u) => sum + u * 2, 0);
    const unitW = barsW / totalUnits;
    let bx = barsLeft;
    pattern.forEach((u, i) => {
      const barW = u * unitW;
      if (i % 2 === 0) {
        ctx.fillRect(bx, barsTop, barW, barsH);
      }
      bx += barW * 2;
    });

    const bLabel = project.barcodeLabel.trim() || 'ISBN / KDP BARCODE ZONE (2.0" × 1.2")';
    const bFont = Math.max(8, Math.round(dpi * 0.095));
    ctx.direction = 'ltr';
    ctx.font = `600 ${bFont}px 'Plus Jakarta Sans', monospace`;
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bLabel, bPx.x + bPx.w / 2, bPx.y + bPx.h - dpi * 0.22, bPx.w - dpi * 0.16);
  }

  // Copyright footer line opposite the barcode box
  const footFont = Math.round(dpi * 0.115);
  ctx.direction = 'ltr';
  ctx.font = `500 ${footFont}px 'Plus Jakarta Sans', sans-serif`;
  ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.textBaseline = 'bottom';
  const footX = isRtl ? safePx.x + safePx.w - dpi * 0.24 : safePx.x + dpi * 0.24;
  ctx.fillText(
    `© ${new Date().getFullYear()} Bubbleverse • bubbleverse.studio`,
    footX,
    safePx.y + safePx.h - dpi * 0.24
  );
  ctx.restore();
}

export async function renderInteriorSheetToCanvas(
  canvas: HTMLCanvasElement,
  sheet: ExpandedInteriorSheet,
  project: KdpBookProject,
  options: RenderCanvasOptions
): Promise<void> {
  await ensureFontsReady();
  const dpi = Math.max(72, options.dpi);
  const bleedMode = options.bleedMode ?? 'kdp_three_side';
  const dims = calculateInteriorDimensions(project.bleedEnabled, bleedMode);
  const guides = getInteriorPageGuides(
    sheet.sheetNumber,
    project.direction,
    project.bleedEnabled,
    bleedMode
  );

  const widthPx = Math.round(dims.widthInches * dpi);
  const heightPx = Math.round(dims.heightInches * dpi);
  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const safePx = rectInToPx(guides.safeRect, dpi);
  const isRtl = project.direction === 'rtl';
  const isCream = project.interiorTheme === 'cream_paper';
  const textPrimary = isCream ? '#1E293B' : '#F8FAFC';
  const textSecondary = isCream ? '#475569' : '#CBD5E1';

  // Render by sheet kind
  if (sheet.kind === 'blank_endpaper') {
    drawPaperBackdrop(ctx, 0, 0, widthPx, heightPx, project.interiorTheme, dpi);
    drawDecorativeStars(ctx, safePx, project.interiorTheme, dpi);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'ltr';
    ctx.font = `700 ${Math.round(dpi * 0.2)}px 'Fredoka', sans-serif`;
    ctx.fillStyle = isCream ? 'rgba(124, 58, 237, 0.28)' : 'rgba(0, 217, 255, 0.35)';
    ctx.fillText('✦  Bubbleverse  ✦', safePx.x + safePx.w / 2, safePx.y + safePx.h / 2);
    ctx.restore();
  } else if (sheet.kind === 'dedication') {
    drawPaperBackdrop(ctx, 0, 0, widthPx, heightPx, project.interiorTheme, dpi);
    drawDecorativeStars(ctx, safePx, project.interiorTheme, dpi);

    // Subtle double editorial frame
    ctx.save();
    ctx.strokeStyle = isCream ? 'rgba(124, 58, 237, 0.22)' : 'rgba(0, 217, 255, 0.28)';
    ctx.lineWidth = Math.max(1.5, dpi * 0.018);
    drawRoundedRectPath(
      ctx,
      safePx.x + dpi * 0.16,
      safePx.y + dpi * 0.16,
      safePx.w - dpi * 0.32,
      safePx.h - dpi * 0.32,
      dpi * 0.28
    );
    ctx.stroke();

    const cx = safePx.x + safePx.w / 2;
    let cursorY = safePx.y + dpi * 0.85;

    // Optional circular child photo
    const photoImg = project.childPhotoUrl ? await loadImageElement(project.childPhotoUrl) : null;
    if (photoImg) {
      const photoSize = dpi * 2.15;
      const px = cx - photoSize / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cursorY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
      ctx.clip();
      drawImageCover(ctx, photoImg, px, cursorY, photoSize, photoSize);
      ctx.restore();

      const ringGrad = ctx.createLinearGradient(px, cursorY, px + photoSize, cursorY + photoSize);
      ringGrad.addColorStop(0, '#00D9FF');
      ringGrad.addColorStop(0.5, '#A78BFA');
      ringGrad.addColorStop(1, '#F472B6');
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = Math.max(3, dpi * 0.045);
      ctx.beginPath();
      ctx.arc(cx, cursorY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      cursorY += photoSize + dpi * 0.45;
    } else {
      cursorY += dpi * 0.9;
    }

    // Dedication heading
    const heading =
      project.dedicationTitle.trim() ||
      (isRtl
        ? `إهداء خاص إلى البطل ${project.childName || ''}`
        : `Dedicated with Love to ${project.childName || 'Our Hero'}`);
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const headFont = Math.round(dpi * 0.32);
    ctx.font = `800 ${headFont}px ${getFontFamily(project.direction, true)}`;
    ctx.fillStyle = isCream ? '#6D28D9' : '#67E8F9';
    const headLines = wrapLines(ctx, heading, safePx.w * 0.82, 2);
    headLines.forEach((line) => {
      ctx.fillText(line, cx, cursorY);
      cursorY += headFont * 1.3;
    });

    // Small divider line
    cursorY += dpi * 0.14;
    const divGrad = ctx.createLinearGradient(cx - dpi * 0.9, cursorY, cx + dpi * 0.9, cursorY);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.5, '#EC4899');
    divGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = divGrad;
    ctx.fillRect(cx - dpi * 0.9, cursorY, dpi * 1.8, Math.max(2, dpi * 0.025));
    cursorY += dpi * 0.34;

    // Personalized dedication message
    const msg =
      project.dedicationMessage.trim() ||
      (isRtl
        ? 'إلى أغلى بطل في حياتنا، كل صفحة في هذا الكتاب تذكّرك بأن خيالك لا حدود له وأنك قادر على صنع المستحيل.'
        : 'To our brightest star — may every page remind you how brave, kind, and limitless your imagination truly is.');
    const bodyFont = Math.round(dpi * 0.22);
    ctx.font = `500 ${bodyFont}px ${getFontFamily(project.direction, false)}`;
    ctx.fillStyle = textPrimary;
    const msgLines = wrapLines(ctx, msg, safePx.w * 0.78, 7);
    msgLines.forEach((line) => {
      ctx.fillText(line, cx, cursorY);
      cursorY += bodyFont * 1.62;
    });

    // Signature / From line
    if (project.dedicationFrom.trim()) {
      const fromFont = Math.round(dpi * 0.2);
      ctx.font = `700 ${fromFont}px ${getFontFamily(project.direction, true)}`;
      ctx.fillStyle = isCream ? '#DB2777' : '#F472B6';
      ctx.fillText(project.dedicationFrom.trim(), cx, cursorY + dpi * 0.28, safePx.w * 0.84);
    }
    ctx.restore();
  } else if (sheet.kind === 'keepsake') {
    drawPaperBackdrop(ctx, 0, 0, widthPx, heightPx, project.interiorTheme, dpi);
    drawDecorativeStars(ctx, safePx, project.interiorTheme, dpi);

    ctx.save();
    ctx.strokeStyle = isCream ? 'rgba(236, 72, 153, 0.25)' : 'rgba(244, 114, 182, 0.32)';
    ctx.lineWidth = Math.max(1.5, dpi * 0.018);
    drawRoundedRectPath(
      ctx,
      safePx.x + dpi * 0.16,
      safePx.y + dpi * 0.16,
      safePx.w - dpi * 0.32,
      safePx.h - dpi * 0.32,
      dpi * 0.28
    );
    ctx.stroke();

    const cx = safePx.x + safePx.w / 2;
    const cy = safePx.y + safePx.h * 0.42;

    // Celebratory headline
    const title = project.keepsakeTitle.trim() || (isRtl ? 'النهاية السعيدة' : 'The End');
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleFont = Math.round(dpi * 0.56);
    ctx.font = `800 ${titleFont}px ${getFontFamily(project.direction, true)}`;
    const tGrad = ctx.createLinearGradient(cx - dpi * 2, cy, cx + dpi * 2, cy);
    tGrad.addColorStop(0, isCream ? '#0284C7' : '#00D9FF');
    tGrad.addColorStop(0.5, isCream ? '#7C3AED' : '#A78BFA');
    tGrad.addColorStop(1, isCream ? '#DB2777' : '#F472B6');
    ctx.fillStyle = tGrad;
    ctx.fillText(title, cx, cy - dpi * 0.55, safePx.w * 0.86);

    const keepsakeMsg =
      project.keepsakeMessage.trim() ||
      (isRtl
        ? `نحن فخورون بك دائماً يا ${project.childName || 'بطلنا'}! هذه مجرد بداية لمغامراتك العظيمة القادمة.`
        : `We are endlessly proud of you, ${project.childName || 'hero'}! Your biggest adventures are just beginning.`);
    const msgFont = Math.round(dpi * 0.23);
    ctx.font = `600 ${msgFont}px ${getFontFamily(project.direction, false)}`;
    ctx.fillStyle = textPrimary;
    ctx.textBaseline = 'top';
    const lines = wrapLines(ctx, keepsakeMsg, safePx.w * 0.78, 5);
    let yLine = cy + dpi * 0.08;
    lines.forEach((line) => {
      ctx.fillText(line, cx, yLine);
      yLine += msgFont * 1.6;
    });

    // Imprint footer
    const footFont = Math.round(dpi * 0.14);
    ctx.direction = 'ltr';
    ctx.font = `600 ${footFont}px 'Fredoka', sans-serif`;
    ctx.fillStyle = textSecondary;
    ctx.fillText('Bubbleverse Keepsake Edition', cx, safePx.y + safePx.h - dpi * 0.55);
    ctx.restore();
  } else if (sheet.kind === 'story_clean' || sheet.kind === 'split_art') {
    // Full-bleed edge-to-edge artwork only
    drawPaperBackdrop(ctx, 0, 0, widthPx, heightPx, 'midnight_magic', dpi);
    const img = await loadImageElement(sheet.storyPage.imageUrl);
    if (img) {
      drawImageCover(ctx, img, 0, 0, widthPx, heightPx);
    } else {
      ctx.save();
      ctx.fillStyle = '#94A3B8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${Math.round(dpi * 0.22)}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillText(
        isRtl ? 'ارفع صورة لهذه الصفحة' : 'Upload Artwork for This Page',
        widthPx / 2,
        heightPx / 2
      );
      ctx.restore();
    }
  } else if (sheet.kind === 'split_text') {
    // Classic Split Spread — Facing Editorial Text Page
    drawPaperBackdrop(ctx, 0, 0, widthPx, heightPx, project.interiorTheme, dpi);
    drawDecorativeStars(ctx, safePx, project.interiorTheme, dpi);

    ctx.save();
    ctx.strokeStyle = isCream ? 'rgba(148, 163, 184, 0.28)' : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = Math.max(1, dpi * 0.014);
    drawRoundedRectPath(
      ctx,
      safePx.x + dpi * 0.16,
      safePx.y + dpi * 0.16,
      safePx.w - dpi * 0.32,
      safePx.h - dpi * 0.32,
      dpi * 0.24
    );
    ctx.stroke();

    const bodyFont = Math.round(dpi * 0.28);
    ctx.font = `600 ${bodyFont}px ${getFontFamily(project.direction, false)}`;
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = textPrimary;

    const text = sheet.storyPage.text.trim() || (isRtl ? 'نص القصة...' : 'Story text...');
    const lines = wrapLines(ctx, text, safePx.w * 0.8, 12);
    const lh = bodyFont * 1.65;
    const totalTextH = lines.length * lh;
    let ty = safePx.y + Math.max(dpi * 0.9, (safePx.h - totalTextH) / 2);

    lines.forEach((line) => {
      ctx.fillText(line, safePx.x + safePx.w / 2, ty);
      ty += lh;
    });

    // Page number badge near outer bottom corner
    const pFont = Math.round(dpi * 0.16);
    ctx.direction = 'ltr';
    ctx.font = `700 ${pFont}px 'Plus Jakarta Sans', monospace`;
    ctx.fillStyle = isCream ? '#7C3AED' : '#67E8F9';
    ctx.textAlign = guides.outerBleedSide === 'right' ? 'right' : 'left';
    ctx.textBaseline = 'bottom';
    const px =
      guides.outerBleedSide === 'right'
        ? safePx.x + safePx.w - dpi * 0.32
        : safePx.x + dpi * 0.32;
    ctx.fillText(String(sheet.sheetNumber), px, safePx.y + safePx.h - dpi * 0.3);
    ctx.restore();
  } else if (sheet.kind === 'story_overlay') {
    // Full-Bleed Artwork + Clean Frosted Text Overlay Box (Top or Bottom)
    drawPaperBackdrop(ctx, 0, 0, widthPx, heightPx, 'midnight_magic', dpi);
    const img = await loadImageElement(sheet.storyPage.imageUrl);
    if (img) {
      drawImageCover(ctx, img, 0, 0, widthPx, heightPx);
    }

    const text = sheet.storyPage.text.trim();
    if (text) {
      const isTop = sheet.storyPage.overlayPosition === 'top';
      ctx.save();
      const bodyFont = Math.round(dpi * 0.22);
      ctx.font = `600 ${bodyFont}px ${getFontFamily(project.direction, false)}`;
      ctx.direction = isRtl ? 'rtl' : 'ltr';
      const padX = dpi * 0.32;
      const padTop = dpi * 0.24;
      const padBottom = dpi * 0.44; // Reserves clear footer strip for outer-edge page number
      const boxW = safePx.w;
      const lines = wrapLines(ctx, text, boxW - padX * 2, 6);
      const lh = bodyFont * 1.52;
      const boxH = Math.max(dpi * 1.05, lines.length * lh + padTop + padBottom);
      const boxX = safePx.x;
      const boxY = isTop ? safePx.y + dpi * 0.06 : safePx.y + safePx.h - boxH - dpi * 0.06;

      // Soft edge vignette behind overlay box
      const vigY0 = isTop ? 0 : Math.max(0, boxY - dpi * 0.85);
      const vigY1 = isTop ? Math.min(heightPx, boxY + boxH + dpi * 0.85) : heightPx;
      const vig = ctx.createLinearGradient(0, vigY0, 0, vigY1);
      if (isTop) {
        vig.addColorStop(0, 'rgba(9, 13, 28, 0.72)');
        vig.addColorStop(1, 'rgba(9, 13, 28, 0)');
      } else {
        vig.addColorStop(0, 'rgba(9, 13, 28, 0)');
        vig.addColorStop(1, 'rgba(9, 13, 28, 0.78)');
      }
      ctx.fillStyle = vig;
      ctx.fillRect(0, vigY0, widthPx, vigY1 - vigY0);

      // Frosted editorial card strictly within safe zone
      ctx.fillStyle = isCream ? 'rgba(255, 253, 247, 0.92)' : 'rgba(11, 16, 34, 0.86)';
      drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, dpi * 0.22);
      ctx.fill();
      ctx.strokeStyle = isCream ? 'rgba(124, 58, 237, 0.3)' : 'rgba(0, 217, 255, 0.38)';
      ctx.lineWidth = Math.max(1.5, dpi * 0.016);
      ctx.stroke();

      ctx.fillStyle = isCream ? '#0F172A' : '#FFFFFF';
      ctx.textAlign = isRtl ? 'right' : 'left';
      ctx.textBaseline = 'top';
      const textX = isRtl ? boxX + boxW - padX : boxX + padX;
      let ly = boxY + padTop;
      lines.forEach((line) => {
        ctx.fillText(line, textX, ly);
        ly += lh;
      });

      // Subtle page number strictly in the outer corner (away from spine gutter)
      const pFont = Math.round(dpi * 0.13);
      ctx.direction = 'ltr';
      ctx.font = `700 ${pFont}px 'Plus Jakarta Sans', monospace`;
      ctx.fillStyle = isCream ? '#7C3AED' : '#00D9FF';
      const pageNumRight = guides.outerBleedSide === 'right';
      ctx.textAlign = pageNumRight ? 'right' : 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        String(sheet.sheetNumber),
        pageNumRight ? boxX + boxW - dpi * 0.24 : boxX + dpi * 0.24,
        boxY + boxH - dpi * 0.14
      );
      ctx.restore();
    }
  }

  if (options.showGuides) {
    drawCropAndSafeGuides(
      ctx,
      guides.trimRect,
      guides.safeRect,
      guides.gutterRect,
      dpi,
      `P.${sheet.sheetNumber} (${guides.gutterSide === 'left' ? 'SPINE LEFT' : 'SPINE RIGHT'}) • `
    );
  }
}

export async function renderCoverWrapToCanvas(
  canvas: HTMLCanvasElement,
  coverDims: CoverWrapDimensions,
  project: KdpBookProject,
  options: RenderCanvasOptions
): Promise<void> {
  await ensureFontsReady();
  const dpi = Math.max(72, options.dpi);
  const widthPx = Math.round(coverDims.totalWidthInches * dpi);
  const heightPx = Math.round(coverDims.totalHeightInches * dpi);
  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Base deep midnight wrap background covering full bleed
  ctx.fillStyle = '#090D1C';
  ctx.fillRect(0, 0, widthPx, heightPx);

  const spinePx = rectInToPx(coverDims.spineRect, dpi);
  const frontIsLeft = coverDims.direction === 'rtl';

  const leftBleedArea = {
    x: 0,
    y: 0,
    w: spinePx.x,
    h: heightPx,
  };
  const rightBleedArea = {
    x: spinePx.x + spinePx.w,
    y: 0,
    w: widthPx - (spinePx.x + spinePx.w),
    h: heightPx,
  };

  // Draw Front Cover panel
  await drawFrontCoverPanel(
    ctx,
    frontIsLeft ? leftBleedArea : rightBleedArea,
    coverDims.frontSafeRect,
    project,
    dpi
  );

  // Draw Back Cover panel
  await drawBackCoverPanel(
    ctx,
    frontIsLeft ? rightBleedArea : leftBleedArea,
    coverDims.backSafeRect,
    coverDims.barcodeRect,
    project,
    dpi
  );

  // Draw Spine strip
  const spineGrad = ctx.createLinearGradient(spinePx.x, 0, spinePx.x + spinePx.w, heightPx);
  spineGrad.addColorStop(0, '#1B1136');
  spineGrad.addColorStop(0.5, '#121933');
  spineGrad.addColorStop(1, '#090D1C');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(spinePx.x, 0, spinePx.w, heightPx);

  // Optional Spine Title (only if spine is wide enough per KDP rules)
  const spineText = (project.spineTitle || project.title).trim();
  if (coverDims.canPrintSpineText && spineText) {
    ctx.save();
    ctx.translate(spinePx.x + spinePx.w / 2, heightPx / 2);
    ctx.rotate(Math.PI / 2);
    const maxFont = Math.min(dpi * 0.2, spinePx.w * 0.56);
    ctx.font = `700 ${Math.max(8, Math.round(maxFont))}px ${getFontFamily(project.direction, true)}`;
    ctx.direction = project.direction === 'rtl' ? 'rtl' : 'ltr';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(spineText, 0, 0, heightPx * 0.72);
    ctx.restore();
  }

  // Visual KDP Cover Wrap Guides
  if (options.showGuides) {
    ctx.save();
    // Spine fold lines (amber dashed)
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.92)';
    ctx.lineWidth = Math.max(1.5, dpi * 0.016);
    ctx.setLineDash([dpi * 0.08, dpi * 0.05]);
    ctx.beginPath();
    ctx.moveTo(spinePx.x, 0);
    ctx.lineTo(spinePx.x, heightPx);
    ctx.moveTo(spinePx.x + spinePx.w, 0);
    ctx.lineTo(spinePx.x + spinePx.w, heightPx);
    ctx.stroke();

    // Front & Back Trim + Safe boxes (place panel guide tags on outer edges away from center spine badge)
    drawCropAndSafeGuides(
      ctx,
      coverDims.frontRect,
      coverDims.frontSafeRect,
      null,
      dpi,
      'FRONT • ',
      frontIsLeft ? 'left' : 'right'
    );
    drawCropAndSafeGuides(
      ctx,
      coverDims.backRect,
      coverDims.backSafeRect,
      null,
      dpi,
      'BACK • ',
      frontIsLeft ? 'right' : 'left'
    );

    // Spine label badge at top
    const sFont = Math.max(9, Math.round(dpi * 0.1));
    ctx.setLineDash([]);
    ctx.direction = 'ltr';
    ctx.font = `700 ${sFont}px 'Plus Jakarta Sans', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const spineBadge = `SPINE ${coverDims.spineWidthInches.toFixed(3)}" (${coverDims.spineWidthMm}mm)`;
    const sbW = ctx.measureText(spineBadge).width + dpi * 0.22;
    const sbH = sFont + dpi * 0.1;
    ctx.fillStyle = 'rgba(9, 13, 28, 0.88)';
    drawRoundedRectPath(
      ctx,
      spinePx.x + spinePx.w / 2 - sbW / 2,
      dpi * 0.18,
      sbW,
      sbH,
      dpi * 0.05
    );
    ctx.fill();
    ctx.fillStyle = '#FBBF24';
    ctx.fillText(spineBadge, spinePx.x + spinePx.w / 2, dpi * 0.23);
    ctx.restore();
  }
}

export async function renderStandaloneCoverToCanvas(
  canvas: HTMLCanvasElement,
  side: 'front' | 'back',
  project: KdpBookProject,
  options: RenderCanvasOptions
): Promise<void> {
  await ensureFontsReady();
  const dpi = Math.max(72, options.dpi);
  const bleed = project.bleedEnabled ? 0.125 : 0;
  const pageW = KDP_TRIM_INCHES + bleed * 2;
  const pageH = KDP_TRIM_INCHES + bleed * 2;
  const widthPx = Math.round(pageW * dpi);
  const heightPx = Math.round(pageH * dpi);
  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const trimRect: RectInches = {
    x: bleed,
    y: bleed,
    width: KDP_TRIM_INCHES,
    height: KDP_TRIM_INCHES,
  };
  const safeRect: RectInches = {
    x: bleed + KDP_SAFE_MARGIN_INCHES,
    y: bleed + KDP_SAFE_MARGIN_INCHES,
    width: KDP_TRIM_INCHES - KDP_SAFE_MARGIN_INCHES * 2,
    height: KDP_TRIM_INCHES - KDP_SAFE_MARGIN_INCHES * 2,
  };

  if (side === 'front') {
    await drawFrontCoverPanel(
      ctx,
      { x: 0, y: 0, w: widthPx, h: heightPx },
      safeRect,
      project,
      dpi
    );
  } else {
    const barcodeRect: RectInches = {
      x:
        project.direction === 'rtl'
          ? trimRect.x + 0.5
          : trimRect.x + trimRect.width - 0.5 - 2.0,
      y: trimRect.y + trimRect.height - 0.5 - 1.2,
      width: 2.0,
      height: 1.2,
    };
    await drawBackCoverPanel(
      ctx,
      { x: 0, y: 0, w: widthPx, h: heightPx },
      safeRect,
      barcodeRect,
      project,
      dpi
    );
  }

  if (options.showGuides) {
    drawCropAndSafeGuides(
      ctx,
      trimRect,
      safeRect,
      null,
      dpi,
      side === 'front' ? 'FRONT COVER • ' : 'BACK COVER • '
    );
  }
}

async function canvasToJpegBytes(canvas: HTMLCanvasElement, quality = 0.92): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Canvas JPEG encoding failed'));
      },
      'image/jpeg',
      quality
    );
  });
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export async function exportKdpInteriorPdf(
  project: KdpBookProject,
  dpi: number,
  includeGuides: boolean,
  onProgress?: ExportProgressCallback,
  locale: 'ar' | 'en' = 'en'
): Promise<Blob> {
  const { sheets } = expandBookInteriorSheets({
    storyPages: project.storyPages,
    defaultTemplate: project.defaultTemplate,
    anatomy: project.anatomy,
    padToKdpMinimum: project.padToKdpMinimum,
  });

  if (sheets.length === 0) {
    throw new Error('No interior pages to export');
  }

  const dims = calculateInteriorDimensions(project.bleedEnabled, 'kdp_three_side');
  const canvas = document.createElement('canvas');
  const pdfPages: PdfImagePageInput[] = [];

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    onProgress?.(i, sheets.length, locale === 'ar' ? sheet.labelAr : sheet.labelEn);
    await renderInteriorSheetToCanvas(canvas, sheet, project, {
      dpi,
      showGuides: includeGuides,
      bleedMode: 'kdp_three_side',
    });
    const jpegBytes = await canvasToJpegBytes(canvas, dpi >= 250 ? 0.93 : 0.88);
    const guides = getInteriorPageGuides(
      sheet.sheetNumber,
      project.direction,
      project.bleedEnabled,
      'kdp_three_side'
    );

    pdfPages.push({
      jpegBytes,
      pixelWidth: canvas.width,
      pixelHeight: canvas.height,
      pageWidthPt: dims.widthPt,
      pageHeightPt: dims.heightPt,
      trimBoxPt: guides.trimBoxPt,
      bleedBoxPt: guides.bleedBoxPt,
    });
  }

  onProgress?.(
    sheets.length,
    sheets.length,
    locale === 'ar' ? 'تجميع ملف PDF النهائي' : 'Building PDF binary'
  );
  const bytes = buildPdfFromJpegPages(pdfPages, {
    title: `${project.title || 'Bubbleverse'} — KDP 8.5x8.5 Interior`,
    author: project.childName || 'Bubbleverse Studio',
  });
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

export async function exportKdpCoverWrapPdf(
  project: KdpBookProject,
  dpi: number,
  includeGuides: boolean,
  onProgress?: ExportProgressCallback,
  locale: 'ar' | 'en' = 'en'
): Promise<Blob> {
  const { preflight } = expandBookInteriorSheets({
    storyPages: project.storyPages,
    defaultTemplate: project.defaultTemplate,
    anatomy: project.anatomy,
    padToKdpMinimum: project.padToKdpMinimum,
  });

  const coverDims = calculateCoverWrapDimensions({
    interiorPageCount: Math.max(2, preflight.interiorPageCount),
    paperStockId: project.paperStockId,
    bindingType: project.bindingType,
    direction: project.direction,
    customSpineInches: project.customSpineInches,
  });

  onProgress?.(0, 1, locale === 'ar' ? 'تجهيز الغلاف الكامل' : 'Rendering Cover Wrap');
  const canvas = document.createElement('canvas');
  await renderCoverWrapToCanvas(canvas, coverDims, project, {
    dpi,
    showGuides: includeGuides,
  });
  const jpegBytes = await canvasToJpegBytes(canvas, dpi >= 250 ? 0.94 : 0.9);
  onProgress?.(1, 1, locale === 'ar' ? 'تجميع PDF الغلاف' : 'Building Cover Wrap PDF');

  const bleedPt = inchesToPoints(coverDims.bleedInches);
  const bytes = buildPdfFromJpegPages(
    [
      {
        jpegBytes,
        pixelWidth: canvas.width,
        pixelHeight: canvas.height,
        pageWidthPt: coverDims.totalWidthPt,
        pageHeightPt: coverDims.totalHeightPt,
        trimBoxPt: [
          bleedPt,
          bleedPt,
          coverDims.totalWidthPt - bleedPt,
          coverDims.totalHeightPt - bleedPt,
        ],
        bleedBoxPt: [0, 0, coverDims.totalWidthPt, coverDims.totalHeightPt],
      },
    ],
    {
      title: `${project.title || 'Bubbleverse'} — KDP 8.5x8.5 Cover Wrap`,
      author: project.childName || 'Bubbleverse Studio',
    }
  );
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

export async function exportLocalPrintSinglePdf(
  project: KdpBookProject,
  dpi: number,
  includeGuides: boolean,
  onProgress?: ExportProgressCallback,
  locale: 'ar' | 'en' = 'en'
): Promise<Blob> {
  const { sheets } = expandBookInteriorSheets({
    storyPages: project.storyPages,
    defaultTemplate: project.defaultTemplate,
    anatomy: project.anatomy,
    padToKdpMinimum: false,
  });

  const totalSteps =
    (project.anatomy.includeFrontCover ? 1 : 0) +
    sheets.length +
    (project.anatomy.includeBackCover ? 1 : 0);

  if (totalSteps === 0) {
    throw new Error('No pages enabled to export');
  }

  const canvas = document.createElement('canvas');
  const pdfPages: PdfImagePageInput[] = [];
  let completed = 0;

  // Uniform 4-side bleed (8.75" × 8.75") or pure trim (8.5" × 8.5") across ALL pages
  // so local digital print shops get identical page dimensions from front cover to back cover.
  const coverBleed = project.bleedEnabled ? 0.125 : 0;
  const coverSidePt = inchesToPoints(KDP_TRIM_INCHES + coverBleed * 2);
  const coverBleedPt = inchesToPoints(coverBleed);

  if (project.anatomy.includeFrontCover) {
    onProgress?.(completed, totalSteps, locale === 'ar' ? 'الغلاف الأمامي' : 'Front Cover');
    await renderStandaloneCoverToCanvas(canvas, 'front', project, {
      dpi,
      showGuides: includeGuides,
    });
    const jpegBytes = await canvasToJpegBytes(canvas, dpi >= 250 ? 0.93 : 0.88);
    pdfPages.push({
      jpegBytes,
      pixelWidth: canvas.width,
      pixelHeight: canvas.height,
      pageWidthPt: coverSidePt,
      pageHeightPt: coverSidePt,
      trimBoxPt: [
        coverBleedPt,
        coverBleedPt,
        coverSidePt - coverBleedPt,
        coverSidePt - coverBleedPt,
      ],
      bleedBoxPt: [0, 0, coverSidePt, coverSidePt],
    });
    completed++;
  }

  const dims = calculateInteriorDimensions(project.bleedEnabled, 'uniform_four_side');
  for (const sheet of sheets) {
    onProgress?.(completed, totalSteps, locale === 'ar' ? sheet.labelAr : sheet.labelEn);
    await renderInteriorSheetToCanvas(canvas, sheet, project, {
      dpi,
      showGuides: includeGuides,
      bleedMode: 'uniform_four_side',
    });
    const jpegBytes = await canvasToJpegBytes(canvas, dpi >= 250 ? 0.93 : 0.88);
    const guides = getInteriorPageGuides(
      sheet.sheetNumber,
      project.direction,
      project.bleedEnabled,
      'uniform_four_side'
    );
    pdfPages.push({
      jpegBytes,
      pixelWidth: canvas.width,
      pixelHeight: canvas.height,
      pageWidthPt: dims.widthPt,
      pageHeightPt: dims.heightPt,
      trimBoxPt: guides.trimBoxPt,
      bleedBoxPt: guides.bleedBoxPt,
    });
    completed++;
  }

  if (project.anatomy.includeBackCover) {
    onProgress?.(completed, totalSteps, locale === 'ar' ? 'الغلاف الخلفي' : 'Back Cover');
    await renderStandaloneCoverToCanvas(canvas, 'back', project, {
      dpi,
      showGuides: includeGuides,
    });
    const jpegBytes = await canvasToJpegBytes(canvas, dpi >= 250 ? 0.93 : 0.88);
    pdfPages.push({
      jpegBytes,
      pixelWidth: canvas.width,
      pixelHeight: canvas.height,
      pageWidthPt: coverSidePt,
      pageHeightPt: coverSidePt,
      trimBoxPt: [
        coverBleedPt,
        coverBleedPt,
        coverSidePt - coverBleedPt,
        coverSidePt - coverBleedPt,
      ],
      bleedBoxPt: [0, 0, coverSidePt, coverSidePt],
    });
    completed++;
  }

  onProgress?.(
    totalSteps,
    totalSteps,
    locale === 'ar' ? 'تجميع ملف المطبعة المحلية' : 'Building Local Print PDF'
  );
  const bytes = buildPdfFromJpegPages(pdfPages, {
    title: `${project.title || 'Bubbleverse'} — Local Print 8.5x8.5 Full Book`,
    author: project.childName || 'Bubbleverse Studio',
  });
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
