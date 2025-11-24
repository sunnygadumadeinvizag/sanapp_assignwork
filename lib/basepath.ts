/**
 * Basepath utilities for handling environment-based routing
 */

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';
export const SSO_URL = process.env.NEXT_PUBLIC_SSO_URL || 'http://localhost:3000/sso';

/**
 * Get the basepath for the application
 */
export function getBasePath(): string {
  return BASE_PATH;
}

/**
 * Get the app URL
 */
export function getAppUrl(): string {
  return APP_URL;
}

/**
 * Prepend basepath to a path
 */
export function withBasePath(path: string): string {
  if (!path) return BASE_PATH || '/';
  
  // Remove leading slash if basepath exists
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If no basepath, return path as-is
  if (!BASE_PATH) return cleanPath;
  
  // Avoid double basepath
  if (cleanPath.startsWith(BASE_PATH)) return cleanPath;
  
  return `${BASE_PATH}${cleanPath}`;
}

/**
 * Get full URL with basepath
 */
export function getFullUrl(path: string): string {
  const pathWithBase = withBasePath(path);
  return `${APP_URL}${pathWithBase.startsWith('/') ? pathWithBase.slice(APP_URL.length) : pathWithBase}`;
}

/**
 * Get SSO URL with path
 */
export function getSSOUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SSO_URL}${cleanPath}`;
}

/**
 * Get API URL with basepath
 */
export function getApiUrl(path: string): string {
  return withBasePath(`/api${path.startsWith('/') ? path : `/${path}`}`);
}

/**
 * Remove basepath from a path (useful for parsing)
 */
export function removeBasePath(path: string): string {
  if (!BASE_PATH || !path.startsWith(BASE_PATH)) return path;
  return path.slice(BASE_PATH.length) || '/';
}
