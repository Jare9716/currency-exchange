import { AuthService, AuthTokens, LoginCredentials } from "@/domain/Auth";
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
}

export const authService = new HttpAuthService();
