import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Printer,
  Truck,
  MessageCircle,
  AlertCircle,
  ArrowRight,
  Gift,
  Package,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import {
  findOrderByReferenceOrPhone,
  getStoreConfig,
  summarizeOrderItemAddons,
  type OrderItemRecord,
  type OrderRecord,
  type OrderStatus,
} from '@/lib/localStore';
import {
  deriveAedFromSar,
  formatMoney,
  normalizeCurrencyCode,
  type CurrencyCountry,
} from '@/features/commerce/pricingEngine';

interface ProgressStepMeta {
  status: OrderStatus;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  icon: typeof Clock;
}

const PROGRESS_STEPS: ProgressStepMeta[] = [
  {
    status: 'pending_deposit',
    labelAr: 'بانتظار تأكيد العربون',
    labelEn: 'Pending Deposit',
    descAr: 'استلمنا بيانات قصتكم وبانتظار تأكيد تحويل العربون عشان نبدأ فوراً.',
    descEn: 'We received your story details and are awaiting deposit confirmation.',
    icon: Clock,
  },
  {
    status: 'deposit_confirmed',
    labelAr: 'تم تأكيد العربون',
    labelEn: 'Deposit Confirmed',
    descAr: 'تأكّد العربون بنجاح وطلبكم دخل جدول التجهيز مع فريقنا.',
    descEn: 'Deposit verified and your order is officially queued with our studio.',
    icon: CheckCircle2,
  },
  {
    status: 'in_preparation',
    labelAr: 'رسم وكتابة الحكاية',
    labelEn: 'Crafting Story & Art',
    descAr: 'فنانينا بيكتبوا المشاهد وبيرسموا ملامح بطلكم الصغير بكل حب.',
    descEn: 'Our artists are writing and illustrating your child’s adventure.',
    icon: Sparkles,
  },
  {
    status: 'draft_ready',
    labelAr: 'المسودة جاهزة للمراجعة',
    labelEn: 'Draft Ready for Review',
    descAr: 'بعتنالكم مسودة القصة على واتساب عشان تراجعوها وتوافقوا عليها قبل الطباعة.',
    descEn: 'Your full draft is ready for your review and approval on WhatsApp.',
    icon: BookOpen,
  },
  {
    status: 'sent_to_print',
    labelAr: 'الطباعة والتغليف الفاخر',
    labelEn: 'Printing & Packaging',
    descAr: 'الكتاب بيتطبع ويتغلّف بعناية فائقة تمهيداً لتسليمه لشركة الشحن.',
    descEn: 'Your keepsake book is being printed and carefully packaged for shipping.',
    icon: Printer,
  },
  {
    status: 'delivered',
    labelAr: 'تم التوصيل بنجاح',
    labelEn: 'Delivered',
    descAr: 'وصلت الحكاية بسلام! نتمنى لبطلكم أجمل أوقات القراءة والخيال.',
    descEn: 'Delivered safely! Wishing your little hero magical reading moments.',
    icon: Truck,
  },
];

