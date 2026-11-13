/**
 * Pixeldichte für große Spielflächen: scharf genug, aber nie mehr als ~2,4 Mio. Pixel.
 * Auf 4K-Fernsehern spart das ein Vielfaches an Zeichenzeit, ohne sichtbar unschärfer zu werden.
 */
export function canvasDpr(cssWidth: number, cssHeight: number, max = 2, budget = 2_400_000): number {
  const want = Math.min(max, window.devicePixelRatio || 1);
  const area = Math.max(1, cssWidth * cssHeight);
  const fit = Math.sqrt(budget / area);
  return Math.max(0.75, Math.min(want, fit));
}
