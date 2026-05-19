import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useMousePosition } from '@/hooks/useMousePosition';
import { useTheme } from 'next-themes';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type BubState = 'idle' | 'fleeing' | 'escaping' | 'entering';
type BubMood = 'happy' | 'curious' | 'thinking' | 'dancing';

const AVOIDANCE_RADIUS = 150;
const FLEE_SPEED = 15;
const WANDER_SPEED = 0.5;
const EDGE_PADDING = 60;

const InteractiveBub = memo(() => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const bubRef = useRef<HTMLDivElement>(null);
  const mousePosition = useMousePosition();
  const controls = useAnimation();

  // Bub state
  const [bubState, setBubState] = useState<BubState>('idle');
  const [bubMood, setBubMood] = useState<BubMood>('happy');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  // Velocity for physics
  const velocityRef = useRef({ x: 0, y: 0 });
  const wanderTargetRef = useRef({ x: 0, y: 0 });
  const lastWanderChangeRef = useRef(0);

  // Initialize position
  useEffect(() => {
    const initX = window.innerWidth * 0.7;
    const initY = window.innerHeight * 0.3;
    setPosition({ x: initX, y: initY });
    wanderTargetRef.current = { x: initX, y: initY };
  }, []);

  // Set up scroll triggers for mood changes
  useEffect(() => {
    // Hero section - happy waving
    ScrollTrigger.create({
      trigger: 'main',
      start: 'top top',
      end: '30% top',
      onEnter: () => setBubMood('happy'),
      onEnterBack: () => setBubMood('happy'),
    });

    // Middle sections - curious/thinking
    ScrollTrigger.create({
      trigger: 'main',
      start: '30% top',
      end: '70% top',
      onEnter: () => setBubMood('curious'),
      onEnterBack: () => setBubMood('curious'),
    });

    // Footer/CTA - dancing
    ScrollTrigger.create({
      trigger: 'main',
      start: '70% top',
      end: 'bottom bottom',
      onEnter: () => setBubMood('dancing'),
      onEnterBack: () => setBubMood('dancing'),
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  // Natural blinking — gentle, irregular cadence
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const delay = 2200 + Math.random() * 3200;
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        // occasional double-blink for life
        const doubleBlink = Math.random() < 0.18;
        setTimeout(() => {
          setIsBlinking(false);
          if (doubleBlink) {
            setTimeout(() => setIsBlinking(true), 140);
            setTimeout(() => setIsBlinking(false), 280);
          }
          scheduleBlink();
        }, 130);
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  // Eye tracking — soft, weighted easing for a thoughtful gaze
  useEffect(() => {
    const bubCenterX = position.x;
    const bubCenterY = position.y;

    const dx = mousePosition.x - bubCenterX;
    const dy = mousePosition.y - bubCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Smaller, more refined gaze range — eyes are tiny, big offsets look googly
    const maxOffset = 2.4;
    const ramp = Math.min(distance / 80, 1);
    const normalizedX = distance > 0 ? (dx / distance) * ramp * maxOffset : 0;
    const normalizedY = distance > 0 ? (dy / distance) * ramp * maxOffset * 0.85 : 0;

    setEyeOffset({ x: normalizedX, y: normalizedY });
  }, [mousePosition, position]);

  // Main physics loop
  useEffect(() => {
    let animationFrameId: number;

    const updatePhysics = () => {
      const now = Date.now();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      setPosition(prevPos => {
        let newX = prevPos.x;
        let newY = prevPos.y;
        let newState: BubState = bubState;

        // Calculate distance to mouse
        const dx = mousePosition.x - prevPos.x;
        const dy = mousePosition.y - prevPos.y;
        const distanceToMouse = Math.sqrt(dx * dx + dy * dy);

        if (bubState === 'escaping') {
          // Continue moving up rapidly
          newY -= 12;
          setRotation(prev => prev + 10);

          // Check if escaped off screen
          if (newY < -100) {
            // Re-enter from a random position
            newState = 'entering';
            setBubState('entering');
            setIsVisible(false);
            
            setTimeout(() => {
              const entryX = Math.random() * (viewportWidth - 200) + 100;
              const entryY = viewportHeight + 100;
              setPosition({ x: entryX, y: entryY });
              setIsVisible(true);
              setBubState('idle');
            }, 1500);
          }
        } else if (bubState === 'entering') {
          // Do nothing, waiting to re-enter
        } else if (distanceToMouse < AVOIDANCE_RADIUS) {
          // FLEEING - Apply repulsion force
          newState = 'fleeing';
          if (bubState !== 'fleeing') setBubState('fleeing');

          const angle = Math.atan2(dy, dx);
          const repulsionForce = (AVOIDANCE_RADIUS - distanceToMouse) / AVOIDANCE_RADIUS;
          
          velocityRef.current.x = -Math.cos(angle) * FLEE_SPEED * repulsionForce;
          velocityRef.current.y = -Math.sin(angle) * FLEE_SPEED * repulsionForce;

          newX += velocityRef.current.x;
          newY += velocityRef.current.y;

          // Rotation towards movement direction
          setRotation(-velocityRef.current.x * 2);

          // Check if cornered (hitting edges)
          const hitLeftEdge = newX < EDGE_PADDING;
          const hitRightEdge = newX > viewportWidth - EDGE_PADDING;
          const hitTopEdge = newY < EDGE_PADDING;
          const hitBottomEdge = newY > viewportHeight - EDGE_PADDING;

          if ((hitLeftEdge || hitRightEdge || hitTopEdge || hitBottomEdge) && distanceToMouse < AVOIDANCE_RADIUS * 1.5) {
            // Cornered! Escape upward
            newState = 'escaping';
            setBubState('escaping');
          }
        } else {
          // IDLE - Gentle wandering
          if (bubState !== 'idle') {
            setBubState('idle');
          }

          // Apply friction to velocity
          velocityRef.current.x *= 0.95;
          velocityRef.current.y *= 0.95;

          // Change wander target periodically
          if (now - lastWanderChangeRef.current > 3000) {
            wanderTargetRef.current = {
              x: Math.random() * (viewportWidth - 200) + 100,
              y: Math.random() * (viewportHeight - 200) + 100,
            };
            lastWanderChangeRef.current = now;
          }

          // Move towards wander target
          const wanderDx = wanderTargetRef.current.x - prevPos.x;
          const wanderDy = wanderTargetRef.current.y - prevPos.y;
          const wanderDist = Math.sqrt(wanderDx * wanderDx + wanderDy * wanderDy);

          if (wanderDist > 10) {
            velocityRef.current.x += (wanderDx / wanderDist) * WANDER_SPEED * 0.1;
            velocityRef.current.y += (wanderDy / wanderDist) * WANDER_SPEED * 0.1;
          }

          // Clamp velocity
          const maxSpeed = WANDER_SPEED;
          const currentSpeed = Math.sqrt(velocityRef.current.x ** 2 + velocityRef.current.y ** 2);
          if (currentSpeed > maxSpeed) {
            velocityRef.current.x = (velocityRef.current.x / currentSpeed) * maxSpeed;
            velocityRef.current.y = (velocityRef.current.y / currentSpeed) * maxSpeed;
          }

          newX += velocityRef.current.x;
          newY += velocityRef.current.y;

          // Gentle rotation
          setRotation(Math.sin(now / 1000) * 5);
        }

        // Keep within bounds (unless escaping)
        if (newState !== 'escaping') {
          newX = Math.max(EDGE_PADDING, Math.min(viewportWidth - EDGE_PADDING, newX));
          newY = Math.max(EDGE_PADDING, Math.min(viewportHeight - EDGE_PADDING, newY));
        }

        return { x: newX, y: newY };
      });

      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mousePosition, bubState]);

  // Expression based on mood and state
  const getExpression = () => {
    if (bubState === 'fleeing' || bubState === 'escaping') {
      return { eyes: 'surprised', mouth: 'o' };
    }
    switch (bubMood) {
      case 'happy':
        return { eyes: 'happy', mouth: 'smile' };
      case 'curious':
        return { eyes: 'looking', mouth: 'small' };
      case 'thinking':
        return { eyes: 'closed', mouth: 'hmm' };
      case 'dancing':
        return { eyes: 'happy', mouth: 'big-smile' };
      default:
        return { eyes: 'happy', mouth: 'smile' };
    }
  };

  const expression = getExpression();

  if (!isVisible) return null;

  return (
    <motion.div
      ref={bubRef}
      className="fixed pointer-events-none z-50"
      style={{
        left: position.x - 40,
        top: position.y - 40,
      }}
      animate={{
        rotate: rotation,
        scale: bubState === 'fleeing' ? 0.9 : bubState === 'escaping' ? 0.8 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
    >
      {/* Main bubble body — iridescent soap bubble */}
      <motion.div
        className="relative w-24 h-24"
        animate={{
          y: bubMood === 'dancing' ? [0, -10, 0] : [0, -4, 0],
          rotate: bubMood === 'dancing' ? [0, 8, -8, 0] : 0,
        }}
        transition={{
          duration: bubMood === 'dancing' ? 0.5 : 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Iridescent halo */}
        <div
          className="absolute -inset-3 rounded-full blur-2xl opacity-70 pointer-events-none"
          style={{
            background:
              'conic-gradient(from 0deg, hsla(190,100%,70%,.6), hsla(280,90%,70%,.6), hsla(330,100%,75%,.55), hsla(190,100%,70%,.6))',
          }}
        />

        {/* Orbiting micro bubbles */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        >
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-200/90 shadow-[0_0_10px_hsla(190,100%,80%,.95)]" />
          <span className="absolute bottom-1 right-2 w-1.5 h-1.5 rounded-full bg-fuchsia-200/80 shadow-[0_0_8px_hsla(310,100%,80%,.9)]" />
          <span className="absolute top-3 left-1 w-1 h-1 rounded-full bg-violet-200/80 shadow-[0_0_6px_hsla(270,100%,80%,.9)]" />
        </motion.div>

        {/* Soap bubble body */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 32% 26%, hsla(0,0%,100%,.95) 0%, hsla(190,100%,80%,.85) 22%, hsla(260,90%,72%,.75) 52%, hsla(320,95%,72%,.65) 78%, hsla(220,80%,38%,.7) 100%)',
            boxShadow: isDark
              ? 'inset 0 0 26px hsla(0,0%,100%,.35), inset -8px -10px 24px hsla(260,80%,40%,.55), 0 14px 40px hsla(200,100%,50%,.4)'
              : 'inset 0 0 26px hsla(0,0%,100%,.55), inset -8px -10px 24px hsla(260,80%,40%,.4), 0 14px 40px hsla(200,100%,50%,.35)',
          }}
        >
          {/* Iridescent sheen sweep */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(120deg, transparent 28%, hsla(0,0%,100%,.5) 50%, transparent 72%)',
              mixBlendMode: 'overlay',
            }}
            animate={{ x: ['-60%', '60%'] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Thin film rim */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: 'inset 0 0 0 1.5px hsla(0,0%,100%,.4)' }}
          />
          {/* Specular highlights */}
          <div className="absolute top-2 left-3 w-5 h-3 rounded-full bg-white/85 blur-[2px] rotate-[-20deg]" />
          <div className="absolute top-4 left-5 w-1.5 h-1.5 rounded-full bg-white/95" />
          {/* Bottom soft light bounce */}
          <div className="absolute bottom-2 right-3 w-6 h-2 rounded-full bg-white/20 blur-md" />
        </div>

        {/* Face — single integrated SVG that lives INSIDE the bubble, perfectly centered */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            // sits under the film, soft refraction tint
            filter: 'drop-shadow(0 1px 0.5px rgba(255,255,255,0.55))',
            mixBlendMode: 'multiply',
            opacity: 0.92,
          }}
          aria-hidden
        >
          <defs>
            <radialGradient id="bub-iris" cx="38%" cy="34%" r="70%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="35%" stopColor="#38bdf8" />
              <stop offset="78%" stopColor="#1e6fa8" />
              <stop offset="100%" stopColor="#082f49" />
            </radialGradient>
            <radialGradient id="bub-sclera" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#eef4fb" />
              <stop offset="100%" stopColor="#cbd9e8" />
            </radialGradient>
            <clipPath id="bub-eye-L">
              <ellipse cx="40" cy="48" rx="6.2" ry="7.4" />
            </clipPath>
            <clipPath id="bub-eye-R">
              <ellipse cx="60" cy="48" rx="6.2" ry="7.4" />
            </clipPath>
          </defs>

          {(() => {
            const isHappy = expression.eyes === 'happy';
            const isSurprised = expression.eyes === 'surprised';
            const isClosed = expression.eyes === 'closed';
            const closed = isClosed || isBlinking;
            const showCrescent = isHappy && !isBlinking;
            // map small px offset to svg units (svg is 100 wide ≈ 96px bubble)
            const ex = eyeOffset.x * 1.04;
            const ey = eyeOffset.y * 1.04;
            const sx = isSurprised ? 1.12 : 1;
            const sy = closed ? 0.06 : isSurprised ? 1.18 : 1;

            return (
              <>
                {/* ===== EYES ===== */}
                {[
                  { cx: 40, key: 'L', clip: 'bub-eye-L' },
                  { cx: 60, key: 'R', clip: 'bub-eye-R' },
                ].map((eye) => (
                  <g key={eye.key}>
                    {/* Open eye group — scales for blink/surprise around eye center */}
                    {!showCrescent && (
                      <g
                        style={{
                          transform: `translate(${eye.cx}px, 48px) scale(${sx}, ${sy}) translate(${-eye.cx}px, -48px)`,
                          transition: 'transform 140ms cubic-bezier(.5,1.4,.4,1)',
                          transformBox: 'fill-box',
                          transformOrigin: '0 0',
                        }}
                      >
                        {/* Sclera */}
                        <ellipse
                          cx={eye.cx}
                          cy={48}
                          rx={6.2}
                          ry={7.4}
                          fill="url(#bub-sclera)"
                          stroke="rgba(15,23,42,0.25)"
                          strokeWidth={0.45}
                        />
                        {/* Iris + pupil + catchlights, clipped to sclera so it never spills */}
                        <g clipPath={`url(#${eye.clip})`}>
                          <g
                            style={{
                              transform: `translate(${ex}px, ${ey}px)`,
                              transition: 'transform 180ms cubic-bezier(.3,1,.5,1)',
                            }}
                          >
                            <circle cx={eye.cx} cy={48.5} r={4.2} fill="url(#bub-iris)" />
                            <circle cx={eye.cx} cy={48.5} r={1.9} fill="#020617" />
                            {/* Primary catchlight */}
                            <circle cx={eye.cx - 1.3} cy={47} r={1.05} fill="#ffffff" />
                            {/* Secondary catchlight */}
                            <circle cx={eye.cx + 1.5} cy={50} r={0.5} fill="rgba(255,255,255,0.85)" />
                          </g>
                          {/* Upper-lid shadow inside the eye for soulful depth */}
                          <ellipse
                            cx={eye.cx}
                            cy={43.5}
                            rx={6.2}
                            ry={3.2}
                            fill="rgba(15,23,42,0.28)"
                          />
                        </g>
                      </g>
                    )}

                    {/* Happy crescent — elegant smiling arc */}
                    {showCrescent && (
                      <path
                        d={`M ${eye.cx - 5.4} 49 Q ${eye.cx} 43.4 ${eye.cx + 5.4} 49`}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                      />
                    )}
                  </g>
                ))}

                {/* ===== MOUTH — centered, integrated, expressive ===== */}
                <g
                  style={{
                    transform: `translate(50px, 64px) scale(${expression.mouth === 'big-smile' ? 1.25 : 1})`,
                    transformBox: 'fill-box',
                    transition: 'transform 220ms cubic-bezier(.5,1.4,.4,1)',
                  }}
                >
                  {expression.mouth === 'smile' || expression.mouth === 'big-smile' ? (
                    <>
                      {/* Smile curve */}
                      <path
                        d="M -7 0 Q 0 6.4 7 0"
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={1.7}
                        strokeLinecap="round"
                      />
                      {/* Soft inner-mouth blush hint */}
                      <path
                        d="M -5 1.4 Q 0 5 5 1.4 Q 0 3 -5 1.4 Z"
                        fill="rgba(190,40,80,0.25)"
                      />
                    </>
                  ) : expression.mouth === 'o' ? (
                    <ellipse
                      cx={0}
                      cy={1}
                      rx={2.6}
                      ry={3}
                      fill="rgba(15,23,42,0.55)"
                      stroke="#0f172a"
                      strokeWidth={1.3}
                    />
                  ) : (
                    <path
                      d="M -3.2 0 Q 0 1.4 3.2 0"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  )}
                </g>

                {/* ===== BLUSH — soft, painted into the bubble ===== */}
                {(bubMood === 'happy' || bubMood === 'dancing') && (
                  <>
                    <ellipse cx={31} cy={58} rx={4.2} ry={2.4} fill="rgba(244,114,160,0.45)" />
                    <ellipse cx={69} cy={58} rx={4.2} ry={2.4} fill="rgba(244,114,160,0.45)" />
                  </>
                )}
              </>
            );
          })()}
        </svg>

        {/* Sparkles when dancing */}
        <AnimatePresence>
          {bubMood === 'dancing' && (
            <>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-yellow-200 text-sm pointer-events-none"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: [0, (i % 2 === 0 ? 1 : -1) * 24],
                    y: [0, -24 - i * 5],
                  }}
                  transition={{ duration: 0.9, delay: i * 0.12, repeat: Infinity }}
                  style={{ left: 36 + (i % 2) * 22, top: 10 }}
                >
                  ✦
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
});

InteractiveBub.displayName = 'InteractiveBub';

export default InteractiveBub;
