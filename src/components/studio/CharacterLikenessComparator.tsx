/**
 * Character Likeness Comparator Component
 * Provides a side-by-side and split-slider comparison between the real child photo
 * and the generated 3-pose character consistency turnaround sheets, allowing the
 * operator to audit facial likeness, compare multiple candidate sheets, and select the winner.
 */

import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Eye,
  RefreshCw,
  Sparkles,
  Split,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CharacterSheetCandidate } from '@/lib/localStore';

interface CharacterLikenessComparatorProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  childGender: 'boy' | 'girl';
  childPhotoUrl: string | null;
  candidates: CharacterSheetCandidate[];
  activeCandidateId: string | null;
  onSelectCandidate: (candidateId: string) => void;
  onDeleteCandidate: (candidateId: string) => void;
  onGenerateAnother: () => void;
  isGenerating: boolean;
  isAr: boolean;
}

export const CharacterLikenessComparator: React.FC<CharacterLikenessComparatorProps> = ({
  isOpen,
  onClose,
  childName,
  childGender,
  childPhotoUrl,
  candidates,
  activeCandidateId,
  onSelectCandidate,
  onDeleteCandidate,
  onGenerateAnother,
  isGenerating,
  isAr,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'slider'>('side-by-side');
  const [photoZoom, setPhotoZoom] = useState<number>(1);
  const [sheetZoom, setSheetZoom] = useState<number>(1);
  const [checklist, setChecklist] = useState({
    hairMatch: true,
    eyesMatch: true,
    smileMatch: true,
    skinMatch: true,
  });

  if (!isOpen) return null;

  const currentCandidate =
    candidates.find((c) => c.id === activeCandidateId) || candidates[0] || null;

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const calculatedFidelity =
    Math.round(
      ((Number(checklist.hairMatch) +
        Number(checklist.eyesMatch) +
        Number(checklist.smileMatch) +
        Number(checklist.skinMatch)) /
        4) *
        100
    ) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col rounded-3xl bg-slate-950/95 border border-cyan-400/35 shadow-[0_24px_64px_rgba(0,0,0,0.8),0_0_32px_rgba(0,217,255,0.18)] overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  {isAr ? 'فحص ومطابقة ملامح البطل جنباً إلى جنب' : 'Side-by-Side Hero Likeness Audit'}
                </h2>
                <Badge className="bg-cyan-500/20 text-cyan-200 border-cyan-400/30 text-xs font-numeric">
                  {childName} ({childGender === 'girl' ? (isAr ? 'بنت' : 'Girl') : (isAr ? 'ولد' : 'Boy')})
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr
                  ? 'قارن صورة الطفل الأصلية مع بدائل ورقة الشخصية، واختر النسخة الأكثر شبهاً بملامحه.'
                  : 'Compare real reference photo with character sheets and lock the best likeness.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900/90 rounded-full p-1 border border-white/15">
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  viewMode === 'side-by-side'
                    ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'عرض متوازي' : 'Side-by-Side'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('slider')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors flex items-center gap-1 ${
                  viewMode === 'slider'
                    ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>{isAr ? 'مؤشر منزلق' : 'Split Slider'}</span>
              </button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full w-9 h-9 p-0 text-slate-400 hover:text-white hover:bg-white/10"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Candidate Selector Ribbon */}
        {candidates.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-6 py-2.5 bg-slate-900/40 border-b border-white/10 overflow-x-auto">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-300">
                {isAr ? 'البدائل المولدة:' : 'Generated Candidates:'}
              </span>
              <div className="flex items-center gap-2">
                {candidates.map((cand, idx) => {
                  const isActive = cand.id === (currentCandidate?.id || activeCandidateId);
                  return (
                    <button
                      key={cand.id}
                      type="button"
                      onClick={() => onSelectCandidate(cand.id)}
                      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                        isActive
                          ? 'bg-cyan-500/20 border-cyan-400/60 text-white font-bold shadow-[0_0_12px_rgba(0,217,255,0.25)]'
                          : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/30 hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-md overflow-hidden bg-slate-950 border border-white/20 shrink-0">
                        <img src={cand.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-numeric">
                        {isAr ? `بديل 0${idx + 1}` : `Candidate 0${idx + 1}`}
                      </span>
                      {isActive && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onGenerateAnother}
                disabled={isGenerating}
                className="h-8 rounded-full bg-cyan-500/15 border-cyan-400/40 hover:bg-cyan-500/25 text-cyan-100 text-xs font-bold gap-1.5"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isAr ? 'توليد بديل إضافي' : 'Generate Another'}</span>
              </Button>

              {candidates.length > 1 && currentCandidate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteCandidate(currentCandidate.id)}
                  className="h-8 px-2.5 rounded-full text-rose-300 hover:text-rose-100 hover:bg-rose-500/15 text-xs gap-1"
                  title={isAr ? 'حذف هذا البديل' : 'Delete this candidate'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isAr ? 'حذف هذا البديل' : 'Delete'}</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Main Comparison Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {viewMode === 'side-by-side' ? (
            /* Mode 1: Dual Column Side-by-Side */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
              {/* Real Child Photo Column */}
              <div className="rounded-2xl border border-amber-400/35 bg-slate-900/60 p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <h3 className="text-xs sm:text-sm font-extrabold text-amber-200 uppercase tracking-wider">
                      {isAr ? 'صورة الطفل الواقعية (المرجع الأساسي)' : 'Real Child Photo (Reference Ground Truth)'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPhotoZoom((z) => Math.max(0.8, z - 0.2))}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoZoom((z) => Math.min(2.5, z + 0.2))}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoZoom(1)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                      title="Reset Zoom"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative flex-1 min-h-[340px] max-h-[500px] rounded-xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center">
                  {childPhotoUrl ? (
                    <img
                      src={childPhotoUrl}
                      alt={`Real photo of ${childName}`}
                      style={{ transform: `scale(${photoZoom})` }}
                      className="w-full h-full object-contain transition-transform duration-150"
                    />
                  ) : (
                    <div className="p-8 text-center space-y-2 text-slate-400">
                      <p className="text-xs">
                        {isAr
                          ? 'لم يتم رفع صورة مرجعية للطفل بعد في هذا الطلب.'
                          : 'No reference photo uploaded for this order yet.'}
                      </p>
                    </div>
                  )}
                  <div className="absolute bottom-2.5 start-2.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-amber-400/30 text-[10px] text-amber-200 font-bold">
                    {isAr ? 'الوجه والشعر الطبيعي' : 'Natural Hair & Face'}
                  </div>
                </div>
              </div>

              {/* Character Sheet Column */}
              <div className="rounded-2xl border border-cyan-400/35 bg-slate-900/60 p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <h3 className="text-xs sm:text-sm font-extrabold text-cyan-200 uppercase tracking-wider">
                      {isAr
                        ? `ورقة الشخصية المعتمدة (${currentCandidate?.label || '3 وضعيات'})`
                        : `Character Turnaround Sheet (${currentCandidate?.label || '3-Pose'})`}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSheetZoom((z) => Math.max(0.8, z - 0.2))}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheetZoom((z) => Math.min(2.5, z + 0.2))}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSheetZoom(1)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                      title="Reset Zoom"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative flex-1 min-h-[340px] max-h-[500px] rounded-xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center">
                  {currentCandidate?.url ? (
                    <img
                      src={currentCandidate.url}
                      alt={`Character sheet for ${childName}`}
                      style={{ transform: `scale(${sheetZoom})` }}
                      className="w-full h-full object-contain transition-transform duration-150"
                    />
                  ) : (
                    <div className="p-8 text-center space-y-2 text-slate-400">
                      <p className="text-xs">
                        {isAr
                          ? 'اضغط على زر التوليد بالأعلى لإنشاء ورقة الشخصية.'
                          : 'Click Generate above to create the 3-pose character sheet.'}
                      </p>
                    </div>
                  )}
                  <div className="absolute bottom-2.5 start-2.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-cyan-400/30 text-[10px] text-cyan-200 font-bold">
                    {isAr ? '3 وضعيات: أمامية، حركية، جانبية' : '3 Poses: Front, 3/4 Action, Profile'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Interactive Split-Slider Overlay */
            <div className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-cyan-400/40 bg-slate-950 select-none">
              {/* Background Layer: Character Sheet */}
              {currentCandidate?.url && (
                <img
                  src={currentCandidate.url}
                  alt="Character Sheet"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}

              {/* Foreground Layer: Real Child Photo (Clipped by Slider) */}
              {childPhotoUrl && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                  }}
                >
                  <img
                    src={childPhotoUrl}
                    alt="Real Child Photo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Slider Divider Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_12px_#38bdf8] cursor-ew-resize z-20 flex items-center justify-center"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-cyan-400 text-slate-950 font-bold flex items-center justify-center shadow-lg -translate-x-1/2">
                  <Split className="w-4 h-4" />
                </div>
              </div>

              {/* Hidden Range Input for Touch/Mouse Drag */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize z-30 w-full h-full"
              />

              {/* Position Labels */}
              <div className="absolute top-3 start-3 px-3 py-1 rounded-full bg-black/75 border border-amber-400/30 text-amber-200 text-xs font-bold pointer-events-none z-10">
                {isAr ? '← صورة الطفل الواقعية' : '← Real Child Photo'}
              </div>
              <div className="absolute top-3 end-3 px-3 py-1 rounded-full bg-black/75 border border-cyan-400/30 text-cyan-200 text-xs font-bold pointer-events-none z-10">
                {isAr ? 'ورقة الشخصية الكرتونية →' : 'Cartoon Character Sheet →'}
              </div>
            </div>
          )}

          {/* Likeness Fidelity Checklist & Audit Bar */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-extrabold text-white">
                  {isAr ? 'قائمة تدقيق تطابق الملامح (Likeness Fidelity Checklist):' : 'Likeness Fidelity Checklist:'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {isAr ? 'نسبة التطابق الإجمالية:' : 'Overall Match Score:'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-numeric text-xs font-bold">
                  {calculatedFidelity}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {[
                {
                  key: 'hairMatch',
                  labelAr: 'تطابق الشعر وتسريحته',
                  labelEn: 'Hair Texture & Cut',
                },
                {
                  key: 'eyesMatch',
                  labelAr: 'شكل العينين والنظرة',
                  labelEn: 'Eye Shape & Gaze',
                },
                {
                  key: 'smileMatch',
                  labelAr: 'الابتسامة وشكل الخدود',
                  labelEn: 'Smile & Cheeks',
                },
                {
                  key: 'skinMatch',
                  labelAr: 'لون البشرة والملامح',
                  labelEn: 'Skin Tone & Proportions',
                },
              ].map((item) => {
                const checked = checklist[item.key as keyof typeof checklist];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleCheck(item.key as keyof typeof checklist)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs text-start transition-all ${
                      checked
                        ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100'
                        : 'bg-slate-900/80 border-white/10 text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                        checked
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-white/20'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-slate-900/80">
          <div className="text-xs text-slate-400">
            {currentCandidate && (
              <span>
                {isAr ? 'البديل المحدد:' : 'Active Selection:'}{' '}
                <strong className="text-cyan-300">{currentCandidate.label}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 rounded-full border-white/15 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </Button>

            {currentCandidate && (
              <Button
                type="button"
                onClick={() => {
                  onSelectCandidate(currentCandidate.id);
                  onClose();
                }}
                className="bubble-btn-emerald h-10 px-6 text-xs font-bold gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'اعتماد هذا البديل كبطل نهائي للقفل ✓'
                    : 'Confirm Winner & Lock Sheet ✓'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
