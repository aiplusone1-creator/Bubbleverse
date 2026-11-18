import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  Truck,
  MessageCircle,
  CreditCard,
  Gift,
  Palette,
  FileText,
  ChevronDown,
  ArrowRight,
  Tag,
  CheckCircle2,
  AlertCircle,
  Sticker,
  Headphones,
  Users,
  CalendarHeart,
  Lock,
  Ribbon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { getMerchCatalog, getStoreConfig, type MerchProduct } from '@/lib/localStore';
import { getMerchProductById } from '@/features/merch/merchCatalog';
import {
  ADDON_PRICING,
  calculateAddonTotal,
  calculateCartPricing,
  deriveAedFromSar,
  formatMoney,
} from '@/features/commerce/pricingEngine';
import type { CartItem } from '@/types/cart';

const OCCASION_LABELS: Record<string, { ar: string; en: string }> = {
  birthday: { ar: 'عيد ميلاد', en: 'Birthday' },
  ramadan_eid: { ar: 'رمضان والعيد', en: 'Ramadan & Eid' },
  siblings: { ar: 'إخوة وعائلة', en: 'Siblings & Family' },
  graduation: { ar: 'تخرج ونجاح', en: 'Graduation' },
  bedtime_values: { ar: 'قيم وقبل النوم', en: 'Bedtime & Values' },
  everyday: { ar: 'مغامرة يومية', en: 'Everyday Adventure' },
};

function formatOccasionLabel(occasion: string, language: 'ar' | 'en'): string {
  const match = OCCASION_LABELS[occasion];
  if (match) {
    return language === 'ar' ? match.ar : match.en;
  }
  return occasion;
}

function formatMultiCurrencyAddon(
  pricing: { readonly egp: number; readonly sar: number; readonly aed: number },
  language: 'ar' | 'en'
): string {
  if (language === 'ar') {
    return `+${pricing.egp} ج.م • ${pricing.sar} ر.س • ${pricing.aed} د.إ`;
  }
  return `+${pricing.egp} EGP • ${pricing.sar} SAR • ${pricing.aed} AED`;
}

function isMerchCartItem(item: CartItem): boolean {
  return item.itemType === 'merch' || item.format === 'physical_merch';
}

