import { cn } from "@/lib/cn";

/**
 * Placeholder shown while a route's server component is fetching. Next swaps it
 * for the real content as soon as the segment resolves, so a slow navigation
 * shows structure immediately instead of a frozen page.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[7px] bg-white/[0.06]", className)} />;
}

/** Mirrors the shell every page uses: topbar strip, heading, then panes. */
export function PageSkeleton({ panes = 3 }: { panes?: number }) {
  return (
    <>
      <div className="flex h-[58px] items-center gap-3.5 border-b border-white/[0.075] px-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>

      <main className="mx-auto w-full max-w-[1280px] px-6 py-6">
        <div className="mb-5">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="mt-3 h-6 w-52" />
          <Skeleton className="mt-2.5 h-3 w-full max-w-[420px]" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            {Array.from({ length: panes }, (_, index) => (
              <div key={index} className="glass-pane overflow-hidden rounded-[var(--radius-pane)]">
                <div className="flex min-h-[52px] items-center border-b border-white/[0.07] px-5">
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="space-y-3 px-5 py-5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-[92%]" />
                  <Skeleton className="h-3 w-[76%]" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="glass-pane overflow-hidden rounded-[var(--radius-pane)]">
              <div className="flex min-h-[52px] items-center border-b border-white/[0.07] px-5">
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-3 px-5 py-5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-[70%]" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
