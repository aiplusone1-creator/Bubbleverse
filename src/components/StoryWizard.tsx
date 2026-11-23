import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Wand2,
  PenLine,
  CreditCard,
  ShoppingBag,
  Sparkles,
  BookOpen,
  FileText,
  Palette,
  Gift,
  Check,
  Image as ImageIcon,
  Globe,
  Sticker,
  QrCode,
  Languages,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { getStoreConfig } from '@/lib/localStore';
import {
  ADDON_PRICING,
  calculateAddonTotal,
  deriveAedFromSar,
  type AddonFlags,
  type StoryOccasion,
} from '@/features/commerce/pricingEngine';
import GlassCard from './GlassCard';
import BubbleButton from './BubbleButton';
import StoryLengthSelector from './StoryLengthSelector';
import FormatSelector from './FormatSelector';
import ArtStyleSelector from './ArtStyleSelector';
import InquiryCharacters from './InquiryCharacters';
import InterestsInput from './InterestsInput';
import CustomPlotInput from './CustomPlotInput';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { StoryInquiryDetail } from '@/features/orders/orderService';
import type { Character, StoryConfig } from '@/features/stories/types';
import type { CartItem } from '@/types/cart';

interface StoryWizardProps {
  onBack: () => void;
  correction?: StoryInquiryDetail;
  onCorrected?: (detail: StoryInquiryDetail) => void;
}

type BookTier = 'hardcover_15' | 'hardcover_25' | 'digital_pdf';
type WizardOccasionId = Exclude<StoryOccasion, 'bedtime_values'>;

// Static artwork cover ONLY — child photos must NEVER be stored in coverImage
const STATIC_CUSTOM_STORY_COVER = '/placeholder.svg';
const THUMBNAIL_MAX_DIM = 480;
const THUMBNAIL_JPEG_QUALITY = 0.78;

const OCCASION_OPTIONS: readonly {
  id: WizardOccasionId;
  labelAr: string;
  labelEn: string;
}[] = [
  { id: 'birthday', labelAr: 'عيد ميلاد', labelEn: 'Birthday' },
  { id: 'ramadan_eid', labelAr: 'رمضان / العيد', labelEn: 'Ramadan & Eid' },
  { id: 'siblings', labelAr: 'هدية إخوة', labelEn: 'Siblings' },
  { id: 'graduation', labelAr: 'تخرج', labelEn: 'Graduation' },
  { id: 'everyday', labelAr: 'هدية يومية', labelEn: 'Everyday Gift' },
] as const;

const STORY_LANGUAGE_OPTIONS: readonly {
  id: 'ar' | 'en' | 'bilingual';
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
}[] = [
  {
    id: 'ar',
    labelAr: 'العربية',
    labelEn: 'Arabic',
    descAr: 'نص عربي مشكّل وسلس للأطفال',
    descEn: 'Warm, kid-friendly Arabic storytelling',
  },
  {
    id: 'en',
    labelAr: 'الإنجليزية',
    labelEn: 'English',
    descAr: 'قصة إنجليزية ممتعة وسهلة القراءة',
    descEn: 'Engaging, read-aloud English edition',
  },
  {
    id: 'bilingual',
    labelAr: 'عربي وإنجليزي',
    labelEn: 'Bilingual (AR + EN)',
    descAr: 'اللغتان معاً في كل صفحة لتنمية لغة طفلك',
    descEn: 'Both Arabic & English side-by-side on every spread',
  },
] as const;

function compressDataUrlToThumbnail(
  sourceDataUrl: string,
  maxDim = THUMBNAIL_MAX_DIM,
  quality = THUMBNAIL_JPEG_QUALITY
): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (!sourceDataUrl || !sourceDataUrl.startsWith('data:image/')) {
      resolve(undefined);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (!width || !height) {
          resolve(undefined);
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
          resolve(undefined);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(undefined);
      }
    };
    img.onerror = () => resolve(undefined);
    img.src = sourceDataUrl;
  });
}

const TIER_PRICING: Record<
  BookTier,
  {
    format: 'hardcover_book' | 'digital_pdf';
    pagesCount: number;
    priceEgp: number;
    priceSar: number;
    priceAed: number;
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    badgeAr?: string;
    badgeEn?: string;
  }
