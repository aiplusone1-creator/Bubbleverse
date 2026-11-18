import { motion, useReducedMotion } from 'framer-motion';
import { Camera, Eye, Gift, ShieldCheck, Wand2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const FeatureCards = () => {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const shouldReduceMotion = Boolean(useReducedMotion());

  const steps = [
    {
      number: '01',
      icon: Camera,
      accentClass: 'bg-cyan-500/15 border-cyan-400/35 text-cyan-300',
      badgeClass: 'text-cyan-300',
      titleAr: 'اختار القصة وارفع صورة',
      titleEn: 'Pick a Story & Add a Photo',
      descAr:
        'اختار المغامرة اللي شبه طفلك، اكتب اسمه وعمره، وارفع صورة واحدة واضحة لوشه الجميل من موبايلك.',
      descEn:
        'Choose the adventure they will adore, add their name and age, and upload one clear photo right from your phone.',
    },
    {
      number: '02',
      icon: Eye,
      accentClass: 'bg-purple-500/15 border-purple-400/35 text-purple-300',
      badgeClass: 'text-purple-300',
      titleAr: 'راجع المسودة ووافق عليها',
      titleEn: 'Review & Approve Your Draft',
      descAr:
        'بنرسملك القصة كاملة بملامح طفلك ونبعتهالك تراجع كل صفحة براحتك وتطلب أي تعديل قبل ما نطبع.',
      descEn:
        'We illustrate your child into every spread and send you the complete draft so you can review and tweak freely before printing.',
    },
    {
      number: '03',
      icon: Gift,
      accentClass: 'bg-pink-500/15 border-pink-400/35 text-pink-300',
      badgeClass: 'text-pink-300',
      titleAr: 'طباعة فاخرة لباب البيت',
      titleEn: 'Heirloom Print to Your Door',
      descAr:
        'أول ما توافق على المسودة، بنطبع الكتاب بغلاف مقوى فاخر وألوان زاهية ونوصّله لحد عندك — أو تستلم النسخة الرقمية فوراً.',
      descEn:
        'Once you love every single page, we print your hardcover keepsake with vivid colors and ship it to your door — or deliver an instant digital copy.',
    },
  ];

  const guaranteePoints = isAr
    ? [
        'بتشوف كل الصفحات بملامح طفلك قبل الطباعة',
        'تعديلات مرنة لحد ما تطمن وتفرح بالنتيجة',
        'مفيش أي مفاجآت — اللي بتوافق عليه هو اللي بيوصلك',
      ]
    : [
        'Preview every illustrated page before printing',
        'Flexible tweaks until every smile feels just right',
        'Zero surprises — what you approve is what arrives',
      ];

  return (
    <section
      id="features"
      className={`py-20 sm:py-28 px-4 sm:px-6 relative ${isRTL ? 'rtl' : ''}`}
    >
      <div className="bv-container space-y-12">
        {/* Section Header */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT }}
          className="text-center max-w-4xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center justify-center gap-2.5 text-primary">
            <Wand2 className="w-6 h-6 text-primary shrink-0" aria-hidden="true" />
            <span className="text-sm sm:text-base font-semibold text-cyan-200/95">
              {isAr ? 'إزاي بتعمل قصتك؟' : 'How It Works'}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-editorial leading-tight text-white text-balance">
            {isAr ? (
              <>
                في <span className="font-numeric text-magical">3</span> خطوات بسيطة...{' '}
                <span className="text-magical">حكاية طفلك جاهزة!</span>
              </>
            ) : (
              <>
                <span className="font-numeric text-magical">3</span> Simple Steps to{' '}
                <span className="text-magical">Their Forever Book</span>
              </>
            )}
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'سهّلنا عليك كل حاجة من أول اختيار القصة لحد ما طفلك يفتحها ويبتسم — وخطوة بخطوة معاك لحد باب البيت.'
              : 'Simple from start to unboxing — share a photo, approve every page, and watch your child beam when their book arrives.'}
          </p>
        </motion.div>

        {/* 3 Clear Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.45, delay: index * 0.08, ease: EASE_OUT }
                }
                className="glass-card rounded-3xl p-5 lg:p-7 xl:p-8 flex flex-col justify-between gap-5 lg:gap-6 border-white/12 text-start"
              >
                <div className="space-y-4 lg:space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`w-11 h-11 lg:w-12 lg:h-12 rounded-2xl border flex items-center justify-center shrink-0 ${step.accentClass}`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span
                      className={`font-numeric text-xl lg:text-2xl font-extrabold opacity-80 ${step.badgeClass}`}
                    >
                      {step.number}
                    </span>
                  </div>

                  <div className="space-y-2 lg:space-y-2.5">
                    <h3 className="text-lg lg:text-xl xl:text-2xl font-bold font-editorial text-white leading-snug">
                      {isAr ? step.titleAr : step.titleEn}
                    </h3>
                    <p className="text-sm xl:text-base text-slate-300 leading-relaxed">
                      {isAr ? step.descAr : step.descEn}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 100% Draft Review Guarantee Before Printing */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT }}
          className="glass-card rounded-3xl p-5 sm:p-7 lg:p-9 xl:p-11 border-emerald-400/30 bg-gradient-to-br from-emerald-950/35 via-slate-900/75 to-cyan-950/30"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-start">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-[0_0_24px_rgba(16,185,129,0.22)]">
                <ShieldCheck className="w-5 h-5 text-emerald-300" aria-hidden="true" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-extrabold font-editorial text-white leading-snug">
                  {isAr ? (
                    <>
                      ضمان مراجعة المسودة{' '}
                      <span className="font-numeric text-emerald-300">100%</span> قبل الطباعة
                    </>
                  ) : (
                    <>
                      <span className="font-numeric text-emerald-300">100%</span> Draft Review
                      Guarantee Before Printing
                    </>
                  )}
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {isAr
                    ? 'حقك تشوف ملامح طفلك وكل صفحة في القصة وتطمن لكل تفصيلة قبل ما ندخل المطبعة. رضاك وفرحة طفلك أهم حاجة عندنا.'
                    : 'You review every single illustrated page first and approve your child’s likeness before we ever start printing. Zero risk, pure joy.'}
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-2.5">
              {guaranteePoints.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-2.5 rounded-2xl bg-slate-950/55 border border-white/10 px-4 py-3 text-start"
                >
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-400 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-xs sm:text-sm font-medium text-slate-200">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureCards;
