import type { Metadata } from "next";
import Link from "next/link";
import {
  LuArrowRight,
  LuArmchair,
  LuBuilding2,
  LuCalendarDays,
  LuFileText,
  LuLayoutGrid,
  LuSearch,
  LuShieldCheck,
  LuTimer
} from "react-icons/lu";

import { ButtonLink } from "@/components/ui/button";
import { DemoLoginButton } from "@/components/auth/demo-login-button";
import { SeatDemo } from "@/components/landing/seat-demo";
import { Reveal } from "@/components/motion/reveal";
import { isDemoLoginEnabled } from "@/lib/demo";

export const metadata: Metadata = {
  title: "SeatCraft — exam seat allocation, solved",
  description:
    "SeatCraft places every candidate in a hall without seating two from the same college together, then issues admit cards and a public seat lookup."
};

export default function LandingPage() {
  const demoEnabled = isDemoLoginEnabled();

  return (
    <div className="min-h-dvh overflow-x-clip">
      <Header demoEnabled={demoEnabled} />

      <main className="mx-auto w-full max-w-[1180px] px-6">
        <Hero demoEnabled={demoEnabled} />
        <Rule />
        <Flow />
        <Facts />
        <Close demoEnabled={demoEnabled} />
      </main>

      <Footer />
    </div>
  );
}

