/**
 * Turns a picture of a character into a cut-out, on this device.
 *
 * The same idea as scripts/cutout.py, which made Jazz's poses, but in the
 * browser so a family can add their own character without sending it
 * anywhere. The picture should be the character on one plain colour; the
 * grown-up guide asks for magenta, which nothing on a child is, but any plain
 * colour works:
 *
 *   1. The background colour is read from the edges of the picture.
 *   2. Only background joined to the edges is removed, found by filling in
 *      from the border. A white t-shirt or the whites of the eyes are the same
 *      colour as a white background but are not joined to it, so they stay.
 *   3. Pixels part-way between character and background get part-way alpha,
 *      and the background colour is taken back out of them, so the edge does
 *      not carry a fringe of it. A magenta background also bounces magenta
 *      light onto hair; that comes out too.
 *
 * A picture that is already transparent at the edges is kept as it is.
 *
 * Then `focus()` finds the head, so stickers and labels can frame the face.
 */

export interface Cut {
  blob: Blob;
  w: number;
  h: number;
  /** Centre of the face, and a circle wide enough for the head, in pixels. */
  cx: number;
  cy: number;
  d: number;
  /** How much of the picture turned out to be background, 0 to 1. */
  cleared: number;
  /** Where the trimmed cut-out sat in the whole picture, at the same scale. */
  ox?: number;
  oy?: number;
}

const EDGE = 900;

export async function cutOut (file: Blob): Promise<Cut> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;

  if (!alreadyClear(px, w, h)) { key(px, w, h); tighten(px, w, h); }
  ctx.putImageData(img, 0, 0);
  let clear = 0;
  for (let i = 3; i < px.length; i += 4) if (px[i] < 24) clear++;
  const cleared = clear / (w * h);

  // Trim to the character, with a little room.
  const box = bounds(px, w, h);
  if (!box) throw new Error('Nothing was left once the background came out. Try a picture on one plain colour.');
  const pad = 6;
  const x0 = Math.max(0, box.x0 - pad);
  const y0 = Math.max(0, box.y0 - pad);
  const x1 = Math.min(w, box.x1 + pad);
  const y1 = Math.min(h, box.y1 + pad);
  const out = document.createElement('canvas');
  out.width = x1 - x0;
  out.height = y1 - y0;
  out.getContext('2d')!.drawImage(canvas, x0, y0, out.width, out.height, 0, 0, out.width, out.height);

  const f = focus(out);
  const blob = await new Promise<Blob>((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not save the picture'))), 'image/png'));
  return { blob, w: out.width, h: out.height, ...f, cleared, ox: x0, oy: y0 };
}

/**
 * The picture kept whole, background and all: for a photo taken anywhere,
 * where there is no plain background to take away. Only made smaller. The
 * face is assumed to be in the middle, a little above centre, which is where
 * people put it; they can move the circle if not.
 */
export async function photoOf (file: Blob): Promise<Cut> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not save the picture'))), 'image/jpeg', 0.9));
  const d = Math.min(w, h) * 0.62;
  return { blob, w, h, cx: w / 2, cy: h * 0.42, d, cleared: 0 };
}

/** True when the edges are already see-through: a cut-out someone made elsewhere. */
function alreadyClear (px: Uint8ClampedArray, w: number, h: number): boolean {
  let clear = 0;
  let n = 0;
  for (let x = 0; x < w; x += 8) { n += 2; if (px[(x) * 4 + 3] < 20) clear++; if (px[((h - 1) * w + x) * 4 + 3] < 20) clear++; }
  for (let y = 0; y < h; y += 8) { n += 2; if (px[(y * w) * 4 + 3] < 20) clear++; if (px[(y * w + w - 1) * 4 + 3] < 20) clear++; }
  return clear > n * 0.6;
}

