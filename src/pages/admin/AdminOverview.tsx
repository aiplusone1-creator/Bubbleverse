import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  BookOpen,
  Clock,
  Wand2,
  Sparkles,
  Settings,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Plug,
  Cpu,
  CreditCard,
  Webhook,
  BarChart3,
  Truck,
  PlusCircle,
  Tag,
  Building2,
  Cake,
  Gift,
  Package,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import {
  getB2BLeads,
  getBirthdayClubLeads,
  getCatalogStories,
  getGwpConfig,
  getIntegrationsConfig,
  getMerchCatalog,
  getOrders,
  getPromoCodes,
  listStudioDrafts,
  type OrderStatus,
} from '@/lib/localStore';
import {
  normalizeCurrencyCode,
  type CurrencyCode,
  type CurrencyCountry,
} from '@/features/commerce/pricingEngine';

interface DailyChartDatum {
  dateKey: string;
  label: string;
  fullDate: string;
  orders: number;
  revenueEgp: number;
  revenueSar: number;
  revenueAed: number;
}

interface StatusChartDatum {
  status: OrderStatus;
  label: string;
  shortLabel: string;
  count: number;
  color: string;
}

interface CustomTooltipPayloadItem<T> {
  payload?: T;
}

interface CustomTooltipProps<T> {
  active?: boolean;
  payload?: CustomTooltipPayloadItem<T>[];
}

const PIPELINE_STAGES: {
  status: OrderStatus;
  labelAr: string;
  labelEn: string;
  shortAr: string;
  shortEn: string;
  color: string;
  badgeClass: string;
}[] = [
  {
    status: 'pending_deposit',
    labelAr: 'بانتظار العربون',
    labelEn: 'Pending Deposit',
    shortAr: 'عربون',
    shortEn: 'Deposit',
    color: '#F59E0B',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-400/35',
  },
  {
    status: 'deposit_confirmed',
    labelAr: 'تم تأكيد العربون',
    labelEn: 'Deposit Confirmed',
    shortAr: 'مؤكد',
    shortEn: 'Confirmed',
    color: '#00D9FF',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/35',
  },
  {
    status: 'in_preparation',
    labelAr: 'قيد التجهيز',
    labelEn: 'In Preparation',
    shortAr: 'تجهيز',
    shortEn: 'Prep',
    color: '#A78BFA',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-400/35',
  },
  {
    status: 'draft_ready',
    labelAr: 'المسودة جاهزة',
    labelEn: 'Draft Ready',
    shortAr: 'مسودة',
    shortEn: 'Draft',
    color: '#F472B6',
    badgeClass: 'bg-pink-500/15 text-pink-300 border-pink-400/35',
  },
  {
    status: 'sent_to_print',
    labelAr: 'في المطبعة',
    labelEn: 'Sent to Print',
    shortAr: 'طباعة',
    shortEn: 'Print',
    color: '#60A5FA',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-400/35',
  },
  {
    status: 'delivered',
    labelAr: 'تم التسليم',
    labelEn: 'Delivered',
    shortAr: 'تسليم',
    shortEn: 'Delivered',
    color: '#34D399',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35',
  },
];

