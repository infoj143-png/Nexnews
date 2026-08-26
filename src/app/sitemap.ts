import { MetadataRoute } from 'next';
import { getArticles, CATEGORIES } from '@/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://nexnews.ai';

  // Homepage
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
  ];

  // Category pages
  CATEGORIES.forEach((category) => {
    routes.push({
      url: `${baseUrl}/category/${category.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    });
  });

  // Active published news articles
  const articles = getArticles().filter((article) => article.status === 'published');
  articles.forEach((article) => {
    routes.push({
      url: `${baseUrl}/news/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: 'daily',
      priority: 0.7,
    });
  });

  return routes;
}
