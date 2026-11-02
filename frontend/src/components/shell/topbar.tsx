import Link from "next/link";
import type { ReactNode } from "react";
import { LuChevronRight } from "react-icons/lu";

import { MobileBrand } from "@/components/shell/mobile-nav";

export interface Crumb {
  label: string;
  href?: string;
}

/** Sticky glass topbar with breadcrumbs. */
export function Topbar({ crumbs, right }: { crumbs: Crumb[]; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-[58px] items-center gap-3.5 border-b border-white/[0.075] bg-[oklch(13%_.025_210/.62)] px-6 backdrop-blur-[26px] backdrop-saturate-150">
      <MobileBrand />

      <nav className="hidden items-center gap-2 text-[13px] text-ink-3 lg:flex" aria-label="Breadcrumb">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;

          return (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <LuChevronRight className="size-3 opacity-40" /> : null}
              {crumb.href && !last ? (
                <Link href={crumb.href} className="transition-colors hover:text-ink">
                  {crumb.label}
                </Link>
              ) : (
                <span className={last ? "font-medium text-ink" : undefined}>{crumb.label}</span>
              )}
            </span>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2.5">{right}</div>
    </header>
  );
}
