import { create } from "zustand";

type Notification = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

type AppState = {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  notifications: [
    {
      id: "n1",
      title: "Welcome to UniCare Connect",
      message: "Explore financial aid, wellness, and mentorship tools.",
      date: "2026-02-08",
      read: false
    }
  ],
  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    })),
  clearNotifications: () => set({ notifications: [] })
}));
