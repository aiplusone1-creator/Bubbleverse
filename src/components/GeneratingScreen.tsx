import { motion } from 'framer-motion';

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
}

const GeneratingScreen = ({ progress, currentStep }: GeneratingScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Animated Bub Mascot */}
        <motion.div
          className="relative w-32 h-32 mx-auto mb-8"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        >
          {/* Main bubble body */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, 
                hsla(190, 100%, 85%, 0.95), 
                hsla(190, 100%, 60%, 0.8) 40%,
                hsla(280, 80%, 70%, 0.6) 70%,
                hsla(320, 80%, 70%, 0.4) 100%)`,
              boxShadow: `
                inset 0 0 40px hsla(190, 100%, 90%, 0.6),
                0 0 60px hsla(190, 100%, 70%, 0.5),
                0 0 100px hsla(280, 80%, 70%, 0.3)
              `,
            }}
          />
          
          {/* Shine */}
          <motion.div 
            className="absolute top-4 left-6 w-6 h-6 rounded-full bg-foreground/70"
            style={{ filter: 'blur(2px)' }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          {/* Eyes */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 flex gap-4">
            <motion.div 
              className="w-3 h-4 rounded-full bg-primary-foreground"
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
            <motion.div 
              className="w-3 h-4 rounded-full bg-primary-foreground"
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
          </div>
          
          {/* Happy smile */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-8 h-4 border-b-3 border-primary-foreground/80 rounded-b-full"
            animate={{ scaleX: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
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
