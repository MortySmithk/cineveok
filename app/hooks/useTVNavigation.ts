// cineveo-next/app/hooks/useTVNavigation.ts
import { useEffect, useRef } from 'react';

export const useTVNavigation = (focusableSelector: string) => {
  const focusedIndex = useRef<number>(0);

  useEffect(() => {
    const focusables = document.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      const elements = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector));
      if (elements.length === 0) return;

      let nextIndex = focusedIndex.current;

      switch (key) {
        case 'ArrowUp':
          // Lógica para navegar para cima (simplificada)
          nextIndex = Math.max(0, focusedIndex.current - 1);
          break;
        case 'ArrowDown':
           // Lógica para navegar para baixo (simplificada)
          nextIndex = Math.min(elements.length - 1, focusedIndex.current + 1);
          break;
        case 'ArrowLeft':
          nextIndex = Math.max(0, focusedIndex.current - 1);
          break;
        case 'ArrowRight':
          nextIndex = Math.min(elements.length - 1, focusedIndex.current + 1);
          break;
        case 'Enter':
          (elements[focusedIndex.current] as HTMLElement).click();
          break;
        default:
          return;
      }
      
      e.preventDefault();
      elements[nextIndex]?.focus();
      focusedIndex.current = nextIndex;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusableSelector]);
};