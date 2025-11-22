import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '../services/rbac.service';

/**
 * RBAC Middleware for AssignWork
 * Provides route-based permission checking
 * 
 * Requirements:
 * - 5.4: Internal app uses own RBAC system independent of SSO user type
 * - 5.5: Permission changes in one app don't affect other apps
 */

/**
 * Permission requirement for a route
 */
export interface RoutePermission {
  resource: string;
  action: string;
}

/**
 * Create RBAC middleware for a specific permission
 * 
 * This middleware checks if the authenticated user has the required permission
 * to access a route. It should be used after authentication middleware.
 * 
 * @param resource - Resource name (e.g., 'tasks', 'projects')
 * @param action - Action name (e.g., 'read', 'write', 'delete')
 * @returns Middleware function
 * 
 * @example
 * ```typescript
 * // In a route handler or API endpoint
 * export async function GET(request: NextRequest) {
 *   const authCheck = await requireAuth(request);
 *   if (!authCheck.authenticated) {
 *     return authCheck.response;
 *   }
 *   
 *   const permCheck = await requirePermission(request, authCheck.userId, 'tasks', 'read');
 *   if (!permCheck.allowed) {
 *     return permCheck.response;
 *   }
 *   
 *   // Handle the request...
 * }
 * ```
 */
export async function requirePermission(
  request: NextRequest,
  userId: string,
  resource: string,
  action: string
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  reason?: string;
}> {
  try {
    // Check if user has the required permission
    const permissionCheck = await checkPermission(userId, resource, action);

    if (!permissionCheck.allowed) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: 'insufficient_permissions',
            error_description: permissionCheck.reason || 'You do not have permission to access this resource',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
          { status: 403 }
        ),
        reason: permissionCheck.reason,
      };
    }

    return {
      allowed: true,
    };
  } catch (error) {
    console.error('Error in RBAC middleware:', error);
    
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'permission_check_error',
          error_description: 'An error occurred while checking permissions',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        { status: 500 }
      ),
      reason: 'Internal error',
    };
  }
}

/**
 * Check if user has any of the specified permissions (OR logic)
 * 
 * @param userId - Local user ID
 * @param permissions - Array of permission requirements
 * @returns Permission check result
 */
export async function requireAnyPermission(
  request: NextRequest,
  userId: string,
  permissions: RoutePermission[]
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  reason?: string;
}> {
  try {
    // Check each permission
    for (const perm of permissions) {
      const permissionCheck = await checkPermission(userId, perm.resource, perm.action);
      
      if (permissionCheck.allowed) {
        return {
          allowed: true,
        };
      }
    }

    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'insufficient_permissions',
          error_description: 'You do not have any of the required permissions to access this resource',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        { status: 403 }
      ),
      reason: 'No matching permissions',
    };
  } catch (error) {
    console.error('Error in RBAC middleware:', error);
    
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'permission_check_error',
          error_description: 'An error occurred while checking permissions',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        { status: 500 }
      ),
      reason: 'Internal error',
    };
  }
}

/**
 * Check if user has all of the specified permissions (AND logic)
 * 
 * @param userId - Local user ID
 * @param permissions - Array of permission requirements
 * @returns Permission check result
 */
export async function requireAllPermissions(
  request: NextRequest,
  userId: string,
  permissions: RoutePermission[]
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  reason?: string;
}> {
  try {
    // Check each permission
    for (const perm of permissions) {
      const permissionCheck = await checkPermission(userId, perm.resource, perm.action);
      
      if (!permissionCheck.allowed) {
        return {
          allowed: false,
          response: NextResponse.json(
            {
              error: 'insufficient_permissions',
              error_description: permissionCheck.reason || 'You do not have all required permissions to access this resource',
              timestamp: new Date().toISOString(),
              requestId: crypto.randomUUID(),
            },
            { status: 403 }
          ),
          reason: permissionCheck.reason,
        };
      }
    }

    return {
      allowed: true,
    };
  } catch (error) {
    console.error('Error in RBAC middleware:', error);
    
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'permission_check_error',
          error_description: 'An error occurred while checking permissions',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        { status: 500 }
      ),
      reason: 'Internal error',
    };
  }
}

/**
 * Helper function to extract user ID from session
 * This should be used in conjunction with auth middleware
 * 
 * @param request - Next.js request object
 * @returns User ID from session or null
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  // This assumes the auth middleware has set the user ID in a header or cookie
  // Adjust based on your actual session implementation
  const userId = request.headers.get('x-user-id');
  return userId;
}
