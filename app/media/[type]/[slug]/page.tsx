// cineveo-next/app/media/[type]/[slug]/page.tsx
import { Metadata } from 'next';
import MediaPageClient from './MediaPageClient';
// 1. Importar Suspense
import { Suspense } from 'react';

const API_KEY = "860b66ade580bacae581f4228fad49fc";

// --- Função getIdFromSlug (Sem alteração) ---
const getIdFromSlug = (slug: string) => {
    if (!slug) return null;
    const parts = slug.split('-');
    return parts[parts.length - 1];
};

// --- Função getMediaData (Sem alteração) ---
// (Já incluía o cache de 1 hora)
async function getMediaData(type: string, id: string) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,external_ids`,
      { next: { revalidate: 3600 } } // Cache de 1 hora
    );
    if (!response.ok) throw new Error('Failed to fetch media details');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

// --- generateMetadata (Sem alteração) ---
// (Esta função AINDA é async e vai buscar os dados, o que é ótimo para SEO)
export async function generateMetadata({ params }: { params: { type: string; slug: string } }): Promise<Metadata> {
  const { type, slug } = params;
  const id = getIdFromSlug(slug);

  if (!id) {
    return {
      title: 'Conteúdo Inválido - CineVEO',
      description: 'O link acessado parece estar quebrado ou incompleto.',
    };
  }
  
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

// 2. Componente do Esqueleto de Carregamento
// (Este é o fallback que o Suspense mostrará)
function LoadingSkeleton() {
  return (
    <div className="loading-skeleton-component">
      <div className="skeleton-grid">
        {/* Coluna 1: Player e Interações */}
        <div className="skeleton-player-col">
          <div className="skeleton-player"></div>
          <div className="skeleton-box line"></div>
          <div className="skeleton-box line-small"></div>
          <div className="skeleton-box" style={{ height: '120px' }}></div>
        </div>
        {/* Coluna 2: Sidebar (Episódios/Filme/Relacionados) */}
        <div className="skeleton-sidebar desktop-only-layout">
          <div className="skeleton-box" style={{ height: '60px' }}></div>
          <div className="skeleton-box"></div>
          <div className="skeleton-box"></div>
          <div className="skeleton-box"></div>
          <div className="skeleton-box"></div>
          <div className="skeleton-box"></div>
        </div>
      </div>
    </div>
  );
}

// 3. NOVO Componente Async que realmente busca os dados
// (Ele será renderizado "em espera" pelo Suspense)
async function MediaContent({ params, searchParams }: {
  params: { type: string; slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  
  // Esta lógica estava antes na exportação padrão
  const { type, slug } = params;
  const id = getIdFromSlug(slug);
  const mediaData = id ? await getMediaData(type, id) : null;
  
  // O Next.js vai deduplicar esta chamada de 'fetch'
  // com a chamada feita pelo 'generateMetadata'.
  // A API NÃO será chamada duas vezes.
  
  return (
    <MediaPageClient 
      params={params} 
      searchParams={searchParams}
      initialData={mediaData} 
    />
  );
}

// 4. ALTERAÇÃO PRINCIPAL: A página (default export) agora NÃO é async
// Ela renderiza o <Suspense> IMEDIATAMENTE.
export default function MediaPage({ 
  params,
  searchParams
}: { 
  params: { type: string; slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  
  return (
    // O Suspense mostra o "esqueleto" imediatamente
    <Suspense fallback={<LoadingSkeleton />}>
      {/* O MediaContent (que é async) começa a ser renderizado no servidor.
        Quando ele terminar (após os 5-6s), ele substituirá o LoadingSkeleton.
      */}
      <MediaContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}