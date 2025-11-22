// AssignWork Application Types

// ============================================================================
// SSO User Types (from SSO Service)
// ============================================================================

export enum SSOUserType {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN'
}

export enum SSOEmploymentStatus {
  STAFF = 'STAFF',
  FACULTY = 'FACULTY'
}

export enum SSOEmploymentType {
  REGULAR = 'REGULAR',
  OUTSOURCING = 'OUTSOURCING'
}

export interface SSOUser {
  id: string;
  email: string;
  username: string;
  userType: SSOUserType;
  employmentStatus: SSOEmploymentStatus;
  employmentType: SSOEmploymentType;
  level: number;
  department: string;
}

// ============================================================================
// Local User Types (minimal data stored)
// ============================================================================

export interface LocalUser {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLocalUserInput {
  email: string;
  username: string;
}

// ============================================================================
// OAuth2 Types
// ============================================================================

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  jwksUrl: string;
  callbackUrl: string;
}

export interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: 'code';
  state: string;
  code_challenge: string;
  code_challenge_method: 'S256';
  scope?: string;
}

export interface TokenRequest {
  grant_type: 'authorization_code' | 'refresh_token';
  code?: string;
  refresh_token?: string;
  redirect_uri?: string;
  client_id: string;
  code_verifier?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface TokenRefreshRequest {
  refresh_token: string;
  client_id: string;
  grant_type: 'refresh_token';
}

// ============================================================================
// Session Types
// ============================================================================

export interface SessionData {
  user: LocalUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  createdAt?: number;
}

export interface SessionCookie {
  sessionId: string;
  expiresAt: number;
}

// ============================================================================
// RBAC Types
// ============================================================================

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string | null;
  createdAt: Date;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy?: string;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
  grantedAt: Date;
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

export interface AssignRoleInput {
  userId: string;
  roleId: string;
  assignedBy?: string;
}

export interface GrantPermissionInput {
  roleId: string;
  permissionId: string;
}

export interface CheckPermissionInput {
  userId: string;
  resource: string;
  action: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ErrorResponse {
  error: string;
  error_description: string;
  error_uri?: string;
  timestamp: string;
  requestId: string;
}

export enum AuthErrorCode {
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  INVALID_TOKEN = 'invalid_token',
  TOKEN_EXPIRED = 'token_expired',
  USER_NOT_FOUND = 'user_not_found',
  INVALID_CREDENTIALS = 'invalid_credentials',
  SESSION_EXPIRED = 'session_expired'
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// User Sync Types
// ============================================================================

export interface UserSyncResult {
  success: boolean;
  user?: LocalUser;
  created: boolean;
  error?: string;
}

export interface UserLookupResult {
  found: boolean;
  user?: LocalUser;
}

// ============================================================================
// Authentication Flow Types
// ============================================================================

export interface AuthCallbackParams {
  code: string;
  state: string;
}

export interface AuthState {
  codeVerifier: string;
  state: string;
  returnTo?: string;
  timestamp: number;
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
}
