import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ADDON_PRICING,
  calculateAddonTotal,
  calculateB2BBulkQuote,
  calculateCartPricing,
  deriveAedFromSar,
  estimateDeliveryWindow,
  getCurrencyMeta,
  getVolumeDiscountTier,
} from '../src/features/commerce/pricingEngine.ts';

test('getCurrencyMeta returns accurate EGP, SAR, and AED metadata in Arabic and English', () => {
  assert.deepEqual(getCurrencyMeta('EG'), {
    code: 'EGP',
    labelAr: 'ج.م',
    labelEn: 'EGP',
    countryAr: 'مصر',
    countryEn: 'Egypt',
  });

  assert.deepEqual(getCurrencyMeta('SA'), {
    code: 'SAR',
    labelAr: 'ر.س',
    labelEn: 'SAR',
    countryAr: 'السعودية',
    countryEn: 'Saudi Arabia',
  });

  assert.deepEqual(getCurrencyMeta('AE'), {
    code: 'AED',
    labelAr: 'د.إ',
    labelEn: 'AED',
    countryAr: 'الإمارات',
    countryEn: 'UAE',
  });
});

test('deriveAedFromSar rounds cleanly with 1:1 parity and guards invalid values', () => {
  assert.equal(deriveAedFromSar(99), 99);
  assert.equal(deriveAedFromSar(49.4), 49);
  assert.equal(deriveAedFromSar(49.5), 50);
  assert.equal(deriveAedFromSar(0), 0);
  assert.equal(deriveAedFromSar(-25), 0);
  assert.equal(deriveAedFromSar(Number.NaN), 0);
});

test('ADDON_PRICING and calculateAddonTotal sum selected add-ons accurately per country', () => {
  assert.deepEqual(ADDON_PRICING, {
    coloring: { egp: 75, sar: 19, aed: 19 },
    giftBox: { egp: 95, sar: 25, aed: 25 },
    stickers: { egp: 65, sar: 18, aed: 18 },
    audioStory: { egp: 110, sar: 29, aed: 29 },
    coHero: { egp: 80, sar: 20, aed: 20 },
  });

  assert.equal(calculateAddonTotal({}, 'EG'), 0);
  assert.equal(calculateAddonTotal({}, 'SA'), 0);
  assert.equal(calculateAddonTotal({}, 'AE'), 0);

  const allAddons = {
    hasColoringBookAddon: true,
    hasGiftBoxAddon: true,
    hasStickersAddon: true,
    hasAudioStoryAddon: true,
    hasCoHeroAddon: true,
  };
  assert.equal(calculateAddonTotal(allAddons, 'EG'), 75 + 95 + 65 + 110 + 80);
  assert.equal(calculateAddonTotal(allAddons, 'SA'), 19 + 25 + 18 + 29 + 20);
  assert.equal(calculateAddonTotal(allAddons, 'AE'), 19 + 25 + 18 + 29 + 20);

  const partial = { hasGiftBoxAddon: true, hasCoHeroAddon: true };
  assert.equal(calculateAddonTotal(partial, 'EG'), 175);
  assert.equal(calculateAddonTotal(partial, 'SA'), 45);
  assert.equal(calculateAddonTotal(partial, 'AE'), 45);
});

test('getVolumeDiscountTier maps book quantities to 0%, 15%, and 25% tiers with next-tier metadata', () => {
  assert.deepEqual(getVolumeDiscountTier(0), {
    percent: 0,
    nextTierQty: 2,
    nextTierPercent: 15,
  });
  assert.deepEqual(getVolumeDiscountTier(1), {
    percent: 0,
    nextTierQty: 2,
    nextTierPercent: 15,
  });
  assert.deepEqual(getVolumeDiscountTier(2), {
    percent: 15,
    nextTierQty: 3,
    nextTierPercent: 25,
  });
  assert.deepEqual(getVolumeDiscountTier(3), {
    percent: 25,
    nextTierQty: null,
    nextTierPercent: null,
  });
  assert.deepEqual(getVolumeDiscountTier(7), {
    percent: 25,
    nextTierQty: null,
    nextTierPercent: null,
  });
  assert.deepEqual(getVolumeDiscountTier(-3), {
    percent: 0,
    nextTierQty: 2,
    nextTierPercent: 15,
  });
});

