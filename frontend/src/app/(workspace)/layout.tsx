import type { ReactNode } from "react";

import { Sidebar } from "@/components/shell/sidebar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { getSession } from "@/lib/session";

/** The signed-in workspace shell: fixed sidebar, mobile bar, content column. */
export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  return (
    <div className="flex min-h-dvh">
      <Sidebar session={session} />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[244px]">
        {children}
        <div className="h-24 lg:hidden" />
      </div>
      <MobileNav />
    </div>
  );
}
