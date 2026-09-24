/**
 * Pigpen, the secret alphabet: each letter is the shape of the box it sits in
 * on a noughts-and-crosses grid or an X, with a dot for the second set.
 *
 *    A|B|C     J.|K.|L.      \ S /      \ W. /
 *    -+-+-     --+--+--    T  X  U    X.  X  .Y
 *    D|E|F     M.|N.|O.      / V \      / Z. \
 *    -+-+-     --+--+--
 *    G|H|I     P.|Q.|R.
 *
 * It is written by hand, so a friend with the key can read it and nobody else
 * can. The glyphs are drawn in a unit box and scaled to wherever they go.
 */
import type { Look } from '../look';
import { light } from '../look';
import { logo } from '../brand';

type Glyph = { lines: string; dot: [number, number] | null };

/** The shape for one letter, in a 0..1 box. Null for anything that is not A to Z. */
export function glyph (ch: string): Glyph | null {
  const i = ch.toUpperCase().charCodeAt(0) - 65;
  if (i < 0 || i > 25) return null;
  if (i < 18) {
    const p = i % 9;
    const r = Math.floor(p / 3);
    const c = p % 3;
    let d = '';
    if (r > 0) d += 'M0 0 H1 ';
    if (r < 2) d += 'M0 1 H1 ';
    if (c > 0) d += 'M0 0 V1 ';
    if (c < 2) d += 'M1 0 V1 ';
    return { lines: d, dot: i >= 9 ? [0.5, 0.5] : null };
  }
  const q = (i - 18) % 4;
  const shapes: Array<[string, [number, number]]> = [
    ['M0 0 L0.5 0.8 L1 0', [0.5, 0.3]],
    ['M0 0 L0.8 0.5 L0 1', [0.3, 0.5]],
    ['M1 0 L0.2 0.5 L1 1', [0.7, 0.5]],
    ['M0 1 L0.5 0.2 L1 1', [0.5, 0.72]]
  ];
  const [lines, dot] = shapes[q];
  return { lines, dot: i >= 22 ? dot : null };
}

/** One letter at (x, y), `s` wide. Anything that is not a letter is written as itself. */
export function draw (ch: string, x: number, y: number, s: number, stroke: string, width: number): string {
  const g = glyph(ch);
  if (!g) {
    return /\S/.test(ch)
      ? `<text x="${x + s / 2}" y="${y + s * 0.8}" text-anchor="middle" font-size="${s}" font-weight="800" fill="${stroke}">${ch.replace(/[&<>"']/g, '')}</text>`
      : '';
  }
  return `<path transform="translate(${x} ${y}) scale(${s})" d="${g.lines}" fill="none" stroke="${stroke}" stroke-width="${width / s}" stroke-linecap="round" stroke-linejoin="round"/>` +
    (g.dot ? `<circle cx="${x + g.dot[0] * s}" cy="${y + g.dot[1] * s}" r="${s * 0.09}" fill="${stroke}"/>` : '');
}

/** Lays a message out in lines of glyphs, breaking between words. */
export function layout (message: string, width: number, s: number): Array<{ ch: string; x: number; y: number }> {
  const step = s * 1.3;
  const space = s * 0.8;
  const out: Array<{ ch: string; x: number; y: number }> = [];
  let x = 0;
  let y = 0;
  for (const word of message.toUpperCase().split(/\s+/).filter(Boolean)) {
    const w = word.length * step;
    if (x > 0 && x + w > width) { x = 0; y += s * 1.7; }
    for (const ch of word) { out.push({ ch, x, y }); x += step; }
    x += space;
  }
  return out;
}

/** The key: both grids and both Xs with the letters in them, for a friend. */
export function key (x: number, y: number, cell: number, ink: string, accent: string): string {
  let out = '';
  const letter = (ch: string, cx: number, cy: number, dot: boolean): string =>
    `<text x="${cx}" y="${cy + cell * 0.14}" text-anchor="middle" font-size="${cell * 0.38}" font-weight="800" fill="${ink}">${ch}</text>` +
    (dot ? `<circle cx="${cx + cell * 0.26}" cy="${cy - cell * 0.18}" r="${cell * 0.06}" fill="${accent}"/>` : '');
  for (let g = 0; g < 2; g++) {
    const gx = x + g * cell * 3.6;
    out += `<path d="M${gx + cell} ${y} V${y + cell * 3} M${gx + cell * 2} ${y} V${y + cell * 3} M${gx} ${y + cell} H${gx + cell * 3} M${gx} ${y + cell * 2} H${gx + cell * 3}" stroke="${accent}" stroke-width="${cell * 0.06}" stroke-linecap="round"/>`;
    for (let p = 0; p < 9; p++) out += letter(String.fromCharCode(65 + g * 9 + p), gx + (p % 3 + 0.5) * cell, y + (Math.floor(p / 3) + 0.5) * cell, g === 1);
  }
  for (let g = 0; g < 2; g++) {
    const gx = x + 7.2 * cell + g * cell * 3.6;
    const c = cell * 3;
    out += `<path d="M${gx} ${y} L${gx + c} ${y + c} M${gx + c} ${y} L${gx} ${y + c}" stroke="${accent}" stroke-width="${cell * 0.06}" stroke-linecap="round"/>`;
    const spots: Array<[number, number]> = [[0.5, 0.2], [0.2, 0.5], [0.8, 0.5], [0.5, 0.8]];
    spots.forEach(([fx, fy], k) => { out += letter(String.fromCharCode(83 + g * 4 + k), gx + fx * c, y + fy * c, g === 1); });
  }
  return out;
}

/** The printed page: the message in pigpen, and a key to cut off and give to a friend. */
export function secretSheet (message: string, look: Look): string {
  const ink = light(look.ink) > 0.6 ? look.paper : look.ink;
  const s = 11;
  const glyphs = layout(message || 'Hello', 176, s).filter((g) => g.y < 150);
  const body = `<rect x="10" y="10" width="190" height="8" rx="3" fill="${look.accent}"/>` +
    logo(look, 14, 22, 26) +
    `<text x="46" y="36" font-size="10" font-weight="900" fill="${ink}">Top secret</text>` +
    `<text x="46" y="43" font-size="4" fill="${look.accent}" font-weight="700">Only someone with the key can read this</text>` +
    glyphs.map((g) => draw(g.ch, 17 + g.x, 60 + g.y, s, ink, 1.1)).join('') +
    `<rect x="12" y="206" width="186" height="78" rx="5" fill="none" stroke="${ink}" stroke-width=".35" stroke-dasharray="2 1.6" opacity=".6"/>` +
    `<text x="20" y="217" font-size="5" font-weight="900" fill="${ink}">The key</text>` +
    `<text x="192" y="217" text-anchor="end" font-size="3.5" fill="${ink}" opacity=".7">Cut this off and give it to a friend</text>` +
    key(20, 228, 12.4, ink, look.accent);
  return `<svg class="sheet-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" role="img" aria-label="Secret message" style="font-family:var(--lettering)">` +
    `<rect width="210" height="297" fill="#fff"/>${body}</svg>`;
}
