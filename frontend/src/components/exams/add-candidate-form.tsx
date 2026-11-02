"use client";

import { useActionState } from "react";
import { LuUserPlus } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { createCandidateAction } from "@/app/actions/exam";
import type { ActionResult } from "@/app/actions/auth";
import type { Institution } from "@/lib/api/types";

export function AddCandidateForm({ examId, institutions }: { examId: string; institutions: Institution[] }) {
  const action = createCandidateAction.bind(null, examId);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  if (institutions.length === 0) {
    return (
      <Alert tone="warning" title="Add a college first">
        Every candidate belongs to a college. Create one, then add candidates here.
      </Alert>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Roll" htmlFor="cand-roll">
          <Input id="cand-roll" name="roll" placeholder="R00001" required maxLength={40} className="font-mono" />
        </Field>
        <Field label="Subject group" htmlFor="cand-group">
          <Input id="cand-group" name="subjectGroup" placeholder="Science" maxLength={60} />
        </Field>
      </div>

      <Field label="Full name" htmlFor="cand-name">
        <Input id="cand-name" name="fullName" placeholder="Candidate name" required maxLength={160} />
      </Field>

      <Field label="College" htmlFor="cand-institution">
        <Select id="cand-institution" name="institutionId" defaultValue={institutions[0]?.id} required>
          {institutions.map((institution) => (
            <option key={institution.id} value={institution.id}>
              {institution.code} — {institution.name}
            </option>
          ))}
        </Select>
      </Field>

      {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      {state?.ok ? <Alert tone="success">{state.message}</Alert> : null}

      <Button type="submit" size="sm" loading={pending} icon={<LuUserPlus />}>
        Add candidate
      </Button>
    </form>
  );
}
