import { motion } from 'framer-motion';
import { BookOpen, Palette, HeartHandshake } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/hooks/useLanguage';
import GlassCard from './GlassCard';

const FeatureCards = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { t, isRTL } = useLanguage();

  const features = [
    {
      icon: BookOpen,
      title: t('feature1Title'),
      description: t('feature1Desc'),
      colorStyle: {
        bg: isDark ? 'hsla(37, 91%, 55%, 0.15)' : 'hsla(37, 95%, 45%, 0.12)',
        icon: isDark ? 'hsl(37, 91%, 65%)' : 'hsl(37, 95%, 42%)',
        border: isDark ? 'hsla(37, 91%, 55%, 0.25)' : 'hsla(37, 95%, 45%, 0.2)',
      },
    },
    {
      icon: Palette,
      title: t('feature2Title'),
      description: t('feature2Desc'),
      colorStyle: {
        bg: isDark ? 'hsla(262, 48%, 81%, 0.15)' : 'hsla(262, 45%, 58%, 0.12)',
        icon: isDark ? 'hsl(262, 48%, 85%)' : 'hsl(262, 45%, 52%)',
        border: isDark ? 'hsla(262, 48%, 81%, 0.25)' : 'hsla(262, 45%, 58%, 0.2)',
      },
    },
    {
      icon: HeartHandshake,
      title: t('feature3Title'),
      description: t('feature3Desc'),
      colorStyle: {
        bg: isDark ? 'hsla(331, 46%, 82%, 0.15)' : 'hsla(331, 45%, 60%, 0.12)',
        icon: isDark ? 'hsl(331, 46%, 85%)' : 'hsl(331, 45%, 55%)',
        border: isDark ? 'hsla(331, 46%, 82%, 0.25)' : 'hsla(331, 45%, 60%, 0.2)',
      },
    },
  ];

  return (
    <section className={`py-16 sm:py-24 px-4 ${isRTL ? 'rtl' : ''}`}>
      <motion.div 
        className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 font-editorial tracking-tight">
          <span className="text-editorial-gold">{t('featuresTitle')}</span>
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
          {t('featuresSubtitle')}
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
        {features.map((feature, index) => (
          <GlassCard key={feature.title} delay={index * 0.15} className="flex flex-col justify-between">
            <div>
              <div 
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-5 border transition-transform duration-200"
                style={{ 
                  backgroundColor: feature.colorStyle.bg,
                  borderColor: feature.colorStyle.border,
                }}
              >
                <feature.icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: feature.colorStyle.icon }} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2.5 font-editorial tracking-tight">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-normal">
                {feature.description}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
};

export default FeatureCards;
