import { Transaction, TransactionRepository } from "@/domain/Transaction";
import { DomainError } from "@/domain/Errors";

export class ExecuteTransaction {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute(
    customerId: string,
    amountUSD: number,
  ): Promise<Transaction> {
    if (amountUSD <= 0) {
      throw new DomainError("validation_error", "Transaction amount must be strictly positive");
    }

    const transaction = await this.transactionRepository.save({
      customer_id: customerId,
      transaction_type: "buy", // Assuming buy for now based on USD -> COP flow
      iso_code: "USD",
      foreign_amount: amountUSD.toString(),
      description: "Exchange via frontend",
    });

    return transaction;
  }
}
