'use client';

import IIPEHeader from './IIPEHeader';
import IIPEFooter from './IIPEFooter';
import IIPEMenuBar from './IIPEMenuBar';

type UserSession = {
    userId: string;
    email: string;
    name: string;
    accessToken?: string;
};

type IIPELayoutProps = {
    children: React.ReactNode;
    session?: UserSession;
    showMenuBar?: boolean;
    token?: string;
};

export default function IIPELayout({ children, session, showMenuBar = false, token }: IIPELayoutProps) {
    console.log('IIPELayout: Session prop:', session);
    console.log('IIPELayout: Token prop:', token ? 'Present' : 'Missing');

    // Merge token into session if provided
    const effectiveSession = session ? { ...session, accessToken: token || session.accessToken } : undefined;

    return (
        <div className="flex flex-col min-h-screen">
            <IIPEHeader />
            {showMenuBar && <IIPEMenuBar session={effectiveSession} />}
            <main className="flex-1">
                {children}
            </main>
            <IIPEFooter />
        </div>
    );
}
