import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';

/**
 * Bubbleverse Logo — Premium Whimsical Editorial Redesign
 * - Iridescent soap-bubble mark with Starlight Gold, Pearl Lavender, and Mist Blue reflections
 * - Refined editorial typography with gentle starlight shimmer
 * - Fully respects prefers-reduced-motion
 */
const BubbleverseLogo = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const shouldReduceMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      className="flex items-center gap-2.5 sm:gap-3 select-none"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Mark */}
      <motion.div
        className="relative w-9 h-9 sm:w-11 sm:h-11 shrink-0"
        animate={shouldReduceMotion ? {} : { y: [0, -2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Ambient warm starlight & lavender glow halo */}
        <div
          className="absolute -inset-1.5 rounded-full blur-lg opacity-60"
          style={{
            background:
              'radial-gradient(circle, hsla(37,91%,55%,.35) 0%, hsla(262,48%,81%,.3) 50%, transparent 75%)',
          }}
        />

        {/* Orbiting celestial satellites */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            >
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-200/90 shadow-[0_0_8px_hsla(37,91%,65%,.9)]" />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-200/80 shadow-[0_0_6px_hsla(331,46%,82%,.9)]" />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: -360 }}
              transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            >
              <span className="absolute top-1/2 left-0 -translate-y-1/2 w-1 h-1 rounded-full bg-violet-200/80 shadow-[0_0_6px_hsla(262,48%,81%,.9)]" />
            </motion.div>
          </>
        )}

        {/* Soap bubble body */}
        <div
          className="absolute inset-1 rounded-full overflow-hidden"
          style={{
            background: isDark
              ? 'radial-gradient(circle at 32% 28%, hsla(0,0%,100%,.95), hsla(37,91%,65%,.75) 25%, hsla(262,48%,75%,.65) 55%, hsla(331,46%,75%,.5) 80%, hsla(234,34%,15%,.7) 100%)'
              : 'radial-gradient(circle at 32% 28%, hsla(0,0%,100%,.95), hsla(37,91%,60%,.65) 25%, hsla(262,45%,65%,.6) 55%, hsla(331,45%,70%,.45) 80%, hsla(40,33%,90%,.6) 100%)',
            boxShadow: isDark
              ? 'inset 0 0 14px hsla(0,0%,100%,.3), inset -4px -6px 14px hsla(234,34%,20%,.6), 0 6px 20px hsla(37,91%,55%,.25)'
              : 'inset 0 0 14px hsla(0,0%,100%,.55), inset -4px -6px 14px hsla(262,45%,60%,.25), 0 6px 20px hsla(37,91%,45%,.2)',
          }}
        >
          {/* Subtle iridescent sheen */}
          {!shouldReduceMotion && (
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(120deg, transparent 30%, hsla(0,0%,100%,.4) 50%, transparent 70%)',
                mixBlendMode: 'overlay',
              }}
              animate={{ x: ['-60%', '60%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {/* Refraction rim */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: 'inset 0 0 0 1px hsla(0,0%,100%,.4)',
            }}
          />
          {/* Primary specular highlight */}
          <div className="absolute top-1.5 left-1.5 w-2.5 h-1.5 rounded-full bg-white/90 blur-[1px] rotate-[-20deg]" />
          <div className="absolute top-2.5 left-2 w-1 h-1 rounded-full bg-white/95" />
        </div>
      </motion.div>

      {/* Wordmark */}
      <div className="relative leading-none">
        <motion.h1
          className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight"
          style={{ letterSpacing: '-0.025em' }}
        >
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: isDark
                ? 'linear-gradient(120deg, hsl(37,91%,60%) 0%, hsl(262,48%,81%) 55%, hsl(331,46%,82%) 100%)'
                : 'linear-gradient(120deg, hsl(37,95%,44%) 0%, hsl(262,45%,58%) 55%, hsl(331,45%,60%) 100%)',
            }}
          >
            Bubble
          </span>
          <span className={isDark ? 'text-foreground' : 'text-slate-900'}>verse</span>
        </motion.h1>
        {/* Tagline rule */}
        <div className="mt-1 flex items-center gap-1.5">
          <span className="h-px w-5 sm:w-6 bg-gradient-to-r from-amber-400/80 to-purple-400/80" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
            stories in bubbles
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default BubbleverseLogo;
