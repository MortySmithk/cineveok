// app/hooks/useWatchHistory.ts
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../components/AuthProvider';
import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

export interface WatchItem {
  id: string; // "type-tmdbId" para filmes ou "type-tmdbId-season-episode" para series
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

export const useWatchHistory = () => {
  const { user } = useAuth();
  const [continueWatching, setContinueWatching] = useState<WatchItem[]>([]);
  const [fullHistory, setFullHistory] = useState<WatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega o histórico e o "continuar assistindo" do Firestore quando o usuário loga
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      
      // Listener para "Continuar Assistindo" (10 mais recentes)
      const cwQuery = query(
        collection(db, `users/${user.uid}/watchHistory`),
        orderBy('lastWatched', 'desc'),
        limit(10)
      );
      const unsubscribeCW = onSnapshot(cwQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data() as WatchItem);
        setContinueWatching(items);
      });

      // Listener para o Histórico Completo
      const historyQuery = query(
        collection(db, `users/${user.uid}/watchHistory`),
        orderBy('lastWatched', 'desc')
      );
      const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data() as WatchItem);
        setFullHistory(items);
        setIsLoading(false); // Apenas para o histórico completo
      });
      
      return () => {
        unsubscribeCW();
        unsubscribeHistory();
      };
    } else {
      // Limpa o estado se o usuário deslogar
      setContinueWatching([]);
      setFullHistory([]);
      setIsLoading(false);
    }
  }, [user]);

  const saveHistory = useCallback(async (item: Omit<WatchItem, 'id' | 'lastWatched'>) => {
    if (!user) return;

    // ID único para episódios e filmes no histórico
    const id = item.mediaType === 'tv' && item.progress
      ? `${item.mediaType}-${item.tmdbId}-${item.progress.season}-${item.progress.episode}`
      : `${item.mediaType}-${item.tmdbId}`;
      
    const newItem: WatchItem = { ...item, id, lastWatched: Date.now() };

    try {
      const historyDocRef = doc(db, `users/${user.uid}/watchHistory`, id);
      await setDoc(historyDocRef, newItem, { merge: true }); // Usar merge para não sobrescrever dados existentes sem necessidade

    } catch (error) {
      console.error("Falha ao salvar o progresso no Firestore.", error);
    }
  }, [user]);

  return { 
    continueWatching, 
    fullHistory, 
    isLoading, 
    saveHistory, 
    // Contagens para a página de histórico
    movieCount: fullHistory.filter(item => item.mediaType === 'movie').length,
    episodeCount: fullHistory.filter(item => item.mediaType === 'tv').length,
  };
};