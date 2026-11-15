import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';

/**
 * Bubbleverse Logo — Restored Original Magical Identity
 * - Iridescent soap-bubble mark with vibrant Cyan, Purple, and Pink reflections
 * - Preserves responsive hierarchy (320px..1280px) and prefers-reduced-motion
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
        {/* Ambient vibrant cyan/purple/pink glow halo */}
        <div
          className="absolute -inset-1.5 rounded-full blur-lg opacity-70"
          style={{
            background:
              'conic-gradient(from 0deg, hsla(190,100%,70%,.7), hsla(280,90%,70%,.7), hsla(330,100%,75%,.6), hsla(190,100%,70%,.7))',
          }}
        />

        {/* Orbiting micro-bubbles */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            >
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-200/90 shadow-[0_0_8px_hsla(190,100%,80%,.9)]" />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-fuchsia-200/80 shadow-[0_0_6px_hsla(300,100%,80%,.9)]" />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <span className="absolute top-1/2 left-0 -translate-y-1/2 w-1 h-1 rounded-full bg-violet-200/80 shadow-[0_0_6px_hsla(270,100%,80%,.9)]" />
            </motion.div>
          </>
        )}

        {/* Soap bubble body */}
        <div
          className="absolute inset-1 rounded-full overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, hsla(0,0%,100%,.95), hsla(190,100%,75%,.85) 28%, hsla(260,90%,70%,.75) 55%, hsla(320,90%,70%,.6) 78%, hsla(220,80%,40%,.7) 100%)',
            boxShadow: isDark
              ? 'inset 0 0 16px hsla(0,0%,100%,.35), inset -4px -6px 14px hsla(260,80%,40%,.5), 0 6px 24px hsla(190,100%,50%,.35)'
              : 'inset 0 0 16px hsla(0,0%,100%,.55), inset -4px -6px 14px hsla(260,80%,40%,.35), 0 6px 24px hsla(190,100%,50%,.3)',
          }}
        >
          {/* Subtle iridescent sheen */}
          {!shouldReduceMotion && (
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(120deg, transparent 30%, hsla(0,0%,100%,.45) 50%, transparent 70%)',
                mixBlendMode: 'overlay',
              }}
              animate={{ x: ['-60%', '60%'] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {/* Refraction rim */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: 'inset 0 0 0 1px hsla(0,0%,100%,.35)',
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
              backgroundImage:
                'linear-gradient(100deg, hsl(190,100%,55%) 0%, hsl(260,90%,65%) 45%, hsl(320,95%,65%) 75%, hsl(190,100%,55%) 100%)',
              backgroundSize: shouldReduceMotion ? '100% 100%' : '220% 100%',
              animation: shouldReduceMotion ? 'none' : 'bv-shine 6s linear infinite',
            }}
          >
            Bubble
          </span>
          <span className={isDark ? 'text-foreground' : 'text-slate-900'}>verse</span>
        </motion.h1>
        {/* Tagline rule */}
        <div className="mt-1 flex items-center gap-1.5">
          <span className="h-px w-5 sm:w-6 bg-gradient-to-r from-cyan-400/80 to-fuchsia-400/80" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
            stories in bubbles
          </span>
        </div>
        <style>{`@keyframes bv-shine{0%{background-position:0% 50%}100%{background-position:220% 50%}}`}</style>
      </div>
    </motion.div>
  );
};

export default BubbleverseLogo;
