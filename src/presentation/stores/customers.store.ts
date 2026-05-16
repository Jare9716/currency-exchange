import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Customer, CustomerFilters } from "@/domain/Customer";
import { customerRepository } from "@/infrastructure/http/HttpCustomerRepository";
import { GetCustomers } from "@/use-cases/GetCustomers";

interface CustomersState {
  customers: Customer[];
  total: number;
  page: number;
  size: number;
  addCustomer: (customer: Customer) => void;
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  resetCustomers: () => void;
  fetchCustomers: (filters?: CustomerFilters) => Promise<void>;
}

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set) => ({
      customers: [],
      total: 0,
      page: 1,
      size: 20,
      addCustomer: (customer) =>
        set((state) => ({
          customers: [customer, ...state.customers],
          total: state.total + 1,
        })),
      setCustomers: (customersOrFn) =>
        set((state) => ({
          customers:
            typeof customersOrFn === "function" ? customersOrFn(state.customers) : customersOrFn,
        })),
      resetCustomers: () => set({ customers: [], total: 0, page: 1 }),
      fetchCustomers: async (filters) => {
        const getCustomers = new GetCustomers(customerRepository);
        const { items, total } = await getCustomers.execute(filters);
        
        set({ 
          customers: items,
          total: total,
          page: filters?.page || 1,
          size: filters?.size || 20
        });
      },
    }),
    {
      name: "customers-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
