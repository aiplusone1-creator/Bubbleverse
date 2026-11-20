import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Gift,
  GraduationCap,
  Lock,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { LiquidSelect } from '@/components/ui/LiquidSelect';
import { useLanguage } from '@/hooks/useLanguage';
import {
  calculateB2BBulkQuote,
  getCurrencyMeta,
  type BookFormat,
  type CurrencyCountry,
} from '@/features/commerce/pricingEngine';
import {
  getStoreConfig,
  saveB2BLead,
  type B2BLeadRecord,
  type B2BOrganizationType,
} from '@/lib/localStore';

type PortalSegment = 'schools' | 'corporate';

type OccasionKey = 'graduation' | 'ramadan_eid' | 'end_of_year' | 'corporate_family_day';

const QUANTITY_PRESETS = [25, 50, 100, 250, 500] as const;

const COUNTRIES: {
  code: CurrencyCountry;
  flag: string;
  nameAr: string;
  nameEn: string;
  currencyAr: string;
  currencyEn: string;
}[] = [
  {
    code: 'EG',
    flag: '🇪🇬',
    nameAr: 'مصر',
    nameEn: 'Egypt',
    currencyAr: 'ج.م',
    currencyEn: 'EGP',
  },
  {
    code: 'SA',
    flag: '🇸🇦',
    nameAr: 'السعودية',
    nameEn: 'Saudi Arabia',
    currencyAr: 'ر.س',
    currencyEn: 'SAR',
  },
  {
    code: 'AE',
    flag: '🇦🇪',
    nameAr: 'الإمارات',
    nameEn: 'UAE',
    currencyAr: 'د.إ',
    currencyEn: 'AED',
  },
];

const BULK_TIERS: {
  minQty: number;
  maxQty: number | null;
  discountPercent: number;
  rangeLabelAr: string;
  rangeLabelEn: string;
  nameAr: string;
  nameEn: string;
}[] = [
  {
    minQty: 20,
    maxQty: 49,
    discountPercent: 20,
    rangeLabelAr: '20 – 49 طفل',
    rangeLabelEn: '20–49 kids',
    nameAr: 'باقة الفصل',
    nameEn: 'Classroom',
  },
  {
    minQty: 50,
    maxQty: 99,
    discountPercent: 32,
    rangeLabelAr: '50 – 99 طفل',
    rangeLabelEn: '50–99 kids',
    nameAr: 'باقة الحضانة',
    nameEn: 'Nursery & School',
  },
  {
    minQty: 100,
    maxQty: 249,
    discountPercent: 42,
    rangeLabelAr: '100 – 249 طفل',
    rangeLabelEn: '100–249 kids',
    nameAr: 'حفلات التخرج والشركات',
    nameEn: 'Graduation & HR',
  },
  {
    minQty: 250,
    maxQty: null,
    discountPercent: 52,
    rangeLabelAr: '+250 طفل',
    rangeLabelEn: '250+ kids',
    nameAr: 'الشركاء والمجموعات',
    nameEn: 'Enterprise Partner',
  },
];

const OCCASIONS: {
  key: OccasionKey;
  labelAr: string;
  labelEn: string;
}[] = [
  {
    key: 'graduation',
    labelAr: 'حفل تخرج (Graduation)',
    labelEn: 'Graduation Ceremony',
  },
  {
    key: 'ramadan_eid',
    labelAr: 'رمضان والعيد (Ramadan & Eid)',
    labelEn: 'Ramadan & Eid Gifting',
  },
  {
    key: 'end_of_year',
    labelAr: 'نهاية العام الدراسي (End-of-Year)',
    labelEn: 'End-of-Year Keepsakes',
  },
  {
    key: 'corporate_family_day',
    labelAr: 'يوم العائلة للموظفين (Corporate Family Day)',
    labelEn: 'Corporate Family Day',
  },
];

const ORG_TYPE_OPTIONS: {
  value: B2BOrganizationType;
  labelAr: string;
  labelEn: string;
  icon: typeof GraduationCap;
}[] = [
  {
    value: 'nursery',
    labelAr: 'حضانة / روضة',
    labelEn: 'Nursery / Preschool',
    icon: Sparkles,
  },
  {
    value: 'school',
    labelAr: 'مدرسة',
    labelEn: 'School',
    icon: GraduationCap,
  },
  {
    value: 'corporate',
    labelAr: 'شركة / موارد بشرية',
    labelEn: 'Corporate / HR',
    icon: Briefcase,
  },
];

function formatNumber(value: number, isAr: boolean): string {
  return value.toLocaleString(isAr ? 'ar-EG' : 'en-US');
}

