import { careerArtwork, characterArtwork, visual } from './siteArtwork.ts';

export interface HeroBookSlide {
  id: string;
  titleAr: string;
  titleEn: string;
  badgeAr: string;
  badgeEn: string;
  coverImage: string;
  miniPreviewImage: string;
  linkedStoryId: string;
  accentColor: string;
}

export interface CharacterCardConfig {
  id: string;
  badge: string;
  badgeAr?: string;
  badgeEn?: string;
  title: string;
  titleAr?: string;
  titleEn?: string;
  subtitle: string;
  subtitleAr?: string;
  subtitleEn?: string;
  primaryImage: string;
  secondaryImage?: string;
  subType?: string;
  variations: {
    label: string;
    labelAr?: string;
    labelEn?: string;
    image: string;
    tag: string;
    tagAr?: string;
    tagEn?: string;
  }[];
}

export interface CareerRoleConfig {
  id: string;
  roleKey: string;
  titleAr: string;
  titleEn: string;
  roleAr: string;
  roleEn: string;
  descAr: string;
  descEn: string;
  image: string;
  badge: string;
  badgeAr?: string;
  badgeEn?: string;
}

export interface CustomerReviewConfig {
  id: string;
  parentName: string;
  city: string;
  cityAr?: string;
  cityEn?: string;
  childName: string;
  childNameAr?: string;
  childNameEn?: string;
  rating: number;
  date: string;
  dateAr?: string;
  dateEn?: string;
  messageAr: string;
  messageEn: string;
  bookTitle: string;
  bookTitleAr?: string;
  bookTitleEn?: string;
  verified: boolean;
  avatarUrl?: string;
}

export interface HomepageShowcaseConfig {
  heroBooks: HeroBookSlide[];
  characterSectionTitleAr: string;
  characterSectionTitleEn: string;
  characterSectionSubtitleAr: string;
  characterSectionSubtitleEn: string;
  characterCards: CharacterCardConfig[];
  careerTitleAr: string;
  careerTitleEn: string;
  careerSubtitleAr: string;
  careerSubtitleEn: string;
  careerRoles: CareerRoleConfig[];
  reviewsTitleAr: string;
  reviewsTitleEn: string;
  reviewsSubtitleAr: string;
  reviewsSubtitleEn: string;
  reviews: CustomerReviewConfig[];
}

export type ShowcaseConfig = HomepageShowcaseConfig;

const originalHeroBooks: HeroBookSlide[] = [
  {
    id: 'hero-space-odyssey',
    titleAr: 'رحلة إلى الفضاء الخارجي',
    titleEn: 'Space Explorer: Star Odyssey',
    badgeAr: 'الأكثر مبيعاً',
    badgeEn: 'Best Seller',
    coverImage: '/bubble-books/space.webp',
    miniPreviewImage: '/showcase/career/career-astronaut.jpg',
    linkedStoryId: 'space-journey',
    accentColor: '#00D9FF',
  },
  {
    id: 'hero-animal-doctor',
    titleAr: 'طبيب الحيوانات اللطيف',
    titleEn: 'The Kindest Animal Doctor',
    badgeAr: 'الأكثر طلباً',
    badgeEn: 'Most Popular',
    coverImage: '/bubble-books/jungle.webp',
    miniPreviewImage: '/bubble-books/hero-left.webp',
    linkedStoryId: 'animal-doctor',
    accentColor: '#34D399',
  },
  {
    id: 'hero-ocean-explorer',
    titleAr: 'مستكشف الأعماق السحرية',
    titleEn: 'Underwater Ocean Explorer',
    badgeAr: 'محبوب الصغار',
    badgeEn: "Kids' Favorite",
    coverImage: '/bubble-books/ocean.webp',
    miniPreviewImage: '/bubble-books/hero-right.webp',
    linkedStoryId: 'ocean-explorer',
    accentColor: '#38BDF8',
  },
  {
    id: 'hero-star-princess',
    titleAr: 'أميرة النجوم وبساط الريح',
    titleEn: 'Princess of the Twinkling Stars',
    badgeAr: 'نوم هادئ',
    badgeEn: 'Peaceful Bedtime',
    coverImage: '/catalog/bedtime-magic.jpg',
    miniPreviewImage: '/catalog/superhero-academy.jpg',
    linkedStoryId: 'star-princess',
    accentColor: '#F472B6',
  },
];

