"use client";
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { useTVNavigation } from '@/app/hooks/useTVNavigation';
import { OnScreenKeyboard } from '@/app/components/OnScreenKeyboard';

interface SearchResult {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path: string;
}

const API_KEY = "860b66ade580bacae581f4228fad49fc";

export default function TVSearchPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    useTVNavigation();

    const fetchResults = useCallback(async (query: string) => {
        if (query.length < 2) {
            setResults([]);
            return;
        }
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`);
            const validResults = response.data.results.filter(
              (item: any) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path
            );
            setResults(validResults);
        } catch (error) {
            console.error("Erro ao buscar resultados:", error);
            setResults([]);
        }
    }, []);
    
    useEffect(() => {
        const handler = setTimeout(() => {
          fetchResults(searchTerm);
        }, 500); // Debounce para evitar chamadas excessivas à API
    
        return () => {
          clearTimeout(handler);
        };
    }, [searchTerm, fetchResults]);

    const handleKeyPress = (key: string) => setSearchTerm(prev => prev + key);
    const handleBackspace = () => setSearchTerm(prev => prev.slice(0, -1));
    const handleClear = () => setSearchTerm('');

    return (
        <div className="tv-search-page">
            <div className="tv-search-input-area">
                <div className="tv-search-field">{searchTerm || 'Pesquisar'}</div>
                
                {results.length > 0 && (
                    <div className='tv-search-results-wrapper'>
                        <h2 className='tv-search-results-title'>Resultados para "{searchTerm}"</h2>
                        <div className="tv-search-results">
                            {results.map(item => (
                                <Link 
                                    href={`/tv/media/${item.media_type}/${item.id}`} 
                                    key={item.id} 
                                    className="tv-search-result-card focusable"
                                >
                                    <Image 
                                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} 
                                        alt={item.title || item.name || ''} 
                                        width={246} 
                                        height={138} 
                                    />
                                    <p>{item.title || item.name}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <OnScreenKeyboard 
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onClear={handleClear}
            />
        </div>
    );
}