import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Languages,
  BookMarked,
  Wand2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import BubbleButton from './BubbleButton';
import Header from './Header';
import TiltBookCard from '@/components/ui/TiltBookCard';
import { useLanguage } from '@/hooks/useLanguage';
import {
  DEFAULT_HERO_BOOKS,
  getShowcaseConfig,
  type HeroBookSlide,
} from '@/lib/showcaseConfig';

interface HeroSectionProps {
  onStartCreating: () => void;
  showMascot?: boolean;
  onToggleMascot?: () => void;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function readHeroBooks(): HeroBookSlide[] {
  const slides = getShowcaseConfig().heroBooks;
  return Array.isArray(slides) && slides.length > 0 ? slides : DEFAULT_HERO_BOOKS;
}

const HeroSection = ({ onStartCreating }: HeroSectionProps) => {
  const { isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const isAr = language === 'ar';

  const [heroBooks, setHeroBooks] = useState<HeroBookSlide[]>(() => readHeroBooks());
  const [[activeIndex, direction], setSlide] = useState<[number, number]>([0, 1]);

  // Live-sync hero slides whenever Admin Showcase updates config
  useEffect(() => {
    const syncSlides = () => {
      const latest = readHeroBooks();
      setHeroBooks(latest);
      setSlide(([currentIdx, currentDir]) => [
        currentIdx >= latest.length ? 0 : currentIdx,
        currentDir,
      ]);
    };

    window.addEventListener('bubbleverse:showcase-updated', syncSlides);
    window.addEventListener('storage', syncSlides);
    return () => {
      window.removeEventListener('bubbleverse:showcase-updated', syncSlides);
      window.removeEventListener('storage', syncSlides);
    };
  }, []);

  const totalSlides = heroBooks.length;
  const safeIndex = totalSlides > 0 ? activeIndex % totalSlides : 0;
  const activeBook = heroBooks[safeIndex] ?? DEFAULT_HERO_BOOKS[0];
  const hasMultipleSlides = totalSlides > 1;

  const goNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setSlide(([idx]) => [(idx + 1) % totalSlides, 1]);
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    if (totalSlides <= 1) return;
    setSlide(([idx]) => [(idx - 1 + totalSlides) % totalSlides, -1]);
  }, [totalSlides]);

  const goToSlide = useCallback(
    (targetIndex: number) => {
      if (targetIndex < 0 || targetIndex >= totalSlides) return;
      setSlide(([idx]) => [targetIndex, targetIndex >= idx ? 1 : -1]);
    },
    [totalSlides]
  );

