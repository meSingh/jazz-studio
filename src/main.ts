/**
 * Jazz's Studio.
 *
 * Four rooms: stationery to print, things to make from boxes, a shelf of
 * photos of what she made, and the room where she decides how it all looks.
 * A hash router moves between them, so the back button and a bookmark both
 * work, and so it runs from a file or a private scheme as happily as from a
 * server.
 */
import './style.css';
import { apply, look, setLook, useScheme, SCHEMES, LETTERING, type Lettering } from './look';
import { PATTERNS, defs, type PatternName } from './patterns';
import { KINDS, sheet, wrapSheet, wrapFits, fmt, type Kind } from './sheets';
import { PROJECTS } from './projects';
import { all, save, remove, shrink, type Make } from './makes';
import { buddy } from './character';
import { ICONS } from './icons';

const app = document.getElementById('app')!;

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/** Small remembered choices, so a sheet she was halfway through is still there tomorrow. */
function remembered<T extends object> (key: string, start: T): { get: () => T; set: (c: Partial<T>) => void } {
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

const paper = remembered<{ kind: Kind; pattern: PatternName; words: string }>('jazz-studio-paper',
  { kind: 'stickers', pattern: 'dots', words: '' });
const making = remembered<{ project: string; width: number; height: number; tab: boolean; pattern: PatternName; words: string }>(
  'jazz-studio-making', { project: 'pencil-pot', width: 15.5, height: 10, tab: true, pattern: 'stripes', words: '' });
const notes = remembered<{ wishes: string }>('jazz-studio-wishes', { wishes: '' });

type Room = 'home' | 'stationery' | 'make' | 'makes' | 'yours';

const ROOMS: Record<Exclude<Room, 'home'>, { title: string; icon: string }> = {
  stationery: { title: 'Stationery', icon: ICONS.sticker },
  make: { title: 'Make from a box', icon: ICONS.box },
  makes: { title: 'My makes', icon: ICONS.camera },
  yours: { title: 'Make it yours', icon: ICONS.palette }
};

function room (): Room {
  const r = location.hash.replace(/^#\/?/, '');
  return r in ROOMS ? r as Room : 'home';
}

function render (): void {
  const r = room();
  document.title = r === 'home' ? `${look().name}'s Studio` : `${ROOMS[r].title} · ${look().name}'s Studio`;
  app.dataset.room = r;
  app.innerHTML = top(r) + '<main class="room"></main>';
  const main = app.querySelector('main')!;
  if (r === 'home') home(main);
  else if (r === 'stationery') stationery(main);
  else if (r === 'make') make(main);
  else if (r === 'makes') void makes(main);
  else yours(main);
  window.scrollTo(0, 0);
}

function top (r: Room): string {
  const name = esc(look().name);
  if (r === 'home') return `<header class="top"><span class="brand">${name}'s Studio</span></header>`;
  return `<header class="top"><a class="home-btn" href="#/">${ICONS.back}<span>Home</span></a>` +
    `<h1 class="room-title">${ROOMS[r].icon}<span>${ROOMS[r].title}</span></h1></header>`;
}

/* Home ------------------------------------------------------------------ */

function home (main: HTMLElement): void {
  const l = look();
  const tile = (r: Exclude<Room, 'home'>, blurb: string, pattern: PatternName, tilt: number): string =>
    `<a class="tile" href="#/${r}" style="--tilt:${tilt}deg">` +
    `<span class="tape"></span>` +
    `<svg class="tile-art" viewBox="0 0 100 40" preserveAspectRatio="xMidYMid slice" aria-hidden="true">` +
    `<defs>${defs(`t-${r}`, pattern, l, 0.9)}</defs><rect width="100" height="40" fill="url(#t-${r})"/></svg>` +
    `<span class="tile-icon">${ROOMS[r].icon}</span>` +
    `<span class="tile-title">${ROOMS[r].title}</span><span class="tile-blurb">${blurb}</span></a>`;
  main.innerHTML = `<section class="hello">
      <div class="buddy">${buddy(l)}</div>
      <div><h2>Hi ${esc(l.name)}</h2><p>What shall we make today?</p></div>
    </section>
    <section class="tiles">
      ${tile('stationery', 'Stickers, bookmarks, labels and diary pages to print', 'dots', -1.5)}
      ${tile('make', 'Wraps and ideas for rolls, cartons and boxes', 'stripes', 1)}
      ${tile('makes', 'Photos of everything you have made', 'confetti', -0.5)}
      ${tile('yours', 'Your colours, your name, your lettering', 'hearts', 1.5)}
    </section>`;
}

/* Shared bits ------------------------------------------------------------ */

function patternPicker (current: PatternName, pick: (p: PatternName) => void): HTMLElement {
  const l = look();
  const box = document.createElement('div');
  box.className = 'chips';
  box.setAttribute('role', 'radiogroup');
  box.setAttribute('aria-label', 'Pattern');
  for (const p of PATTERNS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip chip--pattern';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(p.id === current));
    b.innerHTML = `<svg viewBox="0 0 30 30" aria-hidden="true"><defs>${defs(`sw-${p.id}`, p.id, l, 0.9)}</defs>` +
      `<rect width="30" height="30" rx="8" fill="url(#sw-${p.id})"/></svg><span>${p.label}</span>`;
    b.addEventListener('click', () => pick(p.id));
    box.append(b);
  }
  return box;
}

function field (label: string, input: string): string {
  return `<label class="field"><span>${label}</span>${input}</label>`;
}

function printButton (): string {
  return `<button type="button" class="go print">${ICONS.print}<span>Print it</span></button>`;
}

function wirePrint (main: HTMLElement): void {
  main.querySelectorAll('.print').forEach((b) => b.addEventListener('click', () => window.print()));
}

/* Stationery ------------------------------------------------------------ */

function stationery (main: HTMLElement): void {
  const s = paper.get();
  const kind = KINDS.find((k) => k.id === s.kind) ?? KINDS[0];
  main.innerHTML = `<div class="workbench">
    <section class="controls">
      <h2 class="step">What to make</h2>
      <div class="chips kinds" role="radiogroup" aria-label="What to make">${KINDS.map((k) =>
        `<button type="button" class="chip" role="radio" data-kind="${k.id}" aria-checked="${k.id === s.kind}">${k.label}</button>`).join('')}</div>
      <p class="hint">${kind.blurb}</p>
      <h2 class="step">Pattern</h2>
      <div class="patterns"></div>
      <h2 class="step">Words</h2>
      ${field('What should it say?', `<input class="words" maxlength="24" placeholder="${esc(look().name)}" value="${esc(s.words)}">`)}
      ${printButton()}
    </section>
    <section class="preview"><div class="print-area">${sheet(s.kind, s.pattern, s.words, look())}</div></section>
  </div>`;
  main.querySelector('.patterns')!.append(patternPicker(s.pattern, (p) => { paper.set({ pattern: p }); stationery(main); }));
  main.querySelectorAll<HTMLButtonElement>('[data-kind]').forEach((b) =>
    b.addEventListener('click', () => { paper.set({ kind: b.dataset.kind as Kind }); stationery(main); }));
  const words = main.querySelector<HTMLInputElement>('.words')!;
  words.addEventListener('input', () => {
    paper.set({ words: words.value });
    main.querySelector('.print-area')!.innerHTML = sheet(paper.get().kind, paper.get().pattern, words.value, look());
  });
  wirePrint(main);
}

/* Make from a box ------------------------------------------------------- */

function make (main: HTMLElement): void {
  const m = making.get();
  const project = PROJECTS.find((p) => p.id === m.project) ?? PROJECTS[0];
  const wrap = { width: m.width, height: m.height, tab: m.tab, title: project.title };
  main.innerHTML = `<div class="ideas" role="radiogroup" aria-label="What to make">${PROJECTS.map((p, i) =>
    `<button type="button" class="idea" role="radio" data-project="${p.id}" aria-checked="${p.id === project.id}" style="--tilt:${[-1, 1, -0.5, 0.8, -1.2][i % 5]}deg">` +
    `<span class="idea-title">${p.title}</span><span class="idea-find">${p.find}</span></button>`).join('')}</div>
  <div class="workbench">
    <section class="controls">
      <h2 class="step">Measure it</h2>
      <p class="hint">${project.measure}</p>
      <div class="sizes">
        ${field(`${project.across ?? 'Across'} (cm)`, `<input type="number" class="w" min="1" max="60" step="0.5" value="${fmt(m.width)}" inputmode="decimal">`)}
        ${field('Height (cm)', `<input type="number" class="h" min="1" max="60" step="0.5" value="${fmt(m.height)}" inputmode="decimal">`)}
      </div>
      <label class="tick"><input type="checkbox" class="tab" ${m.tab ? 'checked' : ''}><span>Add a tab for gluing</span></label>
      <p class="fit" role="status"></p>
      <h2 class="step">Pattern</h2>
      <div class="patterns"></div>
      <h2 class="step">Words</h2>
      ${field('Anything to write on it?', `<input class="words" maxlength="24" placeholder="Leave empty for none" value="${esc(m.words)}">`)}
      ${printButton()}
      <h2 class="step">How to make it</h2>
      <ol class="steps">${project.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
    </section>
    <section class="preview"><div class="print-area">${wrapSheet(wrap, m.pattern, m.words, look())}</div></section>
  </div>`;

  const redraw = (): void => {
    const now = making.get();
    const w = { width: now.width, height: now.height, tab: now.tab, title: project.title };
    main.querySelector('.print-area')!.innerHTML = wrapSheet(w, now.pattern, now.words, look());
    const fits = wrapFits(w);
    const fit = main.querySelector('.fit')!;
    fit.textContent = fits === 'sideways' ? 'Turned sideways so it fits on the paper.'
      : fits ? '' : 'That is bigger than a sheet of paper. Try one side at a time.';
  };
  main.querySelector('.patterns')!.append(patternPicker(m.pattern, (p) => { making.set({ pattern: p }); make(main); }));
  main.querySelectorAll<HTMLButtonElement>('[data-project]').forEach((b) => b.addEventListener('click', () => {
    const p = PROJECTS.find((x) => x.id === b.dataset.project)!;
    making.set({ project: p.id, width: p.width, height: p.height, tab: p.tab });
    make(main);
  }));
  const num = (sel: string, key: 'width' | 'height'): void => {
    const input = main.querySelector<HTMLInputElement>(sel)!;
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      if (v > 0 && v <= 60) { making.set({ [key]: v }); redraw(); }
    });
  };
  num('.w', 'width');
  num('.h', 'height');
  main.querySelector<HTMLInputElement>('.tab')!.addEventListener('change', (e) => {
    making.set({ tab: (e.target as HTMLInputElement).checked });
    redraw();
  });
  const words = main.querySelector<HTMLInputElement>('.words')!;
  words.addEventListener('input', () => { making.set({ words: words.value }); redraw(); });
  wirePrint(main);
  redraw();
}

