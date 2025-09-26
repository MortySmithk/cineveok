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
      
      if (allFocusables.length === 0) {
        return;
      }
      
      const currentFocused = document.activeElement as HTMLElement;
      
      if (!currentFocused || !allFocusables.includes(currentFocused)) {
        allFocusables[0].focus();
        focusedElementRef.current = allFocusables[0];
        e.preventDefault();
        return;
      }
      
      // --- CORREÇÃO FINAL AQUI ---
      if (key === 'Enter') {
        // Prevenimos a ação padrão em todos os casos para ter controle total.
        e.preventDefault();

        // Se o foco estiver em um input que pertence a um formulário...
        if (currentFocused instanceof HTMLInputElement && currentFocused.form) {
            // Encontra o botão de submit dentro do formulário e o "clica".
            // Esta é a forma mais robusta de garantir que o onSubmit do React será chamado.
            const submitButton = currentFocused.form.querySelector<HTMLButtonElement>('button[type="submit"]');
            if (submitButton) {
                submitButton.click();
            }
        } else if (currentFocused instanceof HTMLButtonElement || currentFocused instanceof HTMLAnchorElement) {
            // Lógica para outros elementos clicáveis continua a mesma.
            currentFocused.click();
        }
        return;
      }

      // Prevenimos o padrão apenas para as setas de navegação
      e.preventDefault();
      
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

          switch (key) {
            case 'ArrowDown':
              if (dy > 0 && Math.abs(dx) < Math.abs(dy) * 2) isValidCandidate = true;
              break;
            case 'ArrowUp':
              if (dy < 0 && Math.abs(dx) < Math.abs(dy) * 2) isValidCandidate = true;
              break;
            case 'ArrowRight':
              if (dx > 0 && Math.abs(dy) < Math.abs(dx) * 2) isValidCandidate = true;
              break;
            case 'ArrowLeft':
              if (dx < 0 && Math.abs(dy) < Math.abs(dx) * 2) isValidCandidate = true;
              break;
          }

          if (isValidCandidate) {
            const distance = (key === 'ArrowLeft' || key === 'ArrowRight') 
                ? Math.sqrt(Math.pow(dx, 2) + Math.pow(dy * 2.5, 2))
                : Math.sqrt(Math.pow(dx * 2.5, 2) + Math.pow(dy, 2));
            
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
  }, []);

  return focusedElementRef;
};