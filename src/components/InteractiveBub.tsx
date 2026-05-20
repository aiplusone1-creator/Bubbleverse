import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { useMousePosition } from '@/hooks/useMousePosition';
import { useTheme } from 'next-themes';

const FOLLOW_EASE = 0.18; // higher = more eager
const ORBIT_RADIUS = 56; // keeps Bub beside the cursor, never under it
const MIN_DISTANCE = 48; // never come closer than this to the cursor
const SIZE = 64;

const InteractiveBub = memo(() => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const mouse = useMousePosition();

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [vel, setVel] = useState({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const tRef = useRef(0);

  useEffect(() => {
    const init = { x: window.innerWidth * 0.6, y: window.innerHeight * 0.4 };
    posRef.current = init;
    setPos(init);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      tRef.current += 0.016;
      const t = tRef.current;

      // Orbit offset so it feels alive near the cursor instead of stopping dead-center
      const ox = Math.cos(t * 2.4) * ORBIT_RADIUS;
      const oy = Math.sin(t * 1.9) * ORBIT_RADIUS * 0.7;

      const targetX = mouse.x + ox;
      const targetY = mouse.y + oy;

      const dx = targetX - posRef.current.x;
      const dy = targetY - posRef.current.y;

      // Spring-like ease toward the moving target
      velRef.current.x = velRef.current.x * 0.78 + dx * FOLLOW_EASE * 0.35;
      velRef.current.y = velRef.current.y * 0.78 + dy * FOLLOW_EASE * 0.35;

      posRef.current.x += velRef.current.x;
      posRef.current.y += velRef.current.y;

      setPos({ x: posRef.current.x, y: posRef.current.y });
      setVel({ x: velRef.current.x, y: velRef.current.y });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mouse]);

  // Squash & stretch based on speed
  const speed = Math.min(Math.sqrt(vel.x * vel.x + vel.y * vel.y), 40);
  const stretch = 1 + speed / 120;
  const squash = 1 - speed / 240;
  const angle = (Math.atan2(vel.y, vel.x) * 180) / Math.PI;

  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{
        left: pos.x - SIZE / 2,
        top: pos.y - SIZE / 2,
        width: SIZE,
        height: SIZE,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `rotate(${angle}deg) scale(${stretch}, ${squash})`,
          transformOrigin: 'center',
          transition: 'transform 80ms linear',
        }}
      >
        <div
          style={{ transform: `rotate(${-angle}deg)`, width: '100%', height: '100%' }}
        >
          {/* Iridescent halo */}
          <div
            className="absolute -inset-4 rounded-full blur-2xl opacity-80 pointer-events-none"
            style={{
              background:
                'conic-gradient(from 0deg, hsla(190,100%,70%,.65), hsla(280,90%,70%,.65), hsla(330,100%,75%,.55), hsla(160,100%,70%,.55), hsla(190,100%,70%,.65))',
              animation: 'spin 8s linear infinite',
            }}
          />

          {/* Soap bubble body */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background:
                'radial-gradient(circle at 32% 26%, hsla(0,0%,100%,.98) 0%, hsla(190,100%,82%,.85) 22%, hsla(260,90%,72%,.7) 52%, hsla(320,95%,72%,.6) 78%, hsla(220,80%,38%,.7) 100%)',
              boxShadow: isDark
                ? 'inset 0 0 28px hsla(0,0%,100%,.4), inset -10px -12px 28px hsla(260,80%,40%,.55), 0 16px 48px hsla(200,100%,55%,.45)'
                : 'inset 0 0 28px hsla(0,0%,100%,.6), inset -10px -12px 28px hsla(260,80%,40%,.4), 0 16px 48px hsla(200,100%,55%,.4)',
            }}
          >
            {/* Iridescent sheen sweep */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(120deg, transparent 28%, hsla(0,0%,100%,.55) 50%, transparent 72%)',
                mixBlendMode: 'overlay',
                animation: 'bubSheen 3.2s ease-in-out infinite',
              }}
            />
            {/* Thin film rim */}
            <div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: 'inset 0 0 0 1.5px hsla(0,0%,100%,.45)' }}
            />
            {/* Specular highlights */}
            <div className="absolute top-2 left-3 w-6 h-3 rounded-full bg-white/90 blur-[2px] rotate-[-20deg]" />
            <div className="absolute top-4 left-6 w-2 h-2 rounded-full bg-white" />
            <div className="absolute bottom-3 right-4 w-7 h-2 rounded-full bg-white/25 blur-md" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bubSheen {
          0% { transform: translateX(-60%); }
          100% { transform: translateX(60%); }
        }
      `}</style>
    </motion.div>
  );
});

InteractiveBub.displayName = 'InteractiveBub';

export default InteractiveBub;