/* My makes -------------------------------------------------------------- */

const urls: string[] = [];

async function makes (main: HTMLElement): Promise<void> {
  urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
  main.innerHTML = `<form class="add">
      <label class="photo-drop">
        <input type="file" accept="image/*" capture="environment" class="photo">
        <span class="photo-look">${ICONS.camera}<span>Add a photo</span></span>
        <img class="photo-preview" alt="" hidden>
      </label>
      <div class="add-words">
        ${field('What did you make?', '<input class="title" maxlength="60" required placeholder="My pencil pot">')}
        ${field('Anything to remember about it?', '<textarea class="note" rows="3" maxlength="500" placeholder="What it is made from, who it is for..."></textarea>')}
        <button class="go" type="submit">${ICONS.plus}<span>Keep it</span></button>
      </div>
    </form>
    <section class="shelf" aria-live="polite"></section>`;

  let photo: Blob | null = null;
  const input = main.querySelector<HTMLInputElement>('.photo')!;
  const preview = main.querySelector<HTMLImageElement>('.photo-preview')!;
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      photo = await shrink(file);
      preview.src = URL.createObjectURL(photo);
      urls.push(preview.src);
      preview.hidden = false;
    } catch { photo = null; }
  });
  main.querySelector('form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = main.querySelector<HTMLInputElement>('.title')!.value.trim();
    if (!title) return;
    const note = main.querySelector<HTMLTextAreaElement>('.note')!.value.trim();
    await save({ id: crypto.randomUUID(), title, note, made: Date.now(), photo });
    void makes(main);
  });
  await shelf(main.querySelector('.shelf')!);
}

