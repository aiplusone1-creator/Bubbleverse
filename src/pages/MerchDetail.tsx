import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Gift,
  Heart,
  MessageCircle,
  Minus,
  PackageCheck,
  PackageX,
  Plus,
  Ribbon,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import { BubSizeAndSafetyWidget } from '@/components/merch/BubSizeAndSafetyWidget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { getMerchCatalog, getStoreConfig } from '@/lib/localStore';
import {
  MERCH_CATEGORIES,
  type MerchProduct,
  type MerchVariant,
} from '@/features/merch/merchCatalog';
import {
  deriveAedFromSar,
  estimateDeliveryWindow,
  formatMoney,
  type CurrencyCountry,
} from '@/features/commerce/pricingEngine';
import type { CartItem } from '@/types/cart';

const MERCH_STORAGE_KEY = 'bubbleverse_merch_catalog_v1';

const DELIVERY_COUNTRIES: readonly {
  id: CurrencyCountry;
  labelAr: string;
  labelEn: string;
}[] = [
  { id: 'EG', labelAr: 'مصر', labelEn: 'Egypt' },
  { id: 'SA', labelAr: 'السعودية', labelEn: 'Saudi Arabia' },
  { id: 'AE', labelAr: 'الإمارات', labelEn: 'UAE' },
] as const;

const CHILD_SAFE_HIGHLIGHTS = [
  {
    id: 'embroidered-eyes',
    ar: 'عيون مطرزة 100% بلا قطع بلاستيكية',
    en: '100% embroidered eyes — zero plastic parts',
  },
  {
    id: 'hypoallergenic-fill',
    ar: 'حشو قطني مضاد للحساسية',
    en: 'Hypoallergenic cloud-cotton fill',
  },
  {
    id: 'gentle-wash',
    ar: 'قابل للغسيل اللطيف',
    en: 'Gentle washable & easy care',
  },
  {
    id: 'luxury-gift-wrap',
    ar: 'تغليف هدايا فاخر',
    en: 'Luxury keepsake gift packaging',
  },
] as const;

function resolveProductFromCatalog(
  catalog: MerchProduct[],
  idOrSlug: string | undefined
): MerchProduct | undefined {
  if (!idOrSlug) return undefined;
  const normalized = idOrSlug.trim().toLowerCase();
  return catalog.find(
    (item) =>
      item.id.toLowerCase() === normalized ||
      item.slug.toLowerCase() === normalized
  );
}

function getCompareAtPercent(
  priceEgp: number,
  compareAtEgp?: number
): number | null {
  if (!compareAtEgp || !Number.isFinite(compareAtEgp) || compareAtEgp <= priceEgp) {
    return null;
  }
  const pct = Math.round(((compareAtEgp - priceEgp) / compareAtEgp) * 100);
  return pct >= 5 ? pct : null;
}

