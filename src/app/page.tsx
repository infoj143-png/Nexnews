'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES, Category, getArticles, Article } from '@/lib/data';
import { AdBanner } from '@/components/ads/AdBanner';
import { TrendingSidebar } from '@/components/widgets/TrendingSidebar';
import { NewsletterWidget } from '@/components/widgets/NewsletterWidget';
import { Clock, Eye, Sparkles, ChevronRight, Zap, Filter } from 'lucide-react';

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>(() => getArticles());

  useEffect(() => {
    fetch('/api/articles')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.articles)) {
          setArticles(data.articles);
        }
      })
      .catch(err => console.error('Error fetching articles:', err));
  }, []);

  const featuredArticles = articles.filter(a => a.isFeatured).slice(0, 3);
  const heroArticle = featuredArticles[0] || articles[0];
  const subFeatured = featuredArticles.slice(1);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredFeed = selectedCategory === 'all'
    ? articles
    : articles.filter(a => a.category.toLowerCase() === selectedCategory.toLowerCase());

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
          <span className="text-xs text-slate-400 font-medium">Curated by AI Neural Engine</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hero Main Big Card (2 cols) */}
          {heroArticle && (
            <div className="lg:col-span-2 group">
              <Link href={`/news/${heroArticle.slug}`} className="block relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                <div className="relative h-72 sm:h-96 w-full overflow-hidden">
                  <img
                    src={heroArticle.imageUrl}
                    alt={heroArticle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
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
                    {item.aiGenerated && (
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3" /> AI Generated
                      </span>
                    )}
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
        <div className="lg:col-span-2 space-y-6">
          {/* Feed Filter Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <span>Latest News Feed</span>
            </h2>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                All Stories
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat.toLowerCase())}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Article Stream */}
          <div className="space-y-4">
            {filteredFeed.map((article, index) => (
              <React.Fragment key={article.id}>
                <article className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-blue-500/40 transition-all shadow-xs flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="sm:w-48 h-40 sm:h-32 shrink-0 rounded-xl overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                      {article.category}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{article.author.name}</span>
                        <span>•</span>
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{article.readTime}</span>
                      </div>

                      <Link href={`/news/${article.slug}`}>
                        <h3 className="text-base sm:text-lg font-bold font-serif text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-snug transition-colors">
                          {article.title}
                        </h3>
                      </Link>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        {article.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <Link
                        href={`/news/${article.slug}`}
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 text-xs"
                      >
                        Read Full Article <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>

                {/* Inject In-Article Ad after 2nd item */}
                {index === 1 && (
                  <AdBanner slot="in-article" provider="monetag" className="my-6" />
                )}
              </React.Fragment>
            ))}
          </div>
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
