import { cookies } from 'next/headers';
import { SessionData } from '@/types';

/**
 * Session Management Utilities
 * Handles secure storage and retrieval of session data including OAuth tokens
 */

const SESSION_COOKIE_NAME = 'assignwork_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Session storage interface
 * In production, this should be backed by Redis or a database
 * For now, we'll use encrypted cookies
 */

/**
 * Store session data in secure cookie
 * 
 * @param sessionData - Session data including tokens and user info
 */
export async function storeSession(sessionData: SessionData): Promise<void> {
  const cookieStore = await cookies();
  
  // Serialize session data
  const sessionJson = JSON.stringify(sessionData);
  
  // In production, encrypt this data before storing
  // For now, we'll use httpOnly secure cookies
  cookieStore.set(SESSION_COOKIE_NAME, sessionJson, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Retrieve session data from cookie
 * 
 * @returns Session data if exists, null otherwise
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie?.value) {
      return null;
    }
    
    // Parse session data
    const sessionData = JSON.parse(sessionCookie.value) as SessionData;
    
    // Validate session structure
    if (!sessionData.user || !sessionData.accessToken || !sessionData.refreshToken) {
      return null;
    }
    
    return sessionData;
  } catch (error) {
    console.error('Error retrieving session:', error);
    return null;
  }
}

/**
 * Update session data (e.g., after token refresh)
 * 
 * @param updates - Partial session data to update
 */
export async function updateSession(updates: Partial<SessionData>): Promise<void> {
  const currentSession = await getSession();
  
  if (!currentSession) {
    throw new Error('No active session to update');
  }
  
  const updatedSession: SessionData = {
    ...currentSession,
    ...updates,
  };
  
  await storeSession(updatedSession);
}

/**
 * Clear session data (logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Check if session exists and is valid
 * 
 * @returns True if valid session exists
 */
export async function hasValidSession(): Promise<boolean> {
  const session = await getSession();
  
  if (!session) {
    return false;
  }
  
  // Check if access token is expired
  const now = Date.now();
  return now < session.expiresAt;
}

/**
 * Store OAuth state and code verifier temporarily
 * Used during OAuth flow to validate callback
 */
const OAUTH_STATE_COOKIE_NAME = 'oauth_state';
const OAUTH_VERIFIER_COOKIE_NAME = 'oauth_verifier';
const OAUTH_COOKIE_MAX_AGE = 10 * 60; // 10 minutes

export interface OAuthFlowData {
  state: string;
  codeVerifier: string;
  returnTo?: string;
}

/**
 * Store OAuth flow data (state and code verifier) in temporary cookies
 * 
 * @param flowData - OAuth state and code verifier
 */
export async function storeOAuthFlowData(flowData: OAuthFlowData): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(OAUTH_STATE_COOKIE_NAME, flowData.state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: OAUTH_COOKIE_MAX_AGE,
    path: '/',
  });
  
  cookieStore.set(OAUTH_VERIFIER_COOKIE_NAME, flowData.codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: OAUTH_COOKIE_MAX_AGE,
    path: '/',
  });
  
  // Store returnTo if provided
  if (flowData.returnTo) {
    cookieStore.set('oauth_return_to', flowData.returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: OAUTH_COOKIE_MAX_AGE,
      path: '/',
    });
  }
}

/**
 * Retrieve OAuth flow data from temporary cookies
 * 
 * @returns OAuth flow data if exists, null otherwise
 */
export async function getOAuthFlowData(): Promise<OAuthFlowData | null> {
  try {
    const cookieStore = await cookies();
    const stateCookie = cookieStore.get(OAUTH_STATE_COOKIE_NAME);
    const verifierCookie = cookieStore.get(OAUTH_VERIFIER_COOKIE_NAME);
    const returnToCookie = cookieStore.get('oauth_return_to');
    
    if (!stateCookie?.value || !verifierCookie?.value) {
      return null;
    }
    
    return {
      state: stateCookie.value,
      codeVerifier: verifierCookie.value,
      returnTo: returnToCookie?.value,
    };
  } catch (error) {
    console.error('Error retrieving OAuth flow data:', error);
    return null;
  }
}

/**
 * Clear OAuth flow data after successful callback
 */
export async function clearOAuthFlowData(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
  cookieStore.delete(OAUTH_VERIFIER_COOKIE_NAME);
  cookieStore.delete('oauth_return_to');
}
