// app/components/CategorySection.tsx
"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { generateSlug } from '@/app/lib/utils';
// --- ÍCONE REMOVIDO ---
import StarIcon from './icons/StarIcon';
// --- IMPORTAÇÃO REMOVIDA ---

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
}

interface CategorySectionProps {
  title: string;
  endpoint: string;
  mediaType?: 'movie' | 'tv';
}

const CategorySection: React.FC<CategorySectionProps> = ({ title, endpoint, mediaType }) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true);
      try {
        const response = await axios.get(endpoint);
        let items: MediaItem[] = response.data.results;
        
        // Se mediaType foi fornecido, força ele em todos os itens
        if (mediaType) {
          items = items.map(item => ({ ...item, media_type: mediaType }));
        }
        
        // Filtra itens sem poster ou título
        items = items.filter(item => item.poster_path && (item.title || item.name));

        setMedia(items.slice(0, 10)); // Pega apenas os 10 primeiros
      } catch (error) {
        console.error(`Erro ao buscar ${title}:`, error);
      }
      setLoading(false);
    };

    fetchMedia();
  }, [endpoint, title, mediaType]);

  const renderSkeletons = () => {
    return Array.from({ length: 10 }).map((_, index) => (
      <div key={index} className="media-card-skeleton">
        <div className="thumbnail-skeleton"></div>
        <div className="title-skeleton"></div>
        <div className="meta-skeleton"></div>
      </div>
    ));
  };

  return (
    <section className="category-section">
      <h2 className="section-title">{title}</h2>
      <div className="media-grid-scroll">
        {loading ? renderSkeletons() : media.map((item) => {
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
                {/* --- ATUALIZAÇÃO: Sobreposição de play agora está vazia para o CSS controlar --- */}
                <div className="play-icon-overlay"></div>
                {/* --- BOTÃO REMOVIDO --- */}
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
    </section>
  );
};

export default CategorySection;