"use client";

import { useActionState, useState } from "react";
import { LuArmchair } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { AutofillButton } from "@/components/ui/autofill-button";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { createHallAction } from "@/app/actions/exam";
import type { ActionResult } from "@/app/actions/auth";
import { HALL_NAMES } from "@/lib/bd-data";

export function AddHallForm({ examId, nextIndex }: { examId: string; nextIndex: number }) {
  const action = createHallAction.bind(null, examId);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  const [name, setName] = useState(`Hall ${String(nextIndex).padStart(2, "0")}`);
  const [rows, setRows] = useState(10);
  const [columns, setColumns] = useState(10);

  function autofill() {
    // Prefer a named venue over "Hall 04", and vary the grid a little.
    setName(HALL_NAMES[Math.floor(Math.random() * HALL_NAMES.length)] ?? `Hall ${String(nextIndex).padStart(2, "0")}`);
    setRows(6 + Math.floor(Math.random() * 5));
    setColumns(6 + Math.floor(Math.random() * 5));
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="label-mono">Add a hall</span>
        <AutofillButton onFill={autofill} label="Autofill" />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_72px_72px] gap-2.5">
        <Field label="Hall name" htmlFor="hall-name">
          <Input
            id="hall-name"
            name="name"
            required
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Rows" htmlFor="hall-rows">
          <Input
            id="hall-rows"
            name="rows"
            type="number"
            min={1}
            max={100}
            value={rows}
            onChange={(event) => setRows(Number(event.target.value))}
          />
        </Field>
        <Field label="Cols" htmlFor="hall-cols">
          <Input
            id="hall-cols"
            name="columns"
            type="number"
            min={1}
            max={100}
            value={columns}
            onChange={(event) => setColumns(Number(event.target.value))}
          />
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
