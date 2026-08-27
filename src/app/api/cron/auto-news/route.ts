import { NextResponse } from 'next/server';
import { addArticle, addCronLog, Category, Article } from '@/lib/data';
import { fetchTrendingNewsItem } from '@/lib/news-fetcher';
import { generateGeoOptimizedNewsArticle } from '@/lib/ai-generator';
import fs from 'fs';
import path from 'path';

const CATEGORY_IMAGES: Record<Category, string> = {
  AI: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  Tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  World: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  Business: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
  Sports: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80'
};

function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // If no secret is set in environment (e.g. dev mode), allow execution
  if (!cronSecret) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') === cronSecret) {
    return true;
  }

  return false;
}

interface CommitResult {
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  filePath?: string;
  error?: string;
}

async function commitArticleToGitHub(article: Article): Promise<CommitResult> {
  const token = process.env.GITHUB_TOKEN || process.env.GH_PAT;
  if (!token) {
    return {
      success: false,
      error: 'Missing GitHub Personal Access Token (GITHUB_TOKEN or GH_PAT environment variable not set).'
    };
  }

  const repoFullName = process.env.GITHUB_REPOSITORY || 'infoj143-png/Nexnews';
  const filePath = `data/articles/${article.slug}.json`;
  const apiUrl = `https://api.github.com/repos/${repoFullName}/contents/${filePath}`;

  const jsonContent = JSON.stringify(article, null, 2);
  const base64Content = Buffer.from(jsonContent, 'utf-8').toString('base64');

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Nexnews-AutoNews-Pipeline',
    'Content-Type': 'application/json'
  };

  let existingSha: string | undefined = undefined;

  // Check if file already exists in repository to get its SHA
  try {
    const checkRes = await fetch(apiUrl, { headers });
    if (checkRes.ok) {
      const existingFile = await checkRes.json();
      if (existingFile && existingFile.sha) {
        existingSha = existingFile.sha;
      }
    }
  } catch (err) {
    console.warn('Could not check existing file SHA on GitHub:', err);
  }

  const commitBody: Record<string, any> = {
    message: `feat(auto-news): publish generated article "${article.title}"`,
    content: base64Content
  };

  if (existingSha) {
    commitBody.sha = existingSha;
  }

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify(commitBody)
  });

  const putData = await putRes.json();

  if (!putRes.ok) {
    const errorMsg = putData.message || `GitHub API error (${putRes.status})`;
    return {
      success: false,
      error: errorMsg
    };
  }

  return {
    success: true,
    commitSha: putData.commit?.sha,
    commitUrl: putData.commit?.html_url,
    filePath: putData.content?.path || filePath
  };
}

// Local filesystem fallback sync so server seamlessly detects the article
function saveArticleToLocalFs(article: Article) {
  try {
    const dir = path.join(process.cwd(), 'data', 'articles');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${article.slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(article, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Local filesystem write notice:', err);
  }
}

export async function GET(request: Request) {
  return handleAutonomousPipeline(request);
}

export async function POST(request: Request) {
  return handleAutonomousPipeline(request);
}

async function handleAutonomousPipeline(request: Request) {
  try {
    // 1. Verify Cron authorization
    if (!verifyCronSecret(request)) {
      const authError = 'Unauthorized: Invalid or missing CRON_SECRET authorization.';
      addCronLog({
        status: 'unauthorized',
        message: authError,
        details: {
          url: request.url,
          headers: Object.fromEntries(request.headers.entries())
        }
      });
      return NextResponse.json(
        { success: false, error: authError },
        { status: 401 }
      );
    }

    // 2. Fetch trending topic / RSS item
    const trendingItem = await fetchTrendingNewsItem();

    // 3. Generate GEO-optimized content using Gemini AI
    const generatedArticle = await generateGeoOptimizedNewsArticle(trendingItem);

    // 4. Auto-publish & persist to memory
    const publishedArticle = addArticle({
      title: generatedArticle.title,
      slug: generatedArticle.slug,
      summary: generatedArticle.excerpt,
      content: generatedArticle.content,
      category: generatedArticle.category,
      author: {
        name: 'Nexnews Autonomous Engine',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
        role: 'Autonomous GEO Publishing Pipeline'
      },
      publishedAt: new Date().toISOString(),
      readTime: '4 min read',
      imageUrl: CATEGORY_IMAGES[generatedArticle.category] || CATEGORY_IMAGES.Tech,
      imageCaption: `AI visual representation generated for "${generatedArticle.title}"`,
      isFeatured: true,
      isTrending: true,
      isBreaking: true,
      status: 'published',
      tags: generatedArticle.tags,
      aiGenerated: true
    });

    // 5. Save locally so current server process seamlessly detects new file
    saveArticleToLocalFs(publishedArticle);

    // 6. Commit directly to GitHub repository via REST API
    const commitResult = await commitArticleToGitHub(publishedArticle);

    const sourceInfo = {
      title: trendingItem.title,
      sourceName: trendingItem.source,
      link: trendingItem.link
    };

    if (!commitResult.success) {
      const commitFailMessage = `Article generated but GitHub commit failed: ${commitResult.error}`;
      addCronLog({
        status: 'error',
        message: commitFailMessage,
        details: {
          source: sourceInfo,
          articleId: publishedArticle.id,
          articleTitle: publishedArticle.title,
          articleSlug: publishedArticle.slug,
          category: publishedArticle.category,
          githubError: commitResult.error
        }
      });

      return NextResponse.json({
        success: false,
        message: commitFailMessage,
        source: sourceInfo,
        article: publishedArticle,
        githubError: commitResult.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    const successMessage = 'Autonomous news article generated and committed directly to GitHub repository successfully.';
    addCronLog({
      status: 'success',
      message: successMessage,
      details: {
        source: sourceInfo,
        articleId: publishedArticle.id,
        articleTitle: publishedArticle.title,
        articleSlug: publishedArticle.slug,
        category: publishedArticle.category,
        commitSha: commitResult.commitSha,
        commitUrl: commitResult.commitUrl,
        filePath: commitResult.filePath
      }
    });

    return NextResponse.json({
      success: true,
      message: successMessage,
      source: sourceInfo,
      article: publishedArticle,
      commit: {
        sha: commitResult.commitSha,
        url: commitResult.commitUrl,
        path: commitResult.filePath
      },
      timestamp: new Date().toISOString()
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown pipeline error';
    console.error('Autonomous Content Pipeline Error:', err);

    addCronLog({
      status: 'error',
      message: `Cron job execution failed: ${errorMessage}`,
      details: {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
