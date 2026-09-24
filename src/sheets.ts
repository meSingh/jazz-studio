/**
 * Printable sheets, drawn in millimetres.
 *
 * Every sheet is an SVG whose viewBox is an A4 page, 210 by 297, so one unit
 * is one millimetre on paper. That is what lets a wrap for a toilet roll come
 * out of the printer the right size to go round one, as long as it is printed
 * at actual size. Each sheet carries a 5 cm check line so that can be tested
 * with a ruler rather than taken on trust.
 *
 * Nothing is drawn closer than 10 mm to the edge, which is inside what home
 * printers can reach.
 */
import { light, type Look } from './look';
import { defs, type PatternName } from './patterns';

export type Kind = 'stickers' | 'bookmarks' | 'labels' | 'diary';

export const KINDS: Array<{ id: Kind; label: string; blurb: string }> = [
  { id: 'stickers', label: 'Stickers', blurb: 'Print on sticker paper, then cut them out' },
  { id: 'bookmarks', label: 'Bookmarks', blurb: 'Four to a page. Thick paper works best' },
  { id: 'labels', label: 'Name labels', blurb: 'For books, boxes and pencil cases' },
  { id: 'diary', label: 'Diary page', blurb: 'A page for your diary or scrapbook' }
];

const W = 210;
const H = 297;
const CUT = 'fill="none" stroke-dasharray="2 1.6" stroke-width=".35"';

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

function page (defsXml: string, body: string, label: string): string {
  return `<svg class="sheet-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ` +
    `role="img" aria-label="${esc(label)}" style="font-family:var(--lettering)">` +
    `<defs>${defsXml}</defs><rect width="${W}" height="${H}" fill="#fff"/>${body}</svg>`;
}

/**
 * Moves and scales a path made only of absolute commands with x,y pairs.
 * Done to the numbers rather than with a transform, because a transform would
 * scale the pattern inside and the dashes of the cut line along with it.
 */
function place (d: string, x: number, y: number, s: number): string {
  let i = 0;
  return d.replace(/-?\d*\.?\d+/g, (n) => (+(parseFloat(n) * s + (i++ % 2 ? y : x)).toFixed(2)).toString());
}

const HEART = 'M5 8.6 C1.2 5.8 1 3.4 2.4 2.3 C3.5 1.5 4.6 2 5 3 C5.4 2 6.5 1.5 7.6 2.3 C9 3.4 8.8 5.8 5 8.6Z';

/**
 * The writing colour on paper. Sheets are always printed on white, so a light
 * writing colour picked for a dark screen swaps for the dark page colour.
 */
const inkOf = (look: Look): string => (light(look.ink) > 0.6 ? look.paper : look.ink);

const swap = (look: Look): Look => ({ ...look, accent: look.accent2, accent2: look.accent });

/** Shrinks long words to fit a width, roughly, since SVG will not wrap for us. */
function fit (text: string, width: number, size: number): number {
  const guess = text.length * size * 0.56;
  return guess > width ? Math.max(3, size * width / guess) : size;
}

