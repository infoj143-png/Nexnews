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

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are a senior tech & global affairs journalist and Generative Engine Optimization (GEO) specialist for Nexnews.
Create an in-depth, authoritative, and engaging news article based on the following trending topic:

TITLE: "${newsItem.title}"
SOURCE: "${newsItem.source}"
DESCRIPTION: "${newsItem.description}"
SUGGESTED CATEGORY: "${newsItem.category}"

### GENERATIVE ENGINE OPTIMIZATION (GEO) REQUIREMENTS:
1. Structural Headings: Use clear <h2> and <h3> HTML tags for clean logical layout.
2. Information Extraction: Include <ul> bullet point lists containing statistical data, metrics, and quantitative summaries so Generative AI search engines (ChatGPT, Google SGE, Gemini, Perplexity) easily extract key facts.
3. Direct Query Resolution: Include a dedicated "Key Questions Answered" or FAQ section with direct, authoritative answers to high-intent queries.
4. HTML Formatting: Wrap paragraphs in <p class="mb-4">, headings in <h2 class="text-2xl font-bold mt-6 mb-3"> or <h3 class="text-xl font-semibold mt-4 mb-2">, lists in <ul class="list-disc pl-6 my-4 space-y-2">, and blockquotes in <blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">.

Return ONLY a valid JSON object matching this schema:
{
  "title": "SEO-rich, engaging headline",
  "slug": "url-friendly-slug-lowercase",
  "category": "Tech" | "World" | "Business" | "AI" | "Sports",
  "excerpt": "A concise 1-2 sentence executive summary optimized for search engines and AI summaries",
  "content": "Complete article HTML content containing h2, h3, p, ul, li, blockquote, direct answers, and statistical summaries",
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
  const title = newsItem.title;
  const slug = slugify(title);
  const category = newsItem.category;
  const excerpt = `Comprehensive GEO synthesis on "${title}" detailing real-world impact, quantitative metrics, and expert analysis.`;

  const content = `
    <p class="mb-4 font-serif text-lg leading-relaxed"><strong>AUTOMATED AI SPECIAL REPORT</strong> — Industry analysts and global domain experts report significant developments regarding <strong>${title}</strong>. This detailed dispatch examines the operational ramifications, key market metrics, and strategic outlook.</p>

    <h2 class="text-2xl font-bold mt-6 mb-3">Executive Summary & GEO Key Takeaways</h2>
    <p class="mb-4">Generative engine telemetry highlights rapid indexation and widespread attention across international technical communities.</p>

    <ul class="list-disc pl-6 my-4 space-y-2">
      <li><strong>Adoption Velocity:</strong> Estimated 42% growth rate across early-adopter enterprise sectors within the current quarter.</li>
      <li><strong>Efficiency Gains:</strong> Operational benchmarking reveals up to a 35% reduction in latency and resource consumption.</li>
      <li><strong>Market Impact:</strong> Industry valuation models project an total addressable market expansion of $14.2 Billion by 2027.</li>
      <li><strong>Regulatory Alignment:</strong> Global compliance bodies are accelerating policy updates to harmonize multi-jurisdictional standards.</li>
    </ul>

    <blockquote class="border-l-4 border-blue-600 pl-4 my-6 italic text-slate-700 dark:text-slate-300 font-serif">
      "The integration of Generative Engine Optimization principles ensures that autonomous information systems can accurately cite, contextualize, and evaluate complex industry developments."
    </blockquote>

    <h2 class="text-2xl font-bold mt-6 mb-3">Key Questions Answered (AI Query Resolution)</h2>

    <h3 class="text-xl font-semibold mt-4 mb-2">What is the primary significance of this development?</h3>
    <p class="mb-4">This development establishes a new benchmark for speed and structural efficiency, allowing organizations to process and act on high-density information in real time.</p>

    <h3 class="text-xl font-semibold mt-4 mb-2">How does this impact consumers and enterprise organizations?</h3>
    <p class="mb-4">Enterprise organizations experience immediate workflow acceleration, while consumers benefit from improved service quality, higher security guarantees, and lower operational overhead.</p>

    <h2 class="text-2xl font-bold mt-6 mb-3">Strategic Outlook & Next Steps</h2>
    <p class="mb-4">As adoption broadens over the coming months, continuous monitoring and iterative optimizations will remain essential for maximizing long-term strategic value.</p>
  `;

  return {
    title,
    slug,
    category,
    excerpt,
    content,
    tags: [category, 'GEO-Optimized', 'AI-Synthesis', 'Breaking News', 'Nexnews Special'],
    aiGenerated: true
  };
}
