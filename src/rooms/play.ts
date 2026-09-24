/**
 * Play: small things to try. A poster of her name, secret messages in
 * pigpen, sparks for when the diary page is blank, and a doodle pad.
 */
import { look } from '../look';
import { img, either, people, type PoseId } from '../character';
import { posterSheet } from '../play/poster';
import { inviteSheet } from '../play/invite';
import { secretSheet, layout, draw, type SecretTop } from '../play/pigpen';
import { WHO, WHAT, WHERE, QUESTIONS, pick, storySheet } from '../play/sparks';
import { save } from '../makes';
import { ICONS } from '../icons';
import {
  esc, field, heading, printButton, wirePrint, wireChoice, colourBar, wireColours,
  patternPicker, wirePatterns, posePicker, refresh, remembered, sheetDesign, type Design
} from '../ui';
import { stationeryState } from './stationery';
import { register, showing, designOf } from '../prints';

export const PLAYTHINGS: Array<{ id: string; title: string; blurb: string; pose: PoseId }> = [
  { id: 'poster', title: 'Name poster', blurb: 'Your name, huge, in your pattern', pose: 'cool' },
  { id: 'secret', title: 'Secret codes', blurb: 'Write in a code only friends can read', pose: 'wink' },
  { id: 'sparks', title: 'Story sparks', blurb: 'Build a story idea, then write and draw it on a page', pose: 'idea' },
  { id: 'doodle', title: 'Doodle pad', blurb: 'Draw in your colours and keep it', pose: 'draw' },
  { id: 'invite', title: 'Invite a friend', blurb: 'Cards with a code to scan, so friends can make things too', pose: 'hello' }
];

export function playRoom (main: HTMLElement, sub: string): void {
  if (sub === 'poster') return poster(main);
  if (sub === 'secret') return secret(main);
  if (sub === 'sparks') return sparks(main);
  if (sub === 'doodle') return doodle(main);
  if (sub === 'invite') return invite(main);
  main.innerHTML = `<div class="things">${PLAYTHINGS.map((t, i) =>
    `<a class="thing" href="#/play/${t.id}" style="--tilt:${[-1, 1, -0.6, 0.8][i]}deg">` +
    `<span class="thing-art">${img(either(t.pose, i), 'thing-img')}</span>` +
    `<span class="thing-title">${t.title}</span><span class="thing-blurb">${t.blurb}</span></a>`).join('')}</div>`;
}

/* Name poster ------------------------------------------------------------ */

interface PosterSettings { name: string; line: string; pose: PoseId; dark: boolean }

const posterState = remembered<PosterSettings & { design?: Design }>('jazz-studio-poster',
  { name: '', line: '', pose: 'cool', dark: true });

const posterDesign = sheetDesign(() => posterState.get().design, (d) => posterState.set({ design: d }));

function poster (main: HTMLElement): void {
  const s = posterState.get();
  const l = posterDesign.get();
  main.innerHTML = `<div class="workbench">
    <section class="controls">
      ${heading('Words')}
      ${field('Big letters', `<input class="p-name" maxlength="12" placeholder="${esc(l.name.trim() || 'Your name')}" value="${esc(s.name)}">`)}
      ${field('A line underneath (or leave empty)', `<input class="p-line" maxlength="40" value="${esc(s.line)}">`)}
      ${heading('Which you')}
      ${posePicker(s.pose, false)}
      ${heading('Pattern')}
      ${patternPicker(posterDesign)}
      <label class="tick"><input type="checkbox" class="p-dark" ${s.dark ? 'checked' : ''}><span>Dark background</span></label>
    </section>
    <section class="preview">${colourBar(posterDesign)}<div class="print-area">${posterSheet(s.name, s.line, s.pose, s.dark, l)}</div>${printButton()}</section>
  </div>`;
  const redraw = (): void => {
    const now = posterState.get();
    main.querySelector('.print-area')!.innerHTML = posterSheet(now.name, now.line, now.pose, now.dark, posterDesign.get());
  };
  main.querySelector<HTMLInputElement>('.p-name')!.addEventListener('input', (e) => { posterState.set({ name: (e.target as HTMLInputElement).value }); redraw(); });
  main.querySelector<HTMLInputElement>('.p-line')!.addEventListener('input', (e) => { posterState.set({ line: (e.target as HTMLInputElement).value }); redraw(); });
  main.querySelector<HTMLInputElement>('.p-dark')!.addEventListener('change', (e) => { posterState.set({ dark: (e.target as HTMLInputElement).checked }); redraw(); });
  wireChoice(main, 'pose', (p) => { posterState.set({ pose: p as PoseId }); refresh(); });
  wirePatterns(main, posterDesign);
  wireColours(main, posterDesign);
  wirePrint(main);
  showing(() => {
    const { name, line, pose, dark } = posterState.get();
    return { tool: 'poster', settings: { name, line, pose, dark }, design: designOf(posterDesign.get()) };
  });
}

