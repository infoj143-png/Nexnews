import { Category } from './data';

export interface TrendingNewsItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  source: string;
  category: Category;
  trendingKeyword?: string;
  approxTraffic?: string;
  headline?: string;
}

const RSS_FEEDS: Array<{ url: string; source: string; category: Category }> = [
  {
    url: 'https://trends.google.com/trending/rss?geo=PK',
    source: 'Google Trends Pakistan',
    category: 'World'
  },
  {
    url: 'https://trends.google.com/trending/rss?geo=US',
    source: 'Google Trends Global',
    category: 'Tech'
  },
  {
    url: 'https://techcrunch.com/feed/',
    source: 'TechCrunch',
    category: 'Tech'
  },
  {
    url: 'https://news.ycombinator.com/rss',
    source: 'Hacker News',
    category: 'Tech'
  },
  {
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    source: 'BBC World',
    category: 'World'
  },
  {
    url: 'http://feeds.bbci.co.uk/news/business/rss.xml',
    source: 'BBC Business',
    category: 'Business'
  }
];

const FALLBACK_TOPICS: Array<{ title: string; description: string; category: Category; source: string }> = [
  {
    title: 'Autonomous AI Agents Transforming Enterprise Software Development Workflows',
    description: 'Next-generation reasoning models are automatically managing codebases, running regression tests, and deploying cloud infrastructure.',
    category: 'AI',
    source: 'Nexnews Trend Radar'
  },
  {
    title: 'Quantum Computing Consortium Announces Breakthrough 100,000 Logical Qubit Processor',
    description: 'Researchers demonstrate room-temperature fault-tolerant quantum error correction, opening new frontiers in molecular modeling.',
    category: 'Tech',
    source: 'Nexnews Trend Radar'
  },
  {
    title: 'Global Renewable Energy Grid Surpasses 60% Total Capacity Threshold',
    description: 'Solid-state battery storage grid deployments accelerate transition to net-zero power networks in major metropolitan areas.',
    category: 'World',
    source: 'Nexnews Trend Radar'
  },
  {
    title: 'Generative Engine Optimization (GEO) Redefines Digital Marketing and Content Strategy',
    description: 'Brands restructure digital publications to ensure direct citation and extraction by AI language engines like Gemini and ChatGPT.',
    category: 'Business',
    source: 'Nexnews Trend Radar'
  },
  {
    title: 'AI-Powered Biomechanical Exoskeletons Revolutionize Athletic Performance and Rehabilitation',
    description: 'Sports medicine clinics deploy real-time neural biofeedback suits to prevent injuries and optimize athlete recovery speed.',
    category: 'Sports',
    source: 'Nexnews Trend Radar'
  }
];

function extractTagValue(xmlString: string, tagName: string): string {
  const match = xmlString.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i'));
  if (!match) return '';
  // Clean CDATA or HTML comments if present
  let text = match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
  // Strip inner HTML tags
  text = text.replace(/<[^>]+>/g, '');
  return text;
}

export async function fetchTrendingNewsItem(): Promise<TrendingNewsItem> {
  // Try fetching from RSS feeds sequentially or pick a random feed
  const shuffledFeeds = [...RSS_FEEDS].sort(() => Math.random() - 0.5);

  for (const feed of shuffledFeeds) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(feed.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NexnewsBot/1.0'
        },
        cache: 'no-store'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const xmlText = await response.text();
        const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || xmlText.match(/<entry[\s\S]*?<\/entry>/gi);

        if (itemMatches && itemMatches.length > 0) {
          // Select a random item from the top 5
          const candidateXml = itemMatches[Math.floor(Math.random() * Math.min(5, itemMatches.length))];
          const title = extractTagValue(candidateXml, 'title');
          const link = extractTagValue(candidateXml, 'link');
          const description = extractTagValue(candidateXml, 'description') || extractTagValue(candidateXml, 'summary');
          const pubDate = extractTagValue(candidateXml, 'pubDate') || extractTagValue(candidateXml, 'published');

          // Check for Google Trends namespace elements (ht:approx_traffic, ht:news_item)
          const approxTraffic = extractTagValue(candidateXml, 'ht:approx_traffic');
          const newsHeadline = extractTagValue(candidateXml, 'ht:news_item_title');
          const newsSource = extractTagValue(candidateXml, 'ht:news_item_source');
          const newsSnippet = extractTagValue(candidateXml, 'ht:news_item_snippet');
          const newsUrl = extractTagValue(candidateXml, 'ht:news_item_url');

          const trendingKeyword = title;
          const articleTitle = newsHeadline || (title ? `Trending Search Analysis: ${title}` : '');
          const articleDesc = newsSnippet || description || articleTitle;
          const source = newsSource || feed.source;
          const articleUrl = newsUrl || link || feed.url;

          if (articleTitle && articleTitle.length > 3) {
            return {
              title: articleTitle,
              link: articleUrl,
              description: articleDesc,
              pubDate: pubDate || new Date().toISOString(),
              source,
              category: feed.category,
              trendingKeyword: trendingKeyword || articleTitle,
              approxTraffic: approxTraffic || 'High Search Volume',
              headline: newsHeadline || articleTitle
            };
          }
        }
      }
    } catch {
      // Continue to next feed or fallback on network/parsing error
    }
  }

  // Fallback dynamic topic selector
  const selectedFallback = FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
  return {
    title: selectedFallback.title,
    link: 'https://nexnews-nu.vercel.app',
    description: selectedFallback.description,
    pubDate: new Date().toISOString(),
    source: selectedFallback.source,
    category: selectedFallback.category,
    trendingKeyword: selectedFallback.title.split(' ')[0] || 'AI Trends',
    approxTraffic: '100K+ Search Volume',
    headline: selectedFallback.title
  };
}
