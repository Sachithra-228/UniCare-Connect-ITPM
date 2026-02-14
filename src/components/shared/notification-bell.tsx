"use client";

import { Bell } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function NotificationBell() {
  const { notifications } = useAppStore();
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <button
      className="relative rounded-full border border-slate-200 p-2 dark:border-slate-700"
      aria-label="View notifications"
    >
      <Bell size={16} />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 h-4 min-w-[1rem] rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
          {unreadCount}
        </span>
      ) : null}
    </button>
  );
}
