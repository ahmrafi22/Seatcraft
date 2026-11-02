"use client";

import { useActionState } from "react";
import { LuSparkles } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { seedDemoAction } from "@/app/actions/exam";
import type { ActionResult } from "@/app/actions/auth";

export function SeedDemoForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(seedDemoAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-3 gap-2.5">
        <Field label="Candidates" htmlFor="candidates">
          <Input id="candidates" name="candidates" type="number" defaultValue={500} min={1} max={5000} />
        </Field>
        <Field label="Colleges" htmlFor="institutions">
          <Input id="institutions" name="institutions" type="number" defaultValue={20} min={1} max={100} />
        </Field>
        <Field label="Halls" htmlFor="halls">
          <Input id="halls" name="halls" type="number" defaultValue={12} min={1} max={50} />
        </Field>
      </div>

      {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      {state?.ok ? <Alert tone="success">{state.message}</Alert> : null}

      <Button type="submit" loading={pending} icon={<LuSparkles />}>
        Seed demo exam
      </Button>
      <p className="text-[11.5px] leading-relaxed text-ink-3">
        Creates an exam, colleges, halls and every candidate in one call. Available in development only.
      </p>
    </form>
  );
}
