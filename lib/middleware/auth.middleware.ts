import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/utils/session.utils';
import { refreshAccessToken, isTokenExpired, calculateExpiresAt } from '@/lib/services';

/**
 * Authentication Middleware
 * Checks for valid session and automatically refreshes tokens if needed
 */

/**
 * Check if request requires authentication
 * 
 * @param request - Next.js request object
 * @returns True if route requires authentication
 */
export function requiresAuth(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/callback',
    '/auth/error',
    '/login',
    '/_next',
    '/favicon.ico',
  ];
  
  return !publicRoutes.some(route => pathname.startsWith(route));
}

/**
 * Verify authentication and refresh token if needed
 * 
 * @param request - Next.js request object
 * @returns Response if authentication fails, null if successful
 */
export async function verifyAuth(request: NextRequest): Promise<NextResponse | null> {
  // Check if route requires authentication
  if (!requiresAuth(request)) {
    return null;
  }
  
  // Get current session
  const session = await getSession();
  
  if (!session) {
    // No session - redirect to login with return URL
    const loginUrl = new URL('/api/auth/login', request.url);
    loginUrl.searchParams.set('returnTo', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  
  // Check if access token is expired or about to expire
  if (isTokenExpired(session.expiresAt)) {
    try {
      // Attempt to refresh token
      const tokens = await refreshAccessToken(session.refreshToken);
      
      if (!tokens) {
        // Refresh failed - redirect to login
        const loginUrl = new URL('/api/auth/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      
      // Update session with new tokens
      const expiresAt = calculateExpiresAt(tokens.expires_in);
      await updateSession({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      });
    } catch (error) {
      console.error('Token refresh error in middleware:', error);
      
      // Refresh failed - redirect to login
      const loginUrl = new URL('/api/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Authentication successful
  return null;
}

/**
 * Get authenticated user from session
 * 
 * @returns User data if authenticated, null otherwise
 */
export async function getAuthenticatedUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Get access token from session
 * 
 * @returns Access token if authenticated, null otherwise
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.accessToken || null;
}

/**
 * Require authentication for API routes
 * Returns user ID if authenticated, or error response
 * 
 * @param request - Next.js request object
 * @returns Authentication result with userId or error response
 */
export async function requireAuth(
  request: NextRequest
): Promise<{
  authenticated: boolean;
  userId?: string;
  response?: NextResponse;
}> {
  // Get current session
  const session = await getSession();
  
  if (!session) {
    return {
      authenticated: false,
      response: NextResponse.json(
        {
          error: 'unauthorized',
          error_description: 'Authentication required',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      ),
    };
  }
  
  // Check if access token is expired
  if (isTokenExpired(session.expiresAt)) {
    try {
      // Attempt to refresh token
      const tokens = await refreshAccessToken(session.refreshToken);
      
      if (!tokens) {
        return {
          authenticated: false,
          response: NextResponse.json(
            {
              error: 'token_expired',
              error_description: 'Session expired, please login again',
              timestamp: new Date().toISOString(),
            },
            { status: 401 }
          ),
        };
      }
      
      // Update session with new tokens
      const expiresAt = calculateExpiresAt(tokens.expires_in);
      await updateSession({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      });
      
      // Get updated session
      const updatedSession = await getSession();
      if (!updatedSession) {
        return {
          authenticated: false,
          response: NextResponse.json(
            {
              error: 'session_error',
              error_description: 'Failed to update session',
              timestamp: new Date().toISOString(),
            },
            { status: 500 }
          ),
        };
      }
      
      return {
        authenticated: true,
        userId: updatedSession.user.id,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      
      return {
        authenticated: false,
        response: NextResponse.json(
          {
            error: 'token_refresh_failed',
            error_description: 'Failed to refresh authentication token',
            timestamp: new Date().toISOString(),
          },
          { status: 401 }
        ),
      };
    }
  }
  
  // Authentication successful
  return {
    authenticated: true,
    userId: session.user.id,
  };
}
