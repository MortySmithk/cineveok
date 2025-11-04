// cineveo-next/app/hooks/useAppNavigation.ts
"use client";

import { useEffect, useRef } from 'react';

// Hook de navegação por foco (controle remoto) desativado.
export const useAppNavigation = () => {
  const focusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Toda a lógica de navegação por 'keydown' foi removida
    // para atender ao pedido de otimização e remoção da funcionalidade.
    
    // O código original que ouvia as teclas (ArrowUp, ArrowDown, etc.) foi removido.
    
  }, []); // O hook agora executa e não faz nada.

  return focusedElementRef;
};