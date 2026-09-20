"use client";

import { useActionState } from "react";
import { LuPlus } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { createExamAction } from "@/app/actions/exam";
import type { ActionResult } from "@/app/actions/auth";

export function CreateExamForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(createExamAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" placeholder="HSC Admission Test 2026" required maxLength={160} />
      </Field>

      <Field label="Description" htmlFor="description" hint="Optional — shown on the dashboard.">
        <Textarea id="description" name="description" rows={2} placeholder="Session 2026–27, morning shift" maxLength={400} />
      </Field>

      {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      {state?.ok ? <Alert tone="success">{state.message}</Alert> : null}

      <Button type="submit" variant="primary" loading={pending} icon={<LuPlus />}>
        Create exam
      </Button>
    </form>
  );
}
