import { TextareaHTMLAttributes } from "react";
import clsx from "clsx";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className, ...props }: TextAreaProps) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none dark:border-slate-700 dark:bg-slate-900",
        className
      )}
      {...props}
    />
  );
}
