'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type MenuConfig = {
    logo: {
        src: string;
        alt: string;
        width: number;
        height: number;
    };
    institute: {
        telugu: string;
        hindi: string;
        english: string;
        location: string;
        tagline: string;
    };
    topNav: {
        title: string;
        links: Array<{ label: string; href: string; external: boolean }>;
    };
};

export default function IIPEHeader() {
    const [config, setConfig] = useState<MenuConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const menuAppUrl = process.env.NEXT_PUBLIC_MENU_APP_URL || 'http://localhost:3003/menu';
                const response = await fetch(`${menuAppUrl}/api/public/menu-config`);
                if (response.ok) {
                    const data = await response.json();
                    setConfig(data);
                }
            } catch (error) {
                console.error('Failed to fetch menu config:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    if (loading) {
        return (
            <div className="w-full bg-gray-100 animate-pulse">
                <div className="h-16 bg-gray-200"></div>
                <div className="h-32 bg-gray-100"></div>
            </div>
        );
    }

    // Fallback config when menu service is unavailable
    const fallbackConfig: MenuConfig = {
        logo: { src: 'http://localhost:3003/menu/img/IIPELogo.jpg', alt: 'IIPE Logo', width: 120, height: 120 },
        institute: {
            telugu: 'భారతీయ పెట్రోలియం మరియు శక్తి విజ్ఞాన సంస్థ',
            hindi: 'भारतीय पेट्रोलियम और ऊर्जा संस्थान',
            english: 'INDIAN INSTITUTE OF PETROLEUM AND ENERGY',
            location: 'Visakhapatnam Andhra Pradesh 530003',
            tagline: '(An Institute of National Importance by an Act of Parliament)',
        },
        topNav: {
            title: 'RECRUITMENT FOR TEACHING STAFF',
            links: [
                { label: 'HOME', href: '/', external: false },
                { label: 'ABOUT', href: 'https://www.iipe.ac.in', external: true },
            ],
        },
    };

    const displayConfig = config || fallbackConfig;

    return (
        <>
            {/* Top navigation */}
            <div className="w-full bg-[#1f2937]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4 flex-wrap">
                        <div className="flex items-center space-x-4">
                            <Link href="https://iipe.ac.in" className="flex items-center">
                                <span className="text-xl font-semibold text-gray-200">IIPE</span>
                            </Link>
                        </div>
                        <div className="text-gray-200 text-lg font-semibold">
                            {displayConfig.topNav.title}
                        </div>
                        <nav className="flex space-x-4 mt-2 md:mt-0">
                            {displayConfig.topNav.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                    target={link.external ? '_blank' : undefined}
                                    className="font-bold text-gray-200 hover:text-white"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Logo and Institute Name */}
            <div className="flex flex-row items-center justify-center w-full py-4 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-center space-x-6">
                    <div className="w-[120px] h-[120px] flex items-center justify-center">
                        <img
                            src={displayConfig.logo.src}
                            alt={displayConfig.logo.alt}
                            width={displayConfig.logo.width}
                            height={displayConfig.logo.height}
                            className="object-contain"
                        />
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="text-[#F47216] text-lg md:text-xl lg:text-1xl">
                            {displayConfig.institute.telugu}
                        </div>
                        <div className="text-[#F47216] text-lg md:text-xl lg:text-21xl">
                            {displayConfig.institute.hindi}
                        </div>
                        <div className="text-[#F47216] text-xl md:text-2xl lg:text-2xl font-bold">
                            {displayConfig.institute.english}
                        </div>
                        <div className="text-[#003399] text-base md:text-sm">
                            {displayConfig.institute.location}
                        </div>
                        <div className="text-[#003399] text-base md:text-sm">
                            {displayConfig.institute.tagline}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
