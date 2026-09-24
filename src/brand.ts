/**
 * Jazz's logo, in four styles, drawn as SVG.
 *
 * The same drawing goes on the screen in My brand and onto every sheet that
 * carries her brand: the diary cover, business cards and logo stickers.
 * `logo()` draws into a square box at (x, y) of the given size, in whatever
 * units the surrounding SVG uses (millimetres on sheets, pixels on screen).
 */
import { light, fontOf, type Look, type LogoStyle } from './look';
import { face } from './character';

export const LOGO_STYLES: Array<{ id: LogoStyle; label: string }> = [
  { id: 'badge', label: 'Badge' },
  { id: 'stamp', label: 'Stamp' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'monogram', label: 'Tag' }
];

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const on = (c: string): string => (light(c) > 0.6 ? '#111111' : '#FFFFFF');

/** Shrinks words to fit a width, roughly, since SVG will not wrap for us. */
export function fit (text: string, width: number, size: number): number {
  const guess = text.length * size * 0.6;
  return guess > width ? Math.max(1, size * width / guess) : size;
}

let n = 0;

export function logo (look: Look, x: number, y: number, size: number): string {
  const id = `lg${++n}`;
  const b = look.brand;
  const u = size / 100;
  // The face itself comes from the surrounding <svg>'s style: var() does not work in an attribute.
  const font = 'font-weight="800"';
  // The brand's own initial: Sukhi Studio's crest has an S, whoever is making it.
  const initial = esc((b.name.trim()[0] ?? 'S').toUpperCase());
  const inner = (cx: number, cy: number, r: number): string => b.me
    ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${look.accent2}"/>${face(b.pose ?? look.pose, cx, cy, r * 0.94, `${id}f`)}`
    : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${look.accent2}"/>` +
      `<text x="${cx}" y="${cy + r * 0.36}" text-anchor="middle" font-size="${r * 1.05}" fill="${on(look.accent2)}" ${font}>${initial}</text>`;

  let body = '';
  switch (b.style) {
    case 'badge': {
      const name = b.name.toUpperCase();
      const tag = b.tagline.toUpperCase();
      body = `<circle cx="50" cy="50" r="49" fill="${look.accent}"/>` +
        `<circle cx="50" cy="50" r="46.5" fill="none" stroke="${on(look.accent)}" stroke-width=".7" stroke-dasharray="1.6 1.4" opacity=".6"/>` +
        `<path id="${id}t" d="M 14 50 A 36 36 0 0 1 86 50" fill="none"/>` +
        `<path id="${id}b" d="M 11 50 A 39 39 0 0 0 89 50" fill="none"/>` +
        `<text font-size="${fit(name, 100, 10.5)}" fill="${on(look.accent)}" ${font} letter-spacing=".8"><textPath href="#${id}t" startOffset="50%" text-anchor="middle">${esc(name)}</textPath></text>` +
        `<text font-size="${fit(tag, 105, 6)}" fill="${on(look.accent)}" ${font} letter-spacing=".6"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">${esc(tag)}</textPath></text>` +
        inner(50, 50, 26);
      break;
    }
    case 'stamp': {
      // A postage stamp: perforated edges (the holes are the page showing
      // through), a picture in a frame, and the name along the bottom.
      let holes = '';
      for (let i = 0; i <= 9; i++) {
        const t = 14 + i * 8;
        holes += `<circle cx="${t}" cy="4" r="2.2" fill="#fff"/><circle cx="${t}" cy="96" r="2.2" fill="#fff"/>`;
      }
      for (let i = 0; i <= 11; i++) {
        const t = 6 + i * 8;
        holes += `<circle cx="14" cy="${t}" r="2.2" fill="#fff"/><circle cx="86" cy="${t}" r="2.2" fill="#fff"/>`;
      }
      body = `<rect x="14" y="4" width="72" height="92" fill="${look.paper}"/>` + holes +
        `<rect x="20" y="10" width="60" height="58" rx="2" fill="${look.accent}"/>` +
        `<rect x="22.5" y="12.5" width="55" height="53" rx="1.5" fill="none" stroke="${on(look.accent)}" stroke-width=".6" opacity=".6"/>` +
        inner(50, 39, 20) +
        `<text x="76" y="20" text-anchor="end" font-size="6" fill="${on(look.accent)}" ${font}>1st</text>` +
        `<text x="50" y="80" text-anchor="middle" font-size="${fit(b.name, 60, 9)}" fill="${look.ink}" ${font}>${esc(b.name)}</text>` +
        `<text x="50" y="88.5" text-anchor="middle" font-size="${fit(b.tagline, 60, 4.4)}" fill="${look.accent}" ${font} letter-spacing=".3">${esc(b.tagline)}</text>`;
      break;
    }
    case 'ribbon': {
      body = `<path d="M2 58 L12 58 L8 66 L12 74 L2 74Z M98 58 L88 58 L92 66 L88 74 L98 74Z" fill="${look.accent2}"/>` +
        `<rect x="10" y="54" width="80" height="24" rx="3" fill="${look.accent}"/>` +
        `<text x="50" y="70" text-anchor="middle" font-size="${fit(b.name, 74, 11)}" fill="${on(look.accent)}" ${font}>${esc(b.name)}</text>` +
        `<text x="50" y="90" text-anchor="middle" font-size="${fit(b.tagline, 90, 6)}" fill="${look.accent}" ${font}>${esc(b.tagline)}</text>` +
        inner(50, 30, 22);
      break;
    }
    default: {
      // A name tag: a rounded tag in her colour, the picture (or initial)
      // in a ringed circle at one end, the name large beside it and the line
      // under that. Like a sticker on a laptop, not a coat of arms.
      body = `<rect x="2" y="27" width="96" height="46" rx="23" fill="${look.accent}"/>` +
        `<rect x="4.5" y="29.5" width="91" height="41" rx="20.5" fill="none" stroke="${on(look.accent)}" stroke-width=".6" stroke-dasharray="1.6 1.4" opacity=".55"/>` +
        `<circle cx="25" cy="50" r="19.5" fill="${on(look.accent)}"/>` +
        inner(25, 50, 17.5) +
        `<text x="49" y="50" font-size="${fit(b.name, 45, 10)}" fill="${on(look.accent)}" ${font}>${esc(b.name)}</text>` +
        `<text x="49" y="60" font-size="${fit(b.tagline, 45, 4.6)}" fill="${on(look.accent)}" ${font} opacity=".85">${esc(b.tagline)}</text>`;
    }
  }
  return `<g transform="translate(${x} ${y}) scale(${u})">${body}</g>`;
}

