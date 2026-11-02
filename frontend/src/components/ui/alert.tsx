import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  info: "bg-[oklch(100%_0_0/.08)] text-ink-2 shadow-[inset_0_0_0_1px_oklch(100%_0_0/.16)]",
  success: "bg-[oklch(100%_0_0/.07)] text-[oklch(92%_0_0)] shadow-[inset_0_0_0_1px_oklch(100%_0_0/.18)]",
  warning: "bg-[oklch(100%_0_0/.05)] text-ink-2 shadow-[inset_0_0_0_1px_oklch(100%_0_0/.14)]",
  danger: "bg-[oklch(69%_.20_27/.14)] text-[oklch(88%_.10_30)] shadow-[inset_0_0_0_1px_oklch(69%_.20_27/.36)]"
};

export function Alert({
  tone = "info",
  icon,
  title,
  children,
  className
}: {
  tone?: Tone;
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cn("flex gap-3 rounded-[var(--radius-ctl)] px-4 py-3.5 text-[13.5px] leading-[1.5]", TONES[tone], className)}
    >
      {icon ? <span className="mt-0.5 shrink-0 [&_svg]:size-4">{icon}</span> : null}
      <div className="min-w-0">
        {title ? <div className="font-semibold">{title}</div> : null}
        {children}
      </div>
    </div>
  );
}
