import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LuArrowRight, LuArmchair, LuBuilding2 } from "react-icons/lu";

import { Topbar } from "@/components/shell/topbar";
import { Pane, PaneBody, PaneHead } from "@/components/ui/pane";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { AllocationPanel } from "@/components/exams/allocation-panel";
import { ConstraintEditor } from "@/components/exams/constraint-editor";
import { AddHallForm } from "@/components/exams/add-hall-form";
import { AddCandidateForm } from "@/components/exams/add-candidate-form";
import { ImportCandidatesForm } from "@/components/exams/import-candidates-form";
import { DownloadCsvTemplate } from "@/components/exams/download-csv-template";
import { DeleteExamButton } from "@/components/exams/delete-exam-button";
import { api } from "@/lib/api/client";
import { getSession } from "@/lib/session";
import { shortDate } from "@/lib/format";
import type { AllocationRun, Candidate, Exam, Hall, Institution, Paged, SeatPlanDetail } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ examId: string }> }): Promise<Metadata> {
  const { examId } = await params;

  try {
    const exam = await api<Exam>(`/exams/${examId}`);
    return { title: exam.title };
  } catch {
    return { title: "Exam" };
  }
}

export default async function ExamDetailPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const session = await getSession();

  if (!session) notFound();

  const exam = await api<Exam>(`/exams/${examId}`).catch(() => null);
  if (!exam) notFound();

  const [runs, halls, candidates, plan, institutions] = await Promise.all([
    api<AllocationRun[]>(`/exams/${examId}/allocation-runs`).catch(() => [] as AllocationRun[]),
    api<Hall[]>(`/exams/${examId}/halls`).catch(() => [] as Hall[]),
    api<Paged<Candidate>>(`/exams/${examId}/candidates?page=1&pageSize=8`).catch(() => null),
    exam.activeSeatPlanId
      ? api<SeatPlanDetail>(`/exams/${examId}/seat-plans/${exam.activeSeatPlanId}`).catch(() => null)
      : Promise.resolve(null),
    api<Institution[]>("/institutions").catch(() => [] as Institution[])
  ]);

  const blocking = plan?.violations.filter((violation) => violation.kind !== "RollOrderBroken").length ?? 0;

  return (
    <>
      <Topbar
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Exams", href: "/exams" }, { label: exam.title }]}
        right={<StatusBadge status={exam.status} />}
      />

      <main className="mx-auto w-full max-w-[1280px] px-6 py-6">
        <div className="mb-5 flex flex-wrap items-start gap-4">
          <div className="min-w-[220px] flex-1">
            <div className="label-mono">Exam setup</div>
            <h1 className="mt-1.5 text-[27px] font-semibold tracking-[-0.025em]">{exam.title}</h1>
            <p className="mt-1 text-[13.5px] text-ink-3">
              {exam.description ?? "No description"} · created {shortDate(exam.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {exam.activeSeatPlanId ? (
              <ButtonLink href={`/exams/${exam.id}/plan`} variant="primary" icon={<LuArmchair />} iconRight={<LuArrowRight />}>
                Open seat planner
              </ButtonLink>
            ) : null}
            <ButtonLink href="/lookup" variant="ghost">
              Public lookup
            </ButtonLink>
            <DeleteExamButton examId={exam.id} examTitle={exam.title} />
          </div>
        </div>

        <Reveal>
          <div className="mb-4 grid grid-cols-2 gap-3.5 xl:grid-cols-4">
            <MiniStat label="Candidates" value={exam.candidateCount.toLocaleString()} accent="var(--color-teal)" />
            <MiniStat label="Halls" value={exam.hallCount} accent="var(--color-sky)" />
            <MiniStat label="Runs" value={runs.length} accent="var(--color-emerald)" />
            <MiniStat
              label="Blocking violations"
              value={blocking}
              accent={blocking === 0 ? "var(--color-emerald)" : "var(--color-danger)"}
            />
          </div>
        </Reveal>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <Reveal delay={0.06}>
              <div>
                <AllocationPanel
                  examId={exam.id}
                  runs={runs}
                  canAllocate={exam.status !== "Published" && exam.status !== "Archived"}
                  candidateCount={exam.candidateCount}
                  hallCount={halls.length}
                />
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <Pane>
                <PaneHead
                  title="Halls"
                  hint={`${halls.length}`}
                  action={<Badge kind="neutral" dot={false}>{halls.reduce((total, hall) => total + hall.usableCapacity, 0)} usable</Badge>}
                />
                {halls.length === 0 ? (
                  <PaneBody>
                    <div className="py-6 text-center text-[13px] text-ink-3">
                      No halls yet. Add one below — the grid size sets how many seats it offers.
                    </div>
                  </PaneBody>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-white/[0.07] bg-white/[0.035]">
                          {["Hall", "Grid", "Capacity", "Blocked", "Usable"].map((head) => (
                            <th
                              key={head}
                              className="px-4 py-2.5 text-left font-mono text-[10px] font-medium tracking-[0.12em] text-ink-3 uppercase whitespace-nowrap"
                            >
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {halls.map((hall) => (
                          <tr key={hall.id} className="border-b border-white/[0.055] last:border-0 hover:bg-white/[0.045]">
                            <td className="px-4 py-3 font-medium">{hall.name}</td>
                            <td className="px-4 py-3 font-mono text-ink-2">
                              {hall.rows} × {hall.columns}
                            </td>
                            <td className="px-4 py-3 font-mono text-ink-2 tabular-nums">{hall.capacity}</td>
                            <td className="px-4 py-3 font-mono text-ink-2 tabular-nums">{hall.blockedSeats.length}</td>
                            <td className="px-4 py-3 font-mono font-semibold text-ink tabular-nums">{hall.usableCapacity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Pane>
            </Reveal>

            <Reveal delay={0.12}>
              <Pane>
                <PaneHead title="Add a hall" hint="grid size = seats" />
                <PaneBody>
                  <AddHallForm examId={exam.id} nextIndex={halls.length + 1} />
                </PaneBody>
              </Pane>
            </Reveal>

            <Reveal delay={0.14}>
              <Pane>
                <PaneHead
                  title="Candidates"
                  hint={candidates ? `${candidates.totalCount.toLocaleString()} total` : undefined}
                  action={<Badge kind="neutral" dot={false}>first 8</Badge>}
                />
                {!candidates || candidates.items.length === 0 ? (
                  <PaneBody>
                    <div className="py-6 text-center text-[13px] text-ink-3">
                      No candidates yet. Add one below, or import a CSV.
                    </div>
                  </PaneBody>
                ) : (
                  <div className="divide-y divide-white/[0.055]">
                    {candidates.items.map((candidate) => (
                      <div key={candidate.id} className="flex items-center gap-2.5 px-4 py-2.5">
                        <span className="shrink-0 rounded-[5px] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-ink-2 shadow-[inset_0_0_0_1px_oklch(100%_0_0/.07)]">
                          {candidate.roll}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{candidate.fullName}</span>
                        <span className="shrink-0 text-[11.5px] text-ink-3">{candidate.subjectGroup}</span>
                      </div>
                    ))}
                  </div>
                )}
                <PaneBody className="border-t border-white/[0.07]">
                  <AddCandidateForm examId={exam.id} institutions={institutions} />
                </PaneBody>
                <PaneBody className="border-t border-white/[0.07]">
                  <ImportCandidatesForm examId={exam.id} />
                  <div className="mt-2">
                    <DownloadCsvTemplate institutions={institutions} />
                  </div>
                </PaneBody>
              </Pane>
            </Reveal>
          </div>

          <div className="flex flex-col gap-4">
            <Reveal delay={0.08}>
              <Pane>
                <PaneHead title="Constraint rules" action={<Badge kind="primary" dot={false}>live</Badge>} />
                <PaneBody className="py-1">
                  <ConstraintEditor examId={exam.id} constraints={exam.constraints} />
                </PaneBody>
              </Pane>
            </Reveal>

            {plan ? (
              <Reveal delay={0.12}>
                <Pane>
                  <PaneHead title="Active seat plan" action={<StatusBadge status={plan.status} />} />
                  <PaneBody>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <div className="label-mono">Assignments</div>
                        <div className="mt-0.5 text-[20px] font-semibold tabular-nums">{plan.assignments.length}</div>
                      </div>
                      <div>
                        <div className="label-mono">Violations</div>
                        <div
                          className="mt-0.5 text-[20px] font-semibold tabular-nums"
                          style={{ color: blocking === 0 ? "var(--color-emerald)" : "var(--color-danger)" }}
                        >
                          {plan.violations.length}
                        </div>
                      </div>
                    </div>

                    <div className="my-4 h-px bg-white/[0.07]" />

                    <ButtonLink href={`/exams/${exam.id}/plan`} variant="default" className="w-full" iconRight={<LuArrowRight />}>
                      Open planner
                    </ButtonLink>
                  </PaneBody>
                </Pane>
              </Reveal>
            ) : (
              <Reveal delay={0.12}>
                <Pane>
                  <PaneBody>
                    <div className="text-[13px] text-ink-3">
                      No seat plan yet. Run an allocation to create one.
                    </div>
                  </PaneBody>
                </Pane>
              </Reveal>
            )}

            <Reveal delay={0.16}>
              <Pane>
                <PaneHead title="Colleges" hint={`${institutions.length}`} />
                <PaneBody>
                  <p className="text-[13px] text-ink-2">
                    Candidates pick a college when you add them. Manage the list on the colleges page.
                  </p>
                  <ButtonLink href="/colleges" variant="default" className="mt-3 w-full" icon={<LuBuilding2 />}>
                    Manage colleges
                  </ButtonLink>
                </PaneBody>
              </Pane>
            </Reveal>
          </div>
        </div>
      </main>
    </>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="glass-pane relative overflow-hidden rounded-[var(--radius-pane)] px-4 py-3.5 sm:px-[18px] sm:py-[15px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[30%] -bottom-[70%] size-[160px] rounded-full blur-[18px]"
        style={{ background: `radial-gradient(circle, color-mix(in oklch, ${accent} 40%, transparent), transparent 70%)` }}
      />
      <div className="relative">
        <div className="label-mono">{label}</div>
        <div
          className="mt-1 text-[21px] font-semibold tracking-[-0.03em] tabular-nums sm:text-[24px]"
          style={{ color: `color-mix(in oklch, ${accent} 88%, white)` }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
