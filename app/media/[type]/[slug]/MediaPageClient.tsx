// app/media/[type]/[slug]/MediaPageClient.tsx
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
import DisqusComments from '@/app/components/DisqusComments';

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
  return (
    <div className="player-container">
      {activeStreamUrl ? (
        <iframe
          key={activeStreamUrl} // Chave garante recarregamento do iframe ao mudar URL
          src={activeStreamUrl}
          title={`CineVEO Player - ${title}`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          referrerPolicy="origin" // Mudado para 'origin' pode ajudar em alguns embeds
          loading="lazy"
        ></iframe>
      ) : (
        <div className="player-loader">
          <div className="spinner"></div>
          {/* Mensagem dinâmica */}
          <span>{title === 'Filme' ? 'Carregando filme...' : 'Selecione um episódio para assistir.'}</span>
        </div>
      )}
    </div>
  );
});


// MODIFICAÇÃO AQUI: Aceita searchParams
export default function MediaPageClient({ 
  params,
  searchParams
}: { 
  params: { type: string; slug: string };
  searchParams?: { [key: string]: string | string[] | undefined }; // <-- ADICIONADO
}) {
  const type = params.type as 'movie' | 'tv';
  const slug = params.slug as string;
  const id = getIdFromSlug(slug);

  const { user } = useAuth();
  const { saveHistory, getContinueWatchingItem } = useWatchHistory();

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [status, setStatus] = useState('Carregando...');
  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null); // Começa como null
  const [activeEpisode, setActiveEpisode] = useState<{ season: number, episode: number } | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');

  const [currentStatsId, setCurrentStatsId] = useState<string | null>(null);
  const initialSetupDoneRef = useRef(false); // Ref para controlar setup inicial

  const [stats, setStats] = useState({ views: 0, likes: 0, dislikes: 0 });
  const [userLikeStatus, setUserLikeStatus] = useState<'liked' | 'disliked' | null>(null);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

  const [disqusConfig, setDisqusConfig] = useState<{ url: string; identifier: string; title: string } | null>(null);

  const episodeListRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0); // Ref para salvar a posição do scroll

  const embedBaseUrl = process.env.NEXT_PUBLIC_EMBED_BASE_URL || 'https://www.primevicio.lat';

  // --- 1. useEffect: Buscar detalhes da mídia ---
  useEffect(() => {
    if (!id || !type) return;
    initialSetupDoneRef.current = false; // Reseta o setup ao buscar novos detalhes

    const fetchData = async () => {
      setIsLoadingDetails(true);
      setIsLoadingEpisodes(false);
      setDetails(null);
      setSeasonEpisodes([]);
      setActiveEpisode(null);
      setSelectedSeason(null); // Reseta para null
      setActiveStreamUrl('');
      setStatus('Carregando detalhes...');
      try {
        const detailsResponse = await axios.get(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,external_ids`);
        const data = detailsResponse.data;
        setDetails({ ...data, title: data.title || data.name, release_date: data.release_date || data.first_air_date, imdb_id: data.external_ids?.imdb_id });
      } catch (error) {
        console.error("Erro ao buscar detalhes:", error);
        setStatus("Não foi possível carregar os detalhes.");
      } finally {
        setIsLoadingDetails(false);
      }
    };
    fetchData();
  }, [id, type]);

  // --- 2. useEffect: Configuração inicial APÓS detalhes carregados ---
  useEffect(() => {
    if (isLoadingDetails || !details || initialSetupDoneRef.current || !id) return;

    if (type === 'movie') {
      setActiveStreamUrl(`${embedBaseUrl}/embed/movie/${details.id}`);
      if (user) {
        saveHistory({ mediaType: 'movie', tmdbId: id, title: details.title, poster_path: details.poster_path });
      }
      setCurrentStatsId(id);
      if (typeof window !== 'undefined') {
        setDisqusConfig({ url: window.location.href, identifier: `movie-${id}`, title: details.title });
      }
      initialSetupDoneRef.current = true; // Marca setup feito para filme
    } else if (type === 'tv') {
      
      const seasonFromQuery = searchParams?.season ? Number(searchParams.season) : null;
      const episodeFromQuery = searchParams?.episode ? Number(searchParams.episode) : null;

      let initialSeason = 1;
      let initialEpisode = 1;

      if (seasonFromQuery && episodeFromQuery) {
        initialSeason = seasonFromQuery;
        initialEpisode = episodeFromQuery;
      } else {
        const progress = getContinueWatchingItem(id);
        if (progress?.progress) {
          initialSeason = progress.progress.season;
          initialEpisode = progress.progress.episode;
        }
      }

      setSelectedSeason(initialSeason);
      setActiveEpisode({ season: initialSeason, episode: initialEpisode });
      initialSetupDoneRef.current = true; // Marca setup feito para série
    }
  }, [
      details, isLoadingDetails, id, type, user, saveHistory, 
      getContinueWatchingItem, embedBaseUrl, 
      searchParams
    ]);


  // --- 3. useEffect: Buscar episódios QUANDO selectedSeason é definido (e não é null) ---
  useEffect(() => {
    // Só roda para séries, se tiver ID e detalhes, e se selectedSeason tiver um valor
    if (type !== 'tv' || !id || !details?.seasons || selectedSeason === null || isLoadingDetails) {
      return;
    }

    const fetchSeasonData = async () => {
      setIsLoadingEpisodes(true);
      // setSeasonEpisodes([]); // NÃO limpe a lista aqui, para o scroll funcionar
      setStatus(`Carregando temporada ${selectedSeason}...`);
      try {
        const seasonResponse = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}?api_key=${API_KEY}&language=pt-BR`);
        const episodesData = seasonResponse.data.episodes;
        setSeasonEpisodes(episodesData);

        const isCurrentActiveEpisodeValid = activeEpisode && activeEpisode.season === selectedSeason && episodesData.some((ep: Episode) => ep.episode_number === activeEpisode.episode);

        if (!isCurrentActiveEpisodeValid && episodesData.length > 0) {
            setActiveEpisode({ season: selectedSeason, episode: episodesData[0].episode_number });
        } else if (episodesData.length === 0) {
            setActiveEpisode(null); // Nenhum episódio encontrado
        }

      } catch (error) {
        console.error(`Erro ao buscar temporada ${selectedSeason}:`, error);
        setStatus(`Erro ao carregar temporada ${selectedSeason}.`);
        setSeasonEpisodes([]);
        setActiveEpisode(null);
      } finally {
        setIsLoadingEpisodes(false);
      }
    };

    fetchSeasonData();
    
    // <<< --- CORREÇÃO AQUI (A MAIS IMPORTANTE) --- >>>
    // A lista de dependências NÃO DEVE conter 'activeEpisode'.
    // Isso garante que este hook SÓ rode ao trocar de TEMPORADA,
    // e não ao trocar de EPISÓDIO.
  }, [selectedSeason, id, type, details, isLoadingDetails]);
    // <<< --- FIM DA CORREÇÃO --- >>>


  // --- 4. useEffect: Atualizar Player URL, Disqus e Histórico QUANDO activeEpisode muda ---
  useEffect(() => {
    // Este hook agora é o *único* que roda (além do 1 e 2) quando se clica num episódio.
    if (isLoadingDetails || type !== 'tv' || !activeEpisode || !id || !details) return;

    const { season, episode } = activeEpisode;
    setActiveStreamUrl(`${embedBaseUrl}/embed/tv/${id}/${season}/${episode}`);

    const episodeData = seasonEpisodes.find(ep => ep.episode_number === episode);

    if (episodeData && typeof window !== 'undefined') {
        const identifier = `tv-${id}-s${season}-e${episode}`;
        const title = `${details.title} - T${season} E${episode}`;
        const url = window.location.href.split('?')[0] + `?season=${season}&episode=${episode}`;
        const statsId = episodeData.id.toString();

        setCurrentStatsId(statsId);
        setDisqusConfig({ url, identifier, title });

        if (user) {
            saveHistory({
                mediaType: 'tv',
                tmdbId: id,
                title: details.title,
                poster_path: details.poster_path,
                progress: { season, episode }
            });
        }
    } else if (!episodeData && seasonEpisodes.length > 0 && !isLoadingEpisodes) {
        // Fallback
        if(selectedSeason) { 
            setActiveEpisode({ season: selectedSeason, episode: seasonEpisodes[0].episode_number });
        }
    } else if (seasonEpisodes.length === 0 && !isLoadingEpisodes) {
        setActiveStreamUrl('');
        setCurrentStatsId(null);
        setDisqusConfig(null);
    }

  }, [activeEpisode, seasonEpisodes, isLoadingEpisodes, id, type, details, embedBaseUrl, user, saveHistory, isLoadingDetails, selectedSeason]);

  // --- useEffects para Views, Stats e Likes/Dislikes (sem alterações) ---
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

  useEffect(() => {
    if (!currentStatsId) {
      setStats({ views: 0, likes: 0, dislikes: 0 });
      return;
    }
    const statsRef = doc(db, 'media_stats', currentStatsId);
    const unsubStats = onSnapshot(statsRef, (docSnap) => {
        const data = docSnap.data();
        setStats({ views: data?.views || 0, likes: data?.likes || 0, dislikes: data?.dislikes || 0 });
    });
    return () => unsubStats();
  }, [currentStatsId]);

  useEffect(() => {
      if (!currentStatsId || !user) {
          setUserLikeStatus(null);
          return;
      };
      const userInteractionRef = doc(db, `users/${user.uid}/interactions`, currentStatsId);
      const unsubUserInteraction = onSnapshot(userInteractionRef, (docSnap) => {
          setUserLikeStatus(docSnap.data()?.status || null);
      });
      return () => unsubUserInteraction();
  }, [currentStatsId, user]);


  // <<< --- CORREÇÃO AQUI (GARANTIA) --- >>>
  // Este hook restaura a posição do scroll.
  // Vamos fazê-lo rodar sempre que 'isLoadingEpisodes' mudar (especificamente
  // de true para false), garantindo que a lista esteja renderizada.
  useLayoutEffect(() => {
    // Se *não* estiver carregando, restaure o scroll.
    if (episodeListRef.current && !isLoadingEpisodes) {
      episodeListRef.current.scrollTop = scrollPosRef.current;
    }
    // Esta dependência é crucial.
  }, [isLoadingEpisodes]); 
  // <<< --- FIM DA CORREÇÃO --- >>>


  // --- Funções de manipulação (sem alterações) ---
  const handleEpisodeClick = (season: number, episodeNumber: number) => {
    if (isLoadingEpisodes) return;
    
    // Salva a posição ATUAL do scroll ANTES de atualizar o estado
    if (episodeListRef.current) {
      scrollPosRef.current = episodeListRef.current.scrollTop;
    }
    
    // Atualiza o episódio ativo (Isso vai disparar o useEffect #4, mas NÃO o #3)
    setActiveEpisode({ season, episode: episodeNumber });
  };

  const handleSeasonChange = (newSeason: number) => {
      if (selectedSeason === newSeason || isLoadingEpisodes) return;
      scrollPosRef.current = 0; // Reseta o scroll para o topo ao mudar de temporada
      setSelectedSeason(newSeason); // Isso vai disparar o useEffect 3 para buscar episódios
      setActiveEpisode(null); // Reseta o episódio ativo ao mudar de temporada manualmente
  };

  const getSynopsis = (): string => {
      if (!details) return 'Carregando sinopse...';
      if (type === 'movie') return details.overview || 'Sinopse não disponível.';
      const currentEpisodeData = activeEpisode ? seasonEpisodes.find(ep => ep.episode_number === activeEpisode.episode) : null;
      return currentEpisodeData?.overview || details.overview || 'Sinopse não disponível.';
  };

  const getEpisodeTitle = (): string => {
      if (!details) return 'Carregando título...';
      if (type === 'movie') return details.title || 'Filme';
      const currentEpisodeData = activeEpisode ? seasonEpisodes.find(ep => ep.episode_number === activeEpisode.episode) : null;
      return currentEpisodeData && activeEpisode ? `${currentEpisodeData.name} - T${activeEpisode.season} E${activeEpisode.episode}` : details.title || 'Série';
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

  // --- Renderização condicional de loading ---
  if (isLoadingDetails) {
    return (<div className="loading-container"><Image src="https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png" alt="Carregando..." width={120} height={120} className="loading-logo" priority style={{ objectFit: 'contain' }} /></div>);
  }
  if (!details) {
    return (<div className="loading-container"><p>{status}</p></div>);
  }

  // --- Componentes internos (sem alterações) ---
  const InfoBox = () => {
    const currentSynopsis = getSynopsis();
    return (
        <div className="synopsis-box desktop-only-layout" style={{ marginTop: '1.5rem' }}>
          <div className="info-box-header" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
              <strong>{formatNumber(stats.views)} visualizações</strong>
              <span>{(details.release_date || details.first_air_date)?.substring(0, 4)}</span>
          </div>
          <p style={{color: 'var(--text-secondary)', lineHeight: 1.7}}>{currentSynopsis}</p>
        </div>
    );
  };

   const InfoBoxMobile = () => {
    const currentSynopsis = getSynopsis();
    return (
      <div className="synopsis-box-mobile mobile-only-layout">
        <h3>{details.title}</h3>
         <div className="details-meta-bar mb-2">
            <span className="meta-item"><StarIcon /> {details.vote_average.toFixed(1)}</span>
            <span className="meta-item">{(details.release_date || details.first_air_date)?.substring(0, 4)}</span>
            {(details.runtime || details.episode_run_time?.[0]) &&
                <span className='meta-item'>
                  <ClockIcon /> {details.runtime || details.episode_run_time?.[0]} min
                </span>
            }
        </div>
        <div className={`synopsis-text-container ${isSynopsisExpanded ? 'expanded' : ''}`}>
          <p>{currentSynopsis}</p>
        </div>
        {(currentSynopsis || '').length > 100 &&
          <button onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)} className="expand-synopsis-btn focusable">
            {isSynopsisExpanded ? 'Mostrar menos' : '...mais'}
          </button>
        }
      </div>
    );
  };

  const InteractionsSection = () => (
    <div className="details-interactions-section">
      <h2 className="episode-title">{getEpisodeTitle()}</h2>

      <div className="media-actions-bar">
        <span className="views-info desktop-only-layout">{formatNumber(stats.views)} visualizações</span>
        <div className="like-dislike-group">
          <button onClick={() => handleLikeDislike('like')} className={`action-btn focusable ${userLikeStatus === 'liked' ? 'active' : ''}`}>
              <LikeIcon isActive={userLikeStatus === 'liked'} width={28} height={28} />
              <span>{formatNumber(stats.likes)}</span>
          </button>
          <button onClick={() => handleLikeDislike('dislike')} className={`action-btn focusable ${userLikeStatus === 'disliked' ? 'active' : ''}`}>
              <DislikeIcon isActive={userLikeStatus === 'disliked'} width={28} height={28} />
               <span>{formatNumber(stats.dislikes)}</span>
          </button>
        </div>
      </div>

       {/* Movido InfoBoxMobile para dentro de InteractionsSection no mobile */}
      <InfoBoxMobile />
    </div>
  );

  const EpisodeSelector = () => (
    <div className="episodes-list-wrapper">
        <div className="episodes-header">
            {/* O valor do select agora é `selectedSeason ?? ''` para lidar com o estado inicial null */}
            <select
                className="season-selector focusable"
                value={selectedSeason ?? ''}
                onChange={(e) => handleSeasonChange(Number(e.target.value))}
                disabled={isLoadingEpisodes} // Desabilita enquanto carrega
            >
                {/* Garante que só mostra temporadas válidas */}
                {details.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0).map(s => <option key={s.id} value={s.season_number}>{s.name}</option>)}
            </select>
            {/* Mostra contagem apenas se não estiver carregando episódios */}
            {!isLoadingEpisodes && <p className='episode-count-info'>({seasonEpisodes.length} Eps)</p>}
        </div>
        <div className="episode-list-desktop desktop-only-layout" ref={episodeListRef}>
            {/* Agora, o 'isLoading' apenas mostra o spinner, mas não remove a lista de episódios
                Isso só será visível ao trocar de temporada, não ao trocar de episódio.
            */}
            {isLoadingEpisodes && <div className='stream-loader'><div className='spinner'></div> <span>{status}</span></div>}
            
            {/* A lista de episódios só é renderizada se NÃO estivermos carregando E tivermos episódios */}
            {!isLoadingEpisodes && seasonEpisodes.map(ep => (<button key={ep.id} className={`episode-item-button focusable ${activeEpisode?.season === selectedSeason && activeEpisode?.episode === ep.episode_number ? 'active' : ''}`} onClick={() => handleEpisodeClick(selectedSeason!, ep.episode_number)}><div className="episode-item-number">{String(ep.episode_number).padStart(2, '0')}</div><div className="episode-item-thumbnail">{ep.still_path ? (<Image draggable="false" src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={`Cena de ${ep.name}`} width={160} height={90} />) : (<div className='thumbnail-placeholder-small'></div>)}</div><div className="episode-item-info"><span className="episode-item-title">{ep.name}</span><p className="episode-item-overview">{ep.overview}</p></div></button>))}
            
            {!isLoadingEpisodes && seasonEpisodes.length === 0 && <p className="text-center text-gray-500 py-4">Nenhum episódio encontrado para esta temporada.</p>}
        </div>
        <div className="mobile-only-layout">
          <div className="episode-grid-mobile">
              {isLoadingEpisodes && <div className='stream-loader'><div className='spinner'></div> <span>{status}</span></div>}
              {!isLoadingEpisodes && seasonEpisodes.map(ep => (
                <button key={ep.id} className={`episode-grid-button focusable ${activeEpisode?.season === selectedSeason && activeEpisode?.episode === ep.episode_number ? 'active' : ''}`} onClick={() => handleEpisodeClick(selectedSeason!, ep.episode_number)}>
                  {ep.episode_number}
                </button>
              ))}
              {!isLoadingEpisodes && seasonEpisodes.length === 0 && <p className="text-center text-gray-500 py-4">Nenhum episódio encontrado.</p>}
          </div>
        </div>
    </div>
  );

  const MovieSelector = () => (
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
          <div className="main-container desktop-only-layout">
            <div className="series-watch-grid">
              {/* Coluna 1: Player e Interações */}
              <div className="series-player-wrapper">
                <PlayerContent activeStreamUrl={activeStreamUrl} title={details.title} />
                <InteractionsSection />
                {type === 'movie' && <InfoBox />}
              </div>
              {/* Coluna 2: Seletor de Episódio/Filme, InfoBox (séries) e Comentários */}
              <div>
                {type === 'tv' ? <EpisodeSelector /> : <MovieSelector />}
                {type === 'tv' && <InfoBox />}
                {disqusConfig && (
                  <DisqusComments
                    key={disqusConfig.identifier}
                    url={disqusConfig.url}
                    identifier={disqusConfig.identifier}
                    title={disqusConfig.title}
                  />
                )}
              </div>
            </div>
          </div>
          {/* Layout Mobile */}
          <div className="mobile-only-layout">
            <PlayerContent activeStreamUrl={activeStreamUrl} title={details.title} />
          </div>
        </section>
        {/* Conteúdo Abaixo do Player no Mobile */}
        <div className="mobile-only-layout">
             <div className="main-container" style={{ marginTop: '1.5rem' }}>
                <InteractionsSection />
                {type === 'tv' && <EpisodeSelector />}
                 {disqusConfig && (
                  <DisqusComments
                    key={disqusConfig.identifier}
                    url={disqusConfig.url}
                    identifier={disqusConfig.identifier}
                    title={disqusConfig.title}
                  />
                )}
            </div>
        </div>
        {/* Detalhes, Elenco, etc. (Comum para Desktop e Mobile) */}
        <main className="details-main-content">
          <div className="main-container">
            <div className="details-grid">
              <div className="details-poster-container desktop-only-layout">
                  <div className="details-poster">
                    <Image draggable="false" src={details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : 'https://i.ibb.co/XzZ0b1B/placeholder.png'} alt={details.title} width={300} height={450} style={{ width: '100%', height: 'auto' }}/>
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
                    <div className="synopsis-box">
                        <h3>Sinopse</h3>
                        <p>{details.overview || 'Sinopse não disponível.'}</p>
                    </div>
                    <div className="genre-tags">{details.genres.map(genre => <span key={genre.id} className="genre-tag">{genre.name}</span>)}</div>
                </div>
              </div>
            </div>
            {details.credits?.cast && details.credits.cast.length > 0 && (
                <section className="cast-section">
                <h2>Elenco Principal</h2>
                <div className="cast-grid">
                    {details.credits?.cast.slice(0, 10).map(member => (<div key={member.id} className='cast-member'><div className='cast-member-img'>{member.profile_path ? (<Image draggable="false" src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} alt={member.name} width={150} height={225} style={{width: '100%', height: '100%', objectFit: 'cover'}} />) : <div className='thumbnail-placeholder person'></div>}</div><strong>{member.name}</strong><span>{member.character}</span></div>))}
                </div>
                </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}