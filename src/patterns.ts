/**
 * Patterns, as SVG, for the screens and everything that gets printed.
 *
 * SVG rather than images because a printer wants vectors: a sticker sheet
 * printed from these is as crisp at the edge of a sticker as in the middle,
 * and nothing is fetched to draw them.
 *
 * Each pattern is a tile, repeated by an SVG <pattern> in her colours.
 * `defs(id, which, look)` returns the definition; fill a shape with
 * `url(#id)` to use it. The geometric ones come first: she is past hearts.
 */
import type { Look } from './look';

export type PatternName =
  | 'zigzag' | 'waves' | 'triangles' | 'grid' | 'bolts' | 'plus'
  | 'dots' | 'stripes' | 'stars' | 'checks' | 'confetti' | 'hearts' | 'plain';

export const PATTERNS: Array<{ id: PatternName; label: string }> = [
  { id: 'zigzag', label: 'Zigzag' },
  { id: 'waves', label: 'Waves' },
  { id: 'triangles', label: 'Triangles' },
  { id: 'grid', label: 'Grid' },
  { id: 'bolts', label: 'Lightning' },
  { id: 'plus', label: 'Plus' },
  { id: 'dots', label: 'Dots' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'stars', label: 'Stars' },
  { id: 'checks', label: 'Checks' },
  { id: 'confetti', label: 'Confetti' },
  { id: 'hearts', label: 'Hearts' },
  { id: 'plain', label: 'Plain' }
];

export const isPattern = (p: string): p is PatternName => PATTERNS.some((x) => x.id === p);

const HEART = 'M5 8.6 C1.2 5.8 1 3.4 2.4 2.3 C3.5 1.5 4.6 2 5 3 C5.4 2 6.5 1.5 7.6 2.3 C9 3.4 8.8 5.8 5 8.6Z';
const STAR = 'M5 1 L6.2 3.8 L9.2 4 L6.9 5.9 L7.6 8.9 L5 7.3 L2.4 8.9 L3.1 5.9 L0.8 4 L3.8 3.8Z';
const BOLT = 'M5.6 0.6 L2 5.6 H4.6 L3.8 9.4 L8 3.8 H5.3Z';

export function defs (id: string, which: PatternName, look: Look, scale = 1): string {
  const s = (n: number): number => +(n * scale).toFixed(2);
  const { paper, accent, accent2 } = look;
  const tile = (w: number, h: number, inner: string): string =>
    `<pattern id="${id}" width="${s(w)}" height="${s(h)}" patternUnits="userSpaceOnUse">` +
    `<rect width="${s(w)}" height="${s(h)}" fill="${paper}"/>${inner}</pattern>`;
  const path = (d: string, fill: string, tx: number, ty: number, k = 1): string =>
    `<path transform="scale(${scale}) translate(${tx} ${ty}) scale(${k})" d="${d}" fill="${fill}"/>`;

  switch (which) {
    case 'zigzag':
      return tile(10, 8, `<path d="M0 ${s(3)} L${s(2.5)} ${s(0.8)} L${s(5)} ${s(3)} L${s(7.5)} ${s(0.8)} L${s(10)} ${s(3)}" fill="none" stroke="${accent}" stroke-width="${s(1.3)}"/>` +
        `<path d="M0 ${s(7)} L${s(2.5)} ${s(4.8)} L${s(5)} ${s(7)} L${s(7.5)} ${s(4.8)} L${s(10)} ${s(7)}" fill="none" stroke="${accent2}" stroke-width="${s(0.8)}"/>`);
    case 'waves':
      return tile(12, 8, `<path d="M0 ${s(2.5)} Q${s(3)} 0 ${s(6)} ${s(2.5)} T${s(12)} ${s(2.5)}" fill="none" stroke="${accent}" stroke-width="${s(1.2)}"/>` +
        `<path d="M0 ${s(6.5)} Q${s(3)} ${s(4)} ${s(6)} ${s(6.5)} T${s(12)} ${s(6.5)}" fill="none" stroke="${accent2}" stroke-width="${s(0.8)}"/>`);
    case 'triangles':
      return tile(10, 10, `<path d="M${s(0.5)} ${s(4.5)} L${s(2.5)} ${s(0.8)} L${s(4.5)} ${s(4.5)}Z" fill="${accent}"/>` +
        `<path d="M${s(5.5)} ${s(5.5)} L${s(7.5)} ${s(9.2)} L${s(9.5)} ${s(5.5)}Z" fill="${accent2}"/>`);
    case 'grid':
      return tile(8, 8, `<path d="M0 0 H${s(8)} M0 0 V${s(8)}" stroke="${accent}" stroke-width="${s(0.6)}" opacity=".8"/>` +
        `<circle cx="${s(4)}" cy="${s(4)}" r="${s(0.7)}" fill="${accent2}"/>`);
    case 'bolts':
      return tile(12, 12, path(BOLT, accent, 1, 1) + path(BOLT, accent2, 7.2, 6.4, 0.5));
    case 'plus':
      return tile(10, 10, `<path d="M${s(2.5)} ${s(1)} V${s(4)} M${s(1)} ${s(2.5)} H${s(4)}" stroke="${accent}" stroke-width="${s(1)}" stroke-linecap="round"/>` +
        `<path d="M${s(7.5)} ${s(6)} V${s(9)} M${s(6)} ${s(7.5)} H${s(9)}" stroke="${accent2}" stroke-width="${s(1)}" stroke-linecap="round"/>`);
    case 'dots':
      return tile(10, 10, `<circle cx="${s(2.5)}" cy="${s(2.5)}" r="${s(1.3)}" fill="${accent}"/>` +
        `<circle cx="${s(7.5)}" cy="${s(7.5)}" r="${s(1.3)}" fill="${accent2}"/>`);
    case 'stripes':
      return tile(10, 10, `<rect width="${s(10)}" height="${s(3.2)}" fill="${accent}" opacity=".85"/>` +
        `<rect y="${s(5)}" width="${s(10)}" height="${s(1.4)}" fill="${accent2}" opacity=".9"/>`);
    case 'stars':
      return tile(12, 12, path(STAR, accent, 1, 1) + path(STAR, accent2, 7.5, 7.5, 0.45));
    case 'hearts':
      return tile(12, 12, path(HEART, accent, 1, 1) + path(HEART, accent2, 7, 7, 0.5));
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