test('estimateDeliveryWindow calculates fast digital and regional business-day hardcover windows without mutating fromDate', () => {
  // Wednesday, Nov 18, 2026 (local noon to avoid DST/timezone edge shifts)
  const wed = new Date(2026, 10, 18, 12, 0, 0);
  const wedTimeBefore = wed.getTime();

  const digital = estimateDeliveryWindow('EG', 'digital_pdf', wed);
  assert.equal(digital.minDays, 1);
  assert.equal(digital.maxDays, 2);
  assert.equal(digital.startDate.getDate(), 19);
  assert.equal(digital.endDate.getDate(), 20);
  assert.match(digital.labelEn, /1–2 days/);
  assert.match(digital.labelAr, /1–2 يوم/);

  // EG hardcover: 3-5 business days skipping Fri (Nov 20) & Sat (Nov 21)
  // Day 1: Thu 19, Day 2: Sun 22, Day 3: Mon 23, Day 4: Tue 24, Day 5: Wed 25
  const egHardcover = estimateDeliveryWindow('EG', 'hardcover_book', wed);
  assert.equal(egHardcover.minDays, 3);
  assert.equal(egHardcover.maxDays, 5);
  assert.equal(egHardcover.startDate.getDate(), 23);
  assert.equal(egHardcover.endDate.getDate(), 25);
  assert.match(egHardcover.labelEn, /Nov 23–25 \(3–5 business days\)/);
  assert.match(egHardcover.labelAr, /23–25 نوفمبر \(3–5 أيام عمل\)/);

  // SA hardcover: 5-7 business days skipping Fri (20), Sat (21), Fri (27), Sat (28)
  // Day 5: Wed 25, Day 6: Thu 26, Day 7: Sun 29
  const saHardcover = estimateDeliveryWindow('SA', 'hardcover_book', wed);
  assert.equal(saHardcover.minDays, 5);
  assert.equal(saHardcover.maxDays, 7);
  assert.equal(saHardcover.startDate.getDate(), 25);
  assert.equal(saHardcover.endDate.getDate(), 29);

  // AE hardcover: 4-6 business days skipping Sat (21) & Sun (22)
  // Day 1: Thu 19, Day 2: Fri 20, Day 3: Mon 23, Day 4: Tue 24, Day 5: Wed 25, Day 6: Thu 26
  const aeHardcover = estimateDeliveryWindow('AE', 'hardcover_book', wed);
  assert.equal(aeHardcover.minDays, 4);
  assert.equal(aeHardcover.maxDays, 6);
  assert.equal(aeHardcover.startDate.getDate(), 24);
  assert.equal(aeHardcover.endDate.getDate(), 26);

  // Cross-month label check: Nov 28, 2026
  const lateNov = new Date(2026, 10, 28, 12, 0, 0);
  const crossMonth = estimateDeliveryWindow('EG', 'hardcover_book', lateNov);
  assert.equal(crossMonth.startDate.getMonth(), 11); // December
  assert.match(crossMonth.labelEn, /Dec/);
  assert.match(crossMonth.labelAr, /ديسمبر/);

  // Original input Date must never be mutated
  assert.equal(wed.getTime(), wedTimeBefore);
});

test('calculateCartPricing handles empty carts, add-ons, multi-currency AED fallback, volume + promo stacking, and shipping thresholds', () => {
  const empty = calculateCartPricing([], 'EG', 15);
  assert.deepEqual(empty, {
    subtotal: 0,
    volumeDiscountPercent: 0,
    volumeDiscountAmount: 0,
    promoDiscountPercent: 15,
    promoDiscountAmount: 0,
    totalDiscount: 0,
    total: 0,
    totalBooks: 0,
    freeShippingUnlocked: false,
    booksToFreeShipping: 2,
  });

  // Single book with gift box + coloring book in EG, no promo
  const singleEg = calculateCartPricing(
    [
      {
        priceEgp: 450,
        priceSar: 99,
        quantity: 1,
        hasColoringBookAddon: true, // +75
        hasGiftBoxAddon: true, // +95
      },
    ],
    'EG'
  );
  assert.equal(singleEg.subtotal, 620);
  assert.equal(singleEg.volumeDiscountPercent, 0);
  assert.equal(singleEg.volumeDiscountAmount, 0);
  assert.equal(singleEg.promoDiscountAmount, 0);
  assert.equal(singleEg.total, 620);
  assert.equal(singleEg.totalBooks, 1);
  assert.equal(singleEg.freeShippingUnlocked, false);
  assert.equal(singleEg.booksToFreeShipping, 1);

  // 2 books (15% volume discount) + 20% promo applied to remaining amount
  // Item 1: 450 + 80 (coHero) = 530; Item 2: 470 => subtotal = 1000
  // Volume 15% of 1000 = 150 -> remaining 850
  // Promo 20% of 850 = 170 -> totalDiscount = 320 -> total = 680
  const stacked = calculateCartPricing(
    [
      { priceEgp: 450, priceSar: 99, quantity: 1, hasCoHeroAddon: true },
      { priceEgp: 470, priceSar: 105, quantity: 1 },
    ],
    'EG',
    20
  );
  assert.equal(stacked.subtotal, 1000);
  assert.equal(stacked.volumeDiscountPercent, 15);
  assert.equal(stacked.volumeDiscountAmount, 150);
  assert.equal(stacked.promoDiscountPercent, 20);
  assert.equal(stacked.promoDiscountAmount, 170);
  assert.equal(stacked.totalDiscount, 320);
  assert.equal(stacked.total, 680);
  assert.equal(stacked.totalBooks, 2);
  assert.equal(stacked.freeShippingUnlocked, true);
  assert.equal(stacked.booksToFreeShipping, 0);

  // 3 books in AE: first uses explicit priceAed, second falls back via deriveAedFromSar
  // Item 1: (110 + 18 stickers) * 2 = 256; Item 2: (99 derived + 29 audio) * 1 = 128 -> subtotal 384
  // Volume 25% of 384 = 96 -> remaining 288; Promo 15% of 288 = 43.2 -> 43
  // totalDiscount = 139, total = 245
  const uaeThreeBooks = calculateCartPricing(
    [
      { priceEgp: 500, priceSar: 115, priceAed: 110, quantity: 2, hasStickersAddon: true },
      { priceEgp: 450, priceSar: 99, quantity: 1, hasAudioStoryAddon: true },
    ],
    'AE',
    15,
    3
  );
  assert.equal(uaeThreeBooks.subtotal, 384);
  assert.equal(uaeThreeBooks.volumeDiscountPercent, 25);
  assert.equal(uaeThreeBooks.volumeDiscountAmount, 96);
  assert.equal(uaeThreeBooks.promoDiscountAmount, 43);
  assert.equal(uaeThreeBooks.totalDiscount, 139);
  assert.equal(uaeThreeBooks.total, 245);
  assert.equal(uaeThreeBooks.totalBooks, 3);
  assert.equal(uaeThreeBooks.freeShippingUnlocked, true);
  assert.equal(uaeThreeBooks.booksToFreeShipping, 0);

  // Extreme promo (>100%) clamps cleanly and never goes negative
  const extremePromo = calculateCartPricing(
    [{ priceEgp: 450, priceSar: 99, quantity: 3 }],
    'EG',
    250
  );
  assert.equal(extremePromo.promoDiscountPercent, 100);
  assert.equal(extremePromo.total, 0);
  assert.equal(extremePromo.subtotal - extremePromo.totalDiscount, 0);
});

