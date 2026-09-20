"use client";

import { useActionState } from "react";
import { LuLogIn } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { loginAction } from "@/app/actions/auth";
import type { ActionResult } from "@/app/actions/auth";

export function LoginForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(loginAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={defaultEmail}
          placeholder="admin@demo.test"
          required
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>

      {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}

      <Button type="submit" variant="primary" size="lg" loading={pending} icon={<LuLogIn />} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
