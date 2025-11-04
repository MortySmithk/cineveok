// app/media/[type]/[slug]/MediaPageClient.tsx
"use client";

import { useState, useEffect, memo, useRef } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// --- Importações do Firestore (AINDA NECESSÁRIAS) ---
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/components/firebase'; // Firestore db
// --- Fim das importações do Firestore ---

// --- NOVAS Importações do Realtime Database ---
import { rtdb } from '@/app/components/firebase'; // Realtime Database rtdb
import { 
  ref, 
  runTransaction as rtdbRunTransaction, 
  onValue, 
  off, 
  increment as rtdbIncrement, 
  update as rtdbUpdate 
} from 'firebase/database';
// --- Fim das importações do RTDB ---

import { useAuth } from '@/app/components/AuthProvider';
import { useWatchHistory } from '@/app/hooks/useWatchHistory';
import AudioVisualizer from '@/app/components/AudioVisualizer';
import PlayIcon from '@/app/components/icons/PlayIcon';
import StarIcon from '@/app/components/icons/StarIcon';
import ClockIcon from '@/app/components/icons/ClockIcon';
import LikeIcon from '@/app/components/icons/LikeIcon';
import DislikeIcon from '@/app/components/icons/DislikeIcon';
import ShareIcon from '@/app/components/icons/ShareIcon';
import { generateSlug } from '@/app/lib/utils';
// --- REMOVIDO HyvorTalkComments ---
// import HyvorTalkComments from '@/app/components/HyvorTalkComments'; 
import { useTheme } from '@/app/components/ThemeProvider'; // <-- IMPORTADO O TEMA

// --- Interfaces (Sem alteração) ---
interface Genre { id: number; name: string; }
interface Season { id: number; name: string; season_number: number; episode_count: number; }
interface Episode {
  id: number; name: string; episode_number: number;
  overview: string; still_path: string;
  streamUrl?: string | null;
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
  external_ids?: { imdb_id?: string };
  number_of_seasons?: number;
  seasons?: Season[];
}
interface Media {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
}

const API_KEY = "860b66ade580bacae581f4228fad49fc";

// --- Funções getIdFromSlug e formatNumber (Sem alteração) ---
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

// --- Componente PlayerContent (Sem alteração) ---
const PlayerContent = memo(function PlayerContent({ activeStreamUrl, title }: { activeStreamUrl: string, title: string }) {
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
          <span>{title === 'Filme' ? 'Carregando filme...' : 'Selecione um episódio para assistir.'}</span>
        </div>
      )}
    </div>
  );
});

