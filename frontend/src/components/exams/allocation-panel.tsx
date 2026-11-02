"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LuPlay, LuBan, LuCircleCheck, LuLoaderCircle } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { duration, dateTime } from "@/lib/format";
import { cancelRunAction, startAllocationAction } from "@/app/actions/exam";
import type { AllocationRun, Strategy } from "@/lib/api/types";

const STRATEGIES: { value: Strategy; label: string; hint: string }[] = [
  { value: "Strict", label: "Strict", hint: "Tries hardest. Repairs conflicts and keeps retrying — use this one." },
  { value: "Balanced", label: "Balanced", hint: "Fast and tidy. Good for a first pass on a large exam." },
  { value: "Greedy", label: "Greedy", hint: "Fastest, no repair. Useful for comparing against the others." }
];

export function AllocationPanel({
  examId,
  runs: initialRuns,
  canAllocate,
  candidateCount = 0,
  hallCount = 0
}: {
  examId: string;
  runs: AllocationRun[];
  canAllocate: boolean;
  candidateCount?: number;
  hallCount?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [strategy, setStrategy] = useState<Strategy>("Strict");
  const [runs, setRuns] = useState(initialRuns);
  const [activeRunId, setActiveRunId] = useState<string | null>(
    initialRuns.find((run) => run.status === "Queued" || run.status === "Running")?.id ?? null
  );
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const activeRun = runs.find((run) => run.id === activeRunId) ?? null;
  const isWorking = activeRun?.status === "Queued" || activeRun?.status === "Running";

  const poll = useCallback(async () => {
    if (!activeRunId) return;

    const response = await fetch(`/bff/runs/${examId}/${activeRunId}`, { cache: "no-store" });

    if (!response.ok) return;

    const run = (await response.json()) as AllocationRun;

    setRuns((current) => {
      const next = current.filter((entry) => entry.id !== run.id);
      return [run, ...next].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    });

    if (run.status === "Completed" || run.status === "Failed" || run.status === "Cancelled") {
      setActiveRunId(null);
      setNotice({
        tone: run.status === "Completed" ? "success" : "danger",
        text:
          run.status === "Completed"
            ? `Run finished with ${run.bestViolationCount} violation${run.bestViolationCount === 1 ? "" : "s"} in ${duration(run.durationMs)}.`
            : (run.failureReason ?? `Run ${run.status.toLowerCase()}.`)
      });
      router.refresh();
    }
  }, [activeRunId, examId, router]);

  useEffect(() => {
    if (!isWorking) return;

    // The interval covers the first tick too; calling poll() here would set state
    // synchronously inside the effect and trigger a cascading render.
    const timer = setInterval(poll, 900);

    return () => clearInterval(timer);
  }, [isWorking, poll]);

  function start() {
    setNotice(null);

    startTransition(async () => {
      const result = await startAllocationAction(examId, strategy);

      if (!result.ok || !result.runId) {
        setNotice({ tone: "danger", text: result.message ?? "Could not start the run." });
        return;
      }

      setRuns((current) => [
        {
          id: result.runId!,
          examId,
          strategy,
          seed: 0,
          status: "Queued",
          progressPercent: 0,
          currentPhase: "Queued",
          bestViolationCount: 0,
          resultSeatPlanId: null,
          candidateCount: 0,
          hallsUsed: 0,
          durationMs: 0,
          failureReason: null,
          createdAt: new Date().toISOString()
        },
        ...current
      ]);
      setActiveRunId(result.runId);
    });
  }

  function cancel() {
    if (!activeRunId) return;

    startTransition(async () => {
      const result = await cancelRunAction(examId, activeRunId);
      if (!result.ok) setNotice({ tone: "danger", text: result.message ?? "Could not cancel." });
      setActiveRunId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {notice ? (
        <div className="reveal">
          <Alert tone={notice.tone} icon={notice.tone === "success" ? <LuCircleCheck /> : <LuBan />} title={notice.text}>
            <button type="button" onClick={() => setNotice(null)} className="mt-1 text-[12px] underline underline-offset-2 opacity-70">
              dismiss
            </button>
          </Alert>
        </div>
      ) : null}

      <div className="rounded-[var(--radius-ctl)] bg-white/[0.04] p-4 shadow-[inset_0_1px_0_oklch(100%_0_0/.08),0_0_0_1px_var(--edge)]">
        <div className="mb-1 flex items-baseline gap-2">
          <h3 className="text-[13.5px] font-semibold">Run allocation</h3>
          <span className="text-[11.5px] text-ink-3">Places every candidate into a seat.</span>
        </div>

        <div className="mt-3 flex flex-col gap-2" role="radiogroup" aria-label="Allocation strategy">
          {STRATEGIES.map((entry) => {
            const selected = strategy === entry.value;

            return (
              <button
                key={entry.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setStrategy(entry.value)}
                disabled={!canAllocate || isWorking}
                className={cn(
                  "flex items-start gap-3 rounded-[var(--radius-ctl)] px-3.5 py-2.5 text-left transition-[background,box-shadow] duration-150",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  selected
                    ? "bg-white/[0.10] shadow-[inset_0_0_0_1px_oklch(100%_0_0/.30)]"
                    : "bg-white/[0.03] shadow-[inset_0_0_0_1px_var(--edge)] hover:bg-white/[0.06]"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-[3px] grid size-3.5 shrink-0 place-items-center rounded-full transition-colors",
                    selected ? "bg-ink" : "shadow-[inset_0_0_0_1px_oklch(100%_0_0/.35)]"
                  )}
                >
                  {selected ? <span className="size-1.5 rounded-full bg-[oklch(18%_0_0)]" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium">{entry.label}</span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-3">{entry.hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="primary"
          onClick={start}
          loading={pending || isWorking}
          disabled={!canAllocate || isWorking || candidateCount === 0 || hallCount === 0}
          icon={<LuPlay />}
          className="mt-3.5 w-full"
        >
          {isWorking ? "Allocating…" : "Run allocation"}
        </Button>

        {isWorking ? (
          <Button variant="ghost" onClick={cancel} disabled={pending} icon={<LuBan />} className="mt-2 w-full">
            Cancel run
          </Button>
        ) : null}

        {!canAllocate ? (
          <p className="mt-2.5 text-[11.5px] text-ink-3">
            This exam is published, so it can no longer be re-allocated. Create a new exam to try another strategy.
          </p>
        ) : null}

        {canAllocate && candidateCount === 0 ? (
          <div className="mt-3">
            <Alert tone="warning" title="No candidates to allocate">
              Add candidates below, or import a CSV. Allocation needs at least one candidate
              {hallCount === 0 ? " and one hall." : "."}
            </Alert>
          </div>
        ) : null}

        {canAllocate && candidateCount > 0 && hallCount === 0 ? (
          <div className="mt-3">
            <Alert tone="warning" title="No halls to seat them in">
              Add a hall below — the grid size decides how many seats it offers.
            </Alert>
          </div>
        ) : null}

        {isWorking && activeRun ? (
          <div className="reveal overflow-hidden">
            <div className="mt-3.5 flex items-center gap-2 text-[12.5px] text-ink-2">
              <LuLoaderCircle className="size-3.5 animate-spin text-ink-2" />
              <span className="font-medium">{activeRun.currentPhase ?? activeRun.status}</span>
              <span className="ml-auto font-mono text-[11.5px] text-ink-3">{activeRun.progressPercent}%</span>
            </div>
            <Progress value={activeRun.progressPercent} accent="var(--color-accent)" className="mt-2" />
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[var(--radius-pane)] bg-white/[0.035] shadow-[inset_0_1px_0_oklch(100%_0_0/.08),0_0_0_1px_var(--edge)]">
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-3">
          <h2 className="text-[13.5px] font-semibold">Run history</h2>
          <div className="flex-1" />
          <span className="font-mono text-[11px] text-ink-3">{runs.length} run{runs.length === 1 ? "" : "s"}</span>
        </div>

        {runs.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-ink-3">No runs yet.</div>
        ) : (
          <div className="divide-y divide-white/[0.055]">
            {runs.slice(0, 6).map((run) => (
              <div key={run.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3">
                <span className="text-[13px] font-medium">{run.strategy}</span>
                {run.seed ? (
                  <span className="rounded-[5px] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10.5px] text-ink-3">
                    seed {run.seed}
                  </span>
                ) : null}
                <StatusBadge status={run.status} />
                <span className="flex-1" />
                <span
                  className="font-mono text-[12px] tabular-nums"
                  style={{ color: run.bestViolationCount === 0 ? "var(--color-ok)" : "var(--color-danger)" }}
                >
                  {run.bestViolationCount} violation{run.bestViolationCount === 1 ? "" : "s"}
                </span>
                <span className="font-mono text-[12px] text-ink-2 tabular-nums">
                  {run.durationMs ? duration(run.durationMs) : "—"}
                </span>
                <span className="text-[11.5px] whitespace-nowrap text-ink-3">{dateTime(run.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
