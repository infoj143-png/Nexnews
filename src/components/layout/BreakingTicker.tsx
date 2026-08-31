'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, Zap } from 'lucide-react';
import { Article } from '@/lib/data';

interface BreakingTickerProps {
  articles?: Article[];
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({ articles = [] }) => {
  const breakingNews = articles.filter(a => a.isBreaking || a.isTrending);

  if (breakingNews.length === 0) return null;

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto flex items-center">
        {/* Ticker Badge */}
        <div className="bg-red-600 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-2.5 flex items-center gap-1.5 shrink-0 z-10 shadow-md">
          <Zap className="w-3.5 h-3.5 fill-white animate-pulse" />
          <span>BREAKING NEWS</span>
        </div>

        {/* Marquee Track Container */}
        <div className="relative overflow-hidden flex-1 py-2 text-sm">
          <div className="inline-flex whitespace-nowrap animate-marquee items-center gap-8 pl-4">
            {breakingNews.concat(breakingNews).map((item, idx) => (
              <Link
                key={`${item.id}-${idx}`}
                href={`/news/${item.slug}`}
                className="inline-flex items-center gap-2 hover:text-blue-400 transition-colors group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 group-hover:bg-blue-400 transition-colors" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-wide">
                  [{item.category}]
                </span>
                <span className="font-medium text-slate-200 group-hover:underline">
                  {item.title}
                </span>
                <span className="text-xs text-slate-500 ml-2">•</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-400 bg-slate-950/60 border-l border-slate-800 shrink-0">
          <Flame className="w-3.5 h-3.5 fill-amber-400" />
          <span>LIVE FEED</span>
        </div>
      </div>
    </div>
  );
};
