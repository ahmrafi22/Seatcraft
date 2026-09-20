import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Progress({ value, accent = "var(--color-violet)", className }: { value: number; accent?: string; className?: string }) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("h-[5px] overflow-hidden rounded-full bg-white/[0.08]", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-[var(--ease-out-soft)]"
        style={{ width: `${width}%`, background: accent, boxShadow: `0 0 10px ${accent}` } as CSSProperties}
      />
    </div>
  );
}

export function MetricBar({
  label,
  value,
  max,
  accent,
  suffix
}: {
  label: ReactNode;
  value: number;
  max: number;
  accent: string;
  suffix?: ReactNode;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="size-[11px] shrink-0 rounded-[3px] shadow-[inset_0_1px_0_oklch(100%_0_0/.3)]" style={{ background: accent }} />
        <span className="flex-1 truncate text-[12.5px] font-medium text-ink-2">{label}</span>
        <span className="font-mono text-[11.5px] text-ink-3">{suffix ?? value}</span>
      </div>
      <Progress value={pct} accent={accent} />
    </div>
  );
}
