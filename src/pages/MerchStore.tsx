import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Search,
  ShoppingBag,
  Gift,
  BookOpen,
  Heart,
  MoonStar,
  ArrowRight,
  SlidersHorizontal,
  X,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Eye,
  PackageCheck,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import TiltBookCard from '@/components/ui/TiltBookCard';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import {
  MERCH_CATEGORIES,
  type MerchCategory,
  type MerchProduct,
} from '@/features/merch/merchCatalog';
import { type GwpConfigRecord } from '@/features/commerce/gwpEngine';
import { getGwpConfig, getMerchCatalog } from '@/lib/localStore';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

type MerchCategoryFilter = 'all' | MerchCategory;

function formatBooksCountAr(count: number): string {
  if (count === 1) return 'كتاب واحد';
  if (count === 2) return 'كتابين';
  return `${count} كتب`;
}

function buildGwpBannerCopy(config: GwpConfigRecord, isAr: boolean): string {
  const valueText = isAr
    ? `${config.retailValueEgp} ج.م • ${config.retailValueSar} ر.س • ${config.retailValueAed} د.إ`
    : `${config.retailValueEgp} EGP • ${config.retailValueSar} SAR • ${config.retailValueAed} AED`;

  if (config.triggerMode === 'min_books') {
    return isAr
      ? `هدية مجانية! احصل على كورة Bub القطيفة (بقيمة ${valueText}) مجاناً مع طلب ${formatBooksCountAr(config.minBooks)} أو أكثر!`
      : `FREE Gift! Get the Official Bub Plush Ball (worth ${valueText}) FREE when you order ${config.minBooks}+ books!`;
  }

  if (config.triggerMode === 'min_subtotal') {
    return isAr
      ? `هدية مجانية! احصل على كورة Bub القطيفة (بقيمة ${valueText}) مجاناً مع أي طلب بقيمة ${config.minSubtotalEgp} ج.م (${config.minSubtotalSar} ر.س / ${config.minSubtotalAed} د.إ) أو أكثر!`
      : `FREE Gift! Get the Official Bub Plush Ball (worth ${valueText}) FREE on any order of ${config.minSubtotalEgp} EGP (${config.minSubtotalSar} SAR / ${config.minSubtotalAed} AED) or more!`;
  }

  return isAr
    ? `هدية مجانية! احصل على كورة Bub القطيفة (بقيمة ${valueText}) مجاناً مع طلب ${formatBooksCountAr(config.minBooks)} أو أي طلب فوق ${config.minSubtotalEgp} ج.م (${config.minSubtotalSar} ر.س / د.إ)!`
    : `FREE Gift! Get the Official Bub Plush Ball (worth ${valueText}) FREE with ${config.minBooks}+ books or any order over ${config.minSubtotalEgp} EGP (${config.minSubtotalSar} SAR / AED)!`;
}

function getStockStatus(product: MerchProduct, isAr: boolean) {
  if (!product.inStock || product.stockCount <= 0) {
    return {
      available: false,
      label: isAr ? 'نفدت الكمية' : 'Out of Stock',
      className: 'bg-rose-500/15 border-rose-400/35 text-rose-200',
    };
  }
  if (product.stockCount <= 10) {
    return {
      available: true,
      label: isAr ? 'كمية محدودة' : 'Limited Stock',
      className: 'bg-amber-500/15 border-amber-400/35 text-amber-200',
    };
  }
  return {
    available: true,
    label: isAr ? 'متوفر للشحن' : 'In Stock',
    className: 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200',
  };
}

export function MerchStore() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const shouldReduceMotion = Boolean(useReducedMotion());
  const { addMerchItem } = useCart();

  const [products, setProducts] = useState<MerchProduct[]>(() => getMerchCatalog());
  const [gwpConfig, setGwpConfig] = useState<GwpConfigRecord>(() => getGwpConfig());
  const [selectedCategory, setSelectedCategory] = useState<MerchCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Live sync with AdminMerch changes and cross-tab storage updates
  useEffect(() => {
    const syncMerch = () => setProducts(getMerchCatalog());
    const syncGwp = () => setGwpConfig(getGwpConfig());
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'bubbleverse_merch_catalog_v1') {
        syncMerch();
      }
      if (!event.key || event.key === 'bubbleverse_gwp_config_v1') {
        syncGwp();
      }
    };

    window.addEventListener('bubbleverse:merch-updated', syncMerch);
    window.addEventListener('bubbleverse:gwp-updated', syncGwp);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('bubbleverse:merch-updated', syncMerch);
      window.removeEventListener('bubbleverse:gwp-updated', syncGwp);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!q) return true;
      return (
        product.nameAr.toLowerCase().includes(q) ||
        product.nameEn.toLowerCase().includes(q) ||
        product.taglineAr.toLowerCase().includes(q) ||
        product.taglineEn.toLowerCase().includes(q) ||
        product.descriptionAr.toLowerCase().includes(q) ||
        product.descriptionEn.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q)
      );
    });
  }, [products, selectedCategory, searchQuery]);

  const hasActiveFilters = selectedCategory !== 'all' || searchQuery.trim() !== '';

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const handleQuickAdd = (product: MerchProduct) => {
    if (!product.inStock || product.stockCount <= 0) return;
    const defaultVariant = product.variants[0];
    addMerchItem({
      product,
      variant: defaultVariant,
      quantity: 1,
    });
  };

  const gwpTargetMerchId = gwpConfig.giftMerchId || 'bub-plush-ball';
  const gwpBannerText = buildGwpBannerCopy(gwpConfig, isAr);

  const flywheelSteps = [
    {
      number: '01',
      icon: BookOpen,
      accentClass: 'bg-cyan-500/15 border-cyan-400/35 text-cyan-300',
      numberClass: 'text-cyan-300',
      titleAr: 'القصة المخصّصة',
      titleEn: 'Personalized Storybook',
      descAr: 'تزرع الشجاعة واللطف وتجعل طفلك بطل حكايته بملامحه الحقيقية واسمه.',
      descEn: 'Nurtures courage and kindness by making your child the real hero of every spread.',
    },
    {
      number: '02',
      icon: Heart,
      accentClass: 'bg-purple-500/15 border-purple-400/35 text-purple-300',
      numberClass: 'text-purple-300',
      titleAr: 'كورة Bub القطيفة',
      titleEn: 'Official Bub Plush Ball',
      descAr: 'رفيق اللعب والحضن الحقيقي — ينزل من صفحات القصة ليعيش مع طفلك كل يوم.',
      descEn: 'A real-world cuddle and play companion that leaps straight off the story page.',
    },
    {
      number: '03',
      icon: MoonStar,
      accentClass: 'bg-pink-500/15 border-pink-400/35 text-pink-300',
      numberClass: 'text-pink-300',
      titleAr: 'طقس القراءة قبل النوم',
      titleEn: 'Bedtime Reading Ritual',
      descAr: 'ذكريات دافئة بدون شاشات تعيش العمر كله وتُحبّب طفلك في القراءة كل مساء.',
      descEn: 'Cozy, screen-free bedtime memories that turn storytime into their favorite nightly ritual.',
    },
  ];

  const categoryTabs: Array<{ id: MerchCategoryFilter; labelAr: string; labelEn: string }> = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All' },
    ...MERCH_CATEGORIES,
  ];

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden bg-background text-foreground ${
        isRTL ? 'rtl' : ''
      }`}
    >
      <ImmersiveBackground />
      <Header />

      <main className="relative z-10 pt-24 sm:pt-28 pb-20">
        {/* Brand Split Hero Section */}
        <section className="px-4 bv-container pt-4 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-8 lg:gap-10 xl:gap-14 items-center">
            {/* Hero Copy & Free Bub GWP Banner */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: EASE_OUT }}
              className="md:col-span-7 space-y-4 lg:space-y-5 xl:space-y-6 text-center md:text-start"
            >
              <div className="inline-flex items-center gap-2 px-3.5 xl:px-4 py-1 xl:py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs xl:text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>
                  {isAr ? 'عالم منتجات بابل فيرس للأطفال' : 'Official Bubbleverse Kids Brand'}
                </span>
              </div>

              <h1 className="text-[clamp(2.25rem,4.6vw,3.75rem)] font-extrabold font-editorial leading-[1.15] text-white text-balance max-w-[18ch] mx-auto md:mx-0 md:max-w-none">
                {isAr ? (
                  <>
                    خلّي حكاية طفلك تنزل من الكتاب...{' '}
                    <span className="text-magical">وتعيش معاه في حضنه!</span>
                  </>
                ) : (
                  <>
                    Bring the Story Off the Page —{' '}
                    <span className="text-magical">Meet Official Bub &amp; Friends!</span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto md:mx-0 leading-relaxed">
                {isAr
                  ? 'مجموعة منتجات بابل فيرس الأصلية للأطفال: كورة Bub القطيفة المتلألئة، صناديق الهدايا الفاخرة، أباجورة النوم المضيئة، وشنطة الأبطال — مصممة بخامات آمنة 100% لتكمل عالم قصص طفلك المخصّصة.'
                  : 'Discover the official Bubbleverse Kids collection: huggable iridescent Bub Plush Balls, magnetic keepsake gift boxes, silicone bedtime starlight lamps, and adventure backpacks crafted with child-safe materials.'}
              </p>

              {/* Dynamic Live Free Bub GWP Banner */}
              {gwpConfig.enabled && (
                <div className="glass-card rounded-3xl p-3.5 md:p-4 xl:p-5 border border-emerald-400/35 bg-gradient-to-br from-emerald-950/45 via-slate-900/80 to-cyan-950/35 text-start shadow-[0_0_32px_rgba(16,185,129,0.16)]">
                  <div className="flex flex-col sm:flex-row items-start gap-3 xl:gap-3.5">
                    <div className="w-9 h-9 xl:w-11 xl:h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                      <Gift className="w-4 h-4 xl:w-5 xl:h-5 text-emerald-300" aria-hidden="true" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-[10px] xl:text-[11px] font-bold text-emerald-200">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          {isAr
                            ? 'عرض الهدية المجانية • يُضاف تلقائياً في السلة'
                            : 'Free Gift-With-Purchase • Auto-Unlocked in Cart'}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm xl:text-base font-bold text-white leading-relaxed">
                        {gwpBannerText}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Split Hero CTAs */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center md:justify-start gap-2.5 xl:gap-3.5 pt-1">
                <Button asChild size="lg" className="min-h-[44px] xl:min-h-[48px] h-11 xl:h-12 px-4 xl:px-7 text-xs md:text-sm xl:text-base gap-2">
                  <Link to="/stories">
                    <Gift className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      {isAr
                        ? gwpConfig.enabled
                          ? 'اطلب قصتك وافتح هدية Bub'
                          : 'تصفّح القصص المخصّصة'
                        : gwpConfig.enabled
                          ? 'Shop Stories & Unlock Free Bub'
                          : 'Browse Personalized Stories'}
                    </span>
                    <ArrowRight
                      className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="min-h-[44px] xl:min-h-[48px] h-11 xl:h-12 px-4 xl:px-7 text-xs md:text-sm xl:text-base gap-2 border-cyan-400/35 bg-slate-950/60 hover:bg-slate-900/80 text-white"
                >
                  <Link to={`/merch/${gwpTargetMerchId}`}>
                    <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                    <span>
                      {isAr ? 'استعرض كورة Bub القطيفة' : 'Explore Official Bub Plush'}
                    </span>
                  </Link>
                </Button>
              </div>

              {/* Clean Brand Reassurance Points (Zero Fake Customer Counts) */}
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2.5 pt-1 text-xs sm:text-sm text-slate-300 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'خامات آمنة للأطفال 0+' : 'Child-safe 0+ materials'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-pink-400 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'تغليف هدايا فاخر جاهز' : 'Gift-ready keepsake packaging'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-purple-400 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'توصيل لمصر والسعودية والإمارات' : 'Egypt, Saudi & UAE shipping'}</span>
                </span>
              </div>
            </motion.div>

            {/* Glowing 3D TiltBookCard Halo Showcasing Bub Plush Ball */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: 0.08, ease: EASE_OUT }}
              className="md:col-span-5 relative flex items-center justify-center"
            >
              {/* Soft Iridescent Cosmic Halo */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-cyan-500/25 via-purple-500/20 to-pink-500/25 blur-3xl opacity-80"
              />

              <div className="relative w-full max-w-[20rem] sm:max-w-[24rem] md:max-w-full lg:max-w-[clamp(22rem,26vw,30rem)]">
                <TiltBookCard
                  maxTilt={10}
                  scaleOnHover={1.03}
                  glareMaxOpacity={0.28}
                  className="rounded-[2rem] aspect-square shadow-[0_20px_60px_rgba(0,217,255,0.22)]"
                >
                  <Link
                    to={`/merch/${gwpTargetMerchId}`}
                    aria-label={
                      isAr
                        ? 'استعراض كورة باب القطيفة المتلألئة'
                        : 'Explore Official Bub Iridescent Plush Ball'
                    }
                    className="relative block w-full h-full rounded-[2rem] overflow-hidden border border-cyan-300/35 bg-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <img
                      src={gwpConfig.coverImage || '/merch/bub-plush-ball.jpg'}
                      alt={
                        isAr
                          ? 'كورة باب القطيفة المتلألئة من بابل فيرس'
                          : 'Official Bub Iridescent Plush Ball by Bubbleverse'
                      }
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/merch/bub-plush-ball.jpg';
                      }}
                    />

                    {/* Subtle Bottom Editorial Caption Bar */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-3.5 pt-8 lg:p-5 lg:pt-12 text-start">
                      <div className="flex items-end justify-between gap-2 lg:gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <span className="inline-flex items-center gap-1 text-[10px] lg:text-[11px] font-bold text-cyan-300">
                            <Sparkles className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">
                              {isAr ? 'أيقونة عالم بابل فيرس' : 'Bubbleverse Signature Mascot'}
                            </span>
                          </span>
                          <p className="text-sm lg:text-base xl:text-lg font-extrabold font-editorial text-white leading-snug">
                            {isAr ? 'كورة Bub القطيفة المتلألئة' : 'Official Bub Plush Ball'}
                          </p>
                        </div>
                        <span className="shrink-0 px-2.5 py-0.5 lg:px-3 lg:py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] lg:text-xs font-bold text-emerald-200 font-numeric">
                          {isAr ? '3 مقاسات' : '3 Sizes'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </TiltBookCard>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Slumberkins-Inspired 3-Step Kids Brand Flywheel Strip */}
        <section
          aria-label={
            isAr ? 'رحلة تجربة بابل فيرس للأطفال' : 'The Bubbleverse Kids Brand Experience'
          }
          className="px-4 bv-container mb-12 sm:mb-14"
        >
          <div className="glass-card rounded-3xl p-5 sm:p-7 border border-white/12">
            <div className="text-center mb-6 space-y-1.5">
              <p className="text-xs font-bold text-cyan-300">
                {isAr ? 'أكثر من مجرد كتاب... عالم متكامل لطفلك' : 'More Than a Book — A Complete Kids World'}
              </p>
              <h2 className="text-xl sm:text-2xl font-extrabold font-editorial text-white">
                {isAr
                  ? 'كيف تحوّل بابل فيرس وقت القراءة إلى لحظة يومية ساحرة؟'
                  : 'How Bubbleverse Turns Storytime Into a Daily Ritual'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {flywheelSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.number}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 0.4, delay: index * 0.08, ease: EASE_OUT }
                    }
                    className="relative rounded-2xl bg-slate-950/60 border border-white/10 p-5 flex flex-col gap-3.5 text-start"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${step.accentClass}`}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <span
                        className={`font-numeric text-2xl font-extrabold opacity-85 ${step.numberClass}`}
                      >
                        {step.number}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-bold font-editorial text-white">
                        {isAr ? step.titleAr : step.titleEn}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {isAr ? step.descAr : step.descEn}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Clean Category Filter Bar + Search */}
        <section
          aria-label={isAr ? 'تصفية والبحث في منتجات بابل فيرس' : 'Filter and search merch'}
          className="px-4 bv-container mb-10"
        >
          <div className="glass-card rounded-3xl p-4 sm:p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between">
              {/* Search Input */}
              <div className="relative w-full md:w-96">
                <Search
                  aria-hidden="true"
                  className={`absolute ${
                    isRTL ? 'right-3.5' : 'left-3.5'
                  } top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label={
                    isAr ? 'ابحث في متجر منتجات بابل فيرس' : 'Search Bubbleverse merch store'
                  }
                  placeholder={
                    isAr
                      ? 'ابحث عن كورة Bub، صندوق هدايا، أباجورة، شنطة...'
                      : 'Search Bub plush, gift box, night lamp, backpack...'
                  }
                  className={`w-full min-h-[44px] h-11 bg-slate-950/75 border border-white/10 rounded-2xl ${
                    isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'
                  } text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/70 transition-colors`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                    className={`absolute ${
                      isRTL ? 'left-2' : 'right-2'
                    } top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results Count + Reset */}
              <div className="flex items-center justify-between md:justify-end gap-3">
                <span className="text-xs sm:text-sm text-slate-300 font-medium font-numeric">
                  {isAr
                    ? `عرض ${filteredProducts.length} من ${products.length} منتج`
                    : `Showing ${filteredProducts.length} of ${products.length} items`}
                </span>
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetFilters}
                    className="min-h-[44px] px-4 text-xs font-semibold gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isAr ? 'مسح الفلاتر' : 'Reset'}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Category Pills Bar */}
            <div
              role="group"
              aria-label={isAr ? 'تصفية حسب القسم' : 'Filter by category'}
              className="flex items-center gap-2 overflow-x-auto pb-1 pt-3 border-t border-white/10 scrollbar-none"
            >
              <span className="text-xs text-muted-foreground shrink-0 inline-flex items-center gap-1.5 font-semibold me-1">
                <SlidersHorizontal className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>{isAr ? 'القسم:' : 'Category:'}</span>
              </span>
              {categoryTabs.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`whitespace-nowrap px-4 py-2 min-h-[44px] rounded-full text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_16px_rgba(0,217,255,0.3)]'
                        : 'bg-slate-950/60 hover:bg-slate-900 text-slate-300 hover:text-white border border-white/10'
                    }`}
                  >
                    {isAr ? cat.labelAr : cat.labelEn}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Merch Product Grid (Responsive 1 / 2 / 3 / 4 Cols) */}
        <section
          aria-label={isAr ? 'قائمة منتجات بابل فيرس' : 'Bubbleverse merch catalog'}
          className="px-4 bv-container"
        >
          {filteredProducts.length === 0 ? (
            <div className="glass-card rounded-3xl text-center py-16 px-6 border border-white/10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 text-primary mx-auto flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold font-editorial text-white">
                  {isAr
                    ? 'مالقيناش منتجات مطابقة لبحثك حالياً'
                    : 'No matching merch items found'}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {isAr
                    ? 'جرّب اختيار قسم آخر أو مسح كلمة البحث لاستعراض كل منتجات عالم بابل فيرس.'
                    : 'Try picking another category or clearing your search to view all Bubbleverse merch.'}
                </p>
              </div>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className="min-h-[44px] px-6 text-sm font-semibold gap-2"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  <span>{isAr ? 'عرض كل المنتجات' : 'Show All Merch'}</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 xl:gap-8">
              {filteredProducts.map((product) => {
                const name = isAr ? product.nameAr : product.nameEn;
                const tagline = isAr ? product.taglineAr : product.taglineEn;
                const badge = isAr ? product.badgeAr : product.badgeEn;
                const ageRating = isAr ? product.ageRatingAr : product.ageRatingEn;
                const stock = getStockStatus(product, isAr);
                const hasCompareAt = Boolean(
                  product.compareAtEgp && product.compareAtEgp > product.priceEgp
                );
                const hasMultipleVariants = product.variants.length > 1;

                return (
                  <motion.article
                    key={product.id}
                    layout={!shouldReduceMotion}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: EASE_OUT }}
                    className="glass-card rounded-3xl p-4 sm:p-5 border border-white/10 hover:border-cyan-400/35 flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-4">
                      {/* Large Square Studio Image inside Subtle Hover Frame */}
                      <Link
                        to={`/merch/${product.id}`}
                        aria-label={isAr ? `استعراض تفاصيل ${name}` : `View details for ${name}`}
                        className="group relative block aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <img
                          src={product.coverImage}
                          alt={name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
                          onError={(e) => {
                            e.currentTarget.src = '/merch/bub-plush-ball.jpg';
                          }}
                        />

                        {/* Clean Top Corner Badge */}
                        {badge && (
                          <span
                            className={`absolute top-2.5 lg:top-3 ${
                              isRTL ? 'right-2.5 lg:right-3' : 'left-2.5 lg:left-3'
                            } inline-flex items-center gap-1 px-2.5 py-0.5 lg:px-3 lg:py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-cyan-300/35 text-[10px] lg:text-[11px] font-bold text-cyan-200 shadow-lg`}
                          >
                            <Sparkles className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
                            <span>{badge}</span>
                          </span>
                        )}
                      </Link>

                      {/* Meta Chips: Age Rating + Stock Badge */}
                      <div className="space-y-2.5 px-0.5 text-start">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/30 text-[11px] font-semibold text-purple-200">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{ageRating}</span>
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${stock.className}`}
                          >
                            {stock.label}
                          </span>
                        </div>

                        {/* Title & Tagline */}
                        <div className="space-y-1">
                          <h3 className="text-lg sm:text-xl font-bold font-editorial text-white leading-snug line-clamp-2">
                            <Link
                              to={`/merch/${product.id}`}
                              className="hover:text-cyan-300 transition-colors focus-visible:outline-none focus-visible:underline"
                            >
                              {name}
                            </Link>
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
                            {tagline}
                          </p>
                        </div>

                        {/* 3-Currency Pricing (EGP • SAR • AED) with Optional Compare-At */}
                        <div className="pt-1.5 space-y-1 border-t border-white/10">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {hasMultipleVariants
                                ? isAr
                                  ? `يبدأ من (${product.variants.length} خيارات)`
                                  : `From (${product.variants.length} options)`
                                : isAr
                                  ? 'السعر'
                                  : 'Price'}
                            </span>

                            <div className="flex flex-wrap items-baseline gap-2 font-numeric">
                              {hasCompareAt && product.compareAtEgp && (
                                <span className="text-xs text-slate-400 line-through">
                                  {isAr
                                    ? `${product.compareAtEgp} ج.م`
                                    : `${product.compareAtEgp} EGP`}
                                </span>
                              )}
                              <span className="text-lg font-extrabold text-cyan-300">
                                {isAr ? `${product.priceEgp} ج.م` : `${product.priceEgp} EGP`}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 font-numeric">
                            <span>
                              {isAr
                                ? `${product.priceSar} ر.س • ${product.priceAed} د.إ`
                                : `${product.priceSar} SAR • ${product.priceAed} AED`}
                            </span>
                            {hasCompareAt && product.compareAtSar && (
                              <span className="text-[11px] text-slate-400 line-through">
                                {isAr
                                  ? `${product.compareAtSar} ر.س • ${product.compareAtAed ?? product.compareAtSar} د.إ`
                                  : `${product.compareAtSar} SAR • ${product.compareAtAed ?? product.compareAtSar} AED`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TWO Crisp Actions: View Details + Instant Add to Cart */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <Button
                        asChild
                        variant="outline"
                        className="min-h-[44px] h-11 px-3 text-xs sm:text-sm font-bold gap-1.5 border-white/15 bg-slate-950/60 hover:bg-slate-900 text-white"
                      >
                        <Link to={`/merch/${product.id}`}>
                          <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            {isAr ? 'استعراض التفاصيل' : 'View Details'}
                          </span>
                        </Link>
                      </Button>

                      <Button
                        type="button"
                        disabled={!stock.available}
                        onClick={() => handleQuickAdd(product)}
                        className="min-h-[44px] h-11 px-3 text-xs sm:text-sm font-bold gap-1.5"
                      >
                        <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {stock.available
                            ? isAr
                              ? 'أضف للسلة'
                              : 'Add to Cart'
                            : isAr
                              ? 'غير متوفر'
                              : 'Sold Out'}
                        </span>
                      </Button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom Storybook Cross-Sell CTA Strip */}
        <section className="px-4 bv-container mt-16">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-primary/25 bg-gradient-to-br from-cyan-950/35 via-slate-900/75 to-purple-950/35 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-start">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {isAr ? 'كمّل تجربة عالم بابل فيرس' : 'Complete the Bubbleverse Experience'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold font-editorial text-white">
                {isAr
                  ? 'اجمع قصص طفلك المخصّصة مع رفيقه Bub في شحنة واحدة!'
                  : 'Pair Your Child’s Personalized Book With Official Bub in One Box!'}
              </h2>
              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                {isAr
                  ? 'تقدر تضيف قصتك المخصّصة مع أي منتج من المتجر في نفس السلة، ومع الطلبات المؤهلة تنفتح هدية كورة Bub القطيفة مجاناً تلقائياً.'
                  : 'Mix personalized storybooks and Bub merch in one unified cart — qualifying orders automatically unlock your complimentary Bub Plush Ball gift.'}
              </p>
            </div>

            <Button asChild size="lg" className="min-h-[44px] xl:min-h-[48px] h-11 xl:h-12 px-5 xl:px-7 shrink-0 gap-2 text-xs md:text-sm xl:text-base">
              <Link to="/stories">
                <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'استكشف مكتبة القصص' : 'Explore Story Library'}</span>
                <ArrowRight
                  className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default MerchStore;
