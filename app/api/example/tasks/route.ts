import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth.middleware';
import { requirePermission } from '@/lib/middleware/rbac.middleware';

/**
 * Example API route demonstrating RBAC middleware usage
 * 
 * This route shows how to:
 * 1. Authenticate the user with SSO
 * 2. Check permissions using the RBAC system
 * 3. Handle requests based on permissions
 */

/**
 * GET /api/example/tasks
 * List tasks - requires 'tasks:read' permission
 */
export async function GET(request: NextRequest) {
  // Step 1: Authenticate the user
  const authCheck = await requireAuth(request);
  if (!authCheck.authenticated || !authCheck.userId) {
    return authCheck.response;
  }

  // Step 2: Check if user has permission to read tasks
  const permCheck = await requirePermission(
    request,
    authCheck.userId,
    'tasks',
    'read'
  );

  if (!permCheck.allowed) {
    return permCheck.response;
  }

  // Step 3: Handle the request
  // In a real application, you would fetch tasks from the database
  return NextResponse.json({
    tasks: [
      { id: '1', title: 'Example Task 1', status: 'pending' },
      { id: '2', title: 'Example Task 2', status: 'completed' },
    ],
  });
}

/**
 * POST /api/example/tasks
 * Create a task - requires 'tasks:write' permission
 */
export async function POST(request: NextRequest) {
  // Step 1: Authenticate the user
  const authCheck = await requireAuth(request);
  if (!authCheck.authenticated || !authCheck.userId) {
    return authCheck.response;
  }

  // Step 2: Check if user has permission to write tasks
  const permCheck = await requirePermission(
    request,
    authCheck.userId,
    'tasks',
    'write'
  );

  if (!permCheck.allowed) {
    return permCheck.response;
  }

  // Step 3: Handle the request
  const body = await request.json();
  
  // In a real application, you would create the task in the database
  return NextResponse.json({
    task: {
      id: '3',
      title: body.title,
      status: 'pending',
    },
  }, { status: 201 });
}