> = {
  hardcover_15: {
    format: 'hardcover_book',
    pagesCount: 15,
    priceEgp: 500,
    priceSar: 110,
    priceAed: deriveAedFromSar(110),
    titleAr: 'كتاب مطبوع بغلاف فاخر (15 صفحة)',
    titleEn: 'Hardcover Keepsake (15 Pages)',
    descAr: 'طباعة ملونة مقاس 21×21 سم مع مراجعة المسودة قبل الطباعة',
    descEn: 'Premium 21×21 cm hardcover with full draft review before printing',
    badgeAr: 'الأكثر طلباً',
    badgeEn: 'Most Popular',
  },
  hardcover_25: {
    format: 'hardcover_book',
    pagesCount: 25,
    priceEgp: 750,
    priceSar: 165,
    priceAed: deriveAedFromSar(165),
    titleAr: 'النسخة المطوّلة المطبوعة (25 صفحة)',
    titleEn: 'Deluxe Hardcover Edition (25 Pages)',
    descAr: 'مغامرة أطول ومشاهد أغنى في 25 صفحة ملونة فاخرة',
    descEn: 'Extended adventure across 25 richly illustrated pages',
    badgeAr: 'قيمة مضاعفة',
    badgeEn: 'Best Value',
  },
  digital_pdf: {
    format: 'digital_pdf',
    pagesCount: 15,
    priceEgp: 250,
    priceSar: 59,
    priceAed: deriveAedFromSar(59),
    titleAr: 'نسخة رقمية فاخرة فورية',
    titleEn: 'High-Resolution Digital PDF',
    descAr: 'ملف جاهز للقراءة على الأجهزة والطباعة بجودة فائقة',
    descEn: 'Print-ready digital edition delivered straight to you',
  },
};

const steps = [
  { id: 1, titleKey: 'step1Title', descKey: 'step1Desc' },
  { id: 2, titleKey: 'step2Title', descKey: 'step2Desc' },
  { id: 3, titleKey: 'step3Title', descKey: 'step3Desc' },
  { id: 4, titleKey: 'step4Title', descKey: 'step4Desc' },
];

