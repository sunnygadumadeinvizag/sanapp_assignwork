import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // SSO Configuration
  SSO_CLIENT_ID: z.string().min(1),
  SSO_CLIENT_SECRET: z.string().min(1),
  SSO_AUTHORIZE_URL: z.string().url(),
  SSO_TOKEN_URL: z.string().url(),
  SSO_USERINFO_URL: z.string().url(),
  SSO_JWKS_URL: z.string().url(),
  SSO_LOGOUT_URL: z.string().url(),
  
  // Application
  APP_CALLBACK_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(e => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

export const env = validateEnv();
