// cineveo-next/app/media/[type]/[id]/page.tsx
// REMOVIDO "use client" - ESTE AGORA É UM COMPONENTE DE SERVIDOR

import { Metadata } from 'next';
import MediaPageClient from './MediaPageClient'; // Importa o novo componente de cliente

const API_KEY = "860b66ade580bacae581f4228fad49fc";

// A função 'generateMetadata' permanece aqui, pois roda no servidor
export async function generateMetadata({ params }: { params: { type: string; id: string } }): Promise<Metadata> {
  const { type, id } = params;
  
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=pt-BR`
    );
    if (!response.ok) throw new Error('Failed to fetch media details');
    const data = await response.json();

    const title = data.title || data.name;
    const typeText = type === 'movie' ? 'Filme Completo' : 'Série Completa';
    const pageTitle = `Assistir ${title} Online Grátis (${typeText}) - CineVEO`;
    const pageDescription = data.overview || `Assista ${title} online grátis em HD no CineVEO. Encontre os melhores filmes e séries para assistir agora.`;

    return {
      title: pageTitle,
      description: pageDescription,
      openGraph: {
        title: pageTitle,
        description: pageDescription,
        images: [
          {
            url: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
            width: 500,
            height: 750,
            alt: title,
          },
           {
            url: `https://image.tmdb.org/t/p/original${data.backdrop_path}`,
            width: 1280,
            height: 720,
            alt: title,
          }
        ],
        siteName: 'CineVEO',
        type: 'video.movie',
      },
       twitter: {
        card: 'summary_large_image',
        title: pageTitle,
        description: pageDescription,
        images: [`https://image.tmdb.org/t/p/original${data.backdrop_path}`],
      },
    };
  } catch (error) {
    console.error(error);
    return {
      title: 'Conteúdo não encontrado - CineVEO',
      description: 'Não foi possível carregar os detalhes para este conteúdo.',
    };
  }
}

// O componente de página agora simplesmente renderiza o componente de cliente,
// passando os parâmetros (params) para ele.
export default function MediaPage({ params }: { params: { type: string; id: string } }) {
  return <MediaPageClient params={params} />;
}