export function sheet (kind: Kind, pattern: PatternName, words: string, look: Look): string {
  const w = words.trim() || look.name;
  const ink = inkOf(look);
  switch (kind) {
    case 'stickers': {
      const d = defs('p1', pattern, look, 0.9) + defs('p2', pattern, swap(look), 0.9);
      let body = '';
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
          const cx = 37.5 + col * 45;
          const cy = 32 + row * 44;
          const fill = (row + col) % 2 ? 'url(#p2)' : 'url(#p1)';
          const shape = (row * 4 + col) % 3;
          if (shape === 0) {
            const size = fit(w, 26, 7);
            body += `<circle cx="${cx}" cy="${cy}" r="20" fill="${fill}"/>` +
              `<circle cx="${cx}" cy="${cy}" r="13" fill="#fff"/>` +
              `<text x="${cx}" y="${cy + size * 0.35}" text-anchor="middle" font-size="${size}" font-weight="700" fill="${ink}">${esc(w)}</text>` +
              `<circle cx="${cx}" cy="${cy}" r="21.5" ${CUT} stroke="${ink}" opacity=".35"/>`;
          } else if (shape === 1) {
            body += `<rect x="${cx - 19}" y="${cy - 19}" width="38" height="38" rx="7" fill="${fill}"/>` +
              `<rect x="${cx - 20.5}" y="${cy - 20.5}" width="41" height="41" rx="8" ${CUT} stroke="${ink}" opacity=".35"/>`;
          } else {
            body += `<path d="${place(HEART, cx - 23, cy - 24, 4.6)}" fill="${fill}"/>` +
              `<path d="${place(HEART, cx - 25, cy - 26.2, 5)}" ${CUT} stroke="${ink}" opacity=".35"/>`;
          }
        }
      }
      return page(d, body + check(ink), 'Sticker sheet');
    }
    case 'bookmarks': {
      const d = defs('p1', pattern, look, 0.7) + defs('p2', pattern, swap(look), 0.7);
      let body = '';
      for (let i = 0; i < 4; i++) {
        const x = 15 + i * 47;
        const y = 34;
        const fill = i % 2 ? 'url(#p2)' : 'url(#p1)';
        const size = fit(w, 110, 13);
        body += `<rect x="${x}" y="${y}" width="40" height="190" rx="4" fill="${fill}"/>` +
          `<rect x="${x + 6}" y="${y + 40}" width="28" height="130" rx="3" fill="#fff" opacity=".92"/>` +
          `<text transform="translate(${x + 20 + size * 0.35} ${y + 105}) rotate(-90)" text-anchor="middle" font-size="${size}" font-weight="700" fill="${ink}">${esc(w)}</text>` +
          `<circle cx="${x + 20}" cy="${y + 14}" r="3" fill="#fff" stroke="${ink}" stroke-width=".4"/>` +
          `<rect x="${x - 1.5}" y="${y - 1.5}" width="43" height="193" rx="5" ${CUT} stroke="${ink}" opacity=".35"/>`;
      }
      return page(d, body + check(ink), 'Bookmarks');
    }
    case 'labels': {
      const d = defs('p1', pattern, look, 0.5) + defs('p2', pattern, swap(look), 0.5);
      let body = '';
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 2; col++) {
          const x = 15 + col * 95;
          const y = 18 + row * 36;
          const fill = (row + col) % 2 ? 'url(#p2)' : 'url(#p1)';
          const size = fit(w, 54, 11);
          body += `<rect x="${x}" y="${y}" width="85" height="30" rx="5" fill="#fff" stroke="${look.accent}" stroke-width=".8"/>` +
            `<path d="M${x + 5} ${y} H${x + 22} V${y + 30} H${x + 5} A5 5 0 0 1 ${x} ${y + 25} V${y + 5} A5 5 0 0 1 ${x + 5} ${y}Z" fill="${fill}"/>` +
            `<text x="${x + 28}" y="${y + 10}" font-size="4" fill="${ink}" opacity=".7">This belongs to</text>` +
            `<text x="${x + 28}" y="${y + 22}" font-size="${size}" font-weight="700" fill="${ink}">${esc(w)}</text>` +
            `<rect x="${x - 1.5}" y="${y - 1.5}" width="88" height="33" rx="6" ${CUT} stroke="${ink}" opacity=".35"/>`;
        }
      }
      return page(d, body + check(ink), 'Name labels');
    }
    case 'diary': {
      const d = defs('p1', pattern, look, 0.8);
      let lines = '';
      for (let y = 70; y <= 262; y += 9) lines += `<path d="M24 ${y} H186" stroke="${look.accent2}" stroke-width=".4" opacity=".7"/>`;
      const body = `<rect x="10" y="10" width="190" height="277" rx="6" fill="url(#p1)"/>` +
        `<rect x="18" y="18" width="174" height="261" rx="4" fill="#fff"/>` +
        `<text x="26" y="40" font-size="13" font-weight="700" fill="${ink}">Dear diary</text>` +
        `<text x="128" y="40" font-size="5" fill="${ink}" opacity=".7">Date</text>` +
        `<path d="M140 40 H186" stroke="${ink}" stroke-width=".4" opacity=".6"/>` +
        `<path d="M24 50 H186" stroke="${look.accent}" stroke-width="1"/>` +
        `<text x="186" y="274" text-anchor="end" font-size="4.5" fill="${ink}" opacity=".6">${esc(w)}</text>` + lines;
      return page(d, body, 'Diary page');
    }
  }
}

/** A line that should measure exactly 5 cm, so a ruler can tell whether the printer shrank the page. */
function check (ink: string): string {
  return `<g opacity=".55"><path d="M15 288 H65 M15 286 V290 M65 286 V290" stroke="${ink}" stroke-width=".35"/>` +
    `<text x="68" y="289.5" font-size="3" fill="${ink}" font-family="system-ui, sans-serif">This line should measure 5 cm. If it does not, print at actual size.</text></g>`;
}

