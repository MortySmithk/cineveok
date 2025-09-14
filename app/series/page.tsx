import CategoryPage from '../components/CategoryPage';

const API_KEY = "860b66ade580bacae581f4228fad49fc";
const SERIES_URL = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc`;

export default function Series() {
  return <CategoryPage title="Séries" mediaType="tv" fetchUrl={SERIES_URL} />;
}