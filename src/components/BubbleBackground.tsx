import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

interface Bubble {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  hue: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

const BubbleBackground = () => {
  const bubbles: Bubble[] = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 60 + 20,
      delay: Math.random() * 10,
      duration: Math.random() * 10 + 15,
      hue: Math.random() > 0.5 ? 190 : 280 + Math.random() * 40,
    })), []
  );

  const particles: Particle[] = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      delay: Math.random() * 5,
    })), []
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-bubble-lavender/10 via-transparent to-bubble-cyan/5" />
      
      {/* Bubbles */}
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full"
          style={{
            left: `${bubble.x}%`,
            width: bubble.size,
            height: bubble.size,
            background: `radial-gradient(circle at 30% 30%, 
              hsla(${bubble.hue}, 100%, 80%, 0.4), 
              hsla(${bubble.hue}, 100%, 60%, 0.2) 50%,
              transparent 70%)`,
            boxShadow: `
              inset 0 0 ${bubble.size / 3}px hsla(${bubble.hue}, 100%, 90%, 0.3),
              0 0 ${bubble.size / 2}px hsla(${bubble.hue}, 100%, 70%, 0.2)
            `,
          }}
          initial={{ y: '100vh', scale: 0, opacity: 0 }}
          animate={{ 
            y: '-20vh', 
            scale: [0, 1, 1, 0.8],
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Floating particles / dust motes */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-foreground/30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            y: [0, -20, -40],
          }}
          transition={{
            duration: 4,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Ambient glow spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-bubble-cyan/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-bubble-pink/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-bubble-lavender/5 rounded-full blur-3xl" />
    </div>
  );
};

export default BubbleBackground;
