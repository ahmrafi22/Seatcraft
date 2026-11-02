/**
 * Seats are the one place colour survives the monochrome scheme.
 *
 * Each institution gets a low-chroma tint: close enough to ash to belong to the
 * palette, far enough apart that clusters are readable on a hall board. Hue
 * alone would be a rainbow again, so the tints also vary in lightness.
 */
const TINTS = [
  { lightness: 80, chroma: 0.055, hue: 200 },
  { lightness: 74, chroma: 0.06, hue: 232 },
  { lightness: 84, chroma: 0.045, hue: 168 },
  { lightness: 70, chroma: 0.06, hue: 212 },
  { lightness: 86, chroma: 0.04, hue: 188 },
  { lightness: 76, chroma: 0.055, hue: 250 },
  { lightness: 72, chroma: 0.05, hue: 178 },
  { lightness: 82, chroma: 0.05, hue: 220 }
];

export interface Tint {
  lightness: number;
  chroma: number;
  hue: number;
}

function hashOf(seed: string): number {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100_000;
  }

  return hash;
}

/** Stable tint for an institution, so a college keeps its colour everywhere. */
export function tintFor(seed: string): Tint {
  return TINTS[hashOf(seed) % TINTS.length] ?? TINTS[0]!;
}

export function institutionColor(seed: string): string {
  const tint = tintFor(seed);
  return `oklch(${tint.lightness}% ${tint.chroma} ${tint.hue})`;
}

/** Soft seat fill: readable number on a tinted glass tile. */
export function seatFill(seed: string): string {
  const tint = tintFor(seed);
  return `oklch(${tint.lightness}% ${tint.chroma} ${tint.hue} / 0.3)`;
}

export function seatRim(seed: string): string {
  const tint = tintFor(seed);
  return `oklch(${tint.lightness}% ${tint.chroma} ${tint.hue} / 0.58)`;
}

export function seatInk(seed: string): string {
  const tint = tintFor(seed);
  return `oklch(${Math.min(98, tint.lightness + 12)}% ${tint.chroma * 0.7} ${tint.hue})`;
}

/** Ash step, for chrome that must stay colourless. */
const STEPS = [88, 74, 62, 94, 68, 82, 56, 90, 78, 64, 86, 70];

export function stepFor(seed: string): number {
  return STEPS[hashOf(seed) % STEPS.length] ?? 80;
}
