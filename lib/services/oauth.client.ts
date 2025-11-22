import axios from 'axios';
import { ssoConfig } from '../sso-config';
import { TokenResponse, SSOUser } from '@/types';

/**
 * OAuth2 Client Service for AssignWork
 * Handles OAuth2 authorization code flow with PKCE
 */

/**
 * PKCE (Proof Key for Code Exchange) utilities
 * Using Web Crypto API for Edge Runtime compatibility
 */

/**
 * Convert ArrayBuffer to base64url string
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  // Convert base64 to base64url
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generateCodeVerifier(): string {
  // Generate a random 43-128 character string using Web Crypto API
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return arrayBufferToBase64Url(array.buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  // SHA256 hash of the verifier, base64url encoded using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64Url(hash);
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return arrayBufferToBase64Url(array.buffer);
}

/**
 * OAuth2 Authorization Request Parameters
 */
export interface AuthorizationParams {
  state?: string;
  codeVerifier?: string;
  scope?: string;
}

/**
 * OAuth2 Authorization Result
 */
export interface AuthorizationResult {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
}

/**
 * Initiate OAuth2 authorization flow
 * Generates PKCE parameters and constructs authorization URL
 * 
 * @param params - Optional authorization parameters
 * @returns Authorization URL and PKCE parameters to store in session
 */
export async function initiateAuth(params?: AuthorizationParams): Promise<AuthorizationResult> {
  // Generate PKCE parameters
  const codeVerifier = params?.codeVerifier || generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = params?.state || generateState();

  // Construct authorization URL
  const authUrl = new URL(ssoConfig.authorizeUrl);
  authUrl.searchParams.set('client_id', ssoConfig.clientId);
  authUrl.searchParams.set('redirect_uri', ssoConfig.callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  
  if (params?.scope) {
    authUrl.searchParams.set('scope', params.scope);
  }

  return {
    authorizationUrl: authUrl.toString(),
    state,
    codeVerifier,
  };
}

/**
 * Callback Handler Parameters
 */
export interface CallbackParams {
  code: string;
  state: string;
  codeVerifier: string;
  expectedState: string;
}

/**
 * Callback Handler Result
 */
export interface CallbackResult {
  success: boolean;
  tokens?: TokenResponse;
  userInfo?: SSOUser;
  error?: string;
  errorDescription?: string;
}

/**
 * Handle OAuth2 callback
 * Validates state, exchanges authorization code for tokens, and fetches user info
 * 
 * @param params - Callback parameters including code, state, and code verifier
 * @returns Tokens and user information if successful
 */
export async function handleCallback(params: CallbackParams): Promise<CallbackResult> {
  try {
    // Validate state parameter (CSRF protection)
    if (params.state !== params.expectedState) {
      return {
        success: false,
        error: 'invalid_state',
        errorDescription: 'State parameter mismatch - possible CSRF attack',
      };
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForToken(params.code, params.codeVerifier);

    if (!tokens) {
      return {
        success: false,
        error: 'token_exchange_failed',
        errorDescription: 'Failed to exchange authorization code for tokens',
      };
    }

    // Fetch user information using access token
    const userInfo = await fetchUserInfo(tokens.access_token);

    if (!userInfo) {
      return {
        success: false,
        error: 'userinfo_fetch_failed',
        errorDescription: 'Failed to fetch user information from SSO',
      };
    }

    return {
      success: true,
      tokens,
      userInfo,
    };
  } catch (error) {
    console.error('OAuth2 callback error:', error);
    
    return {
      success: false,
      error: 'callback_error',
      errorDescription: error instanceof Error ? error.message : 'Unknown error during callback',
    };
  }
}

/**
 * Exchange authorization code for access and refresh tokens
 * 
 * @param code - Authorization code from SSO
 * @param codeVerifier - PKCE code verifier
 * @returns Token response with access and refresh tokens
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<TokenResponse | null> {
  try {
    const response = await axios.post<TokenResponse>(
      ssoConfig.tokenUrl,
      {
        grant_type: 'authorization_code',
        code,
        client_id: ssoConfig.clientId,
        redirect_uri: ssoConfig.callbackUrl,
        code_verifier: codeVerifier,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Token exchange error:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('Token exchange error response:', error.response.data);
    }
    
    return null;
  }
}

/**
 * Fetch user information from SSO using access token
 * 
 * @param accessToken - Valid access token
 * @returns User information from SSO
 */
export async function fetchUserInfo(accessToken: string): Promise<SSOUser | null> {
  try {
    const response = await axios.get<SSOUser>(
      ssoConfig.userinfoUrl,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('User info fetch error:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('User info error response:', error.response.data);
    }
    
    return null;
  }
}

/**
 * Refresh access token using refresh token
 * 
 * @param refreshToken - Valid refresh token
 * @returns New token response with fresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse | null> {
  try {
    const response = await axios.post<TokenResponse>(
      ssoConfig.tokenUrl,
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: ssoConfig.clientId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('Token refresh error response:', error.response.data);
    }
    
    return null;
  }
}

/**
 * Check if access token is expired or about to expire
 * 
 * @param expiresAt - Token expiration timestamp (milliseconds)
 * @param bufferSeconds - Buffer time in seconds before expiration (default: 60)
 * @returns True if token is expired or about to expire
 */
export function isTokenExpired(expiresAt: number, bufferSeconds: number = 60): boolean {
  const now = Date.now();
  const bufferMs = bufferSeconds * 1000;
  return now >= (expiresAt - bufferMs);
}

/**
 * Calculate token expiration timestamp
 * 
 * @param expiresIn - Token lifetime in seconds
 * @returns Expiration timestamp in milliseconds
 */
export function calculateExpiresAt(expiresIn: number): number {
  return Date.now() + (expiresIn * 1000);
}
