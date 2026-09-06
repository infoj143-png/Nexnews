import { NextResponse } from 'next/server';
import { getArticles } from '@/lib/data';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 300;

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
  const articles = getArticles()
    .filter((a) => a.status === 'published')
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const lastBuildDate = articles.length > 0
    ? new Date(articles[0].publishedAt).toUTCString()
    : new Date().toUTCString();

  const feedItemsXml = articles
    .map((article) => {
      const articleUrl = `${baseUrl}/news/${article.slug}`;
      const pubDate = new Date(article.publishedAt).toUTCString();
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${article.summary}]]></description>
      <category>${escapeXml(article.category)}</category>
      <author>${escapeXml(article.author.name)}</author>
    </item>`;
    })
    .join('\n');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nexnews - Autonomous AI News Engine</title>
    <link>${baseUrl}</link>
    <description>Real-time AI automated reporting, breaking news, deep analysis, and market updates.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${feedItemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=300, stale-while-revalidate=3600',
    },
  });
}
