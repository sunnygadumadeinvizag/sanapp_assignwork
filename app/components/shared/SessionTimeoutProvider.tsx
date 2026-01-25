'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import SessionTimeoutModal from './SessionTimeoutModal';
import { SESSION_TIMEOUT_CONFIG } from '@/lib/session-timeout.config';

interface SessionTimeoutContextType {
    resetIdleTimer: () => void;
    getSessionInfo: () => SessionInfo | null;
}

interface SessionInfo {
    sessionCreatedAt: number;
    lastActivityAt: number;
    expiresAt: number;
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
    const [countdown, setCountdown] = useState(SESSION_TIMEOUT_CONFIG.COUNTDOWN_DURATION_SEC);
    const [isExtending, setIsExtending] = useState(false);
    const [maxSessionReached, setMaxSessionReached] = useState(false);

    // Session timing state
    const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const activityThrottleRef = useRef<number>(0);

    // Get base path for API calls
    const basePath = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_BASE_PATH || '')
        : '';

    // Initialize session info from storage
    useEffect(() => {
        if (!enabled) return;

        const initSessionInfo = () => {
            try {
                const stored = localStorage.getItem('session_timing');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setSessionInfo(parsed);
                } else {
                    // Initialize new session timing
                    const now = Date.now();
                    const newInfo: SessionInfo = {
                        sessionCreatedAt: now,
                        lastActivityAt: now,
                        expiresAt: now + SESSION_TIMEOUT_CONFIG.WARNING_BEFORE_LOGOUT_MS + (SESSION_TIMEOUT_CONFIG.COUNTDOWN_DURATION_SEC * 1000),
                    };
                    localStorage.setItem('session_timing', JSON.stringify(newInfo));
                    setSessionInfo(newInfo);
                }
            } catch (error) {
                console.error('Error initializing session timing:', error);
            }
        };

        initSessionInfo();
    }, [enabled]);

    // Check if max session duration reached
    const checkMaxSession = useCallback(() => {
        if (!sessionInfo) return false;

        const now = Date.now();
        const sessionDuration = now - sessionInfo.sessionCreatedAt;
        return sessionDuration >= SESSION_TIMEOUT_CONFIG.MAX_SESSION_DURATION_MS;
    }, [sessionInfo]);

    // Reset idle timer
    const resetIdleTimer = useCallback(() => {
        if (!enabled || showModal) return;

        const now = Date.now();

        // Throttle activity updates
        if (now - activityThrottleRef.current < SESSION_TIMEOUT_CONFIG.ACTIVITY_THROTTLE_MS) {
            return;
        }
        activityThrottleRef.current = now;
        lastActivityRef.current = now;

        // Update session info
        if (sessionInfo) {
            const updatedInfo = { ...sessionInfo, lastActivityAt: now };
            setSessionInfo(updatedInfo);
            try {
                localStorage.setItem('session_timing', JSON.stringify(updatedInfo));
            } catch (error) {
                console.error('Error updating session timing:', error);
            }
        }

        // Clear existing timer
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }

        // Check max session first
        if (checkMaxSession()) {
            setMaxSessionReached(true);
            setShowModal(true);
            setCountdown(SESSION_TIMEOUT_CONFIG.COUNTDOWN_DURATION_SEC);
            return;
        }

        // Set new idle timer
        idleTimerRef.current = setTimeout(() => {
            if (checkMaxSession()) {
                setMaxSessionReached(true);
            }
            setShowModal(true);
            setCountdown(SESSION_TIMEOUT_CONFIG.COUNTDOWN_DURATION_SEC);
        }, SESSION_TIMEOUT_CONFIG.WARNING_BEFORE_LOGOUT_MS);
    }, [enabled, showModal, sessionInfo, checkMaxSession]);

    // Get session info
    const getSessionInfo = useCallback(() => sessionInfo, [sessionInfo]);

    // Set up activity listeners
    useEffect(() => {
        if (!enabled) return;

        const handleActivity = () => {
            resetIdleTimer();
        };

        // Add event listeners for user activity
        SESSION_TIMEOUT_CONFIG.ACTIVITY_EVENTS.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Also listen for visibility change
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Check if we should show the modal when tab becomes visible
                const now = Date.now();
                const timeSinceLastActivity = now - lastActivityRef.current;

                if (timeSinceLastActivity >= SESSION_TIMEOUT_CONFIG.WARNING_BEFORE_LOGOUT_MS) {
                    if (checkMaxSession()) {
                        setMaxSessionReached(true);
                    }
                    setShowModal(true);
                    setCountdown(SESSION_TIMEOUT_CONFIG.COUNTDOWN_DURATION_SEC);
                } else {
                    resetIdleTimer();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Start initial idle timer
        resetIdleTimer();

        return () => {
            SESSION_TIMEOUT_CONFIG.ACTIVITY_EVENTS.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
            }
        };
    }, [enabled, resetIdleTimer, checkMaxSession]);

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
                    // Time's up - logout
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
                // Update session info with new expiration
                if (sessionInfo && data.expiresAt) {
                    const updatedInfo = {
                        ...sessionInfo,
                        lastActivityAt: Date.now(),
                        expiresAt: data.expiresAt,
                    };
                    setSessionInfo(updatedInfo);
                    localStorage.setItem('session_timing', JSON.stringify(updatedInfo));
                }

                // Close modal and reset
                setShowModal(false);
                setCountdown(SESSION_TIMEOUT_CONFIG.COUNTDOWN_DURATION_SEC);
                resetIdleTimer();
            } else if (data.maxSessionReached) {
                setMaxSessionReached(true);
            } else {
                console.error('Failed to extend session:', data.error);
                // Still close modal but the next activity will trigger it again
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
        // Clear local session timing
        try {
            localStorage.removeItem('session_timing');
        } catch (error) {
            console.error('Error clearing session timing:', error);
        }

        // Clear countdown timer
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
        }

        // Get SSO URL for redirect
        const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || 'http://localhost:3000/sso';
        const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

        try {
            // Call local logout API
            await fetch(`${basePath}/api/auth/logout`, {
                method: 'POST',
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        // Redirect to SSO login
        const loginUrl = `${ssoUrl}/login?callbackUrl=${encodeURIComponent(currentUrl)}`;
        window.location.href = loginUrl;
    };

    return (
        <SessionTimeoutContext.Provider value={{ resetIdleTimer, getSessionInfo }}>
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
