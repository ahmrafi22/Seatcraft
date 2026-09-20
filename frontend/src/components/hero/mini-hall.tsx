"use client";

import { motion } from "motion/react";

import { hueFor } from "@/lib/colors";

/**
 * Decorative hall grid for the hero. Cells light up in institution colours with a
 * staggered wave, which is the whole visual pitch in one small canvas.
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
    const hue = [298, 205, 162, 82, 348, 258][mixed % 6] ?? 298;

    return { taken, hue, index };
  });

  return (
    <div
      className={className}
      style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 5 }}
      aria-hidden
    >
      {cells.map((cell) => (
        <motion.div
          key={cell.index}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.42,
            delay: 0.25 + cell.index * 0.006,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="aspect-square rounded-[4px]"
          style={{
            background: cell.taken
              ? `color-mix(in oklch, oklch(72% .18 ${cell.hue}) 40%, transparent)`
              : "oklch(100% 0 0 / .05)",
            boxShadow: cell.taken
              ? `inset 0 1px 0 oklch(100% 0 0 / .22), 0 0 0 1px color-mix(in oklch, oklch(72% .18 ${cell.hue}) 55%, transparent)`
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
        <span
          key={code}
          className="size-[9px] rounded-[2px]"
          style={{ background: `oklch(72% .18 ${hueFor(code)})` }}
        />
      ))}
    </div>
  );
}
