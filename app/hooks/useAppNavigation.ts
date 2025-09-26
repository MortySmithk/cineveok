// cineveo-next/app/hooks/useAppNavigation.ts
"use client";

import { useEffect, useRef } from 'react';

export const useAppNavigation = () => {
  const focusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) {
        return;
      }
      
      const allFocusables = Array.from(
        document.querySelectorAll<HTMLElement>('.focusable:not([disabled])')
      );
      
      // Se não houver elementos focáveis, não faz nada.
      if (allFocusables.length === 0) {
        return;
      }
      
      const currentFocused = document.activeElement as HTMLElement;
      
      // Se nada estiver focado, foca no primeiro elemento da lista e para a execução.
      if (!currentFocused || !allFocusables.includes(currentFocused)) {
        allFocusables[0].focus();
        focusedElementRef.current = allFocusables[0];
        e.preventDefault();
        return;
      }
      
      e.preventDefault();

      if (key === 'Enter') {
        // Trata diferentes elementos que podem ser "clicados"
        if (currentFocused instanceof HTMLButtonElement || currentFocused instanceof HTMLAnchorElement) {
          currentFocused.click();
        }
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
          // Penaliza movimentos no eixo oposto.
          switch (key) {
            case 'ArrowDown':
              if (dy > 0 && Math.abs(dx) < Math.abs(dy)) isValidCandidate = true;
              break;
            case 'ArrowUp':
              if (dy < 0 && Math.abs(dx) < Math.abs(dy)) isValidCandidate = true;
              break;
            case 'ArrowRight':
              if (dx > 0 && Math.abs(dy) < Math.abs(dx)) isValidCandidate = true;
              break;
            case 'ArrowLeft':
              if (dx < 0 && Math.abs(dy) < Math.abs(dx)) isValidCandidate = true;
              break;
          }

          if (isValidCandidate) {
            // Fórmula de distância com um forte "viés de eixo".
            const distance = (key === 'ArrowLeft' || key === 'ArrowRight') 
                ? Math.sqrt(Math.pow(dx, 2) + Math.pow(dy * 2.5, 2)) // Aumenta a penalidade vertical
                : Math.sqrt(Math.pow(dx * 2.5, 2) + Math.pow(dy, 2)); // Aumenta a penalidade horizontal
            
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
        // O scrollIntoView do próprio navegador ao focar já é suficiente na maioria das vezes.
        // nextFocus.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []); // A dependência foi removida para rodar apenas uma vez

  return focusedElementRef;
};