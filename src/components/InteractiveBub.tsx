import { memo, useEffect, useRef, useState } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type AnimationPlaybackControls,
} from 'framer-motion';
import { useTheme } from 'next-themes';

const BUB_CHASE_SIZE = 48;
const CURSOR_OFFSET_X = 28;
const CURSOR_OFFSET_Y = 24;
const VIEWPORT_PADDING = 12;

function getInitialCornerPosition(): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return { x: 24, y: 24 };
  }
  const isRtl = document.documentElement.dir === 'rtl';
  const x = isRtl ? 28 : Math.max(VIEWPORT_PADDING, window.innerWidth - BUB_CHASE_SIZE - 28);
  const y = Math.max(VIEWPORT_PADDING, window.innerHeight - BUB_CHASE_SIZE - 36);
  return { x, y };
}

function clampToViewport(x: number, y: number): { x: number; y: number } {
  const maxX = Math.max(VIEWPORT_PADDING, window.innerWidth - BUB_CHASE_SIZE - VIEWPORT_PADDING);
  const maxY = Math.max(VIEWPORT_PADDING, window.innerHeight - BUB_CHASE_SIZE - VIEWPORT_PADDING);
  return {
    x: Math.min(Math.max(x, VIEWPORT_PADDING), maxX),
    y: Math.min(Math.max(y, VIEWPORT_PADDING), maxY),
  };
}

/**
 * InteractiveBub — Playful mouse-chasing iridescent companion orb.
 * - On fine-pointer desktop devices (when Reduced Motion is off): smoothly chases
 *   the cursor across the viewport with elastic Framer Motion springs (`useMotionValue` +
 *   `useSpring`, zero per-frame React setState), offset ~30px from the cursor tip and
 *   strictly `pointer-events-none` so it never blocks UI clicks or obscures text.
 * - Gives a joyful squash-pop + iridescent sparkle ring pulse whenever the user clicks.
 * - Gracefully pauses in hidden tabs and falls back to a calm corner anchor on touch
 *   devices (cleared above the mobile sticky buy bar `bottom-24`) or under Reduced Motion.
 */
