import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-full px-4 py-2 text-sm font-medium transition",
        variant === "primary" && "bg-primary text-white hover:bg-blue-700",
        variant === "secondary" &&
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
        variant === "ghost" && "text-slate-600 hover:text-slate-900 dark:text-slate-300",
        className
      )}
      {...props}
    />
  );
}
