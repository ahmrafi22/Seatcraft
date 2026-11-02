import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BadgeKind = "neutral" | "primary" | "success" | "warning" | "danger";

const KINDS: Record<BadgeKind, string> = {
  neutral: "bg-white/[0.07] text-ink-2",
  primary:
    "bg-[oklch(100%_0_0/.14)] text-[oklch(97%_0_0)] shadow-[inset_0_0_0_1px_oklch(100%_0_0/.28)]",
  success:
    "bg-[oklch(100%_0_0/.10)] text-[oklch(94%_0_0)] shadow-[inset_0_0_0_1px_oklch(100%_0_0/.22)]",
  warning: "bg-[oklch(100%_0_0/.06)] text-ink-2 shadow-[inset_0_0_0_1px_oklch(100%_0_0/.16)]",
  danger: "bg-[oklch(69%_.20_27/.16)] text-[oklch(84%_.13_28)] shadow-[inset_0_0_0_1px_oklch(69%_.20_27/.4)]"
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
