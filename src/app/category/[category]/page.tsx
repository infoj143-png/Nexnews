import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORIES, Category, getArticlesByCategory } from '@/lib/data';
import { AdBanner } from '@/components/ads/AdBanner';
import { TrendingSidebar } from '@/components/widgets/TrendingSidebar';
import { NewsletterWidget } from '@/components/widgets/NewsletterWidget';
import { Clock, ChevronRight, Sparkles, Folder } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({
    category: cat.toLowerCase(),
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const categoryName = resolvedParams.category;
  const capitalized = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

  return {
    title: `${capitalized} News & Updates`,
    description: `Latest breaking ${capitalized} news, in-depth analysis, and AI automated insights on Nexnews.`,
    openGraph: {
      title: `${capitalized} News - Nexnews`,
      description: `Explore top stories and real-time coverage in ${capitalized}.`,
    }
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = await params;
  const categoryName = resolvedParams.category;
  const matchedCategory = CATEGORIES.find(
    c => c.toLowerCase() === categoryName.toLowerCase()
  );

  if (!matchedCategory) {
    notFound();
  }

  const articles = getArticlesByCategory(matchedCategory);

  return (
    <div className="space-y-8">
      {/* Category Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-10 border border-slate-800 relative overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Folder className="w-4 h-4" />
              <span>Category Channel</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-serif tracking-tight">
              {matchedCategory} News
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-xl">
              Real-time automated reporting, deep-dive articles, and market updates for {matchedCategory}.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 w-fit">
            <Sparkles className="w-4 h-4" />
            <span>{articles.length} Stories Published</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {articles.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 font-medium">No articles found in {matchedCategory} right now.</p>
            </div>
          ) : (
            articles.map((article, index) => (
              <React.Fragment key={article.id}>
                <article className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-500/40 transition-all shadow-xs flex flex-col sm:flex-row gap-6">
                  <div className="sm:w-52 h-44 sm:h-36 shrink-0 rounded-xl overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{article.author.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <Link href={`/news/${article.slug}`}>
                        <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-snug transition-colors">
                          {article.title}
                        </h3>
                      </Link>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-[11px] text-slate-400">{article.readTime}</span>
                      <Link
                        href={`/news/${article.slug}`}
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 text-xs"
                      >
                        Read Story <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>

                {index === 1 && (
                  <AdBanner slot="in-article" provider="monetag" className="my-6" />
                )}
              </React.Fragment>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AdBanner slot="sidebar" provider="adsterra" />
          <TrendingSidebar />
          <NewsletterWidget />
        </div>
      </div>
    </div>
  );
}
