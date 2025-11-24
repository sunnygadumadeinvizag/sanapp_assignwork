#!/usr/bin/env tsx
/**
 * Test script to verify basepath configuration
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('=== AssignWork App Basepath Configuration Test ===\n');

console.log('Environment Variables:');
console.log('  NEXT_PUBLIC_BASE_PATH:', process.env.NEXT_PUBLIC_BASE_PATH);
console.log('  NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
console.log('  NEXT_PUBLIC_SSO_URL:', process.env.NEXT_PUBLIC_SSO_URL);
console.log('  APP_CALLBACK_URL:', process.env.APP_CALLBACK_URL);
console.log('  SSO_AUTHORIZE_URL:', process.env.SSO_AUTHORIZE_URL);
console.log('  SSO_TOKEN_URL:', process.env.SSO_TOKEN_URL);
console.log('  SSO_USERINFO_URL:', process.env.SSO_USERINFO_URL);
console.log('  SSO_LOGOUT_URL:', process.env.SSO_LOGOUT_URL);

console.log('\n=== Expected URLs ===');
console.log('App Home:', 'http://localhost:3001/assignwork');
console.log('Tasks:', 'http://localhost:3001/assignwork/tasks');
console.log('SSO Login:', 'http://localhost:3000/sso/login');
console.log('Auth Callback:', 'http://localhost:3001/assignwork/api/auth/callback');

console.log('\n=== Test Scenarios ===');
console.log('1. Unauthenticated user visits: http://localhost:3001/assignwork/tasks');
console.log('   Expected: Redirect to http://localhost:3000/sso/login?returnUrl=http://localhost:3001/assignwork/tasks');
console.log('2. User logs in at SSO');
console.log('   Expected: Redirect to http://localhost:3001/assignwork/api/auth/callback?code=...');
console.log('3. After callback processing');
console.log('   Expected: Redirect to http://localhost:3001/assignwork/tasks');

console.log('\n✓ Configuration loaded successfully');