  const handleCarouselKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!hasMultipleSlides) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (isRTL) {
          goPrev();
        } else {
          goNext();
        }
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (isRTL) {
          goNext();
        } else {
          goPrev();
        }
      }
    },
    [goNext, goPrev, hasMultipleSlides, isRTL]
  );

  const reveal = (delay = 0) =>
    shouldReduceMotion
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: EASE_OUT },
        };

  // Direction-aware 3D Flip-Slide variants (clean fade under Reduced Motion)
  const bookSlideVariants = {
    enter: (dir: number) => {
      if (shouldReduceMotion) {
        return { opacity: 0 };
      }
      const visualDir = isRTL ? -dir : dir;
      return {
        opacity: 0,
        x: visualDir * 44,
        rotateY: visualDir * 24,
        scale: 0.94,
      };
    },
    center: {
      opacity: 1,
      x: 0,
      rotateY: 0,
      scale: 1,
      transition: shouldReduceMotion
        ? { duration: 0.14 }
        : {
            type: 'spring' as const,
            stiffness: 290,
            damping: 26,
            mass: 0.85,
          },
    },
    exit: (dir: number) => {
      if (shouldReduceMotion) {
        return { opacity: 0, transition: { duration: 0.12 } };
      }
      const visualDir = isRTL ? -dir : dir;
      return {
        opacity: 0,
        x: visualDir * -44,
        rotateY: visualDir * -24,
        scale: 0.94,
        transition: { duration: 0.22, ease: EASE_OUT },
      };
    },
  };

  const trustHighlights = isAr
    ? [
        { icon: ShieldCheck, text: 'مراجعة المسودة ', accent: '100%', suffix: ' قبل الطباعة' },
        { icon: Languages, text: 'قصص بالعربي أو الإنجليزي', accent: '', suffix: '' },
        { icon: BookMarked, text: 'غلاف مقوى فاخر أو نسخة رقمية', accent: '', suffix: '' },
      ]
    : [
        { icon: ShieldCheck, text: '', accent: '100%', suffix: ' Draft Approval Before Print' },
        { icon: Languages, text: 'English & Arabic Editions', accent: '', suffix: '' },
        { icon: BookMarked, text: 'Luxury Hardcover or Digital', accent: '', suffix: '' },
      ];

  const activeTitle = isAr ? activeBook.titleAr : activeBook.titleEn;
  const activeBadge = isAr ? activeBook.badgeAr : activeBook.badgeEn;
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <section
      className={`relative min-h-[92vh] flex flex-col justify-center px-4 pt-28 pb-16 sm:pt-32 sm:pb-24 overflow-hidden ${
        isRTL ? 'rtl' : ''
      }`}
    >
      <Header />

      {/* Subtle Midnight Magic Hero Aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 w-[36rem] h-[24rem] rounded-full bg-gradient-to-tr from-cyan-500/15 via-purple-500/15 to-pink-500/15 blur-3xl"
      />

      <div className="relative z-10 bv-container grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-8 lg:gap-12 xl:gap-16 items-center">
        {/* Copy & Conversion Hierarchy (7 cols) */}
        <div className="md:col-span-7 text-center md:text-start space-y-5 lg:space-y-6">
          <motion.div {...reveal(0.05)} className="inline-flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-primary shrink-0" aria-hidden="true" />
            <span className="text-xs sm:text-sm lg:text-base font-semibold text-cyan-200/95">
              {isAr
                ? 'حكاية مرسومة بملامح طفلك الحقيقية'
                : "Handcrafted Around Your Child's Real Smile"}
            </span>
          </motion.div>

          <motion.h1
            {...reveal(0.12)}
            className="text-[clamp(2.1rem,4.1vw,4.35rem)] font-extrabold leading-[1.13] font-editorial text-white text-balance max-w-[16ch] mx-auto md:mx-0 md:max-w-none"
          >
            {isAr ? (
              <>
                خلّي طفلك{' '}
                <span className="text-magical">بطل حكايته</span>{' '}
                بشكله واسمه الحقيقي!
              </>
            ) : (
              <>
                Make Your Child the{' '}
                <span className="text-magical">Real Hero</span>{' '}
                of Their Own Story!
              </>
            )}
          </motion.h1>

          <motion.p
            {...reveal(0.2)}
            className="text-sm sm:text-base lg:text-xl text-slate-300 max-w-xl lg:max-w-2xl mx-auto md:mx-0 leading-relaxed"
          >
            {isAr
              ? 'من صورة واحدة بس على موبايلك، بنحوّل طفلك لبطل كتاب مصوّر فاخر يفضل ذكرى عمره كله — وبتشوف المسودة كاملة وتوافق عليها قبل ما نطبع.'
              : 'From one simple phone photo, we illustrate your little one into a luminous hardcover keepsake — and you approve every single page before we ever print.'}
          </motion.p>

          {/* Primary + Secondary 3D Bubble CTAs (proportionally scaled so H1 always dominates) */}
          <motion.div
            {...reveal(0.28)}
            className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5 lg:gap-3.5 xl:gap-4 justify-center md:justify-start items-stretch sm:items-center pt-1 lg:pt-2"
          >
            {/* Primary Glowing 3D Bubble CTA -> /stories */}
            <BubbleButton
              variant="primary"
              size="lg"
              onClick={() => navigate('/stories')}
              className="w-full sm:w-auto min-h-[44px] xl:min-h-[54px] px-4 lg:px-5 xl:px-7 py-2.5 xl:py-3.5 text-sm md:text-xs lg:text-sm xl:text-base gap-1.5 lg:gap-2 whitespace-nowrap shadow-[0_0_28px_rgba(0,217,255,0.4)]"
            >
              <BookOpen className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'تصفح مكتبة القصص' : 'Explore Story Catalog'}</span>
              <ArrowRight
                className={`w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </BubbleButton>

            {/* Secondary 3D Bubble CTA -> Custom Story Wizard */}
            <BubbleButton
              variant="secondary"
              size="lg"
              onClick={onStartCreating}
              className="w-full sm:w-auto min-h-[44px] xl:min-h-[54px] px-4 lg:px-5 xl:px-7 py-2.5 xl:py-3.5 text-sm md:text-xs lg:text-sm xl:text-base gap-1.5 lg:gap-2 whitespace-nowrap"
            >
              <Wand2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'صمّم قصتك من الصفر' : 'Create Custom Story'}</span>
            </BubbleButton>
          </motion.div>

          {/* Clean Product-Truth Trust Highlights */}
          <motion.div
            {...reveal(0.36)}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2 xl:gap-3 pt-2 xl:pt-4 max-w-3xl mx-auto md:mx-0"
          >
            {trustHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${item.text}-${item.accent}-${item.suffix}`}
                  className="glass-card rounded-2xl px-3 py-2.5 md:px-2.5 md:py-2 xl:px-4 xl:py-3 flex items-center justify-center md:justify-start gap-2 md:gap-1.5 xl:gap-2.5 border-white/10"
                >
                  <Icon className="w-4 h-4 xl:w-5 xl:h-5 text-primary shrink-0" aria-hidden="true" />
                  <span className="text-xs md:text-[11px] xl:text-sm font-medium text-slate-200 leading-snug">
                    {item.text}
                    {item.accent && (
                      <span className="font-numeric font-bold text-primary">{item.accent}</span>
                    )}
                    {item.suffix}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Interactive 3D Hero Storybook Carousel Showcase (5 cols) */}
        <motion.div
          {...reveal(0.22)}
          className="md:col-span-5 flex flex-col items-center justify-center relative py-4"
        >
          {/* Luminous Accent Halo Behind Hero Book */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-4 rounded-full blur-3xl transition-colors duration-500"
            style={{
              background: `radial-gradient(circle, ${activeBook.accentColor || '#00D9FF'}38 0%, rgba(168,85,247,0.22) 52%, rgba(244,114,182,0.16) 100%)`,
            }}
          />

          <div
            role="region"
            aria-roledescription="carousel"
            aria-label={isAr ? 'معرض القصص المصوّرة' : 'Featured storybook showcase'}
            onKeyDown={handleCarouselKeyDown}
            className="relative w-full max-w-[18.5rem] sm:max-w-[21rem] md:max-w-[clamp(16rem,28vw,31rem)]"
          >
            {/* Floating Upper-Opposite Mini Preview Peek (Top-End, clear of middle arrow & bottom title plate) */}
            <motion.div
              aria-hidden="true"
              animate={shouldReduceMotion ? undefined : { y: [0, 7, 0] }}
              transition={
                shouldReduceMotion
                  ? undefined
                  : { duration: 5.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }
              }
              className={`hidden lg:block absolute top-4 z-30 w-20 h-20 rounded-2xl overflow-hidden border-2 border-pink-400/45 shadow-[0_14px_34px_rgba(244,114,182,0.3)] bg-slate-950 ${
                isRTL ? '-left-6' : '-right-6'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={activeBook.miniPreviewImage || activeBook.id}
                  src={activeBook.miniPreviewImage || activeBook.coverImage}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.src = '/placeholder.svg';
                  }}
                  initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.92 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: EASE_OUT }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
            </motion.div>

            {/* Glossy 3D Bubble Arrow — Previous Book */}
            {hasMultipleSlides && (
              <div className="absolute top-[48%] -translate-y-1/2 start-2 sm:-start-4 lg:-start-6 z-40">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label={isAr ? 'القصة السابقة' : 'Previous story'}
                  className="bubble-btn w-11 h-11 md:w-9 md:h-9 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-full bg-slate-950/75 backdrop-blur-xl text-white border border-cyan-300/45 shadow-[0_8px_26px_rgba(0,217,255,0.34),inset_0_2px_2px_rgba(255,255,255,0.55),inset_0_-2px_5px_rgba(0,0,0,0.35)] hover:border-cyan-200/80 hover:bg-cyan-500/25 hover:-translate-y-0.5 hover:scale-105 active:translate-y-0.5 active:scale-95 motion-reduce:hover:transform-none motion-reduce:active:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <PrevIcon className="w-4 h-4 relative z-10" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Glossy 3D Bubble Arrow — Next Book */}
            {hasMultipleSlides && (
              <div className="absolute top-[48%] -translate-y-1/2 end-2 sm:-end-4 lg:-end-6 z-40">
                <button
                  type="button"
                  onClick={goNext}
                  aria-label={isAr ? 'القصة التالية' : 'Next story'}
                  className="bubble-btn bubble-btn-primary w-11 h-11 md:w-9 md:h-9 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-full text-white shadow-[0_10px_30px_rgba(0,217,255,0.48),0_12px_36px_rgba(124,58,237,0.38),inset_0_2px_2px_rgba(255,255,255,0.82),inset_0_-2px_5px_rgba(0,0,0,0.28)] motion-reduce:hover:transform-none motion-reduce:active:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <NextIcon className="w-4 h-4 relative z-10" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Primary 3D Tilting Heirloom Storybook with 3D Flip-Slide Transition */}
            <div style={{ perspective: 1200 }}>
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={activeBook.id}
                  custom={direction}
                  variants={bookSlideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <TiltBookCard
                    maxTilt={11}
                    scaleOnHover={1.03}
                    glareMaxOpacity={0.3}
                    className="rounded-3xl"
                  >
                    <div className="relative rounded-3xl overflow-hidden border border-white/20 bg-slate-950/90 shadow-[0_24px_64px_rgba(0,0,0,0.6),0_0_45px_rgba(0,217,255,0.2)]">
                      {/* Hardcover Spine Crease Highlight */}
                      <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-y-0 z-10 w-5 ${
                          isRTL
                            ? 'right-0 bg-gradient-to-l from-black/45 via-white/15 to-transparent'
                            : 'left-0 bg-gradient-to-r from-black/45 via-white/15 to-transparent'
                        }`}
                      />

                      {/* Cover Artwork */}
                      <div className="relative aspect-[4/5] w-full overflow-hidden">
                        <img
                          src={activeBook.coverImage || DEFAULT_HERO_BOOKS[0].coverImage}
                          alt={
                            isAr
                              ? `غلاف كتاب ${activeTitle} المصوّر والمخصّص`
                              : `Personalized hardcover storybook cover for ${activeTitle}`
                          }
                          onError={(event) => {
                            event.currentTarget.src = '/placeholder.svg';
                          }}
                          className="w-full h-full object-cover"
                        />

                        {/* Subtle Editorial Vignette */}
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/20 to-slate-950/15"
                        />

                        {/* Story Cover Personalized Plate */}
                        <div className="absolute inset-x-2.5 bottom-2.5 p-2.5 lg:inset-x-4 lg:bottom-4 lg:p-4 z-10 rounded-xl lg:rounded-2xl bg-slate-950/78 backdrop-blur-md border border-white/15 text-center space-y-0.5 lg:space-y-1">
                          <span
                            className="block text-[10px] lg:text-xs font-semibold"
                            style={{ color: activeBook.accentColor || '#67E8F9' }}
                          >
                            {activeBadge}
                          </span>
                          <p className="text-sm lg:text-lg xl:text-xl font-extrabold font-editorial text-white leading-snug">
                            {activeTitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TiltBookCard>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Subtle Glowing Pagination Dots Below the Book */}
            {hasMultipleSlides && (
              <div className="mt-5 flex items-center justify-center gap-1.5">
                {heroBooks.map((book, idx) => {
                  const isActive = idx === safeIndex;
                  const slideTitle = isAr ? book.titleAr : book.titleEn;
                  return (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => goToSlide(idx)}
                      aria-current={isActive ? 'true' : undefined}
                      aria-label={
                        isAr
                          ? `عرض الكتاب ${idx + 1}: ${slideTitle}`
                          : `Show book ${idx + 1}: ${slideTitle}`
                      }
                      className="group p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation"
                    >
                      <span
                        className={`block h-2 rounded-full transition-all duration-300 ${
                          isActive
                            ? 'w-7 bg-gradient-to-r from-[#00D9FF] via-[#A78BFA] to-[#F472B6] shadow-[0_0_12px_rgba(0,217,255,0.7)]'
                            : 'w-2 bg-white/30 group-hover:bg-white/60'
                        }`}
                      />
                    </button>
                  );
                })}
                <span
                  aria-live="polite"
                  className="ms-2 text-xs font-numeric font-semibold text-slate-300/90 tabular-nums"
                >
                  {safeIndex + 1}/{totalSlides}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
