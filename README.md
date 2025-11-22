# AssignWork Application

AssignWork is an internal application that uses the SSO Service for authentication. It maintains its own database and RBAC system for application-specific permissions.

## Overview

This application is part of the SSO Multi-App System and delegates authentication to the centralized SSO Service while maintaining independent authorization and data management.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- SSO Service running on port 3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
npx prisma migrate dev
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001).

## Project Structure

```
apps/assignwork/
├── app/              # Next.js app directory
│   ├── api/          # API routes
│   └── ...
├── lib/              # Utility functions and services
│   ├── prisma.ts     # Prisma client
│   ├── env.ts        # Environment configuration
│   └── sso-config.ts # SSO configuration
├── components/       # React components
├── types/            # TypeScript type definitions
├── prisma/           # Prisma schema and migrations
└── public/           # Static assets
```

## Authentication Flow

1. User accesses AssignWork
2. Application redirects to SSO Service for authentication
3. User logs in at SSO Service
4. SSO Service redirects back with authorization code
5. AssignWork exchanges code for access token
6. AssignWork fetches user info from SSO Service
7. AssignWork checks if user exists in local database
8. If user exists, grant access; otherwise show error

## Environment Variables

See `.env.example` for required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `SSO_CLIENT_ID`: OAuth2 client ID
- `SSO_CLIENT_SECRET`: OAuth2 client secret
- `SSO_AUTHORIZE_URL`: SSO authorization endpoint
- `SSO_TOKEN_URL`: SSO token endpoint
- `SSO_USERINFO_URL`: SSO userinfo endpoint
- `SSO_JWKS_URL`: SSO JWKS endpoint
- `SSO_LOGOUT_URL`: SSO logout endpoint
- `APP_CALLBACK_URL`: Application callback URL

## Database

This application uses its own PostgreSQL database, separate from the SSO Service and other internal applications. User data is minimal (email and username only), with full user details maintained by the SSO Service.

## RBAC System

AssignWork maintains its own Role-Based Access Control system, independent of the SSO Service user types. Permissions are application-specific and do not affect other applications.

## Session Management

AssignWork implements comprehensive session management with the following features:

### Local Session Storage
- Secure HTTP-only cookies with 7-day expiration
- Session data includes user info and OAuth tokens
- Automatic session validation on protected routes

### Automatic Token Refresh
- Access tokens automatically refreshed when expired
- Refresh happens transparently in middleware
- Manual refresh endpoint available at `/api/auth/refresh`

### Coordinated Logout
- Local session cleared immediately
- SSO logout called to invalidate all tokens
- Logout available via GET or POST at `/api/auth/logout`

### Session Service API

```typescript
import { 
  createSession, 
  getCurrentSession, 
  terminateSession,
  getAccessToken,
  getSessionUser 
} from '@/lib/services/session.service';

// Create session after OAuth callback
await createSession(sessionData);

// Get current session
const session = await getCurrentSession();

// Get access token (auto-refreshes if needed)
const token = await getAccessToken();

// Logout
await terminateSession();
```

See [SESSION_MANAGEMENT_IMPLEMENTATION.md](./SESSION_MANAGEMENT_IMPLEMENTATION.md) for detailed documentation.

## Verification Scripts

Run verification scripts to test the implementation:

```bash
# Verify complete setup
npx tsx scripts/verify-setup.ts

# Verify user synchronization
npx tsx scripts/verify-user-sync.ts

# Verify RBAC system
npx tsx scripts/verify-rbac.ts

# Verify session management
npx tsx scripts/verify-session-management.ts
```
