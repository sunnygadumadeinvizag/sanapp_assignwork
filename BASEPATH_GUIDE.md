# BasePath Implementation Guide

## Overview
This application supports flexible deployment paths through environment-based basepath configuration. You can deploy the app at the root (`/`) or any subpath (e.g., `/sso`).

## Quick Start

### 1. Configure Environment Variables

Create a `.env.local` file (copy from `env.template`):

```bash
# For subpath deployment
NEXT_PUBLIC_BASE_PATH=/sso
NEXT_PUBLIC_API_URL=http://localhost:3000/sso/api
NEXT_PUBLIC_APP_URL=http://localhost:3000/sso

# For root deployment
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Run the Application

```bash
npm run dev
```

The app will be available at:
- With basePath `/sso`: http://localhost:3000/sso
- Without basePath: http://localhost:3000

## Usage in Code

### Navigation

#### Using the Link Component
```typescript
import Link from '@/components/Link';

// Automatically handles basePath
<Link href="/dashboard">Dashboard</Link>
<Link href="/api/users">API</Link>
```

#### Using the useBasePath Hook
```typescript
import { useBasePath } from '@/hooks/useBasePath';

function MyComponent() {
  const { navigate, withBasePath, currentPath } = useBasePath();
  
  // Navigate programmatically
  const handleClick = () => {
    navigate('/dashboard');
  };
  
  // Get path with basePath
  const apiPath = withBasePath('/api/users');
  
  // Get current path without basePath
  console.log(currentPath); // '/dashboard' instead of '/sso/dashboard'
  
  return <button onClick={handleClick}>Go to Dashboard</button>;
}
```

### API Calls

#### Using the API Client
```typescript
import api from '@/lib/api-client';

// GET request
const users = await api.get('/users');

// POST request
const newUser = await api.post('/users', { name: 'John' });

// PUT request
const updated = await api.put('/users/123', { name: 'Jane' });

// DELETE request
await api.delete('/users/123');
```

#### Using fetchApi Directly
```typescript
import { fetchApi } from '@/lib/api-client';

const response = await fetchApi('/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John' })
});
```

### Static Assets

#### Using Next.js Image Component (Recommended)
```typescript
import Image from 'next/image';

// Next.js Image automatically handles basePath
<Image src="/logo.png" alt="Logo" width={100} height={100} />
```

#### Using Regular img Tag
```typescript
import { withBasePath } from '@/lib/basepath';

<img src={withBasePath('/logo.png')} alt="Logo" />
```

### Server-Side Usage

#### In API Routes
```typescript
// API routes automatically respect basePath
// No changes needed!

export async function GET(request: Request) {
  // Your API logic here
  return Response.json({ data: 'success' });
}
```

#### In Server Components
```typescript
import { withBasePath } from '@/lib/basepath';

export default function ServerComponent() {
  const dashboardUrl = withBasePath('/dashboard');
  
  return <a href={dashboardUrl}>Dashboard</a>;
}
```

## Utility Functions

### Path Utilities

```typescript
import { 
  getBasePath, 
  withBasePath, 
  removeBasePath,
  isExternalPath,
  getAppUrl,
  getFullUrl 
} from '@/lib/basepath';

// Get configured basePath
const basePath = getBasePath(); // '/sso' or ''

// Add basePath to a path
const path = withBasePath('/dashboard'); // '/sso/dashboard'

// Remove basePath from a path
const clean = removeBasePath('/sso/dashboard'); // '/dashboard'

// Check if path is external
const isExternal = isExternalPath('https://example.com'); // true

// Get application base URL
const appUrl = getAppUrl(); // 'http://localhost:3000/sso'

// Get full URL for a path
const fullUrl = getFullUrl('/dashboard'); // 'http://localhost:3000/sso/dashboard'
```

### API Utilities

```typescript
import { apiUrl } from '@/lib/basepath';

