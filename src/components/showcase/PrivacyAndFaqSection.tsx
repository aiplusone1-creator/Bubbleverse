import { motion, useReducedMotion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Trash2,
  EyeOff,
  Sparkles,
  Truck,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useLanguage } from '@/hooks/useLanguage';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface PrivacyPillar {
  id: string;
  icon: typeof EyeOff;
  accentClass: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
}

interface FaqEntry {
  id: string;
  icon: typeof ShieldCheck;
  badgeAr: string;
  badgeEn: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
}

const PRIVACY_PILLARS: PrivacyPillar[] = [
  {
    id: 'no-ads',
    icon: EyeOff,
    accentClass: 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300',
    titleAr: 'بدون استخدام في أي إعلان',
    titleEn: 'Zero Public Ads Usage',
    descAr:
      'لن نستخدم صورة طفلك أو كتابه في أي إعلان أبداً بدون موافقة كتابية صريحة منك.',
    descEn:
      "We never use your child's photo or custom storybook in any advertisement or public showcase without your explicit written consent.",
  },
  {
    id: 'no-training',
    icon: Lock,
    accentClass: 'bg-cyan-500/15 border-cyan-400/35 text-cyan-300',
    titleAr: 'بدون تدريب نماذج ذكاء عام',
    titleEn: 'Zero Public AI Model Training',
    descAr:
      'الصور تُستخدم فقط لتوليد كتاب طفلك داخل جلسة معزولة ولا تدخل في تدريب أي نماذج عامة.',
    descEn:
      "Reference photos are used strictly to illustrate your child's personal book inside an isolated session — never for public AI model training.",
  },
  {
    id: 'auto-purge',
    icon: Trash2,
    accentClass: 'bg-purple-500/15 border-purple-400/35 text-purple-300',
    titleAr: 'حذف تلقائي بعد الاستلام',
    titleEn: 'Auto-Purge After Delivery',
    descAr:
      'حذف تلقائي للصور المرجعية بعد استلامك الكتاب وتأكيد رضاك، أو فور طلبك في أي لحظة.',
    descEn:
      'Reference photos are automatically purged after you receive your book and confirm satisfaction — or immediately at any time upon your request.',
  },
  {
    id: 'pre-print-approval',
    icon: CheckCircle2,
    accentClass: 'bg-pink-500/15 border-pink-400/35 text-pink-300',
    titleAr: 'موافقة 100% قبل الطباعة',
    titleEn: '100% Pre-Print Approval',
    descAr:
      'تراجع المسودة الكاملة لكل صفحة وتوافق على شكل طفلك وتفاصيل القصة قبل ما تبدأ الطباعة.',
    descEn:
      'You review the complete page-by-page draft and approve every illustration and line of text before we ever send your book to print.',
  },
];

