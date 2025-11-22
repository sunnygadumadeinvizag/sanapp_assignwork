'use client';

/**
 * BasePath-aware Link Component
 * 
 * A wrapper around Next.js Link that automatically handles basepath.
 * Use this instead of the default Link component for internal navigation.
 */

import NextLink from 'next/link';
import { withBasePath, isExternalPath } from '@/lib/basepath';
import { ComponentProps } from 'react';

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * Link component that automatically prepends basePath to href
 * 
 * @example
 * <Link href="/dashboard">Dashboard</Link>
 * <Link href="/api/users" external>API</Link>
 */
export function Link({ href, ...props }: LinkProps) {
    // Convert href to string if it's an object
    const hrefString = typeof href === 'string' ? href : href.pathname || '/';

    // Don't modify external URLs or hash links
    const shouldModify = !isExternalPath(hrefString) && !hrefString.startsWith('#');

    // Apply basePath if needed
    const finalHref = shouldModify ? withBasePath(hrefString) : hrefString;

    return <NextLink {...props} href={finalHref} />;
}

export default Link;
