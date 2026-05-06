import { Employee, AuthService } from "@/domain/Employee";
import { DomainError } from "@/domain/Errors";

export class AuthenticateUser {
  constructor(private authService: AuthService) {}

  async execute(email: string): Promise<Employee> {
    const employee = await this.authService.login(email);
    if (!employee) {
      throw new DomainError("user_not_found", "Invalid credentials or user not found");
    }

    return employee;
  }
}
