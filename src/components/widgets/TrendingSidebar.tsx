'use client';

import React from 'react';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import { getArticles } from '@/lib/data';

export const TrendingSidebar: React.FC = () => {
  const articles = getArticles();
  const trending = articles.filter(a => a.isTrending).slice(0, 5);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base font-serif">
          <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span>Trending Topics</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
          REAL-TIME
        </span>
      </div>

      <div className="space-y-4">
        {trending.map((item, idx) => (
          <Link
            key={item.id}
            href={`/news/${item.slug}`}
            className="group flex items-start gap-3.5 pb-3.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0 last:pb-0"
          >
            <span className="text-2xl font-black text-slate-300 dark:text-slate-700 group-hover:text-blue-600 transition-colors font-mono w-6 text-center shrink-0">
              0{idx + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                  {item.category}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-snug transition-colors line-clamp-2">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                <span>{item.views.toLocaleString()} views</span>
                <span>•</span>
                <span>{item.readTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
