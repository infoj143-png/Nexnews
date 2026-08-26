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
  AlertCircle,
  Lock,
  LogOut,
  PenTool
} from 'lucide-react';
import { Article, CATEGORIES, Category, getAnalytics, getArticles, slugify } from '@/lib/data';

export default function AdminDashboardPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'manual-publish' | 'ai-generator' | 'ad-settings'>('overview');
  const [articles, setArticles] = useState<Article[]>([]);
  const [analytics, setAnalytics] = useState(getAnalytics());
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('nexnews_admin_auth');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem('nexnews_admin_auth', 'true');
        setIsAuthenticated(true);
        setPasswordInput('');
      } else {
        setLoginError(data.error || 'Invalid admin password');
      }
    } catch {
      setLoginError('Authentication failed. Please check network connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('nexnews_admin_auth');
    setIsAuthenticated(false);
  };

  // AI Generator Form state
  const [topicInput, setTopicInput] = useState('');
  const [targetCategory, setTargetCategory] = useState<Category>('Tech');
  const [generating, setGenerating] = useState(false);
  const [genSuccessMsg, setGenSuccessMsg] = useState('');

  // Manual Article Publishing Form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState<Category>('Tech');
  const [manualContent, setManualContent] = useState('');
  const [manualSummary, setManualSummary] = useState('');
  const [manualAuthorName, setManualAuthorName] = useState('');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [publishingManual, setPublishingManual] = useState(false);
  const [manualSuccessMsg, setManualSuccessMsg] = useState('');
  const [manualErrorMsg, setManualErrorMsg] = useState('');

  // Manual / Edit Form state
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handlePublishManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualContent.trim()) {
      setManualErrorMsg('Title and Content are required.');
      return;
    }

    setPublishingManual(true);
    setManualSuccessMsg('');
    setManualErrorMsg('');

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle.trim(),
          category: manualCategory,
          content: manualContent.trim().includes('<p>')
            ? manualContent.trim()
            : manualContent.trim().split('\n\n').map(p => `<p class="mb-4">${p}</p>`).join(''),
          summary: manualSummary.trim() || manualTitle.trim(),
          author: {
            name: manualAuthorName.trim() || 'Admin Publisher',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            role: 'Editorial Desk'
          },
          imageUrl: manualImageUrl.trim() || undefined,
          aiGenerated: false
        })
      });

      const data = await res.json();
      if (data.success && data.article) {
        setManualSuccessMsg(`Article "${data.article.title}" published live successfully!`);
        setManualTitle('');
        setManualContent('');
        setManualSummary('');
        setManualImageUrl('');
        setManualAuthorName('');
        fetchArticles();
      } else {
        setManualErrorMsg(data.error || 'Failed to publish article.');
      }
    } catch (err) {
      console.error(err);
      setManualErrorMsg('Error sending article to server.');
    } finally {
      setPublishingManual(false);
    }
  };

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black font-serif text-slate-900 dark:text-white">Admin Operations Access</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This route is restricted. Please enter your administrator password to continue.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Unlock Admin Portal</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

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
            Monitor real article metrics, publish manual stories, and oversee AI automation pipelines.
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
          <button
            onClick={handleLogout}
            className="px-3.5 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 font-semibold text-xs flex items-center gap-1.5 border border-red-800/80 transition-all"
            title="Lock Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
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
          onClick={() => setActiveTab('manual-publish')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'manual-publish'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PenTool className="w-4 h-4 text-emerald-400" />
          <span>Manual Publish</span>
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

      {/* TAB 1: OVERVIEW & REAL METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Published Stories</span>
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                {analytics.publishedCount}
              </h3>
              <p className="text-[11px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live on public site
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Automated Stories</span>
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                {analytics.aiGeneratedCount}
              </h3>
              <p className="text-[11px] text-purple-500 font-semibold mt-1">Generated via AI engine</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manual Publications</span>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <PenTool className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                {analytics.manualCount}
              </h3>
              <p className="text-[11px] text-emerald-500 font-semibold mt-1">Written by site owner</p>
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
              <p className="text-[11px] text-amber-500 font-semibold mt-1">Agent queue active</p>
            </div>
          </div>

          {/* Real Metrics Indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" /> Category Article Breakdown
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

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" /> System & Automation Status
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  All automated RSS sync and AI background routines are operational. Content is indexed instantly.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Vercel Cron Routine (/api/cron/auto-news)</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Gemini 2.5 AI Generation Pipeline</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Operational
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs">
                <span className="font-bold text-blue-700 dark:text-blue-300 block mb-1">Articles Count Summary</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Total published article count is currently <strong>{analytics.publishedCount}</strong> stories (<strong>{analytics.aiGeneratedCount}</strong> AI-generated, <strong>{analytics.manualCount}</strong> manually published).
                </p>
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
                onClick={() => setActiveTab('manual-publish')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> Write Article
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
                  <th className="p-4">Source Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredArticles.map(article => (
                  <tr key={article.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 max-w-xs sm:max-w-md">
                      <div className="flex items-center gap-2">
                        {article.aiGenerated ? (
                          <span className="p-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 shrink-0" title="AI Generated">
                            <Sparkles className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 shrink-0" title="Manual Publish">
                            <PenTool className="w-3 h-3" />
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
                    <td className="p-4">
                      {article.aiGenerated ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          AI Automated
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Manual
                        </span>
                      )}
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

      {/* TAB 3: MANUAL ARTICLE PUBLISHER FORM */}
      {activeTab === 'manual-publish' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
                Manual Article Publisher
              </h3>
              <p className="text-xs text-slate-400">
                Write or paste an article to publish directly to Nexnews live alongside automated stories.
              </p>
            </div>
          </div>

          {manualSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-900/40 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{manualSuccessMsg}</span>
            </div>
          )}

          {manualErrorMsg && (
            <div className="p-4 rounded-xl bg-red-900/40 border border-red-500 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{manualErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handlePublishManual} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Article Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Breakthrough Summit Highlights Next Steps in Technology and Clean Energy"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value as Category)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Author Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Editorial Board / Jane Doe"
                  value={manualAuthorName}
                  onChange={(e) => setManualAuthorName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Summary / Excerpt (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary sentence that appears on home cards and search previews..."
                value={manualSummary}
                onChange={(e) => setManualSummary(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Cover Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Leave blank to automatically assign an optimal high-resolution photo based on chosen category.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Article Content Body <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={8}
                required
                placeholder="Write or paste your article text here..."
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={publishingManual}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {publishingManual ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Publishing Story Live...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Article Live</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: AI NEWS GENERATOR FORM */}
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
