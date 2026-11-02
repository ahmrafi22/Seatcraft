import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Fade + rise on mount, staggered by `delay`.
 *
 * Deliberately a server component driven by a CSS animation: this wraps nearly
 * every page section, and routing it through a client-side animation library put
 * the whole runtime in the shared bundle just to fade a box in.
 */
export function Reveal({
  children,
  delay = 0,
  className
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={cn("reveal", className)} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
