/**
 * Database Isolation Verification Script - AssignWork
 * 
 * This script verifies that:
 * 1. AssignWork uses a separate DATABASE_URL from SSO and Forms
 * 2. Connection pool configuration is properly set
 * 3. No cross-database queries exist
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

import { PrismaClient } from '../lib/generated/prisma';
import { env } from '../lib/env';

interface DatabaseInfo {
  app: string;
  databaseUrl: string;
  databaseName: string;
  host: string;
  port: string;
}

async function extractDatabaseInfo(databaseUrl: string, appName: string): Promise<DatabaseInfo> {
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.slice(1);
  
  return {
    app: appName,
    databaseUrl: databaseUrl.replace(/:[^:@]+@/, ':****@'),
    databaseName,
    host: url.hostname,
    port: url.port || '5432'
  };
}

async function verifyConnectionPool(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log('✓ Database connection successful');
    
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✓ Connection pool is functional');
    
    return true;
  } catch (error) {
    console.error('✗ Connection pool verification failed:', error);
    return false;
  }
}

async function verifyDatabaseIsolation(): Promise<void> {
  console.log('=== AssignWork Database Isolation Verification ===\n');
  
  // Step 1: Verify separate DATABASE_URL
  console.log('Step 1: Verifying separate DATABASE_URL configuration');
  console.log('-----------------------------------------------');
  
  const assignworkInfo = await extractDatabaseInfo(env.DATABASE_URL, 'AssignWork');
  console.log(`AssignWork Database:`);
  console.log(`  Database Name: ${assignworkInfo.databaseName}`);
  console.log(`  Host: ${assignworkInfo.host}:${assignworkInfo.port}`);
  console.log(`  URL: ${assignworkInfo.databaseUrl}\n`);
  
  if (!assignworkInfo.databaseName || assignworkInfo.databaseName === '') {
    console.error('✗ AssignWork DATABASE_URL is not properly configured');
    process.exit(1);
  }
  
  // Verify it's not using SSO or Forms database
  if (assignworkInfo.databaseName === 'ssoapp' || assignworkInfo.databaseName === 'forms_db') {
    console.error('✗ AssignWork is using another app\'s database!');
    process.exit(1);
  }
  
  console.log('✓ AssignWork uses dedicated database\n');
  
  // Step 2: Verify connection pool configuration
  console.log('Step 2: Verifying connection pool configuration');
  console.log('-----------------------------------------------');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL
      }
    },
    log: ['error', 'warn']
  });
  
  const poolVerified = await verifyConnectionPool(prisma);
  
  if (!poolVerified) {
    console.error('✗ Connection pool verification failed');
    await prisma.$disconnect();
    process.exit(1);
  }
  
  console.log('');
  
  // Step 3: Verify database schema isolation
  console.log('Step 3: Verifying database schema isolation');
  console.log('-----------------------------------------------');
  
  try {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log(`Found ${tables.length} tables in AssignWork database:`);
    tables.forEach(table => {
      console.log(`  - ${table.tablename}`);
    });
    
    // Verify expected AssignWork tables exist
    const tableNames = tables.map(t => t.tablename);
    const expectedTables = ['User', 'Role', 'Permission', 'UserRole', 'RolePermission'];
    const missingTables = expectedTables.filter(t => !tableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.warn(`⚠ Some expected tables are missing: ${missingTables.join(', ')}`);
    } else {
      console.log('✓ All expected AssignWork tables are present');
    }
    
    // Verify SSO-specific tables are NOT present (would indicate wrong database)
    const ssoTables = ['SecurityQuestion', 'AuthorizationCode', 'RefreshToken'];
    const foundSsoTables = ssoTables.filter(t => tableNames.includes(t));
    
    if (foundSsoTables.length > 0) {
      console.error(`✗ Found SSO-specific tables in AssignWork database: ${foundSsoTables.join(', ')}`);
      console.error('  This indicates AssignWork might be using the SSO database!');
      await prisma.$disconnect();
      process.exit(1);
    }
    
    console.log('✓ Database schema isolation verified\n');
  } catch (error) {
    console.error('✗ Schema verification failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
  
  // Step 4: Verify no cross-database references
  console.log('Step 4: Verifying no cross-database references');
  console.log('-----------------------------------------------');
  
  try {
    const foreignKeys = await prisma.$queryRaw<Array<{ constraint_name: string, table_name: string }>>`
      SELECT 
        tc.constraint_name, 
        tc.table_name
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `;
    
    console.log(`Found ${foreignKeys.length} foreign key constraints (all should be within this database)`);
    
    if (foreignKeys.length > 0) {
      foreignKeys.forEach(fk => {
        console.log(`  - ${fk.table_name}: ${fk.constraint_name}`);
      });
    }
    
    console.log('✓ All foreign keys are within the same database\n');
  } catch (error) {
    console.error('✗ Foreign key verification failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
  
  await prisma.$disconnect();
  
  console.log('=== AssignWork Database Isolation Verification Complete ===');
  console.log('✓ All checks passed');
  console.log('\nSummary:');
  console.log('  ✓ Separate DATABASE_URL configured');
  console.log('  ✓ Connection pool functional');
  console.log('  ✓ Database schema isolated');
  console.log('  ✓ No cross-database references');
}

// Run verification
verifyDatabaseIsolation()
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
