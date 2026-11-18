import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  Cake,
  Check,
  CheckCircle2,
  Copy,
  Gift,
  MessageCircle,
  Share2,
  Sparkles,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  generateReferralCode,
  saveBirthdayClubLead,
} from '@/lib/localStore';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const BDAY_PROMO_CODE = 'BDAY15';

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export default function GrowthRetentionSection() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const shouldReduceMotion = Boolean(useReducedMotion());

  // Tile 1: Birthday Club state
  const [childName, setChildName] = useState('');
  const [childBirthday, setChildBirthday] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bdayError, setBdayError] = useState('');
  const [bdayUnlocked, setBdayUnlocked] = useState<{
    childName: string;
    code: string;
  } | null>(null);
  const [copiedBday, setCopiedBday] = useState(false);

  // Tile 2: Give 15%, Get 15% Referral state
  const [parentName, setParentName] = useState('');
  const [refError, setRefError] = useState('');
  const [referralResult, setReferralResult] = useState<{
    parentName: string;
    code: string;
  } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const handleBirthdaySubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedChild = childName.trim();
    const trimmedBirthday = childBirthday.trim();
    const trimmedPhone = whatsapp.trim();

    if (!trimmedChild) {
      setBdayError(isAr ? 'يرجى كتابة اسم الطفل أولاً.' : 'Please enter your child’s name.');
      return;
    }
    if (!trimmedBirthday) {
      setBdayError(isAr ? 'يرجى اختيار تاريخ ميلاد الطفل.' : 'Please select your child’s birthday.');
      return;
    }
    if (trimmedPhone.replace(/\D/g, '').length < 8) {
      setBdayError(
        isAr
          ? 'يرجى إدخال رقم واتساب صحيح (8 أرقام على الأقل).'
          : 'Please enter a valid WhatsApp number (at least 8 digits).'
      );
      return;
    }

    setBdayError('');
    saveBirthdayClubLead({
      parentName: '',
      childName: trimmedChild,
      childBirthday: trimmedBirthday,
      whatsapp: trimmedPhone,
      source: 'birthday_club',
    });

    setBdayUnlocked({
      childName: trimmedChild,
      code: BDAY_PROMO_CODE,
    });

    toast.success(
      isAr
        ? `تم تسجيل ${trimmedChild} في نادي أعياد الميلاد! كود الخصم: ${BDAY_PROMO_CODE}`
        : `${trimmedChild} joined the Birthday Club! Promo code: ${BDAY_PROMO_CODE}`,
      { id: 'growth-bday-unlocked' }
    );
  };

  const handleCopyCode = async (code: string, target: 'bday' | 'ref') => {
    const ok = await copyTextToClipboard(code);
    if (!ok) {
      toast.error(
        isAr ? 'تعذر النسخ التلقائي — يمكنك تحديد الكود ونسخه يدوياً.' : 'Could not copy automatically — please copy the code manually.',
        { id: `growth-copy-err-${target}` }
      );
      return;
    }

    if (target === 'bday') {
      setCopiedBday(true);
      window.setTimeout(() => setCopiedBday(false), 2200);
    } else {
      setCopiedRef(true);
      window.setTimeout(() => setCopiedRef(false), 2200);
    }

    toast.success(
      isAr ? `تم نسخ الكود ${code} بنجاح` : `Copied code ${code}`,
      { id: `growth-copy-ok-${target}` }
    );
  };

  const handleReferralSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedParent = parentName.trim();
    if (trimmedParent.length < 2) {
      setRefError(
        isAr ? 'يرجى كتابة اسمك لإنشاء كود الدعوة الخاص بك.' : 'Please enter your name to generate your invite code.'
      );
      return;
    }

    setRefError('');
    const code = generateReferralCode(trimmedParent);
    saveBirthdayClubLead({
      parentName: trimmedParent,
      whatsapp: '',
      childName: '',
      childBirthday: '',
      referralCode: code,
      source: 'referral',
    });

    setReferralResult({ parentName: trimmedParent, code });
    toast.success(
      isAr ? `كود دعوتك جاهز للمشاركة: ${code}` : `Your referral code is ready: ${code}`,
      { id: 'growth-ref-generated' }
    );
  };

  const buildWhatsappInviteHref = (name: string, code: string) => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bubbleverse.app';
    const message = isAr
      ? `أهلاً! أنا ${name} وحبيت أشارككم هدية جميلة من بابل فيرس — تقدروا تعملوا قصة مصورة كاملة باسم وملامح طفلكم وتاخدوا خصم 15% على أول طلب بكود FRIEND15 (كود الدعوة الخاص بي: ${code}) ✨\n${siteUrl}/stories`
      : `Hi! ${name} here — I wanted to share a magical gift from Bubbleverse! Create a personalized illustrated storybook starring your child and get 15% off with code FRIEND15 (my referral code: ${code}) ✨\n${siteUrl}/stories`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const cardMotionProps = (index: number) => ({
    initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: shouldReduceMotion
      ? { duration: 0 }
      : { duration: 0.45, delay: index * 0.08, ease: EASE_OUT },
  });

  return (
    <section
      id="growth-club"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-labelledby="growth-club-heading"
      className="py-16 sm:py-24 px-4 sm:px-6 relative"
    >
      <div className="bv-container space-y-10 sm:space-y-12">
        {/* Section Header */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: EASE_OUT }}
          className="text-center max-w-4xl mx-auto space-y-3.5"
        >
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/12 border border-purple-400/30 text-purple-200 text-xs sm:text-sm font-semibold">
            <Gift className="w-4 h-4 text-pink-300 shrink-0" aria-hidden="true" />
            <span>
              {isAr ? 'نادي هدايا ومكافآت بابل فيرس' : 'Bubbleverse Gift & Rewards Club'}
            </span>
          </div>

          <h2
            id="growth-club-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-editorial leading-tight text-white text-balance"
          >
            {isAr ? (
              <>
                هدايا مجانية وخصومات...{' '}
                <span className="text-magical">لكل عيد ميلاد وصديق</span>
              </>
            ) : (
              <>
                Free Keepsakes & Rewards...{' '}
                <span className="text-magical">For Every Birthday & Friend</span>
              </>
            )}
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'سجّل عيد ميلاد طفلك لخصم فوري، شارك السحر مع صديق واكسب 15%، أو حمّل شهادة بطل مطبوعة مجاناً في 10 ثوانٍ.'
              : 'Unlock an instant Birthday Club code, share 15% off with another family, or create a free printable Hero Certificate in 10 seconds.'}
          </p>
        </motion.div>

        {/* 3 Glass-Card Growth Tiles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 xl:gap-8 items-stretch">
          {/* Tile 1: Birthday Club */}
          <motion.article
            {...cardMotionProps(0)}
            className="glass-card rounded-3xl p-5 xl:p-7 border-pink-400/25 flex flex-col justify-between gap-5 text-start"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2.5">
                <div className="w-11 h-11 xl:w-12 xl:h-12 rounded-2xl bg-pink-500/15 border border-pink-400/35 text-pink-300 flex items-center justify-center shrink-0">
                  <Cake className="w-5 h-5 xl:w-6 xl:h-6" aria-hidden="true" />
                </div>
                <span className="px-2.5 xl:px-3 py-1 rounded-full bg-pink-500/15 border border-pink-400/30 text-pink-200 text-[11px] xl:text-xs font-bold font-numeric">
                  {isAr ? 'خصم فوري 15%' : 'Instant 15% Off'}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg xl:text-xl font-extrabold font-editorial text-white">
                  {isAr ? 'نادي أعياد الميلاد' : 'Birthday Club'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isAr
                    ? 'سجّل اسم طفلك وتاريخ ميلاده ورقم الواتساب — وافتح كود الخصم BDAY15 فوراً مع تذكير هدية قبل عيده.'
                    : 'Register your child’s name, birthday, and WhatsApp to unlock BDAY15 right away plus a gentle pre-birthday reminder.'}
                </p>
              </div>
            </div>

            {bdayUnlocked ? (
              <div className="space-y-4 pt-1">
                <div className="rounded-2xl bg-emerald-950/35 border border-emerald-400/35 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs sm:text-sm font-bold">
                    <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>
                      {isAr
                        ? `أهلاً ببطلنا ${bdayUnlocked.childName} في النادي!`
                        : `Welcome ${bdayUnlocked.childName} to the Club!`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-950/80 border border-white/15 px-3.5 py-2.5">
                    <div>
                      <span className="block text-[11px] text-slate-400">
                        {isAr ? 'كود الخصم (15%)' : 'Your 15% Promo Code'}
                      </span>
                      <span
                        dir="ltr"
                        className="font-numeric text-lg font-extrabold text-cyan-300 tracking-wider"
                      >
                        {bdayUnlocked.code}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(bdayUnlocked.code, 'bday')}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 text-cyan-200 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {copiedBday ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                          <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" aria-hidden="true" />
                          <span>{isAr ? 'نسخ الكود' : 'Copy Code'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <Link
                    to="/stories"
                    className="text-cyan-300 hover:text-cyan-200 font-semibold inline-flex items-center gap-1 py-1"
                  >
                    <span>{isAr ? 'استخدم الكود في المتجر' : 'Use in Story Catalog'}</span>
                    <ArrowRight
                      className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setBdayUnlocked(null);
                      setChildName('');
                      setChildBirthday('');
                    }}
                    className="text-slate-400 hover:text-white underline-offset-4 hover:underline py-1"
                  >
                    {isAr ? 'تسجيل طفل آخر' : 'Add another child'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBirthdaySubmit} className="space-y-3" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="home-bday-child" className="text-xs text-slate-200">
                    {isAr ? 'اسم الطفل' : 'Child’s Name'}
                  </Label>
                  <Input
                    id="home-bday-child"
                    value={childName}
                    onChange={(e) => {
                      setChildName(e.target.value);
                      if (bdayError) setBdayError('');
                    }}
                    placeholder={isAr ? 'مثال: زين أو ليلى' : 'e.g. Zain or Layla'}
                    className="min-h-[44px] bg-slate-950/75 border-white/15 rounded-xl text-white text-sm placeholder:text-slate-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="home-bday-date" className="text-xs text-slate-200">
                      {isAr ? 'تاريخ الميلاد' : 'Birthday'}
                    </Label>
                    <Input
                      id="home-bday-date"
                      type="date"
                      dir="ltr"
                      value={childBirthday}
                      onChange={(e) => {
                        setChildBirthday(e.target.value);
                        if (bdayError) setBdayError('');
                      }}
                      className="min-h-[44px] bg-slate-950/75 border-white/15 rounded-xl text-white text-sm font-numeric [color-scheme:dark]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="home-bday-wa" className="text-xs text-slate-200">
                      {isAr ? 'رقم الواتساب' : 'WhatsApp'}
                    </Label>
                    <Input
                      id="home-bday-wa"
                      type="tel"
                      dir="ltr"
                      value={whatsapp}
                      onChange={(e) => {
                        setWhatsapp(e.target.value);
                        if (bdayError) setBdayError('');
                      }}
                      placeholder="+20 10..."
                      className="min-h-[44px] bg-slate-950/75 border-white/15 rounded-xl text-white text-sm font-numeric placeholder:text-slate-500"
                      required
                    />
                  </div>
                </div>

                {bdayError && (
                  <p role="alert" className="text-xs text-rose-300 font-medium">
                    {bdayError}
                  </p>
                )}

                <button
                  type="submit"
                  className="bubble-btn bubble-btn-secondary w-full min-h-[44px] xl:min-h-[46px] px-4 xl:px-5 py-2.5 text-xs sm:text-sm font-bold gap-2 text-center leading-snug"
                >
                  <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'افتح كود خصم 15% فوراً' : 'Unlock Instant 15% Code'}</span>
                </button>
              </form>
            )}
          </motion.article>

          {/* Tile 2: Give 15%, Get 15% Referral */}
          <motion.article
            {...cardMotionProps(1)}
            className="glass-card rounded-3xl p-5 xl:p-7 border-cyan-400/25 flex flex-col justify-between gap-5 text-start"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2.5">
                <div className="w-11 h-11 xl:w-12 xl:h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 xl:w-6 xl:h-6" aria-hidden="true" />
                </div>
                <span className="px-2.5 xl:px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-[11px] xl:text-xs font-bold font-numeric">
                  {isAr ? 'لك 15% ولصديقك 15%' : 'Give 15%, Get 15%'}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg xl:text-xl font-extrabold font-editorial text-white">
                  {isAr ? 'شارك الهدية واكسب 15%' : 'Give 15%, Get 15%'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isAr
                    ? 'اكتب اسمك لتحصل على كود دعوة خاص بك — ابعته على واتساب لعائلة تحبها ويكسبوا خصم 15% وتكسب 15% في قصتك الجاية.'
                    : 'Enter your name to get a personal referral code — share on WhatsApp so friends enjoy 15% off and you unlock 15% off your next book.'}
                </p>
              </div>
            </div>

            {referralResult ? (
              <div className="space-y-3.5 pt-1">
                <div className="rounded-2xl bg-cyan-950/35 border border-cyan-400/35 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-950/80 border border-white/15 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <span className="block text-[11px] text-slate-400">
                        {isAr ? 'كود دعوتك الخاص' : 'Your Personal Invite Code'}
                      </span>
                      <span
                        dir="ltr"
                        className="font-numeric text-base sm:text-lg font-extrabold text-cyan-300 tracking-wider block truncate"
                      >
                        {referralResult.code}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(referralResult.code, 'ref')}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-100 text-xs font-bold shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {copiedRef ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                          <span>{isAr ? 'نُسخ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" aria-hidden="true" />
                          <span>{isAr ? 'نسخ' : 'Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <a
                    href={buildWhatsappInviteHref(referralResult.parentName, referralResult.code)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bubble-btn bubble-btn-emerald w-full min-h-[44px] xl:min-h-[46px] px-4 xl:px-5 py-2.5 text-xs sm:text-sm font-bold gap-2 text-center leading-snug"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'مشاركة الدعوة عبر واتساب' : 'Share on WhatsApp'}</span>
                  </a>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {isAr ? 'كود صديقك الفوري: ' : 'Friend checkout code: '}
                    <strong dir="ltr" className="font-numeric text-cyan-300">
                      FRIEND15
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setReferralResult(null);
                      setParentName('');
                    }}
                    className="hover:text-white underline-offset-4 hover:underline py-1"
                  >
                    {isAr ? 'اسم آخر' : 'New code'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReferralSubmit} className="space-y-3" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="home-ref-parent" className="text-xs text-slate-200">
                    {isAr ? 'اسمك (الأب أو الأم)' : 'Your Name'}
                  </Label>
                  <Input
                    id="home-ref-parent"
                    value={parentName}
                    onChange={(e) => {
                      setParentName(e.target.value);
                      if (refError) setRefError('');
                    }}
                    placeholder={isAr ? 'مثال: أم سيف أو أحمد' : 'e.g. Sarah or Ahmed'}
                    className="min-h-[44px] bg-slate-950/75 border-white/15 rounded-xl text-white text-sm placeholder:text-slate-500"
                    required
                  />
                </div>

                <div className="rounded-xl bg-slate-950/55 border border-white/10 px-3.5 py-2.5 text-xs text-slate-300 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr
                      ? 'رسالة دعوة جاهزة للمشاركة بضغطة واحدة على واتساب.'
                      : 'Pre-written invite message ready for 1-click WhatsApp sharing.'}
                  </span>
                </div>

                {refError && (
                  <p role="alert" className="text-xs text-rose-300 font-medium">
                    {refError}
                  </p>
                )}

                <button
                  type="submit"
                  className="bubble-btn bubble-btn-primary w-full min-h-[44px] xl:min-h-[46px] px-4 xl:px-5 py-2.5 text-xs sm:text-sm font-bold gap-2 text-center leading-snug"
                >
                  <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'أنشئ كود الدعوة الآن' : 'Generate My Referral Code'}</span>
                </button>
              </form>
            )}
          </motion.article>

          {/* Tile 3: Free Printable Hero Certificate */}
          <motion.article
            {...cardMotionProps(2)}
            className="glass-card rounded-3xl p-5 xl:p-7 border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-slate-900/75 to-purple-950/40 flex flex-col justify-between gap-5 text-start"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2.5">
                <div className="w-11 h-11 xl:w-12 xl:h-12 rounded-2xl bg-amber-400/15 border border-amber-300/40 text-amber-300 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 xl:w-6 xl:h-6" aria-hidden="true" />
                </div>
                <span className="px-2.5 xl:px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/35 text-amber-200 text-[11px] xl:text-xs font-bold">
                  {isAr ? 'هدية مجانية فورية' : '100% Free Printable'}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg xl:text-xl font-extrabold font-editorial text-white">
                  {isAr ? 'شهادة بطل مجانية للطباعة' : 'Free Printable Hero Certificate'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isAr
                    ? 'صمّم وحمّل شهادة «بطل بابل فيرس المعتمد» باسم طفلك وصفته الخارقة كصورة PNG فائقة الدقة في 10 ثوانٍ مجاناً!'
                    : 'Design and download an Official Bubbleverse Little Hero Certificate PNG with your child’s name and superpower in 10 seconds — completely free!'}
                </p>
              </div>

              {/* Mini Certificate Visual Teaser */}
              <div
                aria-hidden="true"
                className="relative rounded-2xl p-4 bg-gradient-to-br from-[#0e1530] via-[#151e42] to-[#0a1026] border border-amber-300/45 shadow-inner overflow-hidden"
              >
                <div className="absolute inset-1.5 rounded-xl border border-amber-200/25 pointer-events-none" />
                <div className="relative z-10 text-center space-y-1.5 py-1">
                  <div className="inline-flex items-center justify-center gap-1 text-amber-300">
                    <Star className="w-4 h-4 fill-amber-300" />
                    <span className="text-[11px] font-bold tracking-wide uppercase">
                      {isAr ? 'بابل فيرس' : 'BUBBLEVERSE'}
                    </span>
                    <Star className="w-4 h-4 fill-amber-300" />
                  </div>
                  <p className="text-sm font-extrabold font-editorial text-amber-200">
                    {isAr ? 'شهادة بطل بابل فيرس المعتمد' : 'Official Little Hero Certificate'}
                  </p>
                  <p className="text-xs text-cyan-200/90 font-medium">
                    {isAr ? 'اسم طفلك • القوة الخارقة • ختم ذهبي' : 'Child’s Name • Superpower • Gold Seal'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Link
                to="/club"
                className="bubble-btn bubble-btn-primary w-full min-h-[44px] xl:min-h-[48px] px-4 xl:px-5 py-2.5 text-xs sm:text-sm font-bold gap-2 text-center leading-snug"
              >
                <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {isAr ? 'صمّم وحمّل الشهادة مجاناً' : 'Create Free Hero Certificate'}
                </span>
                <ArrowRight
                  className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </Link>
              <p className="text-[11px] text-center text-slate-400">
                {isAr
                  ? 'تحميل فوري بدون تسجيل دخول • جاهزة للطباعة أو المشاركة'
                  : 'Instant download, no login required • Ready to print or share'}
              </p>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
