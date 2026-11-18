import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Tag,
  Building2,
  Cake,
  Plus,
  Trash2,
  Copy,
  Check,
  MessageCircle,
  RefreshCw,
  Search,
  Sparkles,
  School,
  Briefcase,
  Baby,
  Award,
  Share2,
  Calendar,
  ExternalLink,
  Percent,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/hooks/useLanguage';
import {
  getOrders,
  getPromoCodes,
  savePromoCode,
  togglePromoCode,
  deletePromoCode,
  getB2BLeads,
  updateB2BLeadStatus,
  getBirthdayClubLeads,
  type PromoCodeRecord,
  type B2BLeadRecord,
  type B2BLeadStatus,
  type B2BOrganizationType,
  type BirthdayClubRecord,
  type BirthdayClubSource,
  type OrderRecord,
} from '@/lib/localStore';
import type { CurrencyCountry } from '@/features/commerce/pricingEngine';

type GrowthTab = 'promos' | 'b2b' | 'retention';

const B2B_STATUS_META: Record<
  B2BLeadStatus,
  { labelAr: string; labelEn: string; badgeClass: string }
> = {
  new: {
    labelAr: 'جديد',
    labelEn: 'New',
    badgeClass: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/35',
  },
  contacted: {
    labelAr: 'تم التواصل',
    labelEn: 'Contacted',
    badgeClass: 'bg-purple-500/15 text-purple-200 border-purple-400/35',
  },
  quoted: {
    labelAr: 'أُرسل العرض',
    labelEn: 'Quoted',
    badgeClass: 'bg-amber-500/15 text-amber-200 border-amber-400/35',
  },
  won: {
    labelAr: 'تم التعاقد',
    labelEn: 'Won',
    badgeClass: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/35',
  },
  archived: {
    labelAr: 'مؤرشف',
    labelEn: 'Archived',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/35',
  },
};

const ALL_B2B_STATUSES: B2BLeadStatus[] = ['new', 'contacted', 'quoted', 'won', 'archived'];

const ORG_TYPE_META: Record<
  B2BOrganizationType,
  { labelAr: string; labelEn: string; badgeClass: string; icon: typeof School }
> = {
  nursery: {
    labelAr: 'حضانة',
    labelEn: 'Nursery',
    badgeClass: 'bg-pink-500/15 text-pink-200 border-pink-400/35',
    icon: Baby,
  },
  school: {
    labelAr: 'مدرسة',
    labelEn: 'School',
    badgeClass: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/35',
    icon: School,
  },
  corporate: {
    labelAr: 'شركة / HR',
    labelEn: 'Corporate',
    badgeClass: 'bg-purple-500/15 text-purple-200 border-purple-400/35',
    icon: Briefcase,
  },
};

const SOURCE_META: Record<
  BirthdayClubSource,
  { labelAr: string; labelEn: string; badgeClass: string; icon: typeof Cake }
> = {
  birthday_club: {
    labelAr: 'نادي أعياد الميلاد',
    labelEn: 'Birthday Club',
    badgeClass: 'bg-pink-500/15 text-pink-200 border-pink-400/35',
    icon: Cake,
  },
  free_certificate: {
    labelAr: 'شهادة البطل المجانية',
    labelEn: 'Free Certificate',
    badgeClass: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/35',
    icon: Award,
  },
  referral: {
    labelAr: 'إحالة صديق',
    labelEn: 'Referral',
    badgeClass: 'bg-purple-500/15 text-purple-200 border-purple-400/35',
    icon: Share2,
  },
};

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function formatMoney(amount: number, currency: string, isAr: boolean): string {
  const num = formatNumber(Math.round(amount));
  const code = currency.toUpperCase();
  if (code === 'EGP') return isAr ? `${num} ج.م` : `${num} EGP`;
  if (code === 'SAR') return isAr ? `${num} ر.س` : `${num} SAR`;
  if (code === 'AED') return isAr ? `${num} د.إ` : `${num} AED`;
  return `${num} ${code}`;
}

function formatDate(timestamp: number, isAr: boolean): string {
  try {
    return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return '';
  }
}

function formatBirthdayDisplay(raw: string, isAr: boolean): string {
  const trimmed = raw.trim();
  if (!trimmed) return isAr ? 'غير محدد' : 'Not set';
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  try {
    return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(parsed);
  } catch {
    return trimmed;
  }
}

function normalizeWhatsAppPhone(phone: string, country?: CurrencyCountry): string {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '');
  if (!digits) return '';
  if (digits.startsWith('01') && digits.length === 11) {
    return `2${digits}`;
  }
  if (digits.startsWith('05') && digits.length === 10) {
    if (country === 'AE') return `971${digits.slice(1)}`;
    return `966${digits.slice(1)}`;
  }
  return digits;
}

function hasAnyAddon(order: OrderRecord): boolean {
  return order.items.some((item) =>
    Boolean(
      item.hasColoringBookAddon ||
        item.hasGiftBoxAddon ||
        item.hasStickersAddon ||
        item.hasAudioStoryAddon ||
        item.hasCoHeroAddon
    )
  );
}

