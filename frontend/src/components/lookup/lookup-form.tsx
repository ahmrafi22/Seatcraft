"use client";

import { useActionState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LuSearch, LuMapPin, LuCircleCheck, LuTriangleAlert } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { lookupSeatAction, type LookupState } from "@/app/actions/lookup";
import { tintFor } from "@/lib/colors";

const INITIAL: LookupState = { status: "idle" };

export function LookupForm({ defaultTenant }: { defaultTenant: string }) {
  const [state, formAction, pending] = useActionState<LookupState, FormData>(lookupSeatAction, INITIAL);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="glass-pane rounded-[var(--radius-pane)] p-5">
        <div className="flex flex-col gap-3.5">
          <Field label="Lookup code" htmlFor="tenant" hint="Your institute's code — the demo tenant uses “demo”.">
            <Input id="tenant" name="tenant" defaultValue={defaultTenant} placeholder="demo" autoComplete="off" className="font-mono" />
          </Field>

          <Field label="Roll number" htmlFor="roll">
            <Input
              id="roll"
              name="roll"
              placeholder="R00001"
              autoComplete="off"
              required
              className="font-mono tracking-[0.04em]"
            />
          </Field>

          <Field label="Date of birth" htmlFor="dateOfBirth" hint="Used as a second factor so the roster can't be browsed.">
            <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
          </Field>

          <Button type="submit" variant="primary" size="lg" loading={pending} icon={<LuSearch />} className="w-full">
            Find my seat
          </Button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {state.status === "found" && state.seat ? (
          <motion.div
            key="found"
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="glass-pane overflow-hidden rounded-[var(--radius-pane)]">
              <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-3.5">
                <h2 className="text-[13.5px] font-semibold">Your seat</h2>
                <div className="flex-1" />
                <span className="inline-flex h-[23px] items-center gap-1.5 rounded-full bg-[oklch(100%_0_0/.12)] px-2.5 text-[11.5px] font-medium text-[oklch(96%_0_0)] shadow-[inset_0_0_0_1px_oklch(100%_0_0/.22)]">
                  <span className="size-[5px] rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                  Confirmed
                </span>
              </div>

              <div className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[linear-gradient(140deg,oklch(96%_0_0),oklch(72%_0_0))] text-[15px] font-semibold text-[oklch(18%_0_0)] shadow-[inset_0_1px_0_oklch(100%_0_0/.7),0_0_0_1px_oklch(100%_0_0/.18)]">
                    {initialsOf(state.seat.candidateName)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[16px] font-semibold tracking-[-0.015em]">{state.seat.candidateName}</div>
                    <div className="mt-0.5 font-mono text-[12px] text-ink-3">{state.seat.roll}</div>
                  </div>
                </div>

                <div className="relative grid place-items-center overflow-hidden rounded-[var(--radius-ctl)] bg-[linear-gradient(135deg,oklch(100%_0_0/.12),oklch(100%_0_0/.04))] px-5 py-8 shadow-[inset_0_1px_0_oklch(100%_0_0/.2),0_0_0_1px_oklch(100%_0_0/.1)]">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-70"
                    style={{
                      background: `radial-gradient(18rem 12rem at 50% 120%, oklch(${tintFor(state.seat.hallName).lightness}% ${tintFor(state.seat.hallName).chroma} ${tintFor(state.seat.hallName).hue} / .35), transparent 70%)`
                    }}
                  />
                  <div className="relative grid place-items-center">
                    <div className="label-mono text-white/60">{state.seat.hallName}</div>
                    <div
                      className="mt-1 bg-clip-text font-mono text-[36px] font-semibold tracking-[-0.03em] text-transparent"
                      style={{
                        backgroundImage: `linear-gradient(100deg, oklch(99% 0 0), oklch(${tintFor(state.seat.hallName).lightness + 12}% ${tintFor(state.seat.hallName).chroma} ${tintFor(state.seat.hallName).hue}))`
                      }}
                    >
                      {state.seat.seatLabel}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3.5">
                  <div>
                    <div className="label-mono">Exam</div>
                    <div className="mt-0.5 text-[14px] font-medium">{state.seat.examTitle}</div>
                  </div>
                  <div>
                    <div className="label-mono">Published</div>
                    <div className="mt-0.5 text-[14px] font-medium">
                      {state.seat.examDate ? new Date(state.seat.examDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </div>
                  </div>
                </div>

                <div className="my-4 h-px bg-white/[0.07]" />

                <p className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
                  <LuMapPin className="size-3.5" />
                  Report 30 minutes before the exam starts and carry your admit card.
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}

        {state.status === "missing" ? (
          <motion.div key="missing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert tone="warning" icon={<LuTriangleAlert />} title="No seat found">
              {state.message ?? "Check the roll number and date of birth and try again."}
            </Alert>
          </motion.div>
        ) : null}

        {state.status === "error" ? (
          <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert tone="danger" icon={<LuCircleCheck />} title="Lookup failed">
              {state.message}
            </Alert>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
