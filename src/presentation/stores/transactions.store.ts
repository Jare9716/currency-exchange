import { create } from "zustand";
import { Transaction } from "@/domain/Transaction";
import { transactionRepository } from "@/infrastructure/http/HttpTransactionRepository";

interface TransactionsState {
  transactions: Transaction[];
  total: number;
  page: number;
  size: number;
  isLoading: boolean;
  fetchError?: string;
  fetchTransactions: (filters?: {
    page?: number;
    size?: number;
    transaction_type?: "buy" | "sell";
    iso_code?: string;
    start_date?: string;
    end_date?: string;
    customer_id?: string;
  }) => Promise<void>;
  resetTransactions: () => void;
}

export const useTransactionsStore = create<TransactionsState>((set) => ({
  transactions: [],
  total: 0,
  page: 1,
  size: 10,
  isLoading: false,
  fetchError: undefined,
  fetchTransactions: async (filters) => {
    set({ isLoading: true, fetchError: undefined });
    try {
      const response = await transactionRepository.findAll(filters);
      set({
        transactions: response.items,
        total: response.total,
        page: filters?.page ?? 1,
        size: filters?.size ?? 10,
        fetchError: undefined,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Error al obtener transacciones";
      set({ fetchError: errMsg });
    } finally {
      set({ isLoading: false });
    }
  },
  resetTransactions: () =>
    set({ transactions: [], total: 0, page: 1, isLoading: false, fetchError: undefined }),
}));
