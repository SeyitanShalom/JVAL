import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ghost" | "outline";
};

const variants = {
  ghost:
    "text-slate-700 hover:bg-slate-100 hover:text-red-500 dark:text-[#f2d6d8] dark:hover:bg-red-950/40 dark:hover:text-red-300",
  outline:
    "bg-white text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:border-red-900/50 dark:bg-red-950/20 dark:text-[#f2d6d8] dark:hover:border-red-400/70 dark:hover:bg-red-950/50 dark:hover:text-red-300",
};

export function Button({
  className,
  type = "button",
  variant = "ghost",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "motion-button inline-flex h-10 items-center justify-center rounded-lg text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-[#130406]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
