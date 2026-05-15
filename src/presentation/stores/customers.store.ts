import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Customer, CustomerFilters } from "@/domain/Customer";
import { customerRepository } from "@/infrastructure/http/HttpCustomerRepository";
import { GetCustomers } from "@/use-cases/GetCustomers";

interface CustomersState {
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  resetCustomers: () => void;
  fetchCustomers: (filters?: CustomerFilters) => Promise<void>;
}

export const useCustomersStore = create<CustomersState>()(
  persist(
    (set) => ({
      customers: [],
      addCustomer: (customer) =>
        set((state) => ({
          customers: [customer, ...state.customers],
        })),
      setCustomers: (customersOrFn) =>
        set((state) => ({
          customers:
            typeof customersOrFn === "function" ? customersOrFn(state.customers) : customersOrFn,
        })),
      resetCustomers: () => set({ customers: [] }),
      fetchCustomers: async (filters) => {
        const getCustomers = new GetCustomers(customerRepository);
        const repoCustomers = await getCustomers.execute(filters);
        set({ customers: repoCustomers });
      },
    }),
    {
      name: "customers-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
