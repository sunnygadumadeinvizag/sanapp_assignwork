import { prisma } from '../prisma';
import { Role, Permission, PermissionCheck } from '@/types';

/**
 * RBAC Service for AssignWork
 * Handles role-based access control independent of SSO user type
 * 
 * Requirements:
 * - 5.4: Internal app uses own RBAC system independent of SSO user type
 * - 5.5: Permission changes in one app don't affect other apps
 */

/**
 * Check if a user has a specific permission
 * 
 * @param userId - Local user ID
 * @param resource - Resource name (e.g., 'tasks', 'projects')
 * @param action - Action name (e.g., 'read', 'write', 'delete')
 * @returns Permission check result
 */
export async function checkPermission(
  userId: string,
  resource: string,
  action: string
): Promise<PermissionCheck> {
  try {
    // Get all roles for the user
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Check if any role has the required permission
    for (const userRole of userRoles) {
      const hasPermission = userRole.role.permissions.some(
        (rp) =>
          rp.permission.resource === resource &&
          rp.permission.action === action
      );

      if (hasPermission) {
        return {
          allowed: true,
        };
      }
    }

    return {
      allowed: false,
      reason: `User does not have permission to ${action} ${resource}`,
    };
  } catch (error) {
    console.error('Error checking permission:', error);
    return {
      allowed: false,
      reason: 'Error checking permissions',
    };
  }
}

/**
 * Get all roles for a user
 * 
 * @param userId - Local user ID
 * @returns Array of roles
 */
export async function getUserRoles(userId: string): Promise<Role[]> {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    return userRoles.map((ur) => ur.role);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
}

/**
 * Get all permissions for a user (across all roles)
 * 
 * @param userId - Local user ID
 * @returns Array of permissions
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    // Collect all unique permissions
    const permissionsMap = new Map<string, Permission>();
    
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        const permission = rolePermission.permission;
        const key = `${permission.resource}:${permission.action}`;
        
        if (!permissionsMap.has(key)) {
          permissionsMap.set(key, permission);
        }
      }
    }

    return Array.from(permissionsMap.values());
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

/**
 * Assign a role to a user
 * 
 * @param userId - Local user ID
 * @param roleId - Role ID to assign
 * @param assignedBy - Optional: ID of user who assigned the role
 * @returns Success status
 */
export async function assignRole(
  userId: string,
  roleId: string,
  assignedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return {
        success: false,
        error: 'Role not found',
      };
    }

    // Check if user already has this role
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existingUserRole) {
      return {
        success: true, // Already assigned, consider it success
      };
    }

    // Assign the role
    await prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error assigning role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove a role from a user
 * 
 * @param userId - Local user ID
 * @param roleId - Role ID to remove
 * @returns Success status
 */
export async function removeRole(
  userId: string,
  roleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error removing role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a new role
 * 
 * @param name - Role name
 * @param description - Optional role description
 * @returns Created role or error
 */
export async function createRole(
  name: string,
  description?: string
): Promise<{ success: boolean; role?: Role; error?: string }> {
  try {
    const role = await prisma.role.create({
      data: {
        name,
        description,
      },
    });

    return {
      success: true,
      role,
    };
  } catch (error) {
    console.error('Error creating role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a new permission
 * 
 * @param resource - Resource name
 * @param action - Action name
 * @param description - Optional permission description
 * @returns Created permission or error
 */
export async function createPermission(
  resource: string,
  action: string,
  description?: string
): Promise<{ success: boolean; permission?: Permission; error?: string }> {
  try {
    const permission = await prisma.permission.create({
      data: {
        resource,
        action,
        description,
      },
    });

    return {
      success: true,
      permission,
    };
  } catch (error) {
    console.error('Error creating permission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Grant a permission to a role
 * 
 * @param roleId - Role ID
 * @param permissionId - Permission ID
 * @returns Success status
 */
export async function grantPermissionToRole(
  roleId: string,
  permissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return {
        success: false,
        error: 'Role not found',
      };
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return {
        success: false,
        error: 'Permission not found',
      };
    }

    // Check if already granted
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existing) {
      return {
        success: true, // Already granted
      };
    }

    // Grant the permission
    await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error granting permission to role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Revoke a permission from a role
 * 
 * @param roleId - Role ID
 * @param permissionId - Permission ID
 * @returns Success status
 */
export async function revokePermissionFromRole(
  roleId: string,
  permissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error revoking permission from role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all permissions for a role
 * 
 * @param roleId - Role ID
 * @returns Array of permissions
 */
export async function getRolePermissions(roleId: string): Promise<Permission[]> {
  try {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map((rp) => rp.permission);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return [];
  }
}
