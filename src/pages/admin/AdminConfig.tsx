import { useRef, useState } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  Phone,
  CreditCard,
  Shield,
  Truck,
  Database,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Sparkles,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import {
  getStoreConfig,
  saveStoreConfig,
  exportAllStoreData,
  importAllStoreData,
  getOrders,
  getCatalogStories,
  listStudioDrafts,
  getPromoCodes,
  getB2BLeads,
  getBirthdayClubLeads,
  getMerchCatalog,
  getGwpConfig,
  type StoreConfigRecord,
  type UaePaymentDetails,
} from '@/lib/localStore';
import { getShowcaseConfig } from '@/lib/showcaseConfig';

interface BackupFeedback {
  type: 'success' | 'error';
  message: string;
}

const DEFAULT_UAE_PAYMENT: UaePaymentDetails = {
  applePayEnabled: true,
  tabbyEnabled: true,
  bankIban: 'AE000000000000000000000',
};

function readLocalSummary() {
  return {
    ordersCount: getOrders().length,
    catalogCount: getCatalogStories().length,
    draftsCount: listStudioDrafts().length,
    heroSlidesCount: getShowcaseConfig().heroBooks.length,
    promoCodesCount: getPromoCodes().length,
    b2bLeadsCount: getB2BLeads().length,
    birthdayLeadsCount: getBirthdayClubLeads().length,
    merchCount: getMerchCatalog().length,
    gwpEnabled: getGwpConfig().enabled,
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateBackupPayload(rawJson: string): {
  valid: boolean;
  sectionsCount: number;
  version: string;
} {
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!isPlainRecord(parsed)) {
      return { valid: false, sectionsCount: 0, version: '' };
    }
    const obj = parsed;
    let sectionsCount = 0;
    if (isPlainRecord(obj.config)) {
      sectionsCount += 1;
    }
    if (Array.isArray(obj.orders)) {
      sectionsCount += 1;
    }
    if (Array.isArray(obj.catalog)) {
      sectionsCount += 1;
    }
    if (isPlainRecord(obj.showcase)) {
      sectionsCount += 1;
    }
    if (Array.isArray(obj.studioDrafts) || isPlainRecord(obj.studioDrafts)) {
      sectionsCount += 1;
    }
    if (Array.isArray(obj.promoCodes)) {
      sectionsCount += 1;
    }
    if (Array.isArray(obj.b2bLeads)) {
      sectionsCount += 1;
    }
    if (Array.isArray(obj.birthdayClubLeads)) {
      sectionsCount += 1;
    }
    if (Array.isArray(obj.merchCatalog)) {
      sectionsCount += 1;
    }
    if (isPlainRecord(obj.gwpConfig)) {
      sectionsCount += 1;
    }
    if (isPlainRecord(obj.integrations)) {
      sectionsCount += 1;
    }
    const version = typeof obj.version === 'string' ? obj.version : '2.0';
    return { valid: sectionsCount > 0, sectionsCount, version };
  } catch {
    return { valid: false, sectionsCount: 0, version: '' };
  }
}

