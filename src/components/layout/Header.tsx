'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Menu, X, ShieldAlert, TrendingUp } from 'lucide-react';
import { CATEGORIES, Article, getArticles } from '@/lib/data';

export const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const allArticles = getArticles();
      const query = searchQuery.toLowerCase();
      const filtered = allArticles.filter(
        a =>
          a.title.toLowerCase().includes(query) ||
          a.summary.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query)
      );
      setSearchResults(filtered);
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Utility Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              AI AUTOMATED AGENT ONLINE
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/admin" className="flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              N
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-serif leading-none">
                Nex<span className="text-blue-600 dark:text-blue-500">news</span>
              </span>
              <span className="text-[10px] font-sans font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
                AI Autonomous Feed
              </span>
            </div>
          </Link>
        </div>

        {/* Live Search Bar */}
        <div className="relative flex-1 max-w-md hidden md:block" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search breaking news, AI updates, market trends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length > 1 && setIsSearching(true)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Search Dropdown Results */}
          {isSearching && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="p-2 divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Found {searchResults.length} articles
                  </div>
                  {searchResults.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.slug}`}
                      onClick={() => setIsSearching(false)}
                      className="block p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {item.category}
                        </span>
                        <span className="text-xs text-slate-400">{item.readTime}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {item.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-slate-500">
                  No articles found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Category Navigation */}
      <nav className="border-t border-slate-100 dark:border-slate-800/80 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-1 font-semibold text-sm py-1">
            <li>
              <Link
                href="/"
                className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors inline-block"
              >
                Top Stories
              </Link>
            </li>
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <Link
                  href={`/category/${cat.toLowerCase()}`}
                  className="px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors inline-block"
                >
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Top Stories
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/category/${cat.toLowerCase()}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {cat}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 font-bold"
              >
                <Sparkles className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
