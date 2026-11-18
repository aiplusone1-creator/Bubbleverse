import { CATALOG_STORIES, CatalogStory } from '@/features/stories/catalogStories';
import {
  calculateAddonTotal,
  deriveAedFromSar,
  normalizeCurrencyCode,
  type CartItemType,
  type CommerceItemFormat,
  type CurrencyCountry,
} from '@/features/commerce/pricingEngine';
import {
  DEFAULT_MERCH_PRODUCTS,
  type MerchProduct,
} from '@/features/merch/merchCatalog';
import {
  DEFAULT_GWP_CONFIG,
  type GwpConfigRecord,
  type GwpTriggerMode,
} from '@/features/commerce/gwpEngine';
import {
  getShowcaseConfig,
  saveShowcaseConfig,
  type HomepageShowcaseConfig,
} from '@/features/showcase/showcaseConfig';
import type {
  CharacterDna,
  PromptEngineMode,
  StudioProductionChecklist,
} from '@/features/studio/stage2PromptEngine';

export type {
  CharacterDna,
  PromptEngineMode,
  StudioProductionChecklist,
  MerchProduct,
  GwpConfigRecord,
};

export type OrderSource = 'catalog' | 'wizard' | 'merch' | 'mixed';

export type OrderStatus =
  | 'pending_deposit'
  | 'deposit_confirmed'
  | 'in_preparation'
  | 'draft_ready'
  | 'sent_to_print'
  | 'delivered'
  | 'cancelled';

export interface OrderItemRecord {
  itemType?: CartItemType;
  storyId: string;
  merchId?: string;
  sku?: string;
  variantId?: string;
  variantLabelAr?: string;
  variantLabelEn?: string;
  ribbonName?: string;
  isFreeGift?: boolean;
  retailValueEgp?: number;
  retailValueSar?: number;
  retailValueAed?: number;
  titleAr: string;
  titleEn: string;
  coverImage: string;
  format: CommerceItemFormat;
  formatLabelAr: string;
  formatLabelEn: string;
  pagesCount: number;
  childName: string;
  childGender: 'boy' | 'girl';
  childAge: string;
  storyLanguage: 'ar' | 'en' | 'bilingual';
  giftMessage?: string;
  hasColoringBookAddon?: boolean;
  hasGiftBoxAddon?: boolean;
  hasStickersAddon?: boolean;
  hasAudioStoryAddon?: boolean;
  hasCoHeroAddon?: boolean;
  coHeroName?: string;
  occasion?: string;
  photoVaultId?: string;
  priceEgp: number;
  priceSar: number;
  priceAed?: number;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  reference: string;
  customerName: string;
  phone: string;
  email?: string;
  country: CurrencyCountry;
  city?: string;
  address?: string;
  source: OrderSource;
  items: OrderItemRecord[];
  totalAmount: number;
  depositAmount: number;
  currency: string;
  promoCode?: string;
  discountAmount?: number;
  isGiftOrder?: boolean;
  giftRecipientName?: string;
  giftHidePrice?: boolean;
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: number;
    note?: string;
  }[];
  orderNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ManualOrderInput {
  customerName: string;
  phone: string;
  email?: string;
  country: CurrencyCountry;
  city?: string;
  address?: string;
  source?: OrderSource;
  items: OrderItemRecord[];
  totalAmount?: number;
  depositAmount?: number;
  currency?: string;
  promoCode?: string;
  discountAmount?: number;
  isGiftOrder?: boolean;
  giftRecipientName?: string;
  giftHidePrice?: boolean;
  status?: OrderStatus;
  orderNotes?: string;
  reference?: string;
}

export interface UaePaymentDetails {
  applePayEnabled: boolean;
  tabbyEnabled: boolean;
  bankIban: string;
}

export interface StoreConfigRecord {
  whatsappPhone: string;
  egyptPaymentDetails: {
    instapayUsername: string;
    vodafoneCashNumber: string;
  };
  saudiPaymentDetails: {
    stcPayNumber: string;
    madaIban: string;
  };
  uaePaymentDetails?: UaePaymentDetails;
  depositPercentage: number;
  freeShippingThreshold: number;
  adminPasscode: string;
  updatedAt: number;
}

export interface PromoCodeRecord {
  id: string;
  code: string;
  discountPercent: number;
  labelAr: string;
  labelEn: string;
  active: boolean;
  usageCount: number;
  createdAt: number;
}

export interface SavePromoCodeInput {
  id?: string;
  code: string;
  discountPercent: number;
  labelAr: string;
  labelEn: string;
  active?: boolean;
  usageCount?: number;
  createdAt?: number;
}

export interface PromoValidationResult {
  valid: boolean;
  promo?: PromoCodeRecord;
  discountPercent: number;
  reasonAr?: string;
  reasonEn?: string;
}

export type B2BOrganizationType = 'nursery' | 'school' | 'corporate';
export type B2BLeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'archived';

export interface B2BLeadRecord {
  id: string;
  reference: string;
  organizationType: B2BOrganizationType;
  organizationName: string;
  contactName: string;
  phone: string;
  email?: string;
  country: CurrencyCountry;
  quantity: number;
  format: 'hardcover_book' | 'digital_pdf';
  occasion: string;
  estimatedTotal: number;
  currency: string;
  status: B2BLeadStatus;
  notes?: string;
  createdAt: number;
}

export interface B2BLeadInput {
  organizationType: B2BOrganizationType;
  organizationName: string;
  contactName: string;
  phone: string;
  email?: string;
  country: CurrencyCountry;
  quantity: number;
  format: 'hardcover_book' | 'digital_pdf';
  occasion: string;
  estimatedTotal: number;
  currency: string;
  status?: B2BLeadStatus;
  notes?: string;
  reference?: string;
}

export type BirthdayClubSource = 'birthday_club' | 'free_certificate' | 'referral';

export interface BirthdayClubRecord {
  id: string;
  parentName: string;
  whatsapp: string;
  childName: string;
  childBirthday: string;
  referralCode: string;
  source: BirthdayClubSource;
  createdAt: number;
}

export interface BirthdayClubLeadInput {
  parentName: string;
  whatsapp: string;
  childName: string;
  childBirthday: string;
  referralCode?: string;
  source: BirthdayClubSource;
}

export type AiProviderKey = 'gemini' | 'nano_banana' | 'openai' | 'flux' | 'custom';
export type PaymentGatewayMode = 'sandbox' | 'live';

export interface ApiIntegrationsRecord {
  ai: {
    provider: AiProviderKey;
    enabled: boolean;
    apiKey: string;
    model: string;
    customEndpoint: string;
  };
  payments: {
    paymob: {
      enabled: boolean;
      mode: PaymentGatewayMode;
      apiKey: string;
      integrationId: string;
      iframeId: string;
    };
    tap: {
      enabled: boolean;
      mode: PaymentGatewayMode;
      publishableKey: string;
      secretKey: string;
    };
    stripe: {
      enabled: boolean;
      mode: PaymentGatewayMode;
      publishableKey: string;
      secretKey: string;
    };
  };
  messaging: {
    whatsappCloud: {
      enabled: boolean;
      phoneNumberId: string;
      accessToken: string;
    };
    webhook: {
      enabled: boolean;
      url: string;
      secretHeader: string;
    };
  };
  analytics: {
    metaPixelId: string;
    tiktokPixelId: string;
    ga4MeasurementId: string;
  };
  shipping: {
    bosta: {
      enabled: boolean;
      apiKey: string;
    };
    aramex: {
      enabled: boolean;
      apiKey: string;
      accountNumber: string;
    };
  };
  updatedAt: number;
}

