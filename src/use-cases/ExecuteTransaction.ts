import { Transaction, TransactionRepository } from "@/domain/Transaction";
import { DomainError } from "@/domain/Errors";

export class ExecuteTransaction {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute(
    customerId: string,
    amount: number,
    isoCode: string,
    transactionType: "buy" | "sell",
    branchCode: string,
    description?: string,
  ): Promise<Transaction> {
    if (amount <= 0) {
      throw new DomainError("validation_error", "El monto de la transacción debe ser estrictamente positivo");
    }

    const transaction = await this.transactionRepository.save({
      customer_id: customerId,
      transaction_type: transactionType,
      iso_code: isoCode,
      foreign_amount: amount.toString(),
      branch_code: branchCode,
      description: description ?? "Exchange via frontend",
    });

    return transaction;
  }
}
