import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Pane({
  children,
  className,
  style,
  as: Tag = "div"
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "article" | "aside";
}) {
  return (
    <Tag className={cn("glass-pane relative overflow-hidden rounded-[var(--radius-pane)]", className)} style={style}>
      {children}
    </Tag>
  );
}

export function PaneHead({
  title,
  hint,
  action,
  className
}: {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[52px] items-center gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-5", className)}>
      <h2 className="shrink-0 text-[13.5px] font-semibold tracking-[-0.01em] whitespace-nowrap text-ink">{title}</h2>
      <div className="flex-1" />
      {hint ? <span className="hidden font-mono text-[11px] whitespace-nowrap text-ink-3 md:block">{hint}</span> : null}
      {action}
    </div>
  );
}

export function PaneBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-4 py-4 sm:px-5 sm:py-5", className)}>{children}</div>;
}
