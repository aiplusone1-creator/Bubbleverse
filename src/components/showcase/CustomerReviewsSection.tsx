import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  Heart,
  Sparkles,
  BookOpen,
  Wand2,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { getShowcaseConfig, CustomerReviewConfig } from '@/features/showcase/showcaseConfig';
import BubbleButton from '@/components/BubbleButton';

interface CustomerReviewsSectionProps {
  onStartCreating?: () => void;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const EN_PARENT_NAME_FALLBACKS: Record<string, string> = {
  'rev-1': 'Um Seif El-Din',
  'rev-2': 'Abu Fahad Al-Otaibi',
  'rev-3': 'Dr. Marwa El-Sherif',
};

function sanitizeArabicText(text: string): string {
  return text
    .replace(/نسخة\s+الـ\s*PDF/gi, 'النسخة الرقمية')
    .replace(/الـ\s*PDF/gi, 'الرقمية')
    .replace(/\bPDF\b/gi, 'رقمية')
    .replace(/Bubbleverse/gi, 'بابل فيرس')
    .replace(/[A-Za-z]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function sanitizeEnglishText(text: string): string {
  return text
    .replace(/[\u0600-\u06FF]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getLocalizedParentName(rev: CustomerReviewConfig, isAr: boolean): string {
  if (isAr) {
    return sanitizeArabicText(rev.parentName) || rev.parentName;
  }
  if (EN_PARENT_NAME_FALLBACKS[rev.id]) {
    return EN_PARENT_NAME_FALLBACKS[rev.id];
  }
  const cleaned = sanitizeEnglishText(rev.parentName);
  return cleaned || 'Happy Parent';
}

export default function CustomerReviewsSection({
  onStartCreating,
}: CustomerReviewsSectionProps) {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [config] = useState(() => getShowcaseConfig());

  const paymentMethods = isAr
    ? [
        'فودافون كاش',
        'إنستاباي',
        'مدى',
        'إس تي سي باي',
        'آبل باي',
        'فيزا وماستركارد',
      ]
    : [
        'Vodafone Cash',
        'InstaPay',
        'Mada',
        'STC Pay',
        'Apple Pay',
        'Visa & Mastercard',
      ];

  const handleCreateCustom = () => {
    if (onStartCreating) {
      onStartCreating();
      return;
    }
    navigate('/stories');
  };

  return (
    <section className={`py-20 sm:py-28 px-4 sm:px-6 relative ${isRTL ? 'rtl' : ''}`}>
      <div className="bv-container space-y-14">
        {/* Section Header */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT }}
          className="text-center max-w-4xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center justify-center gap-2.5 text-emerald-300">
            <Heart className="w-6 h-6 text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="text-sm sm:text-base font-semibold text-emerald-200/95">
              {isAr ? 'فرحة بتوصل لكل بيت' : 'Real Parent Stories'}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-editorial leading-tight text-white text-balance">
            {isAr ? (
              <>
                كلام أمهات وآباء{' '}
                <span className="text-magical">جرّبوا السحر بنفسهم</span>
              </>
            ) : (
              <>
                Hear From Parents Who{' '}
                <span className="text-magical">Saw the Magic Firsthand</span>
              </>
            )}
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'رسائل حقيقية ومواقف دافئة من عائلات استلمت قصص أطفالها في مصر والسعودية.'
              : 'Heartwarming notes and unboxing moments from families across Egypt and Saudi Arabia.'}
          </p>
        </motion.div>

        {/* Parent Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
          {config.reviews.map((rev: CustomerReviewConfig, index: number) => {
            const parentName = getLocalizedParentName(rev, isAr);
            const city = isAr
              ? sanitizeArabicText(rev.cityAr || rev.city)
              : sanitizeEnglishText(rev.cityEn || rev.city);
            const dateText = isAr
              ? sanitizeArabicText(rev.dateAr || rev.date)
              : sanitizeEnglishText(rev.dateEn || rev.date);
            const message = isAr
              ? sanitizeArabicText(rev.messageAr)
              : sanitizeEnglishText(rev.messageEn);
            const bookTitle = isAr
              ? sanitizeArabicText(rev.bookTitleAr || rev.bookTitle)
              : sanitizeEnglishText(rev.bookTitleEn || rev.bookTitle);
            const childName = isAr
              ? sanitizeArabicText(rev.childNameAr || rev.childName)
              : sanitizeEnglishText(rev.childNameEn || rev.childName);

            return (
              <motion.article
                key={rev.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.45, delay: index * 0.08, ease: EASE_OUT }
                }
                className="glass-card rounded-3xl p-4 lg:p-6 xl:p-7 flex flex-col justify-between gap-4 lg:gap-5 border-white/12 text-start"
              >
                {/* Parent Header */}
                <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 lg:gap-3 pb-3.5 lg:pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5 lg:gap-3 min-w-0">
                    <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-full overflow-hidden bg-slate-900 border border-white/20 shrink-0">
                      <img
                        src={rev.avatarUrl || '/bubble-books/hero-left.jpg'}
                        alt={parentName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs lg:text-sm font-bold text-white truncate">{parentName}</span>
                        <CheckCircle2
                          className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400 shrink-0"
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-[11px] lg:text-xs text-slate-400 block truncate">{city}</span>
                    </div>
                  </div>

                  <span className="text-[11px] lg:text-xs text-slate-400 font-numeric shrink-0">{dateText}</span>
                </div>

                {/* Quote Body */}
                <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-3.5 lg:p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div
                      className="flex items-center gap-1 text-amber-300"
                      aria-label={
                        isAr
                          ? `تقييم ${rev.rating} من 5 نجوم`
                          : `Rated ${rev.rating} out of 5 stars`
                      }
                    >
                      {Array.from({ length: rev.rating }).map((_, starIdx) => (
                        <Star
                          key={starIdx}
                          className="w-5 h-5 fill-amber-300 text-amber-300"
                          aria-hidden="true"
                        />
                      ))}
                    </div>

                    <p className="text-sm text-slate-100 leading-relaxed">
                      &ldquo;{message}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="text-cyan-300 font-semibold truncate">{bookTitle}</span>
                    <span className="font-numeric shrink-0">{childName}</span>
                  </div>
                </div>

                {/* Verified Footer */}
                <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'طلب موثّق ومستلم بنجاح' : 'Verified Order & Delivery'}</span>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* Clean Local Payment Methods Strip */}
        <div className="glass-card rounded-3xl p-6 text-center space-y-4 border-white/10">
          <p className="text-xs sm:text-sm text-slate-300 font-semibold">
            {isAr
              ? 'طرق دفع محلية وآمنة في مصر والسعودية'
              : 'Trusted Local Payment Options Across Egypt & Saudi Arabia'}
          </p>

          <div className="flex flex-wrap justify-center items-center gap-2.5 sm:gap-3">
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="px-4 py-2 rounded-full bg-slate-950/65 border border-white/10 text-xs sm:text-sm font-medium text-slate-200"
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        {/* Punchy Closing Conversion CTA Banner */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.55, ease: EASE_OUT }}
          className="relative glass-card rounded-3xl p-6 sm:p-9 lg:p-12 xl:p-14 border-cyan-400/25 overflow-hidden text-center"
        >
          {/* Ambient Midnight Magic Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[28rem] h-[16rem] rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-3xl"
          />

          <div className="relative z-10 max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center justify-center gap-2.5 text-primary">
              <Sparkles className="w-6 h-6 text-primary shrink-0" aria-hidden="true" />
              <span className="text-sm sm:text-base font-semibold text-cyan-200">
                {isAr ? 'هدية هتفضل ذكرى العمر كله' : 'A Keepsake They Will Treasure Forever'}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-editorial leading-tight text-white text-balance">
              {isAr ? (
                <>
                  جاهز تشوف الفرحة{' '}
                  <span className="text-magical">في عيون طفلك؟</span>
                </>
              ) : (
                <>
                  Ready to See Their{' '}
                  <span className="text-magical">Eyes Light Up?</span>
                </>
              )}
            </h2>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {isAr ? (
                <>
                  اختار حكايته دلوقتي أو صمّم قصة مخصوصة من الصفر — وبتراجع المسودة كاملة{' '}
                  <span className="font-numeric font-bold text-white">100%</span> قبل الطباعة.
                </>
              ) : (
                <>
                  Pick their adventure today or craft a custom tale from scratch — with{' '}
                  <span className="font-numeric font-bold text-white">100%</span> draft approval
                  before we ever print.
                </>
              )}
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 justify-center items-stretch sm:items-center pt-2">
              <BubbleButton
                variant="primary"
                size="lg"
                onClick={() => navigate('/stories')}
                className="w-full sm:w-auto min-h-[46px] xl:min-h-[54px] px-5 lg:px-6 xl:px-8 py-2.5 lg:py-3 xl:py-3.5 text-sm xl:text-base gap-2 xl:gap-2.5 whitespace-nowrap shadow-[0_0_32px_rgba(0,217,255,0.4)]"
              >
                <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'تصفح مكتبة القصص' : 'Explore Story Catalog'}</span>
                <ArrowRight
                  className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </BubbleButton>

              <BubbleButton
                variant="secondary"
                size="lg"
                onClick={handleCreateCustom}
                className="w-full sm:w-auto min-h-[46px] xl:min-h-[54px] px-5 lg:px-6 xl:px-8 py-2.5 lg:py-3 xl:py-3.5 text-sm xl:text-base gap-2 xl:gap-2.5 whitespace-nowrap"
              >
                <Wand2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'صمّم قصتك من الصفر' : 'Create Custom Story'}</span>
              </BubbleButton>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
