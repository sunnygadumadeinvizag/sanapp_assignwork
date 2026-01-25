import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/utils/session.utils';
import axios from 'axios';

// Session timing configuration (must match other configs)
const SESSION_CONFIG = {
    // Extension duration in milliseconds (10 minutes)
    EXTENSION_DURATION_MS: 10 * 60 * 1000,
    // Maximum session duration in milliseconds (6 hours)
    MAX_SESSION_DURATION_MS: 6 * 60 * 60 * 1000,
};

/**
 * Extend Session Endpoint (Proxy to SSO)
 * 
 * Extends the current session by calling SSO and updating local session.
 */
export async function POST(request: NextRequest) {
    try {
        // Get current session
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'No active session' },
                { status: 401 }
            );
        }

        // Check session age from stored timing info
        const sessionTiming = request.headers.get('x-session-timing');
        let sessionCreatedAt = session.createdAt || Date.now();

        if (sessionTiming) {
            try {
                const timing = JSON.parse(sessionTiming);
                sessionCreatedAt = timing.sessionCreatedAt || sessionCreatedAt;
            } catch (e) {
                // Ignore parsing errors
            }
        }

        const now = Date.now();
        const sessionAge = now - sessionCreatedAt;

        // Check if max session duration reached
        if (sessionAge >= SESSION_CONFIG.MAX_SESSION_DURATION_MS) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Maximum session duration reached',
                    maxSessionReached: true,
                },
                { status: 403 }
            );
        }

        // Try to call SSO extend-session endpoint
        try {
            const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || 'http://localhost:3000/sso';

            const response = await axios.post(
                `${ssoUrl}/api/extend-session`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${session.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 5000,
                    validateStatus: () => true, // Don't throw on non-2xx
                }
            );

            // Check if SSO says max session reached
            if (response.data?.maxSessionReached) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Maximum session duration reached',
                        maxSessionReached: true,
                    },
                    { status: 403 }
                );
            }
        } catch (ssoError) {
            // SSO call failed, but we can still extend locally
            console.warn('SSO extend-session call failed:', ssoError);
        }

        // Calculate new expiration
        const maxAllowedExpiration = sessionCreatedAt + SESSION_CONFIG.MAX_SESSION_DURATION_MS;
        const requestedExpiration = now + SESSION_CONFIG.EXTENSION_DURATION_MS;
        const newExpiresAt = Math.min(requestedExpiration, maxAllowedExpiration);

        // Update local session with new expiration
        await updateSession({
            expiresAt: newExpiresAt,
        });

        // Check if approaching max
        const remainingTime = maxAllowedExpiration - newExpiresAt;
        const maxApproaching = remainingTime < SESSION_CONFIG.EXTENSION_DURATION_MS;

        return NextResponse.json(
            {
                success: true,
                expiresAt: newExpiresAt,
                maxSessionReached: false,
                maxApproaching,
                remainingSessionTime: maxAllowedExpiration - now,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Extend session error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to extend session' },
            { status: 500 }
        );
    }
}
