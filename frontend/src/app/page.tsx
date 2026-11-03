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
        <Bento />
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
        <h1 className="text-gradient text-[clamp(34px,5.2vw,54px)] leading-[1.06] font-semibold tracking-[-0.04em]">
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
      </Reveal>

      <Reveal delay={0.1}>
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-8 -z-10 rounded-[36px] bg-[radial-gradient(closest-side,oklch(100%_0_0/.09),transparent)] blur-2xl"
          />
          <SeatDemo />
        </div>
      </Reveal>
    </section>
  );
}

function Rule() {
  return (
    <Reveal>
      <section className="rounded-[var(--radius-pane)] bg-[linear-gradient(140deg,oklch(100%_0_0/.08),oklch(100%_0_0/.02))] p-7 shadow-[inset_0_1px_0_oklch(100%_0_0/.16),0_0_0_1px_oklch(100%_0_0/.08)] sm:p-9">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="label-mono">The hard part</div>
            <h2 className="mt-3 max-w-[26ch] text-[clamp(22px,3vw,30px)] leading-[1.15] font-semibold tracking-[-0.03em]">
              Two students from one college, side by side, is a cheating risk.
            </h2>
          </div>
          <p className="max-w-[46ch] text-[14px] leading-relaxed text-ink-2">
            Exam boards call it an adjacency violation. A greedy pass paints itself into a
            corner and leaves conflicts it can never undo — so SeatCraft plants the hall,
            then repairs what remains until the board is clean.
          </p>
        </div>
      </section>
    </Reveal>
  );
}

function Bento() {
  return (
    <section id="how" className="scroll-mt-24 py-16 lg:py-20">
      <Reveal>
        <div className="label-mono">How it works</div>
        <h2 className="mt-3 max-w-[30ch] text-[clamp(24px,3.4vw,34px)] leading-[1.12] font-semibold tracking-[-0.03em]">
          From a roster to a plan people trust.
        </h2>
      </Reveal>

      <div className="mt-9 grid gap-4 lg:grid-cols-12">
        {/* Import — full width opener, spans everything */}
        <Reveal className="lg:col-span-12">
          <article className="glass-pane flex flex-col gap-4 rounded-[var(--radius-pane)] p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-7">
            <span className="grid size-11 flex-none place-items-center rounded-[12px] bg-white/[0.08] shadow-[inset_0_1px_0_oklch(100%_0_0/.16),0_0_0_1px_oklch(100%_0_0/.1)]">
              <LuBuilding2 className="size-[18px] text-ink" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold tracking-[-0.02em]">
                <span className="mr-2 font-mono text-[12px] font-normal tracking-[0.12em] text-ink-3">
                  01
                </span>
                Import halls and candidates
              </h3>
              <p className="mt-1.5 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-2">
                Type them in, or import a CSV — roll, name, college, subject group. Every
                college keeps its own colour across the whole board.
              </p>
            </div>
          </article>
        </Reveal>

        {/* Solve — the hero card, tall */}
        <Reveal className="lg:col-span-7" delay={0.06}>
          <article className="glass-pane flex h-full flex-col rounded-[var(--radius-pane)] p-7">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 flex-none place-items-center rounded-[12px] bg-white/[0.08] shadow-[inset_0_1px_0_oklch(100%_0_0/.16),0_0_0_1px_oklch(100%_0_0/.1)]">
                <LuTimer className="size-[18px] text-ink" />
              </span>
              <div className="text-right">
                <div className="text-[30px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                  83 ms
                </div>
                <div className="mt-1 font-mono text-[10px] tracking-[0.1em] text-ink-3 uppercase">
                  5,000 candidates · 40 halls
                </div>
              </div>
            </div>
            <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.02em]">
              <span className="mr-2 font-mono text-[12px] font-normal tracking-[0.12em] text-ink-3">
                02
              </span>
              Run the solver
            </h3>
            <p className="mt-2 max-w-[52ch] text-[13.5px] leading-relaxed text-ink-2">
              Three strategies, strict by default. The strict pass places everyone, then
              repairs what it can — swapping and relocating until no two neighbours share a
              college.
            </p>
          </article>
        </Reveal>

        {/* Adjust — stacked on the right of Solve */}
        <Reveal className="lg:col-span-5" delay={0.12}>
          <article className="glass-pane flex h-full flex-col rounded-[var(--radius-pane)] p-7">
            <span className="grid size-11 flex-none place-items-center rounded-[12px] bg-white/[0.08] shadow-[inset_0_1px_0_oklch(100%_0_0/.16),0_0_0_1px_oklch(100%_0_0/.1)]">
              <LuLayoutGrid className="size-[18px] text-ink" />
            </span>
            <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.02em]">
              <span className="mr-2 font-mono text-[12px] font-normal tracking-[0.12em] text-ink-3">
                03
              </span>
              Adjust by hand
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
              Drag any seat to swap two candidates or move one into a free seat. Violations
              stay marked, and nothing publishes while a blocking one remains.
            </p>
          </article>
        </Reveal>

        {/* Publish — documents */}
        <Reveal className="lg:col-span-7" delay={0.06}>
          <article className="glass-pane flex h-full flex-col rounded-[var(--radius-pane)] p-7">
            <span className="grid size-11 flex-none place-items-center rounded-[12px] bg-white/[0.08] shadow-[inset_0_1px_0_oklch(100%_0_0/.16),0_0_0_1px_oklch(100%_0_0/.1)]">
              <LuFileText className="size-[18px] text-ink" />
            </span>
            <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.02em]">
              <span className="mr-2 font-mono text-[12px] font-normal tracking-[0.12em] text-ink-3">
                04
              </span>
              Publish the documents
            </h3>
            <p className="mt-2 max-w-[52ch] text-[13.5px] leading-relaxed text-ink-2">
              Admit cards and attendance sheets render as A5 PDFs behind HMAC-signed links —
              500 cards as one zip.
            </p>
          </article>
        </Reveal>

        {/* Lookup — closing card */}
        <Reveal className="lg:col-span-5" delay={0.12}>
          <article className="glass-pane flex h-full flex-col rounded-[var(--radius-pane)] p-7">
            <span className="grid size-11 flex-none place-items-center rounded-[12px] bg-white/[0.08] shadow-[inset_0_1px_0_oklch(100%_0_0/.16),0_0_0_1px_oklch(100%_0_0/.1)]">
              <LuSearch className="size-[18px] text-ink" />
            </span>
            <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.02em]">
              <span className="mr-2 font-mono text-[12px] font-normal tracking-[0.12em] text-ink-3">
                05
              </span>
              Public seat lookup
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
              Candidates find their own seat with a roll number and date of birth — rate
              limited, never browsable.
            </p>
          </article>
        </Reveal>
      </div>
    </section>
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
              plan with admit cards.
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
        </div>
      </div>
    </footer>
  );
}
