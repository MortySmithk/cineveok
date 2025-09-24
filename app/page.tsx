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
  media_type: 'movie' | 'tv';
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
  useTVNavigation('#tv-main-content');

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const popularMovies = axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=pt-BR`);
        const popularSeries = axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=pt-BR`);
        
        const [moviesRes, seriesRes] = await Promise.all([popularMovies, popularSeries]);

        setSections([
          { title: 'Filmes em Destaque', items: moviesRes.data.results, mediaType: 'movie' },
          { title: 'Séries Populares', items: seriesRes.data.results, mediaType: 'tv' },
        ]);
      } catch (error) {
        console.error("Erro ao carregar conteúdo da página inicial:", error);
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

      {sections.map((section, index) => (
        <section key={index} className="tv-home-carousel-section">
          <h2>{section.title}</h2>
          <div className="tv-home-carousel">
            {section.items.map(item => (
              <Link
                href={`/tv/media/${section.mediaType}/${item.id}`}
                key={item.id}
                className="tv-home-card focusable"
              >
                <Image
                  src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                  alt={item.title || item.name || ''}
                  layout="fill"
                  objectFit="cover"
                />
                <div className="tv-home-card-title">{item.title || item.name}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}