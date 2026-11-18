import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  MessageCircle,
  Wand2,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  MapPin,
  Phone,
  Mail,
  User,
  Users,
  ExternalLink,
  Copy,
  Plus,
  FileSpreadsheet,
  Printer,
  Trash2,
  X,
  Filter,
  AlertTriangle,
  Calendar,
  BookOpen,
  BookCopy,
  Camera,
  Gift,
  Package,
  Tag,
  Truck,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import {
  getOrders,
  getCatalogStories,
  getStoreConfig,
  getStudioDraft,
  updateOrderStatus,
  createManualOrder,
  deleteOrder,
  triggerOrderWebhook,
  summarizeOrderItemAddons,
  type OrderRecord,
  type OrderSource,
  type OrderStatus,
  type OrderItemRecord,
  type StudioDraftRecord,
} from '@/lib/localStore';
import { getPhotoFromVault } from '@/lib/photoVault';
import {
  buildWhatsAppHelperMessages,
  countChecklistCompleted,
  DEFAULT_STORY_FALLBACK_IMAGES,
} from '@/features/studio/stage2PromptEngine';
import {
  calculateAddonTotal,
  deriveAedFromSar,
  formatMoney,
  getCurrencyMeta,
  normalizeCurrencyCode,
  type CurrencyCountry,
} from '@/features/commerce/pricingEngine';

type ActiveTab = 'orders' | 'crm';
type ManualFormatKey = '15p' | '25p' | 'pdf';

interface ManualOrderFormState {
  customerName: string;
  phone: string;
  country: CurrencyCountry;
  city: string;
  address: string;
  storyId: string;
  customTitleAr: string;
  customTitleEn: string;
  childName: string;
  childAge: string;
  childGender: 'boy' | 'girl';
  storyLanguage: 'ar' | 'en' | 'bilingual';
  formatKey: ManualFormatKey;
  price: string;
  depositAmount: string;
  status: OrderStatus;
  notes: string;
}

interface CustomerSummary {
  key: string;
  customerName: string;
  phone: string;
  displayPhone: string;
  country: CurrencyCountry;
  city?: string;
  totalOrders: number;
  totalSpentEgp: number;
  totalSpentSar: number;
  totalSpentAed: number;
  heroes: string[];
  lastOrderDate: number;
}

interface StudioDraftSummary {
  artCount: number;
  totalPages: number;
  completedSteps: number;
  totalSteps: number;
}

function summarizeStudioDraft(draft: StudioDraftRecord | null): StudioDraftSummary | null {
  if (!draft) return null;
  const totalPages = draft.pages.length || draft.pageCount;
  const artCount = draft.pages.filter(
    (p) =>
      Boolean(p.imageVaultId) ||
      (Boolean(p.imageUrl) && !DEFAULT_STORY_FALLBACK_IMAGES.includes(p.imageUrl))
  ).length;
  const { completed, total } = countChecklistCompleted(draft.checklist);
  return {
    artCount,
    totalPages,
    completedSteps: completed,
    totalSteps: total,
  };
}

function buildStudioDraftSummaries(
  orderList: OrderRecord[]
): Record<string, StudioDraftSummary> {
  const map: Record<string, StudioDraftSummary> = {};
  for (const order of orderList) {
    const summary = summarizeStudioDraft(getStudioDraft(order.id));
    if (summary) {
      map[order.id] = summary;
    }
  }
  return map;
}

const STATUS_META: Record<
  OrderStatus,
  { labelAr: string; labelEn: string; colorClass: string }
> = {
  pending_deposit: {
    labelAr: 'بانتظار العربون',
    labelEn: 'Pending Deposit',
    colorClass: 'bg-amber-500/15 text-amber-200 border-amber-400/35',
  },
  deposit_confirmed: {
    labelAr: 'تم تأكيد العربون',
    labelEn: 'Deposit Confirmed',
    colorClass: 'bg-sky-500/15 text-sky-200 border-sky-400/35',
  },
  in_preparation: {
    labelAr: 'جاري تجهيز القصة',
    labelEn: 'In Preparation',
    colorClass: 'bg-purple-500/15 text-purple-200 border-purple-400/35',
  },
  draft_ready: {
    labelAr: 'المسودة جاهزة للمراجعة',
    labelEn: 'Draft Ready',
    colorClass: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/35',
  },
  sent_to_print: {
    labelAr: 'قيد الطباعة والشحن',
    labelEn: 'Sent to Print',
    colorClass: 'bg-indigo-500/15 text-indigo-200 border-indigo-400/35',
  },
  delivered: {
    labelAr: 'تم التوصيل',
    labelEn: 'Delivered',
    colorClass: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/35',
  },
  cancelled: {
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
    colorClass: 'bg-red-500/15 text-red-200 border-red-400/35',
  },
};

const ALL_STATUSES: OrderStatus[] = [
  'pending_deposit',
  'deposit_confirmed',
  'in_preparation',
  'draft_ready',
  'sent_to_print',
  'delivered',
  'cancelled',
];

function isGwpItem(item: OrderItemRecord): boolean {
  return item.itemType === 'gwp_gift' || Boolean(item.isFreeGift);
}

function isMerchItem(item: OrderItemRecord): boolean {
  return !isGwpItem(item) && (item.itemType === 'merch' || item.format === 'physical_merch');
}

function isBookItem(item: OrderItemRecord): boolean {
  return !isGwpItem(item) && !isMerchItem(item);
}

function isMerchOnlyOrder(order: OrderRecord): boolean {
  return order.items.length > 0 && order.items.every((i) => isMerchItem(i) || isGwpItem(i));
}

function getOrderSourceLabel(source: OrderSource, isAr: boolean): string {
  switch (source) {
    case 'wizard':
      return isAr ? 'قصة مخصصة' : 'Custom Wizard';
    case 'merch':
      return isAr ? 'متجر منتجات بابل' : 'Merch Store';
    case 'mixed':
      return isAr ? 'مختلط (قصص + براند)' : 'Mixed (Books + Merch)';
    default:
      return isAr ? 'مكتبة القصص' : 'Catalog Store';
  }
}

function getItemUnitPrice(item: OrderItemRecord, country: CurrencyCountry): number {
  if (isGwpItem(item)) return 0;
  if (country === 'EG') return item.priceEgp;
  if (country === 'AE') return item.priceAed ?? deriveAedFromSar(item.priceSar);
  return item.priceSar;
}

function getItemRetailValue(item: OrderItemRecord, country: CurrencyCountry): number {
  if (country === 'EG') return item.retailValueEgp ?? 0;
  if (country === 'AE') {
    return item.retailValueAed ?? (item.retailValueSar ? deriveAedFromSar(item.retailValueSar) : 0);
  }
  return item.retailValueSar ?? 0;
}

function getOrderItemTypesSummary(items: OrderItemRecord[], isAr: boolean): string {
  const types: string[] = [];
  if (items.some(isBookItem)) types.push(isAr ? 'قصة' : 'Book');
  if (items.some(isMerchItem)) types.push(isAr ? 'منتج براند (Merch)' : 'Merch');
  if (items.some(isGwpItem)) types.push(isAr ? 'هدية مجانية (GWP)' : 'GWP');
  return types.join(isAr ? '، ' : ', ');
}

