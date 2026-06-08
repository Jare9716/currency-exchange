import {
  AuthService,
  AuthTokens,
  LoginCredentials,
  LoginResult,
  TenantSelectionResult,
  UserProfile,
  TwoFactorBackupCodes,
  TwoFactorSetup,
} from "@/domain/Auth";
import { HttpClient } from "@/infrastructure/http/HttpClient";
import { z } from "zod";

const apiTokenPairSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().optional(),
  must_change_password: z.boolean().nullish().transform((value) => value ?? undefined),
  password_expires_in_days: z.number().nullish().transform((value) => value ?? undefined),
  requires_2fa: z.literal(false).nullish().transform((value) => value ?? undefined),
  requires_tenant_selection: z.literal(false).nullish().transform((value) => value ?? undefined),
  state_token: z.null().nullish().transform((value) => value ?? undefined),
});

const apiMembershipSchema = z.object({
  membership_id: z.string(),
  tenant_id: z.string(),
  tenant_name: z.string(),
  tenant_slug: z.string(),
  role: z.string(),
});

const apiTenantSelectionLoginSchema = z.object({
  requires_tenant_selection: z.literal(true),
  session_token: z.string(),
  memberships: z.array(apiMembershipSchema),
});

const apiTwoFactorRequiredSchema = z.object({
  requires_2fa: z.literal(true),
  state_token: z.string(),
  access_token: z.null().nullish().transform((value) => value ?? undefined),
  refresh_token: z.null().nullish().transform((value) => value ?? undefined),
  token_type: z.string().nullish().transform((value) => value ?? undefined),
  must_change_password: z.boolean().nullish().transform((value) => value ?? undefined),
  password_expires_in_days: z.number().nullish().transform((value) => value ?? undefined),
});

const apiTwoFactorSetupSchema = z.object({
  secret: z.string(),
  otpauth_uri: z.string(),
});

const apiTwoFactorBackupCodesSchema = z.object({
  backup_codes: z.array(z.string()),
});

const apiLoginResponseSchema = z.union([
  apiTokenPairSchema,
  apiTenantSelectionLoginSchema,
  apiTwoFactorRequiredSchema,
]);

const apiTenantSelectionResponseSchema = z.union([
  apiTokenPairSchema,
  apiTwoFactorRequiredSchema,
]);

const mapAuthenticatedResult = (data: z.infer<typeof apiTokenPairSchema>) => ({
  type: "authenticated" as const,
  accessToken: data.access_token,
  refreshToken: data.refresh_token,
  mustChangePassword: data.must_change_password,
  passwordExpiresInDays: data.password_expires_in_days,
});

const mapTokens = (data: z.infer<typeof apiTokenPairSchema>): AuthTokens => ({
  accessToken: data.access_token,
  refreshToken: data.refresh_token,
});

const apiUserProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  role: z.string(),
  branch_code: z.string().nullish().transform((val) => val ?? undefined),
  tenant_id: z.string(),
  is_active: z.boolean(),
  two_factor_enabled: z.boolean().nullish().transform((val) => val ?? undefined),
  is_two_factor_enabled: z.boolean().nullish().transform((val) => val ?? undefined),
  two_factor_auth_enabled: z.boolean().nullish().transform((val) => val ?? undefined),
  is_2fa_enabled: z.boolean().nullish().transform((val) => val ?? undefined),
  two_fa_enabled: z.boolean().nullish().transform((val) => val ?? undefined),
  mfa_enabled: z.boolean().nullish().transform((val) => val ?? undefined),
  is_mfa_enabled: z.boolean().nullish().transform((val) => val ?? undefined),
  totp_enabled: z.boolean().nullish().transform((val) => val ?? undefined),
  is_totp_enabled: z.boolean().nullish().transform((val) => val ?? undefined),
});

