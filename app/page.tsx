// app/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import StarIcon from '@/app/components/icons/StarIcon';
// --- ÍCONE REMOVIDO ---
// --- IMPORTAÇÃO REMOVIDA ---
import { useWatchHistory, WatchItem } from '@/app/hooks/useWatchHistory';
import { generateSlug } from '@/app/lib/utils';

interface Media {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  overview: string;
  media_type: 'movie' | 'tv';
}

const API_KEY = "860b66ade580bacae581f4228fad49fc";

// Função para gerar o Href correto
const getContinueWatchingHref = (item: WatchItem) => {
  const base = `/media/${item.mediaType}/${generateSlug(item.title || '')}-${item.tmdbId}`;
  if (item.mediaType === 'tv' && item.progress) {
    return `${base}?season=${item.progress.season}&episode=${item.progress.episode}`;
  }
  return base;
};

// Função para gerar o Href dinâmico (para "Em Alta")
const getMediaHref = (item: Media) => {
  const type = item.media_type || (item.title ? 'movie' : 'tv');
  const title = item.title || item.name || '';
  return `/media/${type}/${generateSlug(title)}-${item.id}`;
};


export default function HomePage() {
  // Estados para os carrosséis
  const [trendingToday, setTrendingToday] = useState<Media[]>([]);
  const [popularMovies, setPopularMovies] = useState<Media[]>([]);
  const [popularSeries, setPopularSeries] = useState<Media[]>([]);
  const [popularAnimations, setPopularAnimations] = useState<Media[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const { continueWatching } = useWatchHistory();

  // Refs para os carrosséis
  const continueWatchingRef = useRef<HTMLDivElement>(null);
  const trendingTodayRef = useRef<HTMLDivElement>(null);
  const popularMoviesRef = useRef<HTMLDivElement>(null);
  const popularSeriesRef = useRef<HTMLDivElement>(null);
  const popularAnimationsRef = useRef<HTMLDivElement>(null);
  
  const hasDragged = useRef(false);

  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true);
      try {
        // Novas requisições
        const trendingTodayPromise = axios.get(`https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}&language=pt-BR`);
        const popularMoviesPromise = axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=pt-BR`);
        const popularSeriesPromise = axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=pt-BR`);
        const popularAnimationsPromise = axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=16`);

        const [
          trendingTodayResponse,
          popularMoviesResponse,
          popularSeriesResponse,
          popularAnimationsResponse
        ] = await Promise.all([
          trendingTodayPromise,
          popularMoviesPromise,
          popularSeriesPromise,
          popularAnimationsPromise
        ]);

        // Função de filtro
        const filterValidMedia = (results: Media[]) => 
          results.filter((item: Media) => (item.title || item.name) && item.poster_path);

        // Definindo os estados
        setTrendingToday(filterValidMedia(trendingTodayResponse.data.results));
        setPopularMovies(filterValidMedia(popularMoviesResponse.data.results));
        setPopularSeries(filterValidMedia(popularSeriesResponse.data.results));
        setPopularAnimations(filterValidMedia(popularAnimationsResponse.data.results));

      } catch (error) { 
        console.error("Erro ao buscar mídia:", error);
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchMedia();
  }, []);

  // Efeito para adicionar a funcionalidade de arrastar para rolar
  // OTIMIZAÇÃO: Este useEffect agora depende apenas de `isLoading`.
  // Ele rodará apenas UMA VEZ quando o loading terminar,
  // em vez de rodar toda vez que os dados de filmes mudarem.
  useEffect(() => {
    if (isLoading) return; // Só executa quando o loading terminar

    const addDragScroll = (element: HTMLElement | null) => {
      if (!element) return;
      let isDown = false;
      let startX: number;
      let scrollLeft: number;

      const onMouseDown = (e: MouseEvent) => {
        isDown = true;
        element.classList.add('active-drag');
        startX = e.pageX - element.offsetLeft;
        scrollLeft = element.scrollLeft;
        hasDragged.current = false;
      };

      const onMouseLeaveOrUp = () => {
        isDown = false;
        element.classList.remove('active-drag');
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - element.offsetLeft;
        const walk = (x - startX) * 1; 
        
        if (Math.abs(walk) > 5) {
            hasDragged.current = true;
        }
        
        element.scrollLeft = scrollLeft - walk;
      };

      element.addEventListener('mousedown', onMouseDown);
      element.addEventListener('mouseleave', onMouseLeaveOrUp);
      element.addEventListener('mouseup', onMouseLeaveOrUp);
      element.addEventListener('mousemove', onMouseMove);

      return () => {
        element.removeEventListener('mousedown', onMouseDown);
        element.removeEventListener('mouseleave', onMouseLeaveOrUp);
        element.removeEventListener('mouseup', onMouseLeaveOrUp);
        element.removeEventListener('mousemove', onMouseMove);
      };
    };

    // Adiciona o drag scroll a todos os carrosséis
    const cleanupFunctions = [
        addDragScroll(continueWatchingRef.current),
        addDragScroll(trendingTodayRef.current),
        addDragScroll(popularMoviesRef.current),
        addDragScroll(popularSeriesRef.current),
        addDragScroll(popularAnimationsRef.current),
    ];
    
    return () => {
        cleanupFunctions.forEach(cleanup => cleanup && cleanup());
    };
    
  }, [isLoading]); // <-- OTIMIZAÇÃO AQUI

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (hasDragged.current) {
          e.preventDefault();
      }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Image src="https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png" alt="Carregando..." width={120} height={120} className="loading-logo" priority style={{ objectFit: 'contain' }} />
      </div>
    );
  }

  return (
    <main>
      {/* HERO SLIDER REMOVIDO */}

      <div className="main-container" style={{ position: 'relative', zIndex: 10, paddingTop: '2rem' }}>
        
        {/* CONTINUAR ASSISTINDO */}
        {continueWatching.length > 0 && (
          <section className="movie-section">
            <div className="section-header"><h2 className="section-title">Continuar Assistindo</h2></div>
            <div className="movie-carousel" ref={continueWatchingRef}>
              {continueWatching.map((item) => (
                <Link 
                  draggable="false" 
                  href={getContinueWatchingHref(item)}
                  key={item.id} 
                  className="movie-card focusable" 
                  onClick={handleCardClick}
                >
                  <div className="movie-card-poster-wrapper">
                    <Image draggable="false" src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title || ''} fill className="movie-card-poster" sizes="220px"/>
                    {/* --- ATUALIZAÇÃO: Adicionada a div de overlay --- */}
                    <div className="play-icon-overlay"></div>
                  </div>
                  <div className="movie-card-info">
                    <h3 className="movie-card-title">{item.title}</h3>
                    {item.progress && <p className="continue-watching-progress">T{item.progress.season} E{item.progress.episode}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* EM ALTA HOJE (NOVA SEÇÃO) */}
        <section className="movie-section">
          <div className="section-header">
            <h2 className="section-title">Em Alta Hoje</h2>
            {/* <Link draggable="false" href="/trending" className="section-view-all-link focusable" >&gt;</Link> */}
          </div>
          <div className="movie-carousel" ref={trendingTodayRef}>
            {trendingToday.map((item) => (
              <Link draggable="false" href={getMediaHref(item)} key={item.id} className="movie-card focusable" onClick={handleCardClick}>
                 <div className="movie-card-poster-wrapper">
                    <Image draggable="false" src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title || item.name || ''} fill className="movie-card-poster" sizes="220px"/>
                    {/* --- ATUALIZAÇÃO: Adicionada a div de overlay --- */}
                    <div className="play-icon-overlay"></div>
                 </div>
                 <div className="movie-card-info">
                   <h3 className="movie-card-title">{item.title || item.name}</h3>
                   <div className="movie-card-meta">
                     <span>{(item.release_date || item.first_air_date)?.substring(0, 4)}</span>
                     <span><StarIcon /> {item.vote_average.toFixed(1)}</span>
                   </div>
                 </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FILMES POPULARES (READICIONADO) */}
        <section className="movie-section">
          <div className="section-header">
            <h2 className="section-title">Filmes Populares</h2>
            <Link draggable="false" href="/filmes" className="section-view-all-link focusable" >&gt;</Link>
          </div>
          <div className="movie-carousel" ref={popularMoviesRef}>
            {popularMovies.map((movie) => (
              <Link draggable="false" href={`/media/movie/${generateSlug(movie.title || '')}-${movie.id}`} key={movie.id} className="movie-card focusable" onClick={handleCardClick}>
                 <div className="movie-card-poster-wrapper">
                    <Image draggable="false" src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title || ''} fill className="movie-card-poster" sizes="220px"/>
                    {/* --- ATUALIZAÇÃO: Adicionada a div de overlay --- */}
                    <div className="play-icon-overlay"></div>
                 </div>
                 <div className="movie-card-info">
                   <h3 className="movie-card-title">{movie.title}</h3>
                   <div className="movie-card-meta"><span>{movie.release_date?.substring(0, 4)}</span><span><StarIcon /> {movie.vote_average.toFixed(1)}</span></div>
                 </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SÉRIES POPULARES (EXISTENTE) */}
         <section className="movie-section">
          <div className="section-header">
             <h2 className="section-title">Séries Populares</h2>
             <Link draggable="false" href="/series" className="section-view-all-link focusable" >&gt;</Link>
          </div>
          <div className="movie-carousel" ref={popularSeriesRef}>
            {popularSeries.map((series) => (
              <Link draggable="false" href={`/media/tv/${generateSlug(series.name || '')}-${series.id}`} key={series.id} className="movie-card focusable" onClick={handleCardClick}>
                 <div className="movie-card-poster-wrapper">
                    <Image draggable="false" src={`https://image.tmdb.org/t/p/w500${series.poster_path}`} alt={series.name || ''} fill className="movie-card-poster" sizes="220px"/>
                    {/* --- ATUALIZAÇÃO: Adicionada a div de overlay --- */}
                    <div className="play-icon-overlay"></div>
                 </div>
                 <div className="movie-card-info">
                   <h3 className="movie-card-title">{series.name}</h3>
                   <div className="movie-card-meta"><span>{series.first_air_date?.substring(0, 4)}</span><span><StarIcon /> {series.vote_average.toFixed(1)}</span></div>
                 </div>
              </Link>
            ))}
          </div>
        </section>
        
        {/* ANIMAÇÕES POPULARES (NOVA SEÇÃO) */}
        <section className="movie-section">
          <div className="section-header">
            <h2 className="section-title">Animações Populares</h2>
            <Link draggable="false" href="/animacoes" className="section-view-all-link focusable" >&gt;</Link>
          </div>
          <div className="movie-carousel" ref={popularAnimationsRef}>
            {popularAnimations.map((movie) => (
              <Link draggable="false" href={`/media/movie/${generateSlug(movie.title || '')}-${movie.id}`} key={movie.id} className="movie-card focusable" onClick={handleCardClick}>
                 <div className="movie-card-poster-wrapper">
                    <Image draggable="false" src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title || ''} fill className="movie-card-poster" sizes="220px"/>
                    {/* --- ATUALIZAÇÃO: Adicionada a div de overlay --- */}
                    <div className="play-icon-overlay"></div>
                 </div>
                 <div className="movie-card-info">
                   <h3 className="movie-card-title">{movie.title}</h3>
                   <div className="movie-card-meta"><span>{movie.release_date?.substring(0, 4)}</span><span><StarIcon /> {movie.vote_average.toFixed(1)}</span></div>
                 </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}