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
import { sheet, firstOf, fieldContext, type Kind, type KindInfo, type Options, type Who } from '../sheets';
import { poses, pose as poseOf, personOf, nameFor, faceImg, brandFor, brandKeyFor } from '../character';
import { look } from '../look';
import type { PoseId } from '../character';
import {
  esc, field, heading, printButton, wirePrint, wireChoice, colourBar, wireColours,
  patternPicker, wirePatterns, posePicker, whoPicker, toggleWho, refresh, remembered, scoped, sheetDesign,
  type Design, type DesignTarget
} from '../ui';
import { showing, designOf } from '../prints';

export interface BenchState {
  kind: Kind;
  me: boolean;
  pose: Who;
  words: Partial<Record<Kind, string>>;
  /** Each sheet's own colours, lettering and pattern, where it has any. */
  designs?: Partial<Record<Kind, Design>>;
  /** Each sheet's words for each person on it, by person, where she changed them. */
  names?: Partial<Record<Kind, Record<string, string>>>;
  /** Each sheet's other words (KindInfo.fields), where she changed them. */
  extra?: Partial<Record<Kind, Record<string, string>>>;
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
export interface SheetSettings { kind: Kind; me: boolean; pose: Who; words: string; names?: Record<string, string>; extra?: Record<string, string> }

/** Puts a bench back to a kept sheet: that sheet chosen, with its words and design. */
export function reopen (state: Bench, s: SheetSettings, design: Design): void {
  const now = state.get();
  state.set({
    kind: s.kind, me: s.me, pose: s.pose,
    words: { ...now.words, [s.kind]: s.words },
    designs: { ...now.designs, [s.kind]: design },
    names: { ...now.names, [s.kind]: s.names ?? {} },
    extra: { ...now.extra, [s.kind]: s.extra ?? {} }
  });
}

/**
 * `names` gives each sheet the name to show here, when the page's own title
 * already says what kind of thing they are ("Cover" rather than "Diary cover").
 * `tool` is the name its prints are kept under in My makes.
 */
export function bench (main: HTMLElement, kinds: KindInfo[], state: Bench, tool: string, top = '', names: Partial<Record<Kind, string>> = {}, brandKey?: string): void {
  const s = state.get();
  const kind = kinds.find((k) => k.id === s.kind) ?? kinds[0];
  const design = designFor(state, kind.id);
  const l = design.get();
  const optsFor = (k: Kind, now: BenchState, pattern: Options['pattern']): Options => ({
    pattern, words: now.words[k] ?? '', me: now.me, pose: now.pose,
    names: now.names?.[k], extra: now.extra?.[k], brandKey
  });
  const opts = (): Options => optsFor(kind.id, state.get(), design.get().pattern);
  const withPeople = kind.pose || (kind.me && s.me);

  // When there is a choice of sheet, it comes first, as a picture of each:
  // easier to tell apart than two names.
  const optionFor = (k: KindInfo, i: number): string => {
    const own = designFor(state, k.id).get();
    const o = optsFor(k.id, s, own.pattern);
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
      ${kind.pose || (kind.me && s.me)
        ? kind.many
          ? heading('Who is on it') + whoPicker(s.pose)
          : heading('Which you') + posePicker(firstOf(s.pose, l), false)
        : ''}
      ${kind.named && withPeople ? namesList(kind, s) : ''}
      ${heading('Pattern')}
      ${patternPicker(design)}
      ${kind.words && !(kind.alone && withPeople) ? heading('Words') + field(kind.words, `<input class="words" maxlength="40" placeholder="${esc(kind.start(l))}" value="${esc(s.words[kind.id] ?? '')}">`) : ''}
      ${kind.fields ? kind.fields.filter((f) => !(f.alone && withPeople)).map((f) => {
        const v = s.extra?.[kind.id]?.[f.key] ?? f.start(l, fieldContext(kind.id, opts(), l));
        if (f.tick) return `<label class="tick"><input type="checkbox" data-extra="${f.key}" ${v === '1' ? 'checked' : ''}><span>${esc(f.label)}</span></label>`;
        if (f.options) {
          return heading(f.label) + `<div class="chips" role="radiogroup" aria-label="${esc(f.label)}">${f.options.map((opt) =>
            `<button type="button" class="chip" role="radio" data-extra-opt="${f.key}" data-val="${opt}" aria-checked="${opt === v}">${opt}</button>`).join('')}</div>`;
        }
        return field(f.label, `<input data-extra="${f.key}" maxlength="40" value="${esc(v)}">`);
      }).join('') : ''}
      ${kind.id === 'cover' || kind.id === 'diary' ? brandNote(kind.id, s.me || kind.pose ? firstOf(s.pose, l) : l.pose) : ''}
    </section>
    <section class="preview">
      ${colourBar(design)}
      <div class="print-area">${sheet(kind.id, opts(), l)}</div>
      ${printButton()}
    </section>
  </div>`;

  wireChoice(main, 'kind', (k) => { state.set({ kind: k as Kind }); refresh(); });
  wireChoice(main, 'pose', (p) => { state.set({ pose: p as PoseId }); refresh(); });
  wireChoice(main, 'who', (id) => { state.set({ pose: toggleWho(state.get().pose, id) }); refresh(); });
  wirePatterns(main, design);
  wireColours(main, design);
  main.querySelector<HTMLInputElement>('.me')?.addEventListener('change', (e) => {
    // A redraw, not just the sheet: ticking it brings the character picker in.
    state.set({ me: (e.target as HTMLInputElement).checked });
    refresh();
  });
  const redraw = (): void => { main.querySelector('.print-area')!.innerHTML = sheet(kind.id, opts(), design.get()); };
  const words = main.querySelector<HTMLInputElement>('.words');
  words?.addEventListener('input', () => {
    state.set({ words: { ...state.get().words, [kind.id]: words.value } });
    redraw();
  });
  // Each person's words, and the sheet's other words: redrawn as she types.
  main.querySelectorAll<HTMLInputElement>('[data-name-of]').forEach((input) => input.addEventListener('input', () => {
    const now = state.get();
    state.set({ names: { ...now.names, [kind.id]: { ...now.names?.[kind.id], [input.dataset.nameOf!]: input.value } } });
    redraw();
  }));
  main.querySelectorAll<HTMLInputElement>('[data-extra]').forEach((input) => input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', () => {
    const now = state.get();
    const value = input.type === 'checkbox' ? (input.checked ? '1' : '0') : input.value;
    state.set({ extra: { ...now.extra, [kind.id]: { ...now.extra?.[kind.id], [input.dataset.extra!]: value } } });
    // A tick can bring words in or take them away, so the whole page.
    if (input.type === 'checkbox') refresh(); else redraw();
  }));
  main.querySelectorAll<HTMLButtonElement>('[data-extra-opt]').forEach((b) => b.addEventListener('click', () => {
    const now = state.get();
    state.set({ extra: { ...now.extra, [kind.id]: { ...now.extra?.[kind.id], [b.dataset.extraOpt!]: b.dataset.val! } } });
    refresh();
  }));
  wirePrint(main);
  showing(() => {
    const now = state.get();
    const settings: SheetSettings = { kind: kind.id, me: now.me, pose: now.pose, words: now.words[kind.id] ?? '', names: now.names?.[kind.id], extra: now.extra?.[kind.id] };
    return { tool, settings: { ...settings, ...(brandKey ? { who: brandKey } : {}) }, design: designOf(design.get()), ...(brandKey ? { brand: { ...brandFor(brandKey) } } : {}) };
  });
}

/**
 * Everyone ticked on a sheet, a row each, with what goes on theirs: their
 * name to start with, changed here for this sheet only. By person rather than
 * by picture, so three pictures of Jazz are still one Jazz to rename. For the
 * Me stickers, a tick first, since names under them are optional.
 */
function namesList (kind: KindInfo, s: BenchState): string {
  const named = kind.named!;
  const l = look();
  const on = kind.named?.optional ? s.extra?.[kind.id]?.names === '1' : true;
  const ids = s.pose === 'mix' ? poses().map((p) => p.id) : Array.isArray(s.pose) ? s.pose : [s.pose];
  const people: Array<{ key: string; ids: string[]; name: string }> = [];
  for (const id of ids) {
    const key = personOf(poseOf(id));
    const p = people.find((x) => x.key === key);
    if (p) p.ids.push(id);
    else people.push({ key, ids: [id], name: nameFor(id, l) });
  }
  const rows = people.map((p) => {
    const mine = p.key === 'me' || (!!l.name.trim() && p.name === l.name.trim());
    const value = s.names?.[kind.id]?.[p.key] ?? named.start(p.name, mine);
    return `<label class="name-row"><span class="name-faces">${p.ids.slice(0, 3).map((id) => faceImg(id, 'name-face')).join('')}</span>` +
      `<input data-name-of="${p.key}" maxlength="30" value="${esc(value)}" placeholder="${esc(kind.id === 'tags' ? 'Leave empty to write it in' : p.name || 'Name')}" aria-label="${esc(named.label)}: ${esc(p.name || 'you')}"></label>`;
  }).join('');
  return heading(named.label) +
    (named.optional ? `<label class="tick"><input type="checkbox" data-extra="names" ${on ? 'checked' : ''}><span>${esc(named.optional)}</span></label>` : '') +
    (on ? `<div class="name-rows">${rows}</div>` : '');
}

/**
 * Where a diary's brand comes from, in words a child reads once and gets:
 * what on the page is the brand, whose it is, and a button to change it.
 */
function brandNote (kind: Kind, id: string): string {
  const key = brandKeyFor(id);
  const b = brandFor(key);
  const who = nameFor(id, look());
  const whose = who ? `${who}'s` : 'your';
  const what = kind === 'cover' ? 'The badge on this cover' : 'The name at the bottom of this page';
  return `<div class="brand-note">${faceImg(id, 'brand-note-face')}<div><p>${what} is ${esc(whose)} brand: <b>${esc(b.name)}</b>.</p>` +
    `<a class="chip brand-note-go" href="#/brand/${encodeURIComponent(key)}">Change ${esc(whose)} brand</a></div></div>`;
}
