import { NextRequest, NextResponse } from 'next/server';
import { handleCallback, calculateExpiresAt, syncUserFromSSO } from '@/lib/services';
import { getOAuthFlowData, clearOAuthFlowData, storeSession } from '@/lib/utils/session.utils';
import { SessionData } from '@/types';

/**
 * GET /api/auth/callback
 * OAuth2 callback handler
 * Receives authorization code from SSO and exchanges it for tokens
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/auth/error?error=missing_parameters', request.url)
      );
    }

    // Retrieve stored OAuth flow data
    const flowData = await getOAuthFlowData();

    if (!flowData) {
      return NextResponse.redirect(
        new URL('/auth/error?error=invalid_state', request.url)
      );
    }

    // Handle OAuth callback
    const result = await handleCallback({
      code,
      state,
      codeVerifier: flowData.codeVerifier,
      expectedState: flowData.state,
    });

    // Clear OAuth flow data
    await clearOAuthFlowData();

    if (!result.success || !result.tokens || !result.userInfo) {
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=${result.error || 'callback_failed'}&description=${encodeURIComponent(result.errorDescription || 'Unknown error')}`,
          request.url
        )
      );
    }

    // Synchronize user from SSO to local database
    // Requirements: 5.1, 5.2, 5.3
    const syncResult = await syncUserFromSSO(result.userInfo);

    if (!syncResult.success || !syncResult.user) {
      // User doesn't exist locally - redirect to error page
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=${syncResult.error || 'user_not_found'}&description=${encodeURIComponent(syncResult.errorDescription || 'User not found in local database')}`,
          request.url
        )
      );
    }

    const localUser = syncResult.user;

    // Calculate token expiration
    const expiresAt = calculateExpiresAt(result.tokens.expires_in);

    // Create session data
    const sessionData: SessionData = {
      user: {
        id: localUser.id,
        email: localUser.email,
        username: localUser.username,
        createdAt: localUser.createdAt,
        updatedAt: localUser.updatedAt,
      },
      accessToken: result.tokens.access_token,
      refreshToken: result.tokens.refresh_token,
      expiresAt,
    };

    // Store session
    await storeSession(sessionData);

    // Redirect to original destination or home page
    const returnTo = flowData.returnTo || '/';
    return NextResponse.redirect(new URL(returnTo, request.url));
  } catch (error) {
    console.error('Callback handler error:', error);
    
    return NextResponse.redirect(
      new URL(
        `/auth/error?error=server_error&description=${encodeURIComponent('An internal error occurred')}`,
        request.url
      )
    );
  }
}