export interface ApiIntegrationsUpdate {
  ai?: Partial<ApiIntegrationsRecord['ai']>;
  payments?: {
    paymob?: Partial<ApiIntegrationsRecord['payments']['paymob']>;
    tap?: Partial<ApiIntegrationsRecord['payments']['tap']>;
    stripe?: Partial<ApiIntegrationsRecord['payments']['stripe']>;
  };
  messaging?: {
    whatsappCloud?: Partial<ApiIntegrationsRecord['messaging']['whatsappCloud']>;
    webhook?: Partial<ApiIntegrationsRecord['messaging']['webhook']>;
  };
  analytics?: Partial<ApiIntegrationsRecord['analytics']>;
  shipping?: {
    bosta?: Partial<ApiIntegrationsRecord['shipping']['bosta']>;
    aramex?: Partial<ApiIntegrationsRecord['shipping']['aramex']>;
  };
}

export interface StudioDraftPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl: string;
  imageVaultId?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface StudioDraftRecord {
  key: string;
  orderReference?: string;
  childName: string;
  storyTitle: string;
  storyLang: 'ar' | 'en';
  artStyle: string;
  pageCount: number;
  pages: StudioDraftPage[];
  activePageIndex?: number;
  characterDna?: CharacterDna;
  characterSheetVaultId?: string;
  promptEngine?: PromptEngineMode;
  checklist?: StudioProductionChecklist;
  updatedAt: number;
}

export interface WebhookTriggerResult {
  sent: boolean;
  status?: number;
  error?: string;
}

const STORAGE_KEYS = {
  ORDERS: 'bubbleverse_orders_v1',
  CATALOG: 'bubbleverse_catalog_stories_v1',
  CATALOG_DELETED: 'bubbleverse_catalog_deleted_ids_v1',
  CONFIG: 'bubbleverse_store_config_v1',
  INTEGRATIONS: 'bubbleverse_api_integrations_v1',
  STUDIO_DRAFTS: 'bubbleverse_studio_drafts_v1',
  PROMO_CODES: 'bubbleverse_promo_codes_v1',
  B2B_LEADS: 'bubbleverse_b2b_leads_v1',
  BIRTHDAY_CLUB: 'bubbleverse_birthday_club_v1',
  MERCH_CATALOG: 'bubbleverse_merch_catalog_v1',
  GWP_CONFIG: 'bubbleverse_gwp_config_v1',
};

function dispatchStoreEvent(eventName: string): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event(eventName));
  }
}

const DEFAULT_UAE_PAYMENT_DETAILS: UaePaymentDetails = {
  applePayEnabled: true,
  tabbyEnabled: true,
  bankIban: 'AE000000000000000000000',
};

const DEFAULT_STORE_CONFIG: StoreConfigRecord = {
  whatsappPhone: '201000000000',
  egyptPaymentDetails: {
    instapayUsername: 'bubbleverse@instapay',
    vodafoneCashNumber: '01000000000',
  },
  saudiPaymentDetails: {
    stcPayNumber: '0500000000',
    madaIban: 'SA0000000000000000000000',
  },
  uaePaymentDetails: { ...DEFAULT_UAE_PAYMENT_DETAILS },
  depositPercentage: 50,
  freeShippingThreshold: 2,
  adminPasscode: 'admin123',
  updatedAt: Date.now(),
};

const DEFAULT_PROMO_CODES: PromoCodeRecord[] = [
  {
    id: 'promo_welcome15',
    code: 'WELCOME15',
    discountPercent: 15,
    labelAr: 'خصم الترحيب 15% لأول طلب',
    labelEn: '15% Welcome Discount',
    active: true,
    usageCount: 0,
    createdAt: 1735689600000,
  },
  {
    id: 'promo_eid20',
    code: 'EID20',
    discountPercent: 20,
    labelAr: 'عرض رمضان والعيد 20%',
    labelEn: '20% Ramadan & Eid Special',
    active: true,
    usageCount: 0,
    createdAt: 1735689601000,
  },
  {
    id: 'promo_bday15',
    code: 'BDAY15',
    discountPercent: 15,
    labelAr: 'هدية نادي أعياد الميلاد 15%',
    labelEn: '15% Birthday Club Gift',
    active: true,
    usageCount: 0,
    createdAt: 1735689602000,
  },
  {
    id: 'promo_friend15',
    code: 'FRIEND15',
    discountPercent: 15,
    labelAr: 'هدية صديق 15% (شارك واربح)',
    labelEn: '15% Friend Referral Gift',
    active: true,
    usageCount: 0,
    createdAt: 1735689603000,
  },
];

export const DEFAULT_API_INTEGRATIONS: ApiIntegrationsRecord = {
  ai: {
    provider: 'gemini',
    enabled: false,
    apiKey: '',
    model: 'gemini-2.5-flash',
    customEndpoint: '',
  },
  payments: {
    paymob: {
      enabled: false,
      mode: 'sandbox',
      apiKey: '',
      integrationId: '',
      iframeId: '',
    },
    tap: {
      enabled: false,
      mode: 'sandbox',
      publishableKey: '',
      secretKey: '',
    },
    stripe: {
      enabled: false,
      mode: 'sandbox',
      publishableKey: '',
      secretKey: '',
    },
  },
  messaging: {
    whatsappCloud: {
      enabled: false,
      phoneNumberId: '',
      accessToken: '',
    },
    webhook: {
      enabled: false,
      url: '',
      secretHeader: '',
    },
  },
  analytics: {
    metaPixelId: '',
    tiktokPixelId: '',
    ga4MeasurementId: '',
  },
  shipping: {
    bosta: {
      enabled: false,
      apiKey: '',
    },
    aramex: {
      enabled: false,
      apiKey: '',
      accountNumber: '',
    },
  },
  updatedAt: 0,
};

function mergeIntegrations(
  base: ApiIntegrationsRecord,
  patch?: ApiIntegrationsUpdate | Partial<ApiIntegrationsRecord>
): ApiIntegrationsRecord {
  if (!patch) return base;
  return {
    ai: { ...base.ai, ...(patch.ai ?? {}) },
    payments: {
      paymob: { ...base.payments.paymob, ...(patch.payments?.paymob ?? {}) },
      tap: { ...base.payments.tap, ...(patch.payments?.tap ?? {}) },
      stripe: { ...base.payments.stripe, ...(patch.payments?.stripe ?? {}) },
    },
    messaging: {
      whatsappCloud: {
        ...base.messaging.whatsappCloud,
        ...(patch.messaging?.whatsappCloud ?? {}),
      },
      webhook: {
        ...base.messaging.webhook,
        ...(patch.messaging?.webhook ?? {}),
      },
    },
    analytics: { ...base.analytics, ...(patch.analytics ?? {}) },
    shipping: {
      bosta: { ...base.shipping.bosta, ...(patch.shipping?.bosta ?? {}) },
      aramex: { ...base.shipping.aramex, ...(patch.shipping?.aramex ?? {}) },
    },
    updatedAt:
      typeof (patch as Partial<ApiIntegrationsRecord>).updatedAt === 'number'
        ? ((patch as Partial<ApiIntegrationsRecord>).updatedAt as number)
        : base.updatedAt,
  };
}

function sanitizeIntegrationsForBackup(config: ApiIntegrationsRecord): ApiIntegrationsRecord {
  return {
    ai: {
      ...config.ai,
      apiKey: '',
    },
    payments: {
      paymob: {
        ...config.payments.paymob,
        apiKey: '',
      },
      tap: {
        ...config.payments.tap,
        secretKey: '',
      },
      stripe: {
        ...config.payments.stripe,
        secretKey: '',
      },
    },
    messaging: {
      whatsappCloud: {
        ...config.messaging.whatsappCloud,
        accessToken: '',
      },
      webhook: {
        ...config.messaging.webhook,
        secretHeader: '',
      },
    },
    analytics: { ...config.analytics },
    shipping: {
      bosta: {
        ...config.shipping.bosta,
        apiKey: '',
      },
      aramex: {
        ...config.shipping.aramex,
        apiKey: '',
      },
    },
    updatedAt: config.updatedAt,
  };
}

