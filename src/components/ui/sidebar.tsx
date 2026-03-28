"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type ComponentPropsWithoutRef
} from "react";
import { clsx } from "clsx";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_COLLAPSED = "3.5rem";
const MOBILE_BREAKPOINT = 1024;

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  isMobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

type SidebarProviderProps = { children: ReactNode; defaultCollapsed?: boolean };

export function SidebarProvider({ children, defaultCollapsed = false }: SidebarProviderProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const syncViewport = () => {
      setIsMobile(mediaQuery.matches);
      if (!mediaQuery.matches) setMobileOpen(false);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("overflow-hidden", isMobile && mobileOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [isMobile, mobileOpen]);

  const toggle = useCallback(() => {
    if (isMobile) {
      setMobileOpen((open) => !open);
      return;
    }
    setCollapsed((value) => !value);
  }, [isMobile]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, isMobile, mobileOpen, setMobileOpen, toggle }}>
      <div className="flex min-h-screen w-full">{children}</div>
    </SidebarContext.Provider>
  );
}

type SidebarProps = ComponentPropsWithoutRef<"aside">;

export function Sidebar({ className, style, children, ...props }: SidebarProps) {
  const { collapsed, isMobile, mobileOpen, setMobileOpen } = useSidebar();
  const isCompact = !isMobile && collapsed;

  return (
    <>
      {isMobile && mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      ) : null}
      <aside
        data-collapsed={isCompact}
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex h-screen flex-col overflow-hidden border-r border-slate-200 bg-slate-50 transition-[width,transform] duration-200 ease-linear dark:border-slate-800 dark:bg-slate-900",
          isMobile ? clsx("w-64 shadow-xl", mobileOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
          className
        )}
        style={{
          width: isMobile ? SIDEBAR_WIDTH : isCompact ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
          ...style
        }}
        {...props}
      >
        {children}
      </aside>
    </>
  );
}

export function SidebarHeader({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={clsx(
        "flex shrink-0 items-center border-b border-slate-200 bg-slate-50 px-3 py-4 dark:border-slate-800 dark:bg-slate-900",
        className
      )}
      {...props}
    />
  );
}

export function SidebarContent({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={clsx("min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-4", className)}
      {...props}
    />
  );
}

export function SidebarFooter({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={clsx(
        "shrink-0 border-t border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900",
        className
      )}
      {...props}
    />
  );
}

export function SidebarGroup({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={clsx("px-3 py-2", className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  const { collapsed, isMobile } = useSidebar();
  if (!isMobile && collapsed) return null;
  return (
    <div className={clsx("mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500", className)} {...props} />
  );
}

export function SidebarMenu({ className, ...props }: ComponentPropsWithoutRef<"nav">) {
  return <nav className={clsx("space-y-0.5", className)} aria-label="Dashboard sections" {...props} />;
}

export function SidebarMenuItem({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={clsx("relative", className)} {...props} />;
}

type SidebarMenuButtonProps = ComponentPropsWithoutRef<"button"> & {
  isActive?: boolean;
  asChild?: boolean;
};

export function SidebarMenuButton({
  className,
  isActive,
  asChild,
  children,
  ...props
}: SidebarMenuButtonProps) {
  const { collapsed, isMobile } = useSidebar();
  const isCompact = !isMobile && collapsed;
  const base = clsx(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
    isCompact && "justify-center px-2"
  );
  const active = isActive
    ? "bg-primary/10 text-primary dark:bg-primary/20"
    : "text-slate-700 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800";
  const combined = clsx(base, active, className);

  if (asChild && typeof children === "object" && children !== null && "props" in children) {
    return (
      <div data-sidebar="menu-button" className={combined}>
        {children}
      </div>
    );
  }

  return (
    <button type="button" className={combined} data-active={isActive} {...props}>
      {children}
    </button>
  );
}

export function SidebarTrigger({ className, children, ...props }: ComponentPropsWithoutRef<"button">) {
  const { toggle } = useSidebar();
  return (
    <button
      type="button"
      onClick={toggle}
      className={clsx(
        "inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700",
        className
      )}
      aria-label="Toggle sidebar"
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarInset({ className, ...props }: ComponentPropsWithoutRef<"main">) {
  const { collapsed, isMobile } = useSidebar();
  return (
    <main
      className={clsx("min-h-screen flex-1 transition-[margin] duration-200", className)}
      style={{ marginLeft: isMobile ? 0 : collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }}
      {...props}
    />
  );
}

export { useSidebar };
