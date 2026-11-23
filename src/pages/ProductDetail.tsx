import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Star,
  ShoppingBag,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Upload,
  X,
  Gift,
  Heart,
  ChevronRight,
  Award,
  AlertCircle,
  Check,
  Truck,
  Users,
  Palette,
  Sticker,
  QrCode,
  Tag,
  Lock,
  Eye,
  Images,
  ArrowRight,
  SearchX,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import TiltBookCard from '@/components/ui/TiltBookCard';
import LiveBookPreviewCard from '@/components/product/LiveBookPreviewCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import type { CatalogStory } from '@/features/stories/catalogStories';
import {
  getCatalogStories,
  getGwpConfig,
  getStoreConfig,
  type GwpConfigRecord,
} from '@/lib/localStore';
import { validateCharacterPhoto } from '@/lib/characterPhoto';
import {
  ADDON_PRICING,
  calculateAddonTotal,
  deriveAedFromSar,
  estimateDeliveryWindow,
  type AddonFlags,
  type CurrencyCountry,
  type StoryOccasion,
} from '@/features/commerce/pricingEngine';

type PdpOccasionId = Exclude<StoryOccasion, 'bedtime_values'>;

interface OccasionOption {
  id: PdpOccasionId;
  labelAr: string;
  labelEn: string;
}

const OCCASION_OPTIONS: readonly OccasionOption[] = [
  { id: 'birthday', labelAr: 'عيد ميلاد', labelEn: 'Birthday' },
  { id: 'ramadan_eid', labelAr: 'رمضان / العيد', labelEn: 'Ramadan & Eid' },
  { id: 'siblings', labelAr: 'هدية إخوة', labelEn: 'Siblings' },
  { id: 'graduation', labelAr: 'تخرج', labelEn: 'Graduation' },
  { id: 'everyday', labelAr: 'هدية يومية', labelEn: 'Everyday Gift' },
] as const;

const DELIVERY_COUNTRIES: readonly {
  id: CurrencyCountry;
  labelAr: string;
  labelEn: string;
}[] = [
  { id: 'EG', labelAr: 'مصر', labelEn: 'Egypt' },
  { id: 'SA', labelAr: 'السعودية', labelEn: 'Saudi Arabia' },
  { id: 'AE', labelAr: 'الإمارات', labelEn: 'UAE' },
] as const;

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_PHOTO_PIXELS = 24_000_000;
const THUMBNAIL_MAX_DIM = 480;
const THUMBNAIL_JPEG_QUALITY = 0.78;

async function validateUploadedPhotoFile(file: File, language: 'ar' | 'en'): Promise<void> {
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) {
    throw new Error(
      language === 'ar'
        ? 'يرجى اختيار صورة بحجم أقل من 10 ميجابايت.'
        : 'Please choose a photo smaller than 10 MB.'
    );
  }

  if (file.type === 'image/webp') {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const isRiff =
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const isWebp =
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    if (!isRiff || !isWebp) {
      throw new Error(
        language === 'ar'
          ? 'ملف الصورة غير صالح. يرجى اختيار صورة JPG أو PNG أو WEBP.'
          : 'Invalid image file. Please choose a valid JPG, PNG, or WEBP photo.'
      );
    }
    return;
  }

  try {
    await validateCharacterPhoto(file);
  } catch {
    throw new Error(
      language === 'ar'
        ? 'يرجى اختيار صورة صالحة بصيغة JPG أو PNG أو WEBP بحجم أقل من 10 ميجابايت.'
        : 'Please choose a valid JPG, PNG, or WEBP photo under 10 MB.'
    );
  }
}

function downscalePhotoToQuotaSafeJpeg(
  file: File,
  language: 'ar' | 'en',
  maxDim = THUMBNAIL_MAX_DIM,
  quality = THUMBNAIL_JPEG_QUALITY
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (!width || !height || width * height > MAX_PHOTO_PIXELS) {
          reject(
            new Error(
              language === 'ar'
                ? 'تعذّر قراءة أبعاد الصورة أو حجمها كبير جداً. يرجى اختيار صورة أخرى.'
                : 'Photo dimensions are invalid or exceed 24 megapixels. Please choose another.'
            )
          );
          return;
        }

        const longestEdge = Math.max(width, height);
        const scale = longestEdge > maxDim ? maxDim / longestEdge : 1;
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(
            new Error(
              language === 'ar'
                ? 'تعذّر تجهيز الصورة في المتصفح. يرجى المحاولة مرة أخرى.'
                : 'Could not process the photo in this browser. Please try again.'
            )
          );
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        reject(
          new Error(
            language === 'ar'
              ? 'تعذّر ضغط الصورة. يرجى اختيار صورة أخرى.'
              : 'Could not compress the photo. Please choose another.'
          )
        );
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          language === 'ar'
            ? 'تعذّر فتح هذه الصورة. يرجى اختيار صورة أخرى.'
            : 'This photo could not be opened. Please choose another.'
        )
      );
    };

    img.src = objectUrl;
  });
}

