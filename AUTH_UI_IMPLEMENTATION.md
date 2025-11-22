# Authentication Flow UI Implementation

## Overview

This document describes the authentication flow UI implementation for the AssignWork application, including callback handlers, error pages, loading states, and protected route middleware.

**Requirements Addressed:**
- 1.1: Unauthenticated redirect to SSO login
- 1.2: Successful authentication callback handling
- 5.2: Error handling for users without local records
- 12.2: shadcn UI components for consistent styling
- 12.3: Alert components for error messages

## Implementation Status

✅ **Completed Components:**

1. **Authentication Callback Handler** (`/app/api/auth/callback/route.ts`)
   - Validates authorization code and state parameter
   - Exchanges code for tokens
   - Synchronizes user from SSO
   - Creates local session
   - Handles errors gracefully

2. **Authentication Middleware** (`/middleware.ts` and `/lib/middleware/auth.middleware.ts`)
   - Protects routes requiring authentication
   - Automatically refreshes expired tokens
   - Redirects unauthenticated users to login

3. **Error Page** (`/app/auth/error/page.tsx`)
   - Displays user-friendly error messages
   - Handles multiple error types with specific messages
   - Special handling for "user not found" scenario
   - Provides retry functionality

4. **Loading States**
   - Callback loading page (`/app/auth/callback/page.tsx`)
   - Login redirect loading page (`/app/auth/loading/page.tsx`)
   - Animated spinners and progress indicators

5. **Logout Handler** (`/app/api/auth/logout/route.ts`)
   - Clears local session
   - Redirects to home page

6. **Enhanced Home Page** (`/app/page.tsx`)
   - Displays authenticated user information
   - Shows authentication status
   - Provides logout functionality

## Authentication Flow

### 1. Initial Access (Unauthenticated)

```
User → Protected Route → Middleware → Redirect to /api/auth/login
```

The middleware detects no session and redirects to the login endpoint.

### 2. Login Initiation

```
/api/auth/login → Generate PKCE params → Store in cookies → Redirect to SSO
```

The login endpoint:
- Generates code verifier and code challenge (PKCE)
- Generates state parameter (CSRF protection)
- Stores these in secure cookies
- Redirects to SSO authorization endpoint

### 3. SSO Authentication

```
User → SSO Login Page → Authenticate → Redirect to callback with code
```

The user authenticates with the SSO service, which redirects back with an authorization code.

### 4. Callback Processing

```
/api/auth/callback → Validate state → Exchange code → Fetch userinfo → Sync user → Create session
```

The callback handler:
- Validates the state parameter matches stored value
- Exchanges authorization code for tokens using code verifier
- Fetches user information from SSO
- Checks if user exists in local database
- Creates local session with tokens
- Redirects to home page

### 5. Protected Route Access

```
User → Protected Route → Middleware → Check session → Refresh if needed → Allow access
```

The middleware:
- Checks for valid session
- Refreshes access token if expired
- Allows access to protected routes

## Error Handling

### Error Types and Messages

1. **user_not_found**
   - **Title:** Access Denied
   - **Message:** User authenticated but no local record exists
   - **Action:** Contact administrator for access
   - **Special Note:** Explains RBAC independence

2. **user_sync_failed**
   - **Title:** User Synchronization Failed
   - **Message:** Unable to sync user info from SSO
   - **Action:** Retry or contact administrator

3. **missing_parameters**
   - **Title:** Invalid Request
   - **Message:** Missing required OAuth parameters
   - **Action:** Retry login

4. **invalid_state**
   - **Title:** Invalid Session
   - **Message:** State parameter mismatch (possible CSRF)
   - **Action:** Retry login

5. **callback_failed**
   - **Title:** Authentication Failed
   - **Message:** Generic callback failure
   - **Action:** Retry login

6. **server_error**
   - **Title:** Server Error
   - **Message:** Internal server error
   - **Action:** Retry later or contact administrator

### Error Page Features

- **User-friendly messages:** Clear explanations for each error type
- **Contextual information:** Shows error details when available
- **Retry functionality:** "Try Again" button to restart authentication
- **Admin contact guidance:** Shows when to contact administrator
- **Special handling:** Extra information for "user not found" scenario

## Loading States

### 1. Callback Loading Page

Displayed while the callback API route processes authentication:

- **Visual elements:**
  - Animated spinner
  - Progress indicators for each step
  - Reassuring messages
  
- **Steps shown:**
  - Verifying authorization code
  - Exchanging tokens
  - Loading profile

- **Timeout:** Redirects to login after 5 seconds if stuck

### 2. Login Redirect Loading Page

Displayed when redirecting to SSO:

- **Visual elements:**
  - Animated spinner
  - Simple message
  
- **Purpose:** Provides feedback during redirect

## Protected Routes

### Middleware Configuration

The middleware runs on all routes except:
- `/_next/static` - Static files
- `/_next/image` - Image optimization
- `/favicon.ico` - Favicon
- `/api/auth/login` - Login endpoint
- `/api/auth/callback` - Callback endpoint
- `/auth/error` - Error page

### Authentication Check

For each protected route:
1. Check if session exists
2. Check if access token is expired
3. If expired, attempt to refresh using refresh token
4. If refresh fails, redirect to login
5. If successful, allow access