function getStatusMeta(status: OrderStatus, isRTL: boolean) {
  if (status === 'cancelled') {
    return {
      label: isRTL ? 'ملغي' : 'Cancelled',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-400/35',
    };
  }
  const stage = PIPELINE_STAGES.find((s) => s.status === status);
  if (!stage) {
    return {
      label: isRTL ? 'قيد المتابعة' : 'Active',
      badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/35',
    };
  }
  return {
    label: isRTL ? stage.labelAr : stage.labelEn,
    badgeClass: stage.badgeClass,
  };
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function formatCurrency(amount: number, country: CurrencyCountry, isRTL: boolean): string {
  const num = formatNumber(Math.round(amount));
  if (country === 'EG') {
    return isRTL ? `${num} ج.م` : `${num} EGP`;
  }
  if (country === 'AE') {
    return isRTL ? `${num} د.إ` : `${num} AED`;
  }
  return isRTL ? `${num} ر.س` : `${num} SAR`;
}

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const SALES_CURRENCIES: {
  code: CurrencyCode;
  dataKey: 'revenueEgp' | 'revenueSar' | 'revenueAed';
  country: CurrencyCountry;
  labelAr: string;
  labelEn: string;
  stroke: string;
  gradientId: string;
  activeClass: string;
}[] = [
  {
    code: 'EGP',
    dataKey: 'revenueEgp',
    country: 'EG',
    labelAr: 'ج.م (EGP)',
    labelEn: 'EGP',
    stroke: '#34D399',
    gradientId: 'bvSalesEgpFill',
    activeClass: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/45',
  },
  {
    code: 'SAR',
    dataKey: 'revenueSar',
    country: 'SA',
    labelAr: 'ر.س (SAR)',
    labelEn: 'SAR',
    stroke: '#A78BFA',
    gradientId: 'bvSalesSarFill',
    activeClass: 'bg-purple-500/25 text-purple-200 border-purple-400/45',
  },
  {
    code: 'AED',
    dataKey: 'revenueAed',
    country: 'AE',
    labelAr: 'د.إ (AED)',
    labelEn: 'AED',
    stroke: '#F472B6',
    gradientId: 'bvSalesAedFill',
    activeClass: 'bg-pink-500/25 text-pink-200 border-pink-400/45',
  },
];

function OrdersTrendTooltip({
  active,
  payload,
  isRTL,
  trendMode,
  salesCurrency,
}: CustomTooltipProps<DailyChartDatum> & {
  isRTL: boolean;
  trendMode: 'orders' | 'sales';
  salesCurrency: CurrencyCode;
}) {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }
  const item = payload[0].payload;
  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="rounded-2xl bg-[#0d1326]/95 border border-cyan-400/30 px-3.5 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.55)] backdrop-blur-md text-xs space-y-1.5"
    >
      <p className="font-bold text-white">{item.fullDate}</p>
      <div className="flex items-center justify-between gap-4 text-slate-300">
        <span>{isRTL ? 'عدد الطلبات' : 'Orders'}</span>
        <span className="font-bold text-cyan-300 font-numeric">{formatNumber(item.orders)}</span>
      </div>
      <div
        className={`flex items-center justify-between gap-4 ${
          trendMode === 'sales' && salesCurrency === 'EGP'
            ? 'text-white font-semibold'
            : 'text-slate-300'
        }`}
      >
        <span>{isRTL ? 'مبيعات مصر (EGP)' : 'Egypt Sales (EGP)'}</span>
        <span className="font-bold text-emerald-300 font-numeric">
          {formatCurrency(item.revenueEgp, 'EG', isRTL)}
        </span>
      </div>
      <div
        className={`flex items-center justify-between gap-4 ${
          trendMode === 'sales' && salesCurrency === 'SAR'
            ? 'text-white font-semibold'
            : 'text-slate-300'
        }`}
      >
        <span>{isRTL ? 'مبيعات السعودية (SAR)' : 'Saudi Sales (SAR)'}</span>
        <span className="font-bold text-purple-300 font-numeric">
          {formatCurrency(item.revenueSar, 'SA', isRTL)}
        </span>
      </div>
      <div
        className={`flex items-center justify-between gap-4 ${
          trendMode === 'sales' && salesCurrency === 'AED'
            ? 'text-white font-semibold'
            : 'text-slate-300'
        }`}
      >
        <span>{isRTL ? 'مبيعات الإمارات (AED)' : 'UAE Sales (AED)'}</span>
        <span className="font-bold text-pink-300 font-numeric">
          {formatCurrency(item.revenueAed, 'AE', isRTL)}
        </span>
      </div>
    </div>
  );
}

