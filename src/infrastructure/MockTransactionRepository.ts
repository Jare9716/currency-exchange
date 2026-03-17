import { Transaction, TransactionRepository } from "../domain/Transaction";

export class MockTransactionRepository implements TransactionRepository {
  private transactions: Transaction[] = [];

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
