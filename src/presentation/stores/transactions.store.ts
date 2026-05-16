import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Transaction } from "@/domain/Transaction";
import { transactionRepository } from "@/infrastructure/http/HttpTransactionRepository";

interface TransactionsState {
  transactions: Transaction[];
  total: number;
  page: number;
  size: number;
  isLoading: boolean;
  fetchTransactions: (filters?: Record<string, unknown>) => Promise<void>;
  resetTransactions: () => void;
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set) => ({
      transactions: [],
      total: 0,
      page: 1,
      size: 10,
      isLoading: false,
      fetchTransactions: async (filters) => {
        set({ isLoading: true });
        try {
          const response = await transactionRepository.findAll(filters);
          set({
            transactions: response.items,
            total: response.total,
            page: (filters?.page as number) || 1,
            size: (filters?.size as number) || 10,
          });
        } catch (error) {
          console.error("Error fetching transactions:", error);
        } finally {
          set({ isLoading: false });
        }
      },
      resetTransactions: () => set({ transactions: [], total: 0, page: 1, isLoading: false }),
    }),
    {
      name: "transactions-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