export function AdminGrowth() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<GrowthTab>('promos');
  const [promos, setPromos] = useState<PromoCodeRecord[]>(() => getPromoCodes());
  const [b2bLeads, setB2bLeads] = useState<B2BLeadRecord[]>(() => getB2BLeads());
  const [birthdayLeads, setBirthdayLeads] = useState<BirthdayClubRecord[]>(() =>
    getBirthdayClubLeads()
  );
  const [orders, setOrders] = useState<OrderRecord[]>(() => getOrders());

  // Promo create form state
  const [newCode, setNewCode] = useState('');
  const [newPercent, setNewPercent] = useState('15');
  const [newLabelAr, setNewLabelAr] = useState('');
  const [newLabelEn, setNewLabelEn] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // B2B filters
  const [b2bStatusFilter, setB2bStatusFilter] = useState<'all' | B2BLeadStatus>('all');
  const [b2bSearch, setB2bSearch] = useState('');

  // Retention filters
  const [retentionSourceFilter, setRetentionSourceFilter] = useState<'all' | BirthdayClubSource>(
    'all'
  );
  const [retentionSearch, setRetentionSearch] = useState('');

  const refreshAllData = useCallback(
    (showToast = false) => {
      setPromos(getPromoCodes());
      setB2bLeads(getB2BLeads());
      setBirthdayLeads(getBirthdayClubLeads());
      setOrders(getOrders());
      if (showToast) {
        toast.success(isAr ? 'تم تحديث بيانات النمو والعملاء' : 'Growth & CRM data refreshed');
      }
    },
    [isAr]
  );

  useEffect(() => {
    const onStorage = () => refreshAllData(false);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshAllData]);

  // Top KPI computations
  const promoStats = useMemo(() => {
    const activeCount = promos.filter((p) => p.active).length;
    const totalUsages = promos.reduce((sum, p) => sum + (p.usageCount || 0), 0);
    return { activeCount, totalUsages };
  }, [promos]);

  const b2bStats = useMemo(() => {
    const openLeads = b2bLeads.filter(
      (lead) => lead.status === 'new' || lead.status === 'contacted' || lead.status === 'quoted'
    );
    const wonLeads = b2bLeads.filter((lead) => lead.status === 'won');
    const pipelineByCurrency: Record<string, number> = {};
    for (const lead of openLeads) {
      const curr = (lead.currency || 'EGP').toUpperCase();
      pipelineByCurrency[curr] = (pipelineByCurrency[curr] || 0) + (lead.estimatedTotal || 0);
    }
    const pipelineParts = Object.entries(pipelineByCurrency)
      .filter(([, total]) => total > 0)
      .map(([curr, total]) => formatMoney(total, curr, isAr));
    const totalOpenBooks = openLeads.reduce((sum, lead) => sum + (lead.quantity || 0), 0);
    return {
      openCount: openLeads.length,
      wonCount: wonLeads.length,
      totalOpenBooks,
      pipelineSummary:
        pipelineParts.length > 0
          ? pipelineParts.join(' · ')
          : isAr
            ? 'لا توجد عروض مفتوحة'
            : 'No open pipeline yet',
    };
  }, [b2bLeads, isAr]);

  const retentionStats = useMemo(() => {
    const clubCount = birthdayLeads.filter((l) => l.source === 'birthday_club').length;
    const certCount = birthdayLeads.filter((l) => l.source === 'free_certificate').length;
    const refCount = birthdayLeads.filter((l) => l.source === 'referral').length;
    return { clubCount, certCount, refCount };
  }, [birthdayLeads]);

  const orderGrowthStats = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalValid = validOrders.length;
    const ordersWithAddons = validOrders.filter(hasAnyAddon).length;
    const attachmentRate = totalValid > 0 ? Math.round((ordersWithAddons / totalValid) * 100) : 0;

    const aovByCurrency: string[] = [];
    const currencyGroups: { country: CurrencyCountry; code: string }[] = [
      { country: 'EG', code: 'EGP' },
      { country: 'SA', code: 'SAR' },
      { country: 'AE', code: 'AED' },
    ];
    for (const group of currencyGroups) {
      const groupOrders = validOrders.filter((o) => o.country === group.country);
      if (groupOrders.length > 0) {
        const avg =
          groupOrders.reduce((sum, o) => sum + o.totalAmount, 0) / groupOrders.length;
        aovByCurrency.push(formatMoney(avg, group.code, isAr));
      }
    }

    const promoOrdersCount = validOrders.filter((o) => Boolean(o.promoCode)).length;

    return {
      totalValid,
      ordersWithAddons,
      attachmentRate,
      promoOrdersCount,
      aovSummary:
        aovByCurrency.length > 0
          ? aovByCurrency.join(' · ')
          : isAr
            ? 'بانتظار أول طلب'
            : 'Awaiting first order',
    };
  }, [orders, isAr]);

  // Promo actions
  const handleCreatePromo = (e: FormEvent) => {
    e.preventDefault();
    const cleanedCode = newCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanedCode || cleanedCode.length < 3) {
      toast.error(
        isAr
          ? 'أدخل كود خصم صالح (3 أحرف على الأقل مثل SUMMER20)'
          : 'Enter a valid promo code (at least 3 characters, e.g. SUMMER20)'
      );
      return;
    }
    const parsedPercent = Number(newPercent);
    if (!Number.isFinite(parsedPercent) || parsedPercent < 1 || parsedPercent > 90) {
      toast.error(
        isAr
          ? 'نسبة الخصم يجب أن تكون بين 1% و 90%'
          : 'Discount percentage must be between 1% and 90%'
      );
      return;
    }

    const saved = savePromoCode({
      code: cleanedCode,
      discountPercent: Math.round(parsedPercent),
      labelAr: newLabelAr.trim() || `خصم ${Math.round(parsedPercent)}%`,
      labelEn: newLabelEn.trim() || `${Math.round(parsedPercent)}% Off`,
      active: true,
    });
    setPromos(getPromoCodes());
    setNewCode('');
    setNewPercent('15');
    setNewLabelAr('');
    setNewLabelEn('');
    toast.success(
      isAr
        ? `تم حفظ كود الخصم ${saved.code} (${saved.discountPercent}%)`
        : `Promo code ${saved.code} (${saved.discountPercent}%) saved`
    );
  };

  const handleTogglePromo = (promo: PromoCodeRecord) => {
    const updated = togglePromoCode(promo.id);
    if (!updated) return;
    setPromos(getPromoCodes());
    toast.success(
      updated.active
        ? isAr
          ? `تم تفعيل الكود ${updated.code}`
          : `${updated.code} activated`
        : isAr
          ? `تم إيقاف الكود ${updated.code} مؤقتاً`
          : `${updated.code} paused`
    );
  };

  const handleDeletePromo = (promo: PromoCodeRecord) => {
    const removed = deletePromoCode(promo.id);
    if (!removed) return;
    setPromos(getPromoCodes());
    toast.success(
      isAr ? `تم حذف كود الخصم ${promo.code}` : `Promo code ${promo.code} deleted`
    );
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(isAr ? `تم نسخ الكود ${code}` : `Copied ${code}`);
      setTimeout(() => {
        setCopiedCode((curr) => (curr === code ? null : curr));
      }, 2000);
    } catch {
      toast.error(isAr ? 'تعذر النسخ إلى الحافظة' : 'Could not copy to clipboard');
    }
  };

  // B2B actions
  const handleB2BStatusChange = (lead: B2BLeadRecord, nextStatus: B2BLeadStatus) => {
    const updated = updateB2BLeadStatus(lead.id, nextStatus);
    if (!updated) return;
    setB2bLeads(getB2BLeads());
    const meta = B2B_STATUS_META[nextStatus];
    toast.success(
      isAr
        ? `تم تحديث حالة ${lead.reference} إلى «${meta.labelAr}»`
        : `Updated ${lead.reference} status to "${meta.labelEn}"`
    );
  };

  const handleB2BWhatsAppFollowUp = (lead: B2BLeadRecord) => {
    const waNumber = normalizeWhatsAppPhone(lead.phone, lead.country);
    if (!waNumber) {
      toast.error(isAr ? 'رقم الهاتف غير صالح للواتساب' : 'Phone number is not valid for WhatsApp');
      return;
    }
    const formattedTotal = formatMoney(lead.estimatedTotal, lead.currency, isAr);
    const formatText =
      lead.format === 'hardcover_book'
        ? isAr
          ? 'غلاف فاخر مطبوع'
          : 'Printed Hardcover'
        : isAr
          ? 'نسخة رقمية PDF'
          : 'Digital PDF';
    const message = isAr
      ? `مرحباً أ. ${lead.contactName}، معكم فريق بابل فيرس (Bubbleverse) بخصوص عرض أسعار ${lead.organizationName} (${lead.reference}).\nالكمية المطلوبة: ${lead.quantity} كتاب (${formatText})\nالمناسبة: ${lead.occasion}\nالتقدير المبدئي: ${formattedTotal}.\nيسعدنا تجهيز عينة مخصصة وتأكيد جدول التسليم معكم اليوم!`
      : `Hello ${lead.contactName}, this is the Bubbleverse B2B team following up on your quote request for ${lead.organizationName} (${lead.reference}).\nQuantity: ${lead.quantity} books (${formatText})\nOccasion: ${lead.occasion}\nEstimated total: ${formattedTotal}.\nWe would love to share a sample book preview and confirm your delivery timeline!`;
    window.open(
      `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // Retention actions
  const handleSendBirthdayOffer = (lead: BirthdayClubRecord) => {
    const waNumber = normalizeWhatsAppPhone(lead.whatsapp);
    if (!waNumber) {
      toast.error(
        isAr ? 'رقم الواتساب غير صالح لهذا العضو' : 'WhatsApp number is not valid for this lead'
      );
      return;
    }
    const message = isAr
      ? `مرحباً ${lead.parentName} 🌟 من عائلة بابل فيرس!\nبمناسبة اقتراب عيد ميلاد البطل/ة ${lead.childName} 🎂✨ يسعدنا إهداءكم خصم خاص 15% على قصته المخصصة بالكود: BDAY15\nويمكنكم مشاركة كود الإحالة الخاص بكم (${lead.referralCode}) مع الأصدقاء لخصم إضافي! هل نساعدكم في اختيار القصة المناسبة؟`
      : `Hi ${lead.parentName} 🌟 from Bubbleverse!\nTo celebrate ${lead.childName}'s upcoming birthday 🎂✨ here is your exclusive 15% Birthday Club gift code: BDAY15\nYou can also share your personal referral code (${lead.referralCode}) with friends! Would you like help picking the perfect personalized story?`;
    window.open(
      `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // Filtered lists
  const filteredB2BLeads = useMemo(() => {
    const q = b2bSearch.trim().toLowerCase();
    return b2bLeads.filter((lead) => {
      if (b2bStatusFilter !== 'all' && lead.status !== b2bStatusFilter) return false;
      if (!q) return true;
      return (
        lead.organizationName.toLowerCase().includes(q) ||
        lead.contactName.toLowerCase().includes(q) ||
        lead.reference.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.occasion.toLowerCase().includes(q)
      );
    });
  }, [b2bLeads, b2bStatusFilter, b2bSearch]);

  const filteredBirthdayLeads = useMemo(() => {
    const q = retentionSearch.trim().toLowerCase();
    return birthdayLeads.filter((lead) => {
      if (retentionSourceFilter !== 'all' && lead.source !== retentionSourceFilter) return false;
      if (!q) return true;
      return (
        lead.parentName.toLowerCase().includes(q) ||
        lead.childName.toLowerCase().includes(q) ||
        lead.referralCode.toLowerCase().includes(q) ||
        lead.whatsapp.toLowerCase().includes(q)
      );
    });
  }, [birthdayLeads, retentionSourceFilter, retentionSearch]);

  const tabs: {
    id: GrowthTab;
    icon: typeof Tag;
    labelAr: string;
    labelEn: string;
    count: number;
  }[] = [
    {
      id: 'promos',
      icon: Tag,
      labelAr: 'أكواد الخصم',
      labelEn: 'Promo Codes',
      count: promos.length,
    },
    {
      id: 'b2b',
      icon: Building2,
      labelAr: 'طلبات المدارس والشركات',
      labelEn: 'B2B Quotes CRM',
      count: b2bLeads.length,
    },
    {
      id: 'retention',
      icon: Cake,
      labelAr: 'نادي أعياد الميلاد والهدايا',
      labelEn: 'Retention & Leads',
      count: birthdayLeads.length,
    },
  ];

  return (
    <AdminLayout>
      <div dir={isRTL ? 'rtl' : 'ltr'} className="max-w-[min(100%,108rem)] mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/25 via-purple-500/25 to-pink-500/20 border border-cyan-400/35 flex items-center justify-center shadow-[0_0_24px_rgba(0,217,255,0.2)] shrink-0">
                <TrendingUp className="w-6 h-6 text-cyan-300" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-editorial text-white">
                {isAr ? 'النمو والعروض وإدارة B2B' : 'Growth, Promos & B2B CRM'}
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              {isAr
                ? 'إدارة أكواد الخصم الترويجية، متابعة عروض المدارس والشركات، وتفعيل حملات نادي أعياد الميلاد والإحالات لرفع متوسط قيمة الطلب.'
                : 'Manage promotional codes, track school & corporate bulk quotes, and convert Birthday Club & referral leads to lift AOV.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/schools">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-slate-100 gap-2 px-4 text-xs font-semibold"
              >
                <Building2 className="w-4 h-4 text-purple-300" />
                <span>{isAr ? 'بوابة المدارس' : 'B2B Portal'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-75" />
              </Button>
            </Link>
            <Link to="/club">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-slate-100 gap-2 px-4 text-xs font-semibold"
              >
                <Cake className="w-4 h-4 text-pink-300" />
                <span>{isAr ? 'نادي الهدايا' : 'Gift Club'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-75" />
              </Button>
            </Link>
            <Button
              type="button"
              onClick={() => refreshAllData(true)}
              className="h-10 bubble-btn bubble-btn-secondary gap-2 px-4 text-xs font-bold"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isAr ? 'تحديث البيانات' : 'Refresh'}</span>
            </Button>
          </div>
        </div>

        {/* Top KPI Summary Row (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title={isAr ? 'أكواد الخصم النشطة' : 'Active Promo Codes'}
            value={formatNumber(promoStats.activeCount)}
            secondaryValue={
              isAr ? `من ${formatNumber(promos.length)}` : `of ${formatNumber(promos.length)}`
            }
            icon={Tag}
            accent="cyan"
            badge={
              isAr
                ? `${formatNumber(promoStats.totalUsages)} استخدام`
                : `${formatNumber(promoStats.totalUsages)} uses`
            }
            description={
              isAr
                ? `${formatNumber(orderGrowthStats.promoOrdersCount)} طلبات استخدمت كود خصم`
                : `${formatNumber(orderGrowthStats.promoOrdersCount)} orders redeemed a promo code`
            }
          />

          <StatsCard
            title={isAr ? 'عروض المدارس والشركات المفتوحة' : 'Open B2B Quotes'}
            value={formatNumber(b2bStats.openCount)}
            icon={Building2}
            accent="purple"
            highlight={b2bStats.openCount > 0}
            badge={
              b2bStats.wonCount > 0
                ? isAr
                  ? `${formatNumber(b2bStats.wonCount)} مُغلقة بنجاح`
                  : `${formatNumber(b2bStats.wonCount)} won`
                : isAr
                  ? `${formatNumber(b2bStats.totalOpenBooks)} كتاب`
                  : `${formatNumber(b2bStats.totalOpenBooks)} books`
            }
            description={
              isAr
                ? `قيمة الفرص المفتوحة: ${b2bStats.pipelineSummary}`
                : `Open pipeline: ${b2bStats.pipelineSummary}`
            }
          />

          <StatsCard
            title={isAr ? 'عملاء النادي والهدايا المجانية' : 'Birthday Club & Freebies'}
            value={formatNumber(birthdayLeads.length)}
            icon={Cake}
            accent="pink"
            badge={
              isAr
                ? `${formatNumber(retentionStats.clubCount)} ميلاد · ${formatNumber(retentionStats.certCount)} شهادة`
                : `${formatNumber(retentionStats.clubCount)} bday · ${formatNumber(retentionStats.certCount)} cert`
            }
            description={
              isAr
                ? `${formatNumber(retentionStats.refCount)} إحالة أصدقاء جاهزة للتواصل عبر واتساب`
                : `${formatNumber(retentionStats.refCount)} referral leads ready for WhatsApp outreach`
            }
          />

          <StatsCard
            title={isAr ? 'نسبة الإضافات ومتوسط الطلب (AOV)' : 'Add-on Attach Rate & AOV'}
            value={`${orderGrowthStats.attachmentRate}%`}
            icon={ShoppingBag}
            accent="emerald"
            badge={
              isAr
                ? `${formatNumber(orderGrowthStats.ordersWithAddons)}/${formatNumber(orderGrowthStats.totalValid)} طلب`
                : `${formatNumber(orderGrowthStats.ordersWithAddons)}/${formatNumber(orderGrowthStats.totalValid)} orders`
            }
            description={
              isAr
                ? `متوسط الطلب: ${orderGrowthStats.aovSummary}`
                : `Live AOV: ${orderGrowthStats.aovSummary}`
            }
          />
        </div>

        {/* 3 Clean Tabs Bar */}
        <div
          role="tablist"
          aria-label={isAr ? 'أقسام النمو والعروض' : 'Growth & CRM sections'}
          className="glass-card rounded-3xl p-2 flex flex-wrap gap-2"
        >
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`growth-tab-${tab.id}`}
                aria-selected={isSelected}
                aria-controls={`growth-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[180px] min-h-[44px] px-4 py-2.5 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/15 text-white border-cyan-400/40 shadow-[0_0_24px_rgba(0,217,255,0.16)]'
                    : 'bg-transparent text-slate-300 border-transparent hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`}
                />
                <span className="truncate">{isAr ? tab.labelAr : tab.labelEn}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-numeric border ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/35'
                      : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  {formatNumber(tab.count)}
                </span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PROMO CODES */}
        {activeTab === 'promos' && (
          <div
            role="tabpanel"
            id="growth-panel-promos"
            aria-labelledby="growth-tab-promos"
            className="space-y-6"
          >
            {/* Inline Create New Promo Code Form */}
            <form
              onSubmit={handleCreatePromo}
              className="glass-card rounded-3xl p-5 sm:p-6 space-y-4 border border-cyan-400/20"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {isAr ? 'إنشاء كود خصم جديد' : 'Create New Promo Code'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {isAr
                        ? 'يُفعّل فوراً في سلة التسوق والدفع السريع لمصر والسعودية والإمارات.'
                        : 'Works immediately in Cart & Guest Checkout across Egypt, Saudi Arabia & UAE.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
                <div className="lg:col-span-3 space-y-1.5">
                  <Label htmlFor="promo-code-input" className="text-xs text-slate-200">
                    {isAr ? 'الكود (إنجليزي)' : 'Promo Code'}
                  </Label>
                  <Input
                    id="promo-code-input"
                    dir="ltr"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="SUMMER20"
                    maxLength={24}
                    className="h-11 bg-slate-950/80 border-white/15 focus-visible:border-cyan-400/60 rounded-xl text-white text-sm font-numeric uppercase text-left"
                  />
                </div>

                <div className="lg:col-span-2 space-y-1.5">
                  <Label htmlFor="promo-percent-input" className="text-xs text-slate-200">
                    {isAr ? 'نسبة الخصم %' : 'Discount %'}
                  </Label>
                  <div className="relative" dir="ltr">
                    <Input
                      id="promo-percent-input"
                      type="number"
                      min={1}
                      max={90}
                      value={newPercent}
                      onChange={(e) => setNewPercent(e.target.value)}
                      className="h-11 pe-9 bg-slate-950/80 border-white/15 focus-visible:border-cyan-400/60 rounded-xl text-white text-sm font-numeric text-left"
                    />
                    <Percent className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none" />
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-1.5">
                  <Label htmlFor="promo-label-ar" className="text-xs text-slate-200">
                    {isAr ? 'الوصف بالعربية' : 'Arabic Label'}
                  </Label>
                  <Input
                    id="promo-label-ar"
                    dir="rtl"
                    value={newLabelAr}
                    onChange={(e) => setNewLabelAr(e.target.value)}
                    placeholder="خصم الصيف 20%"
                    className="h-11 bg-slate-950/80 border-white/15 focus-visible:border-cyan-400/60 rounded-xl text-white text-sm"
                  />
                </div>

                <div className="lg:col-span-2 space-y-1.5">
                  <Label htmlFor="promo-label-en" className="text-xs text-slate-200">
                    {isAr ? 'الوصف بالإنجليزية' : 'English Label'}
                  </Label>
                  <Input
                    id="promo-label-en"
                    dir="ltr"
                    value={newLabelEn}
                    onChange={(e) => setNewLabelEn(e.target.value)}
                    placeholder="Summer 20% Off"
                    className="h-11 bg-slate-950/80 border-white/15 focus-visible:border-cyan-400/60 rounded-xl text-white text-sm text-left"
                  />
                </div>

                <div className="lg:col-span-2">
                  <Button
                    type="submit"
                    className="w-full h-11 bubble-btn bubble-btn-primary gap-1.5 text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'إضافة الكود' : 'Add Promo'}</span>
                  </Button>
                </div>
              </div>
            </form>

            {/* Promo Codes List */}
            <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-cyan-300" />
                  <span>{isAr ? 'قائمة أكواد الخصم الحالية' : 'All Promo Codes'}</span>
                </h2>
                <span className="text-xs text-slate-400 font-numeric">
                  {isAr
                    ? `${formatNumber(promoStats.activeCount)} نشط من ${formatNumber(promos.length)}`
                    : `${formatNumber(promoStats.activeCount)} active of ${formatNumber(promos.length)}`}
                </span>
              </div>

              {promos.length === 0 ? (
                <div className="glass-card-inner rounded-2xl py-10 px-6 text-center space-y-2">
                  <Tag className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-sm font-bold text-white">
                    {isAr ? 'لا توجد أكواد خصم حالياً' : 'No promo codes yet'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'استخدم النموذج بالأعلى لإنشاء أول كود خصم ترويجي.'
                      : 'Use the form above to create your first promotional discount code.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {promos.map((promo) => (
                    <div
                      key={promo.id}
                      className={`glass-card-inner rounded-2xl p-4 flex flex-col justify-between gap-4 border transition-colors ${
                        promo.active
                          ? 'border-cyan-400/25 hover:border-cyan-400/45'
                          : 'border-white/10 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              dir="ltr"
                              className="px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 font-extrabold text-sm tracking-wider font-numeric"
                            >
                              {promo.code}
                            </span>
                            <Badge
                              dir="ltr"
                              variant="outline"
                              className="bg-emerald-500/15 text-emerald-200 border-emerald-400/35 font-numeric font-bold text-xs"
                            >
                              -{promo.discountPercent}%
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                promo.active
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30 text-[11px]'
                                  : 'bg-slate-500/15 text-slate-300 border-slate-500/30 text-[11px]'
                              }
                            >
                              {promo.active
                                ? isAr
                                  ? 'نشط'
                                  : 'Active'
                                : isAr
                                  ? 'متوقف'
                                  : 'Paused'}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold text-white truncate">
                            {isAr ? promo.labelAr : promo.labelEn}
                          </p>
                          <p
                            dir={isAr ? 'ltr' : 'rtl'}
                            className={`text-xs text-slate-400 truncate ${isAr ? 'text-right' : 'text-left'}`}
                          >
                            {isAr ? promo.labelEn : promo.labelAr}
                          </p>
                        </div>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopyCode(promo.code)}
                          aria-label={
                            isAr ? `نسخ الكود ${promo.code}` : `Copy promo code ${promo.code}`
                          }
                          className="h-9 w-9 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 shrink-0"
                        >
                          {copiedCode === promo.code ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/10">
                        <div className="flex items-center gap-3 text-xs text-slate-300">
                          <span className="font-numeric font-semibold">
                            {isAr
                              ? `الاستخدامات: ${formatNumber(promo.usageCount || 0)}`
                              : `Used: ${formatNumber(promo.usageCount || 0)}×`}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">{formatDate(promo.createdAt, isAr)}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                              {promo.active
                                ? isAr
                                  ? 'مفعّل'
                                  : 'On'
                                : isAr
                                  ? 'مغلق'
                                  : 'Off'}
                            </span>
                            <Switch
                              checked={promo.active}
                              onCheckedChange={() => handleTogglePromo(promo)}
                              aria-label={
                                isAr
                                  ? `تبديل حالة كود الخصم ${promo.code}`
                                  : `Toggle promo code ${promo.code}`
                              }
                            />
                          </div>

                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeletePromo(promo)}
                            aria-label={
                              isAr ? `حذف كود الخصم ${promo.code}` : `Delete promo code ${promo.code}`
                            }
                            className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/15"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: B2B QUOTES CRM */}
        {activeTab === 'b2b' && (
          <div
            role="tabpanel"
            id="growth-panel-b2b"
            aria-labelledby="growth-tab-b2b"
            className="glass-card rounded-3xl p-5 sm:p-6 space-y-5"
          >
            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                <Input
                  value={b2bSearch}
                  onChange={(e) => setB2bSearch(e.target.value)}
                  placeholder={
                    isAr
                      ? 'ابحث باسم المدرسة أو الشركة أو المرجع أو الهاتف...'
                      : 'Search organization, contact, reference or phone...'
                  }
                  aria-label={isAr ? 'بحث في طلبات B2B' : 'Search B2B quotes'}
                  className="h-10 ps-10 bg-slate-950/80 border-white/15 focus-visible:border-cyan-400/60 rounded-full text-white text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setB2bStatusFilter('all')}
                  className={`h-9 px-3.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    b2bStatusFilter === 'all'
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
                  }`}
                >
                  {isAr ? `الكل (${formatNumber(b2bLeads.length)})` : `All (${formatNumber(b2bLeads.length)})`}
                </button>
                {ALL_B2B_STATUSES.map((status) => {
                  const meta = B2B_STATUS_META[status];
                  const count = b2bLeads.filter((l) => l.status === status).length;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setB2bStatusFilter(status)}
                      className={`h-9 px-3 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                        b2bStatusFilter === status
                          ? meta.badgeClass
                          : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
                      }`}
                    >
                      {isAr ? meta.labelAr : meta.labelEn} ({formatNumber(count)})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* B2B Leads List */}
            {filteredB2BLeads.length === 0 ? (
              <div className="glass-card-inner rounded-2xl py-12 px-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center mx-auto">
                  <Building2 className="w-6 h-6 text-purple-300" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <p className="text-sm font-bold text-white">
                    {b2bLeads.length === 0
                      ? isAr
                        ? 'لا توجد طلبات مدارس أو شركات بعد'
                        : 'No B2B school or corporate quotes yet'
                      : isAr
                        ? 'لا توجد نتائج مطابقة للبحث'
                        : 'No B2B quotes match your filter'}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isAr
                      ? 'أي طلب عرض سعر يُرسل من صفحة المدارس والشركات (/schools) سيظهر هنا تلقائياً مع إجمالي القيمة والتواصل السريع عبر واتساب.'
                      : 'Every quote submitted via the Schools & Corporate portal (/schools) appears here automatically with estimated total and 1-click WhatsApp follow-up.'}
                  </p>
                </div>
                <div className="pt-1">
                  <Link to="/schools">
                    <Button className="bubble-btn bubble-btn-primary h-10 px-5 text-xs font-bold gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>
                        {isAr ? 'فتح حاسبة المدارس والشركات' : 'Open Schools & Corporate Portal'}
                      </span>
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredB2BLeads.map((lead) => {
                  const orgMeta = ORG_TYPE_META[lead.organizationType] ?? ORG_TYPE_META.school;
                  const OrgIcon = orgMeta.icon;
                  const statusMeta = B2B_STATUS_META[lead.status] ?? B2B_STATUS_META.new;
                  const hasValidWa = Boolean(normalizeWhatsAppPhone(lead.phone, lead.country));

                  return (
                    <div
                      key={lead.id}
                      className="glass-card-inner rounded-2xl p-4 sm:p-5 space-y-4 border border-white/10 hover:border-purple-400/35 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              dir="ltr"
                              className="font-numeric font-extrabold text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-300"
                            >
                              {lead.reference}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-xs font-semibold border gap-1.5 ${orgMeta.badgeClass}`}
                            >
                              <OrgIcon className="w-3.5 h-3.5" />
                              <span>{isAr ? orgMeta.labelAr : orgMeta.labelEn}</span>
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs font-semibold border ${statusMeta.badgeClass}`}
                            >
                              {isAr ? statusMeta.labelAr : statusMeta.labelEn}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="bg-white/5 text-slate-200 border-white/15 text-[11px] font-numeric"
                            >
                              {lead.country}
                            </Badge>
                          </div>

                          <h3 className="text-base font-extrabold text-white">
                            {lead.organizationName}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                            <span>
                              {isAr ? 'المسؤول:' : 'Contact:'}{' '}
                              <strong className="text-white">{lead.contactName}</strong>
                            </span>
                            <span className="text-slate-600">•</span>
                            <span dir="ltr" className="font-numeric text-cyan-200">
                              {lead.phone}
                            </span>
                            {lead.email && (
                              <>
                                <span className="text-slate-600">•</span>
                                <span dir="ltr" className="text-slate-400">
                                  {lead.email}
                                </span>
                              </>
                            )}
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400">
                              {formatDate(lead.createdAt, isAr)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                            <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-200">
                              {isAr ? 'المناسبة:' : 'Occasion:'} <strong>{lead.occasion}</strong>
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-200">
                              {lead.format === 'hardcover_book'
                                ? isAr
                                  ? 'غلاف فاخر مطبوع'
                                  : 'Hardcover Print'
                                : isAr
                                  ? 'نسخة رقمية PDF'
                                  : 'Digital PDF'}
                            </span>
                          </div>

                          {lead.notes && (
                            <p className="text-xs text-slate-400 bg-slate-950/50 border border-white/5 rounded-xl px-3 py-2 leading-relaxed">
                              {lead.notes}
                            </p>
                          )}
                        </div>

                        {/* Right / End Metrics + Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 shrink-0 lg:min-w-[230px]">
                          <div className="flex items-baseline gap-2.5 lg:text-end">
                            <div>
                              <p className="text-[11px] text-slate-400">
                                {isAr
                                  ? `${formatNumber(lead.quantity)} كتاب • التقدير الإجمالي`
                                  : `${formatNumber(lead.quantity)} books • Est. Total`}
                              </p>
                              <p className="text-xl font-extrabold text-emerald-300 font-numeric">
                                {formatMoney(lead.estimatedTotal, lead.currency, isAr)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Select
                              value={lead.status}
                              onValueChange={(value) =>
                                handleB2BStatusChange(lead, value as B2BLeadStatus)
                              }
                            >
                              <SelectTrigger
                                aria-label={
                                  isAr
                                    ? `تغيير حالة العرض ${lead.reference}`
                                    : `Change status for ${lead.reference}`
                                }
                                className="h-10 w-[145px] rounded-full bg-slate-950/80 border-white/15 text-xs text-white"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0d1326] border-white/15 text-white">
                                {ALL_B2B_STATUSES.map((status) => (
                                  <SelectItem
                                    key={status}
                                    value={status}
                                    className="text-xs focus:bg-white/10 focus:text-white"
                                  >
                                    {isAr
                                      ? B2B_STATUS_META[status].labelAr
                                      : B2B_STATUS_META[status].labelEn}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Button
                              type="button"
                              disabled={!hasValidWa}
                              onClick={() => handleB2BWhatsAppFollowUp(lead)}
                              className="h-10 px-4 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold gap-2"
                            >
                              <MessageCircle className="w-4 h-4 shrink-0" />
                              <span>
                                {isAr ? 'متابعة عبر واتساب' : 'Follow-up on WhatsApp'}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RETENTION & BIRTHDAY CLUB LEADS */}
        {activeTab === 'retention' && (
          <div
            role="tabpanel"
            id="growth-panel-retention"
            aria-labelledby="growth-tab-retention"
            className="glass-card rounded-3xl p-5 sm:p-6 space-y-5"
          >
            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
                <Input
                  value={retentionSearch}
                  onChange={(e) => setRetentionSearch(e.target.value)}
                  placeholder={
                    isAr
                      ? 'ابحث باسم الطفل أو ولي الأمر أو كود الإحالة أو الواتساب...'
                      : 'Search child name, parent, referral code or WhatsApp...'
                  }
                  aria-label={isAr ? 'بحث في عملاء النادي' : 'Search retention leads'}
                  className="h-10 ps-10 bg-slate-950/80 border-white/15 focus-visible:border-cyan-400/60 rounded-full text-white text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRetentionSourceFilter('all')}
                  className={`h-9 px-3.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                    retentionSourceFilter === 'all'
                      ? 'bg-pink-500/20 text-pink-200 border-pink-400/40'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
                  }`}
                >
                  {isAr
                    ? `الكل (${formatNumber(birthdayLeads.length)})`
                    : `All (${formatNumber(birthdayLeads.length)})`}
                </button>
                {(Object.keys(SOURCE_META) as BirthdayClubSource[]).map((source) => {
                  const meta = SOURCE_META[source];
                  const count = birthdayLeads.filter((l) => l.source === source).length;
                  return (
                    <button
                      key={source}
                      type="button"
                      onClick={() => setRetentionSourceFilter(source)}
                      className={`h-9 px-3 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                        retentionSourceFilter === source
                          ? meta.badgeClass
                          : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
                      }`}
                    >
                      {isAr ? meta.labelAr : meta.labelEn} ({formatNumber(count)})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Retention Leads List */}
            {filteredBirthdayLeads.length === 0 ? (
              <div className="glass-card-inner rounded-2xl py-12 px-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-pink-500/15 border border-pink-400/30 flex items-center justify-center mx-auto">
                  <Cake className="w-6 h-6 text-pink-300" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <p className="text-sm font-bold text-white">
                    {birthdayLeads.length === 0
                      ? isAr
                        ? 'لا يوجد مشتركين في نادي أعياد الميلاد بعد'
                        : 'No Birthday Club or freebie leads yet'
                      : isAr
                        ? 'لا توجد نتائج مطابقة للبحث'
                        : 'No leads match your filter'}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isAr
                      ? 'كل ولي أمر يسجل في نادي أعياد الميلاد أو يُحمّل شهادة البطل المجانية (/club) سيظهر هنا مع تاريخ الميلاد وكود الإحالة وزر إرسال عرض عيد الميلاد.'
                      : 'Every parent joining the Birthday Club or downloading the Free Hero Certificate (/club) appears here with birthday, referral code, and 1-click WhatsApp offer.'}
                  </p>
                </div>
                <div className="pt-1">
                  <Link to="/club">
                    <Button className="bubble-btn bubble-btn-primary h-10 px-5 text-xs font-bold gap-2">
                      <Cake className="w-4 h-4" />
                      <span>
                        {isAr ? 'فتح نادي الهدايا والشهادة' : 'Open Gift Club & Free Certificate'}
                      </span>
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {filteredBirthdayLeads.map((lead) => {
                  const sourceMeta = SOURCE_META[lead.source] ?? SOURCE_META.birthday_club;
                  const SourceIcon = sourceMeta.icon;
                  const hasValidWa = Boolean(normalizeWhatsAppPhone(lead.whatsapp));

                  return (
                    <div
                      key={lead.id}
                      className="glass-card-inner rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 border border-white/10 hover:border-pink-400/35 transition-colors"
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs font-semibold border gap-1.5 ${sourceMeta.badgeClass}`}
                          >
                            <SourceIcon className="w-3.5 h-3.5" />
                            <span>{isAr ? sourceMeta.labelAr : sourceMeta.labelEn}</span>
                          </Badge>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(lead.createdAt, isAr)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div>
                            <p className="text-xs text-slate-400">
                              {isAr ? 'البطل / الطفل' : 'Hero Child'}
                            </p>
                            <h3 className="text-base font-extrabold text-white">
                              {lead.childName || '—'}
                            </h3>
                          </div>
                          <div className="text-end">
                            <p className="text-xs text-slate-400">
                              {isAr ? 'ولي الأمر' : 'Parent'}
                            </p>
                            <p className="text-sm font-semibold text-slate-200">
                              {lead.parentName || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-pink-200">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {isAr ? 'عيد الميلاد:' : 'Birthday:'}{' '}
                              <strong>{formatBirthdayDisplay(lead.childBirthday, isAr)}</strong>
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopyCode(lead.referralCode)}
                            aria-label={
                              isAr
                                ? `نسخ كود الإحالة ${lead.referralCode}`
                                : `Copy referral code ${lead.referralCode}`
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-200 hover:bg-purple-500/25 transition-colors cursor-pointer font-numeric"
                          >
                            <span dir="ltr">{lead.referralCode}</span>
                            {copiedCode === lead.referralCode ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/10">
                        <span dir="ltr" className="text-xs font-numeric text-slate-300">
                          {lead.whatsapp || '—'}
                        </span>

                        <Button
                          type="button"
                          disabled={!hasValidWa}
                          onClick={() => handleSendBirthdayOffer(lead)}
                          className="h-9 px-4 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold gap-2"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" />
                          <span>
                            {isAr
                              ? 'إرسال عرض عيد الميلاد عبر واتساب'
                              : 'Send Birthday Offer on WhatsApp'}
                          </span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminGrowth;
