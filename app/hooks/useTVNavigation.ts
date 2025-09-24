"use client";
import { useEffect, useRef } from 'react';

export const useTVNavigation = (containerSelector = 'body') => {
  const focusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Atraso mínimo para garantir que todos os elementos sejam renderizados
    setTimeout(() => {
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>('.focusable:not([disabled])')
      );

      if (focusables.length > 0 && !document.activeElement?.closest(containerSelector)) {
          const firstFocusable = focusables[0];
          firstFocusable.focus();
          focusedElementRef.current = firstFocusable;
      }
    }, 100);


    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) {
        return;
      }
      
      const allFocusables = Array.from(
        document.querySelectorAll<HTMLElement>('.focusable:not([disabled])')
      );
      const currentFocused = document.activeElement as HTMLElement;
      
      if (!currentFocused || !allFocusables.includes(currentFocused)) {
        return;
      }
      
      e.preventDefault();

      if (key === 'Enter') {
        currentFocused.click();
        return;
      }
      
      const findNextFocus = (): HTMLElement | null => {
        const currentRect = currentFocused.getBoundingClientRect();
        let bestCandidate: HTMLElement | null = null;
        let minDistance = Infinity;

        for (const candidate of allFocusables) {
          if (candidate === currentFocused) continue;

          const candidateRect = candidate.getBoundingClientRect();
          
          const dx = (candidateRect.left + candidateRect.width / 2) - (currentRect.left + currentRect.width / 2);
          const dy = (candidateRect.top + candidateRect.height / 2) - (currentRect.top + currentRect.height / 2);

          // --- LÓGICA MODIFICADA ---
          // Verifica a sobreposição visual real em vez de calcular a partir dos centros.
          const overlapsHorizontally = candidateRect.left < currentRect.right && candidateRect.right > currentRect.left;
          const overlapsVertically = candidateRect.top < currentRect.bottom && candidateRect.bottom > currentRect.top;

          let isValidCandidate = false;

          switch (key) {
            case 'ArrowDown':
              // O candidato deve estar abaixo e ter uma sobreposição horizontal.
              if (dy > 0 && overlapsHorizontally) {
                isValidCandidate = true;
              }
              break;
            case 'ArrowUp':
              // O candidato deve estar acima e ter uma sobreposição horizontal.
              if (dy < 0 && overlapsHorizontally) {
                isValidCandidate = true;
              }
              break;
            case 'ArrowRight':
              // O candidato deve estar à direita e ter uma sobreposição vertical.
              if (dx > 0 && overlapsVertically) {
                isValidCandidate = true;
              }
              break;
            case 'ArrowLeft':
              // O candidato deve estar à esquerda e ter uma sobreposição vertical.
              if (dx < 0 && overlapsVertically) {
                isValidCandidate = true;
              }
              break;
          }

          if (isValidCandidate) {
            // A fórmula de distância com penalidade foi mantida, pois é eficaz.
            const distance = (key === 'ArrowLeft' || key === 'ArrowRight') 
                ? Math.sqrt(dx * dx + (dy * dy * 2.5)) // Penaliza movimento vertical
                : Math.sqrt((dx * dx * 2.5) + dy * dy); // Penaliza movimento horizontal
            
            if (distance < minDistance) {
              minDistance = distance;
              bestCandidate = candidate;
            }
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