/**
 * The workbench: the choices, then the colour strip, the sheet and Print, in
 * that order. Side by side on a wide screen, the choices on the left; one
 * after another on a phone, so she works down the page and never has to go
 * back up to the choices after seeing the sheet.
 *
 * Stationery and My brand both print sheets, so both use this. Each keeps its
 * own remembered state: which sheet, her words for each one, whether she is
 * on it, and which character. That choice lives here, in the tool, rather
 * than in Make it yours, and starts as the character she chose there.
 */
import { look } from '../look';
import { sheet, type Kind, type KindInfo, type Options } from '../sheets';
import type { PoseId } from '../character';
import {
  esc, field, heading, printButton, wirePrint, wireChoice, colourBar, wireColours,
  patternPicker, wirePatterns, posePicker, refresh, remembered, scoped
} from '../ui';

export interface BenchState {
  kind: Kind;
  me: boolean;
  pose: PoseId | 'mix';
  words: Partial<Record<Kind, string>>;
}

export type Bench = ReturnType<typeof remembered<BenchState>>;

/**
 * `names` gives each sheet the name to show here, when the page's own title
 * already says what kind of thing they are ("Cover" rather than "Diary cover").
 */
export function bench (main: HTMLElement, kinds: KindInfo[], state: Bench, top = '', names: Partial<Record<Kind, string>> = {}): void {
  const s = state.get();
  const kind = kinds.find((k) => k.id === s.kind) ?? kinds[0];
  const l = look();
  const opts = (): Options => {
    const now = state.get();
    return { pattern: look().pattern, words: now.words[kind.id] ?? '', me: now.me, pose: now.pose };
  };

  // When there is a choice of sheet, it comes first, as a picture of each:
  // easier to tell apart than two names.
  const optionFor = (k: KindInfo, i: number): string => {
    const o = { pattern: l.pattern, words: s.words[k.id] ?? '', me: s.me, pose: s.pose };
    return `<button type="button" class="sheet-option" role="radio" data-kind="${k.id}" aria-checked="${k.id === kind.id}">` +
      `<span class="sheet-mini">${scoped(sheet(k.id, o, l), `o${i}-`)}</span>` +
      `<span class="sheet-name">${esc(names[k.id] ?? k.label)}</span><span class="sheet-blurb">${k.blurb}</span></button>`;
  };
  main.innerHTML = `${top}<div class="workbench">
    <section class="controls">
      ${kinds.length > 1
        ? heading('Which one') + `<div class="sheet-options" role="radiogroup" aria-label="Which one">${kinds.map(optionFor).join('')}</div>`
        : `<p class="hint">${kind.blurb}</p>`}
      ${kind.me ? `<label class="tick"><input type="checkbox" class="me" ${s.me ? 'checked' : ''}><span>Put me on it</span></label>` : ''}
      ${kind.pose || (kind.me && s.me) ? heading('Which you') + posePicker(s.pose === 'mix' && kind.id !== 'faces' ? l.pose : s.pose, kind.id === 'faces') : ''}
      ${heading('Pattern')}
      ${patternPicker()}
      ${kind.words ? heading('Words') + field(kind.words, `<input class="words" maxlength="40" placeholder="${esc(kind.start(l))}" value="${esc(s.words[kind.id] ?? '')}">`) : ''}
    </section>
    <section class="preview">
      ${colourBar()}
      <div class="print-area">${sheet(kind.id, opts(), l)}</div>
      ${printButton()}
    </section>
  </div>`;

  wireChoice(main, 'kind', (k) => { state.set({ kind: k as Kind }); refresh(); });
  wireChoice(main, 'pose', (p) => { state.set({ pose: p as PoseId | 'mix' }); refresh(); });
  wirePatterns(main);
  wireColours(main);
  main.querySelector<HTMLInputElement>('.me')?.addEventListener('change', (e) => {
    // A redraw, not just the sheet: ticking it brings the character picker in.
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
