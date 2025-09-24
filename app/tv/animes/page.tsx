import { TVCategoryPage } from '@/app/components/TVCategoryPage'; // Caminho corrigido

const API_KEY = "860b66ade580bacae581f4228fad49fc";
const ANIME_URL = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=16&with_keywords=210024`;

export default function TVAnimesPage() {
  return <TVCategoryPage title="Animes" mediaType="tv" fetchUrl={ANIME_URL} />;
}