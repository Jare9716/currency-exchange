import { AuthService, LoginCredentials, LoginResult } from "@/domain/Auth";

export class AuthenticateUser {
  constructor(private authService: AuthService) {}

  async execute(credentials: LoginCredentials): Promise<LoginResult> {
    return this.authService.login(credentials);
  }
}
