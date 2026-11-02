import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  info: "bg-[oklch(75%_.145_192/.12)] text-[oklch(90%_.07_195)] shadow-[inset_0_0_0_1px_oklch(75%_.145_192/.32)]",
  success: "bg-[oklch(80%_.17_160/.10)] text-[oklch(88%_.11_162)] shadow-[inset_0_0_0_1px_oklch(80%_.17_160/.3)]",
  warning: "bg-[oklch(85%_.16_82/.10)] text-[oklch(92%_.10_85)] shadow-[inset_0_0_0_1px_oklch(85%_.16_82/.3)]",
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
