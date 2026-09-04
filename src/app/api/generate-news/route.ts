import { NextResponse } from 'next/server';
import { addArticle, Category, slugify } from '@/lib/data';
import { requireAdminAuth } from '@/lib/auth';

const categoryImagePools: Record<Category, string[]> = {
  AI: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?auto=format&fit=crop&w=1200&q=80',
  ],
  Tech: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
  ],
  World: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80',
  ],
  Business: [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
  ],
  Sports: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
  ]
};

function getCategoryFallbackImage(category: Category, headline: string = ''): string {
  const pool = categoryImagePools[category] || categoryImagePools.Tech;
  if (!headline) return pool[0];
  let hash = 0;
  for (let i = 0; i < headline.length; i++) {
    hash = (hash << 5) - hash + headline.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % pool.length;
  return pool[idx];
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'should', 'could', 'can', 'may', 'might', 'must', 'shall', 'this', 'that', 'these',
  'those', 'trending', 'search', 'analysis', 'news', 'vs', 'versus', 'live', 'today',
  'yesterday', 'tomorrow', '2024', '2025', '2026', '2027', '2028', 'day', 'days',
  'month', 'months', 'week', 'weeks', 'year', 'years', 'time', 'schedule', 'update',
  'updates', 'updated', 'start', 'starts', 'started', 'starting', 'later', 'earlier',
  'usual', 'unusual', 'delay', 'delayed', 'delays', 'release', 'releases', 'released',
  'releasing', 'launch', 'launches', 'launched', 'launching', 'announce', 'announces',
  'announced', 'announcing', 'unveil', 'unveils', 'unveiled', 'leak', 'leaks', 'leaked',
  'rumor', 'rumors', 'report', 'reports', 'reported', 'says', 'say', 'according',
  'pre', 'post', 'order', 'orders', 'price', 'cost', 'buy', 'sale', 'sales', 'stock',
  'shares', 'market', 'deal', 'best', 'worst', 'high', 'low', 'big', 'more', 'most',
  'show', 'shows', 'watch', 'match', 'game', 'scorecard', 'win', 'wins', 'won', 'lost',
  'loss', 'beat', 'beats', 'box', 'office', 'weekend', 'gross', 'earns', 'earned',
  'pro', 'max', 'mini', 'plus', 'ultra', 'lite', 'first', 'second', 'new', 'latest',
  'top', 'hn', 'opentie', 'openxwa', 'breaking', 'than', 'then', 'other', 'another',
  'each', 'every', 'some', 'any', 'all', 'both', 'few', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'too', 'very', 'just'
]);

const SYNONYMS: Record<string, string[]> = {
  iphone: ['iphone', 'apple', 'smartphone', 'mobile', 'ios'],
  ipad: ['ipad', 'apple', 'tablet'],
  macbook: ['macbook', 'apple', 'laptop'],
  nvidia: ['nvidia', 'chip', 'gpu', 'semiconductor', 'technology', 'ai'],
  dune: ['dune', 'movie', 'film', 'cinema', 'theater', 'poster', 'actor'],
  cricket: ['cricket', 'stadium', 'match', 'batsman', 'bowler', 'wicket', 'sports'],
  india: ['india', 'cricket', 'indian', 'stadium', 'delhi', 'mumbai'],
  australia: ['australia', 'cricket', 'australian', 'stadium', 'sydney', 'melbourne']
};

