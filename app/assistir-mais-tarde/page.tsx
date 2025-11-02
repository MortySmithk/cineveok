// app/assistir-mais-tarde/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/components/AuthProvider';
import { useWatchLater } from '@/app/hooks/useWatchLater';
import { generateSlug } from '@/app/lib/utils';
import PlayIcon from '@/app/components/icons/PlayIcon';
import StarIcon from '@/app/components/icons/StarIcon';
import BookmarkButton from '@/app/components/BookmarkButton';
import BookmarkIcon from '@/app/components/icons/BookmarkIcon';

export default function WatchLaterPage() {
  const { user } = useAuth();
  const { watchLaterItems, isLoading } = useWatchLater();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container" style={{ minHeight: '50vh' }}>
          <div className="spinner"></div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="empty-list-container">
          <BookmarkIcon width={60} height={60} />
          <h2>Você não está logado</h2>
          <p>Faça login para ver sua lista de itens para assistir mais tarde.</p>
          <Link href="/login" className="btn-primary focusable">
            Fazer Login
          </Link>
        </div>
      );
    }

    if (watchLaterItems.length === 0) {
      return (
        <div className="empty-list-container">
          <BookmarkIcon width={60} height={60} />
          <h2>Sua lista está vazia</h2>
          <p>Adicione filmes e séries à sua lista para assistir mais tarde.</p>
          <Link href="/" className="btn-primary focusable">
            Procurar conteúdo
          </Link>
        </div>
      );
    }

    // Se tem usuário e itens, mostra a lista
    return (
      <div className="media-grid">
        {watchLaterItems.map((item) => {
          const title = item.title;
          const slug = generateSlug(title) + '-' + item.id;
          const url = `/media/${item.media_type}/${slug}`;
          const year = (item.release_date || item.first_air_date)?.substring(0, 4);

          return (
            <Link href={url} key={item.id} className="media-card focusable" draggable="false">
              <div className="thumbnail-wrapper">
                <Image
                  src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : 'https://i.ibb.co/XzZ0b1B/placeholder.png'}
                  alt={title}
                  fill
                  sizes="(max-width: 600px) 33vw, (max-width: 900px) 25vw, 20vw"
                  className="thumbnail-image"
                  draggable="false"
                />
                <div className="play-icon-overlay">
                  <PlayIcon width={32} height={32} />
                </div>
                {/* Adiciona o botão de salvar aqui também */}
                <BookmarkButton item={item} />
              </div>
              <div className="card-info">
                <h3 className="card-title">{title}</h3>
                <div className="card-meta">
                  {year && <span>{year}</span>}
                  {item.vote_average && item.vote_average > 0 && (
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
    );
  };

  return (
    <main className="main-container" style={{ paddingTop: '2rem' }}>
      <h1 className="page-title">Assistir mais tarde</h1>
      {renderContent()}
    </main>
  );
}