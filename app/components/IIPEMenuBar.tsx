'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LogoutConfirmationModal from './LogoutConfirmationModal';

type Menu = {
    id: string;
    name: string;
    url: string;
    description: string | null;
    openInNewTab: boolean;
};

type Category = {
    id: string;
    name: string;
    order: number;
    menus: Menu[];
};

type UserSession = {
    userId: string;
    email: string;
    name: string;
    accessToken?: string;
};

export default function IIPEMenuBar({ session }: { session?: UserSession }) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [userNav, setUserNav] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [logoutSuccess, setLogoutSuccess] = useState(false);

    useEffect(() => {
        const fetchMenus = async () => {
            console.log('IIPEMenuBar: Session object received:', session);

            if (!session) {
                console.warn('IIPEMenuBar: No session provided');
                setLoading(false);
                return;
            }

            if (!session.accessToken) {
                console.warn('IIPEMenuBar: Session exists but accessToken is missing/empty');
                setLoading(false);
                return;
            }

            console.log('IIPEMenuBar: Fetching menus with token length:', session.accessToken.length);

            try {
                const menuAppUrl = process.env.NEXT_PUBLIC_MENU_APP_URL || 'http://localhost:3003/menu';

                const headers: HeadersInit = {
                    'Authorization': `Bearer ${session.accessToken}`
                };

                const response = await fetch(`${menuAppUrl}/api/user-menus`, {
                    headers
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('IIPEMenuBar: Menus fetched successfully', data);
                    setCategories(data.categories || []);
                    setUserNav(data.userNav);
                } else {
                    console.error('IIPEMenuBar: Failed to fetch menus', response.status, response.statusText);
                }
            } catch (error) {
                console.error('IIPEMenuBar: Error fetching menus:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMenus();
    }, [session]);

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        try {
            // SSO_URL already includes the base path (e.g., http://localhost:3000/sso)
            const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || 'http://localhost:3000/sso';

            // Get the basePath for this app (e.g., /assignwork)
            const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

            // Get the current page URL to redirect back after re-login
            const currentUrl = window.location.href;

            // Call SSO logout API to invalidate all tokens
            if (session?.accessToken) {
                const logoutResponse = await fetch(`${ssoUrl}/api/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        redirectUrl: currentUrl
                    }),
                });

                // Check if logout was successful
                if (logoutResponse.ok) {
                    const data = await logoutResponse.json();
                    console.log('SSO logout successful:', data);
                }
            }

            // Clear local session using proper basePath
            await fetch(`${basePath}/api/auth/logout`, {
                method: 'POST',
            });

            // Show success state
            setLogoutSuccess(true);

            // Wait 2 seconds to show success message, then redirect to SSO login
            setTimeout(() => {
                // Redirect to SSO login with callbackUrl parameter (ssoUrl already includes base path)
                const loginUrl = `${ssoUrl}/login?callbackUrl=${encodeURIComponent(currentUrl)}`;
                window.location.href = loginUrl;
            }, 2000);
        } catch (error) {
            console.error('Logout error:', error);
            // Even if there's an error, show success and redirect
            setLogoutSuccess(true);
            setTimeout(() => {
                const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || 'http://localhost:3000/sso';
                const currentUrl = window.location.href;
                const loginUrl = `${ssoUrl}/login?callbackUrl=${encodeURIComponent(currentUrl)}`;
                window.location.href = loginUrl;
            }, 2000);
        }


    };

    // Don't render anything if no session
    if (!session) {
        return null;
    }

    if (loading) {
        return (
            <div className="w-full bg-white border-b border-gray-200 animate-pulse">
                <div className="h-12 bg-gray-100"></div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-3">
                    {/* Left: Category Menus */}
                    <nav className="flex space-x-6">
                        {categories.map((category) => (
                            <div key={category.id} className="relative group">
                                <button className="text-gray-700 hover:text-blue-600 font-medium">
                                    {category.name}
                                </button>
                                {category.menus.length > 0 && (
                                    <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                        {category.menus.map((menu) => (
                                            <Link
                                                key={menu.id}
                                                href={menu.url}
                                                target={menu.openInNewTab ? '_blank' : undefined}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 first:rounded-t-lg last:rounded-b-lg"
                                            >
                                                {menu.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Right: User Menu */}
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                            Welcome, {session.name}
                        </span>
                        <div className="relative group">
                            <button className="text-gray-700 hover:text-blue-600 font-medium">
                                Profile
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <Link
                                    href={userNav?.profile || "/profile"}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 first:rounded-t-lg"
                                >
                                    My Profile
                                </Link>
                                <Link
                                    href={userNav?.changePassword || "/change-password"}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                >
                                    Change Password
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <LogoutConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={confirmLogout}
                isSuccess={logoutSuccess}
            />
        </div>
    );
}
