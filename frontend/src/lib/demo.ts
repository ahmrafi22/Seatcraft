import "server-only";

/**
 * The one-click demo sign-in is always on in development and off in a production
 * build unless `SEATCRAFT_DEMO_LOGIN=1` is set. Both the page and the action read
 * this, so the button and the endpoint cannot disagree — with one caveat: the
 * landing page is prerendered, so it needs the flag at build time as well
 * (see the Dockerfile ARG), while the action reads it per request.
 */
export function isDemoLoginEnabled(): boolean {
  if (process.env.SEATCRAFT_DEMO_LOGIN === "1") return true;
  if (process.env.SEATCRAFT_DEMO_LOGIN === "0") return false;

  return process.env.NODE_ENV !== "production";
}

export const DEMO_CREDENTIALS = {
  email: process.env.SEATCRAFT_DEMO_EMAIL ?? "admin@demo.test",
  password: process.env.SEATCRAFT_DEMO_PASSWORD ?? "Passw0rd!123"
};

/**
 * The one-call demo seeder writes 500 candidates, so it is a development tool.
 * The API refuses it outside Development; this flag hides the form entirely so
 * a production visitor never sees a button that is guaranteed to fail.
 */
export function isDemoSeedEnabled(): boolean {
  if (process.env.SEATCRAFT_DEMO_SEED === "1") return true;
  if (process.env.SEATCRAFT_DEMO_SEED === "0") return false;

  return process.env.NODE_ENV !== "production";
}
