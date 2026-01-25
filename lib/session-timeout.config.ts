// Session Timeout Configuration
// Controls auto-logout behavior with warning modal

export const SESSION_TIMEOUT_CONFIG = {
    // Time in milliseconds before showing warning modal (9 minutes)
    WARNING_BEFORE_LOGOUT_MS: 9 * 60 * 1000,

    // Countdown duration in seconds (60 seconds)
    COUNTDOWN_DURATION_SEC: 60,

    // Extension duration in milliseconds (10 minutes)
    EXTENSION_DURATION_MS: 10 * 60 * 1000,

    // Maximum session duration in milliseconds (6 hours)
    MAX_SESSION_DURATION_MS: 6 * 60 * 60 * 1000,

    // Activity check interval in milliseconds (30 seconds)
    ACTIVITY_CHECK_INTERVAL_MS: 30 * 1000,

    // Events that count as user activity
    ACTIVITY_EVENTS: ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const,

    // Throttle activity updates to avoid too frequent updates (5 seconds)
    ACTIVITY_THROTTLE_MS: 5 * 1000,
};

// Session timing types
export interface SessionTimingInfo {
    sessionCreatedAt: number;  // Timestamp when session was created
    lastActivityAt: number;    // Timestamp of last user activity
    expiresAt: number;         // Token expiration timestamp
}

export interface ExtendSessionResponse {
    success: boolean;
    expiresAt?: number;
    maxSessionReached?: boolean;
    error?: string;
}
