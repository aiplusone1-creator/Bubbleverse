import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Sparkles, ArrowRight, Wrench, Stethoscope, FlaskConical, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { getShowcaseConfig } from '@/features/showcase/showcaseConfig';

export default function CareerAdventuresBanner() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [config] = useState(() => getShowcaseConfig());
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);

  const currentRole = config.careerRoles[selectedRoleIndex] || config.careerRoles[0];

  const roleIcons = [Rocket, Wrench, Stethoscope, FlaskConical];

  return (
    <section className="py-12 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950/70 to-slate-900 border border-purple-500/30 p-6 sm:p-12 shadow-2xl">
          {/* Subtle Ambient Background Light */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Content (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-center sm:text-start">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-semibold">
                <Award className="w-4 h-4 text-cyan-400" />
                <span>{language === 'ar' ? 'سلسلة مهن المستقبل والأحلام' : 'Future Career Dreams Series'}</span>
              </div>

              <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-editorial leading-tight text-white">
                {language === 'ar' ? config.careerTitleAr : config.careerTitleEn}
              </h2>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                {language === 'ar' ? config.careerSubtitleAr : config.careerSubtitleEn}
              </p>

              {/* Career Selection Tabs */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
                {config.careerRoles.map((role, idx) => {
                  const Icon = roleIcons[idx % roleIcons.length];
                  const isSelected = selectedRoleIndex === idx;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRoleIndex(idx)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_15px_rgba(0,217,255,0.4)] scale-105'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? role.roleAr : role.roleEn}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Role Description Box */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentRole.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600 text-white text-[10px] font-semibold">
                      {language === 'ar' ? (currentRole.badgeAr || currentRole.badge.split('•')[0].trim()) : (currentRole.badgeEn || currentRole.badge.split('•')[1]?.trim() || currentRole.badge)}
                    </Badge>
                    <span className="text-xs font-bold text-white">
                      {language === 'ar' ? currentRole.titleAr : currentRole.titleEn}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === 'ar' ? currentRole.descAr : currentRole.descEn}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* CTA Action Button */}
              <div className="pt-2 flex justify-center sm:justify-start">
                <Button
                  onClick={() => navigate('/stories')}
                  className="bubble-btn bubble-btn-primary px-6 h-12 text-xs sm:text-sm font-bold shadow-xl"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'استكشف قصص المهن وبطولات المستقبل' : 'Explore Dream Career Stories'}
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </div>
            </div>

            {/* Right Visual Card (5 cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-purple-500/40 shadow-2xl p-2 group">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentRole.image}
                    src={currentRole.image}
                    alt={currentRole.titleAr}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </AnimatePresence>

                {/* Overlaid Title Banner */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-center shadow-lg">
                  <span className="text-xs font-bold text-white block">
                    {language === 'ar' ? currentRole.titleAr : currentRole.titleEn}
                  </span>
                  <span className="text-[11px] text-cyan-400 font-medium">
                    {language === 'ar' ? 'بطل القصة بالاسم وملامح الوجه' : 'Starring Your Child’s Name & Likeness'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
