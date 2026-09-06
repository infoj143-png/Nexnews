import { NextResponse } from 'next/server';
import { getArticles } from '@/lib/data';
import { getSiteUrl } from '@/lib/site';

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = getSiteUrl();
  const allArticles = getArticles();
  const now = new Date().getTime();
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

  // Filter to include only published articles from the last 48 hours
  const recentArticles = allArticles.filter((article) => {
    if (article.status !== 'published') return false;
    const pubTime = new Date(article.publishedAt).getTime();
    if (isNaN(pubTime)) return false;
    return now - pubTime <= FORTY_EIGHT_HOURS_MS;
  });

  const xmlEntries = recentArticles
    .map((article) => {
      const articleUrl = `${baseUrl}/news/${article.slug}`;
      const pubDate = new Date(article.publishedAt).toISOString();
      return `  <url>
    <loc>${escapeXml(articleUrl)}</loc>
    <news:news>
      <news:publication>
        <news:name>Nexnews</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(pubDate)}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${xmlEntries}
</urlset>`;

  return new NextResponse(xmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
