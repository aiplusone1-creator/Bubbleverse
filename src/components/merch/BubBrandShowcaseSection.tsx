import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Gift,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Heart,
  PackageCheck,
} from 'lucide-react';
import TiltBookCard from '@/components/ui/TiltBookCard';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { type GwpConfigRecord } from '@/features/commerce/gwpEngine';
import { getGwpConfig } from '@/lib/localStore';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function formatBooksAr(count: number): string {
  if (count === 1) return 'كتاب واحد';
  if (count === 2) return 'كتابين';
  return `${count} كتب`;
}

function buildHomepageGwpLine(config: GwpConfigRecord, isAr: boolean): string {
  const retailText = isAr
    ? `${config.retailValueEgp} ج.م • ${config.retailValueSar} ر.س • ${config.retailValueAed} د.إ`
    : `${config.retailValueEgp} EGP • ${config.retailValueSar} SAR • ${config.retailValueAed} AED`;

  if (config.triggerMode === 'min_books') {
    return isAr
      ? `احصل على كورة Bub القطيفة (بقيمة ${retailText}) مجاناً تلقائياً مع طلب ${formatBooksAr(config.minBooks)} أو أكثر.`
      : `Get Official Bub Plush (worth ${retailText}) FREE automatically when you order ${config.minBooks}+ books.`;
  }

  if (config.triggerMode === 'min_subtotal') {
    return isAr
      ? `احصل على كورة Bub القطيفة (بقيمة ${retailText}) مجاناً تلقائياً مع أي طلب بقيمة ${config.minSubtotalEgp} ج.م (${config.minSubtotalSar} ر.س / د.إ) أو أكثر.`
      : `Get Official Bub Plush (worth ${retailText}) FREE automatically on orders of ${config.minSubtotalEgp} EGP (${config.minSubtotalSar} SAR / AED) or more.`;
  }

  return isAr
    ? `احصل على كورة Bub القطيفة (بقيمة ${retailText}) مجاناً تلقائياً مع طلب ${formatBooksAr(config.minBooks)} أو أي طلب فوق ${config.minSubtotalEgp} ج.م (${config.minSubtotalSar} ر.س / د.إ).`
    : `Get Official Bub Plush (worth ${retailText}) FREE automatically with ${config.minBooks}+ books or any order over ${config.minSubtotalEgp} EGP (${config.minSubtotalSar} SAR / AED).`;
}

