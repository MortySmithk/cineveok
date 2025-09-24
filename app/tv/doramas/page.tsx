import { TVCategoryPage } from '@/app/components/TVCategoryPage';

const API_KEY = "860b66ade580bacae581f4228fad49fc";
// URL CORRIGIDA: Usa uma combinação mais ampla de gêneros e linguagens para garantir resultados.
const DORAMA_URL = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=18|10766|10759&with_original_language=ko|ja|zh`;

export default function TVDoramasPage() {
  return <TVCategoryPage title="Doramas" mediaType="tv" fetchUrl={DORAMA_URL} />;
}