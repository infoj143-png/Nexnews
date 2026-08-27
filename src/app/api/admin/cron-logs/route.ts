import { NextResponse } from 'next/server';
import { getCronLogs, clearCronLogs } from '@/lib/data';

export async function GET() {
  const logs = getCronLogs();
  return NextResponse.json({
    success: true,
    logs
  });
}

export async function DELETE() {
  clearCronLogs();
  return NextResponse.json({
    success: true,
    message: 'Cron logs cleared successfully.'
  });
}
