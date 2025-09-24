"use client";
import { useEffect, useRef } from 'react';

export const useTVNavigation = (containerSelector = 'body') => {
  const focusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>('.focusable')
    );

    if (focusables.length > 0) {
        const firstFocusable = focusables[0];
        firstFocusable.focus();
        focusedElementRef.current = firstFocusable;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) {
        return;
      }
      e.preventDefault();

      const currentFocused = document.activeElement as HTMLElement;
      if (!currentFocused || !focusables.includes(currentFocused)) return;
      
      if (key === 'Enter') {
        currentFocused.click();
        return;
      }
      
      const findNextFocus = () => {
        const currentRect = currentFocused.getBoundingClientRect();
        let bestCandidate: HTMLElement | null = null;
        let minDistance = Infinity;

        focusables.forEach(el => {
            if (el === currentFocused) return;
            
            const elRect = el.getBoundingClientRect();
            let isCandidate = false;

            if (key === 'ArrowDown' && elRect.top > currentRect.bottom) isCandidate = true;
            if (key === 'ArrowUp' && elRect.bottom < currentRect.top) isCandidate = true;
            if (key === 'ArrowRight' && elRect.left > currentRect.right) isCandidate = true;
            if (key === 'ArrowLeft' && elRect.right < currentRect.left) isCandidate = true;
            
            if (isCandidate) {
                const dx = (elRect.left + elRect.width / 2) - (currentRect.left + currentRect.width / 2);
                const dy = (elRect.top + elRect.height / 2) - (currentRect.top + currentRect.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDistance) {
                    minDistance = distance;
                    bestCandidate = el;
                }
            }
        });

        // Fallback to simple index-based navigation if geometric search fails
        if (!bestCandidate) {
            const currentIndex = focusables.indexOf(currentFocused);
            if (key === 'ArrowRight' || key === 'ArrowDown') {
                bestCandidate = focusables[Math.min(focusables.length - 1, currentIndex + 1)];
            } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
                bestCandidate = focusables[Math.max(0, currentIndex - 1)];
            }
        }
        
        return bestCandidate;
      };

      const nextFocus = findNextFocus();
      if (nextFocus) {
        nextFocus.focus();
        focusedElementRef.current = nextFocus;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [containerSelector]);

  return focusedElementRef;
};