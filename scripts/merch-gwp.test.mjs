import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import {
  DEFAULT_MERCH_PRODUCTS,
  MERCH_CATEGORIES,
  getMerchProductById,
} from '../src/features/merch/merchCatalog.ts';
import {
  DEFAULT_GWP_CONFIG,
  evaluateGwpEligibility,
  getGwpRetailValueForCountry,
  getGwpThresholdForCountry,
} from '../src/features/commerce/gwpEngine.ts';
import {
  calculateCartPricing,
  estimateDeliveryWindow,
  formatMoney,
  normalizeCurrencyCode,
} from '../src/features/commerce/pricingEngine.ts';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

test('DEFAULT_MERCH_PRODUCTS seeds all 6 flagship Bubbleverse products with verified assets and complete bilingual specs', () => {
  assert.equal(DEFAULT_MERCH_PRODUCTS.length, 6);

  const expectedIds = [
    'bub-plush-ball',
    'story-bub-giftbox',
    'bub-night-lamp',
    'hero-adventure-backpack',
    'bub-activity-kit',
    'bub-squad-trio',
  ];
  assert.deepEqual(
    DEFAULT_MERCH_PRODUCTS.map((p) => p.id),
    expectedIds
  );

  const validCategories = new Set(MERCH_CATEGORIES.map((c) => c.id));

  for (const product of DEFAULT_MERCH_PRODUCTS) {
    assert.ok(validCategories.has(product.category), `Valid category for ${product.id}`);
    assert.ok(product.sku.length > 0);
    assert.equal(product.slug, product.id);
    assert.ok(product.nameAr.length > 0 && product.nameEn.length > 0);
    assert.ok(product.taglineAr.length > 0 && product.taglineEn.length > 0);
    assert.ok(product.descriptionAr.length > 0 && product.descriptionEn.length > 0);
    assert.ok(product.bubLoreAr.length > 0 && product.bubLoreEn.length > 0);
    assert.ok(product.bedtimeRitualAr.length > 0 && product.bedtimeRitualEn.length > 0);
    assert.ok(product.ageRatingAr.length > 0 && product.ageRatingEn.length > 0);
    assert.ok(product.safetySpecsAr.length >= 3 && product.safetySpecsEn.length >= 3);
    assert.ok(product.careAr.length > 0 && product.careEn.length > 0);
    assert.ok(product.priceEgp > 0 && product.priceSar > 0 && product.priceAed > 0);
    assert.ok(product.variants.length >= 1);
    assert.equal(product.inStock, true);
    assert.ok(product.stockCount > 0);

    // Verify coverImage and every gallery image actually exist in public/
    const allImages = [product.coverImage, ...product.galleryImages];
    for (const imgPath of allImages) {
      assert.ok(imgPath.startsWith('/'), `Image path must be rooted: ${imgPath}`);
      const diskPath = path.join(PUBLIC_DIR, imgPath.replace(/^\//, ''));
      assert.ok(fs.existsSync(diskPath), `Verified asset must exist on disk: ${imgPath}`);
    }

    for (const variant of product.variants) {
      assert.ok(variant.id.length > 0 && variant.sku.length > 0);
      assert.ok(variant.labelAr.length > 0 && variant.labelEn.length > 0);
      assert.ok(variant.dimensionsAr.length > 0 && variant.dimensionsEn.length > 0);
      assert.ok(variant.priceEgp > 0 && variant.priceSar > 0 && variant.priceAed > 0);
    }
  }

  // Flagship Bub Plush Ball exact contract check
  const bub = getMerchProductById('bub-plush-ball');
  assert.ok(bub);
  assert.equal(bub.coverImage, '/artwork/merch-plush.webp');
  assert.equal(bub.coverImage, DEFAULT_GWP_CONFIG.coverImage);
  assert.deepEqual(bub.galleryImages, [bub.coverImage]);
  assert.equal(new Set(DEFAULT_MERCH_PRODUCTS.map((product) => product.coverImage)).size, 6);
  assert.equal(bub.featured, true);
  assert.equal(bub.isGwpEligibleGift, true);
  assert.equal(bub.allowsRibbonName, true);
  assert.deepEqual(
    bub.variants.map((v) => ({
      id: v.id,
      diameterCm: v.diameterCm,
      priceEgp: v.priceEgp,
      priceSar: v.priceSar,
      priceAed: v.priceAed,
      sku: v.sku,
    })),
    [
      {
        id: 'mini-12cm',
        diameterCm: 12,
        priceEgp: 190,
        priceSar: 49,
        priceAed: 49,
        sku: 'BV-BUB-MINI-12',
      },
      {
        id: 'classic-20cm',
        diameterCm: 20,
        priceEgp: 340,
        priceSar: 89,
        priceAed: 89,
        sku: 'BV-BUB-CLASSIC-20',
      },
      {
        id: 'jumbo-30cm',
        diameterCm: 30,
        priceEgp: 520,
        priceSar: 135,
        priceAed: 135,
        sku: 'BV-BUB-JUMBO-30',
      },
    ]
  );

  // Gift Box & Trio savings checks
  const giftBox = getMerchProductById('story-bub-giftbox');
  assert.ok(giftBox);
  assert.equal(giftBox.priceEgp, 690);
  assert.equal(giftBox.compareAtEgp, 840);
  assert.equal(giftBox.variants.length, 2);

  const trio = getMerchProductById('bub-squad-trio');
  assert.ok(trio);
  assert.equal(trio.priceEgp, 820);
  assert.equal(trio.compareAtEgp, 1050);

  assert.equal(getMerchProductById('non-existent'), undefined);
});

test('evaluateGwpEligibility handles all 3 trigger modes, disabled state, and EG/SA/AE thresholds', () => {
  assert.equal(DEFAULT_GWP_CONFIG.enabled, true);
  assert.equal(DEFAULT_GWP_CONFIG.giftMerchId, 'bub-plush-ball');
  assert.equal(DEFAULT_GWP_CONFIG.giftSku, 'BV-BUB-MINI-12');
  assert.equal(DEFAULT_GWP_CONFIG.triggerMode, 'any_hardcover_or_threshold');
  assert.equal(getGwpThresholdForCountry(DEFAULT_GWP_CONFIG, 'EG'), 700);
  assert.equal(getGwpThresholdForCountry(DEFAULT_GWP_CONFIG, 'SA'), 155);
  assert.equal(getGwpThresholdForCountry(DEFAULT_GWP_CONFIG, 'AE'), 155);
  assert.equal(getGwpRetailValueForCountry(DEFAULT_GWP_CONFIG, 'EG'), 190);
  assert.equal(getGwpRetailValueForCountry(DEFAULT_GWP_CONFIG, 'SA'), 49);
  assert.equal(getGwpRetailValueForCountry(DEFAULT_GWP_CONFIG, 'AE'), 49);

  // Mode 1: any_hardcover_or_threshold (default)
  const singleStdBook = evaluateGwpEligibility(
    [{ priceEgp: 450, priceSar: 99, quantity: 1 }],
    'EG',
    DEFAULT_GWP_CONFIG
  );
  assert.equal(singleStdBook.enabled, true);
  assert.equal(singleStdBook.unlocked, false);
  assert.equal(singleStdBook.paidSubtotal, 450);
  assert.equal(singleStdBook.thresholdSubtotal, 700);
  assert.equal(singleStdBook.remainingAmount, 250);
  assert.equal(singleStdBook.remainingBooks, 1);
  assert.equal(singleStdBook.progressPercent, 64);
  assert.match(singleStdBook.messageAr, /250 ج\.م/);
  assert.match(singleStdBook.messageEn, /250 EGP/);

  // 1 Deluxe 25-page Hardcover at 700 EGP unlocks immediately via threshold
  const singleDeluxeBook = evaluateGwpEligibility(
    [{ priceEgp: 700, priceSar: 165, quantity: 1 }],
    'EG',
    DEFAULT_GWP_CONFIG
  );
  assert.equal(singleDeluxeBook.unlocked, true);
  assert.equal(singleDeluxeBook.progressPercent, 100);
  assert.equal(singleDeluxeBook.remainingAmount, 0);
  assert.equal(singleDeluxeBook.remainingBooks, 0);

  // 2 digital books totaling 400 EGP unlock via minBooks
  const twoDigitalBooks = evaluateGwpEligibility(
    [{ priceEgp: 200, priceSar: 49, quantity: 2 }],
    'EG',
    DEFAULT_GWP_CONFIG
  );
  assert.equal(twoDigitalBooks.unlocked, true);
  assert.equal(twoDigitalBooks.progressPercent, 100);
  assert.equal(twoDigitalBooks.remainingAmount, 0);
  assert.equal(twoDigitalBooks.remainingBooks, 0);

  // 1 book (450 EGP) + Classic Bub Merch (340 EGP) = 790 EGP -> unlocks via threshold
  const mixedBookAndMerch = evaluateGwpEligibility(
    [
      { priceEgp: 450, priceSar: 99, quantity: 1, itemType: 'book' },
      { priceEgp: 340, priceSar: 89, priceAed: 89, quantity: 1, itemType: 'merch' },
    ],
    'EG',
    DEFAULT_GWP_CONFIG
  );
  assert.equal(mixedBookAndMerch.unlocked, true);
  assert.equal(mixedBookAndMerch.paidSubtotal, 790);

  // AE check with AED fallback from SAR
  const aeUnlock = evaluateGwpEligibility(
    [{ priceEgp: 720, priceSar: 160, quantity: 1 }],
    'AE',
    DEFAULT_GWP_CONFIG
  );
  assert.equal(aeUnlock.unlocked, true);
  assert.equal(aeUnlock.paidSubtotal, 160);
  assert.equal(aeUnlock.retailValue, 49);
  assert.match(aeUnlock.messageAr, /49 د\.إ/);
  assert.match(aeUnlock.messageEn, /49 AED/);

  // Mode 2: min_books
  const minBooksConfig = { ...DEFAULT_GWP_CONFIG, triggerMode: 'min_books', minBooks: 2 };
  const oneExpensiveBook = evaluateGwpEligibility(
    [
      { priceEgp: 900, priceSar: 210, quantity: 1, itemType: 'book' },
      { priceEgp: 520, priceSar: 135, quantity: 2, itemType: 'merch' },
    ],
    'EG',
    minBooksConfig
  );
  assert.equal(oneExpensiveBook.unlocked, false);
  assert.equal(oneExpensiveBook.remainingBooks, 1);
  assert.equal(oneExpensiveBook.progressPercent, 50);

  const twoBooksMinMode = evaluateGwpEligibility(
    [{ priceEgp: 450, priceSar: 99, quantity: 2, itemType: 'book' }],
    'EG',
    minBooksConfig
  );
  assert.equal(twoBooksMinMode.unlocked, true);
  assert.equal(twoBooksMinMode.progressPercent, 100);

  // Mode 3: min_subtotal
  const minSubtotalConfig = { ...DEFAULT_GWP_CONFIG, triggerMode: 'min_subtotal' };
  const twoCheapBooks = evaluateGwpEligibility(
    [{ priceEgp: 200, priceSar: 49, quantity: 2, itemType: 'book' }],
    'EG',
    minSubtotalConfig
  );
  assert.equal(twoCheapBooks.unlocked, false);
  assert.equal(twoCheapBooks.paidSubtotal, 400);
  assert.equal(twoCheapBooks.remainingAmount, 300);

  const bookWithAddons = evaluateGwpEligibility(
    [
      {
        priceEgp: 550,
        priceSar: 120,
        quantity: 1,
        hasGiftBoxAddon: true, // +95
        hasColoringBookAddon: true, // +75 => 720 EGP
      },
    ],
    'EG',
    minSubtotalConfig
  );
  assert.equal(bookWithAddons.unlocked, true);
  assert.equal(bookWithAddons.paidSubtotal, 720);

  // Disabled GWP config never unlocks
  const disabledResult = evaluateGwpEligibility(
    [{ priceEgp: 1500, priceSar: 400, quantity: 3 }],
    'EG',
    { ...DEFAULT_GWP_CONFIG, enabled: false }
  );
  assert.equal(disabledResult.enabled, false);
  assert.equal(disabledResult.unlocked, false);
  assert.equal(disabledResult.progressPercent, 0);
  assert.equal(disabledResult.messageAr, '');
  assert.equal(disabledResult.messageEn, '');
});

test('GWP free gift items are strictly excluded from GWP eligibility and cart pricing (zero infinite-loop)', () => {
  const belowThresholdBook = { priceEgp: 550, priceSar: 120, quantity: 1, itemType: 'book' };
  const gwpGiftByBoth = {
    priceEgp: 190,
    priceSar: 49,
    priceAed: 49,
    quantity: 1,
    itemType: 'gwp_gift',
    isFreeGift: true,
  };
  const gwpGiftFlagOnly = {
    priceEgp: 300,
    priceSar: 75,
    quantity: 2,
    isFreeGift: true,
  };
  const gwpGiftTypeOnly = {
    priceEgp: 300,
    priceSar: 75,
    quantity: 2,
    itemType: 'gwp_gift',
  };

  // Even with multiple GWP gift rows carrying high nominal prices, eligibility stays locked at 550 EGP / 1 book
  const gwpCheck = evaluateGwpEligibility(
    [belowThresholdBook, gwpGiftByBoth, gwpGiftFlagOnly, gwpGiftTypeOnly],
    'EG',
    DEFAULT_GWP_CONFIG
  );
  assert.equal(gwpCheck.unlocked, false);
  assert.equal(gwpCheck.paidSubtotal, 550);
  assert.equal(gwpCheck.remainingAmount, 150);
  assert.equal(gwpCheck.remainingBooks, 1);

  // Only GWP gift items in cart -> 0 paid subtotal, never unlocks
  const onlyGwp = evaluateGwpEligibility([gwpGiftByBoth], 'EG', DEFAULT_GWP_CONFIG);
  assert.equal(onlyGwp.paidSubtotal, 0);
  assert.equal(onlyGwp.unlocked, false);
  assert.equal(onlyGwp.progressPercent, 0);

  // Pricing ignores GWP gift items in subtotal, totalBooks (no sibling discount!), and free shipping count
  const pricing = calculateCartPricing(
    [belowThresholdBook, gwpGiftByBoth, gwpGiftFlagOnly, gwpGiftTypeOnly],
    'EG',
    0,
    2
  );
  assert.equal(pricing.subtotal, 550);
  assert.equal(pricing.bookSubtotal, 550);
  assert.equal(pricing.totalBooks, 1);
  assert.equal(pricing.totalMerchItems, 0);
  assert.equal(pricing.volumeDiscountPercent, 0);
  assert.equal(pricing.volumeDiscountAmount, 0);
  assert.equal(pricing.freeShippingUnlocked, false);
  assert.equal(pricing.booksToFreeShipping, 1);
  assert.equal(pricing.total, 550);
});

test('calculateCartPricing handles mixed Book + Merch + GWP carts accurately without applying book volume discount to merch or GWP', () => {
  // 1 book (450 EGP) + 1 Classic Bub Plush (340 EGP) + 1 Free GWP Bub (190 nominal) + 10% promo
  // totalBooks = 1 -> 0% volume discount!
  // totalMerchItems = 1 -> 2 paid items total -> freeShippingUnlocked = true!
  // subtotal = 790, promo 10% = 79, total = 711
  const oneBookOneMerch = calculateCartPricing(
    [
      { priceEgp: 450, priceSar: 99, quantity: 1, itemType: 'book' },
      { priceEgp: 340, priceSar: 89, priceAed: 89, quantity: 1, itemType: 'merch' },
      {
        priceEgp: 190,
        priceSar: 49,
        priceAed: 49,
        quantity: 1,
        itemType: 'gwp_gift',
        isFreeGift: true,
      },
    ],
    'EG',
    10,
    2
  );
  assert.equal(oneBookOneMerch.subtotal, 790);
  assert.equal(oneBookOneMerch.bookSubtotal, 450);
  assert.equal(oneBookOneMerch.totalBooks, 1);
  assert.equal(oneBookOneMerch.totalMerchItems, 1);
  assert.equal(oneBookOneMerch.volumeDiscountPercent, 0);
  assert.equal(oneBookOneMerch.volumeDiscountAmount, 0);
  assert.equal(oneBookOneMerch.promoDiscountAmount, 79);
  assert.equal(oneBookOneMerch.total, 711);
  assert.equal(oneBookOneMerch.freeShippingUnlocked, true);
  assert.equal(oneBookOneMerch.booksToFreeShipping, 0);

  // 2 books (500 + 500 = 1000 bookSubtotal) + 1 merch (400) + 1 GWP + 10% promo
  // Volume discount: 15% of bookSubtotal (1000) = 150 (NOT 15% of 1400!)
  // Remaining after volume: 1400 - 150 = 1250
  // Promo: 10% of 1250 = 125
  // Total discount: 275 -> total: 1125
  const twoBooksOneMerch = calculateCartPricing(
    [
      { priceEgp: 500, priceSar: 110, quantity: 2, itemType: 'book' },
      { priceEgp: 400, priceSar: 105, priceAed: 105, quantity: 1, itemType: 'merch' },
      { priceEgp: 190, priceSar: 49, quantity: 1, itemType: 'gwp_gift', isFreeGift: true },
    ],
    'EG',
    10,
    2
  );
  assert.equal(twoBooksOneMerch.subtotal, 1400);
  assert.equal(twoBooksOneMerch.bookSubtotal, 1000);
  assert.equal(twoBooksOneMerch.totalBooks, 2);
  assert.equal(twoBooksOneMerch.totalMerchItems, 1);
  assert.equal(twoBooksOneMerch.volumeDiscountPercent, 15);
  assert.equal(twoBooksOneMerch.volumeDiscountAmount, 150);
  assert.equal(twoBooksOneMerch.promoDiscountAmount, 125);
  assert.equal(twoBooksOneMerch.totalDiscount, 275);
  assert.equal(twoBooksOneMerch.total, 1125);
  assert.equal(twoBooksOneMerch.freeShippingUnlocked, true);

  // Merch-only cart (2 items) qualifies for free shipping & promo, never sibling book discount
  const merchOnly = calculateCartPricing(
    [
      { priceEgp: 340, priceSar: 89, priceAed: 89, quantity: 1, itemType: 'merch' },
      { priceEgp: 420, priceSar: 109, priceAed: 109, quantity: 1, itemType: 'merch' },
    ],
    'SA',
    20,
    2
  );
  assert.equal(merchOnly.subtotal, 198);
  assert.equal(merchOnly.bookSubtotal, 0);
  assert.equal(merchOnly.totalBooks, 0);
  assert.equal(merchOnly.totalMerchItems, 2);
  assert.equal(merchOnly.volumeDiscountPercent, 0);
  assert.equal(merchOnly.volumeDiscountAmount, 0);
  assert.equal(merchOnly.promoDiscountAmount, 40);
  assert.equal(merchOnly.total, 158);
  assert.equal(merchOnly.freeShippingUnlocked, true);
});

test('estimateDeliveryWindow supports physical_merch using regional business-day shipping windows', () => {
  const wed = new Date(2026, 10, 18, 12, 0, 0);

  const egMerch = estimateDeliveryWindow('EG', 'physical_merch', wed);
  assert.equal(egMerch.minDays, 3);
  assert.equal(egMerch.maxDays, 5);
  assert.equal(egMerch.startDate.getDate(), 23);
  assert.equal(egMerch.endDate.getDate(), 25);

  const saMerch = estimateDeliveryWindow('SA', 'physical_merch', wed);
  assert.equal(saMerch.minDays, 5);
  assert.equal(saMerch.maxDays, 7);
  assert.equal(saMerch.startDate.getDate(), 25);
  assert.equal(saMerch.endDate.getDate(), 29);

  const aeMerch = estimateDeliveryWindow('AE', 'physical_merch', wed);
  assert.equal(aeMerch.minDays, 4);
  assert.equal(aeMerch.maxDays, 6);
  assert.equal(aeMerch.startDate.getDate(), 24);
  assert.equal(aeMerch.endDate.getDate(), 26);
});

test('normalizeCurrencyCode and formatMoney normalize legacy Arabic labels, country codes, and ISO codes consistently', () => {
  assert.equal(normalizeCurrencyCode('EGP'), 'EGP');
  assert.equal(normalizeCurrencyCode('egp'), 'EGP');
  assert.equal(normalizeCurrencyCode('EG'), 'EGP');
  assert.equal(normalizeCurrencyCode('ج.م'), 'EGP');
  assert.equal(normalizeCurrencyCode('SAR'), 'SAR');
  assert.equal(normalizeCurrencyCode('SA'), 'SAR');
  assert.equal(normalizeCurrencyCode('ر.س'), 'SAR');
  assert.equal(normalizeCurrencyCode('AED'), 'AED');
  assert.equal(normalizeCurrencyCode('AE'), 'AED');
  assert.equal(normalizeCurrencyCode('د.إ'), 'AED');
  assert.equal(normalizeCurrencyCode(undefined, 'SA'), 'SAR');
  assert.equal(normalizeCurrencyCode('', 'AE'), 'AED');
  assert.equal(normalizeCurrencyCode('invalid', 'AE'), 'AED');
  assert.equal(normalizeCurrencyCode(undefined), 'EGP');

  assert.equal(formatMoney(190, 'EG', 'ar'), '190 ج.م');
  assert.equal(formatMoney(190, 'EGP', 'en'), '190 EGP');
  assert.equal(formatMoney(1250, 'ج.م', 'ar'), '1,250 ج.م');
  assert.equal(formatMoney(1250, 'ج.م', 'en'), '1,250 EGP');
  assert.equal(formatMoney(49, 'ر.س', 'en'), '49 SAR');
  assert.equal(formatMoney(49, 'SAR', 'ar'), '49 ر.س');
  assert.equal(formatMoney(155, 'AE', 'ar'), '155 د.إ');
  assert.equal(formatMoney(155, 'د.إ', 'en'), '155 AED');
  assert.equal(formatMoney(0, 'AED', 'ar'), '0 د.إ');
  assert.equal(formatMoney(Number.NaN, 'SAR', 'en'), '0 SAR');
});
