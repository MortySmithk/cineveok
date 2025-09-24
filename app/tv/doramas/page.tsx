import { TVCategoryPage } from '@/app/components/TVCategoryPage'; // Caminho corrigido

const API_KEY = "860b66ade580bacae581f4228fad49fc";
const DORAMA_URL = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=18&with_keywords=2653B1%2C287518&with_original_language=ko|ja|zh`;

export default function TVDoramasPage() {
  return <TVCategoryPage title="Doramas" mediaType="tv" fetchUrl={DORAMA_URL} />;
}