export default function MediaPageClient({
  params,
  searchParams,
  initialData // <-- 1. RECEBE OS DADOS
}: {
  params: { type: string; slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
  initialData: MediaDetails | null; // <-- 2. TIPA OS DADOS
}) {
  const type = params.type as 'movie' | 'tv';
  const slug = params.slug as string;
  const id = getIdFromSlug(slug);

  const router = useRouter();
  const { user } = useAuth();
  const { saveHistory, getContinueWatchingItem } = useWatchHistory();
  const { theme } = useTheme(); // <-- BUSCA O TEMA ATUAL

  // --- 3. Inicia o estado com os dados recebidos do servidor ---
  const [details, setDetails] = useState<MediaDetails | null>(initialData);
  const [firestoreMediaData, setFirestoreMediaData] = useState<any>(null);
  
  // --- 4. Remove isLoadingDetails e ajusta o status inicial ---
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [status, setStatus] = useState(initialData ? '' : 'Conteúdo não encontrado.');
  
  // --- Outros estados (Sem alteração) ---
  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<{ season: number, episode: number } | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');
  const [currentStatsId, setCurrentStatsId] = useState<string | null>(null);
  const initialSetupDoneRef = useRef(false);
  const [stats, setStats] = useState({ views: 0, likes: 0, dislikes: 0 });
  const [likeStatus, setLikeStatus] = useState<'liked' | 'disliked' | null>(null);
  const [isUpdatingLike, setIsUpdatingLike] = useState(false);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [relatedMovies, setRelatedMovies] = useState<Media[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);


  // --- 5. useEffect 1 (REMOVIDA a busca principal, MANTIDA a busca do Firestore) ---
   useEffect(() => {
      if (!id || !type) return;

      // Se os dados não vieram do servidor, define o erro
      if (!initialData) {
          setStatus("Conteúdo não encontrado.");
          return;
      }
      
      initialSetupDoneRef.current = false; 

      // Mantém a busca do Firestore para dados customizados (título, isHidden)
      const fetchFirestoreData = async () => {
        try {
          const firestoreDocRef = doc(db, "media", id);
          const firestoreDocSnap = await getDoc(firestoreDocRef);
          const firestoreData = firestoreDocSnap.exists() ? firestoreDocSnap.data() : {};
          
          if (firestoreData.isHidden === true) {
              console.warn("Este conteúdo está oculto e não pode ser exibido.");
              setStatus("Conteúdo não encontrado.");
              router.push('/'); 
              return; 
          }
          
          setFirestoreMediaData(firestoreData);

          // Atualiza o título se o Firestore tiver um customizado
          if (firestoreData.title && initialData.title !== firestoreData.title) {
            setDetails(prevDetails => prevDetails ? ({
                ...prevDetails,
                title: firestoreData.title
            }) : null);
          }
        } catch (error) {
            console.error("Erro ao buscar dados do Firestore:", error);
        }
      };
      
      fetchFirestoreData();

  }, [id, type, initialData, router]); // <-- 6. Depende de initialData

  // 7. useEffect 2 (Configuração inicial - REMOVIDO isLoadingDetails)
   useEffect(() => {
      // Remove 'isLoadingDetails' da condição
      if (!details || initialSetupDoneRef.current || !id) return;

      if (type === 'movie') {
            if (id) {
                const movieUrl = `https://www.primevicio.lat/embed/movie/${id}`;
                setActiveStreamUrl(movieUrl);
            } else {
                 setActiveStreamUrl('');
                 console.warn("Nenhuma URL encontrada no Firestore para este filme.");
            }

          if (user) {
              saveHistory({ mediaType: 'movie', tmdbId: id, title: details.title, poster_path: details.poster_path });
          }
          setCurrentStatsId(id); 
          initialSetupDoneRef.current = true; 

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
          initialSetupDoneRef.current = true; 
      }
  }, [
      details, // <-- 'isLoadingDetails' removido daqui
      id, type, user, saveHistory,
      getContinueWatchingItem,
      searchParams, firestoreMediaData
  ]);


  // 3. useEffect para Buscar episódios da temporada (Séries) - (Sem alteração)
    useEffect(() => {
      // 'isLoadingDetails' removido da condição
      if (type !== 'tv' || !id || !details?.seasons || selectedSeason === null) {
          return;
      }

      const fetchSeasonData = async () => {
      setIsLoadingEpisodes(true);
      setStatus(`Carregando temporada ${selectedSeason}...`);
      try {
          // A busca de episódios continua usando axios
          const seasonResponse = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}?api_key=${API_KEY}&language=pt-BR`);
          const tmdbEpisodesData: Episode[] = seasonResponse.data.episodes;

          const firestoreSeasonData = firestoreMediaData?.seasons?.[selectedSeason];

          const episodesData: Episode[] = tmdbEpisodesData.map((tmdbEp) => {
              const firestoreEp = firestoreSeasonData?.episodes?.find((fe: any) => fe.episode_number === tmdbEp.episode_number);
              return {
                  ...tmdbEp,
                  name: firestoreEp?.name || tmdbEp.name, 
              };
          });

          setSeasonEpisodes(episodesData);

          const isCurrentActiveEpisodeValid = activeEpisode && activeEpisode.season === selectedSeason && episodesData.some(ep => ep.episode_number === activeEpisode.episode);

          if (!isCurrentActiveEpisodeValid && episodesData.length > 0) {
              setActiveEpisode({ season: selectedSeason, episode: episodesData[0].episode_number });
          } else if (episodesData.length === 0) {
              setActiveEpisode(null);
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

  }, [selectedSeason, id, type, details, firestoreMediaData, activeEpisode]); // 'isLoadingDetails' removido


  // 4. useEffect para Atualizar Player URL, Stats ID e Histórico (Séries) - (Sem alteração)
  useEffect(() => {
      // 'isLoadingDetails' removido da condição
      if (type !== 'tv' || !activeEpisode || !id || !details) return;

      const { season, episode } = activeEpisode;
      const episodeData = seasonEpisodes.find(ep => ep.episode_number === episode);

      if (episodeData) {
          const episodeUrl = `https://www.primevicio.lat/embed/tv/${id}/${season}/${episode}`;
          setActiveStreamUrl(episodeUrl);

          const statsId = episodeData.id.toString(); 
          setCurrentStatsId(statsId);

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
          if(selectedSeason) {
              setActiveEpisode({ season: selectedSeason, episode: seasonEpisodes[0].episode_number });
          }
      } else if (seasonEpisodes.length === 0 && !isLoadingEpisodes) {
          setActiveStreamUrl('');
          setCurrentStatsId(null);
      }

  }, [activeEpisode, seasonEpisodes, isLoadingEpisodes, id, type, details, user, saveHistory, selectedSeason]); // 'isLoadingDetails' removido


  // 5. useEffect para Views e Stats (RTDB) - (Sem alteração)
  useEffect(() => {
    if (!currentStatsId) {
      setStats({ views: 0, likes: 0, dislikes: 0 });
      return;
    }

    const statsRef = ref(rtdb, `media_stats/${currentStatsId}`);

    rtdbRunTransaction(statsRef, (currentData) => {
      if (currentData) {
        currentData.views = (currentData.views || 0) + 1;
      } else {
        currentData = { views: 1, likes: 0, dislikes: 0 };
      }
      return currentData;
    }).catch(error => console.error("Erro ao incrementar view no RTDB:", error));

    const unsubscribeStats = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      setStats({
        views: data?.views || 0,
        likes: data?.likes || 0,
        dislikes: data?.dislikes || 0
      });
    }, (error) => {
      console.error("Erro ao ouvir stats do RTDB:", error);
      setStats({ views: 0, likes: 0, dislikes: 0 });
    });

    return () => off(statsRef, 'value', unsubscribeStats);

  }, [currentStatsId]); 


  // 6. useEffect para buscar o estado de Like/Dislike do usuário (RTDB) - (Sem alteração)
  useEffect(() => {
    if (!user || !currentStatsId) {
      setLikeStatus(null); 
      return;
    }

    const interactionRef = ref(rtdb, `user_interactions/${user.uid}/${currentStatsId}`);

    const unsubscribeInteraction = onValue(interactionRef, (snapshot) => {
      const status = snapshot.val(); 
      setLikeStatus(status || null);
    }, (error) => {
      console.error("Erro ao buscar interação do usuário no RTDB:", error);
      setLikeStatus(null);
    });

    return () => off(interactionRef, 'value', unsubscribeInteraction);

  }, [user, currentStatsId]); 

  // 7. useEffect para buscar filmes relacionados (sem alteração)
   useEffect(() => {
      // 'isLoadingDetails' removido da condição
      if (type !== 'movie' || !id || !details) {
        setRelatedMovies([]);
        return;
      }
      const fetchRelated = async () => {
        setIsLoadingRelated(true);
        try {
          const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}/recommendations?api_key=${API_KEY}&language=pt-BR&page=1`);
          const validRelated = response.data.results
            .filter((item: Media) => item.poster_path && (item.title || item.name)) 
            .slice(0, 10); 
          setRelatedMovies(validRelated.map((item: any) => ({ ...item, media_type: 'movie' }))); 
        } catch (error) {
          console.error("Erro ao buscar filmes relacionados:", error);
          setRelatedMovies([]);
        } finally {
          setIsLoadingRelated(false);
        }
      };
      fetchRelated();
    }, [id, type, details]); // 'isLoadingDetails' removido


  // --- Funções de manipulação (handleEpisodeClick, handleSeasonChange - Sem alteração) ---
  const handleEpisodeClick = (season: number, episodeNumber: number) => {
    if (isLoadingEpisodes) return;
    setActiveEpisode({ season, episode: episodeNumber });
  };

  const handleSeasonChange = (newSeason: number) => {
    if (selectedSeason === newSeason || isLoadingEpisodes) return;
    setSelectedSeason(newSeason);
    setActiveEpisode(null);
  };

  // --- Função para lidar com Likes/Dislikes (RTDB) - (Sem alteração) ---
  const handleLikeDislike = async (newStatus: 'liked' | 'disliked') => {
      if (!user || !currentStatsId || isUpdatingLike) {
          if (!user) router.push('/login?redirect=' + window.location.pathname + window.location.search);
          return;
      }

      setIsUpdatingLike(true);
      
      const previousStatus = likeStatus; 
      let finalNewStatus: 'liked' | 'disliked' | null = newStatus;

      let likesIncrement = 0;
      let dislikesIncrement = 0;

      if (newStatus === 'liked') {
          if (previousStatus === 'liked') { 
              likesIncrement = -1;
              finalNewStatus = null;
          } else { 
              likesIncrement = 1;
              if (previousStatus === 'disliked') {
                  dislikesIncrement = -1; 
              }
          }
      } else if (newStatus === 'disliked') {
          if (previousStatus === 'disliked') { 
              dislikesIncrement = -1;
              finalNewStatus = null;
          } else { 
              dislikesIncrement = 1;
              if (previousStatus === 'liked') {
                  likesIncrement = -1; 
              }
          }
      }
      
      const updates: { [key: string]: any } = {};
      updates[`user_interactions/${user.uid}/${currentStatsId}`] = finalNewStatus;
      updates[`media_stats/${currentStatsId}/likes`] = rtdbIncrement(likesIncrement);
      updates[`media_stats/${currentStatsId}/dislikes`] = rtdbIncrement(dislikesIncrement);

      try {
          await rtdbUpdate(ref(rtdb), updates);
      } catch (error) {
          console.error("Erro na atualização multi-path de like/dislike:", error);
          alert("Ocorreu um erro ao registrar sua avaliação.");
      } finally {
          setIsUpdatingLike(false);
      }
  };
  // --- Fim da função handleLikeDislike ---

  // --- getSynopsis, getEpisodeTitle, handleShare (Sem alteração) ---
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
      return currentEpisodeData && activeEpisode
            ? `${currentEpisodeData.name} - T${activeEpisode.season} E${activeEpisode.episode}`
            : details.title || 'Série';
  };
  const handleShare = () => {
     if (navigator.share) {
      navigator.share({
        title: details?.title || 'CineVEO',
        text: `Assista ${details?.title || 'este conteúdo'} no CineVEO!`,
        url: window.location.href,
      })
      .then(() => console.log('Compartilhado com sucesso'))
      .catch((error) => console.error('Erro ao compartilhar:', error));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copiado para a área de transferência!'))
        .catch(() => alert('Não foi possível copiar o link.'));
    }
  };

  // --- Renderização condicional de loading (MODIFICADA) ---
  // 8. MODIFICA a renderização de loading
  if (!details) {
    // Não há mais 'isLoadingDetails', apenas checa se 'details' é nulo
    return (<div className="loading-container"><p>{status}</p></div>);
  }

  // --- Componentes Internos (InfoBoxMobile, InteractionsSection, etc. - Sem alteração) ---
  const InfoBoxMobile = () => {
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
          </div>
        );
  };

  const InteractionsSection = () => {
      const currentSynopsis = getSynopsis();
      const releaseYear = (details?.release_date || details?.first_air_date)?.substring(0, 4);
      const pageTitle = getEpisodeTitle();

      return (
        <div className="details-interactions-section">
          <h2 className="episode-title">{pageTitle}</h2>

          <div className="media-actions-bar">
             <div className="like-dislike-group">
                <button
                  className={`action-btn ${likeStatus === 'liked' ? 'active' : ''}`}
                  onClick={() => handleLikeDislike('liked')} 
                  aria-label="Gostei"
                  disabled={isUpdatingLike} 
                >
                  <LikeIcon isActive={likeStatus === 'liked'} />
                  <span>{formatNumber(stats.likes)}</span>
                </button>
                <button
                  className={`action-btn ${likeStatus === 'disliked' ? 'active' : ''}`}
                  onClick={() => handleLikeDislike('disliked')} 
                  aria-label="Não gostei"
                  disabled={isUpdatingLike} 
                >
                  <DislikeIcon isActive={likeStatus === 'disliked'} />
                  <span>{formatNumber(stats.dislikes)}</span>
                </button>
             </div>
             <button className="action-btn" onClick={handleShare} aria-label="Compartilhar">
               <ShareIcon />
               <span>Compartilhar</span>
             </button>
             <div className="mobile-only-layout" style={{ backgroundColor: 'transparent', paddingLeft: 0, marginLeft: 'auto' }}>
                 <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '500' }}>
                   {formatNumber(stats.views)} Views
                 </span>
             </div>
          </div>

          <div className={`description-box ${isDescriptionExpanded ? 'expanded' : ''}`} onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
             <div className="description-header">
                 <strong>{formatNumber(stats.views)} visualizações</strong>
                 {releaseYear && <span>{releaseYear}</span>}
             </div>
             <div className="description-content">
                 <p>{currentSynopsis}</p>
             </div>
             {(currentSynopsis || '').length > 150 && !isDescriptionExpanded && (
                 <button
                     onClick={(e) => { e.stopPropagation(); setIsDescriptionExpanded(true); }}
                     className="description-toggle-btn"
                 >
                     ...mais
                 </button>
             )}
             {isDescriptionExpanded && (
                  <button
                     onClick={(e) => { e.stopPropagation(); setIsDescriptionExpanded(false); }}
                     className="description-toggle-btn"
                  >
                     Mostrar menos
                  </button>
             )}
          </div>

          {/* Iframe de Comentários */}
          {currentStatsId ? (
            <iframe
              key={currentStatsId + theme} // Recarrega o iframe se o ID ou o TEMA mudarem
              src={`/comments.html?pageId=${currentStatsId}&theme=${theme}`}
              width="100%"
              height="800" // Altura padrão
              frameBorder="0"
              style={{ 
                border: 'none', 
                minHeight: '800px', 
                borderRadius: '8px', 
                marginTop: '1.5rem',
                overflow: 'hidden' 
              }}
              title="Seção de Comentários"
              loading="lazy"
            ></iframe>
          ) : (
            <div className="comments-container" style={{ padding: '1rem', textAlign: 'center' }}>
              Carregando comentários...
            </div>
          )}
          
        </div>
      );
  };

  const EpisodeSelector = () => {
     return (
          <div className="episodes-list-wrapper">
              <div className="episodes-header">
                  <select
                      className="season-selector"
                      value={selectedSeason ?? ''}
                      onChange={(e) => handleSeasonChange(Number(e.target.value))}
                      disabled={isLoadingEpisodes} 
                  >
                      {details.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0).map(s => (
                          <option key={s.id} value={s.season_number}>{s.name}</option>
                      ))}
                  </select>
                  {!isLoadingEpisodes && <p className='episode-count-info'>({seasonEpisodes.length} Eps)</p>}
              </div>
              <div className="episode-list-desktop desktop-only-layout">
                  {isLoadingEpisodes && <div className='stream-loader'><div className='spinner'></div> <span>{status}</span></div>}
                  {!isLoadingEpisodes && seasonEpisodes.map(ep => (
                      <button
                          key={ep.id}
                          className={`episode-item-button ${activeEpisode?.season === selectedSeason && activeEpisode?.episode === ep.episode_number ? 'active' : ''}`}
                          onClick={() => handleEpisodeClick(selectedSeason!, ep.episode_number)}
                      >
                          <div className="episode-item-number">{String(ep.episode_number).padStart(2, '0')}</div>
                          <div className="episode-item-thumbnail">
                              {ep.still_path ? (
                                  <Image draggable="false" src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={`Cena de ${ep.name}`} width={160} height={90} />
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
                  {!isLoadingEpisodes && seasonEpisodes.length === 0 && <p className="text-center text-gray-500 py-4">Nenhum episódio encontrado para esta temporada.</p>}
              </div>
              <div className="mobile-only-layout">
                <div className="episode-grid-mobile">
                    {isLoadingEpisodes && <div className='stream-loader'><div className='spinner'></div> <span>{status}</span></div>}
                    {!isLoadingEpisodes && seasonEpisodes.map(ep => (
                      <button
                        key={ep.id}
                        className={`episode-grid-button ${activeEpisode?.season === selectedSeason && activeEpisode?.episode === ep.episode_number ? 'active' : ''}`}
                        onClick={() => handleEpisodeClick(selectedSeason!, ep.episode_number)}>
                        {ep.episode_number}
                      </button>
                    ))}
                    {!isLoadingEpisodes && seasonEpisodes.length === 0 && <p className="text-center text-gray-500 py-4">Nenhum episódio encontrado.</p>}
                </div>
              </div>
          </div>
        );
  };

  const MovieSelector = () => {
     return (
        <div className="episodes-list-wrapper desktop-only-layout">
            <div className="episode-item-button active movie-info-card" style={{ cursor: 'default' }}>
                <div className="episode-item-thumbnail">
                    <Image
                      draggable="false"
                      src={details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : 'https://i.ibb.co/XzZ0b1B/placeholder.png'}
                      alt={`Poster de ${details.title}`}
                      width={120} height={180}
                      style={{ objectFit: 'cover', width: '100%', height: 'auto', aspectRatio: '2/3' }}
                    />
                </div>
                <div className="episode-item-info">
                    <span className="episode-item-title">{details.title}</span>
                    <p className="episode-item-overview">Filme Completo</p>
                </div>
                <div className="visualizer-container">
                    <AudioVisualizer />
                </div>
            </div>
        </div>
      );
  };

  const RelatedMoviesSection = () => {
      if (type !== 'movie' || relatedMovies.length === 0) return null;

      return (
        <section className="related-movies-section">
          <h2 className="section-title">Filmes Relacionados</h2>
          {isLoadingRelated ? (
            <div className="loading-container" style={{ minHeight: '150px', justifyContent: 'flex-start', alignItems: 'flex-start', paddingTop: '1rem' }}>
              <div className='spinner'></div>
            </div>
          ) : (
            <div className="related-movies-list">
              {relatedMovies.map((item) => (
                <Link
                  draggable="false"
                  href={`/media/movie/${generateSlug(item.title || item.name || '')}-${item.id}`}
                  key={item.id}
                  className="related-movie-item"
                >
                  <div className="related-thumbnail-wrapper">
                    <Image
                      draggable="false"
                      src={item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://i.ibb.co/XzZ0b1B/placeholder.png'}
                      alt={item.title || item.name || ''}
                      fill
                      className="related-thumbnail-image"
                      sizes="160px"
                    />
                    <div className="related-play-overlay"><PlayIcon width={24} height={24}/></div>
                  </div>
                  <div className="related-info-wrapper">
                    <h3 className="related-movie-title">{item.title || item.name}</h3>
                    <div className="related-movie-meta">
                      <span>{(item.release_date)?.substring(0, 4)}</span>
                      {item.vote_average > 0 && <span><StarIcon width={12} height={12}/> {item.vote_average.toFixed(1)}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      );
  };

  // --- Renderização Principal (REVERTIDA PARA A ESTRUTURA ORIGINAL) ---
  return (
    <>
      <div className="media-page-layout">
        <section className="series-watch-section">
          
          {/* === ÁREA DESKTOP (Layout Original Lado-a-Lado) === */}
          <div className="main-container desktop-only-layout">
            <div className="series-watch-grid">
              
              {/* Coluna 1: Player e Interações */}
              <div className="series-player-wrapper">
                <PlayerContent activeStreamUrl={activeStreamUrl} title={details.title} />
                <InteractionsSection />
              </div>

              {/* Coluna 2: Sidebar (Episódios/Filme/Relacionados) */}
              <div>
                {type === 'tv' ? <EpisodeSelector /> : <MovieSelector />}
                {type === 'movie' && <RelatedMoviesSection />}
              </div>

            </div>
          </div>
          
          {/* === ÁREA MOBILE (Inalterada) === */}
          <div className="mobile-only-layout">
            <PlayerContent activeStreamUrl={activeStreamUrl} title={details.title} />
          </div>
        </section>

        <div className="mobile-only-layout">
             <div className="main-container" style={{ marginTop: '1.5rem' }}>
                <InfoBoxMobile />
                <InteractionsSection />
                {type === 'tv' && <EpisodeSelector />}
                {type === 'movie' && <RelatedMoviesSection />}
            </div>
        </div>

        <main className="details-main-content">
          <div className="main-container">
             {details.credits?.cast && details.credits.cast.length > 0 && (
                <section className="cast-section">
                <h2>Elenco Principal</h2>
                <div className="cast-grid">
                    {details.credits?.cast.slice(0, 10).map(member => (
                        <div key={member.id} className='cast-member'>
                            <div className='cast-member-img'>
                                {member.profile_path ? (
                                    <Image 
                                      draggable="false" 
                                      src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} 
                                      alt={member.name} 
                                      width={185}  /* <-- MUDANÇA (era 150) */
                                      height={185} /* <-- MUDANÇA (era 225) */
                                      sizes="(max-width: 600px) 25vw, 150px" /* <-- OTIMIZAÇÃO (adicionado) */
                                      /* A prop 'style' foi removida */
                                    />
                                ) : <div className='thumbnail-placeholder person'></div>}
                            </div>
                            <strong>{member.name}</strong>
                            <span>{member.character}</span>
                        </div>
                    ))}
                </div>
                </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}