const originalShowcaseConfig: HomepageShowcaseConfig = {
  heroBooks: originalHeroBooks,
  characterSectionTitleAr: 'نرسم طفلك بطلاً للحكاية بكل ملامحه وتفاصيله الحقيقية',
  characterSectionTitleEn: "Your Child, Artfully Illustrated Into the Hero of Every Page",
  characterSectionSubtitleAr: 'رسومات فنية متقنة تُخلد ابتسامة طفلك وشكل عينيه وملامحه المحبوبة في كل صفحة ومغامرة بين دفتي كتاب فاخر.',
  characterSectionSubtitleEn: 'Artisan illustrations preserving your child’s smile, curls, and recognizable wonder across every spread of an heirloom hardcover.',
  characterCards: [
    {
      id: 'faces',
      badge: 'ملامح الطفل الحقيقية • True Likeness',
      badgeAr: 'ملامح الطفل الحقيقية',
      badgeEn: 'True Likeness',
      title: 'من الصورة الحقيقية لبطل الرواية',
      titleAr: 'من الصورة الحقيقية لبطل الرواية',
      titleEn: 'From Real Photo to Story Hero',
      subtitle: 'تجسيد فني متقن للملامح والابتسامة',
      subtitleAr: 'تجسيد فني متقن للملامح والابتسامة',
      subtitleEn: 'Artfully illustrated likeness and genuine smile',
      primaryImage: '/showcase/character/likeness-real.jpg',
      secondaryImage: '/showcase/character/likeness-pixar.jpg',
      variations: [
        { label: 'الصورة الواقعية', labelAr: 'الصورة الواقعية', labelEn: 'Real Photo', image: '/showcase/character/likeness-real.jpg', tag: 'صورة طفلك الحقيقية 📸', tagAr: 'صورة طفلك الحقيقية 📸', tagEn: 'Real Child Photo 📸' },
        { label: 'بطل الحكاية المصور', labelAr: 'بطل الحكاية المصور', labelEn: 'Story Hero', image: '/showcase/character/likeness-pixar.jpg', tag: 'رسم قصصي ساحر ✨', tagAr: 'رسم قصصي ساحر ✨', tagEn: 'Whimsical Illustration ✨' },
      ],
    },
    {
      id: 'expressions',
      badge: 'مشاعر وتعبيرات حية • Living Story Emotions',
      badgeAr: 'مشاعر وتعبيرات حية',
      badgeEn: 'Living Story Emotions',
      title: 'تفاعل حقيقي مع مواقف المغامرة',
      titleAr: 'تفاعل حقيقي مع مواقف المغامرة',
      titleEn: 'Living Storybook Emotions',
      subtitle: 'ابتسامة دافئة، دهشة، وفخر بطولي',
      subtitleAr: 'ابتسامة دافئة، دهشة، وفخر بطولي',
      subtitleEn: 'Warm smiles, curious wonder, and heroic triumph',
      primaryImage: '/bubble-books/hero-left.jpg',
      variations: [
        { label: 'فرح ومرح', labelAr: 'فرح ومرح', labelEn: 'Joy & Warmth', image: '/bubble-books/hero-left.jpg', tag: 'فرح وابتسامة دافئة 😊', tagAr: 'فرح وابتسامة دافئة 😊', tagEn: 'Warm Joyful Smile 😊' },
        { label: 'شجاعة وبطولة', labelAr: 'شجاعة وبطولة', labelEn: 'Bravery', image: '/catalog/superhero-academy.jpg', tag: 'بطل شجاع 🦁', tagAr: 'بطل شجاع 🦁', tagEn: 'Brave Story Hero 🦁' },
        { label: 'اكتشاف ومغامرة', labelAr: 'اكتشاف ومغامرة', labelEn: 'Curiosity', image: '/catalog/dinosaur-valley.jpg', tag: 'شغف الاستكشاف 🦕', tagAr: 'شغف الاستكشاف 🦕', tagEn: 'Curious Explorer 🦕' },
      ],
    },
    {
      id: 'angles',
      badge: 'حضور سينمائي متناسق • Seamless Character Continuity',
      badgeAr: 'حضور سينمائي متناسق',
      badgeEn: 'Seamless Continuity',
      title: 'مشاهد وزوايا حركية متناسقة',
      titleAr: 'مشاهد وزوايا حركية متناسقة',
      titleEn: 'Dynamic Angles & Continuity',
      subtitle: 'ثبات ملامح طفلك في كل صفحة وزاوية',
      subtitleAr: 'ثبات ملامح طفلك في كل صفحة وزاوية',
      subtitleEn: 'Consistent facial features across every page',
      primaryImage: '/bubble-books/hero-right.jpg',
      variations: [
        { label: 'إطلالة مباشرة', labelAr: 'إطلالة مباشرة', labelEn: 'Frontal Portrait', image: '/bubble-books/hero-right.jpg', tag: 'مشهد أمامي دافئ 📖', tagAr: 'مشهد أمامي دافئ 📖', tagEn: 'Warm Frontal View 📖' },
        { label: 'تأمل واستغراق', labelAr: 'تأمل واستغراق', labelEn: 'Dreamy & Calm', image: '/catalog/bedtime-magic.jpg', tag: 'مشهد ليلي حالم 🌙', tagAr: 'مشهد ليلي حالم 🌙', tagEn: 'Dreamy Night Scene 🌙' },
        { label: 'مغامرة وانطلاق', labelAr: 'مغامرة وانطلاق', labelEn: 'Action Pose', image: '/bubble-books/jungle.jpg', tag: 'حركة وانطلاق بطولي 🌿', tagAr: 'حركة وانطلاق بطولي 🌿', tagEn: 'Dynamic Action Pose 🌿' },
      ],
    },
    {
      id: 'styles',
      badge: 'عوالم ورسومات ساحرة • Fine Art Storybook Styles',
      badgeAr: 'عوالم ورسومات ساحرة',
      badgeEn: 'Storybook Styles',
      title: 'أنماط فنية تناسب براءة وخيال الطفولة',
      titleAr: 'أنماط فنية تناسب براءة وخيال الطفولة',
      titleEn: 'Fine Art Storybook Styles',
      subtitle: 'رسوم ثلاثية الأبعاد، ألوان مائية، وقصص مصورة',
      subtitleAr: 'رسوم ثلاثية الأبعاد، ألوان مائية، وقصص مصورة',
      subtitleEn: '3D Pixar-style, watercolors, and comic adventures',
      primaryImage: '/showcase/career/career-astronaut.jpg',
      variations: [
        { label: 'ثلاثي الأبعاد سينمائي', labelAr: 'ثلاثي الأبعاد سينمائي', labelEn: '3D Cinematic', image: '/showcase/career/career-astronaut.jpg', tag: 'ثلاثي الأبعاد بيكسار 🎬', tagAr: 'ثلاثي الأبعاد بيكسار 🎬', tagEn: '3D Pixar Style 🎬' },
        { label: 'عالم المغامرة الملحمي', labelAr: 'عالم المغامرة الملحمي', labelEn: 'Epic Fantasy', image: '/catalog/dinosaur-valley.jpg', tag: 'رسوم خيالية ملونة 🦕', tagAr: 'رسوم خيالية ملونة 🦕', tagEn: 'Vibrant Storybook 🦕' },
        { label: 'قصص دافئة قبل النوم', labelAr: 'قصص دافئة قبل النوم', labelEn: 'Bedtime Gentle', image: '/catalog/bedtime-magic.jpg', tag: 'ألوان حالمة هادئة 🌙', tagAr: 'ألوان حالمة هادئة 🌙', tagEn: 'Soothing Pastels 🌙' },
      ],
    },
  ],
  careerTitleAr: 'نمِّ طموح طفلك بقصص المهن وأحلام المستقبل',
  careerTitleEn: "Fuel your child's ambition with career-themed adventures",
  careerSubtitleAr: 'شاهد طفلك في دور رائد الفضاء، المهندس، الطبيب، أو العالم المخترع.',
  careerSubtitleEn: 'Inspiring personalized tales where your child steps into their dream future career.',
  careerRoles: [
    {
      id: 'astronaut',
      roleKey: 'astronaut',
      titleAr: 'رائد الفضاء الصغير',
      titleEn: 'Omar the Astronaut',
      roleAr: 'استكشاف الكواكب والمجرات',
      roleEn: 'Exploring Nebulae & Planets',
      descAr: 'ببدلة الفضاء وخوذته المتلألئة، يقود سفينته لاستكشاف أسرار الكون وزيارة الكواكب البعيدة.',
      descEn: 'Suited up in high-tech astronaut gear, charting constellations and making friendly alien discoveries.',
      image: '/showcase/career/career-astronaut.jpg',
      badge: 'فضاء ومغامرة • Space Explorer',
      badgeAr: 'فضاء ومغامرة',
      badgeEn: 'Space Explorer',
    },
    {
      id: 'engineer',
      roleKey: 'engineer',
      titleAr: 'المهندس والمخترع العبقري',
      titleEn: 'The Genius Little Engineer',
      roleAr: 'تصميم وبناء مدن المستقبل',
      roleEn: 'Designing Tomorrow’s Cities',
      descAr: 'بخوذة الأمان وأدوات القياس، يبتكر حلولاً ميكانيكية تبني جسوراً وتصنع روبوتات الصداقة.',
      descEn: 'Wearing safety helmet and blueprints in hand, constructing clever robots and bridges.',
      image: '/showcase/career/career-engineer.jpg',
      badge: 'ابتكار وبناء • Innovation',
      badgeAr: 'ابتكار وبناء',
      badgeEn: 'Innovation & Tech',
    },
    {
      id: 'doctor',
      roleKey: 'doctor',
      titleAr: 'طبيب الأمل والرحمة',
      titleEn: 'The Heroic Little Doctor',
      roleAr: 'معالجة ومساعدة الأصدقاء',
      roleEn: 'Healing & Helping Friends',
      descAr: 'بمعطف الفحص وسماعته اللطيفة، يداوي حيوانات الغابة ويبث الأمان والابتسامة.',
      descEn: 'With stethoscope and a kind reassuring smile, spreading health, care, and comfort.',
      image: '/bubble-books/jungle.jpg',
      badge: 'طب وإنسانية • Healthcare',
      badgeAr: 'طب وإنسانية',
      badgeEn: 'Healthcare & Care',
    },
    {
      id: 'scientist',
      roleKey: 'scientist',
      titleAr: 'العالم الصغير في معمل العجائب',
      titleEn: 'The Wonder Laboratory Scientist',
      roleAr: 'تجارب كيميائية واكتشافات مذهلة',
      roleEn: 'Magical Scientific Discoveries',
      descAr: 'بين أنابيب الاختبار المضيئة، يكتشف صيغاً سحرية تحول الفقاعات إلى طاقة نظيفة وخيال.',
      descEn: 'Surrounded by glowing beakers and equations, inventing clean magical energy for everyone.',
      image: '/catalog/superhero-academy.jpg',
      badge: 'علوم واكتشاف • Science & Wonder',
      badgeAr: 'علوم واكتشاف',
      badgeEn: 'Science & Discovery',
    },
  ],
  reviewsTitleAr: 'تجارب أولياء الأمور الحقيقية وردود فعل أطفالهم',
  reviewsTitleEn: 'What Happy Parents & Children Are Saying',
  reviewsSubtitleAr: 'رسائل حقيقية ومشاركات مبهجة من عائلات Bubbleverse في مصر والسعودية.',
  reviewsSubtitleEn: 'Authentic messages and unboxing smiles from families across Egypt & Saudi Arabia.',
  reviews: [
    {
      id: 'rev-1',
      parentName: 'أم سيف الدين',
      city: 'القاهرة، مصر',
      cityAr: 'القاهرة، مصر',
      cityEn: 'Cairo, Egypt',
      childName: 'سيف (5 سنوات)',
      childNameAr: 'سيف (5 سنوات)',
      childNameEn: 'Seif (5 yrs)',
      rating: 5,
      date: 'منذ يومين',
      dateAr: 'منذ يومين',
      dateEn: '2 days ago',
      messageAr: 'الكتاب وصل النهاردة والطباعة تحفة بجد! الولد طار من الفرحة لما شاف صورته على الغلاف وهو راكب الصاروخ.. مبقاش ينام إلا وهو في حضنه!',
      messageEn: 'The book arrived today and print quality is absolutely stunning! He was ecstatic seeing his face on the cover in a space rocket.',
      bookTitle: 'رحلة إلى الفضاء الخارجي',
      bookTitleAr: 'رحلة إلى الفضاء الخارجي',
      bookTitleEn: 'Outer Space Voyage',
      verified: true,
      avatarUrl: '/showcase/reviews/review-seif.jpg',
    },
    {
      id: 'rev-2',
      parentName: 'أبو فهد العتيبي',
      city: 'الرياض، السعودية',
      cityAr: 'الرياض، السعودية',
      cityEn: 'Riyadh, Saudi Arabia',
      childName: 'فهد (6 سنوات)',
      childNameAr: 'فهد (6 سنوات)',
      childNameEn: 'Fahad (6 yrs)',
      rating: 5,
      date: 'منذ أسبوع',
      dateAr: 'منذ أسبوع',
      dateEn: '1 week ago',
      messageAr: 'ما شاء الله تبارك الله، جودة الورق والغلاف المقوى فاخرة جداً وثبات ملامح الوجه في كل الصفحات أذهلني. فخور جداً بهذه الهدية.',
      messageEn: 'Exceptional hardcover print quality and 100% facial likeness across all pages. Best gift we ever got him.',
      bookTitle: 'طبيب الحيوانات اللطيف',
      bookTitleAr: 'طبيب الحيوانات اللطيف',
      bookTitleEn: 'The Gentle Animal Doctor',
      verified: true,
      avatarUrl: '/showcase/reviews/review-fahad.jpg',
    },
    {
      id: 'rev-3',
      parentName: 'د. مروة الشريف',
      city: 'الإسكندرية، مصر',
      cityAr: 'الإسكندرية، مصر',
      cityEn: 'Alexandria, Egypt',
      childName: 'جنى (4 سنوات)',
      childNameAr: 'جنى (4 سنوات)',
      childNameEn: 'Jana (4 yrs)',
      rating: 5,
      date: 'منذ 4 أيام',
      dateAr: 'منذ 4 أيام',
      dateEn: '4 days ago',
      messageAr: 'الألوان المائية والتفاصيل ساحرة جداً. استلمت نسخة الـ PDF الفورية وطبعت الكتاب، والنتيجة فوق الخيال. خدمة عملاء ممتازة وذوق.',
      messageEn: 'Dreamy watercolor art and wonderful storytelling. Received the instant PDF and printed it. Truly magical service!',
      bookTitle: 'حكاية النجوم الدافئة قبل النوم',
      bookTitleAr: 'حكاية النجوم الدافئة قبل النوم',
      bookTitleEn: 'Gentle Bedtime Starlight',
      verified: true,
      avatarUrl: '/catalog/bedtime-magic.jpg',
    },
  ],
};

