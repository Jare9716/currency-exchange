import { Client, ClientRepository } from "@/domain/Client";

/**
 * TEMPORARY IMPLEMENTATION
 * This is a mock repository for development and testing purposes.
 * It will be replaced by a real database-connected repository in the future.
 */

import { initialClients } from "./mockData";

export class MockClientRepository implements ClientRepository {
  private clients: Client[] = [...initialClients];

  async findByEmail(email: string): Promise<Client | undefined> {
    return this.clients.find((c) => c.email.toLowerCase() === email.toLowerCase());
  }

  async save(client: Client): Promise<void> {
    const index = this.clients.findIndex((c) => c.id === client.id);
    if (index !== -1) {
      this.clients[index] = client;
    } else {
      this.clients.push(client);
    }
  }

  async findAll(): Promise<Client[]> {
    return this.clients;
  }
}

export const clientRepository = new MockClientRepository();
