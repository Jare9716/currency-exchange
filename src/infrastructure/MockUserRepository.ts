import { User, UserRepository } from "@/domain/User";

/**
 * TEMPORARY IMPLEMENTATION
 * This is a mock repository for development and testing purposes.
 * It will be replaced by a real database-connected repository in the future.
 */

import { initialUsers } from "./mockData";

export class MockUserRepository implements UserRepository {
  private users: User[] = [...initialUsers];

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  async save(user: User): Promise<void> {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;
    } else {
      this.users.push(user);
    }
  }

  async findAll(): Promise<User[]> {
    return this.users;
  }
}

export const userRepository = new MockUserRepository();
