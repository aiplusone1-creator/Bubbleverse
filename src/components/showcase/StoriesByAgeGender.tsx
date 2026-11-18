import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  Rocket,
  Compass,
  Star,
  Heart,
  Award,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { getCatalogStories } from '@/lib/localStore';
import type { CatalogStory } from '@/features/stories/catalogStories';
import TiltBookCard from '@/components/ui/TiltBookCard';
import BubbleButton from '@/components/BubbleButton';

type StoryFilterId = 'all' | 'career' | 'boy' | 'girl' | '2-4' | '5+';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function getLocalizedBadge(story: CatalogStory, isAr: boolean): string | null {
  if (isAr) {
    if (story.badgeAr) return story.badgeAr;
    if (story.badge) {
      const arPart = story.badge.split('•')[0].trim();
      return arPart.replace(/[A-Za-z]+/g, '').trim() || null;
    }
    return null;
  }
  if (story.badgeEn) return story.badgeEn;
  if (story.badge) {
    const parts = story.badge.split('•');
    const enPart = (parts[1] ?? parts[0]).trim();
    return enPart.replace(/[\u0600-\u06FF]+/g, '').trim() || null;
  }
  return null;
}

function getAgeRangeLabel(ageRange: CatalogStory['ageRange'], isAr: boolean) {
  if (ageRange === 'all') {
    return isAr ? 'لكل الأعمار' : 'All Ages';
  }
  return isAr ? (
    <>
      <span className="font-numeric">{ageRange}</span> سنوات
    </>
  ) : (
    <>
      Ages <span className="font-numeric">{ageRange}</span>
    </>
  );
}

