"use client";

import { Snackbar, Alert, AlertTitle } from "@mui/material";
import { useNotificationStore } from "@/presentation/stores/notification.store";

export function GlobalNotification() {
  const { open, message, title, type, hideNotification } = useNotificationStore();

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    hideNotification();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert onClose={handleClose} severity={type} sx={{ width: "100%", whiteSpace: "pre-wrap" }}>
        {title && <AlertTitle sx={{ fontWeight: "bold" }}>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
}
