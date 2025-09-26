// cineveo-next/app/hooks/useContinueWatching.ts
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

const CW_KEY = 'cineveo_continue_watching';

export interface ContinueWatchingItem {
  id: string; // "type-tmdbId"
  mediaType: 'movie' | 'tv';
  tmdbId: string;
  title: string;
  poster_path: string;
  lastWatched: number; // timestamp
  progress?: {
    season: number;
    episode: number;
  };
}

export const useContinueWatching = () => {
  const [history, setHistory] = useState<ContinueWatchingItem[]>([]);
  // Usamos uma ref para manter uma referência estável ao histórico mais recente
  const historyRef = useRef(history);
  historyRef.current = history;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CW_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Falha ao carregar 'Continuar Assistindo'.", error);
    }
  }, []);

  const saveProgress = useCallback((item: Omit<ContinueWatchingItem, 'id' | 'lastWatched'>) => {
    setHistory(prev => {
      const id = `${item.mediaType}-${item.tmdbId}`;
      const newItem: ContinueWatchingItem = { ...item, id, lastWatched: Date.now() };

      const filtered = prev.filter(i => i.id !== id);
      const updated = [newItem, ...filtered].slice(0, 10); // Limita a 10 itens
      
      try {
        localStorage.setItem(CW_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Falha ao salvar progresso.", error);
      }
      return updated;
    });
  }, []);

  // A função getProgress agora usa a ref.
  // Como a ref em si nunca muda, e a função não tem dependências,
  // ela nunca será recriada, quebrando o loop de renderização.
  const getProgress = useCallback((type: 'movie' | 'tv', tmdbId: string) => {
    const id = `${type}-${tmdbId}`;
    // Lê o histórico atual diretamente da ref, em vez de depender do estado
    return historyRef.current.find(item => item.id === id);
  }, []); // <--- Array de dependências VAZIO é a chave da solução

  return { history, saveProgress, getProgress };
};