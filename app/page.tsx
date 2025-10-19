// app/page.tsx
"use client";

import { useState, useEffect, useRef, memo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import StarIcon from '@/app/components/icons/StarIcon';
import PlayIcon from '@/app/components/icons/PlayIcon';
import BookmarkIcon from '@/app/components/icons/BookmarkIcon';
import { useWatchHistory, WatchItem } from '@/app/hooks/useWatchHistory';
import { generateSlug } from '@/app/lib/utils';

// Placeholder para imagens de baixa qualidade, melhora a percepção de carregamento
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
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  overview: string;
  media_type: 'movie' | 'tv';
}

const API_KEY = "860b66ade580bacae581f4228fad49fc";

// Otimização: Componente do Card separado e memoizado para evitar re-renderizações
const MovieCard = memo(function MovieCard({ item, type, onClick, priority }: { item: Media | WatchItem, type: 'movie' | 'tv', onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void, priority?: boolean }) {
  const title = 'title' in item ? item.title : item.name;
  const releaseDate = 'release_date' in item ? item.release_date : ('first_air_date' in item ? item.first_air_date : undefined);
  const voteAverage = 'vote_average' in item ? item.vote_average : 0;
  const tmdbId = 'tmdbId' in item ? item.tmdbId : item.id;
  const mediaType = 'mediaType' in item ? item.mediaType : type;
  const progress = 'progress' in item ? item.progress : undefined;

  return (
    <Link draggable="false" href={`/media/${mediaType}/${generateSlug(title || '')}-${tmdbId}`} className="movie-card focusable" onClick={onClick}>
      <div className="movie-card-poster-wrapper">
        <Image
          draggable="false"
          src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
          alt={title || ''}
          fill
          className="movie-card-poster"
          sizes="220px"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          priority={priority}
        />
        <div className="movie-card-play-icon-overlay"><PlayIcon /></div>
        {!progress && <div className="movie-card-bookmark"><BookmarkIcon /></div>}
      </div>
      <div className="movie-card-info">
        <h3 className="movie-card-title">{title}</h3>
        {progress ? (
          <p className="continue-watching-progress">T{progress.season} E{progress.episode}</p>
        ) : (
          <div className="movie-card-meta">
            <span>{releaseDate?.substring(0, 4)}</span>
            <span><StarIcon /> {voteAverage > 0 ? voteAverage.toFixed(1) : 'N/A'}</span>
          </div>
        )}
      </div>
    </Link>
  );
});


export default function HomePage() {
  const [trending, setTrending] = useState<Media[]>([]);
  const [latestMovies, setLatestMovies] = useState<Media[]>([]);
  const [popularSeries, setPopularSeries] = useState<Media[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { continueWatching } = useWatchHistory();

  const carouselsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const hasDragged = useRef(false);

  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true);
      try {
        const [trendingResponse, latestMoviesResponse, popularSeriesResponse] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}&language=pt-BR`),
          axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=pt-BR`),
          axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=pt-BR`)
        ]);

        setTrending(trendingResponse.data.results.filter((item: Media) => (item.title || item.name) && item.backdrop_path).slice(0, 5));
        setLatestMovies(latestMoviesResponse.data.results.filter((item: Media) => item.title || item.name));
        setPopularSeries(popularSeriesResponse.data.results.filter((item: Media) => item.title || item.name));
      } catch (error) {
        console.error("Erro ao buscar mídia:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedia();
  }, []);

  useEffect(() => {
    if (trending.length === 0) return;
    const interval = setInterval(() => {
      setActiveSlide((current) => (current + 1) % trending.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [trending]);

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

    const cleanupFunctions = Object.values(carouselsRef.current).map(addDragScroll);
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup && cleanup());
    };
  }, [isLoading]);

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
      <div className="hero-slider">
        {trending.map((item, index) => (
          <div key={item.id} className={`slide ${index === activeSlide ? 'active' : ''}`}>
            <Image draggable="false" src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`} alt={item.title || item.name || ''} fill style={{ objectFit: 'cover' }} className="slide-bg" priority={index < 2} />
            <div className="slide-overlay"></div>
            <div className="slide-content">
              <h1 className="slide-title">{item.title || item.name}</h1>
              <div className="slide-meta">
                <span>{(item.release_date || item.first_air_date)?.substring(0, 4)}</span>
                <span><StarIcon /> {item.vote_average.toFixed(1)}</span>
              </div>
              <p className="slide-overview">{item.overview}</p>
              <div className="slide-actions">
                <Link draggable="false" href={`/media/${item.media_type}/${generateSlug(item.title || item.name || '')}-${item.id}`} className="btn-primary slide-btn focusable"><PlayIcon /> Assistir</Link>
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
            <div className="movie-carousel" ref={el => carouselsRef.current['continue'] = el}>
              {continueWatching.map((item, index) => (
                <MovieCard item={item} type={item.mediaType} onClick={handleCardClick} key={item.id} priority={index < 2} />
              ))}
            </div>
          </section>
        )}

        <section className="movie-section">
          <div className="section-header">
            <h2 className="section-title">Filmes Populares</h2>
            <Link draggable="false" href="/filmes" className="section-view-all-link focusable" >&gt;</Link>
          </div>
          <div className="movie-carousel" ref={el => carouselsRef.current['latest'] = el}>
            {latestMovies.map((movie, index) => (
              <MovieCard item={movie} type="movie" onClick={handleCardClick} key={movie.id} priority={index < 2} />
            ))}
          </div>
        </section>

         <section className="movie-section">
          <div className="section-header">
             <h2 className="section-title">Séries Populares</h2>
             <Link draggable="false" href="/series" className="section-view-all-link focusable" >&gt;</Link>
          </div>
          <div className="movie-carousel" ref={el => carouselsRef.current['series'] = el}>
            {popularSeries.map((series, index) => (
              <MovieCard item={series} type="tv" onClick={handleCardClick} key={series.id} priority={index < 2} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}