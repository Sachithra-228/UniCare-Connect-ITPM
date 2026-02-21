"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  type ComponentPropsWithoutRef
} from "react";
import { clsx } from "clsx";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_COLLAPSED = "3.5rem";

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
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
  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      <div className="flex min-h-screen w-full">{children}</div>
    </SidebarContext.Provider>
  );
}

type SidebarProps = ComponentPropsWithoutRef<"aside">;

export function Sidebar({ className, style, children, ...props }: SidebarProps) {
  const { collapsed } = useSidebar();
  return (
    <aside
      data-collapsed={collapsed}
      className={clsx(
        "fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden border-r border-slate-200 bg-slate-50 transition-[width] duration-200 ease-linear dark:border-slate-800 dark:bg-slate-900",
        className
      )}
      style={{
        width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
        ...style
      }}
      {...props}
    >
      {children}
    </aside>
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
  const { collapsed } = useSidebar();
  if (collapsed) return null;
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
  const { collapsed } = useSidebar();
  const base = clsx(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
    collapsed && "justify-center px-2"
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

export function SidebarTrigger({ className, ...props }: ComponentPropsWithoutRef<"button">) {
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
    />
  );
}

export function SidebarInset({ className, ...props }: ComponentPropsWithoutRef<"main">) {
  const { collapsed } = useSidebar();
  return (
    <main
      className={clsx("min-h-screen flex-1 transition-[margin] duration-200", className)}
      style={{ marginLeft: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }}
      {...props}
    />
  );
}

export { useSidebar };
