/**
 * Institutions get a lightness step from a fixed ash ramp, so the same college
 * always reads as the same tile across the dashboard, the roster and the hall
 * board. Hue carries no meaning here: the palette is monochrome, and the steps
 * are far enough apart to stay distinguishable side by side.
 */
const LIGHTNESS = [88, 74, 62, 94, 68, 82, 56, 90, 78, 64, 86, 70];

export function stepFor(seed: string): number {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100_000;
  }

  return LIGHTNESS[hash % LIGHTNESS.length] ?? 80;
}

export function institutionColor(seed: string, lightness?: number): string {
  return `oklch(${lightness ?? stepFor(seed)}% 0 0)`;
}

/** Soft seat fill: readable number on a tinted glass tile. */
export function seatFill(seed: string): string {
  return `oklch(${stepFor(seed)}% 0 0 / 0.26)`;
}

export function seatRim(seed: string): string {
  return `oklch(${stepFor(seed)}% 0 0 / 0.55)`;
}

export function seatInk(seed: string): string {
  return `oklch(${Math.min(98, stepFor(seed) + 12)}% 0 0)`;
}
