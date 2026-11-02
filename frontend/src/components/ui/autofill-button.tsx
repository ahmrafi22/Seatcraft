"use client";

import { LuWandSparkles } from "react-icons/lu";

import { Button } from "@/components/ui/button";

/**
 * Fills a form with sample data without submitting it, so the values can be
 * reviewed and edited before the real submit. Each form passes a callback that
 * sets its own state; this component only renders the trigger.
 */
export function AutofillButton({
  onFill,
  label = "Autofill",
  size = "sm",
  className
}: {
  onFill: () => void;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={onFill}
      icon={<LuWandSparkles />}
      className={className}
    >
      {label}
    </Button>
  );
}