function normalizePhoneForKey(phone: string, country: CurrencyCountry): string {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '');
  if (!digits) return phone.trim().toLowerCase();
  if (country === 'EG' && digits.startsWith('01') && digits.length === 11) {
    return `2${digits}`;
  }
  if (country === 'SA' && digits.startsWith('05') && digits.length === 10) {
    return `966${digits.slice(1)}`;
  }
  if (country === 'AE' && digits.startsWith('05') && digits.length === 10) {
    return `971${digits.slice(1)}`;
  }
  return digits;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCsvCell(value: string | number | undefined | null): string {
  const raw = value === undefined || value === null ? '' : String(value);
  const neutralized = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  const safe = neutralized.replace(/"/g, '""');
  return `"${safe}"`;
}

function getSuggestedPrice(
  storyId: string,
  country: CurrencyCountry,
  formatKey: ManualFormatKey
): number {
  const catalog = getCatalogStories();
  const story = catalog.find((s) => s.id === storyId);
  if (story) {
    if (formatKey === '15p') {
      return country === 'EG'
        ? story.priceEgp15Pages
        : country === 'AE'
          ? (story.priceAed15Pages ?? story.priceSar15Pages)
          : story.priceSar15Pages;
    }
    if (formatKey === '25p') {
      return country === 'EG'
        ? story.priceEgp25Pages
        : country === 'AE'
          ? (story.priceAed25Pages ?? story.priceSar25Pages)
          : story.priceSar25Pages;
    }
    return country === 'EG'
      ? story.pricePdfEgp
      : country === 'AE'
        ? (story.pricePdfAed ?? story.pricePdfSar)
        : story.pricePdfSar;
  }
  if (formatKey === '15p') return country === 'EG' ? 500 : 110;
  if (formatKey === '25p') return country === 'EG' ? 750 : 165;
  return country === 'EG' ? 250 : 59;
}

function createInitialManualForm(): ManualOrderFormState {
  const catalog = getCatalogStories();
  const firstStoryId = catalog[0]?.id ?? 'custom';
  const defaultPrice = getSuggestedPrice(firstStoryId, 'EG', '15p');
  const depositPct = getStoreConfig().depositPercentage || 50;
  return {
    customerName: '',
    phone: '',
    country: 'EG',
    city: '',
    address: '',
    storyId: firstStoryId,
    customTitleAr: '',
    customTitleEn: '',
    childName: '',
    childAge: '6',
    childGender: 'boy',
    storyLanguage: 'ar',
    formatKey: '15p',
    price: String(defaultPrice),
    depositAmount: String(Math.round(defaultPrice * (depositPct / 100))),
    status: 'pending_deposit',
    notes: '',
  };
}

export default function AdminOrders() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');
  const [orders, setOrders] = useState<OrderRecord[]>(() => getOrders());
  const [search, setSearch] = useState('');
  const [crmSearch, setCrmSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({});
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState<ManualOrderFormState>(() =>
    createInitialManualForm()
  );
  const [orderToDelete, setOrderToDelete] = useState<OrderRecord | null>(null);

  const [catalogStories, setCatalogStories] = useState(() => getCatalogStories());
  const [storeConfig, setStoreConfig] = useState(() => getStoreConfig());
  const [studioDraftSummaries, setStudioDraftSummaries] = useState<
    Record<string, StudioDraftSummary>
  >(() => buildStudioDraftSummaries(orders));

  const refreshOrders = () => {
    const fresh = getOrders();
    setOrders(fresh);
    setStudioDraftSummaries(buildStudioDraftSummaries(fresh));
    if (selectedOrder) {
      const updated = fresh.find((o) => o.id === selectedOrder.id) || null;
      setSelectedOrder(updated);
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      const fresh = getOrders();
      setOrders(fresh);
      setStudioDraftSummaries(buildStudioDraftSummaries(fresh));
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const selectedOrderWaHelpers = useMemo(() => {
    if (!selectedOrder) return null;
    const primaryBook = selectedOrder.items.find(isBookItem);
    const primaryChild = primaryBook?.childName || selectedOrder.items[0]?.childName || '';
    const trackingUrl = `${window.location.origin}/track?ref=${encodeURIComponent(
      selectedOrder.reference
    )}`;
    return buildWhatsAppHelperMessages({
      customerName: selectedOrder.customerName,
      childName: primaryChild,
      reference: selectedOrder.reference,
      trackingUrl,
      phone: selectedOrder.phone,
      country: selectedOrder.country,
    });
  }, [selectedOrder]);

  // Load child photos asynchronously from IndexedDB vault whenever an order is opened
  useEffect(() => {
    if (!selectedOrder) {
      setPhotoMap({});
      return;
    }
    let active = true;
    const loadPhotos = async () => {
      const loaded: Record<string, string> = {};
      for (const item of selectedOrder.items) {
        if (item.photoVaultId) {
          const dataUrl = await getPhotoFromVault(item.photoVaultId);
          if (dataUrl) {
            loaded[item.photoVaultId] = dataUrl;
          }
        }
      }
      if (active) setPhotoMap(loaded);
    };
    void loadPhotos();
    return () => {
      active = false;
    };
  }, [selectedOrder]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      const phoneDigits = order.phone.replace(/\D/g, '');
      const qDigits = q.replace(/\D/g, '');
      return (
        order.reference.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.phone.toLowerCase().includes(q) ||
        (qDigits.length >= 4 && phoneDigits.includes(qDigits)) ||
        (order.city?.toLowerCase().includes(q) ?? false) ||
        (order.promoCode?.toLowerCase().includes(q) ?? false) ||
        (order.giftRecipientName?.toLowerCase().includes(q) ?? false) ||
        order.items.some(
          (i) =>
            (i.childName?.toLowerCase().includes(q) ?? false) ||
            (i.coHeroName?.toLowerCase().includes(q) ?? false) ||
            (i.ribbonName?.toLowerCase().includes(q) ?? false) ||
            (i.sku?.toLowerCase().includes(q) ?? false) ||
            (i.titleAr?.toLowerCase().includes(q) ?? false) ||
            (i.titleEn?.toLowerCase().includes(q) ?? false)
        )
      );
    });
  }, [orders, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    for (const st of ALL_STATUSES) {
      map[st] = orders.filter((o) => o.status === st).length;
    }
    return map;
  }, [orders]);

  const stats = useMemo(() => {
    const pendingDeposit = orders.filter((o) => o.status === 'pending_deposit').length;
    const activeProd = orders.filter((o) =>
      ['deposit_confirmed', 'in_preparation', 'draft_ready', 'sent_to_print'].includes(o.status)
    ).length;
    const totalEgp = orders
      .filter((o) => o.country === 'EG' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const totalSar = orders
      .filter((o) => o.country === 'SA' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const totalAed = orders
      .filter((o) => o.country === 'AE' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    return { pendingDeposit, activeProd, totalEgp, totalSar, totalAed };
  }, [orders]);

  // Aggregate unique customers by normalized phone number
  const customers = useMemo<CustomerSummary[]>(() => {
    const map = new Map<string, CustomerSummary>();
    for (const order of orders) {
      const key = normalizePhoneForKey(order.phone, order.country);
      const existing = map.get(key);
      const heroesFromOrder = order.items
        .filter(isBookItem)
        .map((i) => i.childName.trim())
        .filter((name) => name.length > 0);
      const spentEgp =
        order.status !== 'cancelled' && order.country === 'EG' ? order.totalAmount : 0;
      const spentSar =
        order.status !== 'cancelled' && order.country === 'SA' ? order.totalAmount : 0;
      const spentAed =
        order.status !== 'cancelled' && order.country === 'AE' ? order.totalAmount : 0;

      if (!existing) {
        map.set(key, {
          key,
          customerName: order.customerName,
          phone: order.phone,
          displayPhone: order.phone,
          country: order.country,
          city: order.city,
          totalOrders: 1,
          totalSpentEgp: spentEgp,
          totalSpentSar: spentSar,
          totalSpentAed: spentAed,
          heroes: Array.from(new Set(heroesFromOrder)),
          lastOrderDate: order.createdAt,
        });
      } else {
        existing.totalOrders += 1;
        existing.totalSpentEgp += spentEgp;
        existing.totalSpentSar += spentSar;
        existing.totalSpentAed += spentAed;
        if (order.createdAt > existing.lastOrderDate) {
          existing.lastOrderDate = order.createdAt;
          existing.customerName = order.customerName;
          existing.displayPhone = order.phone;
          if (order.city) existing.city = order.city;
        }
        const mergedHeroes = new Set([...existing.heroes, ...heroesFromOrder]);
        existing.heroes = Array.from(mergedHeroes);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.lastOrderDate - a.lastOrderDate);
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const q = crmSearch.trim().toLowerCase();
    if (!q) return customers;
    const qDigits = q.replace(/\D/g, '');
    return customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.displayPhone.toLowerCase().includes(q) ||
        (qDigits.length >= 3 && c.key.includes(qDigits)) ||
        (c.city?.toLowerCase().includes(q) ?? false) ||
        c.heroes.some((h) => h.toLowerCase().includes(q))
    );
  }, [customers, crmSearch]);

  const repeatCustomersCount = useMemo(
    () => customers.filter((c) => c.totalOrders > 1).length,
    [customers]
  );

  const formatOrderMoney = (amount: number, currencyOrCountry?: string, fallbackCountry?: CurrencyCountry) => {
    const resolved = normalizeCurrencyCode(currencyOrCountry, fallbackCountry);
    return formatMoney(amount, resolved, language);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const updated = updateOrderStatus(orderId, newStatus);
    if (updated) {
      refreshOrders();
      const label = isAr ? STATUS_META[newStatus].labelAr : STATUS_META[newStatus].labelEn;
      toast.success(
        isAr
          ? `تم تحديث حالة الطلب ${updated.reference} إلى "${label}"`
          : `Order ${updated.reference} updated to "${label}"`
      );
    }
  };

  const buildCustomerWhatsAppUrl = (order: OrderRecord) => {
    const meta = STATUS_META[order.status];
    const normalizedPhone = normalizePhoneForKey(order.phone, order.country);
    const trackingUrl = `${window.location.origin}/track?ref=${encodeURIComponent(order.reference)}`;
    const message = encodeURIComponent(
      isAr
        ? `مرحباً ${order.customerName} ✨\n` +
            `تحديث بخصوص طلبك من بابل فيرس برقم: ${order.reference}\n` +
            `الحالة الحالية: ${meta.labelAr}\n\n` +
            `يمكنك متابعة حالة الطلب في أي وقت عبر الرابط:\n${trackingUrl}`
        : `Hello ${order.customerName} ✨\n` +
            `Update regarding your Bubbleverse order: ${order.reference}\n` +
            `Current Status: ${meta.labelEn}\n\n` +
            `Track your order anytime here:\n${trackingUrl}`
    );
    return `https://wa.me/${normalizedPhone}?text=${message}`;
  };

  const buildDirectCustomerWhatsAppUrl = (customer: CustomerSummary) => {
    const normalizedPhone = normalizePhoneForKey(customer.phone, customer.country);
    const msg = encodeURIComponent(
      isAr
        ? `مرحباً ${customer.customerName} ✨، نتواصل معك من فريق بابل فيرس للقصص المصورة.`
        : `Hello ${customer.customerName} ✨, reaching out from the Bubbleverse Storybook team.`
    );
    return `https://wa.me/${normalizedPhone}?text=${msg}`;
  };

  const handleDownloadPhoto = (vaultId: string, childName: string) => {
    const dataUrl = photoMap[vaultId];
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${childName.replace(/\s+/g, '_')}_photo.png`;
    a.click();
    toast.success(isAr ? 'تم تنزيل صورة الطفل' : 'Child photo downloaded');
  };

  const handleCopyRef = (ref: string) => {
    void navigator.clipboard.writeText(ref);
    toast.success(isAr ? `تم نسخ رقم الطلب ${ref}` : `Copied ${ref}`);
  };

  // 1-Click UTF-8 BOM CSV Export (Excel-friendly for Arabic)
  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      toast.error(isAr ? 'لا توجد طلبات لتصديرها' : 'No orders to export');
      return;
    }

    const headers = isAr
      ? [
          'رقم الطلب',
          'التاريخ',
          'الحالة',
          'المصدر',
          'أنواع المنتجات (قصة/براند/هدية)',
          'اسم العميل',
          'الهاتف',
          'الدولة',
          'المدينة',
          'العنوان',
          'القصص والمنتجات والأبطال',
          'الإضافات والتخصيص',
          'كود الخصم',
          'قيمة الخصم',
          'طلب هدية / إخفاء السعر',
          'الإجمالي',
          'العربون',
          'المتبقي',
          'العملة',
          'ملاحظات',
        ]
      : [
          'Reference',
          'Date',
          'Status',
          'Source',
          'Item Types (Book/Merch/GWP)',
          'Customer Name',
          'Phone',
          'Country',
          'City',
          'Address',
          'Items & Heroes',
          'Add-ons',
          'Promo Code',
          'Discount',
          'Gift Order / Hide Price',
          'Total',
          'Deposit',
          'Remaining',
          'Currency',
          'Notes',
        ];

    const rows = filteredOrders.map((order) => {
      const statusLabel = isAr
        ? STATUS_META[order.status].labelAr
        : STATUS_META[order.status].labelEn;
      const sourceLabel = getOrderSourceLabel(order.source, isAr);
      const itemTypesLabel = getOrderItemTypesSummary(order.items, isAr);
      const itemsSummary = order.items
        .map((item) => {
          const title = isAr ? item.titleAr || item.titleEn : item.titleEn || item.titleAr;
          if (isGwpItem(item)) {
            const variant = isAr ? item.variantLabelAr || item.formatLabelAr : item.variantLabelEn || item.formatLabelEn;
            const skuPart = item.sku ? ` [${item.sku}]` : '';
            return `[GWP] ${title}${skuPart} (${variant} x${item.quantity})`;
          }
          if (isMerchItem(item)) {
            const variant = isAr ? item.variantLabelAr || item.formatLabelAr : item.variantLabelEn || item.formatLabelEn;
            const skuPart = item.sku ? ` [${item.sku}]` : '';
            return `[Merch] ${title}${skuPart} (${variant} x${item.quantity})`;
          }
          const fmt = isAr ? item.formatLabelAr : item.formatLabelEn;
          return `${title} (${item.childName} - ${fmt} x${item.quantity})`;
        })
        .join(' | ');
      const addonsSummary = order.items
        .map((item) => {
          const addons = summarizeOrderItemAddons(item, language);
          if (addons.length === 0) return '';
          const title = isAr ? item.titleAr || item.titleEn : item.titleEn || item.titleAr;
          return `${title}: ${addons.join(' + ')}`;
        })
        .filter(Boolean)
        .join(' | ');
      const giftSummary =
        order.isGiftOrder || order.giftHidePrice || order.giftRecipientName
          ? [
              order.giftHidePrice
                ? isAr
                  ? 'هدية (إخفاء الأسعار)'
                  : 'Gift (Hide Prices)'
                : isAr
                  ? 'طلب هدية'
                  : 'Gift Order',
              order.giftRecipientName
                ? `${isAr ? 'المُهدى إليه:' : 'Recipient:'} ${order.giftRecipientName}`
                : '',
            ]
              .filter(Boolean)
              .join(' — ')
          : isAr
            ? 'لا'
            : 'No';
      const remaining = Math.max(0, order.totalAmount - order.depositAmount);
      const normalizedCurrency = normalizeCurrencyCode(order.currency, order.country);
      return [
        order.reference,
        new Date(order.createdAt).toISOString(),
        statusLabel,
        sourceLabel,
        itemTypesLabel,
        order.customerName,
        order.phone,
        order.country,
        order.city ?? '',
        order.address ?? '',
        itemsSummary,
        addonsSummary,
        order.promoCode ?? '',
        order.discountAmount ?? 0,
        giftSummary,
        order.totalAmount,
        order.depositAmount,
        remaining,
        normalizedCurrency,
        order.orderNotes ?? '',
      ]
        .map(escapeCsvCell)
        .join(',');
    });

    const csvContent = `\uFEFF${[headers.map(escapeCsvCell).join(','), ...rows].join('\r\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bubbleverse-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(
      isAr
        ? `تم تصدير ${filteredOrders.length} طلب بنجاح بصيغة CSV`
        : `Exported ${filteredOrders.length} orders to CSV`
    );
  };

  // 1-Click Printable Order Invoice / Gift Packing Slip
  const handlePrintInvoice = (order: OrderRecord) => {
    const win = window.open('', '_blank', 'width=880,height=920');
    if (!win) {
      toast.error(
        isAr
          ? 'يرجى السماح بالنوافذ المنبثقة لفتح الفاتورة للطباعة'
          : 'Please allow pop-ups to open the printable invoice'
      );
      return;
    }

    const dir = isAr ? 'rtl' : 'ltr';
    const langAttr = isAr ? 'ar' : 'en';
    const hidePrices = Boolean(order.giftHidePrice);
    const currencyCode = normalizeCurrencyCode(order.currency, order.country);
    const fmtMoney = (amt: number) => escapeHtml(formatMoney(amt, currencyCode, language));
    const statusLabel = isAr
      ? STATUS_META[order.status].labelAr
      : STATUS_META[order.status].labelEn;
    const countryLabel =
      order.country === 'EG'
        ? isAr
          ? 'مصر'
          : 'Egypt'
        : order.country === 'AE'
          ? isAr
            ? 'الإمارات العربية المتحدة'
            : 'United Arab Emirates'
          : isAr
            ? 'المملكة العربية السعودية'
            : 'Saudi Arabia';
    const remaining = Math.max(0, order.totalAmount - order.depositAmount);
    const discountAmount = order.discountAmount && order.discountAmount > 0 ? order.discountAmount : 0;
    const grossSubtotal = order.totalAmount + discountAmount;
    const totalItemCount = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    const docHeading = hidePrices
      ? isAr
        ? 'إيصال هدية (بدون أسعار) / Gift Packing Slip'
        : 'Gift Packing Slip (No Prices)'
      : isAr
        ? 'فاتورة طلب بابل فيرس'
        : 'Bubbleverse Order Invoice';

    const itemsRowsHtml = order.items
      .map((item, idx) => {
        const title = escapeHtml(isAr ? item.titleAr || item.titleEn : item.titleEn || item.titleAr);
        const gwp = isGwpItem(item);
        const merch = isMerchItem(item);
        const addons = summarizeOrderItemAddons(item, language);
        const addonsHtml =
          addons.length > 0
            ? `<div class="badges">${addons
                .map((badge) => `<span class="tag">${escapeHtml(badge)}</span>`)
                .join('')}</div>`
            : '';

        let detailsHtml = '';
        let formatCellHtml = '';
        let priceCellHtml = '';

        if (gwp) {
          const variant = escapeHtml(
            isAr
              ? item.variantLabelAr || item.formatLabelAr || 'هدية مجانية'
              : item.variantLabelEn || item.formatLabelEn || 'Free Gift'
          );
          const retailVal = getItemRetailValue(item, order.country);
          detailsHtml = `
            <div class="title-row">
              <strong>${title}</strong>
              <span class="badge-gwp">${isAr ? '🎁 هدية مجانية (GWP)' : '🎁 FREE Gift (GWP)'}</span>
            </div>
            ${item.sku ? `<div class="sub" dir="ltr" style="text-align:${isAr ? 'right' : 'left'};">SKU: ${escapeHtml(item.sku)}</div>` : ''}
            ${addonsHtml}
          `;
          formatCellHtml = variant;
          priceCellHtml = hidePrices
            ? ''
            : `<td class="num" style="color:#047857;">
                ${fmtMoney(0)}
                ${retailVal > 0 ? `<div class="sub">${isAr ? 'القيمة' : 'Value'}: ${fmtMoney(retailVal)}</div>` : ''}
              </td>`;
        } else if (merch) {
          const variant = escapeHtml(
            isAr
              ? item.variantLabelAr || item.formatLabelAr || 'منتج براند'
              : item.variantLabelEn || item.formatLabelEn || 'Brand Merch'
          );
          const unitPrice = getItemUnitPrice(item, order.country);
          const lineTotal = unitPrice * (item.quantity || 1);
          detailsHtml = `
            <div class="title-row">
              <strong>${title}</strong>
              <span class="badge-merch">${isAr ? 'منتج براند / Merch' : 'Brand Merch'}</span>
            </div>
            ${item.sku ? `<div class="sub" dir="ltr" style="text-align:${isAr ? 'right' : 'left'};">SKU: ${escapeHtml(item.sku)}</div>` : ''}
            ${addonsHtml}
            ${item.giftMessage ? `<div class="sub">${isAr ? 'ملاحظة الهدية' : 'Gift Note'}: ${escapeHtml(item.giftMessage)}</div>` : ''}
          `;
          formatCellHtml = variant;
          priceCellHtml = hidePrices ? '' : `<td class="num">${fmtMoney(lineTotal)}</td>`;
        } else {
          const fmt = escapeHtml(isAr ? item.formatLabelAr : item.formatLabelEn);
          const hero = escapeHtml(item.childName);
          const genderText =
            item.childGender === 'boy' ? (isAr ? 'ولد' : 'Boy') : isAr ? 'بنت' : 'Girl';
          const unitPrice = getItemUnitPrice(item, order.country);
          const addonPrice = calculateAddonTotal(item, order.country);
          const lineTotal = (unitPrice + addonPrice) * (item.quantity || 1);
          detailsHtml = `
            <strong>${title}</strong>
            <div class="sub">${isAr ? 'البطل' : 'Hero'}: ${hero} (${genderText} · ${escapeHtml(item.childAge)} ${isAr ? 'سنوات' : 'yrs'})</div>
            ${addonsHtml}
            ${item.giftMessage ? `<div class="sub">${isAr ? 'الإهداء' : 'Dedication'}: ${escapeHtml(item.giftMessage)}</div>` : ''}
          `;
          formatCellHtml = `${fmt} (${item.pagesCount} ${isAr ? 'صفحة' : 'p'})`;
          priceCellHtml = hidePrices ? '' : `<td class="num">${fmtMoney(lineTotal)}</td>`;
        }

        return `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td>${detailsHtml}</td>
            <td>${formatCellHtml}</td>
            <td style="text-align:center;">${item.quantity}</td>
            ${priceCellHtml}
          </tr>
        `;
      })
      .join('');

    const giftBannerHtml =
      hidePrices || order.isGiftOrder || order.giftRecipientName
        ? `<div class="gift-banner">
            <div class="gift-title">🎁 ${
              hidePrices
                ? isAr
                  ? 'إيصال هدية (بدون أسعار) — Gift Packing Slip'
                  : 'Gift Packing Slip — Prices Intentionally Omitted'
                : isAr
                  ? 'طلب هدية خاص من بابل فيرس'
                  : 'Special Gift Order from Bubbleverse'
            }</div>
            ${
              order.giftRecipientName
                ? `<div class="gift-sub">${isAr ? 'المُهدى إليه:' : 'Gift Recipient:'} <strong>${escapeHtml(order.giftRecipientName)}</strong></div>`
                : ''
            }
          </div>`
        : '';

    const totalsSectionHtml = hidePrices
      ? `<div class="totals gift-slip-summary">
          <div class="total-row">
            <span>${isAr ? 'إجمالي القطع داخل الصندوق' : 'Total Items in Package'}</span>
            <span class="num">${totalItemCount}</span>
          </div>
          <div class="sub" style="margin-top:8px;">
            ${
              isAr
                ? 'تم إخفاء جميع الأسعار والإجماليات بناءً على طلب المُهدي (إيصال هدية).'
                : 'All prices, totals, and balances are hidden per the sender’s gift packing slip request.'
            }
          </div>
        </div>`
      : `<div class="totals">
          <div class="total-row">
            <span>${isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span class="num">${fmtMoney(discountAmount > 0 ? grossSubtotal : order.totalAmount)}</span>
          </div>
          ${
            order.promoCode || discountAmount > 0
              ? `<div class="total-row" style="color:#047857;">
                  <span>${
                    order.promoCode
                      ? `${isAr ? 'الخصم' : 'Discount'} (${escapeHtml(order.promoCode)})`
                      : isAr
                        ? 'خصم الباقة / التوفير'
                        : 'Bundle / Volume Discount'
                  }</span>
                  <span class="num">-${fmtMoney(discountAmount)}</span>
                </div>`
              : ''
          }
          <div class="total-row">
            <span>${isAr ? 'الإجمالي النهائي' : 'Order Total'}</span>
            <span class="num">${fmtMoney(order.totalAmount)}</span>
          </div>
          <div class="total-row">
            <span>${isAr ? 'العربون المطلوب / المدفوع' : 'Deposit'}</span>
            <span class="num">${fmtMoney(order.depositAmount)}</span>
          </div>
          <div class="total-row grand">
            <span>${isAr ? 'المتبقي عند الاستلام' : 'Remaining Balance'}</span>
            <span class="num">${fmtMoney(remaining)}</span>
          </div>
        </div>`;

    const html = `<!DOCTYPE html>
<html lang="${langAttr}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(order.reference)} — ${escapeHtml(docHeading)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px 24px;
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
    }
    .sheet {
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      padding: 32px;
      box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${hidePrices ? '#ec4899' : '#0ea5e9'};
      margin-bottom: 20px;
    }
    .brand {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .brand span { color: #0284c7; }
    .doc-type {
      margin-top: 6px;
      font-size: 14px;
      font-weight: 800;
      color: ${hidePrices ? '#be185d' : '#0369a1'};
    }
    .tagline { font-size: 12px; color: #64748b; margin-top: 4px; }
    .ref-box { text-align: ${isAr ? 'left' : 'right'}; }
    .ref-code { font-family: monospace; font-size: 18px; font-weight: 800; color: #0284c7; }
    .pill {
      display: inline-block;
      margin-top: 6px;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: #e0f2fe;
      color: #0369a1;
    }
    .gift-banner {
      margin-bottom: 20px;
      padding: 14px 18px;
      border-radius: 14px;
      background: #fdf2f8;
      border: 1px solid #fbcfe8;
      color: #9d174d;
    }
    .gift-title { font-weight: 800; font-size: 14px; }
    .gift-sub { margin-top: 4px; font-size: 13px; color: #831843; }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 24px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px;
      font-size: 13px;
    }
    .grid-label { color: #64748b; font-size: 11px; margin-bottom: 2px; }
    .grid-val { font-weight: 700; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 12px;
      text-align: ${isAr ? 'right' : 'left'};
      font-weight: 700;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .title-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .badge-gwp {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #6ee7b7;
    }
    .badge-merch {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      background: #f3e8ff;
      color: #6b21a8;
      border: 1px solid #d8b4fe;
    }
    .badges { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
    .tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }
    .sub { font-size: 11px; color: #64748b; margin-top: 4px; }
    .num { font-variant-numeric: tabular-nums; font-weight: 700; white-space: nowrap; }
    .totals {
      max-width: 340px;
      margin-${isAr ? 'right' : 'left'}: auto;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px;
      background: #f8fafc;
    }
    .gift-slip-summary {
      background: #fdf2f8;
      border-color: #fbcfe8;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }
    .total-row.grand {
      border-top: 2px solid #cbd5e1;
      margin-top: 6px;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 800;
      color: #0284c7;
    }
    .notes {
      margin-top: 20px;
      padding: 12px 16px;
      border-radius: 12px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      font-size: 12px;
      color: #92400e;
    }
    .actions {
      margin-top: 28px;
      display: flex;
      justify-content: center;
      gap: 12px;
    }
    .btn-print {
      background: linear-gradient(135deg, #0284c7, #7c3aed);
      color: #ffffff;
      border: none;
      padding: 12px 28px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
    }
    .footer-note {
      margin-top: 24px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .sheet { box-shadow: none; border: none; padding: 12px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="brand">Bubble<span>verse</span></div>
        <div class="doc-type">${escapeHtml(docHeading)}</div>
        <div class="tagline">${isAr ? 'قصص أطفال مصورة ومنتجات عالم بابل الفاخرة' : 'Personalized Illustrated Storybooks & Official Bub Merch'}</div>
      </div>
      <div class="ref-box">
        <div class="ref-code">${escapeHtml(order.reference)}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">${escapeHtml(formatDateTime(order.createdAt))}</div>
        <div class="pill">${escapeHtml(statusLabel)}</div>
      </div>
    </div>

    ${giftBannerHtml}

    <div class="grid">
      <div>
        <div class="grid-label">${hidePrices && order.giftRecipientName ? (isAr ? 'المُهدى إليه' : 'Gift Recipient') : (isAr ? 'اسم العميل' : 'Customer Name')}</div>
        <div class="grid-val">${escapeHtml(hidePrices && order.giftRecipientName ? order.giftRecipientName : order.customerName)}</div>
      </div>
      <div>
        <div class="grid-label">${isAr ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}</div>
        <div class="grid-val" dir="ltr" style="text-align:${isAr ? 'right' : 'left'};">${escapeHtml(order.phone)}</div>
      </div>
      <div>
        <div class="grid-label">${isAr ? 'الدولة والمدينة' : 'Country & City'}</div>
        <div class="grid-val">${escapeHtml(countryLabel)}${order.city ? ` — ${escapeHtml(order.city)}` : ''}</div>
      </div>
      <div>
        <div class="grid-label">${isAr ? 'العنوان' : 'Shipping Address'}</div>
        <div class="grid-val">${escapeHtml(order.address || (isAr ? 'غير محدد' : 'Not provided'))}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:42px;text-align:center;">#</th>
          <th>${isAr ? 'المنتج / القصة والتفاصيل' : 'Item / Storybook & Details'}</th>
          <th>${isAr ? 'الإصدار / المقاس' : 'Format / Variant'}</th>
          <th style="text-align:center;">${isAr ? 'الكمية' : 'Qty'}</th>
          ${hidePrices ? '' : `<th>${isAr ? 'السعر' : 'Price'}</th>`}
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHtml}
      </tbody>
    </table>

    ${totalsSectionHtml}

    ${order.orderNotes ? `<div class="notes"><strong>${isAr ? 'ملاحظات الطلب:' : 'Order Notes:'}</strong> ${escapeHtml(order.orderNotes)}</div>` : ''}

    <div class="actions no-print">
      <button class="btn-print" onclick="window.print()">${isAr ? 'طباعة / حفظ كـ PDF' : 'Print / Save as PDF'}</button>
    </div>

    <div class="footer-note">
      ${isAr ? 'شكراً لاختياركم بابل فيرس — تابع طلبك في أي وقت باستخدام رقم الطلب أعلاه.' : 'Thank you for choosing Bubbleverse — track your order anytime with your reference code above.'}
    </div>
  </div>
</body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  // Manual Order form handlers
  const updateManualPricing = (
    nextStoryId: string,
    nextCountry: CurrencyCountry,
    nextFormat: ManualFormatKey
  ) => {
    const suggested = getSuggestedPrice(nextStoryId, nextCountry, nextFormat);
    const depositPct = storeConfig.depositPercentage || 50;
    const deposit =
      nextFormat === 'pdf' ? suggested : Math.round(suggested * (depositPct / 100));
    setManualForm((prev) => ({
      ...prev,
      storyId: nextStoryId,
      country: nextCountry,
      formatKey: nextFormat,
      price: String(suggested),
      depositAmount: String(deposit),
    }));
  };

  const handleOpenManualModal = () => {
    setCatalogStories(getCatalogStories());
    setStoreConfig(getStoreConfig());
    setManualForm(createInitialManualForm());
    setManualOpen(true);
  };

  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.customerName.trim() || !manualForm.phone.trim() || !manualForm.childName.trim()) {
      toast.error(
        isAr
          ? 'يرجى إدخال اسم العميل ورقم الهاتف واسم الطفل البطل'
          : 'Please enter customer name, phone, and child hero name'
      );
      return;
    }

    const numericPrice = Math.max(0, Number(manualForm.price) || 0);
    const numericDeposit = Math.min(
      numericPrice,
      Math.max(0, Number(manualForm.depositAmount) || 0)
    );

    const selectedCatalogStory =
      manualForm.storyId !== 'custom'
        ? catalogStories.find((s) => s.id === manualForm.storyId)
        : undefined;

    const isPdf = manualForm.formatKey === 'pdf';
    const pagesCount = manualForm.formatKey === '25p' ? 25 : 15;
    const formatLabelAr = isPdf
      ? 'نسخة رقمية'
      : pagesCount === 25
        ? 'كتاب مطبوع فاخر (25 صفحة)'
        : 'كتاب مطبوع فاخر (15 صفحة)';
    const formatLabelEn = isPdf
      ? 'Digital PDF'
      : pagesCount === 25
        ? 'Hardcover Book (25 Pages)'
        : 'Hardcover Book (15 Pages)';

    const item: OrderItemRecord = {
      storyId: selectedCatalogStory ? selectedCatalogStory.id : 'custom-story',
      titleAr: selectedCatalogStory
        ? selectedCatalogStory.titleAr
        : manualForm.customTitleAr.trim() || `مغامرة ${manualForm.childName.trim()} السحرية`,
      titleEn: selectedCatalogStory
        ? selectedCatalogStory.titleEn
        : manualForm.customTitleEn.trim() || `${manualForm.childName.trim()}'s Magical Adventure`,
      coverImage: selectedCatalogStory?.coverImage || '/bubble-books/space.jpg',
      format: isPdf ? 'digital_pdf' : 'hardcover_book',
      formatLabelAr,
      formatLabelEn,
      pagesCount,
      childName: manualForm.childName.trim(),
      childGender: manualForm.childGender,
      childAge: manualForm.childAge.trim() || '6',
      storyLanguage: manualForm.storyLanguage,
      priceEgp: manualForm.country === 'EG' ? numericPrice : Math.round(numericPrice * 4.5),
      priceSar: manualForm.country === 'EG' ? Math.round(numericPrice / 4.5) : numericPrice,
      priceAed: manualForm.country === 'EG' ? Math.round(numericPrice / 4.5) : numericPrice,
      quantity: 1,
    };

    const created = createManualOrder({
      customerName: manualForm.customerName.trim(),
      phone: manualForm.phone.trim(),
      country: manualForm.country,
      city: manualForm.city.trim() || undefined,
      address: manualForm.address.trim() || undefined,
      source: manualForm.storyId === 'custom' ? 'wizard' : 'catalog',
      items: [item],
      totalAmount: numericPrice,
      depositAmount: numericDeposit,
      currency: getCurrencyMeta(manualForm.country).code,
      status: manualForm.status,
      orderNotes: manualForm.notes.trim() || undefined,
    });

    void triggerOrderWebhook(created);
    const updatedList = getOrders();
    setOrders(updatedList);
    setStudioDraftSummaries(buildStudioDraftSummaries(updatedList));
    setManualOpen(false);
    setActiveTab('orders');
    setSelectedOrder(created);

    toast.success(
      isAr
        ? `تم إنشاء الطلب اليدوي بنجاح برقم تتبع ${created.reference}`
        : `Manual order created with tracking code ${created.reference}`
    );
  };

  const handleConfirmDeleteOrder = () => {
    if (!orderToDelete) return;
    const deletedRef = orderToDelete.reference;
    const ok = deleteOrder(orderToDelete.id);
    if (ok) {
      if (selectedOrder?.id === orderToDelete.id) {
        setSelectedOrder(null);
      }
      const updatedList = getOrders();
      setOrders(updatedList);
      setStudioDraftSummaries(buildStudioDraftSummaries(updatedList));
      toast.success(
        isAr ? `تم حذف الطلب ${deletedRef} بنجاح` : `Order ${deletedRef} deleted`
      );
    }
    setOrderToDelete(null);
  };

  const handleFilterOrdersByCustomer = (customer: CustomerSummary) => {
    setStatusFilter('all');
    setSearch(customer.displayPhone);
    setActiveTab('orders');
  };

  const manualCurrencyMeta = getCurrencyMeta(manualForm.country);
  const manualCurrencyLabel = isAr ? manualCurrencyMeta.labelAr : manualCurrencyMeta.labelEn;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[min(100%,108rem)] mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center shadow-[0_0_24px_rgba(0,217,255,0.18)]">
              <ShoppingBag className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-editorial">
                {isAr ? 'الطلبات وسجل العملاء' : 'Orders & Customers Hub'}
              </h1>
              <p className="text-sm text-slate-300/80 mt-0.5">
                {isAr
                  ? 'إدارة الطلبات، إضافة طلبات واتساب اليدوية، طباعة الفواتير، ومتابعة سجل عملاء بابل فيرس.'
                  : 'Manage catalog & manual orders, export CSV, print invoices, and track repeat families.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              onClick={refreshOrders}
              variant="outline"
              className="h-10 px-4 rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white text-xs font-semibold gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isAr ? 'تحديث' : 'Refresh'}</span>
            </Button>

            <Button
              type="button"
              onClick={handleExportCsv}
              variant="outline"
              className="h-10 px-4 rounded-full border-cyan-400/35 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:text-white text-xs font-semibold gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
            </Button>

            <Button
              type="button"
              onClick={handleOpenManualModal}
              className="bubble-btn bubble-btn-primary h-10 px-5 text-xs font-bold gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة طلب يدوي' : 'Add Manual Order'}</span>
            </Button>
          </div>
        </div>

        {/* Top 2 Tabs: Orders Management & Customers CRM */}
        <div
          role="tablist"
          aria-label={isAr ? 'أقسام إدارة الطلبات' : 'Orders hub sections'}
          className="glass-card p-2 inline-flex flex-wrap gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer inline-flex items-center gap-2.5 ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500 text-slate-950 shadow-[0_6px_24px_rgba(0,217,255,0.3)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isAr ? 'الطلبات' : 'Orders Management'}</span>
            <span
              className={`font-numeric text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'orders'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-white/10 text-cyan-300'
              }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'crm'}
            onClick={() => setActiveTab('crm')}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all cursor-pointer inline-flex items-center gap-2.5 ${
              activeTab === 'crm'
                ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white shadow-[0_6px_24px_rgba(168,85,247,0.35)]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isAr ? 'سجل العملاء' : 'Customers CRM'}</span>
            <span
              className={`font-numeric text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'crm'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-pink-300'
              }`}
            >
              {customers.length}
            </span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: ORDERS MANAGEMENT                                            */}
        {/* =================================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Live KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    {isAr ? 'إجمالي الطلبات' : 'Total Orders'}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-cyan-300" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-white font-numeric">{orders.length}</p>
              </div>

              <div className="glass-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-200">
                    {isAr ? 'بانتظار العربون' : 'Pending Deposit'}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-300" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-amber-300 font-numeric">
                  {stats.pendingDeposit}
                </p>
              </div>

              <div className="glass-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-200">
                    {isAr ? 'قيد التجهيز والطباعة' : 'In Production'}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-400/25 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-300" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-purple-300 font-numeric">
                  {stats.activeProd}
                </p>
              </div>

              <div className="glass-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-200">
                    {isAr ? 'الإيرادات النشطة' : 'Active Revenue'}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  </div>
                </div>
                <p className="text-xl font-extrabold text-white font-numeric leading-tight">
                  {formatOrderMoney(stats.totalEgp, 'EGP')}
                  {stats.totalSar > 0 ? (
                    <span className="block text-sm text-emerald-300 mt-0.5">
                      {formatOrderMoney(stats.totalSar, 'SAR')}
                    </span>
                  ) : null}
                  {stats.totalAed > 0 ? (
                    <span className="block text-sm text-cyan-300 mt-0.5">
                      {formatOrderMoney(stats.totalAed, 'AED')}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>

            {/* Search & Status Filters */}
            <div className="glass-card p-4 sm:p-5 space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1 max-w-lg">
                  <Search className="w-4 h-4 text-cyan-300/80 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={
                      isAr
                        ? 'ابحث برقم الطلب، اسم العميل، الهاتف، أو اسم الطفل...'
                        : 'Search by ref (BV-...), customer, phone, or child name...'
                    }
                    className="ps-10 pe-9 h-11 rounded-2xl bg-slate-950/70 border-white/15 text-white placeholder:text-slate-400 text-sm"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-300/80 flex items-center gap-2">
                  <span>
                    {isAr ? 'نتائج العرض:' : 'Showing:'}{' '}
                    <strong className="text-white font-numeric">{filteredOrders.length}</strong>{' '}
                    {isAr ? 'من' : 'of'}{' '}
                    <strong className="text-cyan-300 font-numeric">{orders.length}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
                    statusFilter === 'all'
                      ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 border-cyan-300 shadow-[0_0_18px_rgba(0,217,255,0.28)]'
                      : 'bg-slate-950/60 text-slate-300 border-white/10 hover:border-cyan-400/40 hover:text-white'
                  }`}
                >
                  <span>{isAr ? 'الكل' : 'All'}</span>
                  <span className="font-numeric opacity-85">({statusCounts.all})</span>
                </button>
                {ALL_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
                      statusFilter === st
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-pink-400/50 shadow-[0_0_18px_rgba(168,85,247,0.35)]'
                        : 'bg-slate-950/60 text-slate-300 border-white/10 hover:border-purple-400/40 hover:text-white'
                    }`}
                  >
                    <span>{isAr ? STATUS_META[st].labelAr : STATUS_META[st].labelEn}</span>
                    <span className="font-numeric opacity-80">({statusCounts[st] ?? 0})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="glass-card p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">
                    {orders.length === 0
                      ? isAr
                        ? 'لا توجد طلبات حتى الآن'
                        : 'No Orders Yet'
                      : isAr
                        ? 'لا توجد طلبات مطابقة للبحث'
                        : 'No Matching Orders'}
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    {orders.length === 0
                      ? isAr
                        ? 'ستظهر هنا طلبات المتجر والطلبات اليدوية فوراً مع صور الأطفال وأكواد التتبع.'
                        : 'Orders placed via the storefront or added manually will appear here instantly with child photos and tracking codes.'
                      : isAr
                        ? 'جرّب تعديل كلمة البحث أو اختيار حالة أخرى.'
                        : 'Try clearing your search filter or selecting another order status.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  {(search || statusFilter !== 'all') && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('all');
                      }}
                      className="rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 text-xs"
                    >
                      {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleOpenManualModal}
                    className="bubble-btn bubble-btn-primary h-10 px-5 text-xs font-bold gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'إضافة طلب يدوي' : 'Add Manual Order'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredOrders.map((order) => {
                  const statusMeta = STATUS_META[order.status];
                  const statusLabel = isAr ? statusMeta.labelAr : statusMeta.labelEn;
                  const draftSummary = studioDraftSummaries[order.id];
                  const merchOnly = isMerchOnlyOrder(order);
                  const hasGwp = order.items.some(isGwpItem);
                  const hasMerch = order.items.some(isMerchItem);
                  const heroNames = order.items
                    .filter(isBookItem)
                    .map((i) => i.childName.trim())
                    .filter(Boolean);
                  const merchTitles = order.items
                    .filter((i) => isMerchItem(i) || isGwpItem(i))
                    .map((i) => (isAr ? i.titleAr || i.titleEn : i.titleEn || i.titleAr));

                  return (
                    <div
                      key={order.id}
                      className="glass-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyRef(order.reference)}
                            className="font-mono font-numeric font-bold text-cyan-300 hover:text-cyan-200 text-sm inline-flex items-center gap-1.5 cursor-pointer"
                            dir="ltr"
                            title={isAr ? 'نسخ رقم الطلب' : 'Copy reference'}
                          >
                            <span>{order.reference}</span>
                            <Copy className="w-4 h-4" />
                          </button>

                          <Badge className={`border text-[11px] rounded-full px-2.5 py-0.5 ${statusMeta.colorClass}`}>
                            {statusLabel}
                          </Badge>

                          <Badge className="bg-slate-950/70 text-slate-300 border border-white/10 text-[11px] rounded-full px-2.5 py-0.5">
                            {getOrderSourceLabel(order.source, isAr)}
                          </Badge>

                          {hasMerch && (
                            <Badge className="bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-400/35 text-[11px] rounded-full px-2.5 py-0.5 inline-flex items-center gap-1">
                              <Package className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>{isAr ? 'منتجات براند' : 'Merch'}</span>
                            </Badge>
                          )}

                          {hasGwp && (
                            <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/45 text-[11px] rounded-full px-2.5 py-0.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                              {isAr ? '🎁 هدية مجانية (GWP)' : '🎁 Free Gift (GWP)'}
                            </Badge>
                          )}

                          {(order.isGiftOrder || order.giftHidePrice) && (
                            <Badge className="bg-pink-500/20 text-pink-200 border border-pink-400/40 text-[11px] rounded-full px-2.5 py-0.5 inline-flex items-center gap-1">
                              <Gift className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>
                                {order.giftHidePrice
                                  ? isAr
                                    ? 'هدية • إخفاء الأسعار'
                                    : 'Gift • Hide Prices'
                                  : isAr
                                    ? 'طلب هدية'
                                    : 'Gift Order'}
                              </span>
                            </Badge>
                          )}

                          {order.promoCode && (
                            <Badge className="bg-amber-500/15 text-amber-200 border border-amber-400/35 text-[11px] rounded-full px-2.5 py-0.5 font-numeric inline-flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span dir="ltr">{order.promoCode}</span>
                            </Badge>
                          )}

                          {!merchOnly && draftSummary && (
                            <Badge className="bg-purple-500/15 text-purple-200 border border-purple-400/35 text-[11px] rounded-full px-2.5 py-0.5 font-numeric inline-flex items-center gap-1.5">
                              <Wand2 className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                              <span>
                                {isAr
                                  ? `مسودة: ${draftSummary.artCount}/${draftSummary.totalPages} لوحة • ${draftSummary.completedSteps}/${draftSummary.totalSteps} خطوات`
                                  : `Draft: ${draftSummary.artCount}/${draftSummary.totalPages} art • ${draftSummary.completedSteps}/${draftSummary.totalSteps} steps`}
                              </span>
                            </Badge>
                          )}

                          <span className="text-xs text-slate-400 font-numeric">
                            {formatDateTime(order.createdAt)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                            <User className="w-4 h-4 text-purple-300 shrink-0" />
                            <span>{order.customerName}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-numeric" dir="ltr">
                            <Phone className="w-4 h-4 text-emerald-300 shrink-0" />
                            <span>{order.phone}</span>
                          </span>
                          {heroNames.length > 0 && (
                            <span className="text-slate-300">
                              {isAr ? 'الأبطال:' : 'Heroes:'}{' '}
                              <strong className="text-white">
                                {heroNames.join(isAr ? '، ' : ', ')}
                              </strong>
                            </span>
                          )}
                          {merchTitles.length > 0 && (
                            <span className="text-slate-300">
                              {isAr ? 'المنتجات:' : 'Merch:'}{' '}
                              <strong className="text-fuchsia-200">
                                {merchTitles.join(isAr ? '، ' : ', ')}
                              </strong>
                            </span>
                          )}
                          <span className="font-numeric font-bold text-cyan-300">
                            {formatOrderMoney(order.totalAmount, order.currency, order.country)}{' '}
                            <span className="text-slate-400 font-normal">
                              ({isAr ? 'العربون:' : 'Deposit:'}{' '}
                              {formatOrderMoney(order.depositAmount, order.currency, order.country)})
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Quick Inline Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <select
                          aria-label={
                            isAr
                              ? `تغيير حالة الطلب ${order.reference}`
                              : `Status for ${order.reference}`
                          }
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          className="h-10 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white px-3 cursor-pointer"
                        >
                          {ALL_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {isAr ? STATUS_META[st].labelAr : STATUS_META[st].labelEn}
                            </option>
                          ))}
                        </select>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="h-10 px-3.5 rounded-full bg-white/10 hover:bg-cyan-500/20 border border-white/15 text-white text-xs font-semibold gap-1.5"
                        >
                          {merchOnly ? (
                            <>
                              <Package className="w-4 h-4" />
                              <span>{isAr ? 'التفاصيل والتغليف' : 'Details & Packing'}</span>
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-4 h-4" />
                              <span>{isAr ? 'التفاصيل والصور' : 'Details & Photos'}</span>
                            </>
                          )}
                        </Button>

                        {merchOnly ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handlePrintInvoice(order)}
                            className="h-10 px-3.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/35 text-purple-100 text-xs font-bold gap-1.5"
                          >
                            <Printer className="w-4 h-4" />
                            <span>
                              {order.giftHidePrice
                                ? isAr
                                  ? 'إيصال هدية'
                                  : 'Gift Slip'
                                : isAr
                                  ? 'إيصال تغليف'
                                  : 'Packing Slip'}
                            </span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => navigate(`/admin/studio?orderId=${order.id}`)}
                            className="bubble-btn bubble-btn-secondary h-10 px-3.5 text-xs font-bold gap-1.5"
                          >
                            <Wand2 className="w-4 h-4" />
                            <span>{isAr ? 'الاستوديو' : 'Studio'}</span>
                          </Button>
                        )}

                        <a
                          href={buildCustomerWhatsAppUrl(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bubble-btn bubble-btn-emerald h-10 px-3.5 text-xs font-bold gap-1.5"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: CUSTOMERS CRM                                                */}
        {/* =================================================================== */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            {/* CRM KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    {isAr ? 'إجمالي العملاء المسجلين' : 'Total Unique Customers'}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/25 flex items-center justify-center">
                    <Users className="w-5 h-5 text-cyan-300" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-white font-numeric">
                  {customers.length}
                </p>
              </div>

              <div className="glass-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-pink-200">
                    {isAr ? 'عملاء متكررون (طلبان فأكثر)' : 'Repeat Families (2+ Orders)'}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-400/25 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-pink-300" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-pink-300 font-numeric">
                  {repeatCustomersCount}
                </p>
              </div>

              <div className="glass-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-200">
                    {isAr ? 'إجمالي إنفاق العملاء' : 'Lifetime Customer Spend'}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  </div>
                </div>
                <p className="text-xl font-extrabold text-white font-numeric leading-tight">
                  {formatOrderMoney(stats.totalEgp, 'EGP')}
                  {stats.totalSar > 0 ? (
                    <span className="block text-sm text-emerald-300 mt-0.5">
                      {formatOrderMoney(stats.totalSar, 'SAR')}
                    </span>
                  ) : null}
                  {stats.totalAed > 0 ? (
                    <span className="block text-sm text-cyan-300 mt-0.5">
                      {formatOrderMoney(stats.totalAed, 'AED')}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>

            {/* CRM Search */}
            <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-lg">
                <Search className="w-4 h-4 text-pink-300/80 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={crmSearch}
                  onChange={(e) => setCrmSearch(e.target.value)}
                  placeholder={
                    isAr
                      ? 'ابحث باسم العميل، رقم الهاتف، المدينة، أو اسم الطفل...'
                      : 'Search by customer name, phone, city, or hero name...'
                  }
                  className="ps-10 pe-9 h-11 rounded-2xl bg-slate-950/70 border-white/15 text-white placeholder:text-slate-400 text-sm"
                />
                {crmSearch && (
                  <button
                    type="button"
                    onClick={() => setCrmSearch('')}
                    aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <span className="text-xs text-slate-300/80">
                {isAr ? 'تجميع تلقائي برقم الهاتف الموحّد' : 'Auto-grouped by normalized phone number'}
              </span>
            </div>

            {/* Customer Cards */}
            {filteredCustomers.length === 0 ? (
              <div className="glass-card p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {isAr ? 'لا يوجد عملاء بعد' : 'No Customers Yet'}
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  {isAr
                    ? 'بمجرد تسجيل أي طلب من المتجر أو يدوياً، يُنشأ ملف العميل تلقائياً هنا مع سجل طلباته وأسماء أبطاله.'
                    : 'As soon as orders are placed or added manually, customer profiles are automatically aggregated here.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.key}
                    className="glass-card p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-purple-500/25 border border-cyan-400/30 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-cyan-200" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-white text-base truncate">
                              {customer.customerName}
                            </h3>
                            {customer.totalOrders > 1 && (
                              <Badge className="bg-pink-500/20 text-pink-200 border border-pink-400/35 text-[10px] rounded-full px-2 py-0.5">
                                {isAr ? 'عميل متكرر' : 'Repeat'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                            <span className="inline-flex items-center gap-1 font-numeric" dir="ltr">
                              <Phone className="w-4 h-4 text-emerald-400" />
                              <span>{customer.displayPhone}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <MapPin className="w-4 h-4 text-pink-400" />
                              <span>
                                {isAr
                                  ? getCurrencyMeta(customer.country).countryAr
                                  : getCurrencyMeta(customer.country).countryEn}
                                {customer.city ? ` · ${customer.city}` : ''}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <span className="block text-[11px] text-slate-400">
                          {isAr ? 'آخر طلب' : 'Last Order'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-200 font-numeric">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          <span>{formatDate(customer.lastOrderDate)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="glass-card-inner p-3.5 grid grid-cols-2 gap-3 font-numeric">
                      <div>
                        <span className="block text-[11px] text-slate-400">
                          {isAr ? 'عدد الطلبات' : 'Total Orders'}
                        </span>
                        <span className="text-lg font-extrabold text-white">
                          {customer.totalOrders}
                        </span>
                      </div>
                      <div className="border-s border-white/10 ps-3">
                        <span className="block text-[11px] text-slate-400">
                          {isAr ? 'إجمالي الإنفاق' : 'Total Spent'}
                        </span>
                        <span className="text-sm font-extrabold text-cyan-300">
                          {[
                            customer.totalSpentEgp > 0
                              ? formatOrderMoney(customer.totalSpentEgp, 'EGP')
                              : null,
                            customer.totalSpentSar > 0
                              ? formatOrderMoney(customer.totalSpentSar, 'SAR')
                              : null,
                            customer.totalSpentAed > 0
                              ? formatOrderMoney(customer.totalSpentAed, 'AED')
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' + ') || formatOrderMoney(0, 'EGP')}
                        </span>
                      </div>
                    </div>

                    {/* Heroes List */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-400">
                        {isAr ? 'الأبطال الصغار:' : 'Heroes:'}
                      </span>
                      {customer.heroes.length > 0 ? (
                        customer.heroes.map((hero) => (
                          <span
                            key={`${customer.key}-${hero}`}
                            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-400/25 text-purple-200"
                          >
                            {hero}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={buildDirectCustomerWhatsAppUrl(customer)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bubble-btn bubble-btn-emerald h-10 px-4 text-xs font-bold gap-2 flex-1"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{isAr ? 'تواصل عبر واتساب' : 'WhatsApp Contact'}</span>
                      </a>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleFilterOrdersByCustomer(customer)}
                        className="h-10 px-4 rounded-full border-cyan-400/35 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:text-white text-xs font-semibold gap-2 flex-1"
                      >
                        <Filter className="w-4 h-4" />
                        <span>{isAr ? 'عرض طلبات العميل' : 'View Their Orders'}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* ADD MANUAL ORDER MODAL                                              */}
        {/* =================================================================== */}
        <Dialog open={manualOpen} onOpenChange={setManualOpen}>
          <DialogContent
            dir={isRTL ? 'rtl' : 'ltr'}
            className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0b1024]/95 backdrop-blur-2xl border border-cyan-400/25 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
          >
            <form onSubmit={handleCreateManualOrder} className="space-y-5">
              <DialogHeader className="text-start">
                <DialogTitle className="text-xl font-extrabold font-editorial flex items-center gap-2.5">
                  <Plus className="w-5 h-5 text-cyan-400" />
                  <span>{isAr ? 'إضافة طلب يدوي جديد' : 'Add Manual Order'}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 text-start">
                  {isAr
                    ? 'سجّل الطلبات الواردة عبر واتساب أو الهاتف ليتم توليد كود تتبع فوري وربطها بالاستوديو وسجل العملاء.'
                    : 'Record WhatsApp or phone orders to generate an instant tracking code synced with Studio & CRM.'}
                </DialogDescription>
              </DialogHeader>

              {/* Customer Details */}
              <div className="glass-card-inner p-4 space-y-3">
                <h4 className="text-xs font-bold text-cyan-300">
                  {isAr ? 'بيانات العميل والشحن' : 'Customer & Delivery Details'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-200">
                      {isAr ? 'اسم العميل *' : 'Customer Name *'}
                    </label>
                    <Input
                      required
                      value={manualForm.customerName}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, customerName: e.target.value })
                      }
                      placeholder={isAr ? 'مثال: سارة محمود' : 'e.g. Sarah Ahmed'}
                      className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-200">
                      {isAr ? 'رقم الهاتف / واتساب *' : 'Phone / WhatsApp *'}
                    </label>
                    <Input
                      required
                      dir="ltr"
                      value={manualForm.phone}
                      onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                      placeholder={
                        manualForm.country === 'EG'
                          ? '01012345678'
                          : manualForm.country === 'AE'
                            ? '0501234567'
                            : '0551234567'
                      }
                      className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10 font-numeric"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-200">
                      {isAr ? 'الدولة' : 'Country'}
                    </label>
                    <select
                      value={manualForm.country}
                      onChange={(e) =>
                        updateManualPricing(
                          manualForm.storyId,
                          e.target.value as CurrencyCountry,
                          manualForm.formatKey
                        )
                      }
                      className="w-full h-10 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white px-3 cursor-pointer"
                    >
                      <option value="EG">{isAr ? 'مصر (جنيه مصري)' : 'Egypt (EGP)'}</option>
                      <option value="SA">
                        {isAr ? 'السعودية (ريال سعودي)' : 'Saudi Arabia (SAR)'}
                      </option>
                      <option value="AE">
                        {isAr ? 'الإمارات (درهم إماراتي)' : 'UAE (AED)'}
                      </option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-200">
                      {isAr ? 'المدينة / المحافظة' : 'City'}
                    </label>
                    <Input
                      value={manualForm.city}
                      onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                      placeholder={isAr ? 'القاهرة / الرياض / دبي' : 'Cairo / Riyadh / Dubai'}
                      className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs text-slate-200">
                      {isAr ? 'العنوان التفصيلي' : 'Address'}
                    </label>
                    <Input
                      value={manualForm.address}
                      onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                      placeholder={
                        isAr ? 'الحي، الشارع، رقم العمارة...' : 'District, street, building...'
                      }
                      className="bg-slate-950/80 border-white/15 text-white text-xs rounded-xl h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Story & Hero Details */}
              <div className="glass-card-inner p-4 space-y-3">
                <h4 className="text-xs font-bold text-purple-300">
                  {isAr ? 'تفاصيل القصة والطفل البطل' : 'Story & Hero Details'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs text-slate-200">
                      {isAr ? 'اختيار القصة من الكتالوج أو قصة مخصصة' : 'Select Story or Custom'}
                    </label>
                    <select
                      value={manualForm.storyId}
                      onChange={(e) =>
                        updateManualPricing(
                          e.target.value,
                          manualForm.country,
                          manualForm.formatKey
                        )
                      }
                      className="w-full h-10 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white px-3 cursor-pointer"
                    >
                      {catalogStories.map((story) => (
                        <option key={story.id} value={story.id}>
                          {isAr ? story.titleAr : story.titleEn}
                        </option>
                      ))}
                      <option value="custom">
                        {isAr ? 'قصة مخصصة من الصفر' : 'Custom Story from Scratch'}
                      </option>
                    </select>
                  </div>

                  {manualForm.storyId === 'custom' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-200">
                          {isAr ? 'عنوان القصة بالعربية' : 'Custom Arabic Title'}
                        </label>
                        <Input
                          dir="rtl"
                          value={manualForm.customTitleAr}
                          onChange={(e) =>
                            setManualForm({ ...manualForm, customTitleAr: e.target.value })
                          }
                          className="bg-slate-950/80 border-white/15 text-white text-xs rounded-xl h-10"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-200">
                          {isAr ? 'عنوان القصة بالإنجليزية' : 'Custom English Title'}
                        </label>
                        <Input
                          dir="ltr"
                          value={manualForm.customTitleEn}
                          onChange={(e) =>
                            setManualForm({ ...manualForm, customTitleEn: e.target.value })
                          }
                          className="bg-slate-950/80 border-white/15 text-white text-xs rounded-xl h-10"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-slate-200">
                      {isAr ? 'اسم الطفل البطل *' : 'Child Hero Name *'}
                    </label>
                    <Input
                      required
                      value={manualForm.childName}
                      onChange={(e) => setManualForm({ ...manualForm, childName: e.target.value })}
                      placeholder={isAr ? 'مثال: آدم' : 'e.g. Adam'}
                      className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-200">
                        {isAr ? 'العمر' : 'Age'}
                      </label>
                      <Input
                        value={manualForm.childAge}
                        onChange={(e) => setManualForm({ ...manualForm, childAge: e.target.value })}
                        className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10 font-numeric"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-200">
                        {isAr ? 'النوع' : 'Gender'}
                      </label>
                      <select
                        value={manualForm.childGender}
                        onChange={(e) =>
                          setManualForm({
                            ...manualForm,
                            childGender: e.target.value as 'boy' | 'girl',
                          })
                        }
                        className="w-full h-10 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white px-3 cursor-pointer"
                      >
                        <option value="boy">{isAr ? 'ولد' : 'Boy'}</option>
                        <option value="girl">{isAr ? 'بنت' : 'Girl'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-200">
                      {isAr ? 'الإصدار / عدد الصفحات' : 'Book Format'}
                    </label>
                    <select
                      value={manualForm.formatKey}
                      onChange={(e) =>
                        updateManualPricing(
                          manualForm.storyId,
                          manualForm.country,
                          e.target.value as ManualFormatKey
                        )
                      }
                      className="w-full h-10 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white px-3 cursor-pointer"
                    >
                      <option value="15p">
                        {isAr ? 'كتاب مطبوع فاخر — 15 صفحة' : 'Hardcover Book — 15 Pages'}
                      </option>
                      <option value="25p">
                        {isAr ? 'كتاب مطبوع فاخر — 25 صفحة' : 'Hardcover Book — 25 Pages'}
                      </option>
                      <option value="pdf">
                        {isAr ? 'نسخة رقمية عالية الدقة' : 'Digital PDF Edition'}
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-200">
                      {isAr ? 'لغة القصة' : 'Story Language'}
                    </label>
                    <select
                      value={manualForm.storyLanguage}
                      onChange={(e) =>
                        setManualForm({
                          ...manualForm,
                          storyLanguage: e.target.value as 'ar' | 'en' | 'bilingual',
                        })
                      }
                      className="w-full h-10 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white px-3 cursor-pointer"
                    >
                      <option value="ar">{isAr ? 'العربية' : 'Arabic'}</option>
                      <option value="en">{isAr ? 'الإنجليزية' : 'English'}</option>
                      <option value="bilingual">{isAr ? 'ثنائية اللغة' : 'Bilingual'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing, Status & Notes */}
              <div className="glass-card-inner p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-numeric">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-200">
                      {isAr
                        ? `السعر الإجمالي (${manualCurrencyLabel})`
                        : `Total Price (${manualCurrencyLabel})`}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      required
                      value={manualForm.price}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const pct = storeConfig.depositPercentage || 50;
                        const nextDep =
                          manualForm.formatKey === 'pdf'
                            ? val
                            : Math.round(val * (pct / 100));
                        setManualForm({
                          ...manualForm,
                          price: e.target.value,
                          depositAmount: String(nextDep),
                        });
                      }}
                      className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10 font-numeric"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-200">
                      {isAr
                        ? `العربون (${manualCurrencyLabel})`
                        : `Deposit (${manualCurrencyLabel})`}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={manualForm.depositAmount}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, depositAmount: e.target.value })
                      }
                      className="bg-slate-950/80 border-white/15 text-white text-sm rounded-xl h-10 font-numeric"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-200">
                      {isAr ? 'الحالة المبدئية' : 'Initial Status'}
                    </label>
                    <select
                      value={manualForm.status}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, status: e.target.value as OrderStatus })
                      }
                      className="w-full h-10 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white px-3 cursor-pointer"
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {isAr ? STATUS_META[st].labelAr : STATUS_META[st].labelEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-200">
                    {isAr ? 'ملاحظات إضافية (اختياري)' : 'Order Notes (Optional)'}
                  </label>
                  <Textarea
                    rows={2}
                    value={manualForm.notes}
                    onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                    placeholder={
                      isAr
                        ? 'تفاصيل التوصيل، رسالة إهداء، أو تفضيلات الأم...'
                        : 'Delivery notes, gift dedication, or parent preferences...'
                    }
                    className="bg-slate-950/80 border-white/15 text-white text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setManualOpen(false)}
                  className="h-10 px-5 rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 text-xs"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  className="bubble-btn bubble-btn-primary h-10 px-6 text-xs font-bold gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'إنشاء الطلب وتوليد كود التتبع' : 'Create Order & Tracking Code'}</span>
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* =================================================================== */}
        {/* ORDER DETAIL, PHOTO VAULT & PRINTABLE INVOICE MODAL                 */}
        {/* =================================================================== */}
        <Dialog
          open={!!selectedOrder}
          onOpenChange={(open) => {
            if (!open) setSelectedOrder(null);
          }}
        >
          <DialogContent
            dir={isRTL ? 'rtl' : 'ltr'}
            className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0b1024]/95 backdrop-blur-2xl border border-cyan-400/25 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
          >
            {selectedOrder && (() => {
              const selectedIsMerchOnly = isMerchOnlyOrder(selectedOrder);
              const selectedHasMerchOrGwp = selectedOrder.items.some(
                (i) => isMerchItem(i) || isGwpItem(i)
              );
              const selectedDiscount =
                selectedOrder.discountAmount && selectedOrder.discountAmount > 0
                  ? selectedOrder.discountAmount
                  : 0;
              const selectedRemaining = Math.max(
                0,
                selectedOrder.totalAmount - selectedOrder.depositAmount
              );

              return (
              <>
                <DialogHeader className="text-start pr-10">
                  <DialogTitle className="text-xl font-extrabold flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-numeric text-cyan-300" dir="ltr">
                      {selectedOrder.reference}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyRef(selectedOrder.reference)}
                      className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      aria-label={isAr ? 'نسخ رقم الطلب' : 'Copy reference'}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <Badge
                      className={`border text-xs rounded-full px-2.5 py-0.5 ${STATUS_META[selectedOrder.status].colorClass}`}
                    >
                      {isAr
                        ? STATUS_META[selectedOrder.status].labelAr
                        : STATUS_META[selectedOrder.status].labelEn}
                    </Badge>
                    {!selectedIsMerchOnly && studioDraftSummaries[selectedOrder.id] && (
                      <Badge className="bg-purple-500/15 text-purple-200 border border-purple-400/35 text-xs rounded-full px-2.5 py-0.5 font-numeric inline-flex items-center gap-1.5">
                        <Wand2 className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                        <span>
                          {isAr
                            ? `مسودة: ${studioDraftSummaries[selectedOrder.id].artCount}/${studioDraftSummaries[selectedOrder.id].totalPages} لوحة • ${studioDraftSummaries[selectedOrder.id].completedSteps}/${studioDraftSummaries[selectedOrder.id].totalSteps} خطوات`
                            : `Draft: ${studioDraftSummaries[selectedOrder.id].artCount}/${studioDraftSummaries[selectedOrder.id].totalPages} art • ${studioDraftSummaries[selectedOrder.id].completedSteps}/${studioDraftSummaries[selectedOrder.id].totalSteps} steps`}
                        </span>
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs text-start font-numeric">
                    {isAr ? 'تاريخ الطلب:' : 'Placed on'}{' '}
                    {formatDateTime(selectedOrder.createdAt)} ·{' '}
                    {getOrderSourceLabel(selectedOrder.source, isAr)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                  {/* Gift Order & Hide-Price Fulfillment Alert Banner */}
                  {(selectedOrder.isGiftOrder ||
                    selectedOrder.giftHidePrice ||
                    selectedOrder.giftRecipientName) && (
                    <div
                      role="status"
                      className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
                        selectedOrder.giftHidePrice
                          ? 'bg-pink-500/15 border-pink-400/45 text-pink-100 shadow-[0_0_24px_rgba(236,72,153,0.16)]'
                          : 'bg-purple-500/15 border-purple-400/35 text-purple-100'
                      }`}
                    >
                      <Gift className="w-5 h-5 text-pink-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-sm text-white">
                            {selectedOrder.giftHidePrice
                              ? isAr
                                ? '🎁 تنبيه تغليف هدية — إخفاء الأسعار مفعّل!'
                                : '🎁 Gift Packing Alert — Hide Prices Enabled!'
                              : isAr
                                ? '🎁 طلب هدية خاص'
                                : '🎁 Special Gift Order'}
                          </strong>
                          {selectedOrder.giftHidePrice && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/45 text-amber-200 text-[11px] font-bold">
                              {isAr ? 'بدون أسعار داخل الصندوق' : 'NO PRICES IN BOX'}
                            </span>
                          )}
                        </div>
                        {selectedOrder.giftRecipientName && (
                          <p className="text-pink-100">
                            <span className="text-pink-300/90">
                              {isAr ? 'اسم المُهدى إليه: ' : 'Gift Recipient: '}
                            </span>
                            <strong className="text-white">{selectedOrder.giftRecipientName}</strong>
                          </p>
                        )}
                        {selectedOrder.giftHidePrice && (
                          <p className="text-[11px] text-pink-200/90">
                            {isAr
                              ? 'استخدم زر «طباعة إيصال هدية (بدون أسعار)» لإخفاء جميع الأسعار والإجماليات تلقائياً عن المُهدى إليه.'
                              : 'Use “Print Gift Packing Slip (No Prices)” below — all unit prices, totals, deposits & balances will be omitted.'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customer Info Grid */}
                  <div className="glass-card-inner p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-300 shrink-0" />
                      <span className="text-slate-400">{isAr ? 'العميل:' : 'Customer:'}</span>
                      <strong className="text-white">{selectedOrder.customerName}</strong>
                    </div>
                    <div className="flex items-center gap-2 font-numeric">
                      <Phone className="w-4 h-4 text-emerald-300 shrink-0" />
                      <span className="text-slate-400">{isAr ? 'واتساب:' : 'WhatsApp:'}</span>
                      <strong className="text-white" dir="ltr">
                        {selectedOrder.phone}
                      </strong>
                    </div>
                    {selectedOrder.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-cyan-300 shrink-0" />
                        <span className="text-slate-400">{isAr ? 'البريد:' : 'Email:'}</span>
                        <span className="text-slate-200" dir="ltr">
                          {selectedOrder.email}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-pink-300 shrink-0" />
                      <span className="text-slate-400">{isAr ? 'العنوان:' : 'Location:'}</span>
                      <span className="text-slate-200">
                        {isAr
                          ? getCurrencyMeta(selectedOrder.country).countryAr
                          : getCurrencyMeta(selectedOrder.country).countryEn}
                        {selectedOrder.city ? ` · ${selectedOrder.city}` : ''}
                        {selectedOrder.address ? ` — ${selectedOrder.address}` : ''}
                      </span>
                    </div>
                    {selectedOrder.orderNotes && (
                      <div className="sm:col-span-2 pt-2 border-t border-white/10 text-slate-200">
                        <strong className="text-amber-300">
                          {isAr ? 'ملاحظات الطلب: ' : 'Notes: '}
                        </strong>
                        {selectedOrder.orderNotes}
                      </div>
                    )}
                  </div>

                  {/* Financial Summary + Promo/Discount */}
                  <div className="glass-card-inner p-4 space-y-3 font-numeric">
                    {(selectedOrder.promoCode || selectedDiscount > 0) && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10 text-xs">
                        <div className="inline-flex items-center gap-2">
                          <Tag className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
                          <span className="text-slate-300">
                            {selectedOrder.promoCode
                              ? isAr
                                ? 'كود الخصم المستخدم:'
                                : 'Promo Code Applied:'
                              : isAr
                                ? 'خصم الباقة / التوفير'
                                : 'Bundle / Volume Discount'}
                          </span>
                          {selectedOrder.promoCode && (
                            <span
                              dir="ltr"
                              className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-200 font-bold"
                            >
                              {selectedOrder.promoCode}
                            </span>
                          )}
                        </div>
                        {selectedDiscount > 0 && (
                          <span className="text-emerald-300 font-bold">
                            {isAr ? 'قيمة الخصم: -' : 'Discount: -'}
                            {formatOrderMoney(
                              selectedDiscount,
                              selectedOrder.currency,
                              selectedOrder.country
                            )}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <span className="block text-[11px] text-slate-400">
                          {isAr ? 'الإجمالي' : 'Total'}
                        </span>
                        <span className="text-base font-extrabold text-white">
                          {formatOrderMoney(
                            selectedOrder.totalAmount,
                            selectedOrder.currency,
                            selectedOrder.country
                          )}
                        </span>
                      </div>
                      <div className="border-x border-white/10">
                        <span className="block text-[11px] text-slate-400">
                          {isAr ? 'العربون' : 'Deposit'}
                        </span>
                        <span className="text-base font-extrabold text-cyan-300">
                          {formatOrderMoney(
                            selectedOrder.depositAmount,
                            selectedOrder.currency,
                            selectedOrder.country
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-slate-400">
                          {isAr ? 'المتبقي' : 'Remaining'}
                        </span>
                        <span className="text-base font-extrabold text-pink-300">
                          {formatOrderMoney(
                            selectedRemaining,
                            selectedOrder.currency,
                            selectedOrder.country
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Status Control */}
                  <div className="glass-card-inner p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">
                        {isAr ? 'تحديث حالة التتبع المباشر' : 'Update Live Tracking Status'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-numeric">
                        {isAr
                          ? `يظهر التحديث فوراً للعميل في صفحة تتبع الطلب (${selectedOrder.reference})`
                          : `Immediately visible on /track?ref=${selectedOrder.reference}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <select
                        aria-label={isAr ? 'حالة الطلب' : 'Order status'}
                        value={selectedOrder.status}
                        onChange={(e) =>
                          handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)
                        }
                        className="h-10 rounded-xl bg-slate-950/90 border border-cyan-400/40 text-xs text-white px-3 cursor-pointer"
                      >
                        {ALL_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {isAr ? STATUS_META[st].labelAr : STATUS_META[st].labelEn}
                          </option>
                        ))}
                      </select>
                      <a
                        href={`/track?ref=${encodeURIComponent(selectedOrder.reference)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 hover:underline px-2"
                      >
                        <span>{isAr ? 'معاينة التتبع' : 'Preview Track'}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Ordered Items (Books, Brand Merch & Free Bub GWP) */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-100">
                      {selectedIsMerchOnly
                        ? isAr
                          ? `منتجات البراند والهدايا (${selectedOrder.items.length})`
                          : `Ordered Brand Merch & Gifts (${selectedOrder.items.length})`
                        : selectedHasMerchOrGwp
                          ? isAr
                            ? `القصص، منتجات البراند وصور الأطفال (${selectedOrder.items.length})`
                            : `Storybooks, Brand Merch & Child Photos (${selectedOrder.items.length})`
                          : isAr
                            ? `القصص المطلوبة وصور الأطفال (${selectedOrder.items.length})`
                            : `Ordered Storybooks & Child Reference Photos (${selectedOrder.items.length})`}
                    </h4>
                    {selectedOrder.items.map((item, idx) => {
                      const gwp = isGwpItem(item);
                      const merch = isMerchItem(item);
                      const vaultPhoto = item.photoVaultId
                        ? photoMap[item.photoVaultId]
                        : undefined;
                      const itemTitle = isAr
                        ? item.titleAr || item.titleEn
                        : item.titleEn || item.titleAr;
                      const itemFormat = isAr ? item.formatLabelAr : item.formatLabelEn;
                      const variantLabel = isAr
                        ? item.variantLabelAr || item.formatLabelAr
                        : item.variantLabelEn || item.formatLabelEn;
                      const addonSummaries = summarizeOrderItemAddons(item, language);
                      const retailVal = getItemRetailValue(item, selectedOrder.country);

                      if (gwp) {
                        return (
                          <div
                            key={`${selectedOrder.id}-detail-${idx}`}
                            className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-400/40 shadow-[0_0_24px_rgba(16,185,129,0.12)] flex flex-col sm:flex-row gap-4"
                          >
                            <div className="w-24 shrink-0">
                              <img
                                src={item.coverImage || '/merch/bub-plush-ball.jpg'}
                                alt={itemTitle}
                                loading="lazy"
                                decoding="async"
                                className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-400/50"
                              />
                            </div>
                            <div className="flex-1 space-y-2 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h5 className="text-sm font-bold text-white">{itemTitle}</h5>
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/55 text-emerald-200 text-[11px] font-extrabold shadow-[0_0_16px_rgba(16,185,129,0.28)]">
                                      {isAr
                                        ? '🎁 هدية مجانية (GWP) • 0'
                                        : '🎁 Free Gift (GWP) • 0'}
                                    </span>
                                  </div>
                                  <p className="text-emerald-200/90 font-semibold font-numeric">
                                    {variantLabel} · {isAr ? 'الكمية:' : 'Qty:'} {item.quantity}
                                    {retailVal > 0 && (
                                      <span className="text-slate-300 font-normal">
                                        {' · '}
                                        {isAr ? 'القيمة الأصلية:' : 'Retail Value:'}{' '}
                                        {formatOrderMoney(
                                          retailVal,
                                          selectedOrder.currency,
                                          selectedOrder.country
                                        )}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 text-[11px]">
                                {item.sku && (
                                  <span
                                    dir="ltr"
                                    className="px-2.5 py-1 rounded-full bg-slate-950/75 border border-emerald-400/30 text-emerald-200 font-mono"
                                  >
                                    SKU: {item.sku}
                                  </span>
                                )}
                                {addonSummaries.map((badge) => (
                                  <span
                                    key={`${idx}-gwp-addon-${badge}`}
                                    className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200"
                                  >
                                    {badge}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (merch) {
                        const unitPrice = getItemUnitPrice(item, selectedOrder.country);
                        return (
                          <div
                            key={`${selectedOrder.id}-detail-${idx}`}
                            className="glass-card-inner p-4 flex flex-col sm:flex-row gap-4 border border-fuchsia-400/25"
                          >
                            <div className="w-24 shrink-0">
                              <img
                                src={item.coverImage || '/merch/bub-plush-ball.jpg'}
                                alt={itemTitle}
                                loading="lazy"
                                decoding="async"
                                className="w-24 h-24 rounded-2xl object-cover border-2 border-fuchsia-400/40"
                              />
                            </div>
                            <div className="flex-1 space-y-2 text-xs">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h5 className="text-sm font-bold text-white">{itemTitle}</h5>
                                    <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 text-[11px] font-bold">
                                      {isAr ? 'منتج براند / Merch' : 'Brand Merch'}
                                    </span>
                                  </div>
                                  <p className="text-cyan-300 font-semibold font-numeric">
                                    {variantLabel} · {isAr ? 'الكمية:' : 'Qty:'} {item.quantity} ·{' '}
                                    {formatOrderMoney(
                                      unitPrice * (item.quantity || 1),
                                      selectedOrder.currency,
                                      selectedOrder.country
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 text-[11px]">
                                {item.sku && (
                                  <span
                                    dir="ltr"
                                    className="px-2.5 py-1 rounded-full bg-slate-950/75 border border-white/15 text-slate-200 font-mono"
                                  >
                                    SKU: {item.sku}
                                  </span>
                                )}
                                {addonSummaries.map((badge) => (
                                  <span
                                    key={`${idx}-merch-addon-${badge}`}
                                    className="px-2.5 py-1 rounded-full bg-pink-500/15 border border-pink-400/35 text-pink-200 font-semibold"
                                  >
                                    {badge}
                                  </span>
                                ))}
                              </div>
                              {item.giftMessage && (
                                <p className="p-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-slate-200 text-[11px]">
                                  <strong className="text-pink-300">
                                    {isAr ? 'ملاحظة الهدية: ' : 'Gift Note: '}
                                  </strong>
                                  {item.giftMessage}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }

                      const genderLabel =
                        item.childGender === 'boy'
                          ? isAr
                            ? 'ولد'
                            : 'Boy'
                          : isAr
                            ? 'بنت'
                            : 'Girl';
                      const storyLangLabel =
                        item.storyLanguage === 'ar'
                          ? isAr
                            ? 'العربية'
                            : 'Arabic'
                          : item.storyLanguage === 'en'
                            ? isAr
                              ? 'الإنجليزية'
                              : 'English'
                            : isAr
                              ? 'ثنائية اللغة'
                              : 'Bilingual';

                      const itemWaHelpers = buildWhatsAppHelperMessages({
                        customerName: selectedOrder.customerName,
                        childName: item.childName,
                        reference: selectedOrder.reference,
                        trackingUrl: `${window.location.origin}/track?ref=${encodeURIComponent(
                          selectedOrder.reference
                        )}`,
                        phone: selectedOrder.phone,
                        country: selectedOrder.country,
                      });

                      return (
                        <div
                          key={`${selectedOrder.id}-detail-${idx}`}
                          className="glass-card-inner p-4 flex flex-col sm:flex-row gap-4"
                        >
                          {/* Child Reference Photo */}
                          <div className="w-28 shrink-0 space-y-2">
                            {vaultPhoto ? (
                              <>
                                <img
                                  src={vaultPhoto}
                                  alt={item.childName}
                                  className="w-28 h-28 rounded-2xl object-cover border-2 border-cyan-400/50"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() =>
                                    handleDownloadPhoto(item.photoVaultId!, item.childName)
                                  }
                                  className="w-full h-9 rounded-xl text-xs bg-cyan-600 hover:bg-cyan-500 text-white gap-1.5"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>{isAr ? 'تنزيل' : 'Download'}</span>
                                </Button>
                              </>
                            ) : (
                              <div className="w-28 h-28 rounded-2xl bg-slate-950/80 border border-dashed border-white/15 flex flex-col items-center justify-center text-center p-2 text-slate-400 text-[11px] gap-1">
                                <ImageIcon className="w-5 h-5" />
                                <span>{isAr ? 'لا توجد صورة' : 'No photo uploaded'}</span>
                              </div>
                            )}
                          </div>

                          {/* Book Item Specs & ALL 5 Add-ons */}
                          <div className="flex-1 space-y-2 text-xs">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="space-y-1">
                                <h5 className="text-sm font-bold text-white">{itemTitle}</h5>
                                <p className="text-cyan-300 font-semibold font-numeric">
                                  {itemFormat} · {item.pagesCount} {isAr ? 'صفحة' : 'pages'} ·{' '}
                                  {isAr ? 'الكمية:' : 'Qty:'} {item.quantity}
                                </p>
                              </div>
                              <a
                                href={
                                  isAr
                                    ? itemWaHelpers.requestClearerPhoto.urlAr
                                    : itemWaHelpers.requestClearerPhoto.urlEn
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/35 text-amber-200 hover:text-amber-100 text-xs font-semibold transition-colors shrink-0"
                              >
                                <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span>
                                  {isAr
                                    ? 'طلب صورة أوضح عبر واتساب'
                                    : 'Request Clearer Photo on WhatsApp'}
                                </span>
                              </a>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[11px]">
                              <span className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/25 text-purple-200 font-numeric">
                                {isAr ? 'البطل:' : 'Hero:'} {item.childName} ({genderLabel}
                                {isAr ? '، ' : ', '}
                                {item.childAge} {isAr ? 'سنوات' : 'yrs'})
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200">
                                {isAr ? 'لغة القصة:' : 'Story Language:'} {storyLangLabel}
                              </span>
                              {addonSummaries.map((addonLabel) => (
                                <span
                                  key={`${idx}-book-addon-${addonLabel}`}
                                  className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 font-medium"
                                >
                                  + {addonLabel}
                                </span>
                              ))}
                            </div>
                            {item.giftMessage && (
                              <p className="p-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-slate-200 text-[11px]">
                                <strong className="text-pink-300">
                                  {isAr ? 'الإهداء / التفاصيل: ' : 'Dedication / Brief: '}
                                </strong>
                                {item.giftMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Footer */}
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    {/* Primary Production / Packing & WhatsApp Accelerators */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={buildCustomerWhatsAppUrl(selectedOrder)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bubble-btn bubble-btn-emerald h-10 px-4 text-xs font-bold gap-1.5"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>{isAr ? 'إرسال تحديث واتساب' : 'Send WhatsApp Update'}</span>
                        </a>

                        {!selectedIsMerchOnly && selectedOrderWaHelpers && (
                          <a
                            href={
                              isAr
                                ? selectedOrderWaHelpers.sendDraftForApproval.urlAr
                                : selectedOrderWaHelpers.sendDraftForApproval.urlEn
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 hover:text-white text-xs font-bold transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>
                              {isAr
                                ? 'إرسال المسودة للاعتماد عبر واتساب'
                                : 'Send Draft Approval on WhatsApp'}
                            </span>
                          </a>
                        )}
                      </div>

                      {selectedIsMerchOnly ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {selectedOrder.status !== 'sent_to_print' &&
                            selectedOrder.status !== 'delivered' &&
                            selectedOrder.status !== 'cancelled' && (
                              <Button
                                type="button"
                                onClick={() => handleStatusChange(selectedOrder.id, 'sent_to_print')}
                                className="bubble-btn bubble-btn-secondary h-10 px-4 text-xs font-bold gap-1.5"
                              >
                                <Package className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span>{isAr ? 'تم التغليف وجاهز للشحن' : 'Mark Packed & Shipped'}</span>
                              </Button>
                            )}
                          {selectedOrder.status !== 'delivered' &&
                            selectedOrder.status !== 'cancelled' && (
                              <Button
                                type="button"
                                onClick={() => handleStatusChange(selectedOrder.id, 'delivered')}
                                className="bubble-btn bubble-btn-primary h-10 px-4 text-xs font-bold gap-1.5"
                              >
                                <Truck className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span>{isAr ? 'تأكيد التوصيل' : 'Mark Delivered'}</span>
                              </Button>
                            )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            onClick={() => {
                              const targetId = selectedOrder.id;
                              setSelectedOrder(null);
                              navigate(`/admin/studio?orderId=${targetId}`);
                            }}
                            className="bubble-btn bubble-btn-primary h-10 px-4 text-xs font-bold gap-1.5"
                          >
                            <Wand2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{isAr ? 'فتح في استوديو القصص' : 'Open in Story Studio'}</span>
                          </Button>

                          <Button
                            type="button"
                            onClick={() => {
                              const targetId = selectedOrder.id;
                              setSelectedOrder(null);
                              navigate(`/admin/pdf-builder?orderId=${targetId}`);
                            }}
                            className="bubble-btn bubble-btn-secondary h-10 px-4 text-xs font-bold gap-1.5"
                          >
                            <BookCopy className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span className="font-numeric">
                              {isAr
                                ? 'تصدير كتاب KDP 8.5×8.5'
                                : 'Open in KDP 8.5×8.5 PDF Builder'}
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Utility Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOrderToDelete(selectedOrder)}
                        className="h-10 px-4 rounded-full text-red-300 hover:text-red-200 hover:bg-red-500/15 border border-red-500/25 text-xs font-semibold gap-1.5"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{isAr ? 'حذف الطلب' : 'Delete Order'}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handlePrintInvoice(selectedOrder)}
                        className={`h-10 px-4 rounded-full text-xs font-semibold gap-1.5 ${
                          selectedOrder.giftHidePrice
                            ? 'border-pink-400/50 bg-pink-500/15 text-pink-100 hover:bg-pink-500/25 hover:text-white'
                            : 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:text-white'
                        }`}
                      >
                        <Printer className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>
                          {selectedOrder.giftHidePrice
                            ? isAr
                              ? 'طباعة إيصال هدية (بدون أسعار)'
                              : 'Print Gift Packing Slip (No Prices)'
                            : selectedIsMerchOnly
                              ? isAr
                                ? 'طباعة إيصال التغليف / الفاتورة'
                                : 'Print Packing Slip / Invoice'
                              : isAr
                                ? 'طباعة الفاتورة'
                                : 'Print Invoice'}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* =================================================================== */}
        {/* CONFIRM DELETE ORDER MODAL                                          */}
        {/* =================================================================== */}
        <Dialog
          open={!!orderToDelete}
          onOpenChange={(open) => {
            if (!open) setOrderToDelete(null);
          }}
        >
          <DialogContent
            dir={isRTL ? 'rtl' : 'ltr'}
            className="max-w-md rounded-3xl bg-[#0b1024]/95 backdrop-blur-2xl border border-red-500/30 text-white"
          >
            {orderToDelete && (
              <div className="space-y-4">
                <DialogHeader className="text-start">
                  <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-300">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{isAr ? 'تأكيد حذف الطلب' : 'Confirm Order Deletion'}</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-300 text-start pt-1">
                    {isAr
                      ? `هل أنت متأكد من حذف الطلب ${orderToDelete.reference} الخاص بالعميل "${orderToDelete.customerName}"؟ لا يمكن التراجع عن هذا الإجراء.`
                      : `Are you sure you want to permanently delete order ${orderToDelete.reference} for "${orderToDelete.customerName}"? This cannot be undone.`}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOrderToDelete(null)}
                    className="rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 text-xs"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmDeleteOrder}
                    className="rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold gap-1.5 px-5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isAr ? 'نعم، حذف الطلب' : 'Yes, Delete Order'}</span>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
