'use client';

/**
 * Authentication Loading Page
 * Displays loading state while redirecting to SSO
 * Requirements: 1.1, 12.2
 */
export default function AuthLoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow-md text-center">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Redirecting to Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You will be redirected to the SSO service to authenticate
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Please wait...
          </p>
        </div>
      </div>
    </div>
  );
}
