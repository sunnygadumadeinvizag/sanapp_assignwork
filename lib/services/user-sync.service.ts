import { prisma } from '../prisma';
import { SSOUser, LocalUser } from '@/types';

/**
 * User Synchronization Service for AssignWork
 * Handles synchronization of user data from SSO to local database
 * 
 * Requirements:
 * - 5.1: Check if authenticated user exists in local database
 * - 5.2: Display error if user doesn't exist locally
 * - 5.3: Store only email and username from SSO
 */

/**
 * Lookup local user by email
 * 
 * @param email - User email from SSO
 * @returns Local user if found, null otherwise
 */
export async function getUserByEmail(email: string): Promise<LocalUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

/**
 * Lookup local user by username
 * 
 * @param username - Username from SSO
 * @returns Local user if found, null otherwise
 */
export async function getUserByUsername(username: string): Promise<LocalUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return null;
  }
}

/**
 * Lookup local user by email or username
 * Tries email first, then username
 * 
 * @param email - User email from SSO
 * @param username - Username from SSO
 * @returns Local user if found, null otherwise
 */
export async function findLocalUser(
  email: string,
  username: string
): Promise<LocalUser | null> {
  // Try email first
  let user = await getUserByEmail(email);
  
  if (user) {
    return user;
  }

  // Try username if email lookup failed
  user = await getUserByUsername(username);
  
  return user;
}

/**
 * Create local user with only email and username
 * Requirement 5.3: Internal app stores only email and username from SSO
 * 
 * @param email - User email from SSO
 * @param username - Username from SSO
 * @returns Created local user
 */
export async function createLocalUser(
  email: string,
  username: string
): Promise<LocalUser> {
  try {
    const user = await prisma.user.create({
      data: {
        email,
        username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error creating local user:', error);
    throw new Error('Failed to create local user');
  }
}

/**
 * Synchronization result
 */
export interface SyncResult {
  success: boolean;
  user?: LocalUser;
  error?: string;
  errorDescription?: string;
  userExists: boolean;
}

/**
 * Synchronize user from SSO to local database
 * 
 * This function checks if the authenticated SSO user exists in the local database.
 * If the user exists, it returns the local user record.
 * If the user doesn't exist, it returns an error indicating the user needs to be provisioned.
 * 
 * Requirements:
 * - 5.1: Check if user exists in local database using email or username
 * - 5.2: Handle case where authenticated user doesn't exist locally
 * - 5.3: Store only email and username from SSO
 * 
 * @param ssoUser - User information from SSO
 * @returns Synchronization result with local user or error
 */
export async function syncUserFromSSO(ssoUser: SSOUser): Promise<SyncResult> {
  try {
    // Requirement 5.1: Check if user exists in local database
    const localUser = await findLocalUser(ssoUser.email, ssoUser.username);

    if (localUser) {
      // User exists locally
      return {
        success: true,
        user: localUser,
        userExists: true,
      };
    }

    // Requirement 5.2: User doesn't exist locally
    // Return error - user needs to be provisioned by administrator
    return {
      success: false,
      userExists: false,
      error: 'user_not_found',
      errorDescription: 'You do not have access to AssignWork. Please contact your administrator to request access.',
    };
  } catch (error) {
    console.error('Error synchronizing user from SSO:', error);
    
    return {
      success: false,
      userExists: false,
      error: 'sync_error',
      errorDescription: error instanceof Error ? error.message : 'Unknown error during user synchronization',
    };
  }
}

/**
 * Provision a new local user from SSO data
 * This is typically called by an administrator to grant access to a user
 * 
 * @param ssoUser - User information from SSO
 * @returns Created local user
 */
export async function provisionUserFromSSO(ssoUser: SSOUser): Promise<LocalUser> {
  // Check if user already exists
  const existingUser = await findLocalUser(ssoUser.email, ssoUser.username);
  
  if (existingUser) {
    return existingUser;
  }

  // Requirement 5.3: Create user with only email and username
  return await createLocalUser(ssoUser.email, ssoUser.username);
}

