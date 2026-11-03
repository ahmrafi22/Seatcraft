import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Topbar } from "@/components/shell/topbar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { PlannerShell } from "@/components/planner/planner-shell";
import { api } from "@/lib/api/client";
import { getSession } from "@/lib/session";
import type { Exam, Hall, SeatPlanDetail } from "@/lib/api/types";

export const metadata: Metadata = { title: "Seat planner" };
export const dynamic = "force-dynamic";

export default async function PlanPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const session = await getSession();

  if (!session) notFound();

  const exam = await api<Exam>(`/exams/${examId}`).catch(() => null);
  if (!exam) notFound();

  const [halls, runs] = await Promise.all([
    api<Hall[]>(`/exams/${examId}/halls`).catch(() => [] as Hall[]),
    api<{ resultSeatPlanId: string | null; status: string; createdAt: string }[]>(`/exams/${examId}/allocation-runs`).catch(() => [])
  ]);

  const planId = exam.activeSeatPlanId ?? runs.find((run) => run.resultSeatPlanId && run.status === "Completed")?.resultSeatPlanId ?? null;

  const plan = planId ? await api<SeatPlanDetail>(`/exams/${examId}/seat-plans/${planId}`).catch(() => null) : null;

  // Open on the hall that actually holds candidates. `halls[0]` is often an
  // Auditorium that the solver never filled, which reads as a blank, colourless
  // board even though the plan is fine.
  const seatCountByHall = new Map<string, number>();

  for (const assignment of plan?.assignments ?? []) {
    seatCountByHall.set(assignment.hallId, (seatCountByHall.get(assignment.hallId) ?? 0) + 1);
  }

  const initialHallId =
    [...halls].sort((a, b) => (seatCountByHall.get(b.id) ?? 0) - (seatCountByHall.get(a.id) ?? 0))[0]?.id ?? null;

  return (
    <>
      <Topbar
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Exams", href: "/exams" },
          { label: exam.title, href: `/exams/${examId}` },
          { label: "Seat planner" }
        ]}
        right={
          <div className="flex items-center gap-2">
            <Badge kind="neutral" dot={false}>
              {halls.length} hall{halls.length === 1 ? "" : "s"}
            </Badge>
            <StatusBadge status={exam.status} />
          </div>
        }
      />

      <main className="mx-auto w-full max-w-[1280px] px-6 py-6">
        <div className="mb-5 flex flex-wrap items-start gap-4">
          <div className="min-w-[220px] flex-1">
            <div className="label-mono">Hall visualiser</div>
            <h1 className="mt-1.5 text-[27px] font-semibold tracking-[-0.025em]">Seat planner</h1>
            <p className="mt-1 text-[13.5px] text-ink-3">
              Drag a seat onto another to swap them. Every swap is validated by the backend before it is saved.
            </p>
          </div>
        </div>

        {plan ? (
          <PlannerShell exam={exam} halls={halls} plan={plan} initialHallId={initialHallId} />
        ) : (
          <div className="glass-pane rounded-[var(--radius-pane)] px-6 py-16 text-center">
            <div className="text-[15px] font-medium">No seat plan yet</div>
            <p className="mx-auto mt-1.5 max-w-[42ch] text-[13px] text-ink-3">
              Run an allocation for this exam first. The planner opens the newest completed run automatically.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
