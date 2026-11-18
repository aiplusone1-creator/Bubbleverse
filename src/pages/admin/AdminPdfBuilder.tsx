import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  BookCopy,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileCheck2,
  FileOutput,
  FileText,
  FolderOpen,
  GripVertical,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Loader2,
  Plus,
  Ruler,
  Sparkles,
  Star,
  Trash2,
  Upload,
  AlertTriangle,
  Wand2,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import {
  getOrders,
  getStudioDraft,
  listStudioDrafts,
  type OrderRecord,
  type StudioDraftRecord,
} from '@/lib/localStore';
import { getPhotoFromVault } from '@/lib/photoVault';
import {
  checkImagePrintReadiness,
  type PrintResolutionCheck,
} from '@/features/studio/stage2PromptEngine';
import {
  calculateCoverWrapDimensions,
  calculateInteriorDimensions,
  expandBookInteriorSheets,
  PAPER_STOCKS,
  sortFilesNaturally,
  type BindingDirection,
  type BindingType,
  type BookAnatomyConfig,
  type ComposerStoryPage,
  type InteriorTheme,
  type PageLayoutOverride,
  type PaperStockId,
  type TextOverlayPosition,
} from '@/features/pdf/kdpSpecs';
import {
  exportKdpCoverWrapPdf,
  exportKdpInteriorPdf,
  exportLocalPrintSinglePdf,
  renderCoverWrapToCanvas,
  renderInteriorSheetToCanvas,
  renderStandaloneCoverToCanvas,
  triggerBlobDownload,
  type KdpBookProject,
} from '@/features/pdf/kdpCanvasRenderer';

const STARTER_ARTWORK = [
  '/showcase/career/career-astronaut.jpg',
  '/bubble-books/space.webp',
  '/bubble-books/jungle.webp',
  '/bubble-books/ocean.webp',
  '/catalog/bedtime-magic.jpg',
  '/catalog/dinosaur-valley.jpg',
];