const heroArtwork: Record<string, [string, string]> = {
  'hero-space-odyssey': [careerArtwork.astronaut, visual('space-ship')],
  'hero-animal-doctor': [visual('vet-rabbit'), visual('vet-flowers')],
  'hero-ocean-explorer': [visual('ocean-turtle'), visual('ocean-turtle')],
  'hero-star-princess': [visual('star-princess'), visual('star-princess')],
};

const cardArtwork: Record<string, string[]> = {
  faces: [characterArtwork.reference, characterArtwork.illustrated],
  expressions: characterArtwork.expressions,
  angles: characterArtwork.angles,
  styles: characterArtwork.styles,
};

function refreshShowcaseArtwork(config: HomepageShowcaseConfig): HomepageShowcaseConfig {
  return {
    ...config,
    heroBooks: config.heroBooks.map((slide) => {
      const previous = originalHeroBooks.find((book) => book.id === slide.id);
      const images = heroArtwork[slide.id];
      if (!previous || !images) return slide;
      return {
        ...slide,
        coverImage: slide.coverImage === previous.coverImage ? images[0] : slide.coverImage,
        miniPreviewImage: slide.miniPreviewImage === previous.miniPreviewImage ? images[1] : slide.miniPreviewImage,
      };
    }),
    characterCards: config.characterCards.map((card) => {
      const previous = originalShowcaseConfig.characterCards.find((item) => item.id === card.id);
      const images = cardArtwork[card.id];
      if (!previous || !images) return card;
      return {
        ...card,
        primaryImage: card.primaryImage === previous.primaryImage ? images[0] : card.primaryImage,
        secondaryImage: previous.secondaryImage && card.secondaryImage === previous.secondaryImage ? images[1] : card.secondaryImage,
        variations: (Array.isArray(card.variations) ? card.variations : previous.variations).map((item, index) => {
          if (item.image !== previous.variations[index]?.image || !images[index]) return item;
          if (card.id === 'styles') {
            const names = [
              ['رسم ثلاثي الأبعاد', 'Cinematic 3D'],
              ['ألوان مائية', 'Watercolor'],
              ['قصص مصوّرة', 'Comic art'],
            ];
            const [labelAr, labelEn] = names[index];
            return { ...item, image: images[index], label: labelAr, labelAr, labelEn, tag: labelAr, tagAr: labelAr, tagEn: labelEn };
          }
          if (card.id === 'faces' && index === 0) {
            return { ...item, image: images[index], label: 'مرجع خيالي', labelAr: 'مرجع خيالي', labelEn: 'Fictional reference',
              tag: 'مرجع خيالي', tagAr: 'مرجع خيالي', tagEn: 'Fictional reference' };
          }
          return { ...item, image: images[index] };
        }),
      };
    }),
    careerRoles: config.careerRoles.map((role) => {
      const previous = originalShowcaseConfig.careerRoles.find((item) => item.id === role.id);
      return previous?.image === role.image
        ? { ...role, image: careerArtwork[role.roleKey as keyof typeof careerArtwork] ?? role.image }
        : role;
    }),
    reviews: config.reviews.map((review) => {
      const previous = originalShowcaseConfig.reviews.find((item) => item.id === review.id);
      return previous?.avatarUrl === review.avatarUrl ? { ...review, avatarUrl: '' } : review;
    }),
  };
}

