import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Camera,
  Wand2,
  Smile,
  Compass,
  Palette,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface ProofCardItem {
  id: string;
  icon: typeof Smile;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  variations: {
    labelAr: string;
    labelEn: string;
    image: string;
    altAr: string;
    altEn: string;
  }[];
}

const PROOF_CARDS: ProofCardItem[] = [
  {
    id: 'expressions',
    icon: Smile,
    titleAr: 'مشاعر وتعبيرات حقيقية',
    titleEn: 'Living Storybook Expressions',
    subtitleAr: 'ضحكته ودهشته وشجاعته تتفاعل مع كل موقف في القصة.',
    subtitleEn: 'Real joy, curious wonder, and proud smiles that match every scene.',
    variations: [
      {
        labelAr: 'فرحة وضحكة',
        labelEn: 'Joyful Smile',
        image: '/bubble-books/hero-left.jpg',
        altAr: 'طفل يبتسم بفرح في مشهد قصصي مصوّر',
        altEn: 'Illustrated child smiling joyfully in a storybook scene',
      },
      {
        labelAr: 'شجاعة وبطولة',
        labelEn: 'Brave Hero',
        image: '/catalog/superhero-academy.jpg',
        altAr: 'طفل بطل شجاع في مغامرة مصوّرة',
        altEn: 'Illustrated child dressed as a brave storybook hero',
      },
      {
        labelAr: 'فضول واكتشاف',
        labelEn: 'Curious Explorer',
        image: '/catalog/dinosaur-valley.jpg',
        altAr: 'طفل يستكشف عالم الديناصورات بفضول',
        altEn: 'Illustrated child exploring a friendly dinosaur valley',
      },
    ],
  },
  {
    id: 'continuity',
    icon: Compass,
    titleAr: 'نفس الملامح في كل صفحة',
    titleEn: 'True Likeness on Every Page',
    subtitleAr: 'من أول صفحة لآخرها، طفلك هو نفس البطل بعيونه وشعره.',
    subtitleEn: 'Consistent eyes, curls, and charm from cover to final spread.',
    variations: [
      {
        labelAr: 'إطلالة دافئة',
        labelEn: 'Front Portrait',
        image: '/bubble-books/hero-right.jpg',
        altAr: 'طفل يقرأ كتاباً مصوراً بإطلالة مباشرة دافئة',
        altEn: 'Warm front portrait of an illustrated child reading',
      },
      {
        labelAr: 'قبل النوم',
        labelEn: 'Dreamy Night',
        image: '/catalog/bedtime-magic.jpg',
        altAr: 'مشهد ليلي حالم لطفل بين النجوم قبل النوم',
        altEn: 'Calm starlight bedtime illustration of a child',
      },
      {
        labelAr: 'انطلاق ومغامرة',
        labelEn: 'Action Scene',
        image: '/bubble-books/jungle.jpg',
        altAr: 'طفل في مغامرة غابة مليئة بالحركة والمرح',
        altEn: 'Dynamic jungle adventure illustration of a child',
      },
    ],
  },
  {
    id: 'styles',
    icon: Palette,
    titleAr: 'أنماط رسم تخطف العين',
    titleEn: 'Fine Art Storybook Styles',
    subtitleAr: 'اختار الجو الفني اللي يناسب عمر طفلك وذوقك.',
    subtitleEn: 'Pick the illustration atmosphere that matches their imagination.',
    variations: [
      {
        labelAr: 'سينمائي مجسّم',
        labelEn: 'Cinematic 3D',
        image: '/showcase/career/career-astronaut.jpg',
        altAr: 'رسم سينمائي مجسّم لطفل رائد فضاء',
        altEn: 'Cinematic 3D style illustration of a child astronaut',
      },
      {
        labelAr: 'خيال ملون',
        labelEn: 'Vibrant Fantasy',
        image: '/catalog/dinosaur-valley.jpg',
        altAr: 'رسم خيالي ملون لطفل في عالم المغامرات',
        altEn: 'Vibrant fantasy storybook illustration',
      },
      {
        labelAr: 'ألوان هادئة',
        labelEn: 'Soft Watercolor',
        image: '/catalog/bedtime-magic.jpg',
        altAr: 'رسم بألوان مائية ناعمة لقصة قبل النوم',
        altEn: 'Soft watercolor bedtime illustration',
      },
    ],
  },
];

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export default function CharacterControlShowcase() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const shouldReduceMotion = Boolean(useReducedMotion());

  const [revealPercent, setRevealPercent] = useState(48);
  const [activeCycleIndex, setActiveCycleIndex] = useState(0);
  const [userSelected, setUserSelected] = useState<Record<string, number>>({});

  useEffect(() => {
    if (shouldReduceMotion) return;
    const timer = setInterval(() => {
      setActiveCycleIndex((prev) => (prev + 1) % 3);
    }, 5200);
    return () => clearInterval(timer);
  }, [shouldReduceMotion]);

  const handleSelectVariation = (cardId: string, index: number) => {
    setUserSelected((prev) => ({ ...prev, [cardId]: index }));
  };

  const transformationPoints = isAr
    ? [
        'بنحافظ على ابتسامة طفلك ولون عينيه وتفاصيل شعره بدقة فنية عالية.',
        'صورته محفوظة بأمان تام ومابتستخدمش غير لرسم كتابه الخاص.',
        'بتستلم المسودة وتراجع شكل طفلك في كل صفحة قبل الطباعة.',
      ]
    : [
        "Preserves your child's genuine smile, eyes, and hair with artisan care.",
        'Your photo stays private and is used only to craft their personal book.',
        'You review every single illustrated page before we ever send to print.',
      ];

  return (
    <section
      className={`py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden ${isRTL ? 'rtl' : ''}`}
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
            <Sparkles className="w-6 h-6 text-primary shrink-0" aria-hidden="true" />
            <span className="text-sm sm:text-base font-semibold text-cyan-200/95">
              {isAr ? 'سحر التحوّل من أول نظرة' : 'See the Storybook Transformation'}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-editorial leading-tight text-white text-balance">
            {isAr ? (
              <>
                من صورة على موبايلك...{' '}
                <span className="text-magical">لبطل في كتاب حقيقي!</span>
              </>
            ) : (
              <>
                From a Phone Snapshot...{' '}
                <span className="text-magical">to a Storybook Star!</span>
              </>
            )}
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'اسحب الخط السحري وشوف بنفسك إزاي بنحوّل صورة طفلك العادية لرسومات فنية ساحرة بملامحه الحقيقية في كل مشهد.'
              : "Slide the magic beam to watch an everyday photo transform into a luminous storybook hero — keeping your child's real likeness in every scene."}
          </p>
        </motion.div>

        {/* Interactive Before / After Transformation Stage */}
        <div className="glass-card rounded-3xl p-5 sm:p-6 lg:p-10 xl:p-12 border-white/15">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 xl:gap-16 items-center">
            {/* Before / After Interactive Reveal Frame (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div
                dir="ltr"
                className="relative aspect-[4/3] max-h-[36rem] w-full mx-auto rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-2xl select-none"
              >
                {/* Base Layer: AFTER (Storybook Hero) */}
                <img
                  src="/showcase/character/likeness-pixar.jpg"
                  alt={
                    isAr
                      ? 'بعد التحوّل: رسم قصصي ساحر لطفل بملامحه الحقيقية'
                      : 'After transformation: illustrated storybook hero preserving child likeness'
                  }
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Subtle Iridescent Shimmer Sweep over Illustrated Side */}
                {!shouldReduceMotion && (
                  <motion.div
                    aria-hidden="true"
                    initial={{ x: '-100%' }}
                    animate={{ x: '220%' }}
                    transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
                    className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent skew-x-[-20deg]"
                  />
                )}

                {/* Clipped Top Layer: BEFORE (Real Photo) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - revealPercent}% 0 0)` }}
                >
                  <img
                    src="/showcase/character/likeness-real.jpg"
                    alt={
                      isAr
                        ? 'قبل التحوّل: صورة حقيقية للطفل'
                        : 'Before transformation: original child photograph'
                    }
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Soft Bottom Readability Vignette */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent"
                />

                {/* Corner Labels matching each half */}
                <div className="pointer-events-none absolute top-3.5 left-3.5 z-10 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-xs font-semibold text-slate-100">
                  {isAr ? 'قبل: الصورة الحقيقية' : 'Before: Real Photo'}
                </div>
                <div className="pointer-events-none absolute top-3.5 right-3.5 z-10 px-3 py-1.5 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-300/40 text-xs font-semibold text-cyan-100">
                  {isAr ? 'بعد: بطل الحكاية' : 'After: Story Hero'}
                </div>

                {/* Glowing Vertical Magic Divider Beam */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-gradient-to-b from-cyan-300 via-white to-pink-400 shadow-[0_0_18px_rgba(0,217,255,0.9)]"
                  style={{ left: `${revealPercent}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-950/90 border-2 border-cyan-300 shadow-[0_0_24px_rgba(0,217,255,0.7)] flex items-center justify-center text-cyan-200">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                </div>

                {/* Accessible Full-Area Range Slider */}
                <input
                  type="range"
                  min={8}
                  max={92}
                  value={revealPercent}
                  onChange={(e) => setRevealPercent(Number(e.target.value))}
                  aria-label={
                    isAr
                      ? 'اسحب للمقارنة بين صورة الطفل الحقيقية ورسمه كبطل في القصة'
                      : 'Drag to compare original child photo with illustrated storybook hero'
                  }
                  className="absolute inset-0 z-30 w-full h-full opacity-0 cursor-ew-resize focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              {/* Quick Accessible Snap Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2 xl:gap-2.5">
                <button
                  type="button"
                  onClick={() => setRevealPercent(84)}
                  className={`min-h-[42px] xl:min-h-[44px] px-3 lg:px-3.5 xl:px-4 py-2 rounded-full text-xs xl:text-sm font-semibold inline-flex items-center gap-1.5 xl:gap-2 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    revealPercent >= 70
                      ? 'bg-white/15 border-white/35 text-white'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'شوف الصورة الأصلية' : 'View Original Photo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRevealPercent(48)}
                  className={`min-h-[42px] xl:min-h-[44px] px-3 lg:px-3.5 xl:px-4 py-2 rounded-full text-xs xl:text-sm font-semibold inline-flex items-center gap-1.5 xl:gap-2 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    revealPercent > 30 && revealPercent < 70
                      ? 'bg-primary/20 border-primary/50 text-cyan-100'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'مقارنة النص بالنص' : 'Split Compare'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRevealPercent(14)}
                  className={`min-h-[42px] xl:min-h-[44px] px-3 lg:px-3.5 xl:px-4 py-2 rounded-full text-xs xl:text-sm font-semibold inline-flex items-center gap-1.5 xl:gap-2 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    revealPercent <= 30
                      ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border-cyan-400/50 text-white'
                      : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <Wand2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'شوف بطل الحكاية' : 'Reveal Story Hero'}</span>
                </button>
              </div>
            </div>

            {/* Warm Editorial Narrative (6 cols) */}
            <div className="lg:col-span-6 space-y-6 text-start">
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl font-bold font-editorial text-white leading-snug">
                  {isAr
                    ? 'مش مجرد رسمة شبهه... ده طفلك فعلاً جوه القصة!'
                    : "Not a Generic Character — It's Truly Your Child Inside the Book!"}
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {isAr
                    ? 'أحلى لحظة عندنا لما الطفل يفتح كتابه لأول مرة ويصرخ بفرحة: "ده أنا يا ماما!" — عشان كده بنهتم بأدق تفاصيل وشه وتعبيراته في كل صفحة.'
                    : 'Our favorite moment is when a child opens their book and gasps, "Wait — that is ME!" That is why we preserve every warm detail of their face across the entire adventure.'}
                </p>
              </div>

              <ul className="space-y-3.5">
                {transformationPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 rounded-2xl bg-slate-950/50 border border-white/10 p-4"
                  >
                    <CheckCircle2
                      className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span className="text-sm sm:text-base text-slate-200 leading-relaxed">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 3 Clean Interactive Proof Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
          {PROOF_CARDS.map((card) => {
            const Icon = card.icon;
            const activeIndex =
              userSelected[card.id] !== undefined
                ? userSelected[card.id]
                : activeCycleIndex % card.variations.length;
            const currentVariation = card.variations[activeIndex] || card.variations[0];

            return (
              <div
                key={card.id}
                className="glass-card rounded-3xl p-4 lg:p-5 xl:p-6 flex flex-col justify-between gap-3.5 lg:gap-4 border-white/10"
              >
                <div className="flex items-center gap-2.5 lg:gap-3">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 text-start">
                    <h3 className="text-base xl:text-lg font-bold font-editorial text-white leading-snug">
                      {isAr ? card.titleAr : card.titleEn}
                    </h3>
                  </div>
                </div>

                {/* Preview Frame */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-white/10">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`${card.id}-${activeIndex}`}
                      src={currentVariation.image}
                      alt={isAr ? currentVariation.altAr : currentVariation.altEn}
                      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed text-start">
                  {isAr ? card.subtitleAr : card.subtitleEn}
                </p>

                {/* Variation Switcher Pills */}
                <div className="flex flex-wrap gap-1.5 xl:gap-2 pt-2 border-t border-white/10">
                  {card.variations.map((v, vIdx) => {
                    const isSelected = activeIndex === vIdx;
                    return (
                      <button
                        key={v.labelEn}
                        type="button"
                        onClick={() => handleSelectVariation(card.id, vIdx)}
                        className={`min-h-[36px] xl:min-h-[38px] px-2.5 xl:px-3 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          isSelected
                            ? 'bg-gradient-to-r from-cyan-500/90 to-purple-600/90 text-white shadow-sm'
                            : 'bg-slate-900/75 text-slate-300 border border-white/10 hover:border-primary/40 hover:text-white'
                        }`}
                      >
                        {isAr ? v.labelAr : v.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
