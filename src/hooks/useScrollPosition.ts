import { useState, useEffect, useRef, useCallback } from 'react';

export const useScrollPosition = () => {
  const [scrollY, setScrollY] = useState(0);
  const frameRef = useRef<number | null>(null);
  const scrollRef = useRef(0);

  const updateScroll = useCallback(() => {
    setScrollY(scrollRef.current);
    frameRef.current = null;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      scrollRef.current = window.scrollY;
      
      if (!frameRef.current) {
        frameRef.current = requestAnimationFrame(updateScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [updateScroll]);

  return scrollY;
};
