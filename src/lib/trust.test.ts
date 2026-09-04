import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidSourceUrl,
  extractSourceAttribution,
  getArticleTrustSignals,
  isDuplicateTitle,
} from './trust';
import { Article } from './data';

test('isValidSourceUrl accepts http and https URLs and rejects unsafe schemes', () => {
  assert.equal(isValidSourceUrl('https://techcrunch.com/2026/article'), true);
  assert.equal(isValidSourceUrl('http://bbc.com/news/world'), true);
  assert.equal(isValidSourceUrl('javascript:alert(1)'), false);
  assert.equal(isValidSourceUrl('data:text/html,evil'), false);
  assert.equal(isValidSourceUrl('file:///etc/passwd'), false);
  assert.equal(isValidSourceUrl('invalid-url-string'), false);
  assert.equal(isValidSourceUrl(''), false);
});

test('extractSourceAttribution parses source name and URL safely from HTML content', () => {
  const contentWithLink = `<p>Some news text.</p>
<p class="mt-6 text-sm text-slate-500 font-serif">Coverage compiled via <a href="https://www.thehindu.com/article" target="_blank" rel="noopener noreferrer">The Hindu</a>.</p>`;

  const result = extractSourceAttribution(contentWithLink);
  assert.equal(result.sourceName, 'The Hindu');
  assert.equal(result.sourceUrl, 'https://www.thehindu.com/article');

  const contentWithUnsafeLink = `<p class="mt-6">Coverage compiled via <a href="javascript:alert(1)">Malicious Source</a>.</p>`;
  const unsafeResult = extractSourceAttribution(contentWithUnsafeLink);
  assert.equal(unsafeResult.sourceName, 'Malicious Source');
  assert.equal(unsafeResult.sourceUrl, null);

  const contentTextOnly = `<p>Coverage compiled via BBC News.</p>`;
  const textResult = extractSourceAttribution(contentTextOnly);
  assert.equal(textResult.sourceName, 'BBC News');
  assert.equal(textResult.sourceUrl, null);

  const contentNoAttribution = `<p>Standard article without attribution.</p>`;
  const noResult = extractSourceAttribution(contentNoAttribution);
  assert.equal(noResult.sourceName, null);
  assert.equal(noResult.sourceUrl, null);
});

test('getArticleTrustSignals provides AI transparency and qualitative badges without fake percentages', () => {
  const aiArticle: Article = {
    id: '1',
    title: 'AI Outage Impacts Services',
    slug: 'ai-outage-impacts-services',
    summary: 'Summary of outage',
    content: '<h2>Overview</h2><p>Coverage compiled via <a href="https://example.com/news">Tech Source</a>.</p>',
    category: 'Tech',
    author: { name: 'Nexnews Desk', avatar: '/avatar.jpg', role: 'Editorial' },
    publishedAt: new Date().toISOString(),
    readTime: '3 min read',
    imageUrl: 'https://example.com/img.jpg',
    views: 10,
    status: 'published',
    tags: ['Tech', 'AI'],
    aiGenerated: true,
  };

  const signals = getArticleTrustSignals(aiArticle);

  assert.equal(signals.isAiGenerated, true);
  assert.equal(signals.transparencyLabel, 'AI-generated from available news sources');
  assert.equal(signals.source.sourceName, 'Tech Source');
  assert.equal(signals.source.sourceUrl, 'https://example.com/news');
  assert.ok(signals.qualitativeBadges.includes('Verified External Source'));
  assert.ok(signals.qualitativeBadges.includes('Automated Synthesis'));
  assert.ok(signals.qualitativeBadges.includes('Structured Analysis'));

  // Ensure no numerical confidence score is present
  const allBadgesText = signals.qualitativeBadges.join(' ');
  assert.equal(/\d+%/.test(allBadgesText), false);
  assert.equal(/confidence/i.test(allBadgesText), false);
  assert.equal(/accuracy/i.test(allBadgesText), false);
});

test('getArticleTrustSignals handles non-AI editorial articles correctly', () => {
  const manualArticle: Article = {
    id: '2',
    title: 'Manual Investigation Report',
    slug: 'manual-investigation-report',
    summary: 'Summary of report',
    content: '<p>Direct report by staff writers.</p>',
    category: 'World',
    author: { name: 'Staff Journalist', avatar: '/avatar.jpg', role: 'Reporter' },
    publishedAt: new Date().toISOString(),
    readTime: '5 min read',
    imageUrl: 'https://example.com/img2.jpg',
    views: 25,
    status: 'published',
    tags: ['Investigation'],
    aiGenerated: false,
  };

  const signals = getArticleTrustSignals(manualArticle);

  assert.equal(signals.isAiGenerated, false);
  assert.equal(signals.transparencyLabel, 'Editorial Staff Article');
  assert.equal(signals.source.sourceName, null);
  assert.equal(signals.source.sourceUrl, null);
  assert.equal(signals.qualitativeBadges.includes('Automated Synthesis'), false);
});

test('isDuplicateTitle detects near-duplicate article titles deterministically', () => {
  const title1 = 'ChatGPT Login Issues and Global AI System Outage';
  const title2 = 'ChatGPT Login Down: Global Outage Hits OpenAI and AI Systems';
  const title3 = 'NASA Launches New Deep Space Telescope to Explore Exoplanets';

  assert.equal(isDuplicateTitle(title1, title2, 0.4), true);
  assert.equal(isDuplicateTitle(title1, title3, 0.4), false);
  assert.equal(isDuplicateTitle('', title1), false);
});
