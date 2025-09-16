// app/media/[type]/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
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
interface Season { id: number; name: string; season_number: number; }
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
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);

  const [isFetchingStreams, setIsFetchingStreams] = useState(false);
  const [availableStreams, setAvailableStreams] = useState<ProcessedStream[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStreamUrl, setModalStreamUrl] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const API_KEY = "860b66ade580bacae581f4228fad49fc";

  useEffect(() => {
    if (!id || !type) return;
    const fetchData = async () => {
      setIsLoading(true);
      const appendToResponse = 'credits,external_ids';
      try {
        const detailsResponse = await axios.get(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=pt-BR&append_to_response=${appendToResponse}`);
        const data = detailsResponse.data;
        const mediaDetails = {
          ...data,
          title: data.title || data.name,
          release_date: data.release_date || data.first_air_date,
          imdb_id: data.external_ids?.imdb_id,
        };
        setDetails(mediaDetails);

        if (type === 'movie' && mediaDetails.id) {
          handleStreamFetch({ tmdbId: mediaDetails.id.toString() });
        }
      } catch (error) {
        setStatus("Não foi possível carregar os detalhes.");
      } finally {
        if (type !== 'tv') { setIsLoading(false); }
      }
    };
    fetchData();
  }, [id, type]);

  useEffect(() => {
    if (type !== 'tv' || !id || !details?.seasons) return;
    const availableSeasons = details.seasons.filter(s => s.season_number > 0);
    if (availableSeasons.length > 0 && !availableSeasons.some(s => s.season_number === selectedSeason)) {
      setSelectedSeason(availableSeasons[0].season_number);
      return;
    }
    const fetchSeasonData = async () => {
      try {
        const seasonResponse = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}?api_key=${API_KEY}&language=pt-BR`);
        setSeasonEpisodes(seasonResponse.data.episodes);
      } catch (error) {
        console.error(`Erro ao buscar temporada.`, error);
        setSeasonEpisodes([]);
      } finally { setIsLoading(false); }
    };
    fetchSeasonData();
  }, [id, details, selectedSeason, type]);

  const handleStreamFetch = async (params: { tmdbId: string; season?: number; episode?: number }) => {
    setIsFetchingStreams(true);
    setAvailableStreams([]);
    const { tmdbId, season, episode } = params;
    const apiUrl = type === 'movie' ? `/api/stream/movie/${tmdbId}` : `/api/stream/series/${tmdbId}/${season}/${episode}`;
    try {
      const response = await axios.get(apiUrl);
      const streams: StreamFromApi[] = response.data.streams || [];
      if (streams.length > 0) {
        const processed = streams
          .filter(s => s && s.name && s.url)
          .map(s => ({ title: s.name, description: s.description, url: s.url }));
        setAvailableStreams(processed);
      }
    } catch (error) { console.error("Erro ao buscar streams", error);
    } finally { setIsFetchingStreams(false); }
  };

  const handleEpisodeExpand = (episodeNumber: number) => {
    const newExpandedEpisode = expandedEpisode === episodeNumber ? null : episodeNumber;
    setExpandedEpisode(newExpandedEpisode);
    if (newExpandedEpisode !== null && details?.id) {
      handleStreamFetch({ tmdbId: details.id.toString(), season: selectedSeason, episode: episodeNumber });
    }
  };

  const handleWatchClick = (streamUrl: string | undefined, title: string) => {
    if (!streamUrl) {
        alert("Nenhuma fonte de vídeo disponível para assistir.");
        return;
    }
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

  if (isLoading) {
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
              <div className="action-buttons"><button className='btn-primary' onClick={() => handleWatchClick(availableStreams[0]?.url, details.title)}><PlayIcon width={20} height={20} /> Assistir</button><a href={`https://www.imdb.com/title/${details.imdb_id}`} target="_blank" rel="noopener noreferrer" className='btn-secondary'>IMDb</a></div>
              <div className="synopsis-box"><h3>Sinopse</h3><p>{details.overview}</p><div className="genre-tags">{details.genres.map(genre => <span key={genre.id} className="genre-tag">{genre.name}</span>)}</div></div>
            </div>
          </div>
          {type === 'movie' && (
            <section className='watch-section'>
              <h2>Assistir</h2>
              <div className="stream-options-grid">
                {isFetchingStreams && <div className='stream-loader'><div className='spinner'></div></div>}
                {!isFetchingStreams && availableStreams.length === 0 && <p>Nenhuma fonte de vídeo encontrada.</p>}
                {!isFetchingStreams && availableStreams.map((stream, index) => (
                  <div key={`${stream.url}-${index}`} className='stream-link-item movie'>
                    <div className='stream-link-info'><strong>{stream.title}</strong><span>{stream.description}</span></div>
                    <button className='watch-button' onClick={() => handleWatchClick(stream.url, `${details.title} - ${stream.title}`)}>Assistir</button>
                  </div>
                ))}
              </div>
            </section>
          )}
          {type === 'tv' && (
            <section className="episodes-section">
              <div className="episodes-header"><h2>Episódios</h2><select className="season-selector" value={selectedSeason} onChange={(e) => setSelectedSeason(Number(e.target.value))}>{details.seasons?.filter(s => s.season_number > 0).map(s => <option key={s.id} value={s.season_number}>{s.name}</option>)}</select></div>
              <div className="episode-list">
                {seasonEpisodes.map(ep => (
                  <div key={ep.id} className='episode-item-wrapper'>
                    <button className="episode-item" onClick={() => handleEpisodeExpand(ep.episode_number)}><span className="episode-number">{String(ep.episode_number).padStart(2, '0')}</span><span className="episode-title">{ep.name}</span><span className={`episode-chevron ${expandedEpisode === ep.episode_number ? 'expanded' : ''}`}>&#x25B8;</span></button>
                    {expandedEpisode === ep.episode_number && (
                      <div className='episode-details'>
                        <div className='episode-details-content'>
                          <div className='episode-thumbnail'>{ep.still_path ? <Image src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={`Cena de ${ep.name}`} width={300} height={169} /> : <div className='thumbnail-placeholder'></div>}</div>
                          <p className='episode-overview'>{ep.overview || "Sinopse não disponível."}</p>
                        </div>
                        <div className='stream-options-grid'>
                          {isFetchingStreams && <div className='stream-loader'><div className='spinner'></div> Buscando links...</div>}
                          {!isFetchingStreams && availableStreams.length > 0 && availableStreams.map((stream, index) => (
                            <div key={`${stream.url}-${index}`} className='stream-link-item'><div className='stream-link-info'><strong>{stream.title}</strong><span>{stream.description}</span></div><button className='watch-button' onClick={() => handleWatchClick(stream.url, `${details.title} - T${selectedSeason}E${ep.episode_number}`)}>Assistir</button></div>
                          ))}
                          {!isFetchingStreams && availableStreams.length === 0 && <p>Nenhuma fonte encontrada para este episódio.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
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