import { PrismaClient } from '../lib/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding AssignWork database...');

  // Create users (synced from SSO)
  const users = [
    { email: 'admin@university.edu', username: 'admin' },
    { email: 'john.doe@university.edu', username: 'johndoe' },
    { email: 'jane.smith@university.edu', username: 'janesmith' },
    { email: 'bob.wilson@university.edu', username: 'bobwilson' },
    { email: 'alice.johnson@university.edu', username: 'alicejohnson' },
  ];

  console.log('Creating users...');
  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    createdUsers.push(user);
    console.log(`✓ Created user: ${user.email}`);
  }

  // Create roles
  console.log('\nCreating roles...');
  const roles = [
    { name: 'admin', description: 'Administrator with full access' },
    { name: 'manager', description: 'Manager who can assign and view tasks' },
    { name: 'employee', description: 'Regular employee who can view and complete tasks' },
    { name: 'viewer', description: 'Read-only access to tasks' },
  ];

  const createdRoles = [];
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    createdRoles.push(role);
    console.log(`✓ Created role: ${role.name}`);
  }

  // Create permissions
  console.log('\nCreating permissions...');
  const permissions = [
    { resource: 'tasks', action: 'create', description: 'Create new tasks' },
    { resource: 'tasks', action: 'read', description: 'View tasks' },
    { resource: 'tasks', action: 'update', description: 'Update tasks' },
    { resource: 'tasks', action: 'delete', description: 'Delete tasks' },
    { resource: 'tasks', action: 'assign', description: 'Assign tasks to users' },
    { resource: 'users', action: 'read', description: 'View users' },
    { resource: 'users', action: 'manage', description: 'Manage users' },
    { resource: 'reports', action: 'read', description: 'View reports' },
    { resource: 'reports', action: 'generate', description: 'Generate reports' },
  ];

  const createdPermissions = [];
  for (const permData of permissions) {
    const permission = await prisma.permission.upsert({
      where: { resource_action: { resource: permData.resource, action: permData.action } },
      update: {},
      create: permData,
    });
    createdPermissions.push(permission);
    console.log(`✓ Created permission: ${permission.resource}:${permission.action}`);
  }

  // Assign permissions to roles
  console.log('\nAssigning permissions to roles...');
  
  // Admin gets all permissions
  const adminRole = createdRoles.find(r => r.name === 'admin')!;
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`✓ Assigned ${createdPermissions.length} permissions to admin role`);

  // Manager gets task and user read permissions
  const managerRole = createdRoles.find(r => r.name === 'manager')!;
  const managerPermissions = createdPermissions.filter(p => 
    (p.resource === 'tasks' && ['create', 'read', 'update', 'assign'].includes(p.action)) ||
    (p.resource === 'users' && p.action === 'read') ||
    (p.resource === 'reports' && ['read', 'generate'].includes(p.action))
  );
  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`✓ Assigned ${managerPermissions.length} permissions to manager role`);

  // Employee gets basic task permissions
  const employeeRole = createdRoles.find(r => r.name === 'employee')!;
  const employeePermissions = createdPermissions.filter(p => 
    p.resource === 'tasks' && ['read', 'update'].includes(p.action)
  );
  for (const permission of employeePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: employeeRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: employeeRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`✓ Assigned ${employeePermissions.length} permissions to employee role`);

  // Viewer gets read-only permissions
  const viewerRole = createdRoles.find(r => r.name === 'viewer')!;
  const viewerPermissions = createdPermissions.filter(p => 
    (p.resource === 'tasks' && p.action === 'read') ||
    (p.resource === 'reports' && p.action === 'read')
  );
  for (const permission of viewerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: viewerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: viewerRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`✓ Assigned ${viewerPermissions.length} permissions to viewer role`);

  // Assign roles to users
  console.log('\nAssigning roles to users...');
  const userRoleAssignments = [
    { email: 'admin@university.edu', roleName: 'admin' },
    { email: 'john.doe@university.edu', roleName: 'manager' },
    { email: 'jane.smith@university.edu', roleName: 'employee' },
    { email: 'bob.wilson@university.edu', roleName: 'manager' },
    { email: 'alice.johnson@university.edu', roleName: 'viewer' },
  ];

  for (const assignment of userRoleAssignments) {
    const user = createdUsers.find(u => u.email === assignment.email)!;
    const role = createdRoles.find(r => r.name === assignment.roleName)!;
    
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });
    console.log(`✓ Assigned ${role.name} role to ${user.email}`);
  }

  console.log('\n✅ AssignWork database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
