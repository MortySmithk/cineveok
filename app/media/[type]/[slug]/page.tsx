// cineveo-next/app/media/[type]/[slug]/page.tsx
import { Metadata } from 'next';
import MediaPageClient from './MediaPageClient';

const API_KEY = "860b66ade580bacae581f4228fad49fc";

// Função para extrair o ID do slug
const getIdFromSlug = (slug: string) => {
    if (!slug) return null;
    const parts = slug.split('-');
    return parts[parts.length - 1];
};

export async function generateMetadata({ params }: { params: { type: string; slug: string } }): Promise<Metadata> {
  const { type, slug } = params;
  const id = getIdFromSlug(slug);

  if (!id) {
    return {
      title: 'Conteúdo Inválido - CineVEO',
      description: 'O link acessado parece estar quebrado ou incompleto.',
    };
  }
  
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

// MODIFICAÇÃO AQUI: Aceita e repassa searchParams
export default function MediaPage({ 
  params,
  searchParams
}: { 
  params: { type: string; slug: string };
  searchParams?: { [key: string]: string | string[] | undefined }; // <-- ADICIONADO
}) {
  return <MediaPageClient params={params} searchParams={searchParams} />; // <-- REPASSADO
}