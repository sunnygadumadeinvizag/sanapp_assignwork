'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/**
 * Error messages for different error types
 * Requirements: 5.2, 12.3
 */
const ERROR_MESSAGES: Record<string, { title: string; message: string; showContactAdmin: boolean }> = {
  user_not_found: {
    title: 'Access Denied',
    message: "You don't have access to AssignWork. Your account was authenticated successfully, but you don't have a local user record in this application. Please contact your administrator to request access.",
    showContactAdmin: true,
  },
  user_sync_failed: {
    title: 'User Synchronization Failed',
    message: 'We were unable to synchronize your user information from the SSO service. Please try again or contact your administrator if the problem persists.',
    showContactAdmin: true,
  },
  missing_parameters: {
    title: 'Invalid Request',
    message: 'The authentication request is missing required parameters. Please try logging in again.',
    showContactAdmin: false,
  },
  invalid_state: {
    title: 'Invalid Session',
    message: 'The authentication session is invalid or has expired. This could be due to a timeout or a security issue. Please try logging in again.',
    showContactAdmin: false,
  },
  callback_failed: {
    title: 'Authentication Failed',
    message: 'The authentication process failed. Please try again.',
    showContactAdmin: false,
  },
  server_error: {
    title: 'Server Error',
    message: 'An internal server error occurred during authentication. Please try again later.',
    showContactAdmin: true,
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') || 'unknown';
  const errorDescription = searchParams.get('description');
  
  const errorInfo = ERROR_MESSAGES[errorCode] || {
    title: 'Authentication Error',
    message: errorDescription || 'An unexpected error occurred during authentication. Please try again.',
    showContactAdmin: true,
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            There was a problem with your authentication.
          </p>
        </div>
        
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            {errorInfo.message}
          </p>
          
          {errorDescription && errorCode !== 'user_not_found' && (
            <p className="mt-2 text-xs text-red-700 font-mono">
              Details: {errorDescription}
            </p>
          )}
        </div>
        
        <div className="mt-6 space-y-3">
          <a
            href="/api/auth/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Try Again
          </a>
          
          {errorInfo.showContactAdmin && (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                If the problem persists, please contact your system administrator.
              </p>
            </div>
          )}
        </div>
        
        {errorCode === 'user_not_found' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Access to AssignWork is managed independently from SSO authentication. 
              Your administrator needs to create a local user record for you in this application.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Authentication Error Page
 * Displays user-friendly error messages for authentication failures
 * Requirements: 1.1, 1.2, 5.2, 12.2, 12.3
 */
export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
