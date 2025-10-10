// app/historico/page.tsx
"use client";

import { useWatchHistory, WatchItem } from '@/app/hooks/useWatchHistory';
import { useAuth } from '@/app/components/AuthProvider';
import Link from 'next/link';
import Image from 'next/image';
import { generateSlug } from '@/app/lib/utils';
import StarIcon from '@/app/components/icons/StarIcon'; // Reutilizando ícone

export default function HistoricoPage() {
  const { user } = useAuth();
  const { fullHistory, isLoading, movieCount, episodeCount } = useWatchHistory();

  if (isLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '50vh' }}>
        <div className='spinner'></div>
      </div>
    );
  }

  if (!user) {
    return (
      <main style={{ paddingTop: '100px' }}>
        <div className="main-container text-center">
          <h1 className="page-title" style={{ justifyContent: 'center' }}>Histórico</h1>
          <p>Você precisa estar logado para ver seu histórico.</p>
          <Link href="/login" className="btn-primary mt-4 inline-block">
            Fazer Login
          </Link>
        </div>
      </main>
    );
  }
  
  const getWatchItemTitle = (item: WatchItem) => {
      if (item.mediaType === 'tv' && item.progress) {
          return `${item.title} - T${item.progress.season} E${item.progress.episode}`;
      }
      return item.title;
  }

  return (
    <main style={{ paddingTop: '100px' }}>
      <div className="main-container">
        <h1 className="page-title">Seu Histórico</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-gray-800 p-4 rounded-lg">
            <div className="flex-1 text-center">
                <p className="text-3xl font-bold text-yellow-400">{movieCount}</p>
                <p className="text-gray-400">Filmes assistidos</p>
            </div>
             <div className="flex-1 text-center">
                <p className="text-3xl font-bold text-yellow-400">{episodeCount}</p>
                <p className="text-gray-400">Episódios assistidos</p>
            </div>
        </div>

        {fullHistory.length === 0 ? (
          <p>Seu histórico está vazio. Comece a assistir algo!</p>
        ) : (
          <div className="responsive-grid">
            {fullHistory.map((item) => (
              <Link
                href={`/media/${item.mediaType}/${generateSlug(item.title || '')}-${item.tmdbId}`}
                key={item.id}
                className="movie-card focusable"
              >
                <div className="movie-card-poster-wrapper">
                  <Image
                    src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://i.ibb.co/XzZ0b1B/placeholder.png'}
                    alt={item.title || ''}
                    fill
                    className="movie-card-poster"
                    sizes="(max-width: 768px) 30vw, (max-width: 1200px) 20vw, 15vw"
                  />
                   <div className="movie-card-overlay">
                      <Image
                        src="https://i.ibb.co/Q7V0pybV/bot-o-play-sem-bg.png"
                        alt="Play"
                        width={110}
                        height={110}
                        className="play-button-overlay"
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                </div>
                <div className="movie-card-info">
                  <h3 className="movie-card-title">{getWatchItemTitle(item)}</h3>
                   <div className="movie-card-meta">
                     <span>{new Date(item.lastWatched).toLocaleDateString('pt-BR')}</span>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}