function resolveDefaultOccasion(story: CatalogStory): PdpOccasionId {
  const firstOccasion = story.occasions?.[0];
  if (
    firstOccasion === 'birthday' ||
    firstOccasion === 'ramadan_eid' ||
    firstOccasion === 'siblings' ||
    firstOccasion === 'graduation'
  ) {
    return firstOccasion;
  }
  return 'birthday';
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { language, isRTL } = useLanguage();
  const { addItem, openCheckout } = useCart();
  const shouldReduceMotion = Boolean(useReducedMotion());

  // Find story from dynamic local catalog; track explicit invalid-slug state without breaking hook order
  const { matchedStory, fallbackStory } = useMemo(() => {
    const stories = getCatalogStories();
    const matched = id ? stories.find((s) => s.id === id) ?? null : stories[0] ?? null;
    return {
      matchedStory: matched,
      fallbackStory: matched ?? stories[0],
    };
  }, [id]);
  const isStoryNotFound = Boolean(id && !matchedStory);
  const story: CatalogStory = fallbackStory;

  // Live-synced Free Bub Plush Ball GWP configuration
  const [gwpConfig, setGwpConfig] = useState<GwpConfigRecord>(() => getGwpConfig());

  useEffect(() => {
    const syncGwp = () => setGwpConfig(getGwpConfig());
    window.addEventListener('bubbleverse:gwp-updated', syncGwp);
    window.addEventListener('storage', syncGwp);
    return () => {
      window.removeEventListener('bubbleverse:gwp-updated', syncGwp);
      window.removeEventListener('storage', syncGwp);
    };
  }, []);

  // Showcase mode: default to Live Personalized Preview, toggleable to raw Gallery
  const [showcaseMode, setShowcaseMode] = useState<'live' | 'gallery'>('live');

  // Gallery active index
  const gallery =
    story.galleryImages && story.galleryImages.length > 0
      ? story.galleryImages
      : [story.coverImage];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Spread Preview Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeSpreadIndex, setActiveSpreadIndex] = useState(0);

  // Format selection: 'hardcover_15' | 'hardcover_25' | 'digital_pdf'
  const [selectedFormat, setSelectedFormat] = useState<
    'hardcover_15' | 'hardcover_25' | 'digital_pdf'
  >('hardcover_15');

  // Delivery destination country for live delivery window estimator
  const [deliveryCountry, setDeliveryCountry] = useState<CurrencyCountry>('EG');

  // Occasion selector
  const [selectedOccasion, setSelectedOccasion] = useState<PdpOccasionId>(() =>
    resolveDefaultOccasion(story)
  );

  // High-margin ecosystem AOV add-ons
  const [hasColoringAddon, setHasColoringAddon] = useState(false);
  const [hasGiftBoxAddon, setHasGiftBoxAddon] = useState(false);
  const [hasStickersAddon, setHasStickersAddon] = useState(false);
  const [hasAudioStoryAddon, setHasAudioStoryAddon] = useState(false);

  // Co-Hero (Sibling / Best Friend / Pet) add-on
  const [hasCoHeroAddon, setHasCoHeroAddon] = useState(false);
  const [coHeroName, setCoHeroName] = useState('');

  // Personalization form
  const [childName, setChildName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [childGender, setChildGender] = useState<'boy' | 'girl'>(
    story.gender === 'girl' ? 'girl' : 'boy'
  );
  const [childAge, setChildAge] = useState(
    story.ageRange === '2-4' ? '3' : story.ageRange === '8-10' ? '8' : '6'
  );
  const [storyLanguage, setStoryLanguage] = useState<'ar' | 'en' | 'bilingual'>(() =>
    language === 'en' ? 'en' : 'ar'
  );
  const [storyLanguageTouched, setStoryLanguageTouched] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Dedication / Gift Message toggle
  const [hasGiftMessage, setHasGiftMessage] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const childNameInputRef = useRef<HTMLInputElement>(null);
  const uploadRequestRef = useRef(0);

  // Keep storybook language aligned with site language unless the user explicitly chose one
  useEffect(() => {
    if (!storyLanguageTouched) {
      setStoryLanguage(language === 'en' ? 'en' : 'ar');
    }
  }, [language, storyLanguageTouched]);

  // Sync story-specific defaults when navigating between products
  useEffect(() => {
    setActiveImageIndex(0);
    setActiveSpreadIndex(0);
    setSelectedOccasion(resolveDefaultOccasion(story));
    setChildGender(story.gender === 'girl' ? 'girl' : 'boy');
    setChildAge(story.ageRange === '2-4' ? '3' : story.ageRange === '8-10' ? '8' : '6');
  }, [story]);

  // Price calculations (EGP / SAR / AED)
  const priceEgp =
    selectedFormat === 'hardcover_15'
      ? story.priceEgp15Pages
      : selectedFormat === 'hardcover_25'
      ? story.priceEgp25Pages
      : story.pricePdfEgp;

  const priceSar =
    selectedFormat === 'hardcover_15'
      ? story.priceSar15Pages
      : selectedFormat === 'hardcover_25'
      ? story.priceSar25Pages
      : story.pricePdfSar;

  const priceAed15 = story.priceAed15Pages ?? deriveAedFromSar(story.priceSar15Pages);
  const priceAed25 = story.priceAed25Pages ?? deriveAedFromSar(story.priceSar25Pages);
  const pricePdfAed = story.pricePdfAed ?? deriveAedFromSar(story.pricePdfSar);

  const priceAed =
    selectedFormat === 'hardcover_15'
      ? priceAed15
      : selectedFormat === 'hardcover_25'
      ? priceAed25
      : pricePdfAed;

  const addonFlags: AddonFlags = useMemo(
    () => ({
      hasColoringBookAddon: hasColoringAddon,
      hasGiftBoxAddon,
      hasStickersAddon,
      hasAudioStoryAddon,
      hasCoHeroAddon,
    }),
    [
      hasColoringAddon,
      hasGiftBoxAddon,
      hasStickersAddon,
      hasAudioStoryAddon,
      hasCoHeroAddon,
    ]
  );

  const addonTotalEgp = calculateAddonTotal(addonFlags, 'EG');
  const addonTotalSar = calculateAddonTotal(addonFlags, 'SA');
  const addonTotalAed = calculateAddonTotal(addonFlags, 'AE');

  const totalEgp = priceEgp + addonTotalEgp;
  const totalSar = priceSar + addonTotalSar;
  const totalAed = priceAed + addonTotalAed;

  const selectedAddonsCount = [
    hasColoringAddon,
    hasGiftBoxAddon,
    hasStickersAddon,
    hasAudioStoryAddon,
    hasCoHeroAddon,
  ].filter(Boolean).length;

  const bookFormat = selectedFormat === 'digital_pdf' ? 'digital_pdf' : 'hardcover_book';

  const deliveryEstimate = useMemo(
    () => estimateDeliveryWindow(deliveryCountry, bookFormat),
    [deliveryCountry, bookFormat]
  );

  const selectedOccasionMeta =
    OCCASION_OPTIONS.find((opt) => opt.id === selectedOccasion) ?? OCCASION_OPTIONS[0];

  const selectedFormatShortLabel =
    selectedFormat === 'hardcover_15'
      ? language === 'ar'
        ? 'غلاف فاخر • 15 صفحة'
        : 'Hardcover • 15 pages'
      : selectedFormat === 'hardcover_25'
      ? language === 'ar'
        ? 'غلاف فاخر • 25 صفحة'
        : 'Deluxe • 25 pages'
      : language === 'ar'
      ? 'نسخة رقمية فورية'
      : 'Instant Digital PDF';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset value so retrying the same file still triggers onChange
    e.target.value = '';
    if (!file) return;

    const requestId = ++uploadRequestRef.current;
    setPhotoError(null);
    setPhotoAnalyzing(true);

    try {
      await validateUploadedPhotoFile(file, language);
      const compressedThumbnail = await downscalePhotoToQuotaSafeJpeg(file, language);
      if (uploadRequestRef.current === requestId) {
        setUploadedPhoto(compressedThumbnail);
      }
    } catch (error) {
      if (uploadRequestRef.current === requestId) {
        setPhotoError(
          error instanceof Error
            ? error.message
            : language === 'ar'
              ? 'يرجى اختيار صورة صالحة بصيغة JPG أو PNG أو WEBP بحجم أقل من 10 ميجابايت.'
              : 'Please choose a valid JPG, PNG, or WEBP photo under 10 MB.'
        );
      }
    } finally {
      if (uploadRequestRef.current === requestId) {
        setPhotoAnalyzing(false);
      }
    }
  };

  const validatePersonalization = () => {
    if (!childName.trim()) {
      setNameError(true);
      childNameInputRef.current?.scrollIntoView({
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
        block: 'center',
      });
      childNameInputRef.current?.focus({ preventScroll: true });
      return false;
    }
    setNameError(false);
    return true;
  };

  const formatLabelAr =
    selectedFormat === 'hardcover_15'
      ? 'كتاب ورقي فاخر (15 صفحة)'
      : selectedFormat === 'hardcover_25'
      ? 'كتاب ورقي مطوّل (25 صفحة)'
      : 'نسخة رقمية فورية';

  const formatLabelEn =
    selectedFormat === 'hardcover_15'
      ? 'Hardcover Keepsake (15 pages)'
      : selectedFormat === 'hardcover_25'
      ? 'Extended Hardcover (25 pages)'
      : 'Instant Digital PDF';

  const buildOrderPayload = () => ({
    storyId: story.id,
    titleAr: story.titleAr,
    titleEn: story.titleEn,
    coverImage: story.coverImage,
    format: bookFormat as 'digital_pdf' | 'hardcover_book',
    formatLabelAr,
    formatLabelEn,
    pagesCount: selectedFormat === 'hardcover_25' ? 25 : 15,
    priceEgp,
    priceSar,
    priceAed,
    quantity: 1,
    childName: childName.trim(),
    childGender,
    childAge,
    storyLanguage,
    giftMessage: hasGiftMessage && giftMessage.trim() ? giftMessage.trim() : undefined,
    photoPreview: uploadedPhoto || undefined,
    hasColoringBookAddon: hasColoringAddon,
    hasGiftBoxAddon,
    hasStickersAddon,
    hasAudioStoryAddon,
    hasCoHeroAddon,
    coHeroName: hasCoHeroAddon && coHeroName.trim() ? coHeroName.trim() : undefined,
    occasion: selectedOccasion,
  });

  const handleAddToCart = () => {
    if (!validatePersonalization()) return;
    addItem(buildOrderPayload());
  };

  const handleBuyNow = () => {
    if (!validatePersonalization()) return;
    openCheckout({
      id: `direct-${story.id}-${Date.now()}`,
      ...buildOrderPayload(),
      createdAt: Date.now(),
    });
  };

  const openWhatsAppInquiry = () => {
    const config = getStoreConfig();
    const text = encodeURIComponent(
      language === 'ar'
        ? `أهلاً فريق بابل فيرس! حابب أستفسر عن تفاصيل قصة "${story.titleAr}" وخيارات الطباعة والتوصيل.`
        : `Hi Bubbleverse team! I'd love to ask about "${story.titleEn}" and printing/delivery options.`
    );
    window.open(`https://wa.me/${config.whatsappPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  const localizedTitle = language === 'ar' ? story.titleAr : story.titleEn;
  const localizedValuesTags =
    language === 'ar' ? story.valuesTagsAr ?? [] : story.valuesTagsEn ?? [];

  const ecosystemAddons = [
    {
      id: 'coloring' as const,
      checked: hasColoringAddon,
      toggle: () => setHasColoringAddon((prev) => !prev),
      icon: Palette,
      accentClass: 'text-cyan-300',
      activeBorderClass: 'bg-cyan-950/40 border-cyan-400/80 shadow-[0_0_18px_rgba(0,217,255,0.16)]',
      activeCheckClass: 'bg-cyan-400 border-cyan-300 text-slate-950',
      titleAr: 'دفتر تلوين الأبطال المطابق',
      titleEn: 'Matching Hero Coloring Book',
      descAr: 'صفحات تلوين لشخصية طفلك عشان يلوّن مغامرته بإيده',
      descEn: 'Matching line-art pages starring your child’s story hero',
      pricing: ADDON_PRICING.coloring,
    },
    {
      id: 'giftBox' as const,
      checked: hasGiftBoxAddon,
      toggle: () => setHasGiftBoxAddon((prev) => !prev),
      icon: Gift,
      accentClass: 'text-pink-300',
      activeBorderClass: 'bg-pink-950/35 border-pink-400/80 shadow-[0_0_18px_rgba(244,114,182,0.16)]',
      activeCheckClass: 'bg-pink-400 border-pink-300 text-slate-950',
      titleAr: 'علبة هدايا فاخرة + كارت إهداء مطبوع',
      titleEn: 'Luxury Gift Box + Printed Greeting Card',
      descAr: 'تغليف فخم جاهز للتقديم في أعياد الميلاد والمناسبات',
      descEn: 'Keepsake gift-ready packaging with a printed greeting card',
      pricing: ADDON_PRICING.giftBox,
    },
    {
      id: 'stickers' as const,
      checked: hasStickersAddon,
      toggle: () => setHasStickersAddon((prev) => !prev),
      icon: Sticker,
      accentClass: 'text-amber-300',
      activeBorderClass: 'bg-amber-950/30 border-amber-400/75 shadow-[0_0_18px_rgba(251,191,36,0.14)]',
      activeCheckClass: 'bg-amber-400 border-amber-300 text-slate-950',
      titleAr: 'شيت 24 ستيكر مخصّص بشخصية طفلك',
      titleEn: '24 Custom Hero Sticker Sheet',
      descAr: 'ملصقات لامعة ومقاومة للماء بشخصية بطلك لدفاتره وأغراضه',
      descEn: 'Glossy character stickers starring your child for notebooks & gear',
      pricing: ADDON_PRICING.stickers,
    },
    {
      id: 'audioStory' as const,
      checked: hasAudioStoryAddon,
      toggle: () => setHasAudioStoryAddon((prev) => !prev),
      icon: QrCode,
      accentClass: 'text-purple-300',
      activeBorderClass:
        'bg-purple-950/45 border-purple-400/80 shadow-[0_0_18px_rgba(167,139,250,0.18)]',
      activeCheckClass: 'bg-purple-400 border-purple-300 text-slate-950',
      titleAr: 'قصة صوتية مروية بكود QR على الغلاف الخلفي',
      titleEn: 'Narrated Audio Story via Back-Cover QR Code',
      descAr: 'يمسح الطفل الكود ليسمع قصته بصوت دافئ وموسيقى قبل النوم',
      descEn: 'Scan the printed back-cover QR code for a cozy narrated bedtime story',
      pricing: ADDON_PRICING.audioStory,
    },
  ];

  const currentSelectionQualifiesForGwp =
    gwpConfig.enabled &&
    gwpConfig.triggerMode !== 'min_books' &&
    (totalEgp >= gwpConfig.minSubtotalEgp ||
      totalSar >= gwpConfig.minSubtotalSar ||
      totalAed >= gwpConfig.minSubtotalAed);

  const gwpMinBooksAr = gwpConfig.minBooks === 2 ? 'كتابين' : `${gwpConfig.minBooks} كتب`;
  const gwpMerchHref = `/merch/${gwpConfig.giftMerchId || 'bub-plush-ball'}`;

  if (isStoryNotFound) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground flex flex-col">
        <ImmersiveBackground />
        <Header />

        <main className="relative z-10 flex-1 flex items-center justify-center px-4 pt-28 pb-20">
          <div className="w-full max-w-xl glass-card rounded-3xl p-7 sm:p-10 border border-white/15 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-400/35 flex items-center justify-center mx-auto">
              <SearchX className="w-8 h-8 text-cyan-300" aria-hidden="true" />
            </div>

            <div className="space-y-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 border border-purple-400/30 text-purple-200">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                {language === 'ar' ? 'مكتبة بابل فيرس' : 'Bubbleverse Story Library'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-editorial text-white">
                {language === 'ar' ? 'عذراً، لم نعثر على هذه القصة' : 'Story Not Found'}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {language === 'ar'
                  ? 'يبدو أن رابط القصة قد تغيّر أو لم تعد متوفرة حالياً. يمكنك استكشاف كل القصص المخصّصة الجاهزة في مكتبتنا!'
                  : 'This story link may be outdated or no longer available. Explore all personalized stories waiting in our catalog!'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                asChild
                className="w-full sm:w-auto min-h-[44px] px-6 font-bold font-display gap-2"
              >
                <Link to="/stories">
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {language === 'ar' ? 'تصفّح مكتبة القصص' : 'Back to Story Catalog'}
                  </span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto min-h-[44px] px-6 font-semibold gap-2"
              >
                <Link to="/">
                  <span>{language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</span>
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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <ImmersiveBackground />

      <Header />

      <main className="relative z-10 pt-24 sm:pt-28 pb-16 lg:pb-20">
        {/* Breadcrumb Navigation */}
        <div className="px-4 bv-container pt-2 pb-5">
          <nav
            aria-label={language === 'ar' ? 'مسار التصفح' : 'Breadcrumb'}
            className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
          >
            <Link to="/" className="hover:text-primary transition-colors">
              {language === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            <ChevronRight className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
            <Link to="/stories" className="hover:text-primary transition-colors">
              {language === 'ar' ? 'مكتبة القصص' : 'Story Catalog'}
            </Link>
            <ChevronRight className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
            <span className="text-foreground font-semibold truncate max-w-xs">
              {localizedTitle}
            </span>
          </nav>
        </div>

        {/* Product Personalization Section (2-Column Grid) */}
        <section className="px-4 bv-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
            {/* Left Column: Live Personalized Preview / Gallery & Keepsake Specs (5 cols) */}
            <div className="lg:col-span-5 w-full max-w-lg mx-auto lg:max-w-none lg:mx-0 space-y-5 lg:sticky lg:top-24">
              {/* Showcase Mode Toggle: Live Personalized Preview vs Photo Gallery */}
              <div
                role="group"
                aria-label={
                  language === 'ar'
                    ? 'التبديل بين المعاينة الحية ومعرض الصور'
                    : 'Switch between Live Personalized Preview and Photo Gallery'
                }
                className="glass-card rounded-2xl p-1.5 border border-white/15 grid grid-cols-2 gap-1.5"
              >
                <button
                  type="button"
                  onClick={() => setShowcaseMode('live')}
                  aria-pressed={showcaseMode === 'live'}
                  className={`min-h-[44px] px-2.5 xl:px-3 rounded-xl text-xs xl:text-sm font-bold flex items-center justify-center gap-1.5 xl:gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    showcaseMode === 'live'
                      ? 'bg-gradient-to-r from-cyan-500/25 via-purple-500/25 to-pink-500/25 text-white border border-cyan-400/50 shadow-[0_0_16px_rgba(0,217,255,0.2)]'
                      : 'text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <Eye className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {language === 'ar' ? 'معاينة حية باسم طفلك' : 'Live Preview'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowcaseMode('gallery')}
                  aria-pressed={showcaseMode === 'gallery'}
                  className={`min-h-[44px] px-2.5 xl:px-3 rounded-xl text-xs xl:text-sm font-bold flex items-center justify-center gap-1.5 xl:gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    showcaseMode === 'gallery'
                      ? 'bg-white/15 text-white border border-white/25'
                      : 'text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <Images className="w-4 h-4 text-purple-300 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {language === 'ar' ? 'معرض الصور' : 'Book Gallery'}
                  </span>
                </button>
              </div>

              {/* Active Showcase Stage */}
              {showcaseMode === 'live' ? (
                <LiveBookPreviewCard
                  coverImage={story.coverImage}
                  storyTitleAr={story.titleAr}
                  storyTitleEn={story.titleEn}
                  childName={childName}
                  coHeroName={hasCoHeroAddon ? coHeroName : undefined}
                  childPhoto={uploadedPhoto}
                  dedicationMessage={hasGiftMessage ? giftMessage : undefined}
                  storyLanguage={storyLanguage}
                  occasionLabelAr={selectedOccasionMeta.labelAr}
                  occasionLabelEn={selectedOccasionMeta.labelEn}
                  format={selectedFormat}
                />
              ) : (
                <TiltBookCard
                  maxTilt={6}
                  scaleOnHover={1.015}
                  glareMaxOpacity={0.2}
                  className="rounded-3xl aspect-square"
                >
                  <div className="relative w-full h-full rounded-3xl overflow-hidden bg-slate-950 border border-white/15 shadow-2xl">
                    {/* 3D Spine Crease */}
                    <div
                      aria-hidden="true"
                      className={`absolute top-0 bottom-0 w-3.5 z-10 pointer-events-none ${
                        isRTL
                          ? 'right-0 bg-gradient-to-l from-black/60 via-black/20 to-transparent'
                          : 'left-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent'
                      }`}
                    />

                    <AnimatePresence mode="wait" initial={false}>
                      <motion.img
                        key={gallery[activeImageIndex]}
                        src={gallery[activeImageIndex]}
                        alt={localizedTitle}
                        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
                        className="w-full h-full object-cover"
                      />
                    </AnimatePresence>
                  </div>
                </TiltBookCard>
              )}

              {/* Spread Preview Trigger */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPreviewOpen(true)}
                className="w-full min-h-[44px] h-11 text-sm font-semibold gap-2"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>
                  {language === 'ar' ? 'تصفّح نموذج من صفحات القصة' : 'Preview Sample Story Pages'}
                </span>
              </Button>

              {/* Thumbnails Row (clicking switches directly to Gallery view on that scene) */}
              <div className="flex gap-3 overflow-x-auto pb-1">
                {gallery.map((img, idx) => (
                  <button
                    key={img + idx}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setShowcaseMode('gallery');
                    }}
                    aria-label={
                      language === 'ar'
                        ? `عرض الصورة رقم ${idx + 1}`
                        : `View image ${idx + 1}`
                    }
                    className={`relative w-16 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      showcaseMode === 'gallery' && activeImageIndex === idx
                        ? 'border-cyan-400 shadow-[0_0_14px_rgba(0,217,255,0.35)] scale-[1.03]'
                        : 'border-white/10 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={
                        language === 'ar'
                          ? `${localizedTitle} - صورة ${idx + 1}`
                          : `${localizedTitle} - image ${idx + 1}`
                      }
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Keepsake Quality Guarantee Card */}
              <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                  <Award className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span>
                    {language === 'ar'
                      ? 'جودة طباعة تعيش معاكم لسنين:'
                      : 'Keepsake Printing Highlights:'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    {language === 'ar' ? 'غلاف مقوى فاخر 21×21 سم' : '21×21 cm Premium Hardcover'}
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    {language === 'ar' ? 'ورق حريري سميك ومريح للعين' : 'Thick Matte Silk Pages'}
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    {language === 'ar' ? 'ألوان زاهية وآمنة للأطفال' : 'Vibrant Child-Safe Inks'}
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    {language === 'ar'
                      ? 'توصيل سريع لمصر والسعودية والإمارات'
                      : 'Fast Egypt, Saudi & UAE Delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Customization Engine & Purchase Funnel (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Title, Rating & Values */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs sm:text-sm font-semibold font-numeric">
                    <Star className="w-5 h-5 fill-amber-300 text-amber-300 shrink-0" />
                    <span>{story.rating.toFixed(1)}</span>
                    <span className="text-slate-400">
                      ({story.reviewsCount} {language === 'ar' ? 'تقييم' : 'reviews'})
                    </span>
                  </div>
                  <span className="text-slate-600" aria-hidden="true">
                    •
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                    {language === 'ar'
                      ? 'مراجعة المسودة قبل الطباعة'
                      : 'Draft review before printing'}
                  </span>
                  {(story.badgeAr || story.badgeEn || story.badge) && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-400/30 text-cyan-200">
                      {language === 'ar'
                        ? story.badgeAr || story.badge
                        : story.badgeEn || story.badge}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold font-editorial text-white leading-tight">
                  {localizedTitle}
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {language === 'ar' ? story.summaryAr : story.summaryEn}
                </p>

                {localizedValuesTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {localizedValuesTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/15 border border-purple-400/25 text-purple-200"
                      >
                        ✦ {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Sibling & Gift Bundle Ribbon + Live Delivery Estimator */}
              <div className="space-y-3">
                {/* Multi-Book Sibling Discount Ribbon */}
                <div className="rounded-2xl px-4 py-3 bg-gradient-to-r from-purple-600/25 via-fuchsia-500/20 to-cyan-500/25 border border-cyan-400/30 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-400/20 border border-cyan-300/35 flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                    {language === 'ar'
                      ? 'اطلب كتابين ووفّر 15% • 3 كتب فأكثر ووفّر 25% + شحن مجاني'
                      : 'Buy 2 Save 15% • Buy 3+ Save 25% + Free Shipping'}
                  </p>
                </div>

                {/* Live Estimated Delivery Date Pill with Country Switcher */}
                <div className="glass-card rounded-2xl px-4 py-3 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <Truck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-emerald-300 block">
                        {language === 'ar' ? 'موعد التسليم المتوقّع' : 'Estimated Delivery'}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-white font-numeric block">
                        {language === 'ar' ? deliveryEstimate.labelAr : deliveryEstimate.labelEn}
                      </span>
                    </div>
                  </div>

                  <div
                    role="group"
                    aria-label={
                      language === 'ar' ? 'اختر دولة التوصيل' : 'Choose delivery destination'
                    }
                    className="flex items-center gap-1.5 shrink-0"
                  >
                    {DELIVERY_COUNTRIES.map((country) => (
                      <button
                        key={country.id}
                        type="button"
                        onClick={() => setDeliveryCountry(country.id)}
                        aria-pressed={deliveryCountry === country.id}
                        className={`min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
              </div>

              {/* 1. Format / Printing Selection */}
              <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-bold font-editorial text-white flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-cyan-400 shrink-0" />
                    <span>
                      {language === 'ar' ? '1. اختاروا نسخة الكتاب' : '1. Choose Your Edition'}
                    </span>
                  </h2>
                  <span className="text-cyan-300 text-xs font-medium">
                    {language === 'ar' ? 'طباعة ملونة فاخرة' : 'Full-color illustration'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option A: Hardcover 15 pages */}
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('hardcover_15')}
                    aria-pressed={selectedFormat === 'hardcover_15'}
                    className={`p-4 rounded-2xl border text-start transition-all cursor-pointer relative flex flex-col justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      selectedFormat === 'hardcover_15'
                        ? 'bg-purple-950/50 border-cyan-400 shadow-[0_0_20px_rgba(0,217,255,0.2)]'
                        : 'bg-slate-950/60 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <span
                      className={`absolute top-2.5 ${
                        isRTL ? 'left-2.5' : 'right-2.5'
                      } px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30`}
                    >
                      {language === 'ar' ? 'الأكثر طلباً' : 'Popular'}
                    </span>
                    <div className="space-y-1 pt-5 xl:pt-1">
                      <p className="text-sm font-bold text-white font-display">
                        {language === 'ar' ? 'كتاب ورقي فاخر' : 'Hardcover Book'}
                      </p>
                      <p className="text-xs text-slate-400 font-numeric">
                        {language === 'ar' ? '15 صفحة مصوّرة' : '15 Illustrated Pages'}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-cyan-300 pt-2 border-t border-white/10 font-numeric">
                      {language === 'ar'
                        ? `${story.priceEgp15Pages} ج.م • ${story.priceSar15Pages} ر.س / ${priceAed15} د.إ`
                        : `${story.priceEgp15Pages} EGP • ${story.priceSar15Pages} SAR / ${priceAed15} AED`}
                    </p>
                  </button>

                  {/* Option B: Hardcover 25 pages */}
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('hardcover_25')}
                    aria-pressed={selectedFormat === 'hardcover_25'}
                    className={`p-4 rounded-2xl border text-start transition-all cursor-pointer relative flex flex-col justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      selectedFormat === 'hardcover_25'
                        ? 'bg-purple-950/50 border-cyan-400 shadow-[0_0_20px_rgba(0,217,255,0.2)]'
                        : 'bg-slate-950/60 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="space-y-1 pt-1">
                      <p className="text-sm font-bold text-white font-display">
                        {language === 'ar' ? 'النسخة المطوّلة' : 'Deluxe Extended'}
                      </p>
                      <p className="text-xs text-slate-400 font-numeric">
                        {language === 'ar' ? '25 صفحة مصوّرة' : '25 Illustrated Pages'}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-cyan-300 pt-2 border-t border-white/10 font-numeric">
                      {language === 'ar'
                        ? `${story.priceEgp25Pages} ج.م • ${story.priceSar25Pages} ر.س / ${priceAed25} د.إ`
                        : `${story.priceEgp25Pages} EGP • ${story.priceSar25Pages} SAR / ${priceAed25} AED`}
                    </p>
                  </button>

                  {/* Option C: Instant Digital Edition */}
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('digital_pdf')}
                    aria-pressed={selectedFormat === 'digital_pdf'}
                    className={`p-4 rounded-2xl border text-start transition-all cursor-pointer relative flex flex-col justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      selectedFormat === 'digital_pdf'
                        ? 'bg-purple-950/50 border-cyan-400 shadow-[0_0_20px_rgba(0,217,255,0.2)]'
                        : 'bg-slate-950/60 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <span
                      className={`absolute top-2.5 ${
                        isRTL ? 'left-2.5' : 'right-2.5'
                      } px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/25 text-purple-200 border border-purple-400/30`}
                    >
                      {language === 'ar' ? 'فوري' : 'Instant'}
                    </span>
                    <div className="space-y-1 pt-5 xl:pt-1">
                      <p className="text-sm font-bold text-white font-display">
                        {language === 'ar' ? 'نسخة رقمية' : 'Digital PDF'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {language === 'ar' ? 'للقراءة والطباعة فوراً' : 'Instant Download'}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-cyan-300 pt-2 border-t border-white/10 font-numeric">
                      {language === 'ar'
                        ? `${story.pricePdfEgp} ج.م • ${story.pricePdfSar} ر.س / ${pricePdfAed} د.إ`
                        : `${story.pricePdfEgp} EGP • ${story.pricePdfSar} SAR / ${pricePdfAed} AED`}
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Photo Upload Dropzone, Guidelines & Zero-Retention Privacy Badge */}
              <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-bold font-editorial text-white flex items-center gap-2">
                    <Upload className="w-6 h-6 text-cyan-400 shrink-0" />
                    <span>
                      {language === 'ar'
                        ? '2. ارفعوا صورة طفلكم (اختياري دلوقتي)'
                        : '2. Upload Your Child’s Photo (Optional)'}
                    </span>
                  </h2>
                  <span className="text-xs text-emerald-300 font-medium font-numeric">
                    {language === 'ar' ? 'خصوصية وأمان 100%' : '100% Private & Safe'}
                  </span>
                </div>

                {/* 3 Quick Guidelines */}
                <div className="grid grid-cols-3 gap-2.5 text-xs text-slate-300 text-center">
                  <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-white/10">
                    <span className="text-emerald-400 block font-bold">
                      {language === 'ar' ? 'إضاءة واضحة' : 'Clear Light'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'ar' ? 'بدون فلاتر' : 'No heavy filters'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-white/10">
                    <span className="text-emerald-400 block font-bold">
                      {language === 'ar' ? 'طفل واحد' : 'Solo Portrait'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'ar' ? 'في وسط الصورة' : 'Centered face'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-white/10">
                    <span className="text-emerald-400 block font-bold">
                      {language === 'ar' ? 'ملامح واضحة' : 'Facing Front'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'ar' ? 'ينظر للأمام' : 'Clear expression'}
                    </span>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />

                {!uploadedPhoto ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoAnalyzing}
                    className="w-full border-2 border-dashed border-white/15 hover:border-cyan-400/60 rounded-2xl p-5 text-center cursor-pointer transition-colors space-y-2 bg-slate-950/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-400 mx-auto flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {photoAnalyzing
                          ? language === 'ar'
                            ? 'جاري فحص وتجهيز الصورة...'
                            : 'Validating & preparing photo...'
                          : language === 'ar'
                            ? 'اضغط هنا عشان تختار صورة طفلك من جهازك'
                            : 'Tap to choose your child’s photo'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {language === 'ar'
                          ? 'صورة واضحة بصيغة JPG أو PNG أو WEBP حتى 10 ميجابايت — أو ابعتها لاحقاً على واتساب'
                          : 'Any clear JPG, PNG, or WEBP up to 10MB — or send later via WhatsApp'}
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/40">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/15 shrink-0">
                        <img
                          src={uploadedPhoto}
                          alt={language === 'ar' ? 'صورة الطفل المرفوعة' : 'Uploaded child portrait'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          {photoAnalyzing
                            ? language === 'ar'
                              ? 'جاري تجهيز الصورة...'
                              : 'Preparing photo...'
                            : language === 'ar'
                            ? 'تم حفظ صورة بطلنا بنجاح'
                            : 'Hero photo ready!'}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          {language === 'ar'
                            ? 'فريقنا هيرسم ملامح طفلك بكل حب في كل مشهد'
                            : 'Our studio artists will illustrate your child across every page'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedPhoto(null);
                        setPhotoError(null);
                      }}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors cursor-pointer"
                      aria-label={language === 'ar' ? 'إزالة الصورة' : 'Remove photo'}
                      title={language === 'ar' ? 'إزالة الصورة' : 'Remove photo'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {photoError && (
                  <p
                    role="alert"
                    className="rounded-xl px-3.5 py-2.5 bg-red-950/45 border border-red-400/40 text-xs text-red-200 flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{photoError}</span>
                  </p>
                )}

                {/* Zero-Retention Photo Privacy Reassurance Badge */}
                <div className="rounded-2xl px-3.5 py-2.5 bg-emerald-950/35 border border-emerald-400/25 flex items-start gap-2.5 text-xs text-emerald-100/95 leading-relaxed">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <p>
                    {language === 'ar'
                      ? 'خصوصيتك أولويتنا: صورة طفلك تُستخدم لرسم قصته فقط، لا تُستخدم في أي إعلانات أبداً، وتُحذف بعد التسليم.'
                      : 'Your privacy comes first: your child’s photo is used solely to illustrate their story, never used in any ads, and deleted after delivery.'}
                  </p>
                </div>
              </div>

              {/* 3. Child Details, Occasion, Co-Hero & Dedication Form */}
              <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-5">
                <h2 className="text-base sm:text-lg font-bold font-editorial text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-400 shrink-0" />
                  <span>
                    {language === 'ar' ? '3. تفاصيل بطل الحكاية' : '3. Little Hero Details'}
                  </span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Child's Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="hero-child-name"
                      className="text-xs font-semibold text-slate-200 block"
                    >
                      {language === 'ar' ? 'اسم الطفل بطل القصة *' : 'Child’s First Name *'}
                    </label>
                    <Input
                      id="hero-child-name"
                      ref={childNameInputRef}
                      required
                      value={childName}
                      onChange={(e) => {
                        setChildName(e.target.value);
                        if (nameError && e.target.value.trim()) setNameError(false);
                      }}
                      aria-invalid={nameError}
                      placeholder={language === 'ar' ? 'مثال: عمر أو ليلى' : 'e.g. Omar or Layla'}
                      className={`bg-slate-950/80 text-white text-sm h-11 rounded-xl ${
                        nameError
                          ? 'border-red-400 focus-visible:ring-red-400'
                          : 'border-white/15'
                      }`}
                    />
                    {nameError && (
                      <p
                        role="alert"
                        className="text-xs text-red-300 flex items-center gap-1.5 pt-0.5"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          {language === 'ar'
                            ? 'من فضلك اكتب اسم بطلنا الصغير عشان نكمّل الطلب.'
                            : 'Please enter your child’s name to continue.'}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Gender Selector */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-200 block">
                      {language === 'ar' ? 'البطل ولد ولا بنت؟' : 'Hero Gender'}
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setChildGender('boy')}
                        aria-pressed={childGender === 'boy'}
                        className={`h-11 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          childGender === 'boy'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                            : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {language === 'ar' ? 'ولد' : 'Boy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setChildGender('girl')}
                        aria-pressed={childGender === 'girl'}
                        className={`h-11 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          childGender === 'girl'
                            ? 'bg-pink-500/20 border-pink-400 text-pink-200'
                            : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {language === 'ar' ? 'بنت' : 'Girl'}
                      </button>
                    </div>
                  </div>

                  {/* Child Age Group */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <span className="text-xs font-semibold text-slate-200 block">
                      {language === 'ar' ? 'عمر الطفل' : 'Child Age Group'}
                    </span>
                    <div className="grid grid-cols-3 gap-2.5 text-xs sm:text-sm">
                      {[
                        { id: '3', labelAr: '2–4 سنوات', labelEn: '2–4 Years' },
                        { id: '6', labelAr: '5–7 سنوات', labelEn: '5–7 Years' },
                        { id: '9', labelAr: '8–10 سنوات', labelEn: '8–10 Years' },
                      ].map((age) => (
                        <button
                          key={age.id}
                          type="button"
                          onClick={() => setChildAge(age.id)}
                          aria-pressed={childAge === age.id}
                          className={`h-11 rounded-xl font-semibold font-numeric border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            childAge === age.id
                              ? 'bg-purple-600/30 border-purple-400 text-white shadow-sm'
                              : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {language === 'ar' ? age.labelAr : age.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Story Language */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <span className="text-xs font-semibold text-slate-200 block">
                      {language === 'ar' ? 'لغة القصة المطبوعة' : 'Storybook Language'}
                    </span>
                    <div className="grid grid-cols-3 gap-2.5 text-xs sm:text-sm">
                      {[
                        { id: 'ar', label: language === 'ar' ? 'العربية' : 'Arabic' },
                        { id: 'en', label: language === 'ar' ? 'الإنجليزية' : 'English' },
                        {
                          id: 'bilingual',
                          label: language === 'ar' ? 'عربي وإنجليزي' : 'Bilingual',
                        },
                      ].map((langOpt) => (
                        <button
                          key={langOpt.id}
                          type="button"
                          onClick={() => {
                            setStoryLanguageTouched(true);
                            setStoryLanguage(langOpt.id as 'ar' | 'en' | 'bilingual');
                          }}
                          aria-pressed={storyLanguage === langOpt.id}
                          className={`h-11 rounded-xl font-semibold border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            storyLanguage === langOpt.id
                              ? 'bg-purple-600/30 border-purple-400 text-white shadow-sm'
                              : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {langOpt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Occasion Selector Pills */}
                  <div className="space-y-2 sm:col-span-2">
                    <span className="text-xs font-semibold text-slate-200 block">
                      {language === 'ar' ? 'مناسبة الهدية' : 'Gift Occasion'}
                    </span>
                    <div
                      role="group"
                      aria-label={language === 'ar' ? 'اختيار مناسبة الهدية' : 'Select gift occasion'}
                      className="flex flex-wrap gap-2"
                    >
                      {OCCASION_OPTIONS.map((occasion) => {
                        const isActive = selectedOccasion === occasion.id;
                        return (
                          <button
                            key={occasion.id}
                            type="button"
                            onClick={() => setSelectedOccasion(occasion.id)}
                            aria-pressed={isActive}
                            className={`min-h-[40px] px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                              isActive
                                ? 'bg-gradient-to-r from-purple-600/40 to-pink-500/35 border-pink-400/70 text-white shadow-sm'
                                : 'bg-slate-950/80 border-white/10 text-slate-300 hover:text-white hover:border-white/25'
                            }`}
                          >
                            {language === 'ar' ? occasion.labelAr : occasion.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Optional Co-Hero (Sibling / Best Friend / Pet) Toggle */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <button
                    type="button"
                    onClick={() => setHasCoHeroAddon((prev) => !prev)}
                    aria-pressed={hasCoHeroAddon}
                    aria-expanded={hasCoHeroAddon}
                    className={`w-full p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      hasCoHeroAddon
                        ? 'bg-fuchsia-950/40 border-fuchsia-400/75 shadow-[0_0_18px_rgba(232,121,249,0.16)]'
                        : 'bg-slate-950/60 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${
                          hasCoHeroAddon
                            ? 'bg-fuchsia-400 border-fuchsia-300 text-slate-950'
                            : 'border-white/20 bg-slate-900'
                        }`}
                      >
                        {hasCoHeroAddon && <Check className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-2">
                          <Users className="w-4 h-4 text-fuchsia-300 shrink-0" aria-hidden="true" />
                          <span>
                            {language === 'ar'
                              ? 'إضافة بطل ثانٍ (أخ / أخت / صديق)'
                              : 'Add a Co-Hero (Sibling / Best Friend / Pet)'}
                          </span>
                          {story.supportsCoHero && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/30">
                              {language === 'ar' ? 'مناسب جداً لهذه القصة' : 'Great for this story'}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          {language === 'ar'
                            ? 'يشارك بطلنا المغامرة ويظهر اسمه مباشرة على الغلاف والإهداء'
                            : 'Joins the adventure and appears live on the cover & dedication page'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-fuchsia-300 shrink-0 font-numeric">
                      {language === 'ar'
                        ? `+${ADDON_PRICING.coHero.egp} ج.م / +${ADDON_PRICING.coHero.sar} ر.س`
                        : `+${ADDON_PRICING.coHero.egp} EGP / +${ADDON_PRICING.coHero.sar} SAR`}
                    </span>
                  </button>

                  {hasCoHeroAddon && (
                    <div className="space-y-1.5 ps-1">
                      <label
                        htmlFor="co-hero-name"
                        className="text-xs font-semibold text-fuchsia-200 block"
                      >
                        {language === 'ar'
                          ? 'اسم البطل الثاني (الأخ / الأخت / الصديق أو الحيوان الأليف)'
                          : 'Co-Hero’s Name (Sibling, Best Friend, or Pet)'}
                      </label>
                      <Input
                        id="co-hero-name"
                        value={coHeroName}
                        onChange={(e) => setCoHeroName(e.target.value)}
                        placeholder={
                          language === 'ar'
                            ? 'مثال: سلمى أو القط لولو'
                            : 'e.g. Salma or Luna the kitten'
                        }
                        className="bg-slate-950/80 border-fuchsia-400/40 text-white text-sm h-11 rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/* Dedication / Gift Message Toggle */}
                <div className="pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setHasGiftMessage((prev) => !prev)}
                    aria-expanded={hasGiftMessage}
                    className="w-full min-h-[44px] flex items-center justify-between gap-3 cursor-pointer py-1.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-pink-400 shrink-0" />
                      <span>
                        {language === 'ar'
                          ? 'إضافة كلمة إهداء خاصة تُطبع في أول صفحة من الكتاب'
                          : 'Add a personal dedication printed on the opening page'}
                      </span>
                    </span>
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${
                        hasGiftMessage
                          ? 'bg-pink-500 border-pink-400 text-white'
                          : 'border-white/20 bg-slate-950'
                      }`}
                    >
                      {hasGiftMessage && <Check className="w-4 h-4" />}
                    </span>
                  </button>

                  {hasGiftMessage && (
                    <div className="mt-3">
                      <Textarea
                        rows={2}
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        aria-label={
                          language === 'ar' ? 'نص الإهداء الخاص' : 'Personal dedication message'
                        }
                        placeholder={
                          language === 'ar'
                            ? 'مثال: إلى بطلنا الغالي عمر بمناسبة عيد ميلاده... بنحبك من كل قلبنا.'
                            : 'e.g. To our brave little hero Omar — always keep dreaming big!'
                        }
                        className="bg-slate-950/80 border-white/15 rounded-xl text-sm text-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 4. High-Margin Ecosystem AOV Add-ons */}
              <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-bold font-editorial text-white flex items-center gap-2">
                    <Gift className="w-6 h-6 text-pink-400 shrink-0" />
                    <span>
                      {language === 'ar'
                        ? '4. اجعل الهدية لا تُنسى (إضافات اختيارية)'
                        : '4. Make the Gift Unforgettable (Optional Add-ons)'}
                    </span>
                  </h2>
                  {selectedAddonsCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/35 font-numeric">
                      {language === 'ar'
                        ? `${selectedAddonsCount} إضافات مفعّلة`
                        : `${selectedAddonsCount} selected`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ecosystemAddons.map((addon) => {
                    const Icon = addon.icon;
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={addon.toggle}
                        aria-pressed={addon.checked}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          addon.checked
                            ? addon.activeBorderClass
                            : 'bg-slate-950/60 border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <Icon className={`w-4 h-4 ${addon.accentClass}`} aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs sm:text-sm font-bold text-white block leading-snug">
                                {language === 'ar' ? addon.titleAr : addon.titleEn}
                              </span>
                              <span className="text-[11px] text-slate-400 block mt-1 leading-relaxed">
                                {language === 'ar' ? addon.descAr : addon.descEn}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${
                              addon.checked
                                ? addon.activeCheckClass
                                : 'border-white/20 bg-slate-900'
                            }`}
                          >
                            {addon.checked && <Check className="w-4 h-4" />}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400">
                            {addon.checked
                              ? language === 'ar'
                                ? 'تمت الإضافة'
                                : 'Added'
                              : language === 'ar'
                              ? 'اضغط للإضافة'
                              : 'Tap to add'}
                          </span>
                          <span className="text-xs font-extrabold text-cyan-300 font-numeric">
                            {language === 'ar'
                              ? `+${addon.pricing.egp} ج.م • +${addon.pricing.sar} ر.س / د.إ`
                              : `+${addon.pricing.egp} EGP • +${addon.pricing.sar} SAR / AED`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Free Bub Plush Ball GWP Callout Banner (live-synced via bubbleverse:gwp-updated) */}
              {gwpConfig.enabled && (
                <div className="relative overflow-hidden rounded-3xl p-4 sm:p-5 border border-cyan-400/40 bg-gradient-to-br from-purple-950/75 via-slate-950/90 to-cyan-950/65 shadow-[0_12px_36px_rgba(0,217,255,0.14)]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Link
                      to={gwpMerchHref}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-cyan-300/45 bg-slate-900 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <img
                        src={gwpConfig.coverImage || '/artwork/merch-plush.webp'}
                        alt={
                          language === 'ar'
                            ? 'كورة Bub القطيفة المتلألئة — هدية مجانية'
                            : 'Official Bub Iridescent Plush Ball — Free Gift'
                        }
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute top-1.5 start-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950 shadow-md">
                        {language === 'ar' ? 'مجانية' : 'FREE'}
                      </span>
                    </Link>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-cyan-400/20 to-pink-400/20 border border-cyan-300/40 text-cyan-200">
                          <Gift className="w-3.5 h-3.5 text-pink-300 shrink-0" aria-hidden="true" />
                          <span>
                            {language === 'ar'
                              ? 'هدية مجانية مع قصتك!'
                              : 'FREE Gift With Your Story!'}
                          </span>
                        </span>

                        {currentSelectionQualifiesForGwp && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>
                              {language === 'ar'
                                ? 'اختيارك الحالي مؤهّل الآن!'
                                : 'Your selection qualifies!'}
                            </span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-white font-semibold leading-relaxed">
                        {language === 'ar'
                          ? `هدية مجانية مع قصتك! اطلب النسخة الفاخرة (25 صفحة) أو ${gwpMinBooksAr} واحصل على كورة Bub القطيفة المتلألئة مجاناً (بقيمة ${gwpConfig.retailValueEgp} ج.م / ${gwpConfig.retailValueSar} ر.س / ${gwpConfig.retailValueAed} د.إ)!`
                          : `Order the Deluxe Edition (25 pages) or ${gwpConfig.minBooks} books and receive the Official Bub Iridescent Plush Ball FREE (worth ${gwpConfig.retailValueEgp} EGP / ${gwpConfig.retailValueSar} SAR / ${gwpConfig.retailValueAed} AED)!`}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <span className="text-[11px] text-slate-300">
                          {language === 'ar'
                            ? 'تُضاف تلقائياً في السلة عند استيفاء الشرط'
                            : 'Automatically unlocked in your cart when eligible'}
                        </span>
                        <Link
                          to={gwpMerchHref}
                          className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-cyan-400/20 border border-white/15 hover:border-cyan-300/50 text-cyan-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <span>
                            {language === 'ar' ? 'تعرّف على كورة Bub' : 'Explore Bub Plush Ball'}
                          </span>
                          <ArrowRight
                            className={`w-3.5 h-3.5 shrink-0 ${isRTL ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Pricing Summary & Action Buttons */}
              <div className="glass-card rounded-3xl p-5 sm:p-6 border border-purple-400/30 shadow-2xl space-y-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-400 block">
                      {language === 'ar' ? 'الإجمالي الكلّي:' : 'Total Price:'}
                    </span>
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 font-numeric mt-0.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white">
                        {language === 'ar' ? `${totalEgp} ج.م` : `${totalEgp} EGP`}
                      </span>
                      <span className="text-sm font-semibold text-cyan-300">
                        {language === 'ar'
                          ? `• ${totalSar} ر.س • ${totalAed} د.إ`
                          : `• ${totalSar} SAR • ${totalAed} AED`}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-emerald-300 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/25">
                    {language === 'ar' ? 'طلب فوري بدون حساب' : 'Instant Guest Checkout'}
                  </span>
                </div>

                {/* Primary CTA Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddToCart}
                    className="w-full min-h-[44px] xl:min-h-[48px] h-11 xl:h-12 px-4 xl:px-6 text-xs md:text-sm xl:text-base font-bold font-display gap-2"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>{language === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleBuyNow}
                    className="w-full min-h-[44px] xl:min-h-[48px] h-11 xl:h-12 px-4 xl:px-6 text-xs md:text-sm xl:text-base font-bold font-display gap-2"
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>{language === 'ar' ? 'اطلب الآن' : 'Order Now'}</span>
                  </Button>
                </div>

                {/* WhatsApp Quick Inquiry */}
                <Button
                  type="button"
                  variant="emerald"
                  onClick={openWhatsAppInquiry}
                  className="w-full min-h-[44px] h-auto py-2.5 px-4 whitespace-normal text-center leading-snug text-xs sm:text-sm font-semibold gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-white shrink-0" />
                  <span>
                    {language === 'ar'
                      ? 'عندك استفسار؟ تواصل معنا على واتساب'
                      : 'Questions? Chat with us on WhatsApp'}
                  </span>
                </Button>
              </div>

              {/* Trust Reassurance Row */}
              <div className="flex flex-wrap items-center justify-around gap-4 text-xs sm:text-sm text-slate-300 pt-1">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                  {language === 'ar'
                    ? 'دفع آمن عبر إنستاباي، فودافون كاش، مدى وأبل باي'
                    : 'Trusted local payments across Egypt, Saudi & UAE'}
                </span>
                <span className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-400 shrink-0" />
                  {language === 'ar'
                    ? 'بتراجع المسودة كاملة قبل الطباعة'
                    : 'Full draft review before printing'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Spread Preview Modal */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl bg-slate-900 border-white/15 rounded-3xl text-white p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-bold font-editorial text-white">
                {language === 'ar' ? `نموذج صفحات: ${story.titleAr}` : `Preview: ${story.titleEn}`}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-slate-400">
                {language === 'ar'
                  ? 'نظرة سريعة على صفحات القصة المزدوجة بمقاس 21×21 سم مع الرسومات والنص المخصّص.'
                  : 'Take a peek inside our 21×21 cm illustrated spreads with personalized artwork.'}
              </DialogDescription>
            </DialogHeader>

            {story.sampleSpreads && story.sampleSpreads.length > 0 && (
              <div className="space-y-4 my-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-white/10">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-white/10">
                    <img
                      src={story.sampleSpreads[activeSpreadIndex]?.imageUrl || '/placeholder.svg'}
                      alt={
                        language === 'ar'
                          ? `مشهد من قصة ${story.titleAr}`
                          : `Sample scene from ${story.titleEn}`
                      }
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center p-4 space-y-3 bg-slate-900/70 rounded-2xl border border-white/10">
                    <span className="text-xs font-bold text-cyan-400 font-numeric">
                      {language === 'ar'
                        ? `الصفحة ${story.sampleSpreads[activeSpreadIndex]?.pageNumber}`
                        : `Page ${story.sampleSpreads[activeSpreadIndex]?.pageNumber}`}
                    </span>
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-editorial">
                      &ldquo;
                      {language === 'ar'
                        ? story.sampleSpreads[activeSpreadIndex]?.textAr
                        : story.sampleSpreads[activeSpreadIndex]?.textEn}
                      &rdquo;
                    </p>
                  </div>
                </div>

                {/* Spreads pagination */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
                  <div className="flex gap-2 font-numeric">
                    {story.sampleSpreads.map((sp, idx) => (
                      <button
                        key={sp.pageNumber}
                        type="button"
                        onClick={() => setActiveSpreadIndex(idx)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                          activeSpreadIndex === idx
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {language === 'ar' ? `المشهد ${idx + 1}` : `Scene ${idx + 1}`}
                      </button>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      setIsPreviewOpen(false);
                      handleAddToCart();
                    }}
                    className="bubble-btn bubble-btn-primary h-10 px-5 text-xs sm:text-sm font-bold gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{language === 'ar' ? 'أضف القصة للسلة' : 'Add This Story'}</span>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <div className="relative z-10 pb-20 lg:pb-0">
        <Footer />
      </div>

      {/* Mobile & Tablet Sticky Buy Bar */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 pb-safe bg-slate-950/90 backdrop-blur-xl border-t border-white/15 shadow-[0_-10px_35px_rgba(0,0,0,0.45)]"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="bv-container px-4 pt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 block truncate">
              {selectedFormatShortLabel}
            </span>
            <div className="flex flex-wrap items-baseline gap-x-1.5 font-numeric">
              <span className="text-lg font-extrabold text-white">
                {language === 'ar' ? `${totalEgp} ج.م` : `${totalEgp} EGP`}
              </span>
              <span className="text-xs font-semibold text-cyan-300">
                {language === 'ar'
                  ? `• ${totalSar} ر.س • ${totalAed} د.إ`
                  : `• ${totalSar} SAR • ${totalAed} AED`}
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleBuyNow}
            className="h-12 px-6 bubble-btn bubble-btn-primary text-sm font-bold shrink-0 gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>{language === 'ar' ? 'اطلب الآن' : 'Order Now'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
