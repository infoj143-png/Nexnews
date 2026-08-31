import { NextResponse } from 'next/server';
import { addArticle, Category, slugify } from '@/lib/data';
import { requireAdminAuth } from '@/lib/auth';

export async function POST(request: Request) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json();
    const topic = body.topic || 'Breakthrough in AI and Automated Technology Systems';
    const category: Category = body.category || 'AI';

    const title = topic.length > 10 && !topic.includes('\n')
      ? topic
      : `AI Synthesis Report: ${topic}`;

    const slug = slugify(title);

    const summary = `An automated AI in-depth analysis detailing key breakthroughs, market consequences, and expert perspectives regarding "${topic}".`;

    const content = `
      <p class="mb-4 font-serif text-lg leading-relaxed"><strong>AUTOMATED AI DISPATCH</strong> — Recent intelligence reports highlight major movements in the field of <strong>${topic}</strong>. Industry observers note a rapid shift in strategic focus as organizations adapt to newly available capability frameworks.</p>

      <h2 class="text-2xl font-bold mt-6 mb-3">Core Insights & Technological Drivers</h2>
      <p class="mb-4">Analysis of real-time market data indicates an acceleration in deployment timelines across enterprise sectors. Key performance indicators show an estimated 35% gain in operational efficiency following initial integration phases.</p>

      <blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-gray-700 font-serif">
        "The convergence of automated reasoning and domain-specific knowledge models represents a fundamental leap in how software systems analyze real-world events."
      </blockquote>

      <h2 class="text-2xl font-bold mt-6 mb-3">Future Outlook & Market Predictions</h2>
      <p class="mb-4">As technological maturity increases over subsequent quarters, global markets are expected to see expanded multi-sector adoption, with regulatory bodies actively developing updated policy guidelines.</p>
    `;

    const categoryImages: Record<Category, string> = {
      AI: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      Tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      World: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      Business: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
      Sports: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80'
    };

    const newArticle = addArticle({
      title,
      slug,
      summary,
      content,
      category,
      author: {
        name: 'Nexnews AI Synthesizer',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
        role: 'Autonomous AI Content Engine'
      },
      publishedAt: new Date().toISOString(),
      readTime: '3 min read',
      imageUrl: categoryImages[category] || categoryImages.Tech,
      imageCaption: `AI-generated visual representation for ${topic}`,
      isFeatured: false,
      isTrending: true,
      isBreaking: true,
      status: 'published',
      tags: [category, 'AI-Generated', 'Automated', 'Breaking'],
      aiGenerated: true
    });

    return NextResponse.json({
      success: true,
      article: newArticle,
      message: 'Article synthesized and auto-published successfully.'
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