// ----------------------------------------------------------------------------
// Store Config API
// ----------------------------------------------------------------------------

export function getStoreConfig(): StoreConfigRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) return DEFAULT_STORE_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STORE_CONFIG,
      ...parsed,
      egyptPaymentDetails: {
        ...DEFAULT_STORE_CONFIG.egyptPaymentDetails,
        ...(parsed.egyptPaymentDetails ?? {}),
      },
      saudiPaymentDetails: {
        ...DEFAULT_STORE_CONFIG.saudiPaymentDetails,
        ...(parsed.saudiPaymentDetails ?? {}),
      },
      uaePaymentDetails: {
        ...DEFAULT_UAE_PAYMENT_DETAILS,
        ...(parsed.uaePaymentDetails ?? {}),
      },
    };
  } catch {
    return DEFAULT_STORE_CONFIG;
  }
}

export function saveStoreConfig(updates: Partial<StoreConfigRecord>): StoreConfigRecord {
  const current = getStoreConfig();
  const updated: StoreConfigRecord = {
    ...current,
    ...updates,
    egyptPaymentDetails: {
      ...current.egyptPaymentDetails,
      ...(updates.egyptPaymentDetails ?? {}),
    },
    saudiPaymentDetails: {
      ...current.saudiPaymentDetails,
      ...(updates.saudiPaymentDetails ?? {}),
    },
    uaePaymentDetails: {
      ...DEFAULT_UAE_PAYMENT_DETAILS,
      ...(current.uaePaymentDetails ?? {}),
      ...(updates.uaePaymentDetails ?? {}),
    },
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save store config to localStorage', err);
  }
  return updated;
}

// ----------------------------------------------------------------------------
// API Integrations & Webhook API
// ----------------------------------------------------------------------------

export function getIntegrationsConfig(): ApiIntegrationsRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INTEGRATIONS);
    if (!raw) return DEFAULT_API_INTEGRATIONS;
    const parsed = JSON.parse(raw) as Partial<ApiIntegrationsRecord>;
    return mergeIntegrations(DEFAULT_API_INTEGRATIONS, parsed);
  } catch {
    return DEFAULT_API_INTEGRATIONS;
  }
}

export function saveIntegrationsConfig(partial: ApiIntegrationsUpdate): ApiIntegrationsRecord {
  const current = getIntegrationsConfig();
  const updated: ApiIntegrationsRecord = {
    ...mergeIntegrations(current, partial),
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save API integrations config to localStorage', err);
  }
  return updated;
}

export async function triggerOrderWebhook(order: OrderRecord): Promise<WebhookTriggerResult> {
  const { webhook } = getIntegrationsConfig().messaging;
  const trimmedUrl = webhook.url.trim();
  if (!webhook.enabled || !trimmedUrl) {
    return { sent: false };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return { sent: false, error: 'Invalid webhook URL format' };
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return { sent: false, error: 'Webhook URL must use http or https' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (webhook.secretHeader.trim()) {
      headers['X-Bubbleverse-Secret'] = webhook.secretHeader.trim();
    }

    const response = await fetch(parsedUrl.toString(), {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        event: 'order.created',
        sentAt: new Date().toISOString(),
        order: {
          id: order.id,
          reference: order.reference,
          customerName: order.customerName,
          phone: order.phone,
          country: order.country,
          city: order.city,
          source: order.source,
          status: order.status,
          totalAmount: order.totalAmount,
          depositAmount: order.depositAmount,
          currency: order.currency,
          itemsCount: order.items.length,
          createdAt: order.createdAt,
        },
      }),
    });

    return {
      sent: response.ok,
      status: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ----------------------------------------------------------------------------
// Orders API & Fulfillment Helpers
// ----------------------------------------------------------------------------

const OCCASION_LABELS: Record<string, { ar: string; en: string }> = {
  birthday: { ar: 'عيد ميلاد', en: 'Birthday' },
  ramadan_eid: { ar: 'رمضان والعيد', en: 'Ramadan & Eid' },
  siblings: { ar: 'الأخوة', en: 'Siblings' },
  graduation: { ar: 'التخرج', en: 'Graduation' },
  bedtime_values: { ar: 'النوم والقيم', en: 'Bedtime & Values' },
  everyday: { ar: 'هدية يومية', en: 'Everyday Gift' },
};

export function summarizeOrderItemAddons(
  item: OrderItemRecord,
  lang: 'ar' | 'en'
): string[] {
  const summary: string[] = [];

  if (item.hasColoringBookAddon) {
    summary.push(lang === 'ar' ? 'دفتر التلوين' : 'Coloring Book');
  }
  if (item.hasGiftBoxAddon) {
    summary.push(lang === 'ar' ? 'صندوق هدايا فاخر' : 'Luxury Gift Box');
  }
  if (item.hasStickersAddon) {
    summary.push(lang === 'ar' ? '24 ستيكر مخصص' : '24 Stickers');
  }
  if (item.hasAudioStoryAddon) {
    summary.push(lang === 'ar' ? 'قصة صوتية QR' : 'QR Audio Story');
  }

  const coHeroName = item.coHeroName?.trim();
  if (item.hasCoHeroAddon || coHeroName) {
    if (coHeroName) {
      summary.push(
        lang === 'ar' ? `بطل مشارك: ${coHeroName}` : `Co-Hero: ${coHeroName}`
      );
    } else {
      summary.push(lang === 'ar' ? 'بطل مشارك' : 'Co-Hero');
    }
  }

  const occasion = item.occasion?.trim();
  if (occasion) {
    const mapped = OCCASION_LABELS[occasion.toLowerCase()];
    const occasionLabel = mapped ? mapped[lang] : occasion;
    summary.push(
      lang === 'ar' ? `المناسبة: ${occasionLabel}` : `Occasion: ${occasionLabel}`
    );
  }

  const ribbonName = item.ribbonName?.trim();
  if (ribbonName) {
    summary.push(
      lang === 'ar' ? `شريط الاسم: ${ribbonName}` : `Ribbon Name: ${ribbonName}`
    );
  }

  return summary;
}

export function getOrders(): OrderRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.createdAt - a.createdAt);
    }
    return [];
  } catch {
    return [];
  }
}

export function saveOrder(orderInput: {
  reference: string;
  customerName: string;
  phone: string;
  email?: string;
  country: CurrencyCountry;
  city?: string;
  address?: string;
  source: OrderSource;
  items: OrderItemRecord[];
  totalAmount: number;
  depositAmount: number;
  currency: string;
  promoCode?: string;
  discountAmount?: number;
  isGiftOrder?: boolean;
  giftRecipientName?: string;
  giftHidePrice?: boolean;
  orderNotes?: string;
}): OrderRecord {
  const now = Date.now();
  const normalizedCurrency = normalizeCurrencyCode(
    orderInput.currency,
    orderInput.country
  );
  const order: OrderRecord = {
    id: `ord_${now}_${Math.random().toString(36).substring(2, 7)}`,
    ...orderInput,
    currency: normalizedCurrency,
    status: 'pending_deposit',
    statusHistory: [
      {
        status: 'pending_deposit',
        timestamp: now,
        note: 'Order placed by customer',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const orders = getOrders();
  const updatedOrders = [order, ...orders.filter((o) => o.reference !== order.reference)];

  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));
  } catch (err) {
    console.error('Failed to save order to localStorage', err);
  }

  return order;
}

