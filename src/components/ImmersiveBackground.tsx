import { useEffect, useRef, useMemo, memo, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';
import { useMousePosition } from '@/hooks/useMousePosition';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useTheme } from 'next-themes';

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
  const shouldReduceMotion = Boolean(useReducedMotion());
  const mousePosition = useMousePosition({ enabled: !shouldReduceMotion });
  const scrollY = useScrollPosition({ enabled: !shouldReduceMotion });
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  // Smooth mouse values for performance
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  // Update mouse motion values
  useEffect(() => {
    if (shouldReduceMotion) return;
    mouseX.set(mousePosition.x);
    mouseY.set(mousePosition.y);
  }, [mousePosition, mouseX, mouseY, shouldReduceMotion]);

  // Generate bubbles with different layers and float animations
  const bubbles: ParallaxBubble[] = useMemo(() => 
    Array.from({ length: BUBBLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 35 + 10, // Smaller bubbles: 10-45px (was 30-110px)
      baseHue: Math.random() > 0.6 ? 37 + Math.random() * 15 : (Math.random() > 0.5 ? 262 + Math.random() * 25 : 196 + Math.random() * 25),
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

  // Theme-aware background colors — Premium Whimsical Editorial Foundation
  const darkBackground = `
    radial-gradient(ellipse at 30% 15%, hsla(262, 48%, 20%, 0.45) 0%, transparent 55%),
    radial-gradient(ellipse at 75% 75%, hsla(37, 91%, 20%, 0.25) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 45%, hsla(234, 34%, 15%, 0.7) 0%, transparent 70%),
    linear-gradient(180deg, 
      hsl(224, 37%, 8%) 0%, 
      hsl(234, 34%, 13%) 35%,
      hsl(234, 34%, 11%) 70%,
      hsl(224, 37%, 8%) 100%
    )
  `;

  const lightBackground = `
    radial-gradient(ellipse at 30% 15%, hsla(262, 45%, 90%, 0.6) 0%, transparent 55%),
    radial-gradient(ellipse at 75% 75%, hsla(37, 95%, 88%, 0.45) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 45%, hsla(40, 100%, 99%, 0.8) 0%, transparent 70%),
    linear-gradient(180deg, 
      hsl(40, 33%, 97%) 0%, 
      hsl(40, 30%, 95%) 35%,
      hsl(40, 25%, 94%) 70%,
      hsl(40, 33%, 97%) 100%
    )
  `;

  const scrollSpring1 = useSpring(scrollY, { stiffness: 50, damping: 20 });
  const scrollSpring2 = useSpring(scrollY, { stiffness: 30, damping: 15 });
  const scrollSpring3 = useSpring(scrollY, { stiffness: 40, damping: 18 });
  const bgTransform1 = useTransform(scrollSpring1, [0, 1000], [0, -100]);
  const bgTransform2 = useTransform(scrollSpring2, [0, 1000], [0, 200]);
  const bgTransform3 = useTransform(scrollSpring3, [0, 1000], [0, 150]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-0 transition-all duration-500"
      style={{
        background: isDark ? darkBackground : lightBackground,
      }}
    >
      {/* Liquid gradient overlay that shifts with scroll */}
      <motion.div 
        className="absolute inset-0"
        style={{
          background: isDark 
            ? `radial-gradient(circle at 20% 30%, hsla(180, 100%, 50%, 0.08) 0%, transparent 40%),
               radial-gradient(circle at 80% 70%, hsla(280, 100%, 60%, 0.08) 0%, transparent 40%)`
            : `radial-gradient(circle at 20% 30%, hsla(180, 100%, 50%, 0.15) 0%, transparent 40%),
               radial-gradient(circle at 80% 70%, hsla(280, 100%, 60%, 0.12) 0%, transparent 40%)`,
          y: shouldReduceMotion ? 0 : bgTransform1,
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
          isDark={isDark}
          shouldReduceMotion={shouldReduceMotion}
        />
      ))}

      {/* Ambient glow spots that respond to scroll */}
      <motion.div 
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] transition-colors duration-500"
        style={{
          left: '10%',
          top: '20%',
          background: isDark ? 'hsla(37, 91%, 55%, 0.08)' : 'hsla(37, 95%, 45%, 0.1)',
          y: shouldReduceMotion ? 0 : bgTransform2,
        }}
      />
      <motion.div 
        className="absolute w-[500px] h-[500px] rounded-full blur-[100px] transition-colors duration-500"
        style={{
          right: '15%',
          bottom: '30%',
          background: isDark ? 'hsla(262, 48%, 81%, 0.08)' : 'hsla(262, 45%, 58%, 0.08)',
          y: shouldReduceMotion ? 0 : bgTransform3,
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
  mouseY,
  isDark,
  shouldReduceMotion = false
}: { 
  bubble: ParallaxBubble;
  scrollY: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  isDark: boolean;
  shouldReduceMotion?: boolean;
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [isNearMouse, setIsNearMouse] = useState(false);
  const [bubbleCenter, setBubbleCenter] = useState({ x: 0, y: 0 });

  // Calculate parallax offset based on layer (reverse parallax - bubbles move up when scrolling down)
  const parallaxMultiplier = bubble.layer * 0.15;
  const parallaxOffset = shouldReduceMotion ? 0 : -scrollY * parallaxMultiplier;

  // Check if bubble is near mouse - completely disabled when motion is reduced
  useEffect(() => {
    if (shouldReduceMotion) return;
    const updatePosition = () => {
      if (bubbleRef.current) {
        const rect = bubbleRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        setBubbleCenter({ x: centerX, y: centerY });
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 250);
    return () => clearInterval(interval);
  }, [parallaxOffset, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) {
      setIsNearMouse(false);
      return;
    }
    const unsubX = mouseX.on('change', (latestX: number) => {
      const distance = Math.sqrt(
        Math.pow(latestX - bubbleCenter.x, 2) + 
        Math.pow(mouseY.get() - bubbleCenter.y, 2)
      );
      setIsNearMouse(distance < GLOW_RADIUS);
    });

    return () => unsubX();
  }, [mouseX, mouseY, bubbleCenter, shouldReduceMotion]);

  // Animated hue shift when near mouse - adjust for light/dark mode
  const activeHue = isNearMouse ? (bubble.baseHue > 250 ? 320 : 180) : bubble.baseHue;
  const activeGlow = isNearMouse ? bubble.glowIntensity * 2.5 : bubble.glowIntensity;
  const activeOpacity = isNearMouse ? Math.min(bubble.opacity * 1.5, 0.9) : bubble.opacity;
  const baseOpacity = isDark ? activeOpacity : activeOpacity * 1.3;
  const baseLightness = isDark ? 85 : 60;
  const midLightness = isDark ? 65 : 50;
  const outerLightness = isDark ? 55 : 45;

  return (
    <motion.div
      ref={bubbleRef}
      className="absolute rounded-full transition-colors duration-500"
      style={{
        left: `${bubble.x}%`,
        top: `${bubble.y}%`,
        width: bubble.size,
        height: bubble.size,
        zIndex: bubble.layer,
      }}
      animate={shouldReduceMotion ? {
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
        background: `radial-gradient(circle at 30% 30%, 
          hsla(${bubble.baseHue}, 100%, ${baseLightness}%, ${baseOpacity}), 
          hsla(${bubble.baseHue}, 100%, ${midLightness}%, ${baseOpacity * 0.6}) 40%,
          hsla(${bubble.baseHue + 40}, 80%, ${outerLightness}%, ${baseOpacity * 0.3}) 70%,
          transparent 100%)`,
        boxShadow: `
          inset 0 0 ${bubble.size / 3}px hsla(${bubble.baseHue}, 100%, 90%, ${bubble.glowIntensity}),
          0 0 ${bubble.size * bubble.glowIntensity}px hsla(${bubble.baseHue}, 100%, 70%, ${bubble.glowIntensity * 0.6})
        `,
      } : {
        x: [0, bubble.floatRangeX, 0, -bubble.floatRangeX * 0.5, 0],
        y: [parallaxOffset, parallaxOffset - bubble.floatRangeY, parallaxOffset, parallaxOffset - bubble.floatRangeY * 0.3, parallaxOffset],
        background: `radial-gradient(circle at 30% 30%, 
          hsla(${activeHue}, 100%, ${baseLightness}%, ${baseOpacity}), 
          hsla(${activeHue}, 100%, ${midLightness}%, ${baseOpacity * 0.6}) 40%,
          hsla(${activeHue + 40}, 80%, ${outerLightness}%, ${baseOpacity * 0.3}) 70%,
          transparent 100%)`,
        boxShadow: `
          inset 0 0 ${bubble.size / 3}px hsla(${activeHue}, 100%, 90%, ${activeGlow}),
          0 0 ${bubble.size * activeGlow}px hsla(${activeHue}, 100%, 70%, ${activeGlow * 0.6}),
          0 0 ${bubble.size * activeGlow * 1.5}px hsla(${activeHue + 20}, 100%, 60%, ${activeGlow * 0.3})
        `,
        scale: isNearMouse ? 1.15 : 1,
        rotate: [0, 5, 0, -5, 0],
      }}
      transition={shouldReduceMotion ? { duration: 0 } : {
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
