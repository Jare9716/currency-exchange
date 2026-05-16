"use client";

import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "@/presentation/styles/theme/theme";
import { GlobalNotification } from "@/presentation/components/ui/Notification/GlobalNotification";

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
      <GlobalNotification />
    </ThemeProvider>
  );
}