export function createManualOrder(input: ManualOrderInput): OrderRecord {
  const now = Date.now();
  const storeConfig = getStoreConfig();
  const reference =
    input.reference?.trim() ||
    `BV-${input.country}-${Math.floor(100000 + Math.random() * 900000)}`;
  const currency = normalizeCurrencyCode(input.currency, input.country);
  const computedTotal = input.items.reduce((sum, item) => {
    if (item.isFreeGift || item.itemType === 'gwp_gift') {
      return sum;
    }
    const unit =
      input.country === 'EG'
        ? item.priceEgp
        : input.country === 'AE'
        ? item.priceAed ?? deriveAedFromSar(item.priceSar)
        : item.priceSar;
    const addon =
      item.itemType === 'merch' ? 0 : calculateAddonTotal(item, input.country);
    return sum + (unit + addon) * (item.quantity || 1);
  }, 0);
  const totalAmount =
    typeof input.totalAmount === 'number' && Number.isFinite(input.totalAmount)
      ? input.totalAmount
      : computedTotal;
  const hasPhysicalItem = input.items.some(
    (item) =>
      item.format === 'hardcover_book' ||
      item.format === 'physical_merch' ||
      item.itemType === 'merch' ||
      item.itemType === 'gwp_gift'
  );
  const depositPercent = storeConfig.depositPercentage || 50;
  const depositAmount =
    typeof input.depositAmount === 'number' && Number.isFinite(input.depositAmount)
      ? input.depositAmount
      : hasPhysicalItem
      ? Math.round(totalAmount * (depositPercent / 100))
      : totalAmount;
  const initialStatus: OrderStatus = input.status ?? 'pending_deposit';

  const order: OrderRecord = {
    id: `ord_${now}_${Math.random().toString(36).substring(2, 7)}`,
    reference,
    customerName: input.customerName.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    country: input.country,
    city: input.city?.trim() || undefined,
    address: input.address?.trim() || undefined,
    source: input.source ?? 'catalog',
    items: input.items,
    totalAmount,
    depositAmount,
    currency,
    promoCode: input.promoCode?.trim() || undefined,
    discountAmount:
      typeof input.discountAmount === 'number' && Number.isFinite(input.discountAmount)
        ? input.discountAmount
        : undefined,
    isGiftOrder: input.isGiftOrder,
    giftRecipientName: input.giftRecipientName?.trim() || undefined,
    giftHidePrice: input.giftHidePrice,
    status: initialStatus,
    statusHistory: [
      {
        status: initialStatus,
        timestamp: now,
        note: 'Manual order created from Admin Dashboard',
      },
    ],
    orderNotes: input.orderNotes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  const orders = getOrders();
  const updatedOrders = [order, ...orders.filter((o) => o.reference !== order.reference)];
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));
  } catch (err) {
    console.error('Failed to save manual order to localStorage', err);
  }
  return order;
}

export function deleteOrder(orderIdOrRef: string): boolean {
  const orders = getOrders();
  const filtered = orders.filter((o) => o.id !== orderIdOrRef && o.reference !== orderIdOrRef);
  if (filtered.length === orders.length) return false;
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete order from localStorage', err);
    return false;
  }
  return true;
}

export function updateOrderStatus(
  orderIdOrRef: string,
  newStatus: OrderStatus,
  note?: string
): OrderRecord | null {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === orderIdOrRef || o.reference === orderIdOrRef);
  if (index === -1) return null;

  const order = orders[index];
  const now = Date.now();
  const updated: OrderRecord = {
    ...order,
    status: newStatus,
    updatedAt: now,
    statusHistory: [
      ...order.statusHistory,
      {
        status: newStatus,
        timestamp: now,
        note,
      },
    ],
  };

  orders[index] = updated;
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to update order in localStorage', err);
  }

  return updated;
}

export function findOrderByReferenceOrPhone(query: string): OrderRecord[] {
  const cleaned = query.trim().toLowerCase().replace(/[\s#-]/g, '');
  if (!cleaned) return [];

  const orders = getOrders();
  return orders.filter((order) => {
    const refClean = order.reference.toLowerCase().replace(/[\s#-]/g, '');
    const phoneClean = order.phone.replace(/[\s+]/g, '');
    return refClean.includes(cleaned) || phoneClean.includes(cleaned);
  });
}

// ----------------------------------------------------------------------------
// Story Studio Drafts API
// ----------------------------------------------------------------------------

function readStudioDraftMap(): Record<string, StudioDraftRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDIO_DRAFTS);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, StudioDraftRecord>;
    }
    return {};
  } catch {
    return {};
  }
}

export function getStudioDraft(key: string): StudioDraftRecord | null {
  if (!key) return null;
  const map = readStudioDraftMap();
  return map[key] ?? null;
}

