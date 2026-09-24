/**
 * Pieces every room uses: the colour strip, the pattern and pose pickers,
 * fields, the print button, and remembered choices.
 *
 * The strip above the preview in every tool holds the colours and the
 * lettering, so trying either is one tap from the thing being made rather
 * than a trip to Make it yours and back. A choice made there is hers
 * everywhere.
 */
import { look, setLook, SCHEMES, PALETTE, LETTERING, type Lettering, type Look } from './look';
import { PATTERNS, defs, type PatternName } from './patterns';
import { poses, faceImg, type PoseId } from './character';
import { ICONS } from './icons';

export const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

let redraw: () => void = () => {};

/** Main sets this: it redraws the current room without jumping to the top. */
export function onRefresh (fn: () => void): void { redraw = fn; }
export function refresh (): void { redraw(); }

/** Small remembered choices, so a sheet she was halfway through is still there tomorrow. */
export function remembered<T extends object> (key: string, start: T): { get: () => T; set: (c: Partial<T>) => void } {
  let value = start;
  try { value = { ...start, ...JSON.parse(localStorage.getItem(key) ?? '{}') }; } catch { /* start fresh */ }
  return {
    get: () => value,
    set: (c) => {
      value = { ...value, ...c };
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* keep it for this visit */ }
    }
  };
}

export function field (label: string, input: string): string {
  return `<label class="field"><span>${label}</span>${input}</label>`;
}

export function heading (text: string): string {
  return `<h2 class="step">${text}</h2>`;
}

export function printButton (label = 'Print it'): string {
  // Keep is wired in prints.ts, which knows what the tool is showing.
  return `<div class="print-buttons"><button type="button" class="go print">${ICONS.print}<span>${label}</span></button>` +
    `<button type="button" class="go go--ghost keep-it">${ICONS.star}<span>Keep in My makes</span></button></div>` +
    '<p class="print-status" role="status"></p>';
}

/**
 * Inside Sukhi Play there is no print dialog: the page goes straight to the
 * printer, and Sukhi Play says afterwards whether it did (the
 * "sukhiplay:print" event). So there, and only there, the studio says what is
 * happening, because otherwise a tap would look like it did nothing. In a
 * browser the print dialog is the answer and this stays quiet.
 */
export const inSukhiPlay = location.protocol === 'sukhiplay:';

let status: HTMLElement | null = null;

window.addEventListener('sukhiplay:print', (e) => {
  const r = (e as CustomEvent<{ ok: boolean; reason?: string }>).detail ?? { ok: false };
  if (!status) return;
  status.textContent = r.ok ? 'Printed. Go and get it from the printer!'
    : r.reason === 'too-soon' ? 'It is already on its way.'
      : 'The printer did not answer. Ask a grown-up to check it.';
  status.dataset.ok = r.ok || r.reason === 'too-soon' ? 'yes' : 'no';
});

export function wirePrint (root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('.print').forEach((b) => b.addEventListener('click', () => {
    if (inSukhiPlay) {
      status = b.closest('.print-buttons')?.nextElementSibling as HTMLElement | null;
      if (status) { status.textContent = 'Sending it to the printer...'; delete status.dataset.ok; }
    }
    readyToPrint();
    window.print();
  }));
}

/**
 * What is printed: a copy of the sheet, straight inside the body, with
 * everything else taken out of the printout (see the print styles).
 *
 * Printing the sheet where it sits on the screen went wrong on an iPad:
 * Safari printed it from wherever the page was scrolled to, and without the
 * zero margins asked for, so one A4 sheet came out as the bottom of one page
 * and the top of the next. On its own at the top of the page, and sized to
 * the page rather than to 210mm, it is one sheet whatever margins the printer
 * keeps. Its ids are renamed so the copy's patterns never point at the
 * screen's.
 *
 * The copy is kept up to date as the sheet changes, not made when Print is
 * pressed. Made then, its pictures were still loading when Safari was asked
 * to print; Safari waits for a page to finish loading before it prints, and
 * a print that starts after the tap is one it treats as the page printing by
 * itself, so it asked "Allow?" every time.
 */
function keepCopy (): void {
  const area = document.querySelector('.print-area');
  let copy = document.querySelector<HTMLElement>('body > .print-sheet');
  if (!area) { copy?.remove(); return; }
  if (!copy) {
    copy = document.createElement('div');
    copy.className = 'print-sheet';
    copy.setAttribute('aria-hidden', 'true');
    document.body.append(copy);
  }
  const html = area.innerHTML;
  if (copy.dataset.of === html) return;
  copy.dataset.of = html;
  copy.innerHTML = scoped(html, 'pr-');
}

/** Makes sure the copy is the sheet on the screen; nothing to do if it already is. */
export const readyToPrint = keepCopy;

let pending = 0;
new MutationObserver(() => {
  // Once a frame at most: typing on a sheet changes it at every key.
  if (pending) return;
  pending = requestAnimationFrame(() => { pending = 0; keepCopy(); });
}).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
window.addEventListener('beforeprint', keepCopy);

