import type { Metadata } from "next";
import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";

import { Topbar } from "@/components/shell/topbar";
import { Pane, PaneBody, PaneHead } from "@/components/ui/pane";
import { Alert } from "@/components/ui/alert";
import { LoginForm } from "@/components/auth/login-form";
import { DemoLoginButton } from "@/components/auth/demo-login-button";
import { DEMO_CREDENTIALS, isDemoLoginEnabled } from "@/lib/demo";

export const metadata: Metadata = { title: "Sign in" };

const DEMO_ERRORS: Record<string, string> = {
  "no-tenant": "The demo tenant is not seeded on this server yet.",
  failed: "The demo sign-in did not go through. Try again in a moment."
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const demoEnabled = isDemoLoginEnabled();
  const { demo } = await searchParams;
  const demoError = demo ? DEMO_ERRORS[demo] : undefined;

  return (
    <>
      <Topbar crumbs={[{ label: "Dashboard", href: "/" }, { label: "Sign in" }]} />

      <main className="mx-auto w-full max-w-[520px] px-6 py-12">
        <div className="label-mono">Workspace access</div>
        <h1 className="text-gradient mt-2 mb-1.5 text-[30px] font-semibold tracking-[-0.03em]">Sign in</h1>
        <p className="mb-6 text-[13.5px] text-ink-2">
          The token is stored in an httpOnly cookie — the browser never touches the JWT.
        </p>

        {demoError ? (
          <div className="mb-4">
            <Alert tone="danger">{demoError}</Alert>
          </div>
        ) : null}

        {demoEnabled ? (
          <div className="mb-4 flex flex-col gap-2">
            <DemoLoginButton enabled fullWidth />
            <p className="text-center text-[12px] text-ink-3">
              Opens the seeded workspace with a full exam, plan and admit cards.
            </p>
          </div>
        ) : null}

        <Pane>
          <PaneHead title="Account" hint={demoEnabled ? "or sign in manually" : undefined} />
          <PaneBody>
            <LoginForm defaultEmail={demoEnabled ? DEMO_CREDENTIALS.email : undefined} />
          </PaneBody>
        </Pane>

        {demoEnabled ? (
          <div className="mt-4">
            <Alert tone="info" title="Demo tenant">
              <span className="font-mono text-[12.5px]">{DEMO_CREDENTIALS.email}</span> /{" "}
              <span className="font-mono text-[12.5px]">{DEMO_CREDENTIALS.password}</span>
              <div className="mt-1.5 text-[12.5px] opacity-80">
                Read-only exploration is fine — the data is reseeded on every deploy.
              </div>
            </Alert>
          </div>
        ) : null}

        <div className="mt-5">
          <Link href="/lookup" className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
            <LuArrowLeft className="size-3.5" />
            Candidates can look up a seat without signing in
          </Link>
        </div>
      </main>
    </>
  );
}
