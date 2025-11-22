import { env } from './env';

export const ssoConfig = {
  clientId: env.SSO_CLIENT_ID,
  clientSecret: env.SSO_CLIENT_SECRET,
  authorizeUrl: env.SSO_AUTHORIZE_URL,
  tokenUrl: env.SSO_TOKEN_URL,
  userinfoUrl: env.SSO_USERINFO_URL,
  jwksUrl: env.SSO_JWKS_URL,
  logoutUrl: env.SSO_LOGOUT_URL,
  callbackUrl: env.APP_CALLBACK_URL,
} as const;
