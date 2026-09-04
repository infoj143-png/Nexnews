import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'admin_session';

function getJwtSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_SESSION_SECRET environment variable is not configured.');
    }
    // Development fallback warning
    return 'dev_nexnews_admin_secret_key_change_in_production_32bytes';
  }
  return secret;
}

export interface AdminJwtPayload {
  role: 'admin';
  iat?: number;
  exp?: number;
}

export function signAdminToken(): string {
  const secret = getJwtSecret();
  return jwt.sign({ role: 'admin' }, secret, { expiresIn: '7d' });
}

export function verifyAdminToken(token: string): AdminJwtPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as AdminJwtPayload;
    if (decoded && decoded.role === 'admin') {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, cookieStr) => {
    const [key, ...val] = cookieStr.trim().split('=');
    if (key) {
      acc[key] = decodeURIComponent(val.join('='));
    }
    return acc;
  }, {} as Record<string, string>);
}

export function extractTokenFromRequest(request: Request): string | null {
  // 1. Try Cookie header
  const cookieHeader = request.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  if (cookies[COOKIE_NAME]) {
    return cookies[COOKIE_NAME];
  }

  // 2. Try Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

export function requireAdminAuth(request: Request): {
  authenticated: boolean;
  errorResponse?: NextResponse;
  payload?: AdminJwtPayload;
} {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return {
        authenticated: false,
        errorResponse: NextResponse.json(
          { success: false, error: 'Unauthorized: Admin authentication session required.' },
          { status: 401 }
        )
      };
    }

    const payload = verifyAdminToken(token);
    if (!payload) {
      return {
        authenticated: false,
        errorResponse: NextResponse.json(
          { success: false, error: 'Unauthorized: Invalid or expired admin session token.' },
          { status: 401 }
        )
      };
    }

    return { authenticated: true, payload };
  } catch (err: unknown) {
    const isProduction = process.env.NODE_ENV === 'production';
    const message = isProduction
      ? 'Server authentication configuration error.'
      : `Server auth configuration error: ${err instanceof Error ? err.message : 'Authentication verification failed'}`;
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      )
    };
  }
}

export { COOKIE_NAME };
