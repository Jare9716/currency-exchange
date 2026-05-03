import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/domain/User";
import { initialUsers } from "@/infrastructure/mockData";
import { userRepository } from "@/infrastructure/MockUserRepository";

interface UsersState {
  users: User[];
  addUser: (user: User) => void;
  setUsers: (users: User[] | ((prev: User[]) => User[])) => void;
  resetUsers: () => void;
  fetchUsers: () => Promise<void>;
}

export const useUsersStore = create<UsersState>()(
  persist(
    (set) => ({
      users: initialUsers,
      addUser: (user) =>
        set((state) => ({
          users: [user, ...state.users],
        })),
      setUsers: (usersOrFn) =>
        set((state) => ({
          users:
            typeof usersOrFn === "function" ? usersOrFn(state.users) : usersOrFn,
        })),
      resetUsers: () => set({ users: initialUsers }),
      fetchUsers: async () => {
        const repoUsers = await userRepository.findAll();
        set({ users: repoUsers });
      },
    }),
    {
      name: "users-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
