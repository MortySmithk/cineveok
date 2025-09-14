import CategoryPage from '../components/CategoryPage';

const API_KEY = "860b66ade580bacae581f4228fad49fc";
// URL que filtra pelo género "Novela" (Soap)
const NOVELAS_URL = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=10766`;

export default function Novelas() {
  return <CategoryPage title="Novelas" mediaType="tv" fetchUrl={NOVELAS_URL} />;
}