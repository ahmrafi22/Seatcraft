import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Stat tile. The accent hue drives a blurred bloom in the corner and the value
 * colour, so a row of four reads as four different signals.
 */
export function Stat({
  label,
  value,
  foot,
  accent = "var(--color-accent)",
  className,
  suffix
}: {
  label: string;
  value: ReactNode;
  foot?: ReactNode;
  accent?: string;
  className?: string;
  suffix?: ReactNode;
}) {
  return (
    <div
      className={cn("glass-pane relative overflow-hidden rounded-[var(--radius-pane)] px-4 py-3.5 sm:px-[18px] sm:py-[17px]", className)}
      style={{ "--accent": accent } as CSSProperties}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[30%] -bottom-[70%] size-[190px] rounded-full blur-[18px]"
        style={{
          background: `radial-gradient(circle, color-mix(in oklch, ${accent} 42%, transparent), transparent 70%)`
        }}
      />
      <div className="relative">
        <div className="label-mono">{label}</div>
        <div
          className="mt-1.5 text-[26px] font-semibold tracking-[-0.035em] tabular-nums sm:text-[30px]"
          style={{ color: `color-mix(in oklch, ${accent} 88%, white)` }}
        >
          {value}
          {suffix ? <span className="text-[15px] font-medium text-ink-3"> {suffix}</span> : null}
        </div>
        {foot ? <div className="mt-0.5 text-[12px] text-ink-3 sm:text-[12.5px]">{foot}</div> : null}
      </div>
    </div>
  );
}
