"use client";

import { cn } from "@/lib/cn";

/** Controlled switch used by the constraint rules. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  size = "md"
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const track = size === "sm" ? "h-[19px] w-[34px]" : "h-[21px] w-[38px]";
  const knob = size === "sm" ? "size-[13px]" : "size-[15px]";
  const travel = size === "sm" ? "translate-x-[15px]" : "translate-x-[17px]";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative shrink-0 cursor-pointer rounded-full border-none transition-[background,box-shadow] duration-200",
        "shadow-[inset_0_1px_2px_oklch(0%_0_0/.35),0_0_0_1px_var(--edge)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        track,
        checked
          ? "bg-[linear-gradient(100deg,oklch(96%_0_0),oklch(78%_0_0))] shadow-[inset_0_1px_0_oklch(100%_0_0/.35),0_0_14px_-2px_oklch(100%_0_0/.35)]"
          : "bg-white/[0.10]"
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] left-[3px] rounded-full bg-[oklch(96%_0_0)]",
          "shadow-[0_1px_3px_oklch(0%_0_0/.5),inset_0_1px_0_oklch(100%_0_0/.9)]",
          "transition-transform duration-200 ease-[var(--ease-out-soft)]",
          knob,
          checked && travel
        )}
      />
    </button>
  );
}