export default function SchoolsPortal() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const shouldReduceMotion = Boolean(useReducedMotion());
  const text = (en: string, ar: string) => (isAr ? ar : en);

  const quoteFormRef = useRef<HTMLDivElement | null>(null);

  // Dual Segment Switcher state
  const [segment, setSegment] = useState<PortalSegment>('schools');

  // Bulk Calculator state
  const [country, setCountry] = useState<CurrencyCountry>('EG');
  const [format, setFormat] = useState<BookFormat>('hardcover_book');
  const [quantity, setQuantity] = useState<number>(100);

  // Quote Form state
  const [organizationType, setOrganizationType] = useState<B2BOrganizationType>('school');
  const [organizationName, setOrganizationName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [occasion, setOccasion] = useState<OccasionKey>('graduation');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submittedLead, setSubmittedLead] = useState<B2BLeadRecord | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const safeQuantity = Math.max(10, Math.min(2000, Math.floor(quantity || 10)));
  const sliderValue = Math.max(20, Math.min(500, safeQuantity));

  const quote = useMemo(
    () => calculateB2BBulkQuote(safeQuantity, country, format),
    [safeQuantity, country, format]
  );

  const currencyMeta = useMemo(() => getCurrencyMeta(country), [country]);
  const currencyLabel = isAr ? quote.currencyAr : quote.currencyEn;

  const nextTier = useMemo(() => {
    return BULK_TIERS.find((tier) => safeQuantity < tier.minQty) ?? null;
  }, [safeQuantity]);

  const handleSegmentSwitch = (nextSegment: PortalSegment) => {
    setSegment(nextSegment);
    if (nextSegment === 'corporate') {
      setOrganizationType('corporate');
      setOccasion('corporate_family_day');
    } else {
      setOrganizationType((prev) => (prev === 'corporate' ? 'school' : prev));
      setOccasion((prev) => (prev === 'corporate_family_day' ? 'graduation' : prev));
    }
  };

  const handleSegmentKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      handleSegmentSwitch(segment === 'schools' ? 'corporate' : 'schools');
    } else if (event.key === 'Home') {
      event.preventDefault();
      handleSegmentSwitch('schools');
    } else if (event.key === 'End') {
      event.preventDefault();
      handleSegmentSwitch('corporate');
    }
  };

  const scrollToForm = () => {
    quoteFormRef.current?.scrollIntoView({
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const getOccasionLabel = (key: OccasionKey): string => {
    const found = OCCASIONS.find((o) => o.key === key);
    if (!found) return key;
    return isAr ? found.labelAr : found.labelEn;
  };

  const getOrgTypeLabel = (type: B2BOrganizationType): string => {
    const found = ORG_TYPE_OPTIONS.find((o) => o.value === type);
    if (!found) return type;
    return isAr ? found.labelAr : found.labelEn;
  };

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedOrg = organizationName.trim();
    const trimmedContact = contactName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedOrg || !trimmedContact || !trimmedPhone) {
      setFormError(
        text(
          'Please fill in organization name, contact name, and WhatsApp phone number.',
          'يرجى إدخال اسم الجهة، واسم مسؤول التواصل، ورقم الواتساب.'
        )
      );
      return;
    }

    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      setFormError(
        text(
          'Please enter a valid WhatsApp phone number with country code.',
          'يرجى إدخال رقم واتساب صحيح متضمناً كود الدولة.'
        )
      );
      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError(
        text(
          'Please enter a valid email address or leave it blank.',
          'يرجى إدخال بريد إلكتروني صحيح أو تركه فارغاً.'
        )
      );
      return;
    }

    const occasionLabel = getOccasionLabel(occasion);

    const saved = saveB2BLead({
      organizationType,
      organizationName: trimmedOrg,
      contactName: trimmedContact,
      phone: trimmedPhone,
      email: trimmedEmail || undefined,
      country,
      quantity: safeQuantity,
      format,
      occasion: occasionLabel,
      estimatedTotal: quote.total,
      currency: currencyMeta.code,
      notes: notes.trim() || undefined,
    });

    setSubmittedLead(saved);
    setCopiedRef(false);
  };

  const buildWhatsappProposalUrl = (lead?: B2BLeadRecord | null) => {
    const storeConfig = getStoreConfig();
    const digits = (storeConfig.whatsappPhone || '201000000000').replace(/\D/g, '');

    const activeLeadQty = lead ? lead.quantity : safeQuantity;
    const activeLeadCountry = lead ? lead.country : country;
    const activeLeadFormat = lead ? lead.format : format;
    const activeQuote = calculateB2BBulkQuote(
      activeLeadQty,
      activeLeadCountry,
      activeLeadFormat
    );
    const activeCurrencyMeta = getCurrencyMeta(activeLeadCountry);
    const activeCurrencyLabel = isAr ? activeQuote.currencyAr : activeQuote.currencyEn;
    const formatText =
      activeLeadFormat === 'hardcover_book'
        ? text('Luxury Hardcover Book', 'كتاب مطبوع بغلاف فاخر')
        : text('Digital PDF Edition', 'نسخة رقمية PDF');

    const lines = isAr
      ? [
          `مرحباً فريق بابل فيرس 🌟`,
          `أرغب في عرض سعر رسمي لباقة المؤسسات:`,
          lead ? `• الرقم المرجعي: ${lead.reference}` : null,
          `• نوع الجهة: ${getOrgTypeLabel(lead ? lead.organizationType : organizationType)}`,
          `• اسم الجهة: ${lead ? lead.organizationName : organizationName || 'غير محدد'}`,
          `• مسؤول التواصل: ${lead ? lead.contactName : contactName || 'غير محدد'}`,
          `• الدولة: ${activeCurrencyMeta.countryAr}`,
          `• المناسبة: ${lead ? lead.occasion : getOccasionLabel(occasion)}`,
          `• النسخة: ${formatText}`,
          `• عدد الأطفال/الموظفين: ${activeLeadQty}`,
          `• الباقة: ${activeQuote.tierNameAr} (خصم ${activeQuote.discountPercent}%)`,
          `• سعر النسخة: ${activeQuote.unitPrice} ${activeCurrencyLabel} (بدلاً من ${activeQuote.baseUnitPrice})`,
          `• الإجمالي التقديري: ${activeQuote.total.toLocaleString('en-US')} ${activeCurrencyLabel}`,
          `• إجمالي التوفير: ${activeQuote.savings.toLocaleString('en-US')} ${activeCurrencyLabel}`,
          lead?.notes || notes.trim()
            ? `• ملاحظات: ${lead?.notes || notes.trim()}`
            : null,
        ].filter(Boolean)
      : [
          `Hello Bubbleverse Partnerships Team!`,
          `I'd like to request an official B2B bulk proposal:`,
          lead ? `• Reference: ${lead.reference}` : null,
          `• Organization Type: ${getOrgTypeLabel(lead ? lead.organizationType : organizationType)}`,
          `• Organization: ${lead ? lead.organizationName : organizationName || 'N/A'}`,
          `• Contact: ${lead ? lead.contactName : contactName || 'N/A'}`,
          `• Country: ${activeCurrencyMeta.countryEn}`,
          `• Occasion: ${lead ? lead.occasion : getOccasionLabel(occasion)}`,
          `• Format: ${formatText}`,
          `• Quantity: ${activeLeadQty} children`,
          `• Tier: ${activeQuote.tierNameEn} (${activeQuote.discountPercent}% OFF)`,
          `• Unit Price: ${activeQuote.unitPrice} ${activeCurrencyLabel} (base ${activeQuote.baseUnitPrice})`,
          `• Estimated Total: ${activeQuote.total.toLocaleString('en-US')} ${activeCurrencyLabel}`,
          `• Total Savings: ${activeQuote.savings.toLocaleString('en-US')} ${activeCurrencyLabel}`,
          lead?.notes || notes.trim()
            ? `• Notes: ${lead?.notes || notes.trim()}`
            : null,
        ].filter(Boolean);

    return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  const handleCopyReference = async (refCode: string) => {
    try {
      await navigator.clipboard.writeText(refCode);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2200);
    } catch {
      setCopiedRef(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedLead(null);
    setOrganizationName('');
    setContactName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setFormError('');
  };

  const segmentPillars =
    segment === 'schools'
      ? [
          {
            icon: GraduationCap,
            accent: 'text-cyan-300 bg-cyan-500/12 border-cyan-400/25',
            titleAr: 'قصص تخرّج بشعار مدرستك على الغلاف',
            titleEn: 'Graduation Keepsakes With School Logo',
            descAr:
              'كتاب مصور باسم وصورة كل طالب خريج مع شعار المدرسة أو الحضانة وكلمة تهنئة رسمية من الإدارة في صفحة الإهداء.',
            descEn:
              'Every graduating student stars as the hero of their own hardcover storybook featuring your school emblem and principal’s dedication.',
          },
          {
            icon: Users,
            accent: 'text-purple-300 bg-purple-500/12 border-purple-400/25',
            titleAr: 'تجهيز دفعات الفصول بدون أي تعب إداري',
            titleEn: 'Effortless Class Bulk Upload',
            descAr:
              'ارفع كشف أسماء الفصل مرة واحدة أو وزّع رابطاً خاصاً لأولياء الأمور لرفع صور أطفالهم بخصوصية كاملة ومراجعة المسودات.',
            descEn:
              'Submit a single class roster or share private parent submission links—we handle layout, consistency, and pre-print proof approvals.',
          },
          {
            icon: BookOpen,
            accent: 'text-pink-300 bg-pink-500/12 border-pink-400/25',
            titleAr: 'قصص قيم ومنهج تربوي (عربي / إنجليزي)',
            titleEn: 'Curriculum & Values Storytelling',
            descAr:
              'موضوعات تربوية هادفة عن الصدق، التعاون، الثقة بالنفس، وحب القراءة بنسخ عربية أو إنجليزية أو ثنائية اللغة.',
            descEn:
              'Values-led narratives nurturing kindness, teamwork, curiosity, and reading love in Arabic, English, or Bilingual editions.',
          },
        ]
      : [
          {
            icon: Gift,
            accent: 'text-pink-300 bg-pink-500/12 border-pink-400/25',
            titleAr: 'هدايا العيد ورمضان ويوم عائلة الموظفين',
            titleEn: 'Eid, Ramadan & Family Day Vouchers',
            descAr:
              'هدية استثنائية تدخل بيوت موظفيك وتُحفظ لسنوات، بدلاً من الهدايا التقليدية المكررة التي تُنسى خلال أيام.',
            descEn:
              'Replace forgettable corporate swag with a bespoke storybook keepsake for every employee’s child during Eid, Ramadan, or Family Day.',
          },
          {
            icon: Lock,
            accent: 'text-emerald-300 bg-emerald-500/12 border-emerald-400/25',
            titleAr: 'روابط استبدال خاصة — صفر صداع خصوصية للـ HR',
            titleEn: 'Private Redemption Links — Zero HR Privacy Headache',
            descAr:
              'تدفع الشركة فاتورة واحدة مجمّعة، ونرسل لك أكواداً خاصة يفتحها كل موظف بنفسه لإدخال اسم وصورة طفله بسرية تامة.',
            descEn:
              'HR pays once on a single invoice; each employee receives a private voucher link to submit their own child’s details securely—HR never touches child photos.',
          },
          {
            icon: Award,
            accent: 'text-cyan-300 bg-cyan-500/12 border-cyan-400/25',
            titleAr: 'إهداء مخصص باسم الشركة وتوصيل مباشر للمنازل',
            titleEn: 'Co-Branded Dedication & Doorstep Delivery',
            descAr:
              'رسالة تقدير من إدارة الشركة في مقدمة الكتاب مع خيار التغليف الفاخر والتوصيل المباشر لمقر الشركة أو منازل الموظفين.',
            descEn:
              'Include a warm company dedication page, optional luxury gift boxes, and delivery either to your HQ or directly to employees’ homes.',
          },
        ];

  const workflowSteps =
    segment === 'schools'
      ? [
          {
            num: '01',
            titleAr: 'اختاروا القصة والباقة',
            titleEn: 'Pick Story & Batch Tier',
            descAr: 'احسب السعر الفوري وحدد الغلاف بشعار الحضانة أو المدرسة.',
            descEn: 'Lock your wholesale tier and customize cover emblem & dedication.',
          },
          {
            num: '02',
            titleAr: 'استلام بيانات الأطفال بسهولة',
            titleEn: 'Simple Roster or Parent Link',
            descAr: 'كشف إكسل من الإدارة أو روابط خاصة لأولياء الأمور مع حذف تلقائي للصور.',
            descEn: 'Upload a class sheet or let parents submit privately with zero photo retention.',
          },
          {
            num: '03',
            titleAr: 'مراجعة عيّنة ثم الطباعة والتوصيل',
            titleEn: 'Proof Review & Campus Delivery',
            descAr: 'نرسل عيّنة رقمية للاعتماد ثم نطبع ونسلّم الدفعة قبل موعد الحفل.',
            descEn: 'Approve your digital proof before batch printing and scheduled delivery.',
          },
        ]
      : [
          {
            num: '01',
            titleAr: 'فاتورة واحدة لعدد القسائم',
            titleEn: 'One Invoice for Bulk Vouchers',
            descAr: 'حدد عدد الأطفال أو الموظفين واحصل على خصم الشركات حتى 52%.',
            descEn: 'Choose your voucher pack (20 to 500+) with up to 52% corporate savings.',
          },
          {
            num: '02',
            titleAr: 'كل موظف يخصص كتابه بخصوصية',
            titleEn: 'Employees Redeem Privately',
            descAr: 'يستخدم الموظف رابطه الخاص لاختيار القصة وإدخال اسم وصورة طفله.',
            descEn: 'Employees use their unique link to pick a story and enter child details privately.',
          },
          {
            num: '03',
            titleAr: 'تجهيز وتغليف وتوصيل لمصر والخليج',
            titleEn: 'Crafted & Shipped Across MENA',
            descAr: 'نطبع الكتب ونوصلها في مصر والسعودية والإمارات مع متابعة كاملة.',
            descEn: 'Printed, wrapped, and delivered across Egypt, Saudi Arabia, and the UAE.',
          },
        ];

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative min-h-screen overflow-x-hidden bg-background text-foreground"
    >
      <ImmersiveBackground />
      <Header />

      <main className="relative z-10 pt-24 sm:pt-28 pb-20 px-4 sm:px-6">
        <div className="bv-container space-y-12 sm:space-y-16">
          {/* Hero Header — Zero Login Wall */}
          <motion.section
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: [0.23, 1, 0.32, 1] }}
            className="text-center space-y-5 max-w-4xl mx-auto"
          >
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/12 border border-cyan-400/30 text-cyan-200 text-xs sm:text-sm font-semibold">
              <Building2 className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>
                {text(
                  'B2B Partnerships • Egypt, Saudi Arabia & UAE • No Account Required',
                  'بوابة الشراكات والمؤسسات • مصر والسعودية والإمارات • عرض سعر فوري بدون تسجيل دخول'
                )}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-editorial text-balance leading-tight">
              {isAr ? (
                <>
                  قصص مصورة مخصصة{' '}
                  <span className="text-magical">للمدارس والحضانات والشركات</span>
                </>
              ) : (
                <>
                  Personalized Storybooks for{' '}
                  <span className="text-magical">Schools, Nurseries & Corporate HR</span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {text(
                'Turn graduation ceremonies, Ramadan & Eid gifting, and Corporate Family Days into unforgettable illustrated keepsakes—with transparent bulk pricing up to 52% off and zero privacy headaches.',
                'حوّل حفلات التخرّج وهدايا رمضان والعيد ويوم العائلة في شركتك إلى كتب مصوّرة مخصصة لكل طفل — بأسعار جملة فورية تصل لخصم 52% وخصوصية كاملة لصور الأطفال.'
              )}
            </p>

            {/* Quick Action Anchors */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Button
                type="button"
                onClick={scrollToForm}
                className="min-h-[48px] px-7 bubble-btn bubble-btn-primary text-sm sm:text-base font-bold gap-2"
              >
                <Calculator className="w-4 h-4 shrink-0" />
                <span>
                  {text('Calculate & Request Instant Quote', 'احسب الباقة واطلب عرض سعر فوري')}
                </span>
              </Button>
              <a
                href={buildWhatsappProposalUrl(null)}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] px-6 bubble-btn bubble-btn-outline text-sm font-bold inline-flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>{text('WhatsApp Partnerships Desk', 'تحدث مع فريق الشراكات')}</span>
              </a>
            </div>
          </motion.section>

          {/* Dual Segment Switcher */}
          <section aria-labelledby="b2b-segments-heading" className="space-y-6">
            <h2 id="b2b-segments-heading" className="sr-only">
              {text('Choose your institutional program', 'اختر برنامج المؤسسات المناسب')}
            </h2>

            <div className="flex justify-center">
              <div
                role="tablist"
                aria-label={text('B2B Program Type', 'نوع برنامج الشراكة')}
                className="glass-card-inner p-1.5 rounded-full border border-white/15 inline-flex flex-wrap sm:flex-nowrap gap-1.5 w-full max-w-2xl"
              >
                <button
                  type="button"
                  role="tab"
                  id="tab-schools"
                  aria-selected={segment === 'schools'}
                  aria-controls="panel-segment-details"
                  tabIndex={segment === 'schools' ? 0 : -1}
                  onClick={() => handleSegmentSwitch('schools')}
                  onKeyDown={handleSegmentKeyDown}
                  className={`flex-1 min-h-[48px] px-5 py-2.5 rounded-full text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2.5 transition-all touch-manipulation ${
                    segment === 'schools'
                      ? 'bg-gradient-to-r from-cyan-500/90 via-sky-500/90 to-purple-600/90 text-white shadow-[0_6px_22px_rgba(0,217,255,0.35)] border border-white/25'
                      : 'text-foreground/75 hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <GraduationCap className="w-5 h-5 shrink-0" />
                  <span>{text('Nurseries & Schools', 'المدارس والحضانات')}</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="tab-corporate"
                  aria-selected={segment === 'corporate'}
                  aria-controls="panel-segment-details"
                  tabIndex={segment === 'corporate' ? 0 : -1}
                  onClick={() => handleSegmentSwitch('corporate')}
                  onKeyDown={handleSegmentKeyDown}
                  className={`flex-1 min-h-[48px] px-5 py-2.5 rounded-full text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2.5 transition-all touch-manipulation ${
                    segment === 'corporate'
                      ? 'bg-gradient-to-r from-purple-600/90 via-fuchsia-500/90 to-pink-500/90 text-white shadow-[0_6px_22px_rgba(244,114,182,0.35)] border border-white/25'
                      : 'text-foreground/75 hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <Briefcase className="w-5 h-5 shrink-0" />
                  <span>{text('Corporate HR Gifting', 'شركات وموارد بشرية')}</span>
                </button>
              </div>
            </div>

            {/* Segment Value Pillars */}
            <motion.div
              key={segment}
              id="panel-segment-details"
              role="tabpanel"
              aria-labelledby={segment === 'schools' ? 'tab-schools' : 'tab-corporate'}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {segmentPillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.titleEn}
                      className="glass-card p-6 rounded-3xl border border-white/12 space-y-3.5"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${pillar.accent}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold font-editorial text-foreground">
                        {isAr ? pillar.titleAr : pillar.titleEn}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isAr ? pillar.descAr : pillar.descEn}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* 3-Step Rollout Strip */}
              <div className="glass-card-inner p-5 sm:p-6 rounded-3xl border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  {workflowSteps.map((step) => (
                    <div key={step.num} className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 text-primary font-extrabold font-numeric text-sm flex items-center justify-center shrink-0">
                        {step.num}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm sm:text-base font-bold text-foreground">
                          {isAr ? step.titleAr : step.titleEn}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {isAr ? step.descAr : step.descEn}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          {/* Interactive Bulk Tier Price Calculator + Instant Quote Form Grid */}
          <section
            aria-labelledby="b2b-calculator-heading"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start"
          >
            {/* Left / Start: Interactive Bulk Calculator */}
            <div className="lg:col-span-6 glass-card p-6 sm:p-8 rounded-3xl border border-cyan-400/25 shadow-2xl space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wide">
                    <Calculator className="w-4 h-4 shrink-0" />
                    <span>{text('Live Bulk Pricing Engine', 'حاسبة أسعار الجملة الفورية')}</span>
                  </div>
                  <h2
                    id="b2b-calculator-heading"
                    className="text-2xl sm:text-3xl font-extrabold font-editorial"
                  >
                    {text('Calculate Your Bulk Package', 'احسب تكلفة باقة مؤسستك')}
                  </h2>
                </div>
                {quote.discountPercent > 0 && (
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/18 border border-emerald-400/40 text-emerald-300 text-xs sm:text-sm font-extrabold font-numeric shrink-0">
                    {isAr ? `خصم ${quote.discountPercent}%` : `${quote.discountPercent}% OFF`}
                  </span>
                )}
              </div>

              {/* Country Selector */}
              <div className="space-y-2.5">
                <span className="block text-xs sm:text-sm font-semibold text-foreground/85">
                  {text('1. Select Country & Currency', '1. اختر الدولة والعملة')}
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {COUNTRIES.map((item) => {
                    const active = country === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setCountry(item.code)}
                        className={`min-h-[52px] px-3 py-2.5 rounded-2xl border text-center transition-all touch-manipulation flex flex-col items-center justify-center gap-0.5 ${
                          active
                            ? 'bg-cyan-500/18 border-cyan-400 text-white shadow-[0_0_20px_rgba(0,217,255,0.2)]'
                            : 'bg-slate-950/55 border-white/12 text-foreground/75 hover:border-white/30 hover:text-foreground'
                        }`}
                      >
                        <span className="text-base leading-none" aria-hidden="true">
                          {item.flag}
                        </span>
                        <span className="text-xs sm:text-sm font-bold">
                          {isAr ? item.nameAr : item.nameEn}
                        </span>
                        <span className="text-[11px] font-numeric text-cyan-300/90">
                          {isAr ? item.currencyAr : item.currencyEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format Selector */}
              <div className="space-y-2.5">
                <span className="block text-xs sm:text-sm font-semibold text-foreground/85">
                  {text('2. Choose Book Edition', '2. اختر نوع النسخة')}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    aria-pressed={format === 'hardcover_book'}
                    onClick={() => setFormat('hardcover_book')}
                    className={`min-h-[64px] p-4 rounded-2xl border text-start transition-all touch-manipulation flex items-start gap-3 ${
                      format === 'hardcover_book'
                        ? 'bg-purple-500/18 border-purple-400 text-white shadow-[0_0_20px_rgba(167,139,250,0.2)]'
                        : 'bg-slate-950/55 border-white/12 text-foreground/80 hover:border-white/30'
                    }`}
                  >
                    <BookOpen className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold">
                        {text('Luxury Hardcover Book', 'كتاب مطبوع بغلاف فاخر')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {text(
                          '8.5"×8.5" full-color keepsake + logo on cover',
                          'طباعة فاخرة 21×21 سم + شعار الجهة على الغلاف'
                        )}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-pressed={format === 'digital_pdf'}
                    onClick={() => setFormat('digital_pdf')}
                    className={`min-h-[64px] p-4 rounded-2xl border text-start transition-all touch-manipulation flex items-start gap-3 ${
                      format === 'digital_pdf'
                        ? 'bg-cyan-500/18 border-cyan-400 text-white shadow-[0_0_20px_rgba(0,217,255,0.2)]'
                        : 'bg-slate-950/55 border-white/12 text-foreground/80 hover:border-white/30'
                    }`}
                  >
                    <FileText className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold">
                        {text('Digital PDF Edition', 'نسخة رقمية PDF')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {text(
                          'Print-ready HD PDFs with instant batch delivery',
                          'ملفات PDF عالية الدقة جاهزة للقراءة والطباعة'
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quantity Slider + Preset Pills + Exact Input */}
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="b2b-qty-input"
                    className="text-xs sm:text-sm font-semibold text-foreground/85"
                  >
                    {text('3. Number of Children / Vouchers', '3. عدد الأطفال أو قسائم الموظفين')}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="b2b-qty-input"
                      type="number"
                      min={10}
                      max={2000}
                      value={quantity}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        setQuantity(Number.isNaN(parsed) ? 0 : Math.min(2000, Math.max(0, parsed)));
                      }}
                      dir="ltr"
                      className="w-24 h-11 text-center font-extrabold font-numeric bg-slate-950/85 border-cyan-400/35 rounded-xl text-base text-cyan-200"
                      aria-label={text('Exact number of children', 'العدد الدقيق للأطفال')}
                    />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {text('kids', 'طفل')}
                    </span>
                  </div>
                </div>

                {/* Accessible Slider */}
                <div className="pt-2 pb-1 px-1">
                  <Slider
                    dir={isRTL ? 'rtl' : 'ltr'}
                    min={20}
                    max={500}
                    step={5}
                    value={[sliderValue]}
                    onValueChange={(vals) => {
                      if (typeof vals[0] === 'number') {
                        setQuantity(vals[0]);
                      }
                    }}
                    aria-label={text('Select quantity of books', 'اختر عدد الكتب')}
                    className="cursor-pointer py-2"
                  />
                  <div className="flex justify-between text-[11px] font-numeric text-muted-foreground mt-1">
                    <span>20</span>
                    <span>100</span>
                    <span>250</span>
                    <span>500+</span>
                  </div>
                </div>

                {/* Preset Pills */}
                <div className="flex flex-wrap gap-2">
                  {QUANTITY_PRESETS.map((preset) => {
                    const active = safeQuantity === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setQuantity(preset)}
                        className={`min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-bold font-numeric border transition-all touch-manipulation ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_16px_rgba(0,217,255,0.4)]'
                            : 'bg-slate-950/60 border-white/12 text-foreground/80 hover:border-primary/45 hover:text-foreground'
                        }`}
                      >
                        {preset} {text('kids', 'طفل')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Quote Readout Box */}
              <div
                aria-live="polite"
                className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-950/90 via-indigo-950/55 to-purple-950/45 border border-cyan-400/30 space-y-4 shadow-inner"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-cyan-200">
                    <Tag className="w-4 h-4 text-cyan-300 shrink-0" />
                    <span>{isAr ? quote.tierNameAr : quote.tierNameEn}</span>
                  </div>
                  {quote.discountPercent > 0 ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold font-numeric">
                      {isAr ? `توفير ${quote.discountPercent}%` : `Save ${quote.discountPercent}%`}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-semibold">
                      {text('Add 20+ for bulk discount', 'تبدأ خصومات الجملة من 20 طفل')}
                    </span>
                  )}
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  {/* Unit Price */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground">
                      {text('Unit Price / Child', 'سعر النسخة للطفل')}
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap font-numeric">
                      <span className="text-xl sm:text-2xl font-extrabold text-white">
                        {formatNumber(quote.unitPrice, isAr)} {currencyLabel}
                      </span>
                      {quote.discountPercent > 0 && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatNumber(quote.baseUnitPrice, isAr)} {currencyLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total Investment */}
                  <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-400/30 space-y-1">
                    <div className="text-[11px] font-medium text-cyan-200/90">
                      {text('Total Investment', 'الإجمالي التقديري')}
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold text-cyan-200 font-numeric">
                      {formatNumber(quote.total, isAr)} {currencyLabel}
                    </div>
                  </div>

                  {/* Total Savings */}
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 space-y-1">
                    <div className="text-[11px] font-medium text-emerald-200/90">
                      {text('Total Savings', 'إجمالي التوفير')}
                    </div>
                    <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 font-numeric">
                      {formatNumber(quote.savings, isAr)} {currencyLabel}
                    </div>
                  </div>
                </div>

                {/* Next Tier Upsell Hint */}
                {nextTier && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs text-slate-300">
                    <span>
                      {isAr
                        ? `أضف ${nextTier.minQty - safeQuantity} طفل إضافي للوصول إلى خصم ${nextTier.discountPercent}% (${nextTier.nameAr})`
                        : `Add ${nextTier.minQty - safeQuantity} more kids to unlock ${nextTier.discountPercent}% OFF (${nextTier.nameEn})`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(nextTier.minQty)}
                      className="min-h-[36px] px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-cyan-200 font-bold shrink-0 transition-colors"
                    >
                      {isAr ? `جرّب ${nextTier.minQty}` : `Try ${nextTier.minQty}`}
                    </button>
                  </div>
                )}
              </div>

              {/* Transparent Volume Tier Table */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  {text('Wholesale Tier Schedule', 'جدول شرائح خصم الجملة')}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BULK_TIERS.map((tier) => {
                    const isCurrent =
                      safeQuantity >= tier.minQty &&
                      (tier.maxQty === null || safeQuantity <= tier.maxQty);
                    return (
                      <button
                        key={tier.minQty}
                        type="button"
                        onClick={() => setQuantity(tier.minQty)}
                        className={`p-2.5 rounded-xl border text-center transition-all min-h-[60px] flex flex-col items-center justify-center gap-0.5 touch-manipulation ${
                          isCurrent
                            ? 'bg-primary/18 border-primary text-white shadow-[0_0_14px_rgba(0,217,255,0.22)]'
                            : 'bg-slate-950/45 border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground'
                        }`}
                      >
                        <span className="text-[11px] font-numeric">
                          {isAr ? tier.rangeLabelAr : tier.rangeLabelEn}
                        </span>
                        <span
                          className={`text-sm font-extrabold font-numeric ${
                            isCurrent ? 'text-cyan-300' : 'text-emerald-300/90'
                          }`}
                        >
                          -{tier.discountPercent}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right / End: Instant B2B Quote Request Form (or Confirmation Receipt) */}
            <div
              ref={quoteFormRef}
              className="lg:col-span-6 glass-card p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl"
            >
              {submittedLead ? (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                  className="space-y-6 py-2"
                >
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/18 border border-emerald-400/35 text-emerald-300 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-editorial text-white">
                      {text('Quote Request Saved!', 'تم استلام طلب عرض السعر بنجاح!')}
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                      {text(
                        'Your institutional quote is logged with our partnerships team. Click below to send it directly on WhatsApp for priority proposal & sample delivery.',
                        'تم تسجيل طلبكم بنجاح في نظام الشراكات. اضغط أدناه لإرسال ملخص الباقة مباشرة عبر واتساب لتسريع إرسال العرض الرسمي ونماذج الكتب.'
                      )}
                    </p>
                  </div>

                  {/* Reference Code Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/85 border border-cyan-400/35 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="block text-xs text-muted-foreground">
                        {text('Quote Reference Number', 'الرقم المرجعي للعرض')}
                      </span>
                      <span
                        dir="ltr"
                        className="inline-block text-xl sm:text-2xl font-extrabold font-numeric tracking-wider text-cyan-300"
                      >
                        {submittedLead.reference}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleCopyReference(submittedLead.reference)}
                      className="min-h-[44px] px-4 rounded-xl border-white/15 hover:border-cyan-400/45 gap-2 text-xs font-bold"
                    >
                      {copiedRef ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>{text('Copied', 'تم النسخ')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>{text('Copy Ref', 'نسخ الرقم')}</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Submitted Summary */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">
                        {text('Organization', 'الجهة')}
                      </span>
                      <span className="font-bold text-white text-end">
                        {submittedLead.organizationName} ({getOrgTypeLabel(submittedLead.organizationType)})
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">
                        {text('Package', 'الباقة')}
                      </span>
                      <span className="font-bold text-white font-numeric text-end">
                        {submittedLead.quantity} ×{' '}
                        {submittedLead.format === 'hardcover_book'
                          ? text('Hardcover', 'كتاب مطبوع')
                          : text('Digital PDF', 'PDF رقمي')}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">
                        {text('Occasion', 'المناسبة')}
                      </span>
                      <span className="font-semibold text-slate-200 text-end">
                        {submittedLead.occasion}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 pt-2 border-t border-white/10">
                      <span className="font-semibold text-cyan-200">
                        {text('Estimated Total', 'الإجمالي التقديري')}
                      </span>
                      <span className="text-lg font-extrabold text-cyan-300 font-numeric">
                        {formatNumber(submittedLead.estimatedTotal, isAr)}{' '}
                        {isAr
                          ? getCurrencyMeta(submittedLead.country).labelAr
                          : submittedLead.currency}
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Send Proposal on WhatsApp */}
                  <div className="space-y-3">
                    <a
                      href={buildWhatsappProposalUrl(submittedLead)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[52px] px-6 bubble-btn bubble-btn-emerald text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2.5"
                    >
                      <MessageCircle className="w-5 h-5 shrink-0" />
                      <span>
                        {text(
                          '1-Click Send Proposal Request on WhatsApp',
                          'إرسال طلب العرض الرسمي عبر واتساب بضغطة واحدة'
                        )}
                      </span>
                    </a>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetForm}
                      className="w-full min-h-[46px] rounded-full border-white/15 hover:border-primary/40 text-sm font-semibold"
                    >
                      {text('Calculate Another Quote', 'حساب وإرسال طلب جديد')}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmitQuote} className="space-y-5" noValidate>
                  <div className="border-b border-white/10 pb-4 space-y-1.5">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-purple-300">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>
                        {text('Instant Quote — Zero Login Required', 'طلب فوري بدون تسجيل دخول')}
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold font-editorial text-white">
                      {text('Request Your Official Proposal', 'اطلب عرض السعر الرسمي والعيّنات')}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {text(
                        'Your selected calculator settings are attached automatically.',
                        'يتم إرفاق تفاصيل الباقة والسعر من الحاسبة تلقائياً مع طلبك.'
                      )}
                    </p>
                  </div>

                  {/* Attached Live Quote Summary Strip */}
                  <div className="px-4 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/25 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="text-cyan-100 font-semibold">
                      <span className="font-numeric">{safeQuantity}</span>{' '}
                      {format === 'hardcover_book'
                        ? text('Hardcover books', 'كتاب مطبوع')
                        : text('Digital PDFs', 'كتاب رقمي PDF')}{' '}
                      • {isAr ? currencyMeta.countryAr : currencyMeta.countryEn}
                    </span>
                    <span className="font-extrabold text-cyan-300 font-numeric">
                      {formatNumber(quote.total, isAr)} {currencyLabel}
                      {quote.discountPercent > 0 && ` (-${quote.discountPercent}%)`}
                    </span>
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-2xl bg-destructive/15 border border-destructive/35 text-red-200 text-xs sm:text-sm font-medium"
                    >
                      {formError}
                    </div>
                  )}

                  {/* Organization Type */}
                  <div className="space-y-2">
                    <span className="block text-xs sm:text-sm font-semibold text-foreground/85">
                      {text('Organization Type *', 'نوع الجهة *')}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {ORG_TYPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const active = organizationType === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                              setOrganizationType(opt.value);
                              setSegment(opt.value === 'corporate' ? 'corporate' : 'schools');
                            }}
                            className={`min-h-[48px] px-2.5 py-2 rounded-xl border text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all touch-manipulation ${
                              active
                                ? 'bg-purple-500/20 border-purple-400 text-white'
                                : 'bg-slate-950/55 border-white/12 text-foreground/75 hover:border-white/30'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="text-center leading-tight">
                              {isAr ? opt.labelAr : opt.labelEn}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Organization Name & Contact Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label htmlFor="b2b-org-name" className="space-y-1.5 block">
                      <span className="text-xs font-semibold text-foreground/85">
                        {organizationType === 'corporate'
                          ? text('Company Name *', 'اسم الشركة *')
                          : text('School / Nursery Name *', 'اسم المدرسة أو الحضانة *')}
                      </span>
                      <Input
                        id="b2b-org-name"
                        required
                        maxLength={160}
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder={
                          organizationType === 'corporate'
                            ? text('e.g. Horizon Tech MENA', 'مثال: شركة أفق للتقنية')
                            : text('e.g. Little Stars Academy', 'مثال: حضانة ومدارس النجوم الصغيرة')
                        }
                        className="h-12 rounded-xl bg-slate-950/80 border-white/15 text-sm"
                      />
                    </label>

                    <label htmlFor="b2b-contact-name" className="space-y-1.5 block">
                      <span className="text-xs font-semibold text-foreground/85">
                        {text('Contact Name *', 'اسم مسؤول التواصل *')}
                      </span>
                      <Input
                        id="b2b-contact-name"
                        required
                        maxLength={120}
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder={text('Principal / HR Lead Name', 'الاسم والمسمى الوظيفي')}
                        className="h-12 rounded-xl bg-slate-950/80 border-white/15 text-sm"
                      />
                    </label>
                  </div>

                  {/* WhatsApp Phone & Optional Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label htmlFor="b2b-phone" className="space-y-1.5 block">
                      <span className="text-xs font-semibold text-foreground/85">
                        {text('WhatsApp Phone *', 'رقم الواتساب *')}
                      </span>
                      <Input
                        id="b2b-phone"
                        required
                        type="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={
                          country === 'EG'
                            ? '+20 100 000 0000'
                            : country === 'SA'
                            ? '+966 50 000 0000'
                            : '+971 50 000 0000'
                        }
                        className="h-12 rounded-xl bg-slate-950/80 border-white/15 text-sm font-numeric text-left"
                      />
                    </label>

                    <label htmlFor="b2b-email" className="space-y-1.5 block">
                      <span className="text-xs font-semibold text-foreground/85">
                        {text('Work Email (Optional)', 'البريد الإلكتروني (اختياري)')}
                      </span>
                      <Input
                        id="b2b-email"
                        type="email"
                        dir="ltr"
                        maxLength={254}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="partnerships@organization.com"
                        className="h-12 rounded-xl bg-slate-950/80 border-white/15 text-sm text-left"
                      />
                    </label>
                  </div>

                  {/* Occasion Selector */}
                  <div className="space-y-1.5 block">
                    <span className="text-xs font-semibold text-foreground/85">
                      {text('Occasion / Campaign', 'المناسبة المستهدفة')}
                    </span>
                    <LiquidSelect
                      id="b2b-occasion"
                      value={occasion}
                      onChange={(val) => setOccasion(val as OccasionKey)}
                      options={OCCASIONS.map((item) => ({
                        value: item.key,
                        label: isAr ? item.labelAr : item.labelEn,
                      }))}
                      triggerClassName="h-12 text-sm"
                    />
                  </div>

                  {/* Notes */}
                  <label htmlFor="b2b-notes" className="space-y-1.5 block">
                    <span className="text-xs font-semibold text-foreground/85">
                      {text('Notes / Ceremony Date / Branding Needs', 'ملاحظات إضافية أو موعد الحفل')}
                    </span>
                    <Textarea
                      id="b2b-notes"
                      maxLength={1000}
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        organizationType === 'corporate'
                          ? text(
                              'e.g. Private employee voucher links for Eid gifting, Arabic + English options, luxury gift boxes...',
                              'مثال: روابط استبدال خاصة لموظفي الشركة لهدايا العيد، نسخ عربية وإنجليزية، بوكس هدايا فاخر...'
                            )
                          : text(
                              'e.g. KG2 graduation in May, school logo on cover, bilingual Arabic & English editions...',
                              'مثال: حفل تخرج KG2 في مايو، وضع شعار الحضانة على الغلاف، قصص بالعربية والإنجليزية...'
                            )
                      }
                      className="rounded-xl bg-slate-950/80 border-white/15 text-sm resize-y"
                    />
                  </label>

                  {/* Submit CTA */}
                  <div className="pt-1 space-y-3">
                    <Button
                      type="submit"
                      className="w-full min-h-[52px] bubble-btn bubble-btn-primary text-sm sm:text-base font-bold gap-2"
                    >
                      <Send className="w-4 h-4 shrink-0" />
                      <span>
                        {text('Get Instant Reference & Proposal', 'احصل على رقم مرجعي وعرض سعر فوري')}
                      </span>
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      {text(
                        'Zero upfront obligation • Child photos are never used in ads and auto-purged after delivery.',
                        'بدون أي التزام مالي مسبق • صور الأطفال لا تُستخدم في الإعلانات وتُحذف تلقائياً بعد التسليم.'
                      )}
                    </p>
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* Bottom Catalog Bridge */}
          <section className="glass-card-inner p-6 sm:p-8 rounded-3xl border border-white/12 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-start">
              <h3 className="text-lg sm:text-xl font-bold font-editorial text-white">
                {text('Want to preview our storybook worlds first?', 'حابب تتصفح عوالم القصص المتاحة أولاً؟')}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {text(
                  'Explore our curated Arabic, English, and Bilingual catalog titles available for bulk customization.',
                  'استكشف مكتبة القصص العربية والإنجليزية المتاحة للتخصيص الكامل بأسماء الأطفال وشعار مؤسستكم.'
                )}
              </p>
            </div>
            <Link to="/stories" className="shrink-0">
              <Button
                type="button"
                variant="outline"
                className="min-h-[46px] px-6 rounded-full border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/15 hover:text-white font-bold gap-2"
              >
                <span>{text('Browse Story Catalog', 'تصفح مكتبة القصص')}</span>
                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
