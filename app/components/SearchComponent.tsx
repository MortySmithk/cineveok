// app/components/SearchComponent.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import SearchIcon from './icons/SearchIcon';

interface Suggestion {
  id: number;
  media_type: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  poster_path?: string;
  profile_path?: string;
}

const API_KEY = "860b66ade580bacae581f4228fad49fc";

export default function SearchComponent() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isActive, setIsActive] = useState(false);
  const router = useRouter();

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(searchQuery)}&page=1`);
      setSuggestions(response.data.results.slice(0, 5)); // Limita a 5 sugestões
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions(query);
    }, 300); // Debounce de 300ms

    return () => {
      clearTimeout(handler);
    };
  }, [query, fetchSuggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setSuggestions([]);
      setQuery('');
      setIsActive(false);
    }
  };

  const handleSuggestionClick = () => {
    setSuggestions([]);
    setQuery('');
    setIsActive(false);
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsActive(true)}
          onBlur={() => setTimeout(() => setIsActive(false), 200)} // Delay para permitir o clique na sugestão
          placeholder="Pesquisar filmes e séries..."
          className="search-input"
        />
        <button type="submit" className="search-button">
          <SearchIcon width={18} height={18} />
        </button>
      </form>
      {isActive && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((item) => {
            if (item.media_type === 'person') return null; // Ignora pessoas nas sugestões
            return (
              <Link
                href={`/media/${item.media_type}/${item.id}`}
                key={item.id}
                className="suggestion-item"
                onClick={handleSuggestionClick}
              >
                <div className="suggestion-image">
                  <Image
                    src={`https://image.tmdb.org/t/p/w92${item.poster_path || item.profile_path}`}
                    alt={item.title || item.name || 'Poster'}
                    width={40}
                    height={60}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <span>{item.title || item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}