// app/sitemaps/movies.xml/route.ts
const API_KEY = "860b66ade580bacae581f4228fad49fc";
const SITE_URL = 'https://www.cineveo.lat';
const MAX_PAGES = 500; // Limite da API do TMDB

// Função para buscar todas as páginas de um tipo de mídia
async function fetchAllMediaPages(mediaType: 'movie' | 'tv') {
  const allMedia: { id: number; release_date?: string; first_air_date?: string }[] = [];
  try {
    // Cria um array de promessas para todas as páginas
    const fetchPromises = Array.from({ length: MAX_PAGES }, (_, i) =>
      fetch(`https://api.themoviedb.org/3/${mediaType}/popular?api_key=${API_KEY}&language=pt-BR&page=${i + 1}`)
        .then(res => res.ok ? res.json() : Promise.reject(`Erro na página ${i + 1}`))
        .catch(() => null) // Retorna nulo se uma página falhar
    );

    // Executa todas as promessas em paralelo
    const results = await Promise.all(fetchPromises);

    for (const pageResult of results) {
      if (pageResult && pageResult.results) {
        allMedia.push(...pageResult.results);
      }
    }
  } catch (error) {
    console.error(`Erro ao buscar todas as páginas de ${mediaType}:`, error);
  }
  return allMedia;
}

function getValidDate(dateString: string | null | undefined): string {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return dateString;
}

export async function GET() {
  const movies = await fetchAllMediaPages('movie');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${movies.map(movie => `
        <url>
          <loc>${SITE_URL}/media/movie/${movie.id}</loc>
          <lastmod>${getValidDate(movie.release_date)}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>
      `).join('')}
    </urlset>
  `;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' },
  });
}