function key (px: Uint8ClampedArray, w: number, h: number): void {
  // The background colour: the middle value of each channel round the border.
  const rs: number[] = []; const gs: number[] = []; const bs: number[] = [];
  const sample = (i: number): void => { rs.push(px[i]); gs.push(px[i + 1]); bs.push(px[i + 2]); };
  for (let x = 0; x < w; x += 4) { sample(x * 4); sample(((h - 1) * w + x) * 4); }
  for (let y = 0; y < h; y += 4) { sample(y * w * 4); sample((y * w + w - 1) * 4); }
  const mid = (a: number[]): number => a.sort((p, q) => p - q)[a.length >> 1];
  const br = mid(rs); const bg = mid(gs); const bb = mid(bs);

  const LO = 38; // this close to the background is background
  // Wide enough that a pixel halfway between skin and magenta counts as part
  // edge, not solid: kept solid, it lost its magenta and turned into a grey rim.
  const HI = 170; // this far away is character
  const dist = (i: number): number => {
    const dr = px[i] - br; const dg = px[i + 1] - bg; const db = px[i + 2] - bb;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  // Fill in from every border pixel through anything near the background colour.
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (p: number): void => {
    if (seen[p]) return;
    if (dist(p * 4) >= HI) return;
    seen[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (stack.length) {
    const p = stack.pop()!;
    // Only carry on through pixels that are clearly background; a soft edge
    // pixel is kept in the fill but not walked through, so the fill cannot
    // leak into the character along its own anti-aliasing.
    if (dist(p * 4) > LO) continue;
    const x = p % w; const y = (p / w) | 0;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (y > 0) push(p - w);
    if (y < h - 1) push(p + w);
  }

  const magenta = br - bg > 120 && bb - bg > 120;
  // On magenta, how see-through an edge pixel is reads best from how magenta
  // it is: red and blue over green, which is zero or less on skin, hair and
  // clothes and about 240 on the background, and changes in step with the
  // blend. Plain distance from the background colour does not, and edges
  // came out with a thin dark line.
  const bgMagenta = Math.min(br, bb) - bg;
  const alphaOf = (i: number): number => {
    if (magenta) {
      const m = Math.min(px[i], px[i + 2]) - px[i + 1];
      return Math.max(0, Math.min(1, 1 - m / (bgMagenta - 10)));
    }
    const d = dist(i);
    return d <= LO ? 0 : Math.min(1, (d - LO) / (HI - LO));
  };
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (seen[p]) {
      const a = alphaOf(i);
      if (a === 0) { px[i + 3] = 0; continue; }
      // C = a*F + (1-a)*B, so F = (C - (1-a)*B) / a
      px[i] = clamp((px[i] - (1 - a) * br) / a);
      px[i + 1] = clamp((px[i + 1] - (1 - a) * bg) / a);
      px[i + 2] = clamp((px[i + 2] - (1 - a) * bb) / a);
      px[i + 3] = Math.round(a * px[i + 3]);
    }
    if (magenta && px[i + 3] > 0) {
      // Red and blue both above green is magenta light on hair; skin is not.
      const spill = Math.min(px[i], px[i + 2]) - px[i + 1];
      if (spill > 0) { px[i] -= spill; px[i + 2] -= spill; }
    }
  }
}

const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));

/**
 * Pulls the edge in by about half a pixel. The outermost ring is where a pixel
 * is part skin and part background in proportions the keying can only guess,
 * and a wrong guess shows as a thin dark line against a light page. Each
 * pixel's alpha is averaged with the lowest around it, which softens that ring
 * away and leaves the inside alone.
 */
function tighten (px: Uint8ClampedArray, w: number, h: number): void {
  const a = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) a[p] = px[p * 4 + 3];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (a[p] === 0) continue;
      let low = a[p];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx; const yy = y + dy;
          const n = xx < 0 || yy < 0 || xx >= w || yy >= h ? 0 : a[yy * w + xx];
          if (n < low) low = n;
        }
      }
      if (low < a[p]) px[p * 4 + 3] = (a[p] + low) >> 1;
    }
  }
}

function bounds (px: Uint8ClampedArray, w: number, h: number): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = w; let y0 = h; let x1 = -1; let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 24) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

/**
 * Where the face is. The head is the top of the character: measure how wide
 * the figure is a little below the top of the head, where the hair and ears
 * are and a waving hand usually is not, and take the middle of that as the
 * face. Checked on Jazz's own six poses cut from their magenta renders: the
 * circle lands on her face in every one, the waving and pointing hands too.
 */
export function focus (canvas: HTMLCanvasElement): { cx: number; cy: number; d: number } {
  const w = canvas.width; const h = canvas.height;
  const px = canvas.getContext('2d')!.getImageData(0, 0, w, h).data;
  let top = 0;
  outer: for (; top < h; top++) for (let x = 0; x < w; x++) if (px[(top * w + x) * 4 + 3] > 128) break outer;
  const spans: Array<[number, number]> = [];
  for (const f of [0.1, 0.14, 0.18, 0.22, 0.26]) {
    const y = Math.min(h - 1, top + Math.round(h * f));
    // The widest unbroken run on this row: the head, not a hand beside it.
    let best: [number, number] = [0, 0]; let start = -1;
    for (let x = 0; x <= w; x++) {
      const on = x < w && px[(y * w + x) * 4 + 3] > 128;
      if (on && start < 0) start = x;
      if (!on && start >= 0) { if (x - start > best[1] - best[0]) best = [start, x]; start = -1; }
    }
    spans.push(best);
  }
  spans.sort((a, b) => (a[1] - a[0]) - (b[1] - b[0]));
  const [l, r] = spans[spans.length >> 1];
  const head = Math.max(20, r - l);
  return { cx: (l + r) / 2, cy: top + head * 0.63, d: head * 1.3 };
}
