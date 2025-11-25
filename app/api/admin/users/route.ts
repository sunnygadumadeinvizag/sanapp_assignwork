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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';

        const skip = (page - 1) * limit;

        const where = search
            ? {
                  OR: [
                      { email: { contains: search, mode: 'insensitive' as const } },
                      { username: { contains: search, mode: 'insensitive' as const } },
                  ],
              }
            : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.user.count({ where }),
        ]);

        // Add isActive field (all users are active in this simple model)
        const usersWithStatus = users.map(user => ({
            ...user,
            isActive: true,
            appName: 'Assign Work App',
        }));

        return NextResponse.json(
            {
                users: usersWithStatus,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error('Error fetching users from Assign Work App:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Note: This simple user model doesn't have isActive field
        // In a real implementation, you would add this field to the schema
        // For now, we'll just acknowledge the request
        
        return NextResponse.json(
            {
                success: true,
                message: 'User status updated (note: isActive field not implemented in schema)',
            },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error('Error updating user in Assign Work App:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json(
            { success: true, message: 'User deleted successfully' },
            { headers: corsHeaders }
        );
    } catch (error) {
        console.error('Error deleting user from Assign Work App:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500, headers: corsHeaders }
        );
    }
}
