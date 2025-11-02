// app/hooks/useWatchLater.ts
"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  ReactNode
} from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { db } from '@/app/components/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// Define a estrutura de um item de mídia
export interface WatchLaterMedia {
  id: number; // TMDB ID
  title: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

// Define o que o contexto irá fornecer
interface WatchLaterContextType {
  watchLaterItems: WatchLaterMedia[];
  addWatchLater: (media: WatchLaterMedia) => Promise<void>;
  removeWatchLater: (mediaId: number) => Promise<void>;
  isWatchLater: (mediaId: number) => boolean;
  isLoading: boolean;
}

// Cria o contexto
const WatchLaterContext = createContext<WatchLaterContextType | undefined>(undefined);

// Define as props do Provedor
interface WatchLaterProviderProps {
  children: ReactNode;
}

// Cria o Provedor
export const WatchLaterProvider: React.FC<WatchLaterProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [watchLaterItems, setWatchLaterItems] = useState<WatchLaterMedia[]>([]);
  const [itemIds, setItemIds] = useState(new Set<number>());
  const [isLoading, setIsLoading] = useState(true);

  // Carrega os itens do Firestore quando o usuário é carregado
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const watchLaterCol = collection(db, 'users', user.uid, 'watchLater');
      
      const unsubscribe = onSnapshot(watchLaterCol, (snapshot: QuerySnapshot<DocumentData>) => {
        const items: WatchLaterMedia[] = [];
        const ids = new Set<number>();
        
        snapshot.forEach((doc) => {
          const data = doc.data() as WatchLaterMedia;
          items.push(data);
          ids.add(data.id);
        });
        
        setWatchLaterItems(items.reverse()); // Mostra os mais recentes primeiro
        setItemIds(ids);
        setIsLoading(false);
      }, (error) => {
        console.error("Erro ao buscar 'Assistir mais tarde': ", error);
        toast.error("Erro ao carregar sua lista.");
        setIsLoading(false);
      });

      // Limpa o listener ao desmontar
      return () => unsubscribe();
    } else {
      // Se não há usuário, limpa a lista
      setWatchLaterItems([]);
      setItemIds(new Set());
      setIsLoading(false);
    }
  }, [user]);

  // Adiciona um item
  const addWatchLater = useCallback(async (media: WatchLaterMedia) => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar itens.");
      return;
    }
    
    // Pega apenas os campos necessários para evitar salvar lixo
    const cleanMedia: WatchLaterMedia = {
      id: media.id,
      title: media.title,
      poster_path: media.poster_path,
      media_type: media.media_type,
      release_date: media.release_date || media.first_air_date,
      vote_average: media.vote_average
    };
    
    try {
      const itemRef = doc(db, 'users', user.uid, 'watchLater', String(media.id));
      await setDoc(itemRef, cleanMedia);
      toast.success("Adicionado à sua lista!");
    } catch (error) {
      console.error("Erro ao adicionar: ", error);
      toast.error("Não foi possível adicionar à lista.");
    }
  }, [user]);

  // Remove um item
  const removeWatchLater = useCallback(async (mediaId: number) => {
    if (!user) return;
    
    try {
      const itemRef = doc(db, 'users', user.uid, 'watchLater', String(mediaId));
      await deleteDoc(itemRef);
      toast.success("Removido da sua lista.");
    } catch (error) {
      console.error("Erro ao remover: ", error);
      toast.error("Não foi possível remover da lista.");
    }
  }, [user]);

  // Verifica se um item já está na lista
  const isWatchLater = useCallback((mediaId: number) => {
    return itemIds.has(mediaId);
  }, [itemIds]);

  return (
    <WatchLaterContext.Provider value={{ watchLaterItems, addWatchLater, removeWatchLater, isWatchLater, isLoading }}>
      {children}
    </WatchLaterContext.Provider>
  );
};

// Hook customizado para consumir o contexto
export const useWatchLater = (): WatchLaterContextType => {
  const context = useContext(WatchLaterContext);
  if (context === undefined) {
    throw new Error('useWatchLater deve ser usado dentro de um WatchLaterProvider');
  }
  return context;
};