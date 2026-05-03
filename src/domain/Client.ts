export interface Client {
  id: string;
  email: string;
  name: string;
  cc?: string;
  phone?: string;
  status?: "Activo" | "Reportado";
  token?: string;
  isClintonListed: boolean;
}

export interface ClientRepository {
  findByEmail(email: string): Promise<Client | undefined>;
  save(client: Client): Promise<void>;
}
