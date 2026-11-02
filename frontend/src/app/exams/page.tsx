import Link from "next/link";
import type { Metadata } from "next";
import { LuArrowRight, LuListChecks } from "react-icons/lu";

import { Topbar } from "@/components/shell/topbar";
import { Pane, PaneBody, PaneHead } from "@/components/ui/pane";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { CreateExamForm } from "@/components/exams/create-exam-form";
import { SeedDemoForm } from "@/components/exams/seed-demo-form";
import { api } from "@/lib/api/client";
import { getSession } from "@/lib/session";
import { shortDate } from "@/lib/format";
import type { Exam } from "@/lib/api/types";

export const metadata: Metadata = { title: "Exams" };
export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const session = await getSession();
  const exams = session ? await api<Exam[]>("/exams").catch(() => [] as Exam[]) : [];

  return (
    <>
      <Topbar
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Exams" }]}
        right={<Badge kind="neutral" dot={false}>{exams.length} total</Badge>}
      />

      <main className="mx-auto w-full max-w-[1280px] px-6 py-6">
        <div className="mb-5 flex flex-wrap items-start gap-4">
          <div className="min-w-[220px] flex-1">
            <div className="label-mono">Exam setup</div>
            <h1 className="mt-1.5 text-[27px] font-semibold tracking-[-0.025em]">Exams</h1>
            <p className="mt-1 text-[13.5px] text-ink-3">Every exam, its state and how far its allocation has got.</p>
          </div>
          <ButtonLink href="/lookup" variant="ghost" size="md">
            Public lookup
          </ButtonLink>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Reveal>
            <Pane>
              <PaneHead title="All exams" hint={`${exams.length}`} />
              {exams.length === 0 ? (
                <PaneBody>
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <LuListChecks className="size-9 text-ink-3 opacity-40" />
                    <div className="text-[13.5px] text-ink-3">No exams yet. Create one on the right.</div>
                  </div>
                </PaneBody>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-white/[0.07] bg-white/[0.035]">
                        {["Title", "Status", "Candidates", "Halls", "Created", ""].map((head) => (
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
                      {exams.map((exam) => (
                        <tr
                          key={exam.id}
                          className="border-b border-white/[0.055] transition-colors last:border-0 hover:bg-white/[0.045]"
                        >
                          <td className="px-4 py-3">
                            <Link href={`/exams/${exam.id}`} className="font-medium hover:underline hover:underline-offset-2">
                              {exam.title}
                            </Link>
                            {exam.description ? (
                              <div className="mt-0.5 max-w-[38ch] truncate text-[11.5px] text-ink-3">{exam.description}</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={exam.status} />
                          </td>
                          <td className="px-4 py-3 font-mono text-ink-2 tabular-nums">{exam.candidateCount.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-ink-2 tabular-nums">{exam.hallCount}</td>
                          <td className="px-4 py-3 text-[12.5px] whitespace-nowrap text-ink-3">{shortDate(exam.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/exams/${exam.id}`}
                              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-2 hover:text-ink hover:underline hover:underline-offset-2"
                            >
                              Open <LuArrowRight className="size-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Pane>
          </Reveal>

          <div className="flex flex-col gap-4">
            <Reveal delay={0.06}>
              <Pane>
                <PaneHead title="New exam" />
                <PaneBody>
                  <CreateExamForm />
                </PaneBody>
              </Pane>
            </Reveal>

            <Reveal delay={0.12}>
              <Pane>
                <PaneHead title="Demo data" hint="dev only" />
                <PaneBody>
                  <SeedDemoForm />
                </PaneBody>
              </Pane>
            </Reveal>
          </div>
        </div>
      </main>
    </>
  );
}
