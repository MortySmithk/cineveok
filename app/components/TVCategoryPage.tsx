"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { useTVNavigation } from '@/app/hooks/useTVNavigation';

interface Media {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
}
interface TVCategoryPageProps {
  title: string;
  fetchUrl: string;
  mediaType: 'movie' | 'tv';
}

export const TVCategoryPage = ({ title, fetchUrl, mediaType }: TVCategoryPageProps) => {
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useTVNavigation(); // Ativa a navegação por controle remoto

  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(fetchUrl);
        setMedia(res.data.results);
      } catch (error) {
        console.error("Erro ao buscar mídia:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedia();
  }, [fetchUrl]);

  return (
    <div className="tv-category-page">
      <h1 className="tv-category-title">{title}</h1>
      {isLoading ? (
        <div className="tv-loading-spinner" />
      ) : (
        <div className="tv-category-grid">
          {media.map((item) => (
            <Link 
              href={`/tv/media/${mediaType}/${item.id}`} 
              key={item.id} 
              className="tv-media-card focusable"
            >
              <Image
                src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                alt={item.title || item.name || ''}
                layout="fill"
                objectFit="cover"
              />
              <div className="tv-media-card-title">{item.title || item.name}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};