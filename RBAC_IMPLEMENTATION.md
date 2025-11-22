# RBAC Implementation for AssignWork

## Overview

This document describes the Role-Based Access Control (RBAC) system implemented for the AssignWork application. The RBAC system is completely independent of the SSO Service's user types and provides application-specific permission management.

## Requirements Addressed

- **Requirement 5.4**: Internal app uses own RBAC system independent of SSO user type
- **Requirement 5.5**: Permission changes in one app don't affect other apps

## Architecture

The RBAC system consists of three main components:

1. **RBAC Service** (`lib/services/rbac.service.ts`): Core business logic for permission checking and role management
2. **RBAC Middleware** (`lib/middleware/rbac.middleware.ts`): Route-based permission checking
3. **Database Schema**: Prisma models for User, Role, Permission, UserRole, and RolePermission

## Database Schema

The RBAC system uses the following models:

```prisma
model Role {
  id          String           @id @default(cuid())
  name        String           @unique
  description String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  
  users       UserRole[]
  permissions RolePermission[]
}

model Permission {
  id          String           @id @default(cuid())
  resource    String
  action      String
  description String?
  createdAt   DateTime         @default(now())
  
  roles       RolePermission[]
  
  @@unique([resource, action])
}

model UserRole {
  userId     String
  roleId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  assignedAt DateTime @default(now())
  assignedBy String?
  
  @@id([userId, roleId])
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  grantedAt    DateTime   @default(now())
  
  @@id([roleId, permissionId])
}
```

## RBAC Service Functions

### Permission Checking

- `checkPermission(userId, resource, action)`: Check if a user has a specific permission
- `getUserPermissions(userId)`: Get all permissions for a user across all roles

### Role Management

- `getUserRoles(userId)`: Get all roles assigned to a user
- `assignRole(userId, roleId, assignedBy?)`: Assign a role to a user
- `removeRole(userId, roleId)`: Remove a role from a user
- `createRole(name, description?)`: Create a new role

### Permission Management

- `createPermission(resource, action, description?)`: Create a new permission
- `grantPermissionToRole(roleId, permissionId)`: Grant a permission to a role
- `revokePermissionFromRole(roleId, permissionId)`: Revoke a permission from a role
- `getRolePermissions(roleId)`: Get all permissions for a role

## RBAC Middleware

The RBAC middleware provides route-based permission checking:

### Basic Usage

```typescript
import { requirePermission } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  // First, authenticate the user
  const authCheck = await requireAuth(request);
  if (!authCheck.authenticated) {
    return authCheck.response;
  }
  
  // Then, check permissions
  const permCheck = await requirePermission(
    request,
    authCheck.userId,
    'tasks',
    'read'
  );
  
  if (!permCheck.allowed) {
    return permCheck.response;
  }
  
  // Handle the request...
}
```

### Advanced Permission Checking

**Require Any Permission (OR logic):**

```typescript
import { requireAnyPermission } from '@/lib/middleware';

const permCheck = await requireAnyPermission(
  request,
  userId,
  [
    { resource: 'tasks', action: 'read' },
    { resource: 'tasks', action: 'write' }
  ]
);
```

**Require All Permissions (AND logic):**

```typescript
import { requireAllPermissions } from '@/lib/middleware';

const permCheck = await requireAllPermissions(
  request,
  userId,
  [
    { resource: 'tasks', action: 'read' },
    { resource: 'projects', action: 'read' }
  ]
);
```

## Independence from SSO

The RBAC system is completely independent of the SSO Service's user types:

1. **No SSO User Type Storage**: The local User model only stores email and username, not the SSO user type
2. **Application-Specific Roles**: Roles are defined and managed within AssignWork
3. **Local Permission Management**: All permission checks are performed against the local database
4. **No Cross-Application Impact**: Changes to roles/permissions in AssignWork do not affect other applications

## Example: Setting Up RBAC

### 1. Create Roles and Permissions

```typescript
import { createRole, createPermission, grantPermissionToRole } from '@/lib/services';

// Create roles
const adminRole = await createRole('admin', 'Administrator with full access');
const userRole = await createRole('user', 'Regular user with limited access');

// Create permissions
const readTasks = await createPermission('tasks', 'read', 'View tasks');
const writeTasks = await createPermission('tasks', 'write', 'Create and edit tasks');
const deleteTasks = await createPermission('tasks', 'delete', 'Delete tasks');

// Grant permissions to roles
await grantPermissionToRole(adminRole.role!.id, readTasks.permission!.id);
await grantPermissionToRole(adminRole.role!.id, writeTasks.permission!.id);
await grantPermissionToRole(adminRole.role!.id, deleteTasks.permission!.id);

await grantPermissionToRole(userRole.role!.id, readTasks.permission!.id);
await grantPermissionToRole(userRole.role!.id, writeTasks.permission!.id);
```

### 2. Assign Roles to Users

```typescript
import { assignRole } from '@/lib/services';

// Assign admin role to a user
await assignRole(userId, adminRoleId, assignedByUserId);

// Assign user role to another user
await assignRole(anotherUserId, userRoleId, assignedByUserId);
```

### 3. Check Permissions in Routes

```typescript
import { requirePermission } from '@/lib/middleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authCheck = await requireAuth(request);
  if (!authCheck.authenticated) {
    return authCheck.response;
  }
  
  const permCheck = await requirePermission(
    request,
    authCheck.userId,
    'tasks',
    'delete'
  );
  
  if (!permCheck.allowed) {
    return permCheck.response;
  }
  
  // Delete the task...
}
```

## Error Responses

The RBAC middleware returns standardized error responses:

**Insufficient Permissions (403):**

```json
{
  "error": "insufficient_permissions",
  "error_description": "You do not have permission to access this resource",
  "timestamp": "2024-11-21T10:30:00.000Z",
  "requestId": "uuid-here"
}
```

**Permission Check Error (500):**

```json
{
  "error": "permission_check_error",
  "error_description": "An error occurred while checking permissions",
  "timestamp": "2024-11-21T10:30:00.000Z",
  "requestId": "uuid-here"
}
```

## Testing

The RBAC system should be tested to ensure:

1. Permission checks work correctly
2. Role assignments are properly enforced
3. RBAC is independent of SSO user types
4. Permission changes don't affect other applications

## Security Considerations

1. **Principle of Least Privilege**: Users should only be granted the minimum permissions needed
2. **Role Hierarchy**: Consider implementing role hierarchies if needed
3. **Audit Logging**: Track role and permission changes for security auditing
4. **Regular Reviews**: Periodically review user roles and permissions

## Future Enhancements

Potential improvements to the RBAC system:

1. **Role Hierarchies**: Implement parent-child role relationships
2. **Dynamic Permissions**: Support for dynamic permission evaluation based on resource ownership
3. **Permission Caching**: Cache permission checks for improved performance
4. **Audit Logging**: Comprehensive logging of all RBAC operations
5. **Admin UI**: Web interface for managing roles and permissions

## Conclusion

The RBAC system provides AssignWork with fine-grained access control that is completely independent of the SSO Service. This ensures that each application can manage its own authorization requirements without affecting other applications in the system.
