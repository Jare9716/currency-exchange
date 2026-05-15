import { create } from "zustand";

type AuthState = {
  accessToken?: string;
  refreshToken?: string;
  setTokens: (access: string, refresh: string) => void;
  clearTokens: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: undefined,
  refreshToken: undefined,
  setTokens: (access, refresh) =>
    set({ accessToken: access, refreshToken: refresh }),
  clearTokens: () => set({ accessToken: undefined, refreshToken: undefined }),
}));
