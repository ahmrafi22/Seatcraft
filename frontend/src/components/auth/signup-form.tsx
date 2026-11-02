"use client";

import { useState } from "react";
import { LuUserPlus } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

/**
 * Posts straight to the signup route handler instead of using an action:
 * the handler sets the session cookie and redirects in one response.
 */
export function SignupForm() {
  const [pending, setPending] = useState(false);
  const [slug, setSlug] = useState("");

  return (
    <form
      action="/api/signup"
      method="post"
      onSubmit={() => setPending(true)}
      className="flex flex-col gap-3.5"
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Institution name" htmlFor="tenantName">
          <Input id="tenantName" name="tenantName" placeholder="Ideal College, Dhaka" required autoComplete="organization" />
        </Field>

        <Field label="Workspace code" htmlFor="tenantSlug" hint="Used in the lookup URL.">
          <Input
            id="tenantSlug"
            name="tenantSlug"
            placeholder="ideal-college"
            required
            autoComplete="off"
            className="font-mono"
            value={slug}
            onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          />
        </Field>
      </div>

      <Field label="Your name" htmlFor="displayName">
        <Input id="displayName" name="displayName" placeholder="Rafi Ahmed" required autoComplete="name" />
      </Field>

      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" placeholder="you@college.edu" required autoComplete="email" />
      </Field>

      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </Field>

      <Button type="submit" variant="primary" size="lg" loading={pending} icon={<LuUserPlus />} className="mt-1 w-full">
        Create workspace
      </Button>
    </form>
  );
}
