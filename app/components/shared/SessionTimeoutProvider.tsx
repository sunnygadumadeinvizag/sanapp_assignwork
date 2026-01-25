'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import SessionTimeoutModal from './SessionTimeoutModal';

// Session timeout config fetched from SSO
interface SessionConfig {
    warningBeforeLogoutMs: number;
    countdownDurationSec: number;
    extensionDurationMs: number;
    maxSessionDurationMs: number;
    activityCheckIntervalMs: number;
    activityThrottleMs: number;
    activityEvents: readonly string[];
}

// Default config (fallback if SSO unreachable)
const DEFAULT_CONFIG: SessionConfig = {
    warningBeforeLogoutMs: 9 * 60 * 1000,
    countdownDurationSec: 60,
    extensionDurationMs: 10 * 60 * 1000,
    maxSessionDurationMs: 6 * 60 * 60 * 1000,
    activityCheckIntervalMs: 30 * 1000,
    activityThrottleMs: 5 * 1000,
    activityEvents: ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'],
};

interface SessionTimeoutContextType {
    resetIdleTimer: () => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | null>(null);

export const useSessionTimeout = () => {
    const context = useContext(SessionTimeoutContext);
    if (!context) {
        throw new Error('useSessionTimeout must be used within SessionTimeoutProvider');
    }
    return context;
};

interface SessionTimeoutProviderProps {
    children: React.ReactNode;
    enabled?: boolean;
}

export default function SessionTimeoutProvider({
    children,
    enabled = true
}: SessionTimeoutProviderProps) {
    const [showModal, setShowModal] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [isExtending, setIsExtending] = useState(false);
    const [maxSessionReached, setMaxSessionReached] = useState(false);
    const [config, setConfig] = useState<SessionConfig>(DEFAULT_CONFIG);
    const [configLoaded, setConfigLoaded] = useState(false);

    const lastActivityRef = useRef<number>(Date.now());
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const activityThrottleRef = useRef<number>(0);

    // Get SSO URL
    const ssoUrl = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_SSO_URL || 'http://localhost:3000/sso')
        : 'http://localhost:3000/sso';

