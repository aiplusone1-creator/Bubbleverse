import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ImmersiveBackground from '../components/ImmersiveBackground';
import InteractiveBub from '../components/InteractiveBub';
import HeroSection from '../components/HeroSection';
import CharacterControlShowcase from '../components/showcase/CharacterControlShowcase';
import StoriesByAgeGender from '../components/showcase/StoriesByAgeGender';
import FeatureCards from '../components/FeatureCards';
import BubBrandShowcaseSection from '../components/merch/BubBrandShowcaseSection';
import CustomerReviewsSection from '../components/showcase/CustomerReviewsSection';
import PrivacyAndFaqSection from '../components/showcase/PrivacyAndFaqSection';
import GrowthRetentionSection from '../components/growth/GrowthRetentionSection';
import Footer from '../components/Footer';
import StoryWizard from '../components/StoryWizard';
import { useMascotVisibility } from '@/hooks/useMascotVisibility';
import { useLanguage } from '@/hooks/useLanguage';

const Index = () => {
  const [params, setParams] = useSearchParams();
  const [showWizard, setShowWizard] = useState(params.get('inquiry') === 'resume');
  const { showMascot, setShowMascot } = useMascotVisibility();
  const { isRTL } = useLanguage();
  const shouldReduceMotion = Boolean(useReducedMotion());

  const openWizard = () => {
    setShowWizard(true);
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' });
  };

  const closeWizard = () => {
    setShowWizard(false);
    if (params.has('inquiry')) {
      params.delete('inquiry');
      setParams(params, { replace: true });
    }
  };

  const slideOffset = shouldReduceMotion ? 0 : isRTL ? -48 : 48;
  const viewTransition = shouldReduceMotion
    ? { duration: 0.01 }
    : { duration: 0.28, ease: [0.23, 1, 0.32, 1] as const };

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
              exit={{ opacity: 0, x: -slideOffset }}
              transition={viewTransition}
            >
              {/* 1. Hero Funnel */}
              <HeroSection onStartCreating={openWizard} />

              {/* 2. Before / After Real Photo -> Storybook Hero */}
              <CharacterControlShowcase />

              {/* 3. Featured Stories by Age / Gender + Career Adventures */}
              <StoriesByAgeGender />

              {/* 4. How It Works (3 Steps) + 100% Draft Review Guarantee */}
              <FeatureCards />

              {/* 5. Bubbleverse Kids Brand & Official Bub Plush Spotlight */}
              <BubBrandShowcaseSection />

              {/* 6. Parent Testimonials + Closing Conversion CTA */}
              <CustomerReviewsSection onStartCreating={openWizard} />

              {/* 7. Zero-Retention Child Photo Privacy Shield & FAQ */}
              <PrivacyAndFaqSection />

              {/* 8. Birthday Club, Viral Referral & Free Hero Certificate */}
              <GrowthRetentionSection />

              <Footer showMascot={showMascot} onToggleMascot={setShowMascot} />
            </motion.div>
          ) : (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, x: slideOffset }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideOffset }}
              transition={viewTransition}
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