export function saveStudioDraft(
  draft: Omit<StudioDraftRecord, 'updatedAt'> & { updatedAt?: number }
): StudioDraftRecord {
  const map = readStudioDraftMap();
  const saved: StudioDraftRecord = {
    ...draft,
    updatedAt: draft.updatedAt ?? Date.now(),
  };
  map[saved.key] = saved;
  try {
    localStorage.setItem(STORAGE_KEYS.STUDIO_DRAFTS, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save studio draft to localStorage', err);
  }
  return saved;
}

export function listStudioDrafts(): StudioDraftRecord[] {
  return Object.values(readStudioDraftMap()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteStudioDraft(key: string): void {
  const map = readStudioDraftMap();
  if (!(key in map)) return;
  delete map[key];
  try {
    localStorage.setItem(STORAGE_KEYS.STUDIO_DRAFTS, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to delete studio draft from localStorage', err);
  }
}

// ----------------------------------------------------------------------------
// Local Admin Session Helpers
// ----------------------------------------------------------------------------

const LOCAL_ADMIN_KEY = 'bv_local_admin_auth';

export function isLocalAdminUnlocked(): boolean {
  try {
    return sessionStorage.getItem(LOCAL_ADMIN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function unlockLocalAdmin(): void {
  try {
    sessionStorage.setItem(LOCAL_ADMIN_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

export function lockLocalAdmin(): void {
  try {
    sessionStorage.removeItem(LOCAL_ADMIN_KEY);
  } catch {
    // Ignore storage errors
  }
}

// ----------------------------------------------------------------------------
// Catalog Stories API (Admin & Storefront Sync with Auto Hydration)
// ----------------------------------------------------------------------------

function readDeletedCatalogIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATALOG_DELETED);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((id): id is string => typeof id === 'string'));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

function writeDeletedCatalogIds(ids: Set<string>): void {
  try {
    if (ids.size === 0) {
      localStorage.removeItem(STORAGE_KEYS.CATALOG_DELETED);
    } else {
      localStorage.setItem(STORAGE_KEYS.CATALOG_DELETED, JSON.stringify([...ids]));
    }
  } catch {
    // Ignore storage errors
  }
}

function hydrateCatalogStory(
  story: Partial<CatalogStory> & { id: string },
  fallback?: CatalogStory
): CatalogStory {
  const priceSar15 =
    typeof story.priceSar15Pages === 'number' && Number.isFinite(story.priceSar15Pages)
      ? story.priceSar15Pages
      : fallback?.priceSar15Pages ?? 99;
  const priceSar25 =
    typeof story.priceSar25Pages === 'number' && Number.isFinite(story.priceSar25Pages)
      ? story.priceSar25Pages
      : fallback?.priceSar25Pages ?? 159;
  const pricePdfSar =
    typeof story.pricePdfSar === 'number' && Number.isFinite(story.pricePdfSar)
      ? story.pricePdfSar
      : fallback?.pricePdfSar ?? 59;

  return {
    ...(fallback ?? {}),
    ...story,
    priceSar15Pages: priceSar15,
    priceSar25Pages: priceSar25,
    pricePdfSar,
    priceAed15Pages:
      typeof story.priceAed15Pages === 'number' && Number.isFinite(story.priceAed15Pages)
        ? story.priceAed15Pages
        : fallback?.priceAed15Pages ?? deriveAedFromSar(priceSar15),
    priceAed25Pages:
      typeof story.priceAed25Pages === 'number' && Number.isFinite(story.priceAed25Pages)
        ? story.priceAed25Pages
        : fallback?.priceAed25Pages ?? deriveAedFromSar(priceSar25),
    pricePdfAed:
      typeof story.pricePdfAed === 'number' && Number.isFinite(story.pricePdfAed)
        ? story.pricePdfAed
        : fallback?.pricePdfAed ?? deriveAedFromSar(pricePdfSar),
    occasions:
      Array.isArray(story.occasions) && story.occasions.length > 0
        ? story.occasions
        : fallback?.occasions,
    supportsCoHero:
      typeof story.supportsCoHero === 'boolean'
        ? story.supportsCoHero
        : fallback?.supportsCoHero,
    valuesTagsAr:
      Array.isArray(story.valuesTagsAr) && story.valuesTagsAr.length > 0
        ? story.valuesTagsAr
        : fallback?.valuesTagsAr,
    valuesTagsEn:
      Array.isArray(story.valuesTagsEn) && story.valuesTagsEn.length > 0
        ? story.valuesTagsEn
        : fallback?.valuesTagsEn,
    badgeAr: story.badgeAr ?? fallback?.badgeAr,
    badgeEn: story.badgeEn ?? fallback?.badgeEn,
    galleryImages:
      Array.isArray(story.galleryImages) && story.galleryImages.length > 0
        ? story.galleryImages
        : fallback?.galleryImages,
    sampleSpreads:
      Array.isArray(story.sampleSpreads) && story.sampleSpreads.length > 0
        ? story.sampleSpreads
        : fallback?.sampleSpreads ?? [],
  } as CatalogStory;
}

export function getCatalogStories(): CatalogStory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATALOG);
    if (!raw) return CATALOG_STORIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const defaultById = new Map(CATALOG_STORIES.map((story) => [story.id, story]));
      const deletedIds = readDeletedCatalogIds();
      const validStored: CatalogStory[] = [];
      const seenIds = new Set<string>();

      for (const entry of parsed) {
        if (
          entry &&
          typeof entry === 'object' &&
          !Array.isArray(entry) &&
          typeof (entry as { id?: unknown }).id === 'string' &&
          (entry as { id: string }).id.trim().length > 0
        ) {
          const id = (entry as { id: string }).id;
          if (seenIds.has(id)) continue;
          seenIds.add(id);
          validStored.push(
            hydrateCatalogStory(
              entry as Partial<CatalogStory> & { id: string },
              defaultById.get(id)
            )
          );
        }
      }

      if (validStored.length === 0) {
        return CATALOG_STORIES;
      }

      const missingDefaults = CATALOG_STORIES.filter(
        (story) => !seenIds.has(story.id) && !deletedIds.has(story.id)
      );

      return [...validStored, ...missingDefaults];
    }
    return CATALOG_STORIES;
  } catch {
    return CATALOG_STORIES;
  }
}

export function saveCatalogStory(story: CatalogStory): void {
  const defaultById = new Map(CATALOG_STORIES.map((s) => [s.id, s]));
  const hydrated = hydrateCatalogStory(story, defaultById.get(story.id));
  const stories = getCatalogStories();
  const index = stories.findIndex((s) => s.id === hydrated.id);
  let updated: CatalogStory[];
  if (index >= 0) {
    updated = [...stories];
    updated[index] = hydrated;
  } else {
    updated = [hydrated, ...stories];
  }
  const deletedIds = readDeletedCatalogIds();
  if (deletedIds.delete(hydrated.id)) {
    writeDeletedCatalogIds(deletedIds);
  }
  try {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save catalog story to localStorage', err);
  }
}

export function deleteCatalogStory(id: string): void {
  const stories = getCatalogStories();
  const updated = stories.filter((s) => s.id !== id);
  if (CATALOG_STORIES.some((s) => s.id === id)) {
    const deletedIds = readDeletedCatalogIds();
    deletedIds.add(id);
    writeDeletedCatalogIds(deletedIds);
  }
  try {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete catalog story from localStorage', err);
  }
}

export function resetCatalogStoriesToDefault(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CATALOG);
    localStorage.removeItem(STORAGE_KEYS.CATALOG_DELETED);
  } catch {
    // Ignore
  }
}

// ----------------------------------------------------------------------------
// Promo Codes API
// ----------------------------------------------------------------------------

function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function getPromoCodes(): PromoCodeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROMO_CODES);
    if (raw === null) {
      return DEFAULT_PROMO_CODES.map((p) => ({ ...p }));
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.createdAt - a.createdAt);
    }
    return DEFAULT_PROMO_CODES.map((p) => ({ ...p }));
  } catch {
    return DEFAULT_PROMO_CODES.map((p) => ({ ...p }));
  }
}

export function savePromoCode(input: SavePromoCodeInput): PromoCodeRecord {
  const now = Date.now();
  const normalizedCode = normalizePromoCode(input.code);
  const clampedPercent = Number.isFinite(input.discountPercent)
    ? Math.max(1, Math.min(90, Math.round(input.discountPercent)))
    : 10;

  const existing = getPromoCodes();
  const matchIndex = existing.findIndex(
    (p) => (input.id && p.id === input.id) || normalizePromoCode(p.code) === normalizedCode
  );

  let record: PromoCodeRecord;
  let updated: PromoCodeRecord[];

  if (matchIndex >= 0) {
    const prev = existing[matchIndex];
    record = {
      ...prev,
      code: normalizedCode || prev.code,
      discountPercent: clampedPercent,
      labelAr: input.labelAr.trim() || prev.labelAr,
      labelEn: input.labelEn.trim() || prev.labelEn,
      active: input.active ?? prev.active,
      usageCount:
        typeof input.usageCount === 'number' && Number.isFinite(input.usageCount)
          ? Math.max(0, Math.floor(input.usageCount))
          : prev.usageCount,
    };
    updated = [...existing];
    updated[matchIndex] = record;
  } else {
    record = {
      id: input.id?.trim() || `promo_${now}_${Math.random().toString(36).substring(2, 7)}`,
      code: normalizedCode,
      discountPercent: clampedPercent,
      labelAr: input.labelAr.trim() || `خصم ${clampedPercent}%`,
      labelEn: input.labelEn.trim() || `${clampedPercent}% Discount`,
      active: input.active ?? true,
      usageCount:
        typeof input.usageCount === 'number' && Number.isFinite(input.usageCount)
          ? Math.max(0, Math.floor(input.usageCount))
          : 0,
      createdAt: input.createdAt ?? now,
    };
    updated = [record, ...existing];
  }

  try {
    localStorage.setItem(STORAGE_KEYS.PROMO_CODES, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save promo code to localStorage', err);
  }

  return record;
}

export function togglePromoCode(id: string): PromoCodeRecord | null {
  const promos = getPromoCodes();
  const index = promos.findIndex((p) => p.id === id || normalizePromoCode(p.code) === normalizePromoCode(id));
  if (index === -1) return null;

  const updatedRecord: PromoCodeRecord = {
    ...promos[index],
    active: !promos[index].active,
  };
  promos[index] = updatedRecord;

  try {
    localStorage.setItem(STORAGE_KEYS.PROMO_CODES, JSON.stringify(promos));
  } catch (err) {
    console.error('Failed to toggle promo code in localStorage', err);
  }

  return updatedRecord;
}

export function deletePromoCode(id: string): boolean {
  const promos = getPromoCodes();
  const filtered = promos.filter((p) => p.id !== id);
  if (filtered.length === promos.length) return false;

  try {
    localStorage.setItem(STORAGE_KEYS.PROMO_CODES, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete promo code from localStorage', err);
    return false;
  }

  return true;
}

export function validatePromoCode(code: string): PromoValidationResult {
  const normalized = normalizePromoCode(code);
  if (!normalized) {
    return {
      valid: false,
      discountPercent: 0,
      reasonAr: 'يرجى إدخال كود خصم',
      reasonEn: 'Please enter a promo code',
    };
  }

  const promos = getPromoCodes();
  const match = promos.find((p) => normalizePromoCode(p.code) === normalized);
  if (!match) {
    return {
      valid: false,
      discountPercent: 0,
      reasonAr: 'كود الخصم غير صحيح',
      reasonEn: 'Invalid promo code',
    };
  }

  if (!match.active) {
    return {
      valid: false,
      promo: match,
      discountPercent: 0,
      reasonAr: 'كود الخصم غير مفعل حالياً',
      reasonEn: 'This promo code is currently inactive',
    };
  }

  return {
    valid: true,
    promo: match,
    discountPercent: match.discountPercent,
  };
}

export function incrementPromoUsage(code: string): PromoCodeRecord | null {
  const normalized = normalizePromoCode(code);
  if (!normalized) return null;

  const promos = getPromoCodes();
  const index = promos.findIndex((p) => normalizePromoCode(p.code) === normalized);
  if (index === -1) return null;

  const updatedRecord: PromoCodeRecord = {
    ...promos[index],
    usageCount: (promos[index].usageCount || 0) + 1,
  };
  promos[index] = updatedRecord;

  try {
    localStorage.setItem(STORAGE_KEYS.PROMO_CODES, JSON.stringify(promos));
  } catch (err) {
    console.error('Failed to increment promo usage in localStorage', err);
  }

  return updatedRecord;
}

// ----------------------------------------------------------------------------
// B2B School & Corporate Leads API
// ----------------------------------------------------------------------------

export function getB2BLeads(): B2BLeadRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.B2B_LEADS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.createdAt - a.createdAt);
    }
    return [];
  } catch {
    return [];
  }
}

