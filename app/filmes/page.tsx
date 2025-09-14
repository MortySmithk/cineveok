import CategoryPage from '../components/CategoryPage';

const API_KEY = "860b66ade580bacae581f4228fad49fc";
const MOVIES_URL = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc`;

export default function Filmes() {
  return <CategoryPage title="Filmes" mediaType="movie" fetchUrl={MOVIES_URL} />;
}