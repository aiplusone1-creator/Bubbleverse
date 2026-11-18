import React, { useCallback, useRef, useState } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TiltBookCardProps {
  children: React.ReactNode;
  /** Layout and border-radius classes applied to the outer perspective wrapper */
  className?: string;
  /** Optional classes applied to the tilting inner 3D surface */
  innerClassName?: string;
  /** Maximum tilt angle in degrees on X and Y axes. Default: 10 */
  maxTilt?: number;
  /** CSS perspective distance in px. Default: 1100 */
  perspective?: number;
  /** Hover scale multiplier. Default: 1.02 */
  scaleOnHover?: number;
  /** Show moving specular glare sheen on hover. Default: true */
  glare?: boolean;
  /** Peak glare opacity (0..1). Default: 0.26 */
  glareMaxOpacity?: number;
  /** Optional click handler */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  /** Disable 3D tilt & glare (automatically disabled under prefers-reduced-motion) */
  disabled?: boolean;
}

const SPRING_CONFIG = {
  stiffness: 260,
  damping: 24,
  mass: 0.6,
};

export const TiltBookCard: React.FC<TiltBookCardProps> = ({
  children,
  className,
  innerClassName,
  maxTilt = 10,
  perspective = 1100,
  scaleOnHover = 1.02,
  glare = true,
  glareMaxOpacity = 0.26,
  onClick,
  disabled = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = Boolean(useReducedMotion());
  const isStatic = shouldReduceMotion || disabled;
  const [isHovered, setIsHovered] = useState(false);

  // Normalized pointer coordinates in [-0.5, 0.5]
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const smoothX = useSpring(pointerX, SPRING_CONFIG);
  const smoothY = useSpring(pointerY, SPRING_CONFIG);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const glareX = useTransform(smoothX, [-0.5, 0.5], [15, 85]);
  const glareY = useTransform(smoothY, [-0.5, 0.5], [15, 85]);

  const cyanOpacity = Number((glareMaxOpacity * 0.42).toFixed(3));
  const pinkOpacity = Number((glareMaxOpacity * 0.22).toFixed(3));

  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, ${glareMaxOpacity}) 0%, rgba(0, 217, 255, ${cyanOpacity}) 28%, rgba(244, 114, 182, ${pinkOpacity}) 52%, transparent 72%)`;

  const handlePointerEnter = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isStatic || event.pointerType === 'touch') return;
      setIsHovered(true);
    },
    [isStatic]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isStatic || event.pointerType === 'touch') return;
      const node = cardRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const relX = (event.clientX - rect.left) / rect.width - 0.5;
      const relY = (event.clientY - rect.top) / rect.height - 0.5;

      pointerX.set(Math.max(-0.5, Math.min(0.5, relX)));
      pointerY.set(Math.max(-0.5, Math.min(0.5, relY)));
    },
    [isStatic, pointerX, pointerY]
  );

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    pointerX.set(0);
    pointerY.set(0);
  }, [pointerX, pointerY]);

  if (isStatic) {
    return (
      <div
        onClick={onClick}
        className={cn('relative rounded-3xl', className)}
      >
        <div className={cn('relative h-full w-full rounded-[inherit]', innerClassName)}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      style={{ perspective: `${perspective}px` }}
      className={cn('relative rounded-3xl', className)}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: isHovered ? scaleOnHover : 1,
        }}
        transition={{
          scale: { type: 'spring', stiffness: 320, damping: 24 },
        }}
        className={cn('relative h-full w-full rounded-[inherit]', innerClassName)}
      >
        {children}

        {glare && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] overflow-hidden"
            style={{
              background: glareBackground,
              mixBlendMode: 'screen',
            }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default TiltBookCard;
