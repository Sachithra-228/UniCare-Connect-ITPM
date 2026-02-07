import { ReactNode } from "react";
import clsx from "clsx";

type BadgeProps = {
  children: ReactNode;
  variant?: "success" | "warning" | "info";
};

export function Badge({ children, variant = "info" }: BadgeProps) {
  return (
    <span
      className={clsx(
        "rounded-full px-3 py-1 text-xs font-semibold",
        variant === "success" && "bg-secondary/10 text-secondary",
        variant === "warning" && "bg-accent/10 text-amber-700",
        variant === "info" && "bg-primary/10 text-primary"
      )}
    >
      {children}
    </span>
  );
}
