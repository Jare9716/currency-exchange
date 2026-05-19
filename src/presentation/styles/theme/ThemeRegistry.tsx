"use client";

import React, { useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useRouter } from "next/navigation";
import { theme } from "@/presentation/styles/theme/theme";
import { GlobalNotification } from "@/presentation/components/ui/Notification/GlobalNotification";
import { useNotificationStore } from "@/presentation/stores/notification.store";

export function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { showNotification } = useNotificationStore();

  useEffect(() => {
    const handleSessionExpired = () => {
      showNotification(
        "Su sesión ha expirado. Por favor, inicie sesión nuevamente.",
        "error",
        "Sesión Expirada",
      );
      router.push("/login");
    };

    window.addEventListener("session:expired", handleSessionExpired);
    return () => {
      window.removeEventListener("session:expired", handleSessionExpired);
    };
  }, [router, showNotification]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
      <GlobalNotification />
    </ThemeProvider>
  );
}
