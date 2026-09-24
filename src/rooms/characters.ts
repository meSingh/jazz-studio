/**
 * The Character tab of Make it yours: who their character is.
 *
 * One list, one choice. The character they tap is theirs: it says hello on
 * Home and is where every tool starts. A tool can put another on a sheet; that
 * choice stays in the tool, where it is needed.
 *
 * A family adds their own by choosing a picture, dropping one on the tile, or
 * pasting one. Paste and drop matter because inside Sukhi Play no page may
 * open a file browser, so there a grown-up copies the picture and presses
 * Ctrl+V (Cmd+V on a Mac). The background is cut out on this device by
 * cutout.ts; nothing is sent anywhere. Once they have added any, theirs are
 * the character list; a box keeps Jazz's too. Their own can be renamed,
 * nudged when the face-finding framed the face badly, and removed.
 *
 * The grown-up guide explains how to make one from a photo with Google
 * Gemini, with the prompts that worked for Jazz's, and says plainly that the
 * photo goes to Google when they do.
 */
import { look, setLook } from '../look';
import {
  poses, pose, hasOwn, img, faceImg, saveOwn, removeOwn, nudgeOwn, renameOwn, setKeepJazz
} from '../character';
import { cutOut } from '../cutout';
import { ICONS } from '../icons';
import { esc, refresh, inSukhiPlay } from '../ui';

const FIRST = 'Turn the child in the attached photo into a 3D animated-film character, like one from a ' +
  'family animated film: soft and rounded, friendly, with big expressive eyes. Keep their real likeness: ' +
  'the shape of their face, their skin tone, their hair and how they wear it, and what they are wearing. ' +
  'Show them from the waist up, facing forward and smiling, with the whole head and both hands in the ' +
  'picture and some space around the edges. Background: one flat, plain magenta colour (#FF00FF) filling ' +
  'the whole picture, with no shadow, no gradient and no glow. No text.';

const MORE = 'Using the attached character, make the same character again: the identical face, hair, skin ' +
  'tone and clothes, in the same style, on the same flat magenta (#FF00FF) background, waist up. This time ' +
  'they are waving hello with a big smile.';

const POSE_IDEAS = 'holding a pencil and a sketchbook · pointing up with a big idea · winking with a thumbs up · arms crossed, looking cool';

const GEMINI = 'https://gemini.google.com/';

const key = /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd+V' : 'Ctrl+V';

