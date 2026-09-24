/**
 * Printable sheets, drawn in millimetres.
 *
 * Every sheet is an SVG whose viewBox is an A4 page, 210 by 297, so one unit
 * is one millimetre on paper, as long as it is printed at actual size. Box
 * wraps, where that matters, carry a 5 cm line to test it with a ruler. Nothing
 * important is closer than 10 mm to the edge, inside what home printers reach.
 *
 * Her character, her logo, her pattern and her colours go on as much of it as
 * makes sense. It is her stationery; it should look like nobody else's.
 */
import { light, fontOf, whose, type Look } from './look';
import { defs, type PatternName } from './patterns';
import { face, figure, poses, nameFor, type PoseId } from './character';
import { logo, fit } from './brand';

export type Kind =
  | 'stickers' | 'faces' | 'bookmarks' | 'labels' | 'cover' | 'diary'
  | 'planner' | 'todo' | 'tags' | 'door' | 'cards' | 'logos';

export interface Options {
  pattern: PatternName;
  words: string;
  /** Put her character on it, where the sheet has room for her. */
  me: boolean;
  /**
   * Who is on it: one character, everyone in the list ('mix'), or the ones
   * she ticked, which a sheet with several places goes through in turn.
   */
  pose: Who;
}

export type Who = PoseId | 'mix' | PoseId[];

export interface KindInfo {
  id: Kind;
  label: string;
  blurb: string;
  words: string;
  /** The placeholder in the words box: what goes on it when she types nothing. */
  start: (look: Look) => string;
  me: boolean;
  pose: boolean;
  /** Has several places for a character, so she can tick several people. */
  many?: boolean;
}

export const KINDS: KindInfo[] = [
  { id: 'faces', label: 'Me stickers', blurb: 'Your character on stickers. Print on sticker paper', words: 'Name under each one (or leave empty)', start: () => '', me: false, pose: true, many: true },
  { id: 'stickers', label: 'Pattern stickers', blurb: 'Circles, squares and hexagons to cut out', words: 'What should they say?', start: (l) => l.name, me: false, pose: false },
  { id: 'labels', label: 'Name labels', blurb: 'For books, boxes and pencil cases', words: 'Name on the labels', start: (l) => l.name || 'Each person\'s name', me: true, pose: false, many: true },
  { id: 'bookmarks', label: 'Bookmarks', blurb: 'Four to a page. Thick paper works best', words: 'Words down the middle', start: (l) => l.name || 'Each person\'s name', me: true, pose: false, many: true },
  { id: 'cover', label: 'Diary cover', blurb: 'The front of your diary, with you on it', words: 'Title on the cover', start: (l) => `${whose(l.name)} Diary`, me: false, pose: true },
  { id: 'diary', label: 'Diary page', blurb: 'Date, mood and lines, with your name at the top', words: 'Something to write about (or leave empty)', start: () => '', me: true, pose: false },
  { id: 'planner', label: 'Week planner', blurb: 'Every day of the week, and a goal', words: 'Title', start: (l) => `${whose(l.name)} Week`, me: true, pose: false },
  { id: 'todo', label: 'To-do lists', blurb: 'Two lists to a page, with boxes to tick', words: 'Title', start: () => 'Things to do', me: true, pose: false },
  { id: 'tags', label: 'Gift tags', blurb: 'Eight tags. Punch a hole and add ribbon. Tick friends to put them on as who it is to', words: 'From', start: (l) => l.name, me: true, pose: false, many: true },
  { id: 'door', label: 'Door sign', blurb: 'Two hangers for your door handle', words: 'What the sign says', start: () => 'Knock first!', me: true, pose: true, many: true }
];

/**
 * The sheets in five groups, one tile each. Things that are nearly the same
 * sit together, so switching between them is one tap on the same page rather
 * than back to the grid and into another tile. `short` is the name used
 * inside the group, where the group's own name says the rest. Group ids are
 * never a sheet's id, so an address says which it means.
 */
export const GROUPS: Array<{ id: string; label: string; blurb: string; kinds: Array<{ id: Kind; short: string }> }> = [
  { id: 'sticker-sheets', label: 'Stickers', blurb: 'With your face on them, or in your pattern',
    kinds: [{ id: 'faces', short: 'Me stickers' }, { id: 'stickers', short: 'Pattern stickers' }] },
  { id: 'diary-set', label: 'Diary', blurb: 'A cover with you on it, and pages to write in',
    kinds: [{ id: 'cover', short: 'Cover' }, { id: 'diary', short: 'Pages' }] },
  { id: 'labels-and-tags', label: 'Labels and tags', blurb: 'Name labels for your things, and tags for presents',
    kinds: [{ id: 'labels', short: 'Name labels' }, { id: 'tags', short: 'Gift tags' }] },
  { id: 'planners', label: 'Planners and lists', blurb: 'Your week, and things to do',
    kinds: [{ id: 'planner', short: 'Week planner' }, { id: 'todo', short: 'To-do lists' }] },
  { id: 'signs', label: 'Bookmarks and signs', blurb: 'For your books and your bedroom door',
    kinds: [{ id: 'bookmarks', short: 'Bookmarks' }, { id: 'door', short: 'Door signs' }] }
];

export const BRAND_KINDS: KindInfo[] = [
  { id: 'cards', label: 'Business cards', blurb: 'Ten cards, the size of a real one', words: 'One more line (or leave empty)', start: () => '', me: false, pose: false },
  { id: 'logos', label: 'Logo stickers', blurb: 'Twelve of your logo, for everything you make', words: '', start: () => '', me: false, pose: false }
];

export const W = 210;
const H = 297;
export const CUT = 'fill="none" stroke-dasharray="2 1.6" stroke-width=".35"';

export const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/** A whole A4 sheet. `font` is the sheet's own lettering, not the studio's. */
export function page (defsXml: string, body: string, label: string, font: string): string {
  return `<svg class="sheet-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ` +
    `role="img" aria-label="${esc(label)}" style="font-family:${font}">` +
    `<defs>${defsXml}</defs><rect width="${W}" height="${H}" fill="#fff"/>${body}</svg>`;
}

/**
 * The writing colour on white paper. Sheets are printed on white, so a light
 * writing colour picked for a dark screen swaps for the dark page colour.
 */
export const inkOf = (look: Look): string => (light(look.ink) > 0.6 ? look.paper : look.ink);
const on = (c: string): string => (light(c) > 0.6 ? '#111111' : '#FFFFFF');
const swap = (look: Look): Look => ({ ...look, accent: look.accent2, accent2: look.accent });

function hexagon (cx: number, cy: number, r: number): string {
  return 'M' + [0, 1, 2, 3, 4, 5].map((i) => {
    const a = Math.PI / 3 * i;
    return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' L') + 'Z';
}

/** Which pose goes in place `i`: the one she chose, or each in turn of the ones she ticked, or of everyone. */
const poseAt = (o: Options, i: number): PoseId => {
  const list = o.pose === 'mix' ? poses().map((p) => p.id) : Array.isArray(o.pose) ? o.pose : [o.pose];
  return list.length ? list[i % list.length] : poses()[0].id;
};

/** The one character on a sheet with room for one: the first she ticked, or her own for "everyone". */
export const firstOf = (who: Who, look: Look): PoseId =>
  who === 'mix' ? look.pose : Array.isArray(who) ? (who[0] ?? look.pose) : who;

/**
 * A line that should measure exactly 5 cm, so a ruler can tell whether the
 * printer shrank the page. Only on box wraps, where the size is the point: a
 * wrap has to go round a real roll. Stickers and planners are fine a little
 * smaller, and on an iPad, which always prints a little smaller, the line
 * only said something was wrong when nothing was.
 */
export function check (ink: string): string {
  return `<g opacity=".5"><path d="M15 290 H65 M15 288 V292 M65 288 V292" stroke="${ink}" stroke-width=".35"/>` +
    `<text x="68" y="291.3" font-size="2.8" fill="${ink}" font-family="system-ui, sans-serif">This line should measure 5 cm. If it does not, print at actual size.</text></g>`;
}

/** Five mood faces, drawn, for the diary page: happy, excited, okay, sad, sleepy. */
function moods (x: number, y: number, ink: string, accent: string): string {
  const mouths = [
    'M-2.4 1 Q0 3.4 2.4 1',
    'M-2.6 0.6 Q0 4.4 2.6 0.6 Z',
    'M-2.2 1.6 H2.2',
    'M-2.4 2.6 Q0 0.4 2.4 2.6',
    'M-1.2 1.8 Q0 1 1.2 1.8'
  ];
  return mouths.map((m, i) => {
    const cx = x + i * 11;
    const eyes = i === 4
      ? `<path d="M${cx - 2.6} ${y - 1.2} h1.8 M${cx + 0.8} ${y - 1.2} h1.8" stroke="${ink}" stroke-width=".5"/>`
      : `<circle cx="${cx - 1.7}" cy="${y - 1.3}" r=".55" fill="${ink}"/><circle cx="${cx + 1.7}" cy="${y - 1.3}" r=".55" fill="${ink}"/>`;
    return `<circle cx="${cx}" cy="${y}" r="4.4" fill="#fff" stroke="${accent}" stroke-width=".6"/>${eyes}` +
      `<path transform="translate(${cx} ${y})" d="${m}" fill="${i === 1 ? ink : 'none'}" stroke="${ink}" stroke-width=".5" stroke-linecap="round"/>`;
  }).join('');
}

/** A character's face in a small disc, for headers and labels. */
export const disc = (pose: PoseId, look: Look, cx: number, cy: number, r: number, id: string): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${look.accent2}"/>` + face(pose, cx, cy - r * 0.04, r * 0.98, id);

export function sheet (kind: Kind, o: Options, look: Look): string {
  const w = o.words.trim();
  const ink = inkOf(look);
  // The character on a sheet with room for one. A sheet with several places
  // goes through everyone she ticked (poseAt), each with their own name.
  const me = firstOf(o.pose, look);
  const nameAt = (i: number): string => nameFor(poseAt(o, i), look);
  const font = fontOf(look);
  const pat = (scale: number): string => defs('p1', o.pattern, look, scale) + defs('p2', o.pattern, swap(look), scale);

  switch (kind) {
    case 'stickers': {
      let body = '';
      const text = w || look.name;
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 4; col++) {
          const cx = 37.5 + col * 45;
          const cy = 32 + row * 44;
          const fill = (row + col) % 2 ? 'url(#p2)' : 'url(#p1)';
          const shape = (row * 4 + col) % 3;
          if (shape === 0) {
            const size = fit(text, 24, 7);
            body += `<circle cx="${cx}" cy="${cy}" r="20" fill="${fill}"/><circle cx="${cx}" cy="${cy}" r="13" fill="#fff"/>` +
              `<text x="${cx}" y="${cy + size * 0.35}" text-anchor="middle" font-size="${size}" font-weight="800" fill="${ink}">${esc(text)}</text>` +
              `<circle cx="${cx}" cy="${cy}" r="21.5" ${CUT} stroke="${ink}" opacity=".35"/>`;
          } else if (shape === 1) {
            body += `<rect x="${cx - 19}" y="${cy - 19}" width="38" height="38" rx="7" fill="${fill}"/>` +
              `<rect x="${cx - 20.5}" y="${cy - 20.5}" width="41" height="41" rx="8" ${CUT} stroke="${ink}" opacity=".35"/>`;
          } else {
            body += `<path d="${hexagon(cx, cy, 20.5)}" fill="${fill}"/>` +
              `<path d="${hexagon(cx, cy, 22)}" ${CUT} stroke="${ink}" opacity=".35"/>`;
          }
        }
      }
      return page(pat(0.9), body, 'Pattern stickers', font);
    }

    case 'faces': {
      let body = '';
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 4; col++) {
          const i = row * 4 + col;
          const cx = 37.5 + col * 45;
          const cy = 36 + row * 51;
          body += `<circle cx="${cx}" cy="${cy}" r="21" fill="url(#${i % 2 ? 'p2' : 'p1'})"/>` +
            `<circle cx="${cx}" cy="${cy}" r="17.5" fill="${i % 2 ? look.accent : look.accent2}"/>` +
            face(poseAt(o, i), cx, cy - (w ? 2.5 : 1), 17.3, `f${i}`);
          if (w) {
            // On the ring, below her chin, and still inside the cut line.
            const size = fit(w, 18, 4);
            body += `<rect x="${cx - 11}" y="${cy + 13.5}" width="22" height="6.5" rx="3.25" fill="${look.paper}"/>` +
              `<text x="${cx}" y="${cy + 16.75 + size * 0.35}" text-anchor="middle" font-size="${size}" font-weight="800" fill="${on(look.paper)}">${esc(w)}</text>`;
          }
          body += `<circle cx="${cx}" cy="${cy}" r="22.5" ${CUT} stroke="${ink}" opacity=".35"/>`;
        }
      }
      return page(pat(0.8), body, 'Me stickers', font);
    }

    case 'bookmarks': {
      let body = '';
      for (let i = 0; i < 4; i++) {
        const x = 15 + i * 47;
        const y = 30;
        const text = w || (o.me ? nameAt(i) : look.name);
        const size = fit(text, 104, 13);
        body += `<rect x="${x}" y="${y}" width="40" height="196" rx="4" fill="url(#${i % 2 ? 'p2' : 'p1'})"/>` +
          `<rect x="${x + 6}" y="${y + 48}" width="28" height="136" rx="3" fill="#fff" opacity=".94"/>` +
          `<text transform="translate(${x + 20 + size * 0.35} ${y + 116}) rotate(-90)" text-anchor="middle" font-size="${size}" font-weight="800" fill="${ink}">${esc(text)}</text>`;
        body += o.me
          ? `<circle cx="${x + 20}" cy="${y + 24}" r="15" fill="#fff"/>` + disc(poseAt(o, i), look, x + 20, y + 24, 13.5, `b${i}`)
          : `<circle cx="${x + 20}" cy="${y + 14}" r="3" fill="#fff" stroke="${ink}" stroke-width=".4"/>`;
        body += `<rect x="${x - 1.5}" y="${y - 1.5}" width="43" height="199" rx="5" ${CUT} stroke="${ink}" opacity=".35"/>`;
      }
      return page(pat(0.7), body, 'Bookmarks', font);
    }

    case 'labels': {
      let body = '';
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 2; col++) {
          const x = 15 + col * 95;
          const y = 16 + row * 37;
          // Two to a row, so each person she ticked gets a row of their own.
          const i = row * 2 + col;
          const text = w || (o.me ? nameAt(row) : look.name);
          const size = fit(text, 50, 11);
          body += `<rect x="${x}" y="${y}" width="85" height="31" rx="5" fill="#fff" stroke="${look.accent}" stroke-width=".8"/>` +
            `<path d="M${x + 5} ${y} H${x + 26} V${y + 31} H${x + 5} A5 5 0 0 1 ${x} ${y + 26} V${y + 5} A5 5 0 0 1 ${x + 5} ${y}Z" fill="url(#${i % 2 ? 'p2' : 'p1'})"/>`;
          if (o.me) body += disc(poseAt(o, row), look, x + 13, y + 15.5, 11, `l${i}`);
          body += `<text x="${x + 31}" y="${y + 10.5}" font-size="3.8" fill="${ink}" opacity=".7">This belongs to</text>` +
            `<text x="${x + 31}" y="${y + 23}" font-size="${size}" font-weight="800" fill="${ink}">${esc(text)}</text>` +
            `<rect x="${x - 1.5}" y="${y - 1.5}" width="88" height="34" rx="6" ${CUT} stroke="${ink}" opacity=".35"/>`;
        }
      }
      return page(pat(0.5), body, 'Name labels', font);
    }

    case 'cover': {
      const title = w || `${whose(nameFor(me, look))} Diary`;
      const size = fit(title, 150, 20);
      const year = new Date().getFullYear();
      const body = `<rect x="10" y="10" width="190" height="277" rx="8" fill="url(#p1)"/>` +
        `<rect x="22" y="22" width="166" height="253" rx="6" fill="${look.paper}"/>` +
        `<rect x="26" y="26" width="158" height="245" rx="4" fill="none" stroke="${look.accent}" stroke-width=".8"/>` +
        `<text x="105" y="60" text-anchor="middle" font-size="${size}" font-weight="900" fill="${look.ink}">${esc(title)}</text>` +
        `<path d="M70 70 H140" stroke="${look.accent}" stroke-width="1.4" stroke-linecap="round"/>` +
        `<circle cx="105" cy="146" r="58" fill="${look.accent}" opacity=".2"/>` +
        figure(me, 38, 78, 134, 128) +
        `<rect x="26" y="206" width="158" height="1" fill="${look.accent}" opacity=".6"/>` +
        // The logo on a diary cover has the cover's character in it, not
        // whoever is the studio's own: Sukhi's diary has Sukhi on its badge.
        logo({ ...look, brand: { ...look.brand, pose: me } }, 34, 214, 46) +
        `<g transform="rotate(-8 150 240)"><rect x="118" y="226" width="64" height="24" rx="3" fill="none" stroke="${look.accent2}" stroke-width="1.6"/>` +
        `<text x="150" y="236.5" text-anchor="middle" font-size="6.5" font-weight="900" fill="${look.accent2}" letter-spacing="1">PRIVATE</text>` +
        `<text x="150" y="245" text-anchor="middle" font-size="5" font-weight="800" fill="${look.accent2}" letter-spacing="1">KEEP OUT</text></g>` +
        `<text x="105" y="268" text-anchor="middle" font-size="5" fill="${look.ink}" opacity=".7" letter-spacing="2">${year}</text>`;
      return page(pat(1), body, 'Diary cover', font);
    }

    case 'diary': {
      let lines = '';
      const first = w ? 86 : 76;
      for (let y = first; y <= 272; y += 9) lines += `<path d="M30 ${y} H192" stroke="${look.accent}" stroke-width=".35" opacity=".55"/>`;
      let body = `<rect x="10" y="10" width="10" height="277" rx="3" fill="url(#p1)"/>`;
      if (o.me) body += disc(me, look, 36, 28, 10.5, 'd1');
      const tx = o.me ? 51 : 30;
      body += `<text x="${tx}" y="27" font-size="10" font-weight="900" fill="${ink}">${esc(whose(o.me ? nameFor(me, look) : look.name))} Diary</text>` +
        `<text x="${tx}" y="34.5" font-size="4" fill="${look.accent}" font-weight="700" letter-spacing=".6">${esc(look.brand.tagline.toUpperCase())}</text>` +
        `<text x="140" y="27" font-size="4.5" fill="${ink}" opacity=".7">Date</text><path d="M151 27.5 H192" stroke="${ink}" stroke-width=".4" opacity=".5"/>` +
        `<path d="M30 42 H192" stroke="${look.accent}" stroke-width="1"/>` +
        `<text x="30" y="56.5" font-size="4.5" fill="${ink}" opacity=".75">Today I feel</text>` + moods(66, 55, ink, look.accent) +
        `<text x="128" y="56.5" font-size="4.5" fill="${ink}" opacity=".75">Weather</text><path d="M146 57 H192" stroke="${ink}" stroke-width=".4" opacity=".5"/>`;
      if (w) {
        body += `<rect x="30" y="65" width="162" height="12" rx="2" fill="${look.accent}" opacity=".14"/>` +
          `<text x="34" y="73" font-size="${fit(`Write about: ${w}`, 154, 4.8)}" font-weight="800" fill="${ink}">Write about: ${esc(w)}</text>`;
      }
      body += lines + `<text x="192" y="283" text-anchor="end" font-size="3.5" fill="${ink}" opacity=".5">${esc(look.brand.name)}</text>`;
      return page(pat(0.8), body, 'Diary page', font);
    }

    case 'planner': {
      const title = w || `${whose(o.me ? nameFor(me, look) : look.name)} Week`;
      let body = `<rect x="10" y="10" width="190" height="8" rx="3" fill="url(#p1)"/>`;
      if (o.me) body += disc(me, look, 24, 33, 10, 'pl');
      const tx = o.me ? 38 : 15;
      body += `<text x="${tx}" y="36" font-size="${fit(title, 95, 11)}" font-weight="900" fill="${ink}">${esc(title)}</text>` +
        `<text x="135" y="36" font-size="4.5" fill="${ink}" opacity=".7">Week of</text><path d="M152 36.5 H195" stroke="${ink}" stroke-width=".4" opacity=".5"/>`;
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'This week\'s goal'];
      days.forEach((d, i) => {
        const x = i < 4 ? 15 : 108;
        const y = 48 + (i % 4) * 58;
        const c = i === 7 ? look.accent2 : look.accent;
        body += `<rect x="${x}" y="${y}" width="87" height="53" rx="4" fill="#fff" stroke="${c}" stroke-width=".7"/>` +
          `<path d="M${x + 4} ${y} H${x + 83} A4 4 0 0 1 ${x + 87} ${y + 4} V${y + 10} H${x} V${y + 4} A4 4 0 0 1 ${x + 4} ${y}Z" fill="${c}"/>` +
          `<text x="${x + 5}" y="${y + 7}" font-size="5" font-weight="800" fill="${on(c)}">${d}</text>`;
        for (let l = 0; l < 4; l++) body += `<path d="M${x + 5} ${y + 20 + l * 9} H${x + 82}" stroke="${ink}" stroke-width=".3" opacity=".35"/>`;
      });
      return page(pat(0.8), body, 'Week planner', font);
    }

    case 'todo': {
      const title = w || 'Things to do';
      const size = fit(title, 110, 8);
      let body = '';
      for (let half = 0; half < 2; half++) {
        const y0 = 12 + half * 139;
        body += `<rect x="15" y="${y0}" width="180" height="131" rx="6" fill="#fff" stroke="${look.accent}" stroke-width=".7"/>` +
          `<path d="M21 ${y0} H189 A6 6 0 0 1 195 ${y0 + 6} V${y0 + 20} H15 V${y0 + 6} A6 6 0 0 1 21 ${y0}Z" fill="url(#p${half + 1})"/>`;
        const tx = o.me ? 45 : 22;
        if (o.me) body += `<circle cx="30" cy="${y0 + 20}" r="11" fill="#fff"/>` + disc(me, look, 30, y0 + 20, 9.8, `t${half}`);
        body += `<rect x="${tx - 3}" y="${y0 + 4.5}" width="${Math.min(145, title.length * size * 0.6 + 7)}" height="11" rx="5.5" fill="#fff"/>` +
          `<text x="${tx}" y="${y0 + 12.7}" font-size="${size}" font-weight="900" fill="${ink}">${esc(title)}</text>`;
        for (let r = 0; r < 10; r++) {
          const y = y0 + 38 + r * 9.2;
          body += `<rect x="24" y="${y - 4.2}" width="5" height="5" rx="1.2" fill="none" stroke="${look.accent}" stroke-width=".6"/>` +
            `<path d="M33 ${y + 0.8} H186" stroke="${ink}" stroke-width=".3" opacity=".35"/>`;
        }
      }
      return page(pat(0.7), body, 'To-do lists', font);
    }

    case 'tags': {
      let body = '';
      const from = w || look.name;
      for (let i = 0; i < 8; i++) {
        const x = 15 + (i % 2) * 95;
        const y = 14 + Math.floor(i / 2) * 67;
        const shape = `M${x + 12} ${y} H${x + 85} V${y + 60} H${x + 12} L${x} ${y + 48} V${y + 12}Z`;
        body += `<path d="${shape}" fill="#fff" stroke="${look.accent}" stroke-width=".8"/>` +
          `<path d="M${x + 12} ${y} H${x + 34} V${y + 60} H${x + 12} L${x} ${y + 48} V${y + 12}Z" fill="url(#${i % 2 ? 'p2' : 'p1'})"/>` +
          `<circle cx="${x + 8}" cy="${y + 30}" r="2.6" fill="#fff" stroke="${ink}" stroke-width=".4"/>`;
        // A tag with a friend's face on it is to them, so it says so; one
        // with her own face is from her, and the To is left to write in.
        const to = o.me && nameAt(i) !== look.name.trim() ? nameAt(i) : '';
        if (o.me) body += disc(poseAt(o, i), look, x + 22, y + 30, 10, `g${i}`);
        body += `<text x="${x + 40}" y="${y + 20}" font-size="5" font-weight="800" fill="${look.accent}">To</text>` +
          (to
            ? `<text x="${x + 49}" y="${y + 20}" font-size="${fit(to, 31, 6)}" font-weight="900" fill="${ink}">${esc(to)}</text>`
            : `<path d="M${x + 49} ${y + 20.5} H${x + 80}" stroke="${ink}" stroke-width=".35" opacity=".5"/>`) +
          `<text x="${x + 40}" y="${y + 40}" font-size="5" font-weight="800" fill="${look.accent}">From</text>` +
          `<text x="${x + 40}" y="${y + 50}" font-size="${fit(from, 40, 8)}" font-weight="900" fill="${ink}">${esc(from)}</text>` +
          `<path d="M${x + 12} ${y - 1.5} H${x + 86.5} V${y + 61.5} H${x + 12} L${x - 1.5} ${y + 48.5} V${y + 11.5}Z" ${CUT} stroke="${ink}" opacity=".3"/>`;
      }
      return page(pat(0.6), body, 'Gift tags', font);
    }

    case 'door': {
      const text = w || 'Knock first!';
      let body = '';
      for (let i = 0; i < 2; i++) {
        const x = 15 + i * 93;
        const y = 12;
        const cx = x + 43.5;
        const bg = i ? look.accent : look.paper;
        const fg = on(bg);
        const outline = `M${x + 6} ${y} H${x + 81} A6 6 0 0 1 ${x + 87} ${y + 6} V${y + 262} A8 8 0 0 1 ${x + 79} ${y + 270} H${x + 8} A8 8 0 0 1 ${x} ${y + 262} V${y + 6} A6 6 0 0 1 ${x + 6} ${y}Z`;
        body += `<path d="${outline}" fill="${bg}"/>` +
          `<path d="M${x + 6} ${y} H${x + 81} A6 6 0 0 1 ${x + 87} ${y + 6} V${y + 70} H${x} V${y + 6} A6 6 0 0 1 ${x + 6} ${y}Z" fill="url(#p${i + 1})"/>` +
          `<circle cx="${cx}" cy="${y + 30}" r="17" fill="#fff" stroke="${ink}" stroke-width=".4" stroke-dasharray="2 1.6"/>` +
          `<path d="M${cx} ${y} V${y + 13}" stroke="${ink}" stroke-width=".4" stroke-dasharray="2 1.6"/>` +
          `<text x="${cx}" y="${y + 88}" text-anchor="middle" font-size="7" font-weight="800" fill="${fg}" opacity=".85">${esc(whose(o.me ? nameAt(i) : look.name))} room</text>` +
          `<text x="${cx}" y="${y + 106}" text-anchor="middle" font-size="${fit(text, 76, 13)}" font-weight="900" fill="${fg}">${esc(text)}</text>`;
        if (o.me) body += figure(o.pose === 'mix' ? poses()[(i + 1) % poses().length].id : poseAt(o, i), x + 5, y + 118, 77, 152);
        body += `<path d="${outline}" ${CUT} stroke="${ink}" opacity=".4"/>`;
      }
      return page(pat(1), body, 'Door sign', font);
    }

    case 'cards': {
      let body = '';
      for (let i = 0; i < 10; i++) {
        const x = 17.5 + (i % 2) * 90;
        const y = 10 + Math.floor(i / 2) * 56;
        body += `<rect x="${x}" y="${y}" width="85" height="55" rx="3" fill="${look.paper}"/>` +
          `<path d="M${x} ${y + 47} H${x + 85} V${y + 52} A3 3 0 0 1 ${x + 82} ${y + 55} H${x + 3} A3 3 0 0 1 ${x} ${y + 52}Z" fill="url(#p1)"/>` +
          logo(look, x + 4, y + 4, 39) +
          `<text x="${x + 46}" y="${y + 21}" font-size="${fit(look.name || look.brand.name, 36, 9)}" font-weight="900" fill="${look.ink}">${esc(look.name || look.brand.name)}</text>` +
          `<text x="${x + 46}" y="${y + 28}" font-size="${fit(look.brand.tagline, 36, 3.4)}" font-weight="700" fill="${look.accent}">${esc(look.brand.tagline)}</text>` +
          (w ? `<text x="${x + 46}" y="${y + 37}" font-size="${fit(w, 36, 3.2)}" fill="${look.ink}" opacity=".8">${esc(w)}</text>` : '') +
          `<rect x="${x}" y="${y}" width="85" height="55" rx="3" fill="none" stroke="${ink}" stroke-width=".25" opacity=".4"/>`;
      }
      return page(pat(0.6), body, 'Business cards', font);
    }

    case 'logos': {
      let body = '';
      for (let i = 0; i < 12; i++) {
        const x = 20 + (i % 3) * 60;
        const y = 16 + Math.floor(i / 3) * 66;
        body += logo(look, x, y, 52) + `<rect x="${x - 3}" y="${y - 3}" width="58" height="58" rx="10" ${CUT} stroke="${ink}" opacity=".3"/>`;
      }
      return page('', body, 'Logo stickers', font);
    }
  }
}