export default function StoriesByAgeGender() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const shouldReduceMotion = Boolean(useReducedMotion());

  const [stories] = useState<CatalogStory[]>(() => getCatalogStories());
  const [activeFilter, setActiveFilter] = useState<StoryFilterId>('all');

  const filterTabs: {
    id: StoryFilterId;
    icon: typeof Sparkles;
    highlight?: boolean;
    label: React.ReactNode;
  }[] = [
    {
      id: 'all',
      icon: Sparkles,
      label: isAr ? 'كل الحكايات' : 'All Stories',
    },
    {
      id: 'career',
      icon: Rocket,
      highlight: true,
      label: isAr ? 'مهن المستقبل' : 'Career Adventures',
    },
    {
      id: 'boy',
      icon: Compass,
      label: isAr ? 'قصص الأولاد' : 'For Boys',
    },
    {
      id: 'girl',
      icon: Star,
      label: isAr ? 'قصص البنات' : 'For Girls',
    },
    {
      id: '2-4',
      icon: Heart,
      label: isAr ? (
        <>
          <span className="font-numeric">2–4</span> سنوات
        </>
      ) : (
        <>
          Ages <span className="font-numeric">2–4</span>
        </>
      ),
    },
    {
      id: '5+',
      icon: Award,
      label: isAr ? (
        <>
          <span className="font-numeric">5+</span> سنوات
        </>
      ) : (
        <>
          Ages <span className="font-numeric">5+</span>
        </>
      ),
    },
  ];

  const displayedStories = useMemo(() => {
    const filtered = stories.filter((story) => {
      switch (activeFilter) {
        case 'career':
          return story.category === 'career';
        case 'boy':
          return story.gender === 'boy' || story.gender === 'all';
        case 'girl':
          return story.gender === 'girl' || story.gender === 'all';
        case '2-4':
          return story.ageRange === '2-4' || story.ageRange === 'all';
        case '5+':
          return story.ageRange === '5-7' || story.ageRange === '8-10' || story.ageRange === 'all';
        default:
          return true;
      }
    });
    return filtered.slice(0, 6);
  }, [stories, activeFilter]);

  return (
    <section className={`py-20 sm:py-28 px-4 sm:px-6 relative ${isRTL ? 'rtl' : ''}`}>
      <div className="bv-container space-y-10">
        {/* Section Header */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: EASE_OUT }}
          className="text-center max-w-4xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center justify-center gap-2.5 text-primary">
            <BookOpen className="w-6 h-6 text-primary shrink-0" aria-hidden="true" />
            <span className="text-sm sm:text-base font-semibold text-cyan-200/95">
              {isAr ? 'مكتبة لكل عمر وحلم' : 'Stories for Every Age & Dream'}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-editorial leading-tight text-white text-balance">
            {isAr ? (
              <>
                اختار المغامرة{' '}
                <span className="text-magical">اللي شبه طفلك</span>
              </>
            ) : (
              <>
                Pick an Adventure{' '}
                <span className="text-magical">Made Just for Them</span>
              </>
            )}
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'سواء بيحلم يكون رائد فضاء، دكتور حيوانات، أو بطل خارق — اختار القصة حسب عمره وشغفه وابدأ التخصيص في ثواني.'
              : 'Whether they dream of flying rockets, caring for animals, or exploring deep oceans — filter by age, interest, or future career and personalize in seconds.'}
          </p>
        </motion.div>

        {/* Filter Bar (with Career Adventures Highlight Tab) */}
        <div
          role="tablist"
          aria-label={isAr ? 'تصفية القصص حسب الفئة والعمر' : 'Filter stories by category and age'}
          className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
        >
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveFilter(tab.id)}
                className={`min-h-[40px] lg:min-h-[44px] px-3.5 lg:px-4 xl:px-5 py-2 lg:py-2.5 rounded-full text-xs lg:text-sm font-semibold inline-flex items-center gap-2 transition-all cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-white/30 shadow-[0_0_24px_rgba(0,217,255,0.35)]'
                    : tab.highlight
                    ? 'bg-purple-500/15 text-cyan-100 border-cyan-400/40 hover:border-cyan-300/70 hover:bg-purple-500/25'
                    : 'bg-slate-900/70 text-slate-300 border-white/10 hover:border-primary/40 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Career Adventures Highlight Banner when Career Tab is Active */}
        {activeFilter === 'career' && (
          <div className="glass-card rounded-3xl p-5 sm:p-6 border-cyan-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center shrink-0">
                <Rocket className="w-5 h-5 text-cyan-300" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold font-editorial text-white">
                  {isAr
                    ? 'سلسلة مهن المستقبل... ازرع فيه الطموح من صغره!'
                    : 'Career Adventures Series — Inspire Their Big Dreams Early!'}
                </h3>
                <p className="text-sm text-slate-300">
                  {isAr
                    ? 'رائد فضاء، طبيب حيوانات، ومهندس مخترع — قصص تخلّي طفلك يشوف نفسه بطل حلمه الحقيقي.'
                    : 'Astronaut, animal doctor, and young engineer — personalized tales where your child steps right into their dream career.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Featured Story Book Cards Grid (Clean Single-CTA Cards with TiltBookCard) */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${
            displayedStories.length === 4 ? '2xl:grid-cols-4' : ''
          } gap-5 lg:gap-6 xl:gap-8`}
        >
          {displayedStories.map((story) => {
            const badgeText = getLocalizedBadge(story, isAr);
            const startingPriceEgp = story.pricePdfEgp;
            const startingPriceSar = story.pricePdfSar;
            const startingPriceAed = story.pricePdfAed ?? story.pricePdfSar;

            return (
              <TiltBookCard
                key={story.id}
                maxTilt={8}
                scaleOnHover={1.02}
                glareMaxOpacity={0.22}
                className="h-full rounded-3xl"
              >
                <article className="group glass-card rounded-3xl h-full flex flex-col overflow-hidden border-white/12">
                  {/* Cover Frame */}
                  <div className="p-3.5 pb-0">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-white/10">
                      <img
                        src={story.coverImage}
                        alt={isAr ? story.titleAr : story.titleEn}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"
                      />

                      {badgeText && (
                        <span
                          className={`absolute top-3 z-10 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-300/35 text-xs font-semibold text-cyan-200 ${
                            isRTL ? 'right-3' : 'left-3'
                          }`}
                        >
                          {badgeText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Details + Single Crystal-Clear CTA */}
                  <div className="p-4 lg:p-5 flex-1 flex flex-col justify-between gap-4 text-start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                        <span className="font-medium text-cyan-300/95">
                          {getAgeRangeLabel(story.ageRange, isAr)}
                        </span>
                      </div>

                      <h3 className="text-base lg:text-lg xl:text-xl font-bold font-editorial text-white leading-snug line-clamp-2">
                        {isAr ? story.titleAr : story.titleEn}
                      </h3>

                      <p className="text-xs lg:text-sm text-slate-300 leading-relaxed line-clamp-2">
                        {isAr ? story.subtitleAr : story.subtitleEn}
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 pt-2.5 border-t border-white/10">
                        <span className="text-xs text-slate-400 shrink-0">
                          {isAr ? 'تبدأ من' : 'Starts from'}
                        </span>
                        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 font-numeric">
                          <span className="text-sm sm:text-base font-extrabold text-primary">
                            {isAr ? `${startingPriceEgp} ج.م` : `${startingPriceEgp} EGP`}
                          </span>
                          <span className="text-xs text-slate-300">
                            {isAr
                              ? `• ${startingPriceSar} ر.س • ${startingPriceAed} د.إ`
                              : `• ${startingPriceSar} SAR • ${startingPriceAed} AED`}
                          </span>
                        </div>
                      </div>

                      <BubbleButton
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/products/${story.id}`)}
                        className="w-full min-h-[42px] xl:min-h-[46px] px-4 py-2 text-xs lg:text-sm gap-2 whitespace-nowrap"
                      >
                        <span>{isAr ? 'خصّص القصة الآن' : 'Personalize Now'}</span>
                        <ArrowRight
                          className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </BubbleButton>
                    </div>
                  </div>
                </article>
              </TiltBookCard>
            );
          })}
        </div>

        {/* Clean Catalog Action Footer */}
        <div className="flex justify-center pt-2">
          <BubbleButton
            variant="outline"
            size="md"
            onClick={() => navigate('/stories')}
            className="min-h-[46px] xl:min-h-[50px] px-5 lg:px-6 xl:px-7 py-2.5 xl:py-3 text-sm xl:text-base gap-2 xl:gap-2.5 whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isAr ? 'تصفح مكتبة القصص كلها' : 'Browse Full Story Catalog'}</span>
            <ArrowRight
              className={`w-4 h-4 shrink-0 ${isRTL ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </BubbleButton>
        </div>
      </div>
    </section>
  );
}