export default function CartDrawer() {
  const { isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const {
    items,
    isOpen,
    closeCart,
    openCheckout,
    addMerchItem,
    removeItem,
    updateQuantity,
    updateItemAddons,
    clearCart,
    orderNotes,
    setOrderNotes,
    gwpConfig,
    getGwpStatus,
    totalItems,
    promoCode,
    promoDiscountPercent,
    applyPromoCode,
    clearPromoCode,
  } = useCart();

  const [orderNotesOpen, setOrderNotesOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [merchCatalog, setMerchCatalog] = useState<MerchProduct[]>(() => getMerchCatalog());

  useEffect(() => {
    const syncMerch = () => setMerchCatalog(getMerchCatalog());
    window.addEventListener('bubbleverse:merch-updated', syncMerch);
    return () => window.removeEventListener('bubbleverse:merch-updated', syncMerch);
  }, []);

  useEffect(() => {
    if (isOpen && orderNotes.trim().length > 0) {
      setOrderNotesOpen(true);
    }
  }, [isOpen, orderNotes]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCart]);

  const storeConfig = getStoreConfig();
  const freeShippingThreshold = Math.max(1, Math.floor(storeConfig.freeShippingThreshold || 2));

  const pricingEgp = useMemo(
    () => calculateCartPricing(items, 'EG', promoDiscountPercent, freeShippingThreshold),
    [items, promoDiscountPercent, freeShippingThreshold]
  );
  const pricingSar = useMemo(
    () => calculateCartPricing(items, 'SA', promoDiscountPercent, freeShippingThreshold),
    [items, promoDiscountPercent, freeShippingThreshold]
  );
  const pricingAed = useMemo(
    () => calculateCartPricing(items, 'AE', promoDiscountPercent, freeShippingThreshold),
    [items, promoDiscountPercent, freeShippingThreshold]
  );

  const gwpStatus = useMemo(() => getGwpStatus('EG'), [getGwpStatus]);
  const gwpQty = Math.max(1, Math.floor(gwpConfig.maxPerOrder || 1));

  const totalBooks = pricingEgp.totalBooks;
  const totalMerchItems = pricingEgp.totalMerchItems ?? 0;
  const paidItemCount = totalBooks + totalMerchItems;

  const progressPercent = useMemo(() => {
    if (paidItemCount === 0) return 0;
    if (totalBooks === 0) {
      return Math.min(100, Math.round((paidItemCount / freeShippingThreshold) * 100));
    }
    const maxMilestone = Math.max(3, freeShippingThreshold);
    const effectiveProgress = Math.min(paidItemCount, maxMilestone);
    if (totalBooks >= 3 && pricingEgp.freeShippingUnlocked) return 100;
    return Math.min(99, Math.max(15, Math.round((effectiveProgress / maxMilestone) * 100)));
  }, [paidItemCount, totalBooks, freeShippingThreshold, pricingEgp.freeShippingUnlocked]);

  const tierMessage = useMemo(() => {
    const remainingForShip = pricingEgp.booksToFreeShipping;

    if (totalBooks === 0) {
      if (pricingEgp.freeShippingUnlocked) {
        return language === 'ar'
          ? 'تم فتح الشحن السريع المجاني لطلبك!'
          : 'FREE Fast Shipping unlocked for your order!';
      }
      return language === 'ar'
        ? `أضف ${remainingForShip === 1 ? 'منتجاً إضافياً' : `${remainingForShip} منتجات إضافية`} لفتح الشحن المجاني (عند ${freeShippingThreshold} قطع)!`
        : `Add ${remainingForShip} more ${remainingForShip === 1 ? 'item' : 'items'} to unlock Free Shipping (at ${freeShippingThreshold} items)!`;
    }

    if (totalBooks >= 3) {
      if (pricingEgp.freeShippingUnlocked) {
        return language === 'ar'
          ? 'خصم 25% الأقصى على القصص + شحن مجاني مفعّل!'
          : 'Max 25% OFF stories + Free Shipping unlocked!';
      }
      return language === 'ar'
        ? `خصم 25% على القصص مفعّل! أضف ${remainingForShip} ${remainingForShip === 1 ? 'قطعة' : 'قطع'} لفتح الشحن المجاني!`
        : `25% OFF stories unlocked! Add ${remainingForShip} more for Free Shipping!`;
    }

    if (totalBooks === 2) {
      if (pricingEgp.freeShippingUnlocked) {
        return language === 'ar'
          ? 'خصم 15% + شحن مجاني مفعّل! أضف كتاباً ثالثاً لخصم 25%!'
          : '15% OFF + Free Shipping unlocked! Add a 3rd book for 25% OFF!';
      }
      return language === 'ar'
        ? `خصم 15% مفعّل! أضف ${remainingForShip} ${remainingForShip === 1 ? 'قطعة' : 'قطع'} للشحن المجاني (وكتاباً ثالثاً لخصم 25%)!`
        : `15% OFF unlocked! Add ${remainingForShip} more for Free Shipping (and a 3rd book for 25% OFF)!`;
    }

    if (pricingEgp.freeShippingUnlocked) {
      return language === 'ar'
        ? 'الشحن السريع المجاني مفعّل! أضف كتاباً ثانياً لخصم 15%!'
        : 'Free Fast Shipping unlocked! Add a 2nd book for 15% OFF!';
    }

    if (freeShippingThreshold === 2) {
      return language === 'ar'
        ? 'أضف كتاباً ثانياً واحصل على خصم 15% + شحن مجاني!'
        : 'Add a 2nd book for 15% OFF + Free Shipping!';
    }

    return language === 'ar'
      ? `أضف كتاباً ثانياً لخصم 15% (والشحن المجاني عند ${freeShippingThreshold} قطع — متبقي ${remainingForShip})!`
      : `Add a 2nd book for 15% OFF (Free Shipping at ${freeShippingThreshold} items — ${remainingForShip} away)!`;
  }, [totalBooks, pricingEgp.freeShippingUnlocked, pricingEgp.booksToFreeShipping, freeShippingThreshold, language]);

  const hardcoverMissingGiftBox = useMemo(
    () =>
      items.find(
        (it) => !isMerchCartItem(it) && it.format === 'hardcover_book' && !it.hasGiftBoxAddon
      ),
    [items]
  );
  const hardcoverMissingStickers = useMemo(
    () =>
      items.find(
        (it) => !isMerchCartItem(it) && it.format === 'hardcover_book' && !it.hasStickersAddon
      ),
    [items]
  );

  const bubPlushUpsell = useMemo(() => {
    if (totalBooks === 0) return null;
    const hasBubPlushInCart = items.some(
      (it) =>
        isMerchCartItem(it) &&
        (it.merchId === 'bub-plush-ball' || it.storyId === 'bub-plush-ball')
    );
    if (hasBubPlushInCart) return null;

    const product = getMerchProductById('bub-plush-ball', merchCatalog);
    if (!product || !product.inStock) return null;

    const classicVariant =
      product.variants.find((v) => v.id === 'classic-20cm') ??
      product.variants[1] ??
      product.variants[0];

    return { product, variant: classicVariant };
  }, [items, totalBooks, merchCatalog]);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = promoInput.trim();
    if (!cleaned) {
      setPromoFeedback({
        type: 'error',
        message:
          language === 'ar'
            ? 'أدخل كود الخصم أولاً (مثل WELCOME15 أو EID20).'
            : 'Enter a promo code first (e.g. WELCOME15 or EID20).',
      });
      return;
    }

    const result = applyPromoCode(cleaned);
    if (result.ok) {
      setPromoFeedback({
        type: 'success',
        message:
          language === 'ar'
            ? `تم تفعيل الكود ${cleaned.toUpperCase()} بخصم ${result.percent ?? 0}% بنجاح!`
            : `Code ${cleaned.toUpperCase()} applied for ${result.percent ?? 0}% OFF!`,
      });
      setPromoInput('');
    } else {
      setPromoFeedback({
        type: 'error',
        message:
          language === 'ar'
            ? result.reasonAr || 'كود الخصم غير صالح أو غير مفعّل حالياً.'
            : result.reasonEn || 'Promo code is invalid or inactive.',
      });
    }
  };

  const handleClearPromo = () => {
    clearPromoCode();
    setPromoFeedback(null);
  };

  const openWhatsAppCheckout = () => {
    if (items.length === 0) return;

    const itemsSummary = items
      .map((it) => {
        const isMerch = isMerchCartItem(it);
        const addonEgp = isMerch ? 0 : calculateAddonTotal(it, 'EG');
        const addonSar = isMerch ? 0 : calculateAddonTotal(it, 'SA');
        const addonAed = isMerch ? 0 : calculateAddonTotal(it, 'AE');
        const baseAed = it.priceAed ?? deriveAedFromSar(it.priceSar);
        const lineEgp = (it.priceEgp + addonEgp) * it.quantity;
        const lineSar = (it.priceSar + addonSar) * it.quantity;
        const lineAed = (baseAed + addonAed) * it.quantity;

        if (isMerch) {
          if (language === 'ar') {
            return (
              `• *${it.titleAr}* (منتج براند بابل فيرس) ×${it.quantity}\n` +
              (it.variantLabelAr ? `   - المقاس / الإصدار: ${it.variantLabelAr}\n` : '') +
              (it.sku ? `   - الرمز (SKU): ${it.sku}\n` : '') +
              (it.ribbonName ? `   - شريط الهدية بالاسم: ${it.ribbonName}\n` : '') +
              `   - السعر: ${lineEgp} ج.م / ${lineSar} ر.س / ${lineAed} د.إ`
            );
          }

          return (
            `• *${it.titleEn}* (Official Merch) x${it.quantity}\n` +
            (it.variantLabelEn ? `   - Variant: ${it.variantLabelEn}\n` : '') +
            (it.sku ? `   - SKU: ${it.sku}\n` : '') +
            (it.ribbonName ? `   - Gift Ribbon Name: ${it.ribbonName}\n` : '') +
            `   - Price: ${lineEgp} EGP / ${lineSar} SAR / ${lineAed} AED`
          );
        }

        if (language === 'ar') {
          const addonsLines = [
            it.hasColoringBookAddon
              ? `   - إضافة: دفتر تلوين الأبطال (${formatMultiCurrencyAddon(ADDON_PRICING.coloring, 'ar')})`
              : '',
            it.hasGiftBoxAddon
              ? `   - إضافة: علبة هدايا فاخرة (${formatMultiCurrencyAddon(ADDON_PRICING.giftBox, 'ar')})`
              : '',
            it.hasStickersAddon
              ? `   - إضافة: 24 ستيكر مخصص (${formatMultiCurrencyAddon(ADDON_PRICING.stickers, 'ar')})`
              : '',
            it.hasAudioStoryAddon
              ? `   - إضافة: قصة صوتية بباركود QR (${formatMultiCurrencyAddon(ADDON_PRICING.audioStory, 'ar')})`
              : '',
            it.hasCoHeroAddon
              ? `   - إضافة: بطل مساعد${it.coHeroName ? ` (${it.coHeroName})` : ''} (${formatMultiCurrencyAddon(ADDON_PRICING.coHero, 'ar')})`
              : it.coHeroName
              ? `   - البطل المساعد: ${it.coHeroName}`
              : '',
          ]
            .filter(Boolean)
            .join('\n');

          return (
            `• *${it.titleAr}* (${it.format === 'hardcover_book' ? 'كتاب ورقي فاخر' : 'نسخة رقمية فورية'}) ×${it.quantity}\n` +
            `   - اسم البطل: ${it.childName} (${it.childGender === 'boy' ? 'ولد' : 'بنت'}، ${it.childAge} سنوات)\n` +
            `   - اللغة: ${it.storyLanguage === 'ar' ? 'العربية' : it.storyLanguage === 'en' ? 'الإنجليزية' : 'عربي وإنجليزي'}\n` +
            (it.occasion ? `   - المناسبة: ${formatOccasionLabel(it.occasion, 'ar')}\n` : '') +
            (addonsLines ? `${addonsLines}\n` : '') +
            (it.giftMessage ? `   - إهداء: "${it.giftMessage}"\n` : '') +
            `   - السعر: ${lineEgp} ج.م / ${lineSar} ر.س / ${lineAed} د.إ`
          );
        }

        const addonsLinesEn = [
          it.hasColoringBookAddon
            ? `   - Add-on: Matching Coloring Book (${formatMultiCurrencyAddon(ADDON_PRICING.coloring, 'en')})`
            : '',
          it.hasGiftBoxAddon
            ? `   - Add-on: Luxury Gift Box (${formatMultiCurrencyAddon(ADDON_PRICING.giftBox, 'en')})`
            : '',
          it.hasStickersAddon
            ? `   - Add-on: 24 Custom Stickers (${formatMultiCurrencyAddon(ADDON_PRICING.stickers, 'en')})`
            : '',
          it.hasAudioStoryAddon
            ? `   - Add-on: QR Audio Story (${formatMultiCurrencyAddon(ADDON_PRICING.audioStory, 'en')})`
            : '',
          it.hasCoHeroAddon
            ? `   - Add-on: Co-Hero${it.coHeroName ? ` (${it.coHeroName})` : ''} (${formatMultiCurrencyAddon(ADDON_PRICING.coHero, 'en')})`
            : it.coHeroName
            ? `   - Co-Hero: ${it.coHeroName}`
            : '',
        ]
          .filter(Boolean)
          .join('\n');

        return (
          `• *${it.titleEn}* (${it.format === 'hardcover_book' ? 'Hardcover Keepsake' : 'Instant Digital PDF'}) x${it.quantity}\n` +
          `   - Hero: ${it.childName} (${it.childGender === 'boy' ? 'Boy' : 'Girl'}, ${it.childAge} yrs)\n` +
          `   - Language: ${it.storyLanguage === 'ar' ? 'Arabic' : it.storyLanguage === 'en' ? 'English' : 'Bilingual'}\n` +
          (it.occasion ? `   - Occasion: ${formatOccasionLabel(it.occasion, 'en')}\n` : '') +
          (addonsLinesEn ? `${addonsLinesEn}\n` : '') +
          (it.giftMessage ? `   - Dedication: "${it.giftMessage}"\n` : '') +
          `   - Price: ${lineEgp} EGP / ${lineSar} SAR / ${lineAed} AED`
        );
      })
      .join('\n\n');

    const gwpLineAr =
      gwpStatus.enabled && gwpStatus.unlocked
        ? `\n\n• 🎁 *هدية مجانية مضافة تلقائياً:* ${gwpConfig.titleAr} (${gwpConfig.variantLabelAr}) ×${gwpQty}\n   - السعر: 0 ج.م مجاناً (بقيمة ${gwpConfig.retailValueEgp} ج.م / ${gwpConfig.retailValueSar} ر.س / ${gwpConfig.retailValueAed} د.إ)`
        : '';

    const gwpLineEn =
      gwpStatus.enabled && gwpStatus.unlocked
        ? `\n\n• 🎁 *Auto-Added FREE Gift:* ${gwpConfig.titleEn} (${gwpConfig.variantLabelEn}) x${gwpQty}\n   - Price: 0 EGP FREE (Worth ${gwpConfig.retailValueEgp} EGP / ${gwpConfig.retailValueSar} SAR / ${gwpConfig.retailValueAed} AED)`
        : '';

    const discountLinesAr = [
      pricingEgp.totalDiscount > 0
        ? `*المجموع الفرعي:* ${pricingEgp.subtotal} ج.م / ${pricingSar.subtotal} ر.س / ${pricingAed.subtotal} د.إ`
        : '',
      pricingEgp.volumeDiscountAmount > 0
        ? `*خصم باقة الإخوة (${pricingEgp.volumeDiscountPercent}%):* -${pricingEgp.volumeDiscountAmount} ج.م / -${pricingSar.volumeDiscountAmount} ر.س / -${pricingAed.volumeDiscountAmount} د.إ`
        : '',
      promoCode && pricingEgp.promoDiscountAmount > 0
        ? `*كود الخصم (${promoCode} - ${promoDiscountPercent}%):* -${pricingEgp.promoDiscountAmount} ج.م / -${pricingSar.promoDiscountAmount} ر.س / -${pricingAed.promoDiscountAmount} د.إ`
        : '',
      pricingEgp.freeShippingUnlocked ? `*الشحن:* شحن سريع مجاني مفعّل` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const discountLinesEn = [
      pricingEgp.totalDiscount > 0
        ? `*Subtotal:* ${pricingEgp.subtotal} EGP / ${pricingSar.subtotal} SAR / ${pricingAed.subtotal} AED`
        : '',
      pricingEgp.volumeDiscountAmount > 0
        ? `*Sibling Bundle Discount (${pricingEgp.volumeDiscountPercent}%):* -${pricingEgp.volumeDiscountAmount} EGP / -${pricingSar.volumeDiscountAmount} SAR / -${pricingAed.volumeDiscountAmount} AED`
        : '',
      promoCode && pricingEgp.promoDiscountAmount > 0
        ? `*Promo Code (${promoCode} - ${promoDiscountPercent}%):* -${pricingEgp.promoDiscountAmount} EGP / -${pricingSar.promoDiscountAmount} SAR / -${pricingAed.promoDiscountAmount} AED`
        : '',
      pricingEgp.freeShippingUnlocked ? `*Shipping:* FREE Fast Shipping Unlocked` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const rawMessage =
      language === 'ar'
        ? `أهلاً فريق بابل فيرس!\n` +
          `حابب أؤكد طلب السلة الخاص بي:\n\n` +
          `${itemsSummary}${gwpLineAr}\n\n` +
          (discountLinesAr ? `${discountLinesAr}\n` : '') +
          `*الإجمالي النهائي:* ${pricingEgp.total} ج.م / ${pricingSar.total} ر.س / ${pricingAed.total} د.إ\n` +
          (orderNotes.trim() ? `*ملاحظات الطلب:* ${orderNotes.trim()}\n\n` : '\n') +
          `من فضلكم شاركوني بيانات تحويل العربون عشان نبدأ تجهيز الطلب.`
        : `Hi Bubbleverse team!\n` +
          `I'd like to confirm my cart order:\n\n` +
          `${itemsSummary}${gwpLineEn}\n\n` +
          (discountLinesEn ? `${discountLinesEn}\n` : '') +
          `*Final Cart Total:* ${pricingEgp.total} EGP / ${pricingSar.total} SAR / ${pricingAed.total} AED\n` +
          (orderNotes.trim() ? `*Order Notes:* ${orderNotes.trim()}\n\n` : '\n') +
          `Please share the deposit details so we can begin preparing my order.`;

    window.open(
      `https://wa.me/${storeConfig.whatsappPhone.replace(/\D/g, '')}?text=${encodeURIComponent(rawMessage)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={language === 'ar' ? 'سلة القصص' : 'Shopping Cart'}
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Slide-over Drawer */}
          <div
            className={`fixed inset-y-0 ${isRTL ? 'left-0 pr-8 sm:pr-0' : 'right-0 pl-8 sm:pl-0'} max-w-full flex`}
          >
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { x: isRTL ? '-100%' : '100%' }}
              animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: isRTL ? '-100%' : '100%' }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', damping: 28, stiffness: 260 }
              }
              className={`w-screen max-w-md bg-slate-900 ${
                isRTL ? 'border-r' : 'border-l'
              } border-white/15 shadow-2xl flex flex-col text-foreground overflow-hidden`}
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/75">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-400/30 text-purple-300 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white font-editorial flex items-center gap-2">
                      <span>{language === 'ar' ? 'سلة قصصكم' : 'Your Story Cart'}</span>
                      {totalItems > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold font-numeric bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                          {totalItems}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {language === 'ar'
                        ? 'طلب سريع ومباشر بدون تسجيل حساب'
                        : 'Fast guest checkout — no account needed'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeCart}
                  className="min-w-[40px] min-h-[40px] p-2.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
                  aria-label={language === 'ar' ? 'إغلاق السلة' : 'Close cart'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic Tiered Progress Bar: Free Shipping + Sibling Volume Discounts */}
              {items.length > 0 && (
                <div className="px-5 py-3.5 bg-slate-950/60 border-b border-white/10 space-y-2.5">
                  <div className="flex items-start justify-between gap-2 text-xs font-semibold">
                    <span className="flex items-start gap-2 text-cyan-200 leading-snug">
                      <Truck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{tierMessage}</span>
                    </span>
                    <span className="text-xs text-slate-300 font-bold font-numeric shrink-0">
                      {progressPercent}%
                    </span>
                  </div>

                  <div
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={
                      language === 'ar'
                        ? 'تقدم خصم الكمية والشحن المجاني'
                        : 'Sibling discount and free shipping progress'
                    }
                    className="w-full h-2 rounded-full bg-slate-800 overflow-hidden"
                  >
                    <div
                      className={`h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 ${
                        shouldReduceMotion ? '' : 'transition-all duration-300'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Dynamic Tier Milestones */}
                  {totalBooks > 0 ? (
                    <div className="flex items-center justify-between gap-1 text-[11px] font-numeric">
                      <span
                        className={
                          totalBooks >= 1 ? 'text-cyan-300 font-semibold' : 'text-slate-500'
                        }
                      >
                        {language === 'ar' ? '1 كتاب' : '1 Book'}
                      </span>
                      <span
                        className={
                          pricingEgp.freeShippingUnlocked
                            ? 'text-emerald-300 font-bold'
                            : 'text-slate-400'
                        }
                      >
                        {freeShippingThreshold === 2
                          ? language === 'ar'
                            ? '2: خصم 15% + شحن مجاني'
                            : '2: 15% + Free Ship'
                          : language === 'ar'
                          ? `شحن مجاني (${freeShippingThreshold}) • 2: 15%`
                          : `Free Ship (${freeShippingThreshold}) • 2: 15%`}
                      </span>
                      <span
                        className={
                          totalBooks >= 3
                            ? 'text-pink-300 font-bold'
                            : 'text-slate-400'
                        }
                      >
                        {language === 'ar' ? '3+ كتب: خصم 25%' : '3+ Books: 25% OFF'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] font-numeric">
                      <span className="text-cyan-300 font-semibold">
                        {language === 'ar'
                          ? `${paidItemCount} ${paidItemCount === 1 ? 'قطعة' : 'قطع'}`
                          : `${paidItemCount} ${paidItemCount === 1 ? 'Item' : 'Items'}`}
                      </span>
                      <span
                        className={
                          pricingEgp.freeShippingUnlocked
                            ? 'text-emerald-300 font-bold'
                            : 'text-slate-400'
                        }
                      >
                        {language === 'ar'
                          ? `${freeShippingThreshold} قطع: شحن سريع مجاني`
                          : `${freeShippingThreshold} Items: Free Fast Shipping`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Live Free Bub Plush Ball GWP Progress Banner (Before Unlock) */}
              {items.length > 0 && gwpConfig.enabled && !gwpStatus.unlocked && (
                <div className="px-5 py-3 bg-gradient-to-r from-cyan-950/75 via-purple-950/75 to-pink-950/60 border-b border-cyan-400/25 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-cyan-300/40 bg-slate-900 shrink-0 shadow-md shadow-cyan-500/20">
                      <img
                        src={gwpConfig.coverImage || '/merch/bub-plush-ball.jpg'}
                        alt={language === 'ar' ? gwpConfig.titleAr : gwpConfig.titleEn}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-bold text-white leading-snug">
                        {language === 'ar' ? gwpStatus.messageAr : gwpStatus.messageEn}
                      </p>
                      <p className="text-[11px] text-cyan-200/85 font-numeric">
                        {language === 'ar'
                          ? `قيمة الهدية: ${gwpConfig.retailValueEgp} ج.م • ${gwpConfig.retailValueSar} ر.س • ${gwpConfig.retailValueAed} د.إ`
                          : `Gift Value: ${gwpConfig.retailValueEgp} EGP • ${gwpConfig.retailValueSar} SAR • ${gwpConfig.retailValueAed} AED`}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-cyan-300 font-numeric shrink-0">
                      {gwpStatus.progressPercent}%
                    </span>
                  </div>

                  <div
                    role="progressbar"
                    aria-valuenow={gwpStatus.progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={
                      language === 'ar'
                        ? 'تقدم فتح هدية كورة باب القطيفة المجانية'
                        : 'Free Bub Plush Ball gift unlock progress'
                    }
                    className="w-full h-2 rounded-full bg-slate-900/90 border border-white/10 overflow-hidden"
                  >
                    <div
                      className={`h-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-500 ${
                        shouldReduceMotion ? '' : 'transition-all duration-300'
                      }`}
                      style={{ width: `${gwpStatus.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-400/25 text-purple-300 flex items-center justify-center shadow-lg">
                      <ShoppingBag className="w-6 h-6" />
                    </div>

                    <div className="space-y-1.5 max-w-xs">
                      <h4 className="text-lg font-bold text-white font-editorial">
                        {language === 'ar' ? 'سلتكم لسه فاضية' : 'Your cart is empty'}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {language === 'ar'
                          ? 'اتصفّحوا مكتبة القصص واختاروا مغامرة مخصّصة باسم وملامح طفلكم الحقيقية، أو اكتشفوا منتجات بابل فيرس.'
                          : 'Browse our story catalog and personalize an unforgettable keepsake starring your child, or explore official Bub merch.'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs">
                      <Button
                        type="button"
                        onClick={() => {
                          closeCart();
                          navigate('/stories');
                        }}
                        className="w-full bubble-btn bubble-btn-primary h-11 px-5 text-xs sm:text-sm font-semibold gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {language === 'ar' ? 'تصفح مكتبة القصص' : 'Explore Stories'}
                        </span>
                        <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {/* Unlocked Auto-Added FREE Bub Plush Ball GWP Card (ZERO remove/quantity controls) */}
                    {gwpConfig.enabled && gwpStatus.unlocked && (
                      <div
                        data-testid="cart-free-gwp-card"
                        className="rounded-2xl bg-gradient-to-br from-emerald-950/75 via-cyan-950/65 to-slate-950/90 border border-emerald-400/45 p-3.5 shadow-lg shadow-emerald-950/40 space-y-2.5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-emerald-300/45 shrink-0 shadow-md relative">
                            <img
                              src={gwpConfig.coverImage || '/merch/bub-plush-ball.jpg'}
                              alt={language === 'ar' ? gwpConfig.titleAr : gwpConfig.titleEn}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 inset-x-1 text-center rounded-md bg-emerald-500/90 text-slate-950 text-[10px] font-extrabold py-0.5 leading-none">
                              {language === 'ar' ? 'مجانية' : 'FREE'}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold">
                                <Gift className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                                <span>
                                  {language === 'ar'
                                    ? 'هدية مجانية مضافة تلقائياً'
                                    : 'Auto-Added FREE Gift'}
                                </span>
                              </span>

                              <span
                                aria-label={
                                  language === 'ar'
                                    ? `كمية الهدية مقفلة ${gwpQty}`
                                    : `Locked gift quantity ${gwpQty}`
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-emerald-400/35 text-emerald-200 text-[11px] font-extrabold font-numeric shrink-0"
                              >
                                <Lock className="w-3 h-3 text-emerald-300 shrink-0" />
                                <span dir="ltr">×{gwpQty}</span>
                              </span>
                            </div>

                            <h4 className="text-sm font-extrabold text-white font-editorial leading-snug">
                              {language === 'ar'
                                ? `🎁 ${gwpConfig.titleAr}`
                                : `🎁 ${gwpConfig.titleEn}`}
                            </h4>

                            <p className="text-[11px] text-cyan-200 font-medium">
                              {language === 'ar'
                                ? gwpConfig.variantLabelAr
                                : gwpConfig.variantLabelEn}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5 text-xs font-numeric">
                              <span className="font-extrabold text-emerald-300">
                                {language === 'ar'
                                  ? `0 ج.م بدلاً من ${gwpConfig.retailValueEgp} ج.م`
                                  : `0 EGP instead of ${gwpConfig.retailValueEgp} EGP`}
                              </span>
                              <span className="text-[11px] text-slate-300">
                                {language === 'ar'
                                  ? `(بقيمة ${gwpConfig.retailValueSar} ر.س • ${gwpConfig.retailValueAed} د.إ)`
                                  : `(${gwpConfig.retailValueSar} SAR • ${gwpConfig.retailValueAed} AED value)`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {items.map((item: CartItem) => {
                      const isMerch = isMerchCartItem(item);
                      const itemAddonEgp = isMerch ? 0 : calculateAddonTotal(item, 'EG');
                      const itemAddonSar = isMerch ? 0 : calculateAddonTotal(item, 'SA');
                      const itemAddonAed = isMerch ? 0 : calculateAddonTotal(item, 'AE');
                      const itemBaseAed = item.priceAed ?? deriveAedFromSar(item.priceSar);
                      const itemTotalEgp = (item.priceEgp + itemAddonEgp) * item.quantity;
                      const itemTotalSar = (item.priceSar + itemAddonSar) * item.quantity;
                      const itemTotalAed = (itemBaseAed + itemAddonAed) * item.quantity;
                      const itemTitle = language === 'ar' ? item.titleAr : item.titleEn;

                      const hasBookSubTags =
                        !isMerch &&
                        Boolean(
                          item.giftMessage ||
                            item.hasColoringBookAddon ||
                            item.hasGiftBoxAddon ||
                            item.hasStickersAddon ||
                            item.hasAudioStoryAddon ||
                            item.hasCoHeroAddon
                        );

                      return (
                        <div
                          key={item.id}
                          className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 shadow-md space-y-3 hover:border-purple-400/35 transition-colors"
                        >
                          <div className="flex gap-3">
                            {/* Item Thumbnail */}
                            <div
                              className={`w-16 ${
                                isMerch ? 'h-16' : 'h-20'
                              } rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 shadow relative`}
                            >
                              <img
                                src={item.coverImage}
                                alt={itemTitle}
                                className="w-full h-full object-cover"
                              />
                              {!isMerch && (
                                <div
                                  aria-hidden="true"
                                  className={`absolute top-0 bottom-0 w-1 bg-black/40 ${
                                    isRTL ? 'right-0' : 'left-0'
                                  }`}
                                />
                              )}
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-bold text-white truncate font-editorial">
                                  {itemTitle}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                                  aria-label={
                                    language === 'ar'
                                      ? `حذف ${itemTitle} من السلة`
                                      : `Remove ${itemTitle} from cart`
                                  }
                                  title={language === 'ar' ? 'حذف من السلة' : 'Remove item'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {isMerch ? (
                                <>
                                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 font-semibold">
                                      <Sparkles className="w-3 h-3 shrink-0" />
                                      <span>
                                        {language === 'ar'
                                          ? 'منتج براند بابل فيرس'
                                          : 'Official Merch'}
                                      </span>
                                    </span>

                                    {(item.variantLabelAr || item.variantLabelEn) && (
                                      <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-400/25 text-purple-200 font-medium">
                                        {language === 'ar'
                                          ? item.variantLabelAr || item.variantLabelEn
                                          : item.variantLabelEn || item.variantLabelAr}
                                      </span>
                                    )}
                                  </div>

                                  {item.ribbonName?.trim() && (
                                    <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-lg bg-pink-500/15 border border-pink-400/30 text-pink-200 text-[11px] font-medium">
                                      <Ribbon className="w-3.5 h-3.5 text-pink-300 shrink-0" />
                                      <span>
                                        {language === 'ar' ? 'شريط باسم: ' : 'Gift Ribbon: '}
                                        <bdi>{item.ribbonName.trim()}</bdi>
                                      </span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <p className="text-xs text-cyan-300 font-semibold font-numeric">
                                    {item.format === 'hardcover_book'
                                      ? language === 'ar'
                                        ? `كتاب ورقي فاخر (${item.pagesCount || 15} صفحة)`
                                        : `Hardcover Keepsake (${item.pagesCount || 15} pages)`
                                      : language === 'ar'
                                      ? 'نسخة رقمية فورية'
                                      : 'Instant Digital PDF'}
                                  </p>

                                  {/* Personalization, Co-Hero & Occasion Pills (Book-only) */}
                                  <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                                    <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-400/25 text-purple-200">
                                      {language === 'ar' ? 'البطل: ' : 'Hero: '}
                                      <bdi>{item.childName}</bdi>
                                    </span>
                                    {item.coHeroName && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-pink-500/15 border border-pink-400/25 text-pink-200">
                                        <Users className="w-4 h-4 shrink-0" />
                                        <span>
                                          {language === 'ar' ? 'مع: ' : 'With: '}
                                          <bdi>{item.coHeroName}</bdi>
                                        </span>
                                      </span>
                                    )}
                                    <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                                      {item.storyLanguage === 'ar'
                                        ? language === 'ar'
                                          ? 'عربي'
                                          : 'Arabic'
                                        : item.storyLanguage === 'en'
                                        ? language === 'ar'
                                          ? 'إنجليزي'
                                          : 'English'
                                        : language === 'ar'
                                        ? 'عربي وإنجليزي'
                                        : 'Bilingual'}
                                    </span>
                                    {item.occasion && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-400/25 text-amber-200">
                                        <CalendarHeart className="w-4 h-4 shrink-0" />
                                        <span>{formatOccasionLabel(item.occasion, language)}</span>
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Selected Book Add-ons & Dedication Sub-tags (Multi-Currency Audit Fix #4) */}
                          {hasBookSubTags && (
                            <div className="pt-2.5 border-t border-white/10 space-y-2 text-xs">
                              {item.giftMessage && (
                                <div className="flex items-center gap-2 bg-pink-950/25 border border-pink-400/25 rounded-xl px-3 py-1.5 text-pink-200">
                                  <Gift className="w-4 h-4 text-pink-400 shrink-0" />
                                  <span className="truncate">
                                    {language === 'ar'
                                      ? `إهداء: "${item.giftMessage}"`
                                      : `Note: "${item.giftMessage}"`}
                                  </span>
                                </div>
                              )}
                              {item.hasColoringBookAddon && (
                                <div className="flex items-center justify-between gap-2 bg-cyan-950/25 border border-cyan-400/25 rounded-xl px-3 py-1.5 text-cyan-200">
                                  <span className="flex items-center gap-2 min-w-0">
                                    <Palette className="w-4 h-4 text-cyan-400 shrink-0" />
                                    <span className="truncate">
                                      {language === 'ar'
                                        ? 'دفتر تلوين الأبطال المطابق'
                                        : 'Matching Coloring Book'}
                                    </span>
                                  </span>
                                  <span className="text-[11px] font-bold font-numeric shrink-0">
                                    {formatMultiCurrencyAddon(ADDON_PRICING.coloring, language)}
                                  </span>
                                </div>
                              )}
                              {item.hasGiftBoxAddon && (
                                <div className="flex items-center justify-between gap-2 bg-purple-950/35 border border-purple-400/30 rounded-xl px-3 py-1.5 text-purple-200">
                                  <span className="flex items-center gap-2 min-w-0">
                                    <Gift className="w-4 h-4 text-purple-300 shrink-0" />
                                    <span className="truncate">
                                      {language === 'ar' ? 'علبة هدايا فاخرة' : 'Luxury Gift Box'}
                                    </span>
                                  </span>
                                  <span className="text-[11px] font-bold font-numeric shrink-0">
                                    {formatMultiCurrencyAddon(ADDON_PRICING.giftBox, language)}
                                  </span>
                                </div>
                              )}
                              {item.hasStickersAddon && (
                                <div className="flex items-center justify-between gap-2 bg-amber-950/25 border border-amber-400/25 rounded-xl px-3 py-1.5 text-amber-200">
                                  <span className="flex items-center gap-2 min-w-0">
                                    <Sticker className="w-4 h-4 text-amber-300 shrink-0" />
                                    <span className="truncate">
                                      {language === 'ar'
                                        ? '24 ستيكر مخصص للبطل'
                                        : '24 Custom Hero Stickers'}
                                    </span>
                                  </span>
                                  <span className="text-[11px] font-bold font-numeric shrink-0">
                                    {formatMultiCurrencyAddon(ADDON_PRICING.stickers, language)}
                                  </span>
                                </div>
                              )}
                              {item.hasAudioStoryAddon && (
                                <div className="flex items-center justify-between gap-2 bg-emerald-950/25 border border-emerald-400/25 rounded-xl px-3 py-1.5 text-emerald-200">
                                  <span className="flex items-center gap-2 min-w-0">
                                    <Headphones className="w-4 h-4 text-emerald-300 shrink-0" />
                                    <span className="truncate">
                                      {language === 'ar'
                                        ? 'قصة صوتية بباركود QR'
                                        : 'QR Audio Story Narration'}
                                    </span>
                                  </span>
                                  <span className="text-[11px] font-bold font-numeric shrink-0">
                                    {formatMultiCurrencyAddon(ADDON_PRICING.audioStory, language)}
                                  </span>
                                </div>
                              )}
                              {item.hasCoHeroAddon && (
                                <div className="flex items-center justify-between gap-2 bg-pink-950/30 border border-pink-400/30 rounded-xl px-3 py-1.5 text-pink-200">
                                  <span className="flex items-center gap-2 min-w-0">
                                    <Users className="w-4 h-4 text-pink-300 shrink-0" />
                                    <span className="truncate">
                                      {language === 'ar'
                                        ? `إضافة بطل مساعد${item.coHeroName ? ` (${item.coHeroName})` : ''}`
                                        : `Co-Hero Add-on${item.coHeroName ? ` (${item.coHeroName})` : ''}`}
                                    </span>
                                  </span>
                                  <span className="text-[11px] font-bold font-numeric shrink-0">
                                    {formatMultiCurrencyAddon(ADDON_PRICING.coHero, language)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Item Quantity and Unit Total */}
                          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 bg-slate-900 border border-white/10 rounded-xl p-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                aria-label={language === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="text-xs font-bold text-white px-2 font-numeric">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                aria-label={language === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="text-end font-numeric">
                              <span className="text-sm font-extrabold text-white block">
                                {formatMoney(itemTotalEgp, 'EGP', language)}
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                ({formatMoney(itemTotalSar, 'SAR', language)} •{' '}
                                {formatMoney(itemTotalAed, 'AED', language)})
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* 1-Click Cart Micro-Upsell Strip: Hardcover Book Add-ons + Classic 20cm Bub Plush */}
                    {(hardcoverMissingGiftBox || hardcoverMissingStickers || bubPlushUpsell) && (
                      <div className="rounded-2xl bg-gradient-to-br from-purple-950/60 via-slate-950/90 to-cyan-950/50 border border-purple-400/30 p-3.5 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-200">
                          <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
                          <span>
                            {language === 'ar'
                              ? 'أكمل هدية طفلك بضغطة واحدة'
                              : 'Upgrade Your Gift in 1 Click'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {bubPlushUpsell && (
                            <button
                              type="button"
                              onClick={() =>
                                addMerchItem({
                                  product: bubPlushUpsell.product,
                                  variant: bubPlushUpsell.variant,
                                  quantity: 1,
                                })
                              }
                              className="min-h-[52px] w-full px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-950/70 to-purple-950/70 hover:from-cyan-900/70 hover:to-purple-900/70 border border-cyan-400/40 hover:border-cyan-300 text-xs font-semibold text-white flex items-center justify-between gap-2.5 transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2.5 text-start min-w-0">
                                <img
                                  src={bubPlushUpsell.product.coverImage}
                                  alt={
                                    language === 'ar'
                                      ? bubPlushUpsell.product.nameAr
                                      : bubPlushUpsell.product.nameEn
                                  }
                                  className="w-9 h-9 rounded-lg object-cover border border-cyan-300/35 shrink-0"
                                />
                                <span className="min-w-0">
                                  <span className="block font-bold text-white leading-snug">
                                    {language === 'ar'
                                      ? 'أضف كورة Bub القطيفة (كلاسيك 20 سم)'
                                      : 'Add Bub Plush Ball (Classic 20cm)'}
                                  </span>
                                  <span className="block text-[11px] text-cyan-200 font-numeric">
                                    {language === 'ar'
                                      ? `+${bubPlushUpsell.variant?.priceEgp ?? bubPlushUpsell.product.priceEgp} ج.م • ${bubPlushUpsell.variant?.priceSar ?? bubPlushUpsell.product.priceSar} ر.س • ${bubPlushUpsell.variant?.priceAed ?? bubPlushUpsell.product.priceAed} د.إ`
                                      : `+${bubPlushUpsell.variant?.priceEgp ?? bubPlushUpsell.product.priceEgp} EGP • ${bubPlushUpsell.variant?.priceSar ?? bubPlushUpsell.product.priceSar} SAR • ${bubPlushUpsell.variant?.priceAed ?? bubPlushUpsell.product.priceAed} AED`}
                                  </span>
                                </span>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/25 text-cyan-100 font-bold shrink-0">
                                {language === 'ar' ? '+ إضافة' : '+ Add'}
                              </span>
                            </button>
                          )}

                          {hardcoverMissingGiftBox && (
                            <button
                              type="button"
                              onClick={() =>
                                updateItemAddons(hardcoverMissingGiftBox.id, {
                                  hasGiftBoxAddon: true,
                                })
                              }
                              className="min-h-[44px] w-full px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-purple-600/25 border border-purple-400/35 hover:border-purple-300 text-xs font-semibold text-white flex items-center justify-between gap-2 transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2 text-start min-w-0">
                                <Gift className="w-4 h-4 text-pink-300 shrink-0" />
                                <span className="min-w-0">
                                  <span className="block">
                                    {language === 'ar'
                                      ? 'أضف علبة هدايا فاخرة للكتاب'
                                      : 'Add Luxury Gift Box to Book'}
                                  </span>
                                  <span className="block text-[11px] text-purple-200/90 font-numeric">
                                    {formatMultiCurrencyAddon(ADDON_PRICING.giftBox, language)}
                                  </span>
                                </span>
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-purple-500/25 text-purple-200 font-bold shrink-0">
                                {language === 'ar' ? '+ إضافة' : '+ Add'}
                              </span>
                            </button>
                          )}

                          {hardcoverMissingStickers && (
                            <button
                              type="button"
                              onClick={() =>
                                updateItemAddons(hardcoverMissingStickers.id, {
                                  hasStickersAddon: true,
                                })
                              }
                              className="min-h-[44px] w-full px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-amber-600/20 border border-amber-400/35 hover:border-amber-300 text-xs font-semibold text-white flex items-center justify-between gap-2 transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2 text-start min-w-0">
                                <Sticker className="w-4 h-4 text-amber-300 shrink-0" />
                                <span className="min-w-0">
                                  <span className="block">
                                    {language === 'ar'
                                      ? 'أضف 24 ستيكر مخصص للكتاب'
                                      : 'Add 24 Custom Stickers to Book'}
                                  </span>
                                  <span className="block text-[11px] text-amber-200/90 font-numeric">
                                    {formatMultiCurrencyAddon(ADDON_PRICING.stickers, language)}
                                  </span>
                                </span>
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/25 text-amber-200 font-bold shrink-0">
                                {language === 'ar' ? '+ إضافة' : '+ Add'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Promo Code Input Row */}
                    <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-3.5 space-y-2.5">
                      <label
                        htmlFor="cart-promo-input"
                        className="text-xs font-semibold text-slate-200 flex items-center gap-2"
                      >
                        <Tag className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>
                          {language === 'ar' ? 'لديك كود خصم؟' : 'Have a promo code?'}
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
                              ({language === 'ar'
                                ? `خصم ${promoDiscountPercent}%`
                                : `${promoDiscountPercent}% OFF`}
                              )
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={handleClearPromo}
                            aria-label={language === 'ar' ? 'إزالة كود الخصم' : 'Remove promo code'}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyPromo} className="flex items-center gap-2">
                          <Input
                            id="cart-promo-input"
                            value={promoInput}
                            onChange={(e) => {
                              setPromoInput(e.target.value);
                              if (promoFeedback) setPromoFeedback(null);
                            }}
                            dir="ltr"
                            placeholder="WELCOME15"
                            className="h-11 bg-slate-900 border-white/15 rounded-xl text-xs sm:text-sm text-white uppercase font-numeric"
                          />
                          <Button
                            type="submit"
                            variant="outline"
                            className="h-11 px-4 rounded-xl border-cyan-400/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-xs font-bold shrink-0"
                          >
                            {language === 'ar' ? 'تطبيق' : 'Apply'}
                          </Button>
                        </form>
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

                    {/* Order Notes Collapsible Accordion */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setOrderNotesOpen(!orderNotesOpen)}
                        aria-expanded={orderNotesOpen}
                        className="w-full min-h-[44px] flex items-center justify-between text-xs text-slate-300 hover:text-white py-2 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-400" />
                          <span>
                            {language === 'ar'
                              ? 'إضافة ملاحظات خاصة للطلب (اختياري)'
                              : 'Add order notes (optional)'}
                          </span>
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            orderNotesOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {orderNotesOpen && (
                        <div className="mt-2">
                          <Textarea
                            rows={2}
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            placeholder={
                              language === 'ar'
                                ? 'أي تفاصيل إضافية بخصوص موعد التوصيل أو مظهر البطل...'
                                : 'Any delivery instructions or special story details...'
                            }
                            className="bg-slate-950 border-white/15 rounded-xl text-xs sm:text-sm text-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              {items.length > 0 && (
                <div className="p-5 border-t border-white/10 bg-slate-950/90 space-y-4">
                  <div className="space-y-1.5">
                    {pricingEgp.totalDiscount > 0 && (
                      <div className="flex items-center justify-between text-xs text-slate-400 font-numeric">
                        <span>{language === 'ar' ? 'المجموع قبل الخصم:' : 'Subtotal:'}</span>
                        <span className="line-through">
                          {language === 'ar'
                            ? `${pricingEgp.subtotal} ج.م`
                            : `${pricingEgp.subtotal} EGP`}
                        </span>
                      </div>
                    )}

                    {pricingEgp.volumeDiscountAmount > 0 && (
                      <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold font-numeric">
                        <span>
                          {language === 'ar'
                            ? `خصم باقة الإخوة (${pricingEgp.volumeDiscountPercent}%):`
                            : `Sibling Bundle (${pricingEgp.volumeDiscountPercent}% OFF):`}
                        </span>
                        <span>
                          {language === 'ar'
                            ? `-${pricingEgp.volumeDiscountAmount} ج.م`
                            : `-${pricingEgp.volumeDiscountAmount} EGP`}
                        </span>
                      </div>
                    )}

                    {promoCode && pricingEgp.promoDiscountAmount > 0 && (
                      <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold font-numeric">
                        <span>
                          {language === 'ar'
                            ? `كود ${promoCode} (${promoDiscountPercent}%):`
                            : `Promo ${promoCode} (${promoDiscountPercent}% OFF):`}
                        </span>
                        <span>
                          {language === 'ar'
                            ? `-${pricingEgp.promoDiscountAmount} ج.م`
                            : `-${pricingEgp.promoDiscountAmount} EGP`}
                        </span>
                      </div>
                    )}

                    {pricingEgp.freeShippingUnlocked && (
                      <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                        <span>{language === 'ar' ? 'الشحن السريع:' : 'Fast Shipping:'}</span>
                        <span>{language === 'ar' ? 'مجاني' : 'FREE'}</span>
                      </div>
                    )}

                    {gwpConfig.enabled && gwpStatus.unlocked && (
                      <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                        <span>
                          {language === 'ar'
                            ? '🎁 هدية كورة Bub القطيفة:'
                            : '🎁 FREE Bub Plush Gift:'}
                        </span>
                        <span className="font-numeric">
                          {language === 'ar' ? '0 ج.م (مجانية)' : '0 EGP (FREE)'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs sm:text-sm text-slate-200 pt-1 border-t border-white/10">
                      <span className="font-semibold">
                        {language === 'ar' ? 'الإجمالي النهائي:' : 'Estimated Total:'}
                      </span>
                      <div className="text-end font-numeric">
                        <span className="text-lg font-extrabold text-white block">
                          {formatMoney(pricingEgp.total, 'EGP', language)}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          ({formatMoney(pricingSar.total, 'SAR', language)} •{' '}
                          {formatMoney(pricingAed.total, 'AED', language)})
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">
                      {totalBooks > 0
                        ? language === 'ar'
                          ? 'شامل الرسم المخصّص ومراجعة المسودة قبل الطباعة.'
                          : 'Includes custom illustration & full draft review before printing.'
                        : language === 'ar'
                        ? 'تغليف هدايا فاخر وشحن سريع مع فحص الجودة قبل التوصيل.'
                        : 'Includes gift-ready packaging & fast tracked shipping.'}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <Button
                      type="button"
                      onClick={() => openCheckout()}
                      className="w-full h-12 bubble-btn bubble-btn-primary text-sm font-bold gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {language === 'ar'
                          ? 'إتمام الطلب الآن (بدون حساب)'
                          : 'Proceed to Guest Checkout'}
                      </span>
                    </Button>

                    <Button
                      type="button"
                      variant="emerald"
                      onClick={openWhatsAppCheckout}
                      className="w-full h-11 text-xs sm:text-sm font-semibold gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>
                        {language === 'ar'
                          ? 'تأكيد السلة عبر واتساب'
                          : 'Confirm Order on WhatsApp'}
                      </span>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      {language === 'ar' ? 'تفريغ السلة' : 'Empty Cart'}
                    </button>
                    <button
                      type="button"
                      onClick={closeCart}
                      className="text-cyan-400 hover:underline cursor-pointer"
                    >
                      {language === 'ar' ? 'متابعة التصفح' : 'Continue Shopping'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
