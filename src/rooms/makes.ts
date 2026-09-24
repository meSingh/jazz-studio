/**
 * My makes: her library of prints to use again, then photos of things she
 * made, and doodles, all kept on this device.
 *
 * A kept print is its settings (see prints.ts), drawn here as it will print.
 * Open puts its tool back to it, to print again or change first.
 */
import { all, save, remove, shrink, type Make } from '../makes';
import { look } from '../look';
import { ICONS } from '../icons';
import { esc, field, heading, inSukhiPlay, confirmBox, scoped } from '../ui';
import { toolFor } from '../prints';

const urls: string[] = [];
const key = /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd+V' : 'Ctrl+V';

/** Where a pasted photo goes: the photo box of the My makes on the screen. */
let pasteInto: ((file: File) => void) | null = null;
let pasteBox: HTMLElement | null = null;
window.addEventListener('paste', (e) => {
  if (!pasteInto || !pasteBox || !document.body.contains(pasteBox)) return;
  if ((e.target as HTMLElement | null)?.closest?.('input, textarea')) return;
  const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
  if (!file) return;
  e.preventDefault();
  pasteInto(file);
});

export async function makesRoom (main: HTMLElement): Promise<void> {
  urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
  // Sukhi Play never opens a file browser, so there a photo is pasted or
  // dragged in, as a character is. Everywhere else it can be those or chosen.
  const how = inSukhiPlay ? `Copy a photo, then press ${key} here, or drag one in` : 'Add a photo';
  main.innerHTML = `<section class="library">
      ${heading('Your prints')}
      <div class="prints-shelf" aria-live="polite"></div>
    </section>
    ${heading('Things you made')}
    <form class="add">
      <label class="photo-drop">
        ${inSukhiPlay ? '' : '<input type="file" accept="image/*" capture="environment" class="photo">'}
        <span class="photo-look">${ICONS.camera}<span>${how}</span></span>
        <img class="photo-preview" alt="" hidden>
      </label>
      <div class="add-words">
        ${field('What did you make?', '<input class="title" maxlength="60" required placeholder="My pencil case">')}
        ${field('Anything to remember about it?', '<textarea class="note" rows="3" maxlength="500" placeholder="What it is made from, who it is for..."></textarea>')}
        <button class="go" type="submit">${ICONS.plus}<span>Keep it</span></button>
      </div>
    </form>
    <section class="shelf" aria-live="polite"></section>`;

  let photo: Blob | null = null;
  const drop = main.querySelector<HTMLElement>('.photo-drop')!;
  const preview = main.querySelector<HTMLImageElement>('.photo-preview')!;
  const use = async (file: File | undefined): Promise<void> => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      photo = await shrink(file);
      preview.src = URL.createObjectURL(photo);
      urls.push(preview.src);
      preview.hidden = false;
    } catch { photo = null; }
  };
  const input = main.querySelector<HTMLInputElement>('.photo');
  input?.addEventListener('change', () => void use(input.files?.[0]));
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.dataset.over = 'yes'; });
  drop.addEventListener('dragleave', () => { delete drop.dataset.over; });
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    delete drop.dataset.over;
    void use([...(e.dataTransfer?.files ?? [])][0]);
  });
  pasteBox = drop;
  pasteInto = (file) => void use(file);

  main.querySelector('form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = main.querySelector<HTMLInputElement>('.title')!.value.trim();
    if (!title) return;
    const note = main.querySelector<HTMLTextAreaElement>('.note')!.value.trim();
    await save({ id: crypto.randomUUID(), title, note, made: Date.now(), photo });
    void makesRoom(main);
  });
  await shelves(main);
}

const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

async function shelves (main: HTMLElement): Promise<void> {
  let list: Make[] = [];
  try { list = await all(); } catch { /* storage switched off: show the empty shelves */ }
  prints(main.querySelector('.prints-shelf')!, list.filter((m) => m.print), main);
  await shelf(main.querySelector('.shelf')!, list.filter((m) => !m.print), main);
}

