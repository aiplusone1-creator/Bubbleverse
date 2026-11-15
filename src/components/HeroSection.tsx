import { motion } from 'framer-motion';
import BubbleButton from './BubbleButton';
import Header from './Header';
import HeroShowcase from './HeroShowcase';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface HeroSectionProps {
  onStartCreating: () => void;
  showMascot?: boolean;
  onToggleMascot?: () => void;
}

const HeroSection = ({ onStartCreating, showMascot, onToggleMascot }: HeroSectionProps) => {
  const { t, isRTL } = useLanguage();

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      <Header showMascot={showMascot} onToggleMascot={onToggleMascot} />
      
      {/* Hero Showcase - Floating images */}
      <HeroShowcase />
      {/* Main content */}
      <div className={`text-center max-w-4xl mx-auto pt-16 sm:pt-20 pb-12 ${isRTL ? 'rtl' : ''}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-5 sm:mb-6"
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs sm:text-sm font-medium shadow-[0_2px_12px_hsl(var(--primary)/0.15)]">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            {t('heroTagline')}
          </span>
        </motion.div>

        <motion.h1 
          className="text-4xl sm:text-6xl md:text-7xl font-bold mb-5 sm:mb-6 leading-[1.15] sm:leading-tight tracking-tight font-editorial"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {t('heroHeadlineMain')}{' '}
          <span className="text-magical italic font-normal">
            {t('heroHeadlineAccent')}
          </span>
          {t('heroHeadlineSuffix')}
        </motion.h1>

        <motion.p 
          className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed font-normal px-2"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          {t('heroDescription')}
        </motion.p>

        <motion.div 
          className={`flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-center items-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <BubbleButton size="lg" onClick={onStartCreating} className="w-full sm:w-auto">
            {t('startCreating')}
            <ArrowRight className={`w-5 h-5 inline-block ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </BubbleButton>
          <BubbleButton 
            variant="outline" 
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => {
              document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t('seeExamples')}
          </BubbleButton>
        </motion.div>

        {/* Product-Truth Value Pillars (No fake stats) */}
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto mt-12 sm:mt-16 px-2"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          {[
            { value: '100%', label: t('personalizedForChild') },
            { value: '5+', label: t('enchantingStyles') },
            { value: 'EN · AR', label: t('bilingualStories') },
            { value: 'PDF', label: t('instantPreview') },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-3 sm:p-4 text-center border-border/40 hover:border-primary/40">
              <div className="text-xl sm:text-2xl font-bold text-primary mb-1 font-editorial">{stat.value}</div>
              <div className="text-muted-foreground text-xs sm:text-sm font-medium leading-tight">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-muted-foreground/50 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
