import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  SlidersHorizontal,
  X,
  MessageCircle,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Gift,
  Users,
  CalendarHeart,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import TiltBookCard from '@/components/ui/TiltBookCard';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import {
  CATALOG_STORIES,
  type CatalogStory,
  type CatalogStoryOccasion,
} from '@/features/stories/catalogStories';
import { getCatalogStories, getStoreConfig } from '@/lib/localStore';

export type { CatalogStory };

function hydrateCatalogStories(): CatalogStory[] {
  const defaultsById = new Map(CATALOG_STORIES.map((story) => [story.id, story]));
  return getCatalogStories().map((story) => {
    const fallback = defaultsById.get(story.id);
    if (!fallback) return story;
    return {
      ...fallback,
      ...story,
      occasions: story.occasions && story.occasions.length > 0 ? story.occasions : fallback.occasions,
      supportsCoHero: story.supportsCoHero ?? fallback.supportsCoHero,
      pricePdfAed: story.pricePdfAed ?? fallback.pricePdfAed ?? story.pricePdfSar,
      priceAed15Pages: story.priceAed15Pages ?? fallback.priceAed15Pages ?? story.priceSar15Pages,
      priceAed25Pages: story.priceAed25Pages ?? fallback.priceAed25Pages ?? story.priceSar25Pages,
    };
  });
}

