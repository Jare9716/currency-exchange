import { Transaction, TransactionRepository } from "@/domain/Transaction";

/**
 * TEMPORARY IMPLEMENTATION
 * This is a mock repository for development and testing purposes.
 * It will be replaced by a real database-connected repository in the future.
 */
export class MockTransactionRepository implements TransactionRepository {
  private transactions: Transaction[] = [];

  /**
   * TEMPORARY IMPLEMENTATION: Mocks saving a transaction in memory.
   */
  async save(transaction: Transaction): Promise<void> {
    this.transactions = [transaction, ...this.transactions];
    // In a real app we'd persist to a DB
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    return this.transactions.filter((t) => t.userId === userId);
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactions;
  }
}

// Singleton for easy use in our mock app
export const transactionRepository = new MockTransactionRepository();
