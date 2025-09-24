// cineveo-next/app/hooks/useContinueWatching.ts
"use client";

import { useState, useEffect, useCallback } from 'react';

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

  const getProgress = useCallback((type: 'movie' | 'tv', tmdbId: string) => {
    const id = `${type}-${tmdbId}`;
    return history.find(item => item.id === id);
  }, [history]);

  return { history, saveProgress, getProgress };
};