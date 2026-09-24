/**
 * The studio backgrounds, drawn as a repeating tile in their own colours.
 *
 * Each is a small SVG, 240 pixels square, turned into a data URL and repeated
 * behind everything. Drawn rather than fetched, and redrawn from the current
 * colours, so a background always matches the colour set they picked. Kept
 * faint (the page is for making things, not for the wallpaper) and scattered
 * so the repeat is hard to spot.
 */
import type { Look, Backdrop } from './look';

const TILE = 240;

/** A small deterministic scatter, so the pattern is the same every time. */
function scatter (n: number, seed: number): Array<[number, number, number]> {
  let s = seed;
  const next = (): number => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  return Array.from({ length: n }, () => [next() * TILE, next() * TILE, next()]);
}

const STAR = (x: number, y: number, r: number): string => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join('L')}Z`;
};

export function backdropSvg (kind: Backdrop, look: Look): string {
  const { ink, accent, accent2 } = look;
  let body = '';
  switch (kind) {
    case 'stars':
      for (const [x, y, t] of scatter(26, 7)) {
        body += t < 0.8
          ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.6 + t * 1.2).toFixed(1)}" fill="${ink}" opacity="${(0.35 + t * 0.4).toFixed(2)}"/>`
          : `<path d="${STAR(x, y, 4 + t * 3)}" fill="${t > 0.9 ? accent2 : accent}" opacity=".7"/>`;
      }
      break;
    case 'confetti':
      for (const [x, y, t] of scatter(22, 11)) {
        const c = [accent, accent2, ink][Math.floor(t * 3)];
        body += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(7 + t * 5).toFixed(1)}" height="3" rx="1.5" fill="${c}" ` +
          `opacity=".45" transform="rotate(${Math.round(t * 360)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      }
      break;
    case 'bubbles':
      for (const [x, y, t] of scatter(12, 23)) {
        const r = 5 + t * 18;
        const c = t > 0.5 ? accent : accent2;
        body += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}" fill-opacity=".08" stroke="${c}" stroke-opacity=".4" stroke-width="1.5"/>` +
          `<circle cx="${(x - r * 0.35).toFixed(1)}" cy="${(y - r * 0.35).toFixed(1)}" r="${(r * 0.18).toFixed(1)}" fill="${ink}" opacity=".35"/>`;
      }
      break;
    case 'squiggles': {
      const shapes = [
        (x: number, y: number): string => `M${x} ${y} q6 -10 12 0 t12 0 t12 0`,
        (x: number, y: number): string => `M${x} ${y} l6 -8 l6 8 l6 -8 l6 8`,
        (x: number, y: number): string => `M${x} ${y} c8 -12 20 -2 10 6 c-8 6 -14 -4 -4 -8`,
        (x: number, y: number): string => `M${x - 6} ${y} h12 M${x} ${y - 6} v12`
      ];
      for (const [i, [x, y, t]] of scatter(16, 5).entries()) {
        const c = [accent, accent2, ink][i % 3];
        body += `<path d="${shapes[Math.floor(t * shapes.length)](Math.round(x), Math.round(y))}" fill="none" stroke="${c}" ` +
          `stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".45"/>`;
      }
      break;
    }
    default:
      return 'none';
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
