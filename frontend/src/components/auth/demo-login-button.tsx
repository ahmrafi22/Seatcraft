import { LuSparkles } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { demoLoginAction } from "@/app/actions/demo";

/** Server-rendered form so the demo button works without shipping a client bundle. */
export function DemoLoginButton({
  enabled,
  size = "lg",
  fullWidth = false
}: {
  enabled: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}) {
  if (!enabled) return null;

  return (
    <form action={demoLoginAction} className={fullWidth ? "w-full" : undefined}>
      <Button
        type="submit"
        variant="primary"
        size={size}
        className={fullWidth ? "w-full" : undefined}
        icon={<LuSparkles />}
      >
        Get the demo — no signup
      </Button>
    </form>
  );
}
