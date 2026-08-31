import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signAdminToken, COOKIE_NAME } from '@/lib/auth';

interface LoginAttempt {
  count: number;
  firstAttemptTime: number;
  lockoutUntil: number;
}

// In-memory store for rate limiting by IP (sliding window / lockout)
const loginAttempts = new Map<string, LoginAttempt>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  const xreal = request.headers.get('x-real-ip');
  if (xreal) {
    return xreal.trim();
  }
  return '127.0.0.1';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt) {
    return { allowed: true };
  }

  // Check if currently locked out
  if (attempt.lockoutUntil > now) {
    const retryAfter = Math.ceil((attempt.lockoutUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  // Check if window expired
  if (now - attempt.firstAttemptTime > WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockoutUntil = now + LOCKOUT_MS;
    console.warn(`[SECURITY LOCKOUT] IP ${ip} exceeded maximum login attempts (${MAX_ATTEMPTS}). Locked out for 15 minutes.`);
    const retryAfter = Math.ceil(LOCKOUT_MS / 1000);
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  return { allowed: true };
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt || (now - attempt.firstAttemptTime > WINDOW_MS)) {
    loginAttempts.set(ip, {
      count: 1,
      firstAttemptTime: now,
      lockoutUntil: 0,
    });
  } else {
    attempt.count += 1;
    if (attempt.count >= MAX_ATTEMPTS) {
      attempt.lockoutUntil = now + LOCKOUT_MS;
      console.warn(`[SECURITY LOCKOUT] IP ${ip} exceeded maximum login attempts (${MAX_ATTEMPTS}). Locked out for 15 minutes.`);
    }
  }
}

function resetAttempts(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Account temporarily locked. Please try again in ${rateCheck.retryAfterSeconds} seconds.`
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.retryAfterSeconds || 900)
          }
        }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const adminPasswordPlain = process.env.ADMIN_PASSWORD;

    if (!adminPasswordHash && !adminPasswordPlain) {
      console.error('[CRITICAL SECURITY ERROR] Neither ADMIN_PASSWORD nor ADMIN_PASSWORD_HASH environment variable is configured on server.');
      return NextResponse.json(
        { success: false, error: 'Server authentication configuration error. Admin access is disabled until configured.' },
        { status: 500 }
      );
    }

    let isValid = false;

    if (adminPasswordHash) {
      isValid = await bcrypt.compare(password, adminPasswordHash);
    } else if (adminPasswordPlain) {
      isValid = password === adminPasswordPlain;
    }

    if (isValid) {
      resetAttempts(ip);

      const token = signAdminToken();
      const isProduction = process.env.NODE_ENV === 'production';

      const response = NextResponse.json({
        success: true,
        message: 'Admin authenticated successfully'
      });

      // Set httpOnly, Secure, SameSite=strict cookie
      response.cookies.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
      });

      return response;
    }

    recordFailedAttempt(ip);

    return NextResponse.json(
      { success: false, error: 'Invalid admin password' },
      { status: 401 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
