export interface Employee {
  id: string;
  email: string;
  name: string;
  token?: string;
}

export interface AuthService {
  login(email: string): Promise<Employee | undefined>;
}
