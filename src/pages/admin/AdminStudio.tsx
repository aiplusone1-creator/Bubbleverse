import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wand2,
  Printer,
  Copy,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  BookCopy,
  CheckCircle2,
  Circle,
  Download,
  Image as ImageIcon,
  Images,
  Eye,
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  Clock,
  Cpu,
  PlugZap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FolderClock,
  FileText,
  FileDown,
  MessageCircle,
  UserCheck,
  ClipboardCheck,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Lightbulb,
  HelpCircle,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import {
  deleteStudioDraft,
  getIntegrationsConfig,
  getOrders,
  getStudioDraft,
  listStudioDrafts,
  saveStudioDraft,
  updateOrderStatus,
  attachPhotoToOrder,
  THEME_PRESETS,
  detectStoryTheme,
  resolveThemeDna,
  type AiProviderKey,
  type CharacterDna,
  type CharacterSheetCandidate,
  type OrderRecord,
  type PromptEngineMode,
  type StoryThemeKey,
  type StudioDraftPage,
  type StudioDraftRecord,
  type StudioProductionChecklist,
} from '@/lib/localStore';
import { deletePhotoFromVault, getPhotoFromVault, savePhotoToVault } from '@/lib/photoVault';
import { generateStorybookPDFHTML } from '@/features/pdf/storybookTemplate';
import { sortFilesNaturally } from '@/features/pdf/kdpSpecs';
import {
  generateCharacterSheetCandidate,
  extractLikenessFromChildPhoto,
  LIKENESS_FEATURE_PRESETS,
  type LikenessPreset,
} from '@/features/studio/characterSheetEngine';
import { generateRealAiImage } from '@/features/studio/aiImageGenerator';
import { CharacterLikenessComparator } from '@/components/studio/CharacterLikenessComparator';
import {
  buildFullStoryArc,
  buildMasterCharacterSheetPrompt,
  buildProductionPromptPackText,
  buildStage2ScenePrompt,
  buildWhatsAppHelperMessages,
  checkImagePrintReadiness,
  countChecklistCompleted,
  createDefaultCharacterDna,
  createDefaultProductionChecklist,
  DEFAULT_STORY_FALLBACK_IMAGES,
  generateStoryWithConfiguredAi,
  reformatScenePromptForEngine,
  type PrintResolutionCheck,
} from '@/features/studio/stage2PromptEngine';

type StudioStep = 1 | 2 | 3 | 4;

const ART_STYLE_PRESETS = [
  {
    id: 'pixar',
    labelAr: 'ثلاثي الأبعاد سينمائي',
    labelEn: '3D Pixar Storybook',
    value: '3D Pixar Storybook, rich pastel lighting, expressive character features',
  },
  {
    id: 'watercolor',
    labelAr: 'ألوان مائية حالمة',
    labelEn: 'Dreamy Watercolor',
    value: 'Whimsical children book watercolor, soft paper grain, warm pastel glow',
  },
  {
    id: 'anime',
    labelAr: 'أنيمي خيالي',
    labelEn: 'Fantasy Anime',
    value: 'Studio Ghibli inspired fantasy storybook, vibrant sky light, crisp details',
  },
  {
    id: 'comic',
    labelAr: 'قصص مصورة مرحة',
    labelEn: 'Vibrant Comic',
    value: 'Vibrant children graphic novel illustration, clean ink outlines, bold colors',
  },
] as const;

const PROMPT_ENGINE_OPTIONS: ReadonlyArray<{
  id: PromptEngineMode;
  labelAr: string;
  labelEn: string;
  tagAr: string;
  tagEn: string;
}> = [
  {
    id: 'nano_banana',
    labelAr: 'Nano Banana / Gemini',
    labelEn: 'Nano Banana / Gemini',
    tagAr: 'الأساسي • 1:1',
    tagEn: 'Primary • 1:1',
  },
  {
    id: 'midjourney',
    labelAr: 'Midjourney --cref',
    labelEn: 'Midjourney --cref',
    tagAr: 'بديل فني • --cw 85',
    tagEn: 'Artistic • --cw 85',
  },
  {
    id: 'flux',
    labelAr: 'Flux Kontext',
    labelEn: 'Flux Kontext',
    tagAr: 'تثبيت ملامح PuLID',
    tagEn: 'PuLID Face Lock',
  },
];

const STANDARD_PAGE_COUNTS = [10, 15, 20, 24] as const;

interface ProcessedIllustration {
  fullDataUrl: string;
  thumbnailDataUrl: string;
  width: number;
  height: number;
}

function getAiProviderLabel(provider: AiProviderKey, isAr: boolean): string {
  const labels: Record<AiProviderKey, { ar: string; en: string }> = {
    gemini: { ar: 'جيميناي', en: 'Gemini' },
    nano_banana: { ar: 'نانو بانانا', en: 'Nano Banana' },
    openai: { ar: 'أوبن إيه آي', en: 'OpenAI' },
    flux: { ar: 'فلاكس', en: 'Flux' },
    custom: { ar: 'مزود مخصص', en: 'Custom API' },
  };
  return isAr ? labels[provider].ar : labels[provider].en;
}

function getEngineDisplayName(engine: PromptEngineMode): string {
  if (engine === 'midjourney') return 'Midjourney --cref';
  if (engine === 'flux') return 'Flux Kontext';
  return 'Nano Banana / Gemini';
}

function formatDraftTimestamp(timestamp: number, isAr: boolean): string {
  try {
    return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return '';
  }
}

function sanitizeFileSlug(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'bubbleverse-story';
}

function isCustomUploadedPage(page: StudioDraftPage): boolean {
  if (page.imageVaultId) return true;
  if (!page.imageUrl) return false;
  return !DEFAULT_STORY_FALLBACK_IMAGES.includes(page.imageUrl);
}

/**
 * Reads an uploaded print illustration at FULL original resolution (zero downscaling!)
 * for IndexedDB photoVault storage, measures exact natural width × height for 300 DPI checks,
 * and creates a compact preview thumbnail strictly for lightweight localStorage persistence.
 */
function processUploadedIllustration(
  file: File,
  thumbMaxDimension = 560
): Promise<ProcessedIllustration> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read_failed'));
    reader.onload = () => {
      const fullDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!fullDataUrl) {
        reject(new Error('empty_result'));
        return;
      }

      if (file.type === 'image/svg+xml') {
        resolve({
          fullDataUrl,
          thumbnailDataUrl: fullDataUrl,
          width: 0,
          height: 0,
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width || 0;
        const height = img.naturalHeight || img.height || 0;
        if (width <= thumbMaxDimension && height <= thumbMaxDimension) {
          resolve({
            fullDataUrl,
            thumbnailDataUrl: fullDataUrl,
            width,
            height,
          });
          return;
        }

        const scale = Math.min(thumbMaxDimension / width, thumbMaxDimension / height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            fullDataUrl,
            thumbnailDataUrl: fullDataUrl,
            width,
            height,
          });
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.78);
        resolve({
          fullDataUrl,
          thumbnailDataUrl,
          width,
          height,
        });
      };
      img.onerror = () =>
        resolve({
          fullDataUrl,
          thumbnailDataUrl: fullDataUrl,
          width: 0,
          height: 0,
        });
      img.src = fullDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function getResolutionBadgeStyle(status: PrintResolutionCheck['status']): string {
  if (status === 'print_300dpi') {
    return 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200';
  }
  if (status === 'upscale_recommended') {
    return 'bg-amber-500/20 border-amber-400/45 text-amber-200';
  }
  return 'bg-rose-500/20 border-rose-400/45 text-rose-200';
}

function getCompactResolutionText(check: PrintResolutionCheck, isAr: boolean): string {
  if (check.status === 'print_300dpi') {
    return isAr ? '300 DPI ✓' : '300 DPI ✓';
  }
  if (check.status === 'upscale_recommended') {
    return isAr ? 'كبّر 2×' : 'Upscale 2×';
  }
  return isAr ? 'دقة منخفضة' : 'Low Res';
}

function buildInitialDraftState() {
  const existing = getStudioDraft('standalone');
  const childName = existing?.childName || 'آدم';
  const storyTitle = existing?.storyTitle || 'مغامرة آدم في عالم الفقاعات السحري';
  const storyLang: 'ar' | 'en' = existing?.storyLang || 'ar';
  const artStyle =
    existing?.artStyle ||
    '3D Pixar Storybook, rich pastel lighting, expressive character features';
  const pageCount = existing?.pageCount || 15;
  const promptEngine: PromptEngineMode = existing?.promptEngine || 'nano_banana';
  const characterDna = createDefaultCharacterDna({
    childName,
    artStyle,
    ...(existing?.characterDna ?? {}),
  });
  const checklist = createDefaultProductionChecklist(existing?.checklist);
  const pages: StudioDraftPage[] = existing?.pages?.length
    ? existing.pages
    : buildFullStoryArc(characterDna, pageCount, storyLang, storyTitle, promptEngine).map(
        (p) => ({
          pageNumber: p.pageNumber,
          text: p.text,
          imagePrompt: p.imagePrompt,
          imageUrl: p.imageUrl,
        })
      );

  return {
    existing,
    childName,
    storyTitle,
    storyLang,
    artStyle,
    pageCount,
    promptEngine,
    characterDna,
    characterSheetVaultId: existing?.characterSheetVaultId || '',
    characterSheetCandidates: existing?.characterSheetCandidates || [],
    activeCandidateId: existing?.activeCandidateId || '',
    checklist,
    pages,
    activePageIndex: Math.min(existing?.activePageIndex ?? 0, Math.max(0, pages.length - 1)),
  };
}

