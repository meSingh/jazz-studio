/**
 * The welcome: the first time the studio opens, before Home, two questions.
 *
 *   1. What is your name?         so Home says hello to them, not to Jazz
 *   2. Who is your character?     Jazz, Sukhi, or one of their own
 *
 * Either can be skipped, and both can be changed later in Make it yours.
 * Skipping the name leaves it empty ("Hi there"); skipping the character
 * keeps Jazz's. Someone already using the studio never sees this (see load in
 * look.ts), and Start again brings it back, since that is the studio as it
 * was the first time.
 *
 * Their own character comes the same ways as in Make it yours: chosen, dropped
 * or pasted, since inside Sukhi Play no page can open a file browser.
 */
import { look, setLook } from '../look';
import { JAZZ, SUKHI, img, loadOwn, useSets } from '../character';
import { ICONS } from '../icons';
import { esc, inSukhiPlay } from '../ui';
import { addAll } from './characters';

const key = /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd+V' : 'Ctrl+V';

/** Whether to show the welcome instead of Home. */
export const needsWelcome = (): boolean => !look().welcomed;

let pasteInto: HTMLElement | null = null;
window.addEventListener('paste', (e) => {
  if (!pasteInto || !document.body.contains(pasteInto)) return;
  if ((e.target as HTMLElement | null)?.closest?.('input, textarea')) return;
  const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'));
  if (!files.length) return;
  e.preventDefault();
  void own(files, pasteInto);
});

/** Done: what they chose, and Home. The logo takes their name while it is still the default one. */
function finish (change: Parameters<typeof setLook>[0]): void {
  const l = look();
  const name = (change.name ?? l.name).trim();
  const brand = name && l.brand.name === 'My Studio' ? { ...l.brand, name: `${name} Studio` } : l.brand;
  setLook({ ...change, brand, welcomed: true });
  useSets(look());
  location.hash = '#/';
  // Already on Home: the hash did not change, so draw it.
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function welcomeRoom (main: HTMLElement, step = 1, name = ''): void {
  if (step === 1) {
    main.innerHTML = `<section class="welcome">
      <p class="welcome-step">1 of 2</p>
      <img class="welcome-mark" src="./brand-mark.png" alt="" width="120" height="120">
      <h2>Welcome to the studio</h2>
      <p class="welcome-say">Stickers, labels, a diary and more, with your name and your character on them. First, what should we call you?</p>
      <form class="welcome-form">
        <label class="field"><span>Your name</span><input class="w-name" maxlength="20" autocomplete="given-name" value="${esc(name)}" placeholder="Your name"></label>
        <button type="submit" class="go">Next</button>
      </form>
      <button type="button" class="quiet welcome-skip" data-skip="name">Skip</button>
    </section>`;
    const input = main.querySelector<HTMLInputElement>('.w-name')!;
    input.focus();
    main.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      welcomeRoom(main, 2, input.value.trim());
    });
    main.querySelector('[data-skip]')!.addEventListener('click', () => welcomeRoom(main, 2, ''));
    return;
  }

  main.innerHTML = `<section class="welcome welcome--wide">
      <p class="welcome-step">2 of 2</p>
      <h2>${name ? `Hi ${esc(name)}! ` : ''}Who is your character?</h2>
      <p class="welcome-say">They say hello when you open the studio, and go on the things you make. You can change them any time.</p>
      <div class="welcome-picks">
        <button type="button" class="welcome-pick" data-set="jazz">
          <span class="welcome-pic">${img('hello', 'welcome-img')}</span>
          <b>Jazz</b><small>${JAZZ.length} characters</small>
        </button>
        <button type="button" class="welcome-pick" data-set="sukhi">
          <span class="welcome-pic">${img(SUKHI[0].id, 'welcome-img')}</span>
          <b>Sukhi</b><small>${SUKHI.length} characters</small>
        </button>
        <label class="welcome-pick welcome-pick--own" tabindex="0">
          ${inSukhiPlay ? '' : '<input type="file" accept="image/*" multiple class="w-file">'}
          <span class="welcome-pic welcome-plus">${ICONS.plus}</span>
          <b>My own</b><small>${inSukhiPlay ? `Copy a picture, then press ${key}` : `Choose a picture or photo, drop one here, or press ${key}`}</small>
        </label>
      </div>
      <p class="hint char-status" role="status"></p>
      <p class="welcome-more">No picture yet? <a href="#/yours/character" class="w-how">See how to make one</a>, or skip and use Jazz's for now.</p>
      <button type="button" class="quiet welcome-skip" data-skip="character">Skip</button>
    </section>`;

  main.querySelectorAll<HTMLButtonElement>('[data-set]').forEach((b) => b.addEventListener('click', () => {
    const set = b.dataset.set as 'jazz' | 'sukhi';
    finish({ name, sets: { jazz: set === 'jazz', sukhi: set === 'sukhi' }, pose: set === 'jazz' ? 'hello' : SUKHI[0].id });
  }));
  main.querySelector('[data-skip]')!.addEventListener('click', () =>
    finish({ name, sets: { jazz: true, sukhi: false }, pose: 'hello' }));
  // Straight to the guide in Make it yours, which has the ways to make one.
  main.querySelector('.w-how')!.addEventListener('click', () => {
    setLook({ name, welcomed: true, sets: { jazz: true, sukhi: false } });
  });

  const tile = main.querySelector<HTMLElement>('.welcome-pick--own')!;
  tile.dataset.name = name;
  pasteInto = tile;
  main.querySelector<HTMLInputElement>('.w-file')?.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    void own([...(input.files ?? [])], tile);
    input.value = '';
  });
  tile.addEventListener('dragover', (e) => { e.preventDefault(); tile.dataset.over = 'yes'; });
  tile.addEventListener('dragleave', () => { delete tile.dataset.over; });
  tile.addEventListener('drop', (e) => {
    e.preventDefault();
    delete tile.dataset.over;
    void own([...(e.dataTransfer?.files ?? [])], tile);
  });
}

/** Their own picture, kept the same way as in Make it yours, becomes their character. */
async function own (files: File[], tile: HTMLElement): Promise<void> {
  const main = tile.closest('main') as HTMLElement;
  // Only theirs in the list to start with; Jazz's and Sukhi's can be switched on later.
  setLook({ sets: { jazz: false, sukhi: false } });
  useSets(look());
  const added = await addAll(files, main, true);
  if (!added) {
    // Nothing kept (cancelled, or not a picture): as they were.
    setLook({ sets: { jazz: true, sukhi: false } });
    useSets(look());
    return;
  }
  await loadOwn();
  finish({ name: tile.dataset.name ?? '' });
}
