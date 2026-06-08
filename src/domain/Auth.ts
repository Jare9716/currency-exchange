import { z } from "zod";

export const loginCredentialsSchema = z.object({
  email: z.string(),
  password: z.string().min(1),
});

export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type TenantMembership = {
  membershipId: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: string;
};

export type TwoFactorSetup = {
  secret: string;
  otpauthUri: string;
};

export type TwoFactorBackupCodes = {
  backupCodes: string[];
};

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  branchCode?: string;
  tenantId: string;
  isActive: boolean;
  companyName: string;
  twoFactorEnabled?: boolean;
}

export type AuthenticatedResult = { type: "authenticated" } & AuthTokens & {
  mustChangePassword?: boolean;
  passwordExpiresInDays?: number;
};

export type TwoFactorRequiredResult = {
  type: "two_factor_required";
  stateToken: string;
};

export type LoginResult =
  | AuthenticatedResult
  | {
      type: "tenant_selection_required";
      sessionToken: string;
      memberships: TenantMembership[];
    }
  | TwoFactorRequiredResult;

export type TenantSelectionResult = AuthenticatedResult | TwoFactorRequiredResult;

export interface AuthService {
  login(credentials: LoginCredentials): Promise<LoginResult>;
  getCurrentUser(): Promise<UserProfile>;
  selectTenant(payload: {
    sessionToken: string;
    membershipId: string;
  }): Promise<TenantSelectionResult>;
  acceptInvite(payload: {
    token: string;
    newPassword: string;
  }): Promise<AuthTokens>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(payload: {
    token: string;
    newPassword: string;
  }): Promise<void>;
  setupTwoFactor(): Promise<TwoFactorSetup>;
  enableTwoFactor(payload: {
    code: string;
  }): Promise<TwoFactorBackupCodes>;
  disableTwoFactor(payload: {
    code: string;
  }): Promise<void>;
  verifyTwoFactor(payload: {
    stateToken: string;
    code: string;
  }): Promise<AuthenticatedResult>;
}
