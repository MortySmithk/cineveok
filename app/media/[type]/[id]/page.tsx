// app/media/[type]/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import Image from 'next/image';

import StarIcon from '@/app/components/icons/StarIcon';
import VideoModal from '@/app/components/VideoModal';
import CalendarIcon from '@/app/components/icons/CalendarIcon';
import ClockIcon from '@/app/components/icons/ClockIcon';
import PlayIcon from '@/app/components/icons/PlayIcon';

// --- Interfaces ---
interface Genre { id: number; name: string; }
interface Season { id: number; name: string; season_number: number; episode_count: number; }
interface Episode {
  id: number; name: string; episode_number: number;
  overview: string; still_path: string;
}
interface CastMember {
  id: number; name: string; character: string; profile_path: string;
}
interface MediaDetails {
  id: number; title: string; overview: string; poster_path: string; backdrop_path: string;
  release_date: string; genres: Genre[]; vote_average: number; imdb_id?: string;
  runtime?: number; // Específico para filmes
  episode_run_time?: number[]; // Específico para séries
  credits?: { cast: CastMember[] };
  number_of_seasons?: number;
  seasons?: Season[];
}
interface StreamFromApi {
  url: string;
  name: string;
  description: string;
}
interface ProcessedStream { url: string; title: string; description: string; }

