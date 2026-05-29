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

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  branchCode?: string;
  tenantId: string;
  isActive: boolean;
}

export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthTokens>;
  getCurrentUser(): Promise<UserProfile>;
}