export function saveB2BLead(input: B2BLeadInput): B2BLeadRecord {
  const now = Date.now();
  const reference =
    input.reference?.trim() || `BV-B2B-${Math.floor(1000 + Math.random() * 9000)}`;

  const lead: B2BLeadRecord = {
    id: `b2b_${now}_${Math.random().toString(36).substring(2, 7)}`,
    reference,
    organizationType: input.organizationType,
    organizationName: input.organizationName.trim(),
    contactName: input.contactName.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    country: input.country,
    quantity: Number.isFinite(input.quantity) ? Math.max(1, Math.floor(input.quantity)) : 1,
    format: input.format,
    occasion: input.occasion.trim(),
    estimatedTotal: Number.isFinite(input.estimatedTotal) ? Math.max(0, Math.round(input.estimatedTotal)) : 0,
    currency: normalizeCurrencyCode(input.currency, input.country),
    status: input.status ?? 'new',
    notes: input.notes?.trim() || undefined,
    createdAt: now,
  };

  const leads = getB2BLeads();
  const updated = [lead, ...leads.filter((item) => item.reference !== lead.reference)];

  try {
    localStorage.setItem(STORAGE_KEYS.B2B_LEADS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save B2B lead to localStorage', err);
  }

  return lead;
}

export function updateB2BLeadStatus(id: string, status: B2BLeadStatus): B2BLeadRecord | null {
  const leads = getB2BLeads();
  const index = leads.findIndex((l) => l.id === id || l.reference === id);
  if (index === -1) return null;

  const updatedRecord: B2BLeadRecord = {
    ...leads[index],
    status,
  };
  leads[index] = updatedRecord;

  try {
    localStorage.setItem(STORAGE_KEYS.B2B_LEADS, JSON.stringify(leads));
  } catch (err) {
    console.error('Failed to update B2B lead status in localStorage', err);
  }

  return updatedRecord;
}

// ----------------------------------------------------------------------------
// Birthday Club & Freebie Leads API
// ----------------------------------------------------------------------------

export function generateReferralCode(name: string): string {
  const cleaned = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  const prefix = cleaned.slice(0, 4) || 'HERO';
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `BV-${prefix}-${suffix}`;
}

export function getBirthdayClubLeads(): BirthdayClubRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BIRTHDAY_CLUB);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.createdAt - a.createdAt);
    }
    return [];
  } catch {
    return [];
  }
}

export function saveBirthdayClubLead(input: BirthdayClubLeadInput): BirthdayClubRecord {
  const now = Date.now();
  const parentName = input.parentName.trim();
  const childName = input.childName.trim();
  const referralCode =
    input.referralCode?.trim().toUpperCase() ||
    generateReferralCode(parentName || childName);

  const lead: BirthdayClubRecord = {
    id: `club_${now}_${Math.random().toString(36).substring(2, 7)}`,
    parentName,
    whatsapp: input.whatsapp.trim(),
    childName,
    childBirthday: input.childBirthday.trim(),
    referralCode,
    source: input.source,
    createdAt: now,
  };

  const leads = getBirthdayClubLeads();
  const updated = [lead, ...leads];

  try {
    localStorage.setItem(STORAGE_KEYS.BIRTHDAY_CLUB, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save birthday club lead to localStorage', err);
  }

  return lead;
}

// ----------------------------------------------------------------------------
// Merch Catalog Persistence API
// ----------------------------------------------------------------------------

function cloneMerchProduct(product: MerchProduct): MerchProduct {
  return {
    ...product,
    galleryImages: Array.isArray(product.galleryImages)
      ? [...product.galleryImages]
      : [product.coverImage],
    safetySpecsAr: Array.isArray(product.safetySpecsAr)
      ? [...product.safetySpecsAr]
      : [],
    safetySpecsEn: Array.isArray(product.safetySpecsEn)
      ? [...product.safetySpecsEn]
      : [],
    variants: Array.isArray(product.variants)
      ? product.variants.map((v) => ({ ...v }))
      : [],
  };
}

function getDefaultMerchProductsClone(): MerchProduct[] {
  return DEFAULT_MERCH_PRODUCTS.map(cloneMerchProduct);
}

export function getMerchCatalog(): MerchProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MERCH_CATALOG);
    if (raw === null) {
      return getDefaultMerchProductsClone();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return getDefaultMerchProductsClone();
    }

    const defaultById = new Map(DEFAULT_MERCH_PRODUCTS.map((p) => [p.id, p]));
    const hydrated: MerchProduct[] = [];
    for (const entry of parsed) {
      if (!isPlainObject(entry) || typeof entry.id !== 'string' || !entry.id.trim()) {
        continue;
      }
      const fallback = defaultById.get(entry.id);
      const merged = {
        ...(fallback ? cloneMerchProduct(fallback) : {}),
        ...(entry as unknown as MerchProduct),
      };
      const priceEgp =
        typeof merged.priceEgp === 'number' && Number.isFinite(merged.priceEgp)
          ? Math.max(0, merged.priceEgp)
          : fallback?.priceEgp ?? 0;
      const priceSar =
        typeof merged.priceSar === 'number' && Number.isFinite(merged.priceSar)
          ? Math.max(0, merged.priceSar)
          : fallback?.priceSar ?? 0;
      const priceAed =
        typeof merged.priceAed === 'number' && Number.isFinite(merged.priceAed)
          ? Math.max(0, merged.priceAed)
          : fallback?.priceAed ?? deriveAedFromSar(priceSar);
      const stockCount =
        typeof merged.stockCount === 'number' && Number.isFinite(merged.stockCount)
          ? Math.max(0, Math.floor(merged.stockCount))
          : fallback?.stockCount ?? 0;

      hydrated.push(
        cloneMerchProduct({
          ...merged,
          priceEgp,
          priceSar,
          priceAed,
          stockCount,
          inStock: typeof merged.inStock === 'boolean' ? merged.inStock : stockCount > 0,
        })
      );
    }

    return hydrated;
  } catch {
    return getDefaultMerchProductsClone();
  }
}

