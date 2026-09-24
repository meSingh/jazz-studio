/**
 * The characters: Jazz's six poses, her brother Sukhi's seven, and any a
 * family adds themselves.
 *
 * Jazz's are cut-outs made by scripts/cutout.py, drawn from a photo of her;
 * Sukhi's are the Sukhi Play mascot. A family's own are made the same way in
 * the browser (see cutout.ts) and kept in IndexedDB on this device.
 *
 * Every character belongs to a person, who has a name: Jazz, Sukhi, or the
 * name a family's own was given, which is how a friend comes in; one with no
 * name is theirs, and goes by their name. Jazz is always Jazz: picking one of
 * hers as yours does not make her you. A sheet with several people on it puts
 * each one's name with their face (see nameFor).
 *
 * Which are in the list: a family's own, and Jazz's and Sukhi's where they are
 * switched on in Make it yours (Look.sets). Never none: with nothing else,
 * Jazz's are there.
 *
 * Every pose knows where its face is (cx, cy, d), so a sticker or a label can
 * frame the face in a circle rather than guess. Jazz's were measured; a
 * family's are found by cutout.ts and can be nudged in Make it yours.
 */
import hello from './assets/jazz/hello.webp';
import draw from './assets/jazz/draw.webp';
import idea from './assets/jazz/idea.webp';
import wink from './assets/jazz/wink.webp';
import cool from './assets/jazz/cool.webp';
import portrait from './assets/jazz/portrait.webp';
import sSmiling from './assets/sukhi/smiling.webp';
import sGrin from './assets/sukhi/grin.webp';
import sLaughing from './assets/sukhi/laughing.webp';
import sSilly from './assets/sukhi/silly.webp';
import sThinking from './assets/sukhi/thinking.webp';
import sProud from './assets/sukhi/proud.webp';
import sPainting from './assets/sukhi/painting.webp';
import { run, CHARACTERS } from './makes';
import { look, setLook, type Look, type Brand } from './look';

/** One of Jazz's ('hello', 'draw' and so on), or 'c-' and an id for a family's own. */
export type PoseId = string;

export interface Pose {
  id: PoseId;
  label: string;
  url: string;
  w: number;
  h: number;
  /** Centre of the face, and a circle wide enough for the whole head, in image pixels. */
  cx: number;
  cy: number;
  d: number;
  own?: boolean;
  /** A photo kept whole, background and all, rather than a cut-out. */
  photo?: boolean;
  /** Whose it is, for the ready-made ones. A family's own go by their label. */
  who?: 'Jazz' | 'Sukhi';
}

export const JAZZ: Pose[] = [
  { id: 'portrait', label: 'Smiling', url: portrait, w: 842, h: 900, cx: 483, cy: 300, d: 600 },
  { id: 'hello', label: 'Waving', url: hello, w: 900, h: 838, cx: 450, cy: 300, d: 600 },
  { id: 'draw', label: 'Drawing', url: draw, w: 900, h: 838, cx: 450, cy: 300, d: 600 },
  { id: 'idea', label: 'Big idea', url: idea, w: 833, h: 900, cx: 483, cy: 300, d: 600 },
  { id: 'wink', label: 'Wink', url: wink, w: 900, h: 838, cx: 450, cy: 300, d: 600 },
  { id: 'cool', label: 'Cool', url: cool, w: 799, h: 900, cx: 483, cy: 300, d: 600 }
].map((p) => ({ ...p, who: 'Jazz' as const }));

/**
 * Sukhi, the Sukhi Play mascot, who is Jazz's little brother: from his model
 * sheet, cut out on the computer (macOS Vision, scripts/sukhi.py) rather than keyed, and measured
 * like hers. Six expressions, head and shoulders, and one of him painting.
 */
export const SUKHI: Pose[] = [
  { id: 'sukhi-smiling', label: 'Smiling', url: sSmiling, w: 491, h: 611, cx: 246, cy: 251, d: 525 },
  { id: 'sukhi-grin', label: 'Big grin', url: sGrin, w: 496, h: 611, cx: 248, cy: 251, d: 525 },
  { id: 'sukhi-laughing', label: 'Laughing', url: sLaughing, w: 496, h: 611, cx: 248, cy: 251, d: 525 },
  { id: 'sukhi-silly', label: 'Silly', url: sSilly, w: 472, h: 613, cx: 235, cy: 251, d: 527 },
  { id: 'sukhi-thinking', label: 'Thinking', url: sThinking, w: 455, h: 606, cx: 228, cy: 248, d: 521 },
  { id: 'sukhi-proud', label: 'Proud', url: sProud, w: 459, h: 607, cx: 228, cy: 249, d: 522 },
  { id: 'sukhi-painting', label: 'Painting', url: sPainting, w: 632, h: 848, cx: 337, cy: 198, d: 405 }
].map((p) => ({ ...p, who: 'Sukhi' as const }));

/** A family's own character as it is kept. */
export interface Stored {
  id: string;
  label: string;
  blob: Blob;
  w: number;
  h: number;
  cx: number;
  cy: number;
  d: number;
  added: number;
  photo?: boolean;
}

let own: Pose[] = [];
let sets: { jazz: boolean; sukhi: boolean } | undefined;
let keepJazz = false;
const blobUrls: string[] = [];

/** Reads a family's characters. Called once before the first screen, and after each change. */
export async function loadOwn (): Promise<void> {
  let list: Stored[] = [];
  try { list = await run('readonly', (s) => s.getAll() as IDBRequest<Stored[]>, CHARACTERS); } catch { /* storage off: Jazz only */ }
  blobUrls.splice(0).forEach((u) => URL.revokeObjectURL(u));
  own = list.sort((a, b) => a.added - b.added).map((c) => {
    const url = URL.createObjectURL(c.blob);
    blobUrls.push(url);
    return { id: c.id, label: c.label, url, w: c.w, h: c.h, cx: c.cx, cy: c.cy, d: c.d, own: true, photo: c.photo === true };
  });
}

export const saveOwn = async (c: Stored): Promise<void> => { await run('readwrite', (s) => s.put(c), CHARACTERS); await loadOwn(); };
export const removeOwn = async (id: string): Promise<void> => { await run('readwrite', (s) => s.delete(id), CHARACTERS); await loadOwn(); };

/** Moves or resizes the circle a family's character is framed in. */
export async function nudgeOwn (id: string, change: { dx?: number; dy?: number; zoom?: number }): Promise<void> {
  const c = await run('readonly', (s) => s.get(id) as IDBRequest<Stored | undefined>, CHARACTERS);
  if (!c) return;
  if (change.dx) c.cx += change.dx * c.d;
  if (change.dy) c.cy += change.dy * c.d;
  if (change.zoom) c.d = Math.max(40, c.d * change.zoom);
  await saveOwn(c);
}

export async function renameOwn (id: string, label: string): Promise<void> {
  const c = await run('readonly', (s) => s.get(id) as IDBRequest<Stored | undefined>, CHARACTERS);
  // Empty is allowed: no name means the character is theirs.
  if (c) await saveOwn({ ...c, label: label.trim() });
}

/** Which ready-made sets are switched on; the router passes the look in before each screen. */
export function useSets (l: Look): void {
  sets = l.sets;
  keepJazz = l.keepJazz;
}

/**
 * The sets as they are now. A look from before Sukhi had only "keep Jazz":
 * Jazz was in the list unless the family had their own and had not kept her.
 */
export function setsNow (): { jazz: boolean; sukhi: boolean } {
  return sets ?? { jazz: !own.length || keepJazz, sukhi: false };
}

export const hasOwn = (): boolean => own.length > 0;
export const ownPoses = (): Pose[] => own;

/** The character list: a family's own first, then Jazz's and Sukhi's where they are on. */
export function poses (): Pose[] {
  const on = setsNow();
  const list = [...own, ...(on.jazz ? JAZZ : []), ...(on.sukhi ? SUKHI : [])];
  return list.length ? list : JAZZ;
}

/** Every character there is, on or off: for a kept print whose set has since been switched off. */
const everyone = (): Pose[] => [...own, ...JAZZ, ...SUKHI];

/**
 * A family's character with no name is theirs, and so is one given their own
 * name. One added before characters could be named was called "Character 2":
 * that is them too.
 */
const unnamed = (label: string): boolean => {
  const t = label.trim().toLowerCase();
  return !t || /^character \d+$/.test(t) || t === look().name.trim().toLowerCase();
};

/** Which person a character belongs to. */
export function personOf (p: Pose): string {
  if (p.who) return p.who.toLowerCase();
  if (!unnamed(p.label)) return `own:${p.label.trim().toLowerCase()}`;
  // Theirs. Someone whose name is Jazz (on Jazz's own iPad) is Jazz, so what
  // she adds goes with her ready-made ones rather than making a second Jazz.
  const me = look().name.trim().toLowerCase();
  return me === 'jazz' || me === 'sukhi' ? me : 'me';
}

/**
 * The name to put with a character on a sheet: the person it belongs to.
 * Jazz's are Jazz and Sukhi's are Sukhi, whoever picked them as their own. A
 * family's goes by the name it was given, or theirs if it has none, so it
 * follows their name if they change it.
 */
export function nameFor (id: PoseId, l: Look): string {
  const p = pose(id);
  if (p.who) return p.who;
  return unnamed(p.label) ? l.name.trim() : p.label.trim();
}

/** The people in the list, in order, each with their characters: for pickers that group by person. */
export function people (l: Look): Array<{ key: string; name: string; poses: Pose[] }> {
  const out: Array<{ key: string; name: string; poses: Pose[] }> = [];
  for (const p of poses()) {
    const key = personOf(p);
    let group = out.find((g) => g.key === key);
    if (!group) {
      group = { key, name: nameFor(p.id, l) || 'You', poses: [] };
      out.push(group);
    }
    group.poses.push(p);
  }
  return out;
}

/** A pose by id. One that is no longer in the list (removed, or Jazz hidden) falls back to the first. */
export function pose (id: PoseId): Pose {
  const list = poses();
  return list.find((p) => p.id === id) ?? everyone().find((p) => p.id === id) ?? list[0];
}

/**
 * For places that show a particular pose of Jazz's, like the tiles on Home:
 * that pose while Jazz is the character, and theirs, one after another, once
 * they have their own.
 */
export function either (jazz: PoseId, i: number): PoseId {
  const list = poses();
  return list.some((p) => p.id === jazz) ? jazz : list[i % list.length].id;
}

/** Her face framed in a circle, for SVG sheets. `clip` must be unique on the page. */
export function face (id: PoseId, x: number, y: number, r: number, clip: string, zoom = 1): string {
  const p = pose(id);
  const k = (2 * r * zoom) / p.d;
  return `<clipPath id="${clip}"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath>` +
    `<image href="${p.url}" x="${+(x - p.cx * k).toFixed(2)}" y="${+(y - p.cy * k).toFixed(2)}" ` +
    `width="${+(p.w * k).toFixed(2)}" height="${+(p.h * k).toFixed(2)}" clip-path="url(#${clip})" preserveAspectRatio="none"/>`;
}

let figures = 0;

/**
 * The whole pose, standing on a line, fitted into a box. A photo has its own
 * background, so it goes in a frame with rounded corners instead of standing
 * on the page.
 */
export function figure (id: PoseId, x: number, y: number, w: number, h: number): string {
  const p = pose(id);
  // Sized by the head as well as the box: a picture of the whole of Sukhi
  // and one of Jazz from the waist up, side by side on two door signs, would
  // otherwise make him twice her size. No head is wider than six tenths of
  // the box's shorter side, so the children come out the same size.
  const k = Math.min(w / p.w, h / p.h, (Math.min(w, h) * 0.6) / p.d);
  const fw = p.w * k;
  const fh = p.h * k;
  const fx = +(x + (w - fw) / 2).toFixed(2);
  const fy = +(y + h - fh).toFixed(2);
  const image = `<image href="${p.url}" x="${fx}" y="${fy}" width="${+fw.toFixed(2)}" height="${+fh.toFixed(2)}" preserveAspectRatio="none"`;
  if (!p.photo) return `${image}/>`;
  const clip = `fig${++figures}`;
  const r = Math.min(fw, fh) * 0.08;
  return `<clipPath id="${clip}"><rect x="${fx}" y="${fy}" width="${+fw.toFixed(2)}" height="${+fh.toFixed(2)}" rx="${+r.toFixed(2)}"/></clipPath>` +
    `${image} clip-path="url(#${clip})"/>`;
}

/** For the screens: an <img> of a pose. */
export function img (id: PoseId, cls = ''): string {
  const p = pose(id);
  return `<img class="${cls}${p.photo ? ' is-photo' : ''}" src="${p.url}" width="${p.w}" height="${p.h}" alt="" draggable="false">`;
}

/**
 * A head and shoulders peeking over the edge of a tile, framed from where the
 * face is rather than from the picture's width, so any character fits the
 * same way however it was drawn or cropped. The window is `w` by `h` pixels.
 */
export function peekImg (id: PoseId, w = 104, h = 78): string {
  const p = pose(id);
  const k = (h * 0.95) / p.d;
  const left = w / 2 - p.cx * k;
  const top = h * 0.52 - p.cy * k;
  return `<span class="peek" style="width:${w}px;height:${h}px"><img src="${p.url}" alt="" draggable="false" ` +
    `style="width:${(p.w * k).toFixed(1)}px;left:${left.toFixed(1)}px;top:${top.toFixed(1)}px"></span>`;
}

/**
 * For a screen thumbnail: the face, cropped from the pose with CSS, the same
 * way a sticker frames it, so a thumbnail shows what a sticker will.
 */
export function faceImg (id: PoseId, cls = ''): string {
  const p = pose(id);
  const scale = p.w / p.d;
  const left = (p.cx / p.w) * 100;
  const top = (p.cy / p.h) * 100;
  return `<span class="${cls} face-crop"><img src="${p.url}" alt="" draggable="false" ` +
    `style="width:${(scale * 100).toFixed(1)}%;left:${(50 - left * scale).toFixed(1)}%;top:calc(50% - ${(top * scale * p.h / p.w).toFixed(1)}%)"></span>`;
}

/* Brands ------------------------------------------------------------------ */

/**
 * Each person's brand: their logo's name, line, style and picture. A sheet
 * with Sukhi on it carries Sukhi's brand, one with Jazz carries Jazz's. Made
 * in My brand, one person at a time; until then, "Sukhi Studio" with his
 * picture. A look from before brands were each person's had one brand, which
 * stays with whoever was theirs.
 */
export function brandFor (key: string, l: Look = look()): Brand {
  const saved = l.brands?.[key];
  if (saved) return saved;
  const theirs = personOf(pose(l.pose));
  if (!l.brands && key === theirs && l.brand.name !== 'My Studio') return l.brand;
  const first = everyone().find((p) => personOf(p) === key);
  const name = key === 'me' ? l.name.trim() : first ? nameFor(first.id, l) : '';
  return { name: name ? `${name} Studio` : 'My Studio', tagline: 'Artist · Maker · Writer', style: 'badge', me: true, pose: first?.id };
}

/** Changes one person's brand, keeping the old single brand where it belonged. */
export function setBrand (key: string, change: Partial<Brand>): void {
  const l = look();
  const brands = { ...(l.brands ?? { [personOf(pose(l.pose))]: brandFor(personOf(pose(l.pose)), l) }) };
  brands[key] = { ...brandFor(key, l), ...change };
  setLook({ brands });
}

/** Whose brand a sheet with this character on it carries. */
export const brandKeyFor = (id: PoseId): string => personOf(pose(id));
