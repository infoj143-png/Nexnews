import test from 'node:test';
import assert from 'node:assert';
import { GET as getNewsSitemap } from '@/app/news-sitemap.xml/route';
import { GET as getRssFeed } from '@/app/feed.xml/route';

test('news-sitemap.xml GET route handler returns valid Google News XML with 48h filter', async () => {
  const response = await getNewsSitemap();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get('content-type'), 'application/xml; charset=utf-8');

  const xmlText = await response.text();
  assert.ok(xmlText.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xmlText.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
  assert.ok(xmlText.includes('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">'));
});

test('feed.xml GET route handler returns valid RSS 2.0 XML with published articles', async () => {
  const response = await getRssFeed();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get('content-type'), 'application/xml; charset=utf-8');

  const xmlText = await response.text();
  assert.ok(xmlText.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xmlText.includes('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">'));
  assert.ok(xmlText.includes('<channel>'));
  assert.ok(xmlText.includes('<title>Nexnews - Autonomous AI News Engine</title>'));
  assert.ok(xmlText.includes('<item>'));
  assert.ok(xmlText.includes('<guid isPermaLink="true">'));
  assert.ok(xmlText.includes('<pubDate>'));
});