export function BubBrandShowcaseSection() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [gwpConfig, setGwpConfig] = useState<GwpConfigRecord>(() => getGwpConfig());

  useEffect(() => {
    const syncGwp = () => setGwpConfig(getGwpConfig());
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'bubbleverse_gwp_config_v1') {
        syncGwp();
      }
    };

    window.addEventListener('bubbleverse:gwp-updated', syncGwp);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('bubbleverse:gwp-updated', syncGwp);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const gwpSummary = buildHomepageGwpLine(gwpConfig, isAr);

  const highlights = [
    {
      icon: Heart,
      iconClass: 'text-pink-300',
      labelAr: 'قطيفة متلألئة ناعمة للحضن',
      labelEn: 'Ultra-soft iridescent plush',
    },
    {
      icon: ShieldCheck,
      iconClass: 'text-cyan-300',
      labelAr: 'آمنة 0+ بعيون مطرّزة 100%',
      labelEn: '0+ safe embroidered details',
    },
    {
      icon: PackageCheck,
      iconClass: 'text-purple-300',
      labelAr: 'تغليف هدايا فاخر جاهز',
      labelEn: 'Gift-ready keepsake box',
    },
  ];

  return (
    <section
      id="bub-brand-world"
      aria-label={isAr ? 'عالم منتجات بابل فيرس وكورة Bub القطيفة' : 'Bubbleverse Kids Brand & Bub Plush'}
      className={`py-20 sm:py-28 px-4 sm:px-6 relative ${isRTL ? 'rtl' : ''}`}
    >
      <div className="bv-container">
        <div className="glass-card rounded-[2rem] p-5 sm:p-7 lg:p-10 xl:p-14 border border-cyan-400/20 bg-gradient-to-br from-slate-900/85 via-slate-950/75 to-purple-950/35 relative overflow-hidden">
          {/* Subtle Ambient Glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -end-20 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -start-20 w-72 h-72 rounded-full bg-pink-500/15 blur-3xl"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 xl:gap-16 items-center">
            {/* Editorial Copy Column */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT }}
              className="lg:col-span-6 space-y-5 xl:space-y-6 text-center lg:text-start"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs sm:text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>
                  {isAr ? 'عالم منتجات بابل فيرس للأطفال' : 'Official Bubbleverse Kids Brand'}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-[2rem] xl:text-[2.65rem] font-extrabold font-editorial leading-tight text-white text-balance">
                {isAr ? (
                  <>
                    تعرّف على <span className="text-magical">كورة Bub القطيفة</span>... رفيق طفلك من
                    صفحات القصة إلى حضنه!
                  </>
                ) : (
                  <>
                    Meet <span className="text-magical">Bub the Plush Ball</span> — From the Story
                    Page Into Their Arms!
                  </>
                )}
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {isAr
                  ? 'بابل فيرس مش مجرد كتاب — ده عالم كامل بيكبر مع طفلك! كورة Bub القطيفة المتلألئة بتحوّل بطل الحكاية لصديق حقيقي يرافق طفلك وقت اللعب والقراءة قبل النوم، ومعاها صناديق هدايا فاخرة، أباجورة نجوم، وشنط أبطال.'
                  : 'Bubbleverse is more than a storybook — it’s a complete kids’ world! Our signature iridescent Bub Plush Ball brings storytime to life for daily play and cozy bedtime hugs, alongside magnetic gift boxes, starlight lamps, and hero backpacks.'}
              </p>

              {/* Dynamic Free Bub GWP Callout */}
              {gwpConfig.enabled && (
                <div className="rounded-2xl p-4 sm:p-5 border border-emerald-400/35 bg-emerald-950/35 text-start flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-emerald-300" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-300">
                      {isAr ? 'هدية مجانية مع طلبات القصص المؤهلة!' : 'FREE Gift-With-Purchase!'}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                      {gwpSummary}
                    </p>
                  </div>
                </div>
              )}

              {/* 3 Breathable Highlights */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2.5">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <span
                      key={item.labelEn}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/60 border border-white/10 text-xs font-medium text-slate-200"
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${item.iconClass}`} aria-hidden="true" />
                      <span>{isAr ? item.labelAr : item.labelEn}</span>
                    </span>
                  );
                })}
              </div>

              {/* Dual Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-2.5 xl:gap-3 pt-1">
                <Button
                  asChild
                  size="lg"
                  className="min-h-[44px] xl:min-h-[48px] h-auto py-2.5 xl:py-3 px-4 xl:px-5 text-xs sm:text-sm gap-2 whitespace-normal text-center leading-snug"
                >
                  <Link to="/merch">
                    <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'إلى متجر بابل فيرس' : 'Shop Bubbleverse Merch'}</span>
                    <ArrowRight
                      className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="min-h-[44px] xl:min-h-[48px] h-auto py-2.5 xl:py-3 px-4 xl:px-5 text-xs sm:text-sm gap-2 whitespace-normal text-center leading-snug border-emerald-400/35 bg-slate-950/65 hover:bg-slate-900 text-white"
                >
                  <Link to="/stories">
                    <Gift className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
                    <span>
                      {isAr
                        ? 'اطلب قصتك وافتح هدية Bub'
                        : 'Order Your Story & Unlock Free Bub'}
                    </span>
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Side-by-Side Visual Showcase: Bub Plush Ball + Story Gift Box */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={
                shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.08, ease: EASE_OUT }
              }
              className="lg:col-span-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 xl:gap-6 items-stretch">
                {/* Card 1: Iconic Bub Iridescent Plush Ball */}
                <TiltBookCard
                  maxTilt={8}
                  scaleOnHover={1.025}
                  glareMaxOpacity={0.24}
                  className="rounded-3xl"
                >
                  <Link
                    to="/merch/bub-plush-ball"
                    className="group flex flex-col h-full rounded-3xl overflow-hidden bg-slate-950/85 border border-cyan-400/25 shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-slate-950">
                      <img
                        src="/artwork/merch-plush.webp"
                        alt={
                          isAr
                            ? 'كورة باب القطيفة المتلألئة من بابل فيرس'
                            : 'Official Bub Iridescent Plush Ball Toy'
                        }
                        decoding="sync"
                        className="w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="p-3.5 xl:p-4 text-start space-y-1 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-cyan-300">
                          {isAr ? 'هدية مجانية أو شراء منفصل' : 'Free Gift or Standalone'}
                        </span>
                        <h3 className="text-sm xl:text-base font-bold font-editorial text-white mt-0.5">
                          {isAr ? 'كورة Bub القطيفة' : 'Official Bub Plush Ball'}
                        </h3>
                      </div>
                      <p className="text-[11px] xl:text-xs text-slate-300 font-numeric pt-1">
                        {isAr ? 'يبدأ من 190 ج.م • 49 ر.س • 49 د.إ' : 'From 190 EGP • 49 SAR • 49 AED'}
                      </p>
                    </div>
                  </Link>
                </TiltBookCard>

                {/* Card 2: Ultimate Story + Bub Magnetic Gift Box */}
                <TiltBookCard
                  maxTilt={8}
                  scaleOnHover={1.025}
                  glareMaxOpacity={0.24}
                  className="rounded-3xl"
                >
                  <Link
                    to="/merch/story-bub-giftbox"
                    className="group flex flex-col h-full rounded-3xl overflow-hidden bg-slate-950/85 border border-pink-400/25 shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-slate-950">
                      <img
                        src="/artwork/merch-giftbox.webp"
                        alt={
                          isAr
                            ? 'صندوق القصة الفاخر مع كورة باب القطيفة'
                            : 'Ultimate Story + Bub Magnetic Keepsake Gift Box'
                        }
                        decoding="sync"
                        className="w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="p-3.5 xl:p-4 text-start space-y-1 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-pink-300">
                          {isAr ? 'باقة الهدايا • وفّر 18%' : 'Gift Bundle • Save 18%'}
                        </span>
                        <h3 className="text-sm xl:text-base font-bold font-editorial text-white mt-0.5">
                          {isAr ? 'صندوق القصة + كورة Bub' : 'Story + Bub Gift Box'}
                        </h3>
                      </div>
                      <p className="text-[11px] xl:text-xs text-slate-300 font-numeric pt-1">
                        {isAr ? '690 ج.م • 169 ر.س • 169 د.إ' : '690 EGP • 169 SAR • 169 AED'}
                      </p>
                    </div>
                  </Link>
                </TiltBookCard>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BubBrandShowcaseSection;
