/**
 * BasePath Utilities
 * 
 * Centralized utilities for handling basepath in the application.
 * This ensures all paths, API calls, and navigation work correctly
 * regardless of deployment path.
 */

/**
 * Get the configured base path for the application
 * @returns The base path (e.g., "/sso" or "")
 */
export function getBasePath(): string {
    return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

/**
 * Prepend the base path to a given path
 * @param path - The path to prepend (should start with /)
 * @returns The path with base path prepended
 * 
 * @example
 * withBasePath('/dashboard') // Returns '/sso/dashboard' if basePath is '/sso'
 * withBasePath('/api/users') // Returns '/sso/api/users' if basePath is '/sso'
 */
export function withBasePath(path: string): string {
    const basePath = getBasePath();

    // Handle empty path
    if (!path) return basePath || '/';

    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Return path with basePath prepended
    return basePath ? `${basePath}${normalizedPath}` : normalizedPath;
}

/**
 * Get the full API URL for a given endpoint
 * @param endpoint - The API endpoint (e.g., '/users' or 'users')
 * @returns The full API URL
 * 
 * @example
 * apiUrl('/users') // Returns '/sso/api/users' if basePath is '/sso'
 * apiUrl('users') // Returns '/sso/api/users' if basePath is '/sso'
 */
export function apiUrl(endpoint: string): string {
    // Remove leading slash if present
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // Use configured API URL or construct from basePath
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || withBasePath('/api');

    return `${apiBaseUrl}/${normalizedEndpoint}`;
}

/**
 * Remove base path from a given path
 * Useful for middleware and server-side processing
 * @param path - The full path including base path
 * @returns The path without base path
 * 
 * @example
 * removeBasePath('/sso/dashboard') // Returns '/dashboard' if basePath is '/sso'
 */
export function removeBasePath(path: string): string {
    const basePath = getBasePath();

    if (!basePath || !path.startsWith(basePath)) {
        return path;
    }

    return path.slice(basePath.length) || '/';
}

/**
 * Check if a path is external (absolute URL)
 * @param path - The path to check
 * @returns True if the path is external
 */
export function isExternalPath(path: string): boolean {
    return /^https?:\/\//.test(path);
}

/**
 * Get the application base URL
 * @returns The full application URL
 */
export function getAppUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL ||
        (typeof window !== 'undefined' ? window.location.origin + getBasePath() : '');
}

/**
 * Construct a full URL for a given path
 * @param path - The path to construct URL for
 * @returns The full URL
 */
export function getFullUrl(path: string): string {
    if (isExternalPath(path)) {
        return path;
    }

    const appUrl = getAppUrl();
    const pathWithBase = withBasePath(path);

    return `${appUrl}${pathWithBase}`;
}