export interface Wrap {
  /** Width round the thing, and height, in centimetres. */
  width: number;
  height: number;
  tab: boolean;
  title: string;
}

/** Room on the page for a wrap, in millimetres, inside the 10 mm margin with space for the notes below. */
const ROOM_W = 190;
const ROOM_H = 262;

/** Whether a wrap fits one sheet, and whether it has to be turned sideways to. */
export function wrapFits (wrap: Wrap): 'upright' | 'sideways' | false {
  const w = wrap.width * 10 + (wrap.tab ? 10 : 0);
  const h = wrap.height * 10;
  if (w <= ROOM_W && h <= ROOM_H) return 'upright';
  if (h <= ROOM_W && w <= ROOM_H) return 'sideways';
  return false;
}

export function wrapSheet (wrap: Wrap, pattern: PatternName, words: string, look: Look): string {
  const ink = inkOf(look);
  const tab = wrap.tab ? 10 : 0;
  const w = Math.max(10, wrap.width * 10);
  const h = Math.max(10, wrap.height * 10);
  const fits = wrapFits(wrap);
  const sideways = fits === 'sideways';
  // Too big for a sheet: draw what fits and say so, rather than print it shrunk.
  const pw = sideways ? Math.min(h, ROOM_W) : Math.min(w + tab, ROOM_W);
  const ph = sideways ? Math.min(w + tab, ROOM_H) : Math.min(h, ROOM_H);
  const x = (W - pw) / 2;
  const y = 16;

  // Drawn upright at the origin, then turned and placed.
  const bw = sideways ? ph : pw;
  const bh = sideways ? pw : ph;
  const panel = Math.max(0, bw - tab);
  const text = words.trim();
  const size = text ? fit(text, panel * 0.8, Math.min(16, bh * 0.28)) : 0;
  let inner = `<rect width="${panel}" height="${bh}" fill="url(#p1)"/>`;
  if (text) {
    const band = size * 1.8;
    inner += `<rect x="${panel * 0.08}" y="${(bh - band) / 2}" width="${panel * 0.84}" height="${band}" rx="${band / 2}" fill="#fff" opacity=".92"/>` +
      `<text x="${panel / 2}" y="${bh / 2 + size * 0.35}" text-anchor="middle" font-size="${size}" font-weight="700" fill="${ink}">${esc(text)}</text>`;
  }
  if (tab) {
    inner += `<rect x="${panel}" width="${tab}" height="${bh}" fill="url(#glue)"/>` +
      `<text transform="translate(${panel + tab / 2 + 1.4} ${bh / 2}) rotate(-90)" text-anchor="middle" font-size="3.6" fill="${ink}" font-family="system-ui, sans-serif">glue here</text>` +
      `<path d="M${panel} 0 V${bh}" stroke="${ink}" stroke-width=".3" stroke-dasharray="1 1" opacity=".6"/>`;
  }
  inner += `<rect x="-1" y="-1" width="${bw + 2}" height="${bh + 2}" ${CUT} stroke="${ink}" opacity=".5"/>`;
  // As many as fit down the page, so a small wrap does not waste the sheet.
  const GAP = 8;
  const copies = fits ? Math.max(1, Math.floor((ROOM_H + GAP) / (ph + GAP))) : 1;
  const place = (k: number): string => {
    const yk = y + k * (ph + GAP);
    return sideways ? `translate(${x + pw} ${yk}) rotate(90)` : `translate(${x} ${yk})`;
  };

  const glue = `<pattern id="glue" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<rect width="3" height="3" fill="#fff"/><rect width="1" height="3" fill="${ink}" opacity=".15"/></pattern>`;
  const size2 = `${fmt(wrap.width)} × ${fmt(wrap.height)} cm`;
  const note = fits
    ? `${esc(wrap.title)} · ${size2}${sideways ? ' · turned sideways to fit' : ''}${copies > 1 ? ` · ${copies} on this sheet` : ''}`
    : `${esc(wrap.title)} · ${size2} is bigger than a sheet of paper, so only part of it is here`;
  const body = Array.from({ length: copies }, (_, k) => `<g transform="${place(k)}">${inner}</g>`).join('') +
    `<text x="${W / 2}" y="281" text-anchor="middle" font-size="4" fill="${ink}" opacity=".75" font-family="system-ui, sans-serif">${note}</text>` +
    check(ink);
  return page(defs('p1', pattern, look, 0.8) + glue, body, `${wrap.title} wrap`);
}

export const fmt = (n: number): string => (Math.round(n * 10) / 10).toString();
