import { useState, useEffect } from 'react';

const STORAGE_KEY = 'bubbleverse-show-mascot';

export const useMascotVisibility = () => {
  const [showMascot, setShowMascot] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(showMascot));
  }, [showMascot]);

  const toggleMascot = () => setShowMascot((prev) => !prev);

  return { showMascot, setShowMascot, toggleMascot };
};

export default useMascotVisibility;
