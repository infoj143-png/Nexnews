import { NextResponse } from 'next/server';
import { addArticle, Category } from '@/lib/data';
import { fetchTrendingNewsItem } from '@/lib/news-fetcher';
import { generateGeoOptimizedNewsArticle } from '@/lib/ai-generator';

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
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing CRON_SECRET authorization.' },
        { status: 401 }
      );
    }

    // 2. Fetch trending topic / RSS item
    const trendingItem = await fetchTrendingNewsItem();

    // 3. Generate GEO-optimized content using Gemini AI
    const generatedArticle = await generateGeoOptimizedNewsArticle(trendingItem);

    // 4. Auto-publish & persist to storage
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

    return NextResponse.json({
      success: true,
      message: 'Autonomous news article generated and auto-published live successfully.',
      source: {
        title: trendingItem.title,
        sourceName: trendingItem.source,
        link: trendingItem.link
      },
      article: publishedArticle,
      timestamp: new Date().toISOString()
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown pipeline error';
    console.error('Autonomous Content Pipeline Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