const MERCH_PROGRESS_STEPS: ProgressStepMeta[] = [
  {
    status: 'pending_deposit',
    labelAr: 'بانتظار تأكيد الطلب',
    labelEn: 'Pending Confirmation',
    descAr: 'استلمنا طلب منتجات بابل فيرس وبانتظار تأكيد العربون أو بيانات الشحن.',
    descEn: 'We received your Bubbleverse merch order and are awaiting confirmation.',
    icon: Clock,
  },
  {
    status: 'deposit_confirmed',
    labelAr: 'تم تأكيد الطلب',
    labelEn: 'Order Confirmed',
    descAr: 'تم تأكيد طلبكم بنجاح وحجز القطع المختارة في مستودع بابل فيرس.',
    descEn: 'Your order is confirmed and your selected Bubbleverse items are reserved.',
    icon: CheckCircle2,
  },
  {
    status: 'in_preparation',
    labelAr: 'تجهيز وفحص المنتجات',
    labelEn: 'Preparing & Inspecting Merch',
    descAr: 'فريقنا يجهّز منتجات بابل المختارة ويفحص خامات الأمان والنعومة قطعة بقطعة.',
    descEn: 'Our team is picking and inspecting every Bub plush and merch item for safety.',
    icon: Package,
  },
  {
    status: 'draft_ready',
    labelAr: 'تغليف الهدايا ومراجعة الجودة',
    labelEn: 'Gift Wrapping & Quality Check',
    descAr: 'نغلّف الهدايا وشرائط الأسماء بعناية فائقة ونراجع الطلب بالكامل قبل الشحن.',
    descEn: 'Carefully wrapping gifts, custom name ribbons, and completing final QC.',
    icon: ShieldCheck,
  },
  {
    status: 'sent_to_print',
    labelAr: 'جاهز للشحن والتوصيل',
    labelEn: 'Packed & Out for Shipping',
    descAr: 'طردكم مغلّف بأمان وتم تسليمه لشركة الشحن في طريقه إليكم.',
    descEn: 'Your package is securely sealed and handed to our shipping courier.',
    icon: Printer,
  },
  {
    status: 'delivered',
    labelAr: 'تم التوصيل بنجاح',
    labelEn: 'Delivered',
    descAr: 'وصلت منتجات بابل بسلام! نتمنى لطفلكم أجمل أوقات اللعب والخيال.',
    descEn: 'Delivered safely! Wishing your little hero joyful playtime and cozy cuddles.',
    icon: Truck,
  },
];

const STATUS_INDEX: Record<OrderStatus, number> = {
  pending_deposit: 0,
  deposit_confirmed: 1,
  in_preparation: 2,
  draft_ready: 3,
  sent_to_print: 4,
  delivered: 5,
  cancelled: -1,
};

function isGwpItem(item: OrderItemRecord): boolean {
  return item.itemType === 'gwp_gift' || Boolean(item.isFreeGift);
}

function isMerchItem(item: OrderItemRecord): boolean {
  return !isGwpItem(item) && (item.itemType === 'merch' || item.format === 'physical_merch');
}

function isMerchOnlyOrder(order: OrderRecord): boolean {
  return order.items.length > 0 && order.items.every((i) => isMerchItem(i) || isGwpItem(i));
}

function getItemRetailValue(item: OrderItemRecord, country: CurrencyCountry): number {
  if (country === 'EG') return item.retailValueEgp ?? 0;
  if (country === 'AE') {
    return item.retailValueAed ?? (item.retailValueSar ? deriveAedFromSar(item.retailValueSar) : 0);
  }
  return item.retailValueSar ?? 0;
}

