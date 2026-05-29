"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { Box, CircularProgress } from "@mui/material";
import { GetCurrentUser } from "@/use-cases/GetCurrentUser";
import { authService } from "@/infrastructure/auth/HttpAuthService";
import { to } from "@/utils/async";

const getCurrentUser = new GetCurrentUser(authService);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, userProfile, setUserProfile, setActiveBranchCode } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Wait for Zustand persistent store to hydrate from localStorage
  useEffect(() => {
    let active = true;
    requestAnimationFrame(() => {
      if (active) {
        setIsHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isHydrated && !accessToken) {
      router.replace("/login");
    }
  }, [isHydrated, accessToken, router]);

  // Restore transient profile on refresh if we have a token
  useEffect(() => {
    if (isHydrated && accessToken && !userProfile && !loadingProfile) {
      const fetchProfile = async () => {
        setLoadingProfile(true);
        const [profileErr, profile] = await to(getCurrentUser.execute());
        if (profileErr || !profile) {
          useAuthStore.getState().clearTokens();
          router.replace("/login");
        } else {
          setUserProfile(profile);
          if (profile.branchCode) {
            setActiveBranchCode(profile.branchCode);
          } else {
            setActiveBranchCode("001");
          }
        }
        setLoadingProfile(false);
      };
      fetchProfile();
    }
  }, [
    isHydrated,
    accessToken,
    userProfile,
    loadingProfile,
    setUserProfile,
    setActiveBranchCode,
    router,
  ]);

  if (!isHydrated || !accessToken || (accessToken && !userProfile)) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
