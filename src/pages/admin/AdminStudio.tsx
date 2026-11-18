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
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  type AiProviderKey,
  type CharacterDna,
  type OrderRecord,
  type PromptEngineMode,
  type StudioDraftPage,
  type StudioDraftRecord,
  type StudioProductionChecklist,
} from '@/lib/localStore';
import { deletePhotoFromVault, getPhotoFromVault, savePhotoToVault } from '@/lib/photoVault';
import { generateStorybookPDFHTML } from '@/features/pdf/storybookTemplate';
import { sortFilesNaturally } from '@/features/pdf/kdpSpecs';
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
  const [characterSheetPreview, setCharacterSheetPreview] = useState<string | null>(null);
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
        const nextDna = createDefaultCharacterDna({
          childName: hero,
          childAge: primaryItem.childAge || '5',
          childGender: primaryItem.childGender === 'girl' ? 'girl' : 'boy',
          artStyle: artStyleRef.current,
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
        setCharacterSheetPreview(null);
        setChecklist(createDefaultProductionChecklist());
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

  const handleCharacterSheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const processed = await processUploadedIllustration(file);
      const vaultId = `studio_charsheet_${activeDraftKey}`;
      await savePhotoToVault(vaultId, processed.fullDataUrl);
      setCharacterSheetVaultId(vaultId);
      setCharacterSheetPreview(processed.fullDataUrl);
      setChecklist((prev) => ({ ...prev, characterSheetLocked: true }));
      toast.success(
        isAr
          ? 'تم حفظ ورقة ثبات الشخصية وقفل الخطوة الثانية تلقائياً ✓'
          : 'Character Sheet saved to vault & Step 2 locked automatically ✓'
      );
    } catch {
      toast.error(
        isAr ? 'تعذر حفظ صورة ورقة ثبات الشخصية' : 'Could not save the character sheet image'
      );
    }
  };

  const handleRemoveCharacterSheet = async () => {
    if (characterSheetVaultId) {
      await deletePhotoFromVault(characterSheetVaultId);
    }
    setCharacterSheetVaultId('');
    setCharacterSheetPreview(null);
    setChecklist((prev) => ({ ...prev, characterSheetLocked: false }));
    toast.info(isAr ? 'تمت إزالة ورقة ثبات الشخصية' : 'Character Sheet removed');
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

  const isNonStandardPageCount = !STANDARD_PAGE_COUNTS.includes(
    pageCount as (typeof STANDARD_PAGE_COUNTS)[number]
  );

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
                      ? 'ورقة ثبات الشخصية، برومبتات KDP 8.5"×8.5" (Nano Banana / Midjourney / Flux)، فحص دقة 300 DPI، وتصدير فوري.'
                      : 'Character Consistency Sheet, 5-block KDP 8.5"×8.5" prompts (Nano Banana / Midjourney / Flux), 300 DPI print check & seamless KDP handoff.'}
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
                <span>{isAr ? 'تحميل حزمة الأوامر (.txt)' : 'Download Prompt Pack (.txt)'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCopyAllPrompts()}
                className="h-10 px-4 rounded-full bg-slate-900/75 border-white/15 text-slate-100 hover:bg-slate-800/90 hover:border-cyan-400/40 text-xs font-semibold gap-2"
              >
                <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'نسخ كل الأوامر' : 'Copy All Prompts'}</span>
              </Button>

              {selectedOrder && whatsAppHelpers && (
                <Button
                  type="button"
                  onClick={handleSendWhatsAppDraftApproval}
                  className="bubble-btn-emerald h-10 px-4 text-xs font-bold gap-2"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr ? 'إرسال المسودة للاعتماد عبر واتساب' : 'Send Draft Approval on WhatsApp'}
                  </span>
                </Button>
              )}

              {selectedOrder && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMarkDraftReady}
                  className="h-10 px-3.5 rounded-full bg-emerald-500/15 border-emerald-400/35 text-emerald-100 hover:bg-emerald-500/25 text-xs font-bold gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'المسودة جاهزة' : 'Mark Draft Ready'}</span>
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
                      فتح في صانع <span className="font-numeric">KDP 8.5×8.5</span>
                    </>
                  ) : (
                    <>
                      Open in <span className="font-numeric">KDP 8.5×8.5</span> PDF Builder
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
                <span>{isAr ? 'معاينة طباعة' : 'Quick Proof'}</span>
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
              <a
                href="/docs/BUBBLEVERSE_FIRST_STORY_PLAYBOOK.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-200 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'دليل التنفيذ PDF' : 'Playbook PDF'}</span>
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

        {/* 1. Order Production Pipeline Checklist Bar (6 Interactive Auto-Saved Steps) */}
        <div className="glass-card rounded-3xl p-4 sm:p-5 border-cyan-400/20 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ClipboardCheck className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                {isAr ? 'خط إنتاج الطلب — 6 خطوات تفاعلية' : 'Order Production Pipeline — 6 Interactive Steps'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-200 text-xs font-bold font-numeric">
                {checklistProgress.completed}/{checklistProgress.total}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {isAr
                ? 'اضغط على أي خطوة للتعليم عليها — تُحفظ تلقائياً في مسودة الطلب'
                : 'Click any step to toggle completion — auto-saved in this draft'}
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-slate-900/90 overflow-hidden border border-white/10">
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
                  className={`min-h-[52px] px-3 py-2.5 rounded-2xl border text-start flex items-center gap-2.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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

        {/* Saved Drafts Quick Resume Strip */}
        <div className="glass-card rounded-3xl p-4 sm:p-5 border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <FolderClock className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
              <span>
                {isAr ? 'المسودات المحفوظة للاستئناف السريع' : 'Saved Drafts — Quick Resume'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-xs font-numeric">
                {savedDrafts.length}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {isAr
                ? 'يتم استرجاع آخر تقدم وورقة الشخصية تلقائياً عند إعادة فتح الطلب'
                : 'Reopening any order restores prompts, character sheet & checklist automatically'}
            </span>
          </div>

          {savedDrafts.length === 0 ? (
            <p className="text-xs text-slate-400 rounded-2xl bg-slate-950/45 border border-white/5 px-4 py-3">
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
                    className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs transition-all ${
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
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-cyan-200 font-semibold font-numeric">
                        {badgeLabel}
                      </span>
                      <span className="font-semibold text-white max-w-[160px] truncate">
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
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Selector + Story Metadata + Page Count (10/15/20/24) + Script Actions */}
        <div className="glass-card rounded-3xl p-5 border-white/10 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-4 space-y-1.5 min-w-0">
              <div className="text-xs font-semibold text-slate-200 flex items-center justify-between gap-2">
                <label htmlFor="studio-order-select">
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
              <select
                id="studio-order-select"
                value={selectedOrder?.id || ''}
                onChange={(e) => handleSelectOrder(e.target.value)}
                className="w-full h-11 rounded-2xl bg-slate-950/80 border border-white/15 text-xs text-white px-3.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">
                  {isAr ? '— وضع القصة المستقلة الحر —' : '— Free Standalone Story Mode —'}
                </option>
                {orders.map((o) => {
                  const hasDraft = Boolean(getStudioDraft(o.id));
                  return (
                    <option key={o.id} value={o.id}>
                      {o.reference} — {o.customerName} (
                      {o.items[0]?.childName || (isAr ? 'البطل' : 'Hero')})
                      {hasDraft ? (isAr ? ' [مسودة محفوظة]' : ' [Saved Draft]') : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 space-y-1.5 min-w-0">
                <label htmlFor="studio-story-title" className="text-xs text-slate-300 font-medium">
                  {isAr ? 'عنوان الكتاب' : 'Book Title'}
                </label>
                <Input
                  id="studio-story-title"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="h-11 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-white"
                />
              </div>

              <div className="sm:col-span-3 space-y-1.5 min-w-0">
                <label htmlFor="studio-hero-name" className="text-xs text-slate-300 font-medium">
                  {isAr ? 'اسم البطل' : 'Hero Name'}
                </label>
                <Input
                  id="studio-hero-name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="h-11 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-white"
                />
              </div>

              <div className="sm:col-span-4 space-y-1.5 min-w-0">
                <label htmlFor="studio-lang-select" className="text-xs text-slate-300 font-medium">
                  {isAr ? 'اللغة والصفحات (حد KDP: 24)' : 'Lang / Pages (KDP Min: 24)'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    id="studio-lang-select"
                    value={storyLang}
                    onChange={(e) => setStoryLang(e.target.value as 'ar' | 'en')}
                    aria-label={isAr ? 'لغة القصة' : 'Story language'}
                    className="h-11 w-full min-w-0 rounded-2xl bg-slate-950/80 border border-white/15 text-xs text-white px-2 cursor-pointer"
                  >
                    <option value="ar">{isAr ? 'عربي' : 'AR'}</option>
                    <option value="en">{isAr ? 'إنجليزي' : 'EN'}</option>
                  </select>
                  <select
                    value={pageCount}
                    onChange={(e) => setPageCount(Number(e.target.value))}
                    aria-label={isAr ? 'عدد الصفحات' : 'Page count'}
                    className="h-11 w-full min-w-0 rounded-2xl bg-slate-950/80 border border-white/15 text-xs text-white px-2 font-numeric cursor-pointer"
                  >
                    <option value={10}>{isAr ? '10 صفحات' : '10 pages'}</option>
                    <option value={15}>{isAr ? '15 صفحة' : '15 pages'}</option>
                    <option value={20}>{isAr ? '20 صفحة' : '20 pages'}</option>
                    <option value={24}>
                      {isAr ? '24 صفحة (حد KDP)' : '24 pages (KDP Min)'}
                    </option>
                    {isNonStandardPageCount && (
                      <option value={pageCount}>
                        {isAr ? `${pageCount} صفحة` : `${pageCount} pages`}
                      </option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
            <p className="text-xs text-slate-400">
              {isAr
                ? 'يدعم الاستوديو 24 مشهداً فريداً بدون تكرار مع الحفاظ على لوحاتك المرفوعة عند إعادة التوليد.'
                : 'Generates up to 24 unique story beats with zero repetition while preserving any artwork you already uploaded.'}
            </p>
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
                      توليد مسودة القصة <span className="font-numeric">({pageCount})</span>
                    </>
                  ) : (
                    <>
                      Auto-Draft <span className="font-numeric">({pageCount}p)</span>
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
                      ? 'تحسين السيناريو عبر AI (اربط مفتاح Gemini / OpenAI)'
                      : 'Enhance Script with AI (Connect Gemini / OpenAI)'}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 2. Stage 2 — Step 1: Character Consistency Sheet Studio Card */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 border-cyan-400/25 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-cyan-300" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {isAr
                    ? 'المرحلة 2 — الخطوة 1: استوديو ورقة ثبات الشخصية'
                    : 'Stage 2 — Step 1: Character Consistency Sheet Studio'}
                </h2>
                <p className="text-xs text-slate-300">
                  {isAr
                    ? 'ثبّت ملامح البطل، الشعر، والملابس الرسمية أولاً بـ 3 وضعيات ثم أرفق الورقة المرجعية في كل مشهد.'
                    : 'Lock facial likeness, hair & signature outfit across 3 poses first, then attach the turnaround sheet to every scene.'}
                </p>
              </div>
            </div>
            <Badge className="bg-purple-500/15 text-purple-200 border border-purple-400/35 rounded-full px-3 py-1 text-xs font-semibold font-numeric">
              {isAr ? '3 وضعيات • خلفية كريمي • 1:1' : '3 Poses • Cream Studio • 1:1'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* Left Column: Child Reference Photo + Character Turnaround Sheet Upload Slot */}
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
                      <a
                        href={childRefPhoto}
                        download={`${sanitizeFileSlug(childName)}-reference.png`}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 text-cyan-100 text-xs font-bold transition-colors"
                      >
                        <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{isAr ? 'تحميل الصورة' : 'Download Photo'}</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/15 bg-slate-900/50 p-3.5 text-xs text-slate-400 leading-relaxed">
                    {selectedOrder
                      ? isAr
                        ? 'لم يرفع ولي الأمر صورة في خزنة الطلب بعد — يمكنك طلب صورة نهارية واضحة عبر واتساب بضغطة زر.'
                        : 'No reference photo stored in this order vault yet — request a clear daylight photo via WhatsApp below.'
                      : isAr
                      ? 'اختر طلباً من الأعلى لعرض صورة الطفل المرجعية هنا مع زر التحميل وطلب صورة أوضح عبر واتساب.'
                      : 'Select a customer order above to view and download the child’s reference photo here.'}
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

              {/* Character Sheet Upload & Preview Slot */}
              <div className="glass-card-inner rounded-2xl p-4 border-purple-400/25 bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-purple-200">
                    {isAr ? 'ورقة ثبات الشخصية المولّدة' : 'Locked Character Turnaround Sheet'}
                  </span>
                  {checklist.characterSheetLocked && (
                    <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 text-[10px]">
                      {isAr ? 'مقفولة ✓' : 'Locked ✓'}
                    </Badge>
                  )}
                </div>

                {characterSheetPreview ? (
                  <div className="space-y-2.5">
                    <div className="relative aspect-square rounded-2xl overflow-hidden border border-emerald-400/40 bg-slate-900">
                      <img
                        src={characterSheetPreview}
                        alt={
                          isAr
                            ? `ورقة ثبات الشخصية للبطل ${childName}`
                            : `Character consistency sheet for ${childName}`
                        }
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={characterSheetPreview}
                        download={`${sanitizeFileSlug(childName)}-character-sheet.png`}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold transition-colors"
                      >
                        <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{isAr ? 'تحميل' : 'Download'}</span>
                      </a>
                      <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/35 text-purple-100 text-xs font-bold cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{isAr ? 'استبدال' : 'Replace'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => void handleCharacterSheetUpload(e)}
                          className="hidden"
                        />
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleRemoveCharacterSheet()}
                        className="h-9 px-2.5 rounded-full text-rose-300 hover:text-rose-200 hover:bg-rose-500/15"
                        aria-label={isAr ? 'حذف ورقة الشخصية' : 'Remove character sheet'}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-400/35 hover:border-cyan-400/60 bg-slate-900/50 hover:bg-slate-900/80 p-5 text-center cursor-pointer transition-all">
                    <Upload className="w-5 h-5 text-cyan-300" aria-hidden="true" />
                    <span className="text-xs font-bold text-white">
                      {isAr
                        ? 'ارفع ورقة ثبات الشخصية المولّدة'
                        : 'Upload Generated Character Sheet'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isAr
                        ? 'يُحفظ في الخزنة ويقفل الخطوة 2 تلقائياً'
                        : 'Saves to photoVault & locks Step 2 automatically'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => void handleCharacterSheetUpload(e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Right Column: Character DNA Inputs + Live Master Character Sheet Prompt */}
            <div className="xl:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
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

                <div className="sm:col-span-4 space-y-1.5 min-w-0">
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

                <div className="sm:col-span-5 space-y-1.5 min-w-0">
                  <label htmlFor="studio-dna-hair" className="text-xs text-slate-300 font-medium">
                    {isAr ? 'الشعر وملامح الوجه (بالإنجليزية للأمر)' : 'Hair & Facial Features'}
                  </label>
                  <Input
                    id="studio-dna-hair"
                    dir="ltr"
                    value={characterDna.hairAndFeatures}
                    onChange={(e) => updateDnaField('hairAndFeatures', e.target.value)}
                    placeholder="curly dark hair, expressive warm eyes, natural joyful smile"
                    className="h-11 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-12 space-y-1.5 min-w-0">
                  <label htmlFor="studio-dna-outfit" className="text-xs text-slate-300 font-medium">
                    {isAr
                      ? 'الزي الرسمي الثابت للبطل في هذا الكتاب'
                      : 'Signature Outfit for This Book'}
                  </label>
                  <Input
                    id="studio-dna-outfit"
                    dir="ltr"
                    value={characterDna.signatureOutfit}
                    onChange={(e) => updateDnaField('signatureOutfit', e.target.value)}
                    placeholder="turquoise-and-navy junior astronaut jacket with star patches, blue sneakers"
                    className="h-11 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-white"
                  />
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
                      variant="outline"
                      onClick={handleSyncDnaToAllPrompts}
                      className="h-9 px-3 rounded-full bg-purple-500/15 border-purple-400/35 text-purple-100 hover:bg-purple-500/25 text-xs font-semibold gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>
                        {isAr ? 'تحديث كل المشاهد بمواصفات البطل' : 'Sync DNA to All Scenes'}
                      </span>
                    </Button>
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
                      <span>{isAr ? 'نسخ أمر الورقة' : 'Copy Master Prompt'}</span>
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
        </div>

        {/* 3. Stage 2 — Step 2 & 3: Prompt Engine Switcher Bar */}
        <div className="glass-card rounded-3xl p-4 sm:p-5 border-purple-400/25 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-300 shrink-0" aria-hidden="true" />
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  {isAr
                    ? 'الخطوة 2 و 3: محول محرك الأوامر الهجين (صيغة KDP الخماسية)'
                    : 'Step 2 & 3: Hybrid AI Prompt Engine Switcher (5-Block KDP Formula)'}
                </h2>
              </div>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'التبديل بين المحركات يعيد صياغة أمر ورقة الشخصية وجميع مشاهد القصة فوراً بمقاس 8.5"×8.5" الآمن للطباعة.'
                  : 'Switching engines instantly reformats the Master Sheet and every scene prompt for 8.5"×8.5" KDP print safety.'}
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

          {/* Stage 2 Print & Fallback Production Tip */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-300 pt-2 border-t border-white/10">
            <span className="inline-flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
              <span>
                {isAr ? (
                  <>
                    <strong>نصيحة طباعة:</strong> الورق يطبع أغمق بنسبة{' '}
                    <span className="font-numeric">8–10%</span> من شاشة الهاتف — ارفع إضاءة الظلال قليلاً.
                  </>
                ) : (
                  <>
                    <strong>Print Tip:</strong> Paper prints{' '}
                    <span className="font-numeric">8–10%</span> darker than phone screens — lift deep shadows slightly.
                  </>
                )}
              </span>
            </span>
            <span className="text-slate-400 font-numeric">
              {isAr
                ? 'المقاس المستهدف: 2588×2625 px @ 300 DPI (KDP 8.5"×8.5" Full Bleed)'
                : 'Target Spec: 2588×2625 px @ 300 DPI (KDP 8.5"×8.5" Full Bleed)'}
            </span>
          </div>
        </div>

        {/* 4. Main Studio Workspace: Pages Rail (Bulk Upload + 300 DPI) + Spread Preview & Editor */}
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

            {/* Stage 2 Step 4: Bulk Upload Scenes (Natural Numeric Sort + Full 300 DPI Vault) */}
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
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/15 bg-slate-900 shadow-inner">
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
                    <div className="flex items-center gap-2">
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

                {/* Global Art Direction Style */}
                <div className="space-y-2.5 pt-3 border-t border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="studio-art-style"
                      className="text-xs font-semibold text-slate-300"
                    >
                      {isAr ? 'الأسلوب الفني العام للقصة' : 'Global Art Direction Style'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ART_STYLE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setArtStyle(preset.value)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                            artStyle === preset.value
                              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                              : 'bg-slate-900/70 border-white/10 text-slate-300 hover:border-white/25'
                          }`}
                        >
                          {isAr ? preset.labelAr : preset.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="studio-art-style"
                      dir="ltr"
                      value={artStyle}
                      onChange={(e) => setArtStyle(e.target.value)}
                      className="h-10 rounded-2xl bg-slate-950/80 border-white/15 text-xs text-slate-200 flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSyncDnaToAllPrompts}
                      className="h-10 px-4 rounded-2xl bg-slate-900/80 border-white/15 text-xs font-semibold text-cyan-200 hover:border-cyan-400/45 gap-1.5 shrink-0"
                    >
                      <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{isAr ? 'تطبيق على كل الأوامر' : 'Apply to All Prompts'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
