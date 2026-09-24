/**
 * Play: small things to try. A poster of her name, secret messages in
 * pigpen, sparks for when the diary page is blank, and a doodle pad.
 */
import { look } from '../look';
import { img, either, type PoseId } from '../character';
import { posterSheet } from '../play/poster';
import { secretSheet, layout, draw } from '../play/pigpen';
import { spark } from '../play/sparks';
import { save } from '../makes';
import { ICONS } from '../icons';
import {
  esc, field, heading, printButton, wirePrint, wireChoice, colourBar, wireColours,
  patternPicker, wirePatterns, posePicker, refresh, remembered
} from '../ui';
import { stationeryState } from './stationery';

export const PLAYTHINGS: Array<{ id: string; title: string; blurb: string; pose: PoseId }> = [
  { id: 'poster', title: 'Name poster', blurb: 'Your name, huge, in your pattern', pose: 'cool' },
  { id: 'secret', title: 'Secret codes', blurb: 'Write in a code only friends can read', pose: 'wink' },
  { id: 'sparks', title: 'Story sparks', blurb: 'Something to write about, at the tap of a button', pose: 'idea' },
  { id: 'doodle', title: 'Doodle pad', blurb: 'Draw in your colours and keep it', pose: 'draw' }
];

export function playRoom (main: HTMLElement, sub: string): void {
  if (sub === 'poster') return poster(main);
  if (sub === 'secret') return secret(main);
  if (sub === 'sparks') return sparks(main);
  if (sub === 'doodle') return doodle(main);
  main.innerHTML = `<div class="things">${PLAYTHINGS.map((t, i) =>
    `<a class="thing" href="#/play/${t.id}" style="--tilt:${[-1, 1, -0.6, 0.8][i]}deg">` +
    `<span class="thing-art">${img(either(t.pose, i), 'thing-img')}</span>` +
    `<span class="thing-title">${t.title}</span><span class="thing-blurb">${t.blurb}</span></a>`).join('')}</div>`;
}

/* Name poster ------------------------------------------------------------ */

const posterState = remembered<{ name: string; line: string; pose: PoseId; dark: boolean }>('jazz-studio-poster',
  { name: '', line: '', pose: 'cool', dark: true });

function poster (main: HTMLElement): void {
  const s = posterState.get();
  const l = look();
  main.innerHTML = `<div class="workbench">
    <section class="controls">
      ${heading('Words')}
      ${field('Big letters', `<input class="p-name" maxlength="12" placeholder="${esc(l.name)}" value="${esc(s.name)}">`)}
      ${field('A line underneath (or leave empty)', `<input class="p-line" maxlength="40" value="${esc(s.line)}">`)}
      ${heading('Which you')}
      ${posePicker(s.pose, false)}
      ${heading('Pattern')}
      ${patternPicker()}
      <label class="tick"><input type="checkbox" class="p-dark" ${s.dark ? 'checked' : ''}><span>Dark background</span></label>
      ${printButton()}
    </section>
    <section class="preview">${colourBar()}<div class="print-area">${posterSheet(s.name, s.line, s.pose, s.dark, l)}</div></section>
  </div>`;
  const redraw = (): void => {
    const now = posterState.get();
    main.querySelector('.print-area')!.innerHTML = posterSheet(now.name, now.line, now.pose, now.dark, look());
  };
  main.querySelector<HTMLInputElement>('.p-name')!.addEventListener('input', (e) => { posterState.set({ name: (e.target as HTMLInputElement).value }); redraw(); });
  main.querySelector<HTMLInputElement>('.p-line')!.addEventListener('input', (e) => { posterState.set({ line: (e.target as HTMLInputElement).value }); redraw(); });
  main.querySelector<HTMLInputElement>('.p-dark')!.addEventListener('change', (e) => { posterState.set({ dark: (e.target as HTMLInputElement).checked }); redraw(); });
  wireChoice(main, 'pose', (p) => { posterState.set({ pose: p as PoseId }); refresh(); });
  wirePatterns(main);
  wireColours(main);
  wirePrint(main);
}

/* Secret codes ----------------------------------------------------------- */

const secretState = remembered<{ message: string }>('jazz-studio-secret', { message: 'Meet me at the treehouse' });

function secretPreview (message: string): string {
  const l = look();
  const s = 30;
  const glyphs = layout(message || ' ', 560, s);
  const h = glyphs.length ? glyphs[glyphs.length - 1].y + s * 1.4 : s;
  return `<svg viewBox="-6 -6 572 ${h + 12}" class="secret-svg" role="img" aria-label="Your message in secret code">` +
    glyphs.map((g) => draw(g.ch, g.x, g.y, s, l.accent, 3.2)).join('') + '</svg>';
}

function secret (main: HTMLElement): void {
  const s = secretState.get();
  main.innerHTML = `<div class="workbench">
    <section class="controls">
      ${heading('Your message')}
      ${field('Type it here, in normal letters', `<textarea class="s-msg" rows="4" maxlength="160">${esc(s.message)}</textarea>`)}
      ${heading('In secret code')}
      <div class="secret-out">${secretPreview(s.message)}</div>
      <p class="hint">This is pigpen, a real secret code. Each letter is the shape of its box in the key. Print it with the key, cut the key off, and give it to a friend.</p>
      ${printButton('Print message and key')}
    </section>
    <section class="preview">${colourBar()}<div class="print-area">${secretSheet(s.message, look())}</div></section>
  </div>`;
  const msg = main.querySelector<HTMLTextAreaElement>('.s-msg')!;
  msg.addEventListener('input', () => {
    secretState.set({ message: msg.value });
    main.querySelector('.secret-out')!.innerHTML = secretPreview(msg.value);
    main.querySelector('.print-area')!.innerHTML = secretSheet(msg.value, look());
  });
  wireColours(main);
  wirePrint(main);
}

/* Story sparks ----------------------------------------------------------- */

let current = '';

function sparks (main: HTMLElement): void {
  if (!current) current = spark();
  main.innerHTML = `<section class="spark">
    <div class="spark-me">${img(either('idea', 0), 'spark-img')}</div>
    <div class="spark-card">
      <p class="spark-label">Write about this</p>
      <p class="spark-text" aria-live="polite">${esc(current)}</p>
      <div class="spark-actions">
        <button type="button" class="go spin">${ICONS.spin}<span>Another one</span></button>
        <button type="button" class="go go--second diary">${ICONS.sticker}<span>Put it on a diary page</span></button>
      </div>
    </div>
  </section>`;
  main.querySelector('.spin')!.addEventListener('click', () => {
    current = spark();
    const t = main.querySelector('.spark-text')!;
    t.classList.remove('pop');
    void (t as HTMLElement).offsetWidth;
    t.textContent = current;
    t.classList.add('pop');
  });
  main.querySelector('.diary')!.addEventListener('click', () => {
    const s = stationeryState.get();
    stationeryState.set({ kind: 'diary', words: { ...s.words, diary: current } });
    location.hash = '#/stationery';
  });
}

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
