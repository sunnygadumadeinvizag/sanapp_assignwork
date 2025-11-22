'use client';

/**
 * BasePath React Hooks
 * 
 * React hooks for working with basepath in components.
 */

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { getBasePath, withBasePath, removeBasePath, getAppUrl } from '@/lib/basepath';

/**
 * Hook to access basepath utilities in React components
 * 
 * @example
 * const { basePath, withBasePath, navigate } = useBasePath();
 * 
 * // Navigate to a page
 * navigate('/dashboard');
 * 
 * // Get path with basePath
 * const path = withBasePath('/api/users');
 */
export function useBasePath() {
    const router = useRouter();
    const pathname = usePathname();

    const basePath = useMemo(() => getBasePath(), []);
    const appUrl = useMemo(() => getAppUrl(), []);

    /**
     * Navigate to a path (automatically adds basePath)
     */
    const navigate = useCallback((path: string, options?: { replace?: boolean }) => {
        const fullPath = withBasePath(path);

        if (options?.replace) {
            router.replace(fullPath);
        } else {
            router.push(fullPath);
        }
    }, [router]);

    /**
     * Get current pathname without basePath
     */
    const currentPath = useMemo(() => {
        return removeBasePath(pathname || '/');
    }, [pathname]);

    return {
        basePath,
        appUrl,
        withBasePath,
        navigate,
        currentPath,
        pathname,
    };
}

/**
 * Hook to check if a path is currently active
 * 
 * @example
 * const isActive = useIsActivePath('/dashboard');
 */
export function useIsActivePath(path: string): boolean {
    const pathname = usePathname();
    const normalizedPath = withBasePath(path);

    return pathname === normalizedPath;
}

/**
 * Hook to check if a path starts with a given prefix
 * Useful for highlighting active menu items
 * 
 * @example
 * const isActive = usePathStartsWith('/dashboard');
 */
export function usePathStartsWith(prefix: string): boolean {
    const pathname = usePathname();
    const normalizedPrefix = withBasePath(prefix);

    return pathname?.startsWith(normalizedPrefix) || false;
}
