"use client";

import { useActionState } from "react";
import { LuArmchair } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createHallAction } from "@/app/actions/exam";
import type { ActionResult } from "@/app/actions/auth";

export function AddHallForm({ examId, nextIndex }: { examId: string; nextIndex: number }) {
  const action = createHallAction.bind(null, examId);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-[minmax(0,1fr)_72px_72px] gap-2.5">
        <Field label="Hall name" htmlFor="hall-name">
          <Input id="hall-name" name="name" defaultValue={`Hall ${String(nextIndex).padStart(2, "0")}`} required maxLength={80} />
        </Field>
        <Field label="Rows" htmlFor="hall-rows">
          <Input id="hall-rows" name="rows" type="number" defaultValue={10} min={1} max={100} />
        </Field>
        <Field label="Cols" htmlFor="hall-cols">
          <Input id="hall-cols" name="columns" type="number" defaultValue={10} min={1} max={100} />
        </Field>
      </div>

      {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      {state?.ok ? <Alert tone="success">{state.message}</Alert> : null}

      <Button type="submit" size="sm" loading={pending} icon={<LuArmchair />}>
        Add hall
      </Button>
    </form>
  );
}