export default function AdminStudio() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderIdParam = searchParams.get('orderId');

  const initial = useMemo(() => buildInitialDraftState(), []);

  // 4-Step Pipeline State & UI Controls
  const [activeStep, setActiveStep] = useState<StudioStep>(1);
  const [showGuideBanner, setShowGuideBanner] = useState<boolean>(true);
  const [isOverviewMode, setIsOverviewMode] = useState<boolean>(false);

  const [orders, setOrders] = useState<OrderRecord[]>(() => getOrders());
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [activeDraftKey, setActiveDraftKey] = useState<string>('standalone');
  const [savedDrafts, setSavedDrafts] = useState<StudioDraftRecord[]>(() => listStudioDrafts());
  const [aiConfig, setAiConfig] = useState(() => getIntegrationsConfig().ai);
  const [childRefPhoto, setChildRefPhoto] = useState<string | null>(null);

  const [childName, setChildName] = useState<string>(initial.childName);
  const [storyTitle, setStoryTitle] = useState<string>(initial.storyTitle);
  const [storyLang, setStoryLang] = useState<'ar' | 'en'>(initial.storyLang);
  const [artStyle, setArtStyle] = useState<string>(initial.artStyle);
  const [pageCount, setPageCount] = useState<number>(initial.pageCount);
  const [promptEngine, setPromptEngine] = useState<PromptEngineMode>(initial.promptEngine);
  const [characterDna, setCharacterDna] = useState<CharacterDna>(initial.characterDna);
  const [characterSheetVaultId, setCharacterSheetVaultId] = useState<string>(
    initial.characterSheetVaultId
  );
  const [characterSheetCandidates, setCharacterSheetCandidates] = useState<
    CharacterSheetCandidate[]
  >(initial.characterSheetCandidates);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(
    initial.activeCandidateId || null
  );
  const [characterSheetPreview, setCharacterSheetPreview] = useState<string | null>(null);
  const [isGeneratingSheet, setIsGeneratingSheet] = useState<boolean>(false);
  const [isExtractingLikeness, setIsExtractingLikeness] = useState<boolean>(false);
  const [isComparatorOpen, setIsComparatorOpen] = useState<boolean>(false);
  const [generatingPageIndexes, setGeneratingPageIndexes] = useState<Record<number, boolean>>({});
  const [isBatchGenerating, setIsBatchGenerating] = useState<boolean>(false);
  const [checklist, setChecklist] = useState<StudioProductionChecklist>(initial.checklist);
  const [pages, setPages] = useState<StudioDraftPage[]>(initial.pages);
  const [activePageIndex, setActivePageIndex] = useState<number>(initial.activePageIndex);
  const [activeVaultImageUrl, setActiveVaultImageUrl] = useState<string | null>(null);

  const [isEnhancingAi, setIsEnhancingAi] = useState<boolean>(false);
  const [isBulkUploading, setIsBulkUploading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>(
    initial.existing ? 'saved' : 'idle'
  );
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(
    initial.existing?.updatedAt ?? null
  );

  const skipAutoSaveRef = useRef(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const artStyleRef = useRef(artStyle);
  const promptEngineRef = useRef(promptEngine);
  const isArRef = useRef(isAr);
  const lastLoadedOrderParamRef = useRef<string | null>(null);

  useEffect(() => {
    artStyleRef.current = artStyle;
  }, [artStyle]);

  useEffect(() => {
    promptEngineRef.current = promptEngine;
  }, [promptEngine]);

  useEffect(() => {
    isArRef.current = isAr;
  }, [isAr]);

  const refreshAiStatus = useCallback(() => {
    setAiConfig(getIntegrationsConfig().ai);
  }, []);

  useEffect(() => {
    window.addEventListener('focus', refreshAiStatus);
    return () => window.removeEventListener('focus', refreshAiStatus);
  }, [refreshAiStatus]);

  // Hydrate Character Consistency Sheet preview from photoVault
  useEffect(() => {
    let cancelled = false;
    if (!characterSheetVaultId) {
      setCharacterSheetPreview(null);
      return;
    }
    void getPhotoFromVault(characterSheetVaultId).then((dataUrl) => {
      if (!cancelled) {
        setCharacterSheetPreview(dataUrl);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [characterSheetVaultId]);

  const activePage = pages[activePageIndex] || pages[0];
  const activePageVaultId = activePage?.imageVaultId || '';

  // Hydrate active page's full-resolution artwork from photoVault for crisp preview
  useEffect(() => {
    let cancelled = false;
    if (!activePageVaultId) {
      setActiveVaultImageUrl(null);
      return;
    }
    void getPhotoFromVault(activePageVaultId).then((dataUrl) => {
      if (!cancelled) {
        setActiveVaultImageUrl(dataUrl);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activePageVaultId]);

  const applyDraftRecord = useCallback((draft: StudioDraftRecord) => {
    skipAutoSaveRef.current = true;
    const engine: PromptEngineMode = draft.promptEngine || 'nano_banana';
    const nextDna = createDefaultCharacterDna({
      childName: draft.childName,
      artStyle: draft.artStyle,
      ...(draft.characterDna ?? {}),
    });
    const nextPages: StudioDraftPage[] =
      draft.pages.length > 0
        ? draft.pages
        : buildFullStoryArc(nextDna, draft.pageCount, draft.storyLang, draft.storyTitle, engine).map(
            (p) => ({
              pageNumber: p.pageNumber,
              text: p.text,
              imagePrompt: p.imagePrompt,
              imageUrl: p.imageUrl,
            })
          );

    setActiveDraftKey(draft.key);
    setChildName(draft.childName);
    setStoryTitle(draft.storyTitle);
    setStoryLang(draft.storyLang);
    setArtStyle(draft.artStyle);
    setPageCount(draft.pageCount);
    setPromptEngine(engine);
    setCharacterDna(nextDna);
    setCharacterSheetVaultId(draft.characterSheetVaultId || '');
    setCharacterSheetCandidates(draft.characterSheetCandidates || []);
    setActiveCandidateId(draft.activeCandidateId || draft.characterSheetCandidates?.[0]?.id || null);
    setChecklist(createDefaultProductionChecklist(draft.checklist));
    setPages(nextPages);
    setActivePageIndex(Math.min(draft.activePageIndex ?? 0, Math.max(0, nextPages.length - 1)));
    setLastSavedAt(draft.updatedAt);
    setSaveStatus('saved');
  }, []);

  const loadOrderIntoStudio = useCallback(
    async (order: OrderRecord, silent = false) => {
      const ar = isArRef.current;
      skipAutoSaveRef.current = true;
      setSelectedOrder(order);
      setActiveDraftKey(order.id);

      const primaryItem = order.items[0];
      const existingDraft = getStudioDraft(order.id);

      if (existingDraft && existingDraft.pages.length > 0) {
        applyDraftRecord(existingDraft);
        if (!silent) {
          toast.success(
            ar
              ? `تم استئناف المسودة المحفوظة للطلب ${order.reference}`
              : `Resumed saved draft for order ${order.reference}`
          );
        }
      } else if (primaryItem) {
        const hero = primaryItem.childName || (ar ? 'البطل' : 'Hero');
        const lang: 'ar' | 'en' = primaryItem.storyLanguage === 'en' ? 'en' : 'ar';
        const count = primaryItem.pagesCount || 15;
        const title = lang === 'ar' ? primaryItem.titleAr : primaryItem.titleEn;
        const engine = promptEngineRef.current;

        const contextHints = [
          primaryItem.titleEn,
          primaryItem.titleAr,
          primaryItem.storyId,
          primaryItem.giftMessage,
          primaryItem.occasion,
          order.orderNotes,
        ]
          .filter(Boolean)
          .join(' ');
        const detectedTheme = detectStoryTheme(contextHints);
        const resolvedThemeDna = resolveThemeDna(
          detectedTheme,
          primaryItem.childGender === 'girl' ? 'girl' : 'boy'
        );

        const nextDna = createDefaultCharacterDna({
          childName: hero,
          childAge: primaryItem.childAge || '5',
          childGender: primaryItem.childGender === 'girl' ? 'girl' : 'boy',
          artStyle: artStyleRef.current,
          storyTheme: detectedTheme,
          signatureOutfit: resolvedThemeDna.signatureOutfit,
          signatureProp: resolvedThemeDna.signatureProp,
          pose2Description: resolvedThemeDna.pose2Description,
        });
        const generatedPages: StudioDraftPage[] = buildFullStoryArc(
          nextDna,
          count,
          lang,
          title,
          engine
        ).map((p) => ({
          pageNumber: p.pageNumber,
          text: p.text,
          imagePrompt: p.imagePrompt,
          imageUrl: p.imageUrl,
        }));

        setChildName(hero);
        setStoryLang(lang);
        setPageCount(count);
        setStoryTitle(title);
        setCharacterDna(nextDna);
        setCharacterSheetVaultId('');
        setCharacterSheetCandidates([]);
        setActiveCandidateId(null);
        setCharacterSheetPreview(null);
        setChecklist(createDefaultProductionChecklist({ photoApproved: Boolean(primaryItem?.photoVaultId) }));
        setPages(generatedPages);
        setActivePageIndex(0);
        setLastSavedAt(null);
        setSaveStatus('idle');

        if (!silent) {
          toast.success(
            ar
              ? `تم تحميل الطلب ${order.reference} (${hero})`
              : `Loaded order ${order.reference} (${hero})`
          );
        }
      }

      if (primaryItem?.photoVaultId) {
        const vaultPhoto = await getPhotoFromVault(primaryItem.photoVaultId);
        setChildRefPhoto(vaultPhoto);
      } else {
        setChildRefPhoto(null);
      }
    },
    [applyDraftRecord]
  );

  useEffect(() => {
    const freshOrders = getOrders();
    setOrders(freshOrders);
    setSavedDrafts(listStudioDrafts());

    if (orderIdParam && orderIdParam !== lastLoadedOrderParamRef.current) {
      const match = freshOrders.find(
        (o) => o.id === orderIdParam || o.reference === orderIdParam
      );
      if (match) {
        lastLoadedOrderParamRef.current = orderIdParam;
        void loadOrderIntoStudio(match, true);
      }
    } else if (!orderIdParam) {
      lastLoadedOrderParamRef.current = null;
    }
  }, [orderIdParam, loadOrderIntoStudio]);

  const syncedDna = useMemo<CharacterDna>(
    () => ({
      ...characterDna,
      childName,
      artStyle,
    }),
    [characterDna, childName, artStyle]
  );

  const persistCurrentDraft = useCallback(
    (showToast = false) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const saved = saveStudioDraft({
        key: activeDraftKey,
        orderReference: selectedOrder?.reference,
        childName,
        storyTitle,
        storyLang,
        artStyle,
        pageCount,
        pages,
        activePageIndex,
        characterDna: syncedDna,
        characterSheetVaultId: characterSheetVaultId || undefined,
        characterSheetCandidates: characterSheetCandidates.length ? characterSheetCandidates : undefined,
        activeCandidateId: activeCandidateId || undefined,
        promptEngine,
        checklist,
      });
      setLastSavedAt(saved.updatedAt);
      setSaveStatus('saved');
      setSavedDrafts(listStudioDrafts());
      if (showToast) {
        toast.success(
          isAr ? 'تم حفظ مسودة الاستوديو بنجاح' : 'Studio draft saved successfully'
        );
      }
    },
    [
      activeDraftKey,
      selectedOrder?.reference,
      childName,
      storyTitle,
      storyLang,
      artStyle,
      pageCount,
      pages,
      activePageIndex,
      syncedDna,
      characterSheetVaultId,
      characterSheetCandidates,
      activeCandidateId,
      promptEngine,
      checklist,
      isAr,
    ]
  );

  // Debounced auto-save (~450ms) whenever editor content, DNA, engine, or checklist changes
  useEffect(() => {
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return;
    }

    setSaveStatus('saving');
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      const saved = saveStudioDraft({
        key: activeDraftKey,
        orderReference: selectedOrder?.reference,
        childName,
        storyTitle,
        storyLang,
        artStyle,
        pageCount,
        pages,
        activePageIndex,
        characterDna: syncedDna,
        characterSheetVaultId: characterSheetVaultId || undefined,
        characterSheetCandidates: characterSheetCandidates.length ? characterSheetCandidates : undefined,
        activeCandidateId: activeCandidateId || undefined,
        promptEngine,
        checklist,
      });
      setLastSavedAt(saved.updatedAt);
      setSaveStatus('saved');
      setSavedDrafts(listStudioDrafts());
      saveTimerRef.current = null;
    }, 450);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [
    activeDraftKey,
    selectedOrder?.reference,
    childName,
    storyTitle,
    storyLang,
    artStyle,
    pageCount,
    pages,
    activePageIndex,
    syncedDna,
    characterSheetVaultId,
    characterSheetCandidates,
    activeCandidateId,
    promptEngine,
    checklist,
  ]);

  const masterCharacterSheetPrompt = useMemo(
    () => buildMasterCharacterSheetPrompt(syncedDna, promptEngine),
    [syncedDna, promptEngine]
  );

  const whatsAppHelpers = useMemo(() => {
    if (!selectedOrder) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const trackingUrl = origin
      ? `${origin}/track?ref=${encodeURIComponent(selectedOrder.reference)}`
      : '';
    return buildWhatsAppHelperMessages({
      customerName: selectedOrder.customerName,
      childName: childName.trim() || selectedOrder.items[0]?.childName || 'Hero',
      reference: selectedOrder.reference,
      trackingUrl,
      phone: selectedOrder.phone,
      country: selectedOrder.country,
    });
  }, [selectedOrder, childName]);

  const uploadedArtCount = useMemo(
    () => pages.filter((p) => isCustomUploadedPage(p)).length,
    [pages]
  );

  const ready300DpiCount = useMemo(
    () =>
      pages.filter(
        (p) =>
          typeof p.imageWidth === 'number' &&
          typeof p.imageHeight === 'number' &&
          checkImagePrintReadiness(p.imageWidth, p.imageHeight).status === 'print_300dpi'
      ).length,
    [pages]
  );

  const checklistProgress = useMemo(() => countChecklistCompleted(checklist), [checklist]);

  const handleToggleChecklistStep = (key: keyof StudioProductionChecklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateDnaField = <K extends keyof CharacterDna>(field: K, value: CharacterDna[K]) => {
    setCharacterDna((prev) => ({ ...prev, [field]: value }));
    if (field === 'midjourneyCrefUrl' && promptEngine === 'midjourney') {
      const nextDna: CharacterDna = { ...syncedDna, midjourneyCrefUrl: String(value ?? '') };
      setPages((prev) =>
        prev.map((p) => ({
          ...p,
          imagePrompt: reformatScenePromptForEngine(
            p.imagePrompt,
            nextDna,
            p.pageNumber,
            prev.length,
            'midjourney',
            p.text
          ),
        }))
      );
    }
  };

  const handleSwitchPromptEngine = (nextEngine: PromptEngineMode) => {
    setPromptEngine(nextEngine);
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        imagePrompt: reformatScenePromptForEngine(
          p.imagePrompt,
          syncedDna,
          p.pageNumber,
          prev.length,
          nextEngine,
          p.text
        ),
      }))
    );
    const engineName = getEngineDisplayName(nextEngine);
    toast.success(
      isAr
        ? `تم تحويل ورقة الشخصية وجميع أوامر الصفحات (${pages.length}) إلى ${engineName}`
        : `Reformatted Master Sheet & all ${pages.length} scene prompts for ${engineName}`
    );
  };

  const handleSyncDnaToAllPrompts = () => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        imagePrompt: reformatScenePromptForEngine(
          p.imagePrompt,
          syncedDna,
          p.pageNumber,
          prev.length,
          promptEngine,
          p.text
        ),
      }))
    );
    toast.success(
      isAr
        ? `تم تطبيق مواصفات البطل والأسلوب الفني على جميع الصفحات (${pages.length})`
        : `Synced Character DNA & art style across all ${pages.length} scene prompts`
    );
  };

  const handleGenerateCharacterSheet = async () => {
    setIsGeneratingSheet(true);
    try {
      const nextCandidateNumber = characterSheetCandidates.length + 1;
      const candidate = await generateCharacterSheetCandidate({
        childName,
        childGender: characterDna.childGender || 'boy',
        childAge: characterDna.childAge || '5',
        dna: syncedDna,
        storyTheme: (characterDna.storyTheme as StoryThemeKey) || 'bubble',
        artStyle,
        childPhotoUrl: childRefPhoto,
        candidateNumber: nextCandidateNumber,
        draftKey: activeDraftKey,
        aiConfig: {
          enabled: aiConfig.enabled,
          apiKey: aiConfig.apiKey,
          provider: aiConfig.provider,
          model: aiConfig.model,
        },
      });

      setCharacterSheetCandidates((prev) => [...prev, candidate]);
      setActiveCandidateId(candidate.id);
      setCharacterSheetVaultId(candidate.vaultId);
      setCharacterSheetPreview(candidate.url);
      setChecklist((prev) => ({ ...prev, characterSheetLocked: true }));

      toast.success(
        isAr
          ? `تم توليد ورقة ثبات الشخصية (3 وضعيات) — البديل #${nextCandidateNumber} بنجاح ✓`
          : `Generated 3-pose character consistency sheet — Candidate #${nextCandidateNumber} ✓`
      );
    } catch {
      toast.error(
        isAr ? 'تعذر توليد ورقة ثبات الشخصية' : 'Failed to generate character sheet'
      );
    } finally {
      setIsGeneratingSheet(false);
    }
  };

  const handleGeneratePageImage = async (pageIndex: number) => {
    const targetPage = pages[pageIndex];
    if (!targetPage) return;

    setGeneratingPageIndexes((prev) => ({ ...prev, [pageIndex]: true }));
    try {
      const pageSeed = Math.abs(
        childName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 1000 +
          targetPage.pageNumber * 999
      );

      const result = await generateRealAiImage({
        prompt: targetPage.imagePrompt,
        seed: pageSeed,
        width: 1024,
        height: 1024,
        aiConfig: {
          enabled: aiConfig.enabled,
          apiKey: aiConfig.apiKey,
          provider: aiConfig.provider,
          model: aiConfig.model,
        },
      });

      const vaultId = `scene_art_${activeDraftKey}_p${targetPage.pageNumber}_${Date.now()}`;
      await savePhotoToVault(vaultId, result.dataUrl);

      updatePage(pageIndex, {
        imageUrl: result.dataUrl,
        imageVaultId: vaultId,
        imageWidth: 1024,
        imageHeight: 1024,
      });

      if (pageIndex === activePageIndex) {
        setActiveVaultImageUrl(result.dataUrl);
      }

      setChecklist((prev) => ({ ...prev, artworkUploaded: true }));

      toast.success(
        isAr
          ? `تم توليد رسمة صفحة ${targetPage.pageNumber} بنجاح عبر ${result.engine} ✓`
          : `Generated Page ${targetPage.pageNumber} artwork via ${result.engine} ✓`
      );
    } catch {
      toast.error(
        isAr
          ? `تعذر توليد رسمة صفحة ${targetPage.pageNumber}`
          : `Failed to generate image for page ${targetPage.pageNumber}`
      );
    } finally {
      setGeneratingPageIndexes((prev) => ({ ...prev, [pageIndex]: false }));
    }
  };

  const handleBatchGeneratePages = async () => {
    setIsBatchGenerating(true);
    let successCount = 0;
    try {
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page.imageVaultId) {
          await handleGeneratePageImage(i);
          successCount++;
        }
      }
      toast.success(
        isAr
          ? `تم اكتمال توليد جميع رسومات الكتاب بنجاح (${successCount} صفحات) ✓`
          : `Completed batch generation for ${successCount} pages ✓`
      );
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const handleSelectCandidate = (candidateId: string) => {
    const found = characterSheetCandidates.find((c) => c.id === candidateId);
    if (!found) return;
    setActiveCandidateId(found.id);
    setCharacterSheetVaultId(found.vaultId);
    setCharacterSheetPreview(found.url);
    setChecklist((prev) => ({ ...prev, characterSheetLocked: true }));
    toast.success(
      isAr
        ? `تم اعتماد ${found.label} كبطل نهائي للقفل ✓`
        : `Selected ${found.label} as active character sheet ✓`
    );
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    const target = characterSheetCandidates.find((c) => c.id === candidateId);
    if (target?.vaultId) {
      await deletePhotoFromVault(target.vaultId);
    }
    const remaining = characterSheetCandidates.filter((c) => c.id !== candidateId);
    setCharacterSheetCandidates(remaining);

    if (activeCandidateId === candidateId) {
      if (remaining.length > 0) {
        const nextActive = remaining[remaining.length - 1];
        setActiveCandidateId(nextActive.id);
        setCharacterSheetVaultId(nextActive.vaultId);
        setCharacterSheetPreview(nextActive.url);
      } else {
        setActiveCandidateId(null);
        setCharacterSheetVaultId('');
        setCharacterSheetPreview(null);
        setChecklist((prev) => ({ ...prev, characterSheetLocked: false }));
      }
    }
    toast.info(isAr ? 'تم حذف البديل' : 'Candidate removed');
  };

  const handlePurgeOtherCandidates = async () => {
    if (!activeCandidateId || characterSheetCandidates.length <= 1) return;
    const current = characterSheetCandidates.find((c) => c.id === activeCandidateId);
    if (!current) return;

    const toDelete = characterSheetCandidates.filter((c) => c.id !== activeCandidateId);
    for (const item of toDelete) {
      if (item.vaultId) {
        await deletePhotoFromVault(item.vaultId);
      }
    }
    setCharacterSheetCandidates([current]);
    toast.success(
      isAr
        ? 'تم تنظيف كافة البدائل الأخرى والاحتفاظ بالنسخة المعتمدة فقط ✓'
        : 'Purged other candidates and kept the winning sheet ✓'
    );
  };

  const handleExtractLikeness = async () => {
    if (!childRefPhoto) {
      toast.error(
        isAr
          ? 'يرجى رفع صورة الطفل أولاً لاستخراج ملامحه بدقة'
          : 'Please upload child reference photo first'
      );
      return;
    }
    setIsExtractingLikeness(true);
    try {
      const extracted = await extractLikenessFromChildPhoto(
        childRefPhoto,
        childName,
        characterDna.childGender || 'boy',
        {
          enabled: aiConfig.enabled,
          apiKey: aiConfig.apiKey,
        }
      );
      updateDnaField('hairAndFeatures', extracted);
      toast.success(
        isAr
          ? 'تم استخراج ملامح الشعر والوجه من صورة الطفل بنجاح ✓'
          : 'Extracted facial and hair features from child photo ✓'
      );
    } catch {
      toast.error(
        isAr ? 'تعذر استخراج الملامح بالذكاء الاصطناعي' : 'Could not extract features via AI'
      );
    } finally {
      setIsExtractingLikeness(false);
    }
  };

  const handleApplyLikenessPreset = (preset: LikenessPreset) => {
    const current = characterDna.hairAndFeatures.trim();
    const next = current ? `${current}, ${preset.descEn}` : preset.descEn;
    updateDnaField('hairAndFeatures', next);
    toast.success(
      isAr
        ? `تمت إضافة ميزة "${preset.labelAr}" إلى مواصفات البطل ✓`
        : `Added "${preset.labelEn}" to hero specs ✓`
    );
  };

  const handleCharacterSheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const processed = await processUploadedIllustration(file);
      const candNum = characterSheetCandidates.length + 1;
      const vaultId = `studio_charsheet_${activeDraftKey}_upload_${Date.now()}`;
      await savePhotoToVault(vaultId, processed.fullDataUrl);

      const newCand: CharacterSheetCandidate = {
        id: `cand_manual_${Date.now()}`,
        vaultId,
        url: processed.fullDataUrl,
        createdAt: Date.now(),
        label: isAr ? `رفع يدوي #${candNum}` : `Manual Upload #${candNum}`,
        engine: 'Manual / Midjourney',
        promptUsed: masterCharacterSheetPrompt,
        likenessScore: 98,
      };

      setCharacterSheetCandidates((prev) => [...prev, newCand]);
      setActiveCandidateId(newCand.id);
      setCharacterSheetVaultId(vaultId);
      setCharacterSheetPreview(processed.fullDataUrl);
      setChecklist((prev) => ({ ...prev, characterSheetLocked: true }));
      toast.success(
        isAr
          ? 'تم حفظ ورقة ثبات الشخصية وإضافتها كبديل معتمد ✓'
          : 'Character sheet saved and added as active candidate ✓'
      );
    } catch {
      toast.error(
        isAr ? 'تعذر حفظ صورة ورقة ثبات الشخصية' : 'Could not save the character sheet image'
      );
    }
  };

  const handleRemoveCharacterSheet = async () => {
    if (activeCandidateId) {
      await handleDeleteCandidate(activeCandidateId);
    } else if (characterSheetVaultId) {
      await deletePhotoFromVault(characterSheetVaultId);
      setCharacterSheetVaultId('');
      setCharacterSheetPreview(null);
      setChecklist((prev) => ({ ...prev, characterSheetLocked: false }));
      toast.info(isAr ? 'تمت إزالة ورقة ثبات الشخصية' : 'Character Sheet removed');
    }
  };

  const handleChildReferencePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const processed = await processUploadedIllustration(file);
      const vaultId = `ref_photo_${selectedOrder ? selectedOrder.id : activeDraftKey}_${Date.now()}`;
      await savePhotoToVault(vaultId, processed.fullDataUrl);

      if (selectedOrder) {
        const updated = attachPhotoToOrder(selectedOrder.id, vaultId, 0);
        if (updated) {
          setSelectedOrder(updated);
          setOrders(getOrders());
        }
      }

      setChildRefPhoto(processed.fullDataUrl);
      setChecklist((prev) => ({ ...prev, photoApproved: true }));

      toast.success(
        isAr
          ? 'تم حفظ صورة الطفل المرجعية بدقتها الكاملة وقفل المعيار الأول ✓'
          : 'Child reference photo saved at full resolution & Check 1 passed ✓'
      );
    } catch {
      toast.error(
        isAr ? 'تعذر حفظ صورة الطفل المرجعية' : 'Could not save child reference photo'
      );
    }
  };

  const handleRemoveChildReferencePhoto = async () => {
    if (selectedOrder) {
      const primaryItem = selectedOrder.items[0];
      if (primaryItem?.photoVaultId) {
        await deletePhotoFromVault(primaryItem.photoVaultId);
        const updated = attachPhotoToOrder(selectedOrder.id, '', 0);
        if (updated) {
          setSelectedOrder(updated);
          setOrders(getOrders());
        }
      }
    }
    setChildRefPhoto(null);
    setChecklist((prev) => ({ ...prev, photoApproved: false }));
    toast.info(isAr ? 'تمت إزالة الصورة المرجعية' : 'Reference photo removed');
  };

  const handleAdaptDnaToTheme = (newTheme: StoryThemeKey | string) => {
    const gender = characterDna.childGender || 'boy';
    const resolved = resolveThemeDna(newTheme, gender);
    setCharacterDna((prev) => ({
      ...prev,
      storyTheme: newTheme,
      signatureOutfit: resolved.signatureOutfit,
      signatureProp: resolved.signatureProp,
      pose2Description: resolved.pose2Description,
    }));
    toast.success(
      isAr
        ? `تم تهيئة الزي الرسمي والغرض المميز لثيم: ${newTheme}`
        : `Configured signature outfit & prop for: ${newTheme}`
    );
  };

  const handleSelectOrder = (id: string) => {
    if (!id) {
      skipAutoSaveRef.current = true;
      setSelectedOrder(null);
      setChildRefPhoto(null);
      setActiveDraftKey('standalone');
      setSearchParams({});
      const standalone = getStudioDraft('standalone');
      if (standalone) {
        applyDraftRecord(standalone);
        toast.info(
          isAr ? 'تم استئناف المسودة المستقلة المحفوظة' : 'Resumed saved standalone draft'
        );
      } else {
        setCharacterSheetVaultId('');
        setCharacterSheetPreview(null);
        setChecklist(createDefaultProductionChecklist());
      }
      return;
    }

    const match = orders.find((o) => o.id === id);
    if (match) {
      lastLoadedOrderParamRef.current = match.id;
      setSearchParams({ orderId: match.id });
      void loadOrderIntoStudio(match);
    }
  };

  const handleResumeDraftFromList = (draft: StudioDraftRecord) => {
    const matchedOrder = orders.find(
      (o) => o.id === draft.key || (draft.orderReference && o.reference === draft.orderReference)
    );
    if (matchedOrder) {
      lastLoadedOrderParamRef.current = matchedOrder.id;
      setSearchParams({ orderId: matchedOrder.id });
      void loadOrderIntoStudio(matchedOrder);
      return;
    }

    setSelectedOrder(null);
    setChildRefPhoto(null);
    setSearchParams({});
    applyDraftRecord(draft);
    toast.success(
      isAr
        ? `تم فتح المسودة المحفوظة: ${draft.storyTitle}`
        : `Opened saved draft: ${draft.storyTitle}`
    );
  };

  const handleDeleteSavedDraft = (key: string) => {
    deleteStudioDraft(key);
    setSavedDrafts(listStudioDrafts());
    if (key === activeDraftKey) {
      setLastSavedAt(null);
      setSaveStatus('idle');
    }
    toast.info(isAr ? 'تم حذف المسودة المحفوظة' : 'Saved draft removed');
  };

  const handleAutoGenerate = () => {
    const heroName = childName.trim() || (storyLang === 'ar' ? 'البطل' : 'Hero');
    const dnaForArc: CharacterDna = { ...syncedDna, childName: heroName };
    const generated = buildFullStoryArc(
      dnaForArc,
      pageCount,
      storyLang,
      storyTitle,
      promptEngine
    );
    // Preserve any already-uploaded full-res illustrations on matching page slots
    const merged: StudioDraftPage[] = generated.map((g, idx) => {
      const existing = pages[idx];
      if (existing && isCustomUploadedPage(existing)) {
        return {
          pageNumber: g.pageNumber,
          text: g.text,
          imagePrompt: g.imagePrompt,
          imageUrl: existing.imageUrl,
          imageVaultId: existing.imageVaultId,
          imageWidth: existing.imageWidth,
          imageHeight: existing.imageHeight,
        };
      }
      return {
        pageNumber: g.pageNumber,
        text: g.text,
        imagePrompt: g.imagePrompt,
        imageUrl: g.imageUrl,
      };
    });
    setPages(merged);
    setActivePageIndex(0);
    toast.success(
      isAr
        ? `تم توليد ${pageCount} صفحة فريدة بصيغة المرحلة 2 (${getEngineDisplayName(promptEngine)})`
        : `Generated ${pageCount} distinct Stage 2 scenes (${getEngineDisplayName(promptEngine)})`
    );
  };

  const handleEnhanceWithAi = async () => {
    if (isEnhancingAi) return;
    setIsEnhancingAi(true);
    try {
      const result = await generateStoryWithConfiguredAi({
        aiConfig,
        dna: syncedDna,
        storyTitle,
        storyLang,
        pageCount,
        engine: promptEngine,
        existingPages: pages,
      });

      const merged: StudioDraftPage[] = result.pages.map((p, idx) => {
        const existing = pages[idx];
        if (existing && isCustomUploadedPage(existing)) {
          return {
            pageNumber: p.pageNumber,
            text: p.text,
            imagePrompt: p.imagePrompt,
            imageUrl: existing.imageUrl,
            imageVaultId: existing.imageVaultId,
            imageWidth: existing.imageWidth,
            imageHeight: existing.imageHeight,
          };
        }
        return {
          pageNumber: p.pageNumber,
          text: p.text,
          imagePrompt: p.imagePrompt,
          imageUrl: p.imageUrl,
        };
      });

      setPages(merged);
      setActivePageIndex(0);
      if (result.source === 'ai') {
        toast.success(
          result.notice ||
            (isAr
              ? `تم تحسين نصوص ${merged.length} صفحة بالذكاء الاصطناعي بنجاح`
              : `Enhanced ${merged.length} pages with connected AI`)
        );
      } else {
        toast.info(
          result.notice ||
            (isAr
              ? 'تم استخدام القصة الاحترافية المحلية وتحديث أوامر المرحلة 2'
              : 'Used local story arc and refreshed Stage 2 prompts')
        );
      }
    } finally {
      setIsEnhancingAi(false);
    }
  };

  const updatePage = (idx: number, patch: Partial<StudioDraftPage>) => {
    setPages((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const handlePageImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const targetPage = pages[idx];
    if (!targetPage) return;

    try {
      const processed = await processUploadedIllustration(file);
      const vaultId = `studio_page_${activeDraftKey}_${targetPage.pageNumber}`;
      await savePhotoToVault(vaultId, processed.fullDataUrl);

      const nextPages = pages.map((p, i) =>
        i === idx
          ? {
              ...p,
              imageUrl: processed.thumbnailDataUrl,
              imageVaultId: vaultId,
              imageWidth: processed.width || undefined,
              imageHeight: processed.height || undefined,
            }
          : p
      );
      setPages(nextPages);
      if (idx === activePageIndex) {
        setActiveVaultImageUrl(processed.fullDataUrl);
      }

      if (nextPages.every((p) => isCustomUploadedPage(p))) {
        setChecklist((prev) => ({ ...prev, artCompleted: true }));
      }

      const resCheck =
        processed.width > 0 && processed.height > 0
          ? checkImagePrintReadiness(processed.width, processed.height)
          : null;
      const resNote = resCheck
        ? ` • ${processed.width}×${processed.height} (${isAr ? resCheck.labelAr : resCheck.labelEn})`
        : '';

      toast.success(
        isAr
          ? `تم حفظ رسمة الصفحة ${targetPage.pageNumber} بدقتها الكاملة${resNote}`
          : `Saved Page ${targetPage.pageNumber} full-res illustration${resNote}`
      );
    } catch {
      toast.error(isAr ? 'تعذر قراءة الصورة المختارة' : 'Could not read the selected image');
    }
  };

  const handleBulkScenesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (selectedFiles.length === 0) return;

    const imageFiles = selectedFiles.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error(
        isAr
          ? 'يرجى اختيار ملفات صور صالحة (PNG / JPG / WebP)'
          : 'Please select valid image files (PNG / JPG / WebP)'
      );
      return;
    }

    const sorted = sortFilesNaturally(imageFiles);
    setIsBulkUploading(true);

    try {
      const processedList = await Promise.all(
        sorted.map((file) => processUploadedIllustration(file))
      );

      const totalPagesAfter = Math.max(pages.length, processedList.length);
      const fallbackArc =
        totalPagesAfter > pages.length
          ? buildFullStoryArc(syncedDna, totalPagesAfter, storyLang, storyTitle, promptEngine)
          : [];

      const nextPages: StudioDraftPage[] = [];
      let readyCount = 0;
      let upscaleCount = 0;

      for (let i = 0; i < totalPagesAfter; i += 1) {
        const pageNumber = i + 1;
        const existing = pages[i];
        const uploaded = processedList[i];

        if (uploaded) {
          const vaultId = `studio_page_${activeDraftKey}_${pageNumber}`;
          await savePhotoToVault(vaultId, uploaded.fullDataUrl);

          if (uploaded.width > 0 && uploaded.height > 0) {
            const check = checkImagePrintReadiness(uploaded.width, uploaded.height);
            if (check.status === 'print_300dpi') readyCount += 1;
            else upscaleCount += 1;
          }

          if (existing) {
            nextPages.push({
              ...existing,
              pageNumber,
              imageUrl: uploaded.thumbnailDataUrl,
              imageVaultId: vaultId,
              imageWidth: uploaded.width || undefined,
              imageHeight: uploaded.height || undefined,
            });
          } else {
            const beat = fallbackArc[i];
            nextPages.push({
              pageNumber,
              text:
                beat?.text ||
                (storyLang === 'ar'
                  ? `مشهد جديد في مغامرة ${childName}...`
                  : `A new magical moment in ${childName}'s adventure...`),
              imagePrompt:
                beat?.imagePrompt ||
                buildStage2ScenePrompt(
                  syncedDna,
                  {
                    pageNumber,
                    totalPages: totalPagesAfter,
                    action: `${childName} exploring a joyful storybook moment.`,
                    environment: `Dreamy pastel atmosphere inspired by "${storyTitle}".`,
                  },
                  promptEngine
                ),
              imageUrl: uploaded.thumbnailDataUrl,
              imageVaultId: vaultId,
              imageWidth: uploaded.width || undefined,
              imageHeight: uploaded.height || undefined,
            });
          }
        } else if (existing) {
          nextPages.push({ ...existing, pageNumber });
        }
      }

      setPages(nextPages);
      setPageCount(nextPages.length);
      if (processedList[activePageIndex]) {
        setActiveVaultImageUrl(processedList[activePageIndex].fullDataUrl);
      }

      if (nextPages.every((p) => isCustomUploadedPage(p))) {
        setChecklist((prev) => ({ ...prev, artCompleted: true }));
      }

      toast.success(
        isAr
          ? `تم رفع ${processedList.length} لوحة بالترتيب الرقمي (جاهز 300 DPI: ${readyCount} • يحتاج تكبير: ${upscaleCount})`
          : `Bulk-uploaded ${processedList.length} scenes in natural order (${readyCount} 300 DPI ready • ${upscaleCount} need upscale)`
      );
    } catch {
      toast.error(
        isAr ? 'حدث خطأ أثناء رفع بعض اللوحات' : 'Failed to process one or more scene images'
      );
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleAddPage = () => {
    const nextNum = pages.length + 1;
    const prompt = buildStage2ScenePrompt(
      syncedDna,
      {
        pageNumber: nextNum,
        totalPages: nextNum,
        action: `${childName} discovering a joyful surprise surrounded by glowing iridescent bubbles.`,
        environment: `Enchanted pastel atmosphere inspired by "${storyTitle}", soft Pixar volumetric lighting.`,
      },
      promptEngine
    );

    setPages((prev) => [
      ...prev,
      {
        pageNumber: nextNum,
        text:
          storyLang === 'ar'
            ? `مشهد جديد في مغامرة ${childName}...`
            : `A new magical moment in ${childName}'s adventure...`,
        imagePrompt: prompt,
        imageUrl: DEFAULT_STORY_FALLBACK_IMAGES[nextNum % DEFAULT_STORY_FALLBACK_IMAGES.length],
      },
    ]);
    setPageCount(nextNum);
    setActivePageIndex(pages.length);
  };

  const handleDeletePage = (idx: number) => {
    if (pages.length <= 1) return;
    const remaining = pages
      .filter((_, i) => i !== idx)
      .map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setPages(remaining);
    setPageCount(remaining.length);
    setActivePageIndex(Math.max(0, idx - 1));
  };

  const handleCopyText = async (text: string, labelAr: string, labelEn: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(isAr ? labelAr : labelEn);
    } catch {
      toast.error(isAr ? 'تعذر النسخ إلى الحافظة' : 'Could not copy to clipboard');
    }
  };

  const buildCurrentPromptPack = () =>
    buildProductionPromptPackText({
      storyTitle,
      orderReference: selectedOrder?.reference,
      storyLang,
      dna: syncedDna,
      engine: promptEngine,
      pages,
    });

  const handleCopyAllPrompts = async () => {
    await handleCopyText(
      buildCurrentPromptPack(),
      `تم نسخ حزمة المرحلة الثانية الكاملة (${pages.length} صفحة + ورقة الشخصية)`,
      `Copied full Stage 2 Prompt Pack (Master Sheet + ${pages.length} scenes)`
    );
  };

  const handleDownloadPromptPack = () => {
    const packText = buildCurrentPromptPack();
    const blob = new Blob([packText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = sanitizeFileSlug(selectedOrder?.reference || storyTitle || childName);
    link.href = url;
    link.download = `${slug}-stage2-prompt-pack-${promptEngine}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(
      isAr
        ? `تم تنزيل حزمة أوامر المرحلة الثانية (${pages.length} مشهد)`
        : `Downloaded Stage 2 Prompt Pack (.txt) with ${pages.length} scenes`
    );
  };

  const handleOpenWhatsAppPhotoRequest = () => {
    if (!whatsAppHelpers) return;
    const url = isAr
      ? whatsAppHelpers.requestClearerPhoto.urlAr
      : whatsAppHelpers.requestClearerPhoto.urlEn;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.info(
      isAr
        ? 'تم فتح رسالة طلب صورة أوضح للطفل عبر واتساب'
        : 'Opened WhatsApp clearer-photo request message'
    );
  };

  const handleSendWhatsAppDraftApproval = () => {
    if (!whatsAppHelpers) return;
    persistCurrentDraft(false);
    const url = isAr
      ? whatsAppHelpers.sendDraftForApproval.urlAr
      : whatsAppHelpers.sendDraftForApproval.urlEn;
    window.open(url, '_blank', 'noopener,noreferrer');
    setChecklist((prev) => ({ ...prev, whatsappDraftSent: true }));
    toast.success(
      isAr
        ? 'تم فتح رسالة اعتماد المسودة على واتساب وتحديث الخطوة 4 ✓'
        : 'Opened WhatsApp draft approval message & checked Step 4 ✓'
    );
  };

  const handleOpenKdpPdfBuilder = () => {
    persistCurrentDraft(false);
    const target = selectedOrder
      ? `/admin/pdf-builder?orderId=${encodeURIComponent(selectedOrder.id)}`
      : `/admin/pdf-builder?draft=${encodeURIComponent(activeDraftKey)}`;
    navigate(target);
  };

  const handleExportQuickProof = async () => {
    const hydratedPages = await Promise.all(
      pages.map(async (p) => {
        const vaultImg = p.imageVaultId ? await getPhotoFromVault(p.imageVaultId) : null;
        return {
          pageNumber: p.pageNumber,
          text: p.text,
          imageUrl: vaultImg || p.imageUrl,
        };
      })
    );

    const html = generateStorybookPDFHTML({
      title: storyTitle,
      childName,
      language: storyLang,
      artStyle,
      pages: hydratedPages,
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(
        isAr
          ? 'يرجى السماح بالنوافذ المنبثقة لفتح معاينة الطباعة السريعة'
          : 'Please allow pop-ups to open the quick proof print preview'
      );
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    toast.success(
      isAr
        ? 'تم فتح المعاينة السريعة للكتاب! للتصدير الاحترافي 8.5×8.5 إنش استخدم صانع KDP.'
        : 'Quick proof opened! For press-ready 8.5"×8.5" 300 DPI files, use the KDP PDF Builder.'
    );
  };

  const handleMarkDraftReady = () => {
    if (!selectedOrder) return;
    persistCurrentDraft(false);
    const updated = updateOrderStatus(
      selectedOrder.id,
      'draft_ready',
      isAr ? 'تم تجهيز المسودة في الاستوديو' : 'Draft prepared in Studio'
    );
    if (updated) {
      setSelectedOrder(updated);
      setOrders(getOrders());
      toast.success(
        isAr
          ? `تم تحديث الطلب ${updated.reference} إلى حالة المسودة جاهزة`
          : `Order ${updated.reference} marked as Draft Ready`
      );
    }
  };

  const hasAiCredential =
    Boolean(aiConfig.apiKey.trim()) ||
    (aiConfig.provider === 'custom' && Boolean(aiConfig.customEndpoint.trim()));
  const isAiActive = aiConfig.enabled && hasAiCredential;
  const isAiTextCapable =
    isAiActive &&
    (aiConfig.provider === 'gemini' ||
      aiConfig.provider === 'openai' ||
      aiConfig.provider === 'custom');
  const aiProviderName = getAiProviderLabel(aiConfig.provider, isAr);

  const activeResolutionCheck: PrintResolutionCheck | null =
    activePage &&
    typeof activePage.imageWidth === 'number' &&
    typeof activePage.imageHeight === 'number' &&
    activePage.imageWidth > 0 &&
    activePage.imageHeight > 0
      ? checkImagePrintReadiness(activePage.imageWidth, activePage.imageHeight)
      : null;

  const activePreviewImageUrl = activeVaultImageUrl || activePage?.imageUrl || '';

  const BackOrderIcon = isRTL ? ArrowRight : ArrowLeft;
  const PrevSpreadIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextSpreadIcon = isRTL ? ChevronLeft : ChevronRight;
  const NextStepIcon = isRTL ? ArrowLeft : ArrowRight;
  const PrevStepIcon = isRTL ? ArrowRight : ArrowLeft;

  const isNonStandardPageCount = !STANDARD_PAGE_COUNTS.includes(
    pageCount as (typeof STANDARD_PAGE_COUNTS)[number]
  );

  // 6 Interactive checklist steps (used in Step 4 & quick checklist view)
  const pipelineSteps: Array<{
    key: keyof StudioProductionChecklist;
    num: number;
    labelAr: string;
    labelEn: string;
    meta?: string;
  }> = [
    {
      key: 'photoApproved',
      num: 1,
      labelAr: 'جودة الصورة ممتازة',
      labelEn: 'Photo Quality OK',
    },
    {
      key: 'characterSheetLocked',
      num: 2,
      labelAr: 'ثبات الشخصية مقفول',
      labelEn: 'Character Sheet Locked',
    },
    {
      key: 'artCompleted',
      num: 3,
      labelAr: 'الرسومات جاهزة',
      labelEn: 'Illustrations Ready',
      meta: `${uploadedArtCount}/${pages.length}`,
    },
    {
      key: 'whatsappDraftSent',
      num: 4,
      labelAr: 'أُرسلت مسودة واتساب',
      labelEn: 'WhatsApp Draft Sent',
    },
    {
      key: 'parentApproved',
      num: 5,
      labelAr: 'اعتماد ولي الأمر',
      labelEn: 'Parent Approved',
    },
    {
      key: 'kdpPdfExported',
      num: 6,
      labelAr: 'تصدير KDP 8.5×8.5',
      labelEn: 'KDP 8.5×8.5 Exported',
    },
  ];

  // 4 Guided Pipeline Steps Definitions for Navigation Tabs
  const studioPipelineSteps: Array<{
    id: StudioStep;
    num: string;
    titleAr: string;
    titleEn: string;
    subtitleAr: string;
    subtitleEn: string;
    statusTextAr: string;
    statusTextEn: string;
    isComplete: boolean;
    isInProgress: boolean;
    icon: typeof UserCheck;
  }> = [
    {
      id: 1,
      num: '01',
      titleAr: 'البطل وبصمة الشخصية',
      titleEn: 'Hero & Character DNA',
      subtitleAr: 'الملامح، الزي، وورقة الثبات (3 وضعيات)',
      subtitleEn: 'Likeness, Outfit & Turnaround Sheet',
      statusTextAr: checklist.characterSheetLocked
        ? 'مقفول ✓'
        : childRefPhoto
        ? 'الصورة جاهزة'
        : childName.trim()
        ? 'قيد الإعداد'
        : 'مطلوب',
      statusTextEn: checklist.characterSheetLocked
        ? 'Locked ✓'
        : childRefPhoto
        ? 'Photo Ready'
        : childName.trim()
        ? 'In Progress'
        : 'Pending',
      isComplete: Boolean(checklist.characterSheetLocked || characterSheetPreview),
      isInProgress: Boolean(childName.trim() || childRefPhoto),
      icon: UserCheck,
    },
    {
      id: 2,
      num: '02',
      titleAr: 'سيناريو القصة وفصولها',
      titleEn: 'Story Script & Arc',
      subtitleAr: `${pageCount} مشهد • ${storyLang === 'ar' ? 'عربي' : 'EN'} • بدون تكرار`,
      subtitleEn: `${pageCount} Scenes • ${storyLang.toUpperCase()} • Zero Repetition`,
      statusTextAr: pages.length >= 10 ? `${pages.length} مشهد جاهز ✓` : 'مسودة مبدئية',
      statusTextEn: pages.length >= 10 ? `${pages.length} Scenes Ready ✓` : 'Draft Arc',
      isComplete: pages.length >= 10 && Boolean(storyTitle.trim()),
      isInProgress: pages.length > 0,
      icon: FileText,
    },
    {
      id: 3,
      num: '03',
      titleAr: 'الرسومات وبرومبتات 300 DPI',
      titleEn: 'Scene Artwork & 300 DPI',
      subtitleAr: `${uploadedArtCount}/${pages.length} لوحة • ${ready300DpiCount} بدقة الطباعة`,
      subtitleEn: `${uploadedArtCount}/${pages.length} Art • ${ready300DpiCount} at 300 DPI`,
      statusTextAr:
        uploadedArtCount === pages.length && ready300DpiCount === pages.length
          ? '300 DPI جاهز 100% ✓'
          : uploadedArtCount > 0
          ? `${uploadedArtCount}/${pages.length} لوحة`
          : '0 لوحة',
      statusTextEn:
        uploadedArtCount === pages.length && ready300DpiCount === pages.length
          ? '300 DPI 100% Ready ✓'
          : uploadedArtCount > 0
          ? `${uploadedArtCount}/${pages.length} Art`
          : '0 Art',
      isComplete: uploadedArtCount === pages.length && ready300DpiCount === pages.length,
      isInProgress: uploadedArtCount > 0,
      icon: Sparkles,
    },
    {
      id: 4,
      num: '04',
      titleAr: 'مراجعة الجودة وتصدير KDP',
      titleEn: 'Quality Review & KDP Export',
      subtitleAr: `${checklistProgress.completed}/${checklistProgress.total} معايير • واتساب و KDP`,
      subtitleEn: `${checklistProgress.completed}/${checklistProgress.total} Checks • WhatsApp & PDF`,
      statusTextAr:
        checklistProgress.completed === checklistProgress.total
          ? 'معتمد للطباعة ✓'
          : `${checklistProgress.completed}/${checklistProgress.total} معايير`,
      statusTextEn:
        checklistProgress.completed === checklistProgress.total
          ? 'Print Approved ✓'
          : `${checklistProgress.completed}/${checklistProgress.total} Checks`,
      isComplete: checklistProgress.completed === checklistProgress.total,
      isInProgress: checklistProgress.completed > 0,
      icon: ShieldCheck,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[min(100%,108rem)] mx-auto">
        {/* Top Midnight Magic Header & Primary Actions */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 border-white/10 space-y-5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/25 to-pink-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
                  <Wand2 className="w-6 h-6 text-cyan-300" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-editorial leading-tight">
                      {isAr ? 'استوديو القصص والرسومات المتسقة' : 'Story & Illustration Studio'}
                    </h1>
                    <Badge className="bg-cyan-500/15 text-cyan-200 border border-cyan-400/35 rounded-full px-3 py-0.5 text-[11px] font-bold font-numeric">
                      {isAr ? 'المرحلة 02 • KDP 8.5"×8.5"' : 'Stage 02 • KDP 8.5"×8.5"'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-300 mt-0.5">
                    {isAr
                      ? 'خط إنتاج موجه في 4 خطوات: من بصمة البطل والسيناريو، حتى توليد رسومات 300 DPI وتصدير KDP.'
                      : 'Guided 4-step production pipeline: from Hero DNA & script to 300 DPI scene art & KDP print export.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => persistCurrentDraft(true)}
                className="bubble-btn-outline h-10 px-4 text-xs font-bold gap-2"
              >
                <Save className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'حفظ المسودة' : 'Save Draft'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadPromptPack}
                className="h-10 px-4 rounded-full bg-cyan-500/15 border-cyan-400/35 text-cyan-100 hover:bg-cyan-500/25 text-xs font-bold gap-2"
              >
                <FileDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'تحميل الأوامر (.txt)' : 'Download Prompts (.txt)'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCopyAllPrompts()}
                className="h-10 px-4 rounded-full bg-slate-900/75 border-white/15 text-slate-100 hover:bg-slate-800/90 hover:border-cyan-400/40 text-xs font-semibold gap-2"
              >
                <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'نسخ الأوامر' : 'Copy All'}</span>
              </Button>

              {selectedOrder && whatsAppHelpers && (
                <Button
                  type="button"
                  onClick={handleSendWhatsAppDraftApproval}
                  className="bubble-btn-emerald h-10 px-4 text-xs font-bold gap-2"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr ? 'إرسال مسودة واتساب' : 'WhatsApp Draft'}
                  </span>
                </Button>
              )}

              <Button
                type="button"
                onClick={handleOpenKdpPdfBuilder}
                className="bubble-btn bubble-btn-primary h-10 px-5 text-xs font-bold gap-2"
              >
                <BookCopy className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {isAr ? (
                    <>
                      فتح صانع <span className="font-numeric">KDP 8.5×8.5</span>
                    </>
                  ) : (
                    <>
                      Open in <span className="font-numeric">KDP 8.5×8.5</span>
                    </>
                  )}
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => void handleExportQuickProof()}
                className="h-10 px-3.5 rounded-full bg-slate-900/75 border-white/15 text-slate-200 hover:bg-slate-800/90 text-xs font-semibold gap-1.5"
              >
                <Printer className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'معاينة سريعة' : 'Quick Proof'}</span>
              </Button>
            </div>
          </div>

          {/* Live Status Strip: Auto-Save Indicator + Order Badge + 300 DPI Count + AI Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-2.5">
              <div
                aria-live="polite"
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${
                  saveStatus === 'saving'
                    ? 'bg-cyan-500/15 border-cyan-400/35 text-cyan-200'
                    : saveStatus === 'saved'
                    ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'
                    : 'bg-slate-900/70 border-white/10 text-slate-300'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Clock className="w-4 h-4 text-cyan-300 animate-pulse shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'جاري الحفظ التلقائي...' : 'Auto-saving draft...'}</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'تم الحفظ ✓' : 'Saved ✓'}</span>
                    {lastSavedAt && (
                      <span className="text-[11px] text-emerald-200/80 font-numeric">
                        • {formatDraftTimestamp(lastSavedAt, isAr)}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    <span>
                      {isAr ? 'الحفظ التلقائي مُفعّل لكل طلب' : 'Auto-save active per order'}
                    </span>
                  </>
                )}
              </div>

              <Badge className="bg-purple-500/15 text-purple-200 border border-purple-400/30 rounded-full px-3 py-1 text-xs font-medium">
                {selectedOrder ? (
                  <span className="font-numeric">
                    {isAr ? `طلب: ${selectedOrder.reference}` : `Order: ${selectedOrder.reference}`}
                  </span>
                ) : (
                  <span>{isAr ? 'مسودة مستقلة' : 'Standalone Draft'}</span>
                )}
              </Badge>

              <Badge className="bg-slate-900/80 text-cyan-200 border border-cyan-400/25 rounded-full px-3 py-1 text-xs font-semibold font-numeric">
                {isAr
                  ? `لوحات مرفوعة: ${uploadedArtCount}/${pages.length} • 300 DPI: ${ready300DpiCount}`
                  : `Uploaded Art: ${uploadedArtCount}/${pages.length} • 300 DPI: ${ready300DpiCount}`}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGuideBanner((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                  showGuideBanner
                    ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-100'
                    : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                <span>
                  {isAr
                    ? showGuideBanner
                      ? 'إخفاء الدليل التفاعلي'
                      : 'كيف يعمل الاستوديو؟'
                    : showGuideBanner
                    ? 'Hide Studio Guide'
                    : 'How Story Studio Works'}
                </span>
                {showGuideBanner ? (
                  <ChevronUp className="w-3.5 h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
                )}
              </button>

              <a
                href="/docs/BUBBLEVERSE_FIRST_STORY_PLAYBOOK.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-200 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'دليل PDF' : 'Playbook PDF'}</span>
              </a>

              <Link
                to="/admin/integrations"
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isAiActive
                    ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/25'
                    : 'bg-amber-500/15 border-amber-400/35 text-amber-100 hover:bg-amber-500/25'
                }`}
              >
                {isAiActive ? (
                  <>
                    <Cpu className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span>
                      {isAr
                        ? `محرك AI: ${aiProviderName}`
                        : `AI Engine: ${aiProviderName}`}
                    </span>
                    {aiConfig.model && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-950/60 text-[11px] text-cyan-200 font-numeric">
                        {aiConfig.model}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <PlugZap className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
                    <span>
                      {isAr
                        ? 'ربط AI غير مُعدّ • إعداد الآن'
                        : 'AI Not Connected • Integrations'}
                    </span>
                  </>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Intuitive Interactive "How Story Studio Works" Guide Banner */}
        {showGuideBanner && (
          <div className="glass-card rounded-3xl p-5 sm:p-6 border-cyan-400/25 bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-purple-950/25 space-y-4 shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>
                      {isAr
                        ? 'كيف يعمل استوديو القصص — دليل خط الإنتاج في 4 خطوات'
                        : 'How Story Studio Works — 4-Step Production Pipeline Guide'}
                    </span>
                    <Badge className="bg-cyan-500/20 text-cyan-200 border-cyan-400/30 text-[10px] font-bold">
                      {isAr ? 'خطوات موجهة' : 'Guided Workflow'}
                    </Badge>
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isAr
                      ? 'من صورة الطفل وحتى تصدير ملف KDP 8.5"×8.5" الجاهز للمطبعة بدقة 300 DPI — اضغط أي بطاقة للانتقال الفوري للخطوة.'
                      : 'From child photo to 300 DPI press-ready KDP 8.5"×8.5" hardcover PDF — click any card to jump directly to that step.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOverviewMode((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                    isOverviewMode
                      ? 'bg-purple-500/20 border-purple-400/40 text-purple-100'
                      : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  <Layers className="w-4 h-4 text-purple-300 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr
                      ? isOverviewMode
                        ? 'الوضع: عرض شامل'
                        : 'الوضع: خطوة بخطوة'
                      : isOverviewMode
                      ? 'Mode: All Steps'
                      : 'Mode: Step by Step'}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
              {studioPipelineSteps.map((step) => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                return (
                  <div
                    key={step.id}
                    onClick={() => {
                      setActiveStep(step.id);
                      setIsOverviewMode(false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveStep(step.id);
                        setIsOverviewMode(false);
                      }
                    }}
                    className={`rounded-2xl p-4 border text-start transition-all cursor-pointer space-y-2.5 relative group ${
                      isActive
                        ? 'bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/10 border-cyan-400/60 shadow-[0_0_20px_rgba(0,217,255,0.18)]'
                        : 'bg-slate-900/60 border-white/10 hover:border-cyan-400/35 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-numeric text-xs font-bold ${
                            step.isComplete
                              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                              : isActive
                              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {step.num}
                        </div>
                        <Icon className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                      </div>
                      <Badge
                        className={`text-[10px] font-bold px-2 py-0.5 ${
                          step.isComplete
                            ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                            : step.isInProgress
                            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                            : 'bg-slate-800 text-slate-400 border-white/10'
                        }`}
                      >
                        {isAr ? step.statusTextAr : step.statusTextEn}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
                        {isAr ? step.titleAr : step.titleEn}
                      </h3>
                      <p className="text-[11px] text-slate-300/90 mt-1 leading-relaxed">
                        {isAr ? step.subtitleAr : step.subtitleEn}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-cyan-300 font-semibold">
                      <span>{isAr ? 'الانتقال إلى الخطوة' : 'Go to step'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Production Rules Strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-white/10 text-[11px] text-slate-400 font-numeric">
              <span className="flex items-center gap-1.5 text-amber-200">
                <Lightbulb className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'قاعدة 300 DPI:' : '300 DPI Rule:'}</span>
                <span className="text-slate-300">{isAr ? 'المقاس المستهدف 2588×2625 px للطباعة الكاملة' : '2588×2625 px target for full bleed'}</span>
              </span>
              <span className="flex items-center gap-1.5 text-cyan-200">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'خزنة الصور:' : 'PhotoVault:'}</span>
                <span className="text-slate-300">{isAr ? 'صفر تصغير للدقة، حفظ كامل في متصفحك' : 'Zero downscaling, full resolution in IndexedDB'}</span>
              </span>
              <span className="flex items-center gap-1.5 text-purple-200">
                <FolderClock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'استئناف فوري:' : 'Instant Resume:'}</span>
                <span className="text-slate-300">{isAr ? 'إعادة فتح الطلب تسترجع البرومبتات والصور فوراً' : 'Reopening orders restores prompts & art automatically'}</span>
              </span>
            </div>
          </div>
        )}

        {/* 4-Step Pipeline Navigation Tabs with Progress Indicators */}
        <div className="glass-card rounded-3xl p-3 sm:p-4 border-cyan-400/20 bg-slate-950/70 space-y-2">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-300" aria-hidden="true" />
              <span>{isAr ? 'مراحل خط الإنتاج الأربعة' : '4-Step Production Pipeline'}</span>
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline">
                {isAr ? 'التقدم الإجمالي:' : 'Overall Progress:'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 font-bold font-numeric">
                {checklistProgress.completed} / {checklistProgress.total} {isAr ? 'معايير' : 'checks'}
              </span>
            </div>
          </div>

          <div
            role="tablist"
            aria-label={isAr ? 'خطوات إنتاج القصة' : 'Story production steps'}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5"
          >
            {studioPipelineSteps.map((step) => {
              const Icon = step.icon;
              const isActive = !isOverviewMode && activeStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveStep(step.id);
                    setIsOverviewMode(false);
                  }}
                  className={`min-h-[58px] p-3 rounded-2xl border text-start flex items-center gap-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/25 via-purple-500/25 to-pink-500/15 border-cyan-400/60 text-white shadow-[0_0_20px_rgba(0,217,255,0.22)]'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-cyan-400/30 hover:bg-slate-900/90'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                      step.isComplete
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                        : isActive
                        ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    {step.isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Icon className="w-5 h-5 text-cyan-300" aria-hidden="true" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-extrabold truncate">
                        <span className="font-numeric text-cyan-300 me-1">{step.num}.</span>
                        {isAr ? step.titleAr : step.titleEn}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          step.isComplete
                            ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'
                            : step.isInProgress
                            ? 'bg-cyan-500/15 border-cyan-400/35 text-cyan-200'
                            : 'bg-slate-950/60 border-white/10 text-slate-400'
                        }`}
                      >
                        {isAr ? step.statusTextAr : step.statusTextEn}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300/80 truncate mt-0.5 font-numeric">
                      {isAr ? step.subtitleAr : step.subtitleEn}
                    </p>
                  </div>

                  {isActive && (
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 1: Hero & Character DNA Studio */}
        {(isOverviewMode || activeStep === 1) && (
          <div className="glass-card rounded-3xl p-5 sm:p-6 border-cyan-400/25 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-cyan-300" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 text-xs font-bold font-numeric">
                      {isAr ? 'الخطوة 01' : 'Step 01'}
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white">
                      {isAr ? 'البطل وبصمة الشخصية (ورقة الثبات)' : 'Hero & Character DNA Studio'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isAr
                      ? 'اربط الطلب، حدد ملامح البطل والزي الرسمي، وولّد ورقة ثبات الشخصية (3 وضعيات) لقفل الملامح عبر كافة المشاهد.'
                      : 'Connect customer order, set hero likeness & signature outfit, and lock the 3-pose turnaround sheet.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {checklist.characterSheetLocked ? (
                  <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/40 text-xs font-bold gap-1.5 px-3 py-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <span>{isAr ? 'ورقة الشخصية مقفولة' : 'Character Sheet Locked'}</span>
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/15 text-amber-200 border-amber-400/35 text-xs font-semibold px-3 py-1">
                    {isAr ? 'يرجى رفع ورقة الشخصية لقفل الخطوة' : 'Upload sheet to lock step'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Order Selector Strip */}
            <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-4 space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-5 space-y-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-200 flex items-center justify-between gap-2">
                    <label htmlFor="studio-order-select-step1">
                      {isAr ? 'تحميل من طلبات العملاء' : 'Load From Customer Order'}
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/orders')}
                      className="text-cyan-300 hover:text-cyan-200 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <BackOrderIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'كل الطلبات' : 'All Orders'}</span>
                    </button>
                  </div>
                  <LiquidSelect
                    id="studio-order-select-step1"
                    value={selectedOrder?.id || '__standalone__'}
                    onChange={(val) => handleSelectOrder(val === '__standalone__' ? '' : val)}
                    options={[
                      {
                        value: '__standalone__',
                        label: isAr
                          ? '— وضع القصة المستقلة الحر —'
                          : '— Free Standalone Story Mode —',
                      },
                      ...orders.map((o) => {
                        const hasDraft = Boolean(getStudioDraft(o.id));
                        return {
                          value: o.id,
                          label: `${o.reference} — ${o.customerName} (${o.items[0]?.childName || (isAr ? 'البطل' : 'Hero')})${hasDraft ? (isAr ? ' [مسودة محفوظة]' : ' [Saved Draft]') : ''}`,
                        };
                      }),
                    ]}
                    triggerClassName="w-full h-11 text-xs"
                  />
                </div>

                <div className="lg:col-span-7 flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      {isAr ? 'حالة الطلب الحالي في الاستوديو:' : 'Current Order Status:'}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {selectedOrder ? (
                        <>
                          <Badge className="bg-cyan-500/15 text-cyan-200 border-cyan-400/30">
                            {selectedOrder.customerName}
                          </Badge>
                          <Badge className="bg-purple-500/15 text-purple-200 border-purple-400/30 font-numeric">
                            {selectedOrder.reference}
                          </Badge>
                          <span className="text-slate-300 font-numeric">
                            ({selectedOrder.phone || 'No phone'})
                          </span>
                        </>
                      ) : (
                        <Badge className="bg-slate-800 text-slate-300 border-white/10">
                          {isAr ? 'قصة مستقلة بدون طلب مخصص' : 'Standalone Story (No Order Linked)'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Step 1 Grid: Photos / Turnaround Sheet Slot (Left) + DNA Form & Live Prompt (Right) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* Left Column: Reference Photo + Character Turnaround Sheet */}
              <div className="xl:col-span-4 space-y-4">
                {/* Child Reference Photo Panel */}
                <div className="glass-card-inner rounded-2xl p-4 border-cyan-400/25 bg-slate-950/60 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-cyan-200">
                      {isAr ? 'الصورة المرجعية للطفل' : 'Child Reference Photo'}
                    </span>
                    {childRefPhoto && (
                      <Badge className="bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 text-[10px]">
                        {isAr ? 'مرفوعة من الطلب' : 'From Order'}
                      </Badge>
                    )}
                  </div>

                  {childRefPhoto ? (
                    <div className="flex items-center gap-3.5">
                      <img
                        src={childRefPhoto}
                        alt={childName}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-400/60 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-xs text-slate-200 font-semibold truncate">{childName}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <a
                            href={childRefPhoto}
                            download={`${sanitizeFileSlug(childName)}-reference.png`}
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 text-cyan-100 text-[11px] font-bold transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{isAr ? 'تحميل' : 'Download'}</span>
                          </a>
                          <label className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/35 text-purple-100 text-[11px] font-bold cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{isAr ? 'استبدال' : 'Replace'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => void handleChildReferencePhotoUpload(e)}
                              className="hidden"
                            />
                          </label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => void handleRemoveChildReferencePhoto()}
                            className="h-8 px-2 rounded-full text-rose-300 hover:text-rose-200 hover:bg-rose-500/15"
                            aria-label={isAr ? 'حذف الصورة' : 'Remove photo'}
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-cyan-400/35 hover:border-cyan-400/60 bg-slate-900/50 hover:bg-slate-900/80 p-4 text-center cursor-pointer transition-all">
                        <Upload className="w-5 h-5 text-cyan-300" aria-hidden="true" />
                        <span className="text-xs font-bold text-white">
                          {isAr
                            ? 'رفع صورة الطفل المرجعية (واتساب / ملف)'
                            : 'Upload Child Reference Photo (WhatsApp / Local)'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isAr
                            ? 'تُحفظ بدقتها الكاملة في الخزنة وتعتمد المعيار 1 تلقائياً'
                            : 'Saves full-res to PhotoVault & passes Check 1'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => void handleChildReferencePhotoUpload(e)}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 leading-relaxed text-center">
                        {selectedOrder
                          ? isAr
                            ? 'لم يرفع ولي الأمر صورة عند الدفع — ارفع الصورة المستلمة عبر واتساب هنا.'
                            : 'Parent did not upload at checkout — upload the WhatsApp photo here.'
                          : isAr
                          ? 'ارفع صورة الطفل لاستخراج ملامحه بدقة.'
                          : 'Upload child photo to lock likeness.'}
                      </p>
                    </div>
                  )}

                  {selectedOrder && whatsAppHelpers && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenWhatsAppPhotoRequest}
                      className="w-full h-10 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border-amber-400/35 text-amber-100 text-xs font-bold gap-2"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>
                        {isAr
                          ? 'طلب صورة أوضح عبر واتساب (ضبابية / نظارة)'
                          : 'Request Clearer Photo on WhatsApp'}
                      </span>
                    </Button>
                  )}
                </div>

                {/* Character Sheet Multi-Candidate Studio & Likeness Card */}
                <div className="glass-card-inner rounded-2xl p-4 border-purple-400/25 bg-slate-950/60 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-200">
                        {isAr ? 'ورقة ثبات الشخصية المولّدة (3 وضعيات)' : 'Character Turnaround Sheet (3 Poses)'}
                      </span>
                      {characterSheetCandidates.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/35 text-[10px] text-purple-200 font-numeric">
                          {isAr ? `${characterSheetCandidates.length} بدائل` : `${characterSheetCandidates.length} Candidates`}
                        </span>
                      )}
                    </div>
                    {checklist.characterSheetLocked && (
                      <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 text-[10px]">
                        {isAr ? 'مقفولة ومطابقة ✓' : 'Locked & Verified ✓'}
                      </Badge>
                    )}
                  </div>

                  {characterSheetPreview ? (
                    <div className="space-y-3">
                      {/* Active Character Sheet Preview */}
                      <div className="relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden border border-emerald-400/40 bg-slate-900 group">
                        <img
                          src={characterSheetPreview}
                          alt={
                            isAr
                              ? `ورقة ثبات الشخصية للبطل ${childName}`
                              : `Character consistency sheet for ${childName}`
                          }
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <div className="absolute top-2.5 start-2.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-400/40 text-[10px] text-emerald-200 font-bold flex items-center gap-1.5 shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isAr ? 'البديل المعتمد حالياً' : 'Active Winning Sheet'}</span>
                        </div>
                      </div>

                      {/* Candidate Iteration Gallery Ribbon */}
                      {characterSheetCandidates.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-white/10">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-300 font-medium">
                              {isAr ? 'سجل البدائل (اضغط للتبديل والمقارنة):' : 'Candidate Versions (Click to select):'}
                            </span>
                            {characterSheetCandidates.length > 1 && (
                              <button
                                type="button"
                                onClick={() => void handlePurgeOtherCandidates()}
                                className="text-[10px] text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                                title={isAr ? 'حذف البدائل الأخرى والاحتفاظ بالمعتمد' : 'Keep only active winner'}
                              >
                                {isAr ? 'تنظيف البدائل غير المعتمدة' : 'Purge Rejected'}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {characterSheetCandidates.map((cand, idx) => {
                              const isActive = cand.id === activeCandidateId || cand.vaultId === characterSheetVaultId;
                              return (
                                <div
                                  key={cand.id}
                                  className={`group relative flex flex-col items-center gap-1 p-1 rounded-xl border transition-all cursor-pointer ${
                                    isActive
                                      ? 'bg-cyan-500/20 border-cyan-400/70 shadow-[0_0_12px_rgba(0,217,255,0.25)]'
                                      : 'bg-slate-900/80 border-white/10 hover:border-white/30'
                                  }`}
                                  onClick={() => handleSelectCandidate(cand.id)}
                                >
                                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-950 border border-white/10">
                                    <img src={cand.url} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex items-center justify-between w-full px-1">
                                    <span className="text-[10px] font-numeric text-slate-200">
                                      {isAr ? `بديل 0${idx + 1}` : `Cand 0${idx + 1}`}
                                    </span>
                                    {isActive ? (
                                      <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          void handleDeleteCandidate(cand.id);
                                        }}
                                        className="text-slate-500 hover:text-rose-400 p-0.5"
                                        title={isAr ? 'حذف هذا البديل' : 'Delete candidate'}
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action Controls */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* Side-by-Side Comparator Button */}
                        <Button
                          type="button"
                          onClick={() => setIsComparatorOpen(true)}
                          className="bubble-btn-cyan h-9 px-3.5 text-xs font-bold gap-1.5 flex-1 min-w-[140px]"
                        >
                          <Eye className="w-4 h-4 shrink-0" />
                          <span>{isAr ? 'مقارنة الملامح جنباً إلى جنب' : 'Side-by-Side Likeness Audit'}</span>
                        </Button>

                        {/* Generate Another Candidate */}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void handleGenerateCharacterSheet()}
                          disabled={isGeneratingSheet}
                          className="h-9 px-3 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border-purple-400/40 text-purple-100 text-xs font-bold gap-1.5"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isGeneratingSheet ? 'animate-spin text-cyan-300' : ''}`} />
                          <span>{isAr ? 'توليد بديل إضافي' : 'Generate Another'}</span>
                        </Button>

                        {/* Download */}
                        <a
                          href={characterSheetPreview}
                          download={`${sanitizeFileSlug(childName)}-character-sheet.png`}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold transition-colors"
                        >
                          <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>{isAr ? 'تحميل' : 'Download'}</span>
                        </a>

                        {/* Upload Manual */}
                        <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/15 text-slate-200 text-xs font-medium cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{isAr ? 'رفع مخصص' : 'Upload Custom'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => void handleCharacterSheetUpload(e)}
                            className="hidden"
                          />
                        </label>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleRemoveCharacterSheet()}
                          className="h-9 px-2.5 rounded-full text-rose-300 hover:text-rose-100 hover:bg-rose-500/15 text-xs"
                          aria-label={isAr ? 'حذف الورقة الحالية' : 'Remove current sheet'}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Empty State: Direct One-Click Generator */
                    <div className="space-y-3">
                      <div className="rounded-2xl border-2 border-dashed border-purple-400/35 bg-slate-900/50 p-5 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 mx-auto">
                          <Sparkles className={`w-6 h-6 ${isGeneratingSheet ? 'animate-spin text-cyan-300' : ''}`} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {isAr ? 'توليد ورقة ثبات الشخصية تلقائياً' : 'Auto-Generate 3-Pose Character Sheet'}
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                            {isAr
                              ? 'توليد ورقة الشخصية بـ 3 وضعيات (أمامية، حركية، وجانبية مع بوب) لتثبيت ملامح البطل عبر كافة مشاهد القصة.'
                              : 'Generates a 3-pose consistency sheet (Front, Action, Profile with Bub) to lock the hero across all scenes.'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          <Button
                            type="button"
                            onClick={() => void handleGenerateCharacterSheet()}
                            disabled={isGeneratingSheet}
                            className="bubble-btn-purple h-10 px-5 text-xs font-bold gap-2"
                          >
                            <Sparkles className={`w-4 h-4 ${isGeneratingSheet ? 'animate-spin' : ''}`} />
                            <span>
                              {isGeneratingSheet
                                ? isAr
                                  ? 'جاري توليد ورقة الشخصية (3 وضعيات)...'
                                  : 'Generating 3-Pose Sheet...'
                                : isAr
                                ? '✨ توليد ورقة ثبات الشخصية الآن'
                                : '✨ Generate Character Sheet Now'}
                            </span>
                          </Button>

                          <label className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/15 text-slate-300 text-xs font-medium cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{isAr ? 'أو ارفع ورقة مولدة يدوياً' : 'Or Upload Manual Sheet'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => void handleCharacterSheetUpload(e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Character DNA Inputs + Master Sheet Live Prompt */}
              <div className="xl:col-span-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4 space-y-1.5 min-w-0">
                    <label htmlFor="studio-hero-name-step1" className="text-xs text-slate-300 font-medium">
                      {isAr ? 'اسم البطل' : 'Hero Name'}
                    </label>
                    <Input
                      id="studio-hero-name-step1"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="h-11 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1.5 min-w-0">
                    <label htmlFor="studio-hero-age" className="text-xs text-slate-300 font-medium">
                      {isAr ? 'عمر البطل' : 'Hero Age'}
                    </label>
                    <Input
                      id="studio-hero-age"
                      value={characterDna.childAge}
                      onChange={(e) => updateDnaField('childAge', e.target.value)}
                      placeholder="5"
                      className="h-11 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-white font-numeric"
                    />
                  </div>

                  <div className="sm:col-span-5 space-y-1.5 min-w-0">
                    <span className="text-xs text-slate-300 font-medium block">
                      {isAr ? 'جنس البطل' : 'Hero Gender'}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 h-11 p-1 rounded-2xl bg-slate-950/80 border border-white/15">
                      <button
                        type="button"
                        aria-pressed={characterDna.childGender === 'boy'}
                        onClick={() => updateDnaField('childGender', 'boy')}
                        className={`rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          characterDna.childGender === 'boy'
                            ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-400/45'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {isAr ? 'ولد' : 'Boy'}
                      </button>
                      <button
                        type="button"
                        aria-pressed={characterDna.childGender === 'girl'}
                        onClick={() => updateDnaField('childGender', 'girl')}
                        className={`rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          characterDna.childGender === 'girl'
                            ? 'bg-pink-500/25 text-pink-100 border border-pink-400/45'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {isAr ? 'بنت' : 'Girl'}
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-12 space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label htmlFor="studio-dna-hair" className="text-xs text-slate-300 font-medium">
                          {isAr ? 'الشعر وملامح الوجه (بالإنجليزية للأمر)' : 'Hair & Facial Features (in English for AI)'}
                        </label>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-[10px] text-slate-400">
                          {isAr ? 'قالب مقترح — قابل للتعديل' : 'Template Baseline — Editable'}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleExtractLikeness()}
                        disabled={isExtractingLikeness || !childRefPhoto}
                        className="h-7 px-2.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-400/35 text-cyan-200 text-[11px] font-bold gap-1.5 transition-all"
                        title={
                          !childRefPhoto
                            ? (isAr ? 'ارفع صورة الطفل أولاً لاستخراج ملامحه' : 'Upload child photo first')
                            : (isAr ? 'استخراج تسريحة ولون الشعر والعينين والملامح' : 'Extract hair and facial features')
                        }
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isExtractingLikeness ? 'animate-spin text-cyan-300' : ''}`} />
                        <span>
                          {isExtractingLikeness
                            ? isAr
                              ? 'جاري الاستخراج بالذكاء الاصطناعي...'
                              : 'Extracting...'
                            : isAr
                            ? '✨ استخراج الملامح بالذكاء الاصطناعي من الصورة'
                            : 'AI Extract from Photo'}
                        </span>
                      </Button>
                    </div>
                    <Input
                      id="studio-dna-hair"
                      dir="ltr"
                      value={characterDna.hairAndFeatures}
                      onChange={(e) => updateDnaField('hairAndFeatures', e.target.value)}
                      placeholder="curly dark hair, expressive warm eyes, natural joyful smile"
                      className="h-11 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-white"
                    />

                    {/* Quick Presets Bar */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {isAr ? 'إضافات وتعديلات سريعة للملامح:' : 'Quick Presets:'}
                      </span>
                      {LIKENESS_FEATURE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleApplyLikenessPreset(preset)}
                          className="px-2 py-0.5 rounded-full bg-slate-900/90 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-[10px] text-slate-300 hover:text-cyan-200 transition-all cursor-pointer"
                          title={preset.descEn}
                        >
                          + {isAr ? preset.labelAr : preset.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Story Theme & Persona Dropdown */}
                  <div className="sm:col-span-12 space-y-1.5 pt-2 border-t border-white/10 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor="studio-theme-select" className="text-xs font-semibold text-slate-300">
                        {isAr ? 'ثيم القصة وتنسيق الشخصية التلقائي' : 'Story Theme & Auto-Adapt Persona'}
                      </label>
                      <span className="text-[11px] text-cyan-300/80">
                        {isAr ? 'يحدد تلقائياً الزي والغرض والوضعية (2)' : 'Auto-adapts outfit, prop & pose (2)'}
                      </span>
                    </div>
                    <LiquidSelect
                      id="studio-theme-select"
                      aria-label={isAr ? 'ثيم القصة وتنسيق الشخصية' : 'Story theme and persona'}
                      value={characterDna.storyTheme || 'bubble'}
                      onChange={(val) => handleAdaptDnaToTheme(val)}
                      options={THEME_PRESETS.map((preset) => ({
                        value: preset.id,
                        label: isAr ? preset.labelAr : preset.labelEn,
                      }))}
                      triggerClassName="h-11 rounded-2xl bg-slate-950/80 border-cyan-400/35"
                    />
                  </div>

                  <div className="sm:col-span-12 space-y-1.5 min-w-0">
                    <label htmlFor="studio-dna-outfit" className="text-xs text-slate-300 font-medium">
                      {isAr
                        ? 'الزي الرسمي الثابت للبطل في هذا الكتاب (Signature Outfit)'
                        : 'Signature Outfit for This Book (Locked Across Scenes)'}
                    </label>
                    <Input
                      id="studio-dna-outfit"
                      dir="ltr"
                      value={characterDna.signatureOutfit}
                      onChange={(e) => updateDnaField('signatureOutfit', e.target.value)}
                      placeholder="e.g. olive-green safari vest with khaki cargo shorts and explorer boots"
                      className="h-11 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-6 space-y-1.5 min-w-0">
                    <label htmlFor="studio-dna-prop" className="text-xs text-slate-300 font-medium">
                      {isAr ? 'الغرض/الأداة المميزة للبطل (Signature Prop)' : 'Signature Prop / Item'}
                    </label>
                    <Input
                      id="studio-dna-prop"
                      dir="ltr"
                      value={characterDna.signatureProp ?? ''}
                      onChange={(e) => updateDnaField('signatureProp', e.target.value)}
                      placeholder="e.g. magnifying glass & fossil notebook"
                      className="h-11 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-6 space-y-1.5 min-w-0">
                    <label htmlFor="studio-dna-pose2" className="text-xs text-slate-300 font-medium">
                      {isAr ? 'الوضعية الثانية في ورقة الشخصية (Pose 2)' : 'Pose (2) in Master Character Sheet'}
                    </label>
                    <Input
                      id="studio-dna-pose2"
                      dir="ltr"
                      value={characterDna.pose2Description ?? ''}
                      onChange={(e) => updateDnaField('pose2Description', e.target.value)}
                      placeholder="(2) 3/4 view holding a magnifying glass excitedly"
                      className="h-11 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Global Art Direction Presets Dropdown + Manual Input */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="studio-art-style-select"
                      className="text-xs font-semibold text-slate-300"
                    >
                      {isAr ? 'الأسلوب الفني العام للقصة' : 'Global Art Direction Style'}
                    </label>
                    <span className="text-[11px] text-cyan-300/80">
                      {isAr ? 'اختر نمطاً فنياً جاهزاً أو عدّل النص' : 'Choose preset or customize text'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-5">
                      <LiquidSelect
                        id="studio-art-style-select"
                        aria-label={isAr ? 'نمط الرسم الفني' : 'Art direction style'}
                        value={
                          ART_STYLE_PRESETS.find((p) => p.value === artStyle)?.value || 'custom'
                        }
                        onChange={(val) => {
                          if (val !== 'custom') setArtStyle(val);
                        }}
                        options={[
                          ...ART_STYLE_PRESETS.map((p) => ({
                            value: p.value,
                            label: isAr ? p.labelAr : p.labelEn,
                          })),
                          {
                            value: 'custom',
                            label: isAr ? '— نمط فني مخصص يدوي —' : '— Custom Manual Prompt —',
                          },
                        ]}
                        triggerClassName="h-11 rounded-2xl bg-slate-950/80 border-white/15"
                      />
                    </div>
                    <div className="sm:col-span-7 flex gap-2">
                      <Input
                        id="studio-art-style-step1"
                        dir="ltr"
                        value={artStyle}
                        onChange={(e) => setArtStyle(e.target.value)}
                        className="h-11 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-slate-200 flex-1"
                        placeholder="3D Pixar Storybook, rich pastel lighting..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSyncDnaToAllPrompts}
                        className="h-11 px-4 rounded-2xl bg-slate-900/80 border-white/15 text-xs font-semibold text-cyan-200 hover:border-cyan-400/45 gap-1.5 shrink-0"
                      >
                        <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{isAr ? 'تطبيق للكل' : 'Sync All'}</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Live Auto-Generated Master Character Sheet Prompt */}
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="studio-master-sheet-prompt"
                      className="text-xs sm:text-sm font-bold text-cyan-200 flex items-center gap-2"
                    >
                      <Sparkles className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
                      <span>
                        {isAr
                          ? 'أمر ورقة ثبات الشخصية الرئيسي (مُحدّث تلقائياً)'
                          : 'Master Character Sheet Prompt (Live Auto-Generated)'}
                      </span>
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          void handleCopyText(
                            masterCharacterSheetPrompt,
                            'تم نسخ أمر ورقة ثبات الشخصية بنجاح ✓',
                            'Master Character Sheet Prompt copied ✓'
                          )
                        }
                        className="bubble-btn-outline h-9 px-3.5 text-xs font-bold gap-1.5"
                      >
                        <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{isAr ? 'نسخ أمر ورقة الشخصية' : 'Copy Sheet Prompt'}</span>
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="studio-master-sheet-prompt"
                    dir="ltr"
                    readOnly
                    rows={4}
                    value={masterCharacterSheetPrompt}
                    className="rounded-2xl bg-slate-950/90 border-cyan-400/25 text-cyan-100 text-xs font-mono leading-relaxed select-all"
                  />
                </div>
              </div>
            </div>

            {/* Step 1 Bottom Guided Navigation Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                {isAr
                  ? 'بمجرد قفل ورقة الشخصية، انتقل للخطوة الثانية لصياغة سيناريو القصة.'
                  : 'Once Character Sheet is locked, proceed to Step 2 to shape the story arc.'}
              </span>
              <Button
                type="button"
                onClick={() => setActiveStep(2)}
                className="bubble-btn bubble-btn-primary h-11 px-6 text-xs font-bold gap-2"
              >
                <span>{isAr ? 'المتابعة إلى الخطوة 2: سيناريو القصة وفصولها' : 'Continue to Step 2: Story Script & Arc'}</span>
                <NextStepIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Story Script & Arc Studio */}
        {(isOverviewMode || activeStep === 2) && (
          <div className="glass-card rounded-3xl p-5 sm:p-6 border-purple-400/25 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-400/35 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-purple-300" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-xs font-bold font-numeric">
                      {isAr ? 'الخطوة 02' : 'Step 02'}
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white">
                      {isAr ? 'سيناريو القصة وفصولها' : 'Story Script & Arc Studio'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isAr
                      ? 'حدد عنوان الكتاب، عدد الصفحات (حد KDP الأدنى 24 صفحة)، وولّد تدفق الأحداث تلقائياً أو عبر الذكاء الاصطناعي المتصل.'
                      : 'Configure book title, page count (KDP min: 24), and generate beats with zero repetition.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-purple-500/15 text-purple-200 border-purple-400/30 font-numeric text-xs px-3 py-1">
                  {pages.length} {isAr ? 'مشهد' : 'Scenes'} • {storyLang.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Story Metadata Controls */}
            <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6 space-y-1.5 min-w-0">
                  <label htmlFor="studio-story-title-step2" className="text-xs text-slate-300 font-medium">
                    {isAr ? 'عنوان الكتاب' : 'Book Title'}
                  </label>
                  <Input
                    id="studio-story-title-step2"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    className="h-11 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1.5 min-w-0">
                  <label htmlFor="studio-lang-select-step2" className="text-xs text-slate-300 font-medium">
                    {isAr ? 'لغة القصة' : 'Story Language'}
                  </label>
                  <LiquidSelect
                    id="studio-lang-select-step2"
                    value={storyLang}
                    onChange={(val) => setStoryLang(val as 'ar' | 'en')}
                    options={[
                      { value: 'ar', label: isAr ? 'عربي (RTL)' : 'Arabic (RTL)' },
                      { value: 'en', label: isAr ? 'إنجليزي (LTR)' : 'English (LTR)' },
                    ]}
                    triggerClassName="h-11 w-full text-xs"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1.5 min-w-0">
                  <label htmlFor="studio-page-count-step2" className="text-xs text-slate-300 font-medium">
                    {isAr ? 'عدد الصفحات (حد KDP: 24)' : 'Page Count (KDP Min: 24)'}
                  </label>
                  <LiquidSelect
                    id="studio-page-count-step2"
                    value={String(pageCount)}
                    onChange={(val) => setPageCount(Number(val))}
                    options={[
                      { value: '10', label: isAr ? '10 صفحات' : '10 pages' },
                      { value: '15', label: isAr ? '15 صفحة' : '15 pages' },
                      { value: '20', label: isAr ? '20 صفحة' : '20 pages' },
                      {
                        value: '24',
                        label: isAr ? '24 صفحة (حد KDP الأدنى)' : '24 pages (KDP Min)',
                      },
                      ...(isNonStandardPageCount
                        ? [
                            {
                              value: String(pageCount),
                              label: isAr ? `${pageCount} صفحة` : `${pageCount} pages`,
                            },
                          ]
                        : []),
                    ]}
                    triggerClassName="h-11 w-full text-xs font-numeric"
                  />
                </div>
              </div>

              {/* Generation Buttons Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                <span className="text-xs text-slate-400">
                  {isAr
                    ? 'إعادة التوليد تحافظ على أي لوحات رفعتها مسبقاً في الصفحات المقابلة.'
                    : 'Regenerating preserves any artwork you already uploaded to matching slots.'}
                </span>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    type="button"
                    onClick={handleAutoGenerate}
                    className="bubble-btn-secondary h-10 px-4 text-xs font-bold gap-2"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      {isAr ? (
                        <>
                          توليد فصول القصة <span className="font-numeric">({pageCount})</span>
                        </>
                      ) : (
                        <>
                          Auto-Draft Beats <span className="font-numeric">({pageCount}p)</span>
                        </>
                      )}
                    </span>
                  </Button>

                  {isAiTextCapable ? (
                    <Button
                      type="button"
                      disabled={isEnhancingAi}
                      onClick={() => void handleEnhanceWithAi()}
                      className="h-10 px-4 rounded-full bg-gradient-to-r from-purple-500/25 to-pink-500/25 hover:from-purple-500/35 hover:to-pink-500/35 border border-purple-400/45 text-purple-100 text-xs font-bold gap-2"
                    >
                      {isEnhancingAi ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                      ) : (
                        <Cpu className="w-4 h-4 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {isEnhancingAi
                          ? isAr
                            ? 'جاري التحسين بالذكاء الاصطناعي...'
                            : 'Enhancing with AI...'
                          : isAr
                          ? 'تحسين السيناريو عبر AI المتصل'
                          : 'Enhance Script with Connected AI'}
                      </span>
                    </Button>
                  ) : (
                    <Link
                      to="/admin/integrations"
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/35 text-amber-200 text-xs font-semibold transition-colors"
                    >
                      <PlugZap className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>
                        {isAr
                          ? 'تحسين السيناريو عبر AI (اربط Gemini / OpenAI)'
                          : 'Connect Gemini / OpenAI for AI Scriptwriting'}
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Script Scenes Beats Review List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{isAr ? 'نصوص فصول القصة ومراجعتها' : 'Story Scenes & Script Review'}</span>
                  <Badge className="bg-slate-800 text-cyan-200 border-white/10 font-numeric text-xs">
                    {pages.length} {isAr ? 'مشهد' : 'scenes'}
                  </Badge>
                </h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddPage}
                  className="h-9 px-3 rounded-full bg-white/10 hover:bg-cyan-500/25 border border-white/15 text-white text-xs font-semibold gap-1.5"
                >
                  <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'إضافة مشهد جديد' : 'Add Scene'}</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pages.map((p, idx) => (
                  <div
                    key={p.pageNumber}
                    className="rounded-2xl p-3.5 bg-slate-950/70 border border-white/10 hover:border-purple-400/35 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-200 font-bold font-numeric text-xs">
                        {isAr ? `مشهد ${p.pageNumber}` : `Scene ${p.pageNumber}`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActivePageIndex(idx);
                            setActiveStep(3);
                          }}
                          className="text-[11px] text-cyan-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isAr ? 'الرسمة والأمر' : 'Artwork & Prompt'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        {pages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeletePage(idx)}
                            aria-label={isAr ? `حذف صفحة ${p.pageNumber}` : `Delete page ${p.pageNumber}`}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                    <Textarea
                      rows={2}
                      dir={storyLang === 'ar' ? 'rtl' : 'ltr'}
                      value={p.text}
                      onChange={(e) => updatePage(idx, { text: e.target.value })}
                      className="rounded-xl bg-slate-900/80 border-white/10 text-xs text-white leading-relaxed resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 Bottom Guided Navigation Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveStep(1)}
                className="bubble-btn-outline h-11 px-5 text-xs font-bold gap-2"
              >
                <PrevStepIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'الرجوع إلى الخطوة 1: البطل وبصمة الشخصية' : 'Back to Step 1: Hero & DNA'}</span>
              </Button>

              <Button
                type="button"
                onClick={() => setActiveStep(3)}
                className="bubble-btn bubble-btn-primary h-11 px-6 text-xs font-bold gap-2"
              >
                <span>{isAr ? 'المتابعة إلى الخطوة 3: الرسومات وبرومبتات 300 DPI' : 'Continue to Step 3: Scene Artwork & Prompts'}</span>
                <NextStepIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Scene Artwork & 300 DPI Prompts Studio */}
        {(isOverviewMode || activeStep === 3) && (
          <div className="space-y-6">
            {/* Prompt Engine Switcher Bar */}
            <div className="glass-card rounded-3xl p-5 border-purple-400/25 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-xs font-bold font-numeric">
                      {isAr ? 'الخطوة 03' : 'Step 03'}
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                      {isAr
                        ? 'الرسومات وبرومبتات KDP 8.5"×8.5" (محرك الأوامر الهجين)'
                        : 'Scene Artwork & KDP 8.5"×8.5" Prompts (Hybrid Prompt Engine)'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300">
                    {isAr
                      ? 'التبديل بين المحركات يعيد صياغة أوامر المشاهد فوراً بصيغة KDP الخماسية الآمنة لطباعة 300 DPI.'
                      : 'Switching engines reformats all prompts for 8.5"×8.5" full-bleed 300 DPI print safety.'}
                  </p>
                </div>

                {/* Segmented 3-Engine Switcher */}
                <div
                  role="group"
                  aria-label={isAr ? 'اختيار محرك توليد الصور' : 'Select illustration prompt engine'}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950/85 border border-white/10"
                >
                  {PROMPT_ENGINE_OPTIONS.map((opt) => {
                    const active = promptEngine === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleSwitchPromptEngine(opt.id)}
                        className={`px-3.5 py-2 rounded-xl text-start transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          active
                            ? 'bg-gradient-to-r from-cyan-500/25 via-purple-500/25 to-pink-500/20 border border-cyan-400/55 text-white shadow-[0_0_18px_rgba(0,217,255,0.2)]'
                            : 'border border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="block text-xs font-extrabold">{opt.labelEn}</span>
                        <span className="block text-[10px] text-cyan-200/85 mt-0.5">
                          {isAr ? opt.tagAr : opt.tagEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Midjourney --cref URL Input */}
              {promptEngine === 'midjourney' && (
                <div className="rounded-2xl bg-purple-950/30 border border-purple-400/30 p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <label
                    htmlFor="studio-mj-cref"
                    className="text-xs font-bold text-purple-200 shrink-0"
                  >
                    {isAr ? 'رابط ورقة الشخصية لـ Midjourney (--cref):' : 'Midjourney --cref Sheet URL:'}
                  </label>
                  <Input
                    id="studio-mj-cref"
                    dir="ltr"
                    value={characterDna.midjourneyCrefUrl || ''}
                    onChange={(e) => updateDnaField('midjourneyCrefUrl', e.target.value)}
                    placeholder="https://cdn.discordapp.com/attachments/.../character-sheet.png"
                    className="h-10 rounded-xl bg-slate-950/85 border-purple-400/30 text-xs text-white font-mono flex-1"
                  />
                  <span className="text-[11px] text-purple-200/80 font-numeric shrink-0">
                    --cw 85 --ar 1:1
                  </span>
                </div>
              )}
            </div>

            {/* AI Image Generation Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-purple-500/15 via-cyan-500/10 to-slate-900 border border-purple-400/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {isAr ? 'محرك توليد رسومات المشاهد بالذكاء الاصطناعي (AI Scene Painter)' : 'AI Scene Illustration Engine'}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    {isAr
                      ? 'يولد صوراً فائقة الجودة متوافقة مع KDP 8.5"×8.5" عبر Google Imagen 3 ومحرك FLUX.1 مجاناً.'
                      : 'Generates 1:1 high-resolution illustrations using Google Imagen 3 and FLUX.1 free engine.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => void handleBatchGeneratePages()}
                  disabled={isBatchGenerating}
                  className="bubble-btn-purple h-10 px-5 text-xs font-bold gap-2 shadow-md"
                >
                  <Sparkles className={`w-4 h-4 ${isBatchGenerating ? 'animate-spin text-cyan-300' : ''}`} />
                  <span>
                    {isBatchGenerating
                      ? isAr
                        ? 'جاري توليد رسومات الكتاب...'
                        : 'Batch Generating...'
                      : isAr
                      ? '🎨 توليد جميع رسومات الكتاب بالذكاء الاصطناعي'
                      : '🎨 Batch Generate All Scenes'}
                  </span>
                </Button>
              </div>
            </div>

            {/* Main Studio Workspace: Pages Rail (Bulk Upload + 300 DPI) + Spread Preview & Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Story Pages Rail */}
              <div className="lg:col-span-3 glass-card rounded-3xl p-4 border-white/10 space-y-3 lg:sticky lg:top-6">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
                    <span>
                      {isAr ? 'الصفحات' : 'Pages'}{' '}
                      <span className="font-numeric text-cyan-300">({pages.length})</span>
                    </span>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddPage}
                    className="h-9 px-3 rounded-full bg-white/10 hover:bg-cyan-500/25 border border-white/15 text-white text-xs font-semibold gap-1.5"
                  >
                    <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'إضافة' : 'Add'}</span>
                  </Button>
                </div>

                {/* Bulk Upload Scenes (Natural Numeric Sort + Full 300 DPI Vault) */}
                <div className="space-y-1.5 pb-2 border-b border-white/10">
                  <label className="bubble-btn-secondary w-full h-10 px-3 text-xs font-bold gap-2 cursor-pointer flex items-center justify-center">
                    {isBulkUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                    ) : (
                      <Images className="w-4 h-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {isBulkUploading
                        ? isAr
                          ? 'جاري حفظ اللوحات...'
                          : 'Saving full-res scenes...'
                        : isAr
                        ? 'رفع جماعي للوحات (300 DPI)'
                        : 'Bulk Upload Scenes (300 DPI)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={isBulkUploading}
                      onChange={(e) => void handleBulkScenesUpload(e)}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 leading-snug text-center font-numeric">
                    {isAr
                      ? 'ترتيب تلقائي (01-cover.png, 02-scene.png…) بدون تصغير الدقة'
                      : 'Natural sort (01-cover.png, 02-scene.png…) • No downscaling'}
                  </p>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pe-1">
                  {pages.map((p, idx) => {
                    const isSelected = idx === activePageIndex;
                    const pageResCheck =
                      typeof p.imageWidth === 'number' &&
                      typeof p.imageHeight === 'number' &&
                      p.imageWidth > 0 &&
                      p.imageHeight > 0
                        ? checkImagePrintReadiness(p.imageWidth, p.imageHeight)
                        : null;

                    return (
                      <button
                        key={p.pageNumber}
                        type="button"
                        onClick={() => setActivePageIndex(idx)}
                        className={`w-full p-2.5 rounded-2xl border text-start flex items-center gap-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/15 border-cyan-400/55 text-white shadow-[0_0_20px_rgba(0,217,255,0.16)]'
                            : 'bg-slate-950/55 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <img
                          src={p.imageUrl}
                          alt={isAr ? `صفحة ${p.pageNumber}` : `Page ${p.pageNumber}`}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-white/15"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-xs font-bold text-cyan-300 font-numeric">
                              {isAr ? `صفحة ${p.pageNumber}` : `Page ${p.pageNumber}`}
                            </span>
                            {pageResCheck && (
                              <span
                                className={`px-1.5 py-0.5 rounded-full border text-[9px] font-bold font-numeric shrink-0 ${getResolutionBadgeStyle(
                                  pageResCheck.status
                                )}`}
                              >
                                {getCompactResolutionText(pageResCheck, isAr)}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300/90 truncate mt-0.5">{p.text}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Page Spread Preview + Manual Editor */}
              {activePage && (
                <div className="lg:col-span-9 space-y-6">
                  {/* Live KDP 8.5"×8.5" Double-Spread Preview */}
                  <div className="glass-card rounded-3xl p-5 sm:p-6 border-purple-400/25 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 text-xs font-bold">
                          <Eye className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                          <span>
                            {isAr ? (
                              <>
                                معاينة مزدوجة <span className="font-numeric">8.5"×8.5" KDP</span> • صفحة{' '}
                                <span className="font-numeric">{activePage.pageNumber}</span> من{' '}
                                <span className="font-numeric">{pages.length}</span>
                              </>
                            ) : (
                              <>
                                Live <span className="font-numeric">8.5"×8.5" KDP</span> Spread • Page{' '}
                                <span className="font-numeric">{activePage.pageNumber}</span> of{' '}
                                <span className="font-numeric">{pages.length}</span>
                              </>
                            )}
                          </span>
                        </div>

                        {activeResolutionCheck && (
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${getResolutionBadgeStyle(
                              activeResolutionCheck.status
                            )}`}
                          >
                            {activeResolutionCheck.status === 'print_300dpi' ? (
                              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                            )}
                            <span>
                              {isAr ? activeResolutionCheck.labelAr : activeResolutionCheck.labelEn}
                            </span>
                            <span className="font-numeric opacity-90">
                              ({activeResolutionCheck.width}×{activeResolutionCheck.height})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={activePageIndex <= 0}
                          onClick={() => setActivePageIndex((i) => Math.max(0, i - 1))}
                          aria-label={isAr ? 'الصفحة السابقة' : 'Previous page'}
                          className="h-9 px-3 rounded-full bg-slate-900/75 border-white/15 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                        >
                          <PrevSpreadIcon className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={activePageIndex >= pages.length - 1}
                          onClick={() => setActivePageIndex((i) => Math.min(pages.length - 1, i + 1))}
                          aria-label={isAr ? 'الصفحة التالية' : 'Next page'}
                          className="h-9 px-3 rounded-full bg-slate-900/75 border-white/15 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
                        >
                          <NextSpreadIcon className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        {pages.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePage(activePageIndex)}
                            className="h-9 px-3 rounded-full text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/15 gap-1.5"
                          >
                            <Trash2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{isAr ? 'حذف الصفحة' : 'Delete Page'}</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Open Book Double-Spread Container */}
                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch p-3 sm:p-4 rounded-3xl bg-slate-950/90 border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
                      {/* Illustration Page (1:1 Square KDP 8.5"×8.5") */}
                      <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/15 bg-slate-900 shadow-inner group">
                        {generatingPageIndexes[activePageIndex] && (
                          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20 animate-in fade-in">
                            <Sparkles className="w-9 h-9 text-cyan-400 animate-spin" />
                            <span className="text-xs font-bold text-white">
                              {isAr ? 'جاري توليد رسمة المشهد بالذكاء الاصطناعي...' : 'Generating Scene Artwork with AI...'}
                            </span>
                            <span className="text-[11px] text-cyan-300 font-numeric">
                              KDP 8.5"×8.5" • 300 DPI
                            </span>
                          </div>
                        )}

                        <div className="absolute top-3 end-3 flex items-center gap-1.5 z-10">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleGeneratePageImage(activePageIndex)}
                            disabled={generatingPageIndexes[activePageIndex]}
                            className="h-8 px-2.5 rounded-full bg-slate-950/80 hover:bg-purple-600/80 backdrop-blur-md border border-purple-400/40 text-purple-100 text-[11px] font-bold gap-1 shadow-md transition-all"
                            title={isAr ? 'توليد هذه الصفحة بالـ AI' : 'Generate with AI'}
                          >
                            <Sparkles className={`w-3.5 h-3.5 ${generatingPageIndexes[activePageIndex] ? 'animate-spin text-cyan-300' : ''}`} />
                            <span>{isAr ? 'توليد بالـ AI' : 'Generate'}</span>
                          </Button>
                        </div>

                        <img
                          src={activePreviewImageUrl}
                          alt={
                            isAr
                              ? `رسم صفحة ${activePage.pageNumber}`
                              : `Illustration page ${activePage.pageNumber}`
                          }
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-3 inset-x-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                          <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-cyan-200 font-numeric">
                            8.5&quot; × 8.5&quot; • 1:1
                          </span>
                          {activePage.imageVaultId && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/35 text-[10px] font-bold text-emerald-200">
                              {isAr ? 'محفوظة بدقتها الكاملة' : 'Full-Res Vault'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Story Text Page */}
                      <div
                        dir={storyLang === 'ar' ? 'rtl' : 'ltr'}
                        className="rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-950 to-purple-950/35 border border-white/15 p-6 sm:p-8 flex flex-col justify-between min-h-[280px]"
                      >
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                          <span className="text-xs font-bold text-purple-300 truncate">
                            {storyTitle}
                          </span>
                          <span className="text-[11px] font-semibold text-pink-300 shrink-0">
                            {childName}
                          </span>
                        </div>

                        <p className="text-base sm:text-xl leading-relaxed text-white font-editorial my-6">
                          {activePage.text}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-slate-400">
                          <span>{storyLang === 'ar' ? 'بابل فيرس' : 'Bubbleverse'}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-bold font-numeric">
                            {activePage.pageNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manual Page Editor, Stage 2 5-Block Prompt & Full-Res Artwork Upload */}
                  <div className="glass-card rounded-3xl p-5 sm:p-6 border-white/10 space-y-5">
                    <div className="space-y-2">
                      <label
                        htmlFor="studio-page-text"
                        className="text-sm font-bold text-white flex items-center justify-between"
                      >
                        <span>
                          {isAr ? (
                            <>
                              نص القصة — صفحة{' '}
                              <span className="font-numeric">{activePage.pageNumber}</span>
                            </>
                          ) : (
                            <>
                              Story Text — Page{' '}
                              <span className="font-numeric">{activePage.pageNumber}</span>
                            </>
                          )}
                        </span>
                        <span className="text-xs font-normal text-slate-400">
                          {isAr ? 'تعديل يدوي مباشر' : 'Direct manual edit'}
                        </span>
                      </label>
                      <Textarea
                        id="studio-page-text"
                        dir={storyLang === 'ar' ? 'rtl' : 'ltr'}
                        rows={3}
                        value={activePage.text}
                        onChange={(e) => updatePage(activePageIndex, { text: e.target.value })}
                        className="rounded-2xl bg-slate-950/80 border-white/15 text-white text-sm leading-relaxed"
                      />
                    </div>

                    {/* Stage 2 5-Block Scene Prompt Box */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor="studio-image-prompt"
                          className="text-sm font-bold text-cyan-200 flex items-center gap-2"
                        >
                          <Sparkles className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
                          <span>
                            {isAr
                              ? `أمر مشهد المرحلة 2 — ${getEngineDisplayName(promptEngine)}`
                              : `Stage 2 Scene Prompt — ${getEngineDisplayName(promptEngine)}`}
                          </span>
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleGeneratePageImage(activePageIndex)}
                            disabled={generatingPageIndexes[activePageIndex]}
                            className="bubble-btn-purple h-8 px-3.5 text-xs font-bold gap-1.5 shadow-md"
                          >
                            <Sparkles
                              className={`w-3.5 h-3.5 ${
                                generatingPageIndexes[activePageIndex]
                                  ? 'animate-spin text-cyan-300'
                                  : ''
                              }`}
                            />
                            <span>
                              {generatingPageIndexes[activePageIndex]
                                ? isAr
                                  ? 'جاري التوليد بالـ AI...'
                                  : 'Generating AI Art...'
                                : isAr
                                ? '✨ توليد رسمة المشهد بالذكاء الاصطناعي'
                                : '✨ Generate Scene with AI'}
                            </span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updatePage(activePageIndex, {
                                imagePrompt: reformatScenePromptForEngine(
                                  activePage.imagePrompt,
                                  syncedDna,
                                  activePage.pageNumber,
                                  pages.length,
                                  promptEngine,
                                  activePage.text
                                ),
                              })
                            }
                            className="h-8 px-3 rounded-full bg-slate-900/75 border-white/15 text-slate-200 hover:bg-slate-800 text-xs font-semibold gap-1.5"
                          >
                            <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{isAr ? 'تحديث القالب' : 'Reformat'}</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              void handleCopyText(
                                activePage.imagePrompt,
                                `تم نسخ أمر الصفحة ${activePage.pageNumber} بنجاح ✓`,
                                `Copied Page ${activePage.pageNumber} Stage 2 prompt ✓`
                              )
                            }
                            className="bubble-btn-outline h-8 px-3.5 text-xs font-bold gap-1.5"
                          >
                            <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{isAr ? 'نسخ الأمر' : 'Copy Prompt'}</span>
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        id="studio-image-prompt"
                        dir="ltr"
                        rows={6}
                        value={activePage.imagePrompt}
                        onChange={(e) =>
                          updatePage(activePageIndex, { imagePrompt: e.target.value })
                        }
                        className="rounded-2xl bg-slate-950/85 border-white/15 text-slate-200 text-xs font-mono leading-relaxed"
                      />
                    </div>

                    {/* Page Artwork Upload (Full 300 DPI Vault) & Print Readiness Check */}
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor="studio-image-url"
                          className="text-sm font-bold text-white flex items-center gap-2"
                        >
                          <ImageIcon className="w-5 h-5 text-pink-400 shrink-0" aria-hidden="true" />
                          <span>
                            {isAr
                              ? 'رسمة الصفحة (حفظ بدقة 300 DPI كاملة دون تصغير)'
                              : 'Page Artwork (Full 300 DPI Vault Storage — No Downscaling)'}
                          </span>
                        </label>
                        {activeResolutionCheck && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${getResolutionBadgeStyle(
                              activeResolutionCheck.status
                            )}`}
                          >
                            {activeResolutionCheck.status === 'print_300dpi' ? (
                              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                            )}
                            <span>
                              {activeResolutionCheck.status === 'print_300dpi'
                                ? isAr
                                  ? 'جاهز 300 DPI (2588×2625+)'
                                  : '300 DPI Ready (2588×2625+)'
                                : isAr
                                ? activeResolutionCheck.labelAr
                                : activeResolutionCheck.labelEn}
                            </span>
                            <span className="font-numeric">
                              • {activeResolutionCheck.width}×{activeResolutionCheck.height} px
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <Input
                          id="studio-image-url"
                          dir="ltr"
                          value={activePage.imageVaultId ? '' : activePage.imageUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            updatePage(activePageIndex, {
                              imageUrl: val,
                              imageVaultId: undefined,
                              imageWidth: undefined,
                              imageHeight: undefined,
                            });
                            setActiveVaultImageUrl(null);
                          }}
                          placeholder={
                            activePage.imageVaultId
                              ? isAr
                                ? `محفوظ بدقته الكاملة في الخزنة (${activePage.imageVaultId}) — الصق رابطاً للاستبدال`
                                : `Saved full-res in photoVault (${activePage.imageVaultId}) — paste URL to override`
                              : '/bubble-books/space.webp'
                          }
                          className="h-11 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-white flex-1 font-mono"
                        />
                        <label className="bubble-btn-secondary h-11 px-5 text-xs font-bold gap-2 shrink-0 cursor-pointer flex items-center justify-center">
                          <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>{isAr ? 'رفع لوحة كاملة الدقة' : 'Upload Full-Res Art'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => void handlePageImageUpload(activePageIndex, e)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Quick Curated Asset Picker */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[11px] text-slate-400">
                          {isAr ? 'أو اختر من مكتبة الرسومات:' : 'Quick studio art:'}
                        </span>
                        {DEFAULT_STORY_FALLBACK_IMAGES.map((imgPath) => (
                          <button
                            key={imgPath}
                            type="button"
                            onClick={() => {
                              updatePage(activePageIndex, {
                                imageUrl: imgPath,
                                imageVaultId: undefined,
                                imageWidth: undefined,
                                imageHeight: undefined,
                              });
                              setActiveVaultImageUrl(null);
                            }}
                            className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                              !activePage.imageVaultId && activePage.imageUrl === imgPath
                                ? 'border-cyan-400 scale-105 shadow-[0_0_12px_rgba(0,217,255,0.45)]'
                                : 'border-white/15 opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img src={imgPath} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3 Bottom Guided Navigation Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveStep(2)}
                className="bubble-btn-outline h-11 px-5 text-xs font-bold gap-2"
              >
                <PrevStepIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'الرجوع إلى الخطوة 2: سيناريو القصة وفصولها' : 'Back to Step 2: Story Script & Arc'}</span>
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden md:inline">
                  {uploadedArtCount === pages.length
                    ? isAr ? 'جميع اللوحات مرفوعة بنجاح!' : 'All illustrations uploaded!'
                    : isAr ? `متبقي ${pages.length - uploadedArtCount} لوحات` : `${pages.length - uploadedArtCount} scenes remaining`}
                </span>
                <Button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className="bubble-btn bubble-btn-primary h-11 px-6 text-xs font-bold gap-2"
                >
                  <span>{isAr ? 'المتابعة إلى الخطوة 4: مراجعة الجودة وتصدير KDP' : 'Continue to Step 4: Quality Review & Export'}</span>
                  <NextStepIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Quality Review & Export to KDP */}
        {(isOverviewMode || activeStep === 4) && (
          <div className="glass-card rounded-3xl p-5 sm:p-6 border-emerald-400/25 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-300" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold font-numeric">
                      {isAr ? 'الخطوة 04' : 'Step 04'}
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white">
                      {isAr ? 'مراجعة الجودة الشاملة والتصدير لمطبعة KDP' : 'Quality Review & Export to KDP'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isAr
                      ? 'تحقق من المعايير الستة، أرسل مسودة الاعتماد لولي الأمر عبر واتساب، وانقل الكتاب لصانع PDF لمقاس 8.5"×8.5".'
                      : 'Audit 6-point checklist, send WhatsApp proof to parents, and hand off to KDP 8.5"×8.5" PDF builder.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-400/35 font-numeric text-xs px-3 py-1">
                  {checklistProgress.completed} / {checklistProgress.total} {isAr ? 'معايير مكتملة' : 'Checks Complete'}
                </Badge>
              </div>
            </div>

            {/* 6 Interactive Checklist Steps */}
            <div className="rounded-2xl bg-slate-950/70 border border-white/10 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-white">
                    {isAr ? 'قائمة التحقق من جودة الإنتاج (6 خطوات تفاعلية)' : 'Production Quality Checklist (6 Interactive Checks)'}
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {isAr
                    ? 'اضغط على أي معيار لتعديل حالته — يُحفظ فوراً في مسودة الطلب'
                    : 'Click any check to toggle completion — auto-saved in this draft'}
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-900/90 overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 transition-all duration-300"
                  style={{
                    width: `${Math.round((checklistProgress.completed / checklistProgress.total) * 100)}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
                {pipelineSteps.map((step) => {
                  const checked = checklist[step.key];
                  return (
                    <button
                      key={step.key}
                      type="button"
                      aria-pressed={checked}
                      onClick={() => handleToggleChecklistStep(step.key)}
                      className={`min-h-[56px] px-3 py-2.5 rounded-2xl border text-start flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        checked
                          ? 'bg-emerald-500/15 border-emerald-400/45 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.16)]'
                          : 'bg-slate-950/60 border-white/10 text-slate-300 hover:border-cyan-400/35 hover:text-white'
                      }`}
                    >
                      {checked ? (
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-400 shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-bold leading-snug">
                          <span className="font-numeric">{step.num}.</span>{' '}
                          {isAr ? step.labelAr : step.labelEn}
                        </span>
                        {step.meta && (
                          <span className="block text-[11px] font-numeric text-cyan-300 mt-0.5">
                            ({step.meta})
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 300 DPI Print Readiness Pre-Flight Inspection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl p-4 bg-emerald-950/20 border border-emerald-400/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-200">
                    {isAr ? 'لوحات جاهزة للطباعة 300 DPI' : '300 DPI Ready Illustrations'}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="text-2xl font-extrabold text-white font-numeric">
                  {ready300DpiCount} / {pages.length}
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  {isAr ? 'دقة 2588×2625 بكسل أو أعلى بالمقاس الكامل' : '2588×2625 px or higher at 100% scale'}
                </p>
              </div>

              <div className="rounded-2xl p-4 bg-cyan-950/20 border border-cyan-400/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-200">
                    {isAr ? 'عدد صفحات الكتاب الكلي' : 'Total Storybook Pages'}
                  </span>
                  <BookOpen className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                </div>
                <div className="text-2xl font-extrabold text-white font-numeric">
                  {pages.length} {isAr ? 'صفحة' : 'Pages'}
                </div>
                <p className="text-[11px] text-cyan-200/80">
                  {pages.length >= 24
                    ? isAr ? 'مطابق لحد أمازون KDP الأدنى (24 صفحة)' : 'Complies with Amazon KDP 24-page min'
                    : isAr ? 'أمازون KDP يتطلب 24 صفحة على الأقل للتجليد' : 'Amazon KDP requires at least 24 pages for spine'}
                </p>
              </div>

              <div className="rounded-2xl p-4 bg-purple-950/20 border border-purple-400/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-200">
                    {isAr ? 'محرك الأوامر المستخدم' : 'Active Prompt Engine'}
                  </span>
                  <Cpu className="w-4 h-4 text-purple-400" aria-hidden="true" />
                </div>
                <div className="text-lg font-extrabold text-white">
                  {getEngineDisplayName(promptEngine)}
                </div>
                <p className="text-[11px] text-purple-200/80">
                  {isAr ? 'صيغة المرحلة 2 مع عزل الشخصية ومطابقة 1:1' : 'Stage 2 formula with likeness lock & 1:1 square'}
                </p>
              </div>
            </div>

            {/* WhatsApp Approval & Export Strip */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/40 border border-white/10 p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                    <span>{isAr ? 'اعتماد المسودة مع ولي الأمر عبر واتساب' : 'Parent Draft Approval via WhatsApp'}</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    {selectedOrder
                      ? isAr
                        ? `طلب ${selectedOrder.reference} • العميل: ${selectedOrder.customerName} (${selectedOrder.phone || 'بدون رقم'})`
                        : `Order ${selectedOrder.reference} • Customer: ${selectedOrder.customerName} (${selectedOrder.phone || 'No phone'})`
                      : isAr
                      ? 'في وضع القصة المستقلة، يمكنك معاينة الطباعة أو التصدير مباشرة لصانع KDP.'
                      : 'In standalone mode, you can quick proof or export directly to the KDP Builder.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {selectedOrder && whatsAppHelpers && (
                    <Button
                      type="button"
                      onClick={handleSendWhatsAppDraftApproval}
                      className="bubble-btn-emerald h-11 px-5 text-xs font-bold gap-2"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'إرسال المسودة للاعتماد عبر واتساب' : 'Send Draft on WhatsApp'}</span>
                    </Button>
                  )}

                  {selectedOrder && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleMarkDraftReady}
                      className="h-11 px-4 rounded-full bg-emerald-500/15 border-emerald-400/35 text-emerald-100 hover:bg-emerald-500/25 text-xs font-bold gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'تأكيد جاهزية المسودة' : 'Mark Draft Ready'}</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleExportQuickProof()}
                    className="h-11 px-4 rounded-full bg-slate-900/80 border-white/15 text-slate-200 hover:bg-slate-800 text-xs font-semibold gap-1.5"
                  >
                    <Printer className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'معاينة طباعة سريعة' : 'Quick Proof Print'}</span>
                  </Button>
                </div>
              </div>

              {/* Primary Launch Action to KDP PDF Builder */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-cyan-200 block">
                    {isAr ? 'التصدير الاحترافي لملفات الطباعة والتجليد KDP 8.5"×8.5"' : 'Press-Ready Amazon KDP 8.5"×8.5" Export'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isAr
                      ? 'ينقل جميع النصوص واللوحات بدقة 300 DPI كاملة لصانع الغلاف والصفحات الداخلية مع هوامش القص.'
                      : 'Hands off all text & full 300 DPI vault artwork to the Hardcover PDF Builder with bleed & margins.'}
                  </span>
                </div>

                <Button
                  type="button"
                  onClick={handleOpenKdpPdfBuilder}
                  className="bubble-btn bubble-btn-primary h-12 px-7 text-sm font-extrabold gap-2.5 shadow-[0_0_25px_rgba(0,217,255,0.35)] shrink-0"
                >
                  <BookCopy className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr ? (
                      <>
                        فتح في صانع <span className="font-numeric">KDP 8.5"×8.5" PDF</span>
                      </>
                    ) : (
                      <>
                        Launch in <span className="font-numeric">KDP 8.5"×8.5"</span> PDF Builder
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </div>

            {/* Saved Drafts Quick Resume Strip */}
            <div className="glass-card-inner rounded-2xl p-4 border-white/10 bg-slate-950/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <FolderClock className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr ? 'المسودات المحفوظة للاستئناف السريع' : 'Saved Drafts — Quick Resume'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 font-numeric">
                    {savedDrafts.length}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {isAr
                    ? 'يتم استرجاع آخر تقدم وورقة الشخصية تلقائياً عند فتح الطلب'
                    : 'Reopening any order restores prompts, character sheet & checklist automatically'}
                </span>
              </div>

              {savedDrafts.length === 0 ? (
                <p className="text-xs text-slate-400 rounded-xl bg-slate-950/45 border border-white/5 px-3 py-2">
                  {isAr
                    ? 'لا توجد مسودات محفوظة بعد — ابدأ بتعديل أي صفحة أو خطوة لتظهر هنا تلقائياً.'
                    : 'No saved drafts yet — edit any page or checklist step and it will appear here automatically.'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {savedDrafts.map((draft) => {
                    const isCurrent = draft.key === activeDraftKey;
                    const badgeLabel =
                      draft.orderReference ||
                      (draft.key === 'standalone'
                        ? isAr
                          ? 'مستقلة'
                          : 'Standalone'
                        : draft.key);
                    const draftSteps = countChecklistCompleted(draft.checklist);

                    return (
                      <div
                        key={draft.key}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-all ${
                          isCurrent
                            ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-400/50 text-white shadow-[0_0_16px_rgba(0,217,255,0.18)]'
                            : 'bg-slate-950/60 border-white/10 text-slate-300 hover:border-white/25'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleResumeDraftFromList(draft)}
                          className="flex items-center gap-2 text-start cursor-pointer focus-visible:outline-none"
                        >
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-cyan-200 font-semibold font-numeric text-[10px]">
                            {badgeLabel}
                          </span>
                          <span className="font-semibold text-white max-w-[140px] truncate">
                            {draft.childName} — {draft.storyTitle}
                          </span>
                          <span className="text-[11px] text-slate-400 font-numeric">
                            ({draft.pages.length} {isAr ? 'ص' : 'p'} • {draftSteps.completed}/
                            {draftSteps.total})
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedDraft(draft.key)}
                          aria-label={isAr ? 'حذف المسودة' : 'Delete draft'}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 4 Bottom Guided Navigation Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveStep(3)}
                className="bubble-btn-outline h-11 px-5 text-xs font-bold gap-2"
              >
                <PrevStepIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'الرجوع إلى الخطوة 3: الرسومات والأوامر' : 'Back to Step 3: Artwork & Prompts'}</span>
              </Button>

              <Button
                type="button"
                onClick={handleOpenKdpPdfBuilder}
                className="bubble-btn bubble-btn-primary h-11 px-6 text-xs font-bold gap-2"
              >
                <BookCopy className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'الانتقال إلى صانع KDP 8.5"×8.5"' : 'Open in KDP PDF Builder'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <CharacterLikenessComparator
        isOpen={isComparatorOpen}
        onClose={() => setIsComparatorOpen(false)}
        childName={childName}
        childGender={characterDna.childGender || 'boy'}
        childPhotoUrl={childRefPhoto}
        candidates={characterSheetCandidates}
        activeCandidateId={activeCandidateId}
        onSelectCandidate={handleSelectCandidate}
        onDeleteCandidate={handleDeleteCandidate}
        onGenerateAnother={() => void handleGenerateCharacterSheet()}
        isGenerating={isGeneratingSheet}
        isAr={isAr}
      />
    </AdminLayout>
  );
}
