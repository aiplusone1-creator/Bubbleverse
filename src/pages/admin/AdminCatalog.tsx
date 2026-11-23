import { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Upload,
  Save,
  ExternalLink,
  Search,
  X,
  Sparkles,
  Tag,
  AlertTriangle,
  Users,
  CalendarHeart,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import type {
  CatalogStory,
  CatalogStoryOccasion,
} from '@/features/stories/catalogStories';
import { deriveAedFromSar } from '@/features/commerce/pricingEngine';
import {
  getCatalogStories,
  saveCatalogStory,
  deleteCatalogStory,
  resetCatalogStoriesToDefault,
} from '@/lib/localStore';

type StoryCategory = CatalogStory['category'];
type StoryGender = CatalogStory['gender'];
type StoryAgeRange = CatalogStory['ageRange'];

const CATEGORIES: StoryCategory[] = [
  'career',
  'superhero',
  'travel',
  'animals',
  'values',
  'bedtime',
  'fantasy',
];

const CATEGORY_LABELS: Record<StoryCategory, { ar: string; en: string }> = {
  career: { ar: 'مهن المستقبل', en: 'Careers' },
  superhero: { ar: 'أبطال خارقون', en: 'Superhero' },
  travel: { ar: 'مغامرات وسفر', en: 'Travel' },
  animals: { ar: 'عالم الحيوانات', en: 'Animals' },
  values: { ar: 'قيم وأخلاق', en: 'Values' },
  bedtime: { ar: 'قصص قبل النوم', en: 'Bedtime' },
  fantasy: { ar: 'خيال وسحر', en: 'Fantasy' },
};

const GENDER_LABELS: Record<StoryGender, { ar: string; en: string }> = {
  all: { ar: 'للجميع', en: 'All' },
  boy: { ar: 'أولاد', en: 'Boys' },
  girl: { ar: 'بنات', en: 'Girls' },
};

const AGE_LABELS: Record<StoryAgeRange, { ar: string; en: string }> = {
  all: { ar: 'كل الأعمار', en: 'All Ages' },
  '2-4': { ar: '٢-٤ سنوات', en: '2-4 Years' },
  '5-7': { ar: '٥-٧ سنوات', en: '5-7 Years' },
  '8-10': { ar: '٨-١٠ سنوات', en: '8-10 Years' },
};

const OCCASIONS: CatalogStoryOccasion[] = [
  'birthday',
  'ramadan_eid',
  'siblings',
  'graduation',
  'bedtime_values',
];

const OCCASION_LABELS: Record<CatalogStoryOccasion, { ar: string; en: string }> = {
  birthday: { ar: 'عيد ميلاد', en: 'Birthday' },
  ramadan_eid: { ar: 'رمضان والعيد', en: 'Ramadan & Eid' },
  siblings: { ar: 'الإخوة والعائلة', en: 'Siblings' },
  graduation: { ar: 'التخرج والنجاح', en: 'Graduation' },
  bedtime_values: { ar: 'النوم والقيم', en: 'Bedtime & Values' },
};

const COVER_MAX_DIMENSION = 960;
const COVER_JPEG_QUALITY = 0.82;

function compressCoverImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;
        if (!naturalWidth || !naturalHeight) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Invalid image dimensions'));
          return;
        }
        const scale = Math.min(
          1,
          COVER_MAX_DIMENSION / Math.max(naturalWidth, naturalHeight)
        );
        const targetWidth = Math.max(1, Math.round(naturalWidth * scale));
        const targetHeight = Math.max(1, Math.round(naturalHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.fillStyle = '#0b1024';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', COVER_JPEG_QUALITY);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode cover image'));
    };
    img.src = objectUrl;
  });
}

const PRESET_COVERS = [
  '/artwork/career-astronaut.webp',
  '/artwork/vet-rabbit.webp',
  '/artwork/city-superhero.webp',
  '/artwork/star-princess.webp',
  '/artwork/dinosaur-leaf.webp',
  '/artwork/nour-train-station.webp',
];

