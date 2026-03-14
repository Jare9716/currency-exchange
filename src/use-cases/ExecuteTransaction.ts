import { Transaction, TransactionRepository } from '../domain/Transaction';

export class ExecuteTransaction {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute(userId: string, amountUSD: number, exchangeRate: number): Promise<Transaction> {
    if (amountUSD <= 0) {
      throw new Error('Transaction amount must be strictly positive');
    }

    const amountCOP = amountUSD * exchangeRate;
    
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      userId,
      amountUSD,
      exchangeRate,
      amountCOP,
      date: new Date(),
    };

    await this.transactionRepository.save(transaction);
    return transaction;
  }
}
