/** My makes: photos of finished things, and doodles, kept on this device. */
import { all, save, remove, shrink, type Make } from '../makes';
import { ICONS } from '../icons';
import { esc, field, inSukhiPlay } from '../ui';

const urls: string[] = [];

export async function makesRoom (main: HTMLElement): Promise<void> {
  urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
  // Sukhi Play never opens a file browser, so there the photo is left out and
  // a make is its name and its note. Doodles still arrive with their picture.
  const picker = inSukhiPlay
    ? `<div class="photo-drop photo-drop--off"><span class="photo-look">${ICONS.camera}<span>Photos can be added when the studio is open on a phone or tablet</span></span></div>`
    : `<label class="photo-drop">
        <input type="file" accept="image/*" capture="environment" class="photo">
        <span class="photo-look">${ICONS.camera}<span>Add a photo</span></span>
        <img class="photo-preview" alt="" hidden>
      </label>`;
  main.innerHTML = `<form class="add">
      ${picker}
      <div class="add-words">
        ${field('What did you make?', '<input class="title" maxlength="60" required placeholder="My pencil case">')}
        ${field('Anything to remember about it?', '<textarea class="note" rows="3" maxlength="500" placeholder="What it is made from, who it is for..."></textarea>')}
        <button class="go" type="submit">${ICONS.plus}<span>Keep it</span></button>
      </div>
    </form>
    <section class="shelf" aria-live="polite"></section>`;

  let photo: Blob | null = null;
  const input = main.querySelector<HTMLInputElement>('.photo');
  const preview = main.querySelector<HTMLImageElement>('.photo-preview');
  input?.addEventListener('change', async () => {
    if (!preview) return;
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
    void makesRoom(main);
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
