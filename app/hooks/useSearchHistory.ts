"use client";

import { useState, useCallback, useEffect } from 'react';

const HISTORY_KEY = 'cineveo_search_history';

export const useSearchHistory = () => {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Falha ao carregar histórico de pesquisa.", error);
      setHistory([]);
    }
  }, []);

  const addToHistory = useCallback((term: string) => {
    if (!term) return;
    setHistory(prevHistory => {
      // Remove o termo se já existir para movê-lo para o topo
      const newHistory = prevHistory.filter(item => item.toLowerCase() !== term.toLowerCase());
      // Adiciona o novo termo no início e limita o histórico a 10 itens
      const updatedHistory = [term, ...newHistory].slice(0, 10);
      
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Falha ao salvar histórico de pesquisa.", error);
      }
      
      return updatedHistory;
    });
  }, []);

  const removeFromHistory = useCallback((term: string) => {
    setHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(item => item.toLowerCase() !== term.toLowerCase());
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error("Falha ao remover item do histórico.", error);
      }
      return updatedHistory;
    });
  }, []);

  return { history, addToHistory, removeFromHistory };
};