import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Topbar } from "@/components/shell/topbar";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { LookupForm } from "@/components/lookup/lookup-form";
import { TENANT_COOKIE } from "@/lib/session";

export const metadata: Metadata = { title: "Seat lookup" };

export default async function LookupPage() {
  const store = await cookies();
  const tenant = store.get(TENANT_COOKIE)?.value ?? "demo";

  return (
    <>
      <Topbar
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Seat lookup" }]}
        right={<Badge kind="primary" dot={false}>Public view</Badge>}
      />

      <main className="mx-auto w-full max-w-[600px] px-6 py-10">
        <Reveal>
          <div className="mb-6">
            <div className="label-mono">Candidate portal</div>
            <h1 className="text-gradient mt-2 text-[32px] leading-tight font-semibold tracking-[-0.03em]">Find your seat</h1>
            <p className="mt-2 text-[13.5px] text-ink-2">
              Enter your roll number and date of birth. Both are required, so a roster can never be browsed.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <LookupForm defaultTenant={tenant} />
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-6 text-center text-[12px] text-ink-3">
            Rate-limited to 20 lookups a minute per address.
          </p>
        </Reveal>
      </main>
    </>
  );
}
