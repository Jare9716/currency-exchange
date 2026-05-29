import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string(),
  ticket_number: z.number().optional(),
  shift_id: z.string().optional(),
  customer_id: z.string(),
  operator_id: z.string().optional(),
  branch_code: z.string().optional(),
  transaction_type: z.enum(["buy", "sell"]),
  iso_code: z.string(),
  foreign_amount: z.string(),
  exchange_rate: z.string(),
  cop_amount: z.string(),
  official_trm: z.string().optional(),
  spread: z.string().optional(),
  description: z.string().optional(),
  screening_status: z.string().optional(),
  sarlaft_flagged: z.boolean().optional(),
  created_at: z.union([z.string(), z.date()]).optional(),
});

export type Transaction = z.infer<typeof transactionSchema>;

export interface CreateTransactionPayload {
  customer_id: string;
  transaction_type: "buy" | "sell";
  iso_code: string;
  foreign_amount: string;
  branch_code: string;
  description?: string;
}

export interface PaginatedTransactions {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
}

export interface TransactionRepository {
  save(payload: CreateTransactionPayload): Promise<Transaction>;
  findAll(filters?: {
    page?: number;
    size?: number;
    transaction_type?: "buy" | "sell";
    iso_code?: string;
    start_date?: string;
    end_date?: string;
    customer_id?: string;
  }): Promise<PaginatedTransactions>;
}
