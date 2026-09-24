/**
 * Patterns, as SVG, for everything that gets printed.
 *
 * SVG rather than images because a printer wants vectors: a sticker sheet
 * printed from these is as crisp at the edge of a sticker as in the middle,
 * and nothing is fetched to draw them.
 *
 * Each pattern is a tile, repeated by an SVG <pattern> in the page's own
 * colours. `defs(id, which, look)` returns the definition; fill a shape with
 * `url(#id)` to use it.
 */
import type { Look } from './look';

export type PatternName = 'dots' | 'stripes' | 'hearts' | 'stars' | 'checks' | 'confetti' | 'plain';

export const PATTERNS: Array<{ id: PatternName; label: string }> = [
  { id: 'dots', label: 'Dots' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'hearts', label: 'Hearts' },
  { id: 'stars', label: 'Stars' },
  { id: 'checks', label: 'Gingham' },
  { id: 'confetti', label: 'Confetti' },
  { id: 'plain', label: 'Plain' }
];

const HEART = 'M5 8.6 C1.2 5.8 1 3.4 2.4 2.3 C3.5 1.5 4.6 2 5 3 C5.4 2 6.5 1.5 7.6 2.3 C9 3.4 8.8 5.8 5 8.6Z';
const STAR = 'M5 1 L6.2 3.8 L9.2 4 L6.9 5.9 L7.6 8.9 L5 7.3 L2.4 8.9 L3.1 5.9 L0.8 4 L3.8 3.8Z';

export function defs (id: string, which: PatternName, look: Look, scale = 1): string {
  const s = (n: number): number => +(n * scale).toFixed(2);
  const { paper, accent, accent2 } = look;
  const tile = (w: number, h: number, inner: string): string =>
    `<pattern id="${id}" width="${s(w)}" height="${s(h)}" patternUnits="userSpaceOnUse">` +
    `<rect width="${s(w)}" height="${s(h)}" fill="${paper}"/>${inner}</pattern>`;

  switch (which) {
    case 'dots':
      return tile(10, 10, `<circle cx="${s(2.5)}" cy="${s(2.5)}" r="${s(1.3)}" fill="${accent}"/>` +
        `<circle cx="${s(7.5)}" cy="${s(7.5)}" r="${s(1.3)}" fill="${accent2}"/>`);
    case 'stripes':
      return tile(10, 10, `<rect width="${s(10)}" height="${s(3.2)}" fill="${accent}" opacity=".75"/>` +
        `<rect y="${s(5)}" width="${s(10)}" height="${s(1.4)}" fill="${accent2}" opacity=".8"/>`);
    case 'hearts':
      return tile(12, 12, `<path transform="scale(${scale}) translate(1 1)" d="${HEART}" fill="${accent}"/>` +
        `<path transform="scale(${scale}) translate(7 7) scale(.5)" d="${HEART}" fill="${accent2}"/>`);
    case 'stars':
      return tile(12, 12, `<path transform="scale(${scale}) translate(1 1)" d="${STAR}" fill="${accent}"/>` +
        `<path transform="scale(${scale}) translate(7.5 7.5) scale(.45)" d="${STAR}" fill="${accent2}"/>`);
    case 'checks':
      return tile(10, 10, `<rect width="${s(5)}" height="${s(10)}" fill="${accent}" opacity=".35"/>` +
        `<rect width="${s(10)}" height="${s(5)}" fill="${accent}" opacity=".35"/>`);
    case 'confetti': {
      const bits = [[2, 2, accent, 20], [7, 3, accent2, -30], [4, 7, accent2, 60], [8.5, 8, accent, -10]]
        .map(([x, y, c, r]) => `<rect x="${s(x as number)}" y="${s(y as number)}" width="${s(2.2)}" height="${s(0.9)}" rx="${s(0.4)}" ` +
          `fill="${c}" transform="rotate(${r} ${s(x as number)} ${s(y as number)})"/>`).join('');
      return tile(11, 11, bits);
    }
    default:
      return tile(10, 10, '');
  }
}
