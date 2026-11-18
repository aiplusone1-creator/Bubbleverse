export type CurrencyCountry = 'EG' | 'SA' | 'AE';

export type CurrencyCode = 'EGP' | 'SAR' | 'AED';

export type StoryOccasion =
  | 'birthday'
  | 'ramadan_eid'
  | 'siblings'
  | 'graduation'
  | 'bedtime_values'
  | 'everyday';

export type BookFormat = 'hardcover_book' | 'digital_pdf';

export type CommerceItemFormat = 'hardcover_book' | 'digital_pdf' | 'physical_merch';

export type CartItemType = 'book' | 'merch' | 'gwp_gift';

export interface AddonFlags {
  hasColoringBookAddon?: boolean;
  hasGiftBoxAddon?: boolean;
  hasStickersAddon?: boolean;
  hasAudioStoryAddon?: boolean;
  hasCoHeroAddon?: boolean;
}

export const ADDON_PRICING = {
  coloring: { egp: 75, sar: 19, aed: 19 },
  giftBox: { egp: 95, sar: 25, aed: 25 },
  stickers: { egp: 65, sar: 18, aed: 18 },
  audioStory: { egp: 110, sar: 29, aed: 29 },
  coHero: { egp: 80, sar: 20, aed: 20 },
} as const;

export interface CurrencyMeta {
  code: 'EGP' | 'SAR' | 'AED';
  labelAr: string;
  labelEn: string;
  countryAr: string;
  countryEn: string;
}

export interface VolumeDiscountTier {
  percent: number;
  nextTierQty: number | null;
  nextTierPercent: number | null;
}

export interface DeliveryWindowEstimate {
  minDays: number;
  maxDays: number;
  startDate: Date;
  endDate: Date;
  labelAr: string;
  labelEn: string;
}

export interface PricedCartItem extends AddonFlags {
  priceEgp: number;
  priceSar: number;
  priceAed?: number;
  quantity: number;
  itemType?: CartItemType;
  isFreeGift?: boolean;
}

export interface CartPricingSummary {
  subtotal: number;
  volumeDiscountPercent: number;
  volumeDiscountAmount: number;
  promoDiscountPercent: number;
  promoDiscountAmount: number;
  totalDiscount: number;
  total: number;
  totalBooks: number;
  freeShippingUnlocked: boolean;
  booksToFreeShipping: number;
  totalMerchItems?: number;
  bookSubtotal?: number;
}

export interface B2BBulkQuote {
  tierNameAr: string;
  tierNameEn: string;
  unitPrice: number;
  baseUnitPrice: number;
  discountPercent: number;
  total: number;
  savings: number;
  currencyAr: string;
  currencyEn: string;
}

const CURRENCY_META_MAP: Record<CurrencyCountry, CurrencyMeta> = {
  EG: {
    code: 'EGP',
    labelAr: 'ج.م',
    labelEn: 'EGP',
    countryAr: 'مصر',
    countryEn: 'Egypt',
  },
  SA: {
    code: 'SAR',
    labelAr: 'ر.س',
    labelEn: 'SAR',
    countryAr: 'السعودية',
    countryEn: 'Saudi Arabia',
  },
  AE: {
    code: 'AED',
    labelAr: 'د.إ',
    labelEn: 'AED',
    countryAr: 'الإمارات',
    countryEn: 'UAE',
  },
};

const COUNTRY_PRICE_KEY: Record<CurrencyCountry, 'egp' | 'sar' | 'aed'> = {
  EG: 'egp',
  SA: 'sar',
  AE: 'aed',
};

const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;

const HARDCOVER_DELIVERY_DAYS: Record<CurrencyCountry, { min: number; max: number }> = {
  EG: { min: 3, max: 5 },
  SA: { min: 5, max: 7 },
  AE: { min: 4, max: 6 },
};