export default function Stories() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [catalogStories] = useState<CatalogStory[]>(() => hydrateCatalogStories());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOccasion, setSelectedOccasion] = useState<'all' | CatalogStoryOccasion>('all');
  const [selectedGender, setSelectedGender] = useState<'all' | 'boy' | 'girl'>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');

  const occasions: Array<{ id: 'all' | CatalogStoryOccasion; labelAr: string; labelEn: string }> = [
    { id: 'all', labelAr: 'كل المناسبات', labelEn: 'All Occasions' },
    { id: 'birthday', labelAr: 'عيد ميلاد', labelEn: 'Birthday' },
    { id: 'ramadan_eid', labelAr: 'رمضان والعيد', labelEn: 'Ramadan & Eid' },
    { id: 'siblings', labelAr: 'إخوة وأصدقاء', labelEn: 'Siblings & Friends' },
    { id: 'graduation', labelAr: 'حفلات التخرج', labelEn: 'Graduation' },
    { id: 'bedtime_values', labelAr: 'قيم وقبل النوم', labelEn: 'Bedtime & Values' },
  ];

  const categories = [
    { id: 'all', labelAr: 'كل القصص', labelEn: 'All Stories' },
    { id: 'fantasy', labelAr: 'عوالم سحرية وفضاء', labelEn: 'Fantasy & Galaxy' },
    { id: 'career', labelAr: 'أحلام ومهن المستقبل', labelEn: 'Career Adventures' },
    { id: 'superhero', labelAr: 'أبطال وخيال علمي', labelEn: 'Superheroes & Sci-Fi' },
    { id: 'travel', labelAr: 'مستكشف العالم', labelEn: 'Little Explorer' },
    { id: 'animals', labelAr: 'حيوانات وطبيعة', labelEn: 'Animals & Nature' },
    { id: 'values', labelAr: 'قيم وصداقة', labelEn: 'Values & Friendship' },
    { id: 'bedtime', labelAr: 'حكايات قبل النوم', labelEn: 'Bedtime Tales' },
  ];

  const filteredStories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalogStories.filter((story) => {
      const matchesSearch =
        q === '' ||
        story.titleAr.toLowerCase().includes(q) ||
        story.titleEn.toLowerCase().includes(q) ||
        story.subtitleAr.toLowerCase().includes(q) ||
        story.subtitleEn.toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory;
      const matchesOccasion =
        selectedOccasion === 'all' || Boolean(story.occasions?.includes(selectedOccasion));
      const matchesGender =
        selectedGender === 'all' || story.gender === 'all' || story.gender === selectedGender;
      const matchesAge =
        selectedAge === 'all' || story.ageRange === 'all' || story.ageRange === selectedAge;

      return matchesSearch && matchesCategory && matchesOccasion && matchesGender && matchesAge;
    });
  }, [catalogStories, searchQuery, selectedCategory, selectedOccasion, selectedGender, selectedAge]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedOccasion !== 'all' ||
    selectedGender !== 'all' ||
    selectedAge !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedOccasion('all');
    setSelectedGender('all');
    setSelectedAge('all');
  };

  const handlePersonalizeStory = (story: CatalogStory) => {
    navigate(`/products/${story.id}`);
  };

  const openWhatsAppInquiry = (storyTitle?: string) => {
    const config = getStoreConfig();
    const text = encodeURIComponent(
      language === 'ar'
        ? `أهلاً فريق بابل فيرس! حابب أستفسر عن ${storyTitle ? `قصة "${storyTitle}"` : 'تخصيص قصة جديدة لطفلي'} وتفاصيل الطباعة والتوصيل.`
        : `Hi Bubbleverse team! I'd love to ask about ${storyTitle ? `"${storyTitle}"` : 'creating a custom storybook'} and printing/delivery options.`
    );
    window.open(`https://wa.me/${config.whatsappPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <ImmersiveBackground />

      <Header />

      <main className="relative z-10 pt-24 sm:pt-28 pb-20">

        {/* Warm Conversational Hero Intro */}
        <section className="px-4 bv-container pt-4 pb-10 sm:pb-12 text-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.45 }}
            className="space-y-5"
          >
            <div className="inline-flex items-center gap-2 px-3.5 xl:px-4 py-1 xl:py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs xl:text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>
                {language === 'ar'
                  ? 'مكتبة حكايات بابل فيرس المخصّصة'
                  : 'The Bubbleverse Personalized Library'}
              </span>
            </div>

            <h1 className="text-[clamp(2rem,4.5vw,3.75rem)] font-extrabold font-editorial leading-[1.15] text-balance">
              {language === 'ar' ? (
                <>
                  اختاروا المغامرة، وخلّوا <span className="text-magical">طفلكم هو البطل!</span>
                </>
              ) : (
                <>
                  Pick an Adventure, Make{' '}
                  <span className="text-magical">Your Child the Hero!</span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {language === 'ar'
                ? 'كل قصة هنا بتتصمّم مخصوص باسم طفلكم وملامح وجهه الحقيقية — اختاروا حكاية تحبّوها، واطلبوها مطبوعة بغلاف فاخر أو نسخة رقمية فورية.'
                : 'Every storybook is lovingly tailored around your child’s name and real likeness — pick a tale they’ll adore, printed as a keepsake hardcover or delivered digitally.'}
            </p>

            {/* Reassurance Ribbon */}
            <div className="flex flex-wrap justify-center items-center gap-5 sm:gap-9 pt-2 text-xs sm:text-sm text-foreground/85 font-medium">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                {language === 'ar' ? 'ملامح طفلك في كل صفحة' : 'Consistent likeness on every page'}
              </span>
              <span className="inline-flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-pink-400 shrink-0" />
                {language === 'ar' ? 'بتراجع المسودة قبل الطباعة' : 'Full draft review before printing'}
              </span>
              <span className="inline-flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-400 shrink-0" />
                {language === 'ar'
                  ? 'توصيل سريع لمصر والسعودية والإمارات'
                  : 'Fast delivery in Egypt, Saudi & UAE'}
              </span>
            </div>
          </motion.div>
        </section>

        {/* Clean, Breathable Filter Bar */}
        <section className="px-4 bv-container mb-10">
          <div className="glass-card rounded-3xl p-4 sm:p-6 border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between">
              {/* Search Input */}
              <div className="relative w-full lg:w-96">
                <Search
                  className={`absolute ${
                    isRTL ? 'right-3.5' : 'left-3.5'
                  } top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label={language === 'ar' ? 'ابحث في مكتبة القصص' : 'Search stories'}
                  placeholder={
                    language === 'ar'
                      ? 'ابحث عن مغامرة أو حلم طفلك...'
                      : 'Search by title or theme...'
                  }
                  className={`w-full h-11 bg-slate-950/75 border border-white/10 rounded-2xl ${
                    isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'
                  } text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/70 transition-colors`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={language === 'ar' ? 'مسح البحث' : 'Clear search'}
                    className={`absolute ${
                      isRTL ? 'left-3' : 'right-3'
                    } top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Gender & Age Segmented Filters */}
              <div className="flex flex-wrap items-center gap-2.5 justify-start lg:justify-end">
                {/* Gender Filter */}
                <div
                  role="group"
                  aria-label={language === 'ar' ? 'تصفية حسب النوع' : 'Filter by child'}
                  className="inline-flex items-center gap-1 bg-slate-950/70 p-1 rounded-2xl border border-white/10"
                >
                  {(['all', 'boy', 'girl'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGender(g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[34px] ${
                        selectedGender === g
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {g === 'all'
                        ? language === 'ar'
                          ? 'الكل'
                          : 'All'
                        : g === 'boy'
                        ? language === 'ar'
                          ? 'أولاد'
                          : 'Boys'
                        : language === 'ar'
                        ? 'بنات'
                        : 'Girls'}
                    </button>
                  ))}
                </div>

                {/* Age Filter */}
                <div
                  role="group"
                  aria-label={language === 'ar' ? 'تصفية حسب العمر' : 'Filter by age'}
                  className="inline-flex items-center gap-1 bg-slate-950/70 p-1 rounded-2xl border border-white/10"
                >
                  {['all', '2-4', '5-7', '8-10'].map((age) => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setSelectedAge(age)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-numeric transition-all cursor-pointer min-h-[34px] ${
                        selectedAge === age
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {age === 'all'
                        ? language === 'ar'
                          ? 'كل الأعمار'
                          : 'All Ages'
                        : language === 'ar'
                        ? `${age} سنوات`
                        : `${age} yrs`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Occasion Quick-Filter Chips */}
            <div
              role="group"
              aria-label={language === 'ar' ? 'تصفية حسب المناسبة' : 'Filter by occasion'}
              className="flex items-center gap-2 overflow-x-auto pb-1 pt-3 border-t border-white/10 scrollbar-none"
            >
              <span className="text-xs text-muted-foreground shrink-0 inline-flex items-center gap-1.5 font-semibold me-1">
                <CalendarHeart className="w-5 h-5 text-pink-400" />
                {language === 'ar' ? 'المناسبة:' : 'Occasion:'}
              </span>
              {occasions.map((occ) => {
                const isActive = selectedOccasion === occ.id;
                return (
                  <button
                    key={occ.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelectedOccasion(occ.id)}
                    className={`whitespace-nowrap px-4 py-2 min-h-[40px] rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#F472B6] to-purple-600 text-white shadow-[0_0_16px_rgba(244,114,182,0.35)]'
                        : 'bg-slate-950/60 hover:bg-slate-900 text-muted-foreground hover:text-foreground border border-white/10'
                    }`}
                  >
                    {language === 'ar' ? occ.labelAr : occ.labelEn}
                  </button>
                );
              })}
            </div>

            {/* Category Pills Bar */}
            <div
              role="group"
              aria-label={language === 'ar' ? 'تصفية حسب التصنيف' : 'Filter by theme'}
              className="flex items-center gap-2 overflow-x-auto pb-1 pt-3 border-t border-white/10 scrollbar-none"
            >
              <span className="text-xs text-muted-foreground shrink-0 inline-flex items-center gap-1.5 font-semibold me-1">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                {language === 'ar' ? 'التصنيف:' : 'Theme:'}
              </span>
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`whitespace-nowrap px-4 py-2 min-h-[40px] rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_16px_rgba(0,217,255,0.3)]'
                        : 'bg-slate-950/60 hover:bg-slate-900 text-muted-foreground hover:text-foreground border border-white/10'
                    }`}
                  >
                    {language === 'ar' ? cat.labelAr : cat.labelEn}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Sibling Multi-Book Savings Banner */}
        <section
          aria-label={language === 'ar' ? 'عرض باقات الإخوة والكتب المتعددة' : 'Sibling multi-book savings'}
          className="px-4 bv-container mb-8"
        >
          <div className="glass-card rounded-2xl px-4 py-3.5 sm:px-6 sm:py-4 border border-cyan-400/25 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center sm:text-start">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/25 to-pink-400/25 border border-white/15 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-cyan-300" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
                {language === 'ar'
                  ? 'اطلب كتابين ووفّر 15% • 3 كتب ووفّر 25% + شحن مجاني لمصر والسعودية والإمارات'
                  : 'Order 2 books & save 15% • 3+ books & save 25% + free shipping to Egypt, Saudi Arabia & UAE'}
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/60 border border-white/15 text-[11px] sm:text-xs font-semibold text-cyan-300 whitespace-nowrap">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{language === 'ar' ? 'يُطبّق تلقائياً في السلة' : 'Auto-applied in cart'}</span>
            </span>
          </div>
        </section>

        {/* Ultra-Premium Story Catalog Grid — Zero Badge Clutter */}
        <section className="px-4 bv-container">
          {filteredStories.length === 0 ? (
            <div className="glass-card rounded-3xl text-center py-16 px-6 border border-white/10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 text-primary mx-auto flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold font-editorial text-white">
                  {language === 'ar'
                    ? 'مالقيناش قصص مطابقة لاختيارك دلوقتي'
                    : 'No matching stories right now'}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {language === 'ar'
                    ? 'جرّب تغيير الفلتر أو امسح البحث عشان تشوف كل حكاياتنا الساحرة.'
                    : 'Try clearing a filter or adjusting your search to see the full collection.'}
                </p>
              </div>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className="h-11 px-6 text-sm font-semibold gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إظهار كل القصص' : 'Show All Stories'}</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 xl:gap-8">
              {filteredStories.map((story) => {
                const title = language === 'ar' ? story.titleAr : story.titleEn;
                const pricePdfAed = story.pricePdfAed ?? story.pricePdfSar;
                const studioBadge =
                  story.id === 'zain-bubble-galaxy'
                    ? language === 'ar'
                      ? story.badgeAr ?? 'نموذج حقيقي مُنتَج'
                      : story.badgeEn ?? 'Real Studio Sample'
                    : null;

                return (
                  <motion.article
                    key={story.id}
                    layout={!shouldReduceMotion}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                    className="glass-card rounded-3xl p-4 sm:p-5 border border-white/10 flex flex-col justify-between gap-5"
                  >
                    {/* Large Crisp Book Cover inside TiltBookCard (Zero Badge Clutter) */}
                    <div className="space-y-4">
                      <TiltBookCard
                        maxTilt={9}
                        scaleOnHover={1.025}
                        glareMaxOpacity={0.24}
                        className="rounded-2xl aspect-square group"
                      >
                        <Link
                          to={`/products/${story.id}`}
                          aria-label={
                            language === 'ar' ? `تخصيص قصة ${title}` : `Personalize ${title}`
                          }
                          className="relative block w-full h-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          {/* Subtle Storybook Spine Crease */}
                          <div
                            aria-hidden="true"
                            className={`absolute top-0 bottom-0 w-3 z-10 pointer-events-none ${
                              isRTL
                                ? 'right-0 bg-gradient-to-l from-black/55 via-black/15 to-transparent'
                                : 'left-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent'
                            }`}
                          />
                          <img
                            src={story.coverImage}
                            alt={title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
                          />
                        </Link>
                      </TiltBookCard>

                      {/* Clean Title, Subtle Meta & Clear Multi-Currency Starting Price */}
                      <div className="space-y-2.5 px-1">
                        {(studioBadge || story.supportsCoHero) && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {studioBadge && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[11px] font-semibold text-cyan-300">
                                <Sparkles className="w-4 h-4 shrink-0" />
                                <span>{studioBadge}</span>
                              </span>
                            )}
                            {story.supportsCoHero && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/12 border border-pink-400/25 text-[11px] font-semibold text-pink-200">
                                <Users className="w-4 h-4 shrink-0" />
                                <span>{language === 'ar' ? 'يدعم بطلين' : 'Co-Hero'}</span>
                              </span>
                            )}
                          </div>
                        )}

                        <h3 className="text-lg sm:text-xl font-bold font-editorial text-white leading-snug line-clamp-2">
                          {title}
                        </h3>

                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 pt-0.5">
                          <span className="text-xs text-muted-foreground shrink-0">
                            {language === 'ar' ? 'يبدأ من' : 'Starts from'}
                          </span>
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-numeric">
                            <span className="text-base sm:text-lg font-extrabold text-cyan-300">
                              {language === 'ar'
                                ? `${story.pricePdfEgp} ج.م`
                                : `${story.pricePdfEgp} EGP`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {language === 'ar'
                                ? `• ${story.pricePdfSar} ر.س • ${pricePdfAed} د.إ`
                                : `• ${story.pricePdfSar} SAR • ${pricePdfAed} AED`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ONE Crystal-Clear 3D Bubble CTA Button */}
                    <Button
                      type="button"
                      onClick={() => handlePersonalizeStory(story)}
                      className="w-full min-h-[44px] xl:min-h-[48px] h-11 xl:h-12 px-4 xl:px-6 bubble-btn bubble-btn-primary text-xs md:text-sm xl:text-base font-bold gap-2"
                    >
                      <span>{language === 'ar' ? 'خصّص القصة الآن' : 'Personalize Now'}</span>
                      <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                    </Button>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>

        {/* Warm Custom Concept WhatsApp Banner */}
        <section className="px-4 bv-container mt-16">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-primary/25 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center sm:text-start">
              <h2 className="text-xl sm:text-2xl font-bold font-editorial text-white flex items-center gap-2.5 justify-center sm:justify-start">
                <MessageCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'عندك فكرة قصة خاصة في بالك؟'
                    : 'Have a special story idea in mind?'}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                {language === 'ar'
                  ? 'كلّمنا على واتساب وهنصمّملك حكاية مخصوصة تناسب هواية طفلك، عيد ميلاده، أو مناسبة عائلية جميلة.'
                  : 'Chat with us on WhatsApp and our studio will craft a one-of-a-kind story for a birthday, special hobby, or family milestone.'}
              </p>
            </div>

            <Button
              type="button"
              variant="emerald"
              onClick={() => openWhatsAppInquiry()}
              className="min-h-[44px] xl:min-h-[48px] h-11 xl:h-12 px-5 xl:px-7 text-xs md:text-sm xl:text-base shrink-0 gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{language === 'ar' ? 'تواصل معنا عبر واتساب' : 'Chat on WhatsApp'}</span>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
