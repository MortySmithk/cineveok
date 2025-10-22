// cineveo-next/app/media/[type]/[slug]/MediaPageClient.tsx
"use client";

import { useState, useEffect, memo, useRef, useLayoutEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { doc, runTransaction, onSnapshot, increment } from 'firebase/firestore';

import { useAuth } from '@/app/components/AuthProvider';
import { db } from '@/app/components/firebase';

import LikeIcon from '@/app/components/icons/LikeIcon';
import DislikeIcon from '@/app/components/icons/DislikeIcon';
import { useWatchHistory } from '@/app/hooks/useWatchHistory';
import AudioVisualizer from '@/app/components/AudioVisualizer';
import PlayIcon from '@/app/components/icons/PlayIcon';
import StarIcon from '@/app/components/icons/StarIcon';
import ClockIcon from '@/app/components/icons/ClockIcon';
// import FirebaseComments from '@/app/components/FirebaseComments'; // REMOVIDO
import DisqusComments from '@/app/components/DisqusComments'; // ADICIONADO

// --- Interfaces ---
// ... (interfaces permanecem as mesmas)
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
  // ... (conteúdo do PlayerContent permanece o mesmo)
  return (
    <div className="player-container">
      {activeStreamUrl ? (
        <iframe
          key={activeStreamUrl}
          src={activeStreamUrl}
          title={`CineVEO Player - ${title}`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          referrerPolicy="origin"
          loading="lazy"
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
  const { saveHistory, continueWatching } = useWatchHistory();

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('Carregando...');
  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [activeEpisode, setActiveEpisode] = useState<{ season: number, episode: number } | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');

  const [currentStatsId, setCurrentStatsId] = useState<string | null>(null); // MODIFICADO: Inicia nulo
  const [isInitialEpisodeSet, setIsInitialEpisodeSet] = useState(false);

  const [stats, setStats] = useState({ views: 0, likes: 0, dislikes: 0 });
  const [userLikeStatus, setUserLikeStatus] = useState<'liked' | 'disliked' | null>(null);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

  // const [mediaIdForComments, setMediaIdForComments] = useState<string | null>(null); // REMOVIDO
  const [disqusConfig, setDisqusConfig] = useState<{ url: string; identifier: string; title: string } | null>(null); // ADICIONADO


  const episodeListRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);

  const embedBaseUrl = process.env.NEXT_PUBLIC_EMBED_BASE_URL || '[https://www.primevicio.lat](https://www.primevicio.lat)';

  // --- useEffect para buscar detalhes da mídia ---
  useEffect(() => {
    // ... (lógica existente para buscar detalhes)
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

  // --- useEffect para configurar player inicial e Disqus ---
  useEffect(() => {
    if (!details || !id || typeof window === 'undefined' || isInitialEpisodeSet) return;

    const pageUrl = window.location.href; // URL atual da página

    if (type === 'movie') {
      setActiveStreamUrl(`${embedBaseUrl}/embed/movie/${details.id}`);
      if (user) {
        saveHistory({ mediaType: 'movie', tmdbId: id, title: details.title, poster_path: details.poster_path });
      }
      setCurrentStatsId(id); // Define ID para stats
      setDisqusConfig({ // Define config do Disqus
          url: pageUrl,
          identifier: `movie-${id}`,
          title: details.title
      });
      setIsInitialEpisodeSet(true);
    } else if (type === 'tv') {
      const progress = continueWatching.find(item => item.tmdbId === id);
      let initialSeason = 1;
      let initialEpisode = 1;
      if (progress?.progress) {
          initialSeason = progress.progress.season;
          initialEpisode = progress.progress.episode;
      }
      setSelectedSeason(initialSeason);
      setActiveEpisode({ season: initialSeason, episode: initialEpisode });
      setIsInitialEpisodeSet(true); // Marca que a configuração inicial foi feita
    }
  }, [details, id, type, user, saveHistory, continueWatching, isInitialEpisodeSet, slug, embedBaseUrl]);


  // --- useEffect para buscar episódios da temporada (séries) ---
  useEffect(() => {
    // ... (lógica existente para buscar episódios)
    if (type !== 'tv' || !id || !details?.seasons) {
        if (type === 'movie' && details) setIsLoading(false);
        return;
    }

    const fetchSeasonData = async () => {
      setIsLoading(true);
      try {
        const seasonResponse = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}?api_key=${API_KEY}&language=pt-BR`);
        setSeasonEpisodes(seasonResponse.data.episodes);

        // Se o episódio ativo não foi definido ainda, define para o primeiro da temporada
        if (!activeEpisode && seasonResponse.data.episodes.length > 0) {
            setActiveEpisode({ season: selectedSeason, episode: seasonResponse.data.episodes[0].episode_number });
        }

      } catch (error) {
        setSeasonEpisodes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSeasonData();
  }, [id, details, selectedSeason, type, activeEpisode]); // Adicionado activeEpisode como dependência

  // --- useEffect para atualizar player e Disqus ao mudar episódio (séries) ---
  useEffect(() => {
    if (type === 'tv' && activeEpisode && id && details && seasonEpisodes.length > 0 && typeof window !== 'undefined') {
        const { season, episode } = activeEpisode;
        setActiveStreamUrl(`${embedBaseUrl}/embed/tv/${id}/${season}/${episode}`);

        const episodeData = seasonEpisodes.find(ep => ep.episode_number === episode);
        if (episodeData) {
            setCurrentStatsId(episodeData.id.toString()); // Define ID para stats
            setDisqusConfig({ // Define config do Disqus
                url: window.location.href.split('?')[0] + `?season=${season}&episode=${episode}`, // URL com query params
                identifier: `tv-${id}-s${season}-e${episode}`,
                title: `${details.title} - T${season} E${episode}`
            });
        } else {
             // Caso não ache o episódio (pode acontecer durante o carregamento inicial)
             // Tenta definir o ID de stats e Disqus para o primeiro episódio
             const firstEpisode = seasonEpisodes[0];
             if(firstEpisode) {
                 setCurrentStatsId(firstEpisode.id.toString());
                 setDisqusConfig({
                     url: window.location.href.split('?')[0] + `?season=${season}&episode=${firstEpisode.episode_number}`,
                     identifier: `tv-${id}-s${season}-e${firstEpisode.episode_number}`,
                     title: `${details.title} - T${season} E${firstEpisode.episode_number}`
                 });
             }
        }

        if (user) {
          saveHistory({ mediaType: 'tv', tmdbId: id, title: details.title, poster_path: details.poster_path, progress: { season, episode } });
        }
    }
  }, [activeEpisode, id, type, details, saveHistory, user, seasonEpisodes, slug, embedBaseUrl]); // Removido mediaIdForComments

  // --- useEffects para Views, Stats e Likes/Dislikes (permanecem os mesmos) ---
  useEffect(() => {
    // ... (lógica de incrementar views)
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

  useEffect(() => {
    // ... (lógica de buscar stats)
    if (!currentStatsId) {
      setStats({ views: 0, likes: 0, dislikes: 0 });
      return;
    }
    const statsRef = doc(db, 'media_stats', currentStatsId);
    const unsubStats = onSnapshot(statsRef, (doc) => {
        const data = doc.data();
        setStats({ views: data?.views || 0, likes: data?.likes || 0, dislikes: data?.dislikes || 0 });
    });

    return () => unsubStats();
  }, [currentStatsId]);

  useEffect(() => {
    // ... (lógica de buscar like/dislike do usuário)
      if (!currentStatsId || !user) {
          setUserLikeStatus(null);
          return;
      };
      const unsubUserInteraction = onSnapshot(doc(db, `users/${user.uid}/interactions`, currentStatsId), (doc) => {
          setUserLikeStatus(doc.data()?.status || null);
      });
      return () => unsubUserInteraction();
  }, [currentStatsId, user]);

  // --- useLayoutEffect para scroll (permanece o mesmo) ---
  useLayoutEffect(() => {
    // ... (lógica de restaurar scroll)
    if (episodeListRef.current) {
      episodeListRef.current.scrollTop = scrollPosRef.current;
    }
  });

  // --- Funções de manipulação (permanecem as mesmas) ---
  const handleEpisodeClick = (season: number, episodeNumber: number) => {
    // ... (lógica de salvar scroll e mudar episódio)
    if (episodeListRef.current) {
      scrollPosRef.current = episodeListRef.current.scrollTop;
    }
    setActiveEpisode({ season, episode: episodeNumber });
  };

  const handleSeasonChange = (newSeason: number) => {
    // ... (lógica de resetar scroll e mudar temporada)
      scrollPosRef.current = 0;
      setSelectedSeason(newSeason);
      // Define o episódio ativo como nulo para buscar o primeiro da nova temporada
      setActiveEpisode(null);
  };

  const getSynopsis = (): string => {
    // ... (lógica de pegar sinopse)
      if (type === 'movie') return details?.overview || 'Sinopse não disponível.';
      const currentEpisode = activeEpisode ? seasonEpisodes.find(ep => ep.episode_number === activeEpisode.episode) : null;
      return currentEpisode?.overview || details?.overview || 'Sinopse não disponível.';
  };

  const getEpisodeTitle = (): string => {
    // ... (lógica de pegar título do episódio/filme)
      if (type === 'movie') return details?.title || 'Filme';
      const currentEpisode = activeEpisode ? seasonEpisodes.find(ep => ep.episode_number === activeEpisode.episode) : null;
      return currentEpisode && activeEpisode ? `${currentEpisode.name} - T${activeEpisode.season} E${activeEpisode.episode}` : details?.title || 'Série';
  }

  const handleLikeDislike = async (action: 'like' | 'dislike') => {
    // ... (lógica de like/dislike)
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

  // --- Renderização condicional de loading ---
  if (!details && isLoading) {
    return (<div className="loading-container"><Image src="[https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png](https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png)" alt="Carregando..." width={120} height={120} className="loading-logo" priority style={{ objectFit: 'contain' }} /></div>);
  }
  if (!details) {
    return (<div className="loading-container"><p>{status}</p></div>);
  }

  // --- Componentes internos (InfoBox, InteractionsSection, etc.) ---
  const InfoBox = () => {
    // ... (conteúdo do InfoBox permanece o mesmo)
    const currentSynopsis = getSynopsis();
    return (
        <div className="synopsis-box" style={{ marginTop: '1.5rem' }}>
          <div className="info-box-header">
              <strong>{formatNumber(stats.views)} visualizações</strong>
              <span>{(details.release_date || details.first_air_date)?.substring(0, 4)}</span>
          </div>
          <div className={`synopsis-text-container ${isSynopsisExpanded ? 'expanded' : ''}`}>
              <p>{currentSynopsis}</p>
          </div>
          {(currentSynopsis || '').length > 150 &&
              <button onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)} className="expand-synopsis-btn focusable">
                  {isSynopsisExpanded ? 'Mostrar menos' : '...mais'}
              </button>
          }
        </div>
    );
  };

  const InteractionsSection = () => (
    // ... (conteúdo da InteractionsSection permanece o mesmo)
    <div className="details-interactions-section">
      <h2 className="episode-title">{getEpisodeTitle()}</h2>

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
    </div>
  );

  const EpisodeSelector = () => (
    // ... (conteúdo do EpisodeSelector permanece o mesmo)
    <div className="episodes-list-wrapper">
        <div className="episodes-header">
            <select className="season-selector focusable" value={selectedSeason} onChange={(e) => handleSeasonChange(Number(e.target.value))}>
                {details.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0).map(s => <option key={s.id} value={s.season_number}>{s.name}</option>)}
            </select>
            <p className='episode-count-info'>Atualizado até o ep {seasonEpisodes.length}</p>
        </div>
        <div className="episode-list-desktop desktop-only-layout" ref={episodeListRef}>
            {isLoading && <div className='stream-loader'><div className='spinner'></div></div>}
            {!isLoading && seasonEpisodes.map(ep => (<button key={ep.id} className={`episode-item-button focusable ${activeEpisode?.season === selectedSeason && activeEpisode?.episode === ep.episode_number ? 'active' : ''}`} onClick={() => handleEpisodeClick(selectedSeason, ep.episode_number)}><div className="episode-item-number">{String(ep.episode_number).padStart(2, '0')}</div><div className="episode-item-thumbnail">{ep.still_path ? (<Image draggable="false" src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={`Cena de ${ep.name}`} width={160} height={90} />) : (<div className='thumbnail-placeholder-small'></div>)}</div><div className="episode-item-info"><span className="episode-item-title">{ep.name}</span><p className="episode-item-overview">{ep.overview}</p></div></button>))}
        </div>
        <div className="mobile-only-layout">
          <div className="episode-grid-mobile">
              {isLoading && <div className='stream-loader'><div className='spinner'></div></div>}
              {!isLoading && seasonEpisodes.map(ep => (
                <button key={ep.id} className={`episode-grid-button focusable ${activeEpisode?.season === selectedSeason && activeEpisode?.episode === ep.episode_number ? 'active' : ''}`} onClick={() => handleEpisodeClick(selectedSeason, ep.episode_number)}>
                  {ep.episode_number}
                </button>
              ))}
          </div>
        </div>
    </div>
  );

  const MovieSelector = () => (
    // ... (conteúdo do MovieSelector permanece o mesmo)
    <div className="episodes-list-wrapper desktop-only-layout">
        <div className="episode-item-button active focusable movie-info-card" style={{ cursor: 'default' }}>
            <div className="episode-item-thumbnail"><Image draggable="false" src={`https://image.tmdb.org/t/p/w300${details.poster_path}`} alt={`Poster de ${details.title}`} width={120} height={180} style={{ objectFit: 'cover', width: '100%', height: 'auto', aspectRatio: '2/3' }} /></div>
            <div className="episode-item-info"><span className="episode-item-title">{details.title}</span><p className="episode-item-overview">Filme Completo</p></div>
            <div className="visualizer-container"><AudioVisualizer /></div>
        </div>
    </div>
  );

  // --- Renderização principal ---
  return (
    <>
      <div className="media-page-layout">
        <section className="series-watch-section">
          {/* --- LAYOUT DESKTOP --- */}
          <div className="main-container desktop-only-layout">
            <div className="series-watch-grid">
              {/* Coluna 1: Player e Informações */}
              <div className="series-player-wrapper">
                <PlayerContent activeStreamUrl={activeStreamUrl} title={details.title} />
                <InteractionsSection />
                {type === 'movie' && <InfoBox />}
                {/* O Disqus de FILME foi movido para a segunda coluna
                */}
              </div>
              
              {/* Coluna 2: Seletor de Episódio/Filme e Comentários */}
              <div>
                {type === 'tv' ? <EpisodeSelector /> : <MovieSelector />}
                {type === 'tv' && <InfoBox />}
                 
                {/* Disqus para SÉRIES (continua aqui) */}
                {type === 'tv' && disqusConfig && (
                  <DisqusComments
                    url={disqusConfig.url}
                    identifier={disqusConfig.identifier}
                    title={disqusConfig.title}
                  />
                )}

                {/* ✅ MUDANÇA: Disqus para FILMES (movido para cá) */}
                {type === 'movie' && disqusConfig && (
                  <DisqusComments
                    url={disqusConfig.url}
                    identifier={disqusConfig.identifier}
                    title={disqusConfig.title}
                  />
                )}
              </div>
            </div>
          </div>

          {/* --- LAYOUT MOBILE --- */}
          <div className="mobile-only-layout">
            <PlayerContent activeStreamUrl={activeStreamUrl} title={details.title} />
          </div>
        </section>
        
        {/* --- SEÇÃO INFERIOR MOBILE --- */}
        <div className="mobile-only-layout">
             <div className="main-container" style={{ marginTop: '1.5rem' }}>
                <InteractionsSection />
                {type === 'movie' && <InfoBox />}
                {/* Comentários de FILME no mobile */}
                {type === 'movie' && disqusConfig && (
                  <DisqusComments
                    url={disqusConfig.url}
                    identifier={disqusConfig.identifier}
                    title={disqusConfig.title}
                  />
                )}

                {type === 'tv' && <EpisodeSelector />}
                {type === 'tv' && <InfoBox />}
                {/* Comentários de SÉRIE no mobile */}
                {type === 'tv' && disqusConfig && (
                  <DisqusComments
                    url={disqusConfig.url}
                    identifier={disqusConfig.identifier}
                    title={disqusConfig.title}
                  />
                )}
            </div>
        </div>
        
        {/* --- CONTEÚDO PRINCIPAL (ELENCO, ETC) --- */}
        <main className="details-main-content">
          <div className="main-container">
            {/* ... (Restante da seção de detalhes, elenco, etc., permanece o mesmo) ... */}
            <div className="details-grid">
              <div className="details-poster-container desktop-only-layout">
                  <div className="details-poster">
                    <Image draggable="false" src={details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '[https://i.ibb.co/XzZ0b1B/placeholder.png](https://i.ibb.co/XzZ0b1B/placeholder.png)'} alt={details.title} width={300} height={450} style={{ width: '100%', height: 'auto' }}/>
                  </div>
                   <div className="poster-info-bar">
                    <span className="poster-info-title">{details.title}</span>
                    <span className="poster-info-rating"><StarIcon /> {details.vote_average.toFixed(1)}</span>
                  </div>
              </div>
              <div className="details-info">
                 <div className='desktop-only-layout'>
                    <h1>{details.title}</h1>
                    <div className="details-meta-bar">
                      <span className="meta-item"><StarIcon /> {details.vote_average.toFixed(1)}</span>
                      <span className="meta-item">{(details.release_date || details.first_air_date)?.substring(0, 4)}</span>
                       { (details.runtime || details.episode_run_time?.[0]) &&
                        <span className='meta-item'>
                          <ClockIcon /> {details.runtime || details.episode_run_time?.[0]} min
                        </span>
                       }
                    </div>
                    <div className="action-buttons-desktop">
                        <button className="btn-primary focusable"><PlayIcon /> Assistir</button>
                        <button className="btn-secondary focusable">+ Minha Lista</button>
                    </div>
                    <div className="synopsis-box">
                        <h3>Sinopse</h3>
                        <p>{details.overview || 'Sinopse não disponível.'}</p>
                    </div>
                    <div className="genre-tags">{details.genres.map(genre => <span key={genre.id} className="genre-tag">{genre.name}</span>)}</div>
                </div>
              </div>
            </div>
            <section className="cast-section">
              <h2>Elenco Principal</h2>
              <div className="cast-grid">
                {details.credits?.cast.slice(0, 10).map(member => (<div key={member.id} className='cast-member'><div className='cast-member-img'>{member.profile_path ? (<Image draggable="false" src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} alt={member.name} width={150} height={225} style={{width: '100%', height: '100%', objectFit: 'cover'}} />) : <div className='thumbnail-placeholder person'></div>}</div><strong>{member.name}</strong><span>{member.character}</span></div>))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}