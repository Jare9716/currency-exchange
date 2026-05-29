import { AuthService, AuthTokens, LoginCredentials, UserProfile } from "@/domain/Auth";
import { HttpClient } from "@/infrastructure/http/HttpClient";
import { z } from "zod";

const loginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  must_change_password: z.boolean().optional(),
  requires_2fa: z.boolean().optional(),
  requires_tenant_selection: z.boolean().optional(),
});

const apiUserProfileSchema = z.object({
  id: z.string(),
  email: z.string(),
  full_name: z.string(),
  role: z.string(),
  branch_code: z.string().nullish().transform((val) => val ?? undefined),
  tenant_id: z.string(),
  is_active: z.boolean(),
});

export class HttpAuthService implements AuthService {
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await HttpClient.post("/api/v1/auth/login", credentials, {
      requireAuth: false,
    });

    const data = await response.json();
    const parsed = loginResponseSchema.parse(data);

    return {
      accessToken: parsed.access_token,
      refreshToken: parsed.refresh_token,
    };
  }

  async getCurrentUser(): Promise<UserProfile> {
    const response = await HttpClient.get("/api/v1/auth/me");
    const data = await response.json();
    const parsed = apiUserProfileSchema.parse(data);

    return {
      id: parsed.id,
      email: parsed.email,
      fullName: parsed.full_name,
      role: parsed.role,
      branchCode: parsed.branch_code,
      tenantId: parsed.tenant_id,
      isActive: parsed.is_active,
    };
  }
}

export const authService = new HttpAuthService();
