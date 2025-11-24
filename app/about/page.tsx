/**
 * Public about page - no authentication required
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            About AssignWork
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This is a public about page accessible without authentication.
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
              <h2 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                About AssignWork Service
              </h2>
              <p className="text-purple-800 dark:text-purple-300 text-sm">
                Work assignment and management system for efficient task distribution.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <h2 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                Public Access
              </h2>
              <p className="text-green-800 dark:text-green-300 text-sm">
                This page is publicly accessible and does not require authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
