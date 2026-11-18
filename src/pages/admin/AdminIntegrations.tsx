import { useMemo, useState } from 'react';
import {
  Plug,
  Sparkles,
  CreditCard,
  MessageSquare,
  BarChart2,
  Truck,
  Eye,
  EyeOff,
  Copy,
  Check,
  Save,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Globe,
  Webhook,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/hooks/useLanguage';
import {
  getIntegrationsConfig,
  saveIntegrationsConfig,
  type AiProviderKey,
  type ApiIntegrationsRecord,
  type PaymentGatewayMode,
} from '@/lib/localStore';

type IntegrationTab = 'ai' | 'payments' | 'messaging' | 'analytics' | 'shipping';

interface ProviderOption {
  key: AiProviderKey;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  models: string[];
  defaultModel: string;
  keyHint: string;
}

const AI_PROVIDERS: ProviderOption[] = [
  {
    key: 'gemini',
    labelAr: 'جوجل جيميني',
    labelEn: 'Google Gemini',
    descAr: 'مثالي لكتابة القصص العربية والإنجليزية وتوليد الصور المتناسقة',
    descEn: 'Ideal for bilingual storytelling and consistent storybook art',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'imagen-3.0-generate-002'],
    defaultModel: 'gemini-2.5-flash',
    keyHint: 'AIza...',
  },
  {
    key: 'nano_banana',
    labelAr: 'نانو بنانا',
    labelEn: 'Nano Banana',
    descAr: 'محرك رسم الشخصيات وثبات ملامح الطفل في كل صفحة',
    descEn: 'Character consistency engine for child likeness across spreads',
    models: ['nano-banana-pro', 'nano-banana-fast', 'gemini-2.5-flash-image'],
    defaultModel: 'nano-banana-pro',
    keyHint: 'nb_live_... / AIza...',
  },
  {
    key: 'openai',
    labelAr: 'أوبن إيه آي',
    labelEn: 'OpenAI',
    descAr: 'نماذج النصوص والرسومات التوضيحية عالية الدقة',
    descEn: 'High-fidelity narrative and illustration generation models',
    models: ['gpt-4o', 'gpt-4.1', 'gpt-image-1'],
    defaultModel: 'gpt-image-1',
    keyHint: 'sk-...',
  },
  {
    key: 'flux',
    labelAr: 'ريبليكيت فلكس',
    labelEn: 'Replicate / Flux',
    descAr: 'نماذج Flux الاحترافية لرسوم الكتب ثلاثية الأبعاد والألوان المائية',
    descEn: 'Flux Pro & LoRA models for 3D Pixar and watercolor illustrations',
    models: ['black-forest-labs/flux-1.1-pro', 'black-forest-labs/flux-dev', 'black-forest-labs/flux-schnell'],
    defaultModel: 'black-forest-labs/flux-1.1-pro',
    keyHint: 'r8_...',
  },
  {
    key: 'custom',
    labelAr: 'نقطة اتصال مخصصة',
    labelEn: 'Custom Endpoint',
    descAr: 'ربط خادم خاص أو بوابة API متوافقة مع OpenAI',
    descEn: 'Connect your own inference server or OpenAI-compatible gateway',
    models: ['custom-story-model'],
    defaultModel: 'custom-story-model',
    keyHint: 'Bearer token / API key',
  },
];

interface MaskedInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  showLabel: string;
  hideLabel: string;
}

function MaskedSecretInput({
  id,
  value,
  onChange,
  placeholder,
  showLabel,
  hideLabel,
}: MaskedInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div dir="ltr" className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="h-11 pe-11 bg-slate-950/80 border-white/15 focus-visible:border-cyan-400/60 rounded-xl text-white text-sm font-numeric text-left"
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? hideLabel : showLabel}
        className="absolute top-1/2 -translate-y-1/2 end-2 p-2 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

interface StatusPillProps {
  enabled: boolean;
  configured: boolean;
  mode?: PaymentGatewayMode;
  isAr: boolean;
}

function StatusPill({ enabled, configured, mode, isAr }: StatusPillProps) {
  if (enabled && configured) {
    if (mode === 'sandbox') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-400/35 text-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{isAr ? 'وضع تجريبي' : 'Sandbox'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-400/35 text-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span>{mode === 'live' ? (isAr ? 'مباشر ومفعّل' : 'Live Active') : isAr ? 'مفعّل' : 'Active'}</span>
      </span>
    );
  }

  if (configured) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-400/35 text-cyan-200">
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        <span>{isAr ? 'تم الإعداد' : 'Configured'}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-slate-400">
      <span className="w-2 h-2 rounded-full bg-slate-500" />
      <span>{isAr ? 'غير مُعدّ' : 'Not Configured'}</span>
    </span>
  );
}

interface ModeToggleProps {
  mode: PaymentGatewayMode;
  onChange: (mode: PaymentGatewayMode) => void;
  isAr: boolean;
}

function GatewayModeToggle({ mode, onChange, isAr }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center p-1 rounded-full bg-slate-950/90 border border-white/10">
      <button
        type="button"
        onClick={() => onChange('sandbox')}
        className={`h-8 px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          mode === 'sandbox'
            ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        {isAr ? 'تجريبي' : 'Sandbox'}
      </button>
      <button
        type="button"
        onClick={() => onChange('live')}
        className={`h-8 px-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
          mode === 'live'
            ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        {isAr ? 'مباشر' : 'Live'}
      </button>
    </div>
  );
}

