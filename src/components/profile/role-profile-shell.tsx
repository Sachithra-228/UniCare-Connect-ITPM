"use client";

import { ReactNode, useMemo, useState } from "react";
import { Card } from "@/components/shared/card";
import { useAuth } from "@/context/auth-context";

type ProfileTabId = "profile" | "preferences";

type RoleProfileShellProps = {
  roleLabel: string;
  children: ReactNode;
};

type AvatarMessage = { type: "ok" | "err"; text: string } | null;

export function RoleProfileShell({ roleLabel, children }: RoleProfileShellProps) {
  const { user, updateUserProfile, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTabId>("profile");
  const [uploading, setUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<AvatarMessage>(null);

  const initials = useMemo(
    () =>
      (user?.name ?? user?.email ?? "U")
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user]
  );

  const handleProfilePicChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.email) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      setUploading(true);
      setAvatarMessage(null);
      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebaseUid: (user as { firebaseUid?: string }).firebaseUid,
            email: user.email,
            profilePic: dataUrl
          })
        });
        const data = (await res.json()) as { user?: { profilePic?: string }; message?: string };
        if (res.ok && data.user) {
          updateUserProfile({ profilePic: data.user.profilePic });
          await refreshUser();
          setAvatarMessage({ type: "ok", text: "Profile picture updated." });
        } else {
          setAvatarMessage({
            type: "err",
            text: data.message ?? "Could not update picture."
          });
        }
      } catch {
        setAvatarMessage({ type: "err", text: "Could not update picture. Try again." });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {avatarMessage && (
        <p
          className={`rounded-xl border px-4 py-2 text-sm ${
            avatarMessage.type === "ok"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          }`}
        >
          {avatarMessage.text}
        </p>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-4 border-primary/20 bg-gradient-to-r from-primary/5 via-white to-emerald-50 p-5 dark:from-primary/10 dark:via-slate-900 dark:to-emerald-900/20">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-slate-100 dark:border-primary/60 dark:bg-slate-800">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-primary">{initials}</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">{roleLabel}</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {user?.name ?? "Your name"}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">{user?.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePicChange}
              disabled={uploading}
            />
            {uploading ? "Uploading…" : "Change picture"}
          </label>
        </div>
      </Card>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex flex-wrap gap-1" role="tablist" aria-label="Profile sections">
          {[
            { id: "profile" as ProfileTabId, label: "Profile" },
            { id: "preferences" as ProfileTabId, label: "Preferences" }
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* For now we always render children under the shell.
         You can later branch by activeTab if you add dedicated preferences content. */}
      {children}
    </div>
  );
}

