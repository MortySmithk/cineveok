// app/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import StarIcon from '@/app/components/icons/StarIcon';
import PlayIcon from '@/app/components/icons/PlayIcon';
import BookmarkIcon from '@/app/components/icons/BookmarkIcon';
import { useWatchHistory } from '@/app/hooks/useWatchHistory';
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

export default function HomePage() {
  const [trending, setTrending] = useState<Media[]>([]);
  const [latestMovies, setLatestMovies] = useState<Media[]>([]);
  const [popularSeries, setPopularSeries] = useState<Media[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { continueWatching } = useWatchHistory();

  // Refs para os carrosséis
  const continueWatchingRef = useRef<HTMLDivElement>(null);
  const latestMoviesRef = useRef<HTMLDivElement>(null);
  const popularSeriesRef = useRef<HTMLDivElement>(null);
  
  // Ref para controlar se o usuário arrastou ou apenas clicou
  const hasDragged = useRef(false);


  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true);
      try {
        const trendingPromise = axios.get(`https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}&language=pt-BR`);
        const latestMoviesPromise = axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=pt-BR`);
        const popularSeriesPromise = axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=pt-BR`);
        
        const [trendingResponse, latestMoviesResponse, popularSeriesResponse] = await Promise.all([trendingPromise, latestMoviesPromise, popularSeriesPromise]);

        setTrending(trendingResponse.data.results.filter((item: Media) => item.title || item.name).slice(0, 5));
        setLatestMovies(latestMoviesResponse.data.results.filter((item: Media) => item.title || item.name));
        setPopularSeries(popularSeriesResponse.data.results.filter((item: Media) => item.title || item.name));
      } catch (error) { console.error("Erro ao buscar mídia:", error);
      } finally { setIsLoading(false); }
    };
    fetchMedia();
  }, []);

  useEffect(() => {
    if (trending.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlide((current) => (current === trending.length - 1 ? 0 : current + 1));
    }, 7000);
    return () => clearInterval(interval);
  }, [trending]);

  // Efeito para adicionar a funcionalidade de arrastar para rolar
  useEffect(() => {
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
        hasDragged.current = false; // Reseta a flag de arrastar
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
        
        // Se o movimento for maior que um pequeno threshold, considera como arraste
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

    const cleanupFunctions = [
        addDragScroll(continueWatchingRef.current),
        addDragScroll(latestMoviesRef.current),
        addDragScroll(popularSeriesRef.current),
    ];
    
    // Função de limpeza para remover os event listeners quando o componente for desmontado
    return () => {
        cleanupFunctions.forEach(cleanup => cleanup && cleanup());
    };
  }, [isLoading, continueWatching, latestMovies, popularSeries]); // Re-executa se os dados dos carrosséis mudarem

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (hasDragged.current) {
          e.preventDefault(); // Impede a navegação se o usuário estava arrastando
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
      <div className="hero-slider">
        {trending.map((item, index) => (
          <div key={item.id} className={`slide ${index === activeSlide ? 'active' : ''}`}>
            <Image src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`} alt={item.title || item.name || ''} fill style={{ objectFit: 'cover' }} className="slide-bg" priority={index === 0} />
            <div className="slide-overlay"></div>
            <div className="slide-content">
              <h1 className="slide-title">{item.title || item.name}</h1>
              <div className="slide-meta">
                <span>{(item.release_date || item.first_air_date)?.substring(0, 4)}</span>
                <span className="stars">★★★★★</span>
              </div>
              <p className="slide-overview">{item.overview}</p>
              <div className="slide-actions">
                <Link href={`/media/${item.media_type}/${generateSlug(item.title || item.name || '')}-${item.id}`} className="btn-primary slide-btn focusable"><PlayIcon /> Assistir</Link>
                <button className="btn-secondary slide-btn focusable">+ Minha Lista</button>
              </div>
            </div>
          </div>
        ))}
        <div className="slide-dots">
          {trending.map((_, index) => (<button key={index} onClick={() => setActiveSlide(index)} className={`focusable ${index === activeSlide ? 'active' : ''}`}></button>))}
        </div>
      </div>

      <div className="main-container" style={{ position: 'relative', zIndex: 10 }}>
        {continueWatching.length > 0 && (
          <section className="movie-section">
            <div className="section-header"><h2 className="section-title">Continuar Assistindo</h2></div>
            <div className="movie-carousel" ref={continueWatchingRef}>
              {continueWatching.map((item) => (
                <Link href={`/media/${item.mediaType}/${generateSlug(item.title || '')}-${item.tmdbId}`} key={item.id} className="movie-card focusable" draggable={false} onClick={handleCardClick}>
                  <div className="movie-card-poster-wrapper"><Image src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title || ''} fill className="movie-card-poster" sizes="220px"/></div>
                  <div className="movie-card-overlay"><Image src="https://i.ibb.co/Q7V0pybV/bot-o-play-sem-bg.png" alt="Play" width={110} height={110} className="play-button-overlay" style={{ objectFit: 'contain' }}/></div>
                  <div className="movie-card-info">
                    <h3 className="movie-card-title">{item.title}</h3>
                    {item.progress && <p className="continue-watching-progress">T{item.progress.season} E{item.progress.episode}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="movie-section">
          <div className="section-header">
            <h2 className="section-title">Filmes Populares</h2>
            <Link href="/filmes" className="section-view-all-link focusable" draggable={false}>&gt;</Link>
          </div>
          <div className="movie-carousel" ref={latestMoviesRef}>
            {latestMovies.map((movie) => (
              <Link href={`/media/movie/${generateSlug(movie.title || '')}-${movie.id}`} key={movie.id} className="movie-card focusable" draggable={false} onClick={handleCardClick}>
                 <div className="movie-card-poster-wrapper"><Image src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title || ''} fill className="movie-card-poster" sizes="220px"/></div>
                 <div className="movie-card-overlay"><Image src="https://i.ibb.co/Q7V0pybV/bot-o-play-sem-bg.png" alt="Play" width={110} height={110} className="play-button-overlay" style={{ objectFit: 'contain' }}/></div>
                 <div className="movie-card-bookmark"><BookmarkIcon /></div>
                 <div className="movie-card-info">
                   <h3 className="movie-card-title">{movie.title}</h3>
                   <div className="movie-card-meta"><span>{movie.release_date?.substring(0, 4)}</span><span><StarIcon /> {movie.vote_average.toFixed(1)}</span></div>
                 </div>
              </Link>
            ))}
          </div>
        </section>

         <section className="movie-section">
          <div className="section-header">
             <h2 className="section-title">Séries Populares</h2>
             <Link href="/series" className="section-view-all-link focusable" draggable={false}>&gt;</Link>
          </div>
          <div className="movie-carousel" ref={popularSeriesRef}>
            {popularSeries.map((series) => (
              <Link href={`/media/tv/${generateSlug(series.name || '')}-${series.id}`} key={series.id} className="movie-card focusable" draggable={false} onClick={handleCardClick}>
                 <div className="movie-card-poster-wrapper"><Image src={`https://image.tmdb.org/t/p/w500${series.poster_path}`} alt={series.name || ''} fill className="movie-card-poster" sizes="220px"/></div>
                 <div className="movie-card-overlay"><Image src="https://i.ibb.co/Q7V0pybV/bot-o-play-sem-bg.png" alt="Play" width={110} height={110} className="play-button-overlay" style={{ objectFit: 'contain' }} /></div>
                 <div className="movie-card-bookmark"><BookmarkIcon /></div>
                 <div className="movie-card-info">
                   <h3 className="movie-card-title">{series.name}</h3>
                   <div className="movie-card-meta"><span>{series.first_air_date?.substring(0, 4)}</span><span><StarIcon /> {series.vote_average.toFixed(1)}</span></div>
                 </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}