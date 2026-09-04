import assert from 'node:assert';
import { test, after } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { isValidSlug, slugify, addArticle } from './data';
import { saveArticleToGitHub, deleteArticleFromGitHub } from './github';
import { signAdminToken } from './auth';
import { POST } from '../app/api/articles/route';

after(() => {
  // Clean up any test article file written to data/articles/
  const testFilePath = path.join(process.cwd(), 'data', 'articles', 'some-valid-article-title.json');
  if (fs.existsSync(testFilePath)) {
    try {
      fs.unlinkSync(testFilePath);
    } catch {
      // Ignore error
    }
  }
});

test('isValidSlug accepts valid slugs', () => {
  const validSlugs = [
    'some-valid-article-title',
    'a',
    'openai-unveils-gpt-5-quantum-leap-reasoning',
    '123-test',
    'tech-news-2025'
  ];

  for (const slug of validSlugs) {
    assert.strictEqual(isValidSlug(slug), true, `Expected '${slug}' to be valid`);
  }
});

test('isValidSlug rejects malicious path traversal values and invalid formats', () => {
  const invalidSlugs = [
    '../../evil',
    'data/articles/../../secrets',
    '../article',
    '/etc/passwd',
    '..\\..\\evil',
    'C:\\Windows\\System32',
    'invalid_slug',
    'Slug-With-Capitals',
    'slug--with--double--hyphens',
    '-leading-hyphen',
    'trailing-hyphen-',
    'slug with spaces',
    'slug!@#$',
    '',
    'a'.repeat(201)
  ];

  for (const slug of invalidSlugs) {
    assert.strictEqual(isValidSlug(slug as string), false, `Expected '${slug}' to be invalid`);
  }

  // Test non-string inputs
  assert.strictEqual(isValidSlug(null as unknown as string), false);
  assert.strictEqual(isValidSlug(undefined as unknown as string), false);
  assert.strictEqual(isValidSlug(123 as unknown as string), false);
  assert.strictEqual(isValidSlug({} as unknown as string), false);
});

test('slugify produces valid slugs and strips path traversal characters', () => {
  const testCases = [
    { input: 'Hello World!', expected: 'hello-world' },
    { input: '../../Evil Title!!', expected: 'evil-title' },
    { input: '   --- Testing, 1-2-3... ---   ', expected: 'testing-1-2-3' },
    { input: 'OpenAI Unveils GPT-5: A Quantum Leap', expected: 'openai-unveils-gpt-5-a-quantum-leap' },
    { input: 'data/articles/../../secrets', expected: 'dataarticlessecrets' }
  ];

  for (const { input, expected } of testCases) {
    const slug = slugify(input);
    assert.strictEqual(slug, expected, `slugify('${input}') failed`);
    assert.strictEqual(isValidSlug(slug), true, `slugify result '${slug}' should be a valid slug`);
  }
});

test('saveArticleToGitHub and deleteArticleFromGitHub reject invalid slugs', async () => {
  const maliciousSlugs = ['../../evil', 'data/articles/../../secrets', 'invalid_slug'];

  for (const slug of maliciousSlugs) {
    const fakeArticle = {
      id: '999',
      title: 'Malicious Title',
      slug,
      summary: 'Summary',
      content: '<p>Content</p>',
      category: 'Tech' as const,
      author: { name: 'Admin', avatar: '', role: '' },
      publishedAt: new Date().toISOString(),
      readTime: '3 min read',
      imageUrl: 'https://example.com/image.jpg',
      views: 0,
      status: 'published' as const,
      tags: ['Tech']
    };

    const saveResult = await saveArticleToGitHub(fakeArticle);
    assert.strictEqual(saveResult, false, `saveArticleToGitHub should reject invalid slug '${slug}'`);

    const deleteResult = await deleteArticleFromGitHub(slug);
    assert.strictEqual(deleteResult, false, `deleteArticleFromGitHub should reject invalid slug '${slug}'`);
  }
});

test('addArticle throws error when given an invalid slug', async () => {
  const maliciousArticle = {
    title: 'Malicious Article',
    slug: '../../evil',
    summary: 'Summary',
    content: '<p>Content</p>',
    category: 'Tech' as const,
    author: { name: 'Admin', avatar: '', role: '' },
    publishedAt: new Date().toISOString(),
    readTime: '3 min read',
    imageUrl: 'https://example.com/image.jpg',
    status: 'published' as const,
    tags: ['Tech']
  };

  await assert.rejects(
    async () => {
      await addArticle(maliciousArticle);
    },
    {
      name: 'Error',
      message: "Invalid slug format: '../../evil'"
    }
  );
});

test('POST /api/articles handler rejects malicious slugs with 400 Bad Request', async () => {
  process.env.ADMIN_SESSION_SECRET = 'test-secret-123456789012345678901234567890';
  const adminToken = signAdminToken();

  const createMockPostRequest = (body: Record<string, unknown>) => {
    return new Request('http://localhost:3000/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(body)
    });
  };

  const maliciousPayloads = [
    { title: 'Test Article', content: 'Content body', category: 'Tech', slug: '../../evil' },
    { title: 'Test Article', content: 'Content body', category: 'Tech', slug: 'data/articles/../../secrets' },
    { title: 'Test Article', content: 'Content body', category: 'Tech', slug: 'invalid_slug' },
    { title: 'Test Article', content: 'Content body', category: 'Tech', slug: 'CAPITAL-SLUG' }
  ];

  for (const body of maliciousPayloads) {
    const req = createMockPostRequest(body);
    const res = await POST(req);
    assert.strictEqual(res.status, 400, `POST /api/articles with slug '${body.slug}' should return 400 status`);

    const resJson = await res.json();
    assert.strictEqual(resJson.success, false);
    assert.strictEqual(resJson.error, 'Invalid article slug format.');
  }

  // Test valid slug accepted
  const validPayload = {
    title: 'Valid Article Title Test',
    content: '<p>Valid article content body for test.</p>',
    category: 'Tech',
    slug: 'some-valid-article-title'
  };

  const reqValid = createMockPostRequest(validPayload);
  const resValid = await POST(reqValid);
  assert.strictEqual(resValid.status, 201, 'POST /api/articles with valid slug should return 201 status');

  const resValidJson = await resValid.json();
  assert.strictEqual(resValidJson.success, true);
  assert.strictEqual(resValidJson.article.slug, 'some-valid-article-title');
});