async function shelf (box: HTMLElement): Promise<void> {
  let list: Make[] = [];
  try { list = await all(); } catch { /* storage switched off: show the empty shelf */ }
  if (!list.length) {
    box.innerHTML = '<p class="empty">Nothing here yet. When you finish something, take a photo and keep it here.</p>';
    return;
  }
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  box.innerHTML = list.map((m, i) => {
    let img = '<div class="made-photo made-photo--none"></div>';
    if (m.photo) {
      const u = URL.createObjectURL(m.photo);
      urls.push(u);
      img = `<img class="made-photo" src="${u}" alt="">`;
    }
    return `<article class="made" style="--tilt:${[-1.2, 0.8, -0.4, 1.1][i % 4]}deg"><span class="tape"></span>${img}` +
      `<h3>${esc(m.title)}</h3><time>${date.format(m.made)}</time>` +
      (m.note ? `<p>${esc(m.note)}</p>` : '') +
      `<button type="button" class="quiet" data-remove="${m.id}">${ICONS.bin}<span>Remove</span></button></article>`;
  }).join('');
  box.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((b) => b.addEventListener('click', async () => {
    // Two taps, so a photo is never lost to one slip of a finger.
    if (b.dataset.sure !== 'yes') {
      b.dataset.sure = 'yes';
      b.querySelector('span')!.textContent = 'Tap again to remove';
      return;
    }
    await remove(b.dataset.remove!);
    await shelf(box);
  }));
}

/* Make it yours --------------------------------------------------------- */

