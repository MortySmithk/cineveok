// app/historico/page.tsx
"use client";

import { useState } from 'react';
import { useWatchHistory, WatchItem } from '@/app/hooks/useWatchHistory';
import { useAuth } from '@/app/components/AuthProvider';
import Link from 'next/link';
import Image from 'next/image';
import { generateSlug } from '@/app/lib/utils';
import PlayIcon from '@/app/components/icons/PlayIcon'; // Importado

// FUNÇÃO ADICIONADA: Gera o Href correto para continuar assistindo
const getContinueWatchingHref = (item: WatchItem) => {
  const base = `/media/${item.mediaType}/${generateSlug(item.title || '')}-${item.tmdbId}`;
  if (item.mediaType === 'tv' && item.progress) {
    return `${base}?season=${item.progress.season}&episode=${item.progress.episode}`;
  }
  return base;
};

export default function HistoricoPage() {
  const { user } = useAuth();
  const { fullHistory, isLoading, movieCount, episodeCount } = useWatchHistory();
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredHistory = fullHistory.filter(item =>
    getWatchItemTitle(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        
        {/* --- BARRA DE PESQUISA DO HISTÓRICO --- */}
        <div className="search-container mb-8 mx-auto" style={{ maxWidth: '600px', width: '100%' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar no seu histórico..."
              className="search-input"
            />
        </div>


        {fullHistory.length === 0 ? (
          <p>Seu histórico está vazio. Comece a assistir algo!</p>
        ) : filteredHistory.length === 0 ? (
          <p>Nenhum item encontrado para "{searchTerm}".</p>
        ) : (
          <div className="responsive-grid">
            {filteredHistory.map((item) => (
              <Link
                draggable="false"
                href={getContinueWatchingHref(item)} // <-- MODIFICAÇÃO AQUI
                key={item.id}
                className="movie-card focusable"
              >
                <div className="movie-card-poster-wrapper">
                  <Image
                    draggable="false"
                    src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://i.ibb.co/XzZ0b1B/placeholder.png'}
                    alt={item.title || ''}
                    fill
                    className="movie-card-poster"
                    sizes="(max-width: 768px) 30vw, (max-width: 1200px) 20vw, 15vw"
                  />
                  <div className="movie-card-play-icon-overlay">
                    <PlayIcon />
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