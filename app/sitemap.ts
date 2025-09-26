// app/sitemap.ts
import { MetadataRoute } from 'next';

const API_KEY = "860b66ade580bacae581f4228fad49fc";
// IMPORTANTE: Substitua pela URL final do seu site quando for publicá-lo
const SITE_URL = 'https://www.cineveo.lat/'; 

// Função para buscar a mídia da API do TMDB
async function fetchAllMedia(): Promise<{ id: number; media_type: 'movie' | 'tv', last_modified: string }[]> {
  try {
    const media: { id: number; media_type: 'movie' | 'tv', last_modified: string }[] = [];
    
    // Busca as 10 primeiras páginas de filmes e séries populares (total de ~400 itens)
    for (let i = 1; i <= 10; i++) {
      const moviePromise = fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=pt-BR&page=${i}`).then(res => res.json());
      const tvPromise = fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=pt-BR&page=${i}`).then(res => res.json());

      const [movieResults, tvResults] = await Promise.all([moviePromise, tvPromise]);

      if (movieResults.results) {
        movieResults.results.forEach((item: { id: number; release_date: string }) => {
          media.push({ id: item.id, media_type: 'movie', last_modified: item.release_date || new Date().toISOString().split('T')[0] });
        });
      }
      if (tvResults.results) {
        tvResults.results.forEach((item: { id: number; first_air_date: string }) => {
          media.push({ id: item.id, media_type: 'tv', last_modified: item.first_air_date || new Date().toISOString().split('T')[0] });
        });
      }
    }

    return media;
  } catch (error) {
    console.error("Erro ao buscar mídia para o sitemap:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. URLs estáticas
  const staticUrls: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/filmes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/series`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/animes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/doramas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/animacoes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  // 2. URLs dinâmicas da mídia
  const allMedia = await fetchAllMedia();
  const mediaUrls: MetadataRoute.Sitemap = allMedia.map(media => ({
    url: `${SITE_URL}/media/${media.media_type}/${media.id}`,
    lastModified: new Date(media.last_modified),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticUrls, ...mediaUrls];
}