const EMPTY_STORY: CatalogStory = {
  id: '',
  titleAr: '',
  titleEn: '',
  subtitleAr: '',
  subtitleEn: '',
  category: 'career',
  gender: 'all',
  ageRange: '5-7',
  coverImage: '/artwork/career-astronaut.webp',
  badgeAr: 'جديد',
  badgeEn: 'New',
  rating: 4.9,
  reviewsCount: 12,
  artStyle: 'Pixar 3D Storybook',
  summaryAr: '',
  summaryEn: '',
  priceEgp15Pages: 500,
  priceEgp25Pages: 750,
  pricePdfEgp: 250,
  priceSar15Pages: 110,
  priceSar25Pages: 165,
  pricePdfSar: 59,
  priceAed15Pages: 110,
  priceAed25Pages: 165,
  pricePdfAed: 59,
  occasions: ['birthday'],
  supportsCoHero: true,
  sampleSpreads: [
    {
      pageNumber: 1,
      textAr: 'تبدأ المغامرة السحرية لبطلك الصغير في عالم مليء بالخيال والألوان.',
      textEn: 'Your little hero begins a magical adventure in a world full of wonder.',
      imageUrl: '/artwork/career-astronaut.webp',
    },
  ],
};

export default function AdminCatalog() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';

  const [stories, setStories] = useState<CatalogStory[]>(() => getCatalogStories());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | StoryCategory>('all');
  const [editing, setEditing] = useState<CatalogStory | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<CatalogStory | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = () => setStories(getCatalogStories());

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: stories.length };
    for (const cat of CATEGORIES) {
      counts[cat] = stories.filter((s) => s.category === cat).length;
    }
    return counts;
  }, [stories]);

  const filteredStories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stories.filter((story) => {
      if (categoryFilter !== 'all' && story.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        story.titleAr.toLowerCase().includes(q) ||
        story.titleEn.toLowerCase().includes(q) ||
        story.subtitleAr.toLowerCase().includes(q) ||
        story.subtitleEn.toLowerCase().includes(q) ||
        story.summaryAr.toLowerCase().includes(q) ||
        story.summaryEn.toLowerCase().includes(q) ||
        story.id.toLowerCase().includes(q)
      );
    });
  }, [stories, search, categoryFilter]);

  const openAddDialog = () => {
    setIsNew(true);
    setEditing({
      ...EMPTY_STORY,
      occasions: [...(EMPTY_STORY.occasions ?? [])],
      id: `story-${Date.now().toString(36)}`,
    });
  };

  const openEditDialog = (story: CatalogStory) => {
    setIsNew(false);
    setEditing({
      ...story,
      occasions: story.occasions ? [...story.occasions] : [],
      supportsCoHero: Boolean(story.supportsCoHero),
    });
  };

  const toggleOccasion = (occasion: CatalogStoryOccasion) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const current = prev.occasions ?? [];
      const exists = current.includes(occasion);
      const next = exists
        ? current.filter((item) => item !== occasion)
        : [...current, occasion];
      return { ...prev, occasions: next };
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editing) return;
    if (!file.type.startsWith('image/')) {
      toast.error(
        isAr ? 'يرجى اختيار ملف صورة صالح (JPG / PNG / WebP)' : 'Please choose a valid image file'
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(
        isAr ? 'يجب أن يكون حجم الصورة أقل من 10 ميجابايت' : 'Image must be smaller than 10 MB'
      );
      return;
    }
    try {
      const compressedDataUrl = await compressCoverImage(file);
      setEditing((prev) => (prev ? { ...prev, coverImage: compressedDataUrl } : prev));
      toast.success(
        isAr
          ? 'تم ضغط ورفع صورة الغلاف بنجاح (960px JPEG)'
          : 'Cover image compressed & uploaded (max 960px JPEG)'
      );
    } catch {
      toast.error(
        isAr
          ? 'تعذّر معالجة الصورة. يرجى تجربة صورة أخرى.'
          : 'Could not process the selected image. Please try another file.'
      );
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.titleAr.trim() || !editing.titleEn.trim()) {
      toast.error(
        isAr
          ? 'يرجى إدخال عنوان القصة بالعربية والإنجليزية'
          : 'Both Arabic and English titles are required'
      );
      return;
    }

    const cover = editing.coverImage.trim() || '/artwork/career-astronaut.webp';
    const resolvedPriceAed15 =
      editing.priceAed15Pages !== undefined && Number.isFinite(editing.priceAed15Pages)
        ? editing.priceAed15Pages
        : deriveAedFromSar(editing.priceSar15Pages);
    const resolvedPriceAed25 =
      editing.priceAed25Pages !== undefined && Number.isFinite(editing.priceAed25Pages)
        ? editing.priceAed25Pages
        : deriveAedFromSar(editing.priceSar25Pages);
    const resolvedPricePdfAed =
      editing.pricePdfAed !== undefined && Number.isFinite(editing.pricePdfAed)
        ? editing.pricePdfAed
        : deriveAedFromSar(editing.pricePdfSar);

    const cleanStory: CatalogStory = {
      ...editing,
      coverImage: cover,
      priceAed15Pages: resolvedPriceAed15,
      priceAed25Pages: resolvedPriceAed25,
      pricePdfAed: resolvedPricePdfAed,
      occasions: editing.occasions ? [...editing.occasions] : [],
      supportsCoHero: Boolean(editing.supportsCoHero),
      badge: isAr ? editing.badgeAr || editing.badge : editing.badgeEn || editing.badge,
      id:
        editing.id.trim() ||
        editing.titleEn
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      galleryImages:
        editing.galleryImages && editing.galleryImages.length > 0
          ? [cover, ...editing.galleryImages.filter((img) => img !== cover)]
          : [cover],
    };

    saveCatalogStory(cleanStory);
    reload();
    setEditing(null);
    toast.success(
      isNew
        ? isAr
          ? 'تمت إضافة القصة إلى المكتبة بنجاح!'
          : 'Story added to live catalog!'
        : isAr
          ? 'تم تحديث القصة في المكتبة بنجاح!'
          : 'Story updated in live catalog!'
    );
  };

  const executeDelete = () => {
    if (!confirmDelete) return;
    if (stories.length <= 1) {
      toast.error(
        isAr
          ? 'يجب الاحتفاظ بقصة واحدة على الأقل في المكتبة'
          : 'Keep at least one story in the catalog'
      );
      setConfirmDelete(null);
      return;
    }
    deleteCatalogStory(confirmDelete.id);
    reload();
    setConfirmDelete(null);
    toast.success(isAr ? 'تم حذف القصة من المكتبة' : 'Story removed from catalog');
  };

  const executeReset = () => {
    resetCatalogStoriesToDefault();
    reload();
    setConfirmResetOpen(false);
    toast.success(isAr ? 'تمت استعادة القصص والأسعار الافتراضية' : 'Default catalog restored');
  };

  const egpLabel = isAr ? 'ج.م' : 'EGP';
  const sarLabel = isAr ? 'ر.س' : 'SAR';
  const aedLabel = isAr ? 'د.إ' : 'AED';

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[min(100%,108rem)] mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center shadow-[0_0_24px_rgba(0,217,255,0.18)]">
                <BookOpen className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-editorial">
                    {isAr ? 'إدارة مكتبة القصص' : 'Catalog Manager'}
                  </h1>
                  <Badge className="bg-cyan-500/15 text-cyan-200 border border-cyan-400/30 font-numeric text-xs px-2.5 py-0.5 rounded-full">
                    {stories.length} {isAr ? 'قصة' : 'stories'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-300/80 mt-0.5">
                  {isAr
                    ? 'أضف أو عدّل القصص والأسعار والأغلفة، وتُحدَّث تلقائياً في واجهة المتجر.'
                    : 'Add, edit, or reprice storefront storybooks. Changes sync live to the catalog and product pages.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmResetOpen(true)}
              className="h-10 px-4 rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white text-xs font-semibold gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isAr ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
            </Button>
            <Button
              type="button"
              onClick={openAddDialog}
              className="bubble-btn bubble-btn-primary h-10 px-5 text-xs font-bold gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة قصة جديدة' : 'Add New Story'}</span>
            </Button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="glass-card p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-cyan-300/80 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isAr
                    ? 'ابحث بعنوان القصة أو الوصف أو المعرّف...'
                    : 'Search by story title, subtitle, summary, or slug...'
                }
                className="ps-10 pe-9 h-11 rounded-2xl bg-slate-950/70 border-white/15 text-white placeholder:text-slate-400 text-sm focus-visible:ring-cyan-400/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300/80">
              <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
              <span>
                {isAr ? 'المعروض:' : 'Showing:'}{' '}
                <strong className="text-white font-numeric">{filteredStories.length}</strong>{' '}
                {isAr ? 'من' : 'of'}{' '}
                <strong className="text-cyan-300 font-numeric">{stories.length}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
                categoryFilter === 'all'
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 border-cyan-300 shadow-[0_0_20px_rgba(0,217,255,0.3)]'
                  : 'bg-slate-950/60 text-slate-300 border-white/10 hover:border-cyan-400/40 hover:text-white'
              }`}
            >
              <span>{isAr ? 'الكل' : 'All'}</span>
              <span className="font-numeric opacity-85">({categoryCounts.all})</span>
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
                  categoryFilter === cat
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-pink-400/50 shadow-[0_0_20px_rgba(168,85,247,0.35)]'
                    : 'bg-slate-950/60 text-slate-300 border-white/10 hover:border-purple-400/40 hover:text-white'
                }`}
              >
                <span>{isAr ? CATEGORY_LABELS[cat].ar : CATEGORY_LABELS[cat].en}</span>
                <span className="font-numeric opacity-80">({categoryCounts[cat] ?? 0})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stories Grid */}
        {filteredStories.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                {isAr ? 'لا توجد قصص مطابقة للبحث' : 'No matching stories found'}
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {isAr
                  ? 'جرّب تغيير كلمات البحث أو اختيار تصنيف آخر، أو أضف قصة جديدة.'
                  : 'Try adjusting your search query or category filter, or add a brand new storybook.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('all');
                }}
                className="rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 text-xs"
              >
                {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
              </Button>
              <Button
                type="button"
                onClick={openAddDialog}
                className="bubble-btn bubble-btn-primary h-10 px-5 text-xs font-bold gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة قصة' : 'Add Story'}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStories.map((story) => {
              const primaryTitle = isAr ? story.titleAr : story.titleEn;
              const primarySubtitle = isAr ? story.subtitleAr : story.subtitleEn;
              const localizedBadge = isAr ? story.badgeAr || story.badge : story.badgeEn;
              return (
                <article
                  key={story.id}
                  className="glass-card flex flex-col group"
                >
                  {/* Cover Preview */}
                  <div className="relative h-52 bg-slate-950/90 overflow-hidden">
                    <img
                      src={story.coverImage}
                      alt={primaryTitle}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent" />

                    <div className="absolute top-3 start-3 end-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className="bg-slate-950/80 backdrop-blur-md text-cyan-200 border border-cyan-400/35 text-[11px] rounded-full px-2.5 py-0.5">
                          {isAr
                            ? CATEGORY_LABELS[story.category].ar
                            : CATEGORY_LABELS[story.category].en}
                        </Badge>
                        <Badge className="bg-slate-950/80 backdrop-blur-md text-slate-200 border border-white/15 text-[11px] rounded-full px-2.5 py-0.5">
                          {isAr
                            ? GENDER_LABELS[story.gender].ar
                            : GENDER_LABELS[story.gender].en}
                          {' · '}
                          <span className="font-numeric">
                            {isAr ? AGE_LABELS[story.ageRange].ar : AGE_LABELS[story.ageRange].en}
                          </span>
                        </Badge>
                      </div>

                      {localizedBadge && (
                        <Badge className="bg-pink-500/85 text-white border-0 text-[11px] rounded-full px-2.5 py-0.5 shadow-sm">
                          {localizedBadge}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                        {primaryTitle}
                      </h3>
                      <p className="text-xs text-slate-300/75 line-clamp-2 min-h-[2rem]">
                        {primarySubtitle ||
                          (isAr ? story.summaryAr : story.summaryEn) ||
                          (isAr ? 'قصة مخصصة مصورة بجودة فاخرة' : 'Personalized illustrated storybook')}
                      </p>
                    </div>

                    {/* Occasion & Co-Hero Tags */}
                    {((story.occasions && story.occasions.length > 0) || story.supportsCoHero) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {story.supportsCoHero && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/15 text-pink-200 border border-pink-400/30">
                            <Users className="w-3 h-3 shrink-0" />
                            <span>{isAr ? 'يدعم بطل مشارك' : 'Co-Hero'}</span>
                          </span>
                        )}
                        {(story.occasions ?? []).slice(0, 3).map((occ) => (
                          <span
                            key={occ}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-slate-300 border border-white/10"
                          >
                            {isAr ? OCCASION_LABELS[occ].ar : OCCASION_LABELS[occ].en}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Clean EGP / SAR / AED Pricing Matrix */}
                    <div className="glass-card-inner p-3 grid grid-cols-3 gap-2 text-center font-numeric">
                      <div className="space-y-0.5">
                        <span className="block text-[11px] text-slate-400 font-medium">
                          {isAr ? 'نسخة رقمية' : 'Digital PDF'}
                        </span>
                        <span className="block text-sm font-extrabold text-cyan-300">
                          {story.pricePdfEgp} <span className="text-[10px] font-semibold">{egpLabel}</span>
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {story.pricePdfSar} {sarLabel}
                        </span>
                        <span className="block text-[11px] text-pink-300/85">
                          {story.pricePdfAed ?? deriveAedFromSar(story.pricePdfSar)} {aedLabel}
                        </span>
                      </div>

                      <div className="space-y-0.5 border-x border-white/10 px-1">
                        <span className="block text-[11px] text-slate-400 font-medium">
                          {isAr ? '15 صفحة' : '15 Pages'}
                        </span>
                        <span className="block text-sm font-extrabold text-white">
                          {story.priceEgp15Pages} <span className="text-[10px] font-semibold">{egpLabel}</span>
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {story.priceSar15Pages} {sarLabel}
                        </span>
                        <span className="block text-[11px] text-pink-300/85">
                          {story.priceAed15Pages ?? deriveAedFromSar(story.priceSar15Pages)} {aedLabel}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="block text-[11px] text-slate-400 font-medium">
                          {isAr ? '25 صفحة' : '25 Pages'}
                        </span>
                        <span className="block text-sm font-extrabold text-purple-300">
                          {story.priceEgp25Pages} <span className="text-[10px] font-semibold">{egpLabel}</span>
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {story.priceSar25Pages} {sarLabel}
                        </span>
                        <span className="block text-[11px] text-pink-300/85">
                          {story.priceAed25Pages ?? deriveAedFromSar(story.priceSar25Pages)} {aedLabel}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openEditDialog(story)}
                        className="flex-1 h-10 rounded-full bg-white/10 hover:bg-cyan-500/20 border border-white/15 hover:border-cyan-400/40 text-white text-xs font-semibold gap-2 transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                        <span>{isAr ? 'تعديل القصة' : 'Edit Story'}</span>
                      </Button>

                      <a
                        href={`/products/${story.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-slate-950/70 border border-white/15 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-all shrink-0"
                        title={isAr ? 'معاينة في المتجر' : 'Live Storefront Preview'}
                        aria-label={isAr ? 'معاينة في المتجر' : 'Live Storefront Preview'}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDelete(story)}
                        className="h-10 w-10 p-0 rounded-full text-slate-400 hover:text-red-300 hover:bg-red-500/15 border border-transparent hover:border-red-500/30 shrink-0"
                        title={isAr ? 'حذف القصة' : 'Delete Story'}
                        aria-label={isAr ? 'حذف القصة' : 'Delete Story'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Add / Edit Story Dialog */}
        <Dialog
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        >
          <DialogContent
            dir={isRTL ? 'rtl' : 'ltr'}
            className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0b1024]/95 backdrop-blur-2xl border border-cyan-400/25 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
          >
            {editing && (
              <form onSubmit={handleSave} className="space-y-5">
                <DialogHeader className="text-start">
                  <DialogTitle className="text-xl font-extrabold font-editorial flex items-center gap-2.5">
                    <Tag className="w-5 h-5 text-cyan-400" />
                    <span>
                      {isNew
                        ? isAr
                          ? 'إضافة قصة جديدة إلى الكتالوج'
                          : 'Add New Catalog Story'
                        : isAr
                          ? `تعديل: ${editing.titleAr || editing.titleEn}`
                          : `Edit: ${editing.titleEn || editing.titleAr}`}
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400 text-start">
                    {isAr
                      ? 'تُحفظ جميع التعديلات فوراً وتظهر مباشرة في مكتبة القصص وصفحة المنتج.'
                      : 'All updates save locally and reflect immediately in the live storefront catalog.'}
                  </DialogDescription>
                </DialogHeader>

                {/* Cover Upload & Quick Presets */}
                <div className="glass-card-inner p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <img
                      src={editing.coverImage || '/artwork/career-astronaut.webp'}
                      alt={isAr ? 'معاينة الغلاف' : 'Cover preview'}
                      className="w-28 h-28 rounded-2xl object-cover border border-cyan-400/35 shrink-0 bg-slate-950"
                    />
                    <div className="flex-1 w-full space-y-2.5">
                      <label className="text-xs font-semibold text-slate-200 block">
                        {isAr ? 'رابط صورة الغلاف أو رفع من جهازك' : 'Cover Image URL or Local Upload'}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={editing.coverImage}
                          onChange={(e) =>
                            setEditing({ ...editing, coverImage: e.target.value })
                          }
                          placeholder="/artwork/career-astronaut.webp"
                          dir="ltr"
                          className="bg-slate-950/80 border-white/15 text-xs text-white rounded-xl h-10"
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-10 px-4 rounded-xl border-cyan-400/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:text-white shrink-0 text-xs font-semibold gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{isAr ? 'رفع صورة' : 'Upload'}</span>
                        </Button>
                      </div>

                      {/* Preset Covers */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-[11px] text-slate-400">
                          {isAr ? 'أغلفة جاهزة:' : 'Quick presets:'}
                        </span>
                        {PRESET_COVERS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setEditing({ ...editing, coverImage: preset })}
                            className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              editing.coverImage === preset
                                ? 'border-cyan-400 scale-105'
                                : 'border-white/10 opacity-75 hover:opacity-100'
                            }`}
                            aria-label={preset}
                          >
                            <img src={preset} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Titles, Subtitles & Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      {isAr ? 'العنوان بالعربية *' : 'Arabic Title *'}
                    </label>
                    <Input
                      required
                      dir="rtl"
                      value={editing.titleAr}
                      onChange={(e) => setEditing({ ...editing, titleAr: e.target.value })}
                      className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      {isAr ? 'العنوان بالإنجليزية *' : 'English Title *'}
                    </label>
                    <Input
                      required
                      dir="ltr"
                      value={editing.titleEn}
                      onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })}
                      className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300">
                      {isAr ? 'العنوان الفرعي بالعربية' : 'Arabic Subtitle'}
                    </label>
                    <Input
                      dir="rtl"
                      value={editing.subtitleAr}
                      onChange={(e) => setEditing({ ...editing, subtitleAr: e.target.value })}
                      className="bg-slate-950/80 border-white/15 text-white text-xs rounded-xl h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300">
                      {isAr ? 'العنوان الفرعي بالإنجليزية' : 'English Subtitle'}
                    </label>
                    <Input
                      dir="ltr"
                      value={editing.subtitleEn}
                      onChange={(e) => setEditing({ ...editing, subtitleEn: e.target.value })}
                      className="bg-slate-950/80 border-white/15 text-white text-xs rounded-xl h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300">
                      {isAr ? 'شارة مميزة بالعربية (اختياري)' : 'Arabic Badge (Optional)'}
                    </label>
                    <Input
                      dir="rtl"
                      value={editing.badgeAr ?? ''}
                      onChange={(e) => setEditing({ ...editing, badgeAr: e.target.value })}
                      placeholder={isAr ? 'مثال: الأكثر مبيعاً' : 'e.g. الأكثر مبيعاً'}
                      className="bg-slate-950/80 border-white/15 text-white text-xs rounded-xl h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300">
                      {isAr ? 'شارة مميزة بالإنجليزية (اختياري)' : 'English Badge (Optional)'}
                    </label>
                    <Input
                      dir="ltr"
                      value={editing.badgeEn ?? ''}
                      onChange={(e) => setEditing({ ...editing, badgeEn: e.target.value })}
                      placeholder="e.g. Best Seller"
                      className="bg-slate-950/80 border-white/15 text-white text-xs rounded-xl h-10"
                    />
                  </div>
                </div>

                {/* Metadata Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      {isAr ? 'التصنيف' : 'Category'}
                    </label>
                    <LiquidSelect
                      value={editing.category}
                      onChange={(val) =>
                        setEditing({
                          ...editing,
                          category: val as StoryCategory,
                        })
                      }
                      options={CATEGORIES.map((cat) => ({
                        value: cat,
                        label: isAr ? CATEGORY_LABELS[cat].ar : CATEGORY_LABELS[cat].en,
                      }))}
                      triggerClassName="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      {isAr ? 'الفئة' : 'Gender'}
                    </label>
                    <LiquidSelect
                      value={editing.gender}
                      onChange={(val) =>
                        setEditing({
                          ...editing,
                          gender: val as StoryGender,
                        })
                      }
                      options={(['all', 'boy', 'girl'] as StoryGender[]).map((g) => ({
                        value: g,
                        label: isAr ? GENDER_LABELS[g].ar : GENDER_LABELS[g].en,
                      }))}
                      triggerClassName="h-10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      {isAr ? 'الفئة العمرية' : 'Age Range'}
                    </label>
                    <LiquidSelect
                      value={editing.ageRange}
                      onChange={(val) =>
                        setEditing({
                          ...editing,
                          ageRange: val as StoryAgeRange,
                        })
                      }
                      options={(['all', '2-4', '5-7', '8-10'] as StoryAgeRange[]).map((age) => ({
                        value: age,
                        label: isAr ? AGE_LABELS[age].ar : AGE_LABELS[age].en,
                      }))}
                      triggerClassName="h-10 text-xs"
                    />
                  </div>
                </div>

                {/* Occasions & Co-Hero Settings */}
                <div className="glass-card-inner p-4 space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <CalendarHeart className="w-4 h-4 shrink-0" />
                        <span>
                          {isAr ? 'مناسبات القصة (اختيار متعدد)' : 'Story Occasions (Multi-Select)'}
                        </span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {isAr
                          ? 'تُستخدم لتصنيف القصص حسب المناسبات في المتجر'
                          : 'Used to merchandise MENA gifting occasions'}
                      </span>
                    </div>
                    <div
                      role="group"
                      aria-label={isAr ? 'مناسبات القصة' : 'Story Occasions'}
                      className="flex flex-wrap gap-2"
                    >
                      {OCCASIONS.map((occ) => {
                        const selected = (editing.occasions ?? []).includes(occ);
                        return (
                          <button
                            key={occ}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleOccasion(occ)}
                            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                              selected
                                ? 'bg-gradient-to-r from-purple-500/85 to-pink-500/85 text-white border-pink-300/60 shadow-[0_0_16px_rgba(168,85,247,0.35)]'
                                : 'bg-slate-950/70 text-slate-300 border-white/15 hover:border-purple-400/45 hover:text-white'
                            }`}
                          >
                            {isAr ? OCCASION_LABELS[occ].ar : OCCASION_LABELS[occ].en}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4">
                    <label
                      htmlFor="story-supports-cohero"
                      className="space-y-0.5 cursor-pointer flex-1"
                    >
                      <span className="text-xs font-bold text-pink-200 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-pink-300 shrink-0" />
                        <span>
                          {isAr
                            ? 'دعم بطل مشارك (الإخوة أو صديق)'
                            : 'Supports Co-Hero (Sibling / Friend)'}
                        </span>
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {isAr
                          ? 'عند التفعيل يظهر خيار إضافة طفل ثانٍ كبطل مشارك في صفحة القصة.'
                          : 'Shows the optional co-hero add-on toggle on the storefront product page.'}
                      </span>
                    </label>
                    <Switch
                      id="story-supports-cohero"
                      dir="ltr"
                      checked={Boolean(editing.supportsCoHero)}
                      onCheckedChange={(checked) =>
                        setEditing({ ...editing, supportsCoHero: checked })
                      }
                      className="data-[state=checked]:bg-pink-500 data-[state=unchecked]:bg-slate-700"
                    />
                  </div>
                </div>

                {/* 9-Field EGP / SAR / AED Pricing Matrix */}
                <div className="glass-card-inner p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-cyan-300">
                      {isAr
                        ? 'مصفوفة الأسعار (مصر والسعودية والإمارات)'
                        : 'Pricing Matrix (EGP, SAR & AED)'}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {isAr
                        ? '9 حقول سعرية • يُحتسب الدرهم تلقائياً من الريال إذا تُرك فارغاً'
                        : '9 live price fields • AED defaults from SAR if left blank'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-numeric">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300">
                        {isAr ? '15 صفحة (جنيه مصري)' : '15 Pages (EGP)'}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.priceEgp15Pages}
                        onChange={(e) =>
                          setEditing({ ...editing, priceEgp15Pages: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10 font-numeric"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300">
                        {isAr ? '25 صفحة (جنيه مصري)' : '25 Pages (EGP)'}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.priceEgp25Pages}
                        onChange={(e) =>
                          setEditing({ ...editing, priceEgp25Pages: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10 font-numeric"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300">
                        {isAr ? 'نسخة رقمية (جنيه مصري)' : 'Digital PDF (EGP)'}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.pricePdfEgp}
                        onChange={(e) =>
                          setEditing({ ...editing, pricePdfEgp: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10 font-numeric"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300">
                        {isAr ? '15 صفحة (ريال سعودي)' : '15 Pages (SAR)'}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.priceSar15Pages}
                        onChange={(e) =>
                          setEditing({ ...editing, priceSar15Pages: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10 font-numeric"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300">
                        {isAr ? '25 صفحة (ريال سعودي)' : '25 Pages (SAR)'}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.priceSar25Pages}
                        onChange={(e) =>
                          setEditing({ ...editing, priceSar25Pages: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10 font-numeric"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-300">
                        {isAr ? 'نسخة رقمية (ريال سعودي)' : 'Digital PDF (SAR)'}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.pricePdfSar}
                        onChange={(e) =>
                          setEditing({ ...editing, pricePdfSar: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10 font-numeric"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="story-price-aed-15" className="text-[11px] text-pink-200/90">
                        {isAr ? '15 صفحة (درهم إماراتي)' : '15 Pages (AED)'}
                      </label>
                      <Input
                        id="story-price-aed-15"
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.priceAed15Pages ?? ''}
                        placeholder={String(deriveAedFromSar(editing.priceSar15Pages))}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          setEditing({
                            ...editing,
                            priceAed15Pages: raw === '' ? undefined : Math.max(0, Number(raw) || 0),
                          });
                        }}
                        className="bg-slate-950/80 border-pink-400/25 focus-visible:border-pink-400/60 text-white text-sm rounded-xl h-10 font-numeric"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="story-price-aed-25" className="text-[11px] text-pink-200/90">
                        {isAr ? '25 صفحة (درهم إماراتي)' : '25 Pages (AED)'}
                      </label>
                      <Input
                        id="story-price-aed-25"
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.priceAed25Pages ?? ''}
                        placeholder={String(deriveAedFromSar(editing.priceSar25Pages))}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          setEditing({
                            ...editing,
                            priceAed25Pages: raw === '' ? undefined : Math.max(0, Number(raw) || 0),
                          });
                        }}
                        className="bg-slate-950/80 border-pink-400/25 focus-visible:border-pink-400/60 text-white text-sm rounded-xl h-10 font-numeric"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="story-price-pdf-aed" className="text-[11px] text-pink-200/90">
                        {isAr ? 'نسخة رقمية (درهم إماراتي)' : 'Digital PDF (AED)'}
                      </label>
                      <Input
                        id="story-price-pdf-aed"
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.pricePdfAed ?? ''}
                        placeholder={String(deriveAedFromSar(editing.pricePdfSar))}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          setEditing({
                            ...editing,
                            pricePdfAed: raw === '' ? undefined : Math.max(0, Number(raw) || 0),
                          });
                        }}
                        className="bg-slate-950/80 border-pink-400/25 focus-visible:border-pink-400/60 text-white text-sm rounded-xl h-10 font-numeric"
                      />
                    </div>
                  </div>
                </div>

                {/* Summaries */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300">
                      {isAr ? 'ملخص القصة بالعربية' : 'Arabic Summary'}
                    </label>
                    <Textarea
                      rows={3}
                      dir="rtl"
                      value={editing.summaryAr}
                      onChange={(e) => setEditing({ ...editing, summaryAr: e.target.value })}
                      className="bg-slate-950/80 border-white/15 text-white text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300">
                      {isAr ? 'ملخص القصة بالإنجليزية' : 'English Summary'}
                    </label>
                    <Textarea
                      rows={3}
                      dir="ltr"
                      value={editing.summaryEn}
                      onChange={(e) => setEditing({ ...editing, summaryEn: e.target.value })}
                      className="bg-slate-950/80 border-white/15 text-white text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(null)}
                    className="h-10 px-5 rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 text-xs"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    className="bubble-btn bubble-btn-primary h-10 px-6 text-xs font-bold gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isAr ? 'حفظ في المكتبة' : 'Save to Catalog'}</span>
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Story Dialog */}
        <Dialog
          open={!!confirmDelete}
          onOpenChange={(open) => {
            if (!open) setConfirmDelete(null);
          }}
        >
          <DialogContent
            dir={isRTL ? 'rtl' : 'ltr'}
            className="max-w-md rounded-3xl bg-[#0b1024]/95 backdrop-blur-2xl border border-red-500/30 text-white"
          >
            {confirmDelete && (
              <div className="space-y-4">
                <DialogHeader className="text-start">
                  <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-300">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{isAr ? 'تأكيد حذف القصة' : 'Confirm Story Deletion'}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-300 text-start pt-1">
                    {isAr
                      ? `هل أنت متأكد من حذف قصة "${confirmDelete.titleAr}" من المكتبة؟`
                      : `Are you sure you want to remove "${confirmDelete.titleEn}" from the catalog?`}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmDelete(null)}
                    className="rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 text-xs"
                  >
                    {isAr ? 'تراجع' : 'Cancel'}
                  </Button>
                  <Button
                    type="button"
                    onClick={executeDelete}
                    className="rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold gap-1.5 px-5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isAr ? 'حذف القصة' : 'Delete Story'}</span>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Reset Catalog Dialog */}
        <Dialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
          <DialogContent
            dir={isRTL ? 'rtl' : 'ltr'}
            className="max-w-md rounded-3xl bg-[#0b1024]/95 backdrop-blur-2xl border border-amber-500/30 text-white"
          >
            <div className="space-y-4">
              <DialogHeader className="text-start">
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-amber-300">
                  <RotateCcw className="w-5 h-5" />
                  <span>{isAr ? 'استعادة القصص الافتراضية' : 'Restore Default Catalog'}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 text-start pt-1">
                  {isAr
                    ? 'سيؤدي هذا الإجراء إلى استعادة جميع قصص وأسعار بابل فيرس الافتراضية واستبدال التعديلات المحلية.'
                    : 'This will restore all default Bubbleverse stories and pricing, replacing local catalog edits.'}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmResetOpen(false)}
                  className="rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 text-xs"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="button"
                  onClick={executeReset}
                  className="rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold gap-1.5 px-5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isAr ? 'نعم، استعادة' : 'Yes, Restore'}</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
