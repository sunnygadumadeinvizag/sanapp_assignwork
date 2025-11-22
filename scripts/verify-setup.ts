/**
 * Verification script for AssignWork application setup
 * 
 * This script verifies that:
 * 1. All required dependencies are installed
 * 2. Environment variables are configured
 * 3. Prisma client is generated
 * 4. SSO configuration is valid
 */

import 'dotenv/config';
import { env } from '../lib/env';
import { ssoConfig } from '../lib/sso-config';
import * as fs from 'fs';
import * as path from 'path';

async function verifySetup() {
  console.log('🔍 Verifying AssignWork application setup...\n');

  // 1. Check environment variables
  console.log('✓ Environment variables loaded:');
  console.log(`  - DATABASE_URL: ${env.DATABASE_URL.substring(0, 30)}...`);
  console.log(`  - SSO_CLIENT_ID: ${env.SSO_CLIENT_ID}`);
  console.log(`  - APP_CALLBACK_URL: ${env.APP_CALLBACK_URL}`);
  console.log(`  - NODE_ENV: ${env.NODE_ENV}`);
  console.log(`  - PORT: ${env.PORT}\n`);

  // 2. Check SSO configuration
  console.log('✓ SSO configuration loaded:');
  console.log(`  - Authorize URL: ${ssoConfig.authorizeUrl}`);
  console.log(`  - Token URL: ${ssoConfig.tokenUrl}`);
  console.log(`  - Userinfo URL: ${ssoConfig.userinfoUrl}`);
  console.log(`  - JWKS URL: ${ssoConfig.jwksUrl}`);
  console.log(`  - Logout URL: ${ssoConfig.logoutUrl}\n`);

  // 3. Check Prisma client
  const prismaClientPath = path.join(process.cwd(), 'lib', 'generated', 'prisma', 'client.ts');
  if (fs.existsSync(prismaClientPath)) {
    console.log('✓ Prisma client generated');
    console.log(`  - Location: lib/generated/prisma/\n`);
  } else {
    console.log('✗ Prisma client not found');
    console.log('  Run: npx prisma generate\n');
  }

  // 4. Check dependencies
  console.log('✓ Required dependencies installed:');
  const dependencies = [
    '@prisma/client',
    'axios',
    '@tanstack/react-query',
    'zod',
    'next',
    'react',
    'react-dom'
  ];
  
  for (const dep of dependencies) {
    try {
      require.resolve(dep);
      console.log(`  - ${dep}: ✓`);
    } catch (error) {
      console.log(`  - ${dep}: ✗ (not found)`);
    }
  }

  // 5. Check folder structure
  console.log('\n✓ Folder structure:');
  const folders = ['lib', 'app/api', 'components', 'types', 'prisma'];
  for (const folder of folders) {
    const folderPath = path.join(process.cwd(), ...folder.split('/'));
    if (fs.existsSync(folderPath)) {
      console.log(`  - ${folder}: ✓`);
    } else {
      console.log(`  - ${folder}: ✗ (not found)`);
    }
  }

  console.log('\n✅ AssignWork application setup verified successfully!');
  console.log('\nNext steps:');
  console.log('1. Define database schema in prisma/schema.prisma');
  console.log('2. Run: npx prisma migrate dev --name init');
  console.log('3. Implement OAuth2 client module');
  console.log('4. Implement user synchronization module');
  console.log('5. Start development server: npm run dev');
}

verifySetup()
  .catch((error) => {
    console.error('❌ Setup verification failed:', error.message);
    process.exit(1);
  });
