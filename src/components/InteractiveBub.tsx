import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useMousePosition } from '@/hooks/useMousePosition';
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

  // Eye tracking - make eyes follow the mouse
  useEffect(() => {
    const bubCenterX = position.x;
    const bubCenterY = position.y;
    
    const dx = mousePosition.x - bubCenterX;
    const dy = mousePosition.y - bubCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize and clamp the eye movement (max 4px in any direction)
    const maxOffset = 4;
    const normalizedX = distance > 0 ? (dx / distance) * Math.min(distance / 50, 1) * maxOffset : 0;
    const normalizedY = distance > 0 ? (dy / distance) * Math.min(distance / 50, 1) * maxOffset : 0;
    
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
      {/* Main bubble body */}
      <motion.div
        className="relative w-20 h-20"
        animate={{
          y: bubMood === 'dancing' ? [0, -8, 0] : [0, -3, 0],
          rotate: bubMood === 'dancing' ? [0, 10, -10, 0] : 0,
        }}
        transition={{
          duration: bubMood === 'dancing' ? 0.5 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Bubble gradient body */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, 
              hsla(190, 100%, 85%, 0.95), 
              hsla(190, 100%, 65%, 0.8) 40%,
              hsla(280, 80%, 75%, 0.6) 70%,
              hsla(280, 80%, 60%, 0.4) 100%)`,
            boxShadow: `
              inset 0 0 25px hsla(190, 100%, 95%, 0.6),
              0 0 40px hsla(190, 100%, 70%, 0.5),
              0 0 80px hsla(280, 80%, 70%, 0.3)
            `,
          }}
        />

        {/* Shine effect */}
        <div 
          className="absolute top-2 left-2 w-5 h-5 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, hsla(0, 0%, 100%, 0.8) 0%, transparent 70%)',
            filter: 'blur(1px)' 
          }}
        />

        {/* Eyes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 flex gap-3">
          {/* Left Eye */}
          <motion.div 
            className="relative w-3 h-3.5 rounded-full bg-white flex items-center justify-center overflow-hidden"
            style={{
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <motion.div 
              className="w-2 h-2.5 rounded-full bg-slate-800"
              animate={{
                x: eyeOffset.x,
                y: eyeOffset.y,
                scaleY: expression.eyes === 'happy' ? 0.3 : expression.eyes === 'surprised' ? 1.2 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
            {expression.eyes === 'surprised' && (
              <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-white" />
            )}
          </motion.div>
          {/* Right Eye */}
          <motion.div 
            className="relative w-3 h-3.5 rounded-full bg-white flex items-center justify-center overflow-hidden"
            style={{
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <motion.div 
              className="w-2 h-2.5 rounded-full bg-slate-800"
              animate={{
                x: eyeOffset.x,
                y: eyeOffset.y,
                scaleY: expression.eyes === 'happy' ? 0.3 : expression.eyes === 'surprised' ? 1.2 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
            {expression.eyes === 'surprised' && (
              <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-white" />
            )}
          </motion.div>
        </div>

        {/* Mouth */}
        <motion.div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
          animate={{
            scale: expression.mouth === 'big-smile' ? 1.3 : 1,
          }}
        >
          {expression.mouth === 'smile' || expression.mouth === 'big-smile' ? (
            <div className="w-5 h-2.5 border-b-2 border-slate-700 rounded-b-full" />
          ) : expression.mouth === 'o' ? (
            <div className="w-3 h-3 rounded-full border-2 border-slate-700" />
          ) : (
            <div className="w-3 h-1 bg-slate-700 rounded-full" />
          )}
        </motion.div>

        {/* Blush (when happy or dancing) */}
        {(bubMood === 'happy' || bubMood === 'dancing') && (
          <>
            <div className="absolute top-1/2 left-2 w-3 h-2 rounded-full bg-pink-300/50" />
            <div className="absolute top-1/2 right-2 w-3 h-2 rounded-full bg-pink-300/50" />
          </>
        )}

        {/* Sparkles when dancing */}
        <AnimatePresence>
          {bubMood === 'dancing' && (
            <>
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 text-yellow-300"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: [0, (i % 2 === 0 ? 1 : -1) * 20],
                    y: [0, -20 - i * 5],
                  }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.15,
                    repeat: Infinity,
                  }}
                  style={{
                    left: 30 + (i % 2) * 20,
                    top: 10,
                  }}
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