const FAQ_ITEMS: FaqEntry[] = [
  {
    id: 'faq-privacy',
    icon: ShieldCheck,
    badgeAr: 'الخصوصية وحذف الصور',
    badgeEn: 'Photo Privacy',
    questionAr: 'هل صور طفلي في أمان؟ وهل بتتشارك في إعلانات أو تفضل محفوظة عندكم؟',
    questionEn:
      "Are my child's photos safe? Are they ever shared in ads or kept indefinitely?",
    answerAr:
      'أمان صور أطفالك خط أحمر عندنا. الصورة المرجعية تُستخدم فقط داخل جلسة معزولة لرسم كتاب طفلك الخاص، ولا تُستخدم أبداً في أي إعلان أو تدريب نماذج عامة بدون موافقة كتابية صريحة. وبمجرد استلامك الكتاب وتأكيد رضاك — أو فور طلبك في أي وقت — يتم حذف الصور المرجعية نهائياً.',
    answerEn:
      "Your child's privacy is non-negotiable. Reference photos are used solely inside an isolated session to illustrate your personal book — never in advertisements or public AI training without explicit written consent. Once your order is delivered and confirmed, or immediately whenever you ask, your reference photos are permanently purged.",
  },
  {
    id: 'faq-likeness',
    icon: Sparkles,
    badgeAr: 'ثبات الملامح والجودة',
    badgeEn: 'Artisan Quality',
    questionAr: 'إزاي بتضمنوا إن ملامح طفلي تفضل ثابتة وواضحة في كل صفحات الكتاب (15–25 صفحة)؟',
    questionEn:
      "How do you keep my child's likeness consistent across all 15–25 illustrated pages?",
    answerAr:
      'قبل ما نرسم أي مشهد، بنجهّز أولاً لوحة شخصية مرجعية (Character Sheet) مخصوصة لطفلك تثبّت شكل عينيه وشعره وابتسامته وملابسه عبر تعبيرات مختلفة. بعدها بيتم رسم كل صفحة من الـ 15–25 صفحة بالاعتماد على نفس المرجع مع مراجعة فنية دقيقة لكل مشهد، عشان طفلك يشوف نفسه بنفس الملامح من الغلاف لآخر صفحة.',
    answerEn:
      "Before illustrating a single story scene, our studio builds a dedicated Master Character Sheet locking your child's eyes, hair, smile, and signature look across expressions. Every spread across all 15–25 pages is then illustrated against that sheet with careful art-direction review so your child stays unmistakably themselves from cover to finale.",
  },
  {
    id: 'faq-delivery',
    icon: Truck,
    badgeAr: 'سرعة التوصيل',
    badgeEn: 'Fast Delivery',
    questionAr: 'الكتاب بيوصل في قد إيه داخل مصر والسعودية والإمارات؟',
    questionEn:
      'How fast is delivery in Egypt, Saudi Arabia, and the UAE?',
    answerAr:
      'بدل الانتظار لأسابيع طويلة مع الشحن الخارجي، بنطبع ونجهّز الطلبات إقليمياً بسرعة وجودة عالية: النسخة الرقمية بتوصلك خلال 1–2 يوم عمل بعد موافقتك على المسودة، والكتاب المطبوع بغلاف مقوى بيوصلك خلال 3–5 أيام عمل داخل مصر، و4–7 أيام عمل في السعودية والإمارات (4–6 أيام للإمارات و5–7 أيام للسعودية).',
    answerEn:
      'Instead of waiting weeks for overseas fulfillment, we print and ship regionally: Digital PDF editions arrive within 1–2 business days after draft approval, while luxury hardcover books deliver in 3–5 business days across Egypt and 4–7 business days across the GCC (4–6 days in the UAE, 5–7 days in Saudi Arabia).',
  },
  {
    id: 'faq-payment',
    icon: Lock,
    badgeAr: 'الدفع والعربون',
    badgeEn: 'Deposit & Payments',
    questionAr: 'ليه في عربون 50% للنسخة المطبوعة؟ وإيه طرق الدفع المتاحة؟',
    questionEn:
      'Why is there a 50% deposit for printed books, and which payment methods are supported?',
    answerAr:
      'لأن كل كتاب يُرسم ويُطبع خصيصاً باسم وملامح طفلك فقط ولا يمكن إعادة بيعه لحد تاني، عربون الـ 50% بيحجز جلسة الرسم المخصصة ودورك في الطباعة مع الاحتفاظ بحقك الكامل في مراجعة المسودة قبل التنفيذ، والباقي عند تأكيد الطباعة أو الاستلام. ندعم إنستاباي (InstaPay) وفودافون كاش في مصر، ومدى وSTC Pay وApple Pay والبطاقات البنكية في الخليج ومصر.',
    answerEn:
      "Because every hardcover book is custom-illustrated and individually printed with your child's name and likeness, it can never be resold. The 50% deposit reserves your dedicated illustration session and print slot while keeping your 100% pre-print review protection, with the remaining balance settled at print confirmation or delivery. We support InstaPay, Vodafone Cash, Mada, STC Pay, Apple Pay, and major cards.",
  },
  {
    id: 'faq-approval',
    icon: CheckCircle2,
    badgeAr: 'مراجعة وتعديلات مجانية',
    badgeEn: '100% Draft Approval',
    questionAr: 'لو حبيت أعدّل تعبير أو تفصيلة في رسمة أو نص قبل الطباعة، هل التعديلات متاحة؟',
    questionEn:
      'Can I request tweaks to an illustration or wording before my book goes to print?',
    answerAr:
      'أكيد! مش بنطبع أي نسخة إلا بعد ما تشوف المسودة الكاملة صفحة بصفحة وتبعتلنا موافقتك الواضحة بنسبة 100%. لو حسّيت إن في تفصيلة في الملامح أو لون أو جملة محتاجة لمسة بسيطة، بنعدلها مجاناً لحد ما تكون راضي ومطمن تماماً إن النتيجة هتفرح طفلك.',
    answerEn:
      'Yes — we never send a book to print without your explicit 100% sign-off. You receive the full digital draft page by page and can request free tweaks to likeness details, expressions, or wording until every spread feels just right.',
  },
  {
    id: 'faq-languages',
    icon: HelpCircle,
    badgeAr: 'اللغات والنسخ الثنائية',
    badgeEn: 'Languages & Editions',
    questionAr: 'هل القصص متاحة بالعربي والإنجليزي أو بنسخة ثنائية اللغة؟',
    questionEn:
      'Are stories available in Arabic, English, or Bilingual editions?',
    answerAr:
      'نعم! تقدر تختار لغة كتاب طفلك باللغة العربية السلسة الدافئة، أو الإنجليزية الطبيعية، أو نسخة ثنائية اللغة (عربي + إنجليزي) تساعد طفلك يربط بين اللغتين بمتعة في نفس القصة، مع تنسيق طباعة احترافي يراعي اتجاه القراءة الصحيح لكل لغة.',
    answerEn:
      'Yes! Choose warm, natural Arabic, fluent English, or a Bilingual (Arabic + English) edition — perfect for bilingual households and building reading confidence in both languages with proper directional typography and layout.',
  },
];

