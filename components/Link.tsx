'use client';

/**
 * BasePath-aware Link Component
 * 
 * A wrapper around Next.js Link that works with basePath configuration.
 * Note: Next.js automatically handles basePath for Link components,
 * so we don't need to manually prepend it. This component exists for
 * consistency and future extensibility.
 */

import NextLink from 'next/link';
import { ComponentProps } from 'react';

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * Link component that works with basePath configuration
 * Next.js automatically prepends basePath to all Link hrefs
 * 
 * @example
 * <Link href="/dashboard">Dashboard</Link>
 * // With basePath="/sso", this becomes /sso/dashboard automatically
 */
export function Link(props: LinkProps) {
    // Next.js Link already handles basePath automatically
    // No need to manually prepend it
    return <NextLink {...props} />;
}

export default Link;