### Token Refresh

Automatic token refresh happens when:
- Access token is expired or about to expire (60 second buffer)
- User accesses a protected route
- Middleware detects expiration

The refresh process:
1. Call SSO token endpoint with refresh token
2. Receive new access and refresh tokens
3. Update session with new tokens
4. Continue to requested route

## Session Management

### Session Storage

Sessions are stored in secure HTTP-only cookies:

```typescript
{
  user: {
    id: string;
    email: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
  },
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Timestamp in milliseconds
}
```

### Cookie Configuration

- **Name:** `assignwork_session`
- **HttpOnly:** true (prevents JavaScript access)
- **Secure:** true in production (HTTPS only)
- **SameSite:** lax (CSRF protection)
- **MaxAge:** 7 days
- **Path:** / (available to all routes)

### OAuth Flow Data

Temporary storage for OAuth state and code verifier:

- **Cookies:** `oauth_state`, `oauth_verifier`
- **MaxAge:** 10 minutes
- **Purpose:** Validate callback and complete PKCE flow
- **Cleanup:** Deleted after successful callback

## User Interface Components

### Home Page

The home page displays:

1. **Navigation Bar:**
   - Application name
   - User welcome message
   - Logout button

2. **Authentication Status:**
   - Green success banner when authenticated
   - User profile information
   - Quick links to features

3. **Profile Display:**
   - Username
   - Email
   - User ID

### Styling

All UI components use Tailwind CSS for consistent styling:

- **Colors:** Blue for primary actions, red for logout/errors, green for success
- **Spacing:** Consistent padding and margins
- **Responsive:** Mobile-friendly layouts
- **Accessibility:** Proper contrast ratios and focus states

## API Endpoints

### GET /api/auth/login

Initiates OAuth2 authorization flow.

**Response:** Redirect to SSO authorization endpoint

### GET /api/auth/callback

Handles OAuth2 callback from SSO.

**Query Parameters:**
- `code` - Authorization code
- `state` - CSRF protection token

**Response:** 
- Success: Redirect to home page
- Error: Redirect to error page with error details

### GET /api/auth/logout

Logs out the user.

**Response:** Redirect to home page (triggers re-authentication)

### POST /api/auth/refresh

Refreshes access token (called by middleware).

**Body:**
```json
{
  "refresh_token": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_in": 900
}
```

## Security Considerations

### CSRF Protection

- State parameter validated in callback
- Stored in secure HTTP-only cookie
- Compared with returned state value

### PKCE (Proof Key for Code Exchange)

- Code verifier generated and stored securely
- Code challenge sent to SSO
- Code verifier used to exchange authorization code
- Prevents authorization code interception attacks

### Token Security

- Access tokens stored in HTTP-only cookies
- Refresh tokens stored in HTTP-only cookies
- Tokens never exposed to client-side JavaScript
- Automatic token refresh before expiration

### Session Security

- HTTP-only cookies prevent XSS attacks
- Secure flag in production (HTTPS only)
- SameSite=lax prevents CSRF attacks
- 7-day expiration for sessions

## Testing

### Manual Testing Steps

1. **Unauthenticated Access:**
   - Visit home page without session
   - Should redirect to SSO login

2. **Successful Login:**
   - Complete SSO login
   - Should redirect back to AssignWork
   - Should display user information

3. **User Not Found:**
   - Login with SSO user not in local database
   - Should show "Access Denied" error
   - Should explain need for local user record

4. **Token Refresh:**
   - Wait for access token to expire
   - Access protected route
   - Should automatically refresh token

5. **Logout:**
   - Click logout button
   - Should clear session
   - Should redirect to home (triggers re-auth)

### Error Scenarios

1. **Invalid State:**
   - Manually modify state parameter
   - Should show "Invalid Session" error

2. **Expired Authorization Code:**
   - Wait 10+ minutes after redirect
   - Complete callback
   - Should show error

3. **Network Error:**
   - Disconnect network during callback
   - Should show "Server Error"

## Future Enhancements

1. **Remember Me:** Optional longer session duration
2. **SSO Logout:** Redirect to SSO logout endpoint
3. **Session Activity:** Track last activity time
4. **Multi-tab Sync:** Synchronize logout across tabs
5. **Loading Skeletons:** More sophisticated loading states
6. **Error Recovery:** Automatic retry for transient errors

## Related Files

- `/app/api/auth/callback/route.ts` - Callback handler
- `/app/api/auth/login/route.ts` - Login initiator
- `/app/api/auth/logout/route.ts` - Logout handler
- `/app/api/auth/refresh/route.ts` - Token refresh
- `/app/auth/error/page.tsx` - Error page
- `/app/auth/callback/page.tsx` - Callback loading page
- `/app/auth/loading/page.tsx` - Login loading page
- `/middleware.ts` - Route protection
- `/lib/middleware/auth.middleware.ts` - Auth middleware logic
- `/lib/services/oauth.client.ts` - OAuth2 client
- `/lib/utils/session.utils.ts` - Session management

## Conclusion

The authentication flow UI implementation provides a complete, secure, and user-friendly authentication experience for the AssignWork application. It handles all aspects of OAuth2 authentication, including error cases, loading states, and automatic token refresh, while maintaining security best practices.
