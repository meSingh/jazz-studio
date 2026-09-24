/**
 * Stationery: a tile for each thing she can make, then one thing at a time.
 *
 * Like Play: the room opens on a grid of tiles, each a small live preview of
 * that sheet in her pattern and colours, with its name and what it is for.
 * Choosing one opens it on its own (#/stationery/labels and so on), so she is
 * working on one sheet, not choosing between eleven while she does.
 */
import { look } from '../look';
import { KINDS, sheet, type Kind } from '../sheets';
import { remembered } from '../ui';
import { bench, type BenchState } from './bench';

export const stationeryState = remembered<BenchState>('jazz-studio-stationery',
  { kind: 'faces', me: true, pose: 'mix', words: {} });

/**
 * Prefixes every id in an SVG, and every reference to one. Each sheet names
 * its patterns p1 and p2; eleven of them on one page would all use whichever
 * came first.
 */
function scoped (svg: string, prefix: string): string {
  return svg
    .replace(/id="([^"]+)"/g, `id="${prefix}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${prefix}$1"`);
}

export function stationeryRoom (main: HTMLElement, sub: string): void {
  const kind = KINDS.find((k) => k.id === sub);
  if (kind) {
    stationeryState.set({ kind: kind.id as Kind });
    bench(main, [kind], stationeryState);
    return;
  }
  const s = stationeryState.get();
  const l = look();
  main.innerHTML = `<div class="sheets-hub">${KINDS.map((k, i) => {
    const preview = sheet(k.id, { pattern: l.pattern, words: s.words[k.id] ?? '', me: s.me, pose: s.pose }, l);
    return `<a class="sheet-tile" href="#/stationery/${k.id}" style="--tilt:${[-0.8, 0.6, -0.4, 0.9, -0.6][i % 5]}deg">` +
      `<span class="sheet-mini">${scoped(preview, `k${i}-`)}</span>` +
      `<span class="sheet-name">${k.label}</span><span class="sheet-blurb">${k.blurb}</span></a>`;
  }).join('')}</div>`;
}
