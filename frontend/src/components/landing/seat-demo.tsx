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
  block: number;
  seats: (string | null)[];
  conflictAt: number;
  emptyAt: number;
}

/**
 * Deals a two-block hall — every row splits around a centre aisle — where no
 * two neighbours share a college, then plants one conflict and one free seat
 * such that moving the offender clears the board. The aisle breaks adjacency:
 * seats do not touch across the walkway. Resolved once at module load, and the
 * widest legal move wins: a drag across the board reads better than one seat
 * over.
 */
function arrange(block: number, rows: number, emptyCount: number): Arrangement {
  const cols = block * 2;
  const n = cols * rows;

  // A Latin-style deal: horizontally +1, vertically +3 through the roster.
  const base: string[] = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    base.push(COLLEGES[(row * 3 + col) % COLLEGES.length]!.code);
  }

  const neighbours = (i: number) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const inBlock = col % block;
    const out: number[] = [];
    if (inBlock > 0) out.push(i - 1);
    if (inBlock < block - 1) out.push(i + 1);
    if (row > 0) out.push(i - cols);
    if (row < rows - 1) out.push(i + cols);
    return out;
  };

  const clashes = (seats: (string | null)[]) => {
    let count = 0;
    for (let i = 0; i < seats.length; i++) {
      const here = seats[i];
      if (!here) continue;
      // No left/right link across the aisle: the last column of a block has
      // no right neighbour.
      if (i % block !== block - 1 && seats[i + 1] === here) count++;
      if (seats[i + cols] === here) count++;
    }
    return count;
  };

  let best: Arrangement | null = null;
  let bestScore = -1;

  for (let conflictAt = 0; conflictAt < n; conflictAt++) {
    const col = conflictAt % cols;
    const row = Math.floor(conflictAt / cols);

    // Interior of a block, away from the crop edges and the aisle, so the
    // flagged seat has company on every side.
    if (col % block === 0 || col % block === block - 1) continue;
    if (row === 0 || row === rows - 1) continue;

    const planted = [...base];
    planted[conflictAt] = planted[conflictAt - 1]!;
    if (clashes(planted) !== 1) continue;

    const banned = new Set([conflictAt, ...neighbours(conflictAt)]);

    for (let emptyAt = 0; emptyAt < n; emptyAt++) {
      if (banned.has(emptyAt)) continue;
      const emptyCol = emptyAt % cols;
      const emptyRow = Math.floor(emptyAt / cols);
      const reach = Math.abs(emptyCol - col) + Math.abs(emptyRow - row);

      // The drag reads best as a sideways trip along one row, ideally across
      // the aisle: long enough to see the seat travel, and the crossing sells
      // the two-block layout.
      if (emptyRow !== row || reach < 2 || reach > block + 1) continue;

      for (let start = 0; start < n; start++) {
        const extras: number[] = [];
        for (let k = 0; extras.length < emptyCount - 1 && k < n; k++) {
          const idx = (start + k * 7) % n;
          if (banned.has(idx) || idx === emptyAt || extras.includes(idx)) continue;
          if (idx % cols === emptyCol) continue;
          extras.push(idx);
        }
        if (extras.length !== emptyCount - 1) continue;

        const seats: (string | null)[] = [...planted];
        seats[emptyAt] = null;
        for (const e of extras) seats[e] = null;
        if (clashes(seats) !== 1) continue;

        const after: (string | null)[] = [...seats];
        after[emptyAt] = seats[conflictAt] ?? null;
        after[conflictAt] = null;
        if (clashes(after) !== 0) continue;

        // Prefer empties on separate rows and on both sides of the aisle.
        const spreadRows = new Set(extras.map((e) => Math.floor(e / cols))).size;
        const bothBlocks =
          extras.some((e) => e % cols < block) && extras.some((e) => e % cols >= block);
        const crosses = (col < block) !== (emptyCol < block);
        const score =
          (reach === 2 || reach === 3 ? 3 : 1) +
          spreadRows * 2 +
          (bothBlocks ? 2 : 0) +
          (crosses ? 3 : 0);

        if (score > bestScore) {
          best = { block, seats, conflictAt, emptyAt };
          bestScore = score;
        }
      }
    }
  }

  // Unreachable for these dimensions, but never render a broken board.
  if (!best) {
    const seats: (string | null)[] = [...base];
    seats[n - 1] = null;
    return { block, seats, conflictAt: 0, emptyAt: n - 1 };
  }
  return best;
}

const WIDE = arrange(5, 4, 5);
const COMPACT = arrange(4, 4, 4);

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
    await a.wait(700);
    await a.move("conflict", { duration: 600 });
    await a.wait(350);

    // The one gesture: carry the offending candidate to the free seat.
    await a.set({ dragging: true });
    await a.drag("empty", (at) => a.put({ dragAt: at }), { duration: 950 });
    await a.set({ dragging: false, dragAt: null, moved: true });
    await a.wait(1100);

    await a.move("publish", { duration: 650 });
    await a.wait(250);
    await a.click();
    await a.set({ published: true });
    await a.wait(2600);

    // Leave the way it came: the loop restarts on the seeded board.
    await a.snap({ ...INITIAL });
    await a.wait(250);
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
        const arrangement = layout === "compact" ? COMPACT : WIDE;
        const { block, seats, conflictAt, emptyAt } = arrangement;
        const rows = 4;

        // The move is the story: after it, the candidate occupies the seat that
        // was free and the seat they left is the empty one.
        const shown = s.moved
          ? seats.map((code, i) => (i === conflictAt ? null : i === emptyAt ? seats[conflictAt] : code))
          : seats;

        const seatProps = (i: number) => {
          const isConflict = !s.moved && i === conflictAt;
          const isTarget = !s.moved && i === emptyAt;
          return { isConflict, isTarget };
        };

        const renderSeat = (i: number, col: number) => {
          const { isConflict, isTarget } = seatProps(i);
          const code = shown[i];
          const id = `R${Math.floor(i / (block * 2)) + 1}C${col + 1}`;

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
              <span className="sd-seat-id">{id}</span>
              <span className="sd-seat-code">{NAME[code]!.code.toUpperCase()}</span>
            </div>
          );
        };

        return (
          <div className="sd-board">
            <div className="sd-top">
              <div className="sd-title">
                <span className="sd-name">HSC Admission Test 2026</span>
                <span className="sd-meta">
                  Hall 01 · {block} × {rows} × 2 blocks
                </span>
              </div>

              <span className="sd-pill" data-ok={s.moved || undefined}>
                <span className="sd-pill-dot" />
                {s.moved ? "No conflicts" : "1 conflict"}
              </span>
            </div>

            <div className="sd-hall">
              {[0, block].map((from, blockIndex) => (
                <div
                  key={from}
                  className="sd-grid"
                  style={{ gridTemplateColumns: `repeat(${block}, 1fr)` }}
                >
                  {Array.from({ length: rows }, (_, r) =>
                    Array.from({ length: block }, (_, c) =>
                      renderSeat(from + r * block * 2 + c, blockIndex * block + c)
                    )
                  )}
                </div>
              ))}
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
                  R{Math.floor(conflictAt / (block * 2)) + 1}C
                  {conflictAt % (block * 2) >= block ? block + (conflictAt % block) + 1 : (conflictAt % block) + 1}
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