export default function AdminIntegrations() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [config, setConfig] = useState<ApiIntegrationsRecord>(() => getIntegrationsConfig());
  const [activeTab, setActiveTab] = useState<IntegrationTab>('ai');
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [checkResults, setCheckResults] = useState<
    Record<string, { ok: boolean; message: string }>
  >({});

  const showSecretLabel = isAr ? 'إظهار المفتاح' : 'Show secret';
  const hideSecretLabel = isAr ? 'إخفاء المفتاح' : 'Hide secret';

  const updateConfig = (updater: (prev: ApiIntegrationsRecord) => ApiIntegrationsRecord) => {
    setConfig((prev) => updater(prev));
    setIsDirty(true);
  };

  const activeProviderMeta = useMemo(
    () => AI_PROVIDERS.find((p) => p.key === config.ai.provider) ?? AI_PROVIDERS[0],
    [config.ai.provider]
  );

  const tabStatus = useMemo(() => {
    const aiReady = Boolean(config.ai.apiKey.trim());
    const paymentsReady = Boolean(
      config.payments.paymob.apiKey.trim() ||
        config.payments.tap.secretKey.trim() ||
        config.payments.stripe.secretKey.trim()
    );
    const messagingReady = Boolean(
      config.messaging.whatsappCloud.accessToken.trim() || config.messaging.webhook.url.trim()
    );
    const analyticsReady = Boolean(
      config.analytics.metaPixelId.trim() ||
        config.analytics.tiktokPixelId.trim() ||
        config.analytics.ga4MeasurementId.trim()
    );
    const shippingReady = Boolean(
      config.shipping.bosta.apiKey.trim() || config.shipping.aramex.apiKey.trim()
    );
    return {
      ai: aiReady,
      payments: paymentsReady,
      messaging: messagingReady,
      analytics: analyticsReady,
      shipping: shippingReady,
      configuredGroupsCount: [
        aiReady,
        paymentsReady,
        messagingReady,
        analyticsReady,
        shippingReady,
      ].filter(Boolean).length,
    };
  }, [config]);

  const handleSaveAll = () => {
    const saved = saveIntegrationsConfig(config);
    setConfig(saved);
    setIsDirty(false);
    toast.success(
      isAr
        ? 'تم حفظ إعدادات الـ APIs والتكامل محلياً بنجاح'
        : 'API & integration settings saved locally'
    );
  };

  const buildEnvTemplate = (): string => {
    const lines = [
      '# ============================================================',
      '# Bubbleverse Server-Side Environment Variables (.env)',
      '# Deploy secrets in Supabase Edge Functions / Server Secrets.',
      '# NEVER prefix private API keys with VITE_!',
      '# ============================================================',
      '',
      '# 1) AI & Image Generation',
      `AI_PROVIDER=${config.ai.provider}`,
      `AI_MODEL=${config.ai.model || activeProviderMeta.defaultModel}`,
      `AI_API_KEY=<PASTE_${config.ai.provider.toUpperCase()}_API_KEY_HERE>`,
      ...(config.ai.customEndpoint.trim()
        ? [`AI_CUSTOM_ENDPOINT=${config.ai.customEndpoint.trim()}`]
        : ['# AI_CUSTOM_ENDPOINT=https://your-gateway.example/v1']),
      '',
      '# 2) Payment Gateways',
      `PAYMOB_MODE=${config.payments.paymob.mode}`,
      `PAYMOB_INTEGRATION_ID=${config.payments.paymob.integrationId.trim() || '<PAYMOB_INTEGRATION_ID>'}`,
      `PAYMOB_IFRAME_ID=${config.payments.paymob.iframeId.trim() || '<PAYMOB_IFRAME_ID>'}`,
      'PAYMOB_API_KEY=<PASTE_PAYMOB_SECRET_KEY_HERE>',
      '',
      `TAP_MODE=${config.payments.tap.mode}`,
      `TAP_PUBLISHABLE_KEY=${config.payments.tap.publishableKey.trim() || '<TAP_PUBLISHABLE_KEY>'}`,
      'TAP_SECRET_KEY=<PASTE_TAP_SECRET_KEY_HERE>',
      '',
      `STRIPE_MODE=${config.payments.stripe.mode}`,
      `STRIPE_PUBLISHABLE_KEY=${config.payments.stripe.publishableKey.trim() || '<STRIPE_PUBLISHABLE_KEY>'}`,
      'STRIPE_SECRET_KEY=<PASTE_STRIPE_SECRET_KEY_HERE>',
      '',
      '# 3) WhatsApp Cloud API & Automation Webhooks',
      `WHATSAPP_PHONE_NUMBER_ID=${config.messaging.whatsappCloud.phoneNumberId.trim() || '<WHATSAPP_PHONE_NUMBER_ID>'}`,
      'WHATSAPP_ACCESS_TOKEN=<PASTE_META_PERMANENT_TOKEN_HERE>',
      `ORDER_WEBHOOK_URL=${config.messaging.webhook.url.trim() || 'https://hook.eu1.make.com/your-webhook'}`,
      'ORDER_WEBHOOK_SECRET=<PASTE_WEBHOOK_SECRET_HEADER_HERE>',
      '',
      '# 4) Marketing & Analytics Pixels (Public Client IDs)',
      `VITE_META_PIXEL_ID=${config.analytics.metaPixelId.trim()}`,
      `VITE_TIKTOK_PIXEL_ID=${config.analytics.tiktokPixelId.trim()}`,
      `VITE_GA4_MEASUREMENT_ID=${config.analytics.ga4MeasurementId.trim()}`,
      '',
      '# 5) Shipping & Couriers',
      'BOSTA_API_KEY=<PASTE_BOSTA_API_KEY_HERE>',
      `ARAMEX_ACCOUNT_NUMBER=${config.shipping.aramex.accountNumber.trim() || '<ARAMEX_ACCOUNT_NUMBER>'}`,
      'ARAMEX_API_KEY=<PASTE_ARAMEX_API_KEY_HERE>',
    ];
    return lines.join('\n');
  };

  const handleCopyEnvTemplate = async () => {
    try {
      await navigator.clipboard.writeText(buildEnvTemplate());
      setCopiedEnv(true);
      toast.success(
        isAr
          ? 'تم نسخ قالب ملف .env الآمن إلى الحافظة'
          : 'Safe .env template copied to clipboard'
      );
      setTimeout(() => setCopiedEnv(false), 2400);
    } catch {
      toast.error(
        isAr ? 'تعذر النسخ إلى الحافظة، يرجى المحاولة مجدداً' : 'Failed to copy to clipboard'
      );
    }
  };

  const setCheck = (id: string, ok: boolean, message: string) => {
    setCheckResults((prev) => ({ ...prev, [id]: { ok, message } }));
    if (ok) {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const handleTestAiFormat = () => {
    const { provider, apiKey, model, customEndpoint } = config.ai;
    if (!apiKey.trim() || apiKey.trim().length < 10) {
      setCheck(
        'ai',
        false,
        isAr
          ? 'أدخل مفتاح API صالح (10 أحرف على الأقل) قبل الفحص.'
          : 'Enter a valid API key (at least 10 characters) before checking.'
      );
      return;
    }
    if (!model.trim()) {
      setCheck(
        'ai',
        false,
        isAr ? 'اختر أو اكتب اسم النموذج المطلوب.' : 'Select or enter a target model name.'
      );
      return;
    }
    if (provider === 'custom') {
      try {
        const parsed = new URL(customEndpoint.trim());
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
          throw new Error('protocol');
        }
      } catch {
        setCheck(
          'ai',
          false,
          isAr
            ? 'رابط نقطة الاتصال المخصصة غير صالح (يجب أن يبدأ بـ https://).'
            : 'Custom endpoint URL is invalid (must start with https://).'
        );
        return;
      }
    }
    setCheck(
      'ai',
      true,
      isAr
        ? 'صيغة الإعدادات صالحة وجاهزة للربط مع خادم توليد القصص.'
        : 'Format check passed — credentials structure is ready for server-side edge deployment.'
    );
  };

  const handleTestPaymentFormat = (gateway: 'paymob' | 'tap' | 'stripe') => {
    if (gateway === 'paymob') {
      const p = config.payments.paymob;
      if (!p.apiKey.trim() || !p.integrationId.trim() || !p.iframeId.trim()) {
        setCheck(
          'paymob',
          false,
          isAr
            ? 'أكمل مفتاح Paymob ورقم التكامل ورقم الإطار أولاً.'
            : 'Complete Paymob API Key, Integration ID, and Iframe ID first.'
        );
        return;
      }
      setCheck(
        'paymob',
        true,
        isAr
          ? `صيغة Paymob صالحة (${p.mode === 'live' ? 'وضع مباشر' : 'وضع تجريبي'}).`
          : `Paymob format verified (${p.mode} mode).`
      );
      return;
    }

    const gw = config.payments[gateway];
    const label = gateway === 'tap' ? 'Tap' : 'Stripe';
    if (!gw.publishableKey.trim() || !gw.secretKey.trim()) {
      setCheck(
        gateway,
        false,
        isAr
          ? `أدخل المفتاح العام والمفتاح السري لبوابة ${label}.`
          : `Enter both Publishable Key and Secret Key for ${label}.`
      );
      return;
    }
    if (gateway === 'stripe' && !gw.publishableKey.trim().startsWith('pk_')) {
      setCheck(
        gateway,
        false,
        isAr
          ? 'المفتاح العام لـ Stripe يجب أن يبدأ بـ pk_test_ أو pk_live_.'
          : 'Stripe publishable key should start with pk_test_ or pk_live_.'
      );
      return;
    }
    setCheck(
      gateway,
      true,
      isAr
        ? `صيغة بوابة ${label} صالحة (${gw.mode === 'live' ? 'وضع مباشر' : 'وضع تجريبي'}).`
        : `${label} key format verified (${gw.mode} mode).`
    );
  };

  const handleTestWhatsappFormat = () => {
    const wa = config.messaging.whatsappCloud;
    if (!wa.phoneNumberId.trim() || !/^\d{6,24}$/.test(wa.phoneNumberId.trim())) {
      setCheck(
        'whatsapp',
        false,
        isAr
          ? 'رقم معرّف الهاتف يجب أن يحتوي على أرقام فقط (6 إلى 24 رقماً).'
          : 'Phone Number ID must contain digits only (6–24 digits).'
      );
      return;
    }
    if (!wa.accessToken.trim() || wa.accessToken.trim().length < 20) {
      setCheck(
        'whatsapp',
        false,
        isAr
          ? 'أدخل رمز الوصول الدائم الصالح من Meta Cloud API.'
          : 'Enter a valid Meta Cloud API permanent access token.'
      );
      return;
    }
    setCheck(
      'whatsapp',
      true,
      isAr
        ? 'صيغة واتساب السحابي صالحة وجاهزة للربط على الخادم.'
        : 'WhatsApp Cloud API format verified and ready for server deployment.'
    );
  };

  const handlePingWebhook = async () => {
    const urlStr = config.messaging.webhook.url.trim();
    if (!urlStr) {
      setCheck(
        'webhook',
        false,
        isAr ? 'أدخل رابط الويب هوك أولاً.' : 'Enter a webhook URL first.'
      );
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(urlStr);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('protocol');
      }
    } catch {
      setCheck(
        'webhook',
        false,
        isAr
          ? 'صيغة الرابط غير صالحة — يجب أن يبدأ بـ https://'
          : 'Invalid URL format — must start with https://'
      );
      return;
    }

    setTestingWebhook(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.messaging.webhook.secretHeader.trim()) {
        headers['X-Bubbleverse-Secret'] = config.messaging.webhook.secretHeader.trim();
      }
      const res = await fetch(parsed.toString(), {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          event: 'order.test_ping',
          synthetic: true,
          sentAt: new Date().toISOString(),
          sampleOrder: {
            reference: 'BV-EG-000000',
            country: 'EG',
            currency: 'EGP',
            totalAmount: 450,
            itemsCount: 1,
          },
        }),
      });
      if (res.ok) {
        setCheck(
          'webhook',
          true,
          isAr
            ? `تم استلام نبضة الاختبار بنجاح (HTTP ${res.status}).`
            : `Webhook test ping succeeded (HTTP ${res.status}).`
        );
      } else {
        setCheck(
          'webhook',
          false,
          isAr
            ? `استجاب الرابط بحالة HTTP ${res.status}. تحقق من إعدادات الاستقبال.`
            : `Endpoint responded with HTTP ${res.status}. Check your webhook receiver.`
        );
      }
    } catch {
      setCheck(
        'webhook',
        false,
        isAr
          ? 'تعذر الوصول من المتصفح (قد يكون بسبب قيود CORS أو انقطاع الاتصال). صيغة الرابط صحيحة.'
          : 'Browser ping blocked or unreachable (often due to CORS on third-party webhooks). URL syntax is valid.'
      );
    } finally {
      clearTimeout(timer);
      setTestingWebhook(false);
    }
  };

  const handleTestAnalyticsFormat = () => {
    const { metaPixelId, tiktokPixelId, ga4MeasurementId } = config.analytics;
    const issues: string[] = [];
    if (metaPixelId.trim() && !/^\d{8,20}$/.test(metaPixelId.trim())) {
      issues.push(isAr ? 'معرّف Meta Pixel يجب أن يكون أرقاماً فقط' : 'Meta Pixel ID should be numeric');
    }
    if (ga4MeasurementId.trim() && !/^G-[A-Z0-9]{6,15}$/i.test(ga4MeasurementId.trim())) {
      issues.push(
        isAr
          ? 'معرّف GA4 يجب أن يبدأ بـ G- مثل G-ABC1234567'
          : 'GA4 Measurement ID should match G-XXXXXXXXXX'
      );
    }
    if (!metaPixelId.trim() && !tiktokPixelId.trim() && !ga4MeasurementId.trim()) {
      setCheck(
        'analytics',
        false,
        isAr ? 'أدخل معرّف تتبع واحد على الأقل للفحص.' : 'Enter at least one pixel or GA4 ID to validate.'
      );
      return;
    }
    if (issues.length > 0) {
      setCheck('analytics', false, issues.join(' • '));
      return;
    }
    setCheck(
      'analytics',
      true,
      isAr ? 'صيغ معرّفات التحليلات والتتبع صحيحة.' : 'All entered analytics & pixel ID formats are valid.'
    );
  };

  const handleTestShippingFormat = (courier: 'bosta' | 'aramex') => {
    if (courier === 'bosta') {
      if (!config.shipping.bosta.apiKey.trim() || config.shipping.bosta.apiKey.trim().length < 10) {
        setCheck(
          'bosta',
          false,
          isAr ? 'أدخل مفتاح API صالح لشركة بوسطة.' : 'Enter a valid Bosta API key.'
        );
        return;
      }
      setCheck(
        'bosta',
        true,
        isAr ? 'صيغة مفتاح بوسطة صالحة وجاهزة للربط.' : 'Bosta API key format verified.'
      );
      return;
    }

    const arx = config.shipping.aramex;
    if (!arx.apiKey.trim() || !arx.accountNumber.trim()) {
      setCheck(
        'aramex',
        false,
        isAr
          ? 'أدخل رقم الحساب ومفتاح API لأرامكس / سمسا.'
          : 'Enter both Account Number and API Key for Aramex / SMSA.'
      );
      return;
    }
    setCheck(
      'aramex',
      true,
      isAr ? 'صيغة بيانات أرامكس / سمسا صالحة.' : 'Aramex / SMSA credentials format verified.'
    );
  };

  const tabs: {
    id: IntegrationTab;
    icon: typeof Sparkles;
    labelAr: string;
    labelEn: string;
    configured: boolean;
  }[] = [
    {
      id: 'ai',
      icon: Sparkles,
      labelAr: 'الذكاء الاصطناعي والصور',
      labelEn: 'AI & Image Gen',
      configured: tabStatus.ai,
    },
    {
      id: 'payments',
      icon: CreditCard,
      labelAr: 'بوابات الدفع',
      labelEn: 'Payment Gateways',
      configured: tabStatus.payments,
    },
    {
      id: 'messaging',
      icon: MessageSquare,
      labelAr: 'واتساب والويب هوك',
      labelEn: 'WhatsApp & Webhooks',
      configured: tabStatus.messaging,
    },
    {
      id: 'analytics',
      icon: BarChart2,
      labelAr: 'بيكسلات التسويق',
      labelEn: 'Marketing Pixels',
      configured: tabStatus.analytics,
    },
    {
      id: 'shipping',
      icon: Truck,
      labelAr: 'الشحن والتوصيل',
      labelEn: 'Shipping & Couriers',
      configured: tabStatus.shipping,
    },
  ];

  const renderCheckBanner = (id: string) => {
    const res = checkResults[id];
    if (!res) return null;
    return (
      <div
        role="status"
        className={`flex items-start gap-2.5 p-3 rounded-2xl text-xs border ${
          res.ok
            ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
            : 'bg-red-500/10 border-red-400/30 text-red-200'
        }`}
      >
        {res.ok ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        )}
        <span className="leading-relaxed">{res.message}</span>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-[min(100%,108rem)] mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/25 via-purple-500/25 to-pink-500/20 border border-cyan-400/35 flex items-center justify-center shadow-[0_0_24px_rgba(0,217,255,0.2)]">
                <Plug className="w-6 h-6 text-cyan-300" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-editorial text-white">
                {isAr ? 'مركز الـ APIs والتكامل' : 'APIs & Integrations Hub'}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-xs font-bold font-numeric">
                <span>{tabStatus.configuredGroupsCount}/5</span>
                <span>{isAr ? 'مجموعات مُعدّة' : 'groups configured'}</span>
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              {isAr
                ? 'اربط محركات توليد القصص والصور، بوابات الدفع في مصر والسعودية، واتساب السحابي، الأتمتة، وبيكسلات الإعلانات من مكان واحد.'
                : 'Configure AI story & image engines, regional payment gateways, WhatsApp Cloud & webhooks, ad pixels, and shipping couriers in one place.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyEnvTemplate}
              className="h-11 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-slate-100 gap-2 px-4"
            >
              {copiedEnv ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-cyan-300" />
              )}
              <span>{isAr ? 'نسخ قالب .env' : 'Copy .env Template'}</span>
            </Button>

            <Button
              type="button"
              onClick={handleSaveAll}
              className="h-11 bubble-btn bubble-btn-primary gap-2 px-6 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>
                {isDirty
                  ? isAr
                    ? 'حفظ التغييرات'
                    : 'Save Changes'
                  : isAr
                  ? 'حفظ الكل'
                  : 'Save All'}
              </span>
            </Button>
          </div>
        </div>

        {/* Honest Security Banner */}
        <div className="glass-card p-4 sm:p-5 border-amber-400/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-300" />
            </div>
            <div className="space-y-1 text-xs sm:text-sm">
              <h2 className="font-bold text-amber-200">
                {isAr
                  ? 'ملاحظة أمنية حول التخزين المحلي للنسخة التجريبية'
                  : 'Security Notice — Local MVP Staging vs Production Secrets'}
              </h2>
              <p className="text-slate-300 leading-relaxed">
                {isAr
                  ? 'المفاتيح المحفوظة هنا تُخزّن داخل هذا المتصفح فقط لتسهيل إعداد وتجربة الاستوديو. قبل تفعيل الدفع المباشر أو التشغيل الفعلي، انقل جميع المفاتيح السرية إلى متغيرات البيئة على الخادم باستخدام زر نسخ قالب البيئة بالأعلى.'
                  : 'Values entered here are stored locally in this browser for MVP studio staging and testing. Before enabling live payment collection or production AI billing, deploy secret keys strictly as server-side environment variables or Supabase Edge Function secrets using the Copy .env Template button above.'}
              </p>
            </div>
          </div>
        </div>

        {/* 5-Tab Bar */}
        <div
          role="tablist"
          aria-label={isAr ? 'أقسام الربط البرمجي' : 'API integration sections'}
          className="flex flex-wrap gap-2 p-2 rounded-3xl bg-slate-950/70 border border-white/10"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 h-11 px-4 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/25 via-purple-500/25 to-pink-500/15 text-white border border-cyan-400/40 shadow-[0_0_20px_rgba(0,217,255,0.16)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 text-cyan-300" />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                {tab.configured && (
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: AI & Image Generation */}
        {activeTab === 'ai' && (
          <div className="glass-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-400/35 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-editorial text-white">
                    {isAr ? 'محرك الذكاء الاصطناعي وتوليد الصور' : 'AI Story & Image Generation Engine'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {isAr
                      ? 'يظهر هذا الإعداد مباشرة داخل استوديو القصص لتجهيز المسودات والرسومات.'
                      : 'Synced live with Story Studio to indicate your active storytelling & illustration provider.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusPill
                  enabled={config.ai.enabled}
                  configured={Boolean(config.ai.apiKey.trim())}
                  isAr={isAr}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    id="ai-enabled"
                    checked={config.ai.enabled}
                    onCheckedChange={(checked) =>
                      updateConfig((prev) => ({
                        ...prev,
                        ai: { ...prev.ai, enabled: checked },
                      }))
                    }
                  />
                  <Label htmlFor="ai-enabled" className="text-xs text-slate-300 cursor-pointer">
                    {isAr ? 'تفعيل' : 'Enable'}
                  </Label>
                </div>
              </div>
            </div>

            {/* Provider Selector Cards */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-slate-300">
                {isAr ? 'اختر مزوّد الذكاء الاصطناعي' : 'Select AI Provider'}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {AI_PROVIDERS.map((prov) => {
                  const selected = config.ai.provider === prov.key;
                  return (
                    <button
                      key={prov.key}
                      type="button"
                      onClick={() =>
                        updateConfig((prev) => ({
                          ...prev,
                          ai: {
                            ...prev.ai,
                            provider: prov.key,
                            model: prov.defaultModel,
                          },
                        }))
                      }
                      className={`text-start p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selected
                          ? 'bg-cyan-500/15 border-cyan-400/50 shadow-[0_0_20px_rgba(0,217,255,0.14)]'
                          : 'bg-slate-950/60 border-white/10 hover:border-white/25'
                      }`}
                    >
                      <p className="text-sm font-bold text-white">
                        {isAr ? prov.labelAr : prov.labelEn}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {isAr ? prov.descAr : prov.descEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model + API Key + Custom Endpoint */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="ai-model-select" className="text-xs font-semibold text-slate-200">
                  {isAr ? 'النموذج المعتمد' : 'Target Model'}
                </Label>
                <select
                  id="ai-model-select"
                  dir="ltr"
                  value={
                    activeProviderMeta.models.includes(config.ai.model)
                      ? config.ai.model
                      : '__custom__'
                  }
                  onChange={(e) => {
                    if (e.target.value !== '__custom__') {
                      updateConfig((prev) => ({
                        ...prev,
                        ai: { ...prev.ai, model: e.target.value },
                      }));
                    }
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950/80 border border-white/15 text-white text-sm font-numeric text-left focus:outline-none focus:border-cyan-400/60"
                >
                  {activeProviderMeta.models.map((m) => (
                    <option key={m} value={m} className="bg-slate-900">
                      {m}
                    </option>
                  ))}
                  {!activeProviderMeta.models.includes(config.ai.model) && (
                    <option value="__custom__" className="bg-slate-900">
                      {config.ai.model || (isAr ? 'نموذج مخصص' : 'Custom model')}
                    </option>
                  )}
                </select>
                <Input
                  aria-label={isAr ? 'اسم النموذج يدوياً' : 'Custom model identifier'}
                  dir="ltr"
                  value={config.ai.model}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      ai: { ...prev.ai, model: e.target.value },
                    }))
                  }
                  placeholder={activeProviderMeta.defaultModel}
                  className="h-10 bg-slate-950/60 border-white/10 rounded-xl text-slate-200 text-xs font-numeric text-left"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-api-key" className="text-xs font-semibold text-slate-200">
                  {isAr ? 'مفتاح الـ API السري' : 'Provider API Key'}
                </Label>
                <MaskedSecretInput
                  id="ai-api-key"
                  value={config.ai.apiKey}
                  onChange={(val) =>
                    updateConfig((prev) => ({
                      ...prev,
                      ai: { ...prev.ai, apiKey: val },
                    }))
                  }
                  placeholder={activeProviderMeta.keyHint}
                  showLabel={showSecretLabel}
                  hideLabel={hideSecretLabel}
                />
                <p className="text-xs text-slate-400">
                  {isAr
                    ? 'يُخفى المفتاح تلقائياً ولا يُطبع أبداً في السجلات.'
                    : 'Masked by default and excluded from standard backups.'}
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="ai-custom-endpoint" className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-300" />
                  <span>
                    {config.ai.provider === 'custom'
                      ? isAr
                        ? 'رابط نقطة الاتصال المخصصة (مطلوب)'
                        : 'Custom Endpoint URL (Required)'
                      : isAr
                      ? 'رابط بوابة بديلة / بروكسي (اختياري)'
                      : 'Custom Gateway / Proxy URL (Optional)'}
                  </span>
                </Label>
                <Input
                  id="ai-custom-endpoint"
                  type="url"
                  dir="ltr"
                  value={config.ai.customEndpoint}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      ai: { ...prev.ai, customEndpoint: e.target.value },
                    }))
                  }
                  placeholder="https://api.example.com/v1/images/generations"
                  className="h-11 bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric text-left"
                />
              </div>
            </div>

            {renderCheckBanner('ai')}

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestAiFormat}
                className="h-10 rounded-full border-cyan-400/35 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 gap-2"
              >
                <Radio className="w-4 h-4" />
                <span>{isAr ? 'فحص صيغة الإعدادات' : 'Verify Format & Config'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: Payment Gateways */}
        {activeTab === 'payments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Paymob Egypt */}
            <div className="glass-card p-5 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                  <div>
                    <h2 className="text-base font-bold font-editorial text-white">
                      {isAr ? 'باي موب (مصر)' : 'Paymob (Egypt)'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAr ? 'بطاقات بنكية ومحافظ إلكترونية وميزة' : 'Cards, mobile wallets & Meeza'}
                    </p>
                  </div>
                  <Switch
                    aria-label={isAr ? 'تفعيل باي موب' : 'Enable Paymob'}
                    checked={config.payments.paymob.enabled}
                    onCheckedChange={(checked) =>
                      updateConfig((prev) => ({
                        ...prev,
                        payments: {
                          ...prev.payments,
                          paymob: { ...prev.payments.paymob, enabled: checked },
                        },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <StatusPill
                    enabled={config.payments.paymob.enabled}
                    configured={Boolean(
                      config.payments.paymob.apiKey.trim() &&
                        config.payments.paymob.integrationId.trim()
                    )}
                    mode={config.payments.paymob.mode}
                    isAr={isAr}
                  />
                  <GatewayModeToggle
                    mode={config.payments.paymob.mode}
                    onChange={(mode) =>
                      updateConfig((prev) => ({
                        ...prev,
                        payments: {
                          ...prev.payments,
                          paymob: { ...prev.payments.paymob, mode },
                        },
                      }))
                    }
                    isAr={isAr}
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="paymob-key" className="text-xs text-slate-300">
                      {isAr ? 'المفتاح السري للربط' : 'API Key'}
                    </Label>
                    <MaskedSecretInput
                      id="paymob-key"
                      value={config.payments.paymob.apiKey}
                      onChange={(val) =>
                        updateConfig((prev) => ({
                          ...prev,
                          payments: {
                            ...prev.payments,
                            paymob: { ...prev.payments.paymob, apiKey: val },
                          },
                        }))
                      }
                      placeholder="ZXlK..."
                      showLabel={showSecretLabel}
                      hideLabel={hideSecretLabel}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="paymob-integration" className="text-xs text-slate-300">
                      {isAr ? 'رقم التكامل' : 'Integration ID'}
                    </Label>
                    <Input
                      id="paymob-integration"
                      dir="ltr"
                      value={config.payments.paymob.integrationId}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          payments: {
                            ...prev.payments,
                            paymob: { ...prev.payments.paymob, integrationId: e.target.value },
                          },
                        }))
                      }
                      placeholder="4123456"
                      className="h-11 bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric text-left"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="paymob-iframe" className="text-xs text-slate-300">
                      {isAr ? 'رقم إطار الدفع' : 'Iframe ID'}
                    </Label>
                    <Input
                      id="paymob-iframe"
                      dir="ltr"
                      value={config.payments.paymob.iframeId}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          payments: {
                            ...prev.payments,
                            paymob: { ...prev.payments.paymob, iframeId: e.target.value },
                          },
                        }))
                      }
                      placeholder="812345"
                      className="h-11 bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric text-left"
                    />
                  </div>
                </div>

                {renderCheckBanner('paymob')}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleTestPaymentFormat('paymob')}
                className="w-full h-10 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 gap-2"
              >
                <Radio className="w-4 h-4 text-cyan-300" />
                <span>{isAr ? 'فحص صيغة باي موب' : 'Verify Paymob Format'}</span>
              </Button>
            </div>

            {/* Tap Payments Saudi */}
            <div className="glass-card p-5 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                  <div>
                    <h2 className="text-base font-bold font-editorial text-white">
                      {isAr ? 'تاب للمدفوعات (السعودية)' : 'Tap Payments (Saudi / GCC)'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAr ? 'مدى وآبل باي وإس تي سي باي والبطاقات' : 'Mada, Apple Pay, STC Pay & cards'}
                    </p>
                  </div>
                  <Switch
                    aria-label={isAr ? 'تفعيل تاب للمدفوعات' : 'Enable Tap Payments'}
                    checked={config.payments.tap.enabled}
                    onCheckedChange={(checked) =>
                      updateConfig((prev) => ({
                        ...prev,
                        payments: {
                          ...prev.payments,
                          tap: { ...prev.payments.tap, enabled: checked },
                        },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <StatusPill
                    enabled={config.payments.tap.enabled}
                    configured={Boolean(
                      config.payments.tap.publishableKey.trim() &&
                        config.payments.tap.secretKey.trim()
                    )}
                    mode={config.payments.tap.mode}
                    isAr={isAr}
                  />
                  <GatewayModeToggle
                    mode={config.payments.tap.mode}
                    onChange={(mode) =>
                      updateConfig((prev) => ({
                        ...prev,
                        payments: {
                          ...prev.payments,
                          tap: { ...prev.payments.tap, mode },
                        },
                      }))
                    }
                    isAr={isAr}
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="tap-pub" className="text-xs text-slate-300">
                      {isAr ? 'المفتاح العام' : 'Publishable Key'}
                    </Label>
                    <Input
                      id="tap-pub"
                      dir="ltr"
                      value={config.payments.tap.publishableKey}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          payments: {
                            ...prev.payments,
                            tap: { ...prev.payments.tap, publishableKey: e.target.value },
                          },
                        }))
                      }
                      placeholder="pk_test_..."
                      className="h-11 bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric text-left"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tap-secret" className="text-xs text-slate-300">
                      {isAr ? 'المفتاح السري' : 'Secret Key'}
                    </Label>
                    <MaskedSecretInput
                      id="tap-secret"
                      value={config.payments.tap.secretKey}
                      onChange={(val) =>
                        updateConfig((prev) => ({
                          ...prev,
                          payments: {
                            ...prev.payments,
                            tap: { ...prev.payments.tap, secretKey: val },
                          },
                        }))
                      }
                      placeholder="sk_test_..."
                      showLabel={showSecretLabel}
                      hideLabel={hideSecretLabel}
                    />
                  </div>
                </div>

                {renderCheckBanner('tap')}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleTestPaymentFormat('tap')}
                className="w-full h-10 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 gap-2"
              >
                <Radio className="w-4 h-4 text-cyan-300" />
                <span>{isAr ? 'فحص صيغة تاب' : 'Verify Tap Format'}</span>
              </Button>
            </div>

            {/* Stripe Global */}
            <div className="glass-card p-5 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                  <div>
                    <h2 className="text-base font-bold font-editorial text-white">
                      {isAr ? 'سترايب (دولي)' : 'Stripe (International)'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAr ? 'البطاقات العالمية والدفع بالعملات الأجنبية' : 'Global cards, Apple Pay & multi-currency'}
                    </p>
                  </div>
                  <Switch
                    aria-label={isAr ? 'تفعيل سترايب' : 'Enable Stripe'}
                    checked={config.payments.stripe.enabled}
                    onCheckedChange={(checked) =>
                      updateConfig((prev) => ({
                        ...prev,
                        payments: {
                          ...prev.payments,
                          stripe: { ...prev.payments.stripe, enabled: checked },
                        },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <StatusPill
                    enabled={config.payments.stripe.enabled}
                    configured={Boolean(
                      config.payments.stripe.publishableKey.trim() &&
                        config.payments.stripe.secretKey.trim()
                    )}
                    mode={config.payments.stripe.mode}
                    isAr={isAr}
                  />
                  <GatewayModeToggle
                    mode={config.payments.stripe.mode}
                    onChange={(mode) =>
                      updateConfig((prev) => ({
                        ...prev,
                        payments: {
                          ...prev.payments,
                          stripe: { ...prev.payments.stripe, mode },
                        },
                      }))
                    }
                    isAr={isAr}
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="stripe-pub" className="text-xs text-slate-300">
                      {isAr ? 'المفتاح العام' : 'Publishable Key'}
                    </Label>
                    <Input
                      id="stripe-pub"
                      dir="ltr"
                      value={config.payments.stripe.publishableKey}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          payments: {
                            ...prev.payments,
                            stripe: { ...prev.payments.stripe, publishableKey: e.target.value },
                          },
                        }))
                      }
                      placeholder="pk_test_..."
                      className="h-11 bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric text-left"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="stripe-secret" className="text-xs text-slate-300">
                      {isAr ? 'المفتاح السري' : 'Secret Key'}
                    </Label>
                    <MaskedSecretInput
                      id="stripe-secret"
                      value={config.payments.stripe.secretKey}
                      onChange={(val) =>
                        updateConfig((prev) => ({
                          ...prev,
                          payments: {
                            ...prev.payments,
                            stripe: { ...prev.payments.stripe, secretKey: val },
                          },
                        }))
                      }
                      placeholder="sk_test_..."
                      showLabel={showSecretLabel}
                      hideLabel={hideSecretLabel}
                    />
                  </div>
                </div>

                {renderCheckBanner('stripe')}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleTestPaymentFormat('stripe')}
                className="w-full h-10 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 gap-2"
              >
                <Radio className="w-4 h-4 text-cyan-300" />
                <span>{isAr ? 'فحص صيغة سترايب' : 'Verify Stripe Format'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: WhatsApp Cloud & Webhooks */}
        {activeTab === 'messaging' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* WhatsApp Cloud API */}
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-editorial text-white">
                      {isAr ? 'واتساب السحابي من ميتا' : 'WhatsApp Cloud API (Meta)'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAr
                        ? 'إرسال إشعارات تلقائية بحالة الطلب وتجهيز المسودة للعملاء'
                        : 'Automated WhatsApp order confirmations and draft-ready updates'}
                    </p>
                  </div>
                </div>
                <Switch
                  aria-label={isAr ? 'تفعيل واتساب السحابي' : 'Enable WhatsApp Cloud'}
                  checked={config.messaging.whatsappCloud.enabled}
                  onCheckedChange={(checked) =>
                    updateConfig((prev) => ({
                      ...prev,
                      messaging: {
                        ...prev.messaging,
                        whatsappCloud: { ...prev.messaging.whatsappCloud, enabled: checked },
                      },
                    }))
                  }
                />
              </div>

              <StatusPill
                enabled={config.messaging.whatsappCloud.enabled}
                configured={Boolean(
                  config.messaging.whatsappCloud.phoneNumberId.trim() &&
                    config.messaging.whatsappCloud.accessToken.trim()
                )}
                isAr={isAr}
              />

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="wa-phone-id" className="text-xs text-slate-300">
                    {isAr ? 'معرّف رقم الهاتف' : 'Phone Number ID'}
                  </Label>
                  <Input
                    id="wa-phone-id"
                    dir="ltr"
                    value={config.messaging.whatsappCloud.phoneNumberId}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        messaging: {
                          ...prev.messaging,
                          whatsappCloud: {
                            ...prev.messaging.whatsappCloud,
                            phoneNumberId: e.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="109283746512345"
                    className="h-11 bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric text-left"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="wa-token" className="text-xs text-slate-300">
                    {isAr ? 'رمز الوصول الدائم' : 'Permanent Access Token'}
                  </Label>
                  <MaskedSecretInput
                    id="wa-token"
                    value={config.messaging.whatsappCloud.accessToken}
                    onChange={(val) =>
                      updateConfig((prev) => ({
                        ...prev,
                        messaging: {
                          ...prev.messaging,
                          whatsappCloud: {
                            ...prev.messaging.whatsappCloud,
                            accessToken: val,
                          },
                        },
                      }))
                    }
                    placeholder="EAAG..."
                    showLabel={showSecretLabel}
                    hideLabel={hideSecretLabel}
                  />
                </div>
              </div>

              {renderCheckBanner('whatsapp')}

              <Button
                type="button"
                variant="outline"
                onClick={handleTestWhatsappFormat}
                className="w-full h-10 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 gap-2"
              >
                <Radio className="w-4 h-4 text-emerald-300" />
                <span>{isAr ? 'فحص صيغة واتساب' : 'Verify WhatsApp Format'}</span>
              </Button>
            </div>

            {/* Automation Webhook (Make / Zapier / n8n) */}
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center shrink-0">
                    <Webhook className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-editorial text-white">
                      {isAr ? 'ويب هوك الأتمتة الفورية' : 'Automation Webhook (Make / Zapier / n8n)'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAr
                        ? 'يُرسل تلقائياً فور تسجيل أي طلب جديد لربطه بجداول البيانات أو إشعارات الفريق'
                        : 'Automatically fires on every new checkout order to sync Google Sheets, Slack, or CRM'}
                    </p>
                  </div>
                </div>
                <Switch
                  aria-label={isAr ? 'تفعيل الويب هوك' : 'Enable Webhook'}
                  checked={config.messaging.webhook.enabled}
                  onCheckedChange={(checked) =>
                    updateConfig((prev) => ({
                      ...prev,
                      messaging: {
                        ...prev.messaging,
                        webhook: { ...prev.messaging.webhook, enabled: checked },
                      },
                    }))
                  }
                />
              </div>

              <StatusPill
                enabled={config.messaging.webhook.enabled}
                configured={Boolean(config.messaging.webhook.url.trim())}
                isAr={isAr}
              />

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="webhook-url" className="text-xs text-slate-300">
                    {isAr ? 'رابط الويب هوك' : 'Webhook POST URL'}
                  </Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    dir="ltr"
                    value={config.messaging.webhook.url}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        messaging: {
                          ...prev.messaging,
                          webhook: { ...prev.messaging.webhook, url: e.target.value },
                        },
                      }))
                    }
                    placeholder="https://hook.eu1.make.com/..."
                    className="h-11 bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric text-left"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="webhook-secret" className="text-xs text-slate-300">
                    {isAr
                      ? 'ترويسة الأمان الاختيارية'
                      : 'Optional Secret Header (X-Bubbleverse-Secret)'}
                  </Label>
                  <MaskedSecretInput
                    id="webhook-secret"
                    value={config.messaging.webhook.secretHeader}
                    onChange={(val) =>
                      updateConfig((prev) => ({
                        ...prev,
                        messaging: {
                          ...prev.messaging,
                          webhook: { ...prev.messaging.webhook, secretHeader: val },
                        },
                      }))
                    }
                    placeholder="whsec_..."
                    showLabel={showSecretLabel}
                    hideLabel={hideSecretLabel}
                  />
                </div>
              </div>

              {renderCheckBanner('webhook')}

              <Button
                type="button"
                variant="outline"
                disabled={testingWebhook}
                onClick={handlePingWebhook}
                className="w-full h-10 rounded-full border-cyan-400/35 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 gap-2"
              >
                {testingWebhook ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Radio className="w-4 h-4" />
                )}
                <span>
                  {testingWebhook
                    ? isAr
                      ? 'جاري إرسال اختبار...'
                      : 'Sending Test Ping...'
                    : isAr
                    ? 'اختبار رابط الويب هوك'
                    : 'Test Webhook'}
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* TAB 4: Marketing & Analytics Pixels */}
        {activeTab === 'analytics' && (
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-500/15 border border-pink-400/35 flex items-center justify-center shrink-0">
                  <BarChart2 className="w-5 h-5 text-pink-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-editorial text-white">
                    {isAr ? 'بيكسلات التسويق والتحليلات' : 'Marketing & Analytics Pixels'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {isAr
                      ? 'تتبع الزيارات وإضافة القصص للسلة وإتمام الطلبات لحملات ميتا وتيك توك وجوجل.'
                      : 'Track catalog views, add-to-cart, and completed orders across Meta, TikTok, and Google Analytics 4.'}
                  </p>
                </div>
              </div>
              <StatusPill
                enabled={tabStatus.analytics}
                configured={tabStatus.analytics}
                isAr={isAr}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="glass-card-inner p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="meta-pixel" className="text-sm font-bold text-white">
                    {isAr ? 'بيكسل ميتا (فيسبوك / إنستغرام)' : 'Meta Pixel ID'}
                  </Label>
                  <StatusPill
                    enabled={Boolean(config.analytics.metaPixelId.trim())}
                    configured={Boolean(config.analytics.metaPixelId.trim())}
                    isAr={isAr}
                  />
                </div>
                <Input
                  id="meta-pixel"
                  dir="ltr"
                  value={config.analytics.metaPixelId}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      analytics: { ...prev.analytics, metaPixelId: e.target.value },
                    }))
                  }
                  placeholder="123456789012345"
                  className="h-11 bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric text-left"
                />
                <p className="text-xs text-slate-400">
                  {isAr ? 'رقم مكوّن من 15 إلى 16 خانة من مدير الأحداث' : 'Numeric 15–16 digit ID from Meta Events Manager'}
                </p>
              </div>

              <div className="glass-card-inner p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="tiktok-pixel" className="text-sm font-bold text-white">
                    {isAr ? 'بيكسل تيك توك' : 'TikTok Pixel ID'}
                  </Label>
                  <StatusPill
                    enabled={Boolean(config.analytics.tiktokPixelId.trim())}
                    configured={Boolean(config.analytics.tiktokPixelId.trim())}
                    isAr={isAr}
                  />
                </div>
                <Input
                  id="tiktok-pixel"
                  dir="ltr"
                  value={config.analytics.tiktokPixelId}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      analytics: { ...prev.analytics, tiktokPixelId: e.target.value },
                    }))
                  }
                  placeholder="CXXXXXXXXXXXXXXX"
                  className="h-11 bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric text-left"
                />
                <p className="text-xs text-slate-400">
                  {isAr ? 'معرّف البيكسل من TikTok Ads Manager' : 'Pixel code from TikTok Ads Manager'}
                </p>
              </div>

              <div className="glass-card-inner p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="ga4-id" className="text-sm font-bold text-white">
                    {isAr ? 'جوجل أناليتكس 4' : 'Google Analytics 4 (GA4)'}
                  </Label>
                  <StatusPill
                    enabled={Boolean(config.analytics.ga4MeasurementId.trim())}
                    configured={Boolean(config.analytics.ga4MeasurementId.trim())}
                    isAr={isAr}
                  />
                </div>
                <Input
                  id="ga4-id"
                  dir="ltr"
                  value={config.analytics.ga4MeasurementId}
                  onChange={(e) =>
                    updateConfig((prev) => ({
                      ...prev,
                      analytics: { ...prev.analytics, ga4MeasurementId: e.target.value },
                    }))
                  }
                  placeholder="G-XXXXXXXXXX"
                  className="h-11 bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric text-left"
                />
                <p className="text-xs text-slate-400">
                  {isAr ? 'معرّف القياس الذي يبدأ بـ G-' : 'Measurement ID starting with G-'}
                </p>
              </div>
            </div>

            {renderCheckBanner('analytics')}

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestAnalyticsFormat}
                className="h-10 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 gap-2"
              >
                <Radio className="w-4 h-4 text-pink-300" />
                <span>{isAr ? 'فحص صيغ المعرّفات' : 'Validate Pixel Formats'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* TAB 5: Shipping & Couriers */}
        {activeTab === 'shipping' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bosta Egypt */}
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-editorial text-white">
                      {isAr ? 'بوسطة للشحن (مصر)' : 'Bosta Shipping (Egypt)'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAr
                        ? 'إصدار بوالص الشحن وتتبع توصيل الكتب المطبوعة داخل محافظات مصر'
                        : 'Generate air waybills and track hardcover deliveries across Egypt'}
                    </p>
                  </div>
                </div>
                <Switch
                  aria-label={isAr ? 'تفعيل بوسطة' : 'Enable Bosta'}
                  checked={config.shipping.bosta.enabled}
                  onCheckedChange={(checked) =>
                    updateConfig((prev) => ({
                      ...prev,
                      shipping: {
                        ...prev.shipping,
                        bosta: { ...prev.shipping.bosta, enabled: checked },
                      },
                    }))
                  }
                />
              </div>

              <StatusPill
                enabled={config.shipping.bosta.enabled}
                configured={Boolean(config.shipping.bosta.apiKey.trim())}
                isAr={isAr}
              />

              <div className="space-y-1.5">
                <Label htmlFor="bosta-key" className="text-xs text-slate-300">
                  {isAr ? 'المفتاح السري لبوسطة' : 'Bosta API Key'}
                </Label>
                <MaskedSecretInput
                  id="bosta-key"
                  value={config.shipping.bosta.apiKey}
                  onChange={(val) =>
                    updateConfig((prev) => ({
                      ...prev,
                      shipping: {
                        ...prev.shipping,
                        bosta: { ...prev.shipping.bosta, apiKey: val },
                      },
                    }))
                  }
                  placeholder="bosta_live_..."
                  showLabel={showSecretLabel}
                  hideLabel={hideSecretLabel}
                />
              </div>

              {renderCheckBanner('bosta')}

              <Button
                type="button"
                variant="outline"
                onClick={() => handleTestShippingFormat('bosta')}
                className="w-full h-10 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 gap-2"
              >
                <Radio className="w-4 h-4 text-cyan-300" />
                <span>{isAr ? 'فحص صيغة بوسطة' : 'Verify Bosta Format'}</span>
              </Button>
            </div>

            {/* Aramex / SMSA Saudi */}
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-400/35 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-editorial text-white">
                      {isAr ? 'أرامكس / سمسا (السعودية والخليج)' : 'Aramex / SMSA (Saudi & GCC)'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAr
                        ? 'شحن سريع وموثوق للكتب المطبوعة في الرياض وجدة وكافة مدن المملكة'
                        : 'Fast door-to-door book delivery across Riyadh, Jeddah, and GCC'}
                    </p>
                  </div>
                </div>
                <Switch
                  aria-label={isAr ? 'تفعيل أرامكس' : 'Enable Aramex'}
                  checked={config.shipping.aramex.enabled}
                  onCheckedChange={(checked) =>
                    updateConfig((prev) => ({
                      ...prev,
                      shipping: {
                        ...prev.shipping,
                        aramex: { ...prev.shipping.aramex, enabled: checked },
                      },
                    }))
                  }
                />
              </div>

              <StatusPill
                enabled={config.shipping.aramex.enabled}
                configured={Boolean(
                  config.shipping.aramex.apiKey.trim() &&
                    config.shipping.aramex.accountNumber.trim()
                )}
                isAr={isAr}
              />

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="aramex-account" className="text-xs text-slate-300">
                    {isAr ? 'رقم الحساب' : 'Account Number'}
                  </Label>
                  <Input
                    id="aramex-account"
                    dir="ltr"
                    value={config.shipping.aramex.accountNumber}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        shipping: {
                          ...prev.shipping,
                          aramex: { ...prev.shipping.aramex, accountNumber: e.target.value },
                        },
                      }))
                    }
                    placeholder="20016..."
                    className="h-11 bg-slate-950/80 border-white/15 rounded-xl text-white text-sm font-numeric text-left"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="aramex-key" className="text-xs text-slate-300">
                    {isAr ? 'المفتاح السري للربط' : 'API Key / Passkey'}
                  </Label>
                  <MaskedSecretInput
                    id="aramex-key"
                    value={config.shipping.aramex.apiKey}
                    onChange={(val) =>
                      updateConfig((prev) => ({
                        ...prev,
                        shipping: {
                          ...prev.shipping,
                          aramex: { ...prev.shipping.aramex, apiKey: val },
                        },
                      }))
                    }
                    placeholder="arx_..."
                    showLabel={showSecretLabel}
                    hideLabel={hideSecretLabel}
                  />
                </div>
              </div>

              {renderCheckBanner('aramex')}

              <Button
                type="button"
                variant="outline"
                onClick={() => handleTestShippingFormat('aramex')}
                className="w-full h-10 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 gap-2"
              >
                <Radio className="w-4 h-4 text-purple-300" />
                <span>{isAr ? 'فحص صيغة أرامكس / سمسا' : 'Verify Aramex / SMSA Format'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
