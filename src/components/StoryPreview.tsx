import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Download, RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import BubbleButton from './BubbleButton';
import GlassCard from './GlassCard';

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

const StoryPreview = ({ title, pages, artStyle, format, onBack, onCreateNew }: StoryPreviewProps) => {
  const [currentPage, setCurrentPage] = useState(0);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(pages.length - 1, prev + 1));
  };

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
              className="p-6 md:p-8"
            >
              {/* Page Number */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm text-muted-foreground">Page {currentPage + 1} of {pages.length}</span>
                <span className="px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground capitalize">
                  {pages[currentPage]?.panelLayoutType || 'single'} layout
                </span>
              </div>

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
            </motion.div>

            {/* Navigation Arrows */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              {/* Page dots */}
              <div className="flex items-center gap-1.5">
                {pages.slice(
                  Math.max(0, currentPage - 3),
                  Math.min(pages.length, currentPage + 4)
                ).map((_, idx) => {
                  const actualIdx = Math.max(0, currentPage - 3) + idx;
                  return (
                    <button
                      key={actualIdx}
                      onClick={() => setCurrentPage(actualIdx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        actualIdx === currentPage 
                          ? 'w-6 bg-primary' 
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
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
