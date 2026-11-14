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
      <div className={`text-center max-w-4xl mx-auto ${isRTL ? 'rtl' : ''}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            {t('aiPowered')}
          </span>
        </motion.div>

        <motion.h1 
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t('createMagical')}{' '}
          <span className="text-magical">{t('magicalStories')}</span>
          <br />
          {t('starringChild')}
        </motion.h1>

        <motion.p 
          className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {t('heroDescription')}
        </motion.p>

        <motion.div 
          className={`flex flex-col sm:flex-row gap-4 justify-center items-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <BubbleButton size="lg" onClick={onStartCreating}>
            {t('startCreating')}
            <ArrowRight className={`w-5 h-5 inline-block ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </BubbleButton>
          <BubbleButton 
            variant="outline" 
            size="lg"
            onClick={() => {
              document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t('seeExamples')}
          </BubbleButton>
        </motion.div>

        {/* Features / Capabilities */}
        <motion.div 
          className="flex flex-wrap justify-center gap-8 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {[
            { value: '100%', label: t('personalizedForChild') },
            { value: '5+', label: t('artStyles') },
            { value: 'EN · AR', label: t('bilingualStories') },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-magical">{stat.value}</div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
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
