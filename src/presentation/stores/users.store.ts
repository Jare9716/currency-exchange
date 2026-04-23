import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/domain/User";

const initialUsers: User[] = [
  {
    id: "1",
    name: "Jane Doe",
    email: "Jane@Doe.com",
    cc: "44509984",
    phone: "3167897678",
    status: "Activo",
    isClintonListed: false,
  },
  {
    id: "2",
    name: "John Smith",
    email: "John@Smith.com",
    cc: "44509985",
    phone: "3167897679",
    status: "Activo",
    isClintonListed: false,
  },
  {
    id: "3",
    name: "Emily Johnson",
    email: "Emily@Johnson.com",
    cc: "44509986",
    phone: "3167897680",
    status: "Reportado",
    isClintonListed: true,
  },
  {
    id: "4",
    name: "David Martinez",
    email: "David@Martinez.com",
    cc: "44509989",
    phone: "3167897683",
    status: "Reportado",
    isClintonListed: false,
  },
];

interface UsersState {
  users: User[];
  addUser: (user: User) => void;
  setUsers: (users: User[] | ((prev: User[]) => User[])) => void;
  resetUsers: () => void;
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
    }),
    {
      name: "users-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
