"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { seatFill, seatInk, seatRim } from "@/lib/colors";
import { seatLabel } from "@/lib/format";
import type { Hall, SeatAssignment } from "@/lib/api/types";

/** "Nusrat Jahan" → "Nusrat J." — enough to tell two seats apart at tile size. */
function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) return parts[0] ?? "";

  return `${parts[0]} ${parts[parts.length - 1]?.[0] ?? ""}.`;
}

export interface BoardSeat {
  row: number;
  column: number;
  blocked: boolean;
  assignment: SeatAssignment | null;
}

/** Flattens a hall into a row-major grid of seats. */
export function buildSeats(hall: Hall, assignments: SeatAssignment[]): BoardSeat[] {
  const blocked = new Set(hall.blockedSeats.map((seat) => `${seat.row}:${seat.column}`));
  const byCell = new Map<string, SeatAssignment>();

  for (const assignment of assignments) {
    if (assignment.hallId !== hall.id) continue;
    byCell.set(`${assignment.row}:${assignment.column}`, assignment);
  }

  const seats: BoardSeat[] = [];

  for (let row = 0; row < hall.rows; row += 1) {
    for (let column = 0; column < hall.columns; column += 1) {
      seats.push({
        row,
        column,
        blocked: blocked.has(`${row}:${column}`),
        assignment: byCell.get(`${row}:${column}`) ?? null
      });
    }
  }

  return seats;
}

