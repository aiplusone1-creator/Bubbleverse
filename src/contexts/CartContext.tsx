import { useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import type { CartItem } from '@/types/cart';
import {
  calculateCartPricing,
  deriveAedFromSar,
  type CurrencyCountry,
} from '@/features/commerce/pricingEngine';
import {
  evaluateGwpEligibility,
  type GwpConfigRecord,
  type GwpEligibilityResult,
} from '@/features/commerce/gwpEngine';
import { getGwpConfig, validatePromoCode } from '@/lib/localStore';
import {
  CartContext,
  type AddMerchItemInput,
  type ApplyPromoResult,
  type CartItemAddonUpdates,
} from './cartState';

export type { CartItem } from '@/types/cart';

const CART_STORAGE_KEY = 'bubbleverse_shopping_cart_v1';
const CART_PROMO_STORAGE_KEY = 'bubbleverse_cart_promo_v1';
const GWP_STORAGE_KEY = 'bubbleverse_gwp_config_v1';

const VALID_FORMATS = new Set<CartItem['format']>([
  'digital_pdf',
  'hardcover_book',
  'physical_merch',
]);

const VALID_STORY_LANGUAGES = new Set<CartItem['storyLanguage']>([
  'ar',
  'en',
  'bilingual',
]);

function sanitizeHydratedCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];

  const sanitized: CartItem[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      continue;
    }

    const candidate = entry as Record<string, unknown>;

    // Audit Fix #6: Strip any accidental stale GWP / free gift items on load
    if (candidate.isFreeGift === true || candidate.itemType === 'gwp_gift') {
      continue;
    }

    if (
      typeof candidate.id !== 'string' ||
      candidate.id.trim().length === 0 ||
      typeof candidate.titleAr !== 'string' ||
      typeof candidate.titleEn !== 'string' ||
      typeof candidate.priceEgp !== 'number' ||
      !Number.isFinite(candidate.priceEgp) ||
      candidate.priceEgp < 0 ||
      typeof candidate.priceSar !== 'number' ||
      !Number.isFinite(candidate.priceSar) ||
      candidate.priceSar < 0 ||
      typeof candidate.quantity !== 'number' ||
      !Number.isFinite(candidate.quantity) ||
      candidate.quantity <= 0
    ) {
      continue;
    }

    const rawFormat = candidate.format as CartItem['format'];
    const format: CartItem['format'] = VALID_FORMATS.has(rawFormat)
      ? rawFormat
      : candidate.itemType === 'merch'
        ? 'physical_merch'
        : 'hardcover_book';

    const itemType: 'book' | 'merch' =
      candidate.itemType === 'merch' || format === 'physical_merch' ? 'merch' : 'book';

    const priceAed =
      typeof candidate.priceAed === 'number' &&
      Number.isFinite(candidate.priceAed) &&
      candidate.priceAed >= 0
        ? candidate.priceAed
        : deriveAedFromSar(candidate.priceSar);

    const pagesCount =
      typeof candidate.pagesCount === 'number' &&
      Number.isFinite(candidate.pagesCount) &&
      candidate.pagesCount >= 0
        ? Math.floor(candidate.pagesCount)
        : itemType === 'merch'
          ? 0
          : 15;

    const createdAt =
      typeof candidate.createdAt === 'number' && Number.isFinite(candidate.createdAt)
        ? candidate.createdAt
        : Date.now();

    const storyLanguage: CartItem['storyLanguage'] = VALID_STORY_LANGUAGES.has(
      candidate.storyLanguage as CartItem['storyLanguage']
    )
      ? (candidate.storyLanguage as CartItem['storyLanguage'])
      : 'ar';

    const childGender: CartItem['childGender'] =
      candidate.childGender === 'girl' ? 'girl' : 'boy';

    const storyId =
      typeof candidate.storyId === 'string' && candidate.storyId.trim().length > 0
        ? candidate.storyId
        : typeof candidate.merchId === 'string' && candidate.merchId.trim().length > 0
          ? candidate.merchId
          : candidate.id;

    sanitized.push({
      ...(candidate as unknown as CartItem),
      id: candidate.id,
      itemType,
      storyId,
      format,
      formatLabelAr:
        typeof candidate.formatLabelAr === 'string'
          ? candidate.formatLabelAr
          : itemType === 'merch'
            ? 'منتج براند بابل فيرس'
            : format === 'digital_pdf'
              ? 'نسخة رقمية PDF'
              : 'كتاب مطبوع فاخر',
      formatLabelEn:
        typeof candidate.formatLabelEn === 'string'
          ? candidate.formatLabelEn
          : itemType === 'merch'
            ? 'Official Merch'
            : format === 'digital_pdf'
              ? 'Digital PDF'
              : 'Hardcover Book',
      coverImage: typeof candidate.coverImage === 'string' ? candidate.coverImage : '',
      pagesCount,
      priceEgp: candidate.priceEgp,
      priceSar: candidate.priceSar,
      priceAed,
      quantity: Math.max(1, Math.floor(candidate.quantity)),
      childName: typeof candidate.childName === 'string' ? candidate.childName : '',
      childGender,
      childAge: typeof candidate.childAge === 'string' ? candidate.childAge : '',
      storyLanguage,
      isFreeGift: false,
      createdAt,
    });
  }

  return sanitized;
}