function yours (main: HTMLElement): void {
  const l = look();
  const colour = (key: 'paper' | 'ink' | 'accent' | 'accent2', label: string): string =>
    `<label class="colour"><input type="color" data-colour="${key}" value="${l[key]}"><span>${label}</span></label>`;
  main.innerHTML = `<div class="yours">
    <section class="card">
      <h2 class="step">Your name</h2>
      ${field('What should the studio call you?', `<input class="name" maxlength="20" value="${esc(l.name)}">`)}
    </section>
    <section class="card">
      <h2 class="step">Your colours</h2>
      <p class="hint">Start with one of these, then change any colour you like.</p>
      <div class="schemes" role="radiogroup" aria-label="Colours">${SCHEMES.map((s) =>
        `<button type="button" class="scheme" role="radio" data-scheme="${s.id}" aria-checked="${s.id === l.scheme}">` +
        `<span class="scheme-dots" style="background:${s.paper}"><i style="background:${s.accent}"></i><i style="background:${s.accent2}"></i><i style="background:${s.ink}"></i></span>` +
        `<span>${s.label}</span></button>`).join('')}</div>
      <div class="colours">
        ${colour('paper', 'Paper')}${colour('ink', 'Writing')}${colour('accent', 'Favourite colour')}${colour('accent2', 'Second favourite')}
      </div>
    </section>
    <section class="card">
      <h2 class="step">Your lettering</h2>
      <div class="letterings" role="radiogroup" aria-label="Lettering">${(Object.keys(LETTERING) as Lettering[]).map((k) =>
        `<button type="button" class="lettering" role="radio" data-lettering="${k}" aria-checked="${k === l.lettering}" style="font-family:${LETTERING[k].stack.replace(/"/g, "'")}">` +
        `<span class="lettering-sample">${esc(l.name)}</span><span>${LETTERING[k].label}</span></button>`).join('')}</div>
    </section>
    <section class="card card--character">
      <h2 class="step">Your character</h2>
      <div class="character-row">
        <div class="buddy buddy--small">${buddy(l)}</div>
        <p>This is Box buddy, keeping the spot warm. Draw your own character on paper, as many as you like, and the best one moves in here and onto your stickers.</p>
      </div>
    </section>
    <section class="card">
      <h2 class="step">Ideas and wishes</h2>
      ${field('What else should your studio have?', `<textarea class="wishes" rows="5" maxlength="2000" placeholder="Things you want to make, colours you love, what your character is called...">${esc(notes.get().wishes)}</textarea>`)}
      <button type="button" class="go copy">${ICONS.copy}<span>Copy my picks</span></button>
      <p class="hint copied" role="status"></p>
    </section>
  </div>`;

  const refresh = (): void => { yours(main); app.querySelector('.top')!.outerHTML = top('yours'); };
  const name = main.querySelector<HTMLInputElement>('.name')!;
  name.addEventListener('change', () => { setLook({ name: name.value.trim() || 'Jazz' }); refresh(); });
  main.querySelectorAll<HTMLButtonElement>('[data-scheme]').forEach((b) =>
    b.addEventListener('click', () => { useScheme(b.dataset.scheme!); refresh(); }));
  main.querySelectorAll<HTMLInputElement>('[data-colour]').forEach((input) => {
    // Live while dragging, redrawn once she lets go.
    input.addEventListener('input', () => setLook({ [input.dataset.colour!]: input.value, scheme: 'own' }));
    input.addEventListener('change', refresh);
  });
  main.querySelectorAll<HTMLButtonElement>('[data-lettering]').forEach((b) =>
    b.addEventListener('click', () => { setLook({ lettering: b.dataset.lettering as Lettering }); refresh(); }));
  const wishes = main.querySelector<HTMLTextAreaElement>('.wishes')!;
  wishes.addEventListener('input', () => notes.set({ wishes: wishes.value }));
  main.querySelector('.copy')!.addEventListener('click', async () => {
    const status = main.querySelector('.copied')!;
    try {
      await navigator.clipboard.writeText(picks());
      status.textContent = 'Copied. Paste it into a message to send your picks.';
    } catch {
      status.textContent = 'Could not copy here. Take a screenshot of this page instead.';
    }
  });
}

/** Everything she chose, as plain text, to send to whoever is building the next version. */
function picks (): string {
  const l = look();
  const scheme = SCHEMES.find((s) => s.id === l.scheme)?.label ?? 'my own';
  return [
    `${l.name}'s Studio picks`,
    `Colours: ${scheme} (paper ${l.paper}, writing ${l.ink}, favourite ${l.accent}, second favourite ${l.accent2})`,
    `Lettering: ${LETTERING[l.lettering].label}`,
    `Pattern for stationery: ${paper.get().pattern}`,
    '',
    'Ideas and wishes:',
    notes.get().wishes.trim() || '(none yet)'
  ].join('\n');
}

apply();
window.addEventListener('hashchange', render);
render();
