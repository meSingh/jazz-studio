/**
 * Stationery: five tiles, then one group at a time.
 *
 * Like Play: the room opens on a grid of tiles, one for each group of sheets
 * (see GROUPS in sheets.ts), each a live preview in her pattern and colours.
 * A tile opens its group (#/stationery/diary and so on), which starts with a
 * picture of each sheet in it to choose between. Things that are nearly the
 * same are next to each other, so switching is one tap on the same page.
 */
import { KINDS, GROUPS, sheet, type Kind } from '../sheets';
import { remembered, scoped } from '../ui';
import { bench, designFor, type BenchState } from './bench';

export const stationeryState = remembered<BenchState>('jazz-studio-stationery',
  { kind: 'faces', me: true, pose: 'mix', words: {} });

export function stationeryRoom (main: HTMLElement, sub: string): void {
  // A sheet's own address from before the groups (#/stationery/labels) still
  // lands in the right place.
  const group = GROUPS.find((g) => g.id === sub) ?? GROUPS.find((g) => g.kinds.some((k) => k.id === sub));
  if (group) {
    const s = stationeryState.get();
    const wanted = group.kinds.some((k) => k.id === sub) ? sub as Kind : s.kind;
    // The sheet she last used in this group, or its first.
    stationeryState.set({ kind: group.kinds.some((k) => k.id === wanted) ? wanted : group.kinds[0].id });
    const kinds = group.kinds.map((g) => KINDS.find((k) => k.id === g.id)!);
    bench(main, kinds, stationeryState, '', Object.fromEntries(group.kinds.map((g) => [g.id, g.short])));
    return;
  }
  const s = stationeryState.get();
  main.innerHTML = `<div class="sheets-hub">${GROUPS.map((g, i) => {
    // The tile shows the sheet she last used in the group, if she has, in its own design.
    const shown = g.kinds.find((k) => k.id === s.kind)?.id ?? g.kinds[0].id;
    const l = designFor(stationeryState, shown).get();
    const preview = sheet(shown, { pattern: l.pattern, words: s.words[shown] ?? '', me: s.me, pose: s.pose }, l);
    return `<a class="sheet-tile" href="#/stationery/${g.id}" style="--tilt:${[-0.8, 0.6, -0.4, 0.9, -0.6][i % 5]}deg">` +
      `<span class="sheet-mini">${scoped(preview, `k${i}-`)}</span>` +
      `<span class="sheet-name">${g.label}</span><span class="sheet-blurb">${g.blurb}</span>` +
      `<span class="sheet-count">${g.kinds.map((k) => k.short).join(' · ')}</span></a>`;
  }).join('')}</div>`;
}
