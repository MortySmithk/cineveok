// cineveo-next/app/components/CategoryPage.tsx
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import StarIcon from './icons/StarIcon';
import BookmarkIcon from './icons/BookmarkIcon';
import { generateSlug } from '../lib/utils';

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

export default function CategoryPage({ title, mediaType, fetchUrl, isSearchPage = false }: CategoryPageProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(500);

  useEffect(() => {
    if (isSearchPage) return; 
    const fetchGenres = async () => {
      try {
        const response = await axios.get(`https://api.themoviedb.org/3/genre/${mediaType}/list?api_key=${API_KEY}&language=pt-BR`);
        setGenres(response.data.genres);
      } catch (error) { console.error("Erro ao buscar gêneros:", error); }
    };
    fetchGenres();
  }, [mediaType, isSearchPage]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsLoading(true);
    let url = isSearchPage
      ? `${fetchUrl}&page=${page}`
      : selectedGenre
      ? `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=${selectedGenre}&page=${page}`
      : `${fetchUrl}&page=${page}`;

    const fetchMedia = async () => {
      try {
        const response = await axios.get(url);
        const filteredResults = response.data.results
          .map((item: Media) => ({
            ...item,
            media_type: item.media_type || mediaType,
          }))
          .filter((item: Media) => item.media_type !== 'person' && item.poster_path && (item.title || item.name));
        
        setMediaList(filteredResults);
        setTotalPages(Math.min(response.data.total_pages, 500));
      } catch (error) {
        console.error(`Erro ao buscar mídia:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedia();
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
                <Link href={`/media/${item.media_type}/${generateSlug(item.title || item.name || '')}-${item.id}`} key={item.id} className="movie-card focusable">
                  <div className="movie-card-poster-wrapper">
                    <Image
                      src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://i.ibb.co/XzZ0b1B/placeholder.png'}
                      alt={item.title || item.name || ''}
                      fill
                      className="movie-card-poster"
                      sizes="(max-width: 768px) 30vw, (max-width: 1200px) 20vw, 15vw"
                    />
                  </div>
                  <div className="movie-card-overlay">
                    <Image 
                        src="https://i.ibb.co/Q7V0pybV/bot-o-play-sem-bg.png" 
                        alt="Play" 
                        width={110}
                        height={110}
                        className="play-button-overlay" 
                        style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <div className="movie-card-bookmark"><BookmarkIcon /></div>
                  <div className="movie-card-info">
                    <h3 className="movie-card-title">{item.title || item.name}</h3>
                    <div className="movie-card-meta">
                      <span>{(item.release_date || item.first_air_date)?.substring(0, 4) || 'N/A'}</span>
                      <span><StarIcon /> {item.vote_average > 0 ? item.vote_average.toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
                </Link>
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