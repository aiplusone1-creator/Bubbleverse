export type MerchCategory = 'plush' | 'bundle' | 'bedtime' | 'bags' | 'activity';

export interface MerchVariant {
  id: string;
  labelAr: string;
  labelEn: string;
  dimensionsAr: string;
  dimensionsEn: string;
  diameterCm?: number;
  priceEgp: number;
  priceSar: number;
  priceAed: number;
  sku: string;
  badgeAr?: string;
  badgeEn?: string;
}

export interface MerchProduct {
  id: string;
  sku: string;
  slug: string;
  category: MerchCategory;
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  taglineEn: string;
  descriptionAr: string;
  descriptionEn: string;
  bubLoreAr: string;
  bubLoreEn: string;
  bedtimeRitualAr: string;
  bedtimeRitualEn: string;
  coverImage: string;
  galleryImages: string[];
  badgeAr?: string;
  badgeEn?: string;
  ageRatingAr: string;
  ageRatingEn: string;
  safetySpecsAr: string[];
  safetySpecsEn: string[];
  careAr: string;
  careEn: string;
  priceEgp: number;
  priceSar: number;
  priceAed: number;
  compareAtEgp?: number;
  compareAtSar?: number;
  compareAtAed?: number;
  variants: MerchVariant[];
  inStock: boolean;
  stockCount: number;
  featured?: boolean;
  isGwpEligibleGift?: boolean;
  allowsRibbonName?: boolean;
}

export interface MerchCategoryMeta {
  id: MerchCategory;
  labelAr: string;
  labelEn: string;
}

export const MERCH_CATEGORIES: MerchCategoryMeta[] = [
  { id: 'plush', labelAr: 'ألعاب وكرات باب', labelEn: 'Bub Plush' },
  { id: 'bundle', labelAr: 'صناديق القصة والهدايا', labelEn: 'Story Bundles' },
  { id: 'bedtime', labelAr: 'إضاءة ونوم', labelEn: 'Bedtime & Lights' },
  { id: 'bags', labelAr: 'شنط وإكسسوارات', labelEn: 'Bags & Accessories' },
  { id: 'activity', labelAr: 'أنشطة وتلوين', labelEn: 'Activity Kits' },
];

