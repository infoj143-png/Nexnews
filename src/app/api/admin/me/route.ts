import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    role: 'admin'
  });
}
