// app/player3/media/[type]/[[...slug]]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import CineVEOPlayer from '@/app/components/CineVEOPlayer';
import Image from 'next/image';

interface Stream {
  url: string;
}

const PlayerEmbedPage = () => {
  const params = useParams();
  const { type, slug } = params;

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !slug || !Array.isArray(slug) || slug.length === 0) {
      setError("Parâmetros inválidos.");
      setIsLoading(false);
      return;
    }

    const fetchStream = async () => {
      setIsLoading(true);
      setError(null);
      
      const path = slug.join('/');
      const apiUrl = `/api/stream/${type}/${path}`;

      try {
        const response = await axios.get(apiUrl);
        const streams: Stream[] = response.data.streams || [];
        
        // Pega a primeira URL disponível
        if (streams.length > 0 && streams[0].url) {
          const proxyUrl = `/api/video-proxy?videoUrl=${encodeURIComponent(streams[0].url)}`;
          setStreamUrl(proxyUrl);
        } else {
          setError("Nenhuma fonte de vídeo encontrada para este conteúdo.");
        }
      } catch (err) {
        setError("Não foi possível carregar a fonte de vídeo.");
        console.error("Erro ao buscar stream:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStream();
  }, [type, slug]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {isLoading && (
        <div className="loading-container" style={{ minHeight: 'auto' }}>
            <Image src="https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png" alt="Carregando..." width={100} height={100} className="loading-logo" priority style={{ objectFit: 'contain' }} />
        </div>
      )}
      {error && !isLoading && (
        <p style={{ color: 'white', fontFamily: 'sans-serif' }}>{error}</p>
      )}
      {streamUrl && !isLoading && (
        <CineVEOPlayer src={streamUrl} />
      )}
    </div>
  );
};

export default PlayerEmbedPage;