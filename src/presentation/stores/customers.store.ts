import { create } from "zustand";
import { Customer, CustomerFilters } from "@/domain/Customer";
import { customerRepository } from "@/infrastructure/http/HttpCustomerRepository";
import { GetCustomers } from "@/use-cases/GetCustomers";

const getCustomers = new GetCustomers(customerRepository);

interface CustomersState {
  customers: Customer[];
  total: number;
  page: number;
  size: number;
  fetchError?: string;
  resetCustomers: () => void;
  fetchCustomers: (filters?: CustomerFilters) => Promise<void>;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  total: 0,
  page: 1,
  size: 20,
  fetchError: undefined,
  resetCustomers: () => set({ customers: [], total: 0, page: 1, fetchError: undefined }),
  fetchCustomers: async (filters) => {
    set({ fetchError: undefined });
    try {
      const { items, total } = await getCustomers.execute(filters);
      
      set({ 
        customers: items,
        total: total,
        page: filters?.page ?? 1,
        size: filters?.size ?? 20,
        fetchError: undefined,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Error al obtener clientes";
      set({ fetchError: errMsg });
      throw error;
    }
  },
}));
