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
    <>
      {/* Multiple floating bubbles scattered across the background */}
      {images.map((image, idx) => {
        const positions = [
          { left: '5%', top: '15%', size: 'w-32 h-32', delay: 0 },
          { right: '8%', top: '20%', size: 'w-40 h-40', delay: 1 },
          { left: '12%', bottom: '25%', size: 'w-28 h-28', delay: 2 },
          { right: '15%', bottom: '30%', size: 'w-36 h-36', delay: 0.5 },
          { left: '3%', top: '50%', size: 'w-24 h-24', delay: 1.5 },
        ];
        
        const pos = positions[idx % positions.length];
        const isActive = idx === currentIndex;
        
        return (
          <motion.div
            key={image.id}
            className={`fixed pointer-events-none hidden lg:block ${pos.size}`}
            style={{
              left: pos.left,
              right: pos.right,
              top: pos.top,
              bottom: pos.bottom,
              zIndex: 1,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: isActive ? 0.4 : 0.15,
              scale: isActive ? 1 : 0.85,
            }}
            transition={{ 
              duration: 1.5, 
              delay: pos.delay,
              ease: 'easeInOut' 
            }}
          >
            {/* Floating animation */}
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                x: [0, 10, 0],
                rotate: [0, 5, 0],
              }}
              transition={{ 
                duration: 6 + idx * 0.5, 
                repeat: Infinity, 
                ease: 'easeInOut',
                delay: pos.delay,
              }}
              className="relative w-full h-full"
            >
              {/* Bubble container */}
              <div className="relative w-full h-full rounded-full overflow-hidden">
                {/* Outer glow ring */}
                <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/30 via-purple-500/20 to-pink-500/30 blur-xl animate-pulse" />
                
                {/* Glass bubble effect */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)',
                    backdropFilter: 'blur(8px)',
                  }}
                />
                
                {/* Image inside bubble */}
                <div className="absolute inset-2 rounded-full overflow-hidden">
                  <img
                    src={image.image_url}
                    alt={image.alt_text || 'Story example'}
                    className="w-full h-full object-cover opacity-70 blur-[1px]"
                  />
                  {/* Gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20" />
                </div>
                
                {/* Bubble shine effect */}
                <div 
                  className="absolute top-2 left-3 w-1/3 h-1/4 rounded-full opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 100%)',
                  }}
                />
                
                {/* Secondary shine */}
                <div 
                  className="absolute bottom-4 right-4 w-1/5 h-1/6 rounded-full opacity-30"
                  style={{
                    background: 'linear-gradient(315deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
                  }}
                />
                
                {/* Inner shadow for depth */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    boxShadow: 'inset 0 -20px 40px rgba(0,0,0,0.2), inset 0 10px 20px rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        );
      })}
      
      {/* Decorative empty bubbles */}
      {[
        { left: '25%', top: '10%', size: 16, delay: 0.3 },
        { right: '30%', top: '35%', size: 12, delay: 0.8 },
        { left: '8%', bottom: '15%', size: 20, delay: 1.2 },
        { right: '5%', bottom: '45%', size: 14, delay: 0.6 },
      ].map((bubble, idx) => (
        <motion.div
          key={`empty-${idx}`}
          className="fixed pointer-events-none hidden lg:block rounded-full"
          style={{
            left: bubble.left,
            right: bubble.right,
            top: bubble.top,
            bottom: bubble.bottom,
            width: bubble.size,
            height: bubble.size,
            background: 'linear-gradient(135deg, rgba(var(--primary), 0.15) 0%, rgba(var(--primary), 0.05) 100%)',
            border: '1px solid rgba(var(--primary), 0.2)',
            zIndex: 1,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 0.4,
            scale: 1,
            y: [0, -15, 0],
          }}
          transition={{ 
            opacity: { duration: 1, delay: bubble.delay },
            scale: { duration: 1, delay: bubble.delay },
            y: { duration: 5 + idx, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      ))}
    </>
  );
};

export default HeroShowcase;
