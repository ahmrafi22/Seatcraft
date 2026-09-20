import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BadgeKind = "neutral" | "primary" | "success" | "warning" | "danger";

const KINDS: Record<BadgeKind, string> = {
  neutral: "bg-white/[0.07] text-ink-2",
  primary:
    "bg-[oklch(72%_.19_298/.16)] text-[oklch(84%_.13_300)] shadow-[inset_0_0_0_1px_oklch(72%_.19_298/.35)]",
  success:
    "bg-[oklch(80%_.17_160/.14)] text-emerald shadow-[inset_0_0_0_1px_oklch(80%_.17_160/.32)]",
  warning: "bg-[oklch(85%_.16_82/.14)] text-amber shadow-[inset_0_0_0_1px_oklch(85%_.16_82/.32)]",
  danger: "bg-[oklch(72%_.20_22/.16)] text-[oklch(80%_.16_20)] shadow-[inset_0_0_0_1px_oklch(72%_.20_22/.38)]"
};

export function Badge({
  children,
  kind = "neutral",
  dot = true,
  className
}: {
  children: ReactNode;
  kind?: BadgeKind;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[23px] items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-medium tracking-[-0.005em] whitespace-nowrap",
        KINDS[kind],
        className
      )}
    >
      {dot ? (
        <span
          aria-hidden
          className="size-[5px] shrink-0 rounded-full bg-current shadow-[0_0_8px_currentColor]"
        />
      ) : null}
      {children}
    </span>
  );
}

const STATUS_KIND: Record<string, BadgeKind> = {
  Draft: "neutral",
  Configured: "neutral",
  Allocated: "primary",
  Published: "success",
  Archived: "neutral",
  Queued: "warning",
  Running: "primary",
  Completed: "success",
  Failed: "danger",
  Cancelled: "neutral",
  Superseded: "neutral"
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge kind={STATUS_KIND[status] ?? "neutral"}>{status}</Badge>;
}
