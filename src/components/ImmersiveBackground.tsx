import { memo, useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';

interface LuminousBubble {
  id: number;
  x: number;
  y: number;
  size: number;
  hue: number;
  layer: 1 | 2 | 3;
  opacity: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

interface StarlightPoint {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

/**
 * Curated peripheral bubble constellation so foreground typography and storybook
 * covers stay crystal clear without noisy center overlap.
 */
const AMBIENT_BUBBLES: LuminousBubble[] = [
  { id: 1, x: 7, y: 14, size: 34, hue: 190, layer: 1, opacity: 0.2, duration: 15, delay: 0, driftX: 10, driftY: 18 },
  { id: 2, x: 90, y: 18, size: 42, hue: 274, layer: 2, opacity: 0.18, duration: 18, delay: -3, driftX: -12, driftY: 22 },
  { id: 3, x: 14, y: 46, size: 22, hue: 330, layer: 2, opacity: 0.17, duration: 14, delay: -6, driftX: 9, driftY: 16 },
  { id: 4, x: 86, y: 52, size: 28, hue: 192, layer: 3, opacity: 0.19, duration: 16, delay: -2, driftX: -11, driftY: 20 },
  { id: 5, x: 6, y: 78, size: 38, hue: 268, layer: 3, opacity: 0.17, duration: 19, delay: -5, driftX: 12, driftY: 24 },
  { id: 6, x: 92, y: 82, size: 30, hue: 328, layer: 1, opacity: 0.18, duration: 17, delay: -4, driftX: -10, driftY: 18 },
  { id: 7, x: 24, y: 9, size: 16, hue: 195, layer: 1, opacity: 0.15, duration: 13, delay: -7, driftX: 8, driftY: 14 },
  { id: 8, x: 76, y: 11, size: 18, hue: 330, layer: 2, opacity: 0.15, duration: 16, delay: -1, driftX: -8, driftY: 15 },
  { id: 9, x: 22, y: 88, size: 20, hue: 190, layer: 2, opacity: 0.16, duration: 15, delay: -8, driftX: 9, driftY: 16 },
  { id: 10, x: 78, y: 90, size: 24, hue: 272, layer: 3, opacity: 0.16, duration: 18, delay: -3.5, driftX: -9, driftY: 18 },
  { id: 11, x: 4, y: 32, size: 14, hue: 190, layer: 1, opacity: 0.14, duration: 12, delay: -4.5, driftX: 6, driftY: 12 },
  { id: 12, x: 95, y: 38, size: 15, hue: 278, layer: 2, opacity: 0.14, duration: 14, delay: -2.5, driftX: -7, driftY: 14 },
  { id: 13, x: 18, y: 66, size: 17, hue: 270, layer: 1, opacity: 0.13, duration: 16, delay: -6.5, driftX: 7, driftY: 14 },
  { id: 14, x: 83, y: 69, size: 19, hue: 190, layer: 3, opacity: 0.15, duration: 17, delay: -9, driftX: -8, driftY: 16 },
];

const STARLIGHT_POINTS: StarlightPoint[] = [
  { id: 1, x: 12, y: 16, size: 2, opacity: 0.32 },
  { id: 2, x: 28, y: 8, size: 1.5, opacity: 0.25 },
  { id: 3, x: 64, y: 12, size: 2, opacity: 0.28 },
  { id: 4, x: 84, y: 24, size: 1.5, opacity: 0.3 },
  { id: 5, x: 9, y: 58, size: 2, opacity: 0.24 },
  { id: 6, x: 91, y: 62, size: 2, opacity: 0.26 },
  { id: 7, x: 19, y: 84, size: 1.5, opacity: 0.24 },
  { id: 8, x: 74, y: 86, size: 2, opacity: 0.28 },
  { id: 9, x: 46, y: 6, size: 1.5, opacity: 0.22 },
  { id: 10, x: 54, y: 92, size: 1.5, opacity: 0.22 },
];

const DARK_BACKDROP = `
  radial-gradient(ellipse 65% 48% at 22% 10%, hsla(268, 66%, 24%, 0.42) 0%, transparent 62%),
  radial-gradient(ellipse 58% 46% at 82% 20%, hsla(194, 92%, 22%, 0.28) 0%, transparent 58%),
  radial-gradient(ellipse 62% 52% at 68% 86%, hsla(326, 68%, 24%, 0.22) 0%, transparent 62%),
  linear-gradient(180deg,
    hsl(228, 56%, 6%) 0%,
    hsl(226, 52%, 8%) 42%,
    hsl(234, 48%, 8%) 74%,
    hsl(252, 46%, 7%) 100%
  )
`;

const LIGHT_BACKDROP = `
  radial-gradient(ellipse 65% 48% at 22% 10%, hsla(268, 60%, 88%, 0.48) 0%, transparent 62%),
  radial-gradient(ellipse 58% 46% at 82% 20%, hsla(194, 82%, 86%, 0.42) 0%, transparent 58%),
  radial-gradient(ellipse 62% 52% at 68% 86%, hsla(326, 62%, 89%, 0.34) 0%, transparent 62%),
  linear-gradient(180deg,
    hsl(214, 44%, 97%) 0%,
    hsl(218, 36%, 96%) 50%,
    hsl(252, 32%, 96%) 100%
  )
`;

const ImmersiveBackground = memo(() => {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const [isTabVisible, setIsTabVisible] = useState(
    () => (typeof document === 'undefined' ? true : !document.hidden)
  );

  useEffect(() => {
    const handleVisibility = () => setIsTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const isMotionActive = !shouldReduceMotion && isTabVisible;

  const { scrollY } = useScroll();
  const smoothScroll = useSpring(scrollY, { stiffness: 45, damping: 22, mass: 0.5 });

  const layer1Y = useTransform(smoothScroll, [0, 1600], [0, -70]);
  const layer2Y = useTransform(smoothScroll, [0, 1600], [0, -130]);
  const layer3Y = useTransform(smoothScroll, [0, 1600], [0, -190]);
  const auroraTopY = useTransform(smoothScroll, [0, 1600], [0, -60]);
  const auroraBottomY = useTransform(smoothScroll, [0, 1600], [0, 90]);

  const layerTransforms = {
    1: layer1Y,
    2: layer2Y,
    3: layer3Y,
  } as const;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none z-0 transition-colors duration-500"
      style={{
        background: isDark ? DARK_BACKDROP : LIGHT_BACKDROP,
      }}
    >
      {/* Subtle Cosmic Aurora Blooms */}
      <motion.div
        className="absolute -top-24 -left-24 w-[520px] h-[520px] rounded-full blur-[130px]"
        style={{
          background: isDark
            ? 'radial-gradient(circle, hsla(190, 100%, 50%, 0.13) 0%, transparent 70%)'
            : 'radial-gradient(circle, hsla(190, 100%, 50%, 0.18) 0%, transparent 70%)',
          y: shouldReduceMotion ? 0 : auroraTopY,
        }}
      />
      <motion.div
        className="absolute top-[28%] -right-28 w-[540px] h-[540px] rounded-full blur-[140px]"
        style={{
          background: isDark
            ? 'radial-gradient(circle, hsla(268, 78%, 62%, 0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, hsla(268, 70%, 72%, 0.16) 0%, transparent 70%)',
          y: shouldReduceMotion ? 0 : auroraBottomY,
        }}
      />
      <motion.div
        className="absolute -bottom-32 left-[18%] w-[480px] h-[480px] rounded-full blur-[135px]"
        style={{
          background: isDark
            ? 'radial-gradient(circle, hsla(330, 86%, 68%, 0.09) 0%, transparent 70%)'
            : 'radial-gradient(circle, hsla(330, 76%, 74%, 0.14) 0%, transparent 70%)',
          y: shouldReduceMotion ? 0 : auroraTopY,
        }}
      />

      {/* Quiet Starlight Dust */}
      {isDark && (
        <div className="absolute inset-0">
          {STARLIGHT_POINTS.map((star) => (
            <span
              key={star.id}
              className="absolute rounded-full bg-cyan-100"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
                boxShadow: '0 0 8px hsla(190, 100%, 80%, 0.45)',
              }}
            />
          ))}
        </div>
      )}

      {/* Three Depth Layers of Gentle Floating Luminous Bubbles */}
      {([1, 2, 3] as const).map((layer) => (
        <motion.div
          key={layer}
          className="absolute inset-0"
          style={{
            y: shouldReduceMotion ? 0 : layerTransforms[layer],
          }}
        >
          {AMBIENT_BUBBLES.filter((b) => b.layer === layer).map((bubble) => {
            const alpha = isDark ? bubble.opacity : bubble.opacity * 1.15;
            const highlightLightness = isDark ? 88 : 66;
            const midLightness = isDark ? 64 : 52;

            return (
              <motion.div
                key={bubble.id}
                className="absolute rounded-full"
                style={{
                  left: `${bubble.x}%`,
                  top: `${bubble.y}%`,
                  width: bubble.size,
                  height: bubble.size,
                  background: `radial-gradient(circle at 30% 28%,
                    hsla(${bubble.hue}, 100%, ${highlightLightness}%, ${alpha * 1.25}),
                    hsla(${bubble.hue}, 92%, ${midLightness}%, ${alpha * 0.55}) 48%,
                    hsla(${bubble.hue + 36}, 82%, 58%, ${alpha * 0.22}) 74%,
                    transparent 100%)`,
                  boxShadow: `inset 0 0 ${Math.round(bubble.size / 3)}px hsla(${bubble.hue}, 100%, 92%, ${alpha * 0.9}), 0 0 ${Math.round(bubble.size * 0.7)}px hsla(${bubble.hue}, 100%, 66%, ${alpha * 0.45})`,
                }}
                animate={
                  isMotionActive
                    ? {
                        x: [0, bubble.driftX, 0, -bubble.driftX * 0.6, 0],
                        y: [0, -bubble.driftY, 0, -bubble.driftY * 0.4, 0],
                      }
                    : { x: 0, y: 0 }
                }
                transition={
                  isMotionActive
                    ? {
                        duration: bubble.duration,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: bubble.delay,
                      }
                    : { duration: 0 }
                }
              >
                <span
                  className="absolute top-[16%] left-[18%] w-[26%] h-[26%] rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.75) 0%, transparent 72%)',
                  }}
                />
              </motion.div>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
});

ImmersiveBackground.displayName = 'ImmersiveBackground';

export default ImmersiveBackground;