/**
 * Each style's own outline, in the logo's 0 to 100 box, a little outside the
 * drawing: where to cut, so a logo sticker is the badge itself rather than a
 * square with a badge on it.
 */
export function logoOutline (style: LogoStyle): string {
  switch (style) {
    case 'badge': return 'M50 -1.5 A51.5 51.5 0 1 1 49.99 -1.5Z';
    case 'stamp': return 'M11 1 H89 V99 H11Z';
    case 'ribbon': return 'M8 51 H36.4 A25 25 0 1 1 63.6 51 H92 A8 8 0 0 1 100 59 V89 A8 8 0 0 1 92 97 H8 A8 8 0 0 1 0 89 V59 A8 8 0 0 1 8 51Z';
    default: return 'M24.5 24.5 H75.5 A25.5 25.5 0 0 1 75.5 75.5 H24.5 A25.5 25.5 0 0 1 24.5 24.5Z';
  }
}

/**
 * Just the logo's middle, her character or her initial in a ring, for a
 * business card, where the words around a whole logo would only say again
 * what the card says.
 */
export function logoMark (look: Look, cx: number, cy: number, r: number): string {
  const b = look.brand;
  const id = `lm${++n}`;
  const initial = esc((b.name.trim()[0] ?? 'S').toUpperCase());
  return `<circle cx="${cx}" cy="${cy}" r="${r + r * 0.12}" fill="#fff"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${look.accent2}"/>` +
    (b.me
      ? face(b.pose ?? look.pose, cx, cy, r * 0.96, `${id}f`)
      : `<text x="${cx}" y="${cy + r * 0.36}" text-anchor="middle" font-size="${r * 1.05}" font-weight="800" fill="${on(look.accent2)}">${initial}</text>`) +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${look.accent}" stroke-width="${r * 0.08}"/>`;
}

/** A logo on its own, for the screen. */
export function logoSvg (look: Look, cls = ''): string {
  return `<svg class="${cls}" viewBox="0 0 100 100" role="img" aria-label="${esc(look.brand.name)} logo" style="font-family:${fontOf(look)}">${logo(look, 0, 0, 100)}</svg>`;
}
