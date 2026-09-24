/**
 * Jazz's logo, in four styles, drawn as SVG.
 *
 * The same drawing goes on the screen in My brand and onto every sheet that
 * carries her brand: diary covers, planners, letter paper, business cards.
 * `logo()` draws into a square box at (x, y) of the given size, in whatever
 * units the surrounding SVG uses (millimetres on sheets, pixels on screen).
 */
import { light, type Look, type LogoStyle } from './look';
import { face } from './character';

export const LOGO_STYLES: Array<{ id: LogoStyle; label: string }> = [
  { id: 'badge', label: 'Badge' },
  { id: 'stamp', label: 'Stamp' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'monogram', label: 'Initial' }
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
  const initial = esc((look.name.trim()[0] ?? 'J').toUpperCase());
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
      body = `<rect x="2" y="18" width="96" height="64" rx="10" fill="${look.paper}" stroke="${look.accent}" stroke-width="3"/>` +
        `<rect x="6" y="22" width="88" height="56" rx="7" fill="none" stroke="${look.accent}" stroke-width=".8"/>` +
        inner(27, 50, 18) +
        `<text x="50" y="49" font-size="${fit(b.name, 46, 11)}" fill="${look.ink}" ${font}>${esc(b.name)}</text>` +
        `<text x="50" y="60" font-size="${fit(b.tagline, 46, 5)}" fill="${look.accent}" ${font}>${esc(b.tagline)}</text>`;
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
      const hex = [0, 1, 2, 3, 4, 5].map((i) => {
        const a = Math.PI / 3 * i - Math.PI / 2;
        return `${(50 + 34 * Math.cos(a)).toFixed(2)} ${(40 + 34 * Math.sin(a)).toFixed(2)}`;
      }).join(' L');
      body = `<path d="M${hex}Z" fill="${look.accent}"/>` +
        `<text x="50" y="54" text-anchor="middle" font-size="40" fill="${on(look.accent)}" ${font}>${initial}</text>` +
        `<text x="50" y="88" text-anchor="middle" font-size="${fit(b.name, 96, 11)}" fill="${look.accent}" ${font}>${esc(b.name)}</text>` +
        `<text x="50" y="97" text-anchor="middle" font-size="${fit(b.tagline, 96, 5)}" fill="${look.accent2}" ${font}>${esc(b.tagline)}</text>`;
    }
  }
  return `<g transform="translate(${x} ${y}) scale(${u})">${body}</g>`;
}

/** A logo on its own, for the screen. */
export function logoSvg (look: Look, cls = ''): string {
  return `<svg class="${cls}" viewBox="0 0 100 100" role="img" aria-label="${esc(look.brand.name)} logo" style="font-family:var(--lettering)">${logo(look, 0, 0, 100)}</svg>`;
}