function extractKeywords(title: string, topic: string, category: Category): { queries: string[]; coreEntities: string[] } {
  const combined = `${topic} ${title}`.trim();
  const words = combined.split(/\s+/);

  const properNouns: string[] = [];
  let currentPn: string[] = [];

  for (const w of words) {
    const cleanW = w.replace(/[^\w-]/g, '');
    if (!cleanW) continue;
    const cleanLower = cleanW.toLowerCase();
    if ((/^[A-Z]/.test(cleanW) || /\d/.test(cleanW) || cleanLower === 'vs') && !STOP_WORDS.has(cleanLower)) {
      currentPn.push(cleanW);
    } else {
      if (currentPn.length > 0) {
        properNouns.push(currentPn.join(' '));
        currentPn = [];
      }
    }
  }
  if (currentPn.length > 0) {
    properNouns.push(currentPn.join(' '));
  }

  const cleanedAll = combined.replace(/[^\w\s]/g, ' ');
  const meaningful = cleanedAll.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()) && !/^\d+$/.test(w));

  const coreEntities: string[] = [];
  const queries: string[] = [];

  for (const pn of properNouns) {
    const pnWords = pn.split(/\s+/).filter(w => !STOP_WORDS.has(w.toLowerCase()) || ['vs', 'iphone', 'ipad', 'macbook'].includes(w.toLowerCase()));
    if (pnWords.length > 0) {
      const cleanPn = pnWords.join(' ');
      if (cleanPn.length > 2) {
        queries.push(cleanPn);
        for (const w of pnWords) {
          if (!STOP_WORDS.has(w.toLowerCase()) && w.length > 2 && !/^\d+$/.test(w)) {
            coreEntities.push(w.toLowerCase());
          }
        }
      }
    }
  }

  for (const m of meaningful) {
    if (!coreEntities.includes(m.toLowerCase())) {
      coreEntities.push(m.toLowerCase());
    }
  }

  const primaryEntity = coreEntities[0] || '';
  if (primaryEntity) {
    if (primaryEntity === 'iphone') {
      queries.unshift('iPhone smartphone');
    } else if (primaryEntity === 'dune') {
      queries.unshift('Dune movie');
    } else if (category === 'Sports' || ['india', 'australia', 'test'].includes(primaryEntity)) {
      queries.unshift((coreEntities.includes('india') || coreEntities.includes('australia')) ? 'India vs Australia cricket' : `${primaryEntity.charAt(0).toUpperCase() + primaryEntity.slice(1)} cricket`);
    } else if (['Tech', 'AI'].includes(category) && primaryEntity === 'nvidia') {
      queries.unshift('Nvidia technology');
    }
  }

  if (coreEntities.length >= 2) {
    queries.push(coreEntities.slice(0, 2).map(e => e.charAt(0).toUpperCase() + e.slice(1)).join(' '));
  }
  if (coreEntities.length >= 1) {
    queries.push(coreEntities[0].charAt(0).toUpperCase() + coreEntities[0].slice(1));
  }

  const seen = new Set<string>();
  const finalQueries: string[] = [];
  for (const q of queries) {
    const qNorm = q.toLowerCase().trim();
    if (qNorm && !seen.has(qNorm)) {
      seen.add(qNorm);
      finalQueries.push(q);
    }
  }

  const uniqueEntities = Array.from(new Set(coreEntities));
  return { queries: finalQueries, coreEntities: uniqueEntities };
}

function isImageRelevant(imgMetadata: string, coreEntities: string[], category: Category): boolean {
  if (!imgMetadata) return false;
  const metaLower = imgMetadata.toLowerCase();

  // Disambiguation for movie/entertainment titles (e.g. Dune movie vs sand dune)
  const movieContext = ['movie', 'film', 'cinema', 'theater', 'poster', 'actor', 'hollywood', 'box office', 'director'].some(m => metaLower.includes(m));
  if (coreEntities.includes('dune') && !movieContext) {
    return false;
  }

  if (coreEntities.length > 0) {
    for (const entity of coreEntities) {
      const entLower = entity.toLowerCase();
      if (entLower.length >= 3 && metaLower.includes(entLower)) {
        return true;
      }
      const syns = SYNONYMS[entLower] || [];
      for (const syn of syns) {
        if (metaLower.includes(syn)) {
          return true;
        }
      }
    }
    return false;
  }

  const categoryKeywords: Record<Category, string[]> = {
    Tech: ['technology', 'tech', 'phone', 'computer', 'device', 'electronic', 'chip', 'software', 'gadget'],
    AI: ['ai', 'robot', 'chip', 'technology', 'artificial', 'computing', 'network'],
    Sports: ['sport', 'stadium', 'cricket', 'ball', 'match', 'player', 'arena'],
    Business: ['business', 'finance', 'market', 'office', 'company', 'trade'],
    World: ['world', 'global', 'news', 'city', 'movie', 'film', 'cinema']
  };

  const catWords = categoryKeywords[category] || [];
  for (const cw of catWords) {
    if (metaLower.includes(cw)) {
      return true;
    }
  }

  return false;
}

