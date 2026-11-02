"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LuPlus } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { createExamWithDataAction, type CreateExamWizardResult } from "@/app/actions/exam";

/**
 * One dialog for the whole "new exam" flow: the exam itself plus the starter
 * data that allocation needs. The separate halls / candidates / CSV panes on
 * the exam page remain, for filling in an exam that already exists.
 */
export function CreateExamDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CreateExamWizardResult | null, FormData>(
    createExamWithDataAction,
    null
  );

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
          <div className="flex flex-col gap-3.5">
            <Field label="Exam title" htmlFor="wiz-title">
              <Input id="wiz-title" name="title" placeholder="HSC Admission Test 2026" required maxLength={160} />
            </Field>

            <Field label="Description" htmlFor="wiz-description" hint="Optional — shown on the dashboard.">
              <Textarea id="wiz-description" name="description" rows={2} placeholder="Session 2026–27, morning shift" maxLength={400} />
            </Field>
          </div>

          <div className="rounded-[var(--radius-ctl)] bg-white/[0.04] p-3.5 shadow-[inset_0_1px_0_oklch(100%_0_0/.08),0_0_0_1px_var(--edge)]">
            <div className="label-mono mb-2.5">Halls</div>
            <div className="grid grid-cols-3 gap-2.5">
              <Field label="How many" htmlFor="wiz-halls">
                <Input id="wiz-halls" name="hallCount" type="number" defaultValue={1} min={0} max={50} />
              </Field>
              <Field label="Rows" htmlFor="wiz-rows">
                <Input id="wiz-rows" name="rows" type="number" defaultValue={10} min={1} max={100} />
              </Field>
              <Field label="Columns" htmlFor="wiz-cols">
                <Input id="wiz-cols" name="columns" type="number" defaultValue={10} min={1} max={100} />
              </Field>
            </div>
            <p className="mt-2 text-[11.5px] text-ink-3">Each hall offers rows × columns seats. You can add more later.</p>
          </div>

          <div className="rounded-[var(--radius-ctl)] bg-white/[0.04] p-3.5 shadow-[inset_0_1px_0_oklch(100%_0_0/.08),0_0_0_1px_var(--edge)]">
            <div className="label-mono mb-2.5">Candidates</div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="How many" htmlFor="wiz-candidates">
                <Input id="wiz-candidates" name="candidateCount" type="number" defaultValue={0} min={0} max={5000} />
              </Field>
              <Field label="Colleges" htmlFor="wiz-colleges" hint="Reuses existing first.">
                <Input id="wiz-colleges" name="collegeCount" type="number" defaultValue={3} min={1} max={100} />
              </Field>
            </div>
            <p className="mt-2 text-[11.5px] text-ink-3">
              Placeholder candidates are generated so you can allocate immediately. Leave at 0 to import your own CSV instead.
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
