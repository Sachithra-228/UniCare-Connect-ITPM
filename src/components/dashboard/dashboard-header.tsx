"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { User } from "lucide-react";

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Good night";
}

/** Title-case a single word */
function titleWord(word: string): string {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Format full name with a space between first and last.
 * If name is stored as one word (e.g. "wijesinghesachithra"), split so it displays as two words.
 */
function formatFullName(fullName: string | undefined): string {
  const raw = fullName?.trim();
  if (!raw) return "Student";
  const hasSpace = /\s/.test(raw);
  if (hasSpace) {
    return raw.split(/\s+/).map(titleWord).join(" ");
  }
  const len = raw.length;
  if (len <= 1) return titleWord(raw);
  const camel = raw.replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  if (camel !== raw) {
    return camel.split(/\s+/).map(titleWord).join(" ");
  }
  const splitAt = Math.max(1, Math.ceil(len / 2));
  return `${titleWord(raw.slice(0, splitAt))} ${titleWord(raw.slice(splitAt))}`;
}

export function DashboardHeader() {
  const { user, refreshUser, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePic: base64 })
      });
      const data = (await res.json()) as { user?: { profilePic?: string }; profilePic?: string };
      if (res.ok) {
        if (data.user) {
          updateUserProfile({ profilePic: data.user.profilePic });
        } else if (data.profilePic !== undefined) {
          updateUserProfile({ profilePic: data.profilePic });
        }
        await refreshUser();
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const greeting = getTimeBasedGreeting();
  const fullNameDisplay = formatFullName(user?.name);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-white to-primary/5 shadow-sm transition-shadow hover:shadow-md dark:from-primary/15 dark:via-slate-900/90 dark:to-primary/10">
      <div className="absolute right-0 top-0 h-32 w-48 rounded-bl-full bg-primary/10 dark:bg-primary/15" aria-hidden />
      <div className="absolute bottom-0 left-0 h-24 w-40 rounded-tr-full bg-primary/5 dark:bg-primary/10" aria-hidden />
      <div className="relative flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="group relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-slate-100 ring-2 ring-white transition-all hover:border-primary/50 hover:ring-primary/10 dark:bg-slate-800 dark:ring-slate-900 dark:hover:border-primary/40"
            aria-label="Upload profile photo"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="sr-only"
              aria-hidden
            />
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt=""
                className="h-20 w-20 object-cover"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center text-slate-400 group-hover:text-primary dark:text-slate-500">
                <User className="h-10 w-10" />
              </span>
            )}
            {uploading && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs font-medium text-white">
                ...
              </span>
            )}
          </button>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              {fullNameDisplay}
            </p>
            <p className="truncate text-sm text-slate-600 dark:text-slate-400">
              {user?.email ?? ""}
            </p>
          </div>
        </div>
        <div className="flex items-center sm:justify-end">
          <p className="text-right text-lg font-medium italic tracking-wide text-primary transition-opacity sm:text-xl dark:text-primary">
            {greeting}
          </p>
        </div>
      </div>
    </div>
  );
}
