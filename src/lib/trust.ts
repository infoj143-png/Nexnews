import { Article } from './data';

export interface SourceAttribution {
  sourceName: string | null;
  sourceUrl: string | null;
}

export interface TrustSignals {
  isAiGenerated: boolean;
  transparencyLabel: string;
  source: SourceAttribution;
  qualitativeBadges: string[];
}

/**
 * Checks if a URL string is valid and uses a safe protocol (http or https only).
 */
export function isValidSourceUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Safely extracts source attribution (name and URL) from article content.
 * Never invents or fabricates missing information.
 */
export function extractSourceAttribution(content: string): SourceAttribution {
  if (!content || typeof content !== 'string') {
    return { sourceName: null, sourceUrl: null };
  }

  // Look for HTML anchor pattern in attribution text (e.g. Coverage compiled via <a href="...">Source Name</a>)
  const linkRegex = /Coverage compiled via\s+<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/i;
  const linkMatch = content.match(linkRegex);

  if (linkMatch) {
    const rawUrl = linkMatch[1]?.trim() || null;
    const rawName = linkMatch[2]?.trim() || null;
    const safeUrl = rawUrl && isValidSourceUrl(rawUrl) ? rawUrl : null;
    return {
      sourceName: rawName,
      sourceUrl: safeUrl,
    };
  }

  // Fallback: look for general links in attribution footer if present
  const generalLinkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/i;
  const generalMatch = content.match(generalLinkRegex);
  if (generalMatch && content.toLowerCase().includes('coverage compiled via')) {
    const rawUrl = generalMatch[1]?.trim() || null;
    const rawName = generalMatch[2]?.trim() || null;
    const safeUrl = rawUrl && isValidSourceUrl(rawUrl) ? rawUrl : null;
    return {
      sourceName: rawName,
      sourceUrl: safeUrl,
    };
  }

  // Text-only attribution pattern without link (e.g. Coverage compiled via Source Name.)
  const textRegex = /Coverage compiled via\s+([^<.]+)/i;
  const textMatch = content.match(textRegex);
  if (textMatch) {
    const rawName = textMatch[1]?.trim() || null;
    return {
      sourceName: rawName,
      sourceUrl: null,
    };
  }

  return { sourceName: null, sourceUrl: null };
}

/**
 * Derives qualitative, transparent trust signals strictly from existing article data.
 * Does NOT generate fake numerical accuracy or confidence percentages.
 */
export function getArticleTrustSignals(article: Article): TrustSignals {
  const isAiGenerated = Boolean(article.aiGenerated);
  const source = extractSourceAttribution(article.content);

  const transparencyLabel = isAiGenerated
    ? 'AI-generated from available news sources'
    : 'Editorial Staff Article';

  const qualitativeBadges: string[] = [];

  if (source.sourceUrl) {
    qualitativeBadges.push('External Source Link');
  } else if (source.sourceName) {
    qualitativeBadges.push('Source Citation Available');
  }

  if (isAiGenerated) {
    qualitativeBadges.push('Automated Synthesis');
  }

  if (/<h[23][^>]*>/i.test(article.content)) {
    qualitativeBadges.push('Structured Analysis');
  }

  if (article.tags && article.tags.length > 0) {
    qualitativeBadges.push('Categorized Topics');
  }

  return {
    isAiGenerated,
    transparencyLabel,
    source,
    qualitativeBadges,
  };
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'should', 'could', 'can', 'may', 'might', 'must', 'shall', 'this', 'that', 'these',
  'those', 'trending', 'search', 'analysis', 'news', 'vs', 'versus', 'live', 'today'
]);

function tokenizeTitle(title: string): Set<string> {
  if (!title) return new Set();
  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

/**
 * Lightweight deterministic title similarity helper for future standalone use.
 * Does NOT block, delay, or alter existing automated publishing.
 */
export function isDuplicateTitle(titleA: string, titleB: string, threshold = 0.7): boolean {
  if (!titleA || !titleB) return false;

  const tokensA = tokenizeTitle(titleA);
  const tokensB = tokenizeTitle(titleB);

  if (tokensA.size === 0 || tokensB.size === 0) return false;

  let intersectionSize = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionSize++;
    }
  }

  const unionSize = new Set([...tokensA, ...tokensB]).size;
  if (unionSize === 0) return false;

  const jaccard = intersectionSize / unionSize;
  return jaccard >= threshold;
}
