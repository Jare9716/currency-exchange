export interface User {
  id: string;
  email: string;
  name: string;
  cc?: string;
  phone?: string;
  status?: "Activo" | "Reportado";
  token?: string;
  isClintonListed: boolean;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
