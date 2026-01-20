import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Download, RefreshCw, Sparkles, Lock, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';
import BubbleButton from './BubbleButton';
import GlassCard from './GlassCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StoryPage {
  pageNumber: number;
  sceneDescription: string;
  dialogueText: string;
  panelLayoutType: string;
}

interface StoryPreviewProps {
  title: string;
  pages: StoryPage[];
  artStyle: string;
  format: string;
  onBack: () => void;
  onCreateNew: () => void;
}

// Number of free pages (after cover) that normal users can see
const FREE_PAGES_LIMIT = 3;

const StoryPreview = ({ title, pages, artStyle, format, onBack, onCreateNew }: StoryPreviewProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        setIsAdmin(!!data && !error);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setIsCheckingRole(false);
    }
  };

  // Check if a page is locked for normal users
  const isPageLocked = (pageIndex: number): boolean => {
    if (isAdmin) return false; // Admins can see all pages
    return pageIndex >= FREE_PAGES_LIMIT; // Lock pages after the free limit
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(pages.length - 1, prev + 1));
  };

  const handleUnlockClick = () => {
    toast({
      title: "🔒 Premium Feature",
      description: "Unlock the full story by upgrading to Premium! Coming soon.",
    });
  };

  const currentPageLocked = isPageLocked(currentPage);

  return (
    <section className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-4"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4" />
            Story Created Successfully!
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-magical mb-2">{title}</h1>
          <p className="text-muted-foreground">
            {pages.length} pages • {artStyle} style • {format === 'comic' ? 'Comic Book' : 'Storybook'}
          </p>

          {/* Free preview indicator for non-admins */}
          {!isAdmin && !isCheckingRole && (
            <motion.div 
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Lock className="w-4 h-4" />
              Free Preview: {FREE_PAGES_LIMIT} pages • Upgrade to unlock all {pages.length} pages
            </motion.div>
          )}
        </motion.div>

        {/* Page Carousel */}
        <GlassCard className="mb-8 overflow-hidden">
          <div className="relative min-h-[400px] md:min-h-[500px]">
            {/* Page Content */}
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className={`p-6 md:p-8 relative ${currentPageLocked ? 'select-none' : ''}`}
            >
              {/* Page Number */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm text-muted-foreground">Page {currentPage + 1} of {pages.length}</span>
                <div className="flex items-center gap-2">
                  {currentPageLocked && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-xs text-amber-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground capitalize">
                    {pages[currentPage]?.panelLayoutType || 'single'} layout
                  </span>
                </div>
              </div>

              {/* Content wrapper with blur for locked pages */}
              <div className={`transition-all duration-300 ${currentPageLocked ? 'blur-xl pointer-events-none' : ''}`}>
                {/* Scene Description (for illustration) */}
                <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <h3 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                    <span className="text-lg">🎨</span> Scene Description
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {pages[currentPage]?.sceneDescription}
                  </p>
                </div>

                {/* Dialogue / Text */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <h3 className="text-sm font-medium text-secondary mb-2 flex items-center gap-2">
                    <span className="text-lg">💬</span> Story Text
                  </h3>
                  <p className="text-foreground text-lg leading-relaxed font-medium">
                    {pages[currentPage]?.dialogueText}
                  </p>
                </div>
              </div>

              {/* Lock Overlay for locked pages */}
              {currentPageLocked && (
                <motion.div 
                  className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <motion.div
                      className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Lock className="w-8 h-8 text-amber-500" />
                    </motion.div>
                    
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-foreground mb-2">Page Locked</h3>
                      <p className="text-muted-foreground text-sm max-w-xs">
                        Upgrade to Premium to unlock all {pages.length} pages of this magical story!
                      </p>
                    </div>
                    
                    <BubbleButton onClick={handleUnlockClick} className="mt-2">
                      <Crown className="w-5 h-5 mr-2" />
                      Unlock Full Story
                    </BubbleButton>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>

            {/* Navigation Arrows */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4 z-20">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              {/* Page dots with lock indicators */}
              <div className="flex items-center gap-1.5">
                {pages.slice(
                  Math.max(0, currentPage - 3),
                  Math.min(pages.length, currentPage + 4)
                ).map((_, idx) => {
                  const actualIdx = Math.max(0, currentPage - 3) + idx;
                  const pageLocked = isPageLocked(actualIdx);
                  return (
                    <button
                      key={actualIdx}
                      onClick={() => setCurrentPage(actualIdx)}
                      className={`relative w-2 h-2 rounded-full transition-all ${
                        actualIdx === currentPage 
                          ? `w-6 ${pageLocked ? 'bg-amber-500' : 'bg-primary'}` 
                          : pageLocked 
                            ? 'bg-amber-500/30 hover:bg-amber-500/50'
                            : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      title={pageLocked ? 'Locked Page' : `Page ${actualIdx + 1}`}
                    />
                  );
                })}
              </div>
              
              <button
                onClick={handleNextPage}
                disabled={currentPage === pages.length - 1}
                className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <BubbleButton variant="outline" onClick={onBack}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </BubbleButton>
          
          <BubbleButton variant="secondary" onClick={onCreateNew}>
            <RefreshCw className="w-5 h-5 mr-2" />
            Create Another Story
          </BubbleButton>
          
          <BubbleButton>
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </BubbleButton>
        </div>

        {/* Upgrade CTA for non-admins */}
        {!isAdmin && !isCheckingRole && (
          <motion.div 
            className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Crown className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-foreground mb-2">Unlock the Full Adventure!</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              You're viewing a preview of your story. Upgrade to Premium to unlock all {pages.length} pages, 
              download as PDF, and access exclusive features!
            </p>
            <BubbleButton onClick={handleUnlockClick}>
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Premium
            </BubbleButton>
          </motion.div>
        )}

        {/* Note about images */}
        <motion.p 
          className="text-center text-muted-foreground text-sm mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          💡 Image generation for each page will be available in the next update!
        </motion.p>
      </div>
    </section>
  );
};

export default StoryPreview;
