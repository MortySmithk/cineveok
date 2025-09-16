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
    if (!type || !slug || !Array.isArray(slug) || slug.length === 0) {
      setError("Parâmetros inválidos na URL.");
      setIsLoading(false);
      return;
    }

    let url = '';
    if (type === 'movie') {
      const [tmdbId] = slug;
      url = `https://primevicio.vercel.app/embed/movie/${tmdbId}`;
    } else if (type === 'tv') {
      const [tmdbId, season, episode] = slug;
      url = `https://primevicio.vercel.app/embed/tv/${tmdbId}/${season}/${episode}`;
    }

    if (url) {
      setStreamUrl(url);
    } else {
      setError("Tipo de mídia não suportado.");
    }
    setIsLoading(false);

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
            title="CineVEO Player Embed"
        ></iframe>
      )}
    </div>
  );
};

export default PlayerEmbedPage;