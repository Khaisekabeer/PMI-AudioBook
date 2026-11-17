import { useEffect, useState, useCallback } from 'react';

// Visual accessibility preferences; browser speech is intentionally not used.
export const useAccessibility = () => {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  useEffect(() => {
    const contrast = localStorage.getItem('highContrast') === 'true';
    const text = localStorage.getItem('largeText') === 'true';
    setHighContrast(contrast);
    setLargeText(text);
    document.body.classList.toggle('high-contrast', contrast);
    document.body.classList.toggle('large-text', text);
  }, []);

  const toggleHighContrast = useCallback(() => {
    const next = !highContrast;
    setHighContrast(next);
    localStorage.setItem('highContrast', String(next));
    document.body.classList.toggle('high-contrast', next);
  }, [highContrast]);

  const toggleLargeText = useCallback(() => {
    const next = !largeText;
    setLargeText(next);
    localStorage.setItem('largeText', String(next));
    document.body.classList.toggle('large-text', next);
  }, [largeText]);

  return { highContrast, largeText, toggleHighContrast, toggleLargeText };
};

// Keyboard navigation helper
export const useKeyboardNavigation = (elements) => {
  const [focusIndex, setFocusIndex] = useState(-1);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!elements || elements.length === 0) return;
      
      if (e.key === 'Tab') {
        // Let normal tab work but sync our index
        return;
      }

      switch(e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        setFocusIndex((prev) => (prev + 1) % elements.length);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        setFocusIndex((prev) => (prev - 1 + elements.length) % elements.length);
        break;
      case 'Home':
        e.preventDefault();
        setFocusIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusIndex(elements.length - 1);
        break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements]);

  useEffect(() => {
    if (focusIndex >= 0 && elements && elements[focusIndex]) {
      elements[focusIndex].focus();
    }
  }, [focusIndex, elements]);

  return { focusIndex, setFocusIndex };
};