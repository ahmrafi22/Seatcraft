import type { Metadata } from "next";
import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";

import { Topbar } from "@/components/shell/topbar";
import { Pane, PaneBody, PaneHead } from "@/components/ui/pane";
import { Alert } from "@/components/ui/alert";
import { LoginForm } from "@/components/auth/login-form";
import { DemoLoginButton } from "@/components/auth/demo-login-button";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  const demoEnabled = process.env.NODE_ENV !== "production";

  return (
    <>
      <Topbar crumbs={[{ label: "Dashboard", href: "/" }, { label: "Sign in" }]} />

      <main className="mx-auto w-full max-w-[520px] px-6 py-12">
        <div className="label-mono">Workspace access</div>
        <h1 className="text-gradient mt-2 mb-1.5 text-[30px] font-semibold tracking-[-0.03em]">Sign in</h1>
        <p className="mb-6 text-[13.5px] text-ink-2">
          The token is stored in an httpOnly cookie — the browser never touches the JWT.
        </p>

        {demoEnabled ? (
          <div className="mb-4">
            <DemoLoginButton enabled />
          </div>
        ) : null}

        <Pane>
          <PaneHead title="Account" hint={demoEnabled ? "or sign in manually" : undefined} />
          <PaneBody>
            <LoginForm defaultEmail={demoEnabled ? "admin@demo.test" : undefined} />
          </PaneBody>
        </Pane>

        <div className="mt-4">
          <Alert tone="info" title="Demo tenant">
            <span className="font-mono text-[12.5px]">admin@demo.test</span> /{" "}
            <span className="font-mono text-[12.5px]">Passw0rd!123</span>
            <div className="mt-1.5 text-[12.5px] opacity-80">
              Seeded by the Postman collection or the demo seed button.
            </div>
          </Alert>
        </div>

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