export function characterTab (): string {
  const l = look();
  const list = poses();
  const mine = pose(l.pose);
  const addHow = inSukhiPlay
    ? `Copy a picture, then press ${key} here`
    : `Choose a picture, drop one here, or copy one and press ${key}`;
  // Inside Sukhi Play a link cannot leave the locked screen, so the address is
  // written out for a grown-up to open on another device.
  const gemini = inSukhiPlay
    ? '<b>gemini.google.com</b> on another device'
    : `<a class="out" href="${GEMINI}" target="_blank" rel="noopener">Google Gemini</a>`;

  return `<section class="me-hero">
      <div class="me-now">${img(mine.id, 'me-now-img')}</div>
      <div class="me-say">
        <span class="kicker">Your character</span>
        <h2>${esc(mine.label)}</h2>
        <p>Says hello when you open the studio, and goes on your stickers, labels and diary. Tap another below to change.</p>
      </div>
    </section>

    <section class="card card--wide">
      <div class="chars" role="radiogroup" aria-label="Your character">
        ${list.map((p) => `<figure class="char${p.own ? ' char--own' : ''}${p.id === mine.id ? ' char--mine' : ''}">
          <button type="button" class="char-pick" role="radio" data-choose="${p.id}" aria-checked="${p.id === mine.id}" aria-label="${esc(p.label)}">
            ${faceImg(p.id, 'char-face')}
            ${p.id === mine.id ? '<span class="char-badge">Yours</span>' : ''}
          </button>
          ${p.own
            ? `<input class="char-name" data-rename="${p.id}" value="${esc(p.label)}" maxlength="20" aria-label="Name">
               <div class="char-tools">
                 <button type="button" class="mini" data-nudge="${p.id}" data-dy="-0.06" title="Move the face up" aria-label="Move up">${ICONS.up}</button>
                 <button type="button" class="mini" data-nudge="${p.id}" data-dy="0.06" title="Move the face down" aria-label="Move down">${ICONS.down}</button>
                 <button type="button" class="mini" data-nudge="${p.id}" data-zoom="0.88" title="Closer" aria-label="Closer">${ICONS.bigger}</button>
                 <button type="button" class="mini" data-nudge="${p.id}" data-zoom="1.14" title="Further away" aria-label="Further away">${ICONS.smaller}</button>
                 <button type="button" class="mini mini--bin" data-drop="${p.id}" title="Remove" aria-label="Remove">${ICONS.bin}</button>
               </div>`
            : `<figcaption>${esc(p.label)}</figcaption>`}
        </figure>`).join('')}
        <label class="char char--add" tabindex="0">
          ${inSukhiPlay ? '' : '<input type="file" accept="image/*" multiple class="char-file">'}
          <span class="char-plus">${ICONS.plus}</span>
          <b>Add a character</b>
          <small>${addHow}</small>
        </label>
      </div>
      <p class="hint char-status" role="status"></p>
      ${hasOwn() ? `<label class="tick"><input type="checkbox" class="keep-jazz" ${l.keepJazz ? 'checked' : ''}><span>Keep Jazz's characters too</span></label>` : ''}
    </section>

    <details class="guide">
      <summary>
        <span class="guide-icon">${ICONS.person}</span>
        <span class="guide-say"><b>Make a character from a photo</b><small>For grown-ups · about ten minutes</small></span>
        <span class="guide-open"><span class="when-shut">Show me how</span><span class="when-open">Hide</span></span>
      </summary>
      <div class="guide-body">
        <p>Jazz's character was made this way, with ${gemini}.</p>
        <ol>
          <li>Open ${gemini} and sign in.</li>
          <li>Attach a clear, well-lit photo of your child, facing the camera.</li>
          <li>Paste this and send it:
            <div class="prompt"><p>${FIRST}</p><button type="button" class="quiet copy" data-copy="first">${ICONS.copy}<span>Copy</span></button></div>
          </li>
          <li>Not quite them? Say what is off, in plain words: "make the skin a few shades lighter", "the hair is longer", "keep the first one, but more playful". Small changes to a picture you like work better than starting again.</li>
          <li>Download the picture you like, then come back here and press <b>Add a character</b>.</li>
          <li>For more poses, attach that picture and paste:
            <div class="prompt"><p>${MORE}</p><button type="button" class="quiet copy" data-copy="more">${ICONS.copy}<span>Copy</span></button></div>
            Change the last sentence for other poses: ${POSE_IDEAS}.
          </li>
        </ol>
        <p class="guide-note">The flat magenta background is what lets this studio cut the character out neatly; any plain colour that is not on the character works, and magenta never is. When you use Gemini, the photo goes to Google. Nothing you add here leaves this device.</p>
      </div>
    </details>`;
}

/**
 * Turns pictures into characters, one at a time, and saves them. The first a
 * family ever adds becomes their character, since Jazz is about to leave the
 * list.
 */
async function addAll (files: File[], main: HTMLElement): Promise<void> {
  const status = main.querySelector<HTMLElement>('.char-status');
  const say = (t: string): void => { if (status) status.textContent = t; };
  const pictures = files.filter((f) => f.type.startsWith('image/'));
  if (!pictures.length) { say('That is not a picture. Try a PNG or a JPEG.'); return; }
  let added = 0;
  let failed = '';
  for (const [i, file] of pictures.entries()) {
    say(pictures.length > 1 ? `Cutting out ${i + 1} of ${pictures.length}...` : 'Cutting out the background...');
    try {
      const first = !hasOwn();
      const cut = await cutOut(file);
      const id = `c-${crypto.randomUUID()}`;
      const n = poses().filter((p) => p.own).length + 1;
      await saveOwn({ id, label: `Character ${n}`, added: Date.now(), ...cut });
      if (first) setLook({ pose: id });
      added++;
    } catch (err) {
      failed = err instanceof Error ? err.message : 'Could not use that picture.';
    }
  }
  if (added) refresh();
  if (failed) {
    // After the redraw, so the message is on the new page.
    const now = document.querySelector<HTMLElement>('.char-status');
    if (now) now.textContent = added ? `${added} added. One could not be used: ${failed}` : failed;
  }
}

let pasteTarget: HTMLElement | null = null;

// One listener for the whole page, pointed at whichever Character tab is open.
window.addEventListener('paste', (e) => {
  if (!pasteTarget || !document.body.contains(pasteTarget)) return;
  if ((e.target as HTMLElement | null)?.closest?.('input, textarea')) return;
  const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'));
  if (!files.length) return;
  e.preventDefault();
  void addAll(files, pasteTarget);
});

export function wireCharacterTab (main: HTMLElement): void {
  pasteTarget = main;
  const tile = main.querySelector<HTMLElement>('.char--add')!;
  main.querySelector<HTMLInputElement>('.char-file')?.addEventListener('change', (e) => {
    void addAll([...((e.target as HTMLInputElement).files ?? [])], main);
  });
  tile.addEventListener('dragover', (e) => { e.preventDefault(); tile.dataset.over = 'yes'; });
  tile.addEventListener('dragleave', () => { delete tile.dataset.over; });
  tile.addEventListener('drop', (e) => {
    e.preventDefault();
    delete tile.dataset.over;
    void addAll([...(e.dataTransfer?.files ?? [])], main);
  });

  main.querySelectorAll<HTMLButtonElement>('[data-choose]').forEach((b) =>
    b.addEventListener('click', () => { setLook({ pose: b.dataset.choose! }); refresh(); }));

  main.querySelector<HTMLInputElement>('.keep-jazz')?.addEventListener('change', (e) => {
    const on = (e.target as HTMLInputElement).checked;
    setLook({ keepJazz: on });
    setKeepJazz(on);
    refresh();
  });

  main.querySelectorAll<HTMLButtonElement>('[data-nudge]').forEach((b) => b.addEventListener('click', async () => {
    await nudgeOwn(b.dataset.nudge!, { dy: Number(b.dataset.dy || 0), zoom: Number(b.dataset.zoom || 0) });
    refresh();
  }));

  main.querySelectorAll<HTMLInputElement>('[data-rename]').forEach((input) => input.addEventListener('change', async () => {
    await renameOwn(input.dataset.rename!, input.value);
    refresh();
  }));

  main.querySelectorAll<HTMLButtonElement>('[data-drop]').forEach((b) => b.addEventListener('click', async () => {
    // Two taps, so a character is never lost to one slip.
    if (b.dataset.sure !== 'yes') {
      b.dataset.sure = 'yes';
      b.title = 'Tap again to remove';
      return;
    }
    await removeOwn(b.dataset.drop!);
    refresh();
  }));

  main.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const text = b.dataset.copy === 'first' ? FIRST : MORE;
    const label = b.querySelector('span')!;
    try {
      await navigator.clipboard.writeText(text);
      label.textContent = 'Copied';
    } catch {
      // No clipboard here (inside Sukhi Play, for one): select the words instead.
      const p = b.previousElementSibling;
      if (p) getSelection()?.selectAllChildren(p);
      label.textContent = 'Selected: copy it now';
    }
  }));
}
