import { Transaction, TransactionRepository } from "@/domain/Transaction";
import { DomainError } from "@/domain/Errors";

export class ExecuteTransaction {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute(
    userId: string,
    amountUSD: number,
    exchangeRate: number,
  ): Promise<Transaction> {
    if (amountUSD <= 0) {
      throw new DomainError("validation_error", "Transaction amount must be strictly positive");
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
