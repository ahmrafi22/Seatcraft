"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuLayoutDashboard, LuListChecks, LuSearch, LuArmchair } from "react-icons/lu";

import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Dashboard", Icon: LuLayoutDashboard },
  { href: "/exams", label: "Exams", Icon: LuListChecks },
  { href: "/lookup", label: "Lookup", Icon: LuSearch }
] as const;

/** Mobile-only bottom bar; the sidebar is hidden below lg. */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-white/10 bg-[oklch(16%_.03_285/.9)] px-1.5 py-1.5 shadow-[0_18px_40px_-18px_oklch(0%_0_0/.9)] backdrop-blur-2xl lg:hidden">
      {NAV.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
              active ? "bg-white/[0.09] text-ink" : "text-ink-3"
            )}
          >
            <Icon className="size-[17px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileBrand() {
  return (
    <Link href="/" className="flex items-center gap-2 lg:hidden">
      <span className="grid size-7 place-items-center rounded-lg bg-[linear-gradient(140deg,oklch(64%_.26_296),oklch(80%_.16_200))]">
        <LuArmchair className="size-3.5 text-white" />
      </span>
      <span className="text-[14px] font-semibold tracking-[-0.02em]">SeatCraft</span>
    </Link>
  );
}
