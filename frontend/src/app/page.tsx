import Link from "next/link";
import { LuPlus, LuArrowRight, LuChartLine } from "react-icons/lu";

import { Topbar } from "@/components/shell/topbar";
import { Hero } from "@/components/hero/hero";
import { Pane, PaneBody, PaneHead } from "@/components/ui/pane";
import { Stat } from "@/components/ui/stat";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { Alert } from "@/components/ui/alert";
import { MetricBar } from "@/components/ui/progress";
import { DemoLoginButton } from "@/components/auth/demo-login-button";
import { api } from "@/lib/api/client";
import { isDemoLoginEnabled } from "@/lib/demo";
import { getSession } from "@/lib/session";
import { duration, percent, shortDate } from "@/lib/format";
import { institutionColor } from "@/lib/colors";
import type { AllocationRun, Exam, SeatPlanDetail } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const demoEnabled = isDemoLoginEnabled();

  if (!session) {
    return (
      <>
        <Topbar crumbs={[{ label: "Dashboard" }]} right={<Badge kind="warning">Signed out</Badge>} />
        <main className="mx-auto w-full max-w-[720px] px-6 py-14">
          <Reveal>
            <h1 className="text-gradient text-[30px] font-semibold tracking-[-0.03em]">SeatCraft</h1>
            <p className="mt-2 mb-6 text-[14px] text-ink-2">
              Exam seat allocation and admit-card engine. Sign in with the demo tenant to see live data.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              {demoEnabled ? <DemoLoginButton enabled size="md" /> : null}
              <ButtonLink href="/login" variant={demoEnabled ? "default" : "primary"} iconRight={<LuArrowRight />}>
                Sign in
              </ButtonLink>
              <ButtonLink href="/lookup">Public seat lookup</ButtonLink>
            </div>
            {demoEnabled ? (
              <p className="mt-3 text-[12px] text-ink-3">
                The demo opens a seeded workspace: 500 candidates, 12 halls, one published plan.
              </p>
            ) : null}
          </Reveal>
        </main>
      </>
    );
  }

  const exams = await api<Exam[]>("/exams").catch(() => [] as Exam[]);
  const active = pickActive(exams);

  const [runs, plan] = active
    ? await Promise.all([
        api<AllocationRun[]>(`/exams/${active.id}/allocation-runs`).catch(() => [] as AllocationRun[]),
        active.activeSeatPlanId
          ? api<SeatPlanDetail>(`/exams/${active.id}/seat-plans/${active.activeSeatPlanId}`).catch(() => null)
          : Promise.resolve(null)
      ])
    : [[] as AllocationRun[], null];

  const assigned = plan?.assignments.length ?? 0;
  const violations = plan?.violations.length ?? 0;
  const blocking = plan?.violations.filter((v) => v.kind !== "RollOrderBroken").length ?? 0;
  const usableSeats = active ? Math.max(0, active.candidateCount) : 0;

  const institutions = (() => {
    if (!plan) return [] as { id: string; name: string; count: number }[];

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
      .sort((a, b) => b.count - a.count);
  })();

  return (
    <>
      <Topbar
        crumbs={[{ label: "Dashboard" }]}
        right={<Badge kind="success">{session.user.displayName}</Badge>}
      />

      <main className="mx-auto w-full max-w-[1280px] px-6 py-6">
        <Hero exam={active} />

        <Reveal delay={0.06}>
          <div className="mb-4 grid grid-cols-2 gap-3.5 xl:grid-cols-4">            <Stat
              label="Candidates"
              value={active?.candidateCount.toLocaleString() ?? "—"}
              foot={active ? `for ${active.title}` : "no exam yet"}
              accent="var(--color-teal)"
            />
            <Stat
              label="Seats assigned"
              value={assigned.toLocaleString()}
              suffix={active ? `/ ${usableSeats.toLocaleString()}` : undefined}
              foot={active ? `${percent(assigned, usableSeats)}% placed` : "run an allocation"}
              accent="var(--color-sky)"
            />
            <Stat
              label="Halls"
              value={active?.hallCount ?? "—"}
              foot={active ? `${exams.length} exam${exams.length === 1 ? "" : "s"} on record` : "—"}
              accent="var(--color-emerald)"
            />
            <Stat
              label="Blocking violations"
              value={blocking}
              foot={blocking === 0 ? "plan is publishable" : "resolve before publishing"}
              accent={blocking === 0 ? "var(--color-emerald)" : "var(--color-danger)"}
            />
          </div>
        </Reveal>

        {!active ? (
          <Reveal delay={0.1}>
            <Alert tone="info" title="No exam yet" icon={<LuPlus />}>
              Create an exam, or seed a demo tenant with 500 candidates in one click.
              <div className="mt-3 flex gap-2">
                <ButtonLink href="/exams" size="sm" variant="primary">
                  Go to exams
                </ButtonLink>
              </div>
            </Alert>
          </Reveal>
        ) : (
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <Reveal delay={0.1}>
                <Pane>
                  <PaneHead
                    title="Recent allocation runs"
                    hint={`${runs.length} run${runs.length === 1 ? "" : "s"}`}
                    action={
                      <ButtonLink href={`/exams/${active.id}`} size="sm" variant="ghost" iconRight={<LuArrowRight />}>
                        Open
                      </ButtonLink>
                    }
                  />
                  {runs.length === 0 ? (
                    <PaneBody>
                      <div className="py-8 text-center text-[13px] text-ink-3">
                        No runs yet. Start one from the exam page.
                      </div>
                    </PaneBody>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="border-b border-white/[0.07] bg-white/[0.035]">
                            {["Strategy", "Status", "Violations", "Duration", "Started"].map((head) => (
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
                          {runs.slice(0, 6).map((run) => (
                            <tr
                              key={run.id}
                              className="border-b border-white/[0.055] transition-colors last:border-0 hover:bg-white/[0.045]"
                            >
                              <td className="px-4 py-3">
                                <span className="font-medium">{run.strategy}</span>
                                <span className="ml-2 rounded-[5px] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-ink-3 shadow-[inset_0_0_0_1px_oklch(100%_0_0/.07)]">
                                  seed {run.seed}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={run.status} />
                              </td>
                              <td
                                className="px-4 py-3 font-mono tabular-nums"
                                style={{ color: run.bestViolationCount === 0 ? "var(--color-emerald)" : "var(--color-danger)" }}
                              >
                                {run.bestViolationCount}
                              </td>
                              <td className="px-4 py-3 font-mono text-ink-2 tabular-nums">{duration(run.durationMs)}</td>
                              <td className="px-4 py-3 text-[12.5px] whitespace-nowrap text-ink-3">{shortDate(run.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Pane>
              </Reveal>

              {/* Institution spread — the colour story of the whole plan. */}
              {institutions.length > 0 ? (
                <Reveal delay={0.16}>
                  <Pane>
                    <PaneHead
                      title="Institution spread"
                      hint={`${institutions.length} colleges`}
                      action={
                        <Badge kind={spreadBalanced(institutions) ? "success" : "neutral"} dot={false}>
                          {spreadBalanced(institutions) ? "balanced" : "uneven"}
                        </Badge>
                      }
                    />
                    <PaneBody>
                      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                        {institutions.slice(0, 10).map((entry) => (
                          <MetricBar
                            key={entry.id}
                            label={entry.name}
                            value={entry.count}
                            max={Math.max(...institutions.map((row) => row.count))}
                            accent={institutionColor(entry.id)}
                            suffix={`${entry.count}`}
                          />
                        ))}
                      </div>
                      {institutions.length > 10 ? (
                        <div className="mt-3 text-[12px] text-ink-3">+ {institutions.length - 10} more colleges</div>
                      ) : null}
                    </PaneBody>
                  </Pane>
                </Reveal>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <Reveal delay={0.14}>
                <Pane>
                  <PaneHead title="Current exam" action={<StatusBadge status={active.status} />} />
                  <PaneBody>
                    <div className="text-[17px] font-semibold tracking-[-0.02em]">{active.title}</div>
                    <div className="mt-0.5 text-[12.5px] text-ink-3">{active.description ?? "No description"}</div>

                    <div className="my-4 h-px bg-white/[0.07]" />

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <div className="label-mono">Candidates</div>
                        <div className="mt-0.5 text-[20px] font-semibold tracking-[-0.02em] tabular-nums">
                          {active.candidateCount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="label-mono">Halls</div>
                        <div className="mt-0.5 text-[20px] font-semibold tracking-[-0.02em] tabular-nums">{active.hallCount}</div>
                      </div>
                    </div>

                    <div className="my-4 h-px bg-white/[0.07]" />

                    <div className="flex flex-wrap gap-2">
                      <ButtonLink href={`/exams/${active.id}`} size="sm">
                        Exam setup
                      </ButtonLink>
                      <ButtonLink href={`/exams/${active.id}/plan`} size="sm" variant="primary">
                        Seat planner
                      </ButtonLink>
                      <ButtonLink href="/lookup" size="sm" variant="ghost">
                        Public lookup
                      </ButtonLink>
                    </div>
                  </PaneBody>
                </Pane>
              </Reveal>

              <Reveal delay={0.18}>
                <Pane>
                  <PaneHead
                    title="Constraint rules"
                    action={
                      <Badge kind={allRulesOn(active) ? "success" : "neutral"} dot={false}>
                        {countRules(active)} / 4 enabled
                      </Badge>
                    }
                  />
                  <PaneBody className="py-1">
                    {RULES.map(({ key, label, hint }) => (
                      <div
                        key={key}
                        className="flex items-start gap-3 border-b border-white/[0.06] py-3 last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-medium">{label}</div>
                          <div className="mt-0.5 text-[12.5px] text-ink-3">{hint}</div>
                        </div>
                        <Badge kind={active.constraints[key] ? "success" : "neutral"} dot={false}>
                          {active.constraints[key] ? "on" : "off"}
                        </Badge>
                      </div>
                    ))}
                  </PaneBody>
                </Pane>
              </Reveal>
            </div>
          </div>
        )}

        {plan && violations > 0 ? (
          <Reveal delay={0.22}>
            <Alert tone={blocking > 0 ? "danger" : "warning"} className="mt-4" icon={<LuChartLine />} title="Plan needs attention">
              {violations} violation{violations === 1 ? "" : "s"} detected, {blocking} of them blocking.{" "}
              <Link href={`/exams/${active?.id}/plan`} className="underline underline-offset-2">
                Open the planner
              </Link>
              .
            </Alert>
          </Reveal>
        ) : null}
      </main>
    </>
  );
}

const RULES = [
  { key: "preventSameInstitutionAdjacent" as const, label: "No same institution adjacent", hint: "Two candidates from one college may never sit side by side." },
  { key: "keepSubjectGroupContiguous" as const, label: "Keep subject groups contiguous", hint: "Candidates sitting the same paper stay in one block." },
  { key: "maintainRollOrder" as const, label: "Maintain roll order", hint: "Seats roughly follow roll order so attendance is quick." },
  { key: "allowHallSkipping" as const, label: "Allow hall skipping", hint: "The solver may leave a hall partly empty to satisfy a rule." }
];

function pickActive(exams: Exam[]): Exam | null {
  const rank = (exam: Exam) => (exam.status === "Published" ? 0 : exam.status === "Allocated" ? 1 : exam.status === "Archived" ? 3 : 2);
  return [...exams].sort((a, b) => rank(a) - rank(b) || +new Date(b.createdAt) - +new Date(a.createdAt))[0] ?? null;
}

function countRules(exam: Exam): number {
  return RULES.filter(({ key }) => exam.constraints[key]).length;
}

function allRulesOn(exam: Exam): boolean {
  return countRules(exam) === RULES.length;
}

/** A spread is "balanced" when the busiest college is no more than one candidate above the quietest. */
function spreadBalanced(institutions: { count: number }[]): boolean {
  if (institutions.length === 0) return true;

  const counts = institutions.map((entry) => entry.count);
  return Math.max(...counts) - Math.min(...counts) <= 1;
}
