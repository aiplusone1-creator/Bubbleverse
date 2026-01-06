import { useEffect, useRef, useMemo, memo, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useMousePosition } from '@/hooks/useMousePosition';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import gsap from 'gsap';

interface ParallaxBubble {
  id: number;
  x: number;
  y: number;
  size: number;
  baseHue: number;
  layer: number; // 1-4, affects parallax speed
  opacity: number;
  glowIntensity: number;
  floatDuration: number; // Animation duration for floating
  floatDelayX: number;
  floatDelayY: number;
  floatRangeX: number;
  floatRangeY: number;
}

const GLOW_RADIUS = 200;
const BUBBLE_COUNT = 40;

const ImmersiveBackground = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useMousePosition();
  const scrollY = useScrollPosition();
  
  // Smooth mouse values for performance
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  // Update mouse motion values
  useEffect(() => {
    mouseX.set(mousePosition.x);
    mouseY.set(mousePosition.y);
  }, [mousePosition, mouseX, mouseY]);

  // Generate bubbles with different layers and float animations
  const bubbles: ParallaxBubble[] = useMemo(() => 
    Array.from({ length: BUBBLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 35 + 10, // Smaller bubbles: 10-45px (was 30-110px)
      baseHue: Math.random() > 0.5 ? 190 + Math.random() * 30 : 270 + Math.random() * 40,
      layer: Math.ceil(Math.random() * 4),
      opacity: 0.15 + Math.random() * 0.25, // More transparent for distant feel
      glowIntensity: 0.15 + Math.random() * 0.2, // Softer glow
      floatDuration: 8 + Math.random() * 12, // 8-20 seconds
      floatDelayX: Math.random() * -10,
      floatDelayY: Math.random() * -10,
      floatRangeX: 10 + Math.random() * 20, // Smaller movement for distant feel
      floatRangeY: 15 + Math.random() * 25,
    })), []
  );

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
      style={{
        background: `
          radial-gradient(ellipse at 30% 20%, hsla(270, 60%, 25%, 0.4) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, hsla(200, 80%, 20%, 0.4) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, hsla(240, 50%, 15%, 0.6) 0%, transparent 70%),
          linear-gradient(180deg, 
            hsl(250, 40%, 8%) 0%, 
            hsl(220, 50%, 12%) 30%,
            hsl(200, 60%, 10%) 60%,
            hsl(270, 50%, 10%) 100%
          )
        `,
      }}
    >
      {/* Liquid gradient overlay that shifts with scroll */}
      <motion.div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, hsla(180, 100%, 50%, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, hsla(280, 100%, 60%, 0.08) 0%, transparent 40%)
          `,
          y: useTransform(useSpring(scrollY, { stiffness: 50, damping: 20 }), [0, 1000], [0, -100]),
        }}
      />

      {/* Parallax Bubble Layers */}
      {bubbles.map((bubble) => (
        <ParallaxBubbleComponent
          key={bubble.id}
          bubble={bubble}
          scrollY={scrollY}
          mouseX={smoothMouseX}
          mouseY={smoothMouseY}
        />
      ))}

      {/* Ambient glow spots that respond to scroll */}
      <motion.div 
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
        style={{
          left: '10%',
          top: '20%',
          background: 'hsla(190, 100%, 50%, 0.12)',
          y: useTransform(useSpring(scrollY, { stiffness: 30, damping: 15 }), [0, 1000], [0, 200]),
        }}
      />
      <motion.div 
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px]"
        style={{
          right: '15%',
          bottom: '30%',
          background: 'hsla(280, 80%, 50%, 0.1)',
          y: useTransform(useSpring(scrollY, { stiffness: 40, damping: 18 }), [0, 1000], [0, 150]),
        }}
      />
    </div>
  );
});

// Individual bubble component for better performance
const ParallaxBubbleComponent = memo(({ 
  bubble, 
  scrollY, 
  mouseX, 
  mouseY 
}: { 
  bubble: ParallaxBubble;
  scrollY: number;
  mouseX: any;
  mouseY: any;
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [isNearMouse, setIsNearMouse] = useState(false);
  const [bubbleCenter, setBubbleCenter] = useState({ x: 0, y: 0 });

  // Calculate parallax offset based on layer (reverse parallax - bubbles move up when scrolling down)
  const parallaxMultiplier = bubble.layer * 0.15;
  const parallaxOffset = -scrollY * parallaxMultiplier;

  // Check if bubble is near mouse
  useEffect(() => {
    const updatePosition = () => {
      if (bubbleRef.current) {
        const rect = bubbleRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        setBubbleCenter({ x: centerX, y: centerY });
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 100);
    return () => clearInterval(interval);
  }, [parallaxOffset]);

  useEffect(() => {
    const unsubX = mouseX.on('change', (latestX: number) => {
      const distance = Math.sqrt(
        Math.pow(latestX - bubbleCenter.x, 2) + 
        Math.pow(mouseY.get() - bubbleCenter.y, 2)
      );
      setIsNearMouse(distance < GLOW_RADIUS);
    });

    return () => unsubX();
  }, [mouseX, mouseY, bubbleCenter]);

  // Animated hue shift when near mouse
  const activeHue = isNearMouse ? (bubble.baseHue > 250 ? 320 : 180) : bubble.baseHue;
  const activeGlow = isNearMouse ? bubble.glowIntensity * 2.5 : bubble.glowIntensity;
  const activeOpacity = isNearMouse ? Math.min(bubble.opacity * 1.5, 0.9) : bubble.opacity;

  return (
    <motion.div
      ref={bubbleRef}
      className="absolute rounded-full"
      style={{
        left: `${bubble.x}%`,
        top: `${bubble.y}%`,
        width: bubble.size,
        height: bubble.size,
        zIndex: bubble.layer,
      }}
      animate={{
        x: [0, bubble.floatRangeX, 0, -bubble.floatRangeX * 0.5, 0],
        y: [parallaxOffset, parallaxOffset - bubble.floatRangeY, parallaxOffset, parallaxOffset - bubble.floatRangeY * 0.3, parallaxOffset],
        background: `radial-gradient(circle at 30% 30%, 
          hsla(${activeHue}, 100%, 85%, ${activeOpacity}), 
          hsla(${activeHue}, 100%, 65%, ${activeOpacity * 0.6}) 40%,
          hsla(${activeHue + 40}, 80%, 55%, ${activeOpacity * 0.3}) 70%,
          transparent 100%)`,
        boxShadow: `
          inset 0 0 ${bubble.size / 3}px hsla(${activeHue}, 100%, 90%, ${activeGlow}),
          0 0 ${bubble.size * activeGlow}px hsla(${activeHue}, 100%, 70%, ${activeGlow * 0.6}),
          0 0 ${bubble.size * activeGlow * 1.5}px hsla(${activeHue + 20}, 100%, 60%, ${activeGlow * 0.3})
        `,
        scale: isNearMouse ? 1.15 : 1,
        rotate: [0, 5, 0, -5, 0],
      }}
      transition={{
        x: {
          duration: bubble.floatDuration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: bubble.floatDelayX,
        },
        y: {
          duration: bubble.floatDuration * 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: bubble.floatDelayY,
        },
        rotate: {
          duration: bubble.floatDuration * 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        background: { duration: 0.3 },
        boxShadow: { duration: 0.3 },
        scale: { type: 'spring', stiffness: 300, damping: 20 },
      }}
    >
      {/* Shine highlight */}
      <div 
        className="absolute top-[15%] left-[15%] w-[25%] h-[25%] rounded-full"
        style={{
          background: `radial-gradient(circle, hsla(0, 0%, 100%, ${isNearMouse ? 0.8 : 0.5}) 0%, transparent 70%)`,
          filter: 'blur(2px)',
        }}
      />
    </motion.div>
  );
});


ImmersiveBackground.displayName = 'ImmersiveBackground';
ParallaxBubbleComponent.displayName = 'ParallaxBubbleComponent';

export default ImmersiveBackground;
