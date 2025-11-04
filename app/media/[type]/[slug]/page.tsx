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

// --- NOVA FUNÇÃO DE BUSCA REUTILIZÁVEL ---
// Busca os dados no servidor com cache de 1 hora (3600s)
async function getMediaData(type: string, id: string) {
  try {
    const response = await fetch(
      // Busca dados principais, créditos e IDs externos de uma vez
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,external_ids`,
      { next: { revalidate: 3600 } } // <-- Cache de 1 hora
    );
    if (!response.ok) throw new Error('Failed to fetch media details');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { type: string; slug: string } }): Promise<Metadata> {
  const { type, slug } = params;
  const id = getIdFromSlug(slug);

  if (!id) {
    return {
      title: 'Conteúdo Inválido - CineVEO',
      description: 'O link acessado parece estar quebrado ou incompleto.',
    };
  }
  
  // Use a nova função de busca (o Next.js deduplica esta chamada)
  const data = await getMediaData(type, id);

  if (!data) {
    return {
      title: 'Conteúdo não encontrado - CineVEO',
      description: 'Não foi possível carregar os detalhes para este conteúdo.',
    };
  }

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
}

// --- PÁGINA AGORA É ASYNC ---
export default async function MediaPage({ 
  params,
  searchParams
}: { 
  params: { type: string; slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  
  // Busca os dados no servidor
  const { type, slug } = params;
  const id = getIdFromSlug(slug);
  const mediaData = id ? await getMediaData(type, id) : null;
  
  // Passa os dados buscados (mediaData) como prop 'initialData' para o cliente
  return <MediaPageClient 
           params={params} 
           searchParams={searchParams}
           initialData={mediaData} 
         />;
}