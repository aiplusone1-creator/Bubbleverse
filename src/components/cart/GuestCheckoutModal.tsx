import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  MessageCircle,
  Truck,
  FileText,
  CreditCard,
  User,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Search,
  AlertCircle,
  CalendarClock,
  Gift,
  Tag,
  Share2,
  Copy,
  Check,
  EyeOff,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import {
  getStoreConfig,
  incrementPromoUsage,
  saveOrder,
  triggerOrderWebhook,
  type OrderItemRecord,
  type OrderSource,
} from '@/lib/localStore';
import { savePhotoToVault } from '@/lib/photoVault';
import {
  calculateAddonTotal,
  calculateCartPricing,
  deriveAedFromSar,
  estimateDeliveryWindow,
  formatMoney,
  getCurrencyMeta,
  type CommerceItemFormat,
  type CurrencyCountry,
} from '@/features/commerce/pricingEngine';
import { evaluateGwpEligibility } from '@/features/commerce/gwpEngine';
import type { CartItem } from '@/types/cart';

const OCCASION_LABELS: Record<string, { ar: string; en: string }> = {
  birthday: { ar: 'عيد ميلاد', en: 'Birthday' },
  ramadan_eid: { ar: 'رمضان والعيد', en: 'Ramadan & Eid' },
  siblings: { ar: 'إخوة وعائلة', en: 'Siblings & Family' },
  graduation: { ar: 'تخرج ونجاح', en: 'Graduation' },
  bedtime_values: { ar: 'قيم وقبل النوم', en: 'Bedtime & Values' },
  everyday: { ar: 'مغامرة يومية', en: 'Everyday Adventure' },
};

function formatOccasion(occasion: string | undefined, language: 'ar' | 'en'): string {
  if (!occasion) return '';
  const match = OCCASION_LABELS[occasion];
  if (match) return language === 'ar' ? match.ar : match.en;
  return occasion;
}

function isMerchItem(item: CartItem): boolean {
  return item.itemType === 'merch' || (item.format === 'physical_merch' && !item.isFreeGift && item.itemType !== 'gwp_gift');
}

function isFreeGiftItem(item: CartItem): boolean {
  return Boolean(item.isFreeGift || item.itemType === 'gwp_gift');
}

function summarizeItemAddons(item: CartItem, language: 'ar' | 'en'): string[] {
  if (isMerchItem(item) || isFreeGiftItem(item)) return [];
  const parts: string[] = [];
  if (item.hasColoringBookAddon) {
    parts.push(language === 'ar' ? 'دفتر تلوين' : 'Coloring Book');
  }
  if (item.hasGiftBoxAddon) {
    parts.push(language === 'ar' ? 'علبة هدايا فاخرة' : 'Luxury Gift Box');
  }
  if (item.hasStickersAddon) {
    parts.push(language === 'ar' ? '24 ستيكر مخصص' : '24 Custom Stickers');
  }
  if (item.hasAudioStoryAddon) {
    parts.push(language === 'ar' ? 'قصة صوتية QR' : 'QR Audio Story');
  }
  if (item.hasCoHeroAddon) {
    parts.push(
      language === 'ar'
        ? `بطل مساعد${item.coHeroName ? ` (${item.coHeroName})` : ''}`
        : `Co-Hero${item.coHeroName ? ` (${item.coHeroName})` : ''}`
    );
  }
  return parts;
}

