# Session Management Quick Reference

## Common Operations

### Check if User is Logged In

```typescript
import { isSessionValid } from '@/lib/services/session.service';

const isLoggedIn = await isSessionValid();
```

### Get Current User

```typescript
import { getSessionUser } from '@/lib/services/session.service';

const user = await getSessionUser();
if (user) {
  console.log(user.email, user.username);
}
```

### Get Access Token for API Calls

```typescript
import { getAccessToken } from '@/lib/services/session.service';

// Automatically refreshes if expired
const token = await getAccessToken();

// Use in API calls
const response = await fetch('https://api.example.com/data', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### Logout User

```typescript
import { terminateSession } from '@/lib/services/session.service';

await terminateSession();
// User is now logged out locally and on SSO
```

### Protect API Routes

```typescript
import { validateSessionAndGetUserId } from '@/lib/services/session.service';

export async function GET(request: NextRequest) {
  const userId = await validateSessionAndGetUserId();
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // User is authenticated, proceed with request
  // ...
}
```

### Manual Token Refresh

```typescript
import { refreshSessionIfNeeded } from '@/lib/services/session.service';

const refreshed = await refreshSessionIfNeeded();
if (!refreshed) {
  // Redirect to login
}
```

## API Endpoints

### Logout (GET)

```
GET /api/auth/logout?redirect=/login
```

Logs out user and redirects to specified URL.

### Logout (POST)

```
POST /api/auth/logout
```

Returns JSON response:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Refresh Token

```
POST /api/auth/refresh
```

Returns JSON response:
```json
{
  "success": true,
  "expires_in": 900
}
```

## Middleware

Authentication middleware automatically:
- Checks for valid session
- Refreshes expired tokens
- Redirects to login if authentication fails

Protected routes are automatically secured.

## Session Data Structure

```typescript
interface SessionData {
  user: {
    id: string;
    email: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Timestamp in milliseconds
}
```

## Configuration

Session settings in `lib/utils/session.utils.ts`:

```typescript
const SESSION_COOKIE_NAME = 'assignwork_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
```

SSO endpoints in `.env`:

```env
SSO_LOGOUT_URL="http://localhost:3000/api/logout"
SSO_TOKEN_URL="http://localhost:3000/api/token"
```

## Troubleshooting

### User Logged Out After Page Refresh

Check cookie settings - ensure cookies are being stored properly.

### Token Refresh Failing

- Verify SSO service is running
- Check SSO_TOKEN_URL in .env
- Ensure refresh token hasn't expired (7 days)

### Logout Not Working

- Verify SSO_LOGOUT_URL in .env
- Check SSO service is accessible
- Review browser console for errors

## Security Notes

- Sessions use HTTP-only cookies (not accessible via JavaScript)
- Secure flag enabled in production (requires HTTPS)
- SameSite=Lax prevents CSRF attacks
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Logout invalidates all tokens on SSO

## Testing

Run verification script:

```bash
npx tsx scripts/verify-session-management.ts
```

## Documentation

- [SESSION_MANAGEMENT_IMPLEMENTATION.md](./SESSION_MANAGEMENT_IMPLEMENTATION.md) - Full technical documentation
- [SESSION_MANAGEMENT_SUMMARY.md](./SESSION_MANAGEMENT_SUMMARY.md) - Implementation summary
- [README.md](./README.md) - General application documentation
