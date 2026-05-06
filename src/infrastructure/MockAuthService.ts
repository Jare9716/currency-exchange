import { Employee, AuthService } from "@/domain/Employee";

const mockEmployees: Employee[] = [
  {
    id: "cashier-1",
    email: "Jane@Doe.com",
    name: "Jane Cashier",
  },
  {
    id: "cashier-2",
    email: "admin@joker.com",
    name: "Admin User",
  },
];

export class MockAuthService implements AuthService {
  async login(email: string): Promise<Employee | undefined> {
    const employee = mockEmployees.find((e) => e.email.toLowerCase() === email.toLowerCase());
    
    if (employee) {
      // Return a copy with a token to simulate a real login
      return {
        ...employee,
        token: `mock-jwt-token-${employee.id}`,
      };
    }

    return undefined;
  }
}

export const authService = new MockAuthService();
