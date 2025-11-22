# AssignWork Database Schema

## Overview

The AssignWork application uses a PostgreSQL database with a minimal user model and a complete Role-Based Access Control (RBAC) system. The database is completely independent from the SSO Service database, following the principle of database isolation (Requirement 6.2).

## Schema Design

### User Model

The User model stores only minimal information from the SSO Service:
- `id`: Unique identifier (CUID)
- `email`: User's email address (unique, from SSO)
- `username`: User's username (unique, from SSO)
- `createdAt`: Timestamp when user was created locally
- `updatedAt`: Timestamp when user was last updated

**Important**: Per Requirement 5.3, the AssignWork application stores ONLY email and username from the SSO Service. All other user attributes (userType, department, level, etc.) remain in the SSO Service database and are not duplicated here.

### RBAC System

The RBAC system is completely independent of the SSO Service user types (Requirement 5.4):

#### Role Model
- `id`: Unique identifier
- `name`: Role name (unique)
- `description`: Optional description of the role
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

#### Permission Model
- `id`: Unique identifier
- `resource`: The resource being protected (e.g., "tasks", "projects")
- `action`: The action being performed (e.g., "read", "write", "delete")
- `description`: Optional description
- `createdAt`: Creation timestamp

**Unique Constraint**: Each (resource, action) pair must be unique.

#### UserRole Model (Junction Table)
Links users to their roles:
- `userId`: Reference to User
- `roleId`: Reference to Role
- `assignedAt`: When the role was assigned
- `assignedBy`: Optional field to track who assigned the role

#### RolePermission Model (Junction Table)
Links roles to their permissions:
- `roleId`: Reference to Role
- `permissionId`: Reference to Permission
- `grantedAt`: When the permission was granted

## Running Migrations

### Prerequisites

1. Ensure PostgreSQL is running and accessible
2. Update the `DATABASE_URL` in `.env` with valid credentials
3. The database specified in the connection string should exist

### Running the Initial Migration

When the database is available, run:

```bash
cd apps/assignwork
npx prisma migrate deploy
```

Or for development with migration creation:

```bash
npx prisma migrate dev
```

### Generating the Prisma Client

After any schema changes:

```bash
npx prisma generate
```

## Database Isolation

Per Requirements 6.1, 6.2, and 6.3:
- AssignWork uses its own dedicated PostgreSQL database
- No direct queries to the SSO Service database
- User data is synchronized through SSO Service API endpoints only
- Each application maintains complete data independence

## RBAC Independence

Per Requirements 5.4 and 5.5:
- AssignWork's RBAC system is completely independent of SSO user types
- A user can be a SUPERADMIN in SSO but have no permissions in AssignWork
- Permission changes in AssignWork do not affect other applications
- Each application manages its own authorization logic

## Example RBAC Setup

```typescript
// Example: Creating roles and permissions
const adminRole = await prisma.role.create({
  data: {
    name: 'admin',
    description: 'Administrator with full access'
  }
});

const readTasksPermission = await prisma.permission.create({
  data: {
    resource: 'tasks',
    action: 'read',
    description: 'Can view tasks'
  }
});

// Link role to permission
await prisma.rolePermission.create({
  data: {
    roleId: adminRole.id,
    permissionId: readTasksPermission.id
  }
});

// Assign role to user
await prisma.userRole.create({
  data: {
    userId: user.id,
    roleId: adminRole.id
  }
});
```

## Migration Files

The initial migration is located at:
- `prisma/migrations/20241121000000_init/migration.sql`

This migration creates all tables, indexes, and foreign key constraints as defined in the schema.
