import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// CORS headers for cross-origin requests from sanapp_menu
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Allow all origins for now, or use specific origin
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { users } = body;

        if (!users || !Array.isArray(users)) {
            return NextResponse.json(
                { error: 'Users array is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Upsert users (create or update)
        const results = await Promise.all(
            users.map(async (user: any) => {
                return await prisma.user.upsert({
                    where: { email: user.email },
                    update: {
                        username: user.username,
                    },
                    create: {
                        email: user.email,
                        username: user.username,
                    },
                });
            })
        );

        return NextResponse.json(
            {
                success: true,
                count: results.length,
                message: `Successfully synced ${results.length} users to Assign Work App`,
            },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error('Error syncing users to Assign Work App:', error);
        return NextResponse.json(
            { error: 'Failed to sync users' },
            { status: 500, headers: corsHeaders }
        );
    }
}
