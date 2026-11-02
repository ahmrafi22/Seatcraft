/**
 * Institutions get a colour from their code so the same college is always the
 * same hue across the dashboard, the roster and the hall board.
 * Teal → sky → emerald, with amber and warm reds kept for contrast.
 * No violet or pink: nothing in the 270–345 band.
 */
const HUES = [192, 232, 162, 205, 186, 250, 175, 218, 200, 226, 182, 212];

export function hueFor(seed: string): number {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100_000;
  }

  return HUES[hash % HUES.length] ?? 192;
}

export function institutionColor(seed: string, lightness = 72, chroma = 0.18): string {
  return `oklch(${lightness}% ${chroma} ${hueFor(seed)})`;
}

/** Soft seat fill: readable number on a tinted glass tile. */
export function seatFill(seed: string): string {
  return `color-mix(in oklch, oklch(80% .17 ${hueFor(seed)}) 30%, transparent)`;
}

export function seatRim(seed: string): string {
  return `color-mix(in oklch, oklch(82% .17 ${hueFor(seed)}) 58%, transparent)`;
}

export function seatInk(seed: string): string {
  return `color-mix(in oklch, oklch(88% .13 ${hueFor(seed)}) 70%, white)`;
}
