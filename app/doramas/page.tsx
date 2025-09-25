import CategoryPage from '../components/CategoryPage';

const API_KEY = "860b66ade580bacae581f4228fad49fc";
// URL que filtra por Dramas (gênero 18) da Coreia do Sul (KR)
const DORAMAS_URL = `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&with_genres=18&with_origin_country=KR`;

export default function Doramas() {
  return <CategoryPage title="Doramas" mediaType="tv" fetchUrl={DORAMAS_URL} />;
}