import { motion } from 'framer-motion';
import { BookOpen, Palette, Sparkles } from 'lucide-react';
import GlassCard from './GlassCard';

const features = [
  {
    icon: BookOpen,
    title: 'Personalized Stories',
    description: 'Create unique tales featuring your child as the hero of their own adventure.',
    color: 'bubble-cyan',
  },
  {
    icon: Palette,
    title: 'Stunning 3D Art',
    description: 'Choose from Disney, Pixar, Anime, and more art styles for beautiful illustrations.',
    color: 'bubble-pink',
  },
  {
    icon: Sparkles,
    title: 'AI Magic',
    description: 'Advanced AI ensures character consistency across every page of your story.',
    color: 'bubble-lavender',
  },
];

const FeatureCards = () => {
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
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Everything you need to create unforgettable stories for your little ones
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((feature, index) => (
          <GlassCard key={feature.title} delay={index * 0.15}>
            <div className={`w-14 h-14 rounded-2xl bg-${feature.color}/20 flex items-center justify-center mb-4`}>
              <feature.icon className={`w-7 h-7 text-${feature.color}`} />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
};

export default FeatureCards;
