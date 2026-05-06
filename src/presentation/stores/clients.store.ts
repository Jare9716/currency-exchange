import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Client } from "@/domain/Client";
import { initialClients } from "@/infrastructure/mockData";
import { clientRepository } from "@/infrastructure/MockClientRepository";

interface ClientsState {
  clients: Client[];
  addClient: (client: Client) => void;
  setClients: (clients: Client[] | ((prev: Client[]) => Client[])) => void;
  resetClients: () => void;
  fetchClients: () => Promise<void>;
}

export const useClientsStore = create<ClientsState>()(
  persist(
    (set) => ({
      clients: initialClients,
      addClient: (client) =>
        set((state) => ({
          clients: [client, ...state.clients],
        })),
      setClients: (clientsOrFn) =>
        set((state) => ({
          clients:
            typeof clientsOrFn === "function" ? clientsOrFn(state.clients) : clientsOrFn,
        })),
      resetClients: () => set({ clients: initialClients }),
      fetchClients: async () => {
        const repoClients = await clientRepository.findAll();
        set({ clients: repoClients });
      },
    }),
    {
      name: "clients-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
