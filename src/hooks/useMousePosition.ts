import { useState, useEffect, useRef, useCallback } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

export interface UseMousePositionOptions {
  enabled?: boolean;
}

export const useMousePosition = (options?: UseMousePositionOptions) => {
  const enabled = options?.enabled !== false;
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);
  const positionRef = useRef<MousePosition>({ x: 0, y: 0 });

  const updatePosition = useCallback(() => {
    setMousePosition({ ...positionRef.current });
    frameRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      positionRef.current = { x: event.clientX, y: event.clientY };
      
      if (!frameRef.current) {
        frameRef.current = requestAnimationFrame(updatePosition);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [enabled, updatePosition]);

  return mousePosition;
};
