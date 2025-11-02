// app/search/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { generateSlug } from '@/app/lib/utils';
import { useSearchHistory } from '@/app/hooks/useSearchHistory';
import PlayIcon from '@/app/components/icons/PlayIcon';
import StarIcon from '@/app/components/icons/StarIcon';
import HistoryIcon from '@/app/components/icons/HistoryIcon';
import XIcon from '@/app/components/icons/XIcon';
import BookmarkButton from '@/app/components/BookmarkButton'; // <-- 1. IMPORTAR

const API_KEY = "860b66ade580bacae581f4228fad49fc";

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
  profile_path?: string; // Para pessoas
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { searchHistory, addSearchTerm, removeSearchTerm } = useSearchHistory();

  useEffect(() => {
    if (query) {
      const fetchSearch = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`);
          const filteredResults = response.data.results
            .filter((item: MediaItem) => 
              (item.media_type === 'movie' || item.media_type === 'tv') &&
              item.poster_path && 
              (item.title || item.name)
            );
          setResults(filteredResults);
          addSearchTerm(query);
        } catch (error) {
          console.error("Erro ao buscar:", error);
        }
        setLoading(false);
      };
      fetchSearch();
    } else {
      setResults([]); // Limpa os resultados se a busca for vazia
    }
  }, [query, addSearchTerm]);

  const handleHistoryClick = (term: string) => {
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const renderSkeletons = () => (
    <div className="media-grid">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="media-card-skeleton">
          <div className="thumbnail-skeleton"></div>
          <div className="title-skeleton"></div>
          <div className="meta-skeleton"></div>
        </div>
      ))}
    </div>
  );

  return (
    <main className="main-container" style={{ paddingTop: '2rem' }}>
      {!query && (
        <>
          <h1 className="page-title">Buscas Recentes</h1>
          {searchHistory.length > 0 ? (
            <ul className="search-history-list">
              {searchHistory.map((term, index) => (
                <li key={index}>
                  <button 
                    onClick={() => handleHistoryClick(term)} 
                    className="history-term-btn focusable"
                  >
                    <HistoryIcon width={16} height={16} />
                    <span>{term}</span>
                  </button>
                  <button 
                    onClick={() => removeSearchTerm(term)} 
                    className="history-remove-btn focusable"
                    aria-label={`Remover "${term}" do histórico`}
                  >
                    <XIcon width={16} height={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              Seu histórico de busca está vazio.
            </p>
          )}
        </>
      )}

      {query && (
        <>
          <h1 className="page-title">Resultados para: &quot;{query}&quot;</h1>
          {loading ? (
            renderSkeletons()
          ) : results.length > 0 ? (
            <div className="media-grid">
              {results.map((item) => {
                const itemTitle = item.title || item.name || 'Título';
                const slug = generateSlug(itemTitle) + '-' + item.id;
                const url = `/media/${item.media_type}/${slug}`;
                const year = (item.release_date || item.first_air_date)?.substring(0, 4);

                return (
                  <Link href={url} key={item.id} className="media-card focusable" draggable="false">
                    <div className="thumbnail-wrapper">
                      <Image
                        src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                        alt={itemTitle}
                        fill
                        sizes="(max-width: 600px) 33vw, (max-width: 900px) 25vw, 20vw"
                        className="thumbnail-image"
                        draggable="false"
                        loading="lazy"
                      />
                      <div className="play-icon-overlay">
                        <PlayIcon width={32} height={32} />
                      </div>
                      {/* 2. ADICIONAR O BOTÃO */}
                      <BookmarkButton item={item} />
                    </div>
                    <div className="card-info">
                      <h3 className="card-title">{itemTitle}</h3>
                      <div className="card-meta">
                        {year && <span>{year}</span>}
                        {item.vote_average > 0 && (
                          <span className="rating">
                            <StarIcon width={12} height={12} />
                            {item.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '1.1rem', marginTop: '2rem' }}>
              Nenhum resultado encontrado para &quot;{query}&quot;.
            </p>
          )}
        </>
      )}
    </main>
  );
}

// Componente wrapper para Suspense
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="loading-container"><div className="spinner"></div></div>}>
      <SearchPageContent />
    </Suspense>
  );
}