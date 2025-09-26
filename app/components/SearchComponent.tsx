// app/components/SearchComponent.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { generateSlug } from '../lib/utils'; // Importa a nova função

import SearchIcon from './icons/SearchIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import HistoryIcon from './icons/HistoryIcon';
import XIcon from './icons/XIcon';
import VoiceSearchOverlay from './VoiceSearchOverlay';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Suggestion {
  id: number; media_type: 'movie' | 'tv' | 'person'; title?: string; name?: string;
  poster_path?: string; profile_path?: string;
}
interface SearchComponentProps { isMobile?: boolean; onSearch?: () => void; }

const API_KEY = "860b66ade580bacae581f4228fad49fc";

export default function SearchComponent({ isMobile = false, onSearch }: SearchComponentProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const router = useRouter();
  const { history, addToHistory, removeFromHistory } = useSearchHistory();

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(searchQuery)}&page=1`);
      setSuggestions(response.data.results.slice(0, 7));
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query, fetchSuggestions]);

  const handleSearch = (e: React.FormEvent, searchTerm: string = query) => {
    e.preventDefault();
    const finalTerm = searchTerm.trim();
    if (finalTerm) {
      addToHistory(finalTerm);
      router.push(`/search?q=${encodeURIComponent(finalTerm)}`);
      cleanup();
    }
  };

  const cleanup = () => {
    setQuery('');
    setSuggestions([]);
    setIsActive(false);
    onSearch?.();
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("O seu navegador não suporta a pesquisa por voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setIsVoiceOverlayOpen(true);
    };
    recognition.onend = () => {
      setIsListening(false);
      setIsVoiceOverlayOpen(false);
    };
    recognition.onerror = (event: any) => {
      console.error("Erro no reconhecimento de voz:", event.error);
      setIsListening(false);
      setIsVoiceOverlayOpen(false);
    };
    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      setQuery(speechResult);
    };
    
    recognition.start();
  };

  const renderHistoryAndSuggestions = () => (
    <div className="suggestions-dropdown">
      {query.length < 2 && history.length > 0 && (
        <div className="history-list">
          {history.map((term) => (
            <div key={term} className="history-item">
              <HistoryIcon className="history-icon" onClick={() => setQuery(term)} />
              <span className="history-text" onClick={() => setQuery(term)}>{term}</span>
              <button onClick={() => removeFromHistory(term)} className="history-remove-btn">
                <XIcon width={16} height={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {suggestions.map((item) => {
        if (item.media_type === 'person' || !item.poster_path) return null;
        return (
          <Link href={`/media/${item.media_type}/${generateSlug(item.title || item.name || '')}-${item.id}`} key={item.id} className="suggestion-item" onClick={cleanup}>
            <div className="suggestion-image">
              <Image
                src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                alt={item.title || item.name || 'Poster'}
                width={40} height={60} style={{ objectFit: 'cover' }}
              />
            </div>
            <span>{item.title || item.name}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      <VoiceSearchOverlay isOpen={isVoiceOverlayOpen} onClose={() => setIsVoiceOverlayOpen(false)} />
      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsActive(true)}
            onBlur={() => setTimeout(() => setIsActive(false), 200)}
            placeholder="Pesquisar..."
            className="search-input"
            autoFocus={isMobile}
          />
          <button type="button" className={`voice-search-btn ${isListening ? 'listening' : ''}`} onClick={handleVoiceSearch}>
            <MicrophoneIcon width={20} height={20} />
          </button>
          <button type="submit" className="search-button">
            <SearchIcon width={18} height={18} />
          </button>
        </form>
        {isActive && !isMobile && (query.length > 1 || history.length > 0) && renderHistoryAndSuggestions()}
      </div>
    </>
  );
}