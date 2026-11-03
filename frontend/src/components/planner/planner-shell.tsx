"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LuCheck, LuTriangleAlert, LuArmchair, LuSend } from "react-icons/lu";

import { HallBoard } from "@/components/planner/hall-board";
import { DocumentDownloads } from "@/components/planner/document-downloads";
import { Alert } from "@/components/ui/alert";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricBar } from "@/components/ui/progress";
import { Pane, PaneBody, PaneHead } from "@/components/ui/pane";
import { Select } from "@/components/ui/field";
import { institutionColor, seatFill, seatInk } from "@/lib/colors";
import { percent, seatLabel } from "@/lib/format";
import { swapSeatsAction, publishPlanAction, moveCandidateAction } from "@/app/actions/exam";
import type { Exam, Hall, SeatAssignment, SeatPlanDetail } from "@/lib/api/types";

const BLOCKING_EXEMPT = new Set(["RollOrderBroken"]);

export function PlannerShell({
  exam,
  halls,
  plan,
  initialHallId
}: {
  exam: Exam;
  halls: Hall[];
  plan: SeatPlanDetail;
  initialHallId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hallId, setHallId] = useState(initialHallId ?? halls[0]?.id ?? "");
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "danger" | "warning"; text: string } | null>(null);

  const hall = halls.find((entry) => entry.id === hallId) ?? halls[0];

  // Seats per hall, so the picker can say which halls actually hold candidates.
  const hallCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const assignment of plan.assignments) {
      counts.set(assignment.hallId, (counts.get(assignment.hallId) ?? 0) + 1);
    }

    return counts;
  }, [plan.assignments]);

  const hallAssigned = hall ? (hallCounts.get(hall.id) ?? 0) : 0;

  const flagged = useMemo(() => {
    const set = new Set<string>();
    for (const violation of plan.violations) {
      if (violation.candidateId) set.add(violation.candidateId);
      if (violation.otherCandidateId) set.add(violation.otherCandidateId);
    }
    return set;
  }, [plan.violations]);

  const blocking = plan.violations.filter((violation) => !BLOCKING_EXEMPT.has(violation.kind));
  const locked = plan.status !== "Draft";
  const usable = halls.reduce((total, entry) => total + entry.usableCapacity, 0);
  const assigned = plan.assignments.length;

  const spread = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();

    for (const assignment of plan.assignments) {
      const current = counts.get(assignment.institutionId);
      counts.set(assignment.institutionId, {
        name: assignment.institutionName,
        count: (current?.count ?? 0) + 1
      });
    }

    return [...counts.entries()]
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [plan.assignments]);

  const selectedAssignment = plan.assignments.find((assignment) => assignment.candidateId === selected) ?? null;

  function handleSwap(first: SeatAssignment, second: SeatAssignment) {
    if (locked) return;

    startTransition(async () => {
      const result = await swapSeatsAction(exam.id, plan.id, first.candidateId, second.candidateId);

      if (result.ok) {
        setNotice({ tone: "success", text: `Swapped ${first.roll} and ${second.roll}.` });
        setSelected(null);
        router.refresh();
        return;
      }

      setNotice({ tone: "danger", text: result.message ?? "Could not swap the seats." });
    });
  }

  function handleMove(candidate: SeatAssignment, row: number, column: number) {
    if (locked) return;

    startTransition(async () => {
      const result = await moveCandidateAction(exam.id, plan.id, candidate.candidateId, candidate.hallId, row, column);

      if (result.ok) {
        setNotice({
          tone: "success",
          text: `Moved ${candidate.roll} to ${seatLabel(row, column)}.`
        });
        setSelected(null);
        router.refresh();
        return;
      }

      setNotice({ tone: "danger", text: result.message ?? "Could not move the candidate." });
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishPlanAction(exam.id, plan.id);

      if (result.ok) {
        setNotice({ tone: "success", text: result.message ?? "Plan published." });
        router.refresh();
        return;
      }

      setNotice({ tone: "danger", text: result.message ?? "Could not publish." });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        <SummaryTile label="Assigned" value={assigned} suffix={`/ ${exam.candidateCount}`} foot={`${percent(assigned, exam.candidateCount)}% placed`} accent="var(--color-accent)" />
        <SummaryTile label="Usable seats" value={usable} foot={`${Math.max(0, usable - assigned)} spare`} accent="var(--color-accent-2)" />
        <SummaryTile label="Violations" value={plan.violations.length} foot={`${blocking.length} blocking`} accent={blocking.length === 0 ? "var(--color-ok)" : "var(--color-danger)"} />
        <div className="glass-pane flex flex-col justify-center rounded-[var(--radius-pane)] px-[18px] py-[17px]">
          <div className="label-mono">Plan status</div>
          <div className="mt-2.5">
            <StatusBadge status={plan.status} />
          </div>
          <div className="mt-1.5 text-[12.5px] text-ink-3">
            {locked ? "read-only, published" : "editable"}
          </div>
        </div>
      </div>

      {notice ? (
        <div className="reveal">
          <Alert
            tone={notice.tone}
            icon={notice.tone === "success" ? <LuCheck /> : <LuTriangleAlert />}
            title={notice.text}
          >
            <button type="button" onClick={() => setNotice(null)} className="mt-1 text-[12px] underline underline-offset-2 opacity-70">
              dismiss
            </button>
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_306px]">
        <Pane>
          <PaneHead
            title={
              <span className="flex items-center gap-2">
                <span className="hidden sm:inline">{hall?.name ?? "Hall"}</span>
                <span className="sm:hidden">Hall</span>
              </span>
            }
            hint={hall ? `${hall.rows} × ${hall.columns} · ${hallAssigned} seated · ${hall.usableCapacity} usable` : undefined}
            action={
              halls.length > 1 ? (
                <Select
                  value={hallId}
                  onChange={(event) => setHallId(event.target.value)}
                  width="auto"
                  className="h-8 text-[12.5px]"
                  aria-label="Choose a hall"
                >
                  {halls.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name} · {hallCounts.get(entry.id) ?? 0}/{entry.usableCapacity}
                    </option>
                  ))}
                </Select>
              ) : null
            }
          />
          <PaneBody>
            {hall ? (
              <>
                {hallAssigned === 0 && assigned > 0 ? (
                  <div className="mb-3">
                    <Alert
                      tone="warning"
                      icon={<LuTriangleAlert />}
                      title={`No candidates are seated in ${hall.name}`}
                    >
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px]">
                        <span>This plan seats candidates elsewhere.</span>
                        {halls
                          .filter((entry) => (hallCounts.get(entry.id) ?? 0) > 0)
                          .slice(0, 3)
                          .map((entry) => (
                            <button
                              key={entry.id}
                              type="button"
                              onClick={() => setHallId(entry.id)}
                              className="rounded-full bg-white/10 px-2.5 py-1 font-medium underline-offset-2 hover:underline"
                            >
                              {entry.name} · {hallCounts.get(entry.id)}
                            </button>
                          ))}
                      </div>
                    </Alert>
                  </div>
                ) : null}

                <HallBoard
                  hall={hall}
                  assignments={plan.assignments}
                  flagged={flagged}
                  selectedCandidateId={selected}
                  onSelect={setSelected}
                  onSwap={handleSwap}
                  onMove={handleMove}
                  disabled={locked || pending}
                />
              </>
            ) : (
              <div className="py-12 text-center text-[13px] text-ink-3">This exam has no halls yet.</div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4.5 gap-y-2.5 text-[12.5px] text-ink-2">
              <LegendSwatch style={{ background: seatFill("legend") }} label="Seat taken" />
              <LegendSwatch style={{ background: "oklch(100% 0 0 / .08)" }} label="Empty" />
              <LegendSwatch
                style={{
                  background:
                    "repeating-linear-gradient(45deg,oklch(100% 0 0/.04),oklch(100% 0 0/.04) 3px,oklch(100% 0 0/.10) 3px,oklch(100% 0 0/.10) 6px)"
                }}
                label="Blocked"
              />
              <LegendSwatch style={{ background: "var(--color-danger)" }} label="Violation" />
              <span className="ml-auto font-mono text-[11px] text-ink-3">
                {locked ? "read-only" : "drag a seat onto another to swap"}
              </span>
            </div>
          </PaneBody>
        </Pane>

        <div className="flex flex-col gap-4">
          <Pane>
            <PaneHead title="Institution spread" hint={`${spread.length}`} />
            <PaneBody className="py-4">
              {spread.length === 0 ? (
                <div className="text-[12.5px] text-ink-3">No assignments yet.</div>
              ) : (
                spread.map((entry) => (
                  <MetricBar
                    key={entry.id}
                    label={entry.name}
                    value={entry.count}
                    max={assigned || 1}
                    accent={institutionColor(entry.id)}
                    suffix={`${entry.count}`}
                  />
                ))
              )}
            </PaneBody>
          </Pane>

          <Pane>
            <PaneHead
              title="Violations"
              action={
                <Badge kind={blocking.length === 0 ? "success" : "danger"} dot={false}>
                  {plan.violations.length}
                </Badge>
              }
            />
            <PaneBody className="py-4">
              {plan.violations.length === 0 ? (
                <Alert tone="success" icon={<LuCheck />} title="No violations">
                  No two candidates from the same institution are adjacent.
                </Alert>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {plan.violations.slice(0, 6).map((violation, index) => (
                    <div
                      key={`${violation.kind}-${index}`}
                      className="rounded-[var(--radius-ctl)] bg-white/[0.04] px-3 py-2.5 text-[12.5px] shadow-[inset_0_0_0_1px_var(--edge)]"
                    >
                      <div className="flex items-center gap-2">
                        <Badge kind={BLOCKING_EXEMPT.has(violation.kind) ? "warning" : "danger"} dot={false}>
                          {violation.kind}
                        </Badge>
                      </div>
                      <div className="mt-1.5 text-ink-2">{violation.message}</div>
                    </div>
                  ))}
                  {plan.violations.length > 6 ? (
                    <div className="text-[12px] text-ink-3">+ {plan.violations.length - 6} more</div>
                  ) : null}
                </div>
              )}
            </PaneBody>
          </Pane>

          <Pane>
            <PaneHead title="Selected seat" />
            <PaneBody className="py-4">
              {selectedAssignment ? (
                <div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-lg font-mono text-[12px] font-semibold"
                      style={{
                        background: seatFill(selectedAssignment.institutionId),
                        color: seatInk(selectedAssignment.institutionId)
                      }}
                    >
                      {selectedAssignment.roll.slice(-2)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-medium">{selectedAssignment.fullName}</div>
                      <div className="truncate font-mono text-[11.5px] text-ink-3">{selectedAssignment.roll}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <div className="label-mono">Seat</div>
                      <div className="mt-0.5 font-mono text-[14px]">{seatLabel(selectedAssignment.row, selectedAssignment.column)}</div>
                    </div>
                    <div>
                      <div className="label-mono">Hall</div>
                      <div className="mt-0.5 text-[14px]">{selectedAssignment.hallName}</div>
                    </div>
                  </div>

                  <div className="mt-3 truncate text-[12px] text-ink-3">{selectedAssignment.institutionName}</div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[12.5px] text-ink-3">
                  <LuArmchair className="size-4 opacity-60" />
                  Click a seat to inspect it.
                </div>
              )}
            </PaneBody>
          </Pane>

          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              onClick={handlePublish}
              loading={pending}
              disabled={locked || blocking.length > 0}
              icon={<LuSend />}
              className="w-full"
            >
              Publish plan
            </Button>

            <DocumentDownloads examId={exam.id} planId={plan.id} published={plan.status === "Published"} />

            {blocking.length > 0 ? (
              <p className="text-[11.5px] leading-relaxed text-ink-3">
                {blocking.length} blocking violation{blocking.length === 1 ? "" : "s"} left. Fix them before publishing.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  suffix,
  foot,
  accent
}: {
  label: string;
  value: number;
  suffix?: string;
  foot: string;
  accent: string;
}) {
  return (
    <div className="glass-pane relative overflow-hidden rounded-[var(--radius-pane)] px-4 py-3.5 sm:px-[18px] sm:py-[17px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[30%] -bottom-[70%] size-[190px] rounded-full blur-[18px]"
        style={{ background: `radial-gradient(circle, color-mix(in oklch, ${accent} 42%, transparent), transparent 70%)` }}
      />
      <div className="relative">
        <div className="label-mono">{label}</div>
        <div
          className="mt-1.5 text-[24px] font-semibold tracking-[-0.035em] tabular-nums sm:text-[30px]"
          style={{ color: `color-mix(in oklch, ${accent} 88%, white)` }}
        >
          {value}
          {suffix ? <span className="text-[14px] font-medium text-ink-3"> {suffix}</span> : null}
        </div>
        <div className="mt-0.5 text-[12px] text-ink-3 sm:text-[12.5px]">{foot}</div>
      </div>
    </div>
  );
}

function LegendSwatch({ style, label }: { style: React.CSSProperties; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-[11px] rounded-[3px] shadow-[inset_0_1px_0_oklch(100%_0_0/.3)]" style={style} />
      {label}
    </span>
  );
}
