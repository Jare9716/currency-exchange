import { AuthService, UserProfile } from "@/domain/Auth";

export class GetCurrentUser {
  constructor(private authService: AuthService) {}

  async execute(): Promise<UserProfile> {
    return this.authService.getCurrentUser();
  }
}
