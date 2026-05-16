import {
  Transaction,
  TransactionRepository,
  CreateTransactionPayload,
  PaginatedTransactions,
} from "@/domain/Transaction";
import { HttpClient } from "@/infrastructure/http/HttpClient";

export class HttpTransactionRepository implements TransactionRepository {
  async save(payload: CreateTransactionPayload): Promise<Transaction> {
    const response = await HttpClient.post(
      "/api/v1/fx/transactions",
      payload,
    );
    return response.json();
  }

  async findByCustomerId(customerId: string): Promise<Transaction[]> {
    const response = await HttpClient.get(
      `/api/v1/fx/transactions?customer_id=${customerId}`,
    );
    const data = await response.json();
    return data.items || [];
  }

  async findAll(filters?: Record<string, unknown>): Promise<PaginatedTransactions> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/api/v1/fx/transactions?${queryString}` : "/api/v1/fx/transactions";
    
    const response = await HttpClient.get(url);
    return response.json();
  }
}

export const transactionRepository = new HttpTransactionRepository();
