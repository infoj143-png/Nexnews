export type Category = 'Tech' | 'World' | 'Business' | 'AI' | 'Sports';

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: Category;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedAt: string;
  readTime: string;
  imageUrl: string;
  imageCaption?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isBreaking?: boolean;
  views: number;
  status: 'published' | 'draft' | 'archived';
  tags: string[];
  aiGenerated?: boolean;
}

export interface AnalyticsData {
  totalArticles: number;
  publishedCount: number;
  draftCount: number;
  aiGeneratedCount: number;
  manualCount: number;
  categoryDistribution: { category: Category; count: number }[];
}

export interface CronLog {
  id: string;
  timestamp: string;
  status: 'success' | 'error' | 'unauthorized';
  message: string;
  details?: Record<string, unknown>;
}

export const CATEGORIES: Category[] = ['Tech', 'World', 'Business', 'AI', 'Sports'];

let initialArticles: Article[] = [];

function getArticlesDirectory(): { articlesDir: string; fs: typeof import('fs'); path: typeof import('path') } | null {
  if (typeof window !== 'undefined') {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');

    const candidates = [
      path.join(process.cwd(), 'data', 'articles'),
      path.resolve(process.cwd(), '..', 'data', 'articles'),
      path.join(__dirname, '..', '..', '..', 'data', 'articles'),
      path.join(__dirname, '..', '..', 'data', 'articles'),
    ];
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) {
          return { articlesDir: candidate, fs, path };
        }
      } catch (err) {
        console.error(`[getArticlesDirectory] Error checking candidate directory path "${candidate}":`, err);
      }
    }
    console.error('[getArticlesDirectory] No valid articles directory found among candidates:', candidates);
  } catch (err) {
    console.error('[getArticlesDirectory] Error resolving module or candidates:', err);
    return null;
  }
  return null;
}

// Helper to safely load JSON files from data/articles directory on server
export function loadFileSystemArticles(): Article[] {
  if (typeof window !== 'undefined') {
    return [];
  }
  try {
    const res = getArticlesDirectory();
    if (!res) {
      console.error('[loadFileSystemArticles] Failed to locate articles directory (getArticlesDirectory returned null).');
      return [];
    }
    const { articlesDir, fs, path } = res;
    let files: string[];
    try {
      files = fs.readdirSync(articlesDir);
    } catch (readdirErr) {
      console.error(`[loadFileSystemArticles] Error reading directory "${articlesDir}":`, readdirErr);
      return [];
    }
    const articles: Article[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(articlesDir, file);
        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(raw);
          if (parsed && parsed.slug && parsed.title) {
            articles.push(parsed);
          } else {
            console.error(`[loadFileSystemArticles] Invalid article schema in file "${filePath}": missing slug or title.`);
          }
        } catch (fileErr) {
          console.error(`[loadFileSystemArticles] Error reading or parsing file "${filePath}":`, fileErr);
        }
      }
    }
    return articles;
  } catch (err) {
    console.error('[loadFileSystemArticles] Error loading file system articles:', err);
    return [];
  }
}

// Helper functions to manage state in memory and filesystem
export function getAllArticles(): Article[] {
  const fsArticles = loadFileSystemArticles();
  const fsSlugs = new Set(fsArticles.map(a => a.slug));
  const memoryOnly = initialArticles.filter(a => !fsSlugs.has(a.slug));
  const combined = [...fsArticles, ...memoryOnly];
  return combined.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getArticles(): Article[] {
  return getAllArticles().filter(a => a.status === 'published');
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getArticles().find(a => a.slug === slug);
}

export function getArticlesByCategory(category: Category): Article[] {
  return getArticles().filter(a => a.category.toLowerCase() === category.toLowerCase());
}

export function searchArticles(query: string): Article[] {
  const q = query.toLowerCase();
  return getArticles().filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.summary.toLowerCase().includes(q) ||
    a.tags.some(t => t.toLowerCase().includes(q))
  );
}

import { sanitizeHtml } from './sanitize';
import { saveArticleToGitHub, deleteArticleFromGitHub } from './github';

