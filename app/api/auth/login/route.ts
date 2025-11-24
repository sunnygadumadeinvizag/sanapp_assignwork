import { NextRequest, NextResponse } from 'next/server';
import { initiateAuth } from '@/lib/services';
import { storeOAuthFlowData } from '@/lib/utils/session.utils';

/**
 * GET /api/auth/login
 * Initiates OAuth2 authorization flow with SSO
 * Generates PKCE parameters and redirects to SSO authorization endpoint
 * Requirements: 1.1, 4.1
 */
export async function GET(request: NextRequest) {
  try {
    // Get the original destination URL from query params (set by middleware)
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/';

    // Initiate OAuth2 authorization flow
    const authResult = await initiateAuth();

    // Store OAuth flow data (state, code verifier, and return URL) in session
    // This will be used to validate the callback and redirect after login
    await storeOAuthFlowData({
      state: authResult.state,
      codeVerifier: authResult.codeVerifier,
      returnTo, // Store the original destination
    });

    // Redirect to SSO authorization endpoint
    return NextResponse.redirect(authResult.authorizationUrl);
  } catch (error) {
    console.error('Login initiation error:', error);
    
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return NextResponse.redirect(
      new URL(
        `${basePath}/auth/error?error=login_failed&description=${encodeURIComponent('Failed to initiate login')}`,
        request.url
      )
    );
  }
}
