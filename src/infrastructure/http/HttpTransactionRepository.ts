import {
  Transaction,
  TransactionRepository,
  CreateTransactionPayload,
  PaginatedTransactions,
} from "@/domain/Transaction";
import { HttpClient } from "@/infrastructure/http/HttpClient";
import { z } from "zod";

const apiTransactionSchema = z.object({
  id: z.string(),
  ticket_number: z.number().nullish().transform((val) => val ?? undefined),
  shift_id: z.string().nullish().transform((val) => val ?? undefined),
  customer_id: z.string(),
  operator_id: z.string().nullish().transform((val) => val ?? undefined),
  branch_code: z.string().nullish().transform((val) => val ?? undefined),
  transaction_type: z.enum(["buy", "sell"]),
  iso_code: z.string(),
  foreign_amount: z.string(),
  exchange_rate: z.string(),
  cop_amount: z.string(),
  official_trm: z.string().nullish().transform((val) => val ?? undefined),
  spread: z.string().nullish().transform((val) => val ?? undefined),
  description: z.string().nullish().transform((val) => val ?? undefined),
  screening_status: z.string().nullish().transform((val) => val ?? undefined),
  sarlaft_flagged: z.boolean().nullish().transform((val) => val ?? undefined),
  created_at: z
    .union([z.string(), z.date()])
    .nullish()
    .transform((val) => val ?? undefined),
});

const paginatedTransactionsSchema = z.object({
  items: z.array(apiTransactionSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
});

export class HttpTransactionRepository implements TransactionRepository {
  async save(payload: CreateTransactionPayload): Promise<Transaction> {
    const response = await HttpClient.post(
      "/api/v1/fx/transactions",
      payload,
    );
    const data = await response.json();
    return apiTransactionSchema.parse(data);
  }

  async findAll(filters?: {
    page?: number;
    size?: number;
    transaction_type?: "buy" | "sell";
    iso_code?: string;
    start_date?: string;
    end_date?: string;
    customer_id?: string;
    shift_id?: string;
  }): Promise<PaginatedTransactions> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/api/v1/fx/transactions?${queryString}` : "/api/v1/fx/transactions";
    
    const response = await HttpClient.get(url);
    const data = await response.json();
    return paginatedTransactionsSchema.parse(data);
  }
}

export const transactionRepository = new HttpTransactionRepository();
