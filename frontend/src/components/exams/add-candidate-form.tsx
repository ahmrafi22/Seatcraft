"use client";

import { useActionState, useState } from "react";
import { LuUserPlus } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { AutofillButton } from "@/components/ui/autofill-button";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { createCandidateAction } from "@/app/actions/exam";
import type { ActionResult } from "@/app/actions/auth";
import { SUBJECT_GROUPS, randomFullName, randomRoll } from "@/lib/bd-data";
import type { Institution } from "@/lib/api/types";

export function AddCandidateForm({ examId, institutions }: { examId: string; institutions: Institution[] }) {
  const action = createCandidateAction.bind(null, examId);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  // Controlled so the autofill button can write into the fields; the user still
  // reviews and submits, which is why these are not just defaultValue.
  const [roll, setRoll] = useState("");
  const [fullName, setFullName] = useState("");
  const [subjectGroup, setSubjectGroup] = useState("Science");
  const [institutionId, setInstitutionId] = useState(institutions[0]?.id ?? "");

  if (institutions.length === 0) {
    return (
      <Alert tone="warning" title="Add a college first">
        Every candidate belongs to a college. Create one, then add candidates here.
      </Alert>
    );
  }

  function autofill() {
    setRoll(randomRoll());
    setFullName(randomFullName());
    setSubjectGroup(SUBJECT_GROUPS[Math.floor(Math.random() * SUBJECT_GROUPS.length)] ?? "Science");
    setInstitutionId(institutions[Math.floor(Math.random() * institutions.length)]?.id ?? institutionId);
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="label-mono">Add a candidate</span>
        <AutofillButton onFill={autofill} label="Autofill" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Roll" htmlFor="cand-roll">
          <Input
            id="cand-roll"
            name="roll"
            placeholder="R00001"
            required
            maxLength={40}
            className="font-mono"
            value={roll}
            onChange={(event) => setRoll(event.target.value)}
          />
        </Field>
        <Field label="Subject group" htmlFor="cand-group">
          <Select
            id="cand-group"
            name="subjectGroup"
            value={subjectGroup}
            onChange={(event) => setSubjectGroup(event.target.value)}
          >
            {SUBJECT_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Full name" htmlFor="cand-name">
        <Input
          id="cand-name"
          name="fullName"
          placeholder="Nusrat Jahan"
          required
          maxLength={160}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </Field>

      <Field label="College" htmlFor="cand-institution">
        <Select
          id="cand-institution"
          name="institutionId"
          required
          value={institutionId}
          onChange={(event) => setInstitutionId(event.target.value)}
        >
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
