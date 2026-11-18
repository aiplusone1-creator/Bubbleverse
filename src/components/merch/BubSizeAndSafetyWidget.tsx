import { useEffect, useId, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Baby,
  BookOpen,
  CheckCircle2,
  Droplets,
  Heart,
  Maximize2,
  Moon,
  Ruler,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Sparkles,
  Wind,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export interface BubSizeAndSafetyProps {
  productNameAr: string;
  productNameEn: string;
  selectedDiameterCm?: number; // e.g., 12, 20, or 30
  selectedDimensionsAr?: string;
  selectedDimensionsEn?: string;
  ageRatingAr: string;
  ageRatingEn: string;
  safetySpecsAr: string[];
  safetySpecsEn: string[];
  careAr: string;
  careEn: string;
  bubLoreAr: string;
  bubLoreEn: string;
  bedtimeRitualAr: string;
  bedtimeRitualEn: string;
}

interface SizePreset {
  id: string;
  diameterCm: number;
  labelAr: string;
  labelEn: string;
  shortTagAr: string;
  shortTagEn: string;
  contextAr: string;
  contextEn: string;
  isCustom?: boolean;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const SMARTPHONE_HEIGHT_CM = 14.5;
const SMARTPHONE_WIDTH_CM = 7.1;
const STORYBOOK_SIZE_CM = 21.6;

const STANDARD_PRESETS: SizePreset[] = [
  {
    id: 'mini-12',
    diameterCm: 12,
    labelAr: 'ميني',
    labelEn: 'Mini',
    shortTagAr: 'حجم الكف والشنطة',
    shortTagEn: 'Palm & Bag Clip',
    contextAr: 'مقاس ميني اللطيف (حجم الكف) — مثالي لتعليق شنطة المدرسة وهدية الطلبات المجانية.',
    contextEn: 'Palm-sized Mini companion — ideal for clipping onto backpacks and featured as our GWP gift size.',
  },
  {
    id: 'classic-20',
    diameterCm: 20,
    labelAr: 'كلاسيك',
    labelEn: 'Classic',
    shortTagAr: 'رفيق قصة النوم',
    shortTagEn: 'Bedtime Buddy',
    contextAr: 'المقاس الكلاسيكي الأكثر طلباً — بحجم مثالي لاحتضانه أثناء قراءة قصص بابل قبل النوم.',
    contextEn: 'Our most-loved Classic huggable size — fits snugly in little arms during bedtime reading.',
  },
  {
    id: 'jumbo-30',
    diameterCm: 30,
    labelAr: 'جامبو',
    labelEn: 'Jumbo',
    shortTagAr: 'وسادة احتضان فاخرة',
    shortTagEn: 'Cuddle Pillow',
    contextAr: 'مقاس جامبو الفاخر — وسادة احتضان ناعمة وكبيرة تزيّن سرير البطل الصغير.',
    contextEn: 'Statement Jumbo cuddle pillow — plush, huggable centerpiece for your little hero’s bed.',
  },
];

const FALLBACK_SAFETY_SPECS_AR = [
  'عيون وتفاصيل وجه مطرزة 100% بدون أي قطع بلاستيكية قابلة للانفصال أو البلع.',
  'حشو سحابي قطني فائق النعومة مضاد للحساسية ولطيف على بشرة الأطفال.',
  'أقمشة وأصباغ آمنة غير سامة وخالية من المواد الضارة.',
  'خياطة مزدوجة متينة تتحمل اللعب اليومي والاحتضان المتكرر.',
];

const FALLBACK_SAFETY_SPECS_EN = [
  '100% embroidered eyes & facial details — zero plastic beads or choking pellets.',
  'Hypoallergenic cloud-fiber fill designed to stay soft and gentle on sensitive skin.',
  'Non-toxic, azo-free dyes and baby-safe plush textiles.',
  'Reinforced double-stitching built for daily hugs and bedtime adventures.',
];

const SAFETY_STANDARDS = ['EN-71', 'ASTM F963', 'SASO'] as const;

function cmToInchesString(cm: number): string {
  return (cm / 2.54).toFixed(1);
}

function formatCmValue(cm: number): string {
  return Number.isInteger(cm) ? String(cm) : cm.toFixed(1);
}

function sanitizeDiameterCm(value?: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return Math.min(Math.max(Math.round(value * 10) / 10, 6), 50);
}

export function BubSizeAndSafetyWidget({
  productNameAr,
  productNameEn,
  selectedDiameterCm,
  selectedDimensionsAr,
  selectedDimensionsEn,
  ageRatingAr,
  ageRatingEn,
  safetySpecsAr,
  safetySpecsEn,
  careAr,
  careEn,
  bubLoreAr,
  bubLoreEn,
  bedtimeRitualAr,
  bedtimeRitualEn,
}: BubSizeAndSafetyProps) {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const shouldReduceMotion = Boolean(useReducedMotion());
  const svgGradientBaseId = useId().replace(/:/g, '');

  const normalizedSelectedCm = sanitizeDiameterCm(selectedDiameterCm);
  const matchingStandardPreset = STANDARD_PRESETS.find(
    (preset) => normalizedSelectedCm !== undefined && Math.abs(preset.diameterCm - normalizedSelectedCm) < 0.25,
  );

  const presets = useMemo<SizePreset[]>(() => {
    if (normalizedSelectedCm !== undefined && !matchingStandardPreset) {
      const customPreset: SizePreset = {
        id: 'selected-custom',
        diameterCm: normalizedSelectedCm,
        labelAr: 'هذا المنتج',
        labelEn: 'This Item',
        shortTagAr: selectedDimensionsAr?.trim() || `${formatCmValue(normalizedSelectedCm)} سم`,
        shortTagEn: selectedDimensionsEn?.trim() || `${formatCmValue(normalizedSelectedCm)} cm`,
        contextAr: selectedDimensionsAr?.trim()
          ? `أبعاد المنتج المختار: ${selectedDimensionsAr.trim()} — يمكنك أيضاً مقارنة مقاسات كورة Bub الثلاثة.`
          : 'مقارنة فورية لحجم هذا المنتج مع الموبايل القياسي وكتاب بابل فيرس.',
        contextEn: selectedDimensionsEn?.trim()
          ? `Selected item dimensions: ${selectedDimensionsEn.trim()} — compare alongside all 3 Bub plush sizes.`
          : 'Instant real-world scale comparison against a standard smartphone and Bubbleverse storybook.',
        isCustom: true,
      };
      return [customPreset, ...STANDARD_PRESETS];
    }
    return STANDARD_PRESETS;
  }, [matchingStandardPreset, normalizedSelectedCm, selectedDimensionsAr, selectedDimensionsEn]);

  const initialPresetId = matchingStandardPreset
    ? matchingStandardPreset.id
    : normalizedSelectedCm !== undefined
      ? 'selected-custom'
      : 'classic-20';

  const [activePresetId, setActivePresetId] = useState<string>(initialPresetId);
  const [activeStoryTab, setActiveStoryTab] = useState<'lore' | 'ritual'>('lore');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setActivePresetId(initialPresetId);
  }, [initialPresetId]);

  const activePreset =
    presets.find((preset) => preset.id === activePresetId) ?? presets[0] ?? STANDARD_PRESETS[1];

  const previewCm = activePreset.diameterCm;
  const previewInches = cmToInchesString(previewCm);
  const displayProductName = isAr ? productNameAr : productNameEn;
  const displayDimensions = isAr
    ? selectedDimensionsAr?.trim() || selectedDimensionsEn?.trim()
    : selectedDimensionsEn?.trim() || selectedDimensionsAr?.trim();
  const displayAgeRating = isAr
    ? ageRatingAr?.trim() || ageRatingEn?.trim() || '0+'
    : ageRatingEn?.trim() || ageRatingAr?.trim() || '0+';

  const safetySpecs = isAr
    ? safetySpecsAr.length > 0
      ? safetySpecsAr
      : FALLBACK_SAFETY_SPECS_AR
    : safetySpecsEn.length > 0
      ? safetySpecsEn
      : FALLBACK_SAFETY_SPECS_EN;

  const displayCare = isAr
    ? careAr?.trim() || careEn?.trim()
    : careEn?.trim() || careAr?.trim();

  const displayLore = isAr
    ? bubLoreAr?.trim() || bubLoreEn?.trim()
    : bubLoreEn?.trim() || bubLoreAr?.trim();

  const displayRitual = isAr
    ? bedtimeRitualAr?.trim() || bedtimeRitualEn?.trim()
    : bedtimeRitualEn?.trim() || bedtimeRitualAr?.trim();

  // Unified mathematical SVG scale geometry (baseline y=224, max reference height >= 30cm)
  const maxRefCm = Math.max(30, previewCm);
  const baselineY = 224;
  const maxVisualHeight = 178;
  const unitsPerCm = maxVisualHeight / maxRefCm;

  const phoneW = SMARTPHONE_WIDTH_CM * unitsPerCm;
  const phoneH = SMARTPHONE_HEIGHT_CM * unitsPerCm;
  const phoneX = 96 - phoneW / 2;
  const phoneY = baselineY - phoneH;

  const bookSize = STORYBOOK_SIZE_CM * unitsPerCm;
  const bookX = 258 - bookSize / 2;
  const bookY = baselineY - bookSize;

  const bubDiameter = previewCm * unitsPerCm;
  const bubRadius = bubDiameter / 2;
  const bubCx = 482;
  const bubCy = baselineY - bubRadius;

  const rulerMarksCm = maxRefCm > 30 ? [0, 10, 20, 30, Math.round(maxRefCm)] : [0, 10, 20, 30];

  const triggerSummaryCm = normalizedSelectedCm ?? 20;
  const triggerSummaryInches = cmToInchesString(triggerSummaryCm);

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'مقياس الحجم الحقيقي والأمان والعناية' : 'Real size guide, safety, and care'}
      className="space-y-4 w-full"
    >
      {/* 1. Interactive "How Big Is It?" Scale Visualizer Trigger + Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <div className="glass-card p-4 sm:p-5 border border-cyan-400/25">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-start gap-3 min-w-0">
              <div
                aria-hidden="true"
                className="w-11 h-11 rounded-2xl shrink-0 bg-gradient-to-br from-cyan-400/20 via-purple-400/20 to-pink-400/20 border border-cyan-300/35 flex items-center justify-center text-cyan-300 shadow-[0_0_24px_rgba(0,217,255,0.18)]"
              >
                <Ruler className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                    {isAr ? 'كم حجم المنتج الحقيقي؟' : 'How Big Is It Really?'}
                  </h3>
                  <span
                    dir="ltr"
                    className="num-tabular inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-400/15 text-cyan-200 border border-cyan-300/30"
                  >
                    {formatCmValue(triggerSummaryCm)} cm • {triggerSummaryInches}&quot;
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  {displayDimensions
                    ? isAr
                      ? `المقاس المختار: ${displayDimensions} — قارنه بصرياً مع الموبايل وكتاب بابل.`
                      : `Selected size: ${displayDimensions} — visually compare beside a smartphone & storybook.`
                    : isAr
                      ? 'قارن الحجم الفعلي بجانب موبايل قياسي وكتاب بابل فيرس قبل الطلب.'
                      : 'Compare actual scale side-by-side with a standard smartphone & Bubbleverse storybook.'}
                </p>
              </div>
            </div>

            <DialogTrigger asChild>
              <button
                type="button"
                className="bubble-btn-outline min-h-[44px] px-4 py-2.5 text-xs sm:text-sm gap-2 shrink-0 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <Maximize2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'مقياس الحجم التفاعلي' : 'Compare Real Size'}</span>
              </button>
            </DialogTrigger>
          </div>
        </div>

        <DialogContent
          dir={isRTL ? 'rtl' : 'ltr'}
          className="max-w-2xl w-[calc(100vw-1.5rem)] max-h-[90vh] overflow-y-auto rounded-3xl border border-cyan-300/25 bg-[#0b1124]/95 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.65)] text-foreground"
        >
          <DialogHeader className={cn('space-y-1.5 pe-8', isRTL ? 'text-right sm:text-right' : 'text-left sm:text-left')}>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300">
              <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'مقياس الحجم الحقيقي • Bubbleverse' : 'True-to-Scale Visualizer • Bubbleverse'}</span>
            </div>
            <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-foreground">
              {isAr ? `كم حجم ${displayProductName}؟` : `How Big Is ${displayProductName}?`}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? 'اختر أي مقاس أدناه لمقارنته بنسبة دقيقة أمام هاتف قياسي وكتاب قصص بابل فيرس المطبوع.'
                : 'Tap any size below to preview exact real-world proportions next to a smartphone and printed Bubbleverse storybook.'}
            </DialogDescription>
          </DialogHeader>

          {/* Interactive Quick-Preview Size Switcher (12cm Mini / 20cm Classic / 30cm Jumbo) */}
          <div
            role="group"
            aria-label={isAr ? 'اختر مقاساً للمقارنة الفورية' : 'Choose a size to compare'}
            className="grid grid-cols-3 gap-2 pt-1"
          >
            {presets.map((preset) => {
              const isSelected = preset.id === activePreset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setActivePresetId(preset.id)}
                  className={cn(
                    'min-h-[48px] px-2.5 py-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                    presets.length === 4 && preset.isCustom ? 'col-span-3' : '',
                    isSelected
                      ? 'bg-gradient-to-br from-cyan-400/20 via-purple-500/20 to-pink-500/20 border-cyan-300/60 text-foreground shadow-[0_0_24px_rgba(0,217,255,0.22)]'
                      : 'bg-slate-900/60 border-white/10 text-muted-foreground hover:border-cyan-300/35 hover:text-foreground',
                  )}
                >
                  <span className="text-xs sm:text-sm font-bold leading-tight">
                    {isAr ? preset.labelAr : preset.labelEn}
                  </span>
                  <span
                    dir="ltr"
                    className={cn(
                      'num-tabular text-[11px] sm:text-xs font-semibold',
                      isSelected ? 'text-cyan-200' : 'text-muted-foreground',
                    )}
                  >
                    {formatCmValue(preset.diameterCm)} cm ({cmToInchesString(preset.diameterCm)}&quot;)
                  </span>
                </button>
              );
            })}
          </div>

          {/* Proportional SVG Scale Stage */}
          <div className="glass-card-inner p-3 sm:p-4 border border-white/12 bg-slate-950/75">
            <div className="w-full" dir="ltr">
              <svg
                viewBox="0 0 600 252"
                className="w-full h-auto block select-none"
                role="img"
                aria-label={
                  isAr
                    ? `مقارنة حجم: موبايل 14.5 سم، كتاب بابل 21.6 سم، وكورة باب بمقاس ${formatCmValue(previewCm)} سم`
                    : `Scale comparison: 14.5 cm smartphone, 21.6 cm Bubbleverse storybook, and ${formatCmValue(previewCm)} cm Bub item`
                }
              >
                <defs>
                  {/* Iridescent Bub sphere gradients */}
                  <radialGradient id={`${svgGradientBaseId}-bub-body`} cx="35%" cy="28%" r="72%">
                    <stop offset="0%" stopColor="#8BF5FF" />
                    <stop offset="32%" stopColor="#00D9FF" />
                    <stop offset="68%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#F472B6" />
                  </radialGradient>
                  <radialGradient id={`${svgGradientBaseId}-bub-glow`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.34" />
                    <stop offset="55%" stopColor="#A78BFA" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id={`${svgGradientBaseId}-book-cover`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1b264f" />
                    <stop offset="55%" stopColor="#261f52" />
                    <stop offset="100%" stopColor="#141c3b" />
                  </linearGradient>
                  <linearGradient id={`${svgGradientBaseId}-phone-screen`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#16284c" />
                    <stop offset="100%" stopColor="#0c1328" />
                  </linearGradient>
                </defs>

                {/* Horizontal cm ruler guide lines */}
                {rulerMarksCm.map((cm) => {
                  const y = baselineY - cm * unitsPerCm;
                  return (
                    <g key={cm}>
                      <line
                        x1="44"
                        y1={y}
                        x2="584"
                        y2={y}
                        stroke={cm === 0 ? 'rgba(148, 163, 184, 0.45)' : 'rgba(148, 163, 184, 0.14)'}
                        strokeWidth={cm === 0 ? 1.5 : 1}
                        strokeDasharray={cm === 0 ? undefined : '4 5'}
                      />
                      <text
                        x="38"
                        y={y + 4}
                        textAnchor="end"
                        fill="#94a3b8"
                        fontSize="10"
                        fontWeight="600"
                        fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
                      >
                        {cm}cm
                      </text>
                    </g>
                  );
                })}

                {/* 1. Standard Smartphone (14.5 cm) */}
                <g>
                  <ellipse cx={96} cy={baselineY + 2} rx={phoneW * 0.56} ry={4} fill="rgba(0,0,0,0.45)" />
                  <rect
                    x={phoneX}
                    y={phoneY}
                    width={phoneW}
                    height={phoneH}
                    rx={8}
                    fill="#0f172a"
                    stroke="rgba(148,163,184,0.65)"
                    strokeWidth="1.6"
                  />
                  <rect
                    x={phoneX + 3.5}
                    y={phoneY + 4}
                    width={phoneW - 7}
                    height={phoneH - 8}
                    rx={5}
                    fill={`url(#${svgGradientBaseId}-phone-screen)`}
                  />
                  {/* Dynamic Island pill */}
                  <rect
                    x={96 - 7}
                    y={phoneY + 7.5}
                    width={14}
                    height={3.2}
                    rx={1.6}
                    fill="#020617"
                  />
                  {/* Subtle UI lines on phone screen */}
                  <circle cx={96} cy={phoneY + phoneH * 0.48} r={8} fill="rgba(0,217,255,0.22)" />
                  <rect
                    x={96 - 11}
                    y={phoneY + phoneH * 0.66}
                    width={22}
                    height={3}
                    rx={1.5}
                    fill="rgba(226,232,240,0.28)"
                  />
                  {/* Height badge above phone */}
                  <rect
                    x={96 - 30}
                    y={phoneY - 24}
                    width={60}
                    height={18}
                    rx={9}
                    fill="rgba(15,23,42,0.88)"
                    stroke="rgba(148,163,184,0.35)"
                    strokeWidth="1"
                  />
                  <text
                    x={96}
                    y={phoneY - 12}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="10.5"
                    fontWeight="700"
                    fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
                  >
                    14.5 cm
                  </text>
                </g>

                {/* 2. Bubbleverse Storybook (21.6 × 21.6 cm / 8.5"×8.5") */}
                <g>
                  <ellipse cx={258} cy={baselineY + 2} rx={bookSize * 0.48} ry={4.5} fill="rgba(0,0,0,0.45)" />
                  <rect
                    x={bookX}
                    y={bookY}
                    width={bookSize}
                    height={bookSize}
                    rx={8}
                    fill={`url(#${svgGradientBaseId}-book-cover)`}
                    stroke="rgba(167,139,250,0.55)"
                    strokeWidth="1.6"
                  />
                  {/* Hardcover spine crease */}
                  <line
                    x1={bookX + 12}
                    y1={bookY + 2}
                    x2={bookX + 12}
                    y2={bookY + bookSize - 2}
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="1.5"
                  />
                  {/* Decorative cover medallion */}
                  <circle
                    cx={bookX + bookSize * 0.54}
                    cy={bookY + bookSize * 0.44}
                    r={bookSize * 0.21}
                    fill="rgba(0,217,255,0.14)"
                    stroke="rgba(0,217,255,0.45)"
                    strokeWidth="1.2"
                  />
                  <circle
                    cx={bookX + bookSize * 0.54}
                    cy={bookY + bookSize * 0.44}
                    r={bookSize * 0.1}
                    fill="rgba(244,114,182,0.55)"
                  />
                  {/* Cover title bars */}
                  <rect
                    x={bookX + bookSize * 0.26}
                    y={bookY + bookSize * 0.74}
                    width={bookSize * 0.54}
                    height={5}
                    rx={2.5}
                    fill="rgba(226,232,240,0.4)"
                  />
                  <rect
                    x={bookX + bookSize * 0.34}
                    y={bookY + bookSize * 0.83}
                    width={bookSize * 0.38}
                    height={3.5}
                    rx={1.75}
                    fill="rgba(167,139,250,0.45)"
                  />
                  {/* Height badge above book */}
                  <rect
                    x={258 - 34}
                    y={bookY - 24}
                    width={68}
                    height={18}
                    rx={9}
                    fill="rgba(30,27,75,0.9)"
                    stroke="rgba(167,139,250,0.45)"
                    strokeWidth="1"
                  />
                  <text
                    x={258}
                    y={bookY - 12}
                    textAnchor="middle"
                    fill="#ddd6fe"
                    fontSize="10.5"
                    fontWeight="700"
                    fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
                  >
                    21.6 cm
                  </text>
                </g>

                {/* 3. Selected Bub Plush / Merch Sphere (Scaled Proportionally) */}
                <g>
                  {/* Soft floor contact shadow */}
                  <motion.ellipse
                    initial={false}
                    cx={bubCx}
                    cy={baselineY + 2}
                    animate={{ rx: bubRadius * 0.78 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                    ry={5}
                    fill="rgba(0, 217, 255, 0.24)"
                  />

                  {/* Ambient iridescent halo */}
                  <motion.circle
                    initial={false}
                    cx={bubCx}
                    animate={{ cy: bubCy, r: bubRadius * 1.18 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                    fill={`url(#${svgGradientBaseId}-bub-glow)`}
                  />

                  {/* Main Bub Iridescent Plush Sphere */}
                  <motion.circle
                    initial={false}
                    cx={bubCx}
                    animate={{ cy: bubCy, r: bubRadius }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                    fill={`url(#${svgGradientBaseId}-bub-body)`}
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="1.8"
                  />

                  {/* Glossy upper specular highlight */}
                  <motion.ellipse
                    initial={false}
                    animate={{
                      cx: bubCx - bubRadius * 0.24,
                      cy: bubCy - bubRadius * 0.36,
                      rx: bubRadius * 0.32,
                      ry: bubRadius * 0.15,
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                    fill="rgba(255,255,255,0.42)"
                  />

                  {/* Embroidered Bub eyes & friendly stitched smile */}
                  <motion.circle
                    initial={false}
                    animate={{
                      cx: bubCx - bubRadius * 0.24,
                      cy: bubCy - bubRadius * 0.04,
                      r: Math.max(2.6, bubRadius * 0.085),
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                    fill="#0f172a"
                  />
                  <motion.circle
                    initial={false}
                    animate={{
                      cx: bubCx - bubRadius * 0.22,
                      cy: bubCy - bubRadius * 0.07,
                      r: Math.max(1, bubRadius * 0.03),
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                    fill="#ffffff"
                  />
                  <motion.circle
                    initial={false}
                    animate={{
                      cx: bubCx + bubRadius * 0.24,
                      cy: bubCy - bubRadius * 0.04,
                      r: Math.max(2.6, bubRadius * 0.085),
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                    fill="#0f172a"
                  />
                  <motion.circle
                    initial={false}
                    animate={{
                      cx: bubCx + bubRadius * 0.26,
                      cy: bubCy - bubRadius * 0.07,
                      r: Math.max(1, bubRadius * 0.03),
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                    fill="#ffffff"
                  />
                  {/* Soft rosy embroidered cheeks */}
                  <motion.ellipse
                    initial={false}
                    animate={{
                      cx: bubCx - bubRadius * 0.38,
                      cy: bubCy + bubRadius * 0.12,
                      rx: bubRadius * 0.11,
                      ry: bubRadius * 0.065,
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                    fill="rgba(244,114,182,0.5)"
                  />
                  <motion.ellipse
                    initial={false}
                    animate={{
                      cx: bubCx + bubRadius * 0.38,
                      cy: bubCy + bubRadius * 0.12,
                      rx: bubRadius * 0.11,
                      ry: bubRadius * 0.065,
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: EASE_OUT }}
                    fill="rgba(244,114,182,0.5)"
                  />
                  {/* Stitched smile arc */}
                  <path
                    d={`M ${bubCx - bubRadius * 0.16} ${bubCy + bubRadius * 0.14} Q ${bubCx} ${bubCy + bubRadius * 0.28} ${bubCx + bubRadius * 0.16} ${bubCy + bubRadius * 0.14}`}
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth={Math.max(1.8, bubRadius * 0.045)}
                    strokeLinecap="round"
                  />

                  {/* Vertical measurement bracket on right side of Bub */}
                  <line
                    x1={576}
                    y1={baselineY - bubDiameter}
                    x2={576}
                    y2={baselineY}
                    stroke="#00D9FF"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1={570}
                    y1={baselineY - bubDiameter}
                    x2={582}
                    y2={baselineY - bubDiameter}
                    stroke="#00D9FF"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={570}
                    y1={baselineY}
                    x2={582}
                    y2={baselineY}
                    stroke="#00D9FF"
                    strokeWidth="1.5"
                  />

                  {/* Dynamic Bub Size Pill above sphere */}
                  <rect
                    x={bubCx - 48}
                    y={Math.max(8, baselineY - bubDiameter - 26)}
                    width={96}
                    height={20}
                    rx={10}
                    fill="rgba(0, 217, 255, 0.2)"
                    stroke="rgba(0, 217, 255, 0.72)"
                    strokeWidth="1.2"
                  />
                  <text
                    x={bubCx}
                    y={Math.max(8, baselineY - bubDiameter - 26) + 13.5}
                    textAnchor="middle"
                    fill="#ecfeff"
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
                  >
                    {formatCmValue(previewCm)} cm • {previewInches}&quot;
                  </text>
                </g>

                {/* Baseline floor label */}
                <text
                  x="312"
                  y="244"
                  textAnchor="middle"
                  fill="rgba(148,163,184,0.65)"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
                >
                  1 : 1 PROPORTIONAL SCALE (CM / INCH)
                </text>
              </svg>
            </div>

            {/* 3-Column Localized Comparison Legend */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10">
              <div className="rounded-xl bg-slate-900/60 border border-white/10 p-2.5 text-center">
                <div className="inline-flex items-center justify-center gap-1 text-slate-300 text-[11px] sm:text-xs font-bold">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'موبايل قياسي' : 'Smartphone'}</span>
                </div>
                <p dir="ltr" className="num-tabular text-[11px] text-muted-foreground mt-1">
                  14.5 cm • 5.7&quot;
                </p>
              </div>

              <div className="rounded-xl bg-purple-950/35 border border-purple-400/25 p-2.5 text-center">
                <div className="inline-flex items-center justify-center gap-1 text-purple-200 text-[11px] sm:text-xs font-bold">
                  <BookOpen className="w-3.5 h-3.5 text-purple-300 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'كتاب بابل' : 'Storybook'}</span>
                </div>
                <p dir="ltr" className="num-tabular text-[11px] text-purple-200/80 mt-1">
                  21.6 cm • 8.5&quot;×8.5&quot;
                </p>
              </div>

              <div className="rounded-xl bg-cyan-500/15 border border-cyan-300/40 p-2.5 text-center">
                <div className="inline-flex items-center justify-center gap-1 text-cyan-200 text-[11px] sm:text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
                  <span>
                    {isAr ? `باب ${activePreset.labelAr}` : `Bub ${activePreset.labelEn}`}
                  </span>
                </div>
                <p dir="ltr" className="num-tabular text-[11px] text-cyan-100 font-semibold mt-1">
                  {formatCmValue(previewCm)} cm • {previewInches}&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Parent-Friendly Contextual Tip for Selected Size */}
          <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-300/20 p-3.5 flex items-start gap-2.5">
            <Heart className="w-4 h-4 text-pink-300 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
              <span className="font-bold text-cyan-200">
                {isAr ? activePreset.shortTagAr : activePreset.shortTagEn}:{' '}
              </span>
              <span>{isAr ? activePreset.contextAr : activePreset.contextEn}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Dual Storytelling Tabs (Jellycat / Slumberkins Emotional Flywheel) */}
      <div className="glass-card p-4 sm:p-5 border border-white/12">
        <Tabs
          dir={isRTL ? 'rtl' : 'ltr'}
          value={activeStoryTab}
          onValueChange={(value) => {
            if (value === 'lore' || value === 'ritual') {
              setActiveStoryTab(value);
            }
          }}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full h-auto p-1.5 rounded-2xl bg-slate-950/65 border border-white/10 gap-1.5">
            <TabsTrigger
              value="lore"
              className="min-h-[44px] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold gap-2 text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-400/25 data-[state=active]:to-purple-500/25 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-cyan-300/40 data-[state=active]:shadow-[0_0_20px_rgba(0,217,255,0.16)]"
            >
              <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'حكاية باب' : 'Character Lore'}</span>
            </TabsTrigger>
            <TabsTrigger
              value="ritual"
              className="min-h-[44px] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold gap-2 text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/25 data-[state=active]:to-pink-500/25 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-pink-300/40 data-[state=active]:shadow-[0_0_20px_rgba(244,114,182,0.16)]"
            >
              <Moon className="w-4 h-4 text-pink-300 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'طقس القراءة والنوم' : 'Bedtime Ritual'}</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait" initial={false}>
            {activeStoryTab === 'lore' ? (
              <TabsContent key="lore" value="lore" forceMount className="mt-3.5 focus-visible:outline-none">
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }}
                  className="glass-card-inner p-4 border border-cyan-400/15 bg-gradient-to-br from-cyan-500/[0.06] to-purple-500/[0.05]"
                >
                  <p className="text-sm text-foreground/90 leading-relaxed">{displayLore}</p>
                </motion.div>
              </TabsContent>
            ) : (
              <TabsContent key="ritual" value="ritual" forceMount className="mt-3.5 focus-visible:outline-none">
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }}
                  className="glass-card-inner p-4 border border-pink-400/15 bg-gradient-to-br from-purple-500/[0.07] to-pink-500/[0.06] space-y-3"
                >
                  <p className="text-sm text-foreground/90 leading-relaxed">{displayRitual}</p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                    <div className="rounded-xl bg-slate-950/50 px-2.5 py-2 text-center border border-white/5">
                      <span className="block text-[11px] font-bold text-cyan-200">
                        {isAr ? '1. القصة' : '1. Story'}
                      </span>
                      <span className="block text-[10px] text-muted-foreground mt-0.5">
                        {isAr ? 'قراءة دافئة' : 'Cozy read'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-950/50 px-2.5 py-2 text-center border border-white/5">
                      <span className="block text-[11px] font-bold text-purple-200">
                        {isAr ? '2. احتضان باب' : '2. Hug Bub'}
                      </span>
                      <span className="block text-[10px] text-muted-foreground mt-0.5">
                        {isAr ? 'أمان ملموس' : 'Tactile calm'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-950/50 px-2.5 py-2 text-center border border-white/5">
                      <span className="block text-[11px] font-bold text-pink-200">
                        {isAr ? '3. نوم هادئ' : '3. Sweet Sleep'}
                      </span>
                      <span className="block text-[10px] text-muted-foreground mt-0.5">
                        {isAr ? 'ثقة وخيال' : 'Safe dreams'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            )}
          </AnimatePresence>
        </Tabs>
      </div>

      {/* 3. Safety, Child-Safe Materials & Washability Accordion */}
      <div className="glass-card px-4 sm:px-5 py-1 border border-white/12">
        <Accordion type="multiple" defaultValue={['safety']} className="w-full">
          {/* Safety & Materials */}
          <AccordionItem value="safety" className="border-white/10">
            <AccordionTrigger className="min-h-[52px] py-3.5 hover:no-underline gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl">
              <div className="flex flex-wrap items-center gap-2.5 text-start">
                <span
                  aria-hidden="true"
                  className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 flex items-center justify-center shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="font-display text-sm sm:text-base font-bold text-foreground">
                  {isAr ? 'الأمان والخامات الآمنة للأطفال' : 'Safety & Child-Safe Materials'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">
                  <Baby className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>{displayAgeRating}</span>
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="pb-4 pt-1 space-y-3.5">
              {/* Standards Alignment Strip */}
              <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-emerald-500/[0.08] border border-emerald-400/20 px-3.5 py-2.5">
                <span className="text-xs font-semibold text-emerald-200">
                  {isAr ? 'مصمم وفق معايير سلامة الألعاب:' : 'Built to child-safety toy standards:'}
                </span>
                <div className="flex flex-wrap items-center gap-1.5" dir="ltr">
                  {SAFETY_STANDARDS.map((code) => (
                    <span
                      key={code}
                      className="num-tabular px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-950/75 text-emerald-300 border border-emerald-400/30"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bullet Safety Specs */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {safetySpecs.map((spec, idx) => (
                  <li
                    key={`${idx}-${spec.slice(0, 18)}`}
                    className="glass-card-inner p-3 border border-white/10 flex items-start gap-2.5"
                  >
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                      {spec}
                    </span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Washability & Care */}
          <AccordionItem value="care" className="border-b-0">
            <AccordionTrigger className="min-h-[52px] py-3.5 hover:no-underline gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl">
              <div className="flex items-center gap-2.5 text-start">
                <span
                  aria-hidden="true"
                  className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/35 text-cyan-300 flex items-center justify-center shrink-0"
                >
                  <Droplets className="w-4 h-4" />
                </span>
                <span className="font-display text-sm sm:text-base font-bold text-foreground">
                  {isAr ? 'التنظيف والعناية' : 'Washability & Care'}
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="pb-4 pt-1 space-y-3">
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed glass-card-inner p-3.5 border border-white/10">
                {displayCare}
              </p>

              <div className="grid grid-cols-3 gap-2">
                <div className="glass-card-inner p-2.5 border border-cyan-400/15 flex flex-col items-center text-center gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                  <span className="text-[11px] font-bold text-foreground">
                    {isAr ? 'غسيل لطيف' : 'Gentle Wash'}
                  </span>
                </div>
                <div className="glass-card-inner p-2.5 border border-purple-400/15 flex flex-col items-center text-center gap-1.5">
                  <Snowflake className="w-4 h-4 text-purple-300" aria-hidden="true" />
                  <span className="text-[11px] font-bold text-foreground">
                    {isAr ? (
                      <>
                        ماء بارد{' '}
                        <span dir="ltr" className="num-tabular inline-block">
                          30°C
                        </span>
                      </>
                    ) : (
                      <>
                        Cool{' '}
                        <span dir="ltr" className="num-tabular inline-block">
                          30°C
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <div className="glass-card-inner p-2.5 border border-pink-400/15 flex flex-col items-center text-center gap-1.5">
                  <Wind className="w-4 h-4 text-pink-300" aria-hidden="true" />
                  <span className="text-[11px] font-bold text-foreground">
                    {isAr ? 'تجفيف بالهواء' : 'Air Dry'}
                  </span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}

export default BubSizeAndSafetyWidget;
