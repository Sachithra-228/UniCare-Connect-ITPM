"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/shared/Footer";
import { TopNav } from "@/components/shared/TopNav";

const AUTH_ROUTES = new Set(["/login", "/register", "/forgot-password"]);

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hideChrome = AUTH_ROUTES.has(pathname);

  return (
    <div className="flex min-h-screen flex-col">
      {hideChrome ? null : <TopNav />}
      <main className="flex-1">{children}</main>
      {hideChrome ? null : <Footer />}
    </div>
  );
}
