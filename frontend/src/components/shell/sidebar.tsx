"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuLayoutDashboard, LuListChecks, LuSearch, LuLogOut, LuBuilding2 } from "react-icons/lu";

import { cn } from "@/lib/cn";
import { logoutAction } from "@/app/actions/auth";
import type { Session } from "@/lib/api/types";

const NAV = [
  { href: "/", label: "Dashboard", Icon: LuLayoutDashboard },
  { href: "/exams", label: "Exams", Icon: LuListChecks },
  { href: "/colleges", label: "Colleges", Icon: LuBuilding2 },
  { href: "/lookup", label: "Seat lookup", Icon: LuSearch }
] as const;

export function Sidebar({ session }: { session: Session | null }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-white/[0.075] bg-[oklch(11%_0_0/.72)] px-3 py-4 backdrop-blur-[26px] backdrop-saturate-150 lg:flex">
      <Link href="/" className="mb-5 flex items-center gap-2.5 px-2 py-1.5">
        <span className="grid size-[30px] place-items-center rounded-[9px] bg-[linear-gradient(140deg,oklch(96%_0_0),oklch(74%_0_0)_60%,oklch(56%_0_0))] shadow-[inset_0_1px_0_oklch(100%_0_0/.45),0_0_0_1px_oklch(100%_0_0/.14),0_8px_18px_-8px_oklch(0%_0_0/.9)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="oklch(18% 0 0)" strokeWidth="2.3" strokeLinecap="round" className="size-4">
            <path d="M4 17V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8" />
            <path d="M7 7V5h10v2" />
            <path d="M4 17h16" />
          </svg>
        </span>
        <span className="text-[15px] font-semibold tracking-[-0.02em]">SeatCraft</span>
      </Link>

      <div className="label-mono px-2.5 pt-3 pb-2">Workspace</div>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-[var(--radius-ctl)] px-2.5 py-2 text-[13.5px] font-medium transition-colors duration-150",
                active
                  ? "bg-[linear-gradient(100deg,oklch(100%_0_0/.16),oklch(100%_0_0/.06))] text-ink shadow-[inset_0_1px_0_oklch(100%_0_0/.14),0_0_0_1px_oklch(100%_0_0/.10)]"
                  : "text-ink-2 hover:bg-white/[0.07] hover:text-ink"
              )}
            >
              {active ? (
                <span
                  aria-hidden
                  className="absolute top-2.5 -left-3 bottom-2.5 w-0.5 rounded-full bg-[linear-gradient(oklch(98%_0_0),oklch(70%_0_0))]"
                />
              ) : null}
              <Icon className="size-[15px] shrink-0 opacity-90" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2.5 border-t border-white/[0.075] pt-3.5">

        {session ? (
          <div className="flex items-center gap-2.5 rounded-[var(--radius-ctl)] p-2 shadow-[inset_0_0_0_1px_var(--edge)]">
            <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-[linear-gradient(140deg,oklch(92%_0_0),oklch(70%_0_0))] text-[11.5px] font-semibold text-[oklch(18%_0_0)] shadow-[inset_0_1px_0_oklch(100%_0_0/.7),0_0_0_1px_oklch(100%_0_0/.18)]">
              {session.user.displayName.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] leading-tight font-semibold">{session.user.displayName}</div>
              <div className="truncate text-[11px] leading-tight text-ink-3">{session.user.role}</div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Sign out"
                className="grid size-7 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-white/[0.08] hover:text-ink"
              >
                <LuLogOut className="size-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="glass-ctl flex h-9 items-center justify-center rounded-[var(--radius-ctl)] text-[13px] font-medium"
          >
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
