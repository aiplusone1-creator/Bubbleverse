import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

const BubbleverseLogo = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <motion.div 
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Bubble mascot "Bub" */}
      <motion.div
        className="relative w-14 h-14"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: isDark 
              ? `radial-gradient(circle at 30% 30%, 
                  hsla(190, 100%, 85%, 0.9), 
                  hsla(190, 100%, 60%, 0.7) 40%,
                  hsla(280, 80%, 70%, 0.5) 70%,
                  transparent 100%)`
              : `radial-gradient(circle at 30% 30%, 
                  hsla(190, 100%, 50%, 0.95), 
                  hsla(190, 100%, 40%, 0.85) 40%,
                  hsla(280, 80%, 50%, 0.7) 70%,
                  hsla(280, 80%, 40%, 0.4) 100%)`,
            boxShadow: isDark
              ? `
                inset 0 0 20px hsla(190, 100%, 90%, 0.5),
                0 0 30px hsla(190, 100%, 70%, 0.4),
                0 0 60px hsla(280, 80%, 70%, 0.2)
              `
              : `
                inset 0 0 20px hsla(190, 100%, 60%, 0.6),
                0 0 30px hsla(190, 100%, 50%, 0.5),
                0 0 60px hsla(280, 80%, 50%, 0.3)
              `,
          }}
        />
        {/* Shine effect */}
        <div 
          className="absolute top-2 left-2 w-3 h-3 rounded-full"
          style={{ 
            background: isDark 
              ? 'hsla(0, 0%, 100%, 0.6)'
              : 'hsla(0, 0%, 100%, 0.9)',
            filter: 'blur(1px)' 
          }}
        />
        {/* Eyes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 flex gap-2">
          <div className={`w-2 h-2.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-700'}`} />
          <div className={`w-2 h-2.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-700'}`} />
        </div>
        {/* Smile */}
        <div 
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 rounded-b-full ${isDark ? 'border-slate-700' : 'border-slate-600'}`}
        />
      </motion.div>

      {/* Logo text */}
      <motion.h1 
        className="text-3xl md:text-4xl font-bold tracking-tight"
        animate={{ 
          textShadow: isDark
            ? [
                '0 0 20px hsla(190, 100%, 70%, 0.5)',
                '0 0 40px hsla(280, 80%, 70%, 0.6)',
                '0 0 20px hsla(190, 100%, 70%, 0.5)',
              ]
            : [
                '0 0 10px hsla(190, 100%, 50%, 0.3)',
                '0 0 20px hsla(280, 80%, 50%, 0.4)',
                '0 0 10px hsla(190, 100%, 50%, 0.3)',
              ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-magical">Bubble</span>
        <span className={isDark ? 'text-foreground' : 'text-slate-800'}>verse</span>
      </motion.h1>
    </motion.div>
  );
};

export default BubbleverseLogo;
