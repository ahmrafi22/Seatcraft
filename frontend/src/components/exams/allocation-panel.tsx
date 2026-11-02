"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LuPlay, LuBan, LuCircleCheck, LuLoaderCircle } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/field";
import { duration, dateTime } from "@/lib/format";
import { cancelRunAction, startAllocationAction } from "@/app/actions/exam";
import type { AllocationRun, Strategy } from "@/lib/api/types";

const STRATEGIES: { value: Strategy; label: string; hint: string }[] = [
  { value: "Strict", label: "Strict", hint: "repair + random kicks" },
  { value: "Balanced", label: "Balanced", hint: "DSATUR ordering" },
  { value: "Greedy", label: "Greedy", hint: "naive baseline" }
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
        <div className="label-mono mb-2.5">Start a run</div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={strategy} onChange={(event) => setStrategy(event.target.value as Strategy)} width="auto" className="min-w-[190px]">
            {STRATEGIES.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label} — {entry.hint}
              </option>
            ))}
          </Select>
          <Button variant="primary" onClick={start} loading={pending || isWorking} disabled={!canAllocate || isWorking} icon={<LuPlay />}>
            Run allocation
          </Button>
          {isWorking ? (
            <Button variant="ghost" onClick={cancel} disabled={pending} icon={<LuBan />}>
              Cancel
            </Button>
          ) : null}
        </div>

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