export default function AdminConfig() {
  const { isRTL } = useLanguage();
  const [config, setConfig] = useState<StoreConfigRecord>(() => getStoreConfig());
  const [summary, setSummary] = useState(() => readLocalSummary());
  const [showPasscode, setShowPasscode] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<BackupFeedback | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const uaePayment: UaePaymentDetails = {
    ...DEFAULT_UAE_PAYMENT,
    ...(config.uaePaymentDetails ?? {}),
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = config.whatsappPhone.trim();
    const clampedDeposit = Math.min(100, Math.max(10, Math.round(config.depositPercentage || 50)));
    const clampedThreshold = Math.min(
      10,
      Math.max(1, Math.round(config.freeShippingThreshold || 2))
    );
    const cleanedPasscode = config.adminPasscode.trim() || 'admin123';

    const updated = saveStoreConfig({
      ...config,
      whatsappPhone: cleanedPhone,
      uaePaymentDetails: {
        applePayEnabled: Boolean(uaePayment.applePayEnabled),
        tabbyEnabled: Boolean(uaePayment.tabbyEnabled),
        bankIban: uaePayment.bankIban.trim(),
      },
      depositPercentage: clampedDeposit,
      freeShippingThreshold: clampedThreshold,
      adminPasscode: cleanedPasscode,
    });
    setConfig(updated);
    toast.success(
      isRTL
        ? 'تم حفظ إعدادات المتجر بنجاح! تم تحديث روابط واتساب وبيانات الدفع لمصر والسعودية والإمارات فوراً.'
        : 'Store settings saved! Live checkout & payment details updated for EG, SA & UAE.'
    );
  };

  const handleDownloadBackup = () => {
    const json = exportAllStoreData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `bubbleverse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    const msg = isRTL
      ? 'تم تنزيل النسخة الاحتياطية الكاملة v2.2 بنجاح (الطلبات، الكتالوج، الأكواد، عروض B2B، نادي أعياد الميلاد، منتجات باب، إعدادات هدية باب، الواجهة ومسودات الاستوديو).'
      : 'Full backup v2.2 downloaded (orders, catalog, promos, B2B & birthday leads, merch SKUs, Free Bub GWP config, showcase, studio drafts & settings).';
    setBackupFeedback({ type: 'success', message: msg });
    toast.success(isRTL ? 'تم تنزيل النسخة الاحتياطية بنجاح!' : 'Full store backup v2.2 downloaded!');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const validation = validateBackupPayload(content);

      if (!validation.valid) {
        const errorMsg = isRTL
          ? 'ملف النسخة الاحتياطية غير صالح أو لا يحتوي على بيانات بابل فيرس معتمدة.'
          : 'Invalid backup file. Please select a valid Bubbleverse JSON backup.';
        setBackupFeedback({ type: 'error', message: errorMsg });
        toast.error(errorMsg);
        return;
      }

      const ok = importAllStoreData(content);
      if (ok) {
        setConfig(getStoreConfig());
        setSummary(readLocalSummary());
        const successMsg = isRTL
          ? `تمت استعادة البيانات بنجاح (إصدار v${validation.version} • ${validation.sectionsCount} أقسام) مع الحفاظ على المفاتيح السرية المحلية.`
          : `Store data restored successfully (v${validation.version} • ${validation.sectionsCount} sections) while preserving local secrets.`;
        setBackupFeedback({ type: 'success', message: successMsg });
        toast.success(
          isRTL
            ? 'تمت استعادة النسخة الاحتياطية بنجاح!'
            : 'Store data restored successfully!'
        );
      } else {
        const failMsg = isRTL
          ? 'تعذّرت قراءة ملف النسخة الاحتياطية. يرجى التحقق من سلامة الملف.'
          : 'Failed to restore backup JSON file. Please check file integrity.';
        setBackupFeedback({ type: 'error', message: failMsg });
        toast.error(failMsg);
      }
    };

    reader.onerror = () => {
      const readErr = isRTL
        ? 'حدث خطأ أثناء قراءة الملف من جهازك.'
        : 'Could not read the selected file from your device.';
      setBackupFeedback({ type: 'error', message: readErr });
      toast.error(readErr);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const formatNum = (val: number) => val.toLocaleString('en-US');

  return (
    <AdminLayout>
      <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 max-w-[min(100%,108rem)] mx-auto">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-editorial flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400/20 via-purple-500/20 to-pink-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
              <Settings className="w-6 h-6 text-cyan-300" />
            </span>
            <span>
              {isRTL ? 'إعدادات المتجر والنسخ الاحتياطي' : 'Store Settings & Backup Center'}
            </span>
          </h1>
          <p className="text-sm text-slate-400">
            {isRTL
              ? 'إدارة رقم واتساب الطلبات، سياسة العربون والشحن، حسابات الدفع لمصر والسعودية والإمارات، رمز الدخول والنسخ الاحتياطي الكامل v2.2.'
              : 'Manage your WhatsApp order number, deposit & shipping policies, Egypt, Saudi & UAE payment details, admin passcode, and full local backups (v2.2).'}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* WhatsApp & Order Policies */}
          <section className="glass-card rounded-3xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isRTL ? 'واتساب وسياسات الطلبات' : 'WhatsApp & Order Policies'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isRTL
                    ? 'تُستخدم مباشرة في سلة المشتريات ورسائل تأكيد الطلب.'
                    : 'Applied live across checkout summaries and WhatsApp order links.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="store-whatsapp-phone"
                  className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <Phone className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>
                    {isRTL ? 'رقم واتساب الطلبات (دولي)' : 'WhatsApp Order Number (Intl)'}
                  </span>
                </label>
                <Input
                  id="store-whatsapp-phone"
                  dir="ltr"
                  value={config.whatsappPhone}
                  onChange={(e) => setConfig({ ...config, whatsappPhone: e.target.value })}
                  placeholder="201000000000"
                  className="bg-slate-950/75 border-white/15 focus-visible:border-cyan-400/60 text-white font-numeric rounded-xl h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="store-deposit-pct"
                  className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <Percent className="w-4 h-4 text-cyan-300 shrink-0" />
                  <span>{isRTL ? 'نسبة العربون المطلوبة (%)' : 'Deposit Percentage (%)'}</span>
                </label>
                <Input
                  id="store-deposit-pct"
                  type="number"
                  min={10}
                  max={100}
                  dir="ltr"
                  value={config.depositPercentage}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      depositPercentage: Number(e.target.value) || 50,
                    })
                  }
                  className="bg-slate-950/75 border-white/15 focus-visible:border-cyan-400/60 text-white font-numeric rounded-xl h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="store-free-shipping"
                  className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>
                    {isRTL ? 'حد الشحن المجاني (عدد الكتب)' : 'Free Shipping Threshold (Books)'}
                  </span>
                </label>
                <Input
                  id="store-free-shipping"
                  type="number"
                  min={1}
                  max={10}
                  dir="ltr"
                  value={config.freeShippingThreshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      freeShippingThreshold: Number(e.target.value) || 2,
                    })
                  }
                  className="bg-slate-950/75 border-white/15 focus-visible:border-cyan-400/60 text-white font-numeric rounded-xl h-11"
                />
              </div>
            </div>
          </section>

          {/* Manual Deposit Payment Handles */}
          <section className="glass-card rounded-3xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isRTL ? 'حسابات التحويل اليدوي للعربون' : 'Manual Deposit Payment Handles'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isRTL
                    ? 'تظهر للعملاء تلقائياً حسب الدولة المختارة عند إتمام الطلب.'
                    : 'Displayed to customers automatically based on their selected country at checkout.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Egypt */}
              <div className="glass-card-inner rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-cyan-300">
                    {isRTL ? 'مصر (الجنيه المصري)' : 'Egypt (EGP)'}
                  </h3>
                  <span className="text-[11px] font-semibold font-numeric px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-400/30">
                    {isRTL ? 'ج.م' : 'EGP'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="eg-instapay"
                    className="text-xs font-medium text-slate-300 block"
                  >
                    {isRTL ? 'عنوان إنستا باي' : 'InstaPay Address'}
                  </label>
                  <Input
                    id="eg-instapay"
                    dir="ltr"
                    value={config.egyptPaymentDetails.instapayUsername}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        egyptPaymentDetails: {
                          ...config.egyptPaymentDetails,
                          instapayUsername: e.target.value,
                        },
                      })
                    }
                    className="bg-slate-950/80 border-white/15 focus-visible:border-cyan-400/60 text-white text-sm rounded-xl h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="eg-vodafone"
                    className="text-xs font-medium text-slate-300 block"
                  >
                    {isRTL ? 'رقم محفظة فودافون كاش' : 'Vodafone Cash Number'}
                  </label>
                  <Input
                    id="eg-vodafone"
                    dir="ltr"
                    value={config.egyptPaymentDetails.vodafoneCashNumber}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        egyptPaymentDetails: {
                          ...config.egyptPaymentDetails,
                          vodafoneCashNumber: e.target.value,
                        },
                      })
                    }
                    className="bg-slate-950/80 border-white/15 focus-visible:border-cyan-400/60 text-white text-sm font-numeric rounded-xl h-10"
                  />
                </div>
              </div>

              {/* Saudi Arabia */}
              <div className="glass-card-inner rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-purple-300">
                    {isRTL ? 'السعودية (الريال السعودي)' : 'Saudi Arabia (SAR)'}
                  </h3>
                  <span className="text-[11px] font-semibold font-numeric px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-200 border border-purple-400/30">
                    {isRTL ? 'ر.س' : 'SAR'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="sa-stcpay"
                    className="text-xs font-medium text-slate-300 block"
                  >
                    {isRTL ? 'رقم إس تي سي باي' : 'STC Pay Number'}
                  </label>
                  <Input
                    id="sa-stcpay"
                    dir="ltr"
                    value={config.saudiPaymentDetails.stcPayNumber}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        saudiPaymentDetails: {
                          ...config.saudiPaymentDetails,
                          stcPayNumber: e.target.value,
                        },
                      })
                    }
                    className="bg-slate-950/80 border-white/15 focus-visible:border-purple-400/60 text-white text-sm font-numeric rounded-xl h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="sa-iban"
                    className="text-xs font-medium text-slate-300 block"
                  >
                    {isRTL ? 'رقم الآيبان البنكي / مدى' : 'Mada / Bank IBAN'}
                  </label>
                  <Input
                    id="sa-iban"
                    dir="ltr"
                    value={config.saudiPaymentDetails.madaIban}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        saudiPaymentDetails: {
                          ...config.saudiPaymentDetails,
                          madaIban: e.target.value,
                        },
                      })
                    }
                    className="bg-slate-950/80 border-white/15 focus-visible:border-purple-400/60 text-white text-sm font-numeric rounded-xl h-10"
                  />
                </div>
              </div>

              {/* UAE */}
              <div className="glass-card-inner rounded-2xl p-4 sm:p-5 space-y-3.5 border-pink-400/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-pink-300">
                    {isRTL ? 'الإمارات (الدرهم الإماراتي)' : 'UAE (AED)'}
                  </h3>
                  <span className="text-[11px] font-semibold font-numeric px-2.5 py-0.5 rounded-full bg-pink-500/15 text-pink-200 border border-pink-400/30">
                    {isRTL ? 'د.إ' : 'AED'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 py-1">
                  <label
                    htmlFor="ae-apple-pay"
                    className="text-xs font-medium text-slate-200 cursor-pointer"
                  >
                    {isRTL ? 'تفعيل Apple Pay' : 'Apple Pay Enabled'}
                  </label>
                  <Switch
                    id="ae-apple-pay"
                    dir="ltr"
                    checked={uaePayment.applePayEnabled}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        uaePaymentDetails: {
                          ...uaePayment,
                          applePayEnabled: checked,
                        },
                      })
                    }
                    className="data-[state=checked]:bg-pink-500 data-[state=unchecked]:bg-slate-700"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 py-1">
                  <label
                    htmlFor="ae-tabby"
                    className="text-xs font-medium text-slate-200 cursor-pointer"
                  >
                    {isRTL ? 'تفعيل Tabby / Tamara (تقسيط)' : 'Tabby / Tamara BNPL'}
                  </label>
                  <Switch
                    id="ae-tabby"
                    dir="ltr"
                    checked={uaePayment.tabbyEnabled}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        uaePaymentDetails: {
                          ...uaePayment,
                          tabbyEnabled: checked,
                        },
                      })
                    }
                    className="data-[state=checked]:bg-pink-500 data-[state=unchecked]:bg-slate-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="ae-iban"
                    className="text-xs font-medium text-slate-300 block"
                  >
                    {isRTL ? 'رقم الآيبان البنكي الإماراتي' : 'UAE Bank IBAN'}
                  </label>
                  <Input
                    id="ae-iban"
                    dir="ltr"
                    value={uaePayment.bankIban}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        uaePaymentDetails: {
                          ...uaePayment,
                          bankIban: e.target.value,
                        },
                      })
                    }
                    placeholder="AE000000000000000000000"
                    className="bg-slate-950/80 border-white/15 focus-visible:border-pink-400/60 text-white text-sm font-numeric rounded-xl h-10"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Admin Access Passcode */}
          <section className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isRTL ? 'رمز الدخول للوحة الإدارة' : 'Admin Access Passcode'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isRTL
                    ? 'الرمز المحلي المستخدم لفتح بوابة الإدارة على هذا المتصفح.'
                    : 'Local passcode required to unlock the admin dashboard on this device.'}
                </p>
              </div>
            </div>

            <div className="max-w-md space-y-1.5">
              <label
                htmlFor="admin-passcode-input"
                className="text-xs font-semibold text-slate-200 block"
              >
                {isRTL ? 'رمز الحماية الحالي' : 'Current Access Passcode'}
              </label>
              <div dir="ltr" className="relative flex items-center">
                <Input
                  id="admin-passcode-input"
                  type={showPasscode ? 'text' : 'password'}
                  value={config.adminPasscode}
                  onChange={(e) => setConfig({ ...config, adminPasscode: e.target.value })}
                  autoComplete="off"
                  className="bg-slate-950/80 border-white/15 focus-visible:border-amber-400/60 text-white font-numeric rounded-xl h-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode((prev) => !prev)}
                  aria-label={
                    showPasscode
                      ? isRTL
                        ? 'إخفاء رمز الدخول'
                        : 'Hide passcode'
                      : isRTL
                        ? 'إظهار رمز الدخول'
                        : 'Show passcode'
                  }
                  className="absolute right-2 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bubble-btn bubble-btn-primary h-11 px-8 text-sm font-bold gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isRTL ? 'حفظ إعدادات المتجر' : 'Save Store Settings'}</span>
            </Button>
          </div>
        </form>

        {/* Complete Local Backup & Restore Center */}
        <section className="glass-card rounded-3xl p-5 sm:p-6 space-y-5 border-purple-400/25">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center shrink-0 mt-0.5">
                <Database className="w-5 h-5 text-purple-300" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>
                    {isRTL
                      ? 'مركز النسخ الاحتياطي والاستعادة المحلي'
                      : 'Complete Local Backup & Restore Center'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  {isRTL
                    ? 'صدّر نسخة احتياطية شاملة (إصدار v2.2) للطلبات والكتالوج وأكواد الخصم وعروض B2B ونادي أعياد الميلاد ومنتجات باب وإعدادات هدية باب والواجهة ومسودات الاستوديو، أو استعد بياناتك بأمان مع دعم الإصدارات السابقة v2.0/v2.1.'
                    : 'Download a full Backup v2.2 snapshot of orders, story catalog, promo codes, B2B & birthday leads, merch SKUs, Free Bub GWP config, showcase, studio drafts & settings, or restore v2.0–v2.2 JSON backups safely.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold font-numeric bg-purple-500/15 text-purple-200 border border-purple-400/30">
                v2.2
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-200 border border-cyan-400/25">
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>{isRTL ? 'يحمي المفاتيح السرية تلقائياً' : 'Secrets Protected'}</span>
              </span>
            </div>
          </div>

          {/* Live Included Data Snapshot (Backup v2.2) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                label: isRTL ? 'الطلبات المحفوظة' : 'Orders',
                value: formatNum(summary.ordersCount),
                accent: 'text-white',
              },
              {
                label: isRTL ? 'قصص الكتالوج' : 'Catalog Stories',
                value: formatNum(summary.catalogCount),
                accent: 'text-white',
              },
              {
                label: isRTL ? 'أكواد الخصم' : 'Promo Codes',
                value: formatNum(summary.promoCodesCount),
                accent: 'text-cyan-200',
              },
              {
                label: isRTL ? 'عروض B2B والمدارس' : 'B2B Leads',
                value: formatNum(summary.b2bLeadsCount),
                accent: 'text-purple-200',
              },
              {
                label: isRTL ? 'نادي أعياد الميلاد' : 'Birthday Club Leads',
                value: formatNum(summary.birthdayLeadsCount),
                accent: 'text-pink-200',
              },
              {
                label: isRTL ? 'منتجات باب (SKUs)' : 'Merch Catalog SKUs',
                value: formatNum(summary.merchCount),
                accent: 'text-cyan-300',
              },
              {
                label: isRTL ? 'هدية باب المجانية (GWP)' : 'Free Bub GWP',
                value: summary.gwpEnabled
                  ? isRTL
                    ? 'مفعّلة (ON)'
                    : 'ON'
                  : isRTL
                    ? 'متوقفة (OFF)'
                    : 'OFF',
                accent: summary.gwpEnabled ? 'text-emerald-300' : 'text-slate-400',
              },
              {
                label: isRTL ? 'شرائح العرض الرئيسية' : 'Hero Slides',
                value: formatNum(summary.heroSlidesCount),
                accent: 'text-white',
              },
              {
                label: isRTL ? 'مسودات الاستوديو' : 'Studio Drafts',
                value: formatNum(summary.draftsCount),
                accent: 'text-white',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="glass-card-inner rounded-2xl px-4 py-3 flex flex-col gap-0.5"
              >
                <span className="text-[11px] text-slate-400">{item.label}</span>
                <span className={`text-lg font-extrabold font-numeric ${item.accent}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {backupFeedback && (
            <div
              role="status"
              className={`rounded-2xl px-4 py-3 text-xs font-medium flex items-start gap-2.5 border ${
                backupFeedback.type === 'success'
                  ? 'bg-emerald-500/12 border-emerald-400/35 text-emerald-200'
                  : 'bg-rose-500/12 border-rose-400/35 text-rose-200'
              }`}
            >
              {backupFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
              )}
              <span>{backupFeedback.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleDownloadBackup}
              className="bubble-btn bubble-btn-primary h-10 px-5 text-xs font-bold gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{isRTL ? 'تنزيل النسخة الاحتياطية الكاملة' : 'Download Full JSON Backup'}</span>
            </Button>

            <input
              ref={restoreInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => restoreInputRef.current?.click()}
              className="bubble-btn bubble-btn-outline h-10 px-5 text-xs font-bold gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isRTL ? 'استعادة من ملف نسخة احتياطية' : 'Restore From JSON File'}</span>
            </Button>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