register('poster', {
  draw: (k, l) => {
    const s = k.settings as unknown as PosterSettings;
    return posterSheet(s.name, s.line, s.pose, s.dark, l);
  },
  open: (k) => {
    posterState.set({ ...(k.settings as unknown as PosterSettings), design: k.design });
    location.hash = '#/play/poster';
  },
  name: (k) => `Name poster: ${(k.settings as unknown as PosterSettings).name || look().name || 'Hello'}`
});

/* Invite a friend ---------------------------------------------------------- */

interface InviteSettings { words: string; pose: PoseId | ''; from: string | null }

const inviteState = remembered<InviteSettings & { design?: Design }>('jazz-studio-invite', { words: '', pose: '', from: null });
const inviteDesign = sheetDesign(() => inviteState.get().design, (d) => inviteState.set({ design: d }));
/** Who the cards are from: what she typed, or her name until she types something. */
const fromOf = (s: InviteSettings): string => s.from ?? look().name;

function invite (main: HTMLElement): void {
  const s = inviteState.get();

  const draw = (): string => {
    const now = inviteState.get();
    return inviteSheet(now.words, now.pose || look().pose, fromOf(now), inviteDesign.get());
  };
  main.innerHTML = `<div class="workbench">
    <section class="controls">
      <p class="hint">Eight cards to cut out and give to friends. Their phone or tablet camera opens the studio from the code, and it is free for them too.</p>
      ${heading('Words on top')}
      ${field('What the cards say', `<input class="i-words" maxlength="40" placeholder="Come and make things with me!" value="${esc(s.words)}">`)}
      ${field('From', `<input class="i-from" maxlength="20" placeholder="Your name" value="${esc(fromOf(s))}">`)}
      ${heading('In the middle of the code')}
      ${posePicker(s.pose || look().pose, false)}
      ${heading('Pattern')}
      ${patternPicker(inviteDesign)}
    </section>
    <section class="preview">${colourBar(inviteDesign)}<div class="print-area">${draw()}</div>${printButton('Print the cards')}</section>
  </div>`;
  const redraw = (): void => { main.querySelector('.print-area')!.innerHTML = draw(); };
  main.querySelector<HTMLInputElement>('.i-words')!.addEventListener('input', (e) => { inviteState.set({ words: (e.target as HTMLInputElement).value }); redraw(); });
  main.querySelector<HTMLInputElement>('.i-from')!.addEventListener('input', (e) => { inviteState.set({ from: (e.target as HTMLInputElement).value }); redraw(); });
  wireChoice(main, 'pose', (p) => { inviteState.set({ pose: p as PoseId }); refresh(); });
  wirePatterns(main, inviteDesign);
  wireColours(main, inviteDesign);
  wirePrint(main);
  showing(() => {
    const now = inviteState.get();
    return { tool: 'invite', settings: { words: now.words, pose: now.pose || look().pose, from: fromOf(now) }, design: designOf(inviteDesign.get()) };
  });
}

register('invite', {
  draw: (k, l) => {
    const s = k.settings as unknown as InviteSettings;
    return inviteSheet(s.words, s.pose || l.pose, s.from ?? '', l);
  },
  open: (k) => {
    inviteState.set({ ...(k.settings as unknown as InviteSettings), design: k.design });
    location.hash = '#/play/invite';
  },
  name: () => 'Invite cards'
});

/* Secret codes ----------------------------------------------------------- */

const secretState = remembered<{ message: string; top?: SecretTop; design?: Design }>('jazz-studio-secret', { message: 'Meet me at the treehouse' });
const secretDesign = sheetDesign(() => secretState.get().design, (d) => secretState.set({ design: d }));
/** The top of the message: what she chose, or her logo and "Top secret" to start with. */
const topOf = (): SecretTop => ({ show: 'logo', pose: look().pose, title: 'Top secret', line: 'Only someone with the key can read this', ...secretState.get().top });

