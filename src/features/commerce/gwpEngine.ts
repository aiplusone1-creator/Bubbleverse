import type { CurrencyCountry, PricedCartItem } from './pricingEngine.ts';
import {
  calculateAddonTotal,
  deriveAedFromSar,
  formatMoney,
} from './pricingEngine.ts';

export type GwpTriggerMode = 'min_books' | 'min_subtotal' | 'any_hardcover_or_threshold';

export interface GwpConfigRecord {
  enabled: boolean;
  giftMerchId: string;
  giftSku: string;
  titleAr: string;
  titleEn: string;
  variantLabelAr: string;
  variantLabelEn: string;
  coverImage: string;
  retailValueEgp: number;
  retailValueSar: number;
  retailValueAed: number;
  triggerMode: GwpTriggerMode;
  minBooks: number;
  minSubtotalEgp: number;
  minSubtotalSar: number;
  minSubtotalAed: number;
  maxPerOrder: number;
  updatedAt: number;
}

export const DEFAULT_GWP_CONFIG: GwpConfigRecord = {
  enabled: true,
  giftMerchId: 'bub-plush-ball',
  giftSku: 'BV-BUB-MINI-12',
  titleAr: 'كورة باب القطيفة المتلألئة (هدية مجانية!)',
  titleEn: 'Official Bub Plush Ball — Mini 12cm (FREE Gift!)',
  variantLabelAr: 'مقاس ميني 12 سم • هدية مجانية',
  variantLabelEn: 'Mini 12cm • Complimentary Gift',
  coverImage: '/merch/bub-plush-ball.jpg',
  retailValueEgp: 190,
  retailValueSar: 49,
  retailValueAed: 49,
  triggerMode: 'any_hardcover_or_threshold',
  minBooks: 2,
  minSubtotalEgp: 700,
  minSubtotalSar: 155,
  minSubtotalAed: 155,
  maxPerOrder: 1,
  updatedAt: 1763424000000,
};

export interface GwpEligibilityResult {
  enabled: boolean;
  unlocked: boolean;
  progressPercent: number;
  paidSubtotal: number;
  thresholdSubtotal: number;
  remainingAmount: number;
  remainingBooks: number;
  retailValue: number;
  messageAr: string;
  messageEn: string;
}

export function getGwpThresholdForCountry(
  config: GwpConfigRecord,
  country: CurrencyCountry
): number {
  if (country === 'EG') {
    return Number.isFinite(config.minSubtotalEgp) ? Math.max(0, config.minSubtotalEgp) : 0;
  }
  if (country === 'SA') {
    return Number.isFinite(config.minSubtotalSar) ? Math.max(0, config.minSubtotalSar) : 0;
  }
  if (Number.isFinite(config.minSubtotalAed)) {
    return Math.max(0, config.minSubtotalAed);
  }
  return deriveAedFromSar(config.minSubtotalSar);
}

export function getGwpRetailValueForCountry(
  config: GwpConfigRecord,
  country: CurrencyCountry
): number {
  if (country === 'EG') {
    return Number.isFinite(config.retailValueEgp) ? Math.max(0, config.retailValueEgp) : 0;
  }
  if (country === 'SA') {
    return Number.isFinite(config.retailValueSar) ? Math.max(0, config.retailValueSar) : 0;
  }
  if (Number.isFinite(config.retailValueAed)) {
    return Math.max(0, config.retailValueAed);
  }
  return deriveAedFromSar(config.retailValueSar);
}

function resolvePaidItemUnitPrice(
  item: PricedCartItem,
  country: CurrencyCountry
): number {
  if (country === 'EG') {
    return Number.isFinite(item.priceEgp) ? Math.max(0, item.priceEgp) : 0;
  }
  if (country === 'SA') {
    return Number.isFinite(item.priceSar) ? Math.max(0, item.priceSar) : 0;
  }
  if (item.priceAed !== undefined && Number.isFinite(item.priceAed)) {
    return Math.max(0, item.priceAed);
  }
  return deriveAedFromSar(item.priceSar);
}

