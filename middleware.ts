import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'admin_session';

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_SESSION_SECRET environment variable is not configured.');
    }
    return new TextEncoder().encode('dev_nexnews_admin_secret_key_change_in_production_32bytes');
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept /admin route
  if (pathname.startsWith('/admin')) {
    const tokenCookie = request.cookies.get(COOKIE_NAME);
    const token = tokenCookie?.value;

    if (!token) {
      // Allow the page component to handle unauthenticated login state rendering
      // or pass through so client side auth state can prompt login.
      return NextResponse.next();
    }

    try {
      const secretKey = getJwtSecretKey();
      const { payload } = await jwtVerify(token, secretKey);
      if (payload && payload.role === 'admin') {
        return NextResponse.next();
      }
    } catch {
      // Invalid token cookie - delete cookie and continue to prompt login
      const response = NextResponse.next();
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*']
};
