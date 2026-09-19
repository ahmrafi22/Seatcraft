"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { LuLayoutDashboard, LuListChecks, LuSearch, LuLogOut } from "react-icons/lu";

import { cn } from "@/lib/cn";
import { logoutAction } from "@/app/actions/auth";
import type { Session } from "@/lib/api/types";

const NAV = [
  { href: "/", label: "Dashboard", Icon: LuLayoutDashboard },
  { href: "/exams", label: "Exams", Icon: LuListChecks },
  { href: "/lookup", label: "Seat lookup", Icon: LuSearch }
] as const;

export function Sidebar({ session }: { session: Session | null }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-30 hidden h-dvh w-[244px] shrink-0 flex-col gap-0.5 border-r border-white/[0.075] bg-[oklch(12%_.03_285/.55)] px-3 py-4 backdrop-blur-[26px] backdrop-saturate-150 lg:flex">
      <Link href="/" className="mb-5 flex items-center gap-2.5 px-2 py-1.5">
        <span className="grid size-[30px] place-items-center rounded-[9px] bg-[linear-gradient(140deg,oklch(64%_.26_296),oklch(70%_.24_340)_55%,oklch(80%_.16_200))] shadow-[inset_0_1px_0_oklch(100%_0_0/.45),0_0_0_1px_oklch(100%_0_0/.14),0_8px_18px_-8px_oklch(62%_.26_296/.9)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" className="size-4">
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
                  ? "bg-[linear-gradient(100deg,oklch(72%_.19_298/.22),oklch(74%_.17_205/.10))] text-ink shadow-[inset_0_1px_0_oklch(100%_0_0/.14),0_0_0_1px_oklch(100%_0_0/.10)]"
                  : "text-ink-2 hover:bg-white/[0.07] hover:text-ink"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="nav-rail"
                  className="absolute top-2.5 -left-3 bottom-2.5 w-0.5 rounded-full bg-[linear-gradient(var(--color-violet),var(--color-cyan))]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <Icon className="size-[15px] shrink-0 opacity-90" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2.5 border-t border-white/[0.075] pt-3.5">
        <div className="flex items-center gap-2 rounded-[var(--radius-ctl)] bg-white/[0.045] px-2.5 py-2 text-[11.5px] text-ink-2 shadow-[inset_0_1px_0_oklch(100%_0_0/.10),0_0_0_1px_var(--edge)]">
          <span className="size-1.5 shrink-0 rounded-full bg-emerald shadow-[0_0_0_3px_oklch(80%_.17_160/.16),0_0_10px_var(--color-emerald)]" />
          <span>Connected to API</span>
        </div>

        {session ? (
          <div className="flex items-center gap-2.5 rounded-[var(--radius-ctl)] p-2 shadow-[inset_0_0_0_1px_var(--edge)]">
            <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-[linear-gradient(140deg,oklch(84%_.12_300),oklch(86%_.11_200))] text-[11.5px] font-semibold text-[oklch(18%_.06_298)] shadow-[inset_0_1px_0_oklch(100%_0_0/.7),0_0_0_1px_oklch(100%_0_0/.18)]">
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
