import CategoryPage from '../components/CategoryPage';

const API_KEY = "860b66ade580bacae581f4228fad49fc";
// URL que filtra pelo género "Animação"
const ANIMATION_URL = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=16`;

export default function Animacoes() {
  return <CategoryPage title="Animações" mediaType="movie" fetchUrl={ANIMATION_URL} />;
}