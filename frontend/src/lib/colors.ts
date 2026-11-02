/**
 * Seats are the one place colour survives the monochrome scheme.
 *
 * The first attempt used a narrow hue band at very low chroma, which read as
 * eight slightly different greys. This is a jewel palette instead: hues spread
 * right around the wheel, chroma high enough to actually name the colour, and
 * lightness alternating so neighbouring colleges separate on tone as well as
 * hue — which also keeps them apart for colour-blind readers.
 *
 * Tiles stay in a light band with dark ink, so the board reads as coloured
 * chips on charcoal rather than a candy store. That is the "goes with
 * monochrome" part: the chrome around them is still white on ash.
 */
const TINTS = [
  { lightness: 70, chroma: 0.15, hue: 15 }, // coral
  { lightness: 76, chroma: 0.15, hue: 40 }, // orange
  { lightness: 82, chroma: 0.13, hue: 65 }, // gold
  { lightness: 78, chroma: 0.14, hue: 95 }, // chartreuse
  { lightness: 72, chroma: 0.15, hue: 130 }, // lime
  { lightness: 76, chroma: 0.14, hue: 155 }, // green
  { lightness: 70, chroma: 0.13, hue: 175 }, // sea
  { lightness: 78, chroma: 0.12, hue: 195 }, // teal
  { lightness: 72, chroma: 0.14, hue: 215 }, // cyan
  { lightness: 76, chroma: 0.15, hue: 240 }, // blue
  { lightness: 70, chroma: 0.16, hue: 265 }, // indigo
  { lightness: 74, chroma: 0.15, hue: 288 } // violet
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

/** Solid colour, for bars, dots and legends. */
export function institutionColor(seed: string): string {
  const tint = tintFor(seed);
  return `oklch(${tint.lightness}% ${tint.chroma} ${tint.hue})`;
}

/**
 * Seat fill. Near-opaque with a slight top-to-bottom lift, because a 30%-alpha
 * wash over charcoal is what made every tile look identical last time.
 */
export function seatFill(seed: string): string {
  const tint = tintFor(seed);
  return `linear-gradient(158deg, oklch(${tint.lightness + 5}% ${tint.chroma} ${tint.hue}), oklch(${tint.lightness - 7}% ${tint.chroma} ${tint.hue}))`;
}

/** Darker, denser version of the same hue — a crisp edge instead of a glow. */
export function seatRim(seed: string): string {
  const tint = tintFor(seed);
  return `oklch(${tint.lightness - 22}% ${Math.min(0.2, tint.chroma * 1.15)} ${tint.hue} / 0.9)`;
}

/** Dark ink tinted toward the tile's own hue, so the number looks printed on it. */
export function seatInk(seed: string): string {
  const tint = tintFor(seed);
  return `oklch(20% 0.05 ${tint.hue})`;
}

/** Ash step, for chrome that must stay colourless. */
const STEPS = [88, 74, 62, 94, 68, 82, 56, 90, 78, 64, 86, 70];

export function stepFor(seed: string): number {
  return STEPS[hashOf(seed) % STEPS.length] ?? 80;
}