/**
 * Adds an article to in-memory state, attempts local disk write, and commits the JSON
 * file to GitHub via REST API for serverless persistence on Vercel.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return typeof slug === 'string' && slug.length > 0 && slug.length <= 200 && SLUG_PATTERN.test(slug);
}

export async function addArticle(article: Omit<Article, 'id' | 'views'>): Promise<Article> {
  if (!isValidSlug(article.slug)) {
    throw new Error(`Invalid slug format: '${article.slug}'`);
  }
  const sanitizedContent = sanitizeHtml(article.content);
  const newArticle: Article = {
    ...article,
    content: sanitizedContent,
    id: Date.now().toString(),
    views: 0,
  };
  initialArticles = [newArticle, ...initialArticles];

  if (typeof window === 'undefined') {
    try {
      const res = getArticlesDirectory();
      if (res) {
        const { articlesDir, fs, path } = res;
        const filePath = path.join(articlesDir, `${newArticle.slug}.json`);
        fs.writeFileSync(filePath, JSON.stringify(newArticle, null, 2), 'utf8');
      }
    } catch (err) {
      console.error('[addArticle] Local disk write notice (expected in read-only serverless environment):', err);
    }

    try {
      await saveArticleToGitHub(newArticle);
    } catch (ghErr) {
      console.error('[addArticle] Failed to save article to GitHub:', ghErr);
    }
  }

  return newArticle;
}

export function updateArticle(id: string, updates: Partial<Article>): Article | null {
  const index = initialArticles.findIndex(a => a.id === id);
  if (index === -1) return null;
  initialArticles[index] = { ...initialArticles[index], ...updates };
  return initialArticles[index];
}

export async function deleteArticle(id: string): Promise<boolean> {
  // Reminder: if this slug/article may be indexed by search engines, add a redirect in next.config.ts
  let deleted = false;
  let targetSlug: string | null = null;

  const targetArticle = initialArticles.find(a => a.id === id || a.slug === id);
  if (targetArticle) {
    targetSlug = targetArticle.slug;
  }

  const initialLen = initialArticles.length;
  initialArticles = initialArticles.filter(a => a.id !== id && a.slug !== id);
  if (initialArticles.length < initialLen) {
    deleted = true;
  }

  if (typeof window === 'undefined') {
    try {
      const res = getArticlesDirectory();
      if (res) {
        const { articlesDir, fs, path } = res;
        const files = fs.readdirSync(articlesDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(articlesDir, file);
            const raw = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed && (parsed.id === id || parsed.slug === id)) {
              if (!targetSlug && parsed.slug) {
                targetSlug = parsed.slug;
              }
              try {
                fs.unlinkSync(filePath);
              } catch (unlinkErr) {
                console.error('[deleteArticle] Local disk unlink notice:', unlinkErr);
              }
              deleted = true;
            }
          }
        }
      }
    } catch (err) {
      console.error('Error deleting file article:', err);
    }

    const slugToDelete = targetSlug || id;
    console.log(`[deleteArticle] Deleting article '${slugToDelete}'. Note: if this slug may be indexed by search engines, add a redirect in next.config.ts.`);
    try {
      const ghDeleted = await deleteArticleFromGitHub(slugToDelete);
      if (ghDeleted) {
        deleted = true;
      }
    } catch (ghErr) {
      console.error('[deleteArticle] Failed to delete article from GitHub:', ghErr);
    }
  }
  return deleted;
}

export function slugify(text: string): string {
  if (!text) return '';
  const decoded = text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  return decoded
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200)
    .replace(/^-+|-+$/g, '');
}

export function getAnalytics(): AnalyticsData {
  const articles = getAllArticles();
  const totalArticles = articles.length;
  const publishedCount = articles.filter(a => a.status === 'published').length;
  const draftCount = articles.filter(a => a.status === 'draft').length;
  const aiGeneratedCount = articles.filter(a => a.aiGenerated).length;
  const manualCount = articles.filter(a => !a.aiGenerated).length;

  const categoryDistribution = CATEGORIES.map(cat => ({
    category: cat,
    count: articles.filter(a => a.category === cat).length
  }));

  return {
    totalArticles,
    publishedCount,
    draftCount,
    aiGeneratedCount,
    manualCount,
    categoryDistribution
  };
}

let initialCronLogs: CronLog[] = [
  {
    id: 'log-initial-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'success',
    message: 'Autonomous news article generated and auto-published live successfully.',
    details: {
      source: {
        title: 'OpenAI Unveils GPT-5',
        sourceName: 'TechCrunch RSS',
        link: 'https://techcrunch.com/sample'
      },
      articleId: '1',
      articleTitle: 'OpenAI Unveils GPT-5: A Quantum Leap in Autonomous Reasoning and Multimodal Intelligence'
    }
  }
];

export function getCronLogs(): CronLog[] {
  return initialCronLogs;
}

export function addCronLog(log: Omit<CronLog, 'id' | 'timestamp'> & { timestamp?: string }): CronLog {
  const newLog: CronLog = {
    ...log,
    id: `cron-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: log.timestamp || new Date().toISOString()
  };
  initialCronLogs = [newLog, ...initialCronLogs];
  return newLog;
}

export function clearCronLogs(): boolean {
  initialCronLogs = [];
  return true;
}
