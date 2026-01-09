import { motion } from 'framer-motion';
import { BookOpen, Palette, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import GlassCard from './GlassCard';

const features = [
  {
    icon: BookOpen,
    title: 'Personalized Stories',
    description: 'Create unique tales featuring your child as the hero of their own adventure.',
    colorClass: 'cyan',
  },
  {
    icon: Palette,
    title: 'Stunning 3D Art',
    description: 'Choose from Disney, Pixar, Anime, and more art styles for beautiful illustrations.',
    colorClass: 'pink',
  },
  {
    icon: Sparkles,
    title: 'AI Magic',
    description: 'Advanced AI ensures character consistency across every page of your story.',
    colorClass: 'violet',
  },
];

const FeatureCards = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const getColorStyles = (colorClass: string) => {
    const colors = {
      cyan: {
        bg: isDark ? 'hsla(190, 100%, 50%, 0.2)' : 'hsla(190, 100%, 40%, 0.25)',
        icon: isDark ? 'hsl(190, 100%, 70%)' : 'hsl(190, 100%, 35%)',
      },
      pink: {
        bg: isDark ? 'hsla(330, 100%, 70%, 0.2)' : 'hsla(330, 100%, 50%, 0.25)',
        icon: isDark ? 'hsl(330, 100%, 75%)' : 'hsl(330, 100%, 45%)',
      },
      violet: {
        bg: isDark ? 'hsla(280, 80%, 70%, 0.2)' : 'hsla(280, 80%, 50%, 0.25)',
        icon: isDark ? 'hsl(280, 80%, 75%)' : 'hsl(280, 80%, 45%)',
      },
    };
    return colors[colorClass as keyof typeof colors] || colors.cyan;
  };

  return (
    <section className="py-20 px-4">
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="text-magical">Magical</span> Features
        </h2>
        <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-muted-foreground' : 'text-slate-600'}`}>
          Everything you need to create unforgettable stories for your little ones
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((feature, index) => {
          const colorStyles = getColorStyles(feature.colorClass);
          return (
            <GlassCard key={feature.title} delay={index * 0.15}>
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: colorStyles.bg }}
              >
                <feature.icon className="w-7 h-7" style={{ color: colorStyles.icon }} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-foreground' : 'text-slate-800'}`}>
                {feature.title}
              </h3>
              <p className={isDark ? 'text-muted-foreground' : 'text-slate-600'}>
                {feature.description}
              </p>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
};

export default FeatureCards;