const B2B_BASE_PRICES: Record<BookFormat, Record<CurrencyCountry, number>> = {
  hardcover_book: {
    EG: 450,
    SA: 99,
    AE: 99,
  },
  digital_pdf: {
    EG: 200,
    SA: 49,
    AE: 49,
  },
};

export function getCurrencyMeta(country: CurrencyCountry): CurrencyMeta {
  return CURRENCY_META_MAP[country];
}

const CURRENCY_CODE_TO_COUNTRY: Record<CurrencyCode, CurrencyCountry> = {
  EGP: 'EG',
  SAR: 'SA',
  AED: 'AE',
};

export function normalizeCurrencyCode(
  raw: string | undefined,
  fallbackCountry?: CurrencyCountry
): CurrencyCode {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      const upper = trimmed.toUpperCase();
      if (
        upper === 'EGP' ||
        upper === 'EG' ||
        upper === 'LE' ||
        upper === 'L.E' ||
        upper === 'L.E.' ||
        upper === 'E£' ||
        upper === 'EGYPT' ||
        trimmed === 'ج.م' ||
        trimmed === 'جنيه' ||
        trimmed === 'جنيه مصري' ||
        trimmed === 'مصر'
      ) {
        return 'EGP';
      }
      if (
        upper === 'SAR' ||
        upper === 'SA' ||
        upper === 'SR' ||
        upper === 'S.R.' ||
        upper === 'SAUDI' ||
        trimmed === 'ر.س' ||
        trimmed === 'ريال' ||
        trimmed === 'ريال سعودي' ||
        trimmed === 'السعودية'
      ) {
        return 'SAR';
      }
      if (
        upper === 'AED' ||
        upper === 'AE' ||
        upper === 'DHS' ||
        upper === 'DH' ||
        upper === 'UAE' ||
        trimmed === 'د.إ' ||
        trimmed === 'درهم' ||
        trimmed === 'درهم إماراتي' ||
        trimmed === 'الإمارات'
      ) {
        return 'AED';
      }
    }
  }

  if (fallbackCountry && CURRENCY_META_MAP[fallbackCountry]) {
    return CURRENCY_META_MAP[fallbackCountry].code;
  }

  return 'EGP';
}

export function formatMoney(
  amount: number,
  currencyOrCountry: string,
  language: 'ar' | 'en'
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const code = normalizeCurrencyCode(currencyOrCountry);
  const meta = CURRENCY_META_MAP[CURRENCY_CODE_TO_COUNTRY[code]];
  const formattedNumber = Number.isInteger(safeAmount)
    ? safeAmount.toLocaleString('en-US')
    : Number(safeAmount.toFixed(2)).toLocaleString('en-US');
  const unit = language === 'ar' ? meta.labelAr : meta.labelEn;
  return `${formattedNumber} ${unit}`;
}

export function deriveAedFromSar(sar: number): number {
  if (!Number.isFinite(sar) || sar <= 0) {
    return 0;
  }
  return Math.round(sar);
}

export function calculateAddonTotal(
  addons: AddonFlags,
  country: CurrencyCountry
): number {
  const key = COUNTRY_PRICE_KEY[country];
  let total = 0;
  if (addons.hasColoringBookAddon) total += ADDON_PRICING.coloring[key];
  if (addons.hasGiftBoxAddon) total += ADDON_PRICING.giftBox[key];
  if (addons.hasStickersAddon) total += ADDON_PRICING.stickers[key];
  if (addons.hasAudioStoryAddon) total += ADDON_PRICING.audioStory[key];
  if (addons.hasCoHeroAddon) total += ADDON_PRICING.coHero[key];
  return total;
}

export function getVolumeDiscountTier(totalBookQty: number): VolumeDiscountTier {
  const qty = Number.isFinite(totalBookQty) ? Math.max(0, Math.floor(totalBookQty)) : 0;

  if (qty >= 3) {
    return {
      percent: 25,
      nextTierQty: null,
      nextTierPercent: null,
    };
  }

  if (qty === 2) {
    return {
      percent: 15,
      nextTierQty: 3,
      nextTierPercent: 25,
    };
  }

  return {
    percent: 0,
    nextTierQty: 2,
    nextTierPercent: 15,
  };
}

