import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type AuthState = {
  accessToken?: string;
  refreshToken?: string;
  setTokens: (access: string, refresh: string) => void;
  clearTokens: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: undefined,
      refreshToken: undefined,
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),
      clearTokens: () => set({ accessToken: undefined, refreshToken: undefined }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
