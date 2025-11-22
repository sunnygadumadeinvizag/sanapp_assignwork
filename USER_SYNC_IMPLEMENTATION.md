# User Synchronization Implementation

## Overview

This document describes the implementation of the user synchronization module for AssignWork, which handles synchronization of user data from the SSO Service to the local database.

## Requirements Addressed

- **Requirement 5.1**: Check if authenticated user exists in local database using email or username
- **Requirement 5.2**: Display error if user doesn't exist locally
- **Requirement 5.3**: Store only email and username from SSO

## Implementation

### Service: `user-sync.service.ts`

Location: `apps/assignwork/lib/services/user-sync.service.ts`

#### Core Functions

##### 1. `getUserByEmail(email: string): Promise<LocalUser | null>`

Looks up a local user by email address.

**Parameters:**
- `email`: User email from SSO

**Returns:**
- Local user if found, null otherwise

**Requirement:** 5.1

##### 2. `getUserByUsername(username: string): Promise<LocalUser | null>`

Looks up a local user by username.

**Parameters:**
- `username`: Username from SSO

**Returns:**
- Local user if found, null otherwise

**Requirement:** 5.1

##### 3. `findLocalUser(email: string, username: string): Promise<LocalUser | null>`

Looks up a local user by email or username. Tries email first, then username.

**Parameters:**
- `email`: User email from SSO
- `username`: Username from SSO

**Returns:**
- Local user if found, null otherwise

**Requirement:** 5.1

##### 4. `createLocalUser(email: string, username: string): Promise<LocalUser>`

Creates a new local user with only email and username.

**Parameters:**
- `email`: User email from SSO
- `username`: Username from SSO

**Returns:**
- Created local user

**Requirement:** 5.3 - Stores only email and username from SSO

##### 5. `syncUserFromSSO(ssoUser: SSOUser): Promise<SyncResult>`

Main synchronization function that checks if an authenticated SSO user exists in the local database.

**Parameters:**
- `ssoUser`: User information from SSO

**Returns:**
- `SyncResult` object with:
  - `success`: Boolean indicating if sync was successful
  - `user`: Local user if found
  - `userExists`: Boolean indicating if user exists locally
  - `error`: Error code if sync failed
  - `errorDescription`: Human-readable error message

**Behavior:**
- If user exists locally: Returns success with local user data
- If user doesn't exist: Returns error with message "You do not have access to AssignWork. Please contact your administrator to request access."

**Requirements:** 5.1, 5.2, 5.3

##### 6. `provisionUserFromSSO(ssoUser: SSOUser): Promise<LocalUser>`

Administrative function to provision a new local user from SSO data.

**Parameters:**
- `ssoUser`: User information from SSO

**Returns:**
- Created or existing local user

**Behavior:**
- Checks if user already exists
- If exists, returns existing user
- If not, creates new user with only email and username

**Requirement:** 5.3

## Integration

### OAuth Callback Handler

The user synchronization service is integrated into the OAuth callback handler at `apps/assignwork/app/api/auth/callback/route.ts`.

**Flow:**
1. User authenticates with SSO
2. SSO redirects back to callback with authorization code
3. Callback exchanges code for tokens
4. Callback fetches user info from SSO
5. **Callback calls `syncUserFromSSO()` to check local user existence**
6. If user exists: Create session and redirect to home
7. If user doesn't exist: Redirect to error page with message

**Code Example:**
```typescript
// Synchronize user from SSO to local database
const syncResult = await syncUserFromSSO(result.userInfo);

if (!syncResult.success || !syncResult.user) {
  // User doesn't exist locally - redirect to error page
  return NextResponse.redirect(
    new URL(
      `/auth/error?error=${syncResult.error}&description=${encodeURIComponent(syncResult.errorDescription)}`,
      request.url
    )
  );
}

const localUser = syncResult.user;
```

## Data Model

### Local User Model

Only stores minimal data from SSO:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  roles     UserRole[]
}
```

**Note:** The local user model does NOT store:
- User type (USER, ADMIN, SUPERADMIN)
- Employment status
- Employment type
- Level
- Department

These fields remain in the SSO Service only, ensuring separation of concerns.

## Error Handling

### User Not Found Error

When a user authenticates with SSO but doesn't exist in the local database:

**Error Code:** `user_not_found`

**Error Message:** "You do not have access to AssignWork. Please contact your administrator to request access."

**User Experience:**
1. User is redirected to `/auth/error` page
2. Error message is displayed
3. User is instructed to contact administrator

### Sync Error

If an unexpected error occurs during synchronization:

**Error Code:** `sync_error`

**Error Message:** Specific error message from exception

## Testing

### Verification Script

Location: `apps/assignwork/scripts/verify-user-sync.ts`

**Tests:**
- ✓ getUserByEmail: Find user by email
- ✓ getUserByEmail: Return null for non-existent user
- ✓ getUserByUsername: Find user by username
- ✓ getUserByUsername: Return null for non-existent user
- ✓ findLocalUser: Find user by email
- ✓ findLocalUser: Find user by username
- ✓ findLocalUser: Return null for non-existent user
- ✓ createLocalUser: Create user successfully
- ✓ createLocalUser: User persisted to database
- ✓ syncUserFromSSO: Sync existing user
- ✓ syncUserFromSSO: Return error for non-existent user
- ✓ provisionUserFromSSO: Provision new user
- ✓ provisionUserFromSSO: Store only email and username (Requirement 5.3)
- ✓ provisionUserFromSSO: Return existing user when already provisioned

**Run Tests:**
```bash
cd apps/assignwork
npx tsx scripts/verify-user-sync.ts
```

## Security Considerations

1. **Data Minimization**: Only email and username are stored locally, reducing data exposure
2. **Access Control**: Users must be explicitly provisioned by administrators
3. **Error Messages**: Error messages don't leak sensitive information about user existence
4. **Database Isolation**: Local database is completely separate from SSO database

## Future Enhancements

1. **Automatic Provisioning**: Option to automatically provision users on first login
2. **User Deprovisioning**: Ability to revoke local access while maintaining SSO account
3. **Audit Logging**: Track user provisioning and access attempts
4. **Bulk Provisioning**: Administrative interface to provision multiple users at once

## Related Files

- `apps/assignwork/lib/services/user-sync.service.ts` - Main service implementation
- `apps/assignwork/lib/services/index.ts` - Service exports
- `apps/assignwork/app/api/auth/callback/route.ts` - OAuth callback integration
- `apps/assignwork/types/index.ts` - Type definitions
- `apps/assignwork/prisma/schema.prisma` - Database schema
- `apps/assignwork/scripts/verify-user-sync.ts` - Verification tests

