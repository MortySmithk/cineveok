// cineveo-next/app/tv/page.tsx
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { useTVNavigation } from '../hooks/useTVNavigation';

interface Media {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  media_type: 'movie' | 'tv';
}

const API_KEY = "860b66ade580bacae581f4228fad49fc";

export default function TVHomePage() {
  const [sections, setSections] = useState<{ title: string; items: Media[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllMedia = async () => {
      setIsLoading(true);
      try {
        const endpoints = [
          { title: "Em Alta", url: `https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}&language=pt-BR` },
          { title: "Filmes Populares", url: `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=pt-BR` },
          { title: "Séries Populares", url: `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=pt-BR` },
        ];

        const responses = await Promise.all(endpoints.map(e => axios.get(e.url)));
        
        const newSections = responses.map((res, index) => ({
          title: endpoints[index].title,
          items: res.data.results.map((item: any) => ({
            ...item,
            media_type: item.media_type || (endpoints[index].title.includes('Filmes') ? 'movie' : 'tv')
          }))
        }));
        
        setSections(newSections);
      } catch (error) {
        console.error("Erro ao buscar mídia para TV:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllMedia();
  }, []);

  useTVNavigation('.focusable');

  if (isLoading) {
    return <div className="tv-loading-spinner"></div>;
  }

  return (
    <div className="tv-main-content">
      <header className="tv-header">
         <Image src="https://i.ibb.co/s91tyczd/Gemini-Generated-Image-ejjiocejjiocejji-1.png" alt="CineVEO Logo" width={180} height={45} priority />
      </header>
      
      <nav className="tv-navigation">
        <a href="#" className="nav-item focusable">Início</a>
        <a href="#" className="nav-item focusable">Filmes</a>
        <a href="#" className="nav-item focusable">Séries</a>
        <a href="#" className="nav-item focusable">Pesquisar</a>
      </nav>

      <div className="tv-sections-container">
        {sections.map((section, sectionIndex) => (
          <section key={sectionIndex} className="tv-section">
            <h2>{section.title}</h2>
            <div className="tv-carousel">
              {section.items.map(item => (
                <Link href={`/tv/media/${item.media_type}/${item.id}`} key={item.id} className="tv-card focusable">
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.title || item.name || ''}
                    layout="fill"
                    objectFit="cover"
                  />
                  <div className="tv-card-title">{item.title || item.name}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}