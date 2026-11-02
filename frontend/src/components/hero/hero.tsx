import { LuArrowRight } from "react-icons/lu";

import { MiniHall, HueDots } from "@/components/hero/mini-hall";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import type { Exam } from "@/lib/api/types";

export function Hero({ exam }: { exam: Exam | null }) {
  return (
    <Reveal>
      <section className="relative mb-4 grid items-center gap-7 overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,oklch(70%_.13_192/.18),oklch(74%_.12_225/.06)_45%,oklch(68%_.15_162/.13))] p-8 shadow-[inset_0_1px_0_oklch(100%_0_0/.22),0_0_0_1px_oklch(100%_0_0/.09),0_30px_60px_-40px_oklch(62%_.14_205/.9)] backdrop-blur-[26px] lg:grid-cols-[1.15fr_0.85fr]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-[40%] -left-[20%] h-[130%] w-[70%] bg-[radial-gradient(closest-side,oklch(70%_.14_196/.30),transparent)] blur-[30px]"
        />

        <div className="relative">
          <div className="label-mono">Exam season 2026 · Karwan Bazar</div>

          <h1 className="text-gradient mt-3 text-[34px] leading-[1.14] font-semibold tracking-[-0.035em]">
            Every candidate
            <br />
            in the right seat.
          </h1>

          <p className="mt-3 mb-5 max-w-[46ch] text-[14px] text-ink-2">
            {exam
              ? `Currently working on “${exam.title}” — ${exam.candidateCount.toLocaleString()} candidates across ${exam.hallCount} halls.`
              : "Lay out halls, spread institutions apart and publish a plan candidates can look up."}
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <ButtonLink
              href={exam ? `/exams/${exam.id}` : "/exams"}
              variant="primary"
              className="group"
              iconRight={<LuArrowRight className="transition-transform group-hover:translate-x-0.5" />}
            >
              Open seat planner
            </ButtonLink>
            <ButtonLink href="/exams">Exam setup</ButtonLink>
          </div>

          <div className="mt-7 grid max-w-[420px] grid-cols-3 gap-4 border-t border-white/10 pt-5">
            {[
              { label: "Solver", value: "3 strategies" },
              { label: "Rule", value: "No same college" },
              { label: "Lookup", value: "Public portal" }
            ].map((item) => (
              <div key={item.label}>
                <div className="label-mono">{item.label}</div>
                <div className="mt-1 text-[13px] font-medium text-ink">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex flex-col gap-2.5">
          <div className="rounded-[var(--radius-ctl)] bg-[oklch(0%_0_0/.28)] p-4 shadow-[inset_0_1px_0_oklch(100%_0_0/.08),0_0_0_1px_oklch(100%_0_0/.08)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-[0.08em] text-ink-3 uppercase">Hall A · 8 × 9</span>
              <HueDots codes={["A", "B", "C", "D", "E", "F"]} />
            </div>
            <MiniHall rows={8} columns={9} seed={11} />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Halls", value: exam ? String(exam.hallCount) : "—", hue: 232 },
              { label: "Candidates", value: exam ? exam.candidateCount.toLocaleString() : "—", hue: 162 },
              { label: "Status", value: exam ? exam.status : "—", hue: 192 }
            ].map((chip) => (
              <div
                key={chip.label}
                className="rounded-[var(--radius-ctl)] bg-[oklch(0%_0_0/.28)] px-3 py-2.5 shadow-[inset_0_1px_0_oklch(100%_0_0/.08),0_0_0_1px_oklch(100%_0_0/.08)]"
              >
                <div className="font-mono text-[9.5px] tracking-[0.12em] text-ink-3 uppercase">{chip.label}</div>
                <div
                  className="mt-0.5 truncate text-[15px] font-semibold tracking-[-0.02em] tabular-nums"
                  style={{ color: `color-mix(in oklch, oklch(74% .17 ${chip.hue}) 88%, white)` }}
                >
                  {chip.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
