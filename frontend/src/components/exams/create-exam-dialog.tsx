"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LuPlus } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { AutofillButton } from "@/components/ui/autofill-button";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { EXAM_DESCRIPTIONS, EXAM_TITLES } from "@/lib/bd-data";
import { createExamWithDataAction, type CreateExamWizardResult } from "@/app/actions/exam";
import type { Institution } from "@/lib/api/types";

/**
 * One dialog for the whole "new exam" flow: the exam itself plus the starter
 * data that allocation needs. The separate halls / candidates / CSV panes on
 * the exam page remain, for filling in an exam that already exists.
 */
export function CreateExamDialog({ institutions = [] }: { institutions?: Institution[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(institutions.map((entry) => entry.id));
  const [state, formAction, pending] = useActionState<CreateExamWizardResult | null, FormData>(
    createExamWithDataAction,
    null
  );

  // Controlled so the autofill button can populate them for review before submit.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hallCount, setHallCount] = useState(1);
  const [rows, setRows] = useState(10);
  const [columns, setColumns] = useState(10);
  const [candidateCount, setCandidateCount] = useState(0);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  }

  function autofill() {
    setTitle(EXAM_TITLES[Math.floor(Math.random() * EXAM_TITLES.length)] ?? "HSC Admission Test 2026");
    setDescription(EXAM_DESCRIPTIONS[Math.floor(Math.random() * EXAM_DESCRIPTIONS.length)] ?? "");
    setHallCount(2 + Math.floor(Math.random() * 3));
    setRows(8 + Math.floor(Math.random() * 4));
    setColumns(8 + Math.floor(Math.random() * 4));
    setCandidateCount(120 + Math.floor(Math.random() * 180));
    setSelected(institutions.map((entry) => entry.id));
  }

  // The action returns the new exam id; jump straight into it so the next step
  // (running the allocation) is one click away. Navigating unmounts this dialog,
  // so there is no open state to reset here.
  useEffect(() => {
    if (!state?.ok || !state.examId) return;

    router.push(`/exams/${state.examId}`);
    router.refresh();
  }, [state, router]);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)} icon={<LuPlus />}>
        New exam
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Create an exam"
        description="Everything allocation needs, in one step."
      >
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <span className="label-mono">Exam</span>
            <AutofillButton onFill={autofill} label="Autofill sample data" />
          </div>

          <div className="flex flex-col gap-3.5">
            <Field label="Exam title" htmlFor="wiz-title">
              <Input
                id="wiz-title"
                name="title"
                placeholder="HSC Admission Test 2026"
                required
                maxLength={160}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>

            <Field label="Description" htmlFor="wiz-description" hint="Optional — shown on the dashboard.">
              <Textarea
                id="wiz-description"
                name="description"
                rows={2}
                placeholder="Session 2026–27, morning shift"
                maxLength={400}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
          </div>

          <div className="rounded-[var(--radius-ctl)] bg-white/[0.04] p-3.5 shadow-[inset_0_1px_0_oklch(100%_0_0/.08),0_0_0_1px_var(--edge)]">
            <div className="label-mono mb-2.5">Halls</div>
            <div className="grid grid-cols-3 gap-2.5">
              <Field label="How many" htmlFor="wiz-halls">
                <Input
                  id="wiz-halls"
                  name="hallCount"
                  type="number"
                  min={0}
                  max={50}
                  value={hallCount}
                  onChange={(event) => setHallCount(Number(event.target.value))}
                />
              </Field>
              <Field label="Rows" htmlFor="wiz-rows">
                <Input
                  id="wiz-rows"
                  name="rows"
                  type="number"
                  min={1}
                  max={100}
                  value={rows}
                  onChange={(event) => setRows(Number(event.target.value))}
                />
              </Field>
              <Field label="Columns" htmlFor="wiz-cols">
                <Input
                  id="wiz-cols"
                  name="columns"
                  type="number"
                  min={1}
                  max={100}
                  value={columns}
                  onChange={(event) => setColumns(Number(event.target.value))}
                />
              </Field>
            </div>
            <p className="mt-2 text-[11.5px] text-ink-3">Each hall offers rows × columns seats. You can add more later.</p>
          </div>

          <div className="rounded-[var(--radius-ctl)] bg-white/[0.04] p-3.5 shadow-[inset_0_1px_0_oklch(100%_0_0/.08),0_0_0_1px_var(--edge)]">
            <div className="label-mono mb-2.5">Colleges</div>

            {institutions.length === 0 ? (
              <p className="text-[12.5px] text-ink-3">
                No colleges yet.{" "}
                <Link href="/colleges" className="text-ink underline underline-offset-2" onClick={() => setOpen(false)}>
                  Add one first
                </Link>
                .
              </p>
            ) : (
              <>
                <div className="flex max-h-[168px] flex-col gap-1.5 overflow-y-auto pr-1">
                  {institutions.map((institution) => {
                    const checked = selected.includes(institution.id);

                    return (
                      <label
                        key={institution.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 text-[12.5px] transition-colors",
                          checked
                            ? "bg-white/[0.09] shadow-[inset_0_0_0_1px_oklch(100%_0_0/.22)]"
                            : "bg-white/[0.02] shadow-[inset_0_0_0_1px_var(--edge)] hover:bg-white/[0.05]"
                        )}
                      >
                        <input
                          type="checkbox"
                          name="collegeIds"
                          value={institution.id}
                          checked={checked}
                          onChange={() => toggle(institution.id)}
                          className="size-3.5 shrink-0 accent-[oklch(96%_0_0)]"
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">{institution.name}</span>
                        <span className="shrink-0 font-mono text-[11px] text-ink-3">{institution.code}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11.5px] text-ink-3">
                    {selected.length} of {institutions.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelected(selected.length === institutions.length ? [] : institutions.map((entry) => entry.id))}
                    className="text-[11.5px] text-ink-2 underline underline-offset-2 hover:text-ink"
                  >
                    {selected.length === institutions.length ? "Clear all" : "Select all"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="rounded-[var(--radius-ctl)] bg-white/[0.04] p-3.5 shadow-[inset_0_1px_0_oklch(100%_0_0/.08),0_0_0_1px_var(--edge)]">
            <div className="label-mono mb-2.5">Candidates</div>
            <Field label="How many" htmlFor="wiz-candidates" hint="Real-sounding names, spread across the colleges you picked.">
              <Input
                id="wiz-candidates"
                name="candidateCount"
                type="number"
                min={0}
                max={5000}
                value={candidateCount}
                onChange={(event) => setCandidateCount(Number(event.target.value))}
              />
            </Field>
            <p className="mt-2 text-[11.5px] text-ink-3">
              Leave at 0 to import your own CSV instead.
            </p>
          </div>

          {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={pending} icon={<LuPlus />}>
              Create exam
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
