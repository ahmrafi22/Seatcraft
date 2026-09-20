import { LuSparkles } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { demoLoginAction } from "@/app/actions/demo";

/** Server-rendered form so the demo button works without shipping a client bundle. */
export function DemoLoginButton({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;

  return (
    <form action={demoLoginAction}>
      <Button type="submit" variant="default" size="lg" className="w-full" icon={<LuSparkles />}>
        Sign in to the demo tenant
      </Button>
    </form>
  );
}
