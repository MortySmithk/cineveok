// cineveo-next/app/media/[type]/[slug]/MediaPageClient.tsx
"use client";

import { useState, useEffect, memo, useRef } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
// --- Importação Adicional ---
import { useRouter } from 'next/navigation'; // <-- ADICIONADO: Importa o useRouter
// --- Fim da Importação Adicional ---
// --- Importações do Firestore ---
import { doc, runTransaction, onSnapshot, increment, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/components/firebase';
// --- Fim das importações do Firestore ---
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
// --- Importar componente de comentários do Firebase ---
import FirebaseComments from '@/app/components/FirebaseComments';
// --- Fim da importação ---

// --- Interfaces ---
interface Genre { id: number; name: string; }
interface Season { id: number; name: string; season_number: number; episode_count: number; }
interface Episode {
  id: number; name: string; episode_number: number;
  overview: string; still_path: string;
  // **********************************************
  // *** CORREÇÃO: ADICIONANDO streamUrl AQUI ***
  // **********************************************
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

// ... (Funções getIdFromSlug e formatNumber permanecem as mesmas) ...
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

// ... (Componente PlayerContent permanece o mesmo) ...
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
          referrerPolicy="origin" // Modificado para origin
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

  const router = useRouter(); // <-- ADICIONADO: Inicialização do useRouter
  const { user } = useAuth();
  const { saveHistory, getContinueWatchingItem } = useWatchHistory();

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [firestoreMediaData, setFirestoreMediaData] = useState<any>(null); // Dados específicos do Firestore (título editado, links)
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [status, setStatus] = useState('Carregando...');
  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<{ season: number, episode: number } | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');
  const [currentStatsId, setCurrentStatsId] = useState<string | null>(null); // ID para views, likes, comments (pode ser TMDB ID ou Episode ID)
  const initialSetupDoneRef = useRef(false);

  // --- Estados para Views, Likes, Dislikes ---
  const [stats, setStats] = useState({ views: 0, likes: 0, dislikes: 0 }); // Estado unificado
  const [likeStatus, setLikeStatus] = useState<'liked' | 'disliked' | null>(null); // Estado da interação do usuário
  const [isUpdatingLike, setIsUpdatingLike] = useState(false); // Para desabilitar botões durante a atualização
  // --- Fim dos estados ---

  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [relatedMovies, setRelatedMovies] = useState<Media[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  // ***************************************************************
  // *** MUDANÇA #1: REMOVIDA A CONSTANTE embedBaseUrl (não estava sendo usada) ***
  // ***************************************************************

  // --- useEffects ---
  // 1. Buscar detalhes da mídia (TMDB + Firestore) - Sem alterações significativas
   useEffect(() => {
      if (!id || !type) return;
      initialSetupDoneRef.current = false; // Resetar flag

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

          // Buscar dados do Firestore para este ID
          const firestoreDocRef = doc(db, "media", id);
          const firestoreDocSnap = await getDoc(firestoreDocRef);
          const firestoreData = firestoreDocSnap.exists() ? firestoreDocSnap.data() : {};
          
          // ***************************************************************
          // *** NOVO: VERIFICAÇÃO DE CONTEÚDO OCULTO ***
          // ***************************************************************
          if (firestoreData.isHidden === true) {
              console.warn("Este conteúdo está oculto e não pode ser exibido.");
              setStatus("Conteúdo não encontrado.");
              router.push('/'); // Redireciona para a página inicial
              return; // Interrompe a execução
          }
          // ***************************************************************
          
          setFirestoreMediaData(firestoreData); // Guarda os dados do Firestore

          // Usa o título do Firestore se existir, senão usa o do TMDB
          const finalTitle = firestoreData.title || tmdbData.title || tmdbData.name;

          setDetails({
              ...tmdbData,
              title: finalTitle, // <-- Título finalizado
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
  }, [id, type, router]); // <-- ADICIONADO 'router' às dependências

  // 2. Configuração inicial (Filme ou Série) - Lógica do Firestore para filme adicionada
   useEffect(() => {
      if (isLoadingDetails || !details || initialSetupDoneRef.current || !id) return;

      if (type === 'movie') {
            // ***************************************************************
            // *** MUDANÇA #2: Lógica de URL para FILME alterada para PrimeVicio ***
            // ***************************************************************
            if (id) {
                const movieUrl = `https://www.primevicio.lat/embed/movie/${id}`;
                setActiveStreamUrl(movieUrl);
            } else {
                 setActiveStreamUrl(''); // Ou define um placeholder/mensagem de erro
                 console.warn("Nenhuma URL encontrada no Firestore para este filme.");
            }
            // --- FIM DA LÓGICA MODIFICADA ---

          if (user) {
              saveHistory({ mediaType: 'movie', tmdbId: id, title: details.title, poster_path: details.poster_path });
          }
          setCurrentStatsId(id); // ID para stats/comments do filme é o próprio TMDB ID
          initialSetupDoneRef.current = true; // Marca como concluído

      } else if (type === 'tv') {
          // Lógica para séries permanece a mesma (pegar episódio do query param ou histórico)
          const seasonFromQuery = searchParams?.season ? Number(searchParams.season) : null;
          const episodeFromQuery = searchParams?.episode ? Number(searchParams.episode) : null;

          let initialSeason = 1;
          let initialEpisode = 1;

          // Tenta pegar do query param primeiro
          if (seasonFromQuery && episodeFromQuery) {
              initialSeason = seasonFromQuery;
              initialEpisode = episodeFromQuery;
          } else {
              // Senão, tenta pegar do histórico "Continuar Assistindo"
              const progress = getContinueWatchingItem(id);
              if (progress?.progress) {
                  initialSeason = progress.progress.season;
                  initialEpisode = progress.progress.episode;
              }
          }

          // Define a temporada inicial e o episódio ativo inicial
          setSelectedSeason(initialSeason);
          setActiveEpisode({ season: initialSeason, episode: initialEpisode });
          initialSetupDoneRef.current = true; // Marca como concluído
      }
  }, [
      details, isLoadingDetails, id, type, user, saveHistory,
      getContinueWatchingItem,
      searchParams, firestoreMediaData
  ]);


  // 3. Buscar episódios da temporada (Séries) - Lógica do Firestore adicionada
    useEffect(() => {
      // ***************************************************************
      // *** MUDANÇA #3: Removido !firestoreMediaData da verificação ***
      // Esta verificação impedia o carregamento de episódios se o documento
      // de mídia não existisse no Firestore.
      // ***************************************************************
      if (type !== 'tv' || !id || !details?.seasons || selectedSeason === null || isLoadingDetails) {
          return;
      }

      const fetchSeasonData = async () => {
      setIsLoadingEpisodes(true);
      setStatus(`Carregando temporada ${selectedSeason}...`);
      try {
          // Busca dados da temporada no TMDB (para nomes, overviews, etc.)
          const seasonResponse = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}?api_key=${API_KEY}&language=pt-BR`);
          const tmdbEpisodesData: Episode[] = seasonResponse.data.episodes;

          // Pega os dados da temporada específica do Firestore (contém nomes editados)
          const firestoreSeasonData = firestoreMediaData?.seasons?.[selectedSeason];

          // Mapeia os episódios do TMDB, sobrescrevendo nome (se existir no Firestore)
          const episodesData: Episode[] = tmdbEpisodesData.map((tmdbEp) => {
              const firestoreEp = firestoreSeasonData?.episodes?.find((fe: any) => fe.episode_number === tmdbEp.episode_number);
              return {
                  ...tmdbEp,
                  name: firestoreEp?.name || tmdbEp.name, // Usa nome do Firestore se existir
                  // A streamUrl não é mais buscada aqui
              };
          });

          setSeasonEpisodes(episodesData);

          // Verifica se o episódio ativo atual é válido nesta temporada
          const isCurrentActiveEpisodeValid = activeEpisode && activeEpisode.season === selectedSeason && episodesData.some(ep => ep.episode_number === activeEpisode.episode);

          // Se o episódio ativo não for válido (ou não houver um), define o primeiro da lista como ativo
          if (!isCurrentActiveEpisodeValid && episodesData.length > 0) {
              setActiveEpisode({ season: selectedSeason, episode: episodesData[0].episode_number });
          } else if (episodesData.length === 0) {
              // Se não houver episódios, limpa o episódio ativo
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


  // 4. Atualizar Player URL, Stats ID e Histórico (Séries) - Lógica do Firestore adicionada
  useEffect(() => {
      if (isLoadingDetails || type !== 'tv' || !activeEpisode || !id || !details) return;

      const { season, episode } = activeEpisode;

      // Encontra os dados do episódio atual na lista
      const episodeData = seasonEpisodes.find(ep => ep.episode_number === episode);

      if (episodeData) {
          // ***************************************************************
          // *** MUDANÇA #4: Lógica de URL para SÉRIE alterada para PrimeVicio ***
          // ***************************************************************
          const episodeUrl = `https://www.primevicio.lat/embed/tv/${id}/${season}/${episode}`;
          setActiveStreamUrl(episodeUrl);
          // --- FIM DA LÓGICA MODIFICADA ---

          const statsId = episodeData.id.toString(); // ID do episódio no TMDB para stats/comments
          setCurrentStatsId(statsId);

          // Salva no histórico
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
          // Se o episódio ativo não foi encontrado (talvez inválido), tenta selecionar o primeiro
          if(selectedSeason) {
              setActiveEpisode({ season: selectedSeason, episode: seasonEpisodes[0].episode_number });
          }
      } else if (seasonEpisodes.length === 0 && !isLoadingEpisodes) {
          // Se não há episódios na temporada, limpa a URL e o ID de stats
          setActiveStreamUrl('');
          setCurrentStatsId(null);
      }

  }, [activeEpisode, seasonEpisodes, isLoadingEpisodes, id, type, details, user, saveHistory, isLoadingDetails, selectedSeason]);


  // --- 5. useEffect para Views e Stats (Combinado) ---
  useEffect(() => {
      if (!currentStatsId) {
          setStats({ views: 0, likes: 0, dislikes: 0 }); // Reseta stats se não houver ID
          return;
      }

      const statsRef = doc(db, 'media_stats', currentStatsId);

      // Incrementa a view (apenas uma vez por carregamento de ID)
      runTransaction(db, async (transaction) => {
          const statsDoc = await transaction.get(statsRef);
          if (!statsDoc.exists()) {
              // Cria o documento com view = 1 e likes/dislikes = 0 se não existir
              transaction.set(statsRef, { views: 1, likes: 0, dislikes: 0 });
          } else {
              // Apenas incrementa a view se o documento já existe
              transaction.update(statsRef, { views: increment(1) });
          }
      }).catch(error => console.error("Erro ao incrementar view:", error));

      // Ouve atualizações nos stats (views, likes, dislikes)
      const unsubscribeStats = onSnapshot(statsRef, (docSnap) => {
          const data = docSnap.data();
          setStats({
              views: data?.views || 0,
              likes: data?.likes || 0,
              dislikes: data?.dislikes || 0
          });
      }, (error) => {
          console.error("Erro ao ouvir stats:", error);
          setStats({ views: 0, likes: 0, dislikes: 0 }); // Reseta em caso de erro
      });

      // Limpa o listener ao desmontar ou mudar o ID
      return () => unsubscribeStats();

  }, [currentStatsId]); // Depende apenas do ID da mídia/episódio


  // --- 6. useEffect para buscar o estado de Like/Dislike do usuário ---
  useEffect(() => {
      if (!user || !currentStatsId) {
          setLikeStatus(null); // Reseta se não logado ou sem ID
          return;
      }

      // Referência ao documento de interação do usuário para esta mídia/episódio
      const interactionRef = doc(db, `users/${user.uid}/interactions`, currentStatsId);

      const unsubscribeInteraction = onSnapshot(interactionRef, (docSnap) => {
          if (docSnap.exists()) {
              setLikeStatus(docSnap.data().status || null); // status será 'liked', 'disliked' ou null
          } else {
              setLikeStatus(null); // Documento não existe, usuário não interagiu
          }
      }, (error) => {
          console.error("Erro ao buscar interação do usuário:", error);
          setLikeStatus(null);
      });

      // Limpa o listener
      return () => unsubscribeInteraction();

  }, [user, currentStatsId]); // Depende do usuário e do ID da mídia/episódio

  // --- 7. useEffect para buscar filmes relacionados (sem alteração) ---
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
            .filter((item: Media) => item.poster_path && (item.title || item.name)) // Garante poster e nome
            .slice(0, 10); // Limita a 10 resultados
          setRelatedMovies(validRelated.map((item: any) => ({ ...item, media_type: 'movie' }))); // Adiciona media_type
        } catch (error) {
          console.error("Erro ao buscar filmes relacionados:", error);
          setRelatedMovies([]);
        } finally {
          setIsLoadingRelated(false);
        }
      };

      fetchRelated();
    }, [id, type, details, isLoadingDetails]); // Dependências corretas


  // --- Funções de manipulação ---
  const handleEpisodeClick = (season: number, episodeNumber: number) => {
    if (isLoadingEpisodes) return;
    setActiveEpisode({ season, episode: episodeNumber });
  };

  const handleSeasonChange = (newSeason: number) => {
    if (selectedSeason === newSeason || isLoadingEpisodes) return;
    setSelectedSeason(newSeason);
    setActiveEpisode(null); // Reseta o episódio ativo ao mudar de temporada
  };

  // --- Função para lidar com Likes/Dislikes ---
  const handleLikeDislike = async (newStatus: 'liked' | 'disliked' | null) => {
      if (!user || !currentStatsId || isUpdatingLike) {
          // CORREÇÃO: Usa a variável 'router' inicializada
          if (!user) router.push('/login?redirect=' + window.location.pathname + window.location.search);
          return;
      }

      setIsUpdatingLike(true);
      const previousStatus = likeStatus; // Guarda o estado anterior para rollback

      // Referências aos documentos
      const interactionRef = doc(db, `users/${user.uid}/interactions`, currentStatsId);
      const statsRef = doc(db, 'media_stats', currentStatsId);

      try {
          await runTransaction(db, async (transaction) => {
              const statsDoc = await transaction.get(statsRef);
              const interactionDoc = await transaction.get(interactionRef); // Lê o estado atual da interação

              let likesIncrement = 0;
              let dislikesIncrement = 0;
              const currentInteractionStatus = interactionDoc.exists() ? interactionDoc.data().status : null;

              // --- Lógica para incrementar/decrementar contadores ---
              if (newStatus === 'liked') {
                  if (currentInteractionStatus === 'liked') { // Clicou em like de novo (remove like)
                      likesIncrement = -1;
                      newStatus = null; // Atualiza o estado da interação para nulo
                  } else {
                      likesIncrement = 1;
                      if (currentInteractionStatus === 'disliked') { // Mudou de dislike para like
                          dislikesIncrement = -1;
                      }
                  }
              } else if (newStatus === 'disliked') {
                  if (currentInteractionStatus === 'disliked') { // Clicou em dislike de novo (remove dislike)
                      dislikesIncrement = -1;
                      newStatus = null; // Atualiza o estado da interação para nulo
                  } else {
                      dislikesIncrement = 1;
                      if (currentInteractionStatus === 'liked') { // Mudou de like para dislike
                          likesIncrement = -1;
                      }
                  }
              }
              // Se newStatus for null (porque clicou de novo no mesmo botão), a lógica acima já tratou os decrementos.

              // --- Atualizar documento de stats ---
              if (statsDoc.exists()) {
                  transaction.update(statsRef, {
                      likes: increment(likesIncrement),
                      dislikes: increment(dislikesIncrement)
                  });
              } else {
                  // Se o doc de stats não existir (pouco provável, mas seguro), cria com os valores corretos
                   transaction.set(statsRef, {
                       views: 1, // Assume 1 view se está interagindo
                       likes: Math.max(0, likesIncrement), // Garante que não seja negativo
                       dislikes: Math.max(0, dislikesIncrement) // Garante que não seja negativo
                   }, { merge: true }); // Usa merge para não sobrescrever views se outro processo criou
              }

              // --- Atualizar/deletar documento de interação do usuário ---
              if (newStatus) {
                  // Se deu like ou dislike, salva o estado
                  transaction.set(interactionRef, { status: newStatus }, { merge: true });
              } else {
                  // Se removeu o like/dislike (newStatus é null), deleta o documento de interação
                   if (interactionDoc.exists()) { // Só deleta se existir
                      transaction.delete(interactionRef);
                   }
              }
          });

          // Atualização otimista do estado local (já tratada pelo listener no useEffect 6)
          // setLikeStatus(newStatus); // O listener onSnapshot já fará isso

      } catch (error) {
          console.error("Erro ao atualizar like/dislike:", error);
          // Rollback da UI (Embora o listener deva corrigir, podemos fazer aqui por segurança)
          setLikeStatus(previousStatus);
          alert("Ocorreu um erro ao registrar sua avaliação.");
      } finally {
          setIsUpdatingLike(false);
      }
  };
  // --- Fim da função handleLikeDislike ---

  const getSynopsis = (): string => {
    // ... (sem alterações) ...
     if (!details) return 'Carregando sinopse...';
      if (type === 'movie') return details.overview || 'Sinopse não disponível.';

      // Para séries, tenta pegar a sinopse do episódio ativo, senão da série
      const currentEpisodeData = activeEpisode ? seasonEpisodes.find(ep => ep.episode_number === activeEpisode.episode) : null;
      return currentEpisodeData?.overview || details.overview || 'Sinopse não disponível.';
  };

  const getEpisodeTitle = (): string => {
    // ... (sem alterações) ...
     if (!details) return 'Carregando título...';
      if (type === 'movie') return details.title || 'Filme';

      const currentEpisodeData = activeEpisode ? seasonEpisodes.find(ep => ep.episode_number === activeEpisode.episode) : null;
      return currentEpisodeData && activeEpisode
            ? `${currentEpisodeData.name} - T${activeEpisode.season} E${activeEpisode.episode}`
            : details.title || 'Série';
  };

  const handleShare = () => {
    // ... (sem alterações) ...
     if (navigator.share) {
      navigator.share({
        title: details?.title || 'CineVEO',
        text: `Assista ${details?.title || 'este conteúdo'} no CineVEO!`,
        url: window.location.href,
      })
      .then(() => console.log('Compartilhado com sucesso'))
      .catch((error) => console.error('Erro ao compartilhar:', error));
    } else {
      // Fallback para copiar link
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copiado para a área de transferência!'))
        .catch(() => alert('Não foi possível copiar o link.'));
    }
  };


  // --- Renderização condicional de loading ---
  if (isLoadingDetails) {
    return (<div className="loading-container"><Image src="https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png" alt="Carregando..." width={120} height={120} className="loading-logo" priority style={{ objectFit: 'contain' }} /></div>);
  }
  if (!details) {
    return (<div className="loading-container"><p>{status}</p></div>);
  }

  // --- Componentes Internos ---
  const InfoBoxMobile = () => {
      // ... (sem alterações, apenas ajusta para usar `details`)
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
      // ... (Componente atualizado para usar stats e handleLikeDislike)
      const currentSynopsis = getSynopsis();
      const releaseYear = (details?.release_date || details?.first_air_date)?.substring(0, 4);

      return (
        <div className="details-interactions-section">
          {/* Título */}
          <h2 className="episode-title">{getEpisodeTitle()}</h2>

          {/* Barra de Ações (Like/Dislike/Share) */}
          <div className="media-actions-bar">
             {/* Grupo Like/Dislike */}
             <div className="like-dislike-group">
                <button
                  className={`action-btn focusable ${likeStatus === 'liked' ? 'active' : ''}`}
                  onClick={() => handleLikeDislike('liked')} // Chama a nova função
                  aria-label="Gostei"
                  disabled={isUpdatingLike || !user} // Desabilita enquanto atualiza ou se não logado
                >
                  <LikeIcon isActive={likeStatus === 'liked'} />
                  <span>{formatNumber(stats.likes)}</span> {/* Exibe contagem real */}
                </button>
                <button
                  className={`action-btn focusable ${likeStatus === 'disliked' ? 'active' : ''}`}
                  onClick={() => handleLikeDislike('disliked')} // Chama a nova função
                  aria-label="Não gostei"
                  disabled={isUpdatingLike || !user} // Desabilita enquanto atualiza ou se não logado
                >
                  <DislikeIcon isActive={likeStatus === 'disliked'} />
                  <span>{formatNumber(stats.dislikes)}</span> {/* Exibe contagem real */}
                </button>
             </div>

             {/* Botão Compartilhar */}
             <button className="action-btn focusable" onClick={handleShare} aria-label="Compartilhar">
               <ShareIcon />
               <span>Compartilhar</span>
             </button>

             {/* Contagem de views mobile */}
             <div className="mobile-only-layout" style={{ backgroundColor: 'transparent', paddingLeft: 0, marginLeft: 'auto' }}>
                 <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '500' }}>
                   {formatNumber(stats.views)} Views
                 </span>
             </div>
          </div>

          {/* Caixa de Descrição (Estilo YouTube) */}
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

          {/* --- Componente de Comentários --- */}
          {currentStatsId && <FirebaseComments mediaId={currentStatsId} />}

        </div>
      );
  };

  const EpisodeSelector = () => {
    // ... (sem alterações significativas, talvez ajustar o loading state)
     return (
          <div className="episodes-list-wrapper">
              <div className="episodes-header">
                  <select
                      className="season-selector focusable"
                      value={selectedSeason ?? ''}
                      onChange={(e) => handleSeasonChange(Number(e.target.value))}
                      disabled={isLoadingEpisodes} // Desabilita durante o carregamento
                  >
                       {/* Filtra temporadas inválidas (sem número ou sem episódios) */}
                      {details.seasons?.filter(s => s.season_number > 0 && s.episode_count > 0).map(s => (
                          <option key={s.id} value={s.season_number}>{s.name}</option>
                      ))}
                  </select>
                  {!isLoadingEpisodes && <p className='episode-count-info'>({seasonEpisodes.length} Eps)</p>}
              </div>

              {/* Lista Desktop */}
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
                                  <div className='thumbnail-placeholder-small'></div> // Placeholder se não houver imagem
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

              {/* Grid Mobile */}
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

  const MovieSelector = () => {
    // ... (sem alterações) ...
     return (
        <div className="episodes-list-wrapper desktop-only-layout">
            {/* Apenas um "item" para o filme */}
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
                {/* Visualizador de áudio (opcional, pode remover se não gostar) */}
                <div className="visualizer-container">
                    <AudioVisualizer />
                </div>
            </div>
        </div>
      );
  };

  const RelatedMoviesSection = () => {
     // ... (sem alterações)
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

  // --- Renderização Principal ---
  return (
    <>
      <div className="media-page-layout">
        {/* Seção Principal (Player + Seletor/Relacionados) */}
        <section className="series-watch-section">
          {/* Layout Desktop */}
          <div className="main-container desktop-only-layout">
            <div className="series-watch-grid">
              {/* Coluna 1: Player e Interações */}
              <div className="series-player-wrapper">
                <PlayerContent activeStreamUrl={activeStreamUrl} title={details.title} />
                <InteractionsSection /> {/* Inclui botões, descrição E COMENTÁRIOS */}
              </div>
              {/* Coluna 2: Seletor (Ep/Filme), InfoBox (séries), Relacionados (filmes) */}
              <div>
                {type === 'tv' ? <EpisodeSelector /> : <MovieSelector />}
                {/* InfoBox (com sinopse) foi movido para dentro de InteractionsSection */}
                {type === 'movie' && <RelatedMoviesSection />}
              </div>
            </div>
          </div>
          {/* Layout Mobile: Player */}
          <div className="mobile-only-layout">
            <PlayerContent activeStreamUrl={activeStreamUrl} title={details.title} />
          </div>
        </section>

        {/* Conteúdo Abaixo do Player no Mobile */}
        <div className="mobile-only-layout">
             <div className="main-container" style={{ marginTop: '1.5rem' }}>
                <InfoBoxMobile /> {/* Título e meta info mobile */}
                <InteractionsSection /> {/* Botões, caixa de descrição E COMENTÁRIOS mobile */}
                {type === 'tv' && <EpisodeSelector />}
                {type === 'movie' && <RelatedMoviesSection />}
            </div>
        </div>

        {/* Detalhes Adicionais (Elenco, etc.) */}
        <main className="details-main-content">
          <div className="main-container">
             {/* Conteúdo que estava dentro de <div className="details-info"> foi removido ou movido */}
             {/* Os gêneros podem ser adicionados à InteractionsSection se desejado */}
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