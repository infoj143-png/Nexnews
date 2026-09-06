import assert from 'node:assert';
import { test } from 'node:test';
import bcrypt from 'bcryptjs';
import { POST as loginHandler } from '../app/api/admin/login/route';
import { GET as getArticlesHandler } from '../app/api/articles/route';
import { signAdminToken } from './auth';

function setNodeEnv(value: string | undefined) {
  if (value === undefined) {
    delete (process.env as Record<string, string | undefined>).NODE_ENV;
  } else {
    (process.env as Record<string, string | undefined>).NODE_ENV = value;
  }
}

test('signAdminToken throws error in production if ADMIN_SESSION_SECRET is unconfigured', () => {
  const origEnv = process.env.NODE_ENV;
  const origSecret = process.env.ADMIN_SESSION_SECRET;

  try {
    setNodeEnv('production');
    delete process.env.ADMIN_SESSION_SECRET;

    assert.throws(
      () => {
        signAdminToken();
      },
      {
        name: 'Error',
        message: 'ADMIN_SESSION_SECRET environment variable is not configured.'
      }
    );
  } finally {
    setNodeEnv(origEnv);
    if (origSecret !== undefined) {
      process.env.ADMIN_SESSION_SECRET = origSecret;
    } else {
      delete process.env.ADMIN_SESSION_SECRET;
    }
  }
});

test('Admin login rejects non-string and oversized passwords', async () => {
  const reqNonString = new Request('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 12345 })
  });

  const resNonString = await loginHandler(reqNonString);
  assert.strictEqual(resNonString.status, 400);
  const jsonNonString = await resNonString.json();
  assert.strictEqual(jsonNonString.success, false);

  const reqOversized = new Request('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'a'.repeat(1025) })
  });

  const resOversized = await loginHandler(reqOversized);
  assert.strictEqual(resOversized.status, 400);
  const jsonOversized = await resOversized.json();
  assert.strictEqual(jsonOversized.error, 'Password exceeds maximum allowed length.');
});

test('Admin login enforces ADMIN_PASSWORD_HASH in production mode and rejects plain password fallback', async () => {
  const origEnv = process.env.NODE_ENV;
  const origHash = process.env.ADMIN_PASSWORD_HASH;
  const origPlain = process.env.ADMIN_PASSWORD;

  try {
    setNodeEnv('production');
    delete process.env.ADMIN_PASSWORD_HASH;
    process.env.ADMIN_PASSWORD = 'supersecretpassword';

    const req = new Request('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.0.0.1'
      },
      body: JSON.stringify({ password: 'supersecretpassword' })
    });

    const res = await loginHandler(req);
    assert.strictEqual(res.status, 500);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error.includes('Server authentication configuration error'), true);
  } finally {
    setNodeEnv(origEnv);
    if (origHash !== undefined) process.env.ADMIN_PASSWORD_HASH = origHash;
    else delete process.env.ADMIN_PASSWORD_HASH;
    if (origPlain !== undefined) process.env.ADMIN_PASSWORD = origPlain;
    else delete process.env.ADMIN_PASSWORD;
  }
});

test('Admin login accepts valid bcrypt hashed password in production mode', async () => {
  const origEnv = process.env.NODE_ENV;
  const origHash = process.env.ADMIN_PASSWORD_HASH;
  const origSecret = process.env.ADMIN_SESSION_SECRET;

  try {
    setNodeEnv('production');
    process.env.ADMIN_SESSION_SECRET = 'a_very_secure_production_secret_32bytes!';
    const password = 'TestSecretAdminPassword123!';
    const salt = await bcrypt.genSalt(10);
    process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash(password, salt);

    const req = new Request('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '10.0.0.2'
      },
      body: JSON.stringify({ password })
    });

    const res = await loginHandler(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
  } finally {
    setNodeEnv(origEnv);
    if (origHash !== undefined) process.env.ADMIN_PASSWORD_HASH = origHash;
    else delete process.env.ADMIN_PASSWORD_HASH;
    if (origSecret !== undefined) process.env.ADMIN_SESSION_SECRET = origSecret;
    else delete process.env.ADMIN_SESSION_SECRET;
  }
});

test('Public GET /api/articles strictly returns only published articles', async () => {
  const req = new Request('http://localhost:3000/api/articles', {
    method: 'GET'
  });

  const res = await getArticlesHandler(req);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.success, true);
  assert.ok(Array.isArray(json.articles));
  assert.ok(json.articles.every((a: { status: string }) => a.status === 'published'));
  assert.strictEqual(json.analytics.draftCount, 0);
});
