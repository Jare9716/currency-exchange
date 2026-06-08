import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserProfile } from "@/domain/Auth";

type AuthState = {
  accessToken?: string;
  refreshToken?: string;
  userProfile?: UserProfile;
  activeBranchCode?: string;
  twoFactorEnabled?: boolean;
  setTokens: (access: string, refresh: string) => void;
  setUserProfile: (profile: UserProfile) => void;
  setActiveBranchCode: (branch: string) => void;
  setTwoFactorEnabled: (enabled: boolean) => void;
  clearTokens: () => void;
  resetAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: undefined,
      refreshToken: undefined,
      userProfile: undefined,
      activeBranchCode: undefined,
      twoFactorEnabled: undefined,
      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),
      setUserProfile: (profile) =>
        set((state) => ({
          userProfile: {
            ...profile,
            twoFactorEnabled:
              profile.twoFactorEnabled ?? state.twoFactorEnabled,
          },
          twoFactorEnabled:
            profile.twoFactorEnabled ?? state.twoFactorEnabled,
        })),
      setActiveBranchCode: (branch) => set({ activeBranchCode: branch }),
      setTwoFactorEnabled: (enabled) =>
        set((state) => ({
          twoFactorEnabled: enabled,
          userProfile: state.userProfile
            ? { ...state.userProfile, twoFactorEnabled: enabled }
            : undefined,
        })),
      clearTokens: () =>
        set({
          accessToken: undefined,
          refreshToken: undefined,
          userProfile: undefined,
          activeBranchCode: undefined,
          twoFactorEnabled: undefined,
        }),
      resetAuth: () =>
        set({
          accessToken: undefined,
          refreshToken: undefined,
          userProfile: undefined,
          activeBranchCode: undefined,
          twoFactorEnabled: undefined,
        }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      // Rule 14: Only persist transient auth tokens, keep user profile/PII strictly in-memory
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
