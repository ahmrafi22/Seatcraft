"use client";

import { useActionState } from "react";
import { LuUpload } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { importCandidatesAction } from "@/app/actions/exam";
import type { ActionResult } from "@/app/actions/auth";

export function ImportCandidatesForm({ examId }: { examId: string }) {
  const action = importCandidatesAction.bind(null, examId);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field
        label="CSV file"
        htmlFor="csv"
        hint="Columns: roll, name, institutionCode — optional subjectGroup, dateOfBirth."
      >
        <Input id="csv" name="file" type="file" accept=".csv,text/csv" required className="h-auto py-2 text-[12.5px]" />
      </Field>

      {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      {state?.ok ? <Alert tone="success">{state.message}</Alert> : null}

      <Button type="submit" size="sm" loading={pending} icon={<LuUpload />}>
        Import CSV
      </Button>
    </form>
  );
}
