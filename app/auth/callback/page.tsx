'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Authentication Callback Loading Page
 * Displays loading state while authentication is being processed
 * Requirements: 1.1, 1.2, 12.2
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // This page is shown briefly while the API route processes the callback
    // If the user lands here directly (not via redirect), send them to login
    const timer = setTimeout(() => {
      router.push('/api/auth/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow-md text-center">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Authenticating...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please wait while we verify your credentials
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
            <p className="text-sm text-gray-600">Verifying authorization code</p>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <p className="text-sm text-gray-600">Exchanging tokens</p>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <p className="text-sm text-gray-600">Loading your profile</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This should only take a moment...
          </p>
        </div>
      </div>
    </div>
  );
}
