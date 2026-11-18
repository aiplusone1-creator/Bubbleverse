import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Award,
  BookOpen,
  FileText,
  Heart,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import TiltBookCard from '@/components/ui/TiltBookCard';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export interface LiveBookPreviewProps {
  coverImage: string;
  storyTitleAr: string;
  storyTitleEn: string;
  childName: string;
  coHeroName?: string;
  childPhoto?: string | null;
  dedicationMessage?: string;
  storyLanguage: 'ar' | 'en' | 'bilingual';
  occasionLabelAr?: string;
  occasionLabelEn?: string;
  format: 'hardcover_15' | 'hardcover_25' | 'digital_pdf';
}

type PreviewTab = 'cover' | 'dedication';

const MOTION_EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function LiveBookPreviewCard({
  coverImage,
  storyTitleAr,
  storyTitleEn,
  childName,
  coHeroName,
  childPhoto,
  dedicationMessage,
  storyLanguage,
  occasionLabelAr,
  occasionLabelEn,
  format,
}: LiveBookPreviewProps) {
  const { language, isRTL } = useLanguage();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const isUiAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<PreviewTab>('cover');
  const [coverImgFailed, setCoverImgFailed] = useState(false);
  const [photoImgFailed, setPhotoImgFailed] = useState(false);

  const coverTabRef = useRef<HTMLButtonElement>(null);
  const dedicationTabRef = useRef<HTMLButtonElement>(null);
  const instanceId = useId();

  useEffect(() => {
    setCoverImgFailed(false);
  }, [coverImage]);

  useEffect(() => {
    setPhotoImgFailed(false);
  }, [childPhoto]);

  const coverTabId = `${instanceId}-tab-cover`;
  const dedicationTabId = `${instanceId}-tab-dedication`;
  const coverPanelId = `${instanceId}-panel-cover`;
  const dedicationPanelId = `${instanceId}-panel-dedication`;

  // Determine the interior/cover book language direction based on storyLanguage
  const bookIsAr =
    storyLanguage === 'ar' || (storyLanguage === 'bilingual' && isUiAr);
  const bookDir = bookIsAr ? 'rtl' : 'ltr';
  const uiDir = isUiAr ? 'rtl' : 'ltr';

  const trimmedChildName = childName.trim();
  const trimmedCoHeroName = coHeroName?.trim() || '';
  const trimmedDedication = dedicationMessage?.trim() || '';

  const hasCustomName = trimmedChildName.length > 0;
  const hasCoHero = trimmedCoHeroName.length > 0;
  const hasValidPhoto = Boolean(childPhoto && !photoImgFailed);

  const displayChildName = hasCustomName
    ? trimmedChildName
    : bookIsAr
    ? 'بطلك الصغير'
    : 'Your Hero';

  const primaryStoryTitle = bookIsAr ? storyTitleAr : storyTitleEn;
  const secondaryStoryTitle =
    storyLanguage === 'bilingual' ? (bookIsAr ? storyTitleEn : storyTitleAr) : null;

  const occasionLabel = bookIsAr
    ? occasionLabelAr?.trim() || occasionLabelEn?.trim() || ''
    : occasionLabelEn?.trim() || occasionLabelAr?.trim() || '';

  const isDigital = format === 'digital_pdf';
  const pagesCount = format === 'hardcover_25' ? 25 : 15;

  const fallbackDedication = bookIsAr
    ? 'إلى أغلى بطل في حياتنا، كل صفحة في هذا الكتاب تذكّرك بأن خيالك لا حدود له وأنك قادر على صنع أجمل المغامرات.'
    : 'To our brightest star — may every page remind you how brave, kind, and limitless your imagination truly is.';

  const dedicationBody = trimmedDedication || fallbackDedication;

  const reassuranceText = isUiAr
    ? 'معاينة فورية تفاعلية — وبعد الطلب بنرسملك كل الصفحات بملامح طفلك الحقيقية وتراجع المسودة 100% قبل الطباعة.'
    : "Instant interactive preview — after ordering, we illustrate every page with your child's real likeness and you review 100% of the draft before printing.";

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const isNextKey = isRTL ? e.key === 'ArrowLeft' : e.key === 'ArrowRight';
    const isPrevKey = isRTL ? e.key === 'ArrowRight' : e.key === 'ArrowLeft';

    if (isNextKey || isPrevKey) {
      e.preventDefault();
      const nextTab: PreviewTab = activeTab === 'cover' ? 'dedication' : 'cover';
      setActiveTab(nextTab);
      if (nextTab === 'cover') {
        coverTabRef.current?.focus();
      } else {
        dedicationTabRef.current?.focus();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab('cover');
      coverTabRef.current?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab('dedication');
      dedicationTabRef.current?.focus();
    }
  };

  const slideOffset = shouldReduceMotion ? 0 : activeTab === 'cover' ? (isRTL ? 14 : -14) : isRTL ? -14 : 14;

  return (
    <div className="space-y-3.5 w-full">
      {/* 2-Tab Pill Switcher (44px min touch target) */}
      <div
        role="tablist"
        aria-label={isUiAr ? 'أوضاع معاينة الكتاب الفورية' : 'Live book preview modes'}
        className="glass-card-inner p-1.5 rounded-full grid grid-cols-2 gap-1.5 border border-white/15 bg-slate-950/60"
      >
        <button
          ref={coverTabRef}
          id={coverTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === 'cover'}
          aria-controls={coverPanelId}
          tabIndex={activeTab === 'cover' ? 0 : -1}
          onClick={() => setActiveTab('cover')}
          onKeyDown={handleTabKeyDown}
          className={cn(
            'relative min-h-[44px] px-3 sm:px-4 rounded-full text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
            activeTab === 'cover'
              ? 'text-slate-950'
              : 'text-slate-300 hover:text-white'
          )}
        >
          {activeTab === 'cover' &&
            (shouldReduceMotion ? (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-300 shadow-[0_4px_18px_rgba(0,217,255,0.38)]"
              />
            ) : (
              <motion.span
                layoutId={`${instanceId}-preview-tab-pill`}
                aria-hidden="true"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-300 shadow-[0_4px_18px_rgba(0,217,255,0.38)]"
              />
            ))}
          <BookOpen className="relative z-10 w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="relative z-10 truncate">
            {isUiAr ? 'معاينة الغلاف' : 'Live Cover'}
          </span>
        </button>

        <button
          ref={dedicationTabRef}
          id={dedicationTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === 'dedication'}
          aria-controls={dedicationPanelId}
          tabIndex={activeTab === 'dedication' ? 0 : -1}
          onClick={() => setActiveTab('dedication')}
          onKeyDown={handleTabKeyDown}
          className={cn(
            'relative min-h-[44px] px-3 sm:px-4 rounded-full text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
            activeTab === 'dedication'
              ? 'text-slate-950'
              : 'text-slate-300 hover:text-white'
          )}
        >
          {activeTab === 'dedication' &&
            (shouldReduceMotion ? (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200 shadow-[0_4px_18px_rgba(244,114,182,0.38)]"
              />
            ) : (
              <motion.span
                layoutId={`${instanceId}-preview-tab-pill`}
                aria-hidden="true"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200 shadow-[0_4px_18px_rgba(244,114,182,0.38)]"
              />
            ))}
          <Heart className="relative z-10 w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="relative z-10 truncate">
            {isUiAr ? 'صفحة الإهداء' : 'Dedication Page'}
          </span>
        </button>
      </div>

      {/* Interactive 3D Book Preview Stage */}
      <AnimatePresence mode="wait" initial={false}>
        {activeTab === 'cover' ? (
          <motion.div
            key="cover-panel"
            id={coverPanelId}
            role="tabpanel"
            aria-labelledby={coverTabId}
            tabIndex={0}
            initial={shouldReduceMotion ? false : { opacity: 0, x: slideOffset }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, x: -slideOffset }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.22,
              ease: MOTION_EASE_OUT,
            }}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
          >
            <TiltBookCard
              maxTilt={6}
              scaleOnHover={1.015}
              glareMaxOpacity={0.22}
              className="rounded-3xl aspect-square"
            >
              <div
                dir={bookDir}
                className={cn(
                  'relative w-full h-full rounded-3xl overflow-hidden bg-slate-950 border shadow-[0_20px_50px_rgba(2,6,23,0.68)] select-none',
                  isDigital ? 'border-cyan-400/35' : 'border-white/20'
                )}
              >
                {/* Cover Artwork */}
                {coverImage && !coverImgFailed ? (
                  <img
                    src={coverImage}
                    alt={
                      isUiAr
                        ? `معاينة غلاف قصة ${storyTitleAr} للبطل ${displayChildName}`
                        : `Live cover preview of ${storyTitleEn} for ${displayChildName}`
                    }
                    onError={() => setCoverImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950"
                  />
                )}

                {/* Subtle editorial vignette for contrast */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/45"
                />

                {/* 3D Spine Crease & Binding Groove (Hardcover) */}
                {!isDigital && (
                  <>
                    <div
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute top-0 bottom-0 w-5 z-10',
                        bookIsAr
                          ? 'right-0 bg-gradient-to-l from-black/65 via-black/25 to-transparent'
                          : 'left-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent'
                      )}
                    />
                    <div
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute top-0 bottom-0 w-[2px] z-10 bg-white/25',
                        bookIsAr ? 'right-3.5' : 'left-3.5'
                      )}
                    />
                    {/* Subtle hardcover page-edge shimmer on opposite edge */}
                    <div
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute top-1 bottom-1 w-1 z-10 rounded-full bg-gradient-to-b from-amber-50/35 via-white/20 to-amber-50/35',
                        bookIsAr ? 'left-0.5' : 'right-0.5'
                      )}
                    />
                  </>
                )}

                {/* Glossy Laminated Cover Highlight */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-transparent via-white/[0.06] to-white/[0.16]"
                />

                {/* Top Overlay Row: Edition Badge + Occasion Pill + Optional Photo Medallion */}
                <div className="absolute inset-x-3.5 sm:inset-x-4 top-3.5 sm:top-4 z-20 flex items-start justify-between gap-2.5">
                  <div className="flex flex-col items-start gap-1.5 min-w-0">
                    {/* Edition Badge */}
                    <span
                      dir={uiDir}
                      className="inline-flex items-center gap-1.5 max-w-full rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-white bg-slate-950/75 backdrop-blur-md border border-white/20 shadow-md"
                    >
                      {isDigital ? (
                        <FileText
                          className="w-3.5 h-3.5 text-cyan-300 shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <BookOpen
                          className="w-3.5 h-3.5 text-cyan-300 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span dir={uiDir} className="truncate font-numeric">
                        {isDigital ? (
                          isUiAr ? (
                            <>
                              نسخة رقمية <bdi dir="ltr">PDF</bdi>
                            </>
                          ) : (
                            'Digital PDF'
                          )
                        ) : isUiAr ? (
                          <>
                            غلاف مقوّى <bdi dir="ltr">8.5&quot;×8.5&quot;</bdi> • {pagesCount} صفحة
                          </>
                        ) : (
                          `8.5"×8.5" Hardcover • ${pagesCount}p`
                        )}
                      </span>
                    </span>

                    {/* Optional Occasion Pill */}
                    {occasionLabel && (
                      <span className="inline-flex items-center gap-1.5 max-w-full rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-pink-100 bg-gradient-to-r from-purple-600/75 via-fuchsia-600/70 to-pink-500/75 backdrop-blur-md border border-white/25 shadow-sm">
                        <Sparkles className="w-3 h-3 text-amber-200 shrink-0" aria-hidden="true" />
                        <span className="truncate">{occasionLabel}</span>
                      </span>
                    )}

                    {/* Bilingual Edition Mini Tag */}
                    {storyLanguage === 'bilingual' && (
                      <span
                        dir="ltr"
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold text-cyan-100 bg-cyan-500/25 backdrop-blur-md border border-cyan-300/35"
                      >
                        AR + EN
                      </span>
                    )}
                  </div>

                  {/* Luminous Circular Child-Photo Medallion when uploaded */}
                  <AnimatePresence initial={false}>
                    {hasValidPhoto && childPhoto && (
                      <motion.div
                        key="cover-photo-medallion"
                        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.22,
                          ease: MOTION_EASE_OUT,
                        }}
                        className="relative shrink-0"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-400 shadow-[0_0_24px_rgba(0,217,255,0.48)]">
                          <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-950/90 bg-slate-900">
                            <img
                              src={childPhoto}
                              alt={
                                isUiAr
                                  ? `صورة البطل ${displayChildName}`
                                  : `Portrait of ${displayChildName}`
                              }
                              onError={() => setPhotoImgFailed(true)}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <span
                          aria-hidden="true"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-950 border border-cyan-300/60 flex items-center justify-center shadow-md"
                        >
                          <Sparkles className="w-3 h-3 text-cyan-300" />
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Floating Editorial Cover Plate */}
                <div className="absolute inset-x-3 sm:inset-x-4 bottom-3 sm:bottom-4 z-20">
                  <div className="relative overflow-hidden rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5 bg-slate-950/80 backdrop-blur-xl border border-white/20 shadow-[0_12px_32px_rgba(2,6,23,0.72)]">
                    {/* Iridescent top hairline */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 inset-x-4 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/75 to-transparent"
                    />

                    {/* Hero Name + Optional Co-Hero Row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 max-w-full rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs font-bold border',
                          hasCustomName
                            ? 'bg-cyan-400/20 border-cyan-300/45 text-cyan-100'
                            : 'bg-white/10 border-white/20 text-slate-200'
                        )}
                      >
                        <Sparkles className="w-3 h-3 text-cyan-300 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {bookIsAr ? 'بطولة: ' : 'Starring: '}
                          <bdi className="text-white">{displayChildName}</bdi>
                        </span>
                      </span>

                      {hasCoHero && (
                        <span className="inline-flex items-center gap-1 max-w-full rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs font-bold bg-fuchsia-500/25 border border-fuchsia-300/45 text-fuchsia-100">
                          <Users className="w-3 h-3 text-pink-300 shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            + <bdi>{trimmedCoHeroName}</bdi>
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Personalized Story Title */}
                    <h3 className="font-display font-extrabold text-base sm:text-lg md:text-xl text-white leading-snug line-clamp-2 break-words">
                      {primaryStoryTitle}
                    </h3>

                    {secondaryStoryTitle && (
                      <p
                        dir={bookIsAr ? 'ltr' : 'rtl'}
                        className="mt-0.5 text-[11px] sm:text-xs font-semibold text-cyan-200/85 truncate"
                      >
                        {secondaryStoryTitle}
                      </p>
                    )}

                    {/* Publisher Crest Footer */}
                    <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-300/90">
                      <span className="font-semibold text-cyan-200/90 truncate">
                        {bookIsAr ? '✦ إصدار بابل فيرس الخاص' : '✦ Bubbleverse Keepsake Edition'}
                      </span>
                      <span dir={uiDir} className="shrink-0 text-slate-400">
                        {hasCustomName
                          ? isUiAr
                            ? 'مُخصّص بالاسم'
                            : 'Personalized'
                          : isUiAr
                          ? 'اكتب الاسم للمعاينة'
                          : 'Type name to preview'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TiltBookCard>
          </motion.div>
        ) : (
          <motion.div
            key="dedication-panel"
            id={dedicationPanelId}
            role="tabpanel"
            aria-labelledby={dedicationTabId}
            tabIndex={0}
            initial={shouldReduceMotion ? false : { opacity: 0, x: slideOffset }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, x: -slideOffset }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.22,
              ease: MOTION_EASE_OUT,
            }}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
          >
            <TiltBookCard
              maxTilt={4}
              scaleOnHover={1.01}
              glareMaxOpacity={0.14}
              className="rounded-3xl aspect-square"
            >
              <div
                dir={bookDir}
                className="relative w-full h-full rounded-3xl overflow-hidden border border-amber-200/60 shadow-[0_20px_50px_rgba(2,6,23,0.62)] select-none flex flex-col justify-between p-5 sm:p-7"
                style={{
                  background:
                    'linear-gradient(135deg, #FFFDF7 0%, #FDF7EA 52%, #F8F0DF 100%)',
                }}
              >
                {/* Soft Pastel Cosmic Corner Aura (mirrors kdpCanvasRenderer cream_paper) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at 86% 14%, rgba(0, 217, 255, 0.11) 0%, rgba(167, 139, 250, 0.08) 38%, transparent 66%), radial-gradient(circle at 14% 88%, rgba(244, 114, 182, 0.1) 0%, transparent 55%)',
                  }}
                />

                {/* Subtle Open-Book Interior Gutter Shadow */}
                <div
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute top-0 bottom-0 w-5 z-10',
                    bookIsAr
                      ? 'right-0 bg-gradient-to-l from-amber-950/15 via-amber-950/5 to-transparent'
                      : 'left-0 bg-gradient-to-r from-amber-950/15 via-amber-950/5 to-transparent'
                  )}
                />

                {/* Inner Editorial Keepsake Double Frame */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-3 sm:inset-4 rounded-2xl border border-violet-600/20"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[16px] sm:inset-[21px] rounded-xl border border-pink-500/15"
                />

                {/* Subtle Corner Sparkles */}
                <Sparkles
                  aria-hidden="true"
                  className="pointer-events-none absolute top-6 start-6 w-3.5 h-3.5 text-violet-500/35"
                />
                <Sparkles
                  aria-hidden="true"
                  className="pointer-events-none absolute top-6 end-6 w-3.5 h-3.5 text-pink-500/35"
                />

                {/* Center Dedication Content */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-2 sm:px-4 gap-2.5 sm:gap-3.5 min-h-0">
                  {/* Circular Gradient-Bordered Child Portrait */}
                  <div className="relative shrink-0">
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px] shadow-[0_8px_24px_rgba(109,40,217,0.2)]"
                      style={{
                        background:
                          'linear-gradient(135deg, #00D9FF 0%, #A78BFA 50%, #F472B6 100%)',
                      }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#FFFDF7] p-0.5 flex items-center justify-center">
                        {hasValidPhoto && childPhoto ? (
                          <img
                            src={childPhoto}
                            alt={
                              isUiAr
                                ? `صورة ${displayChildName} على صفحة الإهداء`
                                : `Portrait of ${displayChildName} on dedication page`
                            }
                            onError={() => setPhotoImgFailed(true)}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-100 via-violet-100 to-pink-100 flex flex-col items-center justify-center text-violet-600">
                            <Heart
                              className="w-6 h-6 sm:w-7 sm:h-7 text-pink-500 fill-pink-400/30"
                              aria-hidden="true"
                            />
                            <span
                              dir={uiDir}
                              className="mt-0.5 text-[9px] sm:text-[10px] font-bold text-violet-700/80"
                            >
                              {isUiAr ? 'صورة طفلك' : 'Child Photo'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Personalized Dedication Heading */}
                  <div className="space-y-1.5 max-w-full">
                    <h3 className="font-display font-extrabold text-sm sm:text-lg text-[#6D28D9] leading-snug line-clamp-2 break-words">
                      {bookIsAr ? (
                        hasCoHero ? (
                          <>
                            إهداء خاص إلى البطلين <bdi>{displayChildName}</bdi> و
                            <bdi>{trimmedCoHeroName}</bdi>
                          </>
                        ) : (
                          <>
                            إهداء خاص إلى البطل <bdi>{displayChildName}</bdi>
                          </>
                        )
                      ) : hasCoHero ? (
                        <>
                          A Special Dedication for <bdi>{displayChildName}</bdi> &amp;{' '}
                          <bdi>{trimmedCoHeroName}</bdi>
                        </>
                      ) : (
                        <>
                          A Special Dedication for <bdi>{displayChildName}</bdi>
                        </>
                      )}
                    </h3>

                    {/* Gradient Divider */}
                    <div
                      aria-hidden="true"
                      className="mx-auto h-[2px] w-24 rounded-full bg-gradient-to-r from-transparent via-pink-500/75 to-transparent"
                    />
                  </div>

                  {/* Live Dedication Text */}
                  <div className="max-w-[92%] space-y-1">
                    <p
                      className={cn(
                        'text-xs sm:text-sm leading-relaxed line-clamp-4 break-words',
                        trimmedDedication
                          ? 'text-[#1E1B4B] font-semibold'
                          : 'text-[#1E1B4B]/75 italic'
                      )}
                    >
                      {bookIsAr ? `«${dedicationBody}»` : `“${dedicationBody}”`}
                    </p>
                    {!trimmedDedication && (
                      <p
                        dir={uiDir}
                        className="text-[10px] sm:text-[11px] font-medium text-violet-700/65"
                      >
                        {isUiAr
                          ? 'نموذج مقترح — اكتب إهداءك الخاص ليظهر هنا فوراً'
                          : 'Sample keepsake note — write your dedication to preview live'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bubbleverse Keepsake Seal Footer */}
                <div className="relative z-10 pt-2 flex items-center justify-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-white/80 border border-violet-400/30 shadow-sm text-[10px] sm:text-[11px] font-bold text-violet-800">
                    <Award className="w-3.5 h-3.5 text-pink-500 shrink-0" aria-hidden="true" />
                    <span>
                      {bookIsAr
                        ? '✦ ختم بابل فيرس التذكاري ✦'
                        : '✦ Bubbleverse Keepsake Seal ✦'}
                    </span>
                  </div>
                </div>
              </div>
            </TiltBookCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calm Reassurance Note Below Preview */}
      <div className="glass-card-inner rounded-2xl px-3.5 py-2.5 border border-cyan-400/20 flex items-start gap-2.5 text-xs text-slate-200/95 leading-relaxed">
        <ShieldCheck
          className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <p className="min-w-0 break-words">{reassuranceText}</p>
      </div>
    </div>
  );
}

export default LiveBookPreviewCard;