function Header({ demoEnabled }: { demoEnabled: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[oklch(13%_0_0/.7)] backdrop-blur-[26px] backdrop-saturate-150">
      <div className="mx-auto flex h-[60px] w-full max-w-[1180px] items-center gap-3 px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-[30px] place-items-center rounded-[9px] bg-[linear-gradient(140deg,oklch(96%_0_0),oklch(74%_0_0)_60%,oklch(56%_0_0))] shadow-[inset_0_1px_0_oklch(100%_0_0/.45),0_0_0_1px_oklch(100%_0_0/.14),0_8px_18px_-8px_oklch(0%_0_0/.9)]">
            <LuArmchair className="size-[15px] text-[oklch(18%_0_0)]" />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em]">SeatCraft</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-5 text-[13px] text-ink-3 md:flex">
          <a href="#how" className="transition-colors hover:text-ink">
            How it works
          </a>
          <Link href="/lookup" className="transition-colors hover:text-ink">
            Seat lookup
          </Link>
        </nav>

        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <Link
            href="/login"
            className="hidden h-9 items-center rounded-[var(--radius-ctl)] px-3 text-[13px] font-medium text-ink-2 transition-colors hover:bg-white/[0.07] hover:text-ink sm:inline-flex"
          >
            Sign in
          </Link>
          {demoEnabled ? (
            <DemoLoginButton enabled size="sm" />
          ) : (
            <ButtonLink href="/signup" size="sm" variant="primary" iconRight={<LuArrowRight />}>
              Create workspace
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero({ demoEnabled }: { demoEnabled: boolean }) {
  return (
    <section className="grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12 lg:py-20">
      <Reveal>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 shadow-[inset_0_0_0_1px_oklch(100%_0_0/.12)]">
          <span className="size-1.5 rounded-full bg-[oklch(78%_0_0)] shadow-[0_0_10px_oklch(100%_0_0/.9)]" />
          <span className="font-mono text-[10.5px] tracking-[0.1em] text-ink-2 uppercase">
            Constraint solver · .NET 9
          </span>
        </div>

        <h1 className="text-gradient mt-5 text-[clamp(34px,5.2vw,54px)] leading-[1.06] font-semibold tracking-[-0.04em]">
          Every candidate
          <br />
          in the right seat.
        </h1>

        <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">
          SeatCraft lays out exam halls so no two students from the same college ever sit
          side by side — then issues signed admit cards and a public seat lookup from the
          same plan.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-2.5">
          {demoEnabled ? (
            <DemoLoginButton enabled size="lg" />
          ) : (
            <ButtonLink href="/signup" size="lg" variant="primary" iconRight={<LuArrowRight />}>
              Create a workspace
            </ButtonLink>
          )}
          <ButtonLink href="/lookup" size="lg" icon={<LuSearch />}>
            Find a seat
          </ButtonLink>
        </div>

        <p className="mt-3 text-[12.5px] text-ink-3">
          {demoEnabled
            ? "The demo opens a seeded workspace: 500 candidates, 12 halls, one published plan."
            : "No card, no sales call. Sign up and run your first allocation in a minute."}
        </p>

        <div className="mt-9 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/[0.08] pt-6">
          {[
            { label: "Solver", value: "3 strategies" },
            { label: "Hard rule", value: "No same college" },
            { label: "Output", value: "PDF + lookup" }
          ].map((item) => (
            <div key={item.label}>
              <div className="label-mono">{item.label}</div>
              <div className="mt-1 text-[13.5px] font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-8 -z-10 rounded-[36px] bg-[radial-gradient(closest-side,oklch(100%_0_0/.09),transparent)] blur-2xl"
          />
          <SeatDemo />
          <p className="mt-3 text-center font-mono text-[11px] text-ink-3">
            The flagged seat moves to the free one — the conflict clears.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

const STEPS = [
  {
    Icon: LuBuilding2,
    title: "Add halls and candidates",
    body: "Type them in, or import a CSV with roll, name, college and subject group. Every college keeps its own colour across the whole board.",
    aside: "CSV import · 500 rows in a second"
  },
  {
    Icon: LuTimer,
    title: "Run the solver",
    body: "Three strategies, strict by default. The strict pass places everyone, then repairs what it can — swapping and relocating until no two neighbours share a college.",
    aside: "5,000 candidates · 40 halls · 83 ms"
  },
  {
    Icon: LuLayoutGrid,
    title: "Adjust by hand",
    body: "Drag any seat to swap two candidates or move one into a free seat. Violations stay marked, and the plan refuses to publish while a blocking one remains.",
    aside: "Live re-check on every move"
  },
  {
    Icon: LuFileText,
    title: "Publish the documents",
    body: "Admit cards and attendance sheets render as A5 PDFs behind signed links, and candidates look up their own seat with a roll number and date of birth.",
    aside: "HMAC-signed · 500 cards as one zip"
  }
] as const;

function Rule() {
  return (
    <Reveal>
      <section className="rounded-[var(--radius-pane)] bg-[linear-gradient(140deg,oklch(100%_0_0/.08),oklch(100%_0_0/.02))] p-7 shadow-[inset_0_1px_0_oklch(100%_0_0/.16),0_0_0_1px_oklch(100%_0_0/.08)] sm:p-9">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="label-mono">The hard part</div>
            <h2 className="mt-3 max-w-[26ch] text-[clamp(22px,3vw,30px)] leading-[1.15] font-semibold tracking-[-0.03em]">
              Two students from one college, side by side, is a cheating risk.
            </h2>
            <p className="mt-3 max-w-[58ch] text-[14px] leading-relaxed text-ink-2">
              Exam boards call it an adjacency violation. It is easy to describe and hard
              to satisfy once a few large colleges dominate the roster — a greedy pass
              paints itself into a corner and leaves conflicts it can never undo.
            </p>
          </div>

          <div className="flex gap-3">
            {[
              { value: "0", label: "adjacent pairs", tone: "ok" },
              { value: "3", label: "strategies", tone: "muted" }
            ].map((stat) => (
              <div
                key={stat.label}
                className="min-w-[112px] rounded-[var(--radius-ctl)] bg-[oklch(0%_0_0/.3)] px-4 py-3.5 shadow-[inset_0_1px_0_oklch(100%_0_0/.08),0_0_0_1px_oklch(100%_0_0/.08)]"
              >
                <div
                  className="text-[26px] font-semibold tracking-[-0.03em] tabular-nums"
                  style={{ color: stat.tone === "ok" ? "var(--color-ink)" : "var(--color-ink-2)" }}
                >
                  {stat.value}
                </div>
                <div className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function Flow() {
  return (
    <section id="how" className="scroll-mt-24 py-16 lg:py-20">
      <Reveal>
        <div className="label-mono">How it works</div>
        <h2 className="mt-3 max-w-[30ch] text-[clamp(24px,3.4vw,34px)] leading-[1.12] font-semibold tracking-[-0.03em]">
          Four steps from a roster to a seat plan people trust.
        </h2>
      </Reveal>

      <ol className="mt-9 grid gap-4 md:grid-cols-2">
        {STEPS.map((step, index) => (
          <Reveal key={step.title} delay={0.06 * index}>
            <li className="glass-pane h-full rounded-[var(--radius-pane)] p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 flex-none place-items-center rounded-[10px] bg-white/[0.08] shadow-[inset_0_1px_0_oklch(100%_0_0/.16),0_0_0_1px_oklch(100%_0_0/.1)]">
                  <step.Icon className="size-[15px] text-ink" />
                </span>
                <span className="font-mono text-[11px] tracking-[0.14em] text-ink-3">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.02em]">{step.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{step.body}</p>

              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 font-mono text-[10.5px] text-ink-3 shadow-[inset_0_0_0_1px_oklch(100%_0_0/.08)]">
                <LuShieldCheck className="size-3" />
                {step.aside}
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function Facts() {
  return (
    <Reveal>
      <section className="grid gap-px overflow-hidden rounded-[var(--radius-pane)] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
        {[
          { value: "83 ms", label: "5,000 candidates placed", hint: "40 halls, 120 colleges" },
          { value: "11", label: "College colours", hint: "WCAG AA on every tile" },
          { value: "A5", label: "Admit card size", hint: "Photo, seat, date, rules" },
          { value: "20 / min", label: "Lookup rate limit", hint: "Per address, never browsable" }
        ].map((fact) => (
          <div key={fact.label} className="bg-[oklch(17%_0_0/.9)] px-5 py-6">
            <div className="text-[24px] font-semibold tracking-[-0.03em] tabular-nums">{fact.value}</div>
            <div className="mt-1 text-[13px] font-medium text-ink-2">{fact.label}</div>
            <div className="mt-0.5 text-[12px] text-ink-3">{fact.hint}</div>
          </div>
        ))}
      </section>
    </Reveal>
  );
}

function Close({ demoEnabled }: { demoEnabled: boolean }) {
  return (
    <Reveal>
      <section className="my-16 rounded-[var(--radius-pane)] bg-[linear-gradient(135deg,oklch(100%_0_0/.12),oklch(100%_0_0/.03)_50%,oklch(100%_0_0/.08))] p-8 shadow-[inset_0_1px_0_oklch(100%_0_0/.2),0_0_0_1px_oklch(100%_0_0/.1),0_40px_80px_-50px_oklch(0%_0_0/.9)] sm:p-11">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="max-w-[24ch] text-[clamp(22px,3vw,30px)] leading-[1.14] font-semibold tracking-[-0.03em]">
              Open a workspace with a full exam already solved.
            </h2>
            <p className="mt-2.5 max-w-[52ch] text-[13.5px] text-ink-2">
              One click seeds 500 candidates across 12 halls, runs the solver and publishes a
              plan with admit cards — no signup, no credentials to type.
            </p>
          </div>

          <div className="flex flex-none flex-col gap-2">
            {demoEnabled ? (
              <DemoLoginButton enabled size="lg" />
            ) : (
              <ButtonLink href="/signup" size="lg" variant="primary" iconRight={<LuArrowRight />}>
                Create a workspace
              </ButtonLink>
            )}
            <ButtonLink href="/lookup" size="lg" variant="ghost" icon={<LuCalendarDays />}>
              Try the seat lookup
            </ButtonLink>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.07]">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-6 py-7 text-[12.5px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
        <span>SeatCraft · exam seat allocation and admit cards</span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a href="#how" className="transition-colors hover:text-ink">
            How it works
          </a>
          <Link href="/lookup" className="transition-colors hover:text-ink">
            Seat lookup
          </Link>
          <Link href="/login" className="transition-colors hover:text-ink">
            Sign in
          </Link>
          <span className="font-mono text-[11px]">.NET 9 · Next.js · QuestPDF</span>
        </div>
      </div>
    </footer>
  );
}
