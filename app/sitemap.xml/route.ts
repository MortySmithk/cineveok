// app/sitemap.xml/route.ts
import { MetadataRoute } from 'next';

const SITE_URL = 'https://www.cineveo.lat';

// Esta função agora gera o SITEMAP INDEX, que aponta para os outros sitemaps
export async function GET() {
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap>
        <loc>${SITE_URL}/sitemaps/static.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </sitemap>
      <sitemap>
        <loc>${SITE_URL}/sitemaps/movies.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </sitemap>
      <sitemap>
        <loc>${SITE_URL}/sitemaps/tv.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </sitemap>
    </sitemapindex>
  `;

  return new Response(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}