export const DEFAULT_SHOWCASE_CONFIG = refreshShowcaseArtwork(originalShowcaseConfig);
export const DEFAULT_HERO_BOOKS = DEFAULT_SHOWCASE_CONFIG.heroBooks;

const STORAGE_KEY = 'bubbleverse_homepage_showcase_v2';

export function getShowcaseConfig(): HomepageShowcaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SHOWCASE_CONFIG;
    const parsed = JSON.parse(raw);
    const hasHeroBooks = Array.isArray(parsed.heroBooks) && parsed.heroBooks.length > 0;
    return refreshShowcaseArtwork({
      ...DEFAULT_SHOWCASE_CONFIG,
      ...parsed,
      heroBooks: hasHeroBooks ? parsed.heroBooks : DEFAULT_SHOWCASE_CONFIG.heroBooks,
      characterCards:
        Array.isArray(parsed.characterCards) && parsed.characterCards.length > 0
          ? parsed.characterCards
          : DEFAULT_SHOWCASE_CONFIG.characterCards,
      careerRoles:
        Array.isArray(parsed.careerRoles) && parsed.careerRoles.length > 0
          ? parsed.careerRoles
          : DEFAULT_SHOWCASE_CONFIG.careerRoles,
      reviews:
        Array.isArray(parsed.reviews) && parsed.reviews.length > 0
          ? parsed.reviews
          : DEFAULT_SHOWCASE_CONFIG.reviews,
    });
  } catch {
    return DEFAULT_SHOWCASE_CONFIG;
  }
}

export function saveShowcaseConfig(config: HomepageShowcaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bubbleverse:showcase-updated'));
    }
  } catch (err) {
    console.error('Failed to save showcase config to storage:', err);
  }
}

export function resetShowcaseConfig(): HomepageShowcaseConfig {
  saveShowcaseConfig(DEFAULT_SHOWCASE_CONFIG);
  return DEFAULT_SHOWCASE_CONFIG;
}