// --- Componente ---
export default function MediaPage() {
  const params = useParams();
  const type = params.type as 'movie' | 'tv';
  const id = params.id as string;

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Carregando...');

  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);

  // NOVO: Estado para o episódio ativo (player principal da série)
  const [activeEpisode, setActiveEpisode] = useState<{ season: number, episode: number } | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');
  const [isFetchingActiveStream, setIsFetchingActiveStream] = useState(false);

  // Estados para o sistema de "dropdown" de episódios
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);
  const [isFetchingDropdownStreams, setIsFetchingDropdownStreams] = useState(false);
  const [dropdownStreams, setDropdownStreams] = useState<ProcessedStream[]>([]);

  // Estados do Modal (usado para filmes e mobile)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStreamUrl, setModalStreamUrl] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  
  const API_KEY = "860b66ade580bacae581f4228fad49fc";

  // --- EFEITOS ---
  // Busca os detalhes da mídia
  useEffect(() => {
    if (!id || !type) return;
    const fetchData = async () => {
      setIsLoading(true);
      setStatus('Carregando...');
      try {
        const detailsResponse = await axios.get(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,external_ids`);
        const data = detailsResponse.data;
        const mediaDetails: MediaDetails = {
          ...data,
          title: data.title || data.name,
          release_date: data.release_date || data.first_air_date,
          imdb_id: data.external_ids?.imdb_id,
        };
        setDetails(mediaDetails);

        if (type === 'movie' && mediaDetails.id) {
          // Para filmes, busca o stream para o botão "Assistir"
          handleStreamFetch(mediaDetails.id.toString()).then(streams => {
            if (streams.length > 0) setModalStreamUrl(streams[0].url);
          });
        }
        if (type === 'tv') {
          // Para séries, define o primeiro episódio como ativo
          setActiveEpisode({ season: 1, episode: 1 });
        }
      } catch (error) {
        setStatus("Não foi possível carregar os detalhes.");
      }
    };
    fetchData();
  }, [id, type]);

  // Busca os episódios da temporada selecionada
  useEffect(() => {
    if (type !== 'tv' || !id || !details?.seasons) return;
    const fetchSeasonData = async () => {
      setIsLoading(true);
      try {
        const seasonResponse = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}?api_key=${API_KEY}&language=pt-BR`);
        setSeasonEpisodes(seasonResponse.data.episodes);
      } catch (error) {
        setSeasonEpisodes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSeasonData();
  }, [id, details, selectedSeason, type]);
  
  // Busca o stream do episódio ativo para o player principal da série
  useEffect(() => {
    if (type === 'tv' && activeEpisode && id) {
      setIsFetchingActiveStream(true);
      handleStreamFetch(id, activeEpisode.season, activeEpisode.episode).then(streams => {
        setActiveStreamUrl(streams.length > 0 ? streams[0].url : '');
        setIsFetchingActiveStream(false);
      });
    }
  }, [activeEpisode, id, type]);


  // --- FUNÇÕES ---
  // Função genérica para buscar streams
  const handleStreamFetch = async (tmdbId: string, season?: number, episode?: number): Promise<ProcessedStream[]> => {
    const isMovie = !season;
    const apiUrl = isMovie ? `/api/stream/movie/${tmdbId}` : `/api/stream/series/${tmdbId}/${season}/${episode}`;
    try {
      const response = await axios.get(apiUrl);
      const streams: StreamFromApi[] = response.data.streams || [];
      return streams
        .filter(s => s && s.name && s.url)
        .map(s => ({ title: s.name, description: s.description, url: s.url }));
    } catch (error) {
      console.error("Erro ao buscar streams", error);
      return [];
    }
  };

  // Lida com o clique em um episódio na lista
  const handleEpisodeClick = (season: number, episode: number) => {
    setActiveEpisode({ season, episode });
  };
  
  // Abre o modal de vídeo (para filmes ou mobile)
  const openWatchModal = (streamUrl: string | undefined, title: string) => {
    if (!streamUrl) return;
    setModalStreamUrl(streamUrl);
    setModalTitle(title);
    setIsModalOpen(true);
  };

  const formatRuntime = (minutes?: number | number[]) => {
    if (!minutes) return '';
    const mins = Array.isArray(minutes) ? minutes[0] : minutes;
    if (!mins) return '';
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  // --- RENDERIZAÇÃO ---
  if (isLoading && !details) {
    return (<div className="loading-container"><Image src="https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png" alt="Carregando..." width={120} height={120} className="loading-logo" priority style={{ objectFit: 'contain' }} /></div>);
  }
  if (!details) {
    return <div className="loading-container">{status}</div>;
  }

  return (
    <>
      <VideoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} src={modalStreamUrl} title={modalTitle} />
      <main style={{ paddingTop: '80px', paddingBottom: '40px' }}>
        <div className="main-container">
          <div className="details-grid">
            <div className="details-poster"><Image src={details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : 'https://i.ibb.co/XzZ0b1B/placeholder.png'} alt={details.title} width={300} height={450} style={{ borderRadius: '8px', width: '100%', height: 'auto' }}/></div>
            <div className="details-info">
              <h1>{details.title}</h1>
              <div className="details-meta-bar">
                <span className='meta-item'><CalendarIcon width={16} height={16} /> {details.release_date?.substring(0, 4)}</span>
                <span className='meta-item'><ClockIcon width={16} height={16} /> {formatRuntime(details.runtime || details.episode_run_time)}</span>
                <span className='meta-item'><StarIcon width={16} height={16} /> {details.vote_average > 0 ? details.vote_average.toFixed(1) : "N/A"}</span>
                {type === 'tv' && details.number_of_seasons && <span className='meta-item'>{details.number_of_seasons} Temporada{details.number_of_seasons > 1 ? 's' : ''}</span>}
              </div>
              <div className="action-buttons">
                {type === 'movie' && <button className='btn-primary' onClick={() => openWatchModal(modalStreamUrl, details.title)}><PlayIcon width={20} height={20} /> Assistir</button>}
                <a href={`https://www.imdb.com/title/${details.imdb_id}`} target="_blank" rel="noopener noreferrer" className='btn-secondary'>IMDb</a>
              </div>
              <div className="synopsis-box"><h3>Sinopse</h3><p>{details.overview}</p><div className="genre-tags">{details.genres.map(genre => <span key={genre.id} className="genre-tag">{genre.name}</span>)}</div></div>
            </div>
          </div>
          
          {/* SEÇÃO DE SÉRIES COM NOVO LAYOUT */}
          {type === 'tv' && (
            <section className="series-watch-section">
              <div className="series-watch-grid">
                
                {/* Coluna da Esquerda: Player */}
                <div className="series-player-wrapper">
                  <div className="player-container">
                    {isFetchingActiveStream && (
                      <div className="player-loader">
                        <div className="spinner"></div>
                        <span>Carregando player...</span>
                      </div>
                    )}
                    {!isFetchingActiveStream && activeStreamUrl && (
                      <iframe
                        src={activeStreamUrl}
                        title={`CineVEO Player - ${details.title}`}
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        referrerPolicy="no-referrer"
                      ></iframe>
                    )}
                    {!isFetchingActiveStream && !activeStreamUrl && (
                       <div className="player-loader">
                        <span>Link indisponível. Selecione outro episódio.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coluna da Direita: Lista de Episódios */}
                <div className="episodes-list-wrapper">
                  <div className="episodes-header">
                    <h2>Episódios</h2>
                    <select 
                      className="season-selector" 
                      value={selectedSeason} 
                      onChange={(e) => {
                        const newSeason = Number(e.target.value);
                        setSelectedSeason(newSeason);
                        // Ao trocar de temporada, seleciona o primeiro episódio dela
                        handleEpisodeClick(newSeason, 1);
                      }}
                    >
                      {details.seasons
                        ?.filter(s => s.season_number > 0 && s.episode_count > 0)
                        .map(s => <option key={s.id} value={s.season_number}>{s.name}</option>)
                      }
                    </select>
                  </div>
                  <div className="episode-list">
                    {isLoading && <div className='stream-loader'><div className='spinner'></div></div>}
                    {!isLoading && seasonEpisodes.map(ep => (
                      <button 
                        key={ep.id} 
                        className={`episode-item-button ${activeEpisode?.season === selectedSeason && activeEpisode?.episode === ep.episode_number ? 'active' : ''}`}
                        onClick={() => handleEpisodeClick(selectedSeason, ep.episode_number)}
                      >
                        <div className="episode-item-number">{String(ep.episode_number).padStart(2, '0')}</div>
                        <div className="episode-item-thumbnail">
                          {ep.still_path ? (
                            <Image src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={`Cena de ${ep.name}`} width={160} height={90} />
                          ) : (
                            <div className='thumbnail-placeholder-small'></div>
                          )}
                        </div>
                        <div className="episode-item-info">
                          <span className="episode-item-title">{ep.name}</span>
                          <p className="episode-item-overview">{ep.overview}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Seção de elenco (mantida) */}
          <section className="cast-section">
            <h2>Elenco Principal</h2>
            <div className="cast-grid">
              {details.credits?.cast.slice(0, 10).map(member => (
                <div key={member.id} className='cast-member'>
                  <div className='cast-member-img'>{member.profile_path ? (<Image src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} alt={member.name} width={150} height={225} style={{width: '100%', height: '100%', objectFit: 'cover'}} />) : <div className='thumbnail-placeholder person'></div>}</div>
                  <strong>{member.name}</strong>
                  <span>{member.character}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}