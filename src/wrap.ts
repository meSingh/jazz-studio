/**
 * Wraps for things made from boxes, rolls and cartons, drawn to her
 * measurements in millimetres on A4, so they come out the right size to go
 * round a toilet roll or across a cereal box, as long as they are printed at
 * actual size.
 *
 * A small wrap is repeated down the page so the sheet is not wasted; one too
 * big to fit is turned sideways, and one too big for a sheet at all says so
 * rather than printing shrunk.
 */
import { fontOf, type Look } from './look';
import { defs, type PatternName } from './patterns';
import { fit } from './brand';
import { W, CUT, esc, page, inkOf, check, disc, type Who } from './sheets';
import { poses, pose, personOf, type PoseId } from './character';

export interface Wrap {
  /** Width round the thing (or across it), and height, in centimetres. */
  width: number;
  height: number;
  tab: boolean;
  title: string;
}

/** Room on the page for a wrap, in millimetres, inside the 10 mm margin with space for the notes below. */
const ROOM_W = 190;
const ROOM_H = 262;

export const fmt = (n: number): string => (Math.round(n * 10) / 10).toString();

/** Whether a wrap fits one sheet, and whether it has to be turned sideways to. */
export function wrapFits (wrap: Wrap): 'upright' | 'sideways' | false {
  const w = wrap.width * 10 + (wrap.tab ? 10 : 0);
  const h = wrap.height * 10;
  if (w <= ROOM_W && h <= ROOM_H) return 'upright';
  if (h <= ROOM_W && w <= ROOM_H) return 'sideways';
  return false;
}

export function wrapSheet (wrap: Wrap, pattern: PatternName, words: string, me: boolean, look: Look, who: Who = look.pose, own: Record<string, string> = {}): string {
  // Where a sheet has room for several copies, each has the next of the
  // characters she ticked: a pencil pot for her and one for her brother.
  const list = who === 'mix' ? poses().map((p) => p.id) : Array.isArray(who) ? who : [who || look.pose];
  const poseFor = (k: number): PoseId => list[k % list.length] ?? look.pose;
  const ink = inkOf(look);
  const tab = wrap.tab ? 10 : 0;
  const w = Math.max(10, wrap.width * 10);
  const h = Math.max(10, wrap.height * 10);
  const fits = wrapFits(wrap);
  const sideways = fits === 'sideways';
  const pw = sideways ? Math.min(h, ROOM_W) : Math.min(w + tab, ROOM_W);
  const ph = sideways ? Math.min(w + tab, ROOM_H) : Math.min(h, ROOM_H);
  const x = (W - pw) / 2;
  const y = 16;

  // Drawn upright at the origin, then turned and placed.
  const bw = sideways ? ph : pw;
  const bh = sideways ? pw : ph;
  const panel = Math.max(0, bw - tab);
  const r = me ? Math.min(bh * 0.32, 16, panel * 0.2) : 0;
  // Each copy's words: its person's own, where she gave them some, or the sheet's.
  const textFor = (k: number): string => (me ? own[personOf(pose(poseFor(k)))]?.trim() : '') || words.trim();
  const glue = `<pattern id="glue" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<rect width="3" height="3" fill="#fff"/><rect width="1" height="3" fill="${ink}" opacity=".15"/></pattern>`;

  const inner = (k: number): string => {
    const text = textFor(k);
    const size = text ? fit(text, panel * 0.8 - r * 2.4, Math.min(16, bh * 0.28)) : 0;
    let out = `<rect width="${panel}" height="${bh}" fill="url(#p1)"/>`;
    if (text) {
      const band = Math.max(size * 1.8, r * 2 + 4);
      out += `<rect x="${panel * 0.08}" y="${(bh - band) / 2}" width="${panel * 0.84}" height="${band}" rx="${band / 2}" fill="#fff" opacity=".94"/>` +
        `<text x="${panel / 2 + (me ? r * 1.2 : 0)}" y="${bh / 2 + size * 0.35}" text-anchor="middle" font-size="${size}" font-weight="800" fill="${ink}">${esc(text)}</text>`;
    }
    if (me) {
      const cx = text ? panel * 0.08 + r + 2 : panel / 2;
      out += `<circle cx="${cx}" cy="${bh / 2}" r="${r + 1.5}" fill="#fff"/>` + disc(poseFor(k), look, cx, bh / 2, r, `w${k}`);
    }
    if (tab) {
      out += `<rect x="${panel}" width="${tab}" height="${bh}" fill="url(#glue)"/>` +
        `<text transform="translate(${panel + tab / 2 + 1.4} ${bh / 2}) rotate(-90)" text-anchor="middle" font-size="3.6" fill="${ink}" font-family="system-ui, sans-serif">glue here</text>` +
        `<path d="M${panel} 0 V${bh}" stroke="${ink}" stroke-width=".3" stroke-dasharray="1 1" opacity=".6"/>`;
    }
    return out + `<rect x="-1" y="-1" width="${bw + 2}" height="${bh + 2}" ${CUT} stroke="${ink}" opacity=".5"/>`;
  };

  // As many as fit down the page, so a small wrap does not waste the sheet.
  const GAP = 8;
  const copies = fits ? Math.max(1, Math.floor((ROOM_H + GAP) / (ph + GAP))) : 1;
  const place = (k: number): string => {
    const yk = y + k * (ph + GAP);
    return sideways ? `translate(${x + pw} ${yk}) rotate(90)` : `translate(${x} ${yk})`;
  };
  const dims = `${fmt(wrap.width)} × ${fmt(wrap.height)} cm`;
  const note = fits
    ? `${esc(wrap.title)} · ${dims}${sideways ? ' · turned sideways to fit' : ''}${copies > 1 ? ` · ${copies} on this sheet` : ''}`
    : `${esc(wrap.title)} · ${dims} is bigger than a sheet of paper, so only part of it is here`;
  const body = Array.from({ length: copies }, (_, k) => `<g transform="${place(k)}">${inner(k)}</g>`).join('') +
    `<text x="${W / 2}" y="283" text-anchor="middle" font-size="4" fill="${ink}" opacity=".75" font-family="system-ui, sans-serif">${note}</text>` +
    check(ink);
  return page(defs('p1', pattern, look, 0.8) + glue, body, `${wrap.title} wrap`, fontOf(look));
}