export default function TrackOrder() {
  const { language, isRTL } = useLanguage();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const [query, setQuery] = useState(initialRef);
  const [results, setResults] = useState<OrderRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialRef.trim()) {
      setResults(findOrderByReferenceOrPhone(initialRef));
      setHasSearched(true);
    }
  }, [initialRef]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchParams({ ref: trimmed });
    setResults(findOrderByReferenceOrPhone(trimmed));
    setHasSearched(true);
  };

  const storeConfig = getStoreConfig();

  const buildSupportWhatsappUrl = (order: OrderRecord) => {
    const steps = isMerchOnlyOrder(order) ? MERCH_PROGRESS_STEPS : PROGRESS_STEPS;
    const step = steps.find((s) => s.status === order.status);
    const statusText = step ? (language === 'ar' ? step.labelAr : step.labelEn) : order.status;
    const msg = encodeURIComponent(
      language === 'ar'
        ? `أهلاً فريق بابل فيرس! حابب أتابع طلبي رقم ${order.reference} (الحالة الحالية: ${statusText}).`
        : `Hi Bubbleverse team! I'd like to check in on my order ${order.reference} (Current status: ${statusText}).`
    );
    return `https://wa.me/${storeConfig.whatsappPhone.replace(/\D/g, '')}?text=${msg}`;
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <ImmersiveBackground />

      <Header />

      <main className="relative z-10 pt-24 sm:pt-28 pb-20 px-4 sm:px-6">

        <div className="bv-container-narrow space-y-8">
          {/* Calm Reassuring Page Header */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
            className="text-center space-y-3.5"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs sm:text-sm font-semibold">
              <Package className="w-5 h-5 shrink-0" />
              <span>
                {language === 'ar' ? 'متابعة حالة الطلبات مباشرة' : 'Live Order Status Tracking'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-editorial text-balance">
              {language === 'ar' ? 'تابع رحلة قصتكم خطوة بخطوة' : 'Track Your Story’s Journey'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {language === 'ar'
                ? 'اكتب رقم الطلب المرجعي أو رقم الواتساب اللي طلبت بيه عشان تشوف حكاية طفلك وصلت لحد فين.'
                : 'Enter your order reference code or the WhatsApp phone number used at checkout to see where your storybook is.'}
            </p>
          </motion.div>

          {/* Search Form */}
          <form
            onSubmit={handleSearch}
            className="glass-card p-5 sm:p-6 rounded-3xl border border-white/15 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                    isRTL ? 'right-4' : 'left-4'
                  }`}
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label={
                    language === 'ar'
                      ? 'رقم الطلب المرجعي أو رقم الواتساب'
                      : 'Order reference code or WhatsApp phone'
                  }
                  placeholder={
                    language === 'ar'
                      ? 'اكتب رقم الطلب المرجعي أو رقم الواتساب...'
                      : 'Enter reference code or WhatsApp phone...'
                  }
                  className={`h-12 bg-slate-950/90 border-white/15 rounded-2xl text-white text-sm font-numeric ${
                    isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'
                  }`}
                />
              </div>
              <Button
                type="submit"
                className="h-12 px-8 bubble-btn bubble-btn-primary text-sm font-bold shrink-0 gap-2"
              >
                <Search className="w-4 h-4" />
                <span>{language === 'ar' ? 'تتبّع الطلب' : 'Track Order'}</span>
              </Button>
            </div>
          </form>

          {/* Empty / Not Found State */}
          {hasSearched && results.length === 0 && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
              className="glass-card p-8 rounded-3xl border border-white/10 text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold font-editorial text-white">
                  {language === 'ar'
                    ? 'مالقيناش طلب مطابق للرقم ده'
                    : 'We couldn’t find a matching order'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  {language === 'ar'
                    ? 'تأكد من كتابة الرقم المرجعي بشكل صحيح، أو جرّب البحث برقم الواتساب اللي استخدمته وقت الطلب.'
                    : 'Please double-check your reference code or try searching with the WhatsApp phone number used at checkout.'}
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link to="/stories">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-6 text-xs sm:text-sm gap-2"
                  >
                    <span>
                      {language === 'ar' ? 'تصفح مكتبة القصص' : 'Explore Story Catalog'}
                    </span>
                    <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Matched Orders */}
          {results.map((order) => {
            const currentIdx = STATUS_INDEX[order.status];
            const isCancelled = order.status === 'cancelled';
            const merchOnly = isMerchOnlyOrder(order);
            const hasMerchOrGwp = order.items.some((i) => isMerchItem(i) || isGwpItem(i));
            const steps = merchOnly ? MERCH_PROGRESS_STEPS : PROGRESS_STEPS;
            const resolvedCurrency = normalizeCurrencyCode(order.currency, order.country);
            const discountAmount =
              order.discountAmount && order.discountAmount > 0 ? order.discountAmount : 0;

            return (
              <motion.div
                key={order.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                className="glass-card p-5 sm:p-8 rounded-3xl border border-white/15 shadow-2xl space-y-6"
              >
                {/* Order Top Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-white/10">
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-400">
                      {language === 'ar' ? 'رقم الطلب المرجعي' : 'Order Reference'}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        dir="ltr"
                        className="text-2xl font-extrabold text-cyan-300 font-numeric tracking-wider"
                      >
                        {order.reference}
                      </h2>
                      {(order.isGiftOrder || order.giftHidePrice) && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-200 text-xs font-bold">
                          <Gift className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            {order.giftHidePrice
                              ? language === 'ar'
                                ? 'طلب هدية (بدون أسعار)'
                                : 'Gift Order (Prices Hidden)'
                              : language === 'ar'
                                ? 'طلب هدية'
                                : 'Gift Order'}
                          </span>
                        </span>
                      )}
                      {order.promoCode && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-200 text-xs font-bold font-numeric">
                          <Tag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span dir="ltr">{order.promoCode}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300">
                      {language === 'ar'
                        ? `العميل: ${order.customerName}`
                        : `Customer: ${order.customerName}`}
                      {order.giftRecipientName ? (
                        <>
                          {' • '}
                          <span className="text-pink-200 font-semibold">
                            {language === 'ar'
                              ? `المُهدى إليه: ${order.giftRecipientName}`
                              : `Gift For: ${order.giftRecipientName}`}
                          </span>
                        </>
                      ) : null}
                      {' • '}
                      <span className="font-numeric">
                        {new Date(order.createdAt).toLocaleDateString(
                          language === 'ar' ? 'ar-EG' : 'en-US',
                          { year: 'numeric', month: 'short', day: 'numeric' }
                        )}
                      </span>
                    </p>
                  </div>

                  <div className="text-start sm:text-end space-y-1 font-numeric">
                    <p className="text-xs text-slate-400">
                      {language === 'ar' ? 'إجمالي الطلب' : 'Total Amount'}
                    </p>
                    <p className="text-lg font-extrabold text-white">
                      {formatMoney(order.totalAmount, resolvedCurrency, language)}
                    </p>
                    {discountAmount > 0 && (
                      <p className="text-xs text-emerald-300 font-semibold">
                        {language === 'ar' ? 'تم توفير: ' : 'Saved: '}
                        {formatMoney(discountAmount, resolvedCurrency, language)}
                      </p>
                    )}
                    <p className="text-xs text-cyan-300 font-semibold">
                      {language === 'ar'
                        ? `العربون: ${formatMoney(order.depositAmount, resolvedCurrency, language)}`
                        : `Deposit: ${formatMoney(order.depositAmount, resolvedCurrency, language)}`}
                    </p>
                  </div>
                </div>

                {/* Progress Stepper or Cancelled Notice */}
                {isCancelled ? (
                  <div className="p-4 rounded-2xl bg-red-950/35 border border-red-400/35 text-red-200 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                    <span>
                      {language === 'ar'
                        ? 'تم إلغاء هذا الطلب. تقدر تتواصل معنا على واتساب في أي وقت لو عندك استفسار.'
                        : 'This order has been cancelled. Reach out to us on WhatsApp anytime if you need help.'}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold font-editorial text-white">
                      {merchOnly
                        ? language === 'ar'
                          ? 'مراحل تجهيز وشحن منتجات بابل'
                          : 'Merch Preparation & Shipping Progress'
                        : hasMerchOrGwp
                          ? language === 'ar'
                            ? 'مراحل تجهيز قصتكم ومنتجات بابل'
                            : 'Story & Merch Order Progress'
                          : language === 'ar'
                            ? 'مراحل تجهيز قصتكم'
                            : 'Story Production Progress'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {steps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isCompleted = index < currentIdx;
                        const isActive = index === currentIdx;

                        return (
                          <div
                            key={step.status}
                            className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                              isActive
                                ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/10'
                                : isCompleted
                                  ? 'bg-emerald-950/25 border-emerald-400/35'
                                  : 'bg-slate-950/60 border-white/10 opacity-65'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  isActive
                                    ? 'bg-cyan-500 text-slate-950'
                                    : isCompleted
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-slate-900 text-slate-500'
                                }`}
                              >
                                <StepIcon className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-bold font-numeric text-slate-400">
                                {index + 1}/6
                              </span>
                            </div>
                            <h4
                              className={`text-sm font-bold ${
                                isActive
                                  ? 'text-cyan-300'
                                  : isCompleted
                                    ? 'text-emerald-300'
                                    : 'text-slate-300'
                              }`}
                            >
                              {language === 'ar' ? step.labelAr : step.labelEn}
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {language === 'ar' ? step.descAr : step.descEn}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-base font-bold font-editorial text-white">
                    {merchOnly
                      ? language === 'ar'
                        ? 'منتجات بابل المطلوبة'
                        : 'Ordered Bubbleverse Merch'
                      : hasMerchOrGwp
                        ? language === 'ar'
                          ? 'القصص ومنتجات بابل المطلوبة'
                          : 'Ordered Storybooks & Merch'
                        : language === 'ar'
                          ? 'القصص المطلوبة'
                          : 'Ordered Storybooks'}
                  </h3>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => {
                      const gwp = isGwpItem(item);
                      const merch = isMerchItem(item);
                      const addonSummaries = summarizeOrderItemAddons(item, language);
                      const itemTitle =
                        language === 'ar'
                          ? item.titleAr || item.titleEn
                          : item.titleEn || item.titleAr;
                      const subtitleLabel =
                        gwp || merch
                          ? language === 'ar'
                            ? item.variantLabelAr || item.formatLabelAr
                            : item.variantLabelEn || item.formatLabelEn
                          : language === 'ar'
                            ? item.formatLabelAr
                            : item.formatLabelEn;
                      const retailVal = getItemRetailValue(item, order.country);

                      return (
                        <div
                          key={`${order.id}-${idx}`}
                          className={`p-4 rounded-2xl border flex items-start sm:items-center gap-4 ${
                            gwp
                              ? 'bg-emerald-950/25 border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                              : merch
                                ? 'bg-slate-950/80 border-fuchsia-400/25'
                                : 'bg-slate-950/80 border-white/10'
                          }`}
                        >
                          <img
                            src={item.coverImage || '/merch/bub-plush-ball.jpg'}
                            alt={itemTitle}
                            loading="lazy"
                            decoding="async"
                            className={`w-14 h-16 rounded-xl object-cover border shrink-0 ${
                              gwp ? 'border-emerald-400/50' : 'border-white/10'
                            }`}
                          />
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-white truncate">{itemTitle}</h4>
                              {gwp && (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/55 text-emerald-200 text-xs font-extrabold shadow-[0_0_14px_rgba(16,185,129,0.22)]">
                                  {language === 'ar'
                                    ? '🎁 هدية كورة Bub المجانية (FREE Gift)'
                                    : '🎁 FREE Bub Plush Gift'}
                                </span>
                              )}
                              {merch && (
                                <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 text-xs font-bold">
                                  {language === 'ar' ? 'منتج براند / Merch' : 'Brand Merch'}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-cyan-300">
                              {subtitleLabel} •{' '}
                              <span className="font-numeric">×{item.quantity}</span>
                              {gwp && retailVal > 0 && (
                                <span className="text-emerald-300 font-semibold font-numeric">
                                  {' • '}
                                  {language === 'ar'
                                    ? `مجانية (بقيمة ${formatMoney(retailVal, resolvedCurrency, language)})`
                                    : `FREE (Worth ${formatMoney(retailVal, resolvedCurrency, language)})`}
                                </span>
                              )}
                            </p>

                            <div className="flex flex-wrap gap-2 text-xs pt-0.5">
                              {!gwp && !merch && item.childName && (
                                <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/15 text-purple-200 border border-purple-400/25">
                                  {language === 'ar'
                                    ? `البطل: ${item.childName}`
                                    : `Hero: ${item.childName}`}
                                </span>
                              )}
                              {(merch || gwp) && item.sku && (
                                <span
                                  dir="ltr"
                                  className="px-2.5 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/10 font-mono"
                                >
                                  SKU: {item.sku}
                                </span>
                              )}
                              {addonSummaries.map((addonLabel) => (
                                <span
                                  key={`${order.id}-${idx}-addon-${addonLabel}`}
                                  className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-200 border border-cyan-400/25 inline-flex items-center gap-1"
                                >
                                  <span>+ {addonLabel}</span>
                                </span>
                              ))}
                              {item.giftMessage && (
                                <span className="px-2.5 py-0.5 rounded-lg bg-pink-500/15 text-pink-200 border border-pink-400/25 inline-flex items-center gap-1.5">
                                  <Gift className="w-4 h-4 shrink-0" aria-hidden="true" />
                                  <span>
                                    {language === 'ar' ? 'رسالة إهداء مرفقة' : 'Dedication attached'}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* WhatsApp Support CTA */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/10">
                  <p className="text-xs sm:text-sm text-slate-300">
                    {language === 'ar'
                      ? 'عندك أي سؤال عن طلبك أو حابب تبعتلنا إيصال تحويل العربون؟'
                      : 'Have a question or want to share your deposit transfer receipt?'}
                  </p>
                  <a
                    href={buildSupportWhatsappUrl(order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-11 px-6 bubble-btn bubble-btn-emerald text-xs sm:text-sm font-bold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>
                      {language === 'ar' ? 'تواصل معنا عبر واتساب' : 'Chat on WhatsApp'}
                    </span>
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