function isWeekendDay(dayOfWeek: number, country: CurrencyCountry): boolean {
  if (country === 'AE') {
    // UAE weekend: Saturday (6) and Sunday (0)
    return dayOfWeek === 6 || dayOfWeek === 0;
  }
  // Egypt & Saudi Arabia weekend: Friday (5) and Saturday (6)
  return dayOfWeek === 5 || dayOfWeek === 6;
}

function addCalendarDays(baseDate: Date, days: number): Date {
  const result = new Date(baseDate.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function addBusinessDays(
  baseDate: Date,
  businessDays: number,
  country: CurrencyCountry
): Date {
  const result = new Date(baseDate.getTime());
  let remaining = Math.max(0, Math.floor(businessDays));
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (!isWeekendDay(result.getDay(), country)) {
      remaining -= 1;
    }
  }
  return result;
}

function formatDateRangeEn(start: Date, end: Date): string {
  const startMonth = MONTHS_EN[start.getMonth()];
  const endMonth = MONTHS_EN[end.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}–${endDay}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}

function formatDateRangeAr(start: Date, end: Date): string {
  const startMonth = MONTHS_AR[start.getMonth()];
  const endMonth = MONTHS_AR[end.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startDay}–${endDay} ${startMonth}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
}

export function estimateDeliveryWindow(
  country: CurrencyCountry,
  format: CommerceItemFormat,
  fromDate?: Date
): DeliveryWindowEstimate {
  const anchor =
    fromDate instanceof Date && !Number.isNaN(fromDate.getTime())
      ? new Date(fromDate.getTime())
      : new Date();

  if (format === 'digital_pdf') {
    const minDays = 1;
    const maxDays = 2;
    const startDate = addCalendarDays(anchor, minDays);
    const endDate = addCalendarDays(anchor, maxDays);

    return {
      minDays,
      maxDays,
      startDate,
      endDate,
      labelAr: `${formatDateRangeAr(startDate, endDate)} (${minDays}–${maxDays} يوم للمسودة والتسليم الرقمي)`,
      labelEn: `${formatDateRangeEn(startDate, endDate)} (${minDays}–${maxDays} days draft & delivery)`,
    };
  }

  const { min: minDays, max: maxDays } = HARDCOVER_DELIVERY_DAYS[country];
  const startDate = addBusinessDays(anchor, minDays, country);
  const endDate = addBusinessDays(anchor, maxDays, country);

  return {
    minDays,
    maxDays,
    startDate,
    endDate,
    labelAr: `${formatDateRangeAr(startDate, endDate)} (${minDays}–${maxDays} أيام عمل)`,
    labelEn: `${formatDateRangeEn(startDate, endDate)} (${minDays}–${maxDays} business days)`,
  };
}

function resolveItemBasePrice(
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

export function calculateCartPricing(
  items: PricedCartItem[],
  country: CurrencyCountry,
  promoPercent = 0,
  freeShippingThreshold = 2
): CartPricingSummary {
  let rawSubtotal = 0;
  let rawBookSubtotal = 0;
  let totalBooks = 0;
  let totalMerchItems = 0;

  for (const item of items) {
    if (item.isFreeGift || item.itemType === 'gwp_gift') {
      continue;
    }

    const qty = Number.isFinite(item.quantity) ? Math.max(0, Math.floor(item.quantity)) : 0;
    if (qty === 0) continue;

    const itemType: CartItemType = item.itemType ?? 'book';
    const baseUnitPrice = resolveItemBasePrice(item, country);

    if (itemType === 'merch') {
      rawSubtotal += baseUnitPrice * qty;
      totalMerchItems += qty;
    } else {
      const addonUnitPrice = calculateAddonTotal(item, country);
      const lineTotal = (baseUnitPrice + addonUnitPrice) * qty;
      rawSubtotal += lineTotal;
      rawBookSubtotal += lineTotal;
      totalBooks += qty;
    }
  }

  const subtotal = Math.round(rawSubtotal);
  const bookSubtotal = Math.round(rawBookSubtotal);
  const { percent: volumeDiscountPercent } = getVolumeDiscountTier(totalBooks);
  const volumeDiscountAmount = Math.round((bookSubtotal * volumeDiscountPercent) / 100);
  const remainingAfterVolume = Math.max(0, subtotal - volumeDiscountAmount);

  const normalizedPromoPercent = Number.isFinite(promoPercent)
    ? Math.min(100, Math.max(0, promoPercent))
    : 0;
  const promoDiscountAmount = Math.round(
    (remainingAfterVolume * normalizedPromoPercent) / 100
  );

  const totalDiscount = Math.min(subtotal, volumeDiscountAmount + promoDiscountAmount);
  const total = Math.max(0, subtotal - totalDiscount);

  const normalizedThreshold = Number.isFinite(freeShippingThreshold)
    ? Math.max(1, Math.floor(freeShippingThreshold))
    : 2;
  const paidShippingItems = totalBooks + totalMerchItems;
  const freeShippingUnlocked = paidShippingItems >= normalizedThreshold;
  const booksToFreeShipping = freeShippingUnlocked
    ? 0
    : Math.max(0, normalizedThreshold - paidShippingItems);

  const summary: CartPricingSummary = {
    subtotal,
    volumeDiscountPercent,
    volumeDiscountAmount,
    promoDiscountPercent: normalizedPromoPercent,
    promoDiscountAmount,
    totalDiscount,
    total,
    totalBooks,
    freeShippingUnlocked,
    booksToFreeShipping,
  };

  if (items.length > 0) {
    summary.totalMerchItems = totalMerchItems;
    summary.bookSubtotal = bookSubtotal;
  }

  return summary;
}

export function calculateB2BBulkQuote(
  quantity: number,
  country: CurrencyCountry,
  format: BookFormat
): B2BBulkQuote {
  const safeQty = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
  const baseUnitPrice = B2B_BASE_PRICES[format][country];
  const currency = getCurrencyMeta(country);

  let discountPercent = 0;
  let tierNameAr = 'طلب قياسي (أقل من 20 نسخة)';
  let tierNameEn = 'Standard Order (Under 20)';

  if (safeQty >= 250) {
    discountPercent = 52;
    tierNameAr = 'باقة الشركاء والمؤسسات الكبرى (+250 نسخة)';
    tierNameEn = 'Enterprise & District Partner (250+ copies)';
  } else if (safeQty >= 100) {
    discountPercent = 42;
    tierNameAr = 'باقة حفلات التخرج والشركات (100–249 نسخة)';
    tierNameEn = 'Graduation & Corporate Tier (100–249 copies)';
  } else if (safeQty >= 50) {
    discountPercent = 32;
    tierNameAr = 'باقة الحضانة والمدرسة (50–99 نسخة)';
    tierNameEn = 'Nursery & School Tier (50–99 copies)';
  } else if (safeQty >= 20) {
    discountPercent = 20;
    tierNameAr = 'باقة الفصل الدراسي (20–49 نسخة)';
    tierNameEn = 'Classroom Pack (20–49 copies)';
  }

  const unitPrice = Math.round((baseUnitPrice * (100 - discountPercent)) / 100);
  const total = unitPrice * safeQty;
  const baseTotal = baseUnitPrice * safeQty;
  const savings = Math.max(0, baseTotal - total);

  return {
    tierNameAr,
    tierNameEn,
    unitPrice,
    baseUnitPrice,
    discountPercent,
    total,
    savings,
    currencyAr: currency.labelAr,
    currencyEn: currency.labelEn,
  };
}