/**
 * What to measure, drawn: a tube with an arrow round it, or a flat side with
 * an arrow across it, and her numbers on the arrows. For the screen.
 */
export function measureDiagram (shape: 'tube' | 'flat', width: number, height: number, look: Look): string {
  const a = look.accent;
  const b = look.accent2;
  // Labels sit on the dark background beside the drawing, never on the cardboard,
  // where a colour she picked might not show up.
  const label = (x: number, y: number, t: string, c: string, anchor = 'middle'): string =>
    `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="14" font-weight="800" fill="${c}">${t}</text>`;
  const arrow = (id: string, c: string): string =>
    `<marker id="${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="${c}"/></marker>`;
  const card = '#C99A62';
  const shade = '#A87D4B';
  const body = shape === 'tube'
    ? `<ellipse cx="80" cy="22" rx="40" ry="11" fill="${shade}"/>` +
      `<rect x="40" y="22" width="80" height="86" fill="${card}"/>` +
      `<ellipse cx="80" cy="108" rx="40" ry="11" fill="${card}"/>` +
      `<ellipse cx="80" cy="22" rx="31" ry="8" fill="#5b4126"/>` +
      `<path d="M40 66 A40 11 0 0 0 120 66" fill="none" stroke="${a}" stroke-width="4.5" stroke-linecap="round"/>` +
      `<path d="M120 66 A40 11 0 0 1 40 66" fill="none" stroke="${a}" stroke-width="3" stroke-dasharray="3 4" opacity=".7"/>` +
      `<path d="M140 24 V106" stroke="${b}" stroke-width="4" stroke-linecap="round" marker-end="url(#mb)" marker-start="url(#mb)"/>` +
      label(80, 142, `${fmt(width)} cm`, a) + label(80, 158, 'all the way round', a) +
      label(150, 62, `${fmt(height)} cm`, b, 'start') + label(150, 78, 'high', b, 'start')
    : `<path d="M34 28 L52 12 H132 L114 28Z" fill="${shade}"/>` +
      `<path d="M114 28 L132 12 V100 L114 116Z" fill="${shade}"/>` +
      `<rect x="34" y="28" width="80" height="88" fill="${card}"/>` +
      `<path d="M36 128 H112" stroke="${a}" stroke-width="4" stroke-linecap="round" marker-end="url(#ma)" marker-start="url(#ma)"/>` +
      `<path d="M140 30 V114" stroke="${b}" stroke-width="4" stroke-linecap="round" marker-end="url(#mb)" marker-start="url(#mb)"/>` +
      label(74, 150, `${fmt(width)} cm`, a) + label(74, 166, 'across', a) +
      label(150, 66, `${fmt(height)} cm`, b, 'start') + label(150, 82, 'high', b, 'start');
  return `<svg viewBox="0 0 230 172" class="measure-svg" role="img" aria-label="What to measure: ${fmt(width)} centimetres ${shape === 'tube' ? 'round' : 'across'}, ${fmt(height)} centimetres high">` +
    `<defs>${arrow('ma', a)}${arrow('mb', b)}</defs>${body}</svg>`;
}
