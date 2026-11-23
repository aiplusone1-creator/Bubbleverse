import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Save,
  RotateCcw,
  Camera,
  MessageSquare,
  BookOpen,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  ExternalLink,
  Star,
  CheckCircle2,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { getCatalogStories } from '@/lib/localStore';
import {
  getShowcaseConfig,
  resetShowcaseConfig,
  saveShowcaseConfig,
  type CharacterCardConfig,
  type CustomerReviewConfig,
  type HeroBookSlide,
  type HomepageShowcaseConfig,
} from '@/features/showcase/showcaseConfig';

type ShowcaseTab = 'heroBooks' | 'character' | 'reviews';

const ACCENT_PRESETS = [
  '#00D9FF',
  '#A78BFA',
  '#F472B6',
  '#34D399',
  '#38BDF8',
  '#FBBF24',
];

function readImageAsDataUrl(file: File, maxDimension = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read_failed'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result || file.type === 'image/svg+xml') {
        resolve(result);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        if (width <= maxDimension && height <= maxDimension) {
          resolve(result);
          return;
        }
        const scale = Math.min(maxDimension / width, maxDimension / height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminShowcase() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<ShowcaseTab>('heroBooks');
  const [showcaseConfig, setShowcaseConfig] = useState<HomepageShowcaseConfig>(() =>
    getShowcaseConfig()
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const catalogStories = useMemo(() => getCatalogStories(), []);

  const updateConfig = (updater: (prev: HomepageShowcaseConfig) => HomepageShowcaseConfig) => {
    setShowcaseConfig((prev) => updater(prev));
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = () => {
    saveShowcaseConfig(showcaseConfig);
    setHasUnsavedChanges(false);
    toast.success(
      isAr
        ? 'تم حفظ واجهة العرض بنجاح! التغييرات ظاهرة الآن مباشرة على الصفحة الرئيسية.'
        : 'Showcase saved! Your changes are now live on the homepage.'
    );
  };

  const handleConfirmReset = () => {
    const freshDefaults = resetShowcaseConfig();
    setShowcaseConfig(freshDefaults);
    setHasUnsavedChanges(false);
    setIsResetDialogOpen(false);
    toast.info(
      isAr
        ? 'تمت استعادة إعدادات وصور واجهة العرض الافتراضية.'
        : 'Showcase settings and images reset to defaults.'
    );
  };

  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      onLoaded(dataUrl);
      toast.success(isAr ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully');
    } catch {
      toast.error(isAr ? 'تعذر قراءة ملف الصورة' : 'Failed to read image file');
    }
  };

  // --------------------------------------------------------------------------
  // Tab 1: Hero 3D Book Carousel Handlers
  // --------------------------------------------------------------------------

  const handleAddHeroBook = () => {
    const nextIndex = showcaseConfig.heroBooks.length + 1;
    const defaultStory = catalogStories[0];
    const newSlide: HeroBookSlide = {
      id: `hero-book-${Date.now()}`,
      titleAr: `حكاية سحرية جديدة ${nextIndex}`,
      titleEn: `New Magical Storybook ${nextIndex}`,
      badgeAr: 'إصدار جديد',
      badgeEn: 'New Release',
      coverImage: '/artwork/space-ship.webp',
      miniPreviewImage: '/artwork/character-reference.webp',
      linkedStoryId: defaultStory?.id || 'space-journey',
      accentColor: ACCENT_PRESETS[(nextIndex - 1) % ACCENT_PRESETS.length],
    };
    updateConfig((prev) => ({
      ...prev,
      heroBooks: [...prev.heroBooks, newSlide],
    }));
    toast.success(
      isAr ? 'تمت إضافة شريحة كتاب جديدة في العرض الرئيسي' : 'Added a new Hero 3D Book slide'
    );
  };

  const handleUpdateHeroBook = (index: number, patch: Partial<HeroBookSlide>) => {
    updateConfig((prev) => ({
      ...prev,
      heroBooks: prev.heroBooks.map((slide, i) =>
        i === index ? { ...slide, ...patch } : slide
      ),
    }));
  };

  const handleMoveHeroBook = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= showcaseConfig.heroBooks.length) return;
    updateConfig((prev) => {
      const next = [...prev.heroBooks];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return { ...prev, heroBooks: next };
    });
  };

  const handleDeleteHeroBook = (index: number) => {
    if (showcaseConfig.heroBooks.length <= 1) {
      toast.error(
        isAr
          ? 'يجب الإبقاء على كتاب واحد على الأقل في العرض الرئيسي'
          : 'Keep at least one book slide in the Hero Carousel'
      );
      return;
    }
    updateConfig((prev) => ({
      ...prev,
      heroBooks: prev.heroBooks.filter((_, i) => i !== index),
    }));
    toast.info(isAr ? 'تم حذف الشريحة من العرض الرئيسي' : 'Hero book slide removed');
  };

  // --------------------------------------------------------------------------
  // Tab 2: Character Transformation Handlers
  // --------------------------------------------------------------------------

  const handleUpdateCharacterCard = (
    cardIdx: number,
    patch: Partial<CharacterCardConfig>
  ) => {
    updateConfig((prev) => ({
      ...prev,
      characterCards: prev.characterCards.map((card, i) =>
        i === cardIdx ? { ...card, ...patch } : card
      ),
    }));
  };

  const handleUpdateVariation = (
    cardIdx: number,
    varIdx: number,
    patch: Partial<CharacterCardConfig['variations'][number]>
  ) => {
    updateConfig((prev) => ({
      ...prev,
      characterCards: prev.characterCards.map((card, i) => {
        if (i !== cardIdx) return card;
        return {
          ...card,
          variations: card.variations.map((v, j) => (j === varIdx ? { ...v, ...patch } : v)),
        };
      }),
    }));
  };

  const handleAddVariation = (cardIdx: number) => {
    updateConfig((prev) => ({
      ...prev,
      characterCards: prev.characterCards.map((card, i) => {
        if (i !== cardIdx) return card;
        const count = card.variations.length + 1;
        return {
          ...card,
          variations: [
            ...card.variations,
            {
              label: `مشهد ${count}`,
              labelAr: `مشهد ${count}`,
              labelEn: `Scene ${count}`,
              image: '/artwork/character-illustrated.webp',
              tag: 'رسم مخصص',
              tagAr: 'رسم مخصص',
              tagEn: 'Custom Illustration',
            },
          ],
        };
      }),
    }));
  };

  const handleDeleteVariation = (cardIdx: number, varIdx: number) => {
    const card = showcaseConfig.characterCards[cardIdx];
    if (!card || card.variations.length <= 1) return;
    updateConfig((prev) => ({
      ...prev,
      characterCards: prev.characterCards.map((c, i) =>
        i === cardIdx
          ? { ...c, variations: c.variations.filter((_, j) => j !== varIdx) }
          : c
      ),
    }));
  };

  // --------------------------------------------------------------------------
  // Tab 3: Parent Reviews Handlers
  // --------------------------------------------------------------------------

  const handleAddReview = () => {
    const newReview: CustomerReviewConfig = {
      id: `rev-${Date.now()}`,
      parentName: isAr ? 'ولي أمر سعيد' : 'Happy Parent',
      city: 'القاهرة، مصر',
      cityAr: 'القاهرة، مصر',
      cityEn: 'Cairo, Egypt',
      childName: 'آدم (5 سنوات)',
      childNameAr: 'آدم (5 سنوات)',
      childNameEn: 'Adam (5 yrs)',
      rating: 5,
      date: 'اليوم',
      dateAr: 'اليوم',
      dateEn: 'Today',
      messageAr:
        'الكتاب رائع وجودة الطباعة فاخرة جداً! طفلي لم يترك القصة من يده منذ لحظة وصولها.',
      messageEn:
        'Stunning hardcover print quality and faithful likeness! Our child has not put the book down since it arrived.',
      bookTitle: 'رحلة إلى الفضاء الخارجي',
      bookTitleAr: 'رحلة إلى الفضاء الخارجي',
      bookTitleEn: 'Space Explorer: Star Odyssey',
      verified: true,
      avatarUrl: '',
    };
    updateConfig((prev) => ({
      ...prev,
      reviews: [newReview, ...prev.reviews],
    }));
    toast.success(isAr ? 'تمت إضافة تقييم جديد للأهالي' : 'Added a new parent review');
  };

  const handleUpdateReview = (
    revIdx: number,
    patch: Partial<CustomerReviewConfig>
  ) => {
    updateConfig((prev) => ({
      ...prev,
      reviews: prev.reviews.map((rev, i) => (i === revIdx ? { ...rev, ...patch } : rev)),
    }));
  };

  const handleDeleteReview = (revIdx: number) => {
    updateConfig((prev) => ({
      ...prev,
      reviews: prev.reviews.filter((_, i) => i !== revIdx),
    }));
    toast.info(isAr ? 'تم حذف التقييم' : 'Review deleted');
  };

  const tabs: {
    id: ShowcaseTab;
    labelAr: string;
    labelEn: string;
    count: number;
    icon: typeof BookOpen;
  }[] = [
    {
      id: 'heroBooks',
      labelAr: 'كتب العرض الرئيسية',
      labelEn: 'Hero 3D Book Carousel',
      count: showcaseConfig.heroBooks.length,
      icon: BookOpen,
    },
    {
      id: 'character',
      labelAr: 'تحويل صور الأطفال',
      labelEn: 'Before/After Character Transformation',
      count: showcaseConfig.characterCards.length,
      icon: Camera,
    },
    {
      id: 'reviews',
      labelAr: 'آراء الأهالي',
      labelEn: 'Parent Reviews',
      count: showcaseConfig.reviews.length,
      icon: MessageSquare,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[min(100%,108rem)] mx-auto">
        {/* Top Midnight Magic Header */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 border-white/10 space-y-5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/25 to-pink-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-cyan-300" aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-editorial leading-tight">
                    {isAr ? 'إدارة واجهة العرض والكتب الرئيسية' : 'Hero & Showcase Manager'}
                  </h1>
                  {hasUnsavedChanges && (
                    <Badge className="bg-amber-500/20 text-amber-200 border border-amber-400/40 rounded-full px-3 py-0.5 text-xs">
                      {isAr ? 'تعديلات غير محفوظة' : 'Unsaved Changes'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-300 mt-1">
                  {isAr
                    ? 'تحكّم مباشر في شرائح الكتب ثلاثية الأبعاد بالواجهة، وأمثلة تحويل صور الأطفال، وآراء الأهالي الظاهرة على الصفحة الرئيسية.'
                    : 'Live control over the homepage 3D Hero Book Carousel, Before/After character transformation showcase, and parent testimonials.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="bubble-btn-outline h-10 px-4 text-xs font-bold gap-2"
              >
                <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'معاينة الصفحة الرئيسية' : 'Live Preview'}</span>
              </Link>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetDialogOpen(true)}
                className="h-10 px-4 rounded-full bg-slate-900/75 border-white/15 text-slate-200 hover:bg-rose-500/15 hover:border-rose-400/40 hover:text-rose-200 text-xs font-semibold gap-2"
              >
                <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'استعادة الافتراضي' : 'Reset to Defaults'}</span>
              </Button>

              <Button
                type="button"
                onClick={handleSaveAll}
                className="bubble-btn bubble-btn-primary h-10 px-5 text-xs font-bold gap-2"
              >
                <Save className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'حفظ كافة التغييرات' : 'Save All Changes'}</span>
              </Button>
            </div>
          </div>

          {/* 3 Clean Showcase Tabs */}
          <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-white/10">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/90 via-purple-600/90 to-pink-500/85 text-white border-white/30 shadow-[0_6px_22px_rgba(0,217,255,0.28)]'
                      : 'bg-slate-950/60 text-slate-300 border-white/10 hover:border-cyan-400/40 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-numeric ${
                      isActive ? 'bg-slate-950/35 text-white' : 'bg-white/10 text-cyan-200'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================================== */}
        {/* TAB 1: Hero 3D Book Carousel                                       */}
        {/* ================================================================== */}
        {activeTab === 'heroBooks' && (
          <div className="space-y-5">
            <div className="glass-card rounded-3xl p-5 border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-cyan-300" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white font-editorial">
                    {isAr
                      ? 'شرائح الكتب ثلاثية الأبعاد في الواجهة الرئيسية'
                      : 'Homepage Hero 3D Book Carousel Slides'}
                  </h2>
                  <p className="text-xs text-slate-300">
                    {isAr
                      ? 'أضف وعدّل ورتّب الكتب التي يتنقل بينها الزوار عبر أسهم الفقاعات بجانب الكتاب الرئيسي.'
                      : 'Add, edit, upload covers, and reorder the books visitors browse using the bubble arrows beside the hero 3D book.'}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddHeroBook}
                className="bubble-btn-secondary h-10 px-5 text-xs font-bold gap-2"
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'إضافة شريحة كتاب' : 'Add Hero Book Slide'}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {showcaseConfig.heroBooks.map((slide, idx) => (
                <div
                  key={slide.id}
                  className="glass-card rounded-3xl p-5 border-white/10 space-y-5"
                >
                  {/* Slide Header & Reorder/Delete Controls */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/40"
                        style={{ backgroundColor: slide.accentColor || '#00D9FF' }}
                      />
                      <span className="text-sm font-bold text-white font-numeric">
                        {isAr ? `الشريحة #${idx + 1}` : `Slide #${idx + 1}`}
                      </span>
                      <span className="text-xs text-slate-400 truncate">
                        {isAr ? slide.titleAr : slide.titleEn}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        disabled={idx === 0}
                        onClick={() => handleMoveHeroBook(idx, -1)}
                        aria-label={isAr ? 'تحريك لأعلى' : 'Move slide up'}
                        className="h-8 w-8 rounded-full bg-slate-900/80 border-white/15 text-slate-200 hover:border-cyan-400/50 disabled:opacity-35"
                      >
                        <ArrowUp className="w-4 h-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        disabled={idx === showcaseConfig.heroBooks.length - 1}
                        onClick={() => handleMoveHeroBook(idx, 1)}
                        aria-label={isAr ? 'تحريك لأسفل' : 'Move slide down'}
                        className="h-8 w-8 rounded-full bg-slate-900/80 border-white/15 text-slate-200 hover:border-cyan-400/50 disabled:opacity-35"
                      >
                        <ArrowDown className="w-4 h-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteHeroBook(idx)}
                        aria-label={isAr ? 'حذف الشريحة' : 'Delete slide'}
                        className="h-8 w-8 rounded-full text-rose-400 hover:text-rose-200 hover:bg-rose-500/15"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  {/* Mini Live Preview + Titles */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                    {/* Live Cover & Mini Medallion Preview */}
                    <div className="sm:col-span-4">
                      <div
                        className="relative aspect-[4/5] rounded-2xl overflow-hidden border bg-slate-950 shadow-xl"
                        style={{
                          borderColor: `${slide.accentColor || '#00D9FF'}55`,
                          boxShadow: `0 12px 30px ${slide.accentColor || '#00D9FF'}22`,
                        }}
                      >
                        <img
                          src={slide.coverImage}
                          alt={isAr ? slide.titleAr : slide.titleEn}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" />
                        <img
                          src={slide.miniPreviewImage}
                          alt=""
                          className="absolute top-2.5 end-2.5 w-11 h-11 rounded-xl object-cover border-2 border-white/60 shadow-lg"
                        />
                        <div className="absolute inset-x-2.5 bottom-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/15 p-2 text-center">
                          <span
                            className="block text-[10px] font-bold truncate"
                            style={{ color: slide.accentColor || '#00D9FF' }}
                          >
                            {isAr ? slide.badgeAr : slide.badgeEn}
                          </span>
                          <span className="block text-xs font-extrabold text-white truncate mt-0.5">
                            {isAr ? slide.titleAr : slide.titleEn}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bilingual Titles & Badges */}
                    <div className="sm:col-span-8 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-300">
                            {isAr ? 'العنوان بالعربية' : 'Arabic Title'}
                          </Label>
                          <Input
                            dir="rtl"
                            value={slide.titleAr}
                            onChange={(e) =>
                              handleUpdateHeroBook(idx, { titleAr: e.target.value })
                            }
                            className="h-10 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-300">
                            {isAr ? 'العنوان بالإنجليزية' : 'English Title'}
                          </Label>
                          <Input
                            dir="ltr"
                            value={slide.titleEn}
                            onChange={(e) =>
                              handleUpdateHeroBook(idx, { titleEn: e.target.value })
                            }
                            className="h-10 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-300">
                            {isAr ? 'الشارة بالعربية' : 'Arabic Badge'}
                          </Label>
                          <Input
                            dir="rtl"
                            value={slide.badgeAr}
                            onChange={(e) =>
                              handleUpdateHeroBook(idx, { badgeAr: e.target.value })
                            }
                            className="h-10 rounded-xl bg-slate-950/80 border-white/15 text-xs text-cyan-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-300">
                            {isAr ? 'الشارة بالإنجليزية' : 'English Badge'}
                          </Label>
                          <Input
                            dir="ltr"
                            value={slide.badgeEn}
                            onChange={(e) =>
                              handleUpdateHeroBook(idx, { badgeEn: e.target.value })
                            }
                            className="h-10 rounded-xl bg-slate-950/80 border-white/15 text-xs text-cyan-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-300">
                            {isAr ? 'القصة المرتبطة في الكتالوج' : 'Linked Catalog Story'}
                          </Label>
                          <LiquidSelect
                            value={slide.linkedStoryId}
                            onChange={(val) =>
                              handleUpdateHeroBook(idx, { linkedStoryId: val })
                            }
                            options={[
                              ...(!catalogStories.some((s) => s.id === slide.linkedStoryId) &&
                              slide.linkedStoryId
                                ? [{ value: slide.linkedStoryId, label: slide.linkedStoryId }]
                                : []),
                              ...catalogStories.map((story) => ({
                                value: story.id,
                                label: isAr ? story.titleAr : story.titleEn,
                              })),
                            ]}
                            triggerClassName="h-10 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-slate-300">
                            {isAr ? 'لون التوهج المميز' : 'Accent Glow Color'}
                          </Label>
                          <div className="flex flex-wrap items-center gap-1.5 min-h-10 py-1.5 px-2.5 rounded-xl bg-slate-950/80 border border-white/15">
                            {ACCENT_PRESETS.map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => handleUpdateHeroBook(idx, { accentColor: hex })}
                                aria-label={hex}
                                className={`w-5 h-5 shrink-0 rounded-full transition-transform cursor-pointer ${
                                  slide.accentColor === hex
                                    ? 'ring-2 ring-white scale-110'
                                    : 'opacity-75 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                            <input
                              type="color"
                              value={slide.accentColor || '#00D9FF'}
                              onChange={(e) =>
                                handleUpdateHeroBook(idx, { accentColor: e.target.value })
                              }
                              aria-label={isAr ? 'لون مخصص' : 'Custom color'}
                              className="w-6 h-6 shrink-0 rounded bg-transparent border-0 cursor-pointer ms-auto"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cover Image + Mini Preview Upload / URL */}
                  <div className="glass-card-inner rounded-2xl p-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300 flex items-center gap-1.5">
                        <ImageIcon className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
                        <span>
                          {isAr ? 'صورة الغلاف الرئيسية (رابط أو رفع محلي)' : 'Cover Image (URL or Local Upload)'}
                        </span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          dir="ltr"
                          value={slide.coverImage}
                          onChange={(e) =>
                            handleUpdateHeroBook(idx, { coverImage: e.target.value })
                          }
                          placeholder="/artwork/space-ship.webp"
                          className="h-9 rounded-xl bg-slate-950/90 border-white/15 text-xs font-mono text-cyan-200 flex-1"
                        />
                        <label className="bubble-btn-outline h-9 px-3.5 text-xs font-bold gap-1.5 shrink-0">
                          <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>{isAr ? 'رفع' : 'Upload'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              void handleImageFileUpload(e, (url) =>
                                handleUpdateHeroBook(idx, { coverImage: url })
                              )
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300 flex items-center gap-1.5">
                        <ImageIcon className="w-5 h-5 text-pink-400 shrink-0" aria-hidden="true" />
                        <span>
                          {isAr
                            ? 'صورة المعاينة المصغرة (رابط أو رفع محلي)'
                            : 'Mini Preview Image (URL or Local Upload)'}
                        </span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          dir="ltr"
                          value={slide.miniPreviewImage}
                          onChange={(e) =>
                            handleUpdateHeroBook(idx, { miniPreviewImage: e.target.value })
                          }
                          placeholder="/artwork/career-astronaut.webp"
                          className="h-9 rounded-xl bg-slate-950/90 border-white/15 text-xs font-mono text-pink-200 flex-1"
                        />
                        <label className="bubble-btn-outline h-9 px-3.5 text-xs font-bold gap-1.5 shrink-0">
                          <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>{isAr ? 'رفع' : 'Upload'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              void handleImageFileUpload(e, (url) =>
                                handleUpdateHeroBook(idx, { miniPreviewImage: url })
                              )
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: Before/After Character Transformation                       */}
        {/* ================================================================== */}
        {activeTab === 'character' && (
          <div className="space-y-6">
            {/* Section Headings */}
            <div className="glass-card rounded-3xl p-5 sm:p-6 border-white/10 space-y-4">
              <div className="flex items-center gap-2.5">
                <Camera className="w-6 h-6 text-purple-300 shrink-0" aria-hidden="true" />
                <h2 className="text-lg font-bold text-white font-editorial">
                  {isAr ? 'عناوين قسم تحويل صور الأطفال' : 'Transformation Section Headings'}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">
                    {isAr ? 'العنوان الرئيسي (عربي)' : 'Section Title (Arabic)'}
                  </Label>
                  <Input
                    dir="rtl"
                    value={showcaseConfig.characterSectionTitleAr}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        characterSectionTitleAr: e.target.value,
                      }))
                    }
                    className="h-10 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">
                    {isAr ? 'العنوان الرئيسي (إنجليزي)' : 'Section Title (English)'}
                  </Label>
                  <Input
                    dir="ltr"
                    value={showcaseConfig.characterSectionTitleEn}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        characterSectionTitleEn: e.target.value,
                      }))
                    }
                    className="h-10 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">
                    {isAr ? 'الوصف الفرعي (عربي)' : 'Subtitle (Arabic)'}
                  </Label>
                  <Input
                    dir="rtl"
                    value={showcaseConfig.characterSectionSubtitleAr}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        characterSectionSubtitleAr: e.target.value,
                      }))
                    }
                    className="h-10 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">
                    {isAr ? 'الوصف الفرعي (إنجليزي)' : 'Subtitle (English)'}
                  </Label>
                  <Input
                    dir="ltr"
                    value={showcaseConfig.characterSectionSubtitleEn}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        characterSectionSubtitleEn: e.target.value,
                      }))
                    }
                    className="h-10 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Character Cards Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {showcaseConfig.characterCards.map((card, cardIdx) => (
                <div
                  key={card.id}
                  className="glass-card rounded-3xl p-5 border-white/10 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <span className="text-sm font-bold text-cyan-300 font-numeric">
                      {isAr ? `بطاقة #${cardIdx + 1}` : `Card #${cardIdx + 1}`}
                    </span>
                    <Badge className="bg-purple-500/15 text-purple-200 border border-purple-400/30 rounded-full text-xs">
                      {isAr ? card.badgeAr || card.badge : card.badgeEn || card.badge}
                    </Badge>
                  </div>

                  {/* Bilingual Card Title & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-300">
                        {isAr ? 'العنوان (عربي)' : 'Title (Arabic)'}
                      </Label>
                      <Input
                        dir="rtl"
                        value={card.titleAr ?? card.title}
                        onChange={(e) =>
                          handleUpdateCharacterCard(cardIdx, {
                            title: e.target.value,
                            titleAr: e.target.value,
                          })
                        }
                        className="h-9 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-300">
                        {isAr ? 'العنوان (إنجليزي)' : 'Title (English)'}
                      </Label>
                      <Input
                        dir="ltr"
                        value={card.titleEn ?? card.title}
                        onChange={(e) =>
                          handleUpdateCharacterCard(cardIdx, { titleEn: e.target.value })
                        }
                        className="h-9 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-300">
                        {isAr ? 'الوصف (عربي)' : 'Subtitle (Arabic)'}
                      </Label>
                      <Input
                        dir="rtl"
                        value={card.subtitleAr ?? card.subtitle}
                        onChange={(e) =>
                          handleUpdateCharacterCard(cardIdx, {
                            subtitle: e.target.value,
                            subtitleAr: e.target.value,
                          })
                        }
                        className="h-9 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-300">
                        {isAr ? 'الوصف (إنجليزي)' : 'Subtitle (English)'}
                      </Label>
                      <Input
                        dir="ltr"
                        value={card.subtitleEn ?? card.subtitle}
                        onChange={(e) =>
                          handleUpdateCharacterCard(cardIdx, { subtitleEn: e.target.value })
                        }
                        className="h-9 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Before / After Primary & Secondary Images (when available) */}
                  {card.secondaryImage !== undefined && (
                    <div className="glass-card-inner rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-200">
                          {isAr ? 'قبل: الصورة الحقيقية' : 'Before: Real Photo'}
                        </Label>
                        <div className="flex items-center gap-2">
                          <img
                            src={card.primaryImage}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-white/15 shrink-0"
                          />
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <Input
                              dir="ltr"
                              value={card.primaryImage}
                              onChange={(e) =>
                                handleUpdateCharacterCard(cardIdx, {
                                  primaryImage: e.target.value,
                                })
                              }
                              className="h-8 rounded-lg bg-slate-950/90 border-white/15 text-[11px] font-mono text-cyan-200"
                            />
                            <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300 hover:underline cursor-pointer">
                              <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>{isAr ? 'رفع صورة قبل' : 'Upload Before'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  void handleImageFileUpload(e, (url) =>
                                    handleUpdateCharacterCard(cardIdx, { primaryImage: url })
                                  )
                                }
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-cyan-200">
                          {isAr ? 'بعد: رسم بطل الحكاية' : 'After: Illustrated Hero'}
                        </Label>
                        <div className="flex items-center gap-2">
                          <img
                            src={card.secondaryImage}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-cyan-400/40 shrink-0"
                          />
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <Input
                              dir="ltr"
                              value={card.secondaryImage}
                              onChange={(e) =>
                                handleUpdateCharacterCard(cardIdx, {
                                  secondaryImage: e.target.value,
                                })
                              }
                              className="h-8 rounded-lg bg-slate-950/90 border-white/15 text-[11px] font-mono text-pink-200"
                            />
                            <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-pink-300 hover:underline cursor-pointer">
                              <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>{isAr ? 'رفع صورة بعد' : 'Upload After'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  void handleImageFileUpload(e, (url) =>
                                    handleUpdateCharacterCard(cardIdx, { secondaryImage: url })
                                  )
                                }
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Variations List */}
                  <div className="space-y-2.5 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        {isAr ? 'أمثلة وحالات العرض' : 'Showcase Variations'}{' '}
                        <span className="font-numeric text-cyan-300">
                          ({card.variations.length})
                        </span>
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddVariation(cardIdx)}
                        className="h-8 px-3 rounded-full bg-white/10 hover:bg-cyan-500/25 border border-white/15 text-white text-xs gap-1.5"
                      >
                        <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{isAr ? 'إضافة مثال' : 'Add Example'}</span>
                      </Button>
                    </div>

                    <div className="space-y-2.5">
                      {card.variations.map((v, vIdx) => (
                        <div
                          key={`${card.id}-var-${vIdx}`}
                          className="glass-card-inner rounded-2xl p-3 space-y-2.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={v.image}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover border border-white/15 shrink-0"
                            />
                            <div className="flex-1 flex flex-col sm:flex-row gap-2 min-w-0">
                              <Input
                                dir="ltr"
                                value={v.image}
                                onChange={(e) =>
                                  handleUpdateVariation(cardIdx, vIdx, {
                                    image: e.target.value,
                                  })
                                }
                                placeholder="/artwork/character-illustrated.webp"
                                className="h-9 rounded-xl bg-slate-950/90 border-white/15 text-[11px] font-mono text-cyan-200 flex-1"
                              />
                              <label className="bubble-btn-outline h-9 px-3 text-xs font-bold gap-1.5 shrink-0">
                                <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span>{isAr ? 'رفع' : 'Upload'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    void handleImageFileUpload(e, (url) =>
                                      handleUpdateVariation(cardIdx, vIdx, { image: url })
                                    )
                                  }
                                  className="hidden"
                                />
                              </label>
                            </div>
                            {card.variations.length > 1 && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteVariation(cardIdx, vIdx)}
                                aria-label={isAr ? 'حذف المثال' : 'Delete example'}
                                className="h-8 w-8 rounded-full text-rose-400 hover:bg-rose-500/15 shrink-0"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Input
                              dir="rtl"
                              placeholder={isAr ? 'التسمية بالعربية' : 'Arabic label'}
                              value={v.labelAr ?? v.label}
                              onChange={(e) =>
                                handleUpdateVariation(cardIdx, vIdx, {
                                  label: e.target.value,
                                  labelAr: e.target.value,
                                })
                              }
                              className="h-8 rounded-xl bg-slate-950/80 border-white/10 text-xs text-white"
                            />
                            <Input
                              dir="ltr"
                              placeholder={isAr ? 'التسمية بالإنجليزية' : 'English label'}
                              value={v.labelEn ?? v.label}
                              onChange={(e) =>
                                handleUpdateVariation(cardIdx, vIdx, {
                                  labelEn: e.target.value,
                                })
                              }
                              className="h-8 rounded-xl bg-slate-950/80 border-white/10 text-xs text-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: Parent Reviews                                              */}
        {/* ================================================================== */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Section Headings + Add Review CTA */}
            <div className="glass-card rounded-3xl p-5 sm:p-6 border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-6 h-6 text-emerald-300 shrink-0" aria-hidden="true" />
                  <div>
                    <h2 className="text-lg font-bold text-white font-editorial">
                      {isAr ? 'إدارة آراء وتجارب الأهالي' : 'Parent Testimonials Manager'}
                    </h2>
                    <p className="text-xs text-slate-300">
                      {isAr
                        ? 'أضف أو عدّل أو احذف آراء أولياء الأمور المعروضة في الصفحة الرئيسية باللغتين.'
                        : 'Add, edit, or remove verified parent reviews displayed on the homepage in both Arabic and English.'}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddReview}
                  className="bubble-btn-emerald h-10 px-5 text-xs font-bold gap-2"
                >
                  <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'إضافة رأي جديد' : 'Add Parent Review'}</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">
                    {isAr ? 'العنوان الرئيسي (عربي)' : 'Section Title (Arabic)'}
                  </Label>
                  <Input
                    dir="rtl"
                    value={showcaseConfig.reviewsTitleAr}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        reviewsTitleAr: e.target.value,
                      }))
                    }
                    className="h-10 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">
                    {isAr ? 'العنوان الرئيسي (إنجليزي)' : 'Section Title (English)'}
                  </Label>
                  <Input
                    dir="ltr"
                    value={showcaseConfig.reviewsTitleEn}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        reviewsTitleEn: e.target.value,
                      }))
                    }
                    className="h-10 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {showcaseConfig.reviews.length === 0 ? (
              <div className="glass-card rounded-3xl p-10 text-center space-y-3 border-white/10">
                <p className="text-sm text-slate-300">
                  {isAr
                    ? 'لا توجد آراء أهالي حالياً — أضف أول تقييم ليظهر على الصفحة الرئيسية.'
                    : 'No parent reviews yet — add your first testimonial to display on the homepage.'}
                </p>
                <Button
                  type="button"
                  onClick={handleAddReview}
                  className="bubble-btn-emerald h-10 px-5 text-xs font-bold gap-2"
                >
                  <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'إضافة رأي جديد' : 'Add Parent Review'}</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {showcaseConfig.reviews.map((rev, revIdx) => (
                  <div
                    key={rev.id}
                    className="glass-card rounded-3xl p-5 border-white/10 space-y-4"
                  >
                    {/* Review Header: Avatar + Parent Name + Rating + Delete */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={rev.avatarUrl || '/placeholder.svg'}
                          alt={rev.parentName}
                          className="w-12 h-12 rounded-2xl object-cover border border-white/20 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-white block truncate">
                            {rev.parentName}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((starVal) => (
                              <button
                                key={starVal}
                                type="button"
                                onClick={() =>
                                  handleUpdateReview(revIdx, { rating: starVal })
                                }
                                aria-label={
                                  isAr ? `${starVal} نجوم` : `${starVal} stars`
                                }
                                className="cursor-pointer focus-visible:outline-none"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    starVal <= rev.rating
                                      ? 'fill-amber-300 text-amber-300'
                                      : 'text-slate-600'
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs text-amber-200 font-numeric ms-1">
                              {rev.rating}/5
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`verified-${rev.id}`}
                            checked={rev.verified}
                            onCheckedChange={(checked) =>
                              handleUpdateReview(revIdx, { verified: checked })
                            }
                          />
                          <Label
                            htmlFor={`verified-${rev.id}`}
                            className="text-xs text-emerald-300 flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{isAr ? 'موثّق' : 'Verified'}</span>
                          </Label>
                        </div>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteReview(revIdx)}
                          aria-label={isAr ? 'حذف التقييم' : 'Delete review'}
                          className="h-8 w-8 rounded-full text-rose-400 hover:text-rose-200 hover:bg-rose-500/15"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    {/* Parent, City, Child & Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">
                          {isAr ? 'اسم ولي الأمر' : 'Parent Name'}
                        </Label>
                        <Input
                          value={rev.parentName}
                          onChange={(e) =>
                            handleUpdateReview(revIdx, { parentName: e.target.value })
                          }
                          className="h-9 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">
                          {isAr ? 'صورة رمزية (رابط أو رفع)' : 'Avatar (URL or Upload)'}
                        </Label>
                        <div className="flex gap-1.5">
                          <Input
                            dir="ltr"
                            value={rev.avatarUrl || ''}
                            onChange={(e) =>
                              handleUpdateReview(revIdx, { avatarUrl: e.target.value })
                            }
                            placeholder=""
                            className="h-9 rounded-xl bg-slate-950/80 border-white/15 text-[11px] font-mono text-cyan-200 flex-1"
                          />
                          <label className="bubble-btn-outline h-9 px-3 text-xs font-bold gap-1 shrink-0">
                            <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                void handleImageFileUpload(e, (url) =>
                                  handleUpdateReview(revIdx, { avatarUrl: url })
                                )
                              }
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">
                          {isAr ? 'المدينة (عربي)' : 'City (Arabic)'}
                        </Label>
                        <Input
                          dir="rtl"
                          value={rev.cityAr ?? rev.city}
                          onChange={(e) =>
                            handleUpdateReview(revIdx, {
                              city: e.target.value,
                              cityAr: e.target.value,
                            })
                          }
                          className="h-9 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">
                          {isAr ? 'المدينة (إنجليزي)' : 'City (English)'}
                        </Label>
                        <Input
                          dir="ltr"
                          value={rev.cityEn ?? rev.city}
                          onChange={(e) =>
                            handleUpdateReview(revIdx, { cityEn: e.target.value })
                          }
                          className="h-9 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">
                          {isAr ? 'عنوان القصة (عربي)' : 'Book Title (Arabic)'}
                        </Label>
                        <Input
                          dir="rtl"
                          value={rev.bookTitleAr ?? rev.bookTitle}
                          onChange={(e) =>
                            handleUpdateReview(revIdx, {
                              bookTitle: e.target.value,
                              bookTitleAr: e.target.value,
                            })
                          }
                          className="h-9 rounded-xl bg-slate-950/80 border-white/15 text-xs text-cyan-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">
                          {isAr ? 'عنوان القصة (إنجليزي)' : 'Book Title (English)'}
                        </Label>
                        <Input
                          dir="ltr"
                          value={rev.bookTitleEn ?? rev.bookTitle}
                          onChange={(e) =>
                            handleUpdateReview(revIdx, { bookTitleEn: e.target.value })
                          }
                          className="h-9 rounded-xl bg-slate-950/80 border-white/15 text-xs text-cyan-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">
                          {isAr ? 'الطفل والعمر (عربي)' : 'Child & Age (Arabic)'}
                        </Label>
                        <Input
                          dir="rtl"
                          value={rev.childNameAr ?? rev.childName}
                          onChange={(e) =>
                            handleUpdateReview(revIdx, {
                              childName: e.target.value,
                              childNameAr: e.target.value,
                            })
                          }
                          className="h-9 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">
                          {isAr ? 'الطفل والعمر (إنجليزي)' : 'Child & Age (English)'}
                        </Label>
                        <Input
                          dir="ltr"
                          value={rev.childNameEn ?? rev.childName}
                          onChange={(e) =>
                            handleUpdateReview(revIdx, { childNameEn: e.target.value })
                          }
                          className="h-9 rounded-xl bg-slate-950/80 border-white/15 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Bilingual Messages */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">
                          {isAr ? 'نص الرأي (عربي)' : 'Review Message (Arabic)'}
                        </Label>
                        <Textarea
                          dir="rtl"
                          rows={3}
                          value={rev.messageAr}
                          onChange={(e) =>
                            handleUpdateReview(revIdx, { messageAr: e.target.value })
                          }
                          className="rounded-xl bg-slate-950/80 border-white/15 text-xs text-slate-100 leading-relaxed"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">
                          {isAr ? 'نص الرأي (إنجليزي)' : 'Review Message (English)'}
                        </Label>
                        <Textarea
                          dir="ltr"
                          rows={3}
                          value={rev.messageEn}
                          onChange={(e) =>
                            handleUpdateReview(revIdx, { messageEn: e.target.value })
                          }
                          className="rounded-xl bg-slate-950/80 border-white/15 text-xs text-slate-100 leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reset to Defaults Confirmation Dialog */}
        <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
          <DialogContent className="glass-card rounded-3xl border-white/15 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-editorial text-lg">
                {isAr ? 'استعادة الإعدادات الافتراضية؟' : 'Reset Showcase to Defaults?'}
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-sm">
                {isAr
                  ? 'سيتم استرجاع جميع شرائح الكتب الرئيسية وأمثلة تحويل الصور وآراء الأهالي إلى القيم الأصلية.'
                  : 'This will restore all Hero 3D Book slides, Before/After examples, and Parent Reviews back to their original defaults.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetDialogOpen(false)}
                className="rounded-full border-white/15 bg-slate-900/80 text-slate-200 hover:bg-slate-800 text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmReset}
                className="rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold gap-1.5"
              >
                <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'تأكيد الاستعادة' : 'Confirm Reset'}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