const InteractiveBub = memo(() => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const shouldReduceMotion = Boolean(useReducedMotion());

  const [isTabVisible, setIsTabVisible] = useState(
    () => (typeof document === 'undefined' ? true : !document.hidden)
  );
  const [hasFinePointer, setHasFinePointer] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
      : false
  );

  const hasMovedRef = useRef(false);
  const activeAnimationsRef = useRef<AnimationPlaybackControls[]>([]);

  const initialPos = useRef(getInitialCornerPosition());
  const targetX = useMotionValue(initialPos.current.x);
  const targetY = useMotionValue(initialPos.current.y);

  const smoothX = useSpring(targetX, { stiffness: 155, damping: 16, mass: 0.55 });
  const smoothY = useSpring(targetY, { stiffness: 155, damping: 16, mass: 0.55 });

  // Playful velocity-driven lean as Bub chases the pointer
  const velocityX = useVelocity(smoothX);
  const rawTilt = useTransform(velocityX, [-1200, 0, 1200], [-14, 0, 14]);
  const smoothTilt = useSpring(rawTilt, { stiffness: 220, damping: 22 });

  // Click-reaction squash-and-pop + sparkle ring (all MotionValues, zero React re-renders)
  const popScale = useMotionValue(1);
  const sparkleScale = useMotionValue(0.75);
  const sparkleOpacity = useMotionValue(0);

  useEffect(() => {
    const handleVisibility = () => setIsTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setHasFinePointer(event.matches);
    };
    setHasFinePointer(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  const isMotionActive = !shouldReduceMotion && isTabVisible;
  const isChaseMode = hasFinePointer && !shouldReduceMotion;

  useEffect(() => {
    const stopActiveAnimations = () => {
      activeAnimationsRef.current.forEach((ctrl) => ctrl.stop());
      activeAnimationsRef.current = [];
    };

    if (!isChaseMode || !isTabVisible) {
      stopActiveAnimations();
      popScale.set(1);
      sparkleOpacity.set(0);
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      hasMovedRef.current = true;

      let nextX = event.clientX + CURSOR_OFFSET_X;
      let nextY = event.clientY + CURSOR_OFFSET_Y;

      // Flip neatly to the opposite side of the cursor near viewport edges
      if (nextX + BUB_CHASE_SIZE > window.innerWidth - VIEWPORT_PADDING) {
        nextX = event.clientX - BUB_CHASE_SIZE - 20;
      }
      if (nextY + BUB_CHASE_SIZE > window.innerHeight - VIEWPORT_PADDING) {
        nextY = event.clientY - BUB_CHASE_SIZE - 18;
      }

      const clamped = clampToViewport(nextX, nextY);
      targetX.set(clamped.x);
      targetY.set(clamped.y);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      stopActiveAnimations();

      const squashCtrl = animate(popScale, [1, 0.8, 1.24, 0.96, 1], {
        duration: 0.42,
        ease: [0.23, 1, 0.32, 1],
      });
      const ringScaleCtrl = animate(sparkleScale, [0.75, 1.85], {
        duration: 0.45,
        ease: 'easeOut',
      });
      const ringOpacityCtrl = animate(sparkleOpacity, [0.75, 0], {
        duration: 0.45,
        ease: 'easeOut',
      });

      activeAnimationsRef.current = [squashCtrl, ringScaleCtrl, ringOpacityCtrl];
    };

    const handleResize = () => {
      if (!hasMovedRef.current) {
        const corner = getInitialCornerPosition();
        targetX.set(corner.x);
        targetY.set(corner.y);
      } else {
        const clamped = clampToViewport(targetX.get(), targetY.get());
        targetX.set(clamped.x);
        targetY.set(clamped.y);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
      stopActiveAnimations();
    };
  }, [isChaseMode, isTabVisible, popScale, sparkleOpacity, sparkleScale, targetX, targetY]);

  const bubbleVisual = (
    <motion.div
      className="relative w-full h-full"
      style={isChaseMode ? { scale: popScale } : undefined}
      animate={
        isMotionActive
          ? isChaseMode
            ? { y: [0, -6, 0] }
            : { y: [0, -6, 0], scale: [1, 1.03, 1] }
          : isChaseMode
            ? { y: 0 }
            : { y: 0, scale: 1 }
      }
      transition={
        isMotionActive
          ? {
              duration: 3.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : { duration: 0 }
      }
    >
      {/* Click-Sparkle Ripple Ring (desktop chase mode) */}
      {isChaseMode && (
        <motion.div
          className="absolute -inset-1 rounded-full border-2 border-cyan-300/80 pointer-events-none"
          style={{
            scale: sparkleScale,
            opacity: sparkleOpacity,
            boxShadow: '0 0 18px rgba(0, 217, 255, 0.55)',
          }}
        />
      )}

      {/* Soft Iridescent Halo */}
      <motion.div
        className="absolute -inset-2.5 rounded-full blur-xl opacity-60 pointer-events-none"
        style={{
          background:
            'conic-gradient(from 0deg, hsla(190,100%,65%,0.6), hsla(268,85%,70%,0.55), hsla(330,90%,72%,0.5), hsla(190,100%,65%,0.6))',
        }}
        animate={isMotionActive ? { rotate: 360 } : { rotate: 0 }}
        transition={
          isMotionActive
            ? { duration: 14, repeat: Infinity, ease: 'linear' }
            : { duration: 0 }
        }
      />

      {/* Soap Bubble Body */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 32% 26%, hsla(0,0%,100%,0.96) 0%, hsla(190,100%,82%,0.82) 24%, hsla(268,86%,72%,0.68) 54%, hsla(330,90%,72%,0.58) 78%, hsla(226,75%,34%,0.68) 100%)',
          boxShadow: isDark
            ? 'inset 0 0 22px hsla(0,0%,100%,0.38), inset -8px -10px 22px hsla(268,75%,38%,0.52), 0 12px 32px hsla(190,100%,52%,0.34)'
            : 'inset 0 0 22px hsla(0,0%,100%,0.55), inset -8px -10px 22px hsla(268,75%,42%,0.36), 0 12px 30px hsla(190,100%,50%,0.28)',
        }}
      >
        {/* Thin Film Rim */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: 'inset 0 0 0 1.5px hsla(0,0%,100%,0.42)' }}
        />

        {/* Specular Highlights */}
        <div className="absolute top-1.5 left-2.5 w-4 sm:w-5 h-2 sm:h-2.5 rounded-full bg-white/90 blur-[1.5px] -rotate-[22deg]" />
        <div className="absolute top-3 left-4.5 sm:top-3.5 sm:left-5 w-1.5 h-1.5 rounded-full bg-white/95" />
        <div className="absolute bottom-2 right-3 w-5 h-1.5 rounded-full bg-white/25 blur-sm" />
      </div>
    </motion.div>
  );

  // Desktop fine-pointer elastic cursor-chasing tracker
  if (isChaseMode) {
    return (
      <motion.div
        aria-hidden="true"
        data-bub-mode="chase"
        className="fixed top-0 left-0 z-40 pointer-events-none select-none w-12 h-12 will-change-transform"
        style={{
          x: smoothX,
          y: smoothY,
          rotate: smoothTilt,
        }}
      >
        {bubbleVisual}
      </motion.div>
    );
  }

  // Graceful fallback for touch-only mobile devices (cleared above sticky buy bar) & Reduced Motion
  return (
    <div
      aria-hidden="true"
      data-bub-mode={shouldReduceMotion ? 'reduced' : 'anchor'}
      className="fixed bottom-24 lg:bottom-6 end-4 sm:end-6 z-30 pointer-events-none select-none w-11 h-11 sm:w-14 sm:h-14"
    >
      {bubbleVisual}
    </div>
  );
});

InteractiveBub.displayName = 'InteractiveBub';

export default InteractiveBub;
