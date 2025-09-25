"use client";
import { useEffect, useRef } from 'react';

export const useAppNavigation = (containerSelector = 'body') => {
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
        // Se nada estiver focado, foca no primeiro elemento focável
        if (allFocusables.length > 0) {
          allFocusables[0].focus();
        }
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

          let isValidCandidate = false;

          // Verifica se o candidato está na direção geral do movimento da seta.
          switch (key) {
            case 'ArrowDown':
              if (dy > 0) isValidCandidate = true;
              break;
            case 'ArrowUp':
              if (dy < 0) isValidCandidate = true;
              break;
            case 'ArrowRight':
              if (dx > 0) isValidCandidate = true;
              break;
            case 'ArrowLeft':
              if (dx < 0) isValidCandidate = true;
              break;
          }

          if (isValidCandidate) {
            // Nova fórmula de distância com um forte "viés de eixo".
            // Isto penaliza fortemente o desvio do eixo principal do movimento.
            // Por exemplo, ao pressionar 'para baixo', a distância horizontal (dx) é muito mais "cara" do que a vertical (dy).
            const distance = (key === 'ArrowLeft' || key === 'ArrowRight') 
                ? Math.sqrt(Math.pow(dx, 2) + Math.pow(dy * 3, 2)) // Penaliza fortemente o movimento vertical
                : Math.sqrt(Math.pow(dx * 3, 2) + Math.pow(dy, 2)); // Penaliza fortemente o movimento horizontal
            
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
        // Garante que o item focado esteja visível no ecrã
        nextFocus.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [containerSelector]);

  return focusedElementRef;
};