import { AuthService, AuthTokens, LoginCredentials } from "@/domain/Auth";

export class AuthenticateUser {
  constructor(private authService: AuthService) {}

  async execute(credentials: LoginCredentials): Promise<AuthTokens> {
    return this.authService.login(credentials);
  }
}
