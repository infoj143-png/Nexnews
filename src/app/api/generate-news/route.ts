import { NextResponse } from 'next/server';
import { addArticle, Category, slugify } from '@/lib/data';
import { requireAdminAuth } from '@/lib/auth';

const categoryImages: Record<Category, string> = {
  AI: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  Tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  World: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  Business: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
  Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80'
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'should', 'could', 'can', 'may', 'might', 'must', 'shall', 'this', 'that', 'these',
  'those', 'trending', 'search', 'analysis', 'news', 'vs', 'versus', 'live', 'today',
  '2024', '2025', '2026', '2027', 'day', 'match', 'scorecard', 'update', 'updates'
]);

function extractKeywords(title: string, topic: string): string[] {
  const combined = `${topic} ${title}`;
  const cleaned = combined.replace(/[^\w\s]/g, ' ');
  const words = cleaned.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()) && !/^\d+$/.test(w));
  const uniqueWords: string[] = [];
  const seen = new Set<string>();
  for (const w of words) {
    if (!seen.has(w.toLowerCase())) {
      seen.add(w.toLowerCase());
      uniqueWords.push(w);
    }
  }
  const queries: string[] = [];
  if (uniqueWords.length >= 3) queries.push(uniqueWords.slice(0, 3).join(' '));
  if (uniqueWords.length >= 2) queries.push(uniqueWords.slice(0, 2).join(' '));
  if (uniqueWords.length >= 1) queries.push(uniqueWords[0]);
  return Array.from(new Set(queries));
}

