/**
 * The workbench: choices on one side, the sheet on the other, with the colour
 * strip sitting on top of the sheet so a colour can be tried where it shows.
 *
 * Stationery and My brand both print sheets, so both use this. Each keeps its
 * own remembered state: which sheet, her words for each one, whether she is
 * on it, and which of her poses.
 */
import { look } from '../look';
import { sheet, type Kind, type KindInfo, type Options } from '../sheets';
import type { PoseId } from '../character';
import {
  esc, field, heading, printButton, wirePrint, wireChoice, colourBar, wireColours,
  patternPicker, wirePatterns, posePicker, refresh, remembered
} from '../ui';

export interface BenchState {
  kind: Kind;
  me: boolean;
  pose: PoseId | 'mix';
  words: Partial<Record<Kind, string>>;
}

export type Bench = ReturnType<typeof remembered<BenchState>>;

export function bench (main: HTMLElement, kinds: KindInfo[], state: Bench, top = ''): void {
  const s = state.get();
  const kind = kinds.find((k) => k.id === s.kind) ?? kinds[0];
  const l = look();
  const opts = (): Options => {
    const now = state.get();
    return { pattern: look().pattern, words: now.words[kind.id] ?? '', me: now.me, pose: now.pose };
  };

  main.innerHTML = `${top}<div class="workbench">
    <section class="controls">
      ${heading('What to make')}
      <div class="chips kinds" role="radiogroup" aria-label="What to make">${kinds.map((k) =>
        `<button type="button" class="chip" role="radio" data-kind="${k.id}" aria-checked="${k.id === kind.id}">${k.label}</button>`).join('')}</div>
      <p class="hint">${kind.blurb}</p>
      ${kind.pose ? heading('Which you') + posePicker(s.pose === 'mix' && kind.id !== 'faces' ? l.pose : s.pose, kind.id === 'faces') : ''}
      ${kind.me ? `<label class="tick"><input type="checkbox" class="me" ${s.me ? 'checked' : ''}><span>Put me on it</span></label>` : ''}
      ${heading('Pattern')}
      ${patternPicker()}
      ${kind.words ? heading('Words') + field(kind.words, `<input class="words" maxlength="40" placeholder="${esc(kind.start(l))}" value="${esc(s.words[kind.id] ?? '')}">`) : ''}
      ${printButton()}
    </section>
    <section class="preview">
      ${colourBar()}
      <div class="print-area">${sheet(kind.id, opts(), l)}</div>
    </section>
  </div>`;

  wireChoice(main, 'kind', (k) => { state.set({ kind: k as Kind }); refresh(); });
  wireChoice(main, 'pose', (p) => { state.set({ pose: p as PoseId | 'mix' }); refresh(); });
  wirePatterns(main);
  wireColours(main);
  main.querySelector<HTMLInputElement>('.me')?.addEventListener('change', (e) => {
    state.set({ me: (e.target as HTMLInputElement).checked });
    refresh();
  });
  const words = main.querySelector<HTMLInputElement>('.words');
  words?.addEventListener('input', () => {
    state.set({ words: { ...state.get().words, [kind.id]: words.value } });
    main.querySelector('.print-area')!.innerHTML = sheet(kind.id, opts(), look());
  });
  wirePrint(main);
}
