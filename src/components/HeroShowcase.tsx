import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface ShowcaseImage {
  id: string;
  image_url: string;
  alt_text: string | null;
}

const HeroShowcase = () => {
  const [images, setImages] = useState<ShowcaseImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShowcaseImages = async () => {
      const { data, error } = await supabase
        .from('showcase_images')
        .select('id, image_url, alt_text')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setImages(data);
      }
      setLoading(false);
    };

    fetchShowcaseImages();
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  if (loading || images.length === 0) {
    return null;
  }

  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none">
      <div className="relative w-64 h-80">
        <AnimatePresence mode="wait">
          <motion.div
            key={images[currentIndex]?.id}
            initial={{ opacity: 0, y: 20, rotateY: -10 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              rotateY: 0,
            }}
            exit={{ opacity: 0, y: -20, rotateY: 10 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <motion.div
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              className="relative w-full h-full"
            >
              <div className="glass-card overflow-hidden rounded-2xl shadow-2xl transform perspective-1000">
                <img
                  src={images[currentIndex]?.image_url}
                  alt={images[currentIndex]?.alt_text || 'Story example'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
              </div>
              
              {/* Floating glow effect */}
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full -z-10" />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Image indicators */}
        {images.length > 1 && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex 
                    ? 'bg-primary w-6' 
                    : 'bg-primary/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroShowcase;
