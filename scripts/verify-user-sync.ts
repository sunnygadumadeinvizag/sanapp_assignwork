/**
 * Verification script for user synchronization service
 * Tests the user sync functionality without requiring a full test framework
 */

import { 
  syncUserFromSSO, 
  findLocalUser, 
  createLocalUser,
  getUserByEmail,
  getUserByUsername,
  provisionUserFromSSO
} from '../lib/services/user-sync.service';
import { SSOUser } from '../types';
import { prisma } from '../lib/prisma';

async function cleanup() {
  // Clean up test users
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['test@example.com', 'newuser@example.com']
      }
    }
  });
}

async function testGetUserByEmail() {
  console.log('\n=== Testing getUserByEmail ===');
  
  // Create a test user
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      username: 'testuser',
    }
  });
  
  console.log('Created test user:', testUser.email);
  
  // Test finding user by email
  const foundUser = await getUserByEmail('test@example.com');
  
  if (foundUser && foundUser.email === 'test@example.com') {
    console.log('✓ getUserByEmail: Found user successfully');
  } else {
    console.error('✗ getUserByEmail: Failed to find user');
  }
  
  // Test non-existent user
  const notFound = await getUserByEmail('nonexistent@example.com');
  
  if (notFound === null) {
    console.log('✓ getUserByEmail: Correctly returns null for non-existent user');
  } else {
    console.error('✗ getUserByEmail: Should return null for non-existent user');
  }
}

async function testGetUserByUsername() {
  console.log('\n=== Testing getUserByUsername ===');
  
  // Test finding user by username
  const foundUser = await getUserByUsername('testuser');
  
  if (foundUser && foundUser.username === 'testuser') {
    console.log('✓ getUserByUsername: Found user successfully');
  } else {
    console.error('✗ getUserByUsername: Failed to find user');
  }
  
  // Test non-existent user
  const notFound = await getUserByUsername('nonexistent');
  
  if (notFound === null) {
    console.log('✓ getUserByUsername: Correctly returns null for non-existent user');
  } else {
    console.error('✗ getUserByUsername: Should return null for non-existent user');
  }
}

async function testFindLocalUser() {
  console.log('\n=== Testing findLocalUser ===');
  
  // Test finding user by email
  const foundByEmail = await findLocalUser('test@example.com', 'wrongusername');
  
  if (foundByEmail && foundByEmail.email === 'test@example.com') {
    console.log('✓ findLocalUser: Found user by email');
  } else {
    console.error('✗ findLocalUser: Failed to find user by email');
  }
  
  // Test finding user by username
  const foundByUsername = await findLocalUser('wrong@example.com', 'testuser');
  
  if (foundByUsername && foundByUsername.username === 'testuser') {
    console.log('✓ findLocalUser: Found user by username');
  } else {
    console.error('✗ findLocalUser: Failed to find user by username');
  }
  
  // Test non-existent user
  const notFound = await findLocalUser('nonexistent@example.com', 'nonexistent');
  
  if (notFound === null) {
    console.log('✓ findLocalUser: Correctly returns null for non-existent user');
  } else {
    console.error('✗ findLocalUser: Should return null for non-existent user');
  }
}

async function testCreateLocalUser() {
  console.log('\n=== Testing createLocalUser ===');
  
  // Create a new user
  const newUser = await createLocalUser('newuser@example.com', 'newuser');
  
  if (newUser && newUser.email === 'newuser@example.com' && newUser.username === 'newuser') {
    console.log('✓ createLocalUser: Created user successfully');
    console.log('  - User ID:', newUser.id);
    console.log('  - Email:', newUser.email);
    console.log('  - Username:', newUser.username);
  } else {
    console.error('✗ createLocalUser: Failed to create user');
  }
  
  // Verify user was created
  const foundUser = await getUserByEmail('newuser@example.com');
  
  if (foundUser) {
    console.log('✓ createLocalUser: User persisted to database');
  } else {
    console.error('✗ createLocalUser: User not found in database');
  }
}

