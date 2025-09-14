// app/search/page.tsx
"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import CategoryPage from '../components/CategoryPage';

const API_KEY = "860b66ade580bacae581f4228fad49fc";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');

  if (!query) {
    return (
      <main style={{ paddingTop: '100px' }}>
        <div className="main-container">
          <h1 className="page-title">Pesquisa</h1>
          <p>Por favor, digite algo para pesquisar.</p>
        </div>
      </main>
    );
  }

  const SEARCH_URL = `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`;

  return (
    <CategoryPage
      key={query} // Importante para re-renderizar ao mudar a pesquisa
      title={`Resultados para "${query}"`}
      mediaType="movie" // O componente vai lidar com 'tv' também
      fetchUrl={SEARCH_URL}
      isSearchPage={true} // Prop para indicar que é uma página de pesquisa
    />
  );
}

// Componente de fallback para Suspense
function Loading() {
  return (
    <div className="loading-container" style={{ minHeight: '50vh' }}>
      <div className='spinner'></div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchResults />
    </Suspense>
  );
}