export function saveMerchProduct(product: MerchProduct): MerchProduct[] {
  const catalog = getMerchCatalog();
  const normalized: MerchProduct = cloneMerchProduct({
    ...product,
    id: product.id.trim(),
    slug: (product.slug || product.id).trim(),
    sku: product.sku.trim(),
    priceEgp: Number.isFinite(product.priceEgp) ? Math.max(0, product.priceEgp) : 0,
    priceSar: Number.isFinite(product.priceSar) ? Math.max(0, product.priceSar) : 0,
    priceAed: Number.isFinite(product.priceAed)
      ? Math.max(0, product.priceAed)
      : deriveAedFromSar(product.priceSar),
    stockCount: Number.isFinite(product.stockCount)
      ? Math.max(0, Math.floor(product.stockCount))
      : 0,
  });

  const index = catalog.findIndex((p) => p.id === normalized.id);
  let updated: MerchProduct[];
  if (index >= 0) {
    updated = [...catalog];
    updated[index] = normalized;
  } else {
    updated = [normalized, ...catalog];
  }

  try {
    localStorage.setItem(STORAGE_KEYS.MERCH_CATALOG, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save merch product to localStorage', err);
  }
  dispatchStoreEvent('bubbleverse:merch-updated');
  return updated;
}

export function deleteMerchProduct(id: string): MerchProduct[] {
  const catalog = getMerchCatalog();
  const updated = catalog.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.MERCH_CATALOG, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete merch product from localStorage', err);
  }
  dispatchStoreEvent('bubbleverse:merch-updated');
  return updated;
}

export function resetMerchCatalog(): MerchProduct[] {
  try {
    localStorage.removeItem(STORAGE_KEYS.MERCH_CATALOG);
  } catch {
    // Ignore storage errors
  }
  dispatchStoreEvent('bubbleverse:merch-updated');
  return getDefaultMerchProductsClone();
}

// ----------------------------------------------------------------------------
// Free Bub Gift-With-Purchase (GWP) Config Persistence API
// ----------------------------------------------------------------------------

const VALID_GWP_MODES: ReadonlySet<GwpTriggerMode> = new Set([
  'min_books',
  'min_subtotal',
  'any_hardcover_or_threshold',
]);

function normalizeGwpConfig(
  base: GwpConfigRecord,
  patch?: Partial<GwpConfigRecord>
): GwpConfigRecord {
  const merged = { ...base, ...(patch ?? {}) };
  const triggerMode: GwpTriggerMode = VALID_GWP_MODES.has(merged.triggerMode)
    ? merged.triggerMode
    : base.triggerMode;
  const retailValueSar =
    typeof merged.retailValueSar === 'number' && Number.isFinite(merged.retailValueSar)
      ? Math.max(0, Math.round(merged.retailValueSar))
      : base.retailValueSar;
  const minSubtotalSar =
    typeof merged.minSubtotalSar === 'number' && Number.isFinite(merged.minSubtotalSar)
      ? Math.max(0, Math.round(merged.minSubtotalSar))
      : base.minSubtotalSar;

  return {
    ...merged,
    enabled: typeof merged.enabled === 'boolean' ? merged.enabled : base.enabled,
    giftMerchId:
      typeof merged.giftMerchId === 'string' && merged.giftMerchId.trim()
        ? merged.giftMerchId.trim()
        : base.giftMerchId,
    giftSku:
      typeof merged.giftSku === 'string' && merged.giftSku.trim()
        ? merged.giftSku.trim()
        : base.giftSku,
    titleAr:
      typeof merged.titleAr === 'string' && merged.titleAr.trim()
        ? merged.titleAr.trim()
        : base.titleAr,
    titleEn:
      typeof merged.titleEn === 'string' && merged.titleEn.trim()
        ? merged.titleEn.trim()
        : base.titleEn,
    variantLabelAr:
      typeof merged.variantLabelAr === 'string' && merged.variantLabelAr.trim()
        ? merged.variantLabelAr.trim()
        : base.variantLabelAr,
    variantLabelEn:
      typeof merged.variantLabelEn === 'string' && merged.variantLabelEn.trim()
        ? merged.variantLabelEn.trim()
        : base.variantLabelEn,
    coverImage:
      typeof merged.coverImage === 'string' && merged.coverImage.trim()
        ? merged.coverImage.trim()
        : base.coverImage,
    retailValueEgp:
      typeof merged.retailValueEgp === 'number' && Number.isFinite(merged.retailValueEgp)
        ? Math.max(0, Math.round(merged.retailValueEgp))
        : base.retailValueEgp,
    retailValueSar,
    retailValueAed:
      typeof merged.retailValueAed === 'number' && Number.isFinite(merged.retailValueAed)
        ? Math.max(0, Math.round(merged.retailValueAed))
        : deriveAedFromSar(retailValueSar),
    triggerMode,
    minBooks:
      typeof merged.minBooks === 'number' && Number.isFinite(merged.minBooks)
        ? Math.max(1, Math.floor(merged.minBooks))
        : base.minBooks,
    minSubtotalEgp:
      typeof merged.minSubtotalEgp === 'number' && Number.isFinite(merged.minSubtotalEgp)
        ? Math.max(0, Math.round(merged.minSubtotalEgp))
        : base.minSubtotalEgp,
    minSubtotalSar,
    minSubtotalAed:
      typeof merged.minSubtotalAed === 'number' && Number.isFinite(merged.minSubtotalAed)
        ? Math.max(0, Math.round(merged.minSubtotalAed))
        : deriveAedFromSar(minSubtotalSar),
    maxPerOrder:
      typeof merged.maxPerOrder === 'number' && Number.isFinite(merged.maxPerOrder)
        ? Math.max(1, Math.floor(merged.maxPerOrder))
        : base.maxPerOrder,
    updatedAt:
      typeof merged.updatedAt === 'number' && Number.isFinite(merged.updatedAt)
        ? merged.updatedAt
        : base.updatedAt,
  };
}

export function getGwpConfig(): GwpConfigRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GWP_CONFIG);
    if (!raw) return { ...DEFAULT_GWP_CONFIG };
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) return { ...DEFAULT_GWP_CONFIG };
    return normalizeGwpConfig(DEFAULT_GWP_CONFIG, parsed as Partial<GwpConfigRecord>);
  } catch {
    return { ...DEFAULT_GWP_CONFIG };
  }
}

