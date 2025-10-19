// app/hooks/useWatchHistory.ts
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../components/AuthProvider';
import { db } from '@/app/components/firebase';
import { doc, setDoc, onSnapshot, query, orderBy, limit, collection, getDocs } from 'firebase/firestore';

export interface WatchItem {
  id: string;
  mediaType: 'movie' | 'tv';
  tmdbId: string;
  title: string;
  poster_path: string;
  lastWatched: number;
  progress?: {
    season: number;
    episode: number;
  };
}

export const useWatchHistory = () => {
  const { user } = useAuth();
  const [continueWatching, setContinueWatching] = useState<WatchItem[]>([]);
  const [fullHistory, setFullHistory] = useState<WatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const continueWatchingRef = useRef(continueWatching);
  continueWatchingRef.current = continueWatching;

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const historyCollection = collection(db, `users/${user.uid}/watchHistory`);

      // Otimização: Mantém onSnapshot apenas para a lista "Continuar Assistindo" que é menor e mais dinâmica.
      const cwQuery = query(historyCollection, orderBy('lastWatched', 'desc'), limit(10));
      const unsubscribeCW = onSnapshot(cwQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data() as WatchItem);
        setContinueWatching(items);
        // A lista completa pode ser carregada apenas uma vez para performance.
        if (isLoading) {
            getDocs(query(historyCollection, orderBy('lastWatched', 'desc')))
                .then(historySnapshot => {
                    const historyItems = historySnapshot.docs.map(doc => doc.data() as WatchItem);
                    setFullHistory(historyItems);
                })
                .finally(() => setIsLoading(false));
        }
      });
      
      return () => {
        unsubscribeCW();
      };
    } else {
      setContinueWatching([]);
      setFullHistory([]);
      setIsLoading(false);
    }
  }, [user, isLoading]);

  const saveHistory = useCallback(async (item: Omit<WatchItem, 'id' | 'lastWatched'>) => {
    if (!user) return;

    const id = item.mediaType === 'tv' && item.progress
      ? `${item.mediaType}-${item.tmdbId}-${item.progress.season}-${item.progress.episode}`
      : `${item.mediaType}-${item.tmdbId}`;
      
    const newItem: WatchItem = { ...item, id, lastWatched: Date.now() };

    try {
      const historyDocRef = doc(db, `users/${user.uid}/watchHistory`, id);
      // Usar setDoc com merge é eficiente para criar ou atualizar o documento.
      await setDoc(historyDocRef, newItem, { merge: true });
    } catch (error) {
      console.error("Falha ao salvar o progresso no Firestore.", error);
    }
  }, [user]);

  return { 
    continueWatching, 
    fullHistory, 
    isLoading, 
    saveHistory, 
    movieCount: fullHistory.filter(item => item.mediaType === 'movie').length,
    episodeCount: fullHistory.filter(item => item.mediaType === 'tv').length,
  };
};