async function fetchArticleImage(title: string, topic: string, category: Category): Promise<{ url: string; caption: string }> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const pexelsKey = process.env.PEXELS_API_KEY;
  const { queries, coreEntities } = extractKeywords(title, topic, category);

  console.log(`[+] [IMAGE SEARCH] Title: '${title}' | Category: '${category}'`);
  console.log(`[+] [IMAGE SEARCH] Extracted search queries: ${JSON.stringify(queries)}`);
  console.log(`[+] [IMAGE SEARCH] Core entity terms: ${JSON.stringify(coreEntities)}`);

  for (const q of queries) {
    if (unsplashKey) {
      try {
        console.log(`[+] [IMAGE SEARCH] Querying Unsplash API with query: '${q}'`);
        const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=3&orientation=landscape`, {
          headers: { 'Authorization': `Client-ID ${unsplashKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          const results = data.results || [];
          for (const photo of results) {
            const imgUrl = photo.urls?.regular;
            const alt = photo.alt_description || photo.description || '';
            const metadata = alt;
            if (imgUrl && isImageRelevant(metadata, coreEntities, category)) {
              console.log(`[+] [IMAGE SEARCH] Unsplash result accepted for '${q}': '${alt}' -> ${imgUrl}`);
              return { url: imgUrl, caption: `Visual representation for ${title} (${q})` };
            } else {
              console.log(`[-] [IMAGE SEARCH] Unsplash result rejected by relevance check for query '${q}': '${alt}'`);
            }
          }
        }
      } catch (err) {
        console.warn(`[-] [IMAGE SEARCH] Unsplash API error for '${q}':`, err);
      }
    }

    if (pexelsKey) {
      try {
        console.log(`[+] [IMAGE SEARCH] Querying Pexels API with query: '${q}'`);
        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=3&orientation=landscape`, {
          headers: { 'Authorization': pexelsKey }
        });
        if (res.ok) {
          const data = await res.json();
          const photos = data.photos || [];
          for (const photo of photos) {
            const imgUrl = photo.src?.landscape || photo.src?.large2x || photo.src?.large;
            const alt = photo.alt || photo.url || '';
            const metadata = alt;
            if (imgUrl && isImageRelevant(metadata, coreEntities, category)) {
              console.log(`[+] [IMAGE SEARCH] Pexels result accepted for '${q}': '${alt}' -> ${imgUrl}`);
              return { url: imgUrl, caption: `Visual representation for ${title} (${q})` };
            } else {
              console.log(`[-] [IMAGE SEARCH] Pexels result rejected by relevance check for query '${q}': '${alt}'`);
            }
          }
        }
      } catch (err) {
        console.warn(`[-] [IMAGE SEARCH] Pexels API error for '${q}':`, err);
      }
    }

    try {
      console.log(`[+] [IMAGE SEARCH] Querying Wikimedia Commons API with query: '${q}'`);
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
            const pageTitle = pages[pid].title || '';
            const metadata = `${pageTitle} ${imgUrl}`;
            if (['image/jpeg', 'image/png', 'image/webp'].includes(mime) && !['.svg', '.tif', 'coin.jpg', 'logo', 'icon', 'map'].some(x => imgUrl.toLowerCase().includes(x))) {
              if (isImageRelevant(metadata, coreEntities, category)) {
                console.log(`[+] [IMAGE SEARCH] Wikimedia result accepted for '${q}': '${pageTitle}' -> ${imgUrl}`);
                return { url: imgUrl, caption: `Media coverage visual for ${title}` };
              } else {
                console.log(`[-] [IMAGE SEARCH] Wikimedia result rejected by relevance check for query '${q}': '${pageTitle}'`);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[-] [IMAGE SEARCH] Wikimedia search error for '${q}':`, err);
    }
  }

  const defaultUrl = getCategoryFallbackImage(category, title);
  console.log(`[-] [IMAGE SEARCH] Keyword search failed/returned no relevant results for '${queries[0] || topic}'. Falling back to '${category}' category fallback pool: ${defaultUrl}`);
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

    const newArticle = await addArticle({
      title,
      slug,
      summary,
      content,
      category: finalCategory,
      author: {
        name: 'Nexnews Desk',
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
