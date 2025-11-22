# Session Management Implementation

## Overview

This document describes the session management implementation for the AssignWork application, which handles local session storage, automatic token refresh, and coordinated logout with the SSO service.

**Requirements Addressed:**
- 1.3: Session persistence across application access
- 1.5: Logout terminates sessions across all applications

## Architecture

### Components

1. **Session Storage** (`lib/utils/session.utils.ts`)
   - Low-level session cookie management
   - Secure storage of session data
   - OAuth flow data management

2. **Session Service** (`lib/services/session.service.ts`)
   - High-level session operations
   - Automatic token refresh
   - Coordinated SSO logout

3. **Authentication Middleware** (`lib/middleware/auth.middleware.ts`)
   - Route protection
   - Automatic token refresh on requests
   - Session validation

4. **Logout Endpoint** (`app/api/auth/logout/route.ts`)
   - Local session termination
   - SSO logout coordination
   - Redirect handling

## Session Lifecycle

### 1. Session Creation

When a user successfully authenticates through OAuth2:

```typescript
// After OAuth callback
const sessionData: SessionData = {
  user: localUser,
  accessToken: tokens.access_token,
  refreshToken: tokens.refresh_token,
  expiresAt: calculateExpiresAt(tokens.expires_in),
};

await createSession(sessionData);
```

Session data is stored in an HTTP-only secure cookie with:
- 7-day expiration
- SameSite=Lax for CSRF protection
- Secure flag in production
- HttpOnly to prevent XSS

### 2. Session Validation

On each protected route access:

```typescript
// Middleware checks session
const session = await getSession();

if (!session) {
  // Redirect to login
}

if (isTokenExpired(session.expiresAt)) {
  // Attempt token refresh
  const refreshed = await refreshSessionIfNeeded();
  
  if (!refreshed) {
    // Redirect to login
  }
}
```

### 3. Token Refresh

Tokens are automatically refreshed when:
- Access token is expired
- Access token expires within 60 seconds
- Middleware detects expiration on route access

```typescript
// Automatic refresh process
const tokens = await refreshAccessToken(session.refreshToken);

if (tokens) {
  await updateSession({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: calculateExpiresAt(tokens.expires_in),
  });
}
```

### 4. Session Termination

When user logs out:

```typescript
// 1. Get current session (for access token)
const session = await getSession();

// 2. Clear local session immediately
await clearSession();

// 3. Call SSO logout to invalidate all tokens
if (session?.accessToken) {
  await axios.post(ssoConfig.logoutUrl, {}, {
    headers: { Authorization: `Bearer ${session.accessToken}` }
  });
}
```

## API Endpoints

### GET /api/auth/logout

Logs out the user and redirects to specified page.

**Query Parameters:**
- `redirect` (optional): URL to redirect after logout (default: `/`)

**Process:**
1. Retrieves current session
2. Clears local session cookie
3. Calls SSO logout endpoint
4. Redirects to specified URL

**Example:**
```
GET /api/auth/logout?redirect=/login
```

### POST /api/auth/logout

Logs out the user via API call.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Process:**
1. Retrieves current session
2. Clears local session cookie
3. Calls SSO logout endpoint
4. Returns success response

### POST /api/auth/refresh

Manually refreshes access token.

**Response:**
```json
{
  "success": true,
  "expires_in": 900
}
```

**Process:**
1. Gets current session
2. Calls SSO token endpoint with refresh token
3. Updates session with new tokens
4. Returns success with expiration time

## Session Service API

### createSession(sessionData)

Creates a new session with user data and tokens.

```typescript
await createSession({
  user: localUser,
  accessToken: 'token',
  refreshToken: 'refresh',
  expiresAt: Date.now() + 900000,
});
```

### getCurrentSession()

Retrieves current active session.

```typescript
const session = await getCurrentSession();
if (session) {
  console.log('User:', session.user.email);
}
```

### isSessionValid()

Checks if a valid session exists.

```typescript
const valid = await isSessionValid();
if (!valid) {
  // Redirect to login
}
```

### refreshSessionIfNeeded()

Refreshes tokens if expired or about to expire.

```typescript
const refreshed = await refreshSessionIfNeeded();
if (!refreshed) {
  // Session cannot be refreshed, redirect to login
}
```

### terminateSession()

Terminates session locally and on SSO.

```typescript
const success = await terminateSession();
// User is logged out
```

