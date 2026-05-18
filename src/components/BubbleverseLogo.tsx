import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

/**
 * Bubbleverse Logo — premium redesign
 * - Iridescent soap-bubble mark with refraction highlights & orbiting micro-bubbles
 * - Wordmark uses a tight tracked display treatment with an animated holographic sheen
 */
const BubbleverseLogo = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <motion.div
      className="flex items-center gap-3 select-none"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Mark */}
      <motion.div
        className="relative w-12 h-12"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Outer glow halo */}
        <div
          className="absolute -inset-2 rounded-full blur-xl opacity-70"
          style={{
            background:
              'conic-gradient(from 0deg, hsla(190,100%,70%,.7), hsla(280,90%,70%,.7), hsla(330,100%,75%,.6), hsla(190,100%,70%,.7))',
          }}
        />

        {/* Orbiting micro-bubbles */}
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

        {/* Soap bubble body */}
        <div
          className="absolute inset-1 rounded-full overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, hsla(0,0%,100%,.95), hsla(190,100%,75%,.85) 28%, hsla(260,90%,70%,.75) 55%, hsla(320,90%,70%,.6) 78%, hsla(220,80%,40%,.7) 100%)',
            boxShadow: isDark
              ? 'inset 0 0 18px hsla(0,0%,100%,.35), inset -6px -8px 18px hsla(260,80%,40%,.5), 0 8px 28px hsla(200,100%,50%,.35)'
              : 'inset 0 0 18px hsla(0,0%,100%,.55), inset -6px -8px 18px hsla(260,80%,40%,.35), 0 8px 28px hsla(200,100%,50%,.3)',
          }}
        >
          {/* Iridescent sheen */}
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
          {/* Refraction rim */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: 'inset 0 0 0 1px hsla(0,0%,100%,.35)',
            }}
          />
          {/* Primary specular highlight */}
          <div className="absolute top-1.5 left-1.5 w-3 h-2 rounded-full bg-white/85 blur-[1.5px] rotate-[-20deg]" />
          <div className="absolute top-3 left-2.5 w-1 h-1 rounded-full bg-white/90" />
        </div>
      </motion.div>

      {/* Wordmark */}
      <div className="relative leading-none">
        <motion.h1
          className="text-2xl md:text-3xl font-black tracking-tight"
          style={{ letterSpacing: '-0.03em' }}
        >
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(100deg, hsl(190,100%,55%) 0%, hsl(260,90%,65%) 45%, hsl(320,95%,65%) 75%, hsl(190,100%,55%) 100%)',
              backgroundSize: '220% 100%',
              animation: 'bv-shine 6s linear infinite',
            }}
          >
            Bubble
          </span>
          <span className={isDark ? 'text-foreground' : 'text-slate-900'}>verse</span>
        </motion.h1>
        {/* Tagline rule */}
        <div className="mt-1 flex items-center gap-1.5">
          <span className="h-px w-6 bg-gradient-to-r from-cyan-400/80 to-fuchsia-400/80" />
          <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground font-medium">
            stories in bubbles
          </span>
        </div>
        <style>{`@keyframes bv-shine{0%{background-position:0% 50%}100%{background-position:220% 50%}}`}</style>
      </div>
    </motion.div>
  );
};

export default BubbleverseLogo;
