/**
 * Jazz's character: six poses of the same girl, drawn from a photo of her.
 *
 * Each pose is a cut-out made by scripts/cutout.py. She picks which one says
 * hello on Home and which one goes on her stationery, and can change either
 * whenever she likes. The artwork is hers; see the README.
 *
 * FOCUS is where her head is in each image, measured from the cut-outs, so a
 * sticker or a label can frame her face in a circle rather than guess.
 */
import hello from './assets/jazz/hello.webp';
import draw from './assets/jazz/draw.webp';
import idea from './assets/jazz/idea.webp';
import wink from './assets/jazz/wink.webp';
import cool from './assets/jazz/cool.webp';
import portrait from './assets/jazz/portrait.webp';

export type PoseId = 'hello' | 'draw' | 'idea' | 'wink' | 'cool' | 'portrait';

export interface Pose {
  id: PoseId;
  label: string;
  url: string;
  w: number;
  h: number;
  /** Centre of her face, and a circle wide enough for her whole head, in image pixels. */
  cx: number;
  cy: number;
  d: number;
}

export const POSES: Pose[] = [
  { id: 'portrait', label: 'Smiling', url: portrait, w: 842, h: 900, cx: 483, cy: 300, d: 600 },
  { id: 'hello', label: 'Waving', url: hello, w: 900, h: 838, cx: 450, cy: 300, d: 600 },
  { id: 'draw', label: 'Drawing', url: draw, w: 900, h: 838, cx: 450, cy: 300, d: 600 },
  { id: 'idea', label: 'Big idea', url: idea, w: 833, h: 900, cx: 483, cy: 300, d: 600 },
  { id: 'wink', label: 'Wink', url: wink, w: 900, h: 838, cx: 450, cy: 300, d: 600 },
  { id: 'cool', label: 'Cool', url: cool, w: 799, h: 900, cx: 483, cy: 300, d: 600 }
];

export const pose = (id: PoseId): Pose => POSES.find((p) => p.id === id) ?? POSES[0];

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