// Get API URL for an endpoint
const url = apiUrl('/users'); // '/sso/api/users'
const url2 = apiUrl('users'); // '/sso/api/users' (same result)
```

## Testing

### Run Unit Tests
```bash
npm run test:basepath
```

### Manual Testing Checklist

- [ ] Homepage loads correctly
- [ ] Navigation between pages works
- [ ] API calls succeed
- [ ] Images and static assets load
- [ ] Login/logout flow works
- [ ] Redirects work correctly
- [ ] External links work
- [ ] Hash links work (#section)

### Test Different Configurations

1. **Test with basePath**:
   ```env
   NEXT_PUBLIC_BASE_PATH=/sso
   ```
   Access: http://localhost:3000/sso

2. **Test without basePath**:
   ```env
   NEXT_PUBLIC_BASE_PATH=
   ```
   Access: http://localhost:3000

## Common Patterns

### Conditional Rendering Based on Path
```typescript
import { useIsActivePath, usePathStartsWith } from '@/hooks/useBasePath';

function Navigation() {
  const isDashboard = useIsActivePath('/dashboard');
  const isSettings = usePathStartsWith('/settings');
  
  return (
    <nav>
      <a className={isDashboard ? 'active' : ''}>Dashboard</a>
      <a className={isSettings ? 'active' : ''}>Settings</a>
    </nav>
  );
}
```

### Redirects in Server Components
```typescript
import { redirect } from 'next/navigation';
import { withBasePath } from '@/lib/basepath';

export default function ProtectedPage() {
  const isAuthenticated = false; // Your auth logic
  
  if (!isAuthenticated) {
    redirect(withBasePath('/login'));
  }
  
  return <div>Protected Content</div>;
}
```

### Form Actions
```typescript
'use client';

import { useBasePath } from '@/hooks/useBasePath';

function LoginForm() {
  const { navigate } = useBasePath();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Your login logic
    const success = await login();
    
    if (success) {
      navigate('/dashboard');
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment-Specific Builds

For different environments, create separate `.env` files:

- `.env.local` - Local development
- `.env.development` - Development server
- `.env.staging` - Staging server
- `.env.production` - Production server

## Troubleshooting

### Assets Not Loading
- Ensure you're using `withBasePath()` for manual asset paths
- Use Next.js `<Image>` component when possible (handles basePath automatically)

### API Calls Failing
- Use `api.get()`, `api.post()`, etc. from `@/lib/api-client`
- Or use `fetchApi()` for custom requests
- Never hardcode `/api/...` paths

### Navigation Not Working
- Use `<Link>` from `@/components/Link` instead of `next/link`
- Or use `navigate()` from `useBasePath()` hook
- Never use hardcoded paths with `router.push()`

### 404 Errors
- Check that `NEXT_PUBLIC_BASE_PATH` matches your deployment path
- Ensure all paths use basePath utilities
- Verify middleware is not stripping basePath

## Best Practices

✅ **DO:**
- Use provided utilities and components
- Test with and without basePath
- Use environment variables for configuration
- Document any custom basePath handling

❌ **DON'T:**
- Hardcode paths (e.g., `/api/users`)
- Use `next/link` directly (use `@/components/Link`)
- Use `router.push()` without `withBasePath()`
- Assume basePath is always set

## Migration Guide

If you have existing code, follow these steps:

1. **Update Links**:
   ```typescript
   // Before
   import Link from 'next/link';
   <Link href="/dashboard">Dashboard</Link>
   
   // After
   import Link from '@/components/Link';
   <Link href="/dashboard">Dashboard</Link>
   ```

2. **Update Navigation**:
   ```typescript
   // Before
   router.push('/dashboard');
   
   // After
   import { useBasePath } from '@/hooks/useBasePath';
   const { navigate } = useBasePath();
   navigate('/dashboard');
   ```

3. **Update API Calls**:
   ```typescript
   // Before
   fetch('/api/users');
   
   // After
   import api from '@/lib/api-client';
   api.get('/users');
   ```

4. **Update Assets**:
   ```typescript
   // Before
   <img src="/logo.png" />
   
   // After
   import Image from 'next/image';
   <Image src="/logo.png" width={100} height={100} />
   
   // Or
   import { withBasePath } from '@/lib/basepath';
   <img src={withBasePath('/logo.png')} />
   ```

## Support

For issues or questions:
1. Check this documentation
2. Run the test script: `npm run test:basepath`
3. Review the implementation strategy: `../BASEPATH_IMPLEMENTATION_STRATEGY.md`
