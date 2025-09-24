"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useTVNavigation } from '@/app/hooks/useTVNavigation';
import { useAuth } from '@/app/components/AuthProvider';

// --- Interfaces ---
interface Episode { id: number; name: string; episode_number: number; still_path: string; }
interface Season { id: number; name: string; season_number: number; }
interface MediaDetails {
  id: number; title: string; overview: string; backdrop_path: string;
  seasons?: Season[];
}

const API_KEY = "860b66ade580bacae581f4228fad49fc";

export default function TVMediaPage() {
  const params = useParams();
  const { user } = useAuth();
  const type = params.type as 'movie' | 'tv';
  const id = params.id as string;

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [playerUrl, setPlayerUrl] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);
  
  useTVNavigation(); // Hook de navegação para TV

  useEffect(() => {
    if (!id || !type) return;
    const fetchDetails = async () => {
      try {
        const res = await axios.get(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=pt-BR&append_to_response=seasons`);
        const data = res.data;
        setDetails({
          ...data,
          title: data.title || data.name,
        });
        if (type === 'movie') {
          setPlayerUrl(`https://primevicio.vercel.app/embed/movie/${id}`);
        }
      } catch (error) { console.error("Erro ao carregar detalhes:", error); }
    };
    fetchDetails();
  }, [id, type]);

  useEffect(() => {
    if (type !== 'tv' || !id) return;
    const fetchEpisodes = async () => {
      try {
        const res = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}?api_key=${API_KEY}&language=pt-BR`);
        setEpisodes(res.data.episodes);
      } catch (error) { console.error("Erro ao carregar episódios:", error); }
    };
    fetchEpisodes();
  }, [id, type, selectedSeason]);

  const handlePlay = (season?: number, episode?: number) => {
    if (!user) {
      alert("Por favor, faça login para assistir.");
      return;
    }
    if (type === 'tv' && season && episode) {
      setPlayerUrl(`https://primevicio.vercel.app/embed/tv/${id}/${season}/${episode}`);
    }
    setShowPlayer(true);
  };

  if (!details) return <div className="tv-loading-spinner"></div>;

  if (showPlayer) {
    return (
      <div className="tv-player-fullscreen">
        <iframe src={playerUrl} allowFullScreen allow="autoplay"></iframe>
        <button onClick={() => setShowPlayer(false)} className="tv-player-close focusable">Voltar</button>
      </div>
    );
  }

  return (
    <div className="tv-details-page">
      <Image src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`} alt="" layout="fill" objectFit="cover" className="tv-details-backdrop" />
      <div className="tv-details-overlay"></div>
      <div className="tv-details-content">
        <h1>{details.title}</h1>
        <p className="tv-details-overview">{details.overview}</p>
        
        {type === 'movie' && (
          <button onClick={() => handlePlay()} className="tv-play-button focusable">Assistir Filme</button>
        )}

        {type === 'tv' && details.seasons && (
          <div className="tv-seasons-container">
            <div className="tv-seasons-tabs">
              {details.seasons.filter(s => s.season_number > 0).map(season => (
                <button
                  key={season.id}
                  className={`tv-season-tab focusable ${selectedSeason === season.season_number ? 'active' : ''}`}
                  onClick={() => setSelectedSeason(season.season_number)}
                >
                  {season.name}
                </button>
              ))}
            </div>
            <div className="tv-episodes-carousel">
              {episodes.map(ep => (
                <button key={ep.id} className="tv-episode-card focusable" onClick={() => handlePlay(selectedSeason, ep.episode_number)}>
                   {ep.still_path ? (
                    <Image src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={ep.name} layout="fill" objectFit="cover" />
                  ) : <div className="tv-episode-placeholder"/>}
                  <div className="tv-episode-info">
                    <span>EP {ep.episode_number}</span>
                    <p>{ep.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}