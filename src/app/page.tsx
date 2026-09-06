import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getArticles } from '@/lib/data';
import { getSiteUrl } from '@/lib/site';
import { AdBanner } from '@/components/ads/AdBanner';
import { TrendingSidebar } from '@/components/widgets/TrendingSidebar';
import { NewsletterWidget } from '@/components/widgets/NewsletterWidget';
import { HomeFeedFilter } from '@/components/home/HomeFeedFilter';
import { Clock, Eye, ChevronRight, Zap } from 'lucide-react';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  return {
    title: 'Nexnews - Autonomous AI News Engine',
    description: 'Real-time AI automated reporting, breaking news, deep analysis, and market updates.',
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: 'Nexnews - Autonomous AI News Engine',
      description: 'Real-time AI automated reporting, breaking news, deep analysis, and market updates.',
      url: siteUrl,
      siteName: 'Nexnews',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Nexnews - Autonomous AI News Engine',
      description: 'Real-time AI automated reporting, breaking news, deep analysis, and market updates.',
    },
  };
}

export default async function HomePage() {
  const articles = getArticles();
  const sortedArticles = [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const heroArticle = sortedArticles[0];
  const subFeatured = sortedArticles.slice(1, 3);

  return (
    <div className="space-y-8">
      {/* Top Hero / Featured Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
              Featured Coverage
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hero Main Big Card (2 cols) */}
          {heroArticle && (
            <div className="lg:col-span-2 group">
              <Link href={`/news/${heroArticle.slug}`} className="block relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                <div className="relative h-72 sm:h-96 w-full overflow-hidden">
                  <Image
                    src={heroArticle.imageUrl}
                    alt={heroArticle.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Category Pill */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                      {heroArticle.category}
                    </span>
                    {heroArticle.isBreaking && (
                      <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-600 text-white flex items-center gap-1 animate-pulse">
                        <Zap className="w-3 h-3 fill-white" /> Breaking
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 space-y-3">
                    <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(heroArticle.publishedAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{heroArticle.readTime}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-blue-400">
                        <Eye className="w-3.5 h-3.5" /> {heroArticle.views.toLocaleString()}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black font-serif text-white group-hover:text-blue-300 transition-colors leading-tight">
                      {heroArticle.title}
                    </h1>

                    <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                      {heroArticle.summary}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Sub Featured Cards (1 col stack) */}
          <div className="space-y-4">
            {subFeatured.map(item => (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="group flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500/50 transition-all h-[calc(50%-0.5rem)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-normal">
                    {item.summary}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                  <span className="flex items-center text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                    Read Story <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid: News Feed + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* News Feed (2 Cols) */}
        <div className="lg:col-span-2">
          <HomeFeedFilter articles={sortedArticles} />
        </div>

        {/* Right-Hand Sidebar (1 Col) */}
        <div className="space-y-6">
          {/* Sidebar Ad Placement */}
          <AdBanner slot="sidebar" provider="adsterra" />

          {/* Trending Topics Widget */}
          <TrendingSidebar />

          {/* Newsletter Signup Widget */}
          <NewsletterWidget />
        </div>
      </div>
    </div>
  );
}
