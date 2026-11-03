import type { Metadata } from "next";
import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";

import { Topbar } from "@/components/shell/topbar";
import { Pane, PaneBody, PaneHead } from "@/components/ui/pane";
import { Alert } from "@/components/ui/alert";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create workspace" };

const ERRORS: Record<string, string> = {
  missing: "Fill in every field to create your workspace.",
  slug: "The workspace code needs 3–40 characters: lowercase letters, numbers or hyphens.",
  password: "Choose a password of at least 8 characters.",
  taken: "That workspace code or email is already in use. Try another.",
  failed: "Could not create the workspace. Try again in a moment.",
  invalid: "That form could not be read. Try again."
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? ERRORS.failed) : undefined;

  return (
    <>
      <Topbar crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Create workspace" }]} />

      <main className="mx-auto w-full max-w-[560px] px-6 py-12">
        <div className="label-mono">New workspace</div>
        <h1 className="text-gradient mt-2 mb-1.5 text-[30px] font-semibold tracking-[-0.03em]">Create your workspace</h1>
        <p className="mb-6 text-[13.5px] text-ink-2">
          You become the first admin. Add halls and candidates next, then run an allocation.
        </p>

        {message ? (
          <div className="mb-4">
            <Alert tone="danger">{message}</Alert>
          </div>
        ) : null}

        <Pane>
          <PaneHead title="Workspace" hint="step 1 of 1" />
          <PaneBody>
            <SignupForm />
          </PaneBody>
        </Pane>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
            <LuArrowLeft className="size-3.5" />
            Already have an account
          </Link>
          <Link href="/lookup" className="text-[13px] text-ink-3 hover:text-ink">
            Public seat lookup
          </Link>
        </div>
      </main>
    </>
  );
}
