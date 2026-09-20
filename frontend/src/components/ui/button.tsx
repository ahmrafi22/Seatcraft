import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/cn";

type Variant = "primary" | "default" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "text-white bg-[linear-gradient(140deg,oklch(62%_.25_296),oklch(64%_.24_330)_60%,oklch(70%_.19_8))] " +
    "shadow-[inset_0_1px_0_oklch(100%_0_0/.45),inset_0_-1px_0_oklch(0%_0_0/.25),0_0_0_1px_oklch(100%_0_0/.12),0_10px_26px_-12px_oklch(64%_.25_300/.95)] " +
    "hover:brightness-110",
  default: "glass-ctl text-ink hover:bg-white/[0.12]",
  ghost: "text-ink-2 hover:bg-white/[0.07] hover:text-ink",
  danger:
    "text-white bg-[linear-gradient(140deg,oklch(60%_.23_22),oklch(64%_.24_350))] " +
    "shadow-[inset_0_1px_0_oklch(100%_0_0/.4),0_0_0_1px_oklch(100%_0_0/.1),0_10px_26px_-14px_oklch(62%_.24_22/.9)] " +
    "hover:brightness-110"
};

const SIZES: Record<Size, string> = {
  sm: "h-[30px] px-3 text-[12.5px] rounded-lg gap-1.5",
  md: "h-9 px-4 text-[13.5px] rounded-[var(--radius-ctl)] gap-2",
  lg: "h-11 px-6 text-[14.5px] rounded-[var(--radius-ctl)] gap-2"
};

const BASE =
  "inline-flex select-none items-center justify-center whitespace-nowrap font-medium " +
  "transition-[background,box-shadow,transform,filter,color] duration-150 ease-[var(--ease-out-soft)] " +
  "active:scale-[.985] disabled:pointer-events-none disabled:opacity-40 " +
  "[&_svg]:size-3.5 [&_svg]:shrink-0";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = "default",
  size = "md",
  icon,
  iconRight,
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="size-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
        />
      ) : (
        icon
      )}
      {children}
      {iconRight}
    </button>
  );
}

/** Same visual language, rendered as a Next link. */
export function ButtonLink({
  href,
  variant = "default",
  size = "md",
  icon,
  iconRight,
  className,
  children
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(BASE, VARIANTS[variant], SIZES[size], className)}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}
