import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const CONTROL =
  "rounded-[var(--radius-ctl)] bg-white/[0.055] px-3.5 text-[13.5px] text-ink " +
  "shadow-[inset_0_1px_0_oklch(100%_0_0/.10),0_0_0_1px_var(--edge)] outline-none " +
  "transition-[background,box-shadow] duration-150 placeholder:text-[oklch(62%_.02_285)] " +
  "focus:bg-white/[0.075] focus:shadow-[inset_0_1px_0_oklch(100%_0_0/.14),0_0_0_1px_oklch(72%_.19_298/.75),0_0_0_4px_oklch(72%_.19_298/.16)]";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label-mono mb-1.5 block">
        {label}
      </label>
      {children}
      {hint && !error ? <div className="mt-1.5 text-[12px] text-ink-3">{hint}</div> : null}
      {error ? <div className="mt-1.5 text-[12px] text-rose">{error}</div> : null}
    </div>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, "h-10 w-full", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, "w-full resize-y py-2.5 leading-relaxed", className)} {...rest} />;
}

/**
 * `width="auto"` drops `w-full` entirely instead of fighting it with a second
 * width utility — Tailwind has no conflict resolution without tailwind-merge.
 */
export function Select({
  className,
  width = "full",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { width?: "full" | "auto" }) {
  return (
    <select
      className={cn(CONTROL, "h-10 appearance-none bg-[length:0] pr-9", width === "full" && "w-full", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a5a3ad' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.75rem center"
      }}
      {...rest}
    >
      {children}
    </select>
  );
}
