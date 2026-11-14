import React, { useState, useEffect } from 'react';

import { LanguageContext, type Language } from './languageState';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'signIn': 'Sign In',
    'signUp': 'Sign Up',
    
    // Hero
    'aiPowered': 'AI-Powered Story Creation',
    'createMagical': 'Create',
    'magicalStories': 'Magical Stories',
    'starringChild': 'Starring Your Child',
    'heroDescription': 'Transform your little one into the hero of their own personalized 3D storybook or comic book adventure',
    'startCreating': 'Start Creating',
    'seeExamples': 'See Examples',
    'storiesCreated': 'Stories Created',
    'artStyles': 'Art Styles',
    'printQuality': 'Print Quality',
    
    // Auth
    'welcomeBack': 'Welcome Back',
    'signInContinue': 'Sign in to continue your magical journey',
    'createAccount': 'Create Account',
    'joinBubbleverse': 'Join Bubbleverse and start creating magical stories',
    'email': 'Email',
    'password': 'Password',
    'confirmPassword': 'Confirm Password',
    'noAccount': "Don't have an account?",
    'haveAccount': 'Already have an account?',
    'backHome': 'Back to Home',
    'continueWithGoogle': 'Continue with Google',
    'orContinueWith': 'or continue with email',
    
    // Profile
    'profile': 'Profile',
    'settings': 'Settings',
    'myStories': 'My Stories',
    'editProfile': 'Edit Profile',
    'displayName': 'Display Name',
    'saveChanges': 'Save Changes',
    'signOut': 'Sign Out',
    'theme': 'Theme',
    'language': 'Language',
    'darkMode': 'Dark Mode',
    'lightMode': 'Light Mode',
    'accountSettings': 'Account Settings',
    'preferences': 'Preferences',
    'noStoriesYet': 'No stories created yet',
    'startFirstStory': 'Start creating your first magical story!',
    
    // Footer
    'footerText': '© 2026 Bubbleverse. Creating magical stories for children everywhere.',
    'interactiveMode': 'Interactive Mode',
    'showBub': 'Show Bub',
    
    // Currency
    'currency': 'Currency',
    'currencyPreference': 'Currency Preference',

    // Story Wizard & Stepper
    'step': 'Step',
    'of': 'of',
    'step1Title': 'Story Setup',
    'step1Desc': 'Choose length, format & style',
    'step2Title': 'Characters',
    'step2Desc': 'Add your heroes',
    'step3Title': 'Story Theme',
    'step3Desc': 'Personalize the adventure',
    'step4Title': 'Review',
    'step4Desc': 'Ready to create magic!',
    'nextStep': 'Next Step',
    'previous': 'Previous',
    'startOver': 'Start Over',
    'hideBub': 'Hide Bub',
    'generateStory': 'Generate Story',
    'writingStory': 'Writing your story...',
    'savingStory': 'Saving your story...',
    'preparingStory': 'Preparing your story...',
    'storyCreatedTitle': 'Story Created! ✨',
    'oopsTitle': 'Oops! Something went wrong',
    'stoppedWaitingTitle': 'Stopped waiting',
    'stoppedWaitingDesc': 'A request already sent to the provider may still finish. Taking you to your profile.',
    'plotCreation': 'Plot Creation',
    'aiMagic': 'AI Magic',
    'aiMagicDesc': 'Let AI create a surprise plot',
    'customPlot': 'Custom Plot',
    'customPlotDesc': 'Write your own story',
    'readyCreateMagic': 'Ready to Create Magic!',
    'readyCreateMagicDesc': 'Your personalized story is about to come to life. Click below to start the AI generation process.',
    'storySummary': 'Story Summary',
    'summaryLanguage': 'Language',
    'summaryLength': 'Length',
    'summaryFormat': 'Format',
    'summaryStyle': 'Style',
    'summaryCharacters': 'Characters',
    'summaryInterests': 'Interests',
    'noneAdded': 'None added',
    'noneSelected': 'None selected',
    'notSelected': 'Not selected',

    // Story Wizard Validation
    'validationTitle': 'Please complete required fields',
    'validationLanguage': 'Please select a language for your story',
    'validationArtStyle': 'Please describe your custom art style',
    'validationHero': 'Please add at least one Hero character (the main child of the story)',
    'validationCharacterName': 'Please give a name to all characters',
    'validationInterest': 'Please select at least one interest',
    'validationPlot': 'Please write your custom plot',

    // Characters & Upload
    'charactersTitle': 'Characters',
    'charactersDesc': 'Upload photos of characters to include in your story',
    'dropPhotosOrClick': 'Drop photos here or click to upload',
    'checkingPhoto': 'Checking your photo…',
    'photoSpecs': 'PNG or JPG · Up to 10 MB · Up to 24 megapixels',
    'photoTooLarge': 'Choose a photo smaller than 10 MB.',
    'photoInvalidType': 'Choose a valid PNG or JPG photo.',
    'photoTooManyPixels': 'Choose a photo with at most 24 megapixels.',
    'photoCannotOpen': 'This photo could not be opened. Please choose another.',
    'photoCannotRead': 'This photo could not be read.',
    'photoGenericError': 'Unable to open this photo.',
    'roleHero': 'Hero',
    'roleParent': 'Parent',
    'rolePet': 'Pet',
    'roleFriend': 'Friend',
    'characterNamePlaceholder': "Character's name...",
    'removeCharacter': 'Remove character',
  },
  ar: {
    // Header
    'signIn': 'تسجيل الدخول',
    'signUp': 'إنشاء حساب',
    
    // Hero
    'aiPowered': 'إنشاء قصص بالذكاء الاصطناعي',
    'createMagical': 'أنشئ',
    'magicalStories': 'قصص سحرية',
    'starringChild': 'بطلها طفلك',
    'heroDescription': 'حوّل طفلك الصغير إلى بطل قصته الشخصية ثلاثية الأبعاد أو مغامرة كتاب مصور',
    'startCreating': 'ابدأ الإنشاء',
    'seeExamples': 'شاهد الأمثلة',
    'storiesCreated': 'قصة تم إنشاؤها',
    'artStyles': 'أساليب فنية',
    'printQuality': 'جودة الطباعة',
    
    // Auth
    'welcomeBack': 'مرحباً بعودتك',
    'signInContinue': 'سجّل دخولك لمتابعة رحلتك السحرية',
    'createAccount': 'إنشاء حساب',
    'joinBubbleverse': 'انضم إلى Bubbleverse وابدأ بإنشاء قصص سحرية',
    'email': 'البريد الإلكتروني',
    'password': 'كلمة المرور',
    'confirmPassword': 'تأكيد كلمة المرور',
    'noAccount': 'ليس لديك حساب؟',
    'haveAccount': 'لديك حساب بالفعل؟',
    'backHome': 'العودة للرئيسية',
    'continueWithGoogle': 'المتابعة مع جوجل',
    'orContinueWith': 'أو المتابعة بالبريد الإلكتروني',
    
    // Profile
    'profile': 'الملف الشخصي',
    'settings': 'الإعدادات',
    'myStories': 'قصصي',
    'editProfile': 'تعديل الملف الشخصي',
    'displayName': 'الاسم المعروض',
    'saveChanges': 'حفظ التغييرات',
    'signOut': 'تسجيل الخروج',
    'theme': 'المظهر',
    'language': 'اللغة',
    'darkMode': 'الوضع الداكن',
    'lightMode': 'الوضع الفاتح',
    'accountSettings': 'إعدادات الحساب',
    'preferences': 'التفضيلات',
    'noStoriesYet': 'لم يتم إنشاء قصص بعد',
    'startFirstStory': 'ابدأ بإنشاء قصتك السحرية الأولى!',
    
    // Footer
    'footerText': '© 2026 Bubbleverse. نصنع قصصاً سحرية للأطفال في كل مكان.',
    'interactiveMode': 'الوضع التفاعلي',
    'showBub': 'إظهار باب',
    
    // Currency
    'currency': 'العملة',
    'currencyPreference': 'تفضيل العملة',

    // Story Wizard & Stepper
    'step': 'الخطوة',
    'of': 'من',
    'step1Title': 'إعداد القصة',
    'step1Desc': 'اختر الطول والتنسيق والأسلوب',
    'step2Title': 'الشخصيات',
    'step2Desc': 'أضف أبطال قصتك',
    'step3Title': 'ثيم القصة',
    'step3Desc': 'خصص المغامرة',
    'step4Title': 'المراجعة',
    'step4Desc': 'جاهز لصنع السحر!',
    'nextStep': 'الخطوة التالية',
    'previous': 'السابق',
    'startOver': 'البدء من جديد',
    'hideBub': 'إخفاء باب',
    'generateStory': 'إنشاء القصة',
    'writingStory': 'جاري كتابة قصتك...',
    'savingStory': 'جاري حفظ قصتك...',
    'preparingStory': 'جاري تجهيز قصتك...',
    'storyCreatedTitle': 'تم إنشاء القصة! ✨',
    'oopsTitle': 'عذراً! حدث خطأ ما',
    'stoppedWaitingTitle': 'تم إيقاف الانتظار',
    'stoppedWaitingDesc': 'قد يكتمل الطلب المرسل للمزود في الخلفية. جاري نقلك إلى ملفك الشخصي.',
    'plotCreation': 'صناعة القصة',
    'aiMagic': 'سحر الذكاء الاصطناعي',
    'aiMagicDesc': 'دع الذكاء الاصطناعي يبتكر حبكة مفاجئة',
    'customPlot': 'حبكة مخصصة',
    'customPlotDesc': 'اكتب أحداث قصتك بنفسك',
    'readyCreateMagic': 'جاهز لصنع السحر!',
    'readyCreateMagicDesc': 'قصتك المخصصة على وشك أن تدب فيها الحياة. اضغط أدناه لبدء عملية التوليد بالذكاء الاصطناعي.',
    'storySummary': 'ملخص القصة',
    'summaryLanguage': 'اللغة',
    'summaryLength': 'الطول',
    'summaryFormat': 'التنسيق',
    'summaryStyle': 'الأسلوب الفني',
    'summaryCharacters': 'الشخصيات',
    'summaryInterests': 'الاهتمامات',
    'noneAdded': 'لم تتم إضافة شخصيات',
    'noneSelected': 'لم يتم تحديد اهتمامات',
    'notSelected': 'لم يتم التحديد',

    // Story Wizard Validation
    'validationTitle': 'يرجى إكمال الحقول المطلوبة',
    'validationLanguage': 'يرجى اختيار لغة لقصتك',
    'validationArtStyle': 'يرجى وصف الأسلوب الفني المخصص',
    'validationHero': 'يرجى إضافة شخصية رئيسية واحدة على الأقل (الطفل بطل القصة)',
    'validationCharacterName': 'يرجى إعطاء اسم لجميع الشخصيات',
    'validationInterest': 'يرجى اختيار اهتمام واحد على الأقل',
    'validationPlot': 'يرجى كتابة فكرة قصتك المخصصة',

    // Characters & Upload
    'charactersTitle': 'الشخصيات',
    'charactersDesc': 'ارفع صور الشخصيات التي تريد تضمينها في قصتك',
    'dropPhotosOrClick': 'أفلت الصور هنا أو اضغط للرفع',
    'checkingPhoto': 'جاري فحص صورتك…',
    'photoSpecs': 'PNG أو JPG · حتى 10 ميغابايت · حتى 24 ميغابكسل',
    'photoTooLarge': 'اختر صورة أصغر من 10 ميغابايت.',
    'photoInvalidType': 'اختر صورة صالحة بصيغة PNG أو JPG.',
    'photoTooManyPixels': 'اختر صورة بدقة لا تتجاوز 24 ميغابكسل.',
    'photoCannotOpen': 'تعذر فتح هذه الصورة. يرجى اختيار صورة أخرى.',
    'photoCannotRead': 'تعذر قراءة هذه الصورة.',
    'photoGenericError': 'تعذر فتح هذه الصورة.',
    'roleHero': 'البطل',
    'roleParent': 'الأب/الأم',
    'rolePet': 'حيوان أليف',
    'roleFriend': 'صديق',
    'characterNamePlaceholder': 'اسم الشخصية...',
    'removeCharacter': 'حذف الشخصية',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return saved === 'ar' ? 'ar' : 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};
