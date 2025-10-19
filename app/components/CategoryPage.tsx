// app/components/CategoryPage.tsx
"use client";

import { useState, useEffect, memo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import StarIcon from './icons/StarIcon';
import BookmarkIcon from './icons/BookmarkIcon';
import PlayIcon from './icons/PlayIcon';
import { generateSlug } from '../lib/utils';

// Otimização: Placeholder para imagens enquanto carregam
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

const BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(shimmer(500, 750))}`;

interface Media {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  profile_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type: 'movie' | 'tv' | 'person';
}
interface Genre { id: number; name: string; }
interface CategoryPageProps {
  title: string;
  mediaType: 'movie' | 'tv';
  fetchUrl: string;
  isSearchPage?: boolean;
}

const API_KEY = "860b66ade580bacae581f4228fad49fc";

// Otimização: Componente do card memoizado para evitar re-renderizações
const MediaCard = memo(function MediaCard({ item }: { item: Media }) {
  const title = item.title || item.name;
  return (
    <Link draggable="false" href={`/media/${item.media_type}/${generateSlug(title || '')}-${item.id}`} className="movie-card focusable">
      <div className="movie-card-poster-wrapper">
        <Image
          draggable="false"
          src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://i.ibb.co/XzZ0b1B/placeholder.png'}
          alt={title || ''}
          fill
          className="movie-card-poster"
          sizes="(max-width: 768px) 30vw, (max-width: 1200px) 20vw, 15vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
        <div className="movie-card-play-icon-overlay">
            <PlayIcon />
        </div>
        <div className="movie-card-bookmark"><BookmarkIcon /></div>
      </div>
      <div className="movie-card-info">
        <h3 className="movie-card-title">{title}</h3>
        <div className="movie-card-meta">
          <span>{(item.release_date || item.first_air_date)?.substring(0, 4) || 'N/A'}</span>
          <span><StarIcon /> {item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A'}</span>
        </div>
      </div>
    </Link>
  );
});


export default function CategoryPage({ title, mediaType, fetchUrl, isSearchPage = false }: CategoryPageProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(500);

  useEffect(() => {
    if (isSearchPage) return;
    axios.get(`https://api.themoviedb.org/3/genre/${mediaType}/list?api_key=${API_KEY}&language=pt-BR`)
      .then(response => setGenres(response.data.genres))
      .catch(error => console.error("Erro ao buscar gêneros:", error));
  }, [mediaType, isSearchPage]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoading(true);
    
    const source = axios.CancelToken.source();

    let url = isSearchPage
      ? `${fetchUrl}&page=${page}`
      : selectedGenre
      ? `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=${selectedGenre}&page=${page}`
      : `${fetchUrl}&page=${page}`;

    axios.get(url, { cancelToken: source.token })
      .then(response => {
        const filteredResults = response.data.results
          .map((item: Media) => ({ ...item, media_type: item.media_type || mediaType }))
          .filter((item: Media) => item.media_type !== 'person' && item.poster_path && (item.title || item.name));
        
        setMediaList(filteredResults);
        setTotalPages(Math.min(response.data.total_pages, 500));
      })
      .catch(error => {
        if (!axios.isCancel(error)) {
          console.error(`Erro ao buscar mídia:`, error);
        }
      })
      .finally(() => setIsLoading(false));

    return () => {
      source.cancel("Componente desmontado, cancelando requisição.");
    };
  }, [selectedGenre, mediaType, page, fetchUrl, isSearchPage]);
  
  const handleGenreChange = (genreId: number | null) => {
    setPage(1);
    setSelectedGenre(genreId);
  };
  
  return (
    <main style={{ paddingTop: '100px' }}>
      <div className="main-container">
        <h1 className="page-title">{title}</h1>
        
        {!isSearchPage && (
          <div className="genre-filter-bar">
            <button onClick={() => handleGenreChange(null)} className={`focusable ${!selectedGenre ? 'active' : ''}`}>Todos</button>
            {genres.map(genre => (
              <button key={genre.id} onClick={() => handleGenreChange(genre.id)} className={`focusable ${selectedGenre === genre.id ? 'active' : ''}`}>{genre.name}</button>
            ))}
          </div>
        )}
        
        {isLoading ? (
          <div className="loading-container" style={{ minHeight: '50vh' }}>
            <div className='spinner'></div>
          </div>
        ) : mediaList.length === 0 ? (
          <p>Nenhum resultado encontrado.</p>
        ) : (
          <>
            <div className="responsive-grid">
              {mediaList.map((item) => (
                <MediaCard item={item} key={item.id} />
              ))}
            </div>
            <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem'}}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary focusable">Anterior</button>
              <span style={{alignSelf: 'center'}}>Página {page} de {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary focusable">Próxima</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}