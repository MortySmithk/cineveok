// cineveo-next/app/media/[type]/[slug]/MediaPageClient.tsx
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';

import StarIcon from '@/app/components/icons/StarIcon';
// O VideoModal não é mais necessário aqui.
// import VideoModal from '@/app/components/VideoModal'; 
import CalendarIcon from '@/app/components/icons/CalendarIcon';
import ClockIcon from '@/app/components/icons/ClockIcon';
import PlayIcon from '@/app/components/icons/PlayIcon';
import { useContinueWatching } from '@/app/hooks/useContinueWatching';

// --- Interfaces (sem alterações) ---
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
  runtime?: number;
  episode_run_time?: number[];
  credits?: { cast: CastMember[] };
  number_of_seasons?: number;
  seasons?: Season[];
}

const API_KEY = "860b66ade580bacae581f4228fad49fc";

const getIdFromSlug = (slug: string) => {
    if (!slug) return null;
    const parts = slug.split('-');
    return parts[parts.length - 1];
};

export default function MediaPageClient({ params }: { params: { type: string; slug: string } }) {
  const type = params.type as 'movie' | 'tv';
  const slug = params.slug as string;
  const id = getIdFromSlug(slug);

  const { saveProgress, getProgress } = useContinueWatching();

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Carregando...');
  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [activeEpisode, setActiveEpisode] = useState<{ season: number, episode: number } | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');
  
  // Estados do modal foram removidos
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [playerUrl, setPlayerUrl] = useState('');
  // const [playerTitle, setPlayerTitle] = useState('');

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

        const title = mediaDetails.title;
        const typeText = type === 'movie' ? 'Filme Completo' : 'Série Completa';
        document.title = `Assistindo ${title} (${typeText}) - CineVEO`;

        // --- ALTERAÇÃO PRINCIPAL AQUI ---
        // Se for um filme, define a URL do stream diretamente e salva o progresso.
        // Isso ativa o player integrado na página, em vez de preparar para um modal.
        if (type === 'movie' && mediaDetails.id) {
          setActiveStreamUrl(`https://primevicio.vercel.app/embed/movie/${mediaDetails.id}`);
          // Salva o progresso assim que a página do filme carrega
          saveProgress({ mediaType: 'movie', tmdbId: id, title: mediaDetails.title, poster_path: mediaDetails.poster_path });
        }
        
        if (type === 'tv') {
          const progress = getProgress('tv', id);
          const startSeason = progress?.progress?.season || 1;
          const startEpisode = progress?.progress?.episode || 1;
          setSelectedSeason(startSeason);
          setActiveEpisode({ season: startSeason, episode: startEpisode });
        }
      } catch (error) {
        setStatus("Não foi possível carregar os detalhes.");
      }
    };
    fetchData();
  }, [id, type, getProgress, saveProgress]); // Adicionado saveProgress às dependências

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

  useEffect(() => {
    if (type === 'tv' && activeEpisode && id && details) {
      const { season, episode } = activeEpisode;
      setActiveStreamUrl(`https://primevicio.vercel.app/embed/tv/${id}/${season}/${episode}`);
      saveProgress({ mediaType: 'tv', tmdbId: id, title: details.title, poster_path: details.poster_path, progress: { season, episode } });
    }
  }, [activeEpisode, id, type, details, saveProgress]);

  const handleEpisodeClick = (season: number, episode: number) => {
    setActiveEpisode({ season, episode });
  };
  
  // A função para abrir o modal foi removida.
  /*
  const openWatchModal = () => {
    // ...código removido...
  };
  */

  const formatRuntime = (minutes?: number | number[]) => {
    if (!minutes) return '';
    const mins = Array.isArray(minutes) ? minutes[0] : minutes;
    if (!mins) return '';
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  if (isLoading && !details) {
    return (<div className="loading-container"><Image src="https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png" alt="Carregando..." width={120} height={120} className="loading-logo" priority style={{ objectFit: 'contain' }} /></div>);
  }
  if (!details) {
    return <div className="loading-container">{status}</div>;
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type === 'movie' ? 'Movie' : 'TVSeries',
    'name': details.title, 'description': details.overview, 'image': `https://image.tmdb.org/t/p/original${details.poster_path}`,
    'url': typeof window !== 'undefined' ? window.location.href : '', 'datePublished': details.release_date,
    'aggregateRating': { '@type': 'AggregateRating', 'ratingValue': details.vote_average.toFixed(1), 'bestRating': '10', 'ratingCount': details.id },
    'director': { '@type': 'Person', 'name': 'Diretor do Filme' }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {/* O Modal foi removido do JSX */}
      {/* <VideoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} src={playerUrl} title={playerTitle} /> */}
      
      <div className="media-page-layout">

        {/* --- NOVA SEÇÃO DE PLAYER PARA FILMES --- */}
        {type === 'movie' && (
          <section className="series-watch-section">
            <div className="series-watch-grid">
              <div className="series-player-wrapper">
                <div className="player-container">
                  {activeStreamUrl ? (
                    <iframe key={activeStreamUrl} src={activeStreamUrl} title={`CineVEO Player - ${details.title}`} allow="autoplay; encrypted-media" allowFullScreen referrerPolicy="origin"></iframe>
                  ) : (
                    <div className="player-loader"><div className="spinner"></div><span>Carregando player...</span></div>
                  )}
                </div>
              </div>
              <div className="episodes-list-wrapper">
                  {/* Reutiliza o estilo do item de episódio para mostrar as informações do filme */}
                  <div className="episode-item-button active focusable" style={{ cursor: 'default' }}>
                      <div className="episode-item-thumbnail">
                        <Image src={`https://image.tmdb.org/t/p/w300${details.poster_path}`} alt={`Poster de ${details.title}`} width={120} height={180} style={{ objectFit: 'cover', width: '100%', height: 'auto', aspectRatio: '2/3' }} />
                      </div>
                      <div className="episode-item-info">
                        <span className="episode-item-title">{details.title}</span>
                        <p className="episode-item-overview">Filme Completo</p>
                      </div>
                  </div>
              </div>
            </div>
          </section>
        )}

        {/* Seção de player para séries (sem alterações) */}
        {type === 'tv' && (
          <section className="series-watch-section">
            <div className="series-watch-grid">
              <div className="series-player-wrapper">
                <div className="player-container">
                  {activeStreamUrl ? (
                    <iframe key={activeStreamUrl} src={activeStreamUrl} title={`CineVEO Player - ${details.title}`} allow="autoplay; encrypted-media" allowFullScreen referrerPolicy="origin"></iframe>
                  ) : (
                    <div className="player-loader"><div className="spinner"></div><span>Selecione um episódio para começar a assistir.</span></div>
                  )}
                </div>
              </div>
              <div className="episodes-list-wrapper">
                <div className="episodes-header">
                  <select className="season-selector focusable" value={selectedSeason} 
                    onChange={(e) => { const newSeason = Number(e.target.value); setSelectedSeason(newSeason); handleEpisodeClick(newSeason, 1); }}>
                    {details.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <p className='episode-count-info'>Atualizado até o ep {seasonEpisodes.length}</p>
                </div>
                <div className="episode-list-desktop">
                  {isLoading && <div className='stream-loader'><div className='spinner'></div></div>}
                  {!isLoading && seasonEpisodes.map(ep => (
                    <button key={ep.id} className={`episode-item-button focusable ${activeEpisode?.season === selectedSeason && activeEpisode?.episode === ep.episode_number ? 'active' : ''}`} onClick={() => handleEpisodeClick(selectedSeason, ep.episode_number)}>
                      <div className="episode-item-number">{String(ep.episode_number).padStart(2, '0')}</div>
                      <div className="episode-item-thumbnail">{ep.still_path ? (<Image src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={`Cena de ${ep.name}`} width={160} height={90} />) : (<div className='thumbnail-placeholder-small'></div>)}</div>
                      <div className="episode-item-info"><span className="episode-item-title">{ep.name}</span><p className="episode-item-overview">{ep.overview}</p></div>
                    </button>
                  ))}
                </div>
                <div className="episode-grid-mobile">
                  {isLoading && <div className='stream-loader'><div className='spinner'></div></div>}
                  {!isLoading && seasonEpisodes.map(ep => ( <button key={ep.id} className={`episode-grid-button focusable ${activeEpisode?.season === selectedSeason && activeEpisode?.episode === ep.episode_number ? 'active' : ''}`} onClick={() => handleEpisodeClick(selectedSeason, ep.episode_number)}>{ep.episode_number}</button> ))}
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* O player de filme no mobile foi removido daqui, pois o player integrado já funciona. */}
        
        <main className="details-main-content">
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
                {/* O botão de assistir foi removido, pois o player já está na tela */}
                <div className="action-buttons-desktop">
                  {details.imdb_id && <a href={`https://www.imdb.com/title/${details.imdb_id}`} target="_blank" rel="noopener noreferrer" className='btn-secondary focusable'>IMDb</a>}
                </div>
                <div className="synopsis-box"><h3>Sinopse</h3><p>{details.overview}</p><div className="genre-tags">{details.genres.map(genre => <span key={genre.id} className="genre-tag">{genre.name}</span>)}</div></div>
              </div>
            </div>
            
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
      </div>
    </>
  );
}