function readInitialPromo(): { code: string | null; percent: number } {
  try {
    const raw = localStorage.getItem(CART_PROMO_STORAGE_KEY);
    if (!raw) return { code: null, percent: 0 };
    const result = validatePromoCode(raw);
    if (result.valid && result.promo) {
      return {
        code: result.promo.code,
        percent: result.promo.discountPercent,
      };
    }
    return { code: null, percent: 0 };
  } catch {
    return { code: null, percent: 0 };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      return sanitizeHydratedCartItems(JSON.parse(raw));
    } catch {
      return [];
    }
  });

  const [promoState, setPromoState] = useState<{ code: string | null; percent: number }>(
    () => readInitialPromo()
  );

  const [orderNotes, setOrderNotes] = useState<string>('');
  const [gwpConfig, setGwpConfig] = useState<GwpConfigRecord>(() => getGwpConfig());

  const [isOpen, setIsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<CartItem | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to sync cart to localStorage', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      if (promoState.code) {
        localStorage.setItem(CART_PROMO_STORAGE_KEY, promoState.code);
      } else {
        localStorage.removeItem(CART_PROMO_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to sync cart promo to localStorage', e);
    }
  }, [promoState.code]);

  useEffect(() => {
    const syncGwpConfig = () => {
      setGwpConfig(getGwpConfig());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === GWP_STORAGE_KEY) {
        syncGwpConfig();
      }
    };

    window.addEventListener('bubbleverse:gwp-updated', syncGwpConfig);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('bubbleverse:gwp-updated', syncGwpConfig);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const openCheckout = (directItem?: CartItem) => {
    if (directItem) {
      setCheckoutItem(directItem);
    } else {
      setCheckoutItem(null);
    }
    setIsCheckoutOpen(true);
    setIsOpen(false);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setCheckoutItem(null);
  };

  const addItem = (itemData: Omit<CartItem, 'id' | 'createdAt'>) => {
    const resolvedItemType =
      itemData.itemType ?? (itemData.format === 'physical_merch' ? 'merch' : 'book');
    const newItem: CartItem = {
      ...itemData,
      itemType: resolvedItemType,
      priceAed: itemData.priceAed ?? deriveAedFromSar(itemData.priceSar),
      id: `${itemData.storyId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };

    setItems((prev) => [newItem, ...prev]);
    setIsOpen(true);
  };

  const addMerchItem = ({
    product,
    variant,
    quantity = 1,
    ribbonName,
  }: AddMerchItemInput) => {
    const selectedVariant = variant ?? product.variants[0];
    const safeQuantity = Number.isFinite(quantity)
      ? Math.max(1, Math.floor(quantity))
      : 1;
    const cleanedRibbon = ribbonName?.trim() || undefined;
    const sku = selectedVariant?.sku || product.sku;
    const variantId = selectedVariant?.id;
    const priceEgp = selectedVariant?.priceEgp ?? product.priceEgp;
    const priceSar = selectedVariant?.priceSar ?? product.priceSar;
    const priceAed =
      selectedVariant?.priceAed ?? product.priceAed ?? deriveAedFromSar(priceSar);

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.itemType === 'merch' &&
          !item.isFreeGift &&
          (item.merchId === product.id || item.storyId === product.id) &&
          (item.sku ?? '') === sku &&
          (item.variantId ?? '') === (variantId ?? '') &&
          (item.ribbonName?.trim() ?? '') === (cleanedRibbon ?? '')
      );

      if (existingIndex >= 0) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + safeQuantity }
            : item
        );
      }

      const newMerchItem: CartItem = {
        id: `merch-${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        itemType: 'merch',
        storyId: product.id,
        merchId: product.id,
        sku,
        variantId,
        variantLabelAr: selectedVariant?.labelAr,
        variantLabelEn: selectedVariant?.labelEn,
        ribbonName: cleanedRibbon,
        titleAr: product.nameAr,
        titleEn: product.nameEn,
        coverImage: product.coverImage,
        format: 'physical_merch',
        formatLabelAr: 'منتج براند بابل فيرس',
        formatLabelEn: 'Official Merch',
        pagesCount: 0,
        priceEgp,
        priceSar,
        priceAed,
        quantity: safeQuantity,
        childName: cleanedRibbon || '',
        childGender: 'boy',
        childAge: '',
        storyLanguage: 'ar',
        createdAt: Date.now(),
      };

      return [newMerchItem, ...prev];
    });

    setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const updateItemAddons = (id: string, addons: CartItemAddonUpdates) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...addons } : item))
    );
  };

  const clearPromoCode = () => {
    setPromoState({ code: null, percent: 0 });
  };

  const applyPromoCode = (code: string): ApplyPromoResult => {
    const validation = validatePromoCode(code);
    if (!validation.valid || !validation.promo) {
      return {
        ok: false,
        reasonAr: validation.reasonAr,
        reasonEn: validation.reasonEn,
      };
    }

    setPromoState({
      code: validation.promo.code,
      percent: validation.promo.discountPercent,
    });

    return {
      ok: true,
      percent: validation.promo.discountPercent,
    };
  };

  const clearCart = () => {
    setItems([]);
    setPromoState({ code: null, percent: 0 });
    setOrderNotes('');
  };

  const getGwpStatus = useCallback(
    (country: CurrencyCountry): GwpEligibilityResult =>
      evaluateGwpEligibility(items, country, gwpConfig),
    [items, gwpConfig]
  );

  const buildFreeGiftItem = useCallback((): CartItem => {
    const giftId = gwpConfig.giftMerchId || 'bub-plush-ball';
    return {
      id: `gwp-${giftId}`,
      itemType: 'gwp_gift',
      storyId: giftId,
      merchId: giftId,
      sku: gwpConfig.giftSku || 'BV-BUB-MINI-12',
      variantLabelAr: gwpConfig.variantLabelAr,
      variantLabelEn: gwpConfig.variantLabelEn,
      isFreeGift: true,
      retailValueEgp: gwpConfig.retailValueEgp,
      retailValueSar: gwpConfig.retailValueSar,
      retailValueAed: gwpConfig.retailValueAed,
      titleAr: gwpConfig.titleAr,
      titleEn: gwpConfig.titleEn,
      coverImage: gwpConfig.coverImage || '/merch/bub-plush-ball.jpg',
      format: 'physical_merch',
      formatLabelAr: 'هدية مجانية (GWP)',
      formatLabelEn: 'FREE Gift (GWP)',
      pagesCount: 0,
      priceEgp: 0,
      priceSar: 0,
      priceAed: 0,
      quantity: Math.max(1, Math.floor(gwpConfig.maxPerOrder || 1)),
      childName: '',
      childGender: 'boy',
      childAge: '',
      storyLanguage: 'ar',
      createdAt: Date.now(),
    };
  }, [gwpConfig]);

  const totalItems = items.reduce(
    (acc, item) =>
      item.isFreeGift || item.itemType === 'gwp_gift' ? acc : acc + item.quantity,
    0
  );

  const pricingEgp = useMemo(
    () => calculateCartPricing(items, 'EG', promoState.percent),
    [items, promoState.percent]
  );
  const pricingSar = useMemo(
    () => calculateCartPricing(items, 'SA', promoState.percent),
    [items, promoState.percent]
  );
  const pricingAed = useMemo(
    () => calculateCartPricing(items, 'AE', promoState.percent),
    [items, promoState.percent]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        isCheckoutOpen,
        openCart,
        closeCart,
        openCheckout,
        closeCheckout,
        addItem,
        addMerchItem,
        removeItem,
        updateQuantity,
        updateItemAddons,
        clearCart,
        orderNotes,
        setOrderNotes,
        gwpConfig,
        getGwpStatus,
        buildFreeGiftItem,
        totalItems,
        subtotalEgp: pricingEgp.subtotal,
        subtotalSar: pricingSar.subtotal,
        subtotalAed: pricingAed.subtotal,
        volumeDiscountPercent: pricingEgp.volumeDiscountPercent,
        promoCode: promoState.code,
        promoDiscountPercent: promoState.percent,
        applyPromoCode,
        clearPromoCode,
        totalEgp: pricingEgp.total,
        totalSar: pricingSar.total,
        totalAed: pricingAed.total,
        checkoutItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