const StoryWizard = ({ onBack }: StoryWizardProps) => {
  const { toast } = useToast();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { addItem, openCheckout, openCart, totalItems } = useCart();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const stepHeading = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<BookTier>('hardcover_15');
  const [hasColoringAddon, setHasColoringAddon] = useState(false);
  const [hasGiftBoxAddon, setHasGiftBoxAddon] = useState(false);
  const [hasStickersAddon, setHasStickersAddon] = useState(false);
  const [hasAudioStoryAddon, setHasAudioStoryAddon] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<WizardOccasionId>('birthday');
  const [childGender, setChildGender] = useState<'boy' | 'girl'>('boy');
  const [childAge, setChildAge] = useState('5');
  const [giftMessage, setGiftMessage] = useState('');
  const [compressedHeroPhoto, setCompressedHeroPhoto] = useState<string | undefined>(undefined);

  const [config, setConfig] = useState<StoryConfig>({
    storyLength: 'medium',
    format: 'storyboard',
    artStyle: 'disney',
    customArtStyle: '',
    language: language === 'ar' ? 'ar' : 'en',
    characters: [
      {
        id: 'hero-initial',
        name: '',
        role: 'hero',
      },
    ],
    interests: [],
    plotMode: 'auto',
    customPlot: '',
  });
  const [customInterest, setCustomInterest] = useState('');

  useEffect(() => {
    stepHeading.current?.focus({ preventScroll: true });
  }, [currentStep]);

  const validateStep = (step: number): string[] => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (config.language !== 'ar' && config.language !== 'en' && config.language !== 'bilingual') {
          errors.push('validationLanguage');
        }
        if (config.artStyle === 'custom' && !config.customArtStyle.trim()) {
          errors.push('validationArtStyle');
        }
        break;
      case 2: {
        const heroCharacters = config.characters.filter((c) => c.role === 'hero');
        if (heroCharacters.length === 0) {
          errors.push('validationHero');
        }
        const unnamedCharacters = config.characters.filter((c) => !c.name.trim());
        if (unnamedCharacters.length > 0) {
          errors.push('validationCharacterName');
        }
        break;
      }
      case 3:
        if (config.interests.length > 10) {
          errors.push('inquiryInterestLimit');
        }
        if (config.plotMode === 'manual' && !config.customPlot.trim()) {
          errors.push('validationPlot');
        }
        break;
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      toast({
        title: t('validationTitle'),
        description: t(errors[0]),
        variant: 'destructive',
      });
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    } else if (stepId > currentStep) {
      for (let i = currentStep; i < stepId; i++) {
        const errors = validateStep(i);
        if (errors.length > 0) {
          toast({
            title: t('validationTitle'),
            description: t(errors[0]),
            variant: 'destructive',
          });
          return;
        }
      }
      setCurrentStep(stepId);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleToggleInterest = (interest: string) => {
    setConfig((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleAddCustomInterest = () => {
    if (customInterest.trim() && !config.interests.includes(customInterest.trim())) {
      setConfig((prev) => ({
        ...prev,
        interests: [...prev.interests, customInterest.trim()],
      }));
      setCustomInterest('');
    }
  };

  const handleAddCharacter = (character: Character) => {
    setConfig((prev) => ({
      ...prev,
      characters: [...prev.characters, character],
    }));
  };

  const handleRemoveCharacter = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      characters: prev.characters.filter((c) => c.id !== id),
    }));
  };

  const handleUpdateCharacter = (id: string, updates: Partial<Character>) => {
    setConfig((prev) => ({
      ...prev,
      characters: prev.characters.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const heroCharacter = config.characters.find((c) => c.role === 'hero') || config.characters[0];
  const heroName = heroCharacter?.name.trim() || (language === 'ar' ? 'البطل الصغير' : 'Little Hero');
  const heroPhoto = config.characters.find((c) => c.imageUrl)?.imageUrl;

  // Compress uploaded child photo into a quota-safe thumbnail (max 480px JPEG) for photoPreview ONLY
  useEffect(() => {
    let cancelled = false;
    if (!heroPhoto) {
      setCompressedHeroPhoto(undefined);
      return;
    }
    void compressDataUrlToThumbnail(heroPhoto).then((thumbnail) => {
      if (!cancelled) {
        setCompressedHeroPhoto(thumbnail);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [heroPhoto]);

  const tierInfo = TIER_PRICING[selectedTier];
  const storeConfig = getStoreConfig();
  const depositPercent = storeConfig.depositPercentage || 50;
  const depositRatio = depositPercent / 100;

  const addonFlags: AddonFlags = useMemo(
    () => ({
      hasColoringBookAddon: hasColoringAddon,
      hasGiftBoxAddon,
      hasStickersAddon,
      hasAudioStoryAddon,
    }),
    [hasColoringAddon, hasGiftBoxAddon, hasStickersAddon, hasAudioStoryAddon]
  );

  const addonTotalEgp = calculateAddonTotal(addonFlags, 'EG');
  const addonTotalSar = calculateAddonTotal(addonFlags, 'SA');
  const addonTotalAed = calculateAddonTotal(addonFlags, 'AE');

  const totalEgp = tierInfo.priceEgp + addonTotalEgp;
  const totalSar = tierInfo.priceSar + addonTotalSar;
  const totalAed = tierInfo.priceAed + addonTotalAed;
  const depositEgp = Math.round(totalEgp * depositRatio);
  const depositSar = Math.round(totalSar * depositRatio);
  const depositAed = Math.round(totalAed * depositRatio);

  const selectedAddonsCount = [
    hasColoringAddon,
    hasGiftBoxAddon,
    hasStickersAddon,
    hasAudioStoryAddon,
  ].filter(Boolean).length;

  const companionAddons = [
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
      descAr: 'رسومات خطية عالية الجودة لشخصية طفلك عشان يلوّنها بنفسه',
      descEn: 'Matching line-art illustrations of your child to color at home',
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

  const resolveStoryLanguageLabel = () => {
    if (config.language === 'bilingual') {
      return language === 'ar' ? 'عربي وإنجليزي' : 'Bilingual (AR + EN)';
    }
    return t(config.language === 'ar' ? 'inquiryArabic' : 'inquiryEnglish');
  };

  const buildCartPayload = (safePhotoThumbnail?: string): Omit<CartItem, 'id' | 'createdAt'> => {
    const companions = config.characters
      .filter((c) => c.role !== 'hero' && c.name.trim())
      .map((c) => c.name.trim());
    const styleName =
      config.artStyle === 'custom'
        ? config.customArtStyle
        : t('inquiryOption_' + config.artStyle);
    const summaryBits = (
      language === 'ar'
        ? [
            `أسلوب الرسم: ${styleName}`,
            companions.length > 0 ? `الأبطال المرافقون: ${companions.join('، ')}` : '',
            config.interests.length > 0 ? `الاهتمامات: ${config.interests.join('، ')}` : '',
            config.plotMode === 'manual' && config.customPlot.trim()
              ? `فكرة الحكاية: ${config.customPlot.trim()}`
              : '',
            giftMessage.trim() ? `إهداء: ${giftMessage.trim()}` : '',
          ]
        : [
            `Art Style: ${styleName}`,
            companions.length > 0 ? `Companions: ${companions.join(', ')}` : '',
            config.interests.length > 0 ? `Interests: ${config.interests.join(', ')}` : '',
            config.plotMode === 'manual' && config.customPlot.trim()
              ? `Story Idea: ${config.customPlot.trim()}`
              : '',
            giftMessage.trim() ? `Dedication: ${giftMessage.trim()}` : '',
          ]
    )
      .filter(Boolean)
      .join(' | ');

    const normalizedStoryLanguage: 'ar' | 'en' | 'bilingual' =
      config.language === 'bilingual'
        ? 'bilingual'
        : config.language === 'en'
          ? 'en'
          : 'ar';

    return {
      itemType: 'book',
      storyId: 'custom-wizard-story',
      titleAr: `قصة مخصّصة من الصفر: مغامرة ${heroName}`,
      titleEn: `Custom Bespoke Story: ${heroName}'s Adventure`,
      // CRITICAL PRIVACY GUARD: Always use static artwork cover — NEVER store raw child photos in coverImage!
      coverImage: STATIC_CUSTOM_STORY_COVER,
      format: tierInfo.format,
      formatLabelAr: tierInfo.titleAr,
      formatLabelEn: tierInfo.titleEn,
      pagesCount: tierInfo.pagesCount,
      priceEgp: tierInfo.priceEgp,
      priceSar: tierInfo.priceSar,
      priceAed: tierInfo.priceAed,
      quantity: 1,
      childName: heroName,
      childGender,
      childAge: childAge || '5',
      storyLanguage: normalizedStoryLanguage,
      giftMessage: summaryBits || undefined,
      // Compressed thumbnail only -> GuestCheckoutModal vaults into IndexedDB photoVault and strips before localStorage
      photoPreview: safePhotoThumbnail,
      hasColoringBookAddon: hasColoringAddon,
      hasGiftBoxAddon,
      hasStickersAddon,
      hasAudioStoryAddon,
      occasion: selectedOccasion,
    };
  };

  const resolveSafePhotoThumbnail = async (): Promise<string | undefined> => {
    if (!heroPhoto) return undefined;
    if (compressedHeroPhoto) return compressedHeroPhoto;
    return compressDataUrlToThumbnail(heroPhoto);
  };

  const handleAddToCart = async () => {
    const errors = [1, 2, 3].flatMap(validateStep);
    if (errors.length > 0) {
      toast({
        title: t('validationTitle'),
        description: t(errors[0]),
        variant: 'destructive',
      });
      return;
    }
    const safeThumbnail = await resolveSafePhotoThumbnail();
    addItem(buildCartPayload(safeThumbnail));
    toast({
      title: language === 'ar' ? 'تمت الإضافة للسلة بنجاح' : 'Added to Your Cart',
      description:
        language === 'ar'
          ? 'حفظنا قصتك المخصّصة وصورة بطلنا الصغير في السلة.'
          : 'Your custom story and child photo are safely saved in your cart.',
    });
  };

  const handleInstantGuestCheckout = async () => {
    const errors = [1, 2, 3].flatMap(validateStep);
    if (errors.length > 0) {
      toast({
        title: t('validationTitle'),
        description: t(errors[0]),
        variant: 'destructive',
      });
      return;
    }
    const safeThumbnail = await resolveSafePhotoThumbnail();
    const payload = buildCartPayload(safeThumbnail);
    const directItem: CartItem = {
      ...payload,
      id: `custom-wizard-${Date.now()}`,
      createdAt: Date.now(),
    };
    openCheckout(directItem);
  };

  return (
    <section className="min-h-screen pt-4 sm:pt-6 pb-20 px-3 sm:px-4">
      {/* Accessible Wizard Top Navigation Bar (Audit Fix #7) */}
      <header
        aria-label={language === 'ar' ? 'شريط التنقل داخل صانع القصة' : 'Story Wizard Navigation'}
        className="sticky top-3 z-30 bv-container-narrow mb-6 sm:mb-8"
      >
        <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 py-2 sm:px-4 rounded-2xl bg-slate-950/75 backdrop-blur-xl border border-white/12 shadow-[0_10px_30px_rgba(4,9,24,0.45)]">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="min-h-[44px] px-3 sm:px-4 rounded-xl bg-white/5 hover:bg-primary/15 border border-white/10 hover:border-primary/40 text-foreground text-xs sm:text-sm font-bold inline-flex items-center gap-2 touch-manipulation"
          >
            <ArrowLeft className={`w-4 h-4 text-cyan-300 shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
            <span>{language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</span>
          </Button>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 font-numeric">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
            <span>
              {language === 'ar'
                ? `صانع القصة • الخطوة ${currentStep} من ${steps.length}`
                : `Story Creator • Step ${currentStep} of ${steps.length}`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="min-h-[44px] px-3 rounded-xl bg-white/5 hover:bg-primary/15 border border-white/10 hover:border-primary/40 text-foreground/90 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 touch-manipulation"
              aria-label={
                language === 'en' ? 'Switch language to Arabic' : 'تغيير اللغة إلى الإنجليزية'
              }
            >
              <Globe className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </Button>

            <div className="relative inline-flex">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={openCart}
                className="h-11 w-11 rounded-xl bg-white/5 hover:bg-primary/15 border border-white/10 hover:border-primary/40 text-primary touch-manipulation"
                title={language === 'ar' ? 'سلة القصص' : 'Shopping Cart'}
                aria-label={
                  language === 'ar'
                    ? `سلة القصص (${totalItems})`
                    : `Shopping Cart (${totalItems})`
                }
              >
                <ShoppingBag className="w-4 h-4 text-primary" aria-hidden="true" />
              </Button>
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key="wizard-cart-badge"
                    aria-hidden="true"
                    initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 420, damping: 24 }
                    }
                    className="pointer-events-none absolute -top-1.5 -end-1.5 z-20 min-w-5 h-5 px-1 rounded-full bg-gradient-to-r from-[#F472B6] to-purple-600 text-[11px] leading-none font-bold font-numeric text-white flex items-center justify-center shadow-[0_4px_14px_rgba(244,114,182,0.55)] ring-2 ring-background/90 border border-white/30"
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <div className="bv-container-narrow">
        {/* Progress Steps */}
        <motion.div
          className="flex justify-between mb-6 sm:mb-12 relative px-2"
          initial={shouldReduceMotion ? false : { opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
        >
          <div className="absolute top-5 left-4 right-4 h-0.5 bg-white/10" />
          <motion.div
            className={`absolute top-5 ${isRTL ? 'right-4' : 'left-4'} h-0.5 bg-primary`}
            initial={{ width: '0%' }}
            animate={{ width: `calc((100% - 2rem) * ${(currentStep - 1) / (steps.length - 1)})` }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.45 }}
          />

          {steps.map((step) => {
            const isCurrent = currentStep === step.id;
            return (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <motion.button
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  aria-label={`${t('step')} ${step.id}: ${t(step.titleKey)}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-bold font-numeric transition-all duration-300 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    currentStep >= step.id
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : 'bg-slate-900 border border-white/15 text-muted-foreground hover:text-white'
                  }`}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                >
                  {step.id}
                </motion.button>
                <span
                  className={`mt-2.5 text-xs sm:text-sm font-semibold hidden sm:block ${
                    currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t(step.titleKey)}
                </span>
                <span className="text-xs text-muted-foreground hidden md:block">
                  {t(step.descKey)}
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* Mobile active step indicator */}
        <div ref={stepHeading} tabIndex={-1} className="sm:sr-only text-center mb-6">
          <p className="text-sm font-semibold text-foreground font-numeric">
            {t('step')} {currentStep} {t('of')} {steps.length}: {t(steps[currentStep - 1].titleKey)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(steps[currentStep - 1].descKey)}
          </p>
        </div>

        {/* Step Content */}
        <GlassCard className="mb-8 rounded-3xl p-5 sm:p-8 border border-white/10">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? 16 : -16 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
                className="space-y-8"
              >
                {/* Storybook Language Selector (AR / EN / Bilingual) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Languages className="w-5 h-5 text-cyan-400 shrink-0" aria-hidden="true" />
                    <span className="text-lg sm:text-xl font-bold font-editorial text-foreground">
                      {language === 'ar' ? 'لغة القصة المطبوعة' : 'Storybook Language'}
                    </span>
                  </div>
                  <div
                    role="group"
                    aria-label={language === 'ar' ? 'اختر لغة القصة' : 'Choose storybook language'}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {STORY_LANGUAGE_OPTIONS.map((opt) => {
                      const active = config.language === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, language: opt.id }))}
                          aria-pressed={active}
                          className={`min-h-[44px] p-3.5 rounded-2xl border text-start transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            active
                              ? 'bg-purple-950/50 border-cyan-400 shadow-[0_0_18px_rgba(0,217,255,0.2)]'
                              : 'bg-slate-950/60 border-white/10 hover:border-white/25'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-white">
                              {language === 'ar' ? opt.labelAr : opt.labelEn}
                            </span>
                            {opt.id === 'bilingual' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                                {language === 'ar' ? 'ثنائي اللغة' : 'AR + EN'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {language === 'ar' ? opt.descAr : opt.descEn}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <StoryLengthSelector
                  value={config.storyLength}
                  onChange={(v) => setConfig((prev) => ({ ...prev, storyLength: v }))}
                />
                <FormatSelector
                  value={config.format}
                  onChange={(v) => setConfig((prev) => ({ ...prev, format: v }))}
                />
                <ArtStyleSelector
                  value={config.artStyle}
                  customStyle={config.customArtStyle}
                  onChange={(v) => setConfig((prev) => ({ ...prev, artStyle: v }))}
                  onCustomStyleChange={(v) => setConfig((prev) => ({ ...prev, customArtStyle: v }))}
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? 16 : -16 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
              >
                <InquiryCharacters
                  characters={config.characters}
                  onAddCharacter={handleAddCharacter}
                  onRemoveCharacter={handleRemoveCharacter}
                  onUpdateCharacter={handleUpdateCharacter}
                />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? 16 : -16 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
                className="space-y-8"
              >
                <InterestsInput
                  selectedInterests={config.interests}
                  customInterest={customInterest}
                  onToggleInterest={handleToggleInterest}
                  onCustomInterestChange={setCustomInterest}
                  onAddCustomInterest={handleAddCustomInterest}
                />

                {/* Plot Mode Toggle */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold font-editorial text-foreground">
                    {t('plotCreation')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, plotMode: 'auto' }))}
                      className={`p-5 rounded-2xl transition-all cursor-pointer text-center space-y-2 border ${
                        config.plotMode === 'auto'
                          ? 'bg-primary/15 border-primary shadow-md'
                          : 'bg-slate-950/60 border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-400 mx-auto flex items-center justify-center">
                        <Wand2 className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-sm sm:text-base text-foreground">
                        {t('inquiryTeamPlot')}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {t('inquiryTeamPlotDesc')}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, plotMode: 'manual' }))}
                      className={`p-5 rounded-2xl transition-all cursor-pointer text-center space-y-2 border ${
                        config.plotMode === 'manual'
                          ? 'bg-secondary/15 border-secondary shadow-md'
                          : 'bg-slate-950/60 border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-pink-500/15 text-pink-400 mx-auto flex items-center justify-center">
                        <PenLine className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-sm sm:text-base text-foreground">
                        {t('customPlot')}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {t('customPlotDesc')}
                      </p>
                    </button>
                  </div>

                  {config.plotMode === 'manual' && (
                    <CustomPlotInput
                      value={config.customPlot}
                      onChange={(v) => setConfig((prev) => ({ ...prev, customPlot: v }))}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? 16 : -16 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
                className="space-y-6 py-1"
              >
                <div className="space-y-1.5">
                  <h3 className="font-editorial text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
                    <BookOpen className="w-6 h-6 text-cyan-400 shrink-0" />
                    <span>
                      {language === 'ar'
                        ? 'راجع قصتكم واختار النسخة المناسبة'
                        : 'Review Your Custom Story & Edition'}
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {language === 'ar'
                      ? 'اطلب قصتك فوراً بدون تسجيل حساب، وبنراجع معاك المسودة كاملة وتوافق عليها قبل الطباعة.'
                      : 'Complete your order instantly as a guest — no account needed. You review and approve the full draft before we print.'}
                  </p>
                </div>

                {/* Book Edition Selector */}
                <div className="space-y-3">
                  <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>{language === 'ar' ? 'اختار نوع النسخة' : 'Choose Your Book Edition'}</span>
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {(Object.keys(TIER_PRICING) as BookTier[]).map((tierKey) => {
                      const info = TIER_PRICING[tierKey];
                      const active = selectedTier === tierKey;
                      return (
                        <button
                          key={tierKey}
                          type="button"
                          onClick={() => setSelectedTier(tierKey)}
                          className={`relative p-4 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                            active
                              ? 'bg-cyan-950/35 border-cyan-400 shadow-lg shadow-cyan-500/15'
                              : 'bg-slate-950/60 border-white/10 hover:border-white/25'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              {info.format === 'hardcover_book' ? (
                                <BookOpen className="w-5 h-5 text-cyan-400 shrink-0" />
                              ) : (
                                <FileText className="w-5 h-5 text-purple-400 shrink-0" />
                              )}
                              {info.badgeAr && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-200 border border-pink-400/30">
                                  {language === 'ar' ? info.badgeAr : info.badgeEn}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-white">
                              {language === 'ar' ? info.titleAr : info.titleEn}
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {language === 'ar' ? info.descAr : info.descEn}
                            </p>
                          </div>
                          <div className="pt-2.5 border-t border-white/10 space-y-1 font-numeric">
                            <span className="text-base font-extrabold text-cyan-300 block">
                              {language === 'ar' ? `${info.priceEgp} ج.م` : `${info.priceEgp} EGP`}
                            </span>
                            <span className="text-xs text-slate-300 block">
                              {language === 'ar'
                                ? `${info.priceSar} ر.س • ${info.priceAed} د.إ`
                                : `${info.priceSar} SAR • ${info.priceAed} AED`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Child Metadata & Optional Gift Dedication */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-white/10">
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-300 block">
                      {language === 'ar' ? 'البطل ولد ولا بنت؟' : 'Hero Gender'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setChildGender('boy')}
                        className={`h-11 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          childGender === 'boy'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                            : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {language === 'ar' ? 'ولد' : 'Boy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setChildGender('girl')}
                        className={`h-11 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          childGender === 'girl'
                            ? 'bg-pink-500/20 border-pink-400 text-pink-200'
                            : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {language === 'ar' ? 'بنت' : 'Girl'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="wizard-hero-age"
                      className="text-xs font-semibold text-slate-300 block"
                    >
                      {language === 'ar' ? 'عمر البطل (بالسنوات)' : 'Hero Age (Years)'}
                    </label>
                    <Input
                      id="wizard-hero-age"
                      type="number"
                      min={1}
                      max={14}
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      className="h-11 bg-slate-950 border-white/15 rounded-xl text-white font-numeric"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="wizard-gift-dedication"
                      className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
                    >
                      <Gift className="w-5 h-5 text-pink-400 shrink-0" />
                      <span>
                        {language === 'ar' ? 'كلمة إهداء (اختياري)' : 'Gift Dedication (Optional)'}
                      </span>
                    </label>
                    <Input
                      id="wizard-gift-dedication"
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      maxLength={140}
                      placeholder={
                        language === 'ar' ? 'إلى بطلنا الغالي...' : 'To our bravest hero...'
                      }
                      className="h-11 bg-slate-950 border-white/15 rounded-xl text-white text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-3 pt-2 border-t border-white/10">
                    <span className="text-xs font-semibold text-slate-300 block">
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
                            className={`min-h-[40px] px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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

                {/* All 4 Companion AOV Add-ons (Powered by ADDON_PRICING) */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-pink-400 shrink-0" aria-hidden="true" />
                      <span>
                        {language === 'ar'
                          ? 'اجعل الهدية لا تُنسى (إضافات اختيارية)'
                          : 'Make the Gift Unforgettable (Optional Add-ons)'}
                      </span>
                    </span>
                    {selectedAddonsCount > 0 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/35 font-numeric">
                        {language === 'ar'
                          ? `${selectedAddonsCount} إضافات مفعّلة`
                          : `${selectedAddonsCount} selected`}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {companionAddons.map((addon) => {
                      const Icon = addon.icon;
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={addon.toggle}
                          aria-pressed={addon.checked}
                          className={`p-4 rounded-2xl border text-start flex flex-col justify-between gap-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
                                <p className="text-xs sm:text-sm font-bold text-white leading-snug">
                                  {language === 'ar' ? addon.titleAr : addon.titleEn}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  {language === 'ar' ? addon.descAr : addon.descEn}
                                </p>
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
                                ? `+${addon.pricing.egp} ج.م • +${addon.pricing.sar} ر.س • +${addon.pricing.aed} د.إ`
                                : `+${addon.pricing.egp} EGP • +${addon.pricing.sar} SAR • +${addon.pricing.aed} AED`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Story Summary & Price Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/75 border border-white/10 space-y-3 text-start">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                      <span>{t('storySummary')}</span>
                    </h4>
                    <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                      {heroPhoto ? (
                        <img
                          src={heroPhoto}
                          alt={heroName}
                          className="w-12 h-12 rounded-xl object-cover border border-cyan-400/50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="text-xs space-y-0.5">
                        <p className="font-bold text-sm text-white">{heroName}</p>
                        <p className="text-slate-400">
                          {heroPhoto
                            ? language === 'ar'
                              ? 'تم حفظ صورة بطلنا بنجاح'
                              : 'Child photo attached'
                            : language === 'ar'
                            ? 'تقدر تبعت الصورة لاحقاً عبر واتساب'
                            : 'You can also send the photo later on WhatsApp'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <p>
                        <span className="text-slate-400">{t('summaryLanguage')}: </span>
                        <span className="text-slate-200 font-semibold">
                          {resolveStoryLanguageLabel()}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">{t('summaryStyle')}: </span>
                        <span className="text-slate-200 font-semibold">
                          {config.artStyle === 'custom'
                            ? config.customArtStyle
                            : t('inquiryOption_' + config.artStyle)}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-400">{t('summaryCharacters')}: </span>
                        <span className="text-slate-200">
                          {config.characters
                            .map((c) => c.name)
                            .filter(Boolean)
                            .join(language === 'ar' ? '، ' : ', ')}
                        </span>
                      </p>
                      {config.interests.length > 0 && (
                        <p>
                          <span className="text-slate-400">{t('summaryInterests')}: </span>
                          <span className="text-slate-200">
                            {config.interests.join(language === 'ar' ? '، ' : ', ')}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Deposit Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/35 to-purple-950/35 border border-cyan-400/25 space-y-3 text-start flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                        <CreditCard className="w-5 h-5 shrink-0" />
                        <span>
                          {language === 'ar' ? 'ملخص السعر والعربون المبدئي' : 'Price & Deposit Summary'}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between items-baseline gap-2 text-xs sm:text-sm">
                        <span className="text-slate-300">
                          {language === 'ar' ? 'إجمالي الطلب:' : 'Total Price:'}
                        </span>
                        <span className="font-extrabold text-white text-sm sm:text-base font-numeric">
                          {language === 'ar'
                            ? `${totalEgp} ج.م • ${totalSar} ر.س • ${totalAed} د.إ`
                            : `${totalEgp} EGP • ${totalSar} SAR • ${totalAed} AED`}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between items-baseline gap-2 text-xs sm:text-sm text-cyan-300">
                        <span className="font-numeric">
                          {language === 'ar'
                            ? `العربون للبدء (${depositPercent}%):`
                            : `Deposit to Start (${depositPercent}%):`}
                        </span>
                        <span className="font-extrabold font-numeric">
                          {language === 'ar'
                            ? `${depositEgp} ج.م • ${depositSar} ر.س • ${depositAed} د.إ`
                            : `${depositEgp} EGP • ${depositSar} SAR • ${depositAed} AED`}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 pt-3 border-t border-white/10 leading-relaxed">
                      {language === 'ar'
                        ? 'طرق الدفع المتاحة: إنستاباي وفودافون كاش (مصر) • مدى وإس تي سي باي (السعودية) • أبل باي وتابي وتحويل بنكي (الإمارات). وهتستلم كود تتبّع فوري لطلبك.'
                        : 'Payments: InstaPay & Vodafone Cash (Egypt) • Mada & STC Pay (Saudi) • Apple Pay, Tabby & Bank Transfer (UAE). Instant tracking code included.'}
                    </p>
                  </div>
                </div>

                {/* Primary Guest Checkout & Add to Cart Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleInstantGuestCheckout}
                    className="w-full h-12 text-sm font-bold gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {language === 'ar' ? 'إتمام الطلب الآن كزائر' : 'Instant Guest Checkout'}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddToCart}
                    className="w-full h-12 text-sm font-bold gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {language === 'ar' ? 'أضف القصة للسلة' : 'Add Custom Story to Cart'}
                    </span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Step Navigation */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <BubbleButton
            size="sm"
            variant="outline"
            onClick={handlePrev}
            className="touch-manipulation gap-2"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            <span>{currentStep === 1 ? t('backHome') : t('previous')}</span>
          </BubbleButton>

          {currentStep < steps.length && (
            <BubbleButton size="sm" onClick={handleNext} className="touch-manipulation gap-2">
              <span>{t('nextStep')}</span>
              <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </BubbleButton>
          )}
        </div>
      </div>
    </section>
  );
};

export default StoryWizard;
