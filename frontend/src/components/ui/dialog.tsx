"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { LuX } from "react-icons/lu";

import { cn } from "@/lib/cn";

/**
 * Modal built on the native <dialog> element, so focus trapping, Escape and
 * the backdrop come from the browser rather than from hand-written JS.
 *
 * `onClose` is wired to the dialog's own `close` event, which fires for Escape
 * as well as the X button — one path, so state can't drift out of sync.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // A click that lands on the dialog element itself is a backdrop click;
        // anything inside the panel stops here and keeps the modal open.
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[min(560px,calc(100vw-2rem))] rounded-[var(--radius-pane)] border-0 bg-transparent p-0",
        "backdrop:bg-[oklch(0%_0_0/.72)] backdrop:backdrop-blur-sm",
        className
      )}
    >
      <div className="glass-pane overflow-hidden rounded-[var(--radius-pane)] bg-[oklch(20%_0_0/.96)] shadow-[0_40px_80px_-40px_oklch(0%_0_0/1)]">
        <div className="flex items-start gap-3 border-b border-white/[0.07] px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
            {description ? <p className="mt-0.5 text-[12.5px] text-ink-3">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-white/[0.08] hover:text-ink"
          >
            <LuX className="size-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </dialog>
  );
}
