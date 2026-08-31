import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signAdminToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
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

    return NextResponse.json(
      { success: false, error: 'Invalid admin password' },
      { status: 401 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
