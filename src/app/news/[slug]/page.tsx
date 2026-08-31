import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getArticles, getArticlesByCategory } from '@/lib/data';
import { sanitizeHtml } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
import { AdBanner } from '@/components/ads/AdBanner';
import { TrendingSidebar } from '@/components/widgets/TrendingSidebar';
import { NewsletterWidget } from '@/components/widgets/NewsletterWidget';
import { ArticleActions } from '@/components/article/ArticleActions';
import { Clock, Eye, Sparkles, ChevronLeft, Calendar, User, Tag } from 'lucide-react';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const articles = getArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const article = getArticleBySlug(resolvedParams.slug);

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be located on Nexnews.',
    };
  }

  const articleUrl = `https://nexnews-nu.vercel.app/news/${article.slug}`;

  return {
    title: article.title,
    description: article.summary,
    authors: [{ name: article.author.name }],
    openGraph: {
      title: article.title,
      description: article.summary,
      url: articleUrl,
      siteName: 'Nexnews',
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      tags: article.tags,
      images: [
        {
          url: article.imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
      images: [article.imageUrl],
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  const article = getArticleBySlug(resolvedParams.slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getArticlesByCategory(article.category)
    .filter(a => a.id !== article.id)
    .slice(0, 3);

  return (
    <article className="space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <span>/</span>
        <Link href={`/category/${article.category.toLowerCase()}`} className="hover:text-blue-600 transition-colors">
          {article.category}
        </Link>
        <span>/</span>
        <span className="text-slate-400 line-clamp-1 max-w-xs">{article.title}</span>
      </nav>

      {/* Main Grid: Article Body (2 cols) + Sidebar (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Article Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-blue-600 text-white">
                {article.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-serif text-slate-900 dark:text-white leading-tight">
              {article.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic border-l-4 border-blue-600 pl-4 py-1">
              {article.summary}
            </p>

            {/* Author Metadata Header Card */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-3">
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-blue-500"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{article.author.name}</h4>
                  <p className="text-xs text-slate-500">{article.author.role}</p>
                </div>
              </div>

              <div className="flex flex-col items-end text-xs text-slate-400 font-medium gap-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {article.readTime}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-blue-500 font-semibold">
                    <Eye className="w-3.5 h-3.5" /> {article.views.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Featured Hero Image */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-sm">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-auto max-h-[460px] object-cover"
            />
            {article.imageCaption && (
              <p className="p-3 text-xs text-slate-400 text-center bg-slate-900/90 italic">
                {article.imageCaption}
              </p>
            )}
          </div>

          {/* Top In-Article Ad Placement */}
          <AdBanner slot="in-article" provider="monetag" />

          {/* HTML Article Content */}
          <div
            className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-base leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mr-1">
              <Tag className="w-3.5 h-3.5" /> Tags:
            </span>
            {article.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Bottom In-Article Ad Placement */}
          <AdBanner slot="in-article" provider="adsterra" />

          {/* Interactive Share & Comments */}
          <ArticleActions title={article.title} summary={article.summary} slug={article.slug} />

          {/* Related Articles Carousel/Grid */}
          {relatedArticles.length > 0 && (
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                More in {article.category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedArticles.map(rel => (
                  <Link
                    key={rel.id}
                    href={`/news/${rel.slug}`}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 hover:border-blue-500/40 transition-all flex flex-col justify-between"
                  >
                    <div className="h-28 rounded-lg overflow-hidden mb-2 relative">
                      <img
                        src={rel.imageUrl}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-500 line-clamp-2 leading-snug">
                      {rel.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 mt-2 block">{rel.readTime}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <AdBanner slot="sidebar" provider="google-adsense" />
          <TrendingSidebar />
          <NewsletterWidget />
        </div>
      </div>
    </article>
  );
}
