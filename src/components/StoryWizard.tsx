import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import GlassCard from './GlassCard';
import BubbleButton from './BubbleButton';
import StoryLengthSelector from './StoryLengthSelector';
import FormatSelector from './FormatSelector';
import ArtStyleSelector from './ArtStyleSelector';
import InquiryCharacters from './InquiryCharacters';
import InterestsInput from './InterestsInput';
import LanguageSelector from './LanguageSelector';
import CustomPlotInput from './CustomPlotInput';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createStoryInquiry, getOrderQuote, resumeStoryInquiry, updateStoryInquiry, validateOrderStory } from '@/features/orders/orderService';
import type { OrderAcknowledgment, OrderStoryConfiguration, StoryInquiry, StoryInquiryDetail } from '@/features/orders/orderService';
import { correctionInput, inquiryErrorKey, inquiryPrice, inquiryStatus } from '@/features/orders/inquiryPresentation';
import { clearInquiryDraft, readInquiryDraft, storeInquiryDraft } from '@/features/orders/inquiryDraft';

import type { Character, StoryConfig } from '@/features/stories/types';

interface StoryWizardProps {
  onBack: () => void;
  correction?: StoryInquiryDetail;
  onCorrected?: (detail: StoryInquiryDetail) => void;
}

const steps = [
  { id: 1, titleKey: 'step1Title', descKey: 'step1Desc' },
  { id: 2, titleKey: 'step2Title', descKey: 'step2Desc' },
  { id: 3, titleKey: 'step3Title', descKey: 'step3Desc' },
  { id: 4, titleKey: 'step4Title', descKey: 'step4Desc' },
];

