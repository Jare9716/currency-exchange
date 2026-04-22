import { User, UserRepository } from "@/domain/User";
import { DomainError } from "@/domain/Errors";

export class AuthenticateUser {
  constructor(private userRepository: UserRepository) {}

  async execute(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new DomainError("user_not_found", "User not found or invalid credentials");
    }

    // For this mock, we assume successful auth purely based on email existence.
    // In a real app we would check a hashed password.

    // Also check if user is blocked
    if (user.isClintonListed) {
      throw new DomainError("user_blocked", "User is blocked due to Clinton List validation");
    }

    // Generate a mock token
    user.token = "mock-jwt-token-123";
    await this.userRepository.save(user);

    return user;
  }
}