export class HttpAuthService implements AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const response = await HttpClient.post("/api/v1/auth/login", credentials, {
      requireAuth: false,
    });

    const data = await response.json();
    const parsed = apiLoginResponseSchema.parse(data);

    if ("requires_tenant_selection" in parsed && parsed.requires_tenant_selection) {
      return {
        type: "tenant_selection_required",
        sessionToken: parsed.session_token,
        memberships: parsed.memberships.map((membership) => ({
          membershipId: membership.membership_id,
          tenantId: membership.tenant_id,
          tenantName: membership.tenant_name,
          tenantSlug: membership.tenant_slug,
          role: membership.role,
        })),
      };
    }

    if ("requires_2fa" in parsed && parsed.requires_2fa) {
      return {
        type: "two_factor_required",
        stateToken: parsed.state_token,
      };
    }

    return mapAuthenticatedResult(parsed);
  }

  async selectTenant(payload: {
    sessionToken: string;
    membershipId: string;
  }): Promise<TenantSelectionResult> {
    const response = await HttpClient.post(
      "/api/v1/auth/select-tenant",
      {
        session_token: payload.sessionToken,
        membership_id: payload.membershipId,
      },
      { requireAuth: false },
    );

    const data = await response.json();
    const parsed = apiTenantSelectionResponseSchema.parse(data);

    if ("requires_2fa" in parsed && parsed.requires_2fa) {
      return {
        type: "two_factor_required",
        stateToken: parsed.state_token,
      };
    }

    return mapAuthenticatedResult(parsed);
  }

  async acceptInvite(payload: {
    token: string;
    newPassword: string;
  }): Promise<AuthTokens> {
    const response = await HttpClient.post(
      "/api/v1/auth/accept-invite",
      {
        token: payload.token,
        new_password: payload.newPassword,
      },
      { requireAuth: false },
    );

    const data = await response.json();
    return mapTokens(apiTokenPairSchema.parse(data));
  }

  async forgotPassword(email: string): Promise<void> {
    await HttpClient.post(
      "/api/v1/auth/forgot-password",
      { email },
      { requireAuth: false },
    );
  }

  async resetPassword(payload: {
    token: string;
    newPassword: string;
  }): Promise<void> {
    await HttpClient.post(
      "/api/v1/auth/reset-password",
      {
        token: payload.token,
        new_password: payload.newPassword,
      },
      { requireAuth: false },
    );
  }

  async setupTwoFactor(): Promise<TwoFactorSetup> {
    const response = await HttpClient.post(
      "/api/v1/auth/2fa/setup",
      undefined,
      { requireAuth: true },
    );

    const data = await response.json();
    const parsed = apiTwoFactorSetupSchema.parse(data);

    return {
      secret: parsed.secret,
      otpauthUri: parsed.otpauth_uri,
    };
  }

  async enableTwoFactor(payload: { code: string }): Promise<TwoFactorBackupCodes> {
    const response = await HttpClient.post(
      "/api/v1/auth/2fa/enable",
      { code: payload.code },
      { requireAuth: true },
    );

    const data = await response.json();
    const parsed = apiTwoFactorBackupCodesSchema.parse(data);

    return {
      backupCodes: parsed.backup_codes,
    };
  }

  async disableTwoFactor(payload: { code: string }): Promise<void> {
    await HttpClient.post(
      "/api/v1/auth/2fa/disable",
      { code: payload.code },
      { requireAuth: true },
    );
  }

  async verifyTwoFactor(payload: {
    stateToken: string;
    code: string;
  }) {
    const response = await HttpClient.post(
      "/api/v1/auth/verify-2fa",
      {
        state_token: payload.stateToken,
        code: payload.code,
      },
      { requireAuth: false },
    );

    const data = await response.json();
    return mapAuthenticatedResult(apiTokenPairSchema.parse(data));
  }

  async getCurrentUser(): Promise<UserProfile> {
    const response = await HttpClient.get("/api/v1/auth/me");
    const data = await response.json();
    const parsed = apiUserProfileSchema.parse(data);

    // Fetch company details dynamically to get the real company name
    let companyName = "Cambios Express SAS";
    try {
      const companyResponse = await HttpClient.get("/api/v1/company");
      const companyData = await companyResponse.json();
      if (companyData && companyData.name) {
        companyName = companyData.name;
      }
    } catch {
      // Keep fallback if endpoint fails
    }

    // Fetch active branches dynamically if the user has no branch_code assigned (owner/admin roles)
    let branchCode = parsed.branch_code;
    if (!branchCode) {
      try {
        const branchesResponse = await HttpClient.get("/api/v1/branches");
        const branchesData = (await branchesResponse.json()) as Array<{
          code: string;
          is_active: boolean;
        }>;
        if (Array.isArray(branchesData) && branchesData.length > 0) {
          const activeBranch =
            branchesData.find((b) => b.is_active) || branchesData[0];
          if (activeBranch && activeBranch.code) {
            branchCode = activeBranch.code;
          }
        }
      } catch {
        // Keep undefined if endpoint fails
      }
    }

    return {
      id: parsed.id,
      email: parsed.email,
      fullName: parsed.full_name,
      role: parsed.role,
      branchCode: branchCode || undefined,
      tenantId: parsed.tenant_id,
      isActive: parsed.is_active,
      companyName,
      twoFactorEnabled:
        parsed.two_factor_enabled ??
        parsed.is_two_factor_enabled ??
        parsed.two_factor_auth_enabled ??
        parsed.is_2fa_enabled ??
        parsed.two_fa_enabled ??
        parsed.mfa_enabled ??
        parsed.is_mfa_enabled ??
        parsed.totp_enabled ??
        parsed.is_totp_enabled,
    };
  }
}

export const authService = new HttpAuthService();
