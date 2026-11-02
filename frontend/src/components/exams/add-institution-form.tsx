"use client";

import { useActionState } from "react";
import { LuBuilding2 } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createInstitutionAction } from "@/app/actions/exam";
import type { ActionResult } from "@/app/actions/auth";

export function AddInstitutionForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(createInstitutionAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="College name" htmlFor="inst-name">
        <Input id="inst-name" name="name" placeholder="Ideal College, Dhaka" required maxLength={160} />
      </Field>

      <Field label="Code" htmlFor="inst-code" hint="Used in the CSV import, e.g. IC01.">
        <Input
          id="inst-code"
          name="code"
          placeholder="IC01"
          required
          maxLength={20}
          className="font-mono uppercase"
          style={{ textTransform: "uppercase" }}
        />
      </Field>

      {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      {state?.ok ? <Alert tone="success">{state.message}</Alert> : null}

      <Button type="submit" size="sm" loading={pending} icon={<LuBuilding2 />}>
        Add college
      </Button>
    </form>
  );
}
