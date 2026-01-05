import { motion } from 'framer-motion';

const BubbleverseLogo = () => {
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
            background: `radial-gradient(circle at 30% 30%, 
              hsla(190, 100%, 85%, 0.9), 
              hsla(190, 100%, 60%, 0.7) 40%,
              hsla(280, 80%, 70%, 0.5) 70%,
              transparent 100%)`,
            boxShadow: `
              inset 0 0 20px hsla(190, 100%, 90%, 0.5),
              0 0 30px hsla(190, 100%, 70%, 0.4),
              0 0 60px hsla(280, 80%, 70%, 0.2)
            `,
          }}
        />
        {/* Shine effect */}
        <div 
          className="absolute top-2 left-2 w-3 h-3 rounded-full bg-foreground/60"
          style={{ filter: 'blur(1px)' }}
        />
        {/* Eyes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 flex gap-2">
          <div className="w-2 h-2.5 rounded-full bg-primary-foreground/90" />
          <div className="w-2 h-2.5 rounded-full bg-primary-foreground/90" />
        </div>
        {/* Smile */}
        <div 
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 border-primary-foreground/70 rounded-b-full"
        />
      </motion.div>

      {/* Logo text */}
      <motion.h1 
        className="text-3xl md:text-4xl font-bold tracking-tight"
        animate={{ 
          textShadow: [
            '0 0 20px hsla(190, 100%, 70%, 0.5)',
            '0 0 40px hsla(280, 80%, 70%, 0.6)',
            '0 0 20px hsla(190, 100%, 70%, 0.5)',
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-magical">Bubble</span>
        <span className="text-foreground">verse</span>
      </motion.h1>
    </motion.div>
  );
};

export default BubbleverseLogo;
