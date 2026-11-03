"use client";

import type { CSSProperties } from "react";

import { Stage, type Act, type Point } from "@/components/stage/kit";
import { seatFill, seatInk, seatRim } from "@/lib/colors";

import "./landing.css";

/**
 * The hero demo: a real-looking hall board with one rule violation, fixed by
 * dragging the offending candidate into the empty seat beside them. It is the
 * one gesture the product is about, so it is the only thing that moves.
 */

interface College {
  code: string;
  name: string;
}

/** Codes chosen so each college lands on its own palette tint (see lib/colors). */
const COLLEGES: College[] = [
  { code: "ndc", name: "Notre Dame College" },
  { code: "dhc", name: "Dhaka College" },
  { code: "rumc", name: "Rajuk Uttara Model" },
  { code: "acc", name: "Adamjee Cantonment" },
  { code: "bsc", name: "BAF Shaheen College" },
  { code: "ttc", name: "Titumir College" },
  { code: "rjkc", name: "Rajshahi College" },
  { code: "mym", name: "Ananda Mohan College" }
];

interface Arrangement {
  seats: (string | null)[];
  conflictAt: number;
  emptyAt: number;
}

/**
 * Deals a hall where no two neighbours share a college, then plants one
 * conflict and one empty seat such that moving the conflicting candidate into
 * that seat clears the board. Resolved once at module load, and the widest
 * legal move wins: a drag across the board reads better than one seat over.
 */
function arrange(cols: number, rows: number): Arrangement {
  const n = cols * rows;
  const base: string[] = [];

  // A Latin-style deal: horizontally +1, vertically +2 through the roster.
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    base.push(COLLEGES[(row * 2 + col) % COLLEGES.length]!.code);
  }

  const clashes = (seats: (string | null)[]) => {
    let count = 0;

    for (let i = 0; i < seats.length; i++) {
      const here = seats[i];
      if (!here) continue;

      const col = i % cols;
      const right = col < cols - 1 ? seats[i + 1] : null;
      const below = seats[i + cols];

      if (right && right === here) count++;
      if (below && below === here) count++;
    }

    return count;
  };

  let best: Arrangement | null = null;
  let bestScore = -1;

  for (let conflictAt = 1; conflictAt < n; conflictAt++) {
    const col = conflictAt % cols;
    const row = Math.floor(conflictAt / cols);

    // Keep the flagged seat off the board's edges, so nothing the story points
    // at sits near a crop.
    if (col === 0 || col === cols - 1 || row === 0) continue;

    for (let emptyAt = 0; emptyAt < n; emptyAt++) {
      const emptyCol = emptyAt % cols;
      const emptyRow = Math.floor(emptyAt / cols);

      if (emptyAt === conflictAt || emptyAt === conflictAt - 1) continue;
      if (emptyCol === 0 || emptyCol === cols - 1) continue;

      // The drag reads best as a sideways trip along one row: long enough to
      // see the seat travel, short enough to follow in a single glance.
      const reach = Math.abs(emptyCol - col) + Math.abs(emptyRow - row);
      const score = (emptyRow === row ? 10 : 0) + (reach >= 3 && reach <= 5 ? 5 : 0) - Math.abs(reach - 4);
      if (score <= bestScore) continue;

      const seats: (string | null)[] = [...base];
      seats[conflictAt] = seats[conflictAt - 1]!;
      seats[emptyAt] = null;

      if (clashes(seats) !== 1) continue;

      const after: (string | null)[] = [...seats];
      after[emptyAt] = after[conflictAt] ?? null;
      after[conflictAt] = null;

      if (clashes(after) !== 0) continue;

      best = { seats, conflictAt, emptyAt };
      bestScore = score;
    }
  }

  if (best) return best;

  // Unreachable for these dimensions, but never render a broken board.
  const seats: (string | null)[] = [...base];
  seats[n - 1] = null;
  return { seats, conflictAt: 0, emptyAt: n - 1 };
}

const WIDE = arrange(10, 4);
const COMPACT = arrange(5, 4);

const NAME: Record<string, College> = Object.fromEntries(COLLEGES.map((c) => [c.code, c]));

type S = {
  moved: boolean;
  dragging: boolean;
  dragAt: Point | null;
  published: boolean;
};

const INITIAL: S = { moved: false, dragging: false, dragAt: null, published: false };

