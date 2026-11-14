import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import ImmersiveBackground from '../components/ImmersiveBackground';
import InteractiveBub from '../components/InteractiveBub';
import HeroSection from '../components/HeroSection';
import FeatureCards from '../components/FeatureCards';
import ExamplesSection from '../components/ExamplesSection';
import Footer from '../components/Footer';
import StoryWizard from '../components/StoryWizard';
import { AnimatePresence, motion } from 'framer-motion';
import { useMascotVisibility } from '@/hooks/useMascotVisibility';

const Index = () => {
  const [params, setParams] = useSearchParams();
  const [showWizard, setShowWizard] = useState(params.get('inquiry') === 'resume');
  const closeWizard = () => {
    setShowWizard(false);
    if (params.has('inquiry')) {
      params.delete('inquiry');
      setParams(params, { replace: true });
    }
  };
  const { showMascot, setShowMascot } = useMascotVisibility();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <ImmersiveBackground />
      {showMascot && <InteractiveBub />}

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
              <HeroSection
                onStartCreating={() => setShowWizard(true)}
                showMascot={showMascot}
                onToggleMascot={() => setShowMascot(!showMascot)}
              />
              <FeatureCards />
              <ExamplesSection />

              {/* Footer */}
              <Footer showMascot={showMascot} onToggleMascot={setShowMascot} />
            </motion.div>
          ) : (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.5 }}
            >
              <StoryWizard onBack={closeWizard} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
