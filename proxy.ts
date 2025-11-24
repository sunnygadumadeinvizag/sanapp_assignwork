import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth.middleware';

/**
 * Next.js Proxy (formerly Middleware)
 * Runs on every request to verify authentication
 */
export async function proxy(request: NextRequest) {
  console.log('[PROXY] Request to:', request.nextUrl.pathname);
  
  // Verify authentication and handle token refresh
  const authResponse = await verifyAuth(request);
  
  if (authResponse) {
    console.log('[PROXY] Auth failed, redirecting');
    return authResponse;
  }
  
  console.log('[PROXY] Auth successful, continuing');
  // Continue to route handler
  return NextResponse.next();
}

/**
 * Configure which routes the proxy runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