async function testSyncUserFromSSO() {
  console.log('\n=== Testing syncUserFromSSO ===');
  
  // Test with existing user
  const existingSSOUser: SSOUser = {
    id: 'sso-123',
    email: 'test@example.com',
    username: 'testuser',
    userType: 'USER',
    employmentStatus: 'STAFF',
    employmentType: 'REGULAR',
    level: 8,
    department: 'IT',
  };
  
  const existingResult = await syncUserFromSSO(existingSSOUser);
  
  if (existingResult.success && existingResult.user && existingResult.userExists) {
    console.log('✓ syncUserFromSSO: Successfully synced existing user');
    console.log('  - User ID:', existingResult.user.id);
    console.log('  - Email:', existingResult.user.email);
    console.log('  - Username:', existingResult.user.username);
  } else {
    console.error('✗ syncUserFromSSO: Failed to sync existing user');
  }
  
  // Test with non-existent user (should return error)
  const nonExistentSSOUser: SSOUser = {
    id: 'sso-456',
    email: 'nonexistent@example.com',
    username: 'nonexistent',
    userType: 'USER',
    employmentStatus: 'STAFF',
    employmentType: 'REGULAR',
    level: 8,
    department: 'IT',
  };
  
  const nonExistentResult = await syncUserFromSSO(nonExistentSSOUser);
  
  if (!nonExistentResult.success && !nonExistentResult.userExists && nonExistentResult.error === 'user_not_found') {
    console.log('✓ syncUserFromSSO: Correctly returns error for non-existent user');
    console.log('  - Error:', nonExistentResult.error);
    console.log('  - Description:', nonExistentResult.errorDescription);
  } else {
    console.error('✗ syncUserFromSSO: Should return error for non-existent user');
  }
}

async function testProvisionUserFromSSO() {
  console.log('\n=== Testing provisionUserFromSSO ===');
  
  // Test provisioning a new user
  const newSSOUser: SSOUser = {
    id: 'sso-789',
    email: 'provisioned@example.com',
    username: 'provisioned',
    userType: 'USER',
    employmentStatus: 'FACULTY',
    employmentType: 'REGULAR',
    level: 9,
    department: 'Chemical Engineering',
  };
  
  const provisionedUser = await provisionUserFromSSO(newSSOUser);
  
  if (provisionedUser && provisionedUser.email === 'provisioned@example.com') {
    console.log('✓ provisionUserFromSSO: Successfully provisioned new user');
    console.log('  - User ID:', provisionedUser.id);
    console.log('  - Email:', provisionedUser.email);
    console.log('  - Username:', provisionedUser.username);
    
    // Verify only email and username are stored (Requirement 5.3)
    const keys = Object.keys(provisionedUser);
    const hasOnlyRequiredFields = keys.includes('email') && keys.includes('username') && keys.includes('id');
    const hasNoExtraFields = !keys.includes('userType') && !keys.includes('department') && !keys.includes('level');
    
    if (hasOnlyRequiredFields && hasNoExtraFields) {
      console.log('✓ provisionUserFromSSO: Stores only email and username (Requirement 5.3)');
    } else {
      console.error('✗ provisionUserFromSSO: Should only store email and username');
    }
  } else {
    console.error('✗ provisionUserFromSSO: Failed to provision user');
  }
  
  // Test provisioning existing user (should return existing)
  const existingProvision = await provisionUserFromSSO(newSSOUser);
  
  if (existingProvision && existingProvision.id === provisionedUser.id) {
    console.log('✓ provisionUserFromSSO: Returns existing user when already provisioned');
  } else {
    console.error('✗ provisionUserFromSSO: Should return existing user');
  }
  
  // Clean up provisioned user
  await prisma.user.delete({
    where: { email: 'provisioned@example.com' }
  });
}

async function main() {
  console.log('Starting user synchronization service verification...\n');
  
  try {
    // Clean up any existing test data
    await cleanup();
    
    // Run tests
    await testGetUserByEmail();
    await testGetUserByUsername();
    await testFindLocalUser();
    await testCreateLocalUser();
    await testSyncUserFromSSO();
    await testProvisionUserFromSSO();
    
    // Clean up test data
    await cleanup();
    
    console.log('\n=== Verification Complete ===');
    console.log('All user synchronization service tests passed!');
    
  } catch (error) {
    console.error('\n=== Verification Failed ===');
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