export default function PrivacyAndFaqSection() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const shouldReduceMotion = Boolean(useReducedMotion());

  const sectionReveal = shouldReduceMotion
    ? { initial: { opacity: 1 }, whileInView: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: EASE_OUT },
      };

  return (
    <section
      id="privacy-faq"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-labelledby="privacy-shield-heading"
      className={`py-20 sm:py-28 px-4 sm:px-6 relative ${isRTL ? 'rtl' : ''}`}
    >
      <div className="bv-container space-y-14 sm:space-y-16">
        {/* Top Banner Card: 100% Zero-Retention Child Photo Privacy Shield */}
        <motion.div
          initial={sectionReveal.initial}
          whileInView={sectionReveal.whileInView}
          viewport={{ once: true, amount: 0.2 }}
          transition={sectionReveal.transition}
          className="relative glass-card rounded-3xl p-5 sm:p-7 lg:p-9 xl:p-12 border-emerald-400/25 overflow-hidden"
        >
          {/* Soft ambient Midnight Magic emerald/cyan halo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[34rem] h-[16rem] rounded-full bg-gradient-to-r from-emerald-500/18 via-cyan-500/16 to-purple-500/16 blur-3xl"
          />

          <div className="relative z-10 space-y-8 sm:space-y-10">
            {/* Privacy Shield Header */}
            <div className="text-center max-w-4xl mx-auto space-y-4">
              <div className="inline-flex items-center justify-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/12 border border-emerald-400/35 text-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
                <span className="text-xs sm:text-sm font-semibold">
                  {isAr ? 'ميثاق الأمان والخصوصية للأهل' : 'Zero-Retention Parent Privacy Pledge'}
                </span>
              </div>

              <h2
                id="privacy-shield-heading"
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-editorial leading-tight text-white text-balance"
              >
                {isAr ? (
                  <>
                    درع خصوصية صور أطفالك{' '}
                    <span className="font-numeric text-magical" dir="ltr">
                      100%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-numeric text-magical">100%</span> Child Photo{' '}
                    <span className="text-magical">Privacy Shield</span>
                  </>
                )}
              </h2>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
                {isAr
                  ? 'أنت بتأتمنّا على صورة طفلك عشان نصنع له ذكرى جميلة — عشان كده بنلتزم بأربع ضمانات واضحة لا استثناء فيها.'
                  : "You trust us with your child's photo to craft a lifelong keepsake — so we protect every family with four clear, verifiable commitments."}
              </p>
            </div>

            {/* 4 Verifiable Privacy Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
              {PRIVACY_PILLARS.map((pillar, index) => {
                const Icon = pillar.icon;
                return (
                  <motion.div
                    key={pillar.id}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 0.4, delay: index * 0.06, ease: EASE_OUT }
                    }
                    className="glass-card-inner rounded-2xl p-4 xl:p-5 flex flex-col gap-3 xl:gap-3.5 text-start border-white/10 bg-slate-950/55"
                  >
                    <div
                      className={`w-10 h-10 xl:w-11 xl:h-11 rounded-2xl border flex items-center justify-center shrink-0 ${pillar.accentClass}`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-sm lg:text-base xl:text-lg font-bold font-editorial text-white leading-snug">
                        {isAr ? pillar.titleAr : pillar.titleEn}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {isAr ? pillar.descAr : pillar.descEn}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Artisan Character-Sheet Quality & Fast Regional Delivery Promise Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 xl:gap-6 pt-2 border-t border-white/10">
              <div className="flex items-start gap-3.5 rounded-2xl bg-slate-950/60 border border-cyan-400/20 p-4 sm:p-5 text-start">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/35 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 text-cyan-300" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold font-editorial text-white">
                    {isAr
                      ? 'وعد جودة لوحة الشخصية في كل صفحة'
                      : 'Artisan Character-Sheet Quality Promise'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {isAr ? (
                      <>
                        بنثبّت ملامح طفلك بلوحة شخصية مرجعية ومراجعة فنية يدوية عبر{' '}
                        <span className="font-numeric font-semibold text-cyan-200" dir="ltr">
                          15–25
                        </span>{' '}
                        صفحة عشان تكون الرسومات متناسقة وحية في كل مشهد.
                      </>
                    ) : (
                      <>
                        Every book begins with a dedicated character reference sheet and human
                        art-direction checks across all{' '}
                        <span className="font-numeric font-semibold text-cyan-200">15–25</span>{' '}
                        pages for cohesive, living storybook likeness.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl bg-slate-950/60 border border-purple-400/20 p-4 sm:p-5 text-start">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-400/35 flex items-center justify-center shrink-0 mt-0.5">
                  <Truck className="w-5 h-5 text-purple-300" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold font-editorial text-white">
                    {isAr
                      ? 'توصيل إقليمي سريع بدون أسابيع انتظار'
                      : 'Fast Regional Delivery — No Weeks-Long Wait'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {isAr ? (
                      <>
                        طباعة وشحن محلي وإقليمي خلال{' '}
                        <span className="font-numeric font-semibold text-purple-200" dir="ltr">
                          3–5
                        </span>{' '}
                        أيام عمل في مصر و{' '}
                        <span className="font-numeric font-semibold text-purple-200" dir="ltr">
                          4–7
                        </span>{' '}
                        أيام عمل في السعودية والإمارات بعد موافقتك.
                      </>
                    ) : (
                      <>
                        Regional print &amp; courier delivery in{' '}
                        <span className="font-numeric font-semibold text-purple-200">3–5</span>{' '}
                        business days in Egypt and{' '}
                        <span className="font-numeric font-semibold text-purple-200">4–7</span>{' '}
                        business days across KSA &amp; UAE after your approval.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interactive Bilingual FAQ Accordion */}
        <motion.div
          initial={sectionReveal.initial}
          whileInView={sectionReveal.whileInView}
          viewport={{ once: true, amount: 0.15 }}
          transition={sectionReveal.transition}
          className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 xl:gap-14 items-start"
        >
          {/* Intro & Quick Reassurance Column */}
          <div className="lg:col-span-4 space-y-5 text-start lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-2 text-cyan-300">
              <HelpCircle className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold text-cyan-200/95">
                {isAr ? 'أسئلة تهم كل أم وأب' : 'Answers Parents Ask First'}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold font-editorial leading-tight text-white text-balance">
              {isAr ? (
                <>
                  كل إجابة واضحة{' '}
                  <span className="text-magical">قبل ما تطلب</span>
                </>
              ) : (
                <>
                  Clear Answers{' '}
                  <span className="text-magical">Before You Order</span>
                </>
              )}
            </h3>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {isAr
                ? 'جمعنالك أهم 6 أسئلة بتسألها العائلات عن خصوصية الصور، جودة الرسومات، سرعة الشحن، وطرق الدفع — بإجابات صريحة ومباشرة.'
                : 'Straightforward answers to the 6 questions families care about most — photo privacy, likeness consistency, delivery speed, payment security, and languages.'}
            </p>

            <div className="glass-card-inner rounded-2xl p-4 sm:p-5 space-y-2.5 border-white/10 bg-slate-950/50">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-200 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>
                  {isAr
                    ? 'حذف تلقائي للصور أو فور طلبك في أي وقت'
                    : 'Automatic photo purge or instant deletion on request'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-cyan-200 font-medium">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
                <span>
                  {isAr
                    ? 'مراجعة كاملة للمسودة مع تعديلات مجانية قبل الطباعة'
                    : 'Full draft review with free tweaks before printing'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-purple-200 font-medium">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" aria-hidden="true" />
                <span>
                  {isAr
                    ? 'عربي • إنجليزي • ثنائي اللغة لمصر والخليج'
                    : 'Arabic • English • Bilingual editions for Egypt & GCC'}
                </span>
              </div>
            </div>
          </div>

          {/* 6-Question Accessible Accordion Column */}
          <div className="lg:col-span-8">
            <Accordion
              type="single"
              collapsible
              defaultValue="faq-privacy"
              className="space-y-3.5"
            >
              {FAQ_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <AccordionItem
                    key={item.id}
                    value={item.id}
                    className="glass-card rounded-2xl border border-white/12 px-4 sm:px-5 xl:px-6 transition-colors data-[state=open]:border-cyan-400/35"
                  >
                    <AccordionTrigger className="min-h-[56px] xl:min-h-[60px] py-3.5 sm:py-4 xl:py-5 gap-3 sm:gap-4 text-start hover:no-underline text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary rounded-xl [&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-cyan-300">
                      <span className="flex items-center gap-3.5 min-w-0">
                        <span
                          aria-hidden="true"
                          className="w-9 h-9 rounded-xl bg-slate-950/70 border border-white/12 flex items-center justify-center shrink-0 text-cyan-300"
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="flex flex-col items-start gap-1 min-w-0">
                          <span className="text-[11px] sm:text-xs font-semibold text-cyan-300/90">
                            {isAr ? item.badgeAr : item.badgeEn}
                          </span>
                          <span className="text-sm sm:text-base font-bold font-editorial text-white leading-snug">
                            {isAr ? item.questionAr : item.questionEn}
                          </span>
                        </span>
                      </span>
                    </AccordionTrigger>

                    <AccordionContent className="pb-5 pt-1 text-start">
                      <div className="pt-3 border-t border-white/10 text-sm sm:text-base text-slate-300 leading-relaxed">
                        {isAr ? item.answerAr : item.answerEn}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
