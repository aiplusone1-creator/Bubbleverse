import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Building2, Gift, Globe, Home, Menu, Package, ShoppingBag, Store, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import BubbleverseLogo from './BubbleverseLogo';
import { Button } from './ui/button';

export interface HeaderProps {
  /** Retained as optional for caller compatibility; Bub toggle now lives exclusively in Footer. */
  showMascot?: boolean;
  onToggleMascot?: () => void;
}

const Header: React.FC<HeaderProps> = () => {
  const { language, setLanguage, isRTL } = useLanguage();
  const { openCart, totalItems } = useCart();
  const location = useLocation();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(() =>
    typeof window !== 'undefined' ? window.scrollY > 24 : false
  );

  // Smoothly wrap header into a unified floating glass pill when scrolling
  useEffect(() => {
    const handleScroll = () => {
      const next = window.scrollY > 24;
      setIsScrolled((prev) => (prev === next ? prev : next));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    {
      to: '/',
      label: language === 'ar' ? 'الرئيسية' : 'Home',
      icon: Home,
      isActive: location.pathname === '/',
    },
    {
      to: '/stories',
      label: language === 'ar' ? 'مكتبة القصص' : 'Story Catalog',
      icon: BookOpen,
      isActive:
        location.pathname === '/stories' ||
        location.pathname.startsWith('/stories/') ||
        location.pathname.startsWith('/products/'),
    },
    {
      to: '/merch',
      label: language === 'ar' ? 'متجر بابل' : 'Merch',
      icon: Store,
      isActive:
        location.pathname === '/merch' ||
        location.pathname.startsWith('/merch/'),
    },
    {
      to: '/club',
      label: language === 'ar' ? 'نادي الهدايا' : 'Gift Club',
      icon: Gift,
      isActive: location.pathname === '/club',
    },
    {
      to: '/schools',
      label: language === 'ar' ? 'للمدارس والشركات' : 'Schools & B2B',
      icon: Building2,
      isActive: location.pathname === '/schools',
    },
    {
      to: '/track',
      label: language === 'ar' ? 'تتبع طلبك' : 'Track Order',
      icon: Package,
      isActive: location.pathname === '/track',
    },
  ];

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <motion.header
      className={`fixed top-0 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none ${
        shouldReduceMotion ? '' : 'transition-[padding] duration-300 ease-out'
      } ${isScrolled ? 'py-2.5 md:py-3' : 'py-3 md:py-5'}`}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: [0.23, 1, 0.32, 1] }}
    >
      <div
        className={`bv-container-wide flex items-center justify-between gap-2 xl:gap-4 rounded-full border ${
          shouldReduceMotion ? '' : 'transition-[background-color,border-color,box-shadow,padding,backdrop-filter] duration-300 ease-out'
        } ${
          isScrolled
            ? 'pointer-events-auto bg-background/65 backdrop-blur-2xl border-white/15 shadow-[0_12px_36px_rgba(4,9,24,0.52),inset_0_1px_0_rgba(255,255,255,0.14)] px-3.5 sm:px-5 py-2'
            : 'bg-transparent border-transparent shadow-none px-0 py-0'
        }`}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          aria-label={language === 'ar' ? 'بابل فيرس — الرئيسية' : 'Bubbleverse — Home'}
          className="pointer-events-auto shrink-0 min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 max-[359px]:[&_.leading-none]:hidden [&_h1]:text-base sm:[&_h1]:text-xl min-[900px]:[&_h1]:text-lg xl:[&_h1]:text-2xl [&_h1+div]:hidden sm:[&_h1+div]:flex min-[900px]:[&_h1+div]:hidden xl:[&_h1+div]:flex"
        >
          <BubbleverseLogo />
        </Link>

        {/* Centered Desktop Navigation Pill */}
        <nav
          aria-label={language === 'ar' ? 'التنقل الرئيسي' : 'Primary navigation'}
          className={`pointer-events-auto hidden min-[900px]:flex items-center gap-0.5 xl:gap-1 rounded-full border ${
            shouldReduceMotion ? '' : 'transition-all duration-300 ease-out'
          } ${
            isScrolled
              ? 'px-1 py-0.5 bg-transparent border-transparent shadow-none'
              : 'px-1.5 xl:px-2 py-1 xl:py-1.5 bg-background/55 backdrop-blur-xl border-white/10 shadow-[0_8px_30px_rgba(4,9,24,0.35)]'
          }`}
        >
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={item.isActive ? 'page' : undefined}
              className={`whitespace-nowrap px-2 lg:px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80 ${
                item.isActive
                  ? 'bg-primary/15 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                  : 'text-foreground/80 hover:text-foreground hover:bg-white/5'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Controls: Language Switcher + Cart Button (+ Mobile Menu Toggle) */}
        <div className="pointer-events-auto flex items-center gap-2 shrink-0">
          {/* Language Switcher */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className={`h-10 px-2.5 sm:px-3 xl:px-4 rounded-full border hover:border-primary/40 hover:bg-primary/10 text-foreground/90 hover:text-foreground text-xs xl:text-sm font-medium inline-flex items-center gap-1.5 touch-manipulation transition-colors duration-200 ${
              isScrolled
                ? 'bg-white/5 border-white/12'
                : 'bg-background/55 backdrop-blur-xl border-white/12'
            }`}
            aria-label={language === 'en' ? 'Switch language to Arabic' : 'تغيير اللغة إلى الإنجليزية'}
          >
            <Globe className="w-4 h-4 text-primary shrink-0" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </Button>

          {/* Shopping Cart Button */}
          <div className="relative inline-flex">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={openCart}
              className={`h-10 w-10 rounded-full border hover:border-primary/40 hover:bg-primary/10 text-primary touch-manipulation transition-colors duration-200 ${
                isScrolled
                  ? 'bg-white/5 border-white/12'
                  : 'bg-background/55 backdrop-blur-xl border-white/12'
              }`}
              title={language === 'ar' ? 'سلة القصص' : 'Shopping Cart'}
              aria-label={
                language === 'ar'
                  ? `سلة القصص (${totalItems})`
                  : `Shopping Cart (${totalItems})`
              }
            >
              <ShoppingBag className="w-4 h-4 text-primary" />
            </Button>
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key="header-cart-badge"
                  aria-hidden="true"
                  initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 420, damping: 24 }
                  }
                  className="pointer-events-none absolute -top-1.5 -end-1.5 z-20 min-w-5 h-5 px-1 rounded-full bg-gradient-to-r from-[#F472B6] to-purple-600 text-[11px] leading-none font-bold font-numeric text-white flex items-center justify-center shadow-[0_4px_14px_rgba(244,114,182,0.55)] ring-2 ring-background/90 border border-white/30"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Compact Mobile Menu Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`min-[900px]:hidden h-10 w-10 rounded-full border hover:border-primary/40 hover:bg-primary/10 text-foreground/90 touch-manipulation transition-colors duration-200 ${
              isScrolled
                ? 'bg-white/5 border-white/12'
                : 'bg-background/55 backdrop-blur-xl border-white/12'
            }`}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={
              mobileMenuOpen
                ? language === 'ar'
                  ? 'إغلاق القائمة'
                  : 'Close menu'
                : language === 'ar'
                  ? 'فتح القائمة'
                  : 'Open menu'
            }
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Accessible Mobile Navigation Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            id="mobile-nav-panel"
            aria-label={language === 'ar' ? 'قائمة الجوال' : 'Mobile navigation'}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: [0.23, 1, 0.32, 1] }}
            className={`pointer-events-auto min-[900px]:hidden mt-3 bv-container-wide glass-card rounded-2xl p-2 ${isRTL ? 'rtl' : ''}`}
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={item.isActive ? 'page' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                      item.isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-foreground/85 hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
