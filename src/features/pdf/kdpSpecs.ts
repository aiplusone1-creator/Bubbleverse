export const KDP_TRIM_INCHES = 8.5;
export const KDP_BLEED_INCHES = 0.125;
export const KDP_HARDCOVER_WRAP_BLEED_INCHES = 0.591;
export const KDP_HARDCOVER_BOARD_SPINE_BONUS_INCHES = 0.197; // ~5mm total greyboard thickness
export const KDP_SAFE_MARGIN_INCHES = 0.375;
export const KDP_GUTTER_INCHES = 0.5;
export const POINTS_PER_INCH = 72;
export const MM_PER_INCH = 25.4;
export const KDP_MIN_PAPERBACK_PAGES = 24;
export const KDP_MIN_SPINE_TEXT_PAGES = 79;

export type BindingDirection = 'rtl' | 'ltr';
export type BindingType = 'paperback' | 'hardcover';
export type InteriorTheme = 'cream_paper' | 'midnight_magic';
export type TextOverlayPosition = 'bottom' | 'top';
export type InteriorBleedMode = 'kdp_three_side' | 'uniform_four_side';

export type PageLayoutTemplate =
  | 'full_bleed_overlay'
  | 'split_spread'
  | 'full_bleed_clean';

export type PageLayoutOverride = 'default' | PageLayoutTemplate;

export type PaperStockId =
  | 'kdp_premium_color'
  | 'kdp_standard_color'
  | 'kdp_white'
  | 'kdp_cream'
  | 'local_art_150gsm'
  | 'local_art_170gsm'
  | 'local_art_200gsm';

export interface PaperStockSpec {
  id: PaperStockId;
  labelAr: string;
  labelEn: string;
  caliperInchesPerPage: number;
  noteAr: string;
  noteEn: string;
}

export const PAPER_STOCKS: readonly PaperStockSpec[] = [
  {
    id: 'kdp_premium_color',
    labelAr: 'أمازون KDP — ألوان بريميوم (موصى به)',
    labelEn: 'Amazon KDP — Premium Color (Recommended)',
    caliperInchesPerPage: 0.002347,
    noteAr: 'أفضل جودة لكتب الأطفال المصورة على أمازون KDP',
    noteEn: 'Best vibrancy for illustrated children’s books on KDP',
  },
  {
    id: 'kdp_standard_color',
    labelAr: 'أمازون KDP — ألوان قياسية',
    labelEn: 'Amazon KDP — Standard Color',
    caliperInchesPerPage: 0.002252,
    noteAr: 'اقتصادي لكتب التلوين والقصص الملونة',
    noteEn: 'Budget-friendly color paperback stock',
  },
  {
    id: 'kdp_white',
    labelAr: 'أمازون KDP — ورق أبيض',
    labelEn: 'Amazon KDP — White Paper',
    caliperInchesPerPage: 0.002252,
    noteAr: 'للكتب الداخلية بالأسود والأبيض',
    noteEn: 'Standard white interior stock',
  },
  {
    id: 'kdp_cream',
    labelAr: 'أمازون KDP — ورق كريمي',
    labelEn: 'Amazon KDP — Cream Paper',
    caliperInchesPerPage: 0.0025,
    noteAr: 'ملمس دافئ للقصص النصية',
    noteEn: 'Warm cream interior stock',
  },
  {
    id: 'local_art_150gsm',
    labelAr: 'مطبعة محلية — كوشيه مطفي 150 جم',
    labelEn: 'Local Print Shop — 150gsm Matte Art Paper',
    caliperInchesPerPage: 0.00236,
    noteAr: 'ممتاز لكتب الأطفال المحلية بدون انعكاس إضاءة',
    noteEn: 'Ideal glare-free silk/matte stock for local printing',
  },
  {
    id: 'local_art_170gsm',
    labelAr: 'مطبعة محلية — كوشيه ثقيل 170 جم',
    labelEn: 'Local Print Shop — 170gsm Heavy Art Paper',
    caliperInchesPerPage: 0.00276,
    noteAr: 'سُمك فاخر مقاوم لثني الأطفال',
    noteEn: 'Thick durable feel for young readers',
  },
  {
    id: 'local_art_200gsm',
    labelAr: 'مطبعة محلية — كوشيه مقوّى 200 جم',
    labelEn: 'Local Print Shop — 200gsm Board-Feel Art',
    caliperInchesPerPage: 0.00354,
    noteAr: 'إصدار هدايا فاخر شديد المتانة',
    noteEn: 'Luxury gift edition heavy pages',
  },
] as const;

