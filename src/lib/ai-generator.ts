import { GoogleGenAI } from '@google/genai';
import { Category, slugify } from './data';
import { TrendingNewsItem } from './news-fetcher';

export interface GeneratedArticleResult {
  title: string;
  slug: string;
  category: Category;
  excerpt: string;
  content: string;
  tags: string[];
  aiGenerated: boolean;
}

export async function generateGeoOptimizedNewsArticle(
  newsItem: TrendingNewsItem
): Promise<GeneratedArticleResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  const trendingKeyword = newsItem.trendingKeyword || newsItem.title;
  const approxTraffic = newsItem.approxTraffic || 'High Search Volume';
  const headline = newsItem.headline || newsItem.title;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are an expert SEO editor and senior news journalist at Nexnews.
Create an in-depth, authoritative, highly engaging, and search-intent-optimized news article based on this real-time trending search query:

TARGET TRENDING SEARCH KEYWORD: "${trendingKeyword}"
ESTIMATED SEARCH DEMAND: "${approxTraffic}"
BREAKING HEADLINE / CONTEXT: "${headline}"
SOURCE DISPATCH: "${newsItem.source}"
SUMMARY CONTEXT: "${newsItem.description}"
TARGET CATEGORY: "${newsItem.category}"

### SEARCH INTENT & SEO / GEO OPTIMIZATION MANDATES:
1. Primary Keyword Targeting: The title, slug, and opening paragraph must naturally integrate the target search keyword "${trendingKeyword}" to satisfy real-time user search demand.
2. User Intent Resolution: Resolve the search query immediately in the lead section by explaining the core event, key players, and significance.
3. Structural Layout: Use clear <h2> and <h3> HTML tags for structural scanning and rapid indexation.
4. Metric & Fact Summaries: Include <ul> bullet point lists containing statistical data, metrics, or timeline facts for quick extraction by search engines and AI engines (Google Search, Gemini, ChatGPT, Perplexity).
5. Search Intent FAQ: Include a dedicated "Key Questions Answered" or FAQ section using <h3> headings answering high-intent questions about "${trendingKeyword}".
6. HTML Class Styling: Wrap paragraphs in <p class="mb-4">, headings in <h2 class="text-2xl font-bold mt-6 mb-3"> or <h3 class="text-xl font-semibold mt-4 mb-2">, lists in <ul class="list-disc pl-6 my-4 space-y-2">, and blockquotes in <blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">.

Return ONLY a valid JSON object matching this schema:
{
  "title": "SEO-rich, high-CTR headline containing target search terms",
  "slug": "url-friendly-slug-lowercase",
  "category": "Tech" | "World" | "Business" | "AI" | "Sports",
  "excerpt": "A concise 1-2 sentence executive summary optimized for search snippets and AI overviews",
  "content": "Complete article HTML content containing h2, h3, p, ul, blockquote, direct answer sections",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text;
      if (responseText) {
        // Clean potential markdown code blocks if returned
        const cleanedJsonText = responseText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsed = JSON.parse(cleanedJsonText);

        const validCategories: Category[] = ['Tech', 'World', 'Business', 'AI', 'Sports'];
        const category: Category = validCategories.includes(parsed.category)
          ? parsed.category
          : newsItem.category;

        return {
          title: parsed.title || newsItem.title,
          slug: parsed.slug ? slugify(parsed.slug) : slugify(parsed.title || newsItem.title),
          category,
          excerpt: parsed.excerpt || newsItem.description,
          content: parsed.content,
          tags: Array.isArray(parsed.tags) && parsed.tags.length > 0
            ? parsed.tags
            : [category, 'GEO-Optimized', 'AI-Generated', 'Breaking News'],
          aiGenerated: true
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed or encountered error, falling back to GEO fallback generator:', err);
    }
  }

  // Fallback GEO-optimized news generator when API key is not present or API call fails
  return generateFallbackGeoArticle(newsItem);
}

function generateFallbackGeoArticle(newsItem: TrendingNewsItem): GeneratedArticleResult {
  const trendingKeyword = newsItem.trendingKeyword || newsItem.title;
  const headline = newsItem.headline || newsItem.title;
  const title = headline;
  const slug = slugify(title);
  const category = newsItem.category;
  const traffic = newsItem.approxTraffic || 'High Search Volume';
  const excerpt = `Search trend report on "${trendingKeyword}" (${traffic}): Analysis of key developments, search intent insights, and market impact.`;

  const content = `
    <p class="mb-4 font-serif text-lg leading-relaxed"><strong>AUTOMATED AI SEARCH TREND REPORT</strong> — Search engine indices report surging interest for <strong>"${trendingKeyword}"</strong> (${traffic}). This comprehensive analysis explores breaking coverage, search intent metrics, and strategic market takeaways.</p>

    <h2 class="text-2xl font-bold mt-6 mb-3">Executive Summary & Search Intent Metrics</h2>
    <p class="mb-4">Digital search telemetry highlights significant query velocity for <strong>${title}</strong> across major platforms.</p>

    <ul class="list-disc pl-6 my-4 space-y-2">
      <li><strong>Search Volume Demand:</strong> Registered ${traffic} in query traffic over recent monitoring windows.</li>
      <li><strong>Coverage Context:</strong> ${newsItem.description || title}</li>
      <li><strong>Source Attribution:</strong> Dispatched via ${newsItem.source}.</li>
      <li><strong>Search Intent Classification:</strong> Informational and news discovery intent.</li>
    </ul>

    <blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">
      "Aligning content with real-time Google search trends and Generative Engine Optimization standards maximizes organic reach and search index visibility."
    </blockquote>

    <h2 class="text-2xl font-bold mt-6 mb-3">Key Questions Answered (Search Query Resolution)</h2>

    <h3 class="text-xl font-semibold mt-4 mb-2">Why is "${trendingKeyword}" seeing high search interest?</h3>
    <p class="mb-4">Surging queries for "${trendingKeyword}" stem from breaking news developments, as detailed in reports by ${newsItem.source}.</p>

    <h3 class="text-xl font-semibold mt-4 mb-2">What key insights should readers note?</h3>
    <p class="mb-4">This trending topic indicates key industry shifts and audience engagement, reflecting broader interest in current developments.</p>

    <h2 class="text-2xl font-bold mt-6 mb-3">Strategic Outlook</h2>
    <p class="mb-4">As search demand evolves, Nexnews continues monitoring real-time telemetry and indexation indicators for "${trendingKeyword}".</p>
  `;

  return {
    title,
    slug,
    category,
    excerpt,
    content,
    tags: [category, trendingKeyword, 'Search-Trend', 'GEO-Optimized', 'Breaking News'],
    aiGenerated: true
  };
}
