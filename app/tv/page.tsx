"use client";

import Image from 'next/image';
import { useTVNavigation } from '../hooks/useTVNavigation';

// Componente de Card de Mídia para a Home
const MediaCard = ({ title, poster }: { title: string; poster: string }) => (
    <div className="tv-home-card focusable">
        <Image src={poster} alt={title} layout="fill" objectFit="cover" />
        <div className="tv-home-card-title">{title}</div>
    </div>
);

export default function TVHomePage() {
  useTVNavigation('#tv-main-content'); // Ativa a navegação por foco nesta área

  return (
    <div className="tv-home-container">
      <div className="tv-home-promo-section">
        <h1 className="promo-title">Deixe o CineVEO com a sua cara</h1>
        <p className="promo-subtitle">
          Faça login para ter acesso a recomendações, inscrições e muito mais.
        </p>
        <button className="tv-login-button focusable">
          Fazer login
        </button>
      </div>

      <section className="tv-home-carousel-section">
          <h2>Filmes em Destaque</h2>
          <div className="tv-home-carousel">
              <MediaCard title="Duna: Parte 2" poster="https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg" />
              <MediaCard title="Godzilla e Kong: O Novo Império" poster="https://image.tmdb.org/t/p/w500/6vhoverj0ZoHjK252nN2NstblXo.jpg" />
              <MediaCard title="Kung Fu Panda 4" poster="https://image.tmdb.org/t/p/w500/pM7o3yIT5aDeaOKY1v25doUtckE.jpg" />
              <MediaCard title="Guerra Civil" poster="https://image.tmdb.org/t/p/w500/2GzgNUDbHJUxO0gBq4a4y5D2n60.jpg" />
              <MediaCard title="Abigail" poster="https://image.tmdb.org/t/p/w500/y0i2NGAqUe2j72Ddba4sWFFL6h.jpg" />
          </div>
      </section>
    </div>
  );
}