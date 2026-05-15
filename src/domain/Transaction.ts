import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amountUSD: z.union([z.string(), z.number()]),
  exchangeRate: z.union([z.string(), z.number()]),
  amountCOP: z.union([z.string(), z.number()]),
  date: z.union([z.string(), z.date()]), // Soporta string del API o Date nativo
});

export type Transaction = z.infer<typeof transactionSchema>;

export interface TransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findByCustomerId(customerId: string): Promise<Transaction[]>;
}
