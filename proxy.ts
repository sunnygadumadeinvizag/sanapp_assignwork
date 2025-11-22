import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth.middleware';

/**
 * Next.js Proxy (formerly Middleware)
 * Runs on every request to verify authentication
 */
export async function proxy(request: NextRequest) {
  // Verify authentication and handle token refresh
  const authResponse = await verifyAuth(request);
  
  if (authResponse) {
    return authResponse;
  }
  
  // Continue to route handler
  return null;
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