/*
 * An iPad lays a page out at the width of its screen and shrinks that to the
 * paper, so a millimetre there is not a millimetre, and its header and footer
 * take more of the page top and bottom than at the sides. Sized to the width
 * of the page, the sheet was a few millimetres too tall. There it is printed a
 * little narrower, which keeps it on one page in either orientation.
 */
if (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
  document.documentElement.classList.add('ipad-print');
}

/** Buttons that behave as one choice, as radio buttons do. */
export function wireChoice (root: HTMLElement, attr: string, pick: (value: string) => void): void {
  root.querySelectorAll<HTMLButtonElement>(`[data-${attr}]`).forEach((b) =>
    b.addEventListener('click', () => pick(b.dataset[attr.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())]!)));
}

/**
 * Prefixes every id in an SVG, and every reference to one. Each sheet names
 * its patterns p1 and p2; several on one page would all use whichever
 * came first.
 */
export function scoped (svg: string, prefix: string): string {
  return svg
    .replace(/id="([^"]+)"/g, `id="${prefix}$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${prefix}$1"`);
}

/* Designs ---------------------------------------------------------------- */

/**
 * What a colour strip or pattern picker changes. The studio's own look, in
 * Make it yours, or one sheet's design, in a tool. A tool changing its sheet
 * must never change the studio: the screens, and every other sheet, stay as
 * they were.
 */
export interface DesignTarget {
  /** The look to show and draw with: the studio's, with this sheet's changes over it. */
  get: () => Look;
  set: (change: Design) => void;
  /** For a sheet: back to the studio's look. Absent for the studio itself. */
  clear?: () => void;
  /** For a sheet: whether it has any changes of its own. */
  custom?: () => boolean;
}

/** The parts of a look that a sheet can have of its own. */
export type Design = Partial<Pick<Look, 'paper' | 'ink' | 'accent' | 'accent2' | 'scheme' | 'lettering' | 'pattern'>>;

export const studio: DesignTarget = { get: look, set: (c) => setLook(c) };

/** A sheet's design, kept in `read`/`write`, over the studio's look. */
export function sheetDesign (read: () => Design | undefined, write: (d: Design | undefined) => void): DesignTarget {
  return {
    get: () => ({ ...look(), ...(read() ?? {}) }),
    set: (c) => write({ ...(read() ?? {}), ...c }),
    clear: () => write(undefined),
    custom: () => Object.keys(read() ?? {}).length > 0
  };
}

/* Colours ---------------------------------------------------------------- */

/** The lettering row of the strip: each style, written in their name. */
function lettersRow (l: Look): string {
  return `<div class="cb-row"><span class="cb-label">Letters</span><div class="cb-scroll">${(Object.keys(LETTERING) as Lettering[]).map((k) =>
    `<button type="button" class="letters" data-lettering="${k}" aria-pressed="${k === l.lettering}" title="${LETTERING[k].label}" ` +
    `style="font-family:${LETTERING[k].stack.replace(/"/g, "'")};font-weight:${LETTERING[k].weight}">${esc(l.name.slice(0, 8) || 'Aa')}</button>`).join('')}</div></div>`;
}

/**
 * The strip of colours and lettering. `sets` false leaves out the row of
 * colour sets, and `letters` false the lettering row, for a page that shows
 * them bigger already. Over a sheet it says it is for that sheet, and offers
 * the way back to the studio's look once the sheet has changes of its own.
 */
export function colourBar (target: DesignTarget, sets = true, letters = true): string {
  const l = target.get();
  const swatches = (key: 'accent' | 'accent2'): string =>
    PALETTE.map((c) => `<button type="button" class="swatch" data-${key}="${c}" style="--c:${c}" aria-label="${c}" aria-pressed="${l[key].toUpperCase() === c}"></button>`).join('') +
    `<label class="swatch swatch--own" title="Any colour"><input type="color" data-own="${key}" value="${l[key]}"><span aria-hidden="true">+</span></label>`;
  const head = target.clear
    ? `<div class="cb-head"><span>For this sheet only</span>${target.custom?.() ? '<button type="button" class="cb-studio">Use my studio colours</button>' : ''}</div>`
    : '';
  return `<section class="colourbar" aria-label="Colours">${head}
    ${sets ? `<div class="cb-row"><span class="cb-label">Colours</span><div class="cb-scroll">${SCHEMES.map((s) =>
      `<button type="button" class="set" data-scheme="${s.id}" aria-pressed="${s.id === l.scheme}" title="${s.label}" style="--p:${s.paper}">` +
      `<i style="background:${s.accent}"></i><i style="background:${s.accent2}"></i><span>${s.label}</span></button>`).join('')}</div></div>` : ''}
    <div class="cb-row"><span class="cb-label">Main</span><div class="cb-scroll">${swatches('accent')}</div></div>
    <div class="cb-row"><span class="cb-label">Second</span><div class="cb-scroll">${swatches('accent2')}</div></div>
    ${letters ? lettersRow(l) : ''}
  </section>`;
}

