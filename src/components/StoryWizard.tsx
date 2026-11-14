import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import GlassCard from './GlassCard';
import BubbleButton from './BubbleButton';
import StoryLengthSelector from './StoryLengthSelector';
import FormatSelector from './FormatSelector';
import ArtStyleSelector from './ArtStyleSelector';
import CharacterUpload from './CharacterUpload';
import InterestsInput from './InterestsInput';
import GeneratingScreen from './GeneratingScreen';
import StoryPreview from './StoryPreview';
import LanguageSelector from './LanguageSelector';
import CustomPlotInput from './CustomPlotInput';
import { generateStory, saveStoryToDatabase } from '@/features/stories/storyService';

import type { Character, StoryConfig, GeneratedStory } from '@/features/stories/types';

interface StoryWizardProps {
  onBack: () => void;
}

const steps = [
  { id: 1, titleKey: 'step1Title', descKey: 'step1Desc' },
  { id: 2, titleKey: 'step2Title', descKey: 'step2Desc' },
  { id: 3, titleKey: 'step3Title', descKey: 'step3Desc' },
  { id: 4, titleKey: 'step4Title', descKey: 'step4Desc' },
];

const StoryWizard = ({ onBack }: StoryWizardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const generation = useRef<AbortController | null>(null);
  useEffect(() => () => generation.current?.abort(), []);
  const [generatingStep, setGeneratingStep] = useState('Preparing your story...');
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null);
  
  const [config, setConfig] = useState<StoryConfig>({
    storyLength: 'medium',
    format: 'storyboard',
    artStyle: 'disney',
    customArtStyle: '',
    language: '',
    characters: [],
    interests: [],
    plotMode: 'auto',
    customPlot: '',
  });
  const [customInterest, setCustomInterest] = useState('');

  // Validation function for each step returning localization keys
  const validateStep = (step: number): string[] => {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        if (!config.language) {
          errors.push('validationLanguage');
        }
        if (config.artStyle === 'custom' && !config.customArtStyle.trim()) {
          errors.push('validationArtStyle');
        }
        break;
      case 2: {
        const heroCharacters = config.characters.filter(c => c.role === 'hero');
        if (heroCharacters.length === 0) {
          errors.push('validationHero');
        }
        const unnamedCharacters = config.characters.filter(c => !c.name.trim());
        if (unnamedCharacters.length > 0) {
          errors.push('validationCharacterName');
        }
        break;
      }
      case 3:
        if (config.interests.length === 0) {
          errors.push('validationInterest');
        }
        if (config.plotMode === 'manual' && !config.customPlot.trim()) {
          errors.push('validationPlot');
        }
        break;
    }
    
    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      toast({
        title: t('validationTitle'),
        description: t(errors[0]),
        variant: "destructive",
      });
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Only allow going to previous steps freely, forward requires validation
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    } else if (stepId > currentStep) {
      // Validate all steps up to the target step
      for (let i = currentStep; i < stepId; i++) {
        const errors = validateStep(i);
        if (errors.length > 0) {
          toast({
            title: t('validationTitle'),
            description: t(errors[0]),
            variant: "destructive",
          });
          return;
        }
      }
      setCurrentStep(stepId);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleToggleInterest = (interest: string) => {
    setConfig(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleAddCustomInterest = () => {
    if (customInterest.trim() && !config.interests.includes(customInterest.trim())) {
      setConfig(prev => ({
        ...prev,
        interests: [...prev.interests, customInterest.trim()]
      }));
      setCustomInterest('');
    }
  };

  const handleAddCharacter = (character: Character) => {
    setConfig(prev => ({
      ...prev,
      characters: [...prev.characters, character]
    }));
  };

  const handleRemoveCharacter = (id: string) => {
    setConfig(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id)
    }));
  };

  const handleUpdateCharacter = (id: string, updates: Partial<Character>) => {
    setConfig(prev => ({
      ...prev,
      characters: prev.characters.map(c => 
        c.id === id ? { ...c, ...updates } : c
      )
    }));
  };

  const handleGenerateStory = async () => {
    const errors = [1, 2, 3].flatMap(validateStep);
    if (errors.length) {
      toast({ title: t('validationTitle'), description: t(errors[0]), variant: 'destructive' });
      return;
    }
    if (generation.current) return;
    const controller = new AbortController();
    generation.current = controller;
    setIsGenerating(true);
    setIsSaving(false);
    setGeneratingStep(t('writingStory'));
    try {
      const result = await generateStory(config, controller.signal);
      if (controller.signal.aborted) return;
      setIsSaving(true);
      setGeneratingStep(t('savingStory'));
      await saveStoryToDatabase(config, result);
      if (controller.signal.aborted) return;
      setGeneratedStory({
        title: result.title,
        pages: result.pages,
      });

      toast({
        title: t('storyCreatedTitle'),
        description: `"${result.title}" is ready with ${result.pages.length} magical pages!`,
      });

    } catch (error) {
      if (controller.signal.aborted) return;
      toast({
        title: t('oopsTitle'),
        description: error instanceof Error ? error.message : "Failed to generate story. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (!controller.signal.aborted) setIsGenerating(false);
      if (generation.current === controller) generation.current = null;
    }
  };

  const handleCreateNewStory = () => {
    setGeneratedStory(null);
    setCurrentStep(1);
    setConfig({
      storyLength: 'medium',
      format: 'storyboard',
      artStyle: 'disney',
      customArtStyle: '',
      language: '',
      characters: [],
      interests: [],
      plotMode: 'auto',
      customPlot: '',
    });
  };

  // Show generating screen
  if (isGenerating) {
    return (
      <GeneratingScreen
        currentStep={generatingStep}
        onCancel={isSaving ? undefined : () => {
          setIsGenerating(false);
          generation.current?.abort();
          setGeneratingStep(t('preparingStory'));
          toast({ title: t('stoppedWaitingTitle'), description: t('stoppedWaitingDesc') });
          navigate('/profile');
        }}
      />
    );
  }

  // Show story preview after generation
  if (generatedStory) {
    return (
      <StoryPreview
        title={generatedStory.title}
        pages={generatedStory.pages}
        artStyle={config.artStyle}
        format={config.format}
        onBack={onBack}
        onCreateNew={handleCreateNewStory}
      />
    );
  }

  return (
    <section className="min-h-screen py-20 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <motion.div 
          className="flex justify-between mb-4 sm:mb-12 relative px-2"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
        >
          {/* Progress line */}
          <div className="absolute top-5 left-4 right-4 h-0.5 bg-muted/50" />
          <motion.div 
            className={`absolute top-5 ${isRTL ? 'right-4' : 'left-4'} h-0.5 bg-primary`}
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
          />
          
          {steps.map((step) => {
            const isCurrent = currentStep === step.id;
            return (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                <motion.button
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  aria-label={`${t('step')} ${step.id}: ${t(step.titleKey)}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    currentStep >= step.id
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                >
                  {step.id}
                </motion.button>
                <span className={`mt-2 text-sm font-medium hidden sm:block ${
                  currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {t(step.titleKey)}
                </span>
                <span className="text-xs text-muted-foreground hidden md:block">
                  {t(step.descKey)}
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* Mobile active step indicator */}
        <div className="sm:hidden text-center mb-6">
          <p className="text-sm font-semibold text-foreground">
            {t('step')} {currentStep} {t('of')} {steps.length}: {t(steps[currentStep - 1].titleKey)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(steps[currentStep - 1].descKey)}
          </p>
        </div>

        {/* Step Content */}
        <GlassCard className="mb-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                className="space-y-8"
              >
                <LanguageSelector
                  value={config.language}
                  onChange={(v) => setConfig(prev => ({ ...prev, language: v }))}
                />
                <StoryLengthSelector 
                  value={config.storyLength} 
                  onChange={(v) => setConfig(prev => ({ ...prev, storyLength: v }))} 
                />
                <FormatSelector 
                  value={config.format} 
                  onChange={(v) => setConfig(prev => ({ ...prev, format: v }))} 
                />
                <ArtStyleSelector 
                  value={config.artStyle}
                  customStyle={config.customArtStyle}
                  onChange={(v) => setConfig(prev => ({ ...prev, artStyle: v }))}
                  onCustomStyleChange={(v) => setConfig(prev => ({ ...prev, customArtStyle: v }))}
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
              >
                <CharacterUpload
                  characters={config.characters}
                  onAddCharacter={handleAddCharacter}
                  onRemoveCharacter={handleRemoveCharacter}
                  onUpdateCharacter={handleUpdateCharacter}
                />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                className="space-y-8"
              >
                <InterestsInput
                  selectedInterests={config.interests}
                  customInterest={customInterest}
                  onToggleInterest={handleToggleInterest}
                  onCustomInterestChange={setCustomInterest}
                  onAddCustomInterest={handleAddCustomInterest}
                />

                {/* Plot Mode Toggle */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">{t('plotCreation')}</h3>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, plotMode: 'auto' }))}
                      className={`flex-1 p-4 rounded-xl transition-all ${
                        config.plotMode === 'auto'
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-muted/30 border-2 border-transparent'
                      }`}
                    >
                      <Wand2 className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="font-medium text-foreground">{t('aiMagic')}</p>
                      <p className="text-sm text-muted-foreground">{t('aiMagicDesc')}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, plotMode: 'manual' }))}
                      className={`flex-1 p-4 rounded-xl transition-all ${
                        config.plotMode === 'manual'
                          ? 'bg-secondary/20 border-2 border-secondary'
                          : 'bg-muted/30 border-2 border-transparent'
                      }`}
                    >
                      <span className="text-2xl block mb-2">✍️</span>
                      <p className="font-medium text-foreground">{t('customPlot')}</p>
                      <p className="text-sm text-muted-foreground">{t('customPlotDesc')}</p>
                    </button>
                  </div>
                  
                  {config.plotMode === 'manual' && (
                    <CustomPlotInput
                      value={config.customPlot}
                      onChange={(v) => setConfig(prev => ({ ...prev, customPlot: v }))}
                      interests={config.interests}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                className="text-center py-8"
              >
                <motion.div
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center"
                  animate={shouldReduceMotion ? undefined : { scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Wand2 className="w-12 h-12 text-primary" />
                </motion.div>
                <h3 className="text-2xl font-bold text-foreground mb-4">{t('readyCreateMagic')}</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {t('readyCreateMagicDesc')}
                </p>
                
                {/* Summary */}
                <div className="glass-card p-4 max-w-md mx-auto text-start mb-8">
                  <h4 className="font-semibold text-foreground mb-3">{t('storySummary')}</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">{t('summaryLanguage')}:</span> <span className="text-foreground uppercase">{config.language || t('notSelected')}</span></p>
                    <p><span className="text-muted-foreground">{t('summaryLength')}:</span> <span className="text-foreground capitalize">{config.storyLength}</span></p>
                    <p><span className="text-muted-foreground">{t('summaryFormat')}:</span> <span className="text-foreground capitalize">{config.format}</span></p>
                    <p><span className="text-muted-foreground">{t('summaryStyle')}:</span> <span className="text-foreground capitalize">{config.artStyle === 'custom' ? config.customArtStyle : config.artStyle}</span></p>
                    <p><span className="text-muted-foreground">{t('summaryCharacters')}:</span> <span className="text-foreground">{config.characters.length ? config.characters.map(c => c.name).join(', ') : t('noneAdded')}</span></p>
                    <p><span className="text-muted-foreground">{t('summaryInterests')}:</span> <span className="text-foreground">{config.interests.length ? config.interests.join(', ') : t('noneSelected')}</span></p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-3">
          <BubbleButton variant="outline" onClick={handlePrev} className="touch-manipulation">
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} />
            {currentStep === 1 ? t('backHome') : t('previous')}
          </BubbleButton>
          
          {currentStep < steps.length ? (
            <BubbleButton onClick={handleNext} className="touch-manipulation">
              {t('nextStep')}
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
            </BubbleButton>
          ) : (
            <BubbleButton onClick={handleGenerateStory} className="touch-manipulation">
              <Wand2 className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('generateStory')}
            </BubbleButton>
          )}
        </div>
      </div>
    </section>
  );
};

export default StoryWizard;
