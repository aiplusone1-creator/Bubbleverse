import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Wand2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { generateStory, saveStoryToDatabase } from '@/lib/storyService';

interface Character {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
}

interface StoryConfig {
  storyLength: string;
  format: string;
  artStyle: string;
  customArtStyle: string;
  language: string;
  characters: Character[];
  interests: string[];
  plotMode: 'auto' | 'manual';
  customPlot: string;
}

interface GeneratedStory {
  title: string;
  pages: Array<{
    pageNumber: number;
    sceneDescription: string;
    dialogueText: string;
    panelLayoutType: string;
  }>;
}

interface StoryWizardProps {
  onBack: () => void;
}

const steps = [
  { id: 1, title: 'Story Setup', description: 'Choose length, format & style' },
  { id: 2, title: 'Characters', description: 'Add your heroes' },
  { id: 3, title: 'Story Theme', description: 'Personalize the adventure' },
  { id: 4, title: 'Review', description: 'Ready to create magic!' },
];

const StoryWizard = ({ onBack }: StoryWizardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [generatingStep, setGeneratingStep] = useState('Preparing your story...');
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
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

  // Validation function for each step
  const validateStep = (step: number): string[] => {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        if (!config.language) {
          errors.push('Please select a language for your story');
        }
        if (config.artStyle === 'custom' && !config.customArtStyle.trim()) {
          errors.push('Please describe your custom art style');
        }
        break;
      case 2: {
        const heroCharacters = config.characters.filter(c => c.role === 'hero');
        if (heroCharacters.length === 0) {
          errors.push('Please add at least one Hero character (the main child of the story)');
        }
        const unnamedCharacters = config.characters.filter(c => !c.name.trim());
        if (unnamedCharacters.length > 0) {
          errors.push('Please give a name to all characters');
        }
        break;
      }
      case 3:
        if (config.interests.length === 0) {
          errors.push('Please select at least one interest');
        }
        if (config.plotMode === 'manual' && !config.customPlot.trim()) {
          errors.push('Please write your custom plot');
        }
        break;
    }
    
    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Please complete required fields",
        description: errors[0],
        variant: "destructive",
      });
      return;
    }
    setValidationErrors([]);
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
          setValidationErrors(errors);
          toast({
            title: "Please complete required fields",
            description: errors[0],
            variant: "destructive",
          });
          return;
        }
      }
      setValidationErrors([]);
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
    setIsGenerating(true);
    setGeneratingProgress(0);
    setGeneratingStep('Preparing your story...');

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setGeneratingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    const stepMessages = [
      'Gathering magical ingredients...',
      'Crafting your adventure...',
      'Adding sparkles and wonder...',
      'Bringing characters to life...',
      'Polishing the final touches...',
    ];

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % stepMessages.length;
      setGeneratingStep(stepMessages[stepIndex]);
    }, 2000);

    try {
      
      const result = await generateStory(config);
      
      setGeneratingProgress(95);
      setGeneratingStep('Saving your story...');
      
      // Save to database
      await saveStoryToDatabase(config, result);
      
      setGeneratingProgress(100);
      setGeneratingStep('Story complete!');
      
      // Short delay to show 100%
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setGeneratedStory({
        title: result.title,
        pages: result.pages,
      });

      toast({
        title: "Story Created! ✨",
        description: `"${result.title}" is ready with ${result.pages.length} magical pages!`,
      });

    } catch (error) {
      console.error('Story generation failed:', error);
      toast({
        title: "Oops! Something went wrong",
        description: error instanceof Error ? error.message : "Failed to generate story. Please try again.",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      setIsGenerating(false);
    }
  };

  const handleCreateNewStory = () => {
    setGeneratedStory(null);
    setCurrentStep(1);
    setValidationErrors([]);
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
        progress={generatingProgress}
        currentStep={generatingStep}
        onCancel={() => {
          setIsGenerating(false);
          setGeneratingProgress(0);
          setGeneratingStep('Preparing your story...');
          toast({ title: 'Generation cancelled', description: 'Taking you to your profile.' });
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
    <section className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <motion.div 
          className="flex justify-between mb-12 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Progress line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted/50" />
          <motion.div 
            className="absolute top-5 left-0 h-0.5 bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
          
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <motion.button
                onClick={() => handleStepClick(step.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 cursor-pointer ${
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {step.id}
              </motion.button>
              <span className={`mt-2 text-sm font-medium ${
                currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.title}
              </span>
              <span className="text-xs text-muted-foreground hidden md:block">
                {step.description}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Step Content */}
        <GlassCard className="mb-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
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
                  <h3 className="text-xl font-semibold text-foreground">Plot Creation</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, plotMode: 'auto' }))}
                      className={`flex-1 p-4 rounded-xl transition-all ${
                        config.plotMode === 'auto'
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-muted/30 border-2 border-transparent'
                      }`}
                    >
                      <Wand2 className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="font-medium text-foreground">AI Magic</p>
                      <p className="text-sm text-muted-foreground">Let AI create a surprise plot</p>
                    </button>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, plotMode: 'manual' }))}
                      className={`flex-1 p-4 rounded-xl transition-all ${
                        config.plotMode === 'manual'
                          ? 'bg-secondary/20 border-2 border-secondary'
                          : 'bg-muted/30 border-2 border-transparent'
                      }`}
                    >
                      <span className="text-2xl block mb-2">✍️</span>
                      <p className="font-medium text-foreground">Custom Plot</p>
                      <p className="text-sm text-muted-foreground">Write your own story</p>
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center py-8"
              >
                <motion.div
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Wand2 className="w-12 h-12 text-primary" />
                </motion.div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Ready to Create Magic!</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Your personalized story is about to come to life. 
                  Click below to start the AI generation process.
                </p>
                
                {/* Summary */}
                <div className="glass-card p-4 max-w-md mx-auto text-left mb-8">
                  <h4 className="font-semibold text-foreground mb-3">Story Summary</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Language:</span> <span className="text-foreground uppercase">{config.language || 'Not selected'}</span></p>
                    <p><span className="text-muted-foreground">Length:</span> <span className="text-foreground capitalize">{config.storyLength}</span></p>
                    <p><span className="text-muted-foreground">Format:</span> <span className="text-foreground capitalize">{config.format}</span></p>
                    <p><span className="text-muted-foreground">Style:</span> <span className="text-foreground capitalize">{config.artStyle === 'custom' ? config.customArtStyle : config.artStyle}</span></p>
                    <p><span className="text-muted-foreground">Characters:</span> <span className="text-foreground">{config.characters.length ? config.characters.map(c => c.name).join(', ') : 'None added'}</span></p>
                    <p><span className="text-muted-foreground">Interests:</span> <span className="text-foreground">{config.interests.length ? config.interests.join(', ') : 'None selected'}</span></p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Navigation */}
        <div className="flex justify-between">
          <BubbleButton variant="outline" onClick={handlePrev}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            {currentStep === 1 ? 'Back to Home' : 'Previous'}
          </BubbleButton>
          
          {currentStep < steps.length ? (
            <BubbleButton onClick={handleNext}>
              Next Step
              <ArrowRight className="w-5 h-5 ml-2" />
            </BubbleButton>
          ) : (
            <BubbleButton onClick={handleGenerateStory}>
              <Wand2 className="w-5 h-5 mr-2" />
              Generate Story
            </BubbleButton>
          )}
        </div>
      </div>
    </section>
  );
};

export default StoryWizard;
