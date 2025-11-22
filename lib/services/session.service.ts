import { SessionData } from '@/types';
import { 
  storeSession, 
  getSession, 
  updateSession as updateSessionUtil, 
  clearSession as clearSessionUtil,
  hasValidSession 
} from '@/lib/utils/session.utils';
import { refreshAccessToken, isTokenExpired, calculateExpiresAt } from './oauth.client';
import { ssoConfig } from '../sso-config';
import axios from 'axios';

/**
 * Session Management Service
 * Provides high-level session management operations
 * Requirements: 1.3, 1.5
 */

/**
 * Create a new session with user data and tokens
 * 
 * @param sessionData - Session data including user info and tokens
 */
export async function createSession(sessionData: SessionData): Promise<void> {
  await storeSession(sessionData);
}

/**
 * Get current active session
 * 
 * @returns Session data if exists and valid, null otherwise
 */
export async function getCurrentSession(): Promise<SessionData | null> {
  return await getSession();
}

/**
 * Update existing session with new data
 * 
 * @param updates - Partial session data to update
 */
export async function updateSession(updates: Partial<SessionData>): Promise<void> {
  await updateSessionUtil(updates);
}

/**
 * Check if user has a valid active session
 * 
 * @returns True if valid session exists
 */
export async function isSessionValid(): Promise<boolean> {
  return await hasValidSession();
}

/**
 * Refresh session tokens if expired or about to expire
 * Automatically updates session with new tokens
 * 
 * @returns True if refresh successful, false otherwise
 */
export async function refreshSessionIfNeeded(): Promise<boolean> {
  try {
    const session = await getSession();
    
    if (!session) {
      return false;
    }
    
    // Check if token is expired or about to expire (within 60 seconds)
    if (!isTokenExpired(session.expiresAt, 60)) {
      // Token is still valid
      return true;
    }
    
    // Attempt to refresh token
    const tokens = await refreshAccessToken(session.refreshToken);
    
    if (!tokens) {
      return false;
    }
    
    // Calculate new expiration
    const expiresAt = calculateExpiresAt(tokens.expires_in);
    
    // Update session with new tokens
    await updateSessionUtil({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });
    
    return true;
  } catch (error) {
    console.error('Session refresh error:', error);
    return false;
  }
}

/**
 * Terminate session locally and on SSO
 * Clears local session and calls SSO logout endpoint
 * Requirements: 1.5, 8.1, 8.2
 * 
 * @returns True if logout successful
 */
export async function terminateSession(): Promise<boolean> {
  try {
    // Get current session to retrieve access token
    const session = await getSession();
    
    // Clear local session first
    await clearSessionUtil();
    
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
            timeout: 5000, // 5 second timeout
            // Don't throw on error - we've already cleared local session
            validateStatus: () => true,
          }
        );
      } catch (ssoError) {
        // Log SSO logout error but don't fail the logout
        console.error('SSO logout error:', ssoError);
        // Still return true since local session is cleared
      }
    }
    
    return true;
  } catch (error) {
    console.error('Session termination error:', error);
    
    // Even if there's an error, try to clear local session
    try {
      await clearSessionUtil();
    } catch (clearError) {
      console.error('Failed to clear session:', clearError);
    }
    
    return false;
  }
}

/**
 * Get access token from current session
 * Automatically refreshes if expired
 * 
 * @returns Access token if available, null otherwise
 */
export async function getAccessToken(): Promise<string | null> {
  // Refresh session if needed
  const refreshed = await refreshSessionIfNeeded();
  
  if (!refreshed) {
    return null;
  }
  
  const session = await getSession();
  return session?.accessToken || null;
}

/**
 * Get user data from current session
 * 
 * @returns User data if session exists, null otherwise
 */
export async function getSessionUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Validate session and return user ID
 * Used by API routes to authenticate requests
 * 
 * @returns User ID if authenticated, null otherwise
 */
export async function validateSessionAndGetUserId(): Promise<string | null> {
  const session = await getSession();
  
  if (!session) {
    return null;
  }
  
  // Check if token is expired
  if (isTokenExpired(session.expiresAt)) {
    // Try to refresh
    const refreshed = await refreshSessionIfNeeded();
    
    if (!refreshed) {
      return null;
    }
    
    // Get updated session
    const updatedSession = await getSession();
    return updatedSession?.user.id || null;
  }
  
  return session.user.id;
}