### getAccessToken()

Gets access token, automatically refreshing if needed.

```typescript
const token = await getAccessToken();
if (token) {
  // Use token for API calls
}
```

### getSessionUser()

Gets user data from current session.

```typescript
const user = await getSessionUser();
if (user) {
  console.log('Logged in as:', user.email);
}
```

### validateSessionAndGetUserId()

Validates session and returns user ID (for API routes).

```typescript
const userId = await validateSessionAndGetUserId();
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Middleware Integration

The authentication middleware automatically handles session validation and token refresh:

```typescript
// middleware.ts
import { verifyAuth } from '@/lib/middleware/auth.middleware';

export async function middleware(request: NextRequest) {
  // Verify authentication and refresh if needed
  const authResponse = await verifyAuth(request);
  
  if (authResponse) {
    // Authentication failed, redirect to login
    return authResponse;
  }
  
  // Continue to route
  return NextResponse.next();
}
```

## Security Considerations

### Cookie Security

- **HttpOnly**: Prevents JavaScript access to session cookie
- **Secure**: Requires HTTPS in production
- **SameSite=Lax**: Protects against CSRF attacks
- **Path=/**: Cookie available to entire application

### Token Security

- **Short-lived access tokens**: 15 minutes (from SSO)
- **Longer refresh tokens**: 7 days (from SSO)
- **Automatic refresh**: Reduces exposure of expired tokens
- **Coordinated logout**: Invalidates all tokens on SSO

### Error Handling

- **Graceful degradation**: Logout succeeds even if SSO call fails
- **Local-first**: Always clear local session before calling SSO
- **Timeout protection**: 5-second timeout on SSO logout calls
- **Error logging**: All errors logged for debugging

## Testing

### Manual Testing

1. **Login and Session Creation**
   ```bash
   # Login through OAuth flow
   curl http://localhost:3001/api/auth/login
   # Follow redirects and complete authentication
   ```

2. **Token Refresh**
   ```bash
   # Wait for token to expire (or modify expiresAt)
   # Access protected route - should auto-refresh
   curl -b cookies.txt http://localhost:3001/api/example/tasks
   ```

3. **Logout**
   ```bash
   # Logout via GET
   curl -b cookies.txt http://localhost:3001/api/auth/logout
   
   # Logout via POST
   curl -X POST -b cookies.txt http://localhost:3001/api/auth/logout
   ```

### Verification Script

Run the verification script to test session management:

```bash
cd apps/assignwork
npx tsx scripts/verify-session-management.ts
```

## Configuration

### Environment Variables

Required environment variables in `.env`:

```env
# SSO Configuration
SSO_LOGOUT_URL="http://localhost:3000/api/logout"
SSO_TOKEN_URL="http://localhost:3000/api/token"

# Application
APP_CALLBACK_URL="http://localhost:3001/auth/callback"
```

### Session Configuration

Session settings in `session.utils.ts`:

```typescript
const SESSION_COOKIE_NAME = 'assignwork_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
```

## Troubleshooting

### Session Not Persisting

**Symptom**: User logged out after page refresh

**Solutions**:
- Check cookie settings (HttpOnly, Secure, SameSite)
- Verify SESSION_MAX_AGE is set correctly
- Check browser cookie storage

### Token Refresh Failing

**Symptom**: User redirected to login despite having refresh token

**Solutions**:
- Verify SSO_TOKEN_URL is correct
- Check refresh token hasn't expired (7 days)
- Verify SSO service is running
- Check network connectivity to SSO

### Logout Not Working

**Symptom**: User still authenticated after logout

**Solutions**:
- Verify SSO_LOGOUT_URL is correct
- Check SSO logout endpoint is working
- Verify access token is being sent to SSO
- Check local session is being cleared

### CORS Errors on Logout

**Symptom**: CORS error when calling SSO logout

**Solutions**:
- Verify SSO CORS configuration allows AssignWork origin
- Check SSO allows POST requests to /api/logout
- Verify Authorization header is allowed

## Implementation Status

✅ Local session management
✅ Token refresh on expiry
✅ Logout handler that calls SSO logout
✅ Session service with high-level API
✅ Middleware integration
✅ Error handling and logging
✅ Documentation

## Next Steps

1. Add session monitoring and analytics
2. Implement session timeout warnings
3. Add "Remember me" functionality
4. Implement session activity tracking
5. Add concurrent session management
