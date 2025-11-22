import { cookies } from 'next/headers';

/**
 * Home Page
 * Protected route that requires authentication
 * Requirements: 1.1, 1.2, 1.3, 12.2
 */
export default async function Home() {
  // Get session from cookies to display user info
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  
  let user = null;
  if (sessionCookie) {
    try {
      const sessionData = JSON.parse(sessionCookie.value);
      user = sessionData.user;
    } catch (error) {
      console.error('Failed to parse session:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">AssignWork</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <span className="text-sm text-gray-700">
                    Welcome, <strong>{user.username}</strong>
                  </span>
                  <a
                    href="/api/auth/logout"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    Logout
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to AssignWork
            </h2>
            
            {user && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-sm text-green-800">
                    ✓ You are successfully authenticated via SSO
                  </p>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Your Profile
                  </h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Username</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">User ID</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
                    </div>
                  </dl>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Quick Links
                  </h3>
                  <div className="space-y-2">
                    <a
                      href="/dashboard"
                      className="block text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      → Go to Dashboard
                    </a>
                    <a
                      href="/tasks"
                      className="block text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      → View Tasks
                    </a>
                    <a
                      href="/api/example/tasks"
                      className="block text-blue-600 hover:text-blue-800 text-sm"
                    >
                      → View Example Tasks API
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {!user && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  This is a protected application that requires authentication through SSO.
                </p>
                <a
                  href="/api/auth/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Login with SSO
                </a>
                <div className="mt-4 text-sm text-gray-500">
                  <p className="font-medium mb-2">Try accessing protected pages (will redirect to SSO):</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><a href="/dashboard" className="text-blue-600 hover:underline">/dashboard</a></li>
                    <li><a href="/tasks" className="text-blue-600 hover:underline">/tasks</a></li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
