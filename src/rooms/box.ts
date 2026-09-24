/**
 * Make from a box: pick a thing to make, measure it, make the wrap look like
 * hers, print it and follow the steps.
 *
 * The first version was parked because Jazz found it unclear, so this one is
 * laid out as four numbered steps, and every project shows a drawing of
 * exactly what to measure with her own numbers on it.
 */
import { look } from '../look';
import { PROJECTS } from '../projects';
import { wrapSheet, wrapFits, measureDiagram, fmt } from '../wrap';
import {
  esc, field, printButton, wirePrint, wireChoice, colourBar, wireColours,
  patternPicker, wirePatterns, refresh, remembered
} from '../ui';

const state = remembered<{ project: string; width: number; height: number; tab: boolean; words: string; me: boolean }>(
  'jazz-studio-box', { project: 'pencil-pot', width: 15.5, height: 10, tab: true, words: '', me: true });

/** Small drawings for the project cards. */
const ART: Record<string, string> = {
  'pencil-pot': '<ellipse cx="30" cy="12" rx="14" ry="4"/><path d="M16 12v30a14 4 0 0 0 28 0V12"/><path d="M24 12 21 2M31 12l2-10M37 12l4-8"/>',
  'desk-tidy': '<path d="M8 18h44v28H8z"/><path d="M8 18l6-6h44l-6 6M52 18l6-6v28l-6 6"/><path d="M22 18v28M36 18v28"/>',
  notebook: '<path d="M14 6h32v42H14z"/><path d="M20 6v42"/><path d="M26 16h14M26 22h14M26 28h10"/>',
  'treasure-box': '<path d="M8 22h44v24H8z"/><path d="M8 22c0-10 44-10 44 0"/><path d="M26 28h8v8h-8z"/>',
  own: '<path d="M30 6l6.5 13.5L51 21l-10.5 10 2.5 14.5L30 38.5 17 45.5l2.5-14.5L9 21l14.5-1.5z"/>'
};

export function boxRoom (main: HTMLElement): void {
  const s = state.get();
  const l = look();
  const project = PROJECTS.find((p) => p.id === s.project) ?? PROJECTS[0];
  const wrap = { width: s.width, height: s.height, tab: s.tab, title: project.title };
  const across = project.shape === 'tube' ? 'Way round' : 'Across';

  main.innerHTML = `<section class="box-step">
    <h2 class="box-title"><b>1</b>What are you making?</h2>
    <div class="ideas" role="radiogroup" aria-label="What to make">${PROJECTS.map((p) =>
      `<button type="button" class="idea" role="radio" data-project="${p.id}" aria-checked="${p.id === project.id}">` +
      `<svg viewBox="0 0 60 50" class="idea-art" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">${ART[p.id] ?? ''}</svg>` +
      `<span class="idea-title">${p.title}</span><span class="idea-find">You need: ${p.find.charAt(0).toLowerCase()}${p.find.slice(1)}</span></button>`).join('')}</div>
  </section>
  <div class="workbench">
    <section class="controls">
      <h2 class="box-title"><b>2</b>Measure it</h2>
      <div class="measure">${measureDiagram(project.shape, s.width, s.height, l)}</div>
      <p class="hint">${project.measure}</p>
      <div class="sizes">
        ${field(`${across} (cm)`, `<input type="number" class="w" min="1" max="60" step="0.5" value="${fmt(s.width)}" inputmode="decimal">`)}
        ${field('Height (cm)', `<input type="number" class="h" min="1" max="60" step="0.5" value="${fmt(s.height)}" inputmode="decimal">`)}
      </div>
      <label class="tick"><input type="checkbox" class="tab" ${s.tab ? 'checked' : ''}><span>Add a strip for the glue</span></label>
      <p class="fit" role="status"></p>

      <h2 class="box-title"><b>3</b>Make it yours</h2>
      ${patternPicker()}
      ${field('Words on it (or leave empty)', `<input class="words" maxlength="24" placeholder="Pens" value="${esc(s.words)}">`)}
      <label class="tick"><input type="checkbox" class="me" ${s.me ? 'checked' : ''}><span>Put me on it</span></label>

      <h2 class="box-title"><b>4</b>Print it and make it</h2>
      <p class="hint">Print at actual size, so it fits. Then:</p>
      <ol class="steps">${project.steps.map((st) => `<li>${st}</li>`).join('')}</ol>
      ${printButton()}
    </section>
    <section class="preview">${colourBar()}<div class="print-area">${wrapSheet(wrap, l.pattern, s.words, s.me, l)}</div></section>
  </div>`;

  const redraw = (): void => {
    const now = state.get();
    const w = { width: now.width, height: now.height, tab: now.tab, title: project.title };
    main.querySelector('.print-area')!.innerHTML = wrapSheet(w, look().pattern, now.words, now.me, look());
    main.querySelector('.measure')!.innerHTML = measureDiagram(project.shape, now.width, now.height, look());
    const fits = wrapFits(w);
    main.querySelector('.fit')!.textContent = fits === 'sideways' ? 'Turned sideways so it fits on the paper.'
      : fits ? '' : 'That is bigger than a sheet of paper. Try one side at a time.';
  };

  wireChoice(main, 'project', (id) => {
    const p = PROJECTS.find((x) => x.id === id)!;
    state.set({ project: p.id, width: p.width, height: p.height, tab: p.tab });
    refresh();
  });
  const num = (sel: string, key: 'width' | 'height'): void => {
    const input = main.querySelector<HTMLInputElement>(sel)!;
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      if (v > 0 && v <= 60) { state.set({ [key]: v }); redraw(); }
    });
  };
  num('.w', 'width');
  num('.h', 'height');
  main.querySelector<HTMLInputElement>('.tab')!.addEventListener('change', (e) => { state.set({ tab: (e.target as HTMLInputElement).checked }); redraw(); });
  main.querySelector<HTMLInputElement>('.me')!.addEventListener('change', (e) => { state.set({ me: (e.target as HTMLInputElement).checked }); redraw(); });
  const words = main.querySelector<HTMLInputElement>('.words')!;
  words.addEventListener('input', () => { state.set({ words: words.value }); redraw(); });
  wirePatterns(main);
  wireColours(main);
  wirePrint(main);
  redraw();
}
