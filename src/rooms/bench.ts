/**
 * The workbench: the choices, then the colour strip, the sheet and Print, in
 * that order. Side by side on a wide screen, the choices on the left; one
 * after another on a phone, so she works down the page and never has to go
 * back up to the choices after seeing the sheet.
 *
 * Stationery and My brand both print sheets, so both use this. Each keeps its
 * own remembered state: which sheet, her words for each one, whether she is
 * on it, which character, and each sheet's own design: its colours,
 * lettering and pattern. Those live here, in the tool, and change only that
 * sheet; a sheet with none of its own follows the studio's look.
 */
import { sheet, type Kind, type KindInfo, type Options } from '../sheets';
import type { PoseId } from '../character';
import {
  esc, field, heading, printButton, wirePrint, wireChoice, colourBar, wireColours,
  patternPicker, wirePatterns, posePicker, refresh, remembered, scoped, sheetDesign,
  type Design, type DesignTarget
} from '../ui';
import { showing, designOf } from '../prints';

export interface BenchState {
  kind: Kind;
  me: boolean;
  pose: PoseId | 'mix';
  words: Partial<Record<Kind, string>>;
  /** Each sheet's own colours, lettering and pattern, where it has any. */
  designs?: Partial<Record<Kind, Design>>;
}

export type Bench = ReturnType<typeof remembered<BenchState>>;

/** One sheet's design in a bench's state: what its strip changes, and what it is drawn with. */
export function designFor (state: Bench, kind: Kind): DesignTarget {
  return sheetDesign(
    () => state.get().designs?.[kind],
    (d) => state.set({ designs: { ...state.get().designs, [kind]: d } })
  );
}

/** What a bench keeps in My makes for one sheet (see prints.ts). */
export interface SheetSettings { kind: Kind; me: boolean; pose: PoseId | 'mix'; words: string }

/** Puts a bench back to a kept sheet: that sheet chosen, with its words and design. */
export function reopen (state: Bench, s: SheetSettings, design: Design): void {
  const now = state.get();
  state.set({
    kind: s.kind, me: s.me, pose: s.pose,
    words: { ...now.words, [s.kind]: s.words },
    designs: { ...now.designs, [s.kind]: design }
  });
}

/**
 * `names` gives each sheet the name to show here, when the page's own title
 * already says what kind of thing they are ("Cover" rather than "Diary cover").
 * `tool` is the name its prints are kept under in My makes.
 */
export function bench (main: HTMLElement, kinds: KindInfo[], state: Bench, tool: string, top = '', names: Partial<Record<Kind, string>> = {}): void {
  const s = state.get();
  const kind = kinds.find((k) => k.id === s.kind) ?? kinds[0];
  const design = designFor(state, kind.id);
  const l = design.get();
  const opts = (): Options => {
    const now = state.get();
    return { pattern: design.get().pattern, words: now.words[kind.id] ?? '', me: now.me, pose: now.pose };
  };

  // When there is a choice of sheet, it comes first, as a picture of each:
  // easier to tell apart than two names.
  const optionFor = (k: KindInfo, i: number): string => {
    const own = designFor(state, k.id).get();
    const o = { pattern: own.pattern, words: s.words[k.id] ?? '', me: s.me, pose: s.pose };
    return `<button type="button" class="sheet-option" role="radio" data-kind="${k.id}" aria-checked="${k.id === kind.id}">` +
      `<span class="sheet-mini">${scoped(sheet(k.id, o, own), `o${i}-`)}</span>` +
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
      ${patternPicker(design)}
      ${kind.words ? heading('Words') + field(kind.words, `<input class="words" maxlength="40" placeholder="${esc(kind.start(l))}" value="${esc(s.words[kind.id] ?? '')}">`) : ''}
    </section>
    <section class="preview">
      ${colourBar(design)}
      <div class="print-area">${sheet(kind.id, opts(), l)}</div>
      ${printButton()}
    </section>
  </div>`;

  wireChoice(main, 'kind', (k) => { state.set({ kind: k as Kind }); refresh(); });
  wireChoice(main, 'pose', (p) => { state.set({ pose: p as PoseId | 'mix' }); refresh(); });
  wirePatterns(main, design);
  wireColours(main, design);
  main.querySelector<HTMLInputElement>('.me')?.addEventListener('change', (e) => {
    // A redraw, not just the sheet: ticking it brings the character picker in.
    state.set({ me: (e.target as HTMLInputElement).checked });
    refresh();
  });
  const words = main.querySelector<HTMLInputElement>('.words');
  words?.addEventListener('input', () => {
    state.set({ words: { ...state.get().words, [kind.id]: words.value } });
    main.querySelector('.print-area')!.innerHTML = sheet(kind.id, opts(), design.get());
  });
  wirePrint(main);
  showing(() => {
    const now = state.get();
    const settings: SheetSettings = { kind: kind.id, me: now.me, pose: now.pose, words: now.words[kind.id] ?? '' };
    return { tool, settings: { ...settings }, design: designOf(design.get()), ...(tool === 'brand' ? { brand: { ...design.get().brand } } : {}) };
  });
}
