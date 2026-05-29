import { Transaction, TransactionRepository } from "@/domain/Transaction";
import { DomainError } from "@/domain/Errors";

export class ExecuteTransaction {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute(
    customerId: string,
    amountUSD: number,
    branchCode: string,
    description?: string,
  ): Promise<Transaction> {
    if (amountUSD <= 0) {
      throw new DomainError("validation_error", "El monto de la transacción debe ser estrictamente positivo");
    }

    const transaction = await this.transactionRepository.save({
      customer_id: customerId,
      transaction_type: "buy", // Assuming buy for now based on USD -> COP flow
      iso_code: "USD",
      foreign_amount: amountUSD.toString(),
      branch_code: branchCode,
      description: description ?? "Exchange via frontend",
    });

    return transaction;
  }
}
