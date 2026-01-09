import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

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
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
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

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
