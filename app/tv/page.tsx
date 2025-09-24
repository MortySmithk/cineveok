"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { useTVNavigation } from '../hooks/useTVNavigation';
import { useAuth } from '../components/AuthProvider';

interface Media {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  media_type?: 'movie' | 'tv'; // <-- ESTA LINHA FOI ADICIONADA PARA CORRIGIR O ERRO
}

interface Section {
  title: string;
  items: Media[];
  mediaType: 'movie' | 'tv';
}

const API_KEY = "860b66ade580bacae581f4228fad49fc";

export default function TVHomePage() {
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useTVNavigation('#tv-main-content');

  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true);
      try {
        const popularMoviesPromise = axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=pt-BR`);
        const popularSeriesPromise = axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=pt-BR`);
        const trendingPromise = axios.get(`https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}&language=pt-BR`);
        
        const [moviesRes, seriesRes, trendingRes] = await Promise.all([popularMoviesPromise, popularSeriesPromise, trendingPromise]);

        setSections([
          { title: 'Em Alta', items: trendingRes.data.results, mediaType: 'tv' },
          { title: 'Filmes Populares', items: moviesRes.data.results, mediaType: 'movie' },
          { title: 'Séries Populares', items: seriesRes.data.results, mediaType: 'tv' },
        ]);
      } catch (error) {
        console.error("Erro ao carregar conteúdo da página inicial:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedia();
  }, []);

  return (
    <div className="tv-home-container">
      {!user && (
        <div className="tv-home-promo-section">
          <h1 className="promo-title">Deixe o CineVEO com a sua cara</h1>
          <p className="promo-subtitle">
            Faça login para ter acesso a recomendações, inscrições e muito mais.
          </p>
          <Link href="/tv/login" className="tv-login-button focusable">
            Fazer login
          </Link>
        </div>
      )}

      {isLoading ? (
         <div className="tv-loading-spinner" />
      ) : (
        sections.map((section, index) => (
          <section key={index} className="tv-home-carousel-section">
            <h2>{section.title}</h2>
            <div className="tv-home-carousel">
              {section.items.map(item => (
                <Link
                  href={`/tv/media/${item.media_type || section.mediaType}/${item.id}`}
                  key={`${item.id}-${item.title || item.name}`}
                  className="tv-home-card focusable"
                >
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.title || item.name || ''}
                    layout="fill"
                    objectFit="cover"
                    className="tv-home-card-image"
                  />
                  <div className="tv-home-card-title">{item.title || item.name}</div>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}