export default function MerchDetail() {
  const { id } = useParams<{ id: string }>();
  const { language, isRTL } = useLanguage();
  const { addMerchItem, openCheckout, gwpConfig } = useCart();
  const shouldReduceMotion = Boolean(useReducedMotion());

  const [catalog, setCatalog] = useState<MerchProduct[]>(() => getMerchCatalog());

  useEffect(() => {
    const syncCatalog = () => {
      setCatalog(getMerchCatalog());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === MERCH_STORAGE_KEY) {
        syncCatalog();
      }
    };

    window.addEventListener('bubbleverse:merch-updated', syncCatalog);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('bubbleverse:merch-updated', syncCatalog);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const product = useMemo(
    () => resolveProductFromCatalog(catalog, id),
    [catalog, id]
  );

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [ribbonName, setRibbonName] = useState('');
  const [deliveryCountry, setDeliveryCountry] = useState<CurrencyCountry>('EG');

  // Reset product-scoped selection state when navigating to a different merch item
  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedVariantId('');
    setQuantity(1);
    setRibbonName('');
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  }, [product?.id, shouldReduceMotion]);

  // Keep selected variant valid if admin updates variants live
  const selectedVariant: MerchVariant | undefined = useMemo(() => {
    if (!product || product.variants.length === 0) return undefined;
    return (
      product.variants.find((variant) => variant.id === selectedVariantId) ??
      product.variants[0]
    );
  }, [product, selectedVariantId]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const seen = new Set<string>();
    const combined = [product.coverImage, ...(product.galleryImages ?? [])];
    const unique: string[] = [];
    for (const src of combined) {
      if (src && !seen.has(src)) {
        seen.add(src);
        unique.push(src);
      }
    }
    return unique;
  }, [product]);

  const safeImageIndex =
    gallery.length > 0 ? Math.min(activeImageIndex, gallery.length - 1) : 0;

  const deliveryEstimate = useMemo(
    () => estimateDeliveryWindow(deliveryCountry, 'physical_merch'),
    [deliveryCountry]
  );

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  // In-context bilingual Not Found view when :id does not exist in catalog
  if (!product) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground flex flex-col">
        <ImmersiveBackground />
        <Header />

        <main className="relative z-10 flex-1 flex items-center justify-center px-4 pt-28 pb-20">
          <div className="glass-card max-w-xl w-full rounded-3xl p-7 sm:p-10 border border-white/15 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/25 to-pink-500/20 border border-cyan-400/30 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-cyan-300" aria-hidden="true" />
            </div>

            <div className="space-y-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 border border-purple-400/30 text-purple-200">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                <span>
                  {language === 'ar' ? 'متجر بابل فيرس' : 'Bubbleverse Merch Store'}
                </span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-editorial text-white">
                {language === 'ar'
                  ? 'عذراً، لم نجد هذا المنتج في متجر بابل'
                  : 'Sorry, we could not find this product'}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {language === 'ar'
                  ? 'ربما تم تعديل رابط المنتج أو نقله. يمكنك تصفّح مجموعة ألعاب وهدايا بابل الرسمية واختيار رفيق طفلك الجديد.'
                  : 'This item link may have moved or is no longer available. Explore our official Bub plush toys, gift boxes, and bedtime companions in the merch store.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                asChild
                className="w-full sm:w-auto min-h-[44px] h-12 px-6 text-sm font-bold font-display gap-2"
              >
                <Link to="/merch">
                  <BackIcon className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {language === 'ar'
                      ? 'العودة إلى متجر بابل'
                      : 'Back to Merch Store'}
                  </span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto min-h-[44px] h-12 px-6 text-sm font-semibold gap-2"
              >
                <Link to="/stories">
                  <BookOpen className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                  <span>
                    {language === 'ar' ? 'تصفّح القصص المخصّصة' : 'Browse Storybooks'}
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </main>

        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    );
  }

  const localizedName = language === 'ar' ? product.nameAr : product.nameEn;
  const localizedTagline =
    language === 'ar' ? product.taglineAr : product.taglineEn;
  const localizedDescription =
    language === 'ar' ? product.descriptionAr : product.descriptionEn;
  const localizedBadge = language === 'ar' ? product.badgeAr : product.badgeEn;
  const localizedAgeRating =
    language === 'ar' ? product.ageRatingAr : product.ageRatingEn;

  const categoryMeta = MERCH_CATEGORIES.find((cat) => cat.id === product.category);
  const localizedCategoryLabel = categoryMeta
    ? language === 'ar'
      ? categoryMeta.labelAr
      : categoryMeta.labelEn
    : product.category;

  const unitPriceEgp = selectedVariant?.priceEgp ?? product.priceEgp;
  const unitPriceSar = selectedVariant?.priceSar ?? product.priceSar;
  const unitPriceAed =
    selectedVariant?.priceAed ??
    product.priceAed ??
    deriveAedFromSar(unitPriceSar);

  const activeSku = selectedVariant?.sku || product.sku;
  const isAvailable = product.inStock && product.stockCount > 0;
  const maxOrderQuantity = isAvailable
    ? Math.max(1, Math.min(10, product.stockCount))
    : 1;
  const safeQuantity = Math.min(quantity, maxOrderQuantity);

  const totalEgp = unitPriceEgp * safeQuantity;
  const totalSar = unitPriceSar * safeQuantity;
  const totalAed = unitPriceAed * safeQuantity;

  const compareAtSavingsPct =
    !selectedVariant || selectedVariant.id === product.variants[0]?.id
      ? getCompareAtPercent(unitPriceEgp, product.compareAtEgp)
      : null;

  const showGwpBanner = Boolean(product.isGwpEligibleGift && gwpConfig.enabled);
  const cleanedRibbon = ribbonName.trim() || undefined;

  const activeVariantShortLabel = selectedVariant
    ? language === 'ar'
      ? selectedVariant.labelAr
      : selectedVariant.labelEn
    : localizedName;

  const handleDecrementQty = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrementQty = () => {
    setQuantity((prev) => Math.min(maxOrderQuantity, prev + 1));
  };

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addMerchItem({
      product,
      variant: selectedVariant,
      quantity: safeQuantity,
      ribbonName: product.allowsRibbonName ? cleanedRibbon : undefined,
    });
  };

  const handleDirectBuy = () => {
    if (!isAvailable) return;
    const directRibbon = product.allowsRibbonName ? cleanedRibbon : undefined;
    const directItem: CartItem = {
      id: `direct-merch-${product.id}-${Date.now()}`,
      itemType: 'merch',
      storyId: product.id,
      merchId: product.id,
      sku: activeSku,
      variantId: selectedVariant?.id,
      variantLabelAr: selectedVariant?.labelAr,
      variantLabelEn: selectedVariant?.labelEn,
      ribbonName: directRibbon,
      titleAr: product.nameAr,
      titleEn: product.nameEn,
      coverImage: product.coverImage,
      format: 'physical_merch',
      formatLabelAr: 'منتج براند بابل فيرس',
      formatLabelEn: 'Official Merch',
      pagesCount: 0,
      priceEgp: unitPriceEgp,
      priceSar: unitPriceSar,
      priceAed: unitPriceAed,
      quantity: safeQuantity,
      childName: directRibbon || '',
      childGender: 'boy',
      childAge: '',
      storyLanguage: language === 'en' ? 'en' : 'ar',
      createdAt: Date.now(),
    };
    openCheckout(directItem);
  };

  const openWhatsAppInquiry = () => {
    const config = getStoreConfig();
    const variantSnippet = selectedVariant
      ? ` (${language === 'ar' ? selectedVariant.labelAr : selectedVariant.labelEn})`
      : '';
    const text = encodeURIComponent(
      language === 'ar'
        ? `أهلاً فريق بابل فيرس! حابب أستفسر عن منتج "${product.nameAr}"${variantSnippet} وخيارات الشحن وتغليف الهدايا.`
        : `Hi Bubbleverse team! I'd love to ask about "${product.nameEn}"${variantSnippet}, gift wrapping, and delivery options.`
    );
    window.open(
      `https://wa.me/${config.whatsappPhone.replace(/\D/g, '')}?text=${text}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const gwpThresholdSummaryAr =
    gwpConfig.triggerMode === 'min_books'
      ? `عند طلب ${gwpConfig.minBooks} كتب فأكثر`
      : gwpConfig.triggerMode === 'min_subtotal'
        ? `عند أي طلب فوق ${gwpConfig.minSubtotalEgp} ج.م (${gwpConfig.minSubtotalSar} ر.س / ${gwpConfig.minSubtotalAed} د.إ)`
        : `عند طلب كتابين أو طلب فوق ${gwpConfig.minSubtotalEgp} ج.م`;

  const gwpThresholdSummaryEn =
    gwpConfig.triggerMode === 'min_books'
      ? `when ordering ${gwpConfig.minBooks}+ storybooks`
      : gwpConfig.triggerMode === 'min_subtotal'
        ? `on orders over ${gwpConfig.minSubtotalEgp} EGP (${gwpConfig.minSubtotalSar} SAR / ${gwpConfig.minSubtotalAed} AED)`
        : `when ordering ${gwpConfig.minBooks}+ storybooks or orders over ${gwpConfig.minSubtotalEgp} EGP (${gwpConfig.minSubtotalSar} SAR / ${gwpConfig.minSubtotalAed} AED)`;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <ImmersiveBackground />

      <Header />

      <main className="relative z-10 pt-24 sm:pt-28 pb-16 lg:pb-20">
        {/* Breadcrumb Navigation */}
        <div className="px-4 bv-container pt-2 pb-5">
          <nav
            aria-label={language === 'ar' ? 'مسار التصفح' : 'Breadcrumb'}
            className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap"
          >
            <Link
              to="/"
              className="hover:text-primary transition-colors min-h-[32px] inline-flex items-center"
            >
              {language === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            <ChevronRight
              className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            <Link
              to="/merch"
              className="hover:text-primary transition-colors min-h-[32px] inline-flex items-center"
            >
              {language === 'ar' ? 'متجر بابل' : 'Bubbleverse Merch'}
            </Link>
            <ChevronRight
              className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
            <span className="text-foreground font-semibold truncate max-w-[220px] sm:max-w-md">
              {localizedName}
            </span>
          </nav>
        </div>

        {/* Main 2-Column Merch PDP Grid */}
        <section className="px-4 bv-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
            {/* LEFT COLUMN: Sticky 1:1 Studio Visual Showcase + Thumbnails + 4-Point Child-Safe Card */}
            <div className="lg:col-span-5 w-full max-w-lg mx-auto lg:max-w-none lg:mx-0 space-y-5 lg:sticky lg:top-24">
              {/* Large 1:1 Studio Product Frame */}
              <div className="relative rounded-3xl aspect-square overflow-hidden bg-slate-950/90 border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
                {/* Subtle Midnight Magic ambient rim glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.16),transparent_48%),radial-gradient(circle_at_85%_85%,rgba(236,72,153,0.14),transparent_50%)] z-10"
                />

                {/* Top Floating Badges */}
                <div className="absolute top-2.5 lg:top-3.5 inset-x-2.5 lg:inset-x-3.5 z-20 flex items-center justify-between gap-2 pointer-events-none">
                  {localizedBadge ? (
                    <span className="inline-flex items-center gap-1 lg:gap-1.5 px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-full text-[11px] lg:text-xs font-bold bg-slate-950/80 backdrop-blur-md border border-cyan-400/40 text-cyan-200 shadow-lg">
                      <Sparkles className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
                      <span>{localizedBadge}</span>
                    </span>
                  ) : (
                    <span />
                  )}

                  {compareAtSavingsPct !== null && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-full text-[11px] lg:text-xs font-extrabold bg-pink-500/90 text-white shadow-lg font-numeric">
                      <Tag className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {language === 'ar'
                          ? `وفّر ${compareAtSavingsPct}%`
                          : `Save ${compareAtSavingsPct}%`}
                      </span>
                    </span>
                  )}
                </div>

                {/* Smooth Image Switcher */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={gallery[safeImageIndex] ?? product.coverImage}
                    src={gallery[safeImageIndex] ?? product.coverImage}
                    alt={localizedName}
                    initial={
                      shouldReduceMotion ? false : { opacity: 0, scale: 0.985 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.24 }}
                    className={`w-full h-full object-cover ${
                      !isAvailable ? 'opacity-70 grayscale-[20%]' : ''
                    }`}
                  />
                </AnimatePresence>

                {(gallery[safeImageIndex] ?? product.coverImage).startsWith('/artwork/merch-') && (
                  <span className="absolute end-3 bottom-3 z-10 rounded-lg bg-slate-950/85 px-2.5 py-1.5 text-xs text-white">
                    {language === 'ar' ? 'تصوّر للمنتج' : 'Product concept'}
                  </span>
                )}

                {/* Out-of-stock scrim ribbon */}
                {!isAvailable && (
                  <div className="absolute bottom-4 inset-x-4 z-20 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-rose-400/40 px-4 py-2.5 flex items-center justify-center gap-2 text-rose-200 text-xs sm:text-sm font-bold">
                    <PackageX className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      {language === 'ar'
                        ? 'نفذت الكمية مؤقتاً — سيتوفر قريباً'
                        : 'Temporarily Out of Stock — Restocking Soon'}
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {gallery.length > 1 && (
                <div
                  role="group"
                  aria-label={
                    language === 'ar' ? 'صور المنتج المصغّرة' : 'Product gallery thumbnails'
                  }
                  className="flex gap-3 overflow-x-auto pb-1"
                >
                  {gallery.map((img, idx) => {
                    const isSelected = safeImageIndex === idx;
                    return (
                      <button
                        key={`${img}-${idx}`}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        aria-pressed={isSelected}
                        aria-label={
                          language === 'ar'
                            ? `عرض الصورة رقم ${idx + 1} من ${localizedName}`
                            : `View image ${idx + 1} of ${localizedName}`
                        }
                        className={`relative w-[68px] h-[68px] min-w-[44px] min-h-[44px] rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          isSelected
                            ? 'border-cyan-400 shadow-[0_0_16px_rgba(0,217,255,0.35)] scale-[1.03]'
                            : 'border-white/10 opacity-75 hover:opacity-100 hover:border-white/30'
                        }`}
                      >
                        <img
                          src={img}
                          alt={
                            language === 'ar'
                              ? `${localizedName} - صورة ${idx + 1}`
                              : `${localizedName} - photo ${idx + 1}`
                          }
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4-Point Child-Safe Quality Card */}
              <div className="glass-card rounded-3xl p-5 border border-white/15 space-y-3.5">
                <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                  <Award className="w-5 h-5 text-cyan-400 shrink-0" aria-hidden="true" />
                  <span>
                    {language === 'ar'
                      ? 'معايير أمان وجودة بابل فيرس للأطفال:'
                      : 'Bubbleverse 4-Point Child-Safe Guarantee:'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-200">
                  {CHILD_SAFE_HIGHLIGHTS.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 rounded-2xl bg-slate-950/55 border border-white/10 px-3 py-2.5"
                    >
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="leading-snug">
                        {language === 'ar' ? item.ar : item.en}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Details, GWP Notice, Variant Selector, Ribbon Name, Delivery, Buy Box, Cross-Sell & BubSizeAndSafetyWidget */}
            <div className="lg:col-span-7 space-y-6">
              {/* Title, Category, Age Rating & Stock Pills */}
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Pill */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 border border-purple-400/30 text-purple-200">
                    <Sparkles className="w-3.5 h-3.5 text-purple-300 shrink-0" aria-hidden="true" />
                    <span>{localizedCategoryLabel}</span>
                  </span>

                  {/* Age Rating Pill */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 border border-cyan-400/30 text-cyan-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
                    <span>{localizedAgeRating}</span>
                  </span>

                  {/* Stock Indicator Pill */}
                  {isAvailable ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-400/35 text-emerald-300">
                      <PackageCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {language === 'ar'
                          ? 'متوفر للشحن السريع'
                          : 'In Stock — Fast Dispatch'}
                      </span>
                      {product.stockCount <= 10 && (
                        <span className="text-amber-300 font-numeric">
                          •{' '}
                          {language === 'ar'
                            ? `متبقي ${product.stockCount}`
                            : `${product.stockCount} left`}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 border border-rose-400/35 text-rose-300">
                      <PackageX className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {language === 'ar'
                          ? 'نفذت الكمية مؤقتاً'
                          : 'Temporarily Out of Stock'}
                      </span>
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold font-editorial text-white leading-tight">
                  {localizedName}
                </h1>

                <p className="text-sm sm:text-base font-semibold text-cyan-200/95 leading-relaxed">
                  {localizedTagline}
                </p>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {localizedDescription}
                </p>

                {/* Live SKU & Quick Price Preview Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 font-numeric">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white">
                      {formatMoney(unitPriceEgp, 'EGP', language)}
                    </span>
                    {compareAtSavingsPct !== null && product.compareAtEgp && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatMoney(product.compareAtEgp, 'EGP', language)}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-cyan-300">
                      • {formatMoney(unitPriceSar, 'SAR', language)} •{' '}
                      {formatMoney(unitPriceAed, 'AED', language)}
                    </span>
                  </div>

                  <span
                    dir="ltr"
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300"
                  >
                    SKU: {activeSku}
                  </span>
                </div>
              </div>

              {/* Live Free Bub GWP Notice Banner */}
              {showGwpBanner && (
                <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-emerald-500/20 via-cyan-500/15 to-teal-500/20 border border-emerald-400/45 shadow-[0_0_28px_rgba(16,185,129,0.16)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-400/20 border border-emerald-300/40 flex items-center justify-center shrink-0">
                        <Gift className="w-5 h-5 text-emerald-300" aria-hidden="true" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-300">
                          <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            {language === 'ar'
                              ? 'هدية بابل المجانية مع القصص'
                              : 'Free Bub Gift-With-Purchase'}
                          </span>
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                          {language === 'ar'
                            ? `خبر سعيد! يمكنك شراء كورة Bub الآن، أو الحصول على مقاس ميني 12 سم هدية مجانية ${gwpThresholdSummaryAr}!`
                            : `Great news! Buy your Bub Plush Ball now, or get the Mini 12cm FREE ${gwpThresholdSummaryEn}!`}
                        </p>
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="min-h-[44px] h-11 px-4 rounded-xl border-emerald-300/50 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-100 hover:text-white text-xs sm:text-sm font-bold shrink-0 gap-2"
                    >
                      <Link to="/stories">
                        <BookOpen className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                        <span>
                          {language === 'ar' ? 'اطلب قصتك الآن' : 'Shop Storybooks'}
                        </span>
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Visual Variant / Size Selector Cards */}
              {product.variants.length > 0 && (
                <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/15 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base sm:text-lg font-bold font-editorial text-white flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-cyan-400 shrink-0" aria-hidden="true" />
                      <span>
                        {language === 'ar'
                          ? 'اختاروا المقاس / الإصدار'
                          : 'Choose Your Size / Edition'}
                      </span>
                    </h2>
                    {selectedVariant?.diameterCm && (
                      <span
                        dir="ltr"
                        className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 font-numeric"
                      >
                        Ø {selectedVariant.diameterCm} cm
                      </span>
                    )}
                  </div>

                  <div
                    role="group"
                    aria-label={
                      language === 'ar'
                        ? 'خيارات المقاس والإصدار'
                        : 'Product size and edition variants'
                    }
                    className={`grid grid-cols-1 gap-3 ${
                      product.variants.length === 2
                        ? 'sm:grid-cols-2'
                        : product.variants.length >= 3
                          ? 'sm:grid-cols-3'
                          : 'sm:grid-cols-1'
                    }`}
                  >
                    {product.variants.map((variant) => {
                      const isSelected = selectedVariant?.id === variant.id;
                      const variantBadge =
                        language === 'ar' ? variant.badgeAr : variant.badgeEn;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariantId(variant.id)}
                          aria-pressed={isSelected}
                          className={`min-h-[44px] p-4 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isSelected
                              ? 'bg-purple-950/55 border-cyan-400 shadow-[0_0_22px_rgba(0,217,255,0.22)]'
                              : 'bg-slate-950/65 border-white/10 hover:border-white/25'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              {variant.diameterCm ? (
                                <span
                                  dir="ltr"
                                  className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold font-numeric border ${
                                    isSelected
                                      ? 'bg-cyan-500/25 border-cyan-300/60 text-cyan-100'
                                      : 'bg-white/5 border-white/15 text-slate-300'
                                  }`}
                                >
                                  {variant.diameterCm} cm
                                </span>
                              ) : (
                                <span />
                              )}

                              {variantBadge && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/35">
                                  {variantBadge}
                                </span>
                              )}
                            </div>

                            <p className="text-sm font-bold text-white font-display leading-snug">
                              {language === 'ar' ? variant.labelAr : variant.labelEn}
                            </p>

                            <p className="text-xs text-slate-300 leading-relaxed">
                              {language === 'ar'
                                ? variant.dimensionsAr
                                : variant.dimensionsEn}
                            </p>
                          </div>

                          <div className="pt-2.5 border-t border-white/10 space-y-1">
                            <p className="text-xs sm:text-sm font-extrabold text-cyan-300 font-numeric">
                              {formatMoney(variant.priceEgp, 'EGP', language)}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-400 font-numeric">
                              {formatMoney(variant.priceSar, 'SAR', language)} •{' '}
                              {formatMoney(variant.priceAed, 'AED', language)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Optional Personalized Satin Ribbon Name Tag */}
              {product.allowsRibbonName && (
                <div className="glass-card rounded-3xl p-5 sm:p-6 border border-pink-400/25 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="merch-ribbon-name-input"
                      className="text-sm sm:text-base font-bold font-editorial text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Ribbon
                        className="w-5 h-5 text-pink-400 shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        {language === 'ar'
                          ? 'بطاقة شريط الستان باسم طفلك (اختياري)'
                          : 'Personalized Satin Keepsake Ribbon Tag (Optional)'}
                      </span>
                    </label>

                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-400/35 text-emerald-300">
                      {language === 'ar' ? 'مجاناً مع المنتج' : 'Included Free'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === 'ar'
                      ? 'أضف اسم البطل لنطبعه بحب على بطاقة الستان المرفقة مع المنتج لتبقى ذكرى لا تُنسى.'
                      : "Add your child's name and we'll print it on the keepsake satin gift ribbon attached to Bub — completely free."}
                  </p>

                  <div className="relative">
                    <Input
                      id="merch-ribbon-name-input"
                      type="text"
                      maxLength={28}
                      value={ribbonName}
                      onChange={(e) => setRibbonName(e.target.value)}
                      placeholder={
                        language === 'ar'
                          ? 'مثال: زين، ليلى، عمر...'
                          : 'e.g. Zain, Layla, Omar...'
                      }
                      className="h-12 rounded-2xl bg-slate-950/80 border-white/15 text-white placeholder:text-slate-500 pe-11"
                    />
                    {ribbonName && (
                      <button
                        type="button"
                        onClick={() => setRibbonName('')}
                        aria-label={
                          language === 'ar' ? 'مسح الاسم' : 'Clear ribbon name'
                        }
                        className="absolute inset-y-0 end-1 my-auto w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  {/* Live Satin Ribbon Preview Pill */}
                  <div className="rounded-2xl px-4 py-2.5 bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-cyan-500/15 border border-white/15 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-300">
                      {language === 'ar' ? 'معاينة شريط الهدية:' : 'Gift Tag Preview:'}
                    </span>
                    <span className="font-bold text-pink-200 truncate">
                      {language === 'ar'
                        ? `«صديق البطل: ${cleanedRibbon || 'اسم طفلك'}»`
                        : `“Best Buddy of ${cleanedRibbon || 'Your Hero'}”`}
                    </span>
                  </div>
                </div>
              )}

              {/* Live Delivery Window Estimator (EG / SA / AE) */}
              <div className="glass-card rounded-2xl px-4 py-3.5 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <Truck
                    className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-emerald-300 block">
                      {language === 'ar'
                        ? 'موعد التوصيل المتوقّع للمنتجات'
                        : 'Estimated Merch Delivery'}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white font-numeric block">
                      {language === 'ar'
                        ? deliveryEstimate.labelAr
                        : deliveryEstimate.labelEn}
                    </span>
                  </div>
                </div>

                <div
                  role="group"
                  aria-label={
                    language === 'ar'
                      ? 'اختر دولة التوصيل'
                      : 'Choose delivery destination'
                  }
                  className="flex items-center gap-1.5 shrink-0"
                >
                  {DELIVERY_COUNTRIES.map((country) => (
                    <button
                      key={country.id}
                      type="button"
                      onClick={() => setDeliveryCountry(country.id)}
                      aria-pressed={deliveryCountry === country.id}
                      className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        deliveryCountry === country.id
                          ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                          : 'bg-slate-950/70 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {language === 'ar' ? country.labelAr : country.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversion Buy Box: Quantity + Total + Add to Cart + Direct Buy */}
              <div className="glass-card rounded-3xl p-5 sm:p-6 border border-purple-400/30 shadow-2xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Dynamic Total Price */}
                  <div>
                    <span className="text-xs text-slate-400 block">
                      {language === 'ar' ? 'الإجمالي:' : 'Total:'}
                    </span>
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 font-numeric mt-0.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white">
                        {formatMoney(totalEgp, 'EGP', language)}
                      </span>
                      <span className="text-sm font-semibold text-cyan-300">
                        • {formatMoney(totalSar, 'SAR', language)} •{' '}
                        {formatMoney(totalAed, 'AED', language)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">
                      {language === 'ar' ? 'الكمية:' : 'Qty:'}
                    </span>
                    <div className="inline-flex items-center rounded-2xl bg-slate-950/80 border border-white/15 p-1">
                      <button
                        type="button"
                        onClick={handleDecrementQty}
                        disabled={!isAvailable || safeQuantity <= 1}
                        aria-label={
                          language === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'
                        }
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Minus className="w-4 h-4" aria-hidden="true" />
                      </button>

                      <span
                        aria-live="polite"
                        className="min-w-[2.5rem] text-center text-sm font-extrabold text-white font-numeric"
                      >
                        {safeQuantity}
                      </span>

                      <button
                        type="button"
                        onClick={handleIncrementQty}
                        disabled={!isAvailable || safeQuantity >= maxOrderQuantity}
                        aria-label={
                          language === 'ar' ? 'زيادة الكمية' : 'Increase quantity'
                        }
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary & Secondary Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!isAvailable}
                    className="w-full min-h-[44px] xl:min-h-[48px] h-11 xl:h-12 px-4 xl:px-6 text-xs md:text-sm xl:text-base font-bold font-display gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      {isAvailable
                        ? language === 'ar'
                          ? 'أضف للسلة'
                          : 'Add to Cart'
                        : language === 'ar'
                          ? 'نفذت الكمية'
                          : 'Out of Stock'}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleDirectBuy}
                    disabled={!isAvailable}
                    className="w-full min-h-[44px] xl:min-h-[48px] h-11 xl:h-12 px-4 xl:px-6 text-xs md:text-sm xl:text-base font-bold font-display gap-2"
                  >
                    <CreditCard className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      {language === 'ar' ? 'اطلب الآن' : 'Order Now'}
                    </span>
                  </Button>
                </div>

                {/* WhatsApp Quick Inquiry */}
                <Button
                  type="button"
                  variant="emerald"
                  onClick={openWhatsAppInquiry}
                  className="w-full min-h-[44px] h-auto py-2.5 px-4 whitespace-normal text-center leading-snug text-xs sm:text-sm font-semibold gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
                  <span>
                    {language === 'ar'
                      ? 'عندك استفسار عن المقاس أو الهدايا؟ تواصل معنا على واتساب'
                      : 'Questions about sizing or gifting? Chat with us on WhatsApp'}
                  </span>
                </Button>

                {/* Trust Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-300 border-t border-white/10">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
                    <span>
                      {language === 'ar'
                        ? 'دفع آمن في مصر والسعودية والإمارات'
                        : 'Trusted payments in Egypt, KSA & UAE'}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-pink-400 shrink-0" aria-hidden="true" />
                    <span>
                      {language === 'ar'
                        ? 'تغليف هدايا فاخر جاهز للتقديم'
                        : 'Gift-ready luxury packaging'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Slumberkins-Inspired Story Cross-Sell Card */}
              <div className="rounded-3xl p-5 bg-gradient-to-r from-purple-600/25 via-fuchsia-500/20 to-cyan-500/25 border border-purple-400/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-purple-500/25 border border-purple-300/35 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-cyan-300" aria-hidden="true" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] font-bold text-cyan-300 block">
                      {language === 'ar'
                        ? 'طقس القراءة والاحتضان الكامل'
                        : 'The Complete Bedtime Story Ritual'}
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                      {language === 'ar'
                        ? 'أكمل التجربة! اربطها بقصة مخصّصة باسم وصورة طفلك (ووفّر 15% عند طلب كتابين)'
                        : "Complete the experience! Pair it with a personalized storybook starring your child's name & photo (and save 15% on 2+ books)"}
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  variant="secondary"
                  className="min-h-[44px] h-11 px-5 rounded-xl text-xs sm:text-sm font-bold shrink-0 gap-2"
                >
                  <Link to="/stories">
                    <Sparkles className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                    <span>
                      {language === 'ar' ? 'استكشف القصص' : 'Explore Stories'}
                    </span>
                  </Link>
                </Button>
              </div>

              {/* Jellycat / Slumberkins Interactive "How Big Is Bub?", Lore, Bedtime Ritual & Safety Widget */}
              <BubSizeAndSafetyWidget
                productNameAr={product.nameAr}
                productNameEn={product.nameEn}
                selectedDiameterCm={selectedVariant?.diameterCm}
                selectedDimensionsAr={selectedVariant?.dimensionsAr}
                selectedDimensionsEn={selectedVariant?.dimensionsEn}
                ageRatingAr={product.ageRatingAr}
                ageRatingEn={product.ageRatingEn}
                safetySpecsAr={product.safetySpecsAr}
                safetySpecsEn={product.safetySpecsEn}
                careAr={product.careAr}
                careEn={product.careEn}
                bubLoreAr={product.bubLoreAr}
                bubLoreEn={product.bubLoreEn}
                bedtimeRitualAr={product.bedtimeRitualAr}
                bedtimeRitualEn={product.bedtimeRitualEn}
              />
            </div>
          </div>
        </section>
      </main>

      <div className="relative z-10 pb-24 lg:pb-0">
        <Footer />
      </div>

      {/* Mobile & Tablet Sticky Buy Bar */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/92 backdrop-blur-xl border-t border-white/15 shadow-[0_-10px_35px_rgba(0,0,0,0.45)]"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="bv-container px-4 pt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 block truncate">
              {activeVariantShortLabel}
            </span>
            <div className="flex flex-wrap items-baseline gap-x-1.5 font-numeric">
              <span className="text-base sm:text-lg font-extrabold text-white">
                {formatMoney(totalEgp, 'EGP', language)}
              </span>
              <span className="text-[11px] font-semibold text-cyan-300">
                • {formatMoney(totalSar, 'SAR', language)} •{' '}
                {formatMoney(totalAed, 'AED', language)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className="min-h-[44px] h-11 px-4 text-xs sm:text-sm font-bold gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span>
                {isAvailable
                  ? language === 'ar'
                    ? 'أضف للسلة'
                    : 'Add'
                  : language === 'ar'
                    ? 'نفذت'
                    : 'Sold Out'}
              </span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleDirectBuy}
              disabled={!isAvailable}
              aria-label={language === 'ar' ? 'اطلب الآن' : 'Order Now'}
              className="min-h-[44px] h-11 px-3.5 text-xs sm:text-sm font-bold gap-1.5"
            >
              <CreditCard className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'اطلب الآن' : 'Buy Now'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