function createPageId(): string {
  return `pg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function extractCleanDedication(raw?: string): string {
  const trimmed = raw?.trim() || '';
  if (!trimmed) return '';
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map((p) => p.trim());
    const explicit = parts.find((p) => /^(?:إهداء|dedication|gift\s*note)\s*[:：]/i.test(p));
    if (explicit) {
      return explicit.replace(/^(?:إهداء|dedication|gift\s*note)\s*[:：]\s*/i, '').trim();
    }
    const nonMeta = parts.filter(
      (p) =>
        !/^(?:أسلوب الرسم|المرافقون|الاهتمامات|فكرة القصة|art\s*style|companions|interests|plot)\s*[:：]/i.test(
          p
        )
    );
    return nonMeta.join(' — ').trim();
  }
  return trimmed.replace(/^(?:إهداء|dedication|gift\s*note)\s*[:：]\s*/i, '').trim();
}

function createInitialProject(isAr: boolean): KdpBookProject {
  const childName = isAr ? 'زين' : 'Zain';
  const title = isAr
    ? 'مغامرة زين في كوكب الفقاعات'
    : "Zain's Cosmic Bubble Adventure";
  return {
    title,
    subtitle: isAr ? 'إصدار مطبوع بمقاس 8.5×8.5 إنش' : '8.5" × 8.5" Collector Edition',
    childName,
    direction: isAr ? 'rtl' : 'ltr',
    bleedEnabled: true,
    bindingType: 'paperback',
    paperStockId: 'kdp_premium_color',
    interiorTheme: 'cream_paper',
    defaultTemplate: 'full_bleed_overlay',
    padToKdpMinimum: false,
    anatomy: {
      includeFrontCover: true,
      includeDedication: true,
      includeStoryPages: true,
      includeKeepsakeEnding: true,
      includeBackCover: true,
      includeBarcodeBox: true,
    },
    frontCoverImageUrl: STARTER_ARTWORK[0],
    frontCoverBadge: isAr ? 'إصدار بابل فيرس الخاص' : 'BUBBLEVERSE EXCLUSIVE EDITION',
    dedicationTitle: isAr ? `إهداء خاص إلى البطل ${childName}` : `Dedicated with Love to ${childName}`,
    dedicationMessage: isAr
      ? 'إلى أغلى بطل في حياتنا، كل صفحة في هذا الكتاب تذكّرك بأن خيالك لا حدود له وأنك قادر على صنع أجمل المغامرات.'
      : 'To our brightest star — may every page remind you how brave, kind, and limitless your imagination truly is.',
    dedicationFrom: isAr ? 'بكل الحب، ماما وبابا' : 'With all our love, Mom & Dad',
    childPhotoUrl: null,
    keepsakeTitle: isAr ? 'النهاية السعيدة' : 'The End',
    keepsakeMessage: isAr
      ? `نحن فخورون بك دائماً يا ${childName}! هذه مجرد البداية لمغامراتك العظيمة القادمة.`
      : `We are endlessly proud of you, ${childName}! Your greatest adventures are just beginning.`,
    backCoverBlurb: isAr
      ? `صُمّمت هذه القصة خصيصاً للبطل ${childName} لتلهمه الشجاعة والفضول وتمنحه تجربة قراءة سحرية قبل النوم.`
      : `Created exclusively for ${childName} to spark wonder, courage, and unforgettable bedtime adventures.`,
    barcodeLabel: 'ISBN / KDP BARCODE ZONE',
    spineTitle: title,
    storyPages: [
      {
        id: createPageId(),
        imageUrl: STARTER_ARTWORK[0],
        fileName: 'scene-01.jpg',
        text: isAr
          ? `في صباح يوم مشرق، نظر ${childName} إلى السماء فشاهد فقاعة كونية متلألئة تناديه لبدء مغامرته الأولى.`
          : `One bright morning, ${childName} looked up at the sky and spotted a glowing cosmic bubble calling for adventure.`,
        layoutOverride: 'default',
        overlayPosition: 'bottom',
      },
      {
        id: createPageId(),
        imageUrl: STARTER_ARTWORK[1],
        fileName: 'scene-02.jpg',
        text: isAr
          ? `انطلق ${childName} بابتسامة شجاعة عبر سماء مليئة بالكواكب الملوّنة والنجوم الضاحكة.`
          : `With a brave smile, ${childName} soared past swirling pastel planets and twinkling friendly stars.`,
        layoutOverride: 'default',
        overlayPosition: 'bottom',
      },
      {
        id: createPageId(),
        imageUrl: STARTER_ARTWORK[2],
        fileName: 'scene-03.jpg',
        text: isAr
          ? `وهناك اكتشف ${childName} أن أعظم قوة سحرية في الكون هي الطيبة والشجاعة وحب الاستكشاف.`
          : `Along the journey, ${childName} discovered that the greatest magic in the universe is kindness and courage.`,
        layoutOverride: 'default',
        overlayPosition: 'bottom',
      },
    ],
  };
}

function sanitizeFileSlug(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'bubbleverse-book';
}

interface PageImageDims {
  url: string;
  width: number;
  height: number;
}

function probeImageDimensions(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function hydrateStudioDraftPages(draft: StudioDraftRecord): Promise<{
  pages: ComposerStoryPage[];
  dimsMap: Record<string, PageImageDims>;
  hydratedVaultCount: number;
}> {
  let hydratedVaultCount = 0;
  const dimsMap: Record<string, PageImageDims> = {};

  const pages = await Promise.all(
    draft.pages.map(async (p, idx): Promise<ComposerStoryPage> => {
      const vaultImage = p.imageVaultId ? await getPhotoFromVault(p.imageVaultId) : null;
      if (vaultImage) {
        hydratedVaultCount += 1;
      }
      const resolvedUrl = vaultImage || p.imageUrl;
      const id = createPageId();

      if (
        typeof p.imageWidth === 'number' &&
        p.imageWidth > 0 &&
        typeof p.imageHeight === 'number' &&
        p.imageHeight > 0
      ) {
        dimsMap[id] = {
          url: resolvedUrl,
          width: Math.round(p.imageWidth),
          height: Math.round(p.imageHeight),
        };
      } else {
        const probed = await probeImageDimensions(resolvedUrl);
        if (probed) {
          dimsMap[id] = {
            url: resolvedUrl,
            width: probed.width,
            height: probed.height,
          };
        }
      }

      return {
        id,
        imageUrl: resolvedUrl,
        fileName: `studio-page-${String(idx + 1).padStart(2, '0')}`,
        text: p.text,
        layoutOverride: 'default',
        overlayPosition: 'bottom',
      };
    })
  );

  return { pages, dimsMap, hydratedVaultCount };
}

function getResolutionBadgeMeta(
  check: PrintResolutionCheck,
  isAr: boolean
): { shortLabel: string; fullLabel: string; className: string } {
  if (check.status === 'print_300dpi') {
    return {
      shortLabel: '300 DPI ✓',
      fullLabel: isAr ? check.labelAr : check.labelEn,
      className: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/35',
    };
  }
  if (check.status === 'upscale_recommended') {
    return {
      shortLabel: isAr ? 'تكبير 2×' : 'Upscale 2×',
      fullLabel: isAr ? check.labelAr : check.labelEn,
      className: 'bg-amber-500/15 text-amber-200 border border-amber-400/35',
    };
  }
  return {
    shortLabel: isAr ? 'دقة منخفضة' : 'Low Res',
    fullLabel: isAr ? check.labelAr : check.labelEn,
    className: 'bg-red-500/15 text-red-200 border border-red-400/35',
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read error'));
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unexpected file reader result'));
      }
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminPdfBuilder() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState<OrderRecord[]>(() => getOrders());
  const [drafts, setDrafts] = useState<StudioDraftRecord[]>(() => listStudioDrafts());
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedDraftKey, setSelectedDraftKey] = useState<string>('');

  const [project, setProject] = useState<KdpBookProject>(() => createInitialProject(isAr));
  const [isStarterDemo, setIsStarterDemo] = useState<boolean>(true);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [previewTab, setPreviewTab] = useState<'interior' | 'cover_wrap' | 'front_back'>('interior');
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [frontBackSide, setFrontBackSide] = useState<'front' | 'back'>('front');

  const [showPreviewGuides, setShowPreviewGuides] = useState<boolean>(true);
  const [embedProofGuidesInPdf, setEmbedProofGuidesInPdf] = useState<boolean>(false);
  const [exportDpi, setExportDpi] = useState<150 | 300>(300);
  const [bulkMode, setBulkMode] = useState<'append' | 'replace'>('append');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [draggedPageIdx, setDraggedPageIdx] = useState<number | null>(null);
  const [customSpineText, setCustomSpineText] = useState<string>('');
  const [pageDimsMap, setPageDimsMap] = useState<Record<string, PageImageDims>>({});
  const [isHydratingDraft, setIsHydratingDraft] = useState<boolean>(false);

  const [exportState, setExportState] = useState<{
    busy: boolean;
    kind: string;
    completed: number;
    total: number;
    label: string;
  }>({
    busy: false,
    kind: '',
    completed: 0,
    total: 0,
    label: '',
  });

  const interiorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const coverWrapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const standaloneCoverCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bulkInputRef = useRef<HTMLInputElement | null>(null);
  const lastLoadedParamRef = useRef<string>('');
  const loadRequestIdRef = useRef<number>(0);

  const interiorDims = useMemo(
    () => calculateInteriorDimensions(project.bleedEnabled),
    [project.bleedEnabled]
  );

  const expanded = useMemo(
    () =>
      expandBookInteriorSheets({
        storyPages: project.storyPages,
        defaultTemplate: project.defaultTemplate,
        anatomy: project.anatomy,
        padToKdpMinimum: project.padToKdpMinimum,
      }),
    [
      project.storyPages,
      project.defaultTemplate,
      project.anatomy,
      project.padToKdpMinimum,
    ]
  );

  const coverDims = useMemo(
    () =>
      calculateCoverWrapDimensions({
        interiorPageCount: Math.max(2, expanded.preflight.interiorPageCount),
        paperStockId: project.paperStockId,
        bindingType: project.bindingType,
        direction: project.direction,
        customSpineInches: project.customSpineInches,
      }),
    [
      expanded.preflight.interiorPageCount,
      project.paperStockId,
      project.bindingType,
      project.direction,
      project.customSpineInches,
    ]
  );

  // Keep sheet index clamped when anatomy or page count changes
  useEffect(() => {
    if (expanded.sheets.length === 0) {
      setActiveSheetIndex(0);
    } else if (activeSheetIndex >= expanded.sheets.length) {
      setActiveSheetIndex(expanded.sheets.length - 1);
    }
  }, [expanded.sheets.length, activeSheetIndex]);

  useEffect(() => {
    if (project.storyPages.length === 0) {
      setActiveStoryIndex(0);
    } else if (activeStoryIndex >= project.storyPages.length) {
      setActiveStoryIndex(project.storyPages.length - 1);
    }
  }, [project.storyPages.length, activeStoryIndex]);

  const loadFromOrder = useCallback(
    async (order: OrderRecord, silent = false) => {
      const reqId = ++loadRequestIdRef.current;
      setSelectedOrderId(order.id);
      setCustomSpineText('');
      setIsStarterDemo(false);
      const item = order.items[0];
      if (!item) return;

      const isArabicBook = item.storyLanguage !== 'en';
      const direction: BindingDirection = isArabicBook ? 'rtl' : 'ltr';
      const hero = item.childName || (isArabicBook ? 'البطل' : 'Hero');
      const title = isArabicBook ? item.titleAr : item.titleEn;
      const existingDraft = getStudioDraft(order.id);
      setSelectedDraftKey(existingDraft ? existingDraft.key : '');
      setIsHydratingDraft(true);

      try {
        const [childPhoto, hydrated] = await Promise.all([
          item.photoVaultId ? getPhotoFromVault(item.photoVaultId) : Promise.resolve(null),
          existingDraft && existingDraft.pages.length > 0
            ? hydrateStudioDraftPages(existingDraft)
            : Promise.resolve({ pages: [] as ComposerStoryPage[], dimsMap: {}, hydratedVaultCount: 0 }),
        ]);

        if (loadRequestIdRef.current !== reqId) return;

        setPageDimsMap(hydrated.dimsMap);
        setProject((prev) => ({
          ...prev,
          title: existingDraft?.storyTitle || title,
          spineTitle: existingDraft?.storyTitle || title,
          childName: hero,
          direction,
          customSpineInches: undefined,
          bindingType: item.format === 'hardcover_book' ? 'hardcover' : 'paperback',
          frontCoverImageUrl:
            hydrated.pages[0]?.imageUrl || item.coverImage || STARTER_ARTWORK[0],
          dedicationTitle: isArabicBook
            ? `إهداء خاص إلى البطل ${hero}`
            : `Dedicated with Love to ${hero}`,
          dedicationMessage:
            extractCleanDedication(item.giftMessage) ||
            (isArabicBook
              ? `إلى بطلنا الرائع ${hero}، نهدي لك هذه المغامرة لتتذكر دائماً أنك قادر على تحقيق كل أحلامك.`
              : `To our brave hero ${hero}, may this book remind you that every dream is within reach.`),
          dedicationFrom: order.customerName
            ? isArabicBook
              ? `بكل الحب، ${order.customerName}`
              : `With love, ${order.customerName}`
            : isArabicBook
            ? 'بكل الحب، ماما وبابا'
            : 'With all our love, Mom & Dad',
          childPhotoUrl: childPhoto,
          keepsakeTitle: isArabicBook ? 'النهاية السعيدة' : 'The End',
          keepsakeMessage: isArabicBook
            ? `نحن فخورون بك دائماً يا ${hero}! إلى مغامرات أعظم في المستقبل.`
            : `We are so proud of you, ${hero}! Here is to many more magical adventures ahead.`,
          backCoverBlurb: isArabicBook
            ? `قصة مصوّرة مخصصة للبطل ${hero} (${item.childAge || '5'} سنوات) — صُمّمت بعناية فائقة لتبقى ذكرى خالدة.`
            : `A personalized illustrated storybook starring ${hero} (age ${item.childAge || '5'}) — crafted to be treasured forever.`,
          storyPages: hydrated.pages,
        }));

        setActiveStoryIndex(0);
        setActiveSheetIndex(0);
        if (!silent) {
          const vaultSuffix =
            hydrated.hydratedVaultCount > 0
              ? isAr
                ? ` (${hydrated.hydratedVaultCount} لوحة بدقة الطباعة الأصلية)`
                : ` (${hydrated.hydratedVaultCount} full-res vault illustrations)`
              : '';
          toast.success(
            isAr
              ? `تم استيراد بيانات الطلب ${order.reference} (${hero})${
                  hydrated.pages.length ? vaultSuffix : ' — ارفع رسومات القصة الآن'
                }`
              : `Loaded order ${order.reference} (${hero})${
                  hydrated.pages.length
                    ? vaultSuffix
                    : ' — bulk-upload story illustrations next'
                }`
          );
        }
      } finally {
        if (loadRequestIdRef.current === reqId) {
          setIsHydratingDraft(false);
        }
      }
    },
    [isAr]
  );

  const loadFromStudioDraft = useCallback(
    async (draft: StudioDraftRecord, silent = false) => {
      const reqId = ++loadRequestIdRef.current;
      setSelectedDraftKey(draft.key);
      setCustomSpineText('');
      setIsStarterDemo(false);
      setIsHydratingDraft(true);

      const isArabicBook = draft.storyLang === 'ar';
      const direction: BindingDirection = isArabicBook ? 'rtl' : 'ltr';
      const hero = draft.childName || (isArabicBook ? 'البطل' : 'Hero');
      const matchedOrder = getOrders().find(
        (o) =>
          o.id === draft.key ||
          (draft.orderReference ? o.reference === draft.orderReference : false)
      );
      const linkedItem = matchedOrder?.items[0];
      setSelectedOrderId(matchedOrder?.id ?? '');

      try {
        const [hydrated, childPhoto] = await Promise.all([
          hydrateStudioDraftPages(draft),
          linkedItem?.photoVaultId
            ? getPhotoFromVault(linkedItem.photoVaultId)
            : Promise.resolve(null),
        ]);

        if (loadRequestIdRef.current !== reqId) return;

        setPageDimsMap(hydrated.dimsMap);
        // Reset all child-specific fields so photos/dedications from any previously loaded order never leak across books
        setProject((prev) => ({
          ...prev,
          title: draft.storyTitle,
          spineTitle: draft.storyTitle,
          childName: hero,
          direction,
          customSpineInches: undefined,
          bindingType:
            linkedItem?.format === 'hardcover_book' ? 'hardcover' : prev.bindingType,
          childPhotoUrl: childPhoto,
          frontCoverImageUrl:
            hydrated.pages[0]?.imageUrl || linkedItem?.coverImage || STARTER_ARTWORK[0],
          dedicationTitle: isArabicBook
            ? `إهداء خاص إلى البطل ${hero}`
            : `Dedicated with Love to ${hero}`,
          dedicationMessage:
            extractCleanDedication(linkedItem?.giftMessage) ||
            (isArabicBook
              ? `إلى بطلنا الرائع ${hero}، نهدي لك هذه المغامرة لتتذكر دائماً أن خيالك لا حدود له.`
              : `To our brave hero ${hero} — may every page remind you how limitless your imagination truly is.`),
          dedicationFrom: matchedOrder?.customerName
            ? isArabicBook
              ? `بكل الحب، ${matchedOrder.customerName}`
              : `With love, ${matchedOrder.customerName}`
            : isArabicBook
            ? 'بكل الحب، ماما وبابا'
            : 'With all our love, Mom & Dad',
          keepsakeTitle: isArabicBook ? 'النهاية السعيدة' : 'The End',
          keepsakeMessage: isArabicBook
            ? `نحن فخورون بك دائماً يا ${hero}! إلى مغامرات أعظم في المستقبل.`
            : `We are so proud of you, ${hero}! Here is to many more magical adventures ahead.`,
          backCoverBlurb: isArabicBook
            ? `صُمّمت هذه القصة خصيصاً للبطل ${hero} لتلهمه الشجاعة والفضول وتمنحه تجربة قراءة سحرية قبل النوم.`
            : `Created exclusively for ${hero} to spark wonder, courage, and unforgettable bedtime adventures.`,
          storyPages: hydrated.pages,
        }));

        setActiveStoryIndex(0);
        setActiveSheetIndex(0);
        if (!silent) {
          const vaultSuffix =
            hydrated.hydratedVaultCount > 0
              ? isAr
                ? ` — ${hydrated.hydratedVaultCount} لوحة بالدقة الكاملة`
                : ` — ${hydrated.hydratedVaultCount} full-res vault artworks`
              : '';
          toast.success(
            isAr
              ? `تم استيراد مسودة الاستوديو: ${draft.storyTitle} (${hydrated.pages.length} صفحة)${vaultSuffix}`
              : `Imported Studio draft: ${draft.storyTitle} (${hydrated.pages.length} pages)${vaultSuffix}`
          );
        }
      } finally {
        if (loadRequestIdRef.current === reqId) {
          setIsHydratingDraft(false);
        }
      }
    },
    [isAr]
  );

  // Sync URL query params (?orderId=..., ?draft=..., or ?draftKey=...) on load/navigation
  useEffect(() => {
    setOrders(getOrders());
    setDrafts(listStudioDrafts());

    const orderParam = searchParams.get('orderId');
    const draftParam = searchParams.get('draft') || searchParams.get('draftKey');
    const paramSignature = orderParam
      ? `order:${orderParam}`
      : draftParam
      ? `draft:${draftParam}`
      : '';

    if (!paramSignature || lastLoadedParamRef.current === paramSignature) return;

    if (orderParam) {
      const match = getOrders().find(
        (o) => o.id === orderParam || o.reference === orderParam
      );
      if (match) {
        lastLoadedParamRef.current = paramSignature;
        void loadFromOrder(match, true);
        return;
      }
    }

    if (draftParam) {
      const matchDraft = getStudioDraft(draftParam);
      if (matchDraft) {
        lastLoadedParamRef.current = paramSignature;
        void loadFromStudioDraft(matchDraft, true);
        return;
      }
      const fallbackOrder = getOrders().find(
        (o) => o.id === draftParam || o.reference === draftParam
      );
      if (fallbackOrder) {
        lastLoadedParamRef.current = paramSignature;
        void loadFromOrder(fallbackOrder, true);
      }
    }
  }, [searchParams, loadFromOrder, loadFromStudioDraft]);

  // Live Canvas Preview Renderer
  useEffect(() => {
    let cancelled = false;
    const renderPreview = async () => {
      if (previewTab === 'interior') {
        const canvas = interiorCanvasRef.current;
        const sheet = expanded.sheets[activeSheetIndex];
        if (!canvas || !sheet || cancelled) return;
        await renderInteriorSheetToCanvas(canvas, sheet, project, {
          dpi: 96,
          showGuides: showPreviewGuides,
        });
      } else if (previewTab === 'cover_wrap') {
        const canvas = coverWrapCanvasRef.current;
        if (!canvas || cancelled) return;
        await renderCoverWrapToCanvas(canvas, coverDims, project, {
          dpi: 84,
          showGuides: showPreviewGuides,
        });
      } else {
        const canvas = standaloneCoverCanvasRef.current;
        if (!canvas || cancelled) return;
        await renderStandaloneCoverToCanvas(canvas, frontBackSide, project, {
          dpi: 96,
          showGuides: showPreviewGuides,
        });
      }
    };

    const timer = setTimeout(() => {
      void renderPreview();
    }, 60);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    previewTab,
    activeSheetIndex,
    frontBackSide,
    expanded.sheets,
    coverDims,
    project,
    showPreviewGuides,
  ]);

  const handleBulkFiles = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (filesArray.length === 0) {
      toast.error(
        isAr
          ? 'يرجى اختيار ملفات صور صالحة (PNG / JPG / WebP)'
          : 'Please select valid image files (PNG / JPG / WebP)'
      );
      return;
    }

    const sorted = sortFilesNaturally(filesArray);
    try {
      const loaded = await Promise.all(
        sorted.map(async (file) => {
          const dataUrl = await readFileAsDataUrl(file);
          const dims = await probeImageDimensions(dataUrl);
          return {
            id: createPageId(),
            name: file.name,
            dataUrl,
            dims,
          };
        })
      );

      const shouldReplaceDemoStarter = isStarterDemo;
      const isReplaceExisting =
        bulkMode === 'replace' && project.storyPages.length > 0 && !shouldReplaceDemoStarter;
      setIsStarterDemo(false);

      const dimsPatch: Record<string, PageImageDims> = {};
      loaded.forEach((item, idx) => {
        if (!item.dims) return;
        const pageId =
          isReplaceExisting && project.storyPages[idx]
            ? project.storyPages[idx].id
            : item.id;
        dimsPatch[pageId] = {
          url: item.dataUrl,
          width: item.dims.width,
          height: item.dims.height,
        };
      });
      setPageDimsMap((prev) => ({
        ...(shouldReplaceDemoStarter ? {} : prev),
        ...dimsPatch,
      }));

      setProject((prev) => {
        const coverIsStarter =
          !prev.frontCoverImageUrl || STARTER_ARTWORK.includes(prev.frontCoverImageUrl);
        const nextCoverUrl = coverIsStarter
          ? loaded[0]?.dataUrl || prev.frontCoverImageUrl
          : prev.frontCoverImageUrl;

        if (bulkMode === 'replace' && prev.storyPages.length > 0 && !shouldReplaceDemoStarter) {
          const updated: ComposerStoryPage[] = [];
          const maxLen = Math.max(prev.storyPages.length, loaded.length);
          for (let i = 0; i < maxLen; i++) {
            const existing = prev.storyPages[i];
            const incoming = loaded[i];
            if (existing && incoming) {
              updated.push({
                ...existing,
                imageUrl: incoming.dataUrl,
                fileName: incoming.name,
              });
            } else if (existing) {
              updated.push(existing);
            } else if (incoming) {
              updated.push({
                id: incoming.id,
                imageUrl: incoming.dataUrl,
                fileName: incoming.name,
                text: '',
                layoutOverride: 'default',
                overlayPosition: 'bottom',
              });
            }
          }
          return {
            ...prev,
            frontCoverImageUrl: nextCoverUrl,
            storyPages: updated,
          };
        }

        const appended: ComposerStoryPage[] = loaded.map((item) => ({
          id: item.id,
          imageUrl: item.dataUrl,
          fileName: item.name,
          text: '',
          layoutOverride: 'default',
          overlayPosition: 'bottom',
        }));

        return {
          ...prev,
          frontCoverImageUrl: nextCoverUrl,
          storyPages: shouldReplaceDemoStarter ? appended : [...prev.storyPages, ...appended],
        };
      });

      toast.success(
        isAr
          ? `تم استيراد ${loaded.length} صورة بترتيب رقمي تلقائي بنجاح!`
          : `Imported ${loaded.length} illustrations in natural numeric order!`
      );
    } catch {
      toast.error(
        isAr ? 'حدث خطأ أثناء قراءة بعض الصور' : 'Failed to read one or more image files'
      );
    }
  };

  const handleSingleImageUpload = async (
    target: 'front_cover' | 'back_cover' | 'child_photo' | number,
    file?: File
  ) => {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (target === 'front_cover') {
        setProject((prev) => ({ ...prev, frontCoverImageUrl: dataUrl }));
      } else if (target === 'back_cover') {
        setProject((prev) => ({ ...prev, backCoverImageUrl: dataUrl }));
      } else if (target === 'child_photo') {
        setProject((prev) => ({ ...prev, childPhotoUrl: dataUrl }));
      } else {
        const dims = await probeImageDimensions(dataUrl);
        const targetPage = project.storyPages[target];
        if (targetPage && dims) {
          setPageDimsMap((prev) => ({
            ...prev,
            [targetPage.id]: {
              url: dataUrl,
              width: dims.width,
              height: dims.height,
            },
          }));
        }
        setProject((prev) => ({
          ...prev,
          storyPages: prev.storyPages.map((p, idx) =>
            idx === target ? { ...p, imageUrl: dataUrl, fileName: file.name } : p
          ),
        }));
      }
      toast.success(isAr ? 'تم تحديث الصورة بنجاح' : 'Image updated');
    } catch {
      toast.error(isAr ? 'تعذر قراءة الصورة' : 'Could not read image');
    }
  };

  const moveStoryPage = (fromIndex: number, toIndex: number) => {
    if (
      toIndex < 0 ||
      toIndex >= project.storyPages.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    setProject((prev) => {
      const copy = [...prev.storyPages];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return { ...prev, storyPages: copy };
    });
    setActiveStoryIndex(toIndex);
  };

  const updateStoryPage = (idx: number, patch: Partial<ComposerStoryPage>) => {
    setIsStarterDemo(false);
    setProject((prev) => ({
      ...prev,
      storyPages: prev.storyPages.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    }));
  };

  const handleAddEmptyPage = () => {
    setIsStarterDemo(false);
    const nextIdx = project.storyPages.length;
    setProject((prev) => ({
      ...prev,
      storyPages: [
        ...prev.storyPages,
        {
          id: createPageId(),
          imageUrl: STARTER_ARTWORK[nextIdx % STARTER_ARTWORK.length],
          fileName: `scene-${String(nextIdx + 1).padStart(2, '0')}.jpg`,
          text:
            prev.direction === 'rtl'
              ? `مشهد جديد في مغامرة ${prev.childName}...`
              : `A new magical moment in ${prev.childName}'s story...`,
          layoutOverride: 'default',
          overlayPosition: 'bottom',
        },
      ],
    }));
    setActiveStoryIndex(nextIdx);
  };

  const handleDeletePage = (idx: number) => {
    setIsStarterDemo(false);
    setProject((prev) => ({
      ...prev,
      storyPages: prev.storyPages.filter((_, i) => i !== idx),
    }));
  };

  const handleClearAllPages = () => {
    setIsStarterDemo(false);
    setProject((prev) => ({ ...prev, storyPages: [] }));
    setActiveStoryIndex(0);
    setActiveSheetIndex(0);
    toast.success(isAr ? 'تم مسح جميع صفحات القصة' : 'Cleared all story pages');
  };

  const updateAnatomy = (key: keyof BookAnatomyConfig, value: boolean) => {
    setProject((prev) => ({
      ...prev,
      anatomy: { ...prev.anatomy, [key]: value },
    }));
  };

  const runExport = async (mode: 'kdp_interior' | 'kdp_cover' | 'local_single') => {
    if (exportState.busy) return;
    setExportState({
      busy: true,
      kind: mode,
      completed: 0,
      total: 1,
      label: isAr ? 'جاري التجهيز...' : 'Preparing...',
    });

    const slug = sanitizeFileSlug(project.title || project.childName);
    const dpiTag = `${exportDpi}dpi`;

    try {
      let blob: Blob;
      let filename: string;

      const locale = isAr ? 'ar' : 'en';

      if (mode === 'kdp_interior') {
        blob = await exportKdpInteriorPdf(
          project,
          exportDpi,
          embedProofGuidesInPdf,
          (completed, total, label) =>
            setExportState({ busy: true, kind: mode, completed, total, label }),
          locale
        );
        const bleedTag = project.bleedEnabled ? '8.625x8.75-bleed' : '8.5x8.5-trim';
        filename = `${slug}-KDP-interior-${bleedTag}-${dpiTag}.pdf`;
      } else if (mode === 'kdp_cover') {
        blob = await exportKdpCoverWrapPdf(
          project,
          exportDpi,
          embedProofGuidesInPdf,
          (completed, total, label) =>
            setExportState({ busy: true, kind: mode, completed, total, label }),
          locale
        );
        filename = `${slug}-KDP-cover-wrap-${project.direction.toUpperCase()}-${dpiTag}.pdf`;
      } else {
        blob = await exportLocalPrintSinglePdf(
          project,
          exportDpi,
          embedProofGuidesInPdf,
          (completed, total, label) =>
            setExportState({ busy: true, kind: mode, completed, total, label }),
          locale
        );
        filename = `${slug}-LocalPrint-8.5x8.5-FullBook-${dpiTag}.pdf`;
      }

      triggerBlobDownload(blob, filename);
      toast.success(
        isAr
          ? `تم توليد وتنزيل الملف بنجاح: ${filename}`
          : `PDF exported successfully: ${filename}`
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isAr
          ? 'تعذر تصدير ملف PDF'
          : 'Failed to export PDF'
      );
    } finally {
      setExportState({ busy: false, kind: '', completed: 0, total: 0, label: '' });
    }
  };

  const activeStoryPage = project.storyPages[activeStoryIndex] ?? null;
  const activeSheet = expanded.sheets[activeSheetIndex] ?? null;
  const localTotalPages =
    (project.anatomy.includeFrontCover ? 1 : 0) +
    expanded.sheets.length +
    (project.anatomy.includeBackCover ? 1 : 0);
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[min(100%,108rem)] mx-auto">
        {/* Top Header & Quick Export Actions */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 border-white/10 space-y-5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/25 to-pink-500/20 border border-cyan-400/35 flex items-center justify-center shrink-0">
                <BookCopy className="w-6 h-6 text-cyan-300" aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-editorial leading-tight">
                    {isAr
                      ? 'صانع كتب PDF الاحترافي — مقاس 8.5×8.5 إنش'
                      : 'KDP 8.5" × 8.5" PDF Book Composer'}
                  </h1>
                  <Badge className="bg-cyan-500/15 text-cyan-200 border border-cyan-400/35 rounded-full font-numeric">
                    Amazon KDP &amp; Local Print
                  </Badge>
                </div>
                <p className="text-sm text-slate-300 mt-1">
                  {isAr
                    ? 'ارفع رسوماتك دفعة واحدة، رتّب الصفحات، فعّل الغلاف والإهداء والختام، وصدّر ملفات PDF جاهزة لأمازون KDP أو المطابع المحلية بدقة 300 DPI.'
                    : 'Bulk-upload illustrations, arrange spreads, toggle front/dedication/keepsake/back anatomy, and export press-ready 8.5" × 8.5" KDP or local print PDFs.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="/docs/BUBBLEVERSE_FIRST_STORY_PLAYBOOK.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-cyan-400/25 text-xs font-semibold text-cyan-200 transition-colors"
              >
                <FileText className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                <span>{isAr ? 'دليل أول قصة PDF' : 'First Story Playbook PDF'}</span>
              </a>

              <Link
                to="/admin/studio"
                className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Wand2 className="w-4 h-4 text-purple-300" aria-hidden="true" />
                <span>{isAr ? 'استوديو القصص' : 'Story Studio'}</span>
              </Link>

              <Button
                type="button"
                disabled={exportState.busy || expanded.sheets.length === 0}
                onClick={() => void runExport('kdp_interior')}
                className="bubble-btn bubble-btn-primary h-11 px-4 text-xs font-bold gap-2"
              >
                {exportState.busy && exportState.kind === 'kdp_interior' ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <FileOutput className="w-4 h-4" aria-hidden="true" />
                )}
                <span>
                  {isAr ? 'تصدير KDP الداخلي' : 'Export KDP Interior PDF'}
                </span>
              </Button>

              <Button
                type="button"
                disabled={exportState.busy}
                onClick={() => void runExport('kdp_cover')}
                className="bubble-btn bubble-btn-secondary h-11 px-4 text-xs font-bold gap-2"
              >
                {exportState.busy && exportState.kind === 'kdp_cover' ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Layers className="w-4 h-4" aria-hidden="true" />
                )}
                <span>
                  {isAr ? 'تصدير غلاف KDP الكامل' : 'Export KDP Cover Wrap'}
                </span>
              </Button>

              <Button
                type="button"
                disabled={exportState.busy || localTotalPages === 0}
                onClick={() => void runExport('local_single')}
                className="bubble-btn bubble-btn-emerald h-11 px-4 text-xs font-bold gap-2"
              >
                {exportState.busy && exportState.kind === 'local_single' ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="w-4 h-4" aria-hidden="true" />
                )}
                <span>
                  {isAr ? 'ملف واحد للمطبعة المحلية' : 'Local Print Single PDF'}
                </span>
              </Button>
            </div>
          </div>

          {/* Export Live Progress Strip */}
          {exportState.busy && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-2xl bg-cyan-500/10 border border-cyan-400/35 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-cyan-100 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-300 shrink-0" />
                <span>
                  {isAr ? 'جاري تجهيز صفحات PDF بدقة عالية:' : 'Rendering high-resolution PDF:'}{' '}
                  {exportState.label}
                </span>
              </div>
              <div className="flex items-center gap-3 min-w-[200px]">
                <div className="flex-1 h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 transition-all duration-150"
                    style={{
                      width: `${Math.round(
                        (exportState.completed / Math.max(1, exportState.total)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-numeric text-cyan-200 font-bold">
                  {exportState.completed}/{exportState.total}
                </span>
              </div>
            </div>
          )}

          {/* Vault Hydration Live Strip */}
          {isHydratingDraft && !exportState.busy && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-2xl bg-purple-500/10 border border-purple-400/30 p-3 flex items-center gap-2.5 text-xs text-purple-100 font-semibold"
            >
              <Loader2 className="w-4 h-4 animate-spin text-purple-300 shrink-0" aria-hidden="true" />
              <span>
                {isAr
                  ? 'جاري استعادة اللوحات الأصلية بدقة 300 DPI من الخزنة...'
                  : 'Hydrating full-resolution 300 DPI illustrations from vault...'}
              </span>
            </div>
          )}

          {/* Source Loader Bar: Pull from Order or Studio Draft */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-white/10">
            <div className="space-y-1.5">
              <label
                htmlFor="kdp-order-select"
                className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
              >
                <FolderOpen className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                {isAr ? 'استيراد من طلب عميل' : 'Pull from Customer Order'}
              </label>
              <select
                id="kdp-order-select"
                value={selectedOrderId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedOrderId(id);
                  const found = orders.find((o) => o.id === id);
                  if (found) void loadFromOrder(found);
                }}
                className="w-full h-11 rounded-xl bg-slate-900/90 border border-white/15 px-3 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="">
                  {isAr ? '— اختر طلباً محفوظاً —' : '— Select an existing order —'}
                </option>
                {orders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.reference} • {ord.items[0]?.childName || ord.customerName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="kdp-draft-select"
                className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-purple-300" aria-hidden="true" />
                {isAr ? 'استيراد من مسودة الاستوديو' : 'Pull from Story Studio Draft'}
              </label>
              <select
                id="kdp-draft-select"
                value={selectedDraftKey}
                onChange={(e) => {
                  const key = e.target.value;
                  setSelectedDraftKey(key);
                  const found = drafts.find((d) => d.key === key);
                  if (found) void loadFromStudioDraft(found);
                }}
                className="w-full h-11 rounded-xl bg-slate-900/90 border border-white/15 px-3 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="">
                  {isAr ? '— اختر مسودة استوديو —' : '— Select a Studio draft —'}
                </option>
                {drafts.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.storyTitle} ({d.pages.length}p)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="kdp-book-title" className="text-xs font-semibold text-slate-300">
                {isAr ? 'عنوان الكتاب' : 'Book Title'}
              </label>
              <Input
                id="kdp-book-title"
                value={project.title}
                onChange={(e) =>
                  setProject((prev) => ({
                    ...prev,
                    title: e.target.value,
                    spineTitle: e.target.value,
                  }))
                }
                className="h-11 rounded-xl bg-slate-900/80 border-white/15 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="kdp-child-name" className="text-xs font-semibold text-slate-300">
                {isAr ? 'اسم الطفل البطل' : 'Child Hero Name'}
              </label>
              <Input
                id="kdp-child-name"
                value={project.childName}
                onChange={(e) =>
                  setProject((prev) => ({ ...prev, childName: e.target.value }))
                }
                className="h-11 rounded-xl bg-slate-900/80 border-white/15 text-white"
              />
            </div>
          </div>
        </div>

        {/* Main 2-Column Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left/Start Control Workbench (5 cols) */}
          <div className="xl:col-span-5 space-y-5">
            <Tabs defaultValue="pages" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12 rounded-2xl bg-slate-900/85 border border-white/10 p-1">
                <TabsTrigger
                  value="pages"
                  className="rounded-xl text-xs font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/25 data-[state=active]:to-purple-500/25 data-[state=active]:text-white"
                >
                  <ImageIcon className="w-4 h-4 me-1.5" aria-hidden="true" />
                  {isAr ? `الصفحات (${project.storyPages.length})` : `Pages (${project.storyPages.length})`}
                </TabsTrigger>
                <TabsTrigger
                  value="anatomy"
                  className="rounded-xl text-xs font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/25 data-[state=active]:to-purple-500/25 data-[state=active]:text-white"
                >
                  <BookOpen className="w-4 h-4 me-1.5" aria-hidden="true" />
                  {isAr ? 'هيكل الكتاب' : 'Anatomy'}
                </TabsTrigger>
                <TabsTrigger
                  value="specs"
                  className="rounded-xl text-xs font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/25 data-[state=active]:to-purple-500/25 data-[state=active]:text-white"
                >
                  <Ruler className="w-4 h-4 me-1.5" aria-hidden="true" />
                  {isAr ? 'مواصفات KDP' : 'KDP Specs'}
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: BULK UPLOAD & PAGE ORGANIZER */}
              <TabsContent value="pages" className="space-y-4 mt-4">
                {/* Book Default Layout Template Selector */}
                <div className="glass-card-inner p-4 space-y-3 border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
                      <LayoutTemplate className="w-4 h-4" aria-hidden="true" />
                      {isAr ? 'قالب الصفحات الافتراضي للكتاب' : 'Default Interior Page Template'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isAr ? 'قابل للتخصيص لكل صفحة' : 'Overridable per page'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(
                      [
                        {
                          id: 'full_bleed_overlay',
                          ar: 'لوحة + صندوق نص',
                          en: 'Full-Bleed + Text',
                          subAr: 'صورة كاملة مع نص فوقها',
                          subEn: 'Edge-to-edge + card',
                        },
                        {
                          id: 'split_spread',
                          ar: 'صفحتان متقابلتان',
                          en: 'Split Spread',
                          subAr: 'رسم بصفحة + نص بمقابلها',
                          subEn: 'Art left + Text right',
                        },
                        {
                          id: 'full_bleed_clean',
                          ar: 'لوحة صافية فقط',
                          en: 'Artwork Only',
                          subAr: 'بدون نص مضاف',
                          subEn: 'Pre-lettered art',
                        },
                      ] as const
                    ).map((tpl) => {
                      const active = project.defaultTemplate === tpl.id;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() =>
                            setProject((prev) => ({ ...prev, defaultTemplate: tpl.id }))
                          }
                          className={`text-start p-3 rounded-xl border transition-all min-h-[62px] ${
                            active
                              ? 'bg-cyan-500/15 border-cyan-400/60 text-white shadow-[0_0_16px_rgba(0,217,255,0.16)]'
                              : 'bg-slate-900/70 border-white/10 text-slate-300 hover:border-white/25'
                          }`}
                        >
                          <div className="text-xs font-bold">{isAr ? tpl.ar : tpl.en}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {isAr ? tpl.subAr : tpl.subEn}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bulk Drag & Drop Uploader */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files?.length) {
                      void handleBulkFiles(e.dataTransfer.files);
                    }
                  }}
                  className={`rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
                    isDragOver
                      ? 'border-cyan-400 bg-cyan-500/15'
                      : 'border-white/20 bg-slate-900/55 hover:border-cyan-400/50'
                  }`}
                >
                  <input
                    ref={bulkInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        void handleBulkFiles(e.target.files);
                      }
                      e.target.value = '';
                    }}
                  />
                  <Upload className="w-8 h-8 text-cyan-300 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm font-bold text-white">
                    {isAr
                      ? 'اسحب وأفلت صور القصة هنا دفعة واحدة (15–24 صورة)'
                      : 'Drag & Drop All Story Illustrations Here (15–24 images)'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAr
                      ? 'يتم ترتيب الصور تلقائياً حسب الأرقام في أسماء الملفات (page-1, page-2 ... page-20)'
                      : 'Auto-sorted naturally by filename number (page-1, page-2 … page-20)'}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
                    <div className="inline-flex rounded-full bg-slate-950/80 border border-white/10 p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setBulkMode('append')}
                        className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
                          bulkMode === 'append'
                            ? 'bg-cyan-500/25 text-cyan-200'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {isAr ? 'إضافة كصفحات جديدة' : 'Append Pages'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkMode('replace')}
                        className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${
                          bulkMode === 'replace'
                            ? 'bg-purple-500/25 text-purple-200'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {isAr ? 'استبدال الصور مع إبقاء النص' : 'Replace Art (Keep Text)'}
                      </button>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => bulkInputRef.current?.click()}
                      className="bubble-btn-outline h-9 px-4 text-xs font-bold gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                      {isAr ? 'اختيار صور من الجهاز' : 'Browse Images'}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddEmptyPage}
                      className="h-9 px-3 rounded-full border-white/15 bg-white/5 text-xs text-slate-200 hover:bg-white/10 gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      {isAr ? 'صفحة' : 'Add Page'}
                    </Button>

                    {project.storyPages.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleClearAllPages}
                        className="h-9 px-3 rounded-full border-red-400/25 bg-red-500/10 text-xs text-red-200 hover:bg-red-500/20 gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        {isAr ? 'مسح الكل' : 'Clear All'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Ordered Story Pages List (Drag or Button Reorder) */}
                <div className="glass-card-inner p-3.5 space-y-2 border-white/10 max-h-[340px] overflow-y-auto">
                  {project.storyPages.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      {isAr
                        ? 'لا توجد صفحات قصة بعد. ارفع صورك بالأعلى للبدء.'
                        : 'No story pages yet. Bulk-upload illustrations above to begin.'}
                    </p>
                  ) : (
                    project.storyPages.map((pg, idx) => {
                      const isActive = idx === activeStoryIndex;
                      const dims =
                        pageDimsMap[pg.id]?.url === pg.imageUrl ? pageDimsMap[pg.id] : null;
                      const resCheck = dims
                        ? checkImagePrintReadiness(dims.width, dims.height)
                        : null;
                      const resBadge = resCheck ? getResolutionBadgeMeta(resCheck, isAr) : null;
                      return (
                        <div
                          key={pg.id}
                          draggable
                          onDragStart={() => setDraggedPageIdx(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedPageIdx !== null) {
                              moveStoryPage(draggedPageIdx, idx);
                              setDraggedPageIdx(null);
                            }
                          }}
                          onClick={() => {
                            setActiveStoryIndex(idx);
                            // Jump preview to the first expanded sheet matching this story page
                            const sheetIdx = expanded.sheets.findIndex(
                              (s) => 'storyPageIndex' in s && s.storyPageIndex === idx
                            );
                            if (sheetIdx >= 0) {
                              setPreviewTab('interior');
                              setActiveSheetIndex(sheetIdx);
                            }
                          }}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                            isActive
                              ? 'bg-cyan-500/15 border-cyan-400/50'
                              : 'bg-slate-900/65 border-white/10 hover:border-white/25'
                          }`}
                        >
                          <GripVertical
                            className="w-4 h-4 text-slate-500 shrink-0 cursor-grab"
                            aria-hidden="true"
                          />
                          <img
                            src={pg.imageUrl}
                            alt={`Scene ${idx + 1}`}
                            onLoad={(e) => {
                              const natW = e.currentTarget.naturalWidth;
                              const natH = e.currentTarget.naturalHeight;
                              if (natW > 0 && natH > 0) {
                                setPageDimsMap((prev) => {
                                  const existing = prev[pg.id];
                                  if (
                                    existing &&
                                    existing.url === pg.imageUrl &&
                                    existing.width === natW &&
                                    existing.height === natH
                                  ) {
                                    return prev;
                                  }
                                  return {
                                    ...prev,
                                    [pg.id]: { url: pg.imageUrl, width: natW, height: natH },
                                  };
                                });
                              }
                            }}
                            className="w-11 h-11 rounded-lg object-cover border border-white/15 shrink-0 bg-slate-950"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white font-numeric">
                                #{idx + 1}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                                {pg.fileName || (isAr ? 'مشهد مخصص' : 'Custom Scene')}
                              </span>
                              {resBadge && dims && (
                                <span
                                  title={`${resBadge.fullLabel} (${dims.width}×${dims.height}px)`}
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold font-numeric shrink-0 ${resBadge.className}`}
                                >
                                  {resBadge.shortLabel}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 truncate mt-0.5">
                              {pg.text || (isAr ? 'بدون نص مضاف' : 'No overlay text')}
                            </p>
                          </div>

                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              title={isAr ? 'تعيين كصورة الغلاف الأمامي' : 'Use as Front Cover'}
                              aria-label={isAr ? 'تعيين كصورة الغلاف الأمامي' : 'Use as Front Cover'}
                              onClick={() => {
                                setProject((prev) => ({
                                  ...prev,
                                  frontCoverImageUrl: pg.imageUrl,
                                }));
                                toast.success(
                                  isAr
                                    ? `تم تعيين المشهد #${idx + 1} كصورة الغلاف الأمامي`
                                    : `Set Scene #${idx + 1} as Front Cover`
                                );
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                project.frontCoverImageUrl === pg.imageUrl
                                  ? 'bg-amber-400/20 text-amber-300'
                                  : 'bg-white/5 hover:bg-white/15 text-slate-300'
                              }`}
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={isAr ? 'نقل لأعلى' : 'Move page up'}
                              disabled={idx === 0}
                              onClick={() => moveStoryPage(idx, idx - 1)}
                              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-slate-200"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={isAr ? 'نقل لأسفل' : 'Move page down'}
                              disabled={idx === project.storyPages.length - 1}
                              onClick={() => moveStoryPage(idx, idx + 1)}
                              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-slate-200"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={isAr ? 'حذف الصفحة' : 'Delete page'}
                              onClick={() => handleDeletePage(idx)}
                              className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/25 flex items-center justify-center text-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected Story Page Inspector */}
                {activeStoryPage && (() => {
                  const activeDims =
                    pageDimsMap[activeStoryPage.id]?.url === activeStoryPage.imageUrl
                      ? pageDimsMap[activeStoryPage.id]
                      : null;
                  const activeRes = activeDims
                    ? checkImagePrintReadiness(activeDims.width, activeDims.height)
                    : null;
                  const activeBadge = activeRes
                    ? getResolutionBadgeMeta(activeRes, isAr)
                    : null;

                  return (
                  <div className="glass-card-inner p-4 space-y-3 border-cyan-400/25">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs font-bold text-cyan-200">
                          {isAr
                            ? `تعديل المشهد #${activeStoryIndex + 1}`
                            : `Edit Scene #${activeStoryIndex + 1}`}
                        </h3>
                        {activeBadge && activeDims && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-numeric ${activeBadge.className}`}
                          >
                            <span>{activeBadge.shortLabel}</span>
                            <span className="opacity-80">
                              ({activeDims.width}×{activeDims.height})
                            </span>
                          </span>
                        )}
                      </div>
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 cursor-pointer px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30">
                        <Upload className="w-4 h-4" aria-hidden="true" />
                        <span>{isAr ? 'تبديل الصورة' : 'Replace Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            void handleSingleImageUpload(activeStoryIndex, e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-300 font-semibold">
                          {isAr ? 'قالب هذه الصفحة' : 'Per-Page Template'}
                        </label>
                        <select
                          value={activeStoryPage.layoutOverride}
                          onChange={(e) =>
                            updateStoryPage(activeStoryIndex, {
                              layoutOverride: e.target.value as PageLayoutOverride,
                            })
                          }
                          className="w-full h-10 rounded-xl bg-slate-900 border border-white/15 px-2.5 text-xs text-white"
                        >
                          <option value="default">
                            {isAr ? 'افتراضي الكتاب' : 'Use Book Default'}
                          </option>
                          <option value="full_bleed_overlay">
                            {isAr ? 'لوحة + صندوق نص' : 'Full-Bleed + Text Box'}
                          </option>
                          <option value="split_spread">
                            {isAr ? 'صفحتان متقابلتان' : 'Classic Split Spread'}
                          </option>
                          <option value="full_bleed_clean">
                            {isAr ? 'لوحة صافية فقط' : 'Artwork Only (No Text)'}
                          </option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-300 font-semibold">
                          {isAr ? 'موضع صندوق النص' : 'Overlay Box Position'}
                        </label>
                        <select
                          value={activeStoryPage.overlayPosition}
                          onChange={(e) =>
                            updateStoryPage(activeStoryIndex, {
                              overlayPosition: e.target.value as TextOverlayPosition,
                            })
                          }
                          className="w-full h-10 rounded-xl bg-slate-900 border border-white/15 px-2.5 text-xs text-white"
                        >
                          <option value="bottom">{isAr ? 'أسفل الصورة' : 'Bottom Overlay'}</option>
                          <option value="top">{isAr ? 'أعلى الصورة' : 'Top Overlay'}</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300 font-semibold">
                        {isAr ? 'نص الصفحة' : 'Story Page Text'}
                      </label>
                      <Textarea
                        rows={3}
                        dir={project.direction}
                        value={activeStoryPage.text}
                        onChange={(e) =>
                          updateStoryPage(activeStoryIndex, { text: e.target.value })
                        }
                        placeholder={
                          isAr
                            ? 'اكتب نص هذا المشهد هنا (أو اتركه فارغاً لقالب اللوحة الصافية)...'
                            : 'Enter story text for this scene (leave blank for artwork-only)...'
                        }
                        className="rounded-xl bg-slate-900/90 border-white/15 text-xs sm:text-sm text-white"
                      />
                    </div>
                  </div>
                  );
                })()}
              </TabsContent>

              {/* TAB 2: AUTOMATED BOOK ANATOMY */}
              <TabsContent value="anatomy" className="space-y-4 mt-4">
                <div className="glass-card-inner p-4 space-y-3 border-white/10">
                  <h3 className="text-xs font-bold text-cyan-200">
                    {isAr ? 'مكونات الكتاب التلقائية (تفعيل/إيقاف)' : 'Automated Book Anatomy'}
                  </h3>

                  {(
                    [
                      {
                        key: 'includeFrontCover',
                        ar: '1. الغلاف الأمامي (اسم الطفل + عنوان القصة)',
                        en: '1. Front Cover (Child Name & Story Title)',
                      },
                      {
                        key: 'includeDedication',
                        ar: '2. صفحة الإهداء الشخصي (رسالة الهدية + صورة الطفل)',
                        en: '2. Personalized Dedication Page (Gift Note + Photo)',
                      },
                      {
                        key: 'includeStoryPages',
                        ar: '3. صفحات القصة المرتّبة من الصور المرفوعة',
                        en: '3. Ordered Story Pages from Bulk Upload',
                      },
                      {
                        key: 'includeKeepsakeEnding',
                        ar: '4. صفحة الختام والتذكار ("النهاية" + رسالة فخر)',
                        en: '4. Closing Keepsake Page ("The End" + Proud Message)',
                      },
                      {
                        key: 'includeBackCover',
                        ar: '5. الغلاف الخلفي (نبذة + شعار بابل فيرس)',
                        en: '5. Back Cover (Blurb + Bubbleverse Branding)',
                      },
                      {
                        key: 'includeBarcodeBox',
                        ar: 'مساحة الباركود / QR الآمنة (2.0" × 1.2")',
                        en: 'KDP Barcode / QR Safe Box (2.0" × 1.2")',
                      },
                    ] as const
                  ).map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between gap-3 py-1.5 border-b border-white/5 last:border-b-0"
                    >
                      <span className="text-xs text-slate-200 font-medium">
                        {isAr ? row.ar : row.en}
                      </span>
                      <Switch
                        checked={project.anatomy[row.key]}
                        onCheckedChange={(checked) => updateAnatomy(row.key, checked)}
                      />
                    </div>
                  ))}
                </div>

                {/* Front Cover Details */}
                {project.anatomy.includeFrontCover && (
                  <div className="glass-card-inner p-4 space-y-3 border-white/10">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">
                        {isAr ? 'إعدادات الغلاف الأمامي' : 'Front Cover Details'}
                      </h4>
                      <label className="text-[11px] font-semibold text-cyan-300 cursor-pointer hover:underline">
                        {isAr ? 'رفع صورة غلاف مخصصة' : 'Upload Cover Art'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            void handleSingleImageUpload('front_cover', e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                    <Input
                      value={project.frontCoverBadge}
                      onChange={(e) =>
                        setProject((prev) => ({ ...prev, frontCoverBadge: e.target.value }))
                      }
                      placeholder={isAr ? 'شارة أعلى الغلاف' : 'Top cover badge'}
                      className="h-10 rounded-xl bg-slate-900/80 border-white/15 text-xs text-white"
                    />
                    <Input
                      value={project.subtitle}
                      onChange={(e) =>
                        setProject((prev) => ({ ...prev, subtitle: e.target.value }))
                      }
                      placeholder={isAr ? 'عنوان فرعي اختياري' : 'Optional cover subtitle'}
                      className="h-10 rounded-xl bg-slate-900/80 border-white/15 text-xs text-white"
                    />
                  </div>
                )}

                {/* Dedication Page Details */}
                {project.anatomy.includeDedication && (
                  <div className="glass-card-inner p-4 space-y-3 border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white">
                        {isAr ? 'صفحة الإهداء الشخصي' : 'Personalized Dedication'}
                      </h4>
                      <div className="flex items-center gap-2">
                        {project.childPhotoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setProject((prev) => ({ ...prev, childPhotoUrl: null }))
                            }
                            className="text-[11px] text-red-300 hover:underline"
                          >
                            {isAr ? 'إزالة الصورة' : 'Remove Photo'}
                          </button>
                        )}
                        <label className="text-[11px] font-semibold text-cyan-300 cursor-pointer hover:underline">
                          {isAr ? 'رفع صورة الطفل' : 'Upload Child Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              void handleSingleImageUpload('child_photo', e.target.files?.[0]);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <Input
                      value={project.dedicationTitle}
                      onChange={(e) =>
                        setProject((prev) => ({ ...prev, dedicationTitle: e.target.value }))
                      }
                      className="h-10 rounded-xl bg-slate-900/80 border-white/15 text-xs text-white"
                    />
                    <Textarea
                      rows={3}
                      dir={project.direction}
                      value={project.dedicationMessage}
                      onChange={(e) =>
                        setProject((prev) => ({ ...prev, dedicationMessage: e.target.value }))
                      }
                      className="rounded-xl bg-slate-900/80 border-white/15 text-xs text-white"
                    />
                    <Input
                      value={project.dedicationFrom}
                      onChange={(e) =>
                        setProject((prev) => ({ ...prev, dedicationFrom: e.target.value }))
                      }
                      placeholder={isAr ? 'التوقيع (مثلاً: ماما وبابا)' : 'From signature'}
                      className="h-10 rounded-xl bg-slate-900/80 border-white/15 text-xs text-white"
                    />
                  </div>
                )}

                {/* Keepsake & Back Cover */}
                <div className="glass-card-inner p-4 space-y-3 border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-white">
                      {isAr ? 'صفحة الختام والغلاف الخلفي' : 'Closing Keepsake & Back Cover'}
                    </h4>
                    <div className="flex items-center gap-2">
                      {project.backCoverImageUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setProject((prev) => ({ ...prev, backCoverImageUrl: undefined }))
                          }
                          className="text-[11px] text-red-300 hover:underline"
                        >
                          {isAr ? 'إزالة الخلفية' : 'Remove Art'}
                        </button>
                      )}
                      <label className="text-[11px] font-semibold text-cyan-300 cursor-pointer hover:underline">
                        {isAr ? 'رفع صورة الغلاف الخلفي' : 'Upload Back Cover Art'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            void handleSingleImageUpload('back_cover', e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <Input
                    value={project.keepsakeTitle}
                    onChange={(e) =>
                      setProject((prev) => ({ ...prev, keepsakeTitle: e.target.value }))
                    }
                    placeholder={isAr ? 'عنوان صفحة الختام' : 'Keepsake title'}
                    className="h-10 rounded-xl bg-slate-900/80 border-white/15 text-xs text-white"
                  />
                  <Textarea
                    rows={2}
                    dir={project.direction}
                    value={project.keepsakeMessage}
                    onChange={(e) =>
                      setProject((prev) => ({ ...prev, keepsakeMessage: e.target.value }))
                    }
                    className="rounded-xl bg-slate-900/80 border-white/15 text-xs text-white"
                  />
                  <Textarea
                    rows={2}
                    dir={project.direction}
                    value={project.backCoverBlurb}
                    onChange={(e) =>
                      setProject((prev) => ({ ...prev, backCoverBlurb: e.target.value }))
                    }
                    placeholder={isAr ? 'نبذة الغلاف الخلفي' : 'Back cover blurb'}
                    className="rounded-xl bg-slate-900/80 border-white/15 text-xs text-white"
                  />
                  <Input
                    value={project.barcodeLabel}
                    onChange={(e) =>
                      setProject((prev) => ({ ...prev, barcodeLabel: e.target.value }))
                    }
                    placeholder="ISBN / QR Label"
                    className="h-10 rounded-xl bg-slate-900/80 border-white/15 text-xs text-white font-numeric"
                  />
                </div>
              </TabsContent>

              {/* TAB 3: AMAZON KDP & LOCAL PRINT SPECS */}
              <TabsContent value="specs" className="space-y-4 mt-4">
                <div className="glass-card-inner p-4 space-y-4 border-white/10">
                  <h3 className="text-xs font-bold text-cyan-200">
                    {isAr
                      ? 'إعدادات مقاس 8.5×8.5 إنش واتجاه التجليد'
                      : '8.5" × 8.5" Print Geometry & Binding'}
                  </h3>

                  {/* Direction RTL vs LTR */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-300 font-semibold">
                      {isAr ? 'اتجاه تجليد وتصفّح الكتاب' : 'Book Binding Direction'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { id: 'rtl', ar: 'عربي RTL (من اليمين لليسار)', en: 'Arabic RTL (Right-to-Left)' },
                          { id: 'ltr', ar: 'إنجليزي LTR (من اليسار لليمين)', en: 'English LTR (Left-to-Right)' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setProject((prev) => ({ ...prev, direction: opt.id }))
                          }
                          className={`h-11 px-3 rounded-xl border text-xs font-bold transition-all ${
                            project.direction === opt.id
                              ? 'bg-cyan-500/20 border-cyan-400/60 text-white'
                              : 'bg-slate-900/70 border-white/10 text-slate-300'
                          }`}
                        >
                          {isAr ? opt.ar : opt.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bleed Toggle */}
                  <div className="flex items-center justify-between gap-3 py-2 border-y border-white/10">
                    <div>
                      <div className="text-xs font-bold text-white">
                        {isAr ? 'تفعيل هوامش القص KDP Full Bleed' : 'KDP Full Bleed (+0.125")'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-numeric">
                        {project.bleedEnabled
                          ? '8.625" × 8.75" (219.08 × 222.25 mm)'
                          : '8.500" × 8.500" (215.90 × 215.90 mm)'}
                      </div>
                    </div>
                    <Switch
                      checked={project.bleedEnabled}
                      onCheckedChange={(checked) =>
                        setProject((prev) => ({ ...prev, bleedEnabled: checked }))
                      }
                    />
                  </div>

                  {/* Binding Type + Paper Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 font-semibold">
                        {isAr ? 'نوع التغليف' : 'Binding Type'}
                      </label>
                      <select
                        value={project.bindingType}
                        onChange={(e) =>
                          setProject((prev) => ({
                            ...prev,
                            bindingType: e.target.value as BindingType,
                          }))
                        }
                        className="w-full h-11 rounded-xl bg-slate-900 border border-white/15 px-3 text-xs text-white"
                      >
                        <option value="paperback">
                          {isAr ? 'غلاف ناعم Paperback (0.125" bleed)' : 'Paperback (0.125" bleed)'}
                        </option>
                        <option value="hardcover">
                          {isAr ? 'غلاف مقوّى Hardcover (0.591" wrap)' : 'Hardcover Casewrap (0.591" wrap)'}
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 font-semibold">
                        {isAr ? 'ثيم الصفحات النصية' : 'Editorial Paper Theme'}
                      </label>
                      <select
                        value={project.interiorTheme}
                        onChange={(e) =>
                          setProject((prev) => ({
                            ...prev,
                            interiorTheme: e.target.value as InteriorTheme,
                          }))
                        }
                        className="w-full h-11 rounded-xl bg-slate-900 border border-white/15 px-3 text-xs text-white"
                      >
                        <option value="cream_paper">
                          {isAr ? 'ورق كريمي دافئ (للقراءة)' : 'Warm Storybook Cream'}
                        </option>
                        <option value="midnight_magic">
                          {isAr ? 'سحر منتصف الليل (داكن)' : 'Midnight Magic Dark'}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="kdp-paper-stock" className="text-xs text-slate-300 font-semibold">
                      {isAr ? 'نوع الورق لحساب سُمك الكعب تلقائياً' : 'Paper Stock (Auto Spine Calculator)'}
                    </label>
                    <select
                      id="kdp-paper-stock"
                      value={project.paperStockId}
                      onChange={(e) =>
                        setProject((prev) => ({
                          ...prev,
                          paperStockId: e.target.value as PaperStockId,
                        }))
                      }
                      className="w-full h-11 rounded-xl bg-slate-900 border border-white/15 px-3 text-xs text-white"
                    >
                      {PAPER_STOCKS.map((stock) => (
                        <option key={stock.id} value={stock.id}>
                          {isAr ? stock.labelAr : stock.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 font-semibold">
                        {isAr ? 'تخصيص سُمك الكعب (إنش - اختياري)' : 'Custom Spine Override (in)'}
                      </label>
                      <Input
                        type="number"
                        step="0.005"
                        min="0.05"
                        max="2"
                        value={customSpineText}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setCustomSpineText(raw);
                          const parsed = Number.parseFloat(raw);
                          setProject((prev) => ({
                            ...prev,
                            customSpineInches:
                              Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
                          }));
                        }}
                        placeholder={`${coverDims.spineWidthInches.toFixed(3)}" (auto)`}
                        className="h-10 rounded-xl bg-slate-900 border-white/15 text-xs text-white font-numeric"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 font-semibold">
                        {isAr ? 'دقة التصدير (DPI)' : 'Export Resolution (DPI)'}
                      </label>
                      <select
                        value={exportDpi}
                        onChange={(e) =>
                          setExportDpi(Number(e.target.value) === 150 ? 150 : 300)
                        }
                        className="w-full h-10 rounded-xl bg-slate-900 border border-white/15 px-3 text-xs text-white font-numeric"
                      >
                        <option value={300}>
                          {isAr ? '300 DPI — طباعة احترافية (KDP Master)' : '300 DPI — Press Master (KDP)'}
                        </option>
                        <option value={150}>
                          {isAr ? '150 DPI — مسودة سريعة للواتساب' : '150 DPI — Fast WhatsApp Proof'}
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* KDP Auto-Pad + Proof Guides */}
                  <div className="space-y-2.5 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {isAr ? 'إكمال تلقائي إلى 24 صفحة (حد KDP الأدنى)' : 'Auto-Pad to 24 Pages (KDP Min)'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {isAr
                            ? 'يضيف صفحات تبطين هادئة للوصول لشرط أمازون 24 صفحة زوجية'
                            : 'Adds calm endpapers so KDP accepts the paperback interior'}
                        </div>
                      </div>
                      <Switch
                        checked={project.padToKdpMinimum}
                        onCheckedChange={(checked) =>
                          setProject((prev) => ({ ...prev, padToKdpMinimum: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {isAr ? 'طباعة خطوط القص والأمان في ملف PDF (للبروفة فقط)' : 'Embed Crop & Safe Guides in PDF (Proof Only)'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {isAr
                            ? 'اتركه مغلقاً عند التصدير النهائي للمطبعة أو KDP'
                            : 'Keep OFF for final print master upload'}
                        </div>
                      </div>
                      <Switch
                        checked={embedProofGuidesInPdf}
                        onCheckedChange={setEmbedProofGuidesInPdf}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Live KDP Preflight & Spine Calculator Summary Card */}
            <div className="glass-card rounded-3xl p-4 sm:p-5 border-white/10 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                  {isAr ? 'فحص الجاهزية وحاسبة الكعب الحية' : 'Live KDP Preflight & Spine Spec'}
                </span>
                {expanded.preflight.meetsKdpMinimum && expanded.preflight.isEvenPageCount ? (
                  <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 rounded-full text-[11px]">
                    <CheckCircle2 className="w-3 h-3 me-1" />
                    {isAr ? 'جاهز لـ KDP' : 'KDP Ready'}
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-200 border border-amber-400/40 rounded-full text-[11px]">
                    <AlertTriangle className="w-3 h-3 me-1" />
                    {isAr ? 'تنبيه ما قبل الطباعة' : 'Preflight Note'}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="rounded-xl bg-slate-900/75 border border-white/10 p-2.5">
                  <div className="text-[10px] text-slate-400">
                    {isAr ? 'مقاس الداخلي' : 'Interior Size'}
                  </div>
                  <div className="text-xs font-bold text-cyan-200 font-numeric mt-0.5">
                    {interiorDims.widthInches}" × {interiorDims.heightInches}"
                  </div>
                </div>
                <div className="rounded-xl bg-slate-900/75 border border-white/10 p-2.5">
                  <div className="text-[10px] text-slate-400">
                    {isAr ? 'الصفحات الداخلية' : 'Interior Pages'}
                  </div>
                  <div className="text-xs font-bold text-white font-numeric mt-0.5">
                    {expanded.preflight.interiorPageCount}p
                  </div>
                </div>
                <div className="rounded-xl bg-slate-900/75 border border-white/10 p-2.5">
                  <div className="text-[10px] text-slate-400">
                    {isAr ? 'سُمك الكعب' : 'Spine Width'}
                  </div>
                  <div className="text-xs font-bold text-amber-200 font-numeric mt-0.5">
                    {coverDims.spineWidthInches.toFixed(3)}" ({coverDims.spineWidthMm}mm)
                  </div>
                </div>
                <div className="rounded-xl bg-slate-900/75 border border-white/10 p-2.5">
                  <div className="text-[10px] text-slate-400">
                    {isAr ? 'غلاف KDP الكامل' : 'Cover Wrap'}
                  </div>
                  <div className="text-xs font-bold text-pink-200 font-numeric mt-0.5">
                    {coverDims.totalWidthInches.toFixed(2)}" × {coverDims.totalHeightInches.toFixed(2)}"
                  </div>
                </div>
              </div>

              {(() => {
                const baseWarnings = isAr
                  ? expanded.preflight.warningsAr
                  : expanded.preflight.warningsEn;
                const measuredPages = project.storyPages
                  .map((pg) => {
                    const d = pageDimsMap[pg.id]?.url === pg.imageUrl ? pageDimsMap[pg.id] : null;
                    return d ? checkImagePrintReadiness(d.width, d.height) : null;
                  })
                  .filter((check): check is PrintResolutionCheck => check !== null);
                const needsUpscaleCount = measuredPages.filter(
                  (c) => c.status !== 'print_300dpi'
                ).length;
                const allWarnings = [...baseWarnings];
                if (needsUpscaleCount > 0) {
                  allWarnings.push(
                    isAr
                      ? `${needsUpscaleCount} من ${measuredPages.length} لوحة دقتها أقل من 2500×2500 بكسل — يُنصح بالتكبير 2× قبل طباعة KDP 8.5×8.5 إنش بدقة 300 DPI.`
                      : `${needsUpscaleCount} of ${measuredPages.length} illustrations are under 2500×2500px — Upscale 2× is recommended before 300 DPI KDP 8.5"×8.5" printing.`
                  );
                }
                if (allWarnings.length === 0) return null;
                return (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-3 space-y-1.5">
                    {allWarnings.map((warn, i) => (
                      <p key={i} className="text-[11px] text-amber-100 leading-relaxed font-numeric">
                        • {warn}
                      </p>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right/End Live Interactive Preview Canvas (7 cols) */}
          <div className="xl:col-span-7 glass-card rounded-3xl p-5 sm:p-6 border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/75 border border-white/10 p-1 rounded-full">
                <button
                  type="button"
                  onClick={() => setPreviewTab('interior')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    previewTab === 'interior'
                      ? 'bg-cyan-500/25 text-cyan-100'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'معاينة الصفحات الداخلية' : 'Interior Pages'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('cover_wrap')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    previewTab === 'cover_wrap'
                      ? 'bg-purple-500/25 text-purple-100'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'غلاف KDP المفرود' : 'KDP Cover Wrap'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('front_back')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    previewTab === 'front_back'
                      ? 'bg-pink-500/25 text-pink-100'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'الغلاف الأمامي والخلفي' : 'Front / Back Cover'}
                </button>
              </div>

              <label className="inline-flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer shrink-0">
                <Eye className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">
                  {isAr ? 'إظهار خطوط القص والأمان' : 'Crop & Safe Guides'}
                </span>
                <span dir="ltr" className="inline-flex shrink-0">
                  <Switch
                    checked={showPreviewGuides}
                    onCheckedChange={setShowPreviewGuides}
                  />
                </span>
              </label>
            </div>

            {/* Guide Legend */}
            {showPreviewGuides && (
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 px-3 py-2 rounded-xl bg-slate-950/60 border border-white/10">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
                  {isAr ? 'خط القص Trim (8.5")' : 'Trim Line (8.5")'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-pink-400 inline-block" />
                  {isAr ? 'منطقة الأمان Safe (0.375")' : 'Safe Margin (0.375")'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-2 bg-amber-400/40 border border-amber-400 inline-block" />
                  {isAr ? 'منطقة الكعب/التجليد Gutter (0.5")' : 'Spine Gutter (0.5")'}
                </span>
              </div>
            )}

            {/* Canvas Stage */}
            <div className="rounded-2xl bg-[#050814] border border-white/10 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[480px]">
              {previewTab === 'interior' && (
                <>
                  {expanded.sheets.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      {isAr
                        ? 'فعّل صفحة واحدة على الأقل لمعاينة الكتاب.'
                        : 'Enable at least one interior page to preview.'}
                    </p>
                  ) : (
                    <>
                      <canvas
                        ref={interiorCanvasRef}
                        className="max-w-full max-h-[540px] w-auto h-auto rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.65)] border border-white/15"
                      />
                      <div className="mt-4 w-full flex flex-wrap items-center justify-between gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={activeSheetIndex <= 0}
                          onClick={() => setActiveSheetIndex((i) => Math.max(0, i - 1))}
                          className="h-10 px-4 rounded-full border-white/15 bg-white/5 text-xs text-white"
                        >
                          <PrevIcon className="w-4 h-4 me-1" />
                          {isAr ? 'السابق' : 'Previous'}
                        </Button>

                        <div className="text-center">
                          <div className="text-xs font-bold text-white">
                            {activeSheet
                              ? isAr
                                ? activeSheet.labelAr
                                : activeSheet.labelEn
                              : ''}
                          </div>
                          <div className="text-[11px] text-cyan-300 font-numeric">
                            {isAr
                              ? `صفحة ${activeSheetIndex + 1} من ${expanded.sheets.length} • ${interiorDims.widthInches}" × ${interiorDims.heightInches}"`
                              : `Sheet ${activeSheetIndex + 1} of ${expanded.sheets.length} • ${interiorDims.widthInches}" × ${interiorDims.heightInches}"`}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={activeSheetIndex >= expanded.sheets.length - 1}
                          onClick={() =>
                            setActiveSheetIndex((i) =>
                              Math.min(expanded.sheets.length - 1, i + 1)
                            )
                          }
                          className="h-10 px-4 rounded-full border-white/15 bg-white/5 text-xs text-white"
                        >
                          {isAr ? 'التالي' : 'Next'}
                          <NextIcon className="w-4 h-4 ms-1" />
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}

              {previewTab === 'cover_wrap' && (
                <>
                  <canvas
                    ref={coverWrapCanvasRef}
                    className="max-w-full max-h-[480px] w-auto h-auto rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.65)] border border-white/15"
                  />
                  <div className="mt-4 text-center space-y-1">
                    <div className="text-xs font-bold text-white">
                      {project.direction === 'rtl'
                        ? isAr
                          ? 'تخطيط الغلاف العربي RTL: الغلاف الأمامي (يسار) | الكعب (وسط) | الغلاف الخلفي (يمين)'
                          : 'Arabic RTL Cover Wrap: Front (Left) | Spine (Center) | Back (Right)'
                        : isAr
                        ? 'تخطيط الغلاف الإنجليزي LTR: الغلاف الخلفي (يسار) | الكعب (وسط) | الغلاف الأمامي (يمين)'
                        : 'English LTR Cover Wrap: Back (Left) | Spine (Center) | Front (Right)'}
                    </div>
                    <div className="text-[11px] text-cyan-300 font-numeric">
                      {coverDims.totalWidthInches.toFixed(3)}" × {coverDims.totalHeightInches.toFixed(3)}" (
                      {coverDims.totalWidthMm} × {coverDims.totalHeightMm} mm) • Spine:{' '}
                      {coverDims.spineWidthInches.toFixed(3)}"
                    </div>
                  </div>
                </>
              )}

              {previewTab === 'front_back' && (
                <>
                  <canvas
                    ref={standaloneCoverCanvasRef}
                    className="max-w-full max-h-[520px] w-auto h-auto rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.65)] border border-white/15"
                  />
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFrontBackSide('front')}
                      className={`h-10 px-4 rounded-full text-xs font-bold ${
                        frontBackSide === 'front'
                          ? 'bg-cyan-500/25 border-cyan-400/50 text-white'
                          : 'bg-white/5 border-white/15 text-slate-300'
                      }`}
                    >
                      {isAr ? 'الغلاف الأمامي' : 'Front Cover'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFrontBackSide('back')}
                      className={`h-10 px-4 rounded-full text-xs font-bold ${
                        frontBackSide === 'back'
                          ? 'bg-pink-500/25 border-pink-400/50 text-white'
                          : 'bg-white/5 border-white/15 text-slate-300'
                      }`}
                    >
                      {isAr ? 'الغلاف الخلفي + الباركود' : 'Back Cover + Barcode'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
