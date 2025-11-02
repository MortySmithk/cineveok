// app/hooks/useWatchHistory.ts
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../components/AuthProvider';
import { db } from '@/app/components/firebase'; // CORRIGIDO: O caminho estava quebrado
import { doc, setDoc, onSnapshot, query, orderBy, limit, collection } from 'firebase/firestore';

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

  // Ref para manter a referência mais recente do estado para a função estável
  const continueWatchingRef = useRef(continueWatching);
  continueWatchingRef.current = continueWatching;

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      
      const historyCollection = collection(db, `users/${user.uid}/watchHistory`);

      const cwQuery = query(historyCollection, orderBy('lastWatched', 'desc'), limit(10));
      const unsubscribeCW = onSnapshot(cwQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data() as WatchItem);
        setContinueWatching(items);
      });

      const historyQuery = query(historyCollection, orderBy('lastWatched', 'desc'));
      const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data() as WatchItem);
        setFullHistory(items);
        setIsLoading(false);
      });
      
      return () => {
        unsubscribeCW();
        unsubscribeHistory();
      };
    } else {
      setContinueWatching([]);
      setFullHistory([]);
      setIsLoading(false);
    }
  }, [user]);

  const saveHistory = useCallback(async (item: Omit<WatchItem, 'id' | 'lastWatched'>) => {
    if (!user) return;

    const id = item.mediaType === 'tv' && item.progress
      ? `${item.mediaType}-${item.tmdbId}-${item.progress.season}-${item.progress.episode}`
      : `${item.mediaType}-${item.tmdbId}`;
      
    const newItem: WatchItem = { ...item, id, lastWatched: Date.now() };

    try {
      const historyDocRef = doc(db, `users/${user.uid}/watchHistory`, id);
      await setDoc(historyDocRef, newItem, { merge: true });
    } catch (error) {
      console.error("Falha ao salvar o progresso no Firestore.", error);
    }
  }, [user]);

  const getContinueWatchingItem = useCallback((tmdbId: string) => {
    if (!tmdbId) return undefined;
    return continueWatchingRef.current.find(item => item.tmdbId === tmdbId);
  }, []);

  return { 
    continueWatching, 
    fullHistory, 
    isLoading, 
    saveHistory, 
    getContinueWatchingItem,
    movieCount: fullHistory.filter(item => item.mediaType === 'movie').length,
    episodeCount: fullHistory.filter(item => item.mediaType === 'tv').length,
  };
};