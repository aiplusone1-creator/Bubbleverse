import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Moon, Sun, LogIn, User, Shield, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import BubbleverseLogo from './BubbleverseLogo';
import { Button } from './ui/button';

interface HeaderProps {
  showMascot?: boolean;
  onToggleMascot?: () => void;
}

const Header = ({ showMascot, onToggleMascot }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, isAdmin } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.header
      className="absolute top-0 left-0 right-0 px-2.5 py-3 sm:px-4 md:p-6 z-50"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.2 }}
    >
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        <div className="shrink min-w-0 [&_.w-12]:w-8 [&_.w-12]:h-8 sm:[&_.w-12]:w-12 sm:[&_.w-12]:h-12 [&_h1]:text-base sm:[&_h1]:text-2xl [&_h1+div]:hidden sm:[&_h1+div]:flex">
          <BubbleverseLogo />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Bub Toggle Button */}
          {onToggleMascot && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMascot}
              className={`glass-card h-8 w-8 sm:h-10 sm:w-10 p-0 border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all touch-manipulation relative before:absolute before:-inset-1 before:content-[''] ${
                showMascot ? 'text-primary' : 'text-muted-foreground'
              }`}
              title={showMascot ? t('hideBub') : t('showBub')}
              aria-label={showMascot ? t('hideBub') : t('showBub')}
            >
              <Sparkles className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform ${showMascot ? 'scale-110' : 'scale-90 opacity-50'}`} />
            </Button>
          )}

          {/* Instant Language Switcher */}
          <Button
            variant="ghost"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="glass-card h-8 px-2 sm:h-10 sm:px-3 border-primary/20 hover:border-primary/40 hover:bg-primary/10 text-xs sm:text-sm font-medium touch-manipulation relative before:absolute before:-inset-1 before:content-['']"
            aria-label={language === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
          >
            {language === 'en' ? (
              <>
                <span className="hidden min-[380px]:inline">العربية</span>
                <span className="min-[380px]:hidden">عربي</span>
              </>
            ) : (
              <>
                <span className="hidden min-[380px]:inline">English</span>
                <span className="min-[380px]:hidden">EN</span>
              </>
            )}
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="glass-card h-8 w-8 sm:h-10 sm:w-10 p-0 border-primary/20 hover:border-primary/40 hover:bg-primary/10 touch-manipulation relative before:absolute before:-inset-1 before:content-['']"
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
          >
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
            <Moon className="absolute h-4 w-4 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
          </Button>

          {/* Admin Panel Button - Only for admins */}
          {isAdmin && (
            <Link to="/admin">
              <Button
                variant="ghost"
                size="icon"
                className="glass-card h-8 w-8 sm:h-10 sm:w-10 p-0 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10 touch-manipulation relative before:absolute before:-inset-1 before:content-['']"
                title="Admin Panel"
                aria-label="Admin Panel"
              >
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              </Button>
            </Link>
          )}

          {/* Sign In / Profile Button */}
          {user ? (
            <Link to="/profile">
              <Button
                className="bubble-button h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm md:text-base flex items-center gap-1.5 sm:gap-2 touch-manipulation relative before:absolute before:-inset-1 before:content-['']"
                aria-label={t('profile')}
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('profile')}</span>
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button
                className="bubble-button h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm md:text-base flex items-center gap-1.5 sm:gap-2 touch-manipulation relative before:absolute before:-inset-1 before:content-['']"
                aria-label={t('signIn')}
              >
                <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('signIn')}</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