/** The frame most people see: the fix already made and the plan published. */
const POSTER: S = { ...INITIAL, moved: true, published: true };

function script(a: Act<S>) {
  return (async () => {
    await a.wait(1200);
    await a.move("conflict");
    await a.wait(520);

    // The one gesture: carry the offending candidate to the free seat.
    await a.set({ dragging: true });
    await a.drag("empty", (at) => a.put({ dragAt: at }), { duration: 1000 });
    await a.set({ dragging: false, dragAt: null, moved: true });
    await a.wait(900);

    await a.move("publish");
    await a.wait(400);
    await a.click();
    await a.set({ published: true });
    await a.wait(3000);

    // Leave the way it came: the loop restarts on the seeded board.
    await a.snap({ ...INITIAL });
    await a.wait(200);
  })();
}

export function SeatDemo() {
  return (
    <Stage<S>
      width={640}
      height={392}
      compact={{ below: 500, width: 336, height: 348 }}
      initial={INITIAL}
      poster={POSTER}
      script={script}
      theme="dark"
      cursor={{ at: { wide: { x: 600, y: 360 }, compact: { x: 318, y: 338 } }, style: "real", ripple: true }}
      className="sd mx-auto"
    >
      {(s, _rect, layout) => {
        const { seats, conflictAt, emptyAt } = layout === "compact" ? COMPACT : WIDE;
        const cols = layout === "compact" ? 5 : 10;
        const rows = 4;

        // The move is the story: after it, the candidate occupies the seat that
        // was free and the seat they left is the empty one.
        const shown = s.moved
          ? seats.map((code, i) => (i === conflictAt ? null : i === emptyAt ? seats[conflictAt] : code))
          : seats;

        return (
          <div className="sd-board">
            <div className="sd-top">
              <div className="sd-title">
                <span className="sd-name">HSC Admission Test 2026</span>
                <span className="sd-meta">
                  Hall 01 · {cols} × {rows}
                </span>
              </div>

              <span className="sd-pill" data-ok={s.moved || undefined}>
                <span className="sd-pill-dot" />
                {s.moved ? "No conflicts" : "1 conflict"}
              </span>
            </div>

            <div className="sd-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {shown.map((code, i) => {
                const isConflict = !s.moved && i === conflictAt;
                const isTarget = !s.moved && i === emptyAt;

                if (!code) {
                  return (
                    <div
                      key={i}
                      className="sd-seat sd-seat--empty"
                      data-target={isTarget ? "empty" : undefined}
                      data-hot={isTarget || undefined}
                    >
                      {isTarget ? <span className="sd-seat-hint">free</span> : null}
                    </div>
                  );
                }

                return (
                  <div
                    key={i}
                    className="sd-seat"
                    data-target={isConflict ? "conflict" : undefined}
                    data-cursor={isConflict ? "hand" : undefined}
                    data-flag={isConflict || undefined}
                    data-dim={(isConflict && s.dragging) || undefined}
                    style={
                      {
                        "--fill": seatFill(code),
                        "--ink": seatInk(code),
                        "--rim": seatRim(code)
                      } as CSSProperties
                    }
                  >
                    <span className="sd-seat-id">
                      R{Math.floor(i / cols) + 1}C{(i % cols) + 1}
                    </span>
                    <span className="sd-seat-code">{NAME[code]!.code.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>

            <div className="sd-foot">
              <span className="sd-note">
                {s.moved ? "Strict solver · 0 blocking" : "Drag the flagged seat to a free one"}
              </span>
              <span className="sd-btn" data-target="publish" data-cursor="hand" data-ready={s.moved || undefined}>
                {s.published ? "Published" : "Publish plan"}
              </span>
            </div>

            {s.dragging && s.dragAt ? (
              <div
                className="sd-seat sd-fly"
                style={
                  {
                    left: s.dragAt.x,
                    top: s.dragAt.y,
                    "--fill": seatFill(seats[conflictAt]!),
                    "--ink": seatInk(seats[conflictAt]!),
                    "--rim": seatRim(seats[conflictAt]!)
                  } as CSSProperties
                }
              >
                <span className="sd-seat-id">
                  R{Math.floor(conflictAt / cols) + 1}C{(conflictAt % cols) + 1}
                </span>
                <span className="sd-seat-code">{NAME[seats[conflictAt]!]!.code.toUpperCase()}</span>
              </div>
            ) : null}
          </div>
        );
      }}
    </Stage>
  );
}
