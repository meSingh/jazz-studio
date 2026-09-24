/**
 * The studio backgrounds, drawn once to fit the whole screen.
 *
 * The first version repeated a small tile, and the repeat was the first thing
 * anyone saw: the same few stars marching across in a grid. These are drawn
 * for the actual size of the window, so nothing repeats:
 *
 *   Stars    a night sky: many stars of many sizes spread by Poisson-disc
 *            sampling (evenly apart, never in rows, never in clumps), a couple
 *            of soft glows, and a few that twinkle
 *   Glow     large soft washes of their two colours, drifting very slowly
 *   Waves    long flowing lines the full width of the screen
 *   Bubbles  bubbles of mixed sizes, spread the same way as the stars, some
 *            bobbing gently
 *
 * All in their own colours, faint enough to stay a background, and redrawn
 * when the window or their colours change. The sampling is seeded, so the same
 * window gets the same sky rather than a new one on every redraw. Movement is
 * CSS, and stops for anyone whose device asks for less motion.
 */
import type { Look, Backdrop } from './look';

/** A seeded random number source, so a redraw of the same size looks the same. */
function random (seed: number): () => number {
  let s = seed % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/**
 * Bridson's Poisson-disc sampling: points at least `gap` apart, filling the
 * area without the rows a grid makes or the clumps plain random makes.
 */
function spread (w: number, h: number, gap: number, rnd: () => number): Array<[number, number]> {
  const cell = gap / Math.SQRT2;
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  const grid = new Int32Array(cols * rows).fill(-1);
  const pts: Array<[number, number]> = [];
  const active: number[] = [];
  const put = (x: number, y: number): void => {
    grid[Math.floor(y / cell) * cols + Math.floor(x / cell)] = pts.length;
    active.push(pts.length);
    pts.push([x, y]);
  };
  put(rnd() * w, rnd() * h);
  while (active.length) {
    const ai = Math.floor(rnd() * active.length);
    const [px, py] = pts[active[ai]];
    let placed = false;
    for (let k = 0; k < 20; k++) {
      const a = rnd() * Math.PI * 2;
      const r = gap * (1 + rnd());
      const x = px + Math.cos(a) * r;
      const y = py + Math.sin(a) * r;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      let ok = true;
      for (let j = Math.max(0, cy - 2); j <= Math.min(rows - 1, cy + 2) && ok; j++) {
        for (let i = Math.max(0, cx - 2); i <= Math.min(cols - 1, cx + 2); i++) {
          const n = grid[j * cols + i];
          if (n >= 0 && (pts[n][0] - x) ** 2 + (pts[n][1] - y) ** 2 < gap * gap) { ok = false; break; }
        }
      }
      if (ok) { put(x, y); placed = true; break; }
    }
    if (!placed) active.splice(ai, 1);
  }
  return pts;
}

const f = (n: number): string => n.toFixed(1);

function star (x: number, y: number, r: number): string {
  // Four points, like a sparkle, rather than a sticker star.
  return `M${f(x)} ${f(y - r)}Q${f(x + r * 0.18)} ${f(y - r * 0.18)} ${f(x + r)} ${f(y)}` +
    `Q${f(x + r * 0.18)} ${f(y + r * 0.18)} ${f(x)} ${f(y + r)}Q${f(x - r * 0.18)} ${f(y + r * 0.18)} ${f(x - r)} ${f(y)}` +
    `Q${f(x - r * 0.18)} ${f(y - r * 0.18)} ${f(x)} ${f(y - r)}Z`;
}

let drawn = 0;

/** The inside of an SVG that is `w` by `h`, for this background in these colours. */
export function drawBackdrop (kind: Backdrop, look: Look, w: number, h: number): string {
  const { ink, accent, accent2 } = look;
  // Each drawing's gradients get their own names: the previews and the page
  // are all in one document, and a repeated id resolves to whichever is first.
  const id = `bd${++drawn}`;
  const rnd = random(Math.round(w * 7 + h * 13));
  let out = '';
  switch (kind) {
    case 'stars': {
      out += `<defs><radialGradient id="${id}n"><stop offset="0" stop-color="${accent}" stop-opacity=".16"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>` +
        `<radialGradient id="${id}m"><stop offset="0" stop-color="${accent2}" stop-opacity=".1"/><stop offset="1" stop-color="${accent2}" stop-opacity="0"/></radialGradient></defs>` +
        `<ellipse cx="${f(w * 0.78)}" cy="${f(h * 0.22)}" rx="${f(w * 0.35)}" ry="${f(h * 0.3)}" fill="url(#${id}n)"/>` +
        `<ellipse cx="${f(w * 0.15)}" cy="${f(h * 0.8)}" rx="${f(w * 0.3)}" ry="${f(h * 0.28)}" fill="url(#${id}m)"/>`;
      for (const [x, y] of spread(w, h, 26, rnd)) {
        const t = rnd();
        if (t < 0.93) {
          // Most are pinpricks, brighter the rarer they are.
          const r = 0.5 + t * t * 1.3;
          out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${ink}" opacity="${f(0.18 + t * 0.45)}"${t > 0.85 ? ' class="tw"' : ''}/>`;
        } else {
          out += `<path d="${star(x, y, 3.5 + rnd() * 4)}" fill="${rnd() > 0.5 ? accent2 : accent}" opacity=".75" class="tw"/>`;
        }
      }
      break;
    }
    case 'glow': {
      const blobs: Array<[number, number, number, string]> = [
        [0.15, 0.2, 0.55, accent], [0.85, 0.3, 0.5, accent2], [0.45, 0.85, 0.6, accent],
        [0.95, 0.95, 0.45, accent2], [0.05, 0.75, 0.4, accent2]
      ];
      out += '<defs>' + blobs.map((b, i) =>
        `<radialGradient id="${id}g${i}"><stop offset="0" stop-color="${b[3]}" stop-opacity=".22"/><stop offset=".6" stop-color="${b[3]}" stop-opacity=".07"/><stop offset="1" stop-color="${b[3]}" stop-opacity="0"/></radialGradient>`).join('') + '</defs>';
      const size = Math.max(w, h);
      blobs.forEach((b, i) => {
        out += `<circle class="drift d${i % 3}" cx="${f(b[0] * w)}" cy="${f(b[1] * h)}" r="${f(b[2] * size)}" fill="url(#${id}g${i})"/>`;
      });
      break;
    }
    case 'waves': {
      const lines = Math.max(6, Math.round(h / 110));
      for (let i = 0; i < lines; i++) {
        const y0 = (h / lines) * (i + 0.5);
        const amp = 14 + rnd() * 26;
        const len = 380 + rnd() * 420;
        const phase = rnd() * Math.PI * 2;
        // A second, slower ripple on each, so no two lines run parallel and
        // none of them is a textbook sine.
        const len2 = len * (2.3 + rnd() * 1.4);
        const phase2 = rnd() * Math.PI * 2;
        let d = '';
        // Drawn a screen wider than needed, so the slow drift never shows an end.
        for (let x = -len; x <= w * 2 + len; x += 16) {
          const y = y0 + Math.sin((x / len) * Math.PI * 2 + phase) * amp + Math.sin((x / len2) * Math.PI * 2 + phase2) * amp * 0.9;
          d += `${d ? 'L' : 'M'}${f(x)} ${f(y)}`;
        }
        const c = [accent, accent2, ink][i % 3];
        out += `<path class="flow f${i % 2}" d="${d}" fill="none" stroke="${c}" stroke-opacity="${i % 3 === 2 ? '.1' : '.22'}" stroke-width="${f(1.5 + rnd() * 2.5)}" stroke-linecap="round"/>`;
      }
      break;
    }
    case 'bubbles': {
      for (const [x, y] of spread(w, h, 90, rnd)) {
        const r = 6 + rnd() ** 2 * 34;
        const c = rnd() > 0.5 ? accent : accent2;
        out += `<g${rnd() > 0.6 ? ` class="bob b${Math.floor(rnd() * 3)}"` : ''}>` +
          `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}" fill-opacity=".06" stroke="${c}" stroke-opacity=".32" stroke-width="1.5"/>` +
          `<path d="M${f(x - r * 0.55)} ${f(y - r * 0.15)}A${f(r * 0.6)} ${f(r * 0.6)} 0 0 1 ${f(x - r * 0.1)} ${f(y - r * 0.6)}" fill="none" stroke="${ink}" stroke-opacity=".3" stroke-width="1.5" stroke-linecap="round"/></g>`;
      }
      break;
    }
    default:
      return '';
  }
  return out;
}

/** A small preview: the same background, drawn for a whole screen and shown shrunk. */
export function backdropPreview (kind: Backdrop, look: Look): string {
  return `<svg viewBox="0 0 960 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${drawBackdrop(kind, look, 960, 600)}</svg>`;
}

let layer: SVGSVGElement | null = null;
let current: { kind: Backdrop; look: Look } | null = null;
let timer = 0;

function paint (): void {
  if (!layer || !current) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  layer.setAttribute('viewBox', `0 0 ${w} ${h}`);
  layer.innerHTML = drawBackdrop(current.kind, current.look, w, h);
}

/** Draws the background behind the studio, and keeps it fitted to the window. */
export function showBackdrop (kind: Backdrop, look: Look): void {
  current = { kind, look };
  if (!layer) {
    layer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    layer.classList.add('backdrop-layer');
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('preserveAspectRatio', 'none');
    document.body.prepend(layer);
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = window.setTimeout(paint, 150);
    });
  }
  paint();
}