function secretPreview (message: string): string {
  const l = secretDesign.get();
  const s = 30;
  const glyphs = layout(message || ' ', 560, s);
  const h = glyphs.length ? glyphs[glyphs.length - 1].y + s * 1.4 : s;
  return `<svg viewBox="-6 -6 572 ${h + 12}" class="secret-svg" role="img" aria-label="Your message in secret code">` +
    glyphs.map((g) => draw(g.ch, g.x, g.y, s, l.accent, 3.2)).join('') + '</svg>';
}

function secret (main: HTMLElement): void {
  const s = secretState.get();
  const top = topOf();
  main.innerHTML = `<div class="workbench">
    <section class="controls">
      ${heading('Your message')}
      ${field('Type it here, in normal letters', `<textarea class="s-msg" rows="4" maxlength="160">${esc(s.message)}</textarea>`)}
      ${heading('In secret code')}
      <div class="secret-out">${secretPreview(s.message)}</div>
      <p class="hint">This is pigpen, a real secret code. Each letter is the shape of its box in the key. Print it with the key, cut the key off, and give it to a friend.</p>
      ${heading('At the top')}
      <div class="chips" role="radiogroup" aria-label="At the top">
        ${([['logo', 'A logo'], ['me', 'A face'], ['none', 'Just the words']] as const).map(([id, label]) =>
          `<button type="button" class="chip" role="radio" data-top="${id}" aria-checked="${top.show === id}">${label}</button>`).join('')}
      </div>
      ${top.show !== 'none' ? posePicker(top.pose, false, 'top-pose') + (top.show === 'logo' ? '<p class="hint">The logo is the brand of whoever you pick, from My brand.</p>' : '') : ''}
      ${field('Title', `<input class="s-title" maxlength="30" value="${esc(top.title)}">`)}
      ${field('Under the title (or leave empty)', `<input class="s-line" maxlength="50" value="${esc(top.line)}">`)}
    </section>
    <section class="preview">${colourBar(secretDesign)}<div class="print-area">${secretSheet(s.message, secretDesign.get(), top)}</div>${printButton('Print message and key')}</section>
  </div>`;
  const redraw = (): void => {
    const msg = secretState.get().message;
    main.querySelector('.secret-out')!.innerHTML = secretPreview(msg);
    main.querySelector('.print-area')!.innerHTML = secretSheet(msg, secretDesign.get(), topOf());
  };
  const msg = main.querySelector<HTMLTextAreaElement>('.s-msg')!;
  msg.addEventListener('input', () => { secretState.set({ message: msg.value }); redraw(); });
  const setTop = (change: Partial<SecretTop>): void => { secretState.set({ top: { ...topOf(), ...change } }); };
  wireChoice(main, 'top', (t) => { setTop({ show: t as SecretTop['show'] }); refresh(); });
  wireChoice(main, 'top-pose', (p) => { setTop({ pose: p }); refresh(); });
  main.querySelector<HTMLInputElement>('.s-title')!.addEventListener('input', (e) => { setTop({ title: (e.target as HTMLInputElement).value }); redraw(); });
  main.querySelector<HTMLInputElement>('.s-line')!.addEventListener('input', (e) => { setTop({ line: (e.target as HTMLInputElement).value }); redraw(); });
  wireColours(main, secretDesign);
  wirePrint(main);
  showing(() => ({ tool: 'secret', settings: { message: secretState.get().message, top: topOf() }, design: designOf(secretDesign.get()) }));
}

register('secret', {
  draw: (k, l) => secretSheet(String(k.settings.message ?? ''), l, { ...topOf(), ...(k.settings.top as Partial<SecretTop> | undefined) }),
  open: (k) => {
    secretState.set({ message: String(k.settings.message ?? ''), top: k.settings.top as SecretTop | undefined, design: k.design });
    location.hash = '#/play/secret';
  },
  name: () => 'Secret message'
});

/* Story sparks ----------------------------------------------------------- */

interface StorySettings { mode: 'story' | 'question'; who: string; what: string; where: string; question: string; title: string }

const storyState = remembered<StorySettings & { design?: Design }>('jazz-studio-story', {
  mode: 'story', who: pick(WHO), what: pick(WHAT), where: pick(WHERE), question: pick(QUESTIONS), title: ''
});
const storyDesign = sheetDesign(() => storyState.get().design, (d) => storyState.set({ design: d }));