export function wireColours (root: HTMLElement, target: DesignTarget): void {
  const set = (c: Design): void => { target.set(c); refresh(); };
  root.querySelectorAll<HTMLButtonElement>('.colourbar [data-scheme]').forEach((b) =>
    b.addEventListener('click', () => {
      const s = SCHEMES.find((x) => x.id === b.dataset.scheme);
      if (s) set({ paper: s.paper, ink: s.ink, accent: s.accent, accent2: s.accent2, scheme: s.id });
    }));
  root.querySelectorAll<HTMLButtonElement>('.colourbar [data-accent]').forEach((b) =>
    b.addEventListener('click', () => set({ accent: b.dataset.accent!, scheme: 'own' })));
  root.querySelectorAll<HTMLButtonElement>('.colourbar [data-accent2]').forEach((b) =>
    b.addEventListener('click', () => set({ accent2: b.dataset.accent2!, scheme: 'own' })));
  root.querySelectorAll<HTMLButtonElement>('.colourbar [data-lettering]').forEach((b) =>
    b.addEventListener('click', () => set({ lettering: b.dataset.lettering as Lettering })));
  root.querySelectorAll<HTMLInputElement>('.colourbar [data-own]').forEach((input) => {
    input.addEventListener('change', () => set({ [input.dataset.own!]: input.value, scheme: 'own' }));
  });
  root.querySelector('.colourbar .cb-studio')?.addEventListener('click', () => { target.clear?.(); refresh(); });
  // Keep the chosen colour set in view, rather than scrolled off to the side.
  root.querySelectorAll<HTMLElement>('.colourbar [aria-pressed="true"]').forEach((el) =>
    el.scrollIntoView({ block: 'nearest', inline: 'center' }));
}

/* Patterns --------------------------------------------------------------- */

/**
 * The patterns as large squares, each showing enough of the pattern to judge
 * it, with its name under it. The chosen one has a ring and a tick.
 */
export function patternPicker (target: DesignTarget): string {
  const l = target.get();
  return `<div class="pats" role="radiogroup" aria-label="Pattern">${PATTERNS.map((p) =>
    `<button type="button" class="pat" role="radio" data-pattern="${p.id}" aria-checked="${p.id === l.pattern}">` +
    `<svg viewBox="0 0 60 60" aria-hidden="true"><defs>${defs(`sw-${p.id}`, p.id, l, 1.3)}</defs>` +
    `<rect width="60" height="60" rx="12" fill="url(#sw-${p.id})"/></svg>` +
    `<span class="pat-tick" aria-hidden="true">${ICONS.tick}</span><span class="pat-name">${p.label}</span></button>`).join('')}</div>`;
}

export function wirePatterns (root: HTMLElement, target: DesignTarget): void {
  wireChoice(root, 'pattern', (p) => { target.set({ pattern: p as PatternName }); refresh(); });
}

/* Poses ------------------------------------------------------------------ */

export function posePicker (current: PoseId | 'mix', mix: boolean, attr = 'pose'): string {
  const list = poses();
  return `<div class="poses" role="radiogroup" aria-label="Which you">${list.map((p) =>
    `<button type="button" class="pose" role="radio" data-${attr}="${p.id}" aria-checked="${p.id === current}" title="${p.label}">` +
    `${faceImg(p.id, 'pose-img')}<span>${esc(p.label)}</span></button>`).join('')}${mix && list.length > 1
    ? `<button type="button" class="pose pose--mix" role="radio" data-${attr}="mix" aria-checked="${current === 'mix'}">` +
      `<span class="mix-stack">${list.slice(0, 3).map((p) => faceImg(p.id, 'mix-face')).join('')}</span><span>All of me</span></button>`
    : ''}</div>`;
}

/* Asking first ------------------------------------------------------------ */

/**
 * A proper question before anything is removed: what it is, what will change,
 * and two plain buttons. Resolves true only for the one that removes. Escape,
 * a click outside and Cancel all mean no.
 */
export function confirmBox (o: { title: string; body: string; art?: string; yes: string; no?: string }): Promise<boolean> {
  return new Promise((resolve) => {
    document.querySelector('dialog.ask')?.remove();
    const d = document.createElement('dialog');
    d.className = 'ask';
    d.setAttribute('aria-labelledby', 'ask-title');
    d.innerHTML = `${o.art ? `<div class="ask-art">${o.art}</div>` : ''}
      <h2 id="ask-title">${o.title}</h2>
      <div class="ask-body">${o.body}</div>
      <div class="ask-buttons">
        <button type="button" class="go go--ghost ask-no">${o.no ?? 'Cancel'}</button>
        <button type="button" class="go go--danger ask-yes">${o.yes}</button>
      </div>`;
    document.body.append(d);
    let answered = false;
    const done = (yes: boolean): void => {
      if (answered) return;
      answered = true;
      d.close();
      d.remove();
      resolve(yes);
    };
    d.querySelector('.ask-no')!.addEventListener('click', () => done(false));
    d.querySelector('.ask-yes')!.addEventListener('click', () => done(true));
    d.addEventListener('cancel', () => done(false));
    d.addEventListener('click', (e) => { if (e.target === d) done(false); });
    d.showModal();
    // Cancel has the focus, so an accidental Enter keeps things.
    d.querySelector<HTMLButtonElement>('.ask-no')!.focus();
  });
}