    // Get base path for local API calls
    const basePath = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_BASE_PATH || '')
        : '';

    // Fetch session config from SSO on mount
    useEffect(() => {
        if (!enabled) return;

        const fetchConfig = async () => {
            try {
                // No credentials needed - session-config is a public endpoint
                const response = await fetch(`${ssoUrl}/api/session-config`);
                if (response.ok) {
                    const data = await response.json();
                    setConfig(data);
                    setCountdown(data.countdownDurationSec);
                }
            } catch (error) {
                console.warn('Failed to fetch session config from SSO, using defaults');
            } finally {
                setConfigLoaded(true);
            }
        };

        fetchConfig();
    }, [enabled, ssoUrl]);

    // Check session status with SSO before showing modal
    const checkSSOSessionStatus = useCallback(async (): Promise<{ shouldShowModal: boolean; maxReached: boolean }> => {
        try {
            const response = await fetch(`${ssoUrl}/api/validate-session`, {
                credentials: 'include',
            });

            if (!response.ok) {
                // Session is invalid, should logout
                return { shouldShowModal: true, maxReached: false };
            }

            const data = await response.json();

            if (!data.valid) {
                return { shouldShowModal: true, maxReached: false };
            }

            // Check if session was extended elsewhere
            if (data.sessionTiming) {
                const { maxSessionApproaching, timeUntilExpiry } = data.sessionTiming;
                const warningThreshold = config.countdownDurationSec * 1000 + 5000; // countdown + 5s buffer

                // If session has more time than warning threshold, it was extended elsewhere
                if (timeUntilExpiry > warningThreshold) {
                    console.log('[Session] Session was extended elsewhere, resetting timer');
                    return { shouldShowModal: false, maxReached: false };
                }

                // Check if max session reached
                if (maxSessionApproaching && timeUntilExpiry <= warningThreshold) {
                    return { shouldShowModal: true, maxReached: true };
                }

                // Session is actually about to expire
                return { shouldShowModal: true, maxReached: false };
            }

            // Fallback: show modal if we couldn't determine timing
            return { shouldShowModal: true, maxReached: false };
        } catch (error) {
            console.error('Error checking SSO session status:', error);
            // On error, don't show modal (might be network issue)
            return { shouldShowModal: false, maxReached: false };
        }
    }, [ssoUrl, config.countdownDurationSec]);

    // Reset idle timer
    const resetIdleTimer = useCallback(() => {
        if (!enabled || !configLoaded || showModal) return;

        const now = Date.now();

        // Throttle activity updates
        if (now - activityThrottleRef.current < config.activityThrottleMs) {
            return;
        }
        activityThrottleRef.current = now;
        lastActivityRef.current = now;

        // Clear existing timer
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }

        // Set new idle timer - check with SSO when it fires
        idleTimerRef.current = setTimeout(async () => {
            const { shouldShowModal, maxReached } = await checkSSOSessionStatus();

            if (shouldShowModal) {
                setMaxSessionReached(maxReached);
                setShowModal(true);
                setCountdown(config.countdownDurationSec);
            } else {
                // Session was extended elsewhere, reset timer
                resetIdleTimer();
            }
        }, config.warningBeforeLogoutMs);
    }, [enabled, configLoaded, showModal, config, checkSSOSessionStatus]);

    // Set up activity listeners
    useEffect(() => {
        if (!enabled || !configLoaded) return;

        const handleActivity = () => {
            resetIdleTimer();
        };

        // Add event listeners for user activity
        config.activityEvents.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Also listen for visibility change
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                // Check with SSO when tab becomes visible
                const { shouldShowModal, maxReached } = await checkSSOSessionStatus();

                if (shouldShowModal) {
                    const now = Date.now();
                    const timeSinceLastActivity = now - lastActivityRef.current;

                    if (timeSinceLastActivity >= config.warningBeforeLogoutMs) {
                        setMaxSessionReached(maxReached);
                        setShowModal(true);
                        setCountdown(config.countdownDurationSec);
                    } else {
                        resetIdleTimer();
                    }
                } else {
                    resetIdleTimer();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Start initial idle timer
        resetIdleTimer();

        return () => {
            config.activityEvents.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
        };
    }, [enabled, configLoaded, config, resetIdleTimer, checkSSOSessionStatus]);

    // Countdown timer
    useEffect(() => {
        if (!showModal) {
            if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
            }
            return;
        }

        countdownTimerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    handleLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
            }
        };
    }, [showModal]);

    // Handle session extension
    const handleExtendSession = async () => {
        if (maxSessionReached) return;

        setIsExtending(true);

        try {
            const response = await fetch(`${basePath}/api/auth/extend-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                setShowModal(false);
                setCountdown(config.countdownDurationSec);
                resetIdleTimer();
            } else if (data.maxSessionReached) {
                setMaxSessionReached(true);
            } else {
                console.error('Failed to extend session:', data.error);
                setShowModal(false);
                resetIdleTimer();
            }
        } catch (error) {
            console.error('Error extending session:', error);
            setShowModal(false);
            resetIdleTimer();
        } finally {
            setIsExtending(false);
        }
    };

    // Handle logout
    const handleLogout = async () => {
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
        }

        const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

        try {
            await fetch(`${basePath}/api/auth/logout`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        const loginUrl = `${ssoUrl}/login?callbackUrl=${encodeURIComponent(currentUrl)}`;
        window.location.href = loginUrl;
    };

    return (
        <SessionTimeoutContext.Provider value={{ resetIdleTimer }}>
            {children}
            <SessionTimeoutModal
                isOpen={showModal}
                countdown={countdown}
                onExtend={handleExtendSession}
                onLogout={handleLogout}
                isExtending={isExtending}
                maxSessionReached={maxSessionReached}
            />
        </SessionTimeoutContext.Provider>
    );
}
