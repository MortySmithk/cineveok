// app/sitemaps/static.xml/route.ts
import { MetadataRoute } from 'next';

const SITE_URL = 'https://www.cineveo.lat';

export async function GET() {
  const staticUrls = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/filmes`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/series`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/animes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/doramas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/animacoes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticUrls.map(({ url, lastModified, changeFrequency, priority }) => `
        <url>
          <loc>${url}</loc>
          <lastmod>${lastModified.toISOString()}</lastmod>
          <changefreq>${changeFrequency}</changefreq>
          <priority>${priority}</priority>
        </url>
      `).join('')}
    </urlset>
  `;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' },
  });
}