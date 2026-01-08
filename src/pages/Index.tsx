import { useState } from 'react';
import ImmersiveBackground from '../components/ImmersiveBackground';
import InteractiveBub from '../components/InteractiveBub';
import HeroSection from '../components/HeroSection';
import FeatureCards from '../components/FeatureCards';
import ExamplesSection from '../components/ExamplesSection';
import Footer from '../components/Footer';
import StoryWizard from '../components/StoryWizard';
import { AnimatePresence, motion } from 'framer-motion';

const Index = () => {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <ImmersiveBackground />
      <InteractiveBub />
      
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {!showWizard ? (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <HeroSection onStartCreating={() => setShowWizard(true)} />
              <FeatureCards />
              <ExamplesSection />
              
              {/* Footer */}
              <Footer />
            </motion.div>
          ) : (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.5 }}
            >
              <StoryWizard onBack={() => setShowWizard(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
