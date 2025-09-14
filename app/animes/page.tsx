import CategoryPage from '../components/CategoryPage';

const API_KEY = "860b66ade580bacae581f4228fad49fc";
// URL especial que filtra por género "Animação" e palavra-chave "anime"
const ANIME_URL = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=16&with_keywords=210024`;

export default function Animes() {
  return <CategoryPage title="Animes" mediaType="tv" fetchUrl={ANIME_URL} />;
}