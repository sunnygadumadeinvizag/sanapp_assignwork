/**
 * Error Handling Utilities - AssignWork
 * 
 * Provides standardized error responses for internal application
 * Requirements: 5.2, 7.2, 7.3
 */

import { NextResponse } from 'next/server';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  error_description: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Application error codes
 */
export enum AppErrorCode {
  AUTHENTICATION_FAILED = 'authentication_failed',
  SESSION_EXPIRED = 'session_expired',
  INVALID_TOKEN = 'invalid_token',
  USER_NOT_FOUND = 'user_not_found',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  SSO_SERVICE_UNAVAILABLE = 'sso_service_unavailable',
  VALIDATION_ERROR = 'validation_error',
  INTERNAL_ERROR = 'internal_error',
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  errorCode: string,
  errorDescription: string,
  statusCode: number,
  requestId?: string
): NextResponse {
  const errorResponse: ErrorResponse = {
    error: errorCode,
    error_description: errorDescription,
    timestamp: new Date().toISOString(),
  };

  if (requestId) {
    errorResponse.requestId = requestId;
  }

  const response = NextResponse.json(errorResponse, { status: statusCode });

  if (requestId) {
    response.headers.set('x-request-id', requestId);
  }

  return response;
}

/**
 * Authentication error responses
 */
export class AuthenticationError {
  static sessionExpired(requestId?: string): NextResponse {
    return createErrorResponse(
      AppErrorCode.SESSION_EXPIRED,
      'Session expired. Please login again.',
      401,
      requestId
    );
  }

  static invalidToken(requestId?: string): NextResponse {
    return createErrorResponse(
      AppErrorCode.INVALID_TOKEN,
      'Invalid or expired token',
      401,
      requestId
    );
  }

  static authenticationFailed(requestId?: string): NextResponse {
    return createErrorResponse(
      AppErrorCode.AUTHENTICATION_FAILED,
      'Authentication failed. Please login again.',
      401,
      requestId
    );
  }
}

/**
 * Authorization error responses
 */
export class AuthorizationError {
  static userNotFound(requestId?: string): NextResponse {
    return createErrorResponse(
      AppErrorCode.USER_NOT_FOUND,
      "You don't have access to AssignWork. Please contact your administrator.",
      403,
      requestId
    );
  }

  static insufficientPermissions(requestId?: string): NextResponse {
    return createErrorResponse(
      AppErrorCode.INSUFFICIENT_PERMISSIONS,
      'Insufficient permissions to access this resource',
      403,
      requestId
    );
  }
}

/**
 * System error responses
 */
export class SystemError {
  static internalError(requestId?: string): NextResponse {
    return createErrorResponse(
      AppErrorCode.INTERNAL_ERROR,
      'An internal error occurred. Please try again later.',
      500,
      requestId
    );
  }

  static ssoServiceUnavailable(requestId?: string): NextResponse {
    return createErrorResponse(
      AppErrorCode.SSO_SERVICE_UNAVAILABLE,
      'SSO Service is temporarily unavailable. Please try again later.',
      503,
      requestId
    );
  }
}

/**
 * Handle unknown errors gracefully
 */
export function handleUnknownError(error: unknown, requestId?: string): NextResponse {
  console.error('[Unknown Error]', {
    requestId,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  return SystemError.internalError(requestId);
}

/**
 * Check if error is from SSO service
 */
export function isSSOServiceError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('sso') ||
      message.includes('econnrefused') ||
      message.includes('fetch failed')
    );
  }
  return false;
}