const StoryWizard = ({ onBack, correction, onCorrected }: StoryWizardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const stepHeading = useRef<HTMLDivElement>(null);
  const [draft] = useState(() => {
    const saved = readInquiryDraft();
    return saved?.correctionId === correction?.id ? saved : null;
  });
  const [currentStep, setCurrentStep] = useState(draft ? 4 : 1);
  const [country, setCountry] = useState<StoryInquiry['country']>(correction?.country ?? draft?.country ?? 'EG');
  const [format, setFormat] = useState<StoryInquiry['format']>(correction?.format ?? draft?.format ?? 'digital_pdf');
  const [childFirstName, setChildFirstName] = useState(draft?.childFirstName ?? correction?.childFirstName ?? '');
  const [shippingAddress, setShippingAddress] = useState(draft?.shippingAddress ?? correction?.shippingAddress ?? '');
  const [version, setVersion] = useState(correction);
  const [reviewedVersion, setReviewedVersion] = useState(!draft?.expectedUpdatedAt || draft.expectedUpdatedAt === correction?.updatedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<OrderAcknowledgment>();
  const lock = useRef(false);
  const attempts = useRef(draft?.attempts ?? {});
  const draftOwner = useRef(draft?.ownerId ?? null);
  const activeUser = useRef(user?.id);
  useEffect(() => { activeUser.current = user?.id; }, [user?.id]);
  useEffect(() => { stepHeading.current?.focus({ preventScroll: true }); }, [currentStep]);
  const quote = useQuery({
    queryKey: ['inquiry-quote', user?.id, country, format],
    queryFn: () => getOrderQuote(country, format),
    enabled: !!user && currentStep === 4 && !correction && !receipt,
    retry: false,
  });
  const [config, setConfig] = useState<StoryConfig>(draft?.config ?? (correction ? correctionInput(correction) : {
    storyLength: 'medium',
    format: 'storyboard',
    artStyle: 'disney',
    customArtStyle: '',
    language: '',
    characters: [],
    interests: [],
    plotMode: 'auto',
    customPlot: '',
  }));
  const [customInterest, setCustomInterest] = useState('');

  // Validation function for each step returning localization keys
  const validateStep = (step: number): string[] => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (config.language !== 'ar' && config.language !== 'en') {
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
        if (config.interests.length > 10) {
          errors.push('inquiryInterestLimit');
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
    if (lock.current) return;
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

  const signIn = () => {
    try {
      storeInquiryDraft({ config, country, format, childFirstName, shippingAddress, attempts: attempts.current,
        ownerId: draftOwner.current, correctionId: version?.id, expectedUpdatedAt: version?.updatedAt });
      const target = version ? 'inquiries' : 'inquiry';
      navigate('/auth?return=' + target + (error === 'inquirySignIn' && user ? '&reauth=1' : ''));
    } catch {
      setError('inquiryDraftUnavailable');
    }
  };

  const submit = async () => {
    if (lock.current || isLoading) return;
    const errors = [1, 2, 3].flatMap(validateStep);
    if (errors.length || !childFirstName.trim() || (format === 'hardcopy_book' && !shippingAddress.trim())) {
      setError(errors[0] ?? 'inquiryRequired');
      return;
    }
    if (!user) {
      setError('inquirySignIn');
      return;
    }
    if (draftOwner.current && draftOwner.current !== user.id) {
      setError('inquiryDifferentAccount');
      return;
    }
    draftOwner.current = user.id;
    const owner = user.id;
    const story: OrderStoryConfiguration = {
      storyLength: config.storyLength as OrderStoryConfiguration['storyLength'],
      storyFormat: config.format as OrderStoryConfiguration['storyFormat'],
      artStyle: config.artStyle as OrderStoryConfiguration['artStyle'],
      customArtStyle: config.artStyle === 'custom' ? config.customArtStyle : '',
      plotMode: config.plotMode,
      customPlot: config.plotMode === 'manual' ? config.customPlot : '',
      characters: config.characters.map(({ name, role }) => ({ name: name.trim(), role: role as OrderStoryConfiguration['characters'][number]['role'] })),
      interests: config.interests,
    };
    const details = { childFirstName: childFirstName.trim(), shippingAddress: format === 'digital_pdf' ? null : shippingAddress.trim(), story };
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await validateOrderStory(story);
      if (activeUser.current !== owner) return;
      if (version) {
        if (!version.editable || !reviewedVersion) return;
        const updated = await updateStoryInquiry({ ...details, orderId: version.id, expectedUpdatedAt: version.updatedAt });
        if (activeUser.current === owner) {
          clearInquiryDraft();
          onCorrected?.(updated);
        }
      } else {
        const input = { ...details, country, format, language: config.language as StoryInquiry['language'] };
        const fingerprint = JSON.stringify(input);
        const requestKey = attempts.current[fingerprint] ??= crypto.randomUUID();
        const saved = await createStoryInquiry({ ...input, requestKey });
        if (activeUser.current !== owner) return;
        clearInquiryDraft();
        void queryClient.invalidateQueries({ queryKey: ['story-inquiries', owner] });
        setReceipt(saved);
      }
    } catch (failure) {
      if (activeUser.current !== owner) return;
      setError(inquiryErrorKey(failure));
      if (version) {
        try {
          const latest = await resumeStoryInquiry(version.id);
          if (activeUser.current === owner) {
            setVersion(latest);
            setReviewedVersion(latest.updatedAt === version.updatedAt);
          }
        } catch {
          if (activeUser.current === owner) setVersion({ ...version, editable: false });
        }
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  if (user && draftOwner.current && user.id !== draftOwner.current) {
    return <section className="mx-auto max-w-xl px-4 py-20">
      <GlassCard className="space-y-4">
        <p role="alert">{t('inquiryDifferentAccount')}</p>
        <BubbleButton variant="outline" size="sm" onClick={onBack}>{t('backHome')}</BubbleButton>
        <BubbleButton variant="outline" size="sm" onClick={() => { clearInquiryDraft(); onBack(); }}>{t('inquiryDiscardDraft')}</BubbleButton>
      </GlassCard>
    </section>;
  }

  if (receipt && user?.id === draftOwner.current) {
    return (
      <section className="mx-auto max-w-xl px-4 py-20">
        <GlassCard className="space-y-4 text-center">
          <h2 className="font-editorial text-3xl" role="status">{t('inquiryReceived')}</h2>
          <p>{receipt.status === 'whatsapp_inquiry' ? t('inquiryAwaitingReview') : inquiryStatus(receipt.status, t)}</p>
          <p><bdi className="break-all font-semibold">{receipt.reference}</bdi></p>
          <Link className="inline-flex min-h-11 items-center underline" to="/profile?tab=inquiries">{t('inquiryMyInquiries')}</Link>
        </GlassCard>
      </section>
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
            animate={{ width: `calc((100% - 2rem) * ${(currentStep - 1) / (steps.length - 1)})` }}
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
        <div ref={stepHeading} tabIndex={-1} className="sm:sr-only text-center mb-6">
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
                {!correction && <LanguageSelector
                  value={config.language}
                  onChange={(v) => setConfig(prev => ({ ...prev, language: v }))}
                />}
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
                <InquiryCharacters
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
                      <p className="font-medium text-foreground">{t('inquiryTeamPlot')}</p>
                      <p className="text-sm text-muted-foreground">{t('inquiryTeamPlotDesc')}</p>
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
                className="space-y-5 py-4"
              >
                <h3 className="font-editorial text-2xl">{t('inquiryReview')}</h3>
                <p className="text-muted-foreground">{t('inquiryOnly')}</p>
                <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="block">{t('inquiryChildName')}</span>
                    <Input className="h-11 text-base" maxLength={80} value={childFirstName} onChange={event => setChildFirstName(event.target.value)} />
                  </label>
                  <label className="space-y-1">
                    <span className="block">{t('inquiryCountry')}</span>
                    <select disabled={!!correction} className="h-11 w-full rounded-md border border-input bg-background px-3 text-base" value={country} onChange={event => setCountry(event.target.value as StoryInquiry['country'])}>
                      <option value="EG">{t('inquiryEgypt')}</option>
                      <option value="SA">{t('inquirySaudi')}</option>
                    </select>
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="block">{t('inquiryDelivery')}</span>
                    <select disabled={!!correction} className="h-11 w-full rounded-md border border-input bg-background px-3 text-base" value={format} onChange={event => setFormat(event.target.value as StoryInquiry['format'])}>
                      <option value="digital_pdf">{t('inquiryDigital')}</option>
                      <option value="hardcopy_book">{t('inquiryHardcopy')}</option>
                    </select>
                  </label>
                  {format === 'hardcopy_book' && (
                    <label className="space-y-1 sm:col-span-2">
                      <span className="block">{t('inquiryAddress')}</span>
                      <Textarea className="text-base" maxLength={500} value={shippingAddress} onChange={event => setShippingAddress(event.target.value)} />
                    </label>
                  )}
                </fieldset>
                {!correction && user && (
                  <div className="text-sm text-muted-foreground" role="status">
                    {quote.isFetching ? t('inquiryLoading') : quote.data?.totalMinor != null
                      ? <>{t('inquiryIndicativePrice')}: {inquiryPrice(quote.data.totalMinor, quote.data.currency, isRTL ? 'ar' : 'en')}</>
                      : t(quote.isError ? inquiryErrorKey(quote.error) : 'inquiryNoQuote')}
                  </div>
                )}
                {version?.correctionRequest && <p className="break-words">{version.correctionRequest}</p>}
                {version && !version.editable && <p role="status">{t('inquiryCorrectionClosed')}</p>}
                {version?.editable && !reviewedVersion && (
                  <BubbleButton size="sm" variant="outline" onClick={() => setReviewedVersion(true)}>
                    {t('inquiryReviewChanges')}
                  </BubbleButton>
                )}

                {/* Summary */}
                <div className="glass-card p-4 max-w-md mx-auto text-start mb-8">
                  <h4 className="font-semibold text-foreground mb-3">{t('storySummary')}</h4>
                  <div className="space-y-2 break-words text-sm">
                    <p><span className="text-muted-foreground">{t('summaryLanguage')}:</span> <span className="text-foreground uppercase">{t(config.language === 'ar' ? 'inquiryArabic' : 'inquiryEnglish')}</span></p>
                    <p><span className="text-muted-foreground">{t('summaryLength')}:</span> <span className="text-foreground capitalize">{t('inquiryOption_' + config.storyLength)}</span></p>
                    <p><span className="text-muted-foreground">{t('summaryFormat')}:</span> <span className="text-foreground capitalize">{t('inquiryOption_' + config.format)}</span></p>
                    <p><span className="text-muted-foreground">{t('summaryStyle')}:</span> <span className="text-foreground capitalize">{config.artStyle === 'custom' ? config.customArtStyle : t('inquiryOption_' + config.artStyle)}</span></p>
                    <p><span className="text-muted-foreground">{t('summaryCharacters')}:</span> <span className="text-foreground">{config.characters.length ? config.characters.map(c => c.name).join(', ') : t('noneAdded')}</span></p>
                    <p><span className="text-muted-foreground">{t('summaryInterests')}:</span> <span className="text-foreground">{config.interests.length ? config.interests.join(', ') : t('noneSelected')}</span></p>
                    <p><span className="text-muted-foreground">{t('plotCreation')}:</span> <span>{config.plotMode === 'manual' ? config.customPlot : t('inquiryTeamPlot')}</span></p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {currentStep === 4 && (
          <div className="mb-4 space-y-2">
            {error && <p role="alert" className="text-sm text-destructive">{t(error)}</p>}
            {busy && <p role="status" className="text-sm">{t('inquirySaving')}</p>}
            {(!user || error === 'inquirySignIn') && !isLoading && (
              <BubbleButton size="sm" variant="outline" onClick={signIn}>{t('inquirySignInContinue')}</BubbleButton>
            )}
          </div>
        )}
        {/* Navigation */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <BubbleButton size="sm" disabled={busy} variant="outline" onClick={handlePrev} className="touch-manipulation">
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} />
            {currentStep === 1 ? t('backHome') : t('previous')}
          </BubbleButton>

          {currentStep < steps.length ? (
            <BubbleButton size="sm" onClick={handleNext} className="touch-manipulation">
              {t('nextStep')}
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
            </BubbleButton>
          ) : (
            <BubbleButton size="sm" onClick={submit} disabled={busy || isLoading || (!!version && (!version.editable || !reviewedVersion))} className="min-h-11 touch-manipulation">
              {t(busy ? 'inquirySaving' : correction ? 'inquirySaveCorrection' : error && error !== 'inquirySignIn' ? 'inquiryRetry' : 'inquirySubmit')}
            </BubbleButton>
          )}
        </div>
      </div>
    </section>
  );
};

export default StoryWizard;