test('calculateB2BBulkQuote enforces exact base prices, tier discounts, and invoice accounting across EG, SA, AE', () => {
  // Under 20 -> 0%
  const small = calculateB2BBulkQuote(10, 'EG', 'hardcover_book');
  assert.equal(small.baseUnitPrice, 450);
  assert.equal(small.discountPercent, 0);
  assert.equal(small.unitPrice, 450);
  assert.equal(small.total, 4500);
  assert.equal(small.savings, 0);
  assert.equal(small.currencyAr, 'ج.م');
  assert.equal(small.currencyEn, 'EGP');

  // 20-49 -> 20% off
  const tier1 = calculateB2BBulkQuote(25, 'EG', 'hardcover_book');
  assert.equal(tier1.discountPercent, 20);
  assert.equal(tier1.unitPrice, 360);
  assert.equal(tier1.total, 9000);
  assert.equal(tier1.savings, 2250);

  // 50-99 -> 32% off (SA hardcover base 99 -> 67)
  const tier2 = calculateB2BBulkQuote(50, 'SA', 'hardcover_book');
  assert.equal(tier2.baseUnitPrice, 99);
  assert.equal(tier2.discountPercent, 32);
  assert.equal(tier2.unitPrice, 67);
  assert.equal(tier2.total, 3350);
  assert.equal(tier2.savings, 99 * 50 - 3350);
  assert.equal(tier2.currencyAr, 'ر.س');
  assert.equal(tier2.currencyEn, 'SAR');

  // 100-249 -> 42% off (AE digital base 49 -> 28)
  const tier3 = calculateB2BBulkQuote(100, 'AE', 'digital_pdf');
  assert.equal(tier3.baseUnitPrice, 49);
  assert.equal(tier3.discountPercent, 42);
  assert.equal(tier3.unitPrice, 28);
  assert.equal(tier3.total, 2800);
  assert.equal(tier3.savings, 49 * 100 - 2800);
  assert.equal(tier3.currencyAr, 'د.إ');
  assert.equal(tier3.currencyEn, 'AED');

  // 250+ -> 52% off (EG digital base 200 -> 96)
  const tier4 = calculateB2BBulkQuote(250, 'EG', 'digital_pdf');
  assert.equal(tier4.baseUnitPrice, 200);
  assert.equal(tier4.discountPercent, 52);
  assert.equal(tier4.unitPrice, 96);
  assert.equal(tier4.total, 24000);
  assert.equal(tier4.savings, 26000);

  // Boundary checks: 49 -> 20%, 99 -> 32%, 249 -> 42%, 0 -> 0 total
  assert.equal(calculateB2BBulkQuote(49, 'AE', 'hardcover_book').discountPercent, 20);
  assert.equal(calculateB2BBulkQuote(99, 'AE', 'hardcover_book').discountPercent, 32);
  assert.equal(calculateB2BBulkQuote(249, 'AE', 'hardcover_book').discountPercent, 42);
  assert.equal(calculateB2BBulkQuote(0, 'EG', 'hardcover_book').total, 0);
});