export function saveGwpConfig(update: Partial<GwpConfigRecord>): GwpConfigRecord {
  const current = getGwpConfig();
  const updated = normalizeGwpConfig(current, {
    ...update,
    updatedAt: Date.now(),
  });
  try {
    localStorage.setItem(STORAGE_KEYS.GWP_CONFIG, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save GWP config to localStorage', err);
  }
  dispatchStoreEvent('bubbleverse:gwp-updated');
  return updated;
}

export function resetGwpConfig(): GwpConfigRecord {
  try {
    localStorage.removeItem(STORAGE_KEYS.GWP_CONFIG);
  } catch {
    // Ignore storage errors
  }
  dispatchStoreEvent('bubbleverse:gwp-updated');
  return { ...DEFAULT_GWP_CONFIG, updatedAt: Date.now() };
}

// ----------------------------------------------------------------------------
// Backup & Restore API (v2.2 with full v2.0/v2.1 backwards compatibility)
// ----------------------------------------------------------------------------

export interface StoreBackupOptions {
  includeSecrets?: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function exportAllStoreData(options?: StoreBackupOptions): string {
  const storeConfig = getStoreConfig();
  const integrations = getIntegrationsConfig();
  const includeSecrets = Boolean(options?.includeSecrets);
  const data = {
    version: '2.2',
    exportedAt: new Date().toISOString(),
    config: includeSecrets ? storeConfig : { ...storeConfig, adminPasscode: '' },
    orders: getOrders(),
    catalog: getCatalogStories(),
    showcase: getShowcaseConfig(),
    studioDrafts: listStudioDrafts(),
    promoCodes: getPromoCodes(),
    b2bLeads: getB2BLeads(),
    birthdayClubLeads: getBirthdayClubLeads(),
    merchCatalog: getMerchCatalog(),
    gwpConfig: getGwpConfig(),
    integrations: includeSecrets
      ? integrations
      : sanitizeIntegrationsForBackup(integrations),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllStoreData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (!isPlainObject(parsed)) return false;

    let importedSections = 0;

    if (isPlainObject(parsed.config)) {
      const incomingConfig = parsed.config as Partial<StoreConfigRecord>;
      const existingConfig = getStoreConfig();
      const mergedConfig: StoreConfigRecord = {
        ...existingConfig,
        ...incomingConfig,
        egyptPaymentDetails: {
          ...existingConfig.egyptPaymentDetails,
          ...(isPlainObject(incomingConfig.egyptPaymentDetails)
            ? incomingConfig.egyptPaymentDetails
            : {}),
        },
        saudiPaymentDetails: {
          ...existingConfig.saudiPaymentDetails,
          ...(isPlainObject(incomingConfig.saudiPaymentDetails)
            ? incomingConfig.saudiPaymentDetails
            : {}),
        },
        uaePaymentDetails: {
          ...DEFAULT_UAE_PAYMENT_DETAILS,
          ...(existingConfig.uaePaymentDetails ?? {}),
          ...(isPlainObject(incomingConfig.uaePaymentDetails)
            ? incomingConfig.uaePaymentDetails
            : {}),
        },
        adminPasscode:
          typeof incomingConfig.adminPasscode === 'string' &&
          incomingConfig.adminPasscode.trim().length > 0
            ? incomingConfig.adminPasscode
            : existingConfig.adminPasscode,
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(mergedConfig));
      importedSections += 1;
    }

    if (Array.isArray(parsed.orders)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(parsed.orders));
      importedSections += 1;
    }

    if (Array.isArray(parsed.catalog)) {
      localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(parsed.catalog));
      importedSections += 1;
    }

    if (isPlainObject(parsed.showcase)) {
      saveShowcaseConfig(parsed.showcase as unknown as HomepageShowcaseConfig);
      importedSections += 1;
    }

    if (Array.isArray(parsed.studioDrafts)) {
      const draftMap: Record<string, StudioDraftRecord> = {};
      for (const item of parsed.studioDrafts as StudioDraftRecord[]) {
        if (item && typeof item.key === 'string') {
          draftMap[item.key] = item;
        }
      }
      localStorage.setItem(STORAGE_KEYS.STUDIO_DRAFTS, JSON.stringify(draftMap));
      importedSections += 1;
    } else if (isPlainObject(parsed.studioDrafts)) {
      localStorage.setItem(STORAGE_KEYS.STUDIO_DRAFTS, JSON.stringify(parsed.studioDrafts));
      importedSections += 1;
    }

    if (Array.isArray(parsed.promoCodes)) {
      localStorage.setItem(STORAGE_KEYS.PROMO_CODES, JSON.stringify(parsed.promoCodes));
      importedSections += 1;
    }

    if (Array.isArray(parsed.b2bLeads)) {
      localStorage.setItem(STORAGE_KEYS.B2B_LEADS, JSON.stringify(parsed.b2bLeads));
      importedSections += 1;
    }

    if (Array.isArray(parsed.birthdayClubLeads)) {
      localStorage.setItem(
        STORAGE_KEYS.BIRTHDAY_CLUB,
        JSON.stringify(parsed.birthdayClubLeads)
      );
      importedSections += 1;
    }

    if (Array.isArray(parsed.merchCatalog)) {
      localStorage.setItem(
        STORAGE_KEYS.MERCH_CATALOG,
        JSON.stringify(parsed.merchCatalog)
      );
      dispatchStoreEvent('bubbleverse:merch-updated');
      importedSections += 1;
    }

    if (isPlainObject(parsed.gwpConfig)) {
      const mergedGwp = normalizeGwpConfig(
        DEFAULT_GWP_CONFIG,
        parsed.gwpConfig as Partial<GwpConfigRecord>
      );
      localStorage.setItem(
        STORAGE_KEYS.GWP_CONFIG,
        JSON.stringify({ ...mergedGwp, updatedAt: Date.now() })
      );
      dispatchStoreEvent('bubbleverse:gwp-updated');
      importedSections += 1;
    }

    if (isPlainObject(parsed.integrations)) {
      const incoming = parsed.integrations as Partial<ApiIntegrationsRecord>;
      const existing = getIntegrationsConfig();
      const preserveSecret = (incomingVal: string | undefined, existingVal: string) =>
        incomingVal && incomingVal.trim().length > 0 ? incomingVal : existingVal;

      const merged = mergeIntegrations(existing, {
        ...incoming,
        ai: isPlainObject(incoming.ai)
          ? {
              ...incoming.ai,
              apiKey: preserveSecret(incoming.ai.apiKey, existing.ai.apiKey),
            }
          : undefined,
        payments: isPlainObject(incoming.payments)
          ? {
              paymob: isPlainObject(incoming.payments.paymob)
                ? {
                    ...incoming.payments.paymob,
                    apiKey: preserveSecret(
                      incoming.payments.paymob.apiKey,
                      existing.payments.paymob.apiKey
                    ),
                  }
                : undefined,
              tap: isPlainObject(incoming.payments.tap)
                ? {
                    ...incoming.payments.tap,
                    secretKey: preserveSecret(
                      incoming.payments.tap.secretKey,
                      existing.payments.tap.secretKey
                    ),
                  }
                : undefined,
              stripe: isPlainObject(incoming.payments.stripe)
                ? {
                    ...incoming.payments.stripe,
                    secretKey: preserveSecret(
                      incoming.payments.stripe.secretKey,
                      existing.payments.stripe.secretKey
                    ),
                  }
                : undefined,
            }
          : undefined,
        messaging: isPlainObject(incoming.messaging)
          ? {
              whatsappCloud: isPlainObject(incoming.messaging.whatsappCloud)
                ? {
                    ...incoming.messaging.whatsappCloud,
                    accessToken: preserveSecret(
                      incoming.messaging.whatsappCloud.accessToken,
                      existing.messaging.whatsappCloud.accessToken
                    ),
                  }
                : undefined,
              webhook: isPlainObject(incoming.messaging.webhook)
                ? {
                    ...incoming.messaging.webhook,
                    secretHeader: preserveSecret(
                      incoming.messaging.webhook.secretHeader,
                      existing.messaging.webhook.secretHeader
                    ),
                  }
                : undefined,
            }
          : undefined,
        analytics: isPlainObject(incoming.analytics) ? incoming.analytics : undefined,
        shipping: isPlainObject(incoming.shipping)
          ? {
              bosta: isPlainObject(incoming.shipping.bosta)
                ? {
                    ...incoming.shipping.bosta,
                    apiKey: preserveSecret(
                      incoming.shipping.bosta.apiKey,
                      existing.shipping.bosta.apiKey
                    ),
                  }
                : undefined,
              aramex: isPlainObject(incoming.shipping.aramex)
                ? {
                    ...incoming.shipping.aramex,
                    apiKey: preserveSecret(
                      incoming.shipping.aramex.apiKey,
                      existing.shipping.aramex.apiKey
                    ),
                  }
                : undefined,
            }
          : undefined,
      });
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(merged));
      importedSections += 1;
    }

    return importedSections > 0;
  } catch (err) {
    console.error('Failed to import store data', err);
    return false;
  }
}
