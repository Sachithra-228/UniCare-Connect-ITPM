import { SelectHTMLAttributes } from "react";
import clsx from "clsx";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={clsx(
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none dark:border-slate-700 dark:bg-slate-900",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