export function evaluateGwpEligibility(
  items: PricedCartItem[],
  country: CurrencyCountry,
  config: GwpConfigRecord = DEFAULT_GWP_CONFIG
): GwpEligibilityResult {
  const thresholdSubtotal = Math.round(getGwpThresholdForCountry(config, country));
  const retailValue = Math.round(getGwpRetailValueForCountry(config, country));
  const minBooks = Number.isFinite(config.minBooks)
    ? Math.max(1, Math.floor(config.minBooks))
    : 2;

  let rawPaidSubtotal = 0;
  let paidBooks = 0;

  for (const item of items) {
    // CRITICAL: Never count free GWP gift items toward paid subtotal or book counts!
    if (item.isFreeGift || item.itemType === 'gwp_gift') {
      continue;
    }

    const qty = Number.isFinite(item.quantity) ? Math.max(0, Math.floor(item.quantity)) : 0;
    if (qty === 0) continue;

    const unitBase = resolvePaidItemUnitPrice(item, country);
    const itemType = item.itemType ?? 'book';

    if (itemType === 'merch') {
      rawPaidSubtotal += unitBase * qty;
    } else {
      const unitAddons = calculateAddonTotal(item, country);
      rawPaidSubtotal += (unitBase + unitAddons) * qty;
      paidBooks += qty;
    }
  }

  const paidSubtotal = Math.round(rawPaidSubtotal);
  const rawRemainingAmount = Math.max(0, thresholdSubtotal - paidSubtotal);
  const rawRemainingBooks = Math.max(0, minBooks - paidBooks);

  if (!config.enabled) {
    return {
      enabled: false,
      unlocked: false,
      progressPercent: 0,
      paidSubtotal,
      thresholdSubtotal,
      remainingAmount: rawRemainingAmount,
      remainingBooks: rawRemainingBooks,
      retailValue,
      messageAr: '',
      messageEn: '',
    };
  }

  const meetsSubtotal =
    thresholdSubtotal > 0 ? paidSubtotal >= thresholdSubtotal : paidSubtotal > 0;
  const meetsBooks = paidBooks >= minBooks;

  let unlocked = false;
  let progressPercent = 0;

  if (config.triggerMode === 'min_books') {
    unlocked = meetsBooks;
    progressPercent = unlocked
      ? 100
      : Math.min(99, Math.max(0, Math.round((paidBooks / minBooks) * 100)));
  } else if (config.triggerMode === 'min_subtotal') {
    unlocked = meetsSubtotal;
    progressPercent = unlocked
      ? 100
      : thresholdSubtotal > 0
        ? Math.min(99, Math.max(0, Math.round((paidSubtotal / thresholdSubtotal) * 100)))
        : 0;
  } else {
    // 'any_hardcover_or_threshold': unlock via minBooks OR paidSubtotal >= country threshold
    unlocked = meetsBooks || meetsSubtotal;
    const bookProgress = Math.round((paidBooks / minBooks) * 100);
    const subtotalProgress =
      thresholdSubtotal > 0 ? Math.round((paidSubtotal / thresholdSubtotal) * 100) : 0;
    progressPercent = unlocked
      ? 100
      : Math.min(99, Math.max(0, Math.max(bookProgress, subtotalProgress)));
  }

  const remainingAmount = unlocked ? 0 : rawRemainingAmount;
  const remainingBooks = unlocked ? 0 : rawRemainingBooks;
  const formattedValueAr = formatMoney(retailValue, country, 'ar');
  const formattedValueEn = formatMoney(retailValue, country, 'en');

  let messageAr: string;
  let messageEn: string;

  if (unlocked) {
    messageAr = `مبروك! فتحت هدية ${config.titleAr} مجاناً (بقيمة ${formattedValueAr})`;
    messageEn = `Unlocked! Your ${config.titleEn} (${formattedValueEn} value) is included FREE!`;
  } else if (config.triggerMode === 'min_books') {
    const booksLabelAr =
      remainingBooks === 1 ? 'كتاب واحد إضافي' : `${remainingBooks} كتب`;
    messageAr = `أضف ${booksLabelAr} لفتح هدية كورة باب القطيفة مجاناً (بقيمة ${formattedValueAr})!`;
    messageEn = `Add ${remainingBooks} more ${remainingBooks === 1 ? 'book' : 'books'} to unlock a FREE Bub Plush Ball (${formattedValueEn} value)!`;
  } else if (config.triggerMode === 'min_subtotal') {
    messageAr = `أنت على بُعد ${formatMoney(remainingAmount, country, 'ar')} فقط من فتح هدية كورة باب القطيفة مجاناً (بقيمة ${formattedValueAr})!`;
    messageEn = `You're only ${formatMoney(remainingAmount, country, 'en')} away from unlocking a FREE Bub Plush Ball (${formattedValueEn} value)!`;
  } else {
    const booksLabelAr =
      remainingBooks === 1 ? 'كتاب واحد' : `${remainingBooks} كتب`;
    messageAr = `أنت على بُعد ${formatMoney(remainingAmount, country, 'ar')} أو ${booksLabelAr} من فتح هدية كورة باب القطيفة مجاناً (بقيمة ${formattedValueAr})!`;
    messageEn = `You're ${formatMoney(remainingAmount, country, 'en')} or ${remainingBooks} ${remainingBooks === 1 ? 'book' : 'books'} away from a FREE Bub Plush Ball (${formattedValueEn} value)!`;
  }

  return {
    enabled: true,
    unlocked,
    progressPercent,
    paidSubtotal,
    thresholdSubtotal,
    remainingAmount,
    remainingBooks,
    retailValue,
    messageAr,
    messageEn,
  };
}