/** Her people first, as heroes, then the made-up ones. A person is stored as "@" and their key. */
function heroes (): Array<{ value: string; label: string; pose?: PoseId }> {
  return [
    ...people(look()).map((g) => ({ value: `@${g.key}`, label: g.name, pose: g.poses[0].id })),
    ...WHO.map((w) => ({ value: w, label: w }))
  ];
}

function idea (s: StorySettings): string {
  if (s.mode === 'question') return s.question;
  const hero = heroes().find((h) => h.value === s.who);
  return `${hero?.label ?? s.who} ${s.what} ${s.where}.`;
}

const heroPose = (s: StorySettings): PoseId | null =>
  s.mode === 'story' ? heroes().find((h) => h.value === s.who)?.pose ?? null : null;

function sparks (main: HTMLElement): void {
  const s = storyState.get();
  const choose = (key: 'who' | 'what' | 'where' | 'question', label: string, options: Array<{ value: string; label: string }>): string =>
    `<div class="story-part"><label class="field"><span>${label}</span><select data-part="${key}">${options.map((o) =>
      `<option value="${esc(o.value)}"${o.value === s[key] ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}</select></label>` +
    `<button type="button" class="mini story-spin" data-spin="${key}" title="Surprise me" aria-label="Surprise me: ${label}">${ICONS.spin}</button></div>`;
  const plain = (list: string[]): Array<{ value: string; label: string }> => list.map((x) => ({ value: x, label: x }));
  main.innerHTML = `<div class="workbench">
    <section class="controls">
      <div class="chips" role="radiogroup" aria-label="What kind">
        <button type="button" class="chip" role="radio" data-mode="story" aria-checked="${s.mode === 'story'}">Make up a story</button>
        <button type="button" class="chip" role="radio" data-mode="question" aria-checked="${s.mode === 'question'}">Answer a question</button>
      </div>
      ${s.mode === 'story'
        ? heading('Your story') + choose('who', 'Who', heroes()) + choose('what', 'What happens', plain(WHAT)) + choose('where', 'Where', plain(WHERE)) +
          `<button type="button" class="go go--second story-all">${ICONS.spin}<span>Spin all three</span></button>` +
          '<p class="hint">Pick one of your people and they stand in the drawing box, ready for you to draw the rest.</p>'
        : heading('Your question') + choose('question', 'The question', plain(QUESTIONS))}
      ${field('Title at the top (or leave empty)', `<input class="story-title" maxlength="30" placeholder="My story" value="${esc(s.title)}">`)}
      <button type="button" class="go go--ghost story-diary">${ICONS.sticker}<span>Put it on a diary page instead</span></button>
      ${heading('Pattern')}
      ${patternPicker(storyDesign)}
    </section>
    <section class="preview">${colourBar(storyDesign)}<div class="print-area">${storySheet(idea(s), s.title, heroPose(s), storyDesign.get())}</div>${printButton('Print the page')}</section>
  </div>`;
  const redraw = (): void => {
    const now = storyState.get();
    main.querySelector('.print-area')!.innerHTML = storySheet(idea(now), now.title, heroPose(now), storyDesign.get());
  };
  wireChoice(main, 'mode', (m) => { storyState.set({ mode: m as StorySettings['mode'] }); refresh(); });
  main.querySelectorAll<HTMLSelectElement>('[data-part]').forEach((sel) => sel.addEventListener('change', () => {
    storyState.set({ [sel.dataset.part!]: sel.value });
    redraw();
  }));
  const lists = { who: () => heroes().map((h) => h.value), what: () => WHAT, where: () => WHERE, question: () => QUESTIONS };
  main.querySelectorAll<HTMLButtonElement>('[data-spin]').forEach((b) => b.addEventListener('click', () => {
    const key = b.dataset.spin as keyof typeof lists;
    storyState.set({ [key]: pick(lists[key]()) });
    refresh();
  }));
  main.querySelector('.story-all')?.addEventListener('click', () => {
    storyState.set({ who: pick(lists.who()), what: pick(WHAT), where: pick(WHERE) });
    refresh();
  });
  main.querySelector<HTMLInputElement>('.story-title')!.addEventListener('input', (e) => { storyState.set({ title: (e.target as HTMLInputElement).value }); redraw(); });
  main.querySelector('.story-diary')!.addEventListener('click', () => {
    const st = stationeryState.get();
    stationeryState.set({ kind: 'diary', words: { ...st.words, diary: idea(storyState.get()) } });
    location.hash = '#/stationery/diary';
  });
  wirePatterns(main, storyDesign);
  wireColours(main, storyDesign);
  wirePrint(main);
  showing(() => {
    const { mode, who, what, where, question, title } = storyState.get();
    return { tool: 'story', settings: { mode, who, what, where, question, title }, design: designOf(storyDesign.get()) };
  });
}

register('story', {
  draw: (k, l) => {
    const s = k.settings as unknown as StorySettings;
    return storySheet(idea(s), s.title, heroPose(s), l);
  },
  open: (k) => {
    storyState.set({ ...(k.settings as unknown as StorySettings), design: k.design });
    location.hash = '#/play/sparks';
  },
  name: (k) => (k.settings as unknown as StorySettings).title || 'Story page'
});

/* Doodle pad ------------------------------------------------------------- */

function doodle (main: HTMLElement): void {
  const l = look();
  const inks = ['#111111', l.accent, l.accent2, '#D62828', '#FCA311', '#3DDC84', '#2563EB', '#7C5CFF', '#6B7280'];
  main.innerHTML = `<section class="doodle">
    <div class="doodle-tools">
      <div class="doodle-inks" role="radiogroup" aria-label="Colour">${inks.map((c, i) =>
        `<button type="button" class="swatch" data-ink="${c}" style="--c:${c}" aria-pressed="${i === 1}" aria-label="${c}"></button>`).join('')}
        <button type="button" class="swatch swatch--rubber" data-ink="rubber" aria-pressed="false" aria-label="Rubber">${ICONS.rubber}</button>
      </div>
      <div class="doodle-sizes" role="radiogroup" aria-label="Size">${[3, 8, 18].map((w, i) =>
        `<button type="button" class="size" data-size="${w}" aria-pressed="${i === 1}"><i style="width:${w + 4}px;height:${w + 4}px"></i></button>`).join('')}</div>
      <div class="doodle-actions">
        <button type="button" class="quiet undo">${ICONS.undo}<span>Undo</span></button>
        <button type="button" class="quiet clear">${ICONS.bin}<span>Start again</span></button>
        <button type="button" class="go keep">${ICONS.plus}<span>Keep it</span></button>
      </div>
    </div>
    <canvas class="doodle-canvas" aria-label="Doodle pad"></canvas>
    <p class="hint kept" role="status"></p>
  </section>`;

  const canvas = main.querySelector<HTMLCanvasElement>('.doodle-canvas')!;
  const ctx = canvas.getContext('2d')!;
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.width * 0.66 * ratio);
  canvas.style.height = `${rect.width * 0.66}px`;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let ink = inks[1];
  let size = 8;
  const history: ImageData[] = [];
  let last: { x: number; y: number } | null = null;

  const at = (e: PointerEvent): { x: number; y: number } => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  };
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.length > 25) history.shift();
    last = at(e);
    ctx.beginPath();
    ctx.fillStyle = ink === 'rubber' ? '#fff' : ink;
    ctx.arc(last.x, last.y, (size * ratio) / 2, 0, Math.PI * 2);
    ctx.fill();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!last) return;
    const p = at(e);
    ctx.strokeStyle = ink === 'rubber' ? '#fff' : ink;
    ctx.lineWidth = size * ratio * (ink === 'rubber' ? 2 : 1);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  });
  const end = (): void => { last = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  main.querySelectorAll<HTMLButtonElement>('[data-ink]').forEach((b) => b.addEventListener('click', () => {
    ink = b.dataset.ink!;
    main.querySelectorAll('[data-ink]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  main.querySelectorAll<HTMLButtonElement>('[data-size]').forEach((b) => b.addEventListener('click', () => {
    size = Number(b.dataset.size);
    main.querySelectorAll('[data-size]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  main.querySelector('.undo')!.addEventListener('click', () => {
    const prev = history.pop();
    if (prev) ctx.putImageData(prev, 0, 0);
  });
  main.querySelector('.clear')!.addEventListener('click', () => {
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
  main.querySelector('.keep')!.addEventListener('click', () => {
    canvas.toBlob(async (blob) => {
      const status = main.querySelector('.kept')!;
      if (!blob) return;
      try {
        await save({ id: crypto.randomUUID(), title: 'A doodle', note: '', made: Date.now(), photo: blob });
        status.innerHTML = 'Kept. It is in <a href="#/makes">My makes</a> now.';
      } catch {
        status.textContent = 'Could not keep it on this device.';
      }
    }, 'image/png');
  });
}
