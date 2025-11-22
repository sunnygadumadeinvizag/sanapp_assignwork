import { NextRequest, NextResponse } from 'next/server';
import { clearSession, getSession } from '@/lib/utils/session.utils';
import { ssoConfig } from '@/lib/sso-config';
import axios from 'axios';

/**
 * GET /api/auth/logout
 * Handles user logout
 * Clears local session and calls SSO logout to terminate SSO session
 * Requirements: 1.5, 8.1, 8.2, 8.3
 */
export async function GET(request: NextRequest) {
  try {
    // Get current session to retrieve access token
    const session = await getSession();

    // Clear local session first
    await clearSession();

    // If we have a session with access token, call SSO logout
    if (session?.accessToken) {
      try {
        // Call SSO logout endpoint to invalidate all tokens
        await axios.post(
          ssoConfig.logoutUrl,
          {},
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
            // Don't throw on error - we've already cleared local session
            validateStatus: () => true,
          }
        );
      } catch (ssoError) {
        // Log SSO logout error but don't fail the logout
        console.error('SSO logout error:', ssoError);
      }
    }

    // Get redirect URL from query params or default to home
    const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, clear session and redirect
    await clearSession();
    return NextResponse.redirect(new URL('/', request.url));
  }
}

/**
 * POST /api/auth/logout
 * Handles user logout via POST request
 * Clears local session and calls SSO logout to terminate SSO session
 * Requirements: 1.5, 8.1, 8.2, 8.3
 */
export async function POST(request: NextRequest) {
  try {
    // Get current session to retrieve access token
    const session = await getSession();

    // Clear local session first
    await clearSession();

    // If we have a session with access token, call SSO logout
    if (session?.accessToken) {
      try {
        // Call SSO logout endpoint to invalidate all tokens
        await axios.post(
          ssoConfig.logoutUrl,
          {},
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
            // Don't throw on error - we've already cleared local session
            validateStatus: () => true,
          }
        );
      } catch (ssoError) {
        // Log SSO logout error but don't fail the logout
        console.error('SSO logout error:', ssoError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout POST error:', error);
    
    // Even if there's an error, clear session
    await clearSession();
    
    return NextResponse.json(
      {
        error: 'logout_error',
        error_description: 'An error occurred during logout',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