export const DEFAULT_MERCH_PRODUCTS: MerchProduct[] = [
  {
    id: 'bub-plush-ball',
    sku: 'BV-BUB-PLUSH',
    slug: 'bub-plush-ball',
    category: 'plush',
    nameAr: 'كورة باب القطيفة المتلألئة',
    nameEn: 'Official Bub Iridescent Plush Ball',
    taglineAr: 'رفيق طفلك السحري من صفحات القصة إلى حضنه الدافئ',
    taglineEn: "Your child's magical story buddy—now soft, huggable, and real",
    descriptionAr:
      'كورة «باب» القطيفة الأصلية من بابل فيرس مصنوعة من مخمل فائق النعومة بلمعة قوس قزح ليلية هادئة (سيان وبنفسجي ووردي)، مصممة لتكون صديق اللعب النهاري ووسادة الحضن المريحة وقت القراءة والنوم.',
    descriptionEn:
      'The official Bubbleverse Bub Plush Ball crafted from ultra-soft iridescent velvet in soothing midnight cyan, lavender, and rose tones. Designed to leap straight out of your personalized storybook into everyday play and cozy bedtime hugs.',
    bubLoreAr:
      'وُلد «باب» من أول فقاعة ضحك انطلقت في سماء عالم بابل فيرس، ومهمته أن يرافق كل بطل صغير في مغامراته ويذكّره أن الشجاعة واللطف تبدأ من داخله دائماً.',
    bubLoreEn:
      'Born from the very first bubble of giggles in the Bubbleverse sky, Bub travels alongside every little hero to remind them that courage, curiosity, and kindness always shine from within.',
    bedtimeRitualAr:
      'قبل إطفاء النور، يمسك طفلك بـ«باب» ويحكي له أجمل لحظة في يومه، ثم تقرآن معاً صفحة من قصته المخصّصة ليشعر بالأمان والهدوء قبل النوم.',
    bedtimeRitualEn:
      'Before lights out, invite your child to hug Bub and whisper their favorite moment of the day, then read a page from their personalized book together for a calm, screen-free bedtime wind-down.',
    coverImage: '/merch/bub-plush-ball.jpg',
    galleryImages: [
      '/merch/bub-plush-ball.jpg',
      '/merch/story-bub-giftbox.jpg',
      '/merch/hero-backpack.jpg',
    ],
    badgeAr: 'هدية مع القصص',
    badgeEn: 'GWP Gift Star',
    ageRatingAr: '0+ آمن للرضّع والأطفال',
    ageRatingEn: '0+ Safe from Birth',
    safetySpecsAr: [
      'عيون وابتسامة مطرّزة 100% بدون أي قطع بلاستيكية قابلة للانفصال',
      'حشو ألياف سحابية مضادة للحساسية وخالية من حبيبات الخطر',
      'أصباغ غير سامة ومطابقة لمعايير أمان الألعاب EN-71 وASTM F963 وSASO',
      'خياطة مزدوجة مقوّاة تتحمل العناق واللعب اليومي',
    ],
    safetySpecsEn: [
      '100% embroidered eyes and smile—zero detachable plastic choking parts',
      'Hypoallergenic cloud-fiber fill with zero loose plastic pellets',
      'Non-toxic dyes aligned with EN-71, ASTM F963, and SASO toy safety standards',
      'Reinforced double-stitched seams built for daily hugs and adventures',
    ],
    careAr:
      'يُغسل يدوياً بلطف بماء بارد وصابون أطفال خفيف، أو في دورة الغسيل الرقيق داخل كيس غسيل شبكي، ثم يُجفف بالهواء الطبيعي بعيداً عن الحرارة المباشرة.',
    careEn:
      'Hand-wash gently in cool water with mild baby soap, or machine wash on delicate inside a mesh laundry bag. Air-dry flat away from direct heat.',
    priceEgp: 190,
    priceSar: 49,
    priceAed: 49,
    variants: [
      {
        id: 'mini-12cm',
        labelAr: 'ميني 12 سم (مقاس الهدية / ميدالية)',
        labelEn: 'Mini 12cm (GWP Gift Size / Bag Clip)',
        dimensionsAr: 'قطر 12 سم (4.7 إنش) • مع حلقة تعليق للشنطة',
        dimensionsEn: '12 cm (4.7") diameter • includes detachable bag clip',
        diameterCm: 12,
        priceEgp: 190,
        priceSar: 49,
        priceAed: 49,
        sku: 'BV-BUB-MINI-12',
        badgeAr: 'مقاس الهدية',
        badgeEn: 'GWP Gift Size',
      },
      {
        id: 'classic-20cm',
        labelAr: 'كلاسيك 20 سم (الأكثر طلباً)',
        labelEn: 'Classic 20cm (Most Popular)',
        dimensionsAr: 'قطر 20 سم (7.9 إنش) • مقاس الحضن المثالي للعب والقراءة',
        dimensionsEn: '20 cm (7.9") diameter • ideal everyday cuddle & reading size',
        diameterCm: 20,
        priceEgp: 340,
        priceSar: 89,
        priceAed: 89,
        sku: 'BV-BUB-CLASSIC-20',
        badgeAr: 'الأكثر طلباً',
        badgeEn: 'Most Popular',
      },
      {
        id: 'jumbo-30cm',
        labelAr: 'جامبو 30 سم (وسادة حضن للنوم)',
        labelEn: 'Jumbo 30cm (Bedtime Cuddle Pillow)',
        dimensionsAr: 'قطر 30 سم (11.8 إنش) • فائق النعومة لزاوية القراءة والسرير',
        dimensionsEn: '30 cm (11.8") diameter • plush bedtime pillow for story corners',
        diameterCm: 30,
        priceEgp: 520,
        priceSar: 135,
        priceAed: 135,
        sku: 'BV-BUB-JUMBO-30',
        badgeAr: 'وسادة نوم',
        badgeEn: 'Bedtime Pillow',
      },
    ],
    inStock: true,
    stockCount: 85,
    featured: true,
    isGwpEligibleGift: true,
    allowsRibbonName: true,
  },
  {
    id: 'story-bub-giftbox',
    sku: 'BV-GIFTBOX-STD',
    slug: 'story-bub-giftbox',
    category: 'bundle',
    nameAr: 'صندوق القصة الفاخر + كورة باب',
    nameEn: 'Ultimate Story + Bub Gift Box',
    taglineAr: 'أجمل هدية عيد ميلاد جاهزة للتقديم تجمع القصة المطبوعة ورفيقها القطيفة',
    taglineEn: 'Gift-ready keepsake box pairing magnetic gift presentation with cuddly Bub Plush',
    descriptionAr:
      'صندوق هدايا بابل فيرس المغناطيسي الفاخر بلون السماء الليلية المرصّع بالنجوم الذهبية، يتضمن كورة «باب» القطيفة، شريط ساتان باسم طفلك، كارت إهداء فاخر، وحافظة قماشية مخصّصة لحفظ قصته المخصّصة.',
    descriptionEn:
      'Our signature midnight-navy magnetic keepsake gift box stamped with gold stars. Includes an Official Bub Plush Ball, personalized satin name ribbon, gold-foiled greeting card, and protective story sleeve—ready to wow on birthdays and Eid.',
    bubLoreAr:
      'يخبئ «باب» داخل هذا الصندوق تذكرة ذهبية صغيرة تفتح عالم الخيال في كل مرة يفتح فيها طفلك هديته الجديدة.',
    bubLoreEn:
      'Inside every keepsake box, Bub tucks away a little spark of starlight—turning unboxing day into the opening chapter of a lifelong favorite memory.',
    bedtimeRitualAr:
      'استخدموا الصندوق المغناطيسي كـ«صندوق الكنوز الليلي» لترتيب القصة وكورة باب بداخله بعد الانتهاء من القراءة كل مساء.',
    bedtimeRitualEn:
      'Reuse the magnetic keepsake box as a nightly "Story Treasure Chest" where your child tucks their book and Bub safely to sleep after storytime.',
    coverImage: '/merch/story-bub-giftbox.jpg',
    galleryImages: [
      '/merch/story-bub-giftbox.jpg',
      '/merch/bub-plush-ball.jpg',
      '/showcase/zain-sample/cover.jpg',
    ],
    badgeAr: 'وفّر 18%',
    badgeEn: 'Save 18%',
    ageRatingAr: '0+ مناسب لكل الأعمار',
    ageRatingEn: '0+ All Ages',
    safetySpecsAr: [
      'صندوق مقوّى بحواف ناعمة وإغلاق مغناطيسي مخفي آمن للأطفال',
      'كورة باب قطيفة بعيون مطرّزة 100% وخالية من القطع الصغيرة',
      'أحبار طباعة نباتية صديقة للبيئة على الصندوق وكارت الإهداء',
    ],
    safetySpecsEn: [
      'Sturdy rounded-edge keepsake box with safely enclosed magnetic closure',
      'Includes 100% embroidered-feature Bub Plush with zero choking hazards',
      'Eco-friendly soy-based inks on box artwork and greeting card',
    ],
    careAr:
      'امسح الصندوق بقطعة قماش جافة ناعمة؛ وتُغسل كورة باب القطيفة بلطف بماء بارد وتُجفف بالهواء.',
    careEn:
      'Wipe the keepsake box gently with a dry soft cloth; hand-wash the Bub Plush in cool water and air-dry.',
    priceEgp: 690,
    priceSar: 169,
    priceAed: 169,
    compareAtEgp: 840,
    compareAtSar: 209,
    compareAtAed: 209,
    variants: [
      {
        id: 'standard-box-classic',
        labelAr: 'الصندوق القياسي + باب كلاسيك 20 سم',
        labelEn: 'Standard Box + Classic Bub (20cm)',
        dimensionsAr: 'صندوق 26 × 26 × 14 سم + كورة باب قطر 20 سم',
        dimensionsEn: 'Box 26 × 26 × 14 cm + Classic 20 cm Bub Plush',
        diameterCm: 20,
        priceEgp: 690,
        priceSar: 169,
        priceAed: 169,
        sku: 'BV-GIFTBOX-STD',
        badgeAr: 'وفّر 18%',
        badgeEn: 'Save 18%',
      },
      {
        id: 'deluxe-box-jumbo',
        labelAr: 'الصندوق الديلوكس + باب جامبو 30 سم',
        labelEn: 'Deluxe Box + Jumbo Bub (30cm)',
        dimensionsAr: 'صندوق ديلوكس 34 × 34 × 22 سم + كورة باب جامبو 30 سم',
        dimensionsEn: 'Deluxe Box 34 × 34 × 22 cm + Jumbo 30 cm Bub Plush',
        diameterCm: 30,
        priceEgp: 890,
        priceSar: 219,
        priceAed: 219,
        sku: 'BV-GIFTBOX-DLX',
        badgeAr: 'هدية فاخرة',
        badgeEn: 'Luxury Gift',
      },
    ],
    inStock: true,
    stockCount: 42,
    featured: true,
    allowsRibbonName: true,
  },
  {
    id: 'bub-night-lamp',
    sku: 'BV-BUB-LAMP-01',
    slug: 'bub-night-lamp',
    category: 'bedtime',
    nameAr: 'أباجورة باب المضيئة للنوم',
    nameEn: 'Bub Starlight Bedtime Night Lamp',
    taglineAr: 'إضاءة لمس سيليكون فائقة النعومة تبعث الهدوء وتطرد خوف الظلام',
    taglineEn: 'Squishy BPA-free silicone touch-glow lamp with 7 calming starlight colors',
    descriptionAr:
      'أباجورة «باب» المصنوعة من السيليكون الغذائي الطري الآمن تماماً على الأطفال (خالي من BPA)، تعمل باللمس اللطيف مع 7 أوضاع إضاءة مريحة للعين بدرجات السيان والبنفسجي والوردي الدافئ، وشحن سريع عبر USB-C مع مؤقّت إطفاء تلقائي للنوم.',
    descriptionEn:
      'Made from squeezably soft, food-grade BPA-free silicone that stays completely cool to the touch. Tap Bub gently to cycle through 7 calming Cyan, Lavender, and Pink glow modes—USB-C rechargeable with an auto-dim bedtime timer.',
    bubLoreAr:
      'عندما يحل الليل، يجمع «باب» بريق النجوم في غرفته الصغيرة ويحوّله إلى ضوء دافئ يحرس أحلام الأبطال الصغار حتى الصباح.',
    bubLoreEn:
      'As night falls, Bub gathers gentle starbeams and turns them into a soft, reassuring glow that watches over little dreamers until sunrise.',
    bedtimeRitualAr:
      'دع طفلك يختار «لون حلمه» بضغطة خفيفة على أباجورة باب قبل قراءة القصة، ثم فعّل مؤقّت الـ30 دقيقة ليغفو بسلام دون وهج مزعج.',
    bedtimeRitualEn:
      'Let your child tap Bub to pick their "dream color" for storytime, then set the 30-minute auto-sleep timer to drift off under a calm, eye-safe glow.',
    coverImage: '/merch/bub-night-lamp.jpg',
    galleryImages: ['/merch/bub-night-lamp.jpg', '/merch/bub-plush-ball.jpg'],
    badgeAr: '7 ألوان باللمس',
    badgeEn: '7 Touch Glow Modes',
    ageRatingAr: '0+ سيليكون غذائي آمن',
    ageRatingEn: '0+ Food-Grade Silicone',
    safetySpecsAr: [
      'سيليكون غذائي 100% خالي من BPA وPhthalates ولا يسخن أبداً أثناء التشغيل',
      'إضاءة LED ناعمة خالية من الوميض ومريحة لعيني الطفل قبل النوم',
      'بطارية مدمجة محمية داخل قاعدة مغلقة بإحكام مع كابل شحن USB-C',
      'مؤقّت إطفاء تلقائي (30 / 60 دقيقة) لتوفير الطاقة وتهدئة النوم',
    ],
    safetySpecsEn: [
      '100% food-grade BPA- & phthalate-free silicone that stays cool to the touch',
      'Flicker-free warm LED glow designed to protect sensitive bedtime eyes',
      'Child-sealed rechargeable battery base with USB-C cable included',
      'Built-in 30/60-minute auto-off bedtime timer for restful sleep',
    ],
    careAr:
      'انزع الغطاء السيليكوني وامسحه بقطعة قماش مبللة بماء دافئ وصابون لطيف، وتجنّب غمر القاعدة الإلكترونية بالماء.',
    careEn:
      'Wipe the soft silicone shell clean with a damp cloth and mild soap. Keep the electronic USB-C base dry.',
    priceEgp: 420,
    priceSar: 109,
    priceAed: 109,
    variants: [
      {
        id: 'starlight-usbc',
        labelAr: 'أباجورة باب اللمس • 7 ألوان + USB-C',
        labelEn: 'Bub Touch Lamp • 7 Modes + USB-C',
        dimensionsAr: 'قطر 14 سم × ارتفاع 13.5 سم • شحن حتى 14 ساعة إضاءة',
        dimensionsEn: '14 cm diameter × 13.5 cm tall • up to 14 hours per charge',
        diameterCm: 14,
        priceEgp: 420,
        priceSar: 109,
        priceAed: 109,
        sku: 'BV-BUB-LAMP-01',
        badgeAr: 'الأكثر هدوءاً للنوم',
        badgeEn: 'Bedtime Favorite',
      },
    ],
    inStock: true,
    stockCount: 54,
    featured: true,
  },
  {
    id: 'hero-adventure-backpack',
    sku: 'BV-BAG-HERO-01',
    slug: 'hero-adventure-backpack',
    category: 'bags',
    nameAr: 'شنطة الأبطال + ميدالية باب',
    nameEn: 'Little Hero Adventure Backpack',
    taglineAr: 'شنطة حضانة ورحلات مبطّنة بقبة فقاعة متلألئة وميدالية باب القطيفة',
    taglineEn: 'Quilted midnight-navy preschool backpack with holographic dome & Mini Bub clip',
    descriptionAr:
      'شنطة الأبطال المبطّنة باللون الكحلي الليلي مع جيب أمامي بقبة فقاعة هولوجرافيك لامعة وميدالية كورة «باب» ميني القابلة للفصل. تتسع لقصص بابل فيرس وزجاجة المياه ووجبة الحضانة بأحزمة كتف مبطّنة تحمي ظهر طفلك.',
    descriptionEn:
      'Quilted midnight-navy adventure backpack featuring a sparkling holographic bubble front dome and a detachable Mini Bub plush keychain. Fits Bubbleverse storybooks, lunchbox, and water bottle with ergonomic padded straps.',
    bubLoreAr:
      'كل مستكشف صغير يحتاج إلى حقيبة يحمل فيها قصصه وكنوزه، ومع ميدالية «باب» المعلّقة على السحّاب لن يشعر بالوحدة أبداً في أول يوم حضانة أو سفر.',
    bubLoreEn:
      'Every young explorer needs a trusty pack for stories and treasures—and with Mini Bub clipped right onto the zipper, first days at preschool feel cozy and brave.',
    bedtimeRitualAr:
      'اجعلوا تجهيز شنطة الحضانة في المساء طقساً ممتعاً يختار فيه طفلك الكتاب الذي سيأخذه معه في مغامرة الغد.',
    bedtimeRitualEn:
      'Turn evening backpack prep into a cheerful routine where your child picks tomorrow’s adventure story and clips Bub into place.',
    coverImage: '/merch/hero-backpack.jpg',
    galleryImages: [
      '/merch/hero-backpack.jpg',
      '/merch/bub-plush-ball.jpg',
      '/merch/story-bub-giftbox.jpg',
    ],
    badgeAr: 'تشمل ميدالية باب',
    badgeEn: 'Includes Mini Bub Clip',
    ageRatingAr: '3+ سنوات (حضانة ومدرسة)',
    ageRatingEn: '3+ Years (Preschool & Travel)',
    safetySpecsAr: [
      'قماش مقاوم للرذاذ وخالي من الفثالات والمواد الضارة',
      'أحزمة كتف مبطّنة وقابلة للتعديل مع حزام صدر يمنع الانزلاق',
      'سحّابات كبيرة ناعمة يسهل على أيدي الأطفال فتحها وإغلاقها',
      'شريط عاكس للضوء لزيادة أمان الطفل في المساء',
    ],
    safetySpecsEn: [
      'Water-resistant, phthalate-free quilted fabric safe for daily kid use',
      'Ergonomic padded adjustable straps with anti-slip chest buckle',
      'Chunky smooth-glide zippers designed for little hands',
      'Subtle reflective trim for added evening visibility',
    ],
    careAr:
      'تُنظف الشنطة بمسح البقع بقطعة قماش مبللة وصابون خفيف وتُترك لتجف بالهواء؛ وتُفصل ميدالية باب للغسيل اليدوي اللطيف.',
    careEn:
      'Spot-clean backpack with a damp cloth and mild soap, then air-dry. Detach the Mini Bub keychain for gentle hand-washing.',
    priceEgp: 580,
    priceSar: 149,
    priceAed: 149,
    variants: [
      {
        id: 'preschool-3-6',
        labelAr: 'مقاس الحضانة (3–6 سنوات) + ميدالية باب',
        labelEn: 'Preschool Size (Ages 3–6) + Mini Bub',
        dimensionsAr: '30 × 24 × 12 سم • وزن خفيف 340 جم',
        dimensionsEn: '30 × 24 × 12 cm • ultra-light 340g',
        diameterCm: 30,
        priceEgp: 580,
        priceSar: 149,
        priceAed: 149,
        sku: 'BV-BAG-HERO-01',
        badgeAr: 'مثالية للحضانة',
        badgeEn: 'Preschool Pick',
      },
      {
        id: 'junior-6-10',
        labelAr: 'مقاس الأبطال (6–10 سنوات) + ميدالية باب',
        labelEn: 'Junior Hero (Ages 6–10) + Mini Bub',
        dimensionsAr: '36 × 28 × 14 سم • يتسع لمجلدات A4 والقصص',
        dimensionsEn: '36 × 28 × 14 cm • fits A4 folders & storybooks',
        diameterCm: 36,
        priceEgp: 640,
        priceSar: 165,
        priceAed: 165,
        sku: 'BV-BAG-HERO-JR',
        badgeAr: 'للمدرسة والرحلات',
        badgeEn: 'School & Travel',
      },
    ],
    inStock: true,
    stockCount: 38,
    featured: true,
    allowsRibbonName: true,
  },
  {
    id: 'bub-activity-kit',
    sku: 'BV-ACT-KIT-01',
    slug: 'bub-activity-kit',
    category: 'activity',
    nameAr: 'حقيبة التلوين والستيكرز السحرية',
    nameEn: 'Bub Creative Activity & Sticker Kit',
    taglineAr: '24 ستيكر هولوجرافيك + دفتر تلوين الأبطال + 12 قلم ألوان قابل للغسل',
    taglineEn: '24 holographic Bub stickers + hero coloring pad + 12 washable markers',
    descriptionAr:
      'مجموعة أنشطة إبداعية بدون شاشات مستوحاة من عوالم بابل فيرس! تحتوي على 24 ملصقاً لامعاً مقاوماً للماء، ودفتر تلوين سميك (32 صفحة بمشاهد الفضاء والأبطال)، و12 قلماً قابلاً للغسل من الملابس واليدين بكل سهولة.',
    descriptionEn:
      'Screen-free creative fun straight from the Bubbleverse! Packs 24 shimmering holographic stickers, a thick 32-page hero coloring pad, and 12 ultra-washable child-safe markers that rinse effortlessly from hands and clothes.',
    bubLoreAr:
      'يعشق «باب» رؤية الأطفال يرسمون كواكبهم وألوانهم الخاصة—كل صفحة يلوّنها طفلك تضيف نجماً جديداً في مجرّة بابل فيرس!',
    bubLoreEn:
      'Bub loves watching kids invent their own planets and colors—every page your child brings to life adds a brand-new star to the Bubbleverse galaxy!',
    bedtimeRitualAr:
      '15 دقيقة من التلوين الهادئ بعد العشاء تساعد طفلك على تفريغ طاقته والانتقال بسلاسة إلى وقت القصة والنوم بدون شاشات.',
    bedtimeRitualEn:
      '15 quiet minutes of coloring after dinner helps little minds unwind smoothly from busy play into cozy, screen-free storytime.',
    coverImage: '/showcase/zain-sample/scene-01.jpg',
    galleryImages: [
      '/showcase/zain-sample/scene-01.jpg',
      '/showcase/zain-sample/cover.jpg',
    ],
    badgeAr: 'نشاط بدون شاشات',
    badgeEn: 'Screen-Free Fun',
    ageRatingAr: '3+ سنوات • ألوان قابلة للغسل',
    ageRatingEn: '3+ Years • Washable Inks',
    safetySpecsAr: [
      'أقلام ألوان غير سامة قابلة للغسل بالماء والصابون ومطابقة لمعيار ASTM D-4236',
      'أغطية أقلام مهوّاة ومصممة لسلامة الأطفال',
      'ورق رسم سميك 140 جم/م² بدون حواف حادة يمنع تسرب الألوان',
    ],
    safetySpecsEn: [
      'Non-toxic, ultra-washable inks conforming to ASTM D-4236 art safety standards',
      'Ventilated child-safe marker caps with chunky grip barrels',
      'Thick 140gsm smooth-edge drawing pages that resist bleed-through',
    ],
    careAr:
      'أغلق أغطية الأقلام جيداً بعد الاستخدام؛ وتُزال أي بقع ألوان من البشرة والملابس القطنية بماء دافئ وصابون عادي.',
    careEn:
      'Snap marker caps firmly after play. Any stray marks rinse cleanly from skin and cotton fabrics with warm water and soap.',
    priceEgp: 240,
    priceSar: 65,
    priceAed: 65,
    variants: [
      {
        id: 'starter-kit',
        labelAr: 'المجموعة الأساسية (24 ستيكر + دفتر + 12 لون)',
        labelEn: 'Starter Kit (24 Stickers + Pad + 12 Markers)',
        dimensionsAr: 'حافظة 23 × 18 × 4 سم • جاهزة للسفر والمطاعم',
        dimensionsEn: '23 × 18 × 4 cm carry pouch • travel & restaurant ready',
        diameterCm: 23,
        priceEgp: 240,
        priceSar: 65,
        priceAed: 65,
        sku: 'BV-ACT-KIT-01',
        badgeAr: 'الأكثر مبيعاً',
        badgeEn: 'Bestseller',
      },
      {
        id: 'mega-sibling-kit',
        labelAr: 'مجموعة الأخوة المزدوجة (48 ستيكر + دفترين + 24 لون)',
        labelEn: 'Sibling Mega Kit (48 Stickers + 2 Pads + 24 Markers)',
        dimensionsAr: 'حقيبة إبداعية 28 × 22 × 6 سم • مثالية لطفلين',
        dimensionsEn: '28 × 22 × 6 cm creative tote • perfect for 2 siblings',
        diameterCm: 28,
        priceEgp: 360,
        priceSar: 95,
        priceAed: 95,
        sku: 'BV-ACT-KIT-MEGA',
        badgeAr: 'للأخوة والهدايا',
        badgeEn: 'Great for Siblings',
      },
    ],
    inStock: true,
    stockCount: 70,
    featured: false,
  },
  {
    id: 'bub-squad-trio',
    sku: 'BV-BUB-TRIO-01',
    slug: 'bub-squad-trio',
    category: 'plush',
    nameAr: 'مجموعة عائلة باب الثلاثية',
    nameEn: 'The Bub Plush Trio Collector Pack',
    taglineAr: 'المقاسات الثلاثة معاً: ميني 12 سم + كلاسيك 20 سم + جامبو 30 سم بتوفير 22%',
    taglineEn: 'All 3 iconic sizes together—Mini 12cm + Classic 20cm + Jumbo 30cm (Save 22%!)',
    descriptionAr:
      'باقة التجميع الكاملة لعشّاق «باب» والأخوة! تضم كورة باب ميني 12 سم للشنطة، وكورة باب كلاسيك 20 سم للعب والقراءة، ووسادة باب جامبو 30 سم للسرير—تأتي داخل كيس قماشي سحري للهدايا بتوفير كبير.',
    descriptionEn:
      'The ultimate collector pack for siblings and cozy reading corners! Includes Mini 12cm for the backpack, Classic 20cm for everyday play, and Jumbo 30cm for bedtime snuggles—packaged in a keepsake drawstring starlight pouch.',
    bubLoreAr:
      'ثلاث فقاعات سحرية تشكّل «عائلة باب»: الصغير للمغامرات خارج البيت، والأوسط لحكايات المساء، والكبير لأحلى عناق قبل النوم!',
    bubLoreEn:
      'Three magical bubbles that make up the Bub Squad: Mini for out-and-about bravery, Classic for afternoon storytime, and Jumbo for the coziest bedtime hugs!',
    bedtimeRitualAr:
      'مثالية للأخوة الذين يتشاركون الغرفة أو لإنشاء «ركن قراءة بابل فيرس» مبهج يربط الطفل بحب الكتب كل يوم.',
    bedtimeRitualEn:
      'Perfect for siblings sharing storytime or building a dedicated Bubbleverse Reading Nook that makes reaching for a book the best part of every day.',
    coverImage: '/merch/bub-plush-ball.jpg',
    galleryImages: ['/merch/bub-plush-ball.jpg', '/merch/story-bub-giftbox.jpg'],
    badgeAr: 'وفّر 22%',
    badgeEn: 'Save 22%',
    ageRatingAr: '0+ آمن للرضّع والأطفال',
    ageRatingEn: '0+ Safe from Birth',
    safetySpecsAr: [
      'جميع المقاسات الثلاثة بعيون مطرّزة 100% وخالية من القطع البلاستيكية',
      'حشو سحابي فائق النعومة ومضاد للحساسية',
      'مطابق لمعايير أمان ألعاب الأطفال EN-71 وASTM F963 وSASO',
    ],
    safetySpecsEn: [
      'All 3 sizes feature 100% embroidered details with zero plastic choking parts',
      'Ultra-soft hypoallergenic cloud-fiber stuffing across every size',
      'Aligned with EN-71, ASTM F963, and SASO child toy safety standards',
    ],
    careAr:
      'تُغسل القطع الثلاث بلطف باليد بماء بارد أو في دورة غسيل رقيقة داخل كيس شبكي وتُجفف بالهواء.',
    careEn:
      'Gentle hand-wash in cool water or delicate machine cycle inside a mesh bag, then air-dry flat.',
    priceEgp: 820,
    priceSar: 215,
    priceAed: 215,
    compareAtEgp: 1050,
    compareAtSar: 273,
    compareAtAed: 273,
    variants: [
      {
        id: 'trio-collector-pack',
        labelAr: 'الباقة الثلاثية الكاملة (12 + 20 + 30 سم)',
        labelEn: 'Full Trio Pack (12cm + 20cm + 30cm)',
        dimensionsAr: 'ميني 12 سم + كلاسيك 20 سم + جامبو 30 سم',
        dimensionsEn: 'Mini 12 cm + Classic 20 cm + Jumbo 30 cm',
        diameterCm: 30,
        priceEgp: 820,
        priceSar: 215,
        priceAed: 215,
        sku: 'BV-BUB-TRIO-01',
        badgeAr: 'أفضل قيمة • وفّر 22%',
        badgeEn: 'Best Value • Save 22%',
      },
    ],
    inStock: true,
    stockCount: 25,
    featured: false,
    allowsRibbonName: true,
  },
];

export function getMerchProductById(
  id: string,
  catalog: MerchProduct[] = DEFAULT_MERCH_PRODUCTS
): MerchProduct | undefined {
  return catalog.find((item) => item.id === id || item.slug === id);
}