function StatusDistributionTooltip({
  active,
  payload,
  isRTL,
}: CustomTooltipProps<StatusChartDatum> & { isRTL: boolean }) {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }
  const item = payload[0].payload;
  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="rounded-2xl bg-[#0d1326]/95 border border-purple-400/30 px-3.5 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.55)] backdrop-blur-md text-xs space-y-1"
    >
      <p className="font-bold text-white">{item.label}</p>
      <div className="flex items-center justify-between gap-4 text-slate-300">
        <span>{isRTL ? 'الطلبات' : 'Orders'}</span>
        <span className="font-bold text-cyan-300 font-numeric">{formatNumber(item.count)}</span>
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const { isRTL } = useLanguage();
  const [orders] = useState(() => getOrders());
  const [catalog] = useState(() => getCatalogStories());
  const [integrations] = useState(() => getIntegrationsConfig());
  const [drafts] = useState(() => listStudioDrafts());
  const [promoCodes] = useState(() => getPromoCodes());
  const [b2bLeads] = useState(() => getB2BLeads());
  const [birthdayLeads] = useState(() => getBirthdayClubLeads());
  const [merchProducts, setMerchProducts] = useState(() => getMerchCatalog());
  const [gwpConfig, setGwpConfig] = useState(() => getGwpConfig());
  const [trendMode, setTrendMode] = useState<'orders' | 'sales'>('orders');
  const [salesCurrency, setSalesCurrency] = useState<CurrencyCode>('EGP');

  useEffect(() => {
    const syncMerchAndGwp = () => {
      setMerchProducts(getMerchCatalog());
      setGwpConfig(getGwpConfig());
    };
    window.addEventListener('bubbleverse:merch-updated', syncMerchAndGwp);
    window.addEventListener('bubbleverse:gwp-updated', syncMerchAndGwp);
    window.addEventListener('storage', syncMerchAndGwp);
    return () => {
      window.removeEventListener('bubbleverse:merch-updated', syncMerchAndGwp);
      window.removeEventListener('bubbleverse:gwp-updated', syncMerchAndGwp);
      window.removeEventListener('storage', syncMerchAndGwp);
    };
  }, []);

  const DirectionalArrow = isRTL ? ArrowLeft : ArrowRight;

  const activeSalesMeta = useMemo(
    () => SALES_CURRENCIES.find((c) => c.code === salesCurrency) ?? SALES_CURRENCIES[0],
    [salesCurrency]
  );

  const merchStats = useMemo(() => {
    const activeSkus = merchProducts.filter((item) => item.inStock).length;
    return {
      activeSkus,
      totalSkus: merchProducts.length,
      gwpEnabled: gwpConfig.enabled,
      gwpTitle: isRTL ? gwpConfig.titleAr : gwpConfig.titleEn,
    };
  }, [merchProducts, gwpConfig, isRTL]);

  const growthTraction = useMemo(() => {
    const activePromos = promoCodes.filter((p) => p.active).length;
    const openB2B = b2bLeads.filter(
      (lead) => lead.status === 'new' || lead.status === 'contacted' || lead.status === 'quoted'
    ).length;
    return {
      activePromos,
      totalPromos: promoCodes.length,
      openB2B,
      totalB2B: b2bLeads.length,
      retentionLeads: birthdayLeads.length,
    };
  }, [promoCodes, b2bLeads, birthdayLeads]);

  const stats = useMemo(() => {
    const pendingDeposit = orders.filter((o) => o.status === 'pending_deposit').length;
    const inProgress = orders.filter((o) =>
      ['deposit_confirmed', 'in_preparation', 'draft_ready', 'sent_to_print'].includes(o.status)
    ).length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;

    let revenueEgp = 0;
    let revenueSar = 0;
    let revenueAed = 0;
    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      const currencyCode = normalizeCurrencyCode(o.currency, o.country);
      if (currencyCode === 'EGP') {
        revenueEgp += o.totalAmount;
      } else if (currencyCode === 'AED') {
        revenueAed += o.totalAmount;
      } else {
        revenueSar += o.totalAmount;
      }
    }

    return {
      pendingDeposit,
      inProgress,
      delivered,
      cancelled,
      revenueEgp,
      revenueSar,
      revenueAed,
    };
  }, [orders]);

  const apiHealthGroups = useMemo(() => {
    const aiActive = Boolean(
      integrations.ai.enabled &&
        (integrations.ai.apiKey.trim().length > 0 || integrations.ai.customEndpoint.trim().length > 0)
    );
    const paymentsActive = Boolean(
      integrations.payments.paymob.enabled ||
        integrations.payments.tap.enabled ||
        integrations.payments.stripe.enabled
    );
    const webhookActive = Boolean(
      (integrations.messaging.webhook.enabled &&
        integrations.messaging.webhook.url.trim().length > 0) ||
        integrations.messaging.whatsappCloud.enabled
    );
    const pixelsActive = Boolean(
      integrations.analytics.metaPixelId.trim().length > 0 ||
        integrations.analytics.tiktokPixelId.trim().length > 0 ||
        integrations.analytics.ga4MeasurementId.trim().length > 0
    );
    const shippingActive = Boolean(
      integrations.shipping.bosta.enabled || integrations.shipping.aramex.enabled
    );

    return [
      {
        id: 'ai',
        label: isRTL ? 'الذكاء الاصطناعي' : 'AI Engine',
        active: aiActive,
        icon: Cpu,
      },
      {
        id: 'payments',
        label: isRTL ? 'بوابات الدفع' : 'Payments',
        active: paymentsActive,
        icon: CreditCard,
      },
      {
        id: 'webhook',
        label: isRTL ? 'الويب هوك والرسائل' : 'Webhooks',
        active: webhookActive,
        icon: Webhook,
      },
      {
        id: 'pixels',
        label: isRTL ? 'تتبع الإعلانات' : 'Pixels',
        active: pixelsActive,
        icon: BarChart3,
      },
      {
        id: 'shipping',
        label: isRTL ? 'شركات الشحن' : 'Shipping',
        active: shippingActive,
        icon: Truck,
      },
    ];
  }, [integrations, isRTL]);

  const activeApiCount = useMemo(
    () => apiHealthGroups.filter((g) => g.active).length,
    [apiHealthGroups]
  );

  const dailySeries = useMemo<DailyChartDatum[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const locale = isRTL ? 'ar-EG' : 'en-US';
    const shortFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const fullFmt = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });

    const buckets = new Map<string, DailyChartDatum>();
    const orderedKeys: string[] = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      const key = toDayKey(d);
      orderedKeys.push(key);
      buckets.set(key, {
        dateKey: key,
        label: shortFmt.format(d),
        fullDate: fullFmt.format(d),
        orders: 0,
        revenueEgp: 0,
        revenueSar: 0,
        revenueAed: 0,
      });
    }

    for (const order of orders) {
      if (order.status === 'cancelled') continue;
      const d = new Date(order.createdAt);
      const key = toDayKey(d);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.orders += 1;
      const currencyCode = normalizeCurrencyCode(order.currency, order.country);
      if (currencyCode === 'EGP') {
        bucket.revenueEgp += order.totalAmount;
      } else if (currencyCode === 'AED') {
        bucket.revenueAed += order.totalAmount;
      } else {
        bucket.revenueSar += order.totalAmount;
      }
    }

    return orderedKeys.map((key) => buckets.get(key)!);
  }, [orders, isRTL]);

  const hasRecentSevenDayOrders = useMemo(
    () => dailySeries.some((point) => point.orders > 0),
    [dailySeries]
  );

  const statusDistribution = useMemo<StatusChartDatum[]>(() => {
    return PIPELINE_STAGES.map((stage) => ({
      status: stage.status,
      label: isRTL ? stage.labelAr : stage.labelEn,
      shortLabel: isRTL ? stage.shortAr : stage.shortEn,
      count: orders.filter((o) => o.status === stage.status).length,
      color: stage.color,
    }));
  }, [orders, isRTL]);

  const quickActions = useMemo(
    () => [
      {
        title: isRTL ? 'إدارة الطلبات والعملاء' : 'Orders & Customers',
        desc: isRTL
          ? 'تأكيد العربون، تحميل صور الأطفال، الفواتير والتواصل عبر واتساب.'
          : 'Confirm deposits, download child photos, print invoices & WhatsApp buyers.',
        to: '/admin/orders',
        icon: ShoppingBag,
        iconColor: 'text-cyan-300',
        badgeBg: 'bg-cyan-500/15 border-cyan-400/30',
      },
      {
        title: isRTL ? 'إدارة كتالوج القصص' : 'Story Catalog',
        desc: isRTL
          ? 'إضافة قصص جديدة، رفع الأغلفة، وتحديث أسعار مصر والسعودية والإمارات مباشرة.'
          : 'Add new titles, upload covers, and update live EGP, SAR & AED pricing.',
        to: '/admin/catalog',
        icon: BookOpen,
        iconColor: 'text-purple-300',
        badgeBg: 'bg-purple-500/15 border-purple-400/30',
      },
      {
        title: isRTL ? 'استوديو صناعة القصص' : 'Story Studio',
        desc: isRTL
          ? 'تجهيز الصفحات، نسخ أوامر الرسم، رفع اللوحات وتصدير ملف الطباعة.'
          : 'Draft story spreads, copy art prompts, upload illustrations & export print PDF.',
        to: '/admin/studio',
        icon: Wand2,
        iconColor: 'text-pink-300',
        badgeBg: 'bg-pink-500/15 border-pink-400/30',
      },
      {
        title: isRTL ? 'إعدادات المتجر والنسخ الاحتياطي' : 'Store Settings & Backup',
        desc: isRTL
          ? 'تحديث رقم واتساب، حسابات التحويل، نسبة العربون وحفظ نسخة احتياطية.'
          : 'Edit WhatsApp number, payment handles, deposit %, and JSON backups.',
        to: '/admin/config',
        icon: Settings,
        iconColor: 'text-emerald-300',
        badgeBg: 'bg-emerald-500/15 border-emerald-400/30',
      },
    ],
    [isRTL]
  );

  return (
    <AdminLayout>
      <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 max-w-[min(100%,108rem)] mx-auto">
        {/* Executive Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-editorial flex items-center gap-3">
              <span className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400/20 via-purple-500/20 to-pink-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-cyan-300" />
              </span>
              <span>{isRTL ? 'لوحة تحكم بابل فيرس' : 'Bubbleverse Executive Overview'}</span>
            </h1>
            <p className="text-sm text-slate-400">
              {isRTL
                ? 'متابعة فورية للطلبات، الإيرادات، مكتبة القصص وحالة الربط البرمجي.'
                : 'Live pulse across orders, dual-market revenue, story catalog, and API connections.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/admin/orders">
              <Button className="bubble-btn bubble-btn-primary h-10 px-5 text-xs font-bold gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>{isRTL ? 'إدارة الطلبات' : 'Manage Orders'}</span>
              </Button>
            </Link>
            <Link to="/admin/studio">
              <Button className="bubble-btn bubble-btn-secondary h-10 px-5 text-xs font-bold gap-2">
                <Wand2 className="w-4 h-4" />
                <span>{isRTL ? 'فتح الاستوديو' : 'Open Story Studio'}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Grid (4 Midnight Magic StatsCards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title={isRTL ? 'إجمالي الطلبات' : 'Total Orders'}
            value={formatNumber(orders.length)}
            icon={ShoppingBag}
            accent="cyan"
            badge={
              stats.delivered > 0
                ? isRTL
                  ? `${formatNumber(stats.delivered)} مُسلّم`
                  : `${formatNumber(stats.delivered)} delivered`
                : undefined
            }
            description={
              isRTL
                ? `${formatNumber(stats.inProgress)} طلب قيد التجهيز في الاستوديو`
                : `${formatNumber(stats.inProgress)} orders active in studio pipeline`
            }
          />

          <StatsCard
            title={isRTL ? 'بانتظار تأكيد العربون' : 'Pending Deposit'}
            value={formatNumber(stats.pendingDeposit)}
            icon={Clock}
            accent="amber"
            highlight={stats.pendingDeposit > 0}
            badge={
              stats.pendingDeposit > 0
                ? isRTL
                  ? 'يتطلب مراجعة'
                  : 'Needs action'
                : isRTL
                  ? 'لا يوجد معلق'
                  : 'All clear'
            }
            description={
              isRTL
                ? 'طلبات بانتظار مطابقة التحويل عبر واتساب'
                : 'Orders awaiting transfer confirmation'
            }
          />

          <StatsCard
            title={isRTL ? 'الإيرادات النشطة' : 'Active Revenue'}
            value={formatCurrency(stats.revenueEgp, 'EG', isRTL)}
            secondaryValue={
              stats.revenueAed > 0
                ? `· ${formatCurrency(stats.revenueSar, 'SA', isRTL)} · ${formatCurrency(stats.revenueAed, 'AE', isRTL)}`
                : `· ${formatCurrency(stats.revenueSar, 'SA', isRTL)}`
            }
            icon={TrendingUp}
            accent="emerald"
            description={
              isRTL
                ? 'مجموع مبيعات مصر والسعودية والإمارات (بدون الملغي)'
                : 'Combined Egypt, Saudi & UAE active sales'
            }
          />

          <StatsCard
            title={isRTL ? 'الكتالوج والربط البرمجي' : 'Live Catalog & APIs'}
            value={formatNumber(catalog.length)}
            icon={BookOpen}
            accent="purple"
            badge={
              isRTL
                ? `${formatNumber(activeApiCount)}/${formatNumber(apiHealthGroups.length)} ربط نشط`
                : `${formatNumber(activeApiCount)}/${formatNumber(apiHealthGroups.length)} APIs active`
            }
            description={
              isRTL
                ? `قصة منشورة • ${formatNumber(drafts.length)} مسودة محفوظة`
                : `Published stories • ${formatNumber(drafts.length)} studio drafts`
            }
          />
        </div>

        {/* Pending Actions & API Health Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Pending Deposit Alert Strip */}
          <div
            className={`glass-card rounded-3xl p-5 lg:col-span-5 flex flex-col justify-between gap-4 ${
              stats.pendingDeposit > 0
                ? 'ring-1 ring-amber-400/40 shadow-[0_0_32px_rgba(245,158,11,0.16)]'
                : ''
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  stats.pendingDeposit > 0
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                    : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                }`}
              >
                {stats.pendingDeposit > 0 ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white">
                  {stats.pendingDeposit > 0
                    ? isRTL
                      ? `${formatNumber(stats.pendingDeposit)} طلبات بانتظار تأكيد العربون`
                      : `${formatNumber(stats.pendingDeposit)} Orders Waiting on Deposit`
                    : isRTL
                      ? 'لا توجد طلبات عربون معلّقة حالياً'
                      : 'No Pending Deposit Approvals'}
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {stats.pendingDeposit > 0
                    ? isRTL
                      ? 'راجع إيصالات التحويل البنكي أو المحفظة وانقل الطلب مباشرة للتجهيز.'
                      : 'Verify incoming transfer receipts and advance orders into studio production.'
                    : isRTL
                      ? 'جميع الطلبات الحالية مؤكدة أو يمكنك إضافة طلب يدوي جديد من صفحة الطلبات.'
                      : 'Every current order is verified. You can also log a manual phone or WhatsApp order.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link to="/admin/orders">
                <Button
                  className={
                    stats.pendingDeposit > 0
                      ? 'bubble-btn bubble-btn-primary h-9 px-4 text-xs font-bold gap-1.5'
                      : 'bubble-btn bubble-btn-outline h-9 px-4 text-xs font-bold gap-1.5'
                  }
                >
                  {stats.pendingDeposit > 0 ? (
                    <>
                      <span>{isRTL ? 'تأكيد الطلبات الآن' : 'Confirm Deposits Now'}</span>
                      <DirectionalArrow className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>{isRTL ? 'إنشاء طلب يدوي' : 'Create Manual Order'}</span>
                    </>
                  )}
                </Button>
              </Link>
            </div>
          </div>

          {/* API Integrations Health Strip */}
          <div className="glass-card rounded-3xl p-5 lg:col-span-7 flex flex-col justify-between gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center shrink-0">
                  <Plug className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {isRTL ? 'حالة الربط والخدمات المتصلة' : 'API & Integrations Health'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isRTL
                      ? `${formatNumber(activeApiCount)} من ${formatNumber(apiHealthGroups.length)} مجموعات مفعّلة محلياً`
                      : `${formatNumber(activeApiCount)} of ${formatNumber(apiHealthGroups.length)} integration groups active`}
                  </p>
                </div>
              </div>

              <Link
                to="/admin/integrations"
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1 transition-colors"
              >
                <span>{isRTL ? 'إدارة التكاملات' : 'Manage APIs'}</span>
                <DirectionalArrow className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {apiHealthGroups.map((group) => (
                <Link
                  key={group.id}
                  to="/admin/integrations"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
                    group.active
                      ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200 hover:bg-emerald-500/20'
                      : 'bg-white/[0.04] border-white/10 text-slate-300 hover:border-cyan-400/35 hover:text-white'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      group.active
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                        : 'bg-slate-500'
                    }`}
                  />
                  <group.icon className="w-4 h-4 shrink-0" />
                  <span>{group.label}</span>
                  <span className="text-[10px] opacity-80">
                    {group.active
                      ? isRTL
                        ? 'نشط'
                        : 'Active'
                      : isRTL
                        ? 'غير مفعّل'
                        : 'Off'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Growth, Promos & B2B Traction Highlight */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 border border-cyan-400/25 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-400/35 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-white">
                {isRTL ? 'مؤشرات النمو والعروض وB2B' : 'Growth, Promos & B2B Traction'}
              </h2>
              <p className="text-xs text-slate-400">
                {isRTL
                  ? 'ملخص حي لأكواد الخصم النشطة وعروض المدارس والشركات وعملاء نادي أعياد الميلاد.'
                  : 'Live snapshot of active promo codes, B2B school/corporate quotes, and retention leads.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/growth"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-colors"
            >
              <Tag className="w-4 h-4 shrink-0" />
              <span className="font-numeric font-extrabold text-white">
                {formatNumber(growthTraction.activePromos)}
              </span>
              <span>{isRTL ? 'كود خصم نشط' : 'Active Promos'}</span>
            </Link>

            <Link
              to="/admin/growth"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-purple-500/10 border border-purple-400/30 text-xs font-semibold text-purple-200 hover:bg-purple-500/20 transition-colors"
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="font-numeric font-extrabold text-white">
                {formatNumber(growthTraction.openB2B)}
              </span>
              <span>
                {isRTL
                  ? `عرض B2B (${formatNumber(growthTraction.totalB2B)} إجمالي)`
                  : `Open B2B (${formatNumber(growthTraction.totalB2B)} total)`}
              </span>
            </Link>

            <Link
              to="/admin/growth"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-pink-500/10 border border-pink-400/30 text-xs font-semibold text-pink-200 hover:bg-pink-500/20 transition-colors"
            >
              <Cake className="w-4 h-4 shrink-0" />
              <span className="font-numeric font-extrabold text-white">
                {formatNumber(growthTraction.retentionLeads)}
              </span>
              <span>{isRTL ? 'عميل نادي وهدايا' : 'Retention Leads'}</span>
            </Link>

            <Link to="/admin/growth">
              <Button className="bubble-btn bubble-btn-primary h-10 px-4 text-xs font-bold gap-1.5">
                <span>{isRTL ? 'فتح مركز النمو وB2B' : 'Open Growth & B2B'}</span>
                <DirectionalArrow className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Merch & Free Bub GWP Quick-Highlight Card */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 border border-pink-400/25 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-400/35 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-pink-300" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-white">
                {isRTL
                  ? 'منتجات باب وهدية كورة باب المجانية (GWP)'
                  : 'Bub Merch & Free Bub GWP'}
              </h2>
              <p className="text-xs text-slate-400">
                {isRTL
                  ? `إدارة مخزون وأسعار منتجات العلامة التجارية والتحكم الفوري في هدية «${merchStats.gwpTitle}».`
                  : `Manage brand merch SKUs, stock, and live unlock rules for “${merchStats.gwpTitle}”.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/merch"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-colors"
            >
              <Package className="w-4 h-4 shrink-0" />
              <span className="font-numeric font-extrabold text-white">
                {formatNumber(merchStats.activeSkus)}/{formatNumber(merchStats.totalSkus)}
              </span>
              <span>{isRTL ? 'منتج متوفر (SKU)' : 'Active Merch SKUs'}</span>
            </Link>

            <Link
              to="/admin/merch"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-colors ${
                merchStats.gwpEnabled
                  ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200 hover:bg-emerald-500/25'
                  : 'bg-white/[0.05] border-white/15 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  merchStats.gwpEnabled
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                    : 'bg-slate-500'
                }`}
              />
              <span>{isRTL ? 'هدية باب المجانية:' : 'Free Bub GWP:'}</span>
              <span className="font-numeric font-extrabold">
                {merchStats.gwpEnabled ? 'ON' : 'OFF'}
              </span>
            </Link>

            <Link to="/admin/merch">
              <Button className="bubble-btn bubble-btn-secondary h-10 px-4 text-xs font-bold gap-1.5">
                <Gift className="w-4 h-4" />
                <span>{isRTL ? 'إدارة المنتجات وGWP' : 'Manage Merch & GWP'}</span>
                <DirectionalArrow className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Charts Row (Recharts) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 7-Day Orders & Sales AreaChart */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <TrendingUp className="w-6 h-6 text-cyan-300 shrink-0" />
                  <span>
                    {isRTL ? 'الطلبات والمبيعات — آخر ٧ أيام' : '7-Day Orders & Sales'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {trendMode === 'orders'
                    ? isRTL
                      ? 'بيانات محدثة تلقائياً من سجل الطلبات الفعلي'
                      : 'Dynamically aggregated from your live order records'
                    : isRTL
                      ? `مبيعات حقيقية بعملة ${activeSalesMeta.labelAr} فقط (بدون خلط العملات)`
                      : `Isolated ${activeSalesMeta.code} revenue only (never sums mixed currencies)`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center p-1 rounded-full bg-white/[0.05] border border-white/10">
                  <button
                    type="button"
                    onClick={() => setTrendMode('orders')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      trendMode === 'orders'
                        ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                        : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    {isRTL ? 'عدد الطلبات' : 'Orders'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendMode('sales')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      trendMode === 'sales'
                        ? 'bg-purple-500/25 text-purple-200 border border-purple-400/40'
                        : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    {isRTL ? 'قيمة المبيعات' : 'Sales'}
                  </button>
                </div>

                {/* 3-Button Currency Switcher (EGP / SAR / AED) */}
                <div
                  role="group"
                  aria-label={isRTL ? 'عملة مخطط المبيعات' : 'Sales chart currency'}
                  className="inline-flex items-center p-1 rounded-full bg-slate-950/70 border border-white/10 font-numeric"
                >
                  {SALES_CURRENCIES.map((cur) => {
                    const isSelected = trendMode === 'sales' && salesCurrency === cur.code;
                    return (
                      <button
                        key={cur.code}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSalesCurrency(cur.code);
                          setTrendMode('sales');
                        }}
                        className={`px-2.5 py-1.5 rounded-full text-[11px] font-extrabold border transition-all cursor-pointer ${
                          isSelected
                            ? cur.activeClass
                            : 'text-slate-400 hover:text-white border-transparent'
                        }`}
                      >
                        {cur.code}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div dir="ltr" className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailySeries}
                  margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="bvOrdersAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.42} />
                      <stop offset="65%" stopColor="#A78BFA" stopOpacity={0.14} />
                      <stop offset="95%" stopColor="#00D9FF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="bvSalesEgpFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.42} />
                      <stop offset="65%" stopColor="#00D9FF" stopOpacity={0.14} />
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="bvSalesSarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.42} />
                      <stop offset="65%" stopColor="#00D9FF" stopOpacity={0.14} />
                      <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="bvSalesAedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F472B6" stopOpacity={0.42} />
                      <stop offset="65%" stopColor="#A78BFA" stopOpacity={0.14} />
                      <stop offset="95%" stopColor="#F472B6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.14)" />
                  <XAxis
                    dataKey="label"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    content={
                      <OrdersTrendTooltip
                        isRTL={isRTL}
                        trendMode={trendMode}
                        salesCurrency={salesCurrency}
                      />
                    }
                    cursor={{ stroke: 'rgba(0, 217, 255, 0.35)', strokeWidth: 1.5 }}
                  />
                  <Area
                    type="monotone"
                    dataKey={trendMode === 'orders' ? 'orders' : activeSalesMeta.dataKey}
                    stroke={trendMode === 'orders' ? '#00D9FF' : activeSalesMeta.stroke}
                    strokeWidth={2.5}
                    fill={
                      trendMode === 'orders'
                        ? 'url(#bvOrdersAreaFill)'
                        : `url(#${activeSalesMeta.gradientId})`
                    }
                    activeDot={{
                      r: 5,
                      fill: trendMode === 'orders' ? '#00D9FF' : activeSalesMeta.stroke,
                      stroke: '#0B1021',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {!hasRecentSevenDayOrders && (
              <div className="glass-card-inner rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-300">
                  {isRTL
                    ? 'لم تُسجّل طلبات خلال آخر ٧ أيام بعد. أنشئ طلباً يدوياً أو تجريبياً لتظهر الإحصائيات فوراً.'
                    : 'No orders recorded in the last 7 days yet. Create a manual or test order to populate live trends.'}
                </p>
                <Link to="/admin/orders">
                  <Button
                    size="sm"
                    className="bubble-btn bubble-btn-outline h-8 px-3.5 text-xs font-bold gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isRTL ? 'إضافة طلب تجريبي' : 'Create Test Order'}</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Order Status Distribution BarChart */}
          <div className="glass-card rounded-3xl p-5 sm:p-6 lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <BarChart3 className="w-6 h-6 text-purple-300 shrink-0" />
                  <span>{isRTL ? 'توزيع حالات الطلبات' : 'Order Status Pipeline'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isRTL
                    ? 'من انتظار العربون وحتى التسليم النهائي'
                    : 'Exact count across every fulfillment stage'}
                </p>
              </div>
              {stats.cancelled > 0 && (
                <Badge className="bg-rose-500/15 text-rose-300 border-rose-400/30 font-numeric text-[11px]">
                  {isRTL
                    ? `${formatNumber(stats.cancelled)} ملغي`
                    : `${formatNumber(stats.cancelled)} cancelled`}
                </Badge>
              )}
            </div>

            <div dir="ltr" className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusDistribution}
                  margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.14)"
                  />
                  <XAxis
                    dataKey="shortLabel"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<StatusDistributionTooltip isRTL={isRTL} />}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  />
                  <Bar dataKey="count" radius={[10, 10, 4, 4]} maxBarSize={36}>
                    {statusDistribution.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Compact Stage Counts Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {statusDistribution.map((stage) => (
                <div
                  key={stage.status}
                  className="glass-card-inner rounded-2xl px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-[11px] text-slate-300 truncate">{stage.label}</span>
                  </div>
                  <span className="text-xs font-extrabold text-white font-numeric shrink-0">
                    {formatNumber(stage.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders Feed */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <ShoppingBag className="w-6 h-6 text-cyan-300 shrink-0" />
              <span>{isRTL ? 'أحدث الطلبات' : 'Recent Orders'}</span>
            </h2>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1 transition-colors"
            >
              <span>{isRTL ? 'عرض جميع الطلبات' : 'View All Orders'}</span>
              <DirectionalArrow className="w-4 h-4" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="glass-card-inner rounded-2xl py-10 px-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-5 h-5 text-cyan-300" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <p className="text-sm font-bold text-white">
                  {isRTL ? 'لا توجد طلبات مسجّلة حتى الآن' : 'No Orders Recorded Yet'}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isRTL
                    ? 'بمجرد إتمام طلب من المتجر أو إنشاء طلب يدوي سيظهر هنا مباشرة مع كامل تفاصيل البطل والمبلغ.'
                    : 'Place a storefront order or log a manual order to see customer, hero, and studio shortcuts appear here live.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <Link to="/admin/orders">
                  <Button className="bubble-btn bubble-btn-primary h-9 px-4 text-xs font-bold gap-1.5">
                    <PlusCircle className="w-4 h-4" />
                    <span>{isRTL ? 'إنشاء طلب يدوي' : 'Create Manual Order'}</span>
                  </Button>
                </Link>
                <Link to="/stories">
                  <Button className="bubble-btn bubble-btn-outline h-9 px-4 text-xs font-bold gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>{isRTL ? 'تصفح المتجر' : 'Browse Storefront'}</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {orders.slice(0, 6).map((order) => {
                const statusMeta = getStatusMeta(order.status, isRTL);
                const heroName = order.items[0]?.childName || '—';
                return (
                  <div
                    key={order.id}
                    className="glass-card-inner rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 hover:border-cyan-400/30 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-numeric font-extrabold text-sm text-cyan-300 tracking-tight">
                          {order.reference}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-semibold border ${statusMeta.badgeClass}`}
                        >
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-semibold text-white">{order.customerName}</span>
                        <span className="text-slate-500">•</span>
                        <span dir="ltr" className="font-numeric text-slate-400">
                          {order.phone}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span>
                          {isRTL ? 'البطل:' : 'Hero:'}{' '}
                          <strong className="text-white">{heroName}</strong>
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-extrabold text-sm text-white font-numeric px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10">
                        {formatCurrency(order.totalAmount, order.country, isRTL)}
                      </span>
                      <Link to="/admin/orders">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 rounded-full text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 gap-1.5"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>{isRTL ? 'التفاصيل' : 'Orders'}</span>
                        </Button>
                      </Link>
                      <Link to={`/admin/studio?orderId=${order.id}`}>
                        <Button
                          size="sm"
                          className="bubble-btn bubble-btn-secondary h-8 px-3.5 text-xs font-bold gap-1.5"
                        >
                          <Wand2 className="w-4 h-4" />
                          <span>{isRTL ? 'الاستوديو' : 'Studio'}</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4 Quick Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="glass-card rounded-3xl p-5 flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-3">
                <div
                  className={`h-11 w-11 rounded-2xl border flex items-center justify-center ${card.badgeBg}`}
                >
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm">{card.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-cyan-300 inline-flex items-center gap-1.5 group-hover:text-cyan-200 transition-colors">
                <span>{isRTL ? 'فتح القسم' : 'Open Section'}</span>
                <DirectionalArrow className="w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
