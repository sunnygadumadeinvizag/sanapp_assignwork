'use client';

import { useEffect, useState } from 'react';
import { MdEmail, MdPhone } from 'react-icons/md';

type FooterConfig = {
    contact: {
        title: string;
        phone: string;
        email: string;
    };
    associateDean: {
        title: string;
        address: string[];
    };
    instituteAddress: {
        title: string;
        address: string[];
    };
    copyright: string;
    developer: string;
};

export default function IIPEFooter() {
    const [config, setConfig] = useState<FooterConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const menuAppUrl = process.env.NEXT_PUBLIC_MENU_APP_URL || 'http://localhost:3003/menu';
                const response = await fetch(`${menuAppUrl}/api/public/menu-config`);
                if (response.ok) {
                    const data = await response.json();
                    setConfig(data.footer);
                }
            } catch (error) {
                console.error('Failed to fetch footer config:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    if (loading) {
        return (
            <footer className="w-full bg-[#1f2937] py-6 px-4 animate-pulse">
                <div className="h-32 bg-gray-700 rounded"></div>
            </footer>
        );
    }

    // Fallback config when menu service is unavailable
    const fallbackConfig: FooterConfig = {
        contact: {
            title: 'Contact for Recruitment Queries',
            phone: '0891 - 285 6008',
            email: 'facultyrecruitmentqueries@iipe.ac.in',
        },
        associateDean: {
            title: 'Associate Dean (Faculty Affairs)',
            address: [
                'Indian Institute of Petroleum and Energy (IIPE)',
                'Transit Campus: 2nd Floor, Main Building',
                'AU College of Engineering (A) Campus',
                'Visakhapatnam, Andhra Pradesh - 530003',
            ],
        },
        instituteAddress: {
            title: 'Institute Address',
            address: [
                'Indian Institute of Petroleum and Energy (IIPE)',
                'Transit Campus: 2nd Floor, Main Building',
                'AU College of Engineering (A) Campus',
                'Visakhapatnam, Andhra Pradesh - 530003',
            ],
        },
        copyright: 'Indian Institute of Petroleum and Energy (IIPE), Visakhapatnam. All Rights Reserved.',
        developer: 'Designed & Developed By Software Development Team@IIPE, Visakhapatnam',
    };

    const displayConfig = config || fallbackConfig;

    return (
        <footer className="w-full bg-[#1f2937] py-6 px-4">
            {/* Main content section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Contact Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {/* Quick Contact (Left) */}
                    <div className="text-sm text-gray-200">
                        <h3 className="font-bold mb-3">{displayConfig.contact.title}</h3>
                        <div className="flex items-center gap-2 mb-2">
                            <MdPhone className="text-gray-300 flex-shrink-0" />
                            <span>{displayConfig.contact.phone}</span>
                        </div>
                        <div className="flex items-start gap-2 mb-3">
                            <MdEmail className="text-gray-300 flex-shrink-0 mt-0.5" />
                            <span className="break-all">{displayConfig.contact.email}</span>
                        </div>
                    </div>

                    {/* Associate Dean Contact (Center) */}
                    <div className="text-sm text-gray-200">
                        <h3 className="font-bold mb-3">{displayConfig.associateDean.title}</h3>
                        <div className="text-xs leading-relaxed space-y-1">
                            {displayConfig.associateDean.address.map((line, index) => (
                                <div key={index}>{line}</div>
                            ))}
                        </div>
                    </div>

                    {/* Full Address (Right) */}
                    <div className="text-sm text-gray-200">
                        <h3 className="font-bold mb-3">{displayConfig.instituteAddress.title}</h3>
                        <div className="text-xs leading-relaxed space-y-1">
                            {displayConfig.instituteAddress.address.map((line, index) => (
                                <div key={index}>{line}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright section */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center md:justify-between items-center text-sm text-gray-300 mt-6 gap-3 md:gap-0">
                <div className="text-center md:text-left">
                    © {currentYear} {displayConfig.copyright}
                </div>
                <div className="text-center md:text-right">
                    {displayConfig.developer}
                </div>
            </div>
        </footer>
    );
}
