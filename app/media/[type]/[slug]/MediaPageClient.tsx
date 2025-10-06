// app/media/[type]/[slug]/MediaPageClient.tsx
"use client";

import { useState, useEffect, memo } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { doc, runTransaction, onSnapshot, increment } from 'firebase/firestore';

import { useAuth } from '@/app/components/AuthProvider';
import { db } from '@/app/firebase';

import LikeIcon from '@/app/components/icons/LikeIcon';
import DislikeIcon from '@/app/components/icons/DislikeIcon';
import { useWatchHistory } from '@/app/hooks/useWatchHistory';
import AudioVisualizer from '@/app/components/AudioVisualizer';

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
  release_date: string; first_air_date?: string; genres: Genre[]; vote_average: number; imdb_id?: string;
  runtime?: number;
  episode_run_time?: number[];
  credits?: { cast: CastMember[] };
  number_of_seasons?: number;
  seasons?: Season[];
}

const API_KEY = "860b66ade580bacae581f4228fad49fc";
const CINEVEO_CHANNEL_ID = "cineveo_oficial";

const getIdFromSlug = (slug: string): string | null => {
    if (!slug) return null;
    const parts = slug.split('-');
    return parts[parts.length - 1];
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

const PlayerContent = memo(function PlayerContent({ activeStreamUrl, title }: { activeStreamUrl: string, title: string }) {
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);

  useEffect(() => {
    setIsPlayerLoading(true);
  }, [activeStreamUrl]);

  return (
    <div className="player-container">
      {isPlayerLoading && (
        <div className="player-loader">
          <div className="spinner"></div>
          <span>Carregando player...</span>
        </div>
      )}
      {activeStreamUrl ? (
        <iframe
          src={activeStreamUrl}
          title={`CineVEO Player - ${title}`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          referrerPolicy="origin"
          loading="lazy"
          onLoad={() => setIsPlayerLoading(false)}
          style={{ visibility: isPlayerLoading ? 'hidden' : 'visible' }}
        ></iframe>
      ) : (
        <div className="player-loader">
          <div className="spinner"></div>
          <span>Selecione um episódio para começar a assistir.</span>
        </div>
      )}
    </div>
  );
});


export default function MediaPageClient({ params }: { params: { type: string; slug: string } }) {
  const type = params.type as 'movie' | 'tv';
  const slug = params.slug as string;
  const id = getIdFromSlug(slug);

  const { user } = useAuth();
  const { saveHistory, getContinueWatchingItem } = useWatchHistory();

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Carregando...');
  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [activeEpisode, setActiveEpisode] = useState<{ season: number, episode: number } | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');
  
  const [currentStatsId, setCurrentStatsId] = useState<string | null>(type === 'movie' ? id : null);

  const [stats, setStats] = useState({ views: 0, likes: 0, dislikes: 0 });
  const [userLikeStatus, setUserLikeStatus] = useState<'liked' | 'disliked' | null>(null);
  const [subscribers, setSubscribers] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

  // Efeito 1: Busca os detalhes principais da mídia (filme/série) no TMDB.
  useEffect(() => {
    if (!id || !type) return;

    const fetchData = async () => {
      setIsLoading(true);
      setDetails(null);
      setSeasonEpisodes([]);
      setStatus('Carregando...');
      try {
        const detailsResponse = await axios.get(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,external_ids`);
        const data = detailsResponse.data;
        setDetails({ ...data, title: data.title || data.name, release_date: data.release_date || data.first_air_date, imdb_id: data.external_ids?.imdb_id });
      } catch (error) { 
        setStatus("Não foi possível carregar os detalhes.");
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, type]);

  // Efeito 2: Configura o player e salva o histórico inicial.
  useEffect(() => {
    if (!details || !id) return;

    if (type === 'movie') {
      setActiveStreamUrl(`https://primevicio.vercel.app/embed/movie/${details.id}`);
      if (user) {
        saveHistory({ mediaType: 'movie', tmdbId: id, title: details.title, poster_path: details.poster_path });
      }
    }
    
    if (type === 'tv') {
      const progress = getContinueWatchingItem(id);
      const startSeason = progress?.progress?.season || 1;
      const startEpisode = progress?.progress?.episode || 1;
      
      setSelectedSeason(startSeason);
      setActiveEpisode({ season: startSeason, episode: startEpisode });
    }
  }, [details, id, type, user, saveHistory, getContinueWatchingItem]);

  // Efeito 3: Busca os episódios de uma temporada.
  useEffect(() => {
    if (type !== 'tv' || !id || !details?.seasons) {
        if (type === 'movie' && details) setIsLoading(false);
        return;
    }
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

  // Efeito 4: Atualiza a URL do player e o histórico.
  useEffect(() => {
    if (type === 'tv' && activeEpisode && id && details) {
        const { season, episode } = activeEpisode;
        setActiveStreamUrl(`https://primevicio.vercel.app/embed/tv/${id}/${season}/${episode}`);
        
        const episodeData = seasonEpisodes.find(ep => ep.episode_number === episode);
        if (episodeData) {
            setCurrentStatsId(episodeData.id.toString());
        }

        if (user) {
          saveHistory({ mediaType: 'tv', tmdbId: id, title: details.title, poster_path: details.poster_path, progress: { season, episode } });
        }
    }
  }, [activeEpisode, id, type, details, saveHistory, user, seasonEpisodes]);
  
  // Efeito 5: Incrementa visualizações.
  useEffect(() => {
    if (!currentStatsId) return;
    const statsRef = doc(db, 'media_stats', currentStatsId);
    runTransaction(db, async (transaction) => {
        const statsDoc = await transaction.get(statsRef);
        if (!statsDoc.exists()) {
            transaction.set(statsRef, { views: 1, likes: 0, dislikes: 0 });
        } else {
            transaction.update(statsRef, { views: increment(1) });
        }
    }).catch(console.error);
  }, [currentStatsId]);

  // Efeito 6: Ouve mudanças nas estatísticas.
  useEffect(() => {
    if (!currentStatsId) {
      setStats({ views: 0, likes: 0, dislikes: 0 });
      return;
    }
    const statsRef = doc(db, 'media_stats', currentStatsId);
    const unsubStats = onSnapshot(statsRef, (doc) => {
        const data = doc.data();
        setStats({ views: data?.views || 0, likes: data?.likes || 0, dislikes: data?.dislikes || 0 });
    });
    const unsubChannel = onSnapshot(doc(db, "channels", CINEVEO_CHANNEL_ID), (doc) => {
        setSubscribers(doc.data()?.subscribers || 0);
    });
    return () => { unsubStats(); unsubChannel(); };
  }, [currentStatsId]);
  
  // Efeito 7: Ouve interações do usuário (like/subscribe).
  useEffect(() => {
      if (!currentStatsId || !user) {
          setUserLikeStatus(null);
          setIsSubscribed(false);
          return;
      };
      const unsubUserInteraction = onSnapshot(doc(db, `users/${user.uid}/interactions`, currentStatsId), (doc) => {
          setUserLikeStatus(doc.data()?.status || null);
      });
      const unsubUserSubscription = onSnapshot(doc(db, `users/${user.uid}/subscriptions`, CINEVEO_CHANNEL_ID), (doc) => {
          setIsSubscribed(doc.exists());
      });
      return () => { unsubUserInteraction(); unsubUserSubscription(); };
  }, [currentStatsId, user]);


  // --- FUNÇÕES DE MANIPULAÇÃO (HANDLERS) ---
  const handleEpisodeClick = (e: React.MouseEvent<HTMLButtonElement>, season: number, episodeNumber: number) => {
    setActiveEpisode({ season, episode: episodeNumber });
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  
  const getSynopsis = (): string => {
      if (type === 'movie') return details?.overview || 'Sinopse não disponível.';
      const currentEpisode = activeEpisode ? seasonEpisodes.find(ep => ep.episode_number === activeEpisode.episode) : null;
      return currentEpisode?.overview || details?.overview || 'Sinopse não disponível.';
  };
  
  const getTitle = (): string => {
      if (type === 'movie') return details?.title || 'Filme';
      const currentEpisode = activeEpisode ? seasonEpisodes.find(ep => ep.episode_number === activeEpisode.episode) : null;
      return currentEpisode && activeEpisode ? `${currentEpisode.name} - T${activeEpisode.season} E${activeEpisode.episode}` : details?.title || 'Série';
  }

  const handleLikeDislike = async (action: 'like' | 'dislike') => {
    if (!user) { alert("Você precisa estar logado para avaliar."); return; }
    if (!currentStatsId) return;

    const statsRef = doc(db, 'media_stats', currentStatsId);
    const userInteractionRef = doc(db, `users/${user.uid}/interactions`, currentStatsId);

    try {
        await runTransaction(db, async (transaction) => {
            const statsDoc = await transaction.get(statsRef);
            const userInteractionDoc = await transaction.get(userInteractionRef);
            const currentStats = statsDoc.data() || { likes: 0, dislikes: 0, views: 0 };
            const currentStatus = userInteractionDoc.data()?.status;
            let newLikes = currentStats.likes;
            let newDislikes = currentStats.dislikes;
            let newUserStatus: 'liked' | 'disliked' | null = null;

            if (action === 'like') {
                if (currentStatus === 'liked') { newLikes -= 1; newUserStatus = null; }
                else { newLikes += 1; if (currentStatus === 'disliked') newDislikes -= 1; newUserStatus = 'liked'; }
            } else {
                if (currentStatus === 'disliked') { newDislikes -= 1; newUserStatus = null; }
                else { newDislikes += 1; if (currentStatus === 'liked') newLikes -= 1; newUserStatus = 'disliked'; }
            }
            
            transaction.set(statsRef, { ...currentStats, likes: Math.max(0, newLikes), dislikes: Math.max(0, newDislikes) }, { merge: true });

            if (newUserStatus) { transaction.set(userInteractionRef, { status: newUserStatus }); }
            else if (userInteractionDoc.exists()) { transaction.delete(userInteractionRef); }
        });
    } catch (error) {
        console.error("Falha na transação de like/dislike: ", error);
        alert("Ocorreu um erro ao processar sua avaliação. Tente novamente.");
    }
  };

  const handleSubscribe = async () => {
    if (!user) { alert("Você precisa estar logado para se inscrever."); return; }
    const channelRef = doc(db, "channels", CINEVEO_CHANNEL_ID);
    const subscriptionRef = doc(db, `users/${user.uid}/subscriptions`, CINEVEO_CHANNEL_ID);
    try {
        await runTransaction(db, async (transaction) => {
            const channelDoc = await transaction.get(channelRef);
            const subscriptionDoc = await transaction.get(subscriptionRef);
            const currentSubscribers = channelDoc.data()?.subscribers || 0;
            if (subscriptionDoc.exists()) {
                transaction.set(channelRef, { subscribers: Math.max(0, currentSubscribers - 1) }, { merge: true });
                transaction.delete(subscriptionRef);
            } else {
                transaction.set(channelRef, { subscribers: currentSubscribers + 1 }, { merge: true });
                transaction.set(subscriptionRef, { subscribedAt: new Date() });
            }
        });
    } catch (error) {
        console.error("Falha na transação de inscrição: ", error);
        alert("Ocorreu um erro ao processar sua inscrição. Tente novamente.");
    }
  };

  // --- RENDERIZAÇÃO ---
  if (!details) {
    return (<div className="loading-container"><Image src="https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png" alt="Carregando..." width={120} height={120} className="loading-logo" priority style={{ objectFit: 'contain' }} /></div>);
  }
  
  const InfoBox = () => {
    const currentSynopsis = getSynopsis();
    return (
        <div className="synopsis-box" style={{ marginTop: '1.5rem' }}>
          <div className="details-meta-bar" style={{ paddingBottom: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', gap: '1rem' }}>
              <strong style={{ fontWeight: 600 }}>{formatNumber(stats.views)} visualizações</strong>
              <span style={{color: 'var(--text-secondary)'}}>{(details.release_date || details.first_air_date)?.substring(0, 4)}</span>
          </div>
          <div className={`synopsis-text-container ${isSynopsisExpanded ? 'expanded' : ''}`}>
              <p style={{color: 'var(--text-primary)'}}>{currentSynopsis}</p>
          </div>
          {(currentSynopsis || '').length > 150 &&
              <button onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)} className="expand-synopsis-btn focusable">
                  {isSynopsisExpanded ? 'Mostrar menos' : '...mais'}
              </button>
          }
          <div className="genre-tags">{details.genres.map(genre => <span key={genre.id} className="genre-tag">{genre.name}</span>)}</div>
        </div>
    );
  };

  const InteractionsSection = () => (
    <div className="details-interactions-section">
      <h1 className="movie-card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{getTitle()}</h1>
      <div className="channel-info">
          <div className="channel-details">
              <Image className="channel-avatar" src="https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png" alt="Avatar do CineVEO" width={50} height={50} />
              <div>
                  <div className="channel-name-wrapper">
                      <h3 className="channel-name">CineVEO</h3>
                      <Image className="verified-badge" src="https://i.ibb.co/mr16xgYy/Chat-GPT-Image-18-de-ago-de-2025-01-35-17-removebg-preview.png" alt="Verificado" width={16} height={16}/>
                  </div>
                  <p className="channel-subs">{formatNumber(subscribers)} inscritos</p>
              </div>
          </div>
          <button onClick={handleSubscribe} className={`subscribe-btn focusable ${isSubscribed ? 'subscribed' : ''}`}>
              {isSubscribed ? 'Inscrito' : 'Inscrever-se'}
          </button>
      </div>
      <div className="media-actions-bar">
        <div className="like-dislike-group">
          <button onClick={() => handleLikeDislike('like')} className={`action-btn focusable ${userLikeStatus === 'liked' ? 'active' : ''}`}>
              <LikeIcon isActive={userLikeStatus === 'liked'} width={24} height={24} /> 
              <span>{formatNumber(stats.likes)}</span>
          </button>
          <button onClick={() => handleLikeDislike('dislike')} className={`action-btn focusable ${userLikeStatus === 'disliked' ? 'active' : ''}`}>
              <DislikeIcon isActive={userLikeStatus === 'disliked'} width={24} height={24} />
               <span>{formatNumber(stats.dislikes)}</span>
          </button>
        </div>
      </div>
      {type === 'movie' && <InfoBox />}
    </div>
  );
  
  const EpisodeSelector = () => (
    <div className="episodes-list-wrapper">
        <div className="episodes-header">
            <select className="season-selector focusable" value={selectedSeason} onChange={(e) => { const newSeason = Number(e.target.value); setSelectedSeason(newSeason); }}>
                {details.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0).map(s => <option key={s.id} value={s.season_number}>{s.name}</option>)}
            </select>
            <p className='episode-count-info'>Atualizado até o ep {seasonEpisodes.length}</p>
        </div>
        <div className="episode-list-desktop desktop-only-layout">
            {isLoading && <div className='stream-loader'><div className='spinner'></div></div>}
            {!isLoading && seasonEpisodes.map(ep => (<button key={ep.id} className={`episode-item-button focusable ${activeEpisode?.season === selectedSeason && activeEpisode?.episode === ep.episode_number ? 'active' : ''}`} onClick={(e) => handleEpisodeClick(e, selectedSeason, ep.episode_number)}><div className="episode-item-number">{String(ep.episode_number).padStart(2, '0')}</div><div className="episode-item-thumbnail">{ep.still_path ? (<Image src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={`Cena de ${ep.name}`} width={160} height={90} />) : (<div className='thumbnail-placeholder-small'></div>)}</div><div className="episode-item-info"><span className="episode-item-title">{ep.name}</span><p className="episode-item-overview">{ep.overview}</p></div></button>))}
        </div>
        <div className="mobile-only-layout">
          <div className="episode-grid-mobile">
              {isLoading && <div className='stream-loader'><div className='spinner'></div></div>}
              {!isLoading && seasonEpisodes.map(ep => ( 
                <button key={ep.id} className={`episode-grid-button focusable ${activeEpisode?.season === selectedSeason && activeEpisode?.episode === ep.episode_number ? 'active' : ''}`} onClick={(e) => handleEpisodeClick(e, selectedSeason, ep.episode_number)}>
                  {ep.episode_number}
                </button>
              ))}
          </div>
        </div>
    </div>
  );

  const MovieSelector = () => (
    <div className="episodes-list-wrapper desktop-only-layout">
        <div className="episode-item-button active focusable movie-info-card" style={{ cursor: 'default' }}>
            <div className="episode-item-thumbnail"><Image src={`https://image.tmdb.org/t/p/w300${details.poster_path}`} alt={`Poster de ${details.title}`} width={120} height={180} style={{ objectFit: 'cover', width: '100%', height: 'auto', aspectRatio: '2/3' }} /></div>
            <div className="episode-item-info"><span className="episode-item-title">{details.title}</span><p className="episode-item-overview">Filme Completo</p></div>
            <div className="visualizer-container"><AudioVisualizer /></div>
        </div>
    </div>
  );

  return (
    <>
      <div className="media-page-layout">
        <section className="series-watch-section">
          <div className="main-container desktop-only-layout">
            <div className="series-watch-grid">
              <div className="series-player-wrapper">
                <PlayerContent activeStreamUrl={activeStreamUrl} title={details.title} />
                <InteractionsSection />
              </div>
              <div>
                {type === 'tv' ? <EpisodeSelector /> : <MovieSelector />}
                {type === 'tv' && <InfoBox />}
              </div>
            </div>
          </div>
          <div className="mobile-only-layout">
            <PlayerContent activeStreamUrl={activeStreamUrl} title={details.title} />
          </div>
        </section>
        <div className="mobile-only-layout">
             <div className="main-container" style={{ marginTop: '1.5rem' }}>
                <InteractionsSection />
                {type === 'tv' && <EpisodeSelector />}
                {type === 'tv' && <InfoBox />}
            </div>
        </div>
        <main className="details-main-content">
          <div className="main-container">
            <section className="cast-section">
              <h2>Elenco Principal</h2>
              <div className="cast-grid">
                {details.credits?.cast.slice(0, 10).map(member => (<div key={member.id} className='cast-member'><div className='cast-member-img'>{member.profile_path ? (<Image src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} alt={member.name} width={150} height={225} style={{width: '100%', height: '100%', objectFit: 'cover'}} />) : <div className='thumbnail-placeholder person'></div>}</div><strong>{member.name}</strong><span>{member.character}</span></div>))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}