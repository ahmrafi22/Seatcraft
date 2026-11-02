"use client";

import { stepFor } from "@/lib/colors";

/**
 * Decorative hall grid for the hero. Cells light up in ash steps with a
 * staggered wave, which is the whole visual pitch in one small canvas.
 *
 * The stagger is a CSS animation delay rather than a client-side animation
 * library: this renders ~70 cells, and the effect is identical.
 */
export function MiniHall({
  rows = 6,
  columns = 8,
  seed = 11,
  className
}: {
  rows?: number;
  columns?: number;
  seed?: number;
  className?: string;
}) {
  const cells = Array.from({ length: rows * columns }, (_, index) => {
    const mixed = (index * 37 + seed * 11) % 100;
    const taken = mixed % 7 !== 0;
    const step = [88, 76, 64, 94, 70, 82][mixed % 6] ?? 80;

    return { taken, step, index };
  });

  return (
    <div
      className={className}
      style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 5 }}
      aria-hidden
    >
      {cells.map((cell) => (
        <div
          key={cell.index}
          className="cell-pop aspect-square rounded-[4px]"
          style={{
            animationDelay: `${0.25 + cell.index * 0.006}s`,
            background: cell.taken ? `oklch(${cell.step}% 0 0 / 0.3)` : "oklch(100% 0 0 / .05)",
            boxShadow: cell.taken
              ? `inset 0 1px 0 oklch(100% 0 0 / .22), 0 0 0 1px oklch(${cell.step}% 0 0 / .5)`
              : "inset 0 0 0 1px oklch(100% 0 0 / .05)"
          }}
        />
      ))}
    </div>
  );
}

/** Legend dots for the hero thumbnails. */
export function HueDots({ codes }: { codes: string[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {codes.map((code) => (
        <span key={code} className="size-[9px] rounded-[2px]" style={{ background: `oklch(${stepFor(code)}% 0 0)` }} />
      ))}
    </div>
  );
}
