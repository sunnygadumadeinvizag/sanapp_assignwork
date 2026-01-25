'use client';

import { useState, useEffect } from 'react';

type SessionTimeoutModalProps = {
    isOpen: boolean;
    countdown: number;
    onExtend: () => void;
    onLogout: () => void;
    isExtending?: boolean;
    maxSessionReached?: boolean;
};

export default function SessionTimeoutModal({
    isOpen,
    countdown,
    onExtend,
    onLogout,
    isExtending = false,
    maxSessionReached = false,
}: SessionTimeoutModalProps) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Format countdown as MM:SS
    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity" />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8 transform transition-all animate-in fade-in zoom-in duration-200">
                <div className="text-center">
                    {/* Warning Icon */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-6">
                        <svg
                            className="h-8 w-8 text-amber-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                        Session Expiring Soon
                    </h3>

                    {/* Countdown Timer */}
                    <div className="mb-4">
                        <div className="text-5xl font-mono font-bold text-red-600 mb-2">
                            {formatCountdown(countdown)}
                        </div>
                        <p className="text-sm text-gray-500">
                            seconds remaining
                        </p>
                    </div>

                    {/* Message */}
                    <p className="text-gray-600 mb-6">
                        {maxSessionReached ? (
                            <>
                                Your session has reached the maximum duration of 6 hours.
                                <br />
                                <span className="text-red-600 font-medium">You will be logged out automatically.</span>
                            </>
                        ) : (
                            <>
                                Your session is about to expire due to inactivity.
                                <br />
                                Click the button below to continue working.
                            </>
                        )}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-amber-500 to-red-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                            style={{ width: `${(countdown / 60) * 100}%` }}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 justify-center">
                        {!maxSessionReached && (
                            <button
                                onClick={onExtend}
                                disabled={isExtending}
                                className="flex-1 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                            >
                                {isExtending ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Extending...
                                    </span>
                                ) : (
                                    <>
                                        <svg className="inline-block w-5 h-5 mr-2 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Extend Session (10 min)
                                    </>
                                )}
                            </button>
                        )}
                        <button
                            onClick={onLogout}
                            className={`px-6 py-3 text-base font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all ${maxSessionReached ? 'flex-1' : ''}`}
                        >
                            Logout Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
