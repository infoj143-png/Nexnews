import test from 'node:test';
import assert from 'node:assert';
import { GET } from '@/app/news-sitemap.xml/route';

test('news-sitemap.xml GET route handler returns valid Google News XML with 48h filter', async () => {
  const response = await GET();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get('content-type'), 'application/xml; charset=utf-8');

  const xmlText = await response.text();
  assert.ok(xmlText.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xmlText.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
  assert.ok(xmlText.includes('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">'));
});