/** Her prints, each drawn from its settings, as it will print. */
function prints (box: HTMLElement, list: Make[], main: HTMLElement): void {
  if (!list.length) {
    box.innerHTML = '<p class="empty">When you print something, keep it here, and you can print it again or change it first.</p>';
    return;
  }
  box.innerHTML = list.map((m, i) => {
    const k = m.print!;
    const tool = toolFor(k);
    const l = { ...look(), ...k.design, ...(k.brand ? { brand: { ...look().brand, ...k.brand } } : {}) };
    const picture = tool ? scoped(tool.draw(k, l), `kp${i}-`) : '';
    return `<article class="kept-print" style="--tilt:${[-0.8, 0.6, -0.4, 0.9][i % 4]}deg">` +
      `<button type="button" class="kept-open" data-open="${m.id}" aria-label="Open ${esc(m.title)}"><span class="sheet-mini">${picture}</span></button>` +
      `<h3>${esc(m.title)}</h3><time>${date.format(m.made)}</time>` +
      '<div class="kept-buttons">' +
      `<button type="button" class="go go--small" data-open="${m.id}">${ICONS.print}<span>Open</span></button>` +
      `<button type="button" class="quiet" data-remove="${m.id}" aria-label="Remove ${esc(m.title)}">${ICONS.bin}</button></div></article>`;
  }).join('');
  box.querySelectorAll<HTMLButtonElement>('[data-open]').forEach((b) => b.addEventListener('click', () => {
    const k = list.find((x) => x.id === b.dataset.open)?.print;
    if (k) toolFor(k)?.open(k);
  }));
  wireRemove(box, list, main);
}

async function shelf (box: HTMLElement, list: Make[], main: HTMLElement): Promise<void> {
  if (!list.length) {
    box.innerHTML = '<p class="empty">Nothing here yet. When you finish something, take a photo and keep it here.</p>';
    return;
  }
  box.innerHTML = list.map((m, i) => {
    let pic = '<div class="made-photo made-photo--none"></div>';
    if (m.photo) {
      const u = URL.createObjectURL(m.photo);
      urls.push(u);
      pic = `<img class="made-photo" src="${u}" alt="">`;
    }
    return `<article class="made" style="--tilt:${[-1.2, 0.8, -0.4, 1.1][i % 4]}deg"><span class="tape"></span>${pic}` +
      `<h3>${esc(m.title)}</h3><time>${date.format(m.made)}</time>` +
      (m.note ? `<p>${esc(m.note)}</p>` : '') +
      `<button type="button" class="quiet" data-remove="${m.id}">${ICONS.bin}<span>Remove</span></button></article>`;
  }).join('');
  wireRemove(box, list, main);
}

/** Remove, after asking. A print's question shows the print; a photo's, the photo. */
function wireRemove (box: HTMLElement, list: Make[], main: HTMLElement): void {
  box.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((b) => b.addEventListener('click', async () => {
    const m = list.find((x) => x.id === b.dataset.remove);
    if (!m) return;
    const card = b.closest('.made, .kept-print');
    const pic = card?.querySelector<HTMLImageElement>('img.made-photo');
    const sheet = card?.querySelector('.sheet-mini svg');
    const yes = await confirmBox({
      title: `Remove ${esc(m.title)}?`,
      art: pic ? `<img class="ask-thumb" src="${pic.src}" alt="">` : sheet ? `<span class="ask-sheet">${scoped(sheet.outerHTML, 'rm-')}</span>` : undefined,
      body: m.print
        ? '<p>It comes off Your prints. Anything you already printed is not touched.</p><p>This cannot be undone.</p>'
        : `<p>It comes off your shelf${m.photo ? ', photo and all' : ''}. The thing you made is not touched, only its place here.</p>
        <p>This cannot be undone.</p>`,
      yes: 'Remove'
    });
    if (!yes) return;
    await remove(m.id);
    await shelves(main);
  }));
}
