import { motion } from 'framer-motion';
import BubbleverseLogo from './BubbleverseLogo';
import BubbleButton from './BubbleButton';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onStartCreating: () => void;
}

const HeroSection = ({ onStartCreating }: HeroSectionProps) => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      {/* Header */}
      <motion.header
        className="absolute top-0 left-0 right-0 p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <BubbleverseLogo />
      </motion.header>

      {/* Main content */}
      <div className="text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Story Creation
          </span>
        </motion.div>

        <motion.h1 
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Create{' '}
          <span className="text-magical">Magical Stories</span>
          <br />
          Starring Your Child
        </motion.h1>

        <motion.p 
          className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Transform your little one into the hero of their own personalized 
          3D storybook or comic book adventure
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <BubbleButton size="lg" onClick={onStartCreating}>
            Start Creating
            <ArrowRight className="w-5 h-5 ml-2 inline-block" />
          </BubbleButton>
          <BubbleButton variant="outline" size="lg">
            See Examples
          </BubbleButton>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="flex flex-wrap justify-center gap-8 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {[
            { value: '10K+', label: 'Stories Created' },
            { value: '5', label: 'Art Styles' },
            { value: '300 DPI', label: 'Print Quality' },
          ].map((stat, index) => (
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
