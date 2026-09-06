'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES, Article } from '@/lib/data';
import { AdBanner } from '@/components/ads/AdBanner';
import { ChevronRight } from 'lucide-react';

interface HomeFeedFilterProps {
  articles: Article[];
}

export function HomeFeedFilter({ articles }: HomeFeedFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredFeed = selectedCategory === 'all'
    ? articles
    : articles.filter(a => a.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="space-y-6">
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
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
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
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
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
                <Image
                  src={article.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'}
                  alt={article.title || 'Article thumbnail'}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, 192px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs z-10">
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
  );
}
