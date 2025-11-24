import { NextResponse } from 'next/server';

/**
 * GET /api/public/status
 * Public status endpoint - no authentication required
 */
export async function GET() {
  return NextResponse.json({
    status: 'operational',
    service: 'AssignWork Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
