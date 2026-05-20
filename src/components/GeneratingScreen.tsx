import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const bubbleMessages = [
  "Mixing magical ingredients...",
  "Painting beautiful scenes...",
  "Writing enchanting words...",
  "Sprinkling fairy dust...",
  "Creating adventures...",
  "Adding sparkles...",
  "Brewing imagination...",
  "Crafting wonder...",
];

interface GeneratingScreenProps {
  progress: number;
  currentStep: string;
  onCancel?: () => void;
}

const GeneratingScreen = ({ progress, currentStep, onCancel }: GeneratingScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg">
      {onCancel && (
        <button
          onClick={onCancel}
          aria-label="Cancel generation"
          className="absolute top-6 right-6 w-11 h-11 rounded-full glass-card flex items-center justify-center text-foreground/80 hover:text-foreground hover:scale-110 transition-all border border-primary/30 hover:border-primary/60 z-10"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <div className="text-center max-w-md mx-auto px-6">

        {/* Faceless iridescent Bub — spins around itself while generating */}
        <motion.div
          className="relative w-32 h-32 mx-auto mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          {/* Iridescent halo */}
          <div
            className="absolute -inset-4 rounded-full blur-2xl opacity-80 pointer-events-none"
            style={{
              background:
                'conic-gradient(from 0deg, hsla(190,100%,70%,.65), hsla(280,90%,70%,.65), hsla(330,100%,75%,.55), hsla(160,100%,70%,.55), hsla(190,100%,70%,.65))',
            }}
          />

          {/* Soap bubble body */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background:
                'radial-gradient(circle at 32% 26%, hsla(0,0%,100%,.98) 0%, hsla(190,100%,82%,.85) 22%, hsla(260,90%,72%,.7) 52%, hsla(320,95%,72%,.6) 78%, hsla(220,80%,38%,.7) 100%)',
              boxShadow:
                'inset 0 0 32px hsla(0,0%,100%,.55), inset -12px -14px 32px hsla(260,80%,40%,.45), 0 20px 56px hsla(200,100%,55%,.45)',
            }}
          >
            {/* Iridescent sheen sweep */}
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(120deg, transparent 28%, hsla(0,0%,100%,.55) 50%, transparent 72%)',
                mixBlendMode: 'overlay',
              }}
              animate={{ x: ['-60%', '60%'] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Thin film rim */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: 'inset 0 0 0 1.5px hsla(0,0%,100%,.45)' }}
            />
            {/* Specular highlights */}
            <div className="absolute top-3 left-5 w-8 h-3 rounded-full bg-white/90 blur-[2px] rotate-[-20deg]" />
            <div className="absolute top-5 left-9 w-2.5 h-2.5 rounded-full bg-white" />
            <div className="absolute bottom-4 right-6 w-9 h-2 rounded-full bg-white/25 blur-md" />
          </div>

          {/* Floating sparkles around Bub */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-bubble-gold rounded-full"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${-20 + Math.random() * 140}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                y: [0, -20, -40],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </motion.div>


        {/* Title */}
        <motion.h2 
          className="text-3xl font-bold mb-4 text-magical"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Creating Your Story
        </motion.h2>

        {/* Current step */}
        <motion.p 
          key={currentStep}
          className="text-lg text-foreground mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {currentStep}
        </motion.p>

        {/* Progress bar */}
        <div className="w-full h-3 bg-muted/50 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)))',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Progress text */}
        <p className="text-muted-foreground text-sm">
          {Math.round(progress)}% complete
        </p>

        {/* Fun message rotation */}
        <motion.div
          className="mt-8 p-4 glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.p
            key={Math.floor(progress / 15)}
            className="text-muted-foreground text-sm italic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            💫 {bubbleMessages[Math.floor(progress / 15) % bubbleMessages.length]}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default GeneratingScreen;