export function getPaperStockSpec(id: PaperStockId): PaperStockSpec {
  return PAPER_STOCKS.find((stock) => stock.id === id) ?? PAPER_STOCKS[0];
}

export interface BookAnatomyConfig {
  includeFrontCover: boolean;
  includeDedication: boolean;
  includeStoryPages: boolean;
  includeKeepsakeEnding: boolean;
  includeBackCover: boolean;
  includeBarcodeBox: boolean;
}

export interface ComposerStoryPage {
  id: string;
  imageUrl: string;
  fileName?: string;
  text: string;
  layoutOverride: PageLayoutOverride;
  overlayPosition: TextOverlayPosition;
}

export interface RectInches {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InteriorPageDimensions {
  bleedEnabled: boolean;
  widthInches: number;
  heightInches: number;
  trimWidthInches: number;
  trimHeightInches: number;
  widthPt: number;
  heightPt: number;
  widthMm: number;
  heightMm: number;
  bleedInches: number;
}

export interface InteriorPageGuides {
  pageNumber: number;
  isRightHandPage: boolean;
  gutterSide: 'left' | 'right';
  outerBleedSide: 'left' | 'right';
  trimRect: RectInches;
  safeRect: RectInches;
  gutterRect: RectInches;
  trimBoxPt: [number, number, number, number];
  bleedBoxPt: [number, number, number, number];
}

export interface CoverWrapDimensions {
  bindingType: BindingType;
  direction: BindingDirection;
  interiorPageCount: number;
  paperStock: PaperStockSpec;
  bleedInches: number;
  spineWidthInches: number;
  spineWidthMm: number;
  totalWidthInches: number;
  totalHeightInches: number;
  totalWidthMm: number;
  totalHeightMm: number;
  totalWidthPt: number;
  totalHeightPt: number;
  canPrintSpineText: boolean;
  frontRect: RectInches;
  spineRect: RectInches;
  backRect: RectInches;
  barcodeRect: RectInches;
  frontSafeRect: RectInches;
  backSafeRect: RectInches;
}

export type ExpandedInteriorSheet =
  | {
      kind: 'dedication';
      sheetNumber: number;
      labelAr: string;
      labelEn: string;
    }
  | {
      kind: 'story_overlay';
      sheetNumber: number;
      storyPageIndex: number;
      storyPage: ComposerStoryPage;
      labelAr: string;
      labelEn: string;
    }
  | {
      kind: 'story_clean';
      sheetNumber: number;
      storyPageIndex: number;
      storyPage: ComposerStoryPage;
      labelAr: string;
      labelEn: string;
    }
  | {
      kind: 'split_art';
      sheetNumber: number;
      storyPageIndex: number;
      storyPage: ComposerStoryPage;
      labelAr: string;
      labelEn: string;
    }
  | {
      kind: 'split_text';
      sheetNumber: number;
      storyPageIndex: number;
      storyPage: ComposerStoryPage;
      labelAr: string;
      labelEn: string;
    }
  | {
      kind: 'keepsake';
      sheetNumber: number;
      labelAr: string;
      labelEn: string;
    }
  | {
      kind: 'blank_endpaper';
      sheetNumber: number;
      labelAr: string;
      labelEn: string;
    };

export interface KdpPreflightSummary {
  interiorPageCount: number;
  meetsKdpMinimum: boolean;
  isEvenPageCount: boolean;
  warningsAr: string[];
  warningsEn: string[];
}

export function roundTo(value: number, decimals = 4): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function inchesToPoints(inches: number): number {
  return roundTo(inches * POINTS_PER_INCH, 3);
}

export function inchesToMm(inches: number): number {
  return roundTo(inches * MM_PER_INCH, 2);
}

export function calculateInteriorDimensions(
  bleedEnabled: boolean,
  bleedMode: InteriorBleedMode = 'kdp_three_side'
): InteriorPageDimensions {
  const bleedInches = bleedEnabled ? KDP_BLEED_INCHES : 0;
  // Amazon KDP full-bleed interior adds 0.125" on outer edge + 0.125" top + 0.125" bottom (0" on spine).
  // Local print single-file mode uses uniform 0.125" bleed on all 4 sides (8.75" × 8.75") to match standalone covers.
  const horizontalBleedTotal =
    bleedMode === 'uniform_four_side' ? bleedInches * 2 : bleedInches;
  const widthInches = roundTo(KDP_TRIM_INCHES + horizontalBleedTotal, 4);
  const heightInches = roundTo(KDP_TRIM_INCHES + bleedInches * 2, 4);

  return {
    bleedEnabled,
    widthInches,
    heightInches,
    trimWidthInches: KDP_TRIM_INCHES,
    trimHeightInches: KDP_TRIM_INCHES,
    widthPt: inchesToPoints(widthInches),
    heightPt: inchesToPoints(heightInches),
    widthMm: inchesToMm(widthInches),
    heightMm: inchesToMm(heightInches),
    bleedInches,
  };
}

/**
 * Computes exact Trim, Safe (0.375" outer / 0.5" inside gutter), and Bleed geometry
 * for alternating pages in either LTR (English) or RTL (Arabic) books.
 */
export function getInteriorPageGuides(
  pageNumber: number,
  direction: BindingDirection,
  bleedEnabled: boolean,
  bleedMode: InteriorBleedMode = 'kdp_three_side'
): InteriorPageGuides {
  const dims = calculateInteriorDimensions(bleedEnabled, bleedMode);
  const safePageNum = Math.max(1, Math.floor(pageNumber));
  const isOdd = safePageNum % 2 === 1;

  // In LTR books: Page 1 is right-hand (spine on left).
  // In RTL Arabic books: Page 1 is left-hand (spine on right).
  const isRightHandPage = direction === 'ltr' ? isOdd : !isOdd;
  const gutterSide: 'left' | 'right' = isRightHandPage ? 'left' : 'right';
  const outerBleedSide: 'left' | 'right' = isRightHandPage ? 'right' : 'left';

  const trimX = !bleedEnabled
    ? 0
    : bleedMode === 'uniform_four_side'
    ? dims.bleedInches
    : outerBleedSide === 'left'
    ? dims.bleedInches
    : 0;
  const trimY = bleedEnabled ? dims.bleedInches : 0;

  const trimRect: RectInches = {
    x: roundTo(trimX),
    y: roundTo(trimY),
    width: KDP_TRIM_INCHES,
    height: KDP_TRIM_INCHES,
  };

  const leftMargin = gutterSide === 'left' ? KDP_GUTTER_INCHES : KDP_SAFE_MARGIN_INCHES;
  const rightMargin = gutterSide === 'right' ? KDP_GUTTER_INCHES : KDP_SAFE_MARGIN_INCHES;

  const safeRect: RectInches = {
    x: roundTo(trimRect.x + leftMargin),
    y: roundTo(trimRect.y + KDP_SAFE_MARGIN_INCHES),
    width: roundTo(KDP_TRIM_INCHES - leftMargin - rightMargin),
    height: roundTo(KDP_TRIM_INCHES - KDP_SAFE_MARGIN_INCHES * 2),
  };

  const gutterRect: RectInches = {
    x:
      gutterSide === 'left'
        ? trimRect.x
        : roundTo(trimRect.x + KDP_TRIM_INCHES - KDP_GUTTER_INCHES),
    y: trimRect.y,
    width: KDP_GUTTER_INCHES,
    height: KDP_TRIM_INCHES,
  };

  // PDF coordinate space has origin at bottom-left: [llx, lly, urx, ury]
  const trimLlx = inchesToPoints(trimRect.x);
  const trimLly = inchesToPoints(dims.heightInches - (trimRect.y + trimRect.height));
  const trimUrx = inchesToPoints(trimRect.x + trimRect.width);
  const trimUry = inchesToPoints(dims.heightInches - trimRect.y);

  return {
    pageNumber: safePageNum,
    isRightHandPage,
    gutterSide,
    outerBleedSide,
    trimRect,
    safeRect,
    gutterRect,
    trimBoxPt: [trimLlx, trimLly, trimUrx, trimUry],
    bleedBoxPt: [0, 0, dims.widthPt, dims.heightPt],
  };
}

export function calculateCoverWrapDimensions(params: {
  interiorPageCount: number;
  paperStockId: PaperStockId;
  bindingType: BindingType;
  direction: BindingDirection;
  customSpineInches?: number;
}): CoverWrapDimensions {
  const stock = getPaperStockSpec(params.paperStockId);
  const safePages = Math.max(2, Math.floor(params.interiorPageCount));
  const bleedInches =
    params.bindingType === 'hardcover'
      ? KDP_HARDCOVER_WRAP_BLEED_INCHES
      : KDP_BLEED_INCHES;

  const calculatedSpine =
    safePages * stock.caliperInchesPerPage +
    (params.bindingType === 'hardcover' ? KDP_HARDCOVER_BOARD_SPINE_BONUS_INCHES : 0);

  const spineWidthInches =
    typeof params.customSpineInches === 'number' &&
    Number.isFinite(params.customSpineInches) &&
    params.customSpineInches > 0
      ? roundTo(params.customSpineInches, 4)
      : roundTo(Math.max(0.06, calculatedSpine), 4);

  const totalWidthInches = roundTo(
    bleedInches + KDP_TRIM_INCHES + spineWidthInches + KDP_TRIM_INCHES + bleedInches,
    4
  );
  const totalHeightInches = roundTo(bleedInches + KDP_TRIM_INCHES + bleedInches, 4);

  const leftPanel: RectInches = {
    x: roundTo(bleedInches, 4),
    y: roundTo(bleedInches, 4),
    width: KDP_TRIM_INCHES,
    height: KDP_TRIM_INCHES,
  };
  const spineRect: RectInches = {
    x: roundTo(bleedInches + KDP_TRIM_INCHES, 4),
    y: roundTo(bleedInches, 4),
    width: spineWidthInches,
    height: KDP_TRIM_INCHES,
  };
  const rightPanel: RectInches = {
    x: roundTo(bleedInches + KDP_TRIM_INCHES + spineWidthInches, 4),
    y: roundTo(bleedInches, 4),
    width: KDP_TRIM_INCHES,
    height: KDP_TRIM_INCHES,
  };

  // LTR flat cover wrap: Back (left) | Spine (center) | Front (right)
  // RTL Arabic flat cover wrap: Front (left) | Spine (center) | Back (right)
  const frontRect = params.direction === 'rtl' ? leftPanel : rightPanel;
  const backRect = params.direction === 'rtl' ? rightPanel : leftPanel;

  // Amazon KDP Barcode safe box: 2.0" × 1.2", positioned near spine hinge & bottom trim
  const barcodeWidth = 2.0;
  const barcodeHeight = 1.2;
  const barcodeMarginFromSpine = 0.5;
  const barcodeMarginFromBottom = 0.5;

  const barcodeRect: RectInches = {
    x:
      params.direction === 'rtl'
        ? roundTo(backRect.x + barcodeMarginFromSpine, 4)
        : roundTo(backRect.x + backRect.width - barcodeMarginFromSpine - barcodeWidth, 4),
    y: roundTo(backRect.y + backRect.height - barcodeMarginFromBottom - barcodeHeight, 4),
    width: barcodeWidth,
    height: barcodeHeight,
  };

  const insetRect = (rect: RectInches, margin: number): RectInches => ({
    x: roundTo(rect.x + margin, 4),
    y: roundTo(rect.y + margin, 4),
    width: roundTo(rect.width - margin * 2, 4),
    height: roundTo(rect.height - margin * 2, 4),
  });

  return {
    bindingType: params.bindingType,
    direction: params.direction,
    interiorPageCount: safePages,
    paperStock: stock,
    bleedInches,
    spineWidthInches,
    spineWidthMm: inchesToMm(spineWidthInches),
    totalWidthInches,
    totalHeightInches,
    totalWidthMm: inchesToMm(totalWidthInches),
    totalHeightMm: inchesToMm(totalHeightInches),
    totalWidthPt: inchesToPoints(totalWidthInches),
    totalHeightPt: inchesToPoints(totalHeightInches),
    canPrintSpineText: safePages >= KDP_MIN_SPINE_TEXT_PAGES || spineWidthInches >= 0.2,
    frontRect,
    spineRect,
    backRect,
    barcodeRect,
    frontSafeRect: insetRect(frontRect, KDP_SAFE_MARGIN_INCHES),
    backSafeRect: insetRect(backRect, KDP_SAFE_MARGIN_INCHES),
  };
}

export function resolvePageTemplate(
  page: ComposerStoryPage,
  bookDefault: PageLayoutTemplate
): PageLayoutTemplate {
  return page.layoutOverride === 'default' ? bookDefault : page.layoutOverride;
}

export function expandBookInteriorSheets(params: {
  storyPages: ComposerStoryPage[];
  defaultTemplate: PageLayoutTemplate;
  anatomy: BookAnatomyConfig;
  padToKdpMinimum?: boolean;
}): {
  sheets: ExpandedInteriorSheet[];
  preflight: KdpPreflightSummary;
} {
  const sheets: ExpandedInteriorSheet[] = [];
  let nextNum = 1;

  if (params.anatomy.includeDedication) {
    sheets.push({
      kind: 'dedication',
      sheetNumber: nextNum++,
      labelAr: 'صفحة الإهداء الشخصي',
      labelEn: 'Personal Dedication Page',
    });
  }

  if (params.anatomy.includeStoryPages) {
    params.storyPages.forEach((storyPage, idx) => {
      const template = resolvePageTemplate(storyPage, params.defaultTemplate);
      const sceneNum = idx + 1;

      if (template === 'split_spread') {
        // In a bound book, facing spreads are ALWAYS (even, odd): 2-3, 4-5, 6-7...
        // If a split spread would otherwise begin on an odd page, insert a calm alignment
        // sheet first so the full-bleed art and its editorial text truly face each other.
        if (nextNum % 2 === 1) {
          sheets.push({
            kind: 'blank_endpaper',
            sheetNumber: nextNum++,
            labelAr: 'صفحة فاصلة لمحاذاة الانتشار المقابل',
            labelEn: 'Spread Alignment Sheet',
          });
        }
        sheets.push({
          kind: 'split_art',
          sheetNumber: nextNum++,
          storyPageIndex: idx,
          storyPage,
          labelAr: `المشهد ${sceneNum} — اللوحة الكاملة`,
          labelEn: `Scene ${sceneNum} — Full-Bleed Art`,
        });
        sheets.push({
          kind: 'split_text',
          sheetNumber: nextNum++,
          storyPageIndex: idx,
          storyPage,
          labelAr: `المشهد ${sceneNum} — صفحة النص المقابلة`,
          labelEn: `Scene ${sceneNum} — Facing Text Page`,
        });
      } else if (template === 'full_bleed_clean') {
        sheets.push({
          kind: 'story_clean',
          sheetNumber: nextNum++,
          storyPageIndex: idx,
          storyPage,
          labelAr: `المشهد ${sceneNum} — لوحة صافية`,
          labelEn: `Scene ${sceneNum} — Clean Artwork`,
        });
      } else {
        sheets.push({
          kind: 'story_overlay',
          sheetNumber: nextNum++,
          storyPageIndex: idx,
          storyPage,
          labelAr: `المشهد ${sceneNum} — لوحة + صندوق نص`,
          labelEn: `Scene ${sceneNum} — Full-Bleed + Text`,
        });
      }
    });
  }

  if (params.anatomy.includeKeepsakeEnding) {
    sheets.push({
      kind: 'keepsake',
      sheetNumber: nextNum++,
      labelAr: 'صفحة الختام والتذكار',
      labelEn: 'Closing Keepsake Page',
    });
  }

  if (params.padToKdpMinimum) {
    while (sheets.length < KDP_MIN_PAPERBACK_PAGES || sheets.length % 2 !== 0) {
      sheets.push({
        kind: 'blank_endpaper',
        sheetNumber: nextNum++,
        labelAr: 'صفحة تبطين هادئة (KDP)',
        labelEn: 'KDP Endpaper Sheet',
      });
    }
  }

  const interiorPageCount = sheets.length;
  const meetsKdpMinimum = interiorPageCount >= KDP_MIN_PAPERBACK_PAGES;
  const isEvenPageCount = interiorPageCount > 0 && interiorPageCount % 2 === 0;

  const warningsAr: string[] = [];
  const warningsEn: string[] = [];

  if (interiorPageCount === 0) {
    warningsAr.push('أضف صفحة قصة واحدة على الأقل أو فعّل صفحات الإهداء والختام.');
    warningsEn.push('Add at least one story page or enable anatomy pages.');
  } else {
    if (!meetsKdpMinimum) {
      warningsAr.push(
        `أمازون KDP الورقي يتطلب 24 صفحة داخلية كحد أدنى (الحالي: ${interiorPageCount}). يمكنك استخدام قالب "الصفحتين المتقابلتين" أو تفعيل الإكمال التلقائي إلى 24 صفحة.`
      );
      warningsEn.push(
        `Amazon KDP paperback requires at least 24 interior pages (current: ${interiorPageCount}). Switch to Split Spread or enable Auto-Pad to 24 pages.`
      );
    }
    if (!isEvenPageCount) {
      warningsAr.push(
        `عدد الصفحات الداخلية فردي (${interiorPageCount}) — يُفضّل عدد زوجي للطباعة على الوجهين.`
      );
      warningsEn.push(
        `Interior page count is odd (${interiorPageCount}) — duplex printing expects an even page count.`
      );
    }
  }

  return {
    sheets,
    preflight: {
      interiorPageCount,
      meetsKdpMinimum,
      isEvenPageCount,
      warningsAr,
      warningsEn,
    },
  };
}

/**
 * Natural alphanumeric filename comparator so `page-2.png` sorts before `page-10.png`.
 */
export function sortFilesNaturally<T extends { name: string }>(files: readonly T[]): T[] {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
}
