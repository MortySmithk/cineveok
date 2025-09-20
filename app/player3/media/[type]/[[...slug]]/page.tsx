// app/player3/media/[type]/[[...slug]]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

const PlayerEmbedPage = () => {
  const params = useParams();
  const { type, slug } = params;

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreamUrl = async () => {
      if (!type || !slug || !Array.isArray(slug) || slug.length === 0) {
        setError("Parâmetros inválidos na URL.");
        setIsLoading(false);
        return;
      }

      let apiUrl = '';
      if (type === 'movie') {
        const [tmdbId] = slug;
        apiUrl = `/api/stream/movie/${tmdbId}`;
      } else if (type === 'tv') {
        const [tmdbId, season, episode] = slug;
        apiUrl = `/api/stream/series/${tmdbId}/${season}/${episode}`;
      }

      if (apiUrl) {
        try {
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error('Link não encontrado.');
          }
          const data = await response.json();
          if (data.streams && data.streams.length > 0) {
            setStreamUrl(data.streams[0].url);
          } else {
            setError("Nenhum link de streaming disponível.");
          }
        } catch (err: any) {
          setError(err.message || "Erro ao buscar o link de streaming.");
        }
      } else {
        setError("Tipo de mídia não suportado.");
      }
      setIsLoading(false);
    };

    fetchStreamUrl();
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
        <iframe
            src={streamUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            referrerPolicy="no-referrer"
            title="CineVEO Player Embed"
        ></iframe>
      )}
    </div>
  );
};

export default PlayerEmbedPage;