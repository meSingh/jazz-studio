/**
 * The characters: Jazz's six poses, and any a family adds themselves.
 *
 * Jazz's are cut-outs made by scripts/cutout.py, drawn from a photo of her.
 * A family's own are made the same way in the browser (see cutout.ts) and kept
 * in IndexedDB on this device. Once a family has added any, theirs are the
 * character list, and Jazz stays in it only if they tick the box to keep her.
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
import { run, CHARACTERS } from './makes';

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
}

export const JAZZ: Pose[] = [
  { id: 'portrait', label: 'Smiling', url: portrait, w: 842, h: 900, cx: 483, cy: 300, d: 600 },
  { id: 'hello', label: 'Waving', url: hello, w: 900, h: 838, cx: 450, cy: 300, d: 600 },
  { id: 'draw', label: 'Drawing', url: draw, w: 900, h: 838, cx: 450, cy: 300, d: 600 },
  { id: 'idea', label: 'Big idea', url: idea, w: 833, h: 900, cx: 483, cy: 300, d: 600 },
  { id: 'wink', label: 'Wink', url: wink, w: 900, h: 838, cx: 450, cy: 300, d: 600 },
  { id: 'cool', label: 'Cool', url: cool, w: 799, h: 900, cx: 483, cy: 300, d: 600 }
];

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
}

let own: Pose[] = [];
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
    return { id: c.id, label: c.label, url, w: c.w, h: c.h, cx: c.cx, cy: c.cy, d: c.d, own: true };
  });
}

export const saveOwn = async (c: Stored): Promise<void> => { await run('readwrite', (s) => s.put(c), CHARACTERS); await loadOwn(); };
export const removeOwn = async (id: string): Promise<void> => { await run('readwrite', (s) => s.delete(id), CHARACTERS); await loadOwn(); };

/** Moves or resizes the circle a family's character is framed in. */
export async function nudgeOwn (id: string, change: { dy?: number; zoom?: number }): Promise<void> {
  const c = await run('readonly', (s) => s.get(id) as IDBRequest<Stored | undefined>, CHARACTERS);
  if (!c) return;
  if (change.dy) c.cy += change.dy * c.d;
  if (change.zoom) c.d = Math.max(40, c.d * change.zoom);
  await saveOwn(c);
}

export async function renameOwn (id: string, label: string): Promise<void> {
  const c = await run('readonly', (s) => s.get(id) as IDBRequest<Stored | undefined>, CHARACTERS);
  if (c && label.trim()) await saveOwn({ ...c, label: label.trim() });
}

export function setKeepJazz (on: boolean): void { keepJazz = on; }
export const hasOwn = (): boolean => own.length > 0;
export const ownPoses = (): Pose[] => own;

/** The character list: theirs if they have added any (and Jazz too if they kept her), otherwise Jazz. */
export function poses (): Pose[] {
  if (!own.length) return JAZZ;
  return keepJazz ? [...own, ...JAZZ] : own;
}

/** A pose by id. One that is no longer in the list (removed, or Jazz hidden) falls back to the first. */
export function pose (id: PoseId): Pose {
  const list = poses();
  return list.find((p) => p.id === id) ?? list[0];
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

/** The whole pose, standing on a line, fitted into a box. */
export function figure (id: PoseId, x: number, y: number, w: number, h: number): string {
  const p = pose(id);
  const k = Math.min(w / p.w, h / p.h);
  const fw = p.w * k;
  const fh = p.h * k;
  return `<image href="${p.url}" x="${+(x + (w - fw) / 2).toFixed(2)}" y="${+(y + h - fh).toFixed(2)}" ` +
    `width="${+fw.toFixed(2)}" height="${+fh.toFixed(2)}" preserveAspectRatio="none"/>`;
}

/** For the screens: an <img> of a pose. */
export function img (id: PoseId, cls = ''): string {
  const p = pose(id);
  return `<img class="${cls}" src="${p.url}" width="${p.w}" height="${p.h}" alt="" draggable="false">`;
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