export default function GuestCheckoutModal() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const {
    items,
    isCheckoutOpen,
    closeCheckout,
    clearCart,
    checkoutItem,
    orderNotes: cartOrderNotes,
    setOrderNotes: setCartOrderNotes,
    gwpConfig,
    buildFreeGiftItem,
    promoCode,
    promoDiscountPercent,
    applyPromoCode,
    clearPromoCode,
  } = useCart();

  // Paid items being checked out (either the single direct-buy item, or the entire cart)
  const activeItems: CartItem[] = useMemo(() => {
    const base = checkoutItem ? [checkoutItem] : items;
    return base.filter((it) => !isFreeGiftItem(it));
  }, [checkoutItem, items]);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<CurrencyCountry>('EG');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isGiftOrder, setIsGiftOrder] = useState(false);
  const [giftRecipientName, setGiftRecipientName] = useState('');
  const [giftHidePrice, setGiftHidePrice] = useState(true);
  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderReceipt, setOrderReceipt] = useState<{
    reference: string;
    totalFormatted: string;
    depositFormatted: string;
    discountFormatted?: string;
    promoCodeUsed?: string;
    isGiftOrder?: boolean;
    giftRecipientName?: string;
    giftHidePrice?: boolean;
    freeGiftIncluded?: boolean;
    freeGiftTitle?: string;
    deliveryEstimateLabel: string;
    itemsCount: number;
    whatsappUrl: string;
  } | null>(null);

  // Audit Fix #5: Sync shared cart orderNotes into modal whenever checkout opens
  const prevCheckoutOpenRef = useRef(false);
  useEffect(() => {
    if (isCheckoutOpen && !prevCheckoutOpenRef.current) {
      setOrderNotes(cartOrderNotes);
    }
    prevCheckoutOpenRef.current = isCheckoutOpen;
  }, [isCheckoutOpen, cartOrderNotes]);

  const gwpStatus = useMemo(
    () => evaluateGwpEligibility(activeItems, country, gwpConfig),
    [activeItems, country, gwpConfig]
  );

  const finalItems: CartItem[] = useMemo(() => {
    if (gwpStatus.enabled && gwpStatus.unlocked) {
      return [...activeItems, buildFreeGiftItem()];
    }
    return activeItems;
  }, [activeItems, gwpStatus.enabled, gwpStatus.unlocked, buildFreeGiftItem]);

  const hasHardcoverBook = finalItems.some(
    (item) => (item.itemType ?? 'book') === 'book' && item.format === 'hardcover_book'
  );
  const hasBooks = activeItems.some(
    (item) => !isMerchItem(item) && !isFreeGiftItem(item)
  );
  const hasMerch = activeItems.some((item) => isMerchItem(item));

  const requiresPhysicalShipping = finalItems.some(
    (item) =>
      item.format === 'hardcover_book' ||
      item.format === 'physical_merch' ||
      item.itemType === 'merch' ||
      item.itemType === 'gwp_gift' ||
      item.isFreeGift
  );

  const liveStoreConfig = getStoreConfig();
  const freeShippingThreshold = Math.max(1, Math.floor(liveStoreConfig.freeShippingThreshold || 2));
  const depositPercent = liveStoreConfig.depositPercentage || 50;
  const depositRatio = depositPercent / 100;

  const currencyMeta = getCurrencyMeta(country);

  const pricing = useMemo(
    () =>
      calculateCartPricing(
        activeItems,
        country,
        promoDiscountPercent,
        freeShippingThreshold
      ),
    [activeItems, country, promoDiscountPercent, freeShippingThreshold]
  );

  const totalAmount = pricing.total;
  const depositAmount = requiresPhysicalShipping
    ? Math.round(totalAmount * depositRatio)
    : totalAmount;

  const deliveryFormat: CommerceItemFormat = hasHardcoverBook
    ? 'hardcover_book'
    : requiresPhysicalShipping
    ? 'physical_merch'
    : 'digital_pdf';

  const deliveryEstimate = useMemo(
    () => estimateDeliveryWindow(country, deliveryFormat),
    [country, deliveryFormat]
  );

  const paymentHintDisplay = useMemo(() => {
    const eg = liveStoreConfig.egyptPaymentDetails;
    const sa = liveStoreConfig.saudiPaymentDetails;
    const ae = liveStoreConfig.uaePaymentDetails;

    if (country === 'EG') {
      return language === 'ar'
        ? `مصر: إنستاباي (${eg.instapayUsername}) + فودافون كاش (${eg.vodafoneCashNumber}) — عربون ${depositPercent}% يحمي التجهيز والشحن المخصّص.`
        : `Egypt: InstaPay (${eg.instapayUsername}) + Vodafone Cash (${eg.vodafoneCashNumber}) — ${depositPercent}% deposit secures custom production & shipping.`;
    }
    if (country === 'SA') {
      return language === 'ar'
        ? `السعودية: إس تي سي باي (${sa.stcPayNumber}) + مدى / تحويل بنكي — جاهز لدعم تابي وتمارا (Tabby / Tamara).`
        : `Saudi Arabia: STC Pay (${sa.stcPayNumber}) + Mada / Bank Transfer — Tabby & Tamara installment-ready.`;
    }
    return language === 'ar'
      ? `الإمارات: أبل باي (Apple Pay) / بطاقة بنكية / تحويل بنكي${ae?.bankIban ? ` (${ae.bankIban})` : ''} — جاهز لدعم تابي وتمارا (Tabby / Tamara).`
      : `UAE: Apple Pay / Card / Bank Transfer${ae?.bankIban ? ` (${ae.bankIban})` : ''} — Tabby & Tamara installment-ready.`;
  }, [country, depositPercent, language, liveStoreConfig]);

  const handleApplyInlinePromo = () => {
    const cleaned = promoInput.trim();
    if (!cleaned) {
      setPromoFeedback({
        type: 'error',
        message:
          language === 'ar'
            ? 'اكتب كود الخصم أولاً (مثل WELCOME15 أو FRIEND15).'
            : 'Enter a promo code first (e.g. WELCOME15 or FRIEND15).',
      });
      return;
    }

    const res = applyPromoCode(cleaned);
    if (res.ok) {
      setPromoFeedback({
        type: 'success',
        message:
          language === 'ar'
            ? `تم تطبيق كود ${cleaned.toUpperCase()} بخصم ${res.percent ?? 0}%!`
            : `Promo code ${cleaned.toUpperCase()} applied (${res.percent ?? 0}% OFF)!`,
      });
      setPromoInput('');
    } else {
      setPromoFeedback({
        type: 'error',
        message:
          language === 'ar'
            ? res.reasonAr || 'كود الخصم غير صالح.'
            : res.reasonEn || 'Invalid promo code.',
      });
    }
  };

  const handleCopyReferral = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText('FRIEND15');
      }
      setReferralCopied(true);
      window.setTimeout(() => setReferralCopied(false), 2200);
    } catch {
      setReferralCopied(false);
    }
  };

  const referralShareUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://bubbleverse.app';
    const message =
      language === 'ar'
        ? `عملت لطفلي قصة مصوّرة مخصّصة باسمه وملامحه على بابل فيرس! استخدم كود FRIEND15 واحصل على خصم 15% على أول قصة لطفلك: ${origin}/stories`
        : `I just created a personalized illustrated storybook starring my child on Bubbleverse! Use code FRIEND15 for 15% OFF your first story: ${origin}/stories`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }, [language]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !phone.trim()) {
      setFormError(
        language === 'ar'
          ? 'من فضلك اكتب اسمك بالكامل ورقم الواتساب عشان نقدر نتواصل معاك ونؤكد طلبك.'
          : 'Please enter your full name and WhatsApp phone number so we can confirm your order.'
      );
      return;
    }

    if (requiresPhysicalShipping && (!city.trim() || !address.trim())) {
      setFormError(
        language === 'ar'
          ? 'من فضلك اكتب المدينة وعنوان التوصيل عشان نوصّلك طلبك (والهدايا المرفقة) لحد باب البيت.'
          : 'Please enter your city and shipping address for your physical delivery.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const storeConfig = getStoreConfig();
      const refCode = `BV-${country}-${Math.floor(100000 + Math.random() * 900000)}`;
      const appliedPromoCode = promoCode || undefined;

      // Save uploaded photos to IndexedDB vault safely & preserve all book/merch/GWP fields
      const preparedItems: OrderItemRecord[] = await Promise.all(
        finalItems.map(async (it, idx) => {
          let photoVaultId: string | undefined;
          if (!isFreeGiftItem(it) && it.photoPreview) {
            photoVaultId = `${refCode}_item_${idx}`;
            await savePhotoToVault(photoVaultId, it.photoPreview);
          }

          const resolvedItemType = isFreeGiftItem(it)
            ? 'gwp_gift'
            : isMerchItem(it)
            ? 'merch'
            : 'book';

          return {
            itemType: resolvedItemType,
            storyId: it.storyId,
            merchId: it.merchId,
            sku: it.sku,
            variantId: it.variantId,
            variantLabelAr: it.variantLabelAr,
            variantLabelEn: it.variantLabelEn,
            ribbonName: it.ribbonName,
            isFreeGift: isFreeGiftItem(it) || undefined,
            retailValueEgp: it.retailValueEgp,
            retailValueSar: it.retailValueSar,
            retailValueAed: it.retailValueAed,
            titleAr: it.titleAr,
            titleEn: it.titleEn,
            coverImage: it.coverImage,
            format: it.format,
            formatLabelAr: it.formatLabelAr,
            formatLabelEn: it.formatLabelEn,
            pagesCount: resolvedItemType === 'book' ? it.pagesCount || 15 : 0,
            childName: it.childName,
            childGender: it.childGender,
            childAge: it.childAge,
            storyLanguage: it.storyLanguage,
            giftMessage: it.giftMessage,
            hasColoringBookAddon: it.hasColoringBookAddon,
            hasGiftBoxAddon: it.hasGiftBoxAddon,
            hasStickersAddon: it.hasStickersAddon,
            hasAudioStoryAddon: it.hasAudioStoryAddon,
            hasCoHeroAddon: it.hasCoHeroAddon,
            coHeroName: it.coHeroName,
            occasion: it.occasion,
            photoVaultId,
            priceEgp: isFreeGiftItem(it) ? 0 : it.priceEgp,
            priceSar: isFreeGiftItem(it) ? 0 : it.priceSar,
            priceAed: isFreeGiftItem(it)
              ? 0
              : it.priceAed ?? deriveAedFromSar(it.priceSar),
            quantity: it.quantity,
          };
        })
      );

      // Compute canonical order source: 'mixed' | 'merch' | 'wizard' | 'catalog'
      const orderSource: OrderSource =
        hasBooks && hasMerch
          ? 'mixed'
          : hasMerch
          ? 'merch'
          : activeItems.some((i) => i.storyId === 'custom-wizard-story')
          ? 'wizard'
          : 'catalog';

      // Audit Fix #3: Always save canonical ISO currency code ('EGP' | 'SAR' | 'AED')
      const savedOrder = saveOrder({
        reference: refCode,
        customerName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        country,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        source: orderSource,
        items: preparedItems,
        totalAmount,
        depositAmount,
        currency: currencyMeta.code,
        promoCode: appliedPromoCode,
        discountAmount: pricing.totalDiscount > 0 ? pricing.totalDiscount : undefined,
        isGiftOrder: isGiftOrder || undefined,
        giftRecipientName:
          isGiftOrder && giftRecipientName.trim() ? giftRecipientName.trim() : undefined,
        giftHidePrice: isGiftOrder ? giftHidePrice : undefined,
        orderNotes: orderNotes.trim() || undefined,
      });

      if (appliedPromoCode) {
        incrementPromoUsage(appliedPromoCode);
      }

      void triggerOrderWebhook(savedOrder);

      const itemsSummary = finalItems
        .map((it) => {
          if (isFreeGiftItem(it)) {
            const worthFormatted = formatMoney(gwpStatus.retailValue, country, language);
            const freeZero = formatMoney(0, country, language);
            return language === 'ar'
              ? `• 🎁 ${it.titleAr} (${it.variantLabelAr || 'هدية مجانية'}) ×${it.quantity} — ${freeZero} مجاناً (بقيمة ${worthFormatted})`
              : `• 🎁 ${it.titleEn} (${it.variantLabelEn || 'FREE Gift'}) x${it.quantity} — ${freeZero} FREE (Worth ${worthFormatted})`;
          }

          if (isMerchItem(it)) {
            const variantSuffix =
              language === 'ar'
                ? it.variantLabelAr
                  ? ` - ${it.variantLabelAr}`
                  : ''
                : it.variantLabelEn
                ? ` - ${it.variantLabelEn}`
                : '';
            const ribbonSuffix = it.ribbonName?.trim()
              ? language === 'ar'
                ? ` | شريط الهدية: ${it.ribbonName.trim()}`
                : ` | Gift Ribbon: ${it.ribbonName.trim()}`
              : '';

            return language === 'ar'
              ? `• ${it.titleAr} (منتج براند بابل فيرس${variantSuffix}) ×${it.quantity}${ribbonSuffix}`
              : `• ${it.titleEn} (Official Merch${variantSuffix}) x${it.quantity}${ribbonSuffix}`;
          }

          const addonsList = summarizeItemAddons(it, language);
          const addonsSuffix = addonsList.length > 0 ? ` + ${addonsList.join(' + ')}` : '';
          const occasionText = formatOccasion(it.occasion, language);
          const occasionSuffix = occasionText
            ? language === 'ar'
              ? ` | المناسبة: ${occasionText}`
              : ` | Occasion: ${occasionText}`
            : '';

          return language === 'ar'
            ? `• ${it.titleAr} (${it.format === 'hardcover_book' ? 'كتاب ورقي فاخر' : 'نسخة رقمية فورية'}) ×${it.quantity} - البطل: ${it.childName}${addonsSuffix}${occasionSuffix}`
            : `• ${it.titleEn} (${it.format === 'hardcover_book' ? 'Hardcover Book' : 'Instant Digital PDF'}) x${it.quantity} - Hero: ${it.childName}${addonsSuffix}${occasionSuffix}`;
        })
        .join('\n');

      const countryNameAr = currencyMeta.countryAr;
      const countryNameEn = currencyMeta.countryEn;

      const paymentHint =
        country === 'EG'
          ? language === 'ar'
            ? `إنستاباي (${storeConfig.egyptPaymentDetails.instapayUsername}) أو فودافون كاش (${storeConfig.egyptPaymentDetails.vodafoneCashNumber})`
            : `InstaPay (${storeConfig.egyptPaymentDetails.instapayUsername}) or Vodafone Cash (${storeConfig.egyptPaymentDetails.vodafoneCashNumber})`
          : country === 'SA'
          ? language === 'ar'
            ? `إس تي سي باي (${storeConfig.saudiPaymentDetails.stcPayNumber}) أو مدى / التحويل البنكي (Tabby / Tamara ready)`
            : `STC Pay (${storeConfig.saudiPaymentDetails.stcPayNumber}) or Mada / Bank Transfer (Tabby / Tamara ready)`
          : language === 'ar'
          ? `أبل باي (Apple Pay) / بطاقة بنكية / التحويل البنكي${storeConfig.uaePaymentDetails?.bankIban ? ` (${storeConfig.uaePaymentDetails.bankIban})` : ''} (Tabby / Tamara ready)`
          : `Apple Pay / Card / Bank Transfer${storeConfig.uaePaymentDetails?.bankIban ? ` (${storeConfig.uaePaymentDetails.bankIban})` : ''} (Tabby / Tamara ready)`;

      const giftLinesAr = isGiftOrder
        ? `*طلب هدية:* نعم${giftRecipientName.trim() ? ` (المُهدى إليه: ${giftRecipientName.trim()})` : ''}\n` +
          `*إخفاء السعر من الفاتورة:* ${giftHidePrice ? 'نعم' : 'لا'}\n`
        : '';

      const giftLinesEn = isGiftOrder
        ? `*Gift Order:* Yes${giftRecipientName.trim() ? ` (Recipient: ${giftRecipientName.trim()})` : ''}\n` +
          `*Hide Price on Packing Slip:* ${giftHidePrice ? 'Yes' : 'No'}\n`
        : '';

      const discountLinesAr = [
        pricing.volumeDiscountAmount > 0
          ? `*خصم باقة الإخوة (${pricing.volumeDiscountPercent}%):* -${formatMoney(pricing.volumeDiscountAmount, country, 'ar')}`
          : '',
        appliedPromoCode && pricing.promoDiscountAmount > 0
          ? `*كود الخصم (${appliedPromoCode} - ${pricing.promoDiscountPercent}%):* -${formatMoney(pricing.promoDiscountAmount, country, 'ar')}`
          : '',
        pricing.freeShippingUnlocked && requiresPhysicalShipping ? `*الشحن:* شحن سريع مجاني` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const discountLinesEn = [
        pricing.volumeDiscountAmount > 0
          ? `*Sibling Bundle Discount (${pricing.volumeDiscountPercent}%):* -${formatMoney(pricing.volumeDiscountAmount, country, 'en')}`
          : '',
        appliedPromoCode && pricing.promoDiscountAmount > 0
          ? `*Promo Code (${appliedPromoCode} - ${pricing.promoDiscountPercent}%):* -${formatMoney(pricing.promoDiscountAmount, country, 'en')}`
          : '',
        pricing.freeShippingUnlocked && requiresPhysicalShipping ? `*Shipping:* FREE Fast Shipping` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const totalFormattedAr = formatMoney(totalAmount, country, 'ar');
      const depositFormattedAr = formatMoney(depositAmount, country, 'ar');
      const totalFormattedEn = formatMoney(totalAmount, country, 'en');
      const depositFormattedEn = formatMoney(depositAmount, country, 'en');

      const rawWhatsappMessage =
        language === 'ar'
          ? `أهلاً فريق بابل فيرس!\n` +
            `حابب أؤكد طلبي من بابل فيرس:\n\n` +
            `*رقم التتبّع والطلب:* ${refCode}\n` +
            `*الاسم:* ${fullName.trim()}\n` +
            `*الهاتف:* ${phone.trim()}\n` +
            (email.trim() ? `*البريد:* ${email.trim()}\n` : '') +
            `*الدولة:* ${countryNameAr}\n` +
            `*التوصيل المتوقع:* ${deliveryEstimate.labelAr}\n` +
            (requiresPhysicalShipping ? `*العنوان:* ${city.trim()} - ${address.trim()}\n` : '') +
            giftLinesAr +
            (orderNotes.trim() ? `*ملاحظات:* ${orderNotes.trim()}\n` : '') +
            `\n*تفاصيل الطلب:*\n${itemsSummary}\n\n` +
            (discountLinesAr ? `${discountLinesAr}\n` : '') +
            `*إجمالي الطلب النهائي:* ${totalFormattedAr}\n` +
            `*العربون المطلوب للبدء:* ${depositFormattedAr}\n\n` +
            `جاهز لتحويل العربون عبر: ${paymentHint}.`
          : `Hi Bubbleverse team!\n` +
            `I'd like to confirm my Bubbleverse order:\n\n` +
            `*Order Reference:* ${refCode}\n` +
            `*Name:* ${fullName.trim()}\n` +
            `*Phone:* ${phone.trim()}\n` +
            (email.trim() ? `*Email:* ${email.trim()}\n` : '') +
            `*Country:* ${countryNameEn}\n` +
            `*Estimated Delivery:* ${deliveryEstimate.labelEn}\n` +
            (requiresPhysicalShipping ? `*Address:* ${city.trim()} - ${address.trim()}\n` : '') +
            giftLinesEn +
            (orderNotes.trim() ? `*Notes:* ${orderNotes.trim()}\n` : '') +
            `\n*Order Details:*\n${itemsSummary}\n\n` +
            (discountLinesEn ? `${discountLinesEn}\n` : '') +
            `*Final Order Total:* ${totalFormattedEn}\n` +
            `*Deposit to Start:* ${depositFormattedEn}\n\n` +
            `Ready to transfer deposit via: ${paymentHint}.`;

      const waPhoneClean =
        storeConfig.whatsappPhone.replace(/[^\d]/g, '') || '201000000000';
      const waLink = `https://wa.me/${waPhoneClean}?text=${encodeURIComponent(rawWhatsappMessage)}`;

      setOrderReceipt({
        reference: refCode,
        totalFormatted: formatMoney(totalAmount, country, language),
        depositFormatted: formatMoney(depositAmount, country, language),
        discountFormatted:
          pricing.totalDiscount > 0
            ? `-${formatMoney(pricing.totalDiscount, country, language)}`
            : undefined,
        promoCodeUsed: appliedPromoCode,
        isGiftOrder,
        giftRecipientName: giftRecipientName.trim() || undefined,
        giftHidePrice: isGiftOrder ? giftHidePrice : undefined,
        freeGiftIncluded: gwpStatus.enabled && gwpStatus.unlocked,
        freeGiftTitle: language === 'ar' ? gwpConfig.titleAr : gwpConfig.titleEn,
        deliveryEstimateLabel:
          language === 'ar' ? deliveryEstimate.labelAr : deliveryEstimate.labelEn,
        itemsCount: finalItems.length,
        whatsappUrl: waLink,
      });

      if (!checkoutItem) {
        clearCart();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    setFormError(null);
    setPromoFeedback(null);
    setOrderReceipt(null);
    closeCheckout();
  }, [closeCheckout]);

  useEffect(() => {
    if (!isCheckoutOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckoutOpen, handleClose]);

  const phonePlaceholder =
    country === 'EG'
      ? '+20 10...'
      : country === 'SA'
      ? '+966 5...'
      : '+971 5...';

  const cityPlaceholder =
    country === 'EG'
      ? language === 'ar'
        ? 'مثال: القاهرة أو الإسكندرية'
        : 'e.g. Cairo or Alexandria'
      : country === 'SA'
      ? language === 'ar'
        ? 'مثال: الرياض أو جدة'
        : 'e.g. Riyadh or Jeddah'
      : language === 'ar'
      ? 'مثال: دبي أو أبوظبي'
      : 'e.g. Dubai or Abu Dhabi';

  return (
    <AnimatePresence>
      {isCheckoutOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={language === 'ar' ? 'إتمام الطلب كزائر' : 'Guest Checkout'}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Window */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-auto text-foreground max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label={language === 'ar' ? 'إغلاق نافذة الطلب' : 'Close checkout'}
              className={`absolute top-5 ${
                isRTL ? 'left-5' : 'right-5'
              } min-w-[40px] min-h-[40px] p-2.5 rounded-full bg-slate-800/90 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center`}
            >
              <X className="w-4 h-4" />
            </button>

            {!orderReceipt ? (
              <div className="space-y-6">
                {/* Calm, Reassuring Header */}
                <div className="text-center space-y-2 pt-1">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold">
                    <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>
                      {language === 'ar'
                        ? 'طلب سريع بدون تسجيل حساب'
                        : 'Calm Guest Checkout — No Account Needed'}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold font-editorial text-white">
                    {hasBooks
                      ? language === 'ar'
                        ? 'تأكيد طلب حكايتكم'
                        : 'Complete Your Story Order'
                      : language === 'ar'
                      ? 'تأكيد طلب منتجات بابل فيرس'
                      : 'Complete Your Bubbleverse Order'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                    {hasBooks
                      ? language === 'ar'
                        ? 'اكتب بيانات التواصل والتوصيل، وفريق بابل فيرس هيجهّز القصة ويبعتلك المسودة تراجعها قبل الطباعة.'
                        : 'Share your contact and delivery details — our studio will craft your book and send the full draft for your approval.'
                      : language === 'ar'
                      ? 'اكتب بيانات التواصل والتوصيل، وفريق بابل فيرس هيجهّز منتجاتك بتغليف هدايا فاخر وشحن سريع.'
                      : 'Share your contact and delivery details — our team will gift-pack and dispatch your Bubbleverse merch quickly.'}
                  </p>
                </div>

                {/* Order Items Preview Card (Includes Books + Merch + Auto-Added Free Bub GWP) */}
                <div className="bg-slate-950/80 rounded-2xl border border-white/10 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 pb-2.5 border-b border-white/10">
                    <span>
                      {hasBooks && hasMerch
                        ? language === 'ar'
                          ? 'القصص والمنتجات المختارة:'
                          : 'Selected Stories & Merch:'
                        : hasMerch
                        ? language === 'ar'
                          ? 'منتجات براند بابل فيرس:'
                          : 'Selected Official Merch:'
                        : language === 'ar'
                        ? 'القصص المختارة:'
                        : 'Selected Stories:'}
                    </span>
                    <span className="text-cyan-300 font-bold font-numeric">
                      {finalItems.reduce((sum, it) => sum + it.quantity, 0)}{' '}
                      {language === 'ar'
                        ? finalItems.reduce((sum, it) => sum + it.quantity, 0) === 1
                          ? 'قطعة'
                          : 'قطع'
                        : finalItems.reduce((sum, it) => sum + it.quantity, 0) === 1
                        ? 'item'
                        : 'items'}
                      {gwpStatus.enabled && gwpStatus.unlocked
                        ? language === 'ar'
                          ? ' (شامل هدية Bub)'
                          : ' (incl. FREE Bub)'
                        : ''}
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-52 overflow-y-auto pe-1">
                    {finalItems.map((it) => {
                      const isGift = isFreeGiftItem(it);
                      const isMerch = isMerchItem(it);

                      if (isGift) {
                        const worthFormatted = formatMoney(gwpStatus.retailValue, country, language);
                        const zeroFormatted = formatMoney(0, country, language);
                        return (
                          <div
                            key={it.id}
                            data-testid="checkout-free-gwp-item"
                            className="flex items-center justify-between gap-3 text-xs rounded-xl bg-emerald-950/45 border border-emerald-400/40 p-2.5 text-emerald-100"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={it.coverImage || '/placeholder.svg'}
                                alt={language === 'ar' ? it.titleAr : it.titleEn}
                                className="w-10 h-10 rounded-xl object-cover border border-emerald-300/45 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-white truncate flex items-center gap-1.5">
                                  <span className="truncate">
                                    🎁 {language === 'ar' ? it.titleAr : it.titleEn}
                                  </span>
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/35 text-emerald-200 text-[10px] font-extrabold font-numeric shrink-0">
                                    <Lock className="w-2.5 h-2.5" />
                                    <span dir="ltr">×{it.quantity}</span>
                                  </span>
                                </p>
                                <p className="text-[11px] text-emerald-200/90 truncate">
                                  {language === 'ar'
                                    ? it.variantLabelAr || 'هدية مجانية مضافة تلقائياً'
                                    : it.variantLabelEn || 'Auto-added complimentary gift'}
                                </p>
                              </div>
                            </div>
                            <div className="text-end font-numeric shrink-0">
                              <span className="font-extrabold text-emerald-300 block">
                                {zeroFormatted}
                              </span>
                              <span className="text-[10px] text-slate-400 line-through block">
                                {worthFormatted}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      const baseUnit =
                        country === 'EG'
                          ? it.priceEgp
                          : country === 'SA'
                          ? it.priceSar
                          : it.priceAed ?? deriveAedFromSar(it.priceSar);
                      const addonUnit = isMerch ? 0 : calculateAddonTotal(it, country);
                      const lineTotal = (baseUnit + addonUnit) * it.quantity;
                      const addonsList = summarizeItemAddons(it, language);
                      const occasionText = formatOccasion(it.occasion, language);

                      return (
                        <div
                          key={it.id}
                          className="flex items-center justify-between gap-3 text-xs text-slate-200"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={it.coverImage}
                              alt={language === 'ar' ? it.titleAr : it.titleEn}
                              className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">
                                {language === 'ar' ? it.titleAr : it.titleEn}
                                {it.quantity > 1 && (
                                  <span className="text-cyan-300 font-numeric ms-1.5">
                                    ×{it.quantity}
                                  </span>
                                )}
                              </p>
                              {isMerch ? (
                                <p className="text-xs text-cyan-200/80 truncate">
                                  {language === 'ar' ? 'منتج براند' : 'Official Merch'}
                                  {(it.variantLabelAr || it.variantLabelEn) &&
                                    ` • ${
                                      language === 'ar'
                                        ? it.variantLabelAr || it.variantLabelEn
                                        : it.variantLabelEn || it.variantLabelAr
                                    }`}
                                  {it.ribbonName?.trim() &&
                                    ` • ${
                                      language === 'ar' ? 'شريط: ' : 'Ribbon: '
                                    }${it.ribbonName.trim()}`}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400 truncate">
                                  {language === 'ar' ? 'البطل: ' : 'Hero: '}
                                  <bdi>{it.childName}</bdi>
                                  {addonsList.length > 0 && ` • +${addonsList.join(' + ')}`}
                                  {occasionText && ` • ${occasionText}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-cyan-300 font-numeric shrink-0">
                            {formatMoney(lineTotal, country, language)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Persistent Inline Error Banner */}
                {formError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-2xl bg-red-950/40 border border-red-400/40 text-red-200 text-xs sm:text-sm flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Checkout Form */}
                <form onSubmit={handlePlaceOrder} noValidate className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 3-Country Selector (EG / SA / AE) */}
                    <div className="space-y-2 sm:col-span-2">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-purple-400 shrink-0" />
                        <span>
                          {language === 'ar'
                            ? 'دولة التوصيل والعملة (مصر / السعودية / الإمارات)'
                            : 'Delivery & Payment Country (EG / SA / AE)'}
                        </span>
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {(['EG', 'SA', 'AE'] as const).map((code) => {
                          const meta = getCurrencyMeta(code);
                          const isSelected = country === code;
                          return (
                            <button
                              key={code}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => setCountry(code)}
                              className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-600/25 border-purple-400 text-white shadow-md'
                                  : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white hover:border-white/25'
                              }`}
                            >
                              <span>
                                {language === 'ar'
                                  ? `${meta.countryAr} (${meta.labelAr})`
                                  : `${meta.countryEn} (${meta.code})`}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Live Delivery Date Estimate Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cyan-950/35 border border-cyan-400/25 px-3.5 py-2.5 text-xs">
                        <span className="flex items-center gap-2 text-cyan-200 font-semibold">
                          <CalendarClock className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>
                            {requiresPhysicalShipping
                              ? language === 'ar'
                                ? `التوصيل المتوقع: ${deliveryEstimate.labelAr}`
                                : `Estimated Delivery: ${deliveryEstimate.labelEn}`
                              : language === 'ar'
                              ? `التسليم الرقمي المتوقع: ${deliveryEstimate.labelAr}`
                              : `Estimated Digital Delivery: ${deliveryEstimate.labelEn}`}
                          </span>
                        </span>

                        {requiresPhysicalShipping && pricing.freeShippingUnlocked && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-emerald-200 text-[11px] font-bold">
                            {language === 'ar' ? 'شحن سريع مجاني' : 'FREE Fast Shipping'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="checkout-full-name"
                        className="text-xs font-semibold text-slate-200 flex items-center gap-2"
                      >
                        <User className="w-5 h-5 text-purple-400 shrink-0" />
                        <span>
                          {language === 'ar' ? 'اسم ولي الأمر بالكامل *' : 'Parent Full Name *'}
                        </span>
                      </label>
                      <Input
                        id="checkout-full-name"
                        required
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        placeholder={language === 'ar' ? 'مثال: أحمد عبد الله' : 'e.g. Ahmed Abdullah'}
                        className="bg-slate-950/90 border-white/15 rounded-xl text-white text-sm h-11"
                      />
                    </div>

                    {/* WhatsApp Phone */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="checkout-phone"
                        className="text-xs font-semibold text-slate-200 flex items-center gap-2"
                      >
                        <Phone className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>
                          {language === 'ar' ? 'رقم الواتساب للتواصل *' : 'WhatsApp Phone *'}
                        </span>
                      </label>
                      <Input
                        id="checkout-phone"
                        required
                        type="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        placeholder={phonePlaceholder}
                        className="bg-slate-950/90 border-white/15 rounded-xl text-white text-sm h-11 font-numeric"
                      />
                    </div>

                    {/* Email (Optional) */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label
                        htmlFor="checkout-email"
                        className="text-xs font-semibold text-slate-200 flex items-center gap-2"
                      >
                        <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                        <span>
                          {language === 'ar'
                            ? 'البريد الإلكتروني لاستلام الإيصال والنسخة الرقمية (اختياري)'
                            : 'Email Address for Receipt & Digital Copy (Optional)'}
                        </span>
                      </label>
                      <Input
                        id="checkout-email"
                        type="email"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="parent@example.com"
                        className="bg-slate-950/90 border-white/15 rounded-xl text-white text-sm h-11"
                      />
                    </div>

                    {/* Physical Address Fields (hardcover book, merch, OR free physical Bub GWP gift) */}
                    {requiresPhysicalShipping && (
                      <>
                        <div className="space-y-1.5">
                          <label
                            htmlFor="checkout-city"
                            className="text-xs font-semibold text-slate-200 flex items-center gap-2"
                          >
                            <MapPin className="w-5 h-5 text-pink-400 shrink-0" />
                            <span>
                              {language === 'ar' ? 'المحافظة / المدينة *' : 'City / Governorate *'}
                            </span>
                          </label>
                          <Input
                            id="checkout-city"
                            required
                            value={city}
                            onChange={(e) => {
                              setCity(e.target.value);
                              if (formError) setFormError(null);
                            }}
                            placeholder={cityPlaceholder}
                            className="bg-slate-950/90 border-white/15 rounded-xl text-white text-sm h-11"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="checkout-address"
                            className="text-xs font-semibold text-slate-200 flex items-center gap-2"
                          >
                            <MapPin className="w-5 h-5 text-pink-400 shrink-0" />
                            <span>
                              {language === 'ar'
                                ? 'عنوان التوصيل بالتفصيل *'
                                : 'Detailed Shipping Address *'}
                            </span>
                          </label>
                          <Input
                            id="checkout-address"
                            required
                            value={address}
                            onChange={(e) => {
                              setAddress(e.target.value);
                              if (formError) setFormError(null);
                            }}
                            placeholder={
                              language === 'ar'
                                ? 'اسم الشارع، رقم العمارة والشقة'
                                : 'Street name, building no., apt'
                            }
                            className="bg-slate-950/90 border-white/15 rounded-xl text-white text-sm h-11"
                          />
                        </div>
                      </>
                    )}

                    {/* Ready-to-Gift Mode Toggle */}
                    <div className="sm:col-span-2 rounded-2xl bg-slate-950/80 border border-pink-400/25 p-4 space-y-3">
                      <label
                        htmlFor="checkout-gift-mode"
                        className="min-h-[40px] flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-400/30 text-pink-300 flex items-center justify-center shrink-0">
                            <Gift className="w-5 h-5" />
                          </span>
                          <span className="space-y-0.5">
                            <span className="text-xs sm:text-sm font-bold text-white block">
                              {language === 'ar'
                                ? 'هذا الطلب هدية لشخص آخر'
                                : 'Sending as a Gift'}
                            </span>
                            <span className="text-xs text-slate-400 block">
                              {language === 'ar'
                                ? 'أضف اسم المُهدى إليه وأخفِ السعر من فاتورة الطرد مجاناً'
                                : 'Add recipient name & hide pricing on the packing slip'}
                            </span>
                          </span>
                        </span>

                        <input
                          id="checkout-gift-mode"
                          type="checkbox"
                          checked={isGiftOrder}
                          onChange={(e) => setIsGiftOrder(e.target.checked)}
                          className="w-5 h-5 rounded accent-pink-500 cursor-pointer shrink-0"
                        />
                      </label>

                      {isGiftOrder && (
                        <div className="pt-2.5 border-t border-white/10 space-y-3">
                          <div className="space-y-1.5">
                            <label
                              htmlFor="checkout-gift-recipient"
                              className="text-xs font-semibold text-pink-200 block"
                            >
                              {language === 'ar'
                                ? 'اسم المُهدى إليه (اختياري)'
                                : 'Gift Recipient Name (Optional)'}
                            </label>
                            <Input
                              id="checkout-gift-recipient"
                              value={giftRecipientName}
                              onChange={(e) => setGiftRecipientName(e.target.value)}
                              placeholder={
                                language === 'ar'
                                  ? 'مثال: عائلة سارة / بطلنا الصغير عمر'
                                  : 'e.g. Sarah’s family / Little Hero Omar'
                              }
                              className="bg-slate-900 border-pink-400/25 rounded-xl text-white text-sm h-11"
                            />
                          </div>

                          <label
                            htmlFor="checkout-gift-hide-price"
                            className="min-h-[40px] flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 cursor-pointer"
                          >
                            <input
                              id="checkout-gift-hide-price"
                              type="checkbox"
                              checked={giftHidePrice}
                              onChange={(e) => setGiftHidePrice(e.target.checked)}
                              className="w-4 h-4 rounded accent-cyan-400 cursor-pointer shrink-0"
                            />
                            <EyeOff className="w-4 h-4 text-cyan-300 shrink-0" />
                            <span>
                              {language === 'ar'
                                ? 'إخفاء السعر من الفاتورة داخل الطرد'
                                : 'Hide price on packing slip'}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Promo Code Display / Inline Apply Row */}
                    <div className="sm:col-span-2 rounded-2xl bg-slate-950/80 border border-white/10 p-3.5 space-y-2">
                      <label
                        htmlFor="checkout-promo-input"
                        className="text-xs font-semibold text-slate-200 flex items-center gap-2"
                      >
                        <Tag className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>
                          {language === 'ar' ? 'كود الخصم' : 'Promo Code'}
                        </span>
                      </label>

                      {promoCode ? (
                        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-950/35 border border-emerald-400/35 px-3 py-2 text-xs">
                          <span className="flex items-center gap-2 text-emerald-200 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>
                              <span dir="ltr" className="font-numeric font-extrabold">
                                {promoCode}
                              </span>{' '}
                              (
                              {language === 'ar'
                                ? `خصم ${promoDiscountPercent}% مفعّل`
                                : `${promoDiscountPercent}% OFF active`}
                              )
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              clearPromoCode();
                              setPromoFeedback(null);
                            }}
                            aria-label={language === 'ar' ? 'إزالة كود الخصم' : 'Remove promo code'}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            id="checkout-promo-input"
                            value={promoInput}
                            onChange={(e) => {
                              setPromoInput(e.target.value);
                              if (promoFeedback) setPromoFeedback(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyInlinePromo();
                              }
                            }}
                            dir="ltr"
                            placeholder="WELCOME15 / FRIEND15"
                            className="h-11 bg-slate-900 border-white/15 rounded-xl text-xs sm:text-sm text-white uppercase font-numeric"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleApplyInlinePromo}
                            className="h-11 px-4 rounded-xl border-cyan-400/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-xs font-bold shrink-0"
                          >
                            {language === 'ar' ? 'تطبيق' : 'Apply'}
                          </Button>
                        </div>
                      )}

                      {promoFeedback && (
                        <p
                          role={promoFeedback.type === 'error' ? 'alert' : 'status'}
                          className={`text-xs flex items-center gap-1.5 ${
                            promoFeedback.type === 'error'
                              ? 'text-red-300'
                              : 'text-emerald-300'
                          }`}
                        >
                          {promoFeedback.type === 'error' ? (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          )}
                          <span>{promoFeedback.message}</span>
                        </p>
                      )}
                    </div>

                    {/* Optional Notes */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label
                        htmlFor="checkout-notes"
                        className="text-xs font-semibold text-slate-200 flex items-center gap-2"
                      >
                        <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                        <span>
                          {language === 'ar'
                            ? 'ملاحظات إضافية للطلب (اختياري)'
                            : 'Order Notes (Optional)'}
                        </span>
                      </label>
                      <Textarea
                        id="checkout-notes"
                        rows={2}
                        value={orderNotes}
                        onChange={(e) => {
                          const next = e.target.value;
                          setOrderNotes(next);
                          if (!checkoutItem) {
                            setCartOrderNotes(next);
                          }
                        }}
                        placeholder={
                          language === 'ar'
                            ? 'أي ملاحظة عن موعد التسليم أو تفاصيل القصة...'
                            : 'Any special delivery date or story preferences...'
                        }
                        className="bg-slate-950/90 border-white/15 rounded-xl text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Price, Discounts & Deposit Summary */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/50 to-cyan-950/50 border border-white/15 space-y-2.5">
                    {pricing.totalDiscount > 0 && (
                      <div className="flex justify-between items-center text-xs text-slate-400 font-numeric">
                        <span>{language === 'ar' ? 'المجموع قبل الخصم:' : 'Subtotal:'}</span>
                        <span className="line-through">
                          {formatMoney(pricing.subtotal, country, language)}
                        </span>
                      </div>
                    )}

                    {pricing.volumeDiscountAmount > 0 && (
                      <div className="flex justify-between items-center text-xs text-emerald-300 font-semibold font-numeric">
                        <span>
                          {language === 'ar'
                            ? `خصم باقة الإخوة (${pricing.volumeDiscountPercent}%):`
                            : `Sibling Bundle Discount (${pricing.volumeDiscountPercent}%):`}
                        </span>
                        <span>
                          -{formatMoney(pricing.volumeDiscountAmount, country, language)}
                        </span>
                      </div>
                    )}

                    {promoCode && pricing.promoDiscountAmount > 0 && (
                      <div className="flex justify-between items-center text-xs text-cyan-300 font-semibold font-numeric">
                        <span>
                          {language === 'ar'
                            ? `كود الخصم (${promoCode} - ${pricing.promoDiscountPercent}%):`
                            : `Promo Code (${promoCode} - ${pricing.promoDiscountPercent}%):`}
                        </span>
                        <span>
                          -{formatMoney(pricing.promoDiscountAmount, country, language)}
                        </span>
                      </div>
                    )}

                    {gwpStatus.enabled && gwpStatus.unlocked && (
                      <div className="flex justify-between items-center text-xs text-emerald-300 font-semibold">
                        <span>
                          {language === 'ar'
                            ? '🎁 هدية كورة Bub القطيفة (مضافة تلقائياً):'
                            : '🎁 Official Bub Plush Ball (Auto-Added):'}
                        </span>
                        <span className="font-numeric">
                          {formatMoney(0, country, language)}{' '}
                          <span className="text-slate-400 line-through text-[11px]">
                            {formatMoney(gwpStatus.retailValue, country, language)}
                          </span>
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs sm:text-sm text-slate-200 pt-1 border-t border-white/10">
                      <span className="font-semibold">
                        {language === 'ar' ? 'إجمالي الطلب النهائي:' : 'Final Order Total:'}
                      </span>
                      <span className="font-extrabold text-base text-white font-numeric">
                        {formatMoney(totalAmount, country, language)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-cyan-300 font-semibold font-numeric">
                        {requiresPhysicalShipping
                          ? language === 'ar'
                            ? `العربون المطلوب لبدء التجهيز (${depositPercent}%):`
                            : `Deposit to Start Order (${depositPercent}%):`
                          : language === 'ar'
                          ? 'المبلغ المطلوب لتجهيز النسخة الرقمية:'
                          : 'Total for Digital Delivery:'}
                      </span>
                      <span className="font-extrabold text-base text-cyan-300 font-numeric">
                        {formatMoney(depositAmount, country, language)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 pt-2 border-t border-white/10 leading-relaxed">
                      {paymentHintDisplay}
                    </p>
                  </div>

                  {/* Submit Order Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bubble-btn bubble-btn-primary text-sm font-bold gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? language === 'ar'
                          ? 'جاري تسجيل طلبك...'
                          : 'Saving Your Order...'
                        : language === 'ar'
                        ? 'تأكيد الطلب واستخراج رقم التتبّع'
                        : 'Confirm Order & Get Tracking Code'}
                    </span>
                  </Button>
                </form>
              </div>
            ) : (
              /* Order Confirmation & Receipt Screen */
              <div className="text-center space-y-5 py-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-400/35 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-extrabold font-editorial text-white">
                    {language === 'ar' ? 'استلمنا طلبكم بنجاح!' : 'Order Received Successfully!'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    {language === 'ar'
                      ? 'حفظنا كل تفاصيل طلبكم بأمان. آخر خطوة بسيطة هي تأكيد الطلب وتحويل العربون عبر واتساب.'
                      : 'Your order details are safely saved. One quick final step: confirm your order and deposit via WhatsApp.'}
                  </p>
                </div>

                {/* Receipt Summary Card */}
                <div className="p-5 rounded-2xl bg-slate-950/90 border border-white/10 text-start space-y-2.5 max-w-md mx-auto text-xs sm:text-sm">
                  <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
                    <span className="text-slate-400">
                      {language === 'ar' ? 'رقم الطلب المرجعي:' : 'Reference Number:'}
                    </span>
                    <span
                      dir="ltr"
                      className="font-extrabold text-cyan-300 text-sm sm:text-base font-numeric tracking-wider"
                    >
                      {orderReceipt.reference}
                    </span>
                  </div>

                  {orderReceipt.discountFormatted && (
                    <div className="flex justify-between items-center text-emerald-300 font-semibold">
                      <span>
                        {language === 'ar'
                          ? `إجمالي التوفير${orderReceipt.promoCodeUsed ? ` (${orderReceipt.promoCodeUsed})` : ''}:`
                          : `Total Savings${orderReceipt.promoCodeUsed ? ` (${orderReceipt.promoCodeUsed})` : ''}:`}
                      </span>
                      <span className="font-bold font-numeric">
                        {orderReceipt.discountFormatted}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">
                      {language === 'ar' ? 'إجمالي الطلب:' : 'Order Total:'}
                    </span>
                    <span className="font-bold text-white font-numeric">
                      {orderReceipt.totalFormatted}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-cyan-300 font-semibold">
                    <span>
                      {language === 'ar' ? 'العربون المطلوب للبدء:' : 'Deposit to Begin:'}
                    </span>
                    <span className="font-bold font-numeric">{orderReceipt.depositFormatted}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-300 pt-2 border-t border-white/10">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <CalendarClock className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{language === 'ar' ? 'التسليم المتوقع:' : 'Est. Delivery:'}</span>
                    </span>
                    <span className="font-semibold text-end">
                      {orderReceipt.deliveryEstimateLabel}
                    </span>
                  </div>

                  {orderReceipt.freeGiftIncluded && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-xs text-emerald-300 font-semibold">
                      <Gift className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        {language === 'ar'
                          ? `🎁 شاملة هدية مجانية: ${orderReceipt.freeGiftTitle || 'كورة Bub القطيفة'}`
                          : `🎁 Includes FREE Gift: ${orderReceipt.freeGiftTitle || 'Official Bub Plush Ball'}`}
                      </span>
                    </div>
                  )}

                  {orderReceipt.isGiftOrder && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-xs text-pink-200">
                      <Gift className="w-4 h-4 text-pink-400 shrink-0" />
                      <span>
                        {language === 'ar'
                          ? `طلب هدية${orderReceipt.giftRecipientName ? ` لـ ${orderReceipt.giftRecipientName}` : ''}${orderReceipt.giftHidePrice ? ' • بدون إظهار السعر' : ''}`
                          : `Gift order${orderReceipt.giftRecipientName ? ` for ${orderReceipt.giftRecipientName}` : ''}${orderReceipt.giftHidePrice ? ' • Price hidden' : ''}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary WhatsApp Confirmation CTA */}
                <div className="space-y-3 max-w-md mx-auto">
                  <a
                    href={orderReceipt.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 h-12 bubble-btn bubble-btn-emerald text-sm font-bold shadow-xl shadow-emerald-950/40"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>
                      {language === 'ar'
                        ? 'تأكيد الطلب ودفع العربون عبر واتساب'
                        : 'Confirm Order & Pay Deposit on WhatsApp'}
                    </span>
                  </a>

                  {/* Post-Order Viral Referral Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/65 via-slate-950/90 to-pink-950/55 border border-pink-400/30 text-start space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/35 text-pink-300 flex items-center justify-center shrink-0">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                          {language === 'ar'
                            ? 'شارك صديقك كود FRIEND15 لخصم 15% على أول قصة!'
                            : 'Share code FRIEND15 with a friend for 15% OFF their first story!'}
                        </p>
                        <p className="text-xs text-slate-300">
                          {language === 'ar'
                            ? 'أرسل الكود لأي أم أو أب يحبوا يهدوا طفلهم حكاية باسمه.'
                            : 'Send this code to another parent so their little hero gets 15% off too.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyReferral}
                        className="min-h-[44px] flex-1 px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15 hover:border-cyan-400/45 text-xs font-bold text-cyan-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        {referralCopied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>{language === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-cyan-300" />
                            <span dir="ltr" className="font-numeric tracking-wider">
                              FRIEND15
                            </span>
                          </>
                        )}
                      </button>

                      <a
                        href={referralShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] flex-1 px-3.5 py-2 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/35 border border-emerald-400/40 text-xs font-bold text-emerald-200 inline-flex items-center justify-center gap-2 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                        <span>
                          {language === 'ar' ? 'مشاركة عبر واتساب' : 'Share on WhatsApp'}
                        </span>
                      </a>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      const ref = orderReceipt.reference;
                      handleClose();
                      navigate(`/track?ref=${encodeURIComponent(ref)}`);
                    }}
                    className="w-full h-11 bubble-btn bubble-btn-primary text-xs sm:text-sm font-bold gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>
                      {language === 'ar' ? 'تتبّع حالة طلبك الآن' : 'Track Your Order Status'}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="w-full h-10 text-xs sm:text-sm"
                  >
                    {language === 'ar' ? 'إغلاق ومتابعة التصفح' : 'Close & Continue Browsing'}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-300 pt-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    {language === 'ar'
                      ? 'بتراجع مسودة القصة كاملة وتوافق عليها قبل الطباعة 100%'
                      : 'Full story draft reviewed and approved by you before printing'}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
