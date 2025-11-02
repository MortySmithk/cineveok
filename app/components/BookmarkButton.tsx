// app/components/BookmarkButton.tsx
"use client";

import React, { MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useWatchLater, WatchLaterMedia } from '../hooks/useWatchLater';
import BookmarkIcon from './icons/BookmarkIcon';
import { toast } from 'react-hot-toast';

// Define a interface das props
interface BookmarkButtonProps {
  item: {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    media_type: 'movie' | 'tv';
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
  };
  // Prop para estilos customizados, se necessário
  className?: string; 
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ item, className = '' }) => {
  const { user } = useAuth();
  const router = useRouter();
  const { addWatchLater, removeWatchLater, isWatchLater } = useWatchLater();

  const isSaved = isWatchLater(item.id);

  const handleToggleWatchLater = (e: MouseEvent<HTMLButtonElement>) => {
    // Impede que o clique no botão ative o Link do card (muito importante!)
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Faça login para adicionar à sua lista.");
      router.push('/login');
      return;
    }

    // Prepara o objeto de mídia
    const media: WatchLaterMedia = {
      id: item.id,
      title: item.title || item.name || 'Título desconhecido',
      poster_path: item.poster_path,
      media_type: item.media_type,
      release_date: item.release_date || item.first_air_date,
      vote_average: item.vote_average
    };

    if (isSaved) {
      removeWatchLater(item.id);
    } else {
      addWatchLater(media);
    }
  };

  return (
    <button
      onClick={handleToggleWatchLater}
      className={`bookmark-btn ${isSaved ? 'saved' : ''} ${className} focusable`}
      aria-label={isSaved ? "Remover da lista" : "Salvar em 'Assistir mais tarde'"}
      title={isSaved ? "Remover da lista" : "Salvar em 'Assistir mais tarde'"}
    >
      <BookmarkIcon isFilled={isSaved} />
    </button>
  );
};

export default BookmarkButton;