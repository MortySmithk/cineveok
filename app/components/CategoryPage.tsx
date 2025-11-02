// app/components/CategoryPage.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { generateSlug } from '@/app/lib/utils';
import PlayIcon from './icons/PlayIcon';
import StarIcon from './icons/StarIcon';
// --- IMPORTAÇÃO REMOVIDA ---

const API_KEY = "860b66ade580bacae581f4228fad49fc";

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

interface CategoryPageProps {
  title: string;
  fetchUrl: string;
  mediaType: 'movie' | 'tv';
}

const CategoryPage: React.FC<CategoryPageProps> = ({ title, fetchUrl, mediaType }) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMedia = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`${fetchUrl}&page=${pageNum}`);
      const newItems = response.data.results
        .filter((item: MediaItem) => item.poster_path && (item.title || item.name))
        .map((item: MediaItem) => ({
          ...item,
          media_type: mediaType // Garante o media_type correto
        }));
      
      setMedia(prev => pageNum === 1 ? newItems : [...prev, ...newItems]);
      setHasMore(response.data.results.length > 0 && pageNum < response.data.total_pages);
    } catch (error) {
      console.error(`Erro ao buscar ${title}:`, error);
    }
    setLoading(false);
  }, [fetchUrl, title, mediaType]);

  useEffect(() => {
    fetchMedia(1); // Busca a primeira página ao montar
  }, [fetchMedia]);

  const loadMore = () => {
    const newPage = page + 1;
    setPage(newPage);
    fetchMedia(newPage);
  };

  const renderSkeletons = () => {
    return Array.from({ length: 12 }).map((_, index) => (
      <div key={index} className="media-card-skeleton">
        <div className="thumbnail-skeleton"></div>
        <div className="title-skeleton"></div>
        <div className="meta-skeleton"></div>
      </div>
    ));
  };

  return (
    <main className="main-container" style={{ paddingTop: '2rem' }}>
      <h1 className="page-title">{title}</h1>
      
      {media.length === 0 && loading && (
        <div className="media-grid">
          {renderSkeletons()}
        </div>
      )}

      <div className="media-grid">
        {media.map((item) => {
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
                <div className="play-icon-overlay">
                  <PlayIcon width={32} height={32} />
                </div>
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

      {loading && media.length > 0 && (
        <div className="stream-loader" style={{ margin: '2rem 0' }}>
          <div className="spinner"></div>
        </div>
      )}
      
      {hasMore && !loading && (
        <div className="load-more-container">
          <button onClick={loadMore} className="btn-primary focusable">
            Carregar Mais
          </button>
        </div>
      )}
    </main>
  );
};

export default CategoryPage;