async function fetchArticleImage(title: string, topic: string, category: Category): Promise<{ url: string; caption: string }> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const pexelsKey = process.env.PEXELS_API_KEY;
  const queries = extractKeywords(title, topic);

  for (const q of queries) {
    if (unsplashKey) {
      try {
        const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=3&orientation=landscape`, {
          headers: { 'Authorization': `Client-ID ${unsplashKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            console.log(`[+] [IMAGE SEARCH] Found keyword image via Unsplash API for '${q}'`);
            return { url: data.results[0].urls.regular, caption: `Visual representation for ${title} (${q})` };
          }
        }
      } catch (err) {
        console.warn(`[-] [IMAGE SEARCH] Unsplash API error for '${q}':`, err);
      }
    }

    if (pexelsKey) {
      try {
        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=3&orientation=landscape`, {
          headers: { 'Authorization': pexelsKey }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.photos && data.photos.length > 0) {
            console.log(`[+] [IMAGE SEARCH] Found keyword image via Pexels API for '${q}'`);
            return { url: data.photos[0].src.landscape || data.photos[0].src.large2x, caption: `Visual representation for ${title} (${q})` };
          }
        }
      } catch (err) {
        console.warn(`[-] [IMAGE SEARCH] Pexels API error for '${q}':`, err);
      }
    }

    try {
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|mime&format=json`, {
        headers: { 'User-Agent': 'NexnewsBot/1.0 (https://nexnews.vercel.app)' }
      });
      if (res.ok) {
        const data = await res.json();
        const pages = data.query?.pages || {};
        for (const pid of Object.keys(pages)) {
          const ii = pages[pid].imageinfo;
          if (ii && ii.length > 0) {
            const imgUrl = ii[0].url;
            const mime = ii[0].mime;
            if (['image/jpeg', 'image/png', 'image/webp'].includes(mime) && !['.svg', '.tif', 'coin.jpg', 'logo', 'icon', 'map'].some(x => imgUrl.toLowerCase().includes(x))) {
              console.log(`[+] [IMAGE SEARCH] Found keyword image via Wikimedia for '${q}'`);
              return { url: imgUrl, caption: `Media coverage visual for ${title}` };
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[-] [IMAGE SEARCH] Wikimedia search error for '${q}':`, err);
    }
  }

  const defaultUrl = categoryImages[category] || categoryImages.Tech;
  console.log(`[-] [IMAGE SEARCH] Keyword search failed/returned no results for '${queries[0] || topic}'. Falling back to '${category}' category default: ${defaultUrl}`);
  return { url: defaultUrl, caption: `Category visual for ${title}` };
}

const VALID_CATEGORIES: Category[] = ['Tech', 'World', 'Business', 'AI', 'Sports'];

function sanitizePromptInput(input: string, maxLength: number = 300): string {
  if (!input) return '';
  let sanitized = input
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/["`\\]/g, '')
    .replace(/ignore previous instructions/gi, '')
    .replace(/system prompt/gi, '')
    .replace(/you are an ai/gi, '')
    .trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

function validateArticleOutput(data: unknown): boolean {
  if (!data || typeof data !== 'object' || data === null) return false;

  const articleObj = data as Record<string, unknown>;
  const { title, summary, content, category } = articleObj;

  if (typeof title !== 'string' || title.trim().length < 5) return false;
  if (typeof summary !== 'string' || summary.trim().length < 5) return false;
  if (typeof content !== 'string' || content.trim().length < 20) return false;
  if (category && typeof category === 'string' && !(VALID_CATEGORIES as string[]).includes(category)) return false;

  // Basic heuristic check for echoed injection / prompt hijacking
  const contentLower = content.toLowerCase();
  const suspiciousPatterns = [
    'as an ai',
    'i cannot fulfill',
    'system prompt',
    'ignore all previous',
    'jailbreak',
    '<script'
  ];

  for (const pattern of suspiciousPatterns) {
    if (contentLower.includes(pattern)) {
      console.warn(`[DEFENSIVE CHECK] Article generation rejected due to suspicious pattern: "${pattern}"`);
      return false;
    }
  }

  return true;
}

interface GeneratedArticleData {
  title?: string;
  slug?: string;
  category?: Category;
  summary?: string;
  content?: string;
  tags?: string[];
}

async function callGeminiApi(topic: string, category: Category, apiKey: string): Promise<GeneratedArticleData | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = `You are a senior news journalist at Nexnews.
Create a factual, engaging, and SEO-optimized news article based on this topic:
TOPIC: "${topic}"
TARGET CATEGORY: "${category}"

Mandates:
1. Do NOT invent fake numerical statistics or fake quotes.
2. Structure the HTML using <p class="mb-4">, <h2 class="text-2xl font-bold mt-6 mb-3">, <h3 class="text-xl font-semibold mt-4 mb-2">, <ul class="list-disc pl-6 my-4 space-y-2">, and <blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">.
3. Categorize into one of: "Tech", "World", "Business", "AI", "Sports".

Return ONLY a valid JSON object matching this schema:
{
  "title": "Engaging article title",
  "slug": "url-friendly-slug",
  "category": "${category}",
  "summary": "1-2 sentence executive summary",
  "content": "HTML string containing h2, h3, p, ul, blockquote",
  "tags": ["Tag1", "Tag2", "Tag3"]
}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  const cleaned = rawText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(cleaned);
  return validateArticleOutput(parsed) ? parsed : null;
}

async function callOpenAiApi(topic: string, category: Category, apiKey: string): Promise<GeneratedArticleData | null> {
  const url = 'https://api.openai.com/v1/chat/completions';
  const prompt = `You are a senior news journalist at Nexnews. Create an article based on:
TOPIC: "${topic}"
CATEGORY: "${category}"

Do NOT invent fake statistics or quotes. Include h2, h3, p, ul, blockquote HTML elements.
Return ONLY a valid JSON object:
{
  "title": "Article title",
  "slug": "url-friendly-slug",
  "category": "${category}",
  "summary": "1-2 sentence summary",
  "content": "HTML string containing h2, h3, p, ul, blockquote",
  "tags": ["Tag1", "Tag2"]
}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API returned status ${response.status}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) return null;

  const parsed = JSON.parse(rawText.trim());
  return validateArticleOutput(parsed) ? parsed : null;
}

export async function POST(request: Request) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json();
    const rawTopic = body.topic?.trim() || 'Breakthrough in AI and Automated Technology Systems';
    const topic = sanitizePromptInput(rawTopic, 300);
    const category: Category = (typeof body.category === 'string' && (VALID_CATEGORIES as string[]).includes(body.category))
      ? (body.category as Category)
      : 'AI';

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let generatedData: GeneratedArticleData | null = null;
    let apiErrorMsg = '';

    if (geminiKey) {
      try {
        generatedData = await callGeminiApi(topic, category, geminiKey);
      } catch (err) {
        apiErrorMsg = err instanceof Error ? err.message : 'Gemini API call failed';
      }
    }

    if (!generatedData && openaiKey) {
      try {
        generatedData = await callOpenAiApi(topic, category, openaiKey);
      } catch (err) {
        apiErrorMsg += (apiErrorMsg ? '; ' : '') + (err instanceof Error ? err.message : 'OpenAI API call failed');
      }
    }

    if (!generatedData || !generatedData.title || !generatedData.content) {
      return NextResponse.json(
        {
          success: false,
          error: `AI Article Generation Failed: ${apiErrorMsg || 'Generated output failed schema validation or prompt injection checks.'}`
        },
        { status: 500 }
      );
    }

    const title = generatedData.title.trim();
    const slug = slugify(generatedData.slug || title);
    const summary = generatedData.summary?.trim() || title;
    const content = generatedData.content.trim();
    const finalCategory = (generatedData.category && VALID_CATEGORIES.includes(generatedData.category))
      ? generatedData.category
      : category;
    const tags = Array.isArray(generatedData.tags) && generatedData.tags.length > 0
      ? generatedData.tags
      : [finalCategory, 'AI-Generated', 'News'];

    const { url: imageUrl, caption: imageCaption } = await fetchArticleImage(title, topic, finalCategory);

    const newArticle = addArticle({
      title,
      slug,
      summary,
      content,
      category: finalCategory,
      author: {
        name: 'Nexnews AI Synthesizer',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
        role: 'Autonomous AI Content Engine'
      },
      publishedAt: new Date().toISOString(),
      readTime: '4 min read',
      imageUrl,
      imageCaption,
      isFeatured: false,
      isTrending: true,
      isBreaking: true,
      status: 'published',
      tags,
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
