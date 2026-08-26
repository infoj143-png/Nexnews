'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  FileText,
  Sparkles,
  TrendingUp,
  DollarSign,
  Plus,
  Trash2,
  Eye,
  Edit3,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  Search,
  Zap,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Article, CATEGORIES, Category, getAnalytics, getArticles, slugify } from '@/lib/data';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'ai-generator' | 'ad-settings'>('overview');
  const [articles, setArticles] = useState<Article[]>([]);
  const [analytics, setAnalytics] = useState(getAnalytics());
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // AI Generator Form state
  const [topicInput, setTopicInput] = useState('');
  const [targetCategory, setTargetCategory] = useState<Category>('Tech');
  const [generating, setGenerating] = useState(false);
  const [genSuccessMsg, setGenSuccessMsg] = useState('');

  // Manual / Edit Form state
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchArticles = () => {
    setIsRefreshing(true);
    const data = getArticles();
    setArticles([...data]);
    setAnalytics(getAnalytics());
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Filtered article list
  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          a.author.name.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || a.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Handle article deletion
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const updated = articles.filter(a => a.id !== id);
      setArticles(updated);
      // mutate initial memory array
      fetchArticles();
    }
  };

  // Trigger AI Generation Action
  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;

    setGenerating(true);
    setGenSuccessMsg('');

    try {
      const res = await fetch('/api/generate-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput,
          category: targetCategory
        })
      });
      const data = await res.json();
      if (data.success && data.article) {
        setGenSuccessMsg(`Successfully generated and published: "${data.article.title}"`);
        setTopicInput('');
        fetchArticles();
      }
    } catch (err) {
      console.error(err);
      setGenSuccessMsg('Error triggering AI generation API.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Admin Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Protected Admin Operations Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif">Nexnews CMS & Automation</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitor traffic metrics, manage articles, and trigger AI auto-publishing workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchArticles}
            className={`px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-all ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Data</span>
          </button>
          <button
            onClick={() => setActiveTab('ai-generator')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Auto-Generate News</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'articles'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Articles Management ({articles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ai-generator')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'ai-generator'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>AI News Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('ad-settings')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'ad-settings'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Ad Network Settings</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS CARDS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pageviews</span>
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Eye className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                {analytics.totalViews.toLocaleString()}
              </h3>
              <p className="text-[11px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +18.4% from last week
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Published Articles</span>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                {analytics.publishedCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">100% indexed on search</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Drafts & Queued</span>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                {analytics.draftCount}
              </h3>
              <p className="text-[11px] text-amber-500 font-semibold mt-1">AI Agent Queue Active</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Ad Revenue</span>
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                ${analytics.estimatedRevenue.toLocaleString()}
              </h3>
              <p className="text-[11px] text-purple-500 font-semibold mt-1">Adsterra & Monetag combined</p>
            </div>
          </div>

          {/* Traffic Breakdown Visual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" /> Daily Traffic Trend (7 Days)
              </h4>
              <div className="space-y-3">
                {analytics.viewsByDay.map(day => (
                  <div key={day.date} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <span>{day.date}</span>
                      <span>{day.views.toLocaleString()} views</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${(day.views / 35000) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" /> Category Distribution
              </h4>
              <div className="space-y-4">
                {analytics.categoryDistribution.map(cat => (
                  <div key={cat.category} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{cat.category}</span>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                      {cat.count} Articles
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ARTICLE MANAGEMENT TABLE */}
      {activeTab === 'articles' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {/* Table Search & Filters */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c.toLowerCase()}>{c}</option>
                ))}
              </select>

              <button
                onClick={() => setActiveTab('ai-generator')}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> New Article
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Title & Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Views</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredArticles.map(article => (
                  <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 max-w-xs sm:max-w-md">
                      <div className="flex items-center gap-2">
                        {article.aiGenerated && (
                          <span className="p-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 shrink-0" title="AI Generated">
                            <Sparkles className="w-3 h-3" />
                          </span>
                        )}
                        <Link href={`/news/${article.slug}`} className="font-bold text-slate-900 dark:text-white hover:text-blue-500 transition-colors line-clamp-1">
                          {article.title}
                        </Link>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Published {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                        {article.category}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                      {article.author.name}
                    </td>
                    <td className="p-4 font-mono font-bold">
                      {article.views.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {article.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/news/${article.slug}`}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:text-blue-600 transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AI NEWS GENERATOR FORM */}
      {activeTab === 'ai-generator' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-purple-600 text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                Autonomous AI Article Generator
              </h3>
              <p className="text-xs text-slate-400">
                Input any topic or headline to trigger full article synthesis, SEO tagging, and auto-publishing.
              </p>
            </div>
          </div>

          {genSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-900/40 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{genSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleGenerateAI} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Topic / Target Headline
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Breakthrough in Fusion Energy Efficiency Achieved by MIT Researchers"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Target Category
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value as Category)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  AI Model Target
                </label>
                <input
                  type="text"
                  disabled
                  value="GPT-5 Neural Synthesizer (v2.5)"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Article & SEO Tags...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Generate & Auto-Publish Article</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: AD SETTINGS */}
      {activeTab === 'ad-settings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <span>Adsterra, Monetag & Google AdSense Configuration</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure external script IDs without introducing CLS layout shifts on frontend page renders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">Adsterra Settings</span>
              <input
                type="text"
                defaultValue="at_script_982341_header.js"
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400">Injected on Leaderboard (728x90) banner slot.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400">Monetag Settings</span>
              <input
                type="text"
                defaultValue="monetag_native_feed_99.js"
                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400">Injected on In-Article feed slot.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
