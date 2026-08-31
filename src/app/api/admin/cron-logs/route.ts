import { NextResponse } from 'next/server';
import { getCronLogs, clearCronLogs } from '@/lib/data';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  const logs = getCronLogs();
  return NextResponse.json({
    success: true,
    logs
  });
}

export async function DELETE(request: Request) {
  const auth = requireAdminAuth(request);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  clearCronLogs();
  return NextResponse.json({
    success: true,
    message: 'Cron logs cleared successfully.'
  });
}
