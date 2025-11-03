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
  searchParams
}: {
  params: { type: string; slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const type = params.type as 'movie' | 'tv';
  const slug = params.slug as string;
  const id = getIdFromSlug(slug);

  const router = useRouter();
  const { user } = useAuth();
  const { saveHistory, getContinueWatchingItem } = useWatchHistory();
  const { theme } = useTheme(); // <-- BUSCA O TEMA ATUAL

  // --- Estados (Sem alteração) ---
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [firestoreMediaData, setFirestoreMediaData] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [status, setStatus] = useState('Carregando...');
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


  // --- useEffects (Todos os 7 permanecem iguais) ---
  // ... (Nenhuma alteração nos 7 useEffects) ...

  // 1. Buscar detalhes da mídia (TMDB + Firestore) - (Sem alteração)
   useEffect(() => {
      if (!id || !type) return;
      initialSetupDoneRef.current = false; 

      const fetchData = async () => {
      setIsLoadingDetails(true);
      setIsLoadingEpisodes(false);
      setDetails(null);
      setFirestoreMediaData(null);
      setSeasonEpisodes([]);
      setActiveEpisode(null);
      setSelectedSeason(null);
      setActiveStreamUrl('');
      setStatus('Carregando detalhes...');
      try {
          const detailsResponse = await axios.get(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,external_ids`);
          const tmdbData = detailsResponse.data;

          // Busca dados do Firestore (ainda necessário para links customizados/títulos)
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

          const finalTitle = firestoreData.title || tmdbData.title || tmdbData.name;

          setDetails({
              ...tmdbData,
              title: finalTitle, 
              release_date: tmdbData.release_date || tmdbData.first_air_date,
              imdb_id: tmdbData.external_ids?.imdb_id
          });

      } catch (error) {
          console.error("Erro ao buscar detalhes:", error);
          setStatus("Não foi possível carregar os detalhes.");
      } finally {
          setIsLoadingDetails(false);
      }
      };
      fetchData();
  }, [id, type, router]);

  // 2. Configuração inicial (Filme ou Série) - (Sem alteração)
   useEffect(() => {
      if (isLoadingDetails || !details || initialSetupDoneRef.current || !id) return;

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
      details, isLoadingDetails, id, type, user, saveHistory,
      getContinueWatchingItem,
      searchParams, firestoreMediaData
  ]);


  // 3. Buscar episódios da temporada (Séries) - (Sem alteração)
    useEffect(() => {
      if (type !== 'tv' || !id || !details?.seasons || selectedSeason === null || isLoadingDetails) {
          return;
      }

      const fetchSeasonData = async () => {
      setIsLoadingEpisodes(true);
      setStatus(`Carregando temporada ${selectedSeason}...`);
      try {
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

  }, [selectedSeason, id, type, details, isLoadingDetails, firestoreMediaData, activeEpisode]);


  // 4. Atualizar Player URL, Stats ID e Histórico (Séries) - (Sem alteração)
  useEffect(() => {
      if (isLoadingDetails || type !== 'tv' || !activeEpisode || !id || !details) return;

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

  }, [activeEpisode, seasonEpisodes, isLoadingEpisodes, id, type, details, user, saveHistory, isLoadingDetails, selectedSeason]);


  // 5. useEffect para Views e Stats (RTDB) - (Sem alteração)
  useEffect(() => {
    if (!currentStatsId) {
      setStats({ views: 0, likes: 0, dislikes: 0 });
      return;
    }

    const statsRef = ref(rtdb, `media_stats/${currentStatsId}`);

    // Incrementa a view (agora anônimo)
    rtdbRunTransaction(statsRef, (currentData) => {
      if (currentData) {
        currentData.views = (currentData.views || 0) + 1;
      } else {
        // Se não existe, cria com 1 view e 0 likes/dislikes
        currentData = { views: 1, likes: 0, dislikes: 0 };
      }
      return currentData;
    }).catch(error => console.error("Erro ao incrementar view no RTDB:", error));

    // Ouve atualizações nos stats (views, likes, dislikes)
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

    // Limpa o listener
    return () => off(statsRef, 'value', unsubscribeStats);

  }, [currentStatsId]); // Depende apenas do ID da mídia/episódio


  // 6. useEffect para buscar o estado de Like/Dislike do usuário (RTDB) - (Sem alteração)
  useEffect(() => {
    if (!user || !currentStatsId) {
      setLikeStatus(null); // Reseta se não logado ou sem ID
      return;
    }

    // Referência ao nó de interação do usuário no RTDB
    const interactionRef = ref(rtdb, `user_interactions/${user.uid}/${currentStatsId}`);

    const unsubscribeInteraction = onValue(interactionRef, (snapshot) => {
      const status = snapshot.val(); // O valor será 'liked', 'disliked', ou null
      setLikeStatus(status || null);
    }, (error) => {
      console.error("Erro ao buscar interação do usuário no RTDB:", error);
      setLikeStatus(null);
    });

    // Limpa o listener
    return () => off(interactionRef, 'value', unsubscribeInteraction);

  }, [user, currentStatsId]); // Depende do usuário e do ID da mídia/episódio

  // 7. useEffect para buscar filmes relacionados (sem alteração)
   useEffect(() => {
      if (type !== 'movie' || !id || !details || isLoadingDetails) {
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
    }, [id, type, details, isLoadingDetails]);


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
      
      const previousStatus = likeStatus; // Pega o estado ATUAL (antes do clique)
      let finalNewStatus: 'liked' | 'disliked' | null = newStatus;

      let likesIncrement = 0;
      let dislikesIncrement = 0;

      // Lógica de incremento/decremento
      if (newStatus === 'liked') {
          if (previousStatus === 'liked') { // Clicou em like de novo (remover)
              likesIncrement = -1;
              finalNewStatus = null;
          } else { // Adicionando like (novo ou mudando de dislike)
              likesIncrement = 1;
              if (previousStatus === 'disliked') {
                  dislikesIncrement = -1; // Remove o dislike anterior
              }
          }
      } else if (newStatus === 'disliked') {
          if (previousStatus === 'disliked') { // Clicou em dislike de novo (remover)
              dislikesIncrement = -1;
              finalNewStatus = null;
          } else { // Adicionando dislike (novo ou mudando de like)
              dislikesIncrement = 1;
              if (previousStatus === 'liked') {
                  likesIncrement = -1; // Remove o like anterior
              }
          }
      }
      
      // Cria um objeto de atualização multi-path
      const updates: { [key: string]: any } = {};
      
      // 1. Atualiza a interação do usuário
      //    (Escrever 'null' no RTDB exclui o dado)
      updates[`user_interactions/${user.uid}/${currentStatsId}`] = finalNewStatus;
      
      // 2. Atualiza os contadores de stats
      updates[`media_stats/${currentStatsId}/likes`] = rtdbIncrement(likesIncrement);
      updates[`media_stats/${currentStatsId}/dislikes`] = rtdbIncrement(dislikesIncrement);

      try {
          // Executa a atualização atômica
          await rtdbUpdate(ref(rtdb), updates);
      } catch (error) {
          console.error("Erro na atualização multi-path de like/dislike:", error);
          alert("Ocorreu um erro ao registrar sua avaliação.");
          // O listener 'onValue' deve corrigir a UI automaticamente
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

  // --- Renderização condicional de loading (Sem alteração) ---
  if (isLoadingDetails) {
    return (<div className="loading-container"><Image src="https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png" alt="Carregando..." width={120} height={120} className="loading-logo" priority style={{ objectFit: 'contain' }} /></div>);
  }
  if (!details) {
    return (<div className="loading-container"><p>{status}</p></div>);
  }

  // --- Componentes Internos ---
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

  // ### ATUALIZADO ###
  // O componente InteractionsSection agora renderiza o IFRAME
  const InteractionsSection = () => {
      const currentSynopsis = getSynopsis();
      const releaseYear = (details?.release_date || details?.first_air_date)?.substring(0, 4);
      const pageTitle = getEpisodeTitle();

      return (
        <div className="details-interactions-section">
          <h2 className="episode-title">{pageTitle}</h2>

          {/* Barra de Ações (Likes/Dislikes) - (Sem alteração) */}
          <div className="media-actions-bar">
             <div className="like-dislike-group">
                <button
                  className={`action-btn focusable ${likeStatus === 'liked' ? 'active' : ''}`}
                  onClick={() => handleLikeDislike('liked')} 
                  aria-label="Gostei"
                  disabled={isUpdatingLike} 
                >
                  <LikeIcon isActive={likeStatus === 'liked'} />
                  <span>{formatNumber(stats.likes)}</span>
                </button>
                <button
                  className={`action-btn focusable ${likeStatus === 'disliked' ? 'active' : ''}`}
                  onClick={() => handleLikeDislike('disliked')} 
                  aria-label="Não gostei"
                  disabled={isUpdatingLike} 
                >
                  <DislikeIcon isActive={likeStatus === 'disliked'} />
                  <span>{formatNumber(stats.dislikes)}</span>
                </button>
             </div>
             <button className="action-btn focusable" onClick={handleShare} aria-label="Compartilhar">
               <ShareIcon />
               <span>Compartilhar</span>
             </button>
             <div className="mobile-only-layout" style={{ backgroundColor: 'transparent', paddingLeft: 0, marginLeft: 'auto' }}>
                 <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '500' }}>
                   {formatNumber(stats.views)} Views
                 </span>
             </div>
          </div>

          {/* Caixa de Descrição (Sem alteração) */}
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
                     className="description-toggle-btn focusable"
                 >
                     ...mais
                 </button>
             )}
             {isDescriptionExpanded && (
                  <button
                     onClick={(e) => { e.stopPropagation(); setIsDescriptionExpanded(false); }}
                     className="description-toggle-btn focusable"
                  >
                     Mostrar menos
                  </button>
             )}
          </div>

          {/* ### SUBSTITUÍDO ###
            O 'currentStatsId' (ID do filme/episódio) é usado como 'pageId'
            para o nosso sistema de comentários no iframe.
            Também passamos o 'theme' atual para o iframe.
          */}
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

  // --- EpisodeSelector (Sem alteração) ---
  const EpisodeSelector = () => {
     return (
          <div className="episodes-list-wrapper">
              <div className="episodes-header">
                  <select
                      className="season-selector focusable"
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
                          className={`episode-item-button focusable ${activeEpisode?.season === selectedSeason && activeEpisode?.episode === ep.episode_number ? 'active' : ''}`}
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
                        className={`episode-grid-button focusable ${activeEpisode?.season === selectedSeason && activeEpisode?.episode === ep.episode_number ? 'active' : ''}`}
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

  // --- MovieSelector (Sem alteração) ---
  const MovieSelector = () => {
     return (
        <div className="episodes-list-wrapper desktop-only-layout">
            <div className="episode-item-button active focusable movie-info-card" style={{ cursor: 'default' }}>
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

  // --- RelatedMoviesSection (Sem alteração) ---
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
                  className="related-movie-item focusable"
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

  // --- Renderização Principal (Sem alteração) ---
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
                {type === 'movie' && <RelatedMoviesSection />}
              </div>
            </div>
          </div>
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
                                    <Image draggable="false" src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} alt={member.name} width={150} height={225} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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

