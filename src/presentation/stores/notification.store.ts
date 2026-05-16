import { create } from "zustand";

export type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationState {
  open: boolean;
  message: string;
  title?: string;
  type: NotificationType;
  showNotification: (message: string, type?: NotificationType, title?: string) => void;
  hideNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  open: false,
  message: "",
  title: undefined,
  type: "info",
  showNotification: (message, type = "info", title) =>
    set({ open: true, message, type, title }),
  hideNotification: () => set({ open: false }),
}));