export function HallBoard({
  hall,
  assignments,
  flagged,
  selectedCandidateId,
  onSelect,
  onSwap,
  onMove,
  disabled
}: {
  hall: Hall;
  assignments: SeatAssignment[];
  flagged: Set<string>;
  selectedCandidateId: string | null;
  onSelect: (candidateId: string | null) => void;
  onSwap: (first: SeatAssignment, second: SeatAssignment) => void;
  onMove: (candidate: SeatAssignment, row: number, column: number) => void;
  disabled?: boolean;
}) {
  const seats = useMemo(() => buildSeats(hall, assignments), [hall, assignments]);
  const [dragFrom, setDragFrom] = useState<SeatAssignment | null>(null);
  const [hoverCell, setHoverCell] = useState<string | null>(null);

  return (
    <div
      className="glass-well -mx-4 overflow-x-auto rounded-none px-4 py-4 sm:mx-0 sm:rounded-[var(--radius-pane)] sm:p-4"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${hall.columns}, minmax(var(--seat-min), 1fr))`,
        gap: 6,
        // Shrink seats on narrow screens so a 10-wide hall fits without scrolling.
        ["--seat-min" as string]: "clamp(22px, 6.4vw, 34px)"
      }}
    >
      {seats.map((seat) => {
        const cellKey = `${seat.row}:${seat.column}`;
        const assignment = seat.assignment;
        const isDragging = Boolean(assignment && dragFrom && dragFrom.candidateId === assignment.candidateId);
        const isHover = hoverCell === cellKey;
        const isFlagged = Boolean(assignment && flagged.has(assignment.candidateId));
        const isSelected = Boolean(assignment && selectedCandidateId === assignment.candidateId);

        if (seat.blocked) {
          return (
            <div
              key={cellKey}
              title={`Blocked · ${seatLabel(seat.row, seat.column)}`}
              className="aspect-square cursor-not-allowed rounded-[7px] bg-[repeating-linear-gradient(45deg,oklch(100%_0_0/.03),oklch(100%_0_0/.03)_5px,oklch(100%_0_0/.07)_5px,oklch(100%_0_0/.07)_10px)] shadow-[inset_0_0_0_1px_oklch(100%_0_0/.05)]"
            />
          );
        }

        if (!assignment) {
          return (
            <div
              key={cellKey}
              title={`Empty · ${seatLabel(seat.row, seat.column)}`}
              onDragOver={(event) => {
                if (!dragFrom || disabled) return;
                event.preventDefault();
                setHoverCell(cellKey);
              }}
              onDragLeave={() => setHoverCell(null)}
              onDrop={(event) => {
                event.preventDefault();
                setHoverCell(null);
                if (!dragFrom || disabled) return;
                onMove(dragFrom, seat.row, seat.column);
                setDragFrom(null);
              }}
              className={cn(
                "aspect-square rounded-[7px] bg-white/[0.025] shadow-[inset_0_0_0_1px_oklch(100%_0_0/.06)] transition-shadow",
                isHover && "shadow-[0_0_0_2px_oklch(100%_0_0/.85),0_0_18px_oklch(100%_0_0/.3)]"
              )}
            />
          );
        }

        return (
          <button
            key={cellKey}
            type="button"
            draggable={!disabled}
            disabled={disabled}
            title={`${assignment.roll} · ${assignment.fullName}\n${assignment.institutionName}\nSeat ${seatLabel(seat.row, seat.column)}`}
            onDragStart={() => setDragFrom(assignment)}
            onDragEnd={() => {
              setDragFrom(null);
              setHoverCell(null);
            }}
            onDragOver={(event) => {
              if (!dragFrom || disabled) return;
              event.preventDefault();
              setHoverCell(cellKey);
            }}
            onDragLeave={() => setHoverCell(null)}
            onDrop={(event) => {
              event.preventDefault();
              setHoverCell(null);
              if (!dragFrom || disabled || dragFrom.candidateId === assignment.candidateId) return;
              onSwap(dragFrom, assignment);
              setDragFrom(null);
            }}
            onClick={() => onSelect(isSelected ? null : assignment.candidateId)}
            className={cn(
              "group relative flex aspect-square cursor-grab flex-col items-center justify-center overflow-hidden rounded-[7px]",
              "px-0.5 leading-none",
              "transition-[transform,box-shadow,opacity] duration-150 ease-[var(--ease-out-soft)]",
              "hover:z-10 hover:-translate-y-0.5 disabled:cursor-default",
              isDragging && "opacity-30",
              isHover && "shadow-[0_0_0_2px_oklch(100%_0_0/.9),0_0_20px_oklch(100%_0_0/.35)]",
              isSelected && "ring-2 ring-white/80 ring-offset-2 ring-offset-transparent"
            )}
            style={{
              background: assignment ? seatFill(assignment.institutionId) : undefined,
              color: assignment ? seatInk(assignment.institutionId) : undefined,
              boxShadow: isFlagged
                ? "inset 0 1px 0 oklch(100% 0 0 / .35), 0 0 0 2px oklch(69% .20 27), 0 0 18px oklch(69% .20 27 / .7)"
                : assignment
                  ? `inset 0 1px 0 oklch(100% 0 0 / .45), inset 0 -1px 0 oklch(0% 0 0 / .18), 0 0 0 1px ${seatRim(assignment.institutionId)}, 0 3px 10px -4px oklch(0% 0 0 / .85)`
                  : undefined
            }}
          >
            {/* Seat number, the thing an invigilator reads out. */}
            <span className="font-mono text-[10.5px] font-bold tabular-nums">{seatLabel(seat.row, seat.column)}</span>

            {/* Roll suffix, so two adjacent seats are never confused. */}
            <span className="mt-[2px] font-mono text-[8px] font-medium opacity-70">{assignment.roll}</span>

            {/* Name only fits on wider seats; hidden on the smallest grids. */}
            <span className="mt-[2px] hidden w-full truncate px-0.5 text-center text-[7px] leading-tight font-medium opacity-80 [@media(min-width:640px)]:block">
              {shortName(assignment.fullName)}
            </span>

            {isFlagged ? (
              <span
                aria-hidden
                className="absolute top-[2px] right-[2px] size-1.5 rounded-full bg-[oklch(69%_.20_27)] shadow-[0_0_6px_oklch(69%_.20_27)]"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

