import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Home, Sparkles, Store } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import { useLanguage } from '@/hooks/useLanguage';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const NotFound = () => {
  const location = useLocation();
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <div className={`relative min-h-screen flex flex-col overflow-x-hidden ${isRTL ? 'rtl' : ''}`}>
      <ImmersiveBackground />
      <Header />

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pt-28 pb-16 sm:pt-32 sm:pb-24">
        <motion.section
          aria-labelledby="not-found-heading"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: EASE_OUT }}
          className="w-full max-w-2xl glass-card rounded-3xl border border-white/12 p-6 sm:p-10 text-center shadow-[0_24px_80px_rgba(4,9,24,0.55)] space-y-6"
        >
          {/* Friendly Bub Mascot Medallion */}
          <div className="relative mx-auto w-28 h-28 sm:w-32 sm:h-32">
            <div
              aria-hidden="true"
              className="absolute -inset-2 rounded-full bg-gradient-to-tr from-cyan-400/35 via-purple-500/35 to-pink-400/35 blur-xl"
            />
            <motion.div
              animate={
                shouldReduceMotion
                  ? undefined
                  : { y: [0, -6, 0] }
              }
              transition={
                shouldReduceMotion
                  ? undefined
                  : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }
              }
              className="relative w-full h-full rounded-full overflow-hidden border-2 border-cyan-300/45 bg-slate-950/90 shadow-[0_0_32px_rgba(0,217,255,0.28)]"
            >
              <img
                src="/merch/bub-plush-ball.jpg"
                alt={isAr ? 'باب — رفيق بابل فيرس القطيفة' : 'Bub — Bubbleverse plush companion'}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* 404 Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/12 border border-primary/30 text-cyan-200 text-xs sm:text-sm font-semibold">
            <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span className="font-numeric">404</span>
            <span aria-hidden="true">•</span>
            <span>{isAr ? 'فقاعة تاهت في المجرة' : 'A Bubble Drifted Away'}</span>
          </div>

          {/* Headline & Friendly Bub Copy */}
          <div className="space-y-3">
            <h1
              id="not-found-heading"
              className="text-2xl sm:text-4xl font-extrabold font-editorial leading-tight text-white text-balance"
            >
              {isAr ? (
                <>
                  أوبس! يبدو أن <span className="text-magical">باب</span> طار لصفحة غير موجودة
                </>
              ) : (
                <>
                  Oops! <span className="text-magical">Bub</span> Floated Into an Uncharted Page
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              {isAr
                ? 'الصفحة التي تبحث عنها غير متاحة أو ربما تغيّر رابطها. لا تقلق — باب هنا ليرجعك فوراً لحكايات طفلك المخصّصة أو متجر منتجات بابل فيرس.'
                : 'The page you tried to open drifted out of sight or moved. No worries — Bub is right here to guide you back to our personalized storybooks or official merch store.'}
            </p>

            {location.pathname && location.pathname !== '/' && (
              <p className="text-xs text-slate-400">
                <span>{isAr ? 'المسار المطلوب: ' : 'Requested path: '}</span>
                <code
                  dir="ltr"
                  className="inline-block max-w-full break-all px-2 py-0.5 rounded-lg bg-slate-950/75 border border-white/10 text-cyan-200/90 font-mono"
                >
                  {location.pathname}
                </code>
              </p>
            )}
          </div>

          {/* Client-Side Navigation CTAs (Zero Hard Reloads) */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 pt-2">
            <Link
              to="/"
              className="min-h-[46px] px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-600 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-[0_10px_28px_rgba(0,217,255,0.3)] hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'العودة للرئيسية' : 'Back to Home'}</span>
            </Link>

            <Link
              to="/stories"
              className="min-h-[46px] px-5 py-2.5 rounded-full bg-slate-900/75 hover:bg-primary/15 border border-white/15 hover:border-primary/45 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <BookOpen className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'مكتبة القصص' : 'Browse Stories'}</span>
            </Link>

            <Link
              to="/merch"
              className="min-h-[46px] px-5 py-2.5 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-pink-400/35 hover:border-pink-300/60 text-pink-100 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Store className="w-4 h-4 text-pink-300 shrink-0" aria-hidden="true" />
              <span>
                {isAr ? (
                  <>
                    متجر بابل وكورة <bdi dir="ltr">Bub</bdi>
                  </>
                ) : (
                  'Visit Bub Merch'
                )}
              </span>
            </Link>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
