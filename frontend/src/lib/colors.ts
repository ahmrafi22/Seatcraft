/**
 * Institutions get a colour from their code so the same college is always the
 * same hue across the dashboard, the roster and the hall board.
 */
const HUES = [298, 205, 162, 82, 348, 258, 22, 190, 275, 130, 320, 52];

export function hueFor(seed: string): number {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100_000;
  }

  return HUES[hash % HUES.length] ?? 298;
}

export function institutionColor(seed: string, lightness = 72, chroma = 0.18): string {
  return `oklch(${lightness}% ${chroma} ${hueFor(seed)})`;
}

/** Soft seat fill: readable number on a tinted glass tile. */
export function seatFill(seed: string): string {
  return `color-mix(in oklch, oklch(72% .18 ${hueFor(seed)}) 22%, transparent)`;
}

export function seatRim(seed: string): string {
  return `color-mix(in oklch, oklch(72% .18 ${hueFor(seed)}) 48%, transparent)`;
}

export function seatInk(seed: string): string {
  return `color-mix(in oklch, oklch(72% .18 ${hueFor(seed)}) 45%, white)`;
}
