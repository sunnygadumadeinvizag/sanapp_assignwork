/**
 * API Client
 * 
 * Centralized API client that handles basepath automatically.
 * All API calls should use this client to ensure correct paths.
 */

import { apiUrl } from './basepath';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public data?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Fetch wrapper that automatically handles basepath for API calls
 * @param endpoint - The API endpoint (e.g., '/users' or 'users')
 * @param options - Fetch options
 * @returns The response data
 * 
 * @example
 * const users = await fetchApi('/users');
 * const user = await fetchApi('/users/123');
 * const created = await fetchApi('/users', { method: 'POST', body: JSON.stringify(data) });
 */
export async function fetchApi<T = any>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = apiUrl(endpoint);

    // Default headers
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options?.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Handle non-OK responses
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = { message: response.statusText };
            }

            throw new ApiError(
                errorData.message || `API Error: ${response.status}`,
                response.status,
                errorData
            );
        }

        // Parse JSON response
        const data = await response.json();
        return data as T;
    } catch (error) {
        // Re-throw ApiError as-is
        if (error instanceof ApiError) {
            throw error;
        }

        // Wrap other errors
        throw new ApiError(
            error instanceof Error ? error.message : 'Unknown error',
            500,
            error
        );
    }
}

/**
 * GET request helper
 */
export async function get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return fetchApi<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export async function post<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
): Promise<T> {
    return fetchApi<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
    });
}

/**
 * PUT request helper
 */
export async function put<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
): Promise<T> {
    return fetchApi<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
    });
}

/**
 * PATCH request helper
 */
export async function patch<T = any>(
    endpoint: string,
    data?: any,
    options?: RequestInit
): Promise<T> {
    return fetchApi<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
    });
}

/**
 * DELETE request helper
 */
export async function del<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return fetchApi<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Export all methods as a single API object
 */
export const api = {
    fetch: fetchApi,
    get,
    post,
    put,
    patch,
    delete: del,
};

export default api;
