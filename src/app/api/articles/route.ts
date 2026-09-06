import { NextResponse } from 'next/server';
import { getArticles, getAllArticles, addArticle, deleteArticle, getAnalytics, isValidSlug, slugify } from '@/lib/data';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const auth = requireAdminAuth(request);
  const isAdmin = auth.authenticated;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const category = searchParams.get('category');

  let articles = isAdmin ? getAllArticles() : getArticles();

  if (query) {
    const q = query.toLowerCase();
    articles = articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (category) {
    articles = articles.filter(a => a.category.toLowerCase() === category.toLowerCase());
  }

  const rawAnalytics = getAnalytics();
  const analytics = isAdmin ? rawAnalytics : {
    totalArticles: articles.length,
    publishedCount: articles.length,
    draftCount: 0,
    aiGeneratedCount: articles.filter(a => a.aiGenerated).length,
    manualCount: articles.filter(a => !a.aiGenerated).length,
    categoryDistribution: rawAnalytics.categoryDistribution
  };

  return NextResponse.json({
    success: true,
    count: articles.length,
    articles,
    analytics
  });
}

export async function POST(request: Request) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json().catch(() => ({}));

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body.' },
        { status: 400 }
      );
    }

    if (!body.title || typeof body.title !== 'string' ||
        !body.content || typeof body.content !== 'string' ||
        !body.category || typeof body.category !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Title, content, and category are required and must be strings.' },
        { status: 400 }
      );
    }

    let slug: string;
    if (body.slug) {
      if (!isValidSlug(body.slug)) {
        return NextResponse.json(
          { success: false, error: 'Invalid article slug format.' },
          { status: 400 }
        );
      }
      slug = body.slug;
    } else {
      slug = slugify(body.title);
      if (!isValidSlug(slug)) {
        return NextResponse.json(
          { success: false, error: 'Failed to generate valid slug from title.' },
          { status: 400 }
        );
      }
    }

    const newArticle = await addArticle({
      title: body.title,
      slug,
      summary: body.summary || body.title,
      content: body.content,
      category: body.category,
      author: body.author || {
        name: 'Nexnews Desk',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
        role: 'Automated AI Desk'
      },
      publishedAt: new Date().toISOString(),
      readTime: body.readTime || '3 min read',
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      imageCaption: body.imageCaption,
      isFeatured: body.isFeatured || false,
      isTrending: body.isTrending || false,
      isBreaking: body.isBreaking || false,
      status: 'published',
      tags: body.tags || [body.category, 'News'],
      aiGenerated: body.aiGenerated ?? true
    });

    return NextResponse.json({
      success: true,
      article: newArticle
    }, { status: 201 });
  } catch (err: unknown) {
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction
      ? 'Failed to process article request.'
      : (err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Article ID required' }, { status: 400 });
    }

    const success = await deleteArticle(id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction
      ? 'Failed to delete article.'
      : (err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
