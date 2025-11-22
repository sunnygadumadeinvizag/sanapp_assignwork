import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken, calculateExpiresAt } from '@/lib/services';
import { getSession, updateSession } from '@/lib/utils/session.utils';

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Updates session with new tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error: 'no_session',
          error_description: 'No active session found',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Refresh access token
    const tokens = await refreshAccessToken(session.refreshToken);

    if (!tokens) {
      return NextResponse.json(
        {
          error: 'refresh_failed',
          error_description: 'Failed to refresh access token',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Calculate new expiration
    const expiresAt = calculateExpiresAt(tokens.expires_in);

    // Update session with new tokens
    await updateSession({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });

    return NextResponse.json(
      {
        success: true,
        expires_in: tokens.expires_in,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    
    return NextResponse.json(
      {
        error: 'server_error',
        error_description: 'An internal error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
