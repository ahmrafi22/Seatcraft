import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LuBuilding2 } from "react-icons/lu";

import { Topbar } from "@/components/shell/topbar";
import { Badge } from "@/components/ui/badge";
import { CollegesManager } from "@/components/exams/colleges-manager";
import { api } from "@/lib/api/client";
import { getSession } from "@/lib/session";
import type { Institution } from "@/lib/api/types";

export const metadata: Metadata = { title: "Colleges" };
export const dynamic = "force-dynamic";

export default async function CollegesPage() {
  const session = await getSession();

  // A nav destination, so send signed-out visitors to sign in rather than 404.
  if (!session) redirect("/login");

  const institutions = await api<Institution[]>("/institutions").catch(() => [] as Institution[]);

  return (
    <>
      <Topbar
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Colleges" }]}
        right={<Badge kind="neutral" dot={false}>{institutions.length} total</Badge>}
      />

      <main className="mx-auto w-full max-w-[1000px] px-6 py-6">
        <div className="mb-5 flex flex-wrap items-start gap-4">
          <div className="min-w-[220px] flex-1">
            <div className="label-mono">Tenant setup</div>
            <h1 className="mt-1.5 flex items-center gap-2 text-[27px] font-semibold tracking-[-0.025em]">
              <LuBuilding2 className="size-6 text-ink-3" />
              Colleges
            </h1>
            <p className="mt-1 text-[13.5px] text-ink-3">
              Every college candidates can belong to. Shared across all exams — the code is what CSV imports match on.
            </p>
          </div>
        </div>

        <CollegesManager institutions={institutions} />
      </main>
    </>
  );
}
