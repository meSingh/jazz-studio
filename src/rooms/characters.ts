/**
 * The Character and name tab of Make it yours: who their character is, and
 * what the studio calls them. The two things that make it theirs, together.
 *
 * One list, one choice. The character they tap is theirs: it says hello on
 * Home and is where every tool starts. A tool can put another on a sheet; that
 * choice stays in the tool, where it is needed.
 *
 * A family adds their own by choosing a picture, dropping one on the tile, or
 * pasting one. Paste and drop matter because inside Sukhi Play no page may
 * open a file browser, so there a grown-up copies the picture and presses
 * Ctrl+V (Cmd+V on a Mac). Each picture is then offered two ways, side by
 * side, before anything is kept:
 *
 *   Cut out        the background taken away (cutout.ts), for a character
 *                  drawn or photographed on one plain colour
 *   Keep the photo the picture whole, the face framed in a circle, for a photo
 *                  taken anywhere
 *
 * Nothing is sent anywhere. Their own can be renamed, nudged, and removed,
 * after a question that says what removing it will change.
 *
 * The guide gives three ways to make a character, quickest first. Gemini
 * often refuses to change photos of real children, so describing the child in
 * words comes before uploading a photo, and says why.
 */
import { look, setLook } from '../look';
import {
  poses, pose, img, faceImg, saveOwn, removeOwn, nudgeOwn, renameOwn, people, setsNow, isOn, setOn, personOf, ownPoses
} from '../character';
import { cutOut, photoOf, type Cut } from '../cutout';
import { ICONS } from '../icons';
import { esc, refresh, inSukhiPlay, confirmBox } from '../ui';

const DESCRIBE = 'Create a 3D animated-film character, like one from a family animated film: soft and rounded, ' +
  'friendly, with big expressive eyes. The character is a [age]-year-old [girl or boy] with [skin tone] skin, ' +
  '[hair colour, length and style] hair and [eye colour] eyes, wearing [clothes]. Show them from the waist up, ' +
  'facing forward and smiling, with the whole head and both hands in the picture and some space around the ' +
  'edges. Background: one flat, plain magenta colour (#FF00FF) filling the whole picture, with no shadow, no ' +
  'gradient and no glow. No text.';

const FROM_PHOTO = 'Turn the child in the attached photo into a 3D animated-film character, like one from a ' +
  'family animated film: soft and rounded, friendly, with big expressive eyes. Keep their real likeness: ' +
  'the shape of their face, their skin tone, their hair and how they wear it, and what they are wearing. ' +
  'Show them from the waist up, facing forward and smiling, with the whole head and both hands in the ' +
  'picture and some space around the edges. Background: one flat, plain magenta colour (#FF00FF) filling ' +
  'the whole picture, with no shadow, no gradient and no glow. No text.';

const MORE = 'Using the attached character, make the same character again: the identical face, hair, skin ' +
  'tone and clothes, in the same style, on the same flat magenta (#FF00FF) background, waist up. This time ' +
  'they are waving hello with a big smile.';

const PROMPTS: Record<string, string> = { describe: DESCRIBE, photo: FROM_PHOTO, more: MORE };

const POSE_IDEAS = 'holding a pencil and a sketchbook · pointing up with a big idea · winking with a thumbs up · arms crossed, looking cool';

const GEMINI = 'https://gemini.google.com/';

/** A family's character from before they could be named ("Character 2"), or never named: theirs. */
const unnamedLabel = (label: string): boolean => !label.trim() || /^Character \d+$/.test(label.trim());

const key = /Mac|iPhone|iPad/.test(navigator.platform) ? 'Cmd+V' : 'Ctrl+V';

const prompt = (id: string): string =>
  `<div class="prompt"><p>${PROMPTS[id]}</p><button type="button" class="quiet copy" data-copy="${id}">${ICONS.copy}<span>Copy</span></button></div>`;

/** What a new picture of this person is called: nothing for yours, otherwise their name. */
const labelFor = (key: string, name: string): string => (key === 'me' ? '' : name);

export function characterTab (): string {
  const l = look();
  const mine = pose(l.pose);
  const everyone = people(l, true);
  const addHow = inSukhiPlay
    ? `Copy a picture, then press ${key} here`
    : `Choose a picture or a photo, drop one here, or copy one and press ${key}`;
  // Inside Sukhi Play a link cannot leave the locked screen, so the address is
  // written out for a grown-up to open on another device.
  const gemini = inSukhiPlay
    ? '<b>gemini.google.com</b> on another device'
    : `<a class="out" href="${GEMINI}" target="_blank" rel="noopener">Google Gemini</a>`;

  return `<section class="me-hero">
      <div class="me-now">${img(mine.id, 'me-now-img')}</div>
      <div class="me-say">
        <h2 class="me-hello">Hi <b>${esc(l.name.trim() || 'there')}</b></h2>
        <label class="field me-name"><span>Your name</span><input class="name" maxlength="20" value="${esc(l.name)}"></label>
        <p>Your character says hello when you open the studio, and goes on your stickers, labels and diary. Tap another below to change it.</p>
      </div>
    </section>

    <section class="card card--wide">
      <div class="charsets" role="group" aria-label="Characters">
        <span class="charsets-say">Characters</span>
        ${everyone.map((g) => {
          const on = isOn(g.key);
          // The last one on stays on: the list is never empty.
          const last = on && everyone.filter((x) => isOn(x.key)).length === 1;
          return `<label class="charset${on ? ' charset--on' : ''}"><input type="checkbox" data-person-on="${esc(g.key)}" ${on ? 'checked' : ''} ${last ? 'disabled' : ''}>` +
            `${faceImg(g.poses[0].id, 'set-face')}<span><b>${esc(g.name)}</b><small>${g.poses.length} ${g.poses.length === 1 ? 'picture' : 'pictures'}</small></span></label>`;
        }).join('')}
      </div>
      <p class="hint">Switch someone off to take them out of every picker, without losing their pictures.</p>
      ${people(l).map((g) => {
        const own = g.poses.some((p) => p.own) && g.key !== 'jazz' && g.key !== 'sukhi';
        return `<div class="person">
        <div class="person-head">
          ${own
            ? `<input class="person-name-edit" data-rename-person="${esc(g.key)}" value="${esc(g.name)}" maxlength="20" placeholder="${esc(l.name.trim() || 'Your name')}" aria-label="Name">`
            : `<h3 class="person-name">${esc(g.name)}</h3>`}
          ${g.key === 'me' || (l.name && g.name === l.name) ? '<small class="person-you">you</small>' : ''}
        </div>
        <div class="chars" role="radiogroup" aria-label="${esc(g.name)}">
        ${g.poses.map((p) => `<figure class="char${p.own ? ' char--own' : ''}${p.id === mine.id ? ' char--mine' : ''}">
          <button type="button" class="char-pick" role="radio" data-choose="${p.id}" aria-checked="${p.id === mine.id}" aria-label="${esc(p.label || g.name)}">
            ${faceImg(p.id, 'char-face')}
            ${p.id === mine.id ? '<span class="char-badge">Yours</span>' : ''}
          </button>
          ${p.own
            ? `<div class="char-tools">
                 <button type="button" class="mini" data-nudge="${p.id}" data-dy="-0.06" title="Move the face up" aria-label="Move up">${ICONS.up}</button>
                 <button type="button" class="mini" data-nudge="${p.id}" data-dy="0.06" title="Move the face down" aria-label="Move down">${ICONS.down}</button>
                 <button type="button" class="mini" data-nudge="${p.id}" data-dx="-0.06" title="Move the face left" aria-label="Move left">${ICONS.left}</button>
                 <button type="button" class="mini" data-nudge="${p.id}" data-dx="0.06" title="Move the face right" aria-label="Move right">${ICONS.right}</button>
                 <button type="button" class="mini" data-nudge="${p.id}" data-zoom="0.88" title="Closer" aria-label="Closer">${ICONS.bigger}</button>
                 <button type="button" class="mini" data-nudge="${p.id}" data-zoom="1.14" title="Further away" aria-label="Further away">${ICONS.smaller}</button>
                 <button type="button" class="mini mini--bin" data-drop="${p.id}" title="Remove" aria-label="Remove">${ICONS.bin}</button>
               </div>`
            : `<figcaption>${esc(p.label)}</figcaption>`}
        </figure>`).join('')}
          <label class="char char--add char--more" tabindex="0" data-add-to="${esc(labelFor(g.key, g.name))}">
            ${inSukhiPlay ? '' : '<input type="file" accept="image/*" multiple class="char-file">'}
            <span class="char-plus">${ICONS.plus}</span>
            <b>Add a picture</b>
            <small>Another of ${esc(g.name || 'you')}</small>
          </label>
        </div>
      </div>`;
      }).join('')}
      <div class="chars chars--add">
        <label class="char char--add char--new" tabindex="0">
          ${inSukhiPlay ? '' : '<input type="file" accept="image/*" class="char-file">'}
          <span class="char-plus">${ICONS.person}</span>
          <b>Add a character</b>
          <small>${addHow}</small>
        </label>
        <p class="hint add-who">A new character is someone new: you, a brother or sister, or a friend. You give them a name, and then can add more pictures of them.</p>
      </div>
      <p class="hint char-status" role="status"></p>
    </section>

    <details class="guide">
      <summary>
        <span class="guide-icon">${ICONS.person}</span>
        <span class="guide-say"><b>Make a character of your own</b><small>For grown-ups · three ways, quickest first</small></span>
        <span class="guide-open"><span class="when-shut">Show me how</span><span class="when-open">Hide</span></span>
      </summary>
      <div class="guide-body">
        <div class="way">
          <h3><span class="way-n">1</span>Use a photo as it is</h3>
          <p>The quickest, and nothing leaves this device. Press <b>Add a character</b> and choose any photo of your child.
            Taken against a plain wall, the studio can cut them out; otherwise pick <b>Keep the photo</b>, and use the arrows
            under it to put the circle on their face.</p>
        </div>
        <div class="way">
          <h3><span class="way-n">2</span>Make a cartoon by describing them</h3>
          <p>Open ${gemini}, paste this, and fill in the words in square brackets. No photo is needed, so no photo goes to Google,
            and it is not refused the way a photo of a child can be.</p>
          ${prompt('describe')}
          <p>Download the picture you like, then press <b>Add a character</b> here and choose <b>Cut out</b>.</p>
        </div>
        <div class="way">
          <h3><span class="way-n">3</span>Make a cartoon from a photo</h3>
          <p>How Jazz's was made: attach a clear photo of your child in ${gemini} and paste this. Gemini sometimes refuses to change
            photos of children; if it does, use the second way instead. When you do this, the photo goes to Google.</p>
          ${prompt('photo')}
        </div>
        <div class="way">
          <h3><span class="way-n">+</span>More poses, and fixing one</h3>
          <p>For more poses of the same character, attach the one you made and paste this, changing the last sentence:
            ${POSE_IDEAS}.</p>
          ${prompt('more')}
          <p>Not quite right? Say what is off in plain words, like "make the skin a few shades lighter" or "the hair is longer".
            Small changes to a picture you like work better than starting again.</p>
        </div>
        <p class="guide-note">The flat magenta background is what lets the studio cut a character out neatly: any plain colour
          that is not on the character works, and magenta never is. Nothing you add here leaves this device.</p>
      </div>
    </details>`;
}

/* Adding ------------------------------------------------------------------ */

/**
 * Both ways of keeping one picture, side by side, for them to pick. The one
 * the studio thinks is right is marked, but the choice is theirs: a cut-out of
 * a photo with a busy background is a mess, and a photo of a cartoon drawn on
 * magenta is a pink square.
 */
function choose (cut: Cut | null, photo: Cut): Promise<Cut | null> {
  const cutUrl = cut ? URL.createObjectURL(cut.blob) : '';
  const photoUrl = URL.createObjectURL(photo.blob);
  // A cut that took away almost nothing had no plain background to take.
  const suggest = cut && cut.cleared > 0.15 ? 'cut' : 'photo';
  const ring = (c: Cut, w: number): string => {
    const k = w / c.w;
    const r = (c.d / 2) * k;
    return `<span class="how-ring" style="left:${(c.cx * k - r).toFixed(1)}px;top:${(c.cy * k - r).toFixed(1)}px;width:${(2 * r).toFixed(1)}px;height:${(2 * r).toFixed(1)}px"></span>`;
  };
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.className = 'ask how';
    d.innerHTML = `<h2>How should we use this picture?</h2>
      <div class="how-options">
        ${cut ? `<button type="button" class="how-option" data-how="cut">
          ${suggest === 'cut' ? '<span class="how-best">Looks best</span>' : ''}
          <span class="how-pic how-pic--cut"><img src="${cutUrl}" alt="" style="width:180px">${ring(cut, 180)}</span>
          <b>Cut out</b><small>The background taken away. For a character on a plain colour.</small>
        </button>` : ''}
        <button type="button" class="how-option" data-how="photo">
          ${suggest === 'photo' ? '<span class="how-best">Looks best</span>' : ''}
          <span class="how-pic"><img src="${photoUrl}" alt="" style="width:180px">${ring(photo, 180)}</span>
          <b>Keep the photo</b><small>The whole picture, the face in a circle. For a photo taken anywhere.</small>
        </button>
      </div>
      ${cut ? '' : '<p class="hint">The background could not be taken out of this one, so it keeps the photo.</p>'}
      <p class="hint">The ring is where the studio thinks the face is. You can move it afterwards.</p>
      <div class="ask-buttons"><button type="button" class="go go--ghost ask-no">Cancel</button></div>`;
    document.body.append(d);
    const done = (c: Cut | null): void => {
      d.close();
      d.remove();
      if (cutUrl) URL.revokeObjectURL(cutUrl);
      URL.revokeObjectURL(photoUrl);
      resolve(c);
    };
    d.querySelectorAll<HTMLButtonElement>('[data-how]').forEach((b) =>
      b.addEventListener('click', () => done(b.dataset.how === 'cut' ? cut : { ...photo, photo: true } as Cut)));
    d.querySelector('.ask-no')!.addEventListener('click', () => done(null));
    d.addEventListener('cancel', () => done(null));
    d.showModal();
  });
}

/**
 * Who a new character is: their name, or "It's me". Resolves to the name, ''
 * for the person using the studio, or null for cancel.
 */
function whoIs (picked: Cut): Promise<string | null> {
  const url = URL.createObjectURL(picked.blob);
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.className = 'ask who-is';
    const me = look().name.trim();
    d.innerHTML = `<div class="ask-art"><img class="ask-thumb" src="${url}" alt=""></div>
      <h2>Who is this?</h2>
      <div class="ask-body"><p>Their name goes with them: on their stickers, labels and tags, and in every list of characters.</p>
        <label class="field"><span>Name</span><input class="who-name" maxlength="20" placeholder="Their name"></label>
      </div>
      <div class="ask-buttons">
        <button type="button" class="go go--ghost who-me">It's me${me ? `, ${esc(me)}` : ''}</button>
        <button type="button" class="go who-go">Add them</button>
      </div>
      <button type="button" class="quiet who-cancel">Cancel</button>`;
    document.body.append(d);
    const input = d.querySelector<HTMLInputElement>('.who-name')!;
    const done = (v: string | null): void => { d.close(); d.remove(); URL.revokeObjectURL(url); resolve(v); };
    d.querySelector('.who-me')!.addEventListener('click', () => done(''));
    d.querySelector('.who-go')!.addEventListener('click', () => { if (input.value.trim()) done(input.value.trim()); else input.focus(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.value.trim()) done(input.value.trim()); });
    d.querySelector('.who-cancel')!.addEventListener('click', () => done(null));
    d.addEventListener('cancel', () => done(null));
    d.showModal();
    input.focus();
  });
}

/**
 * Turns pictures into characters, one at a time, asking how to keep each.
 * Adding one no longer takes Jazz out of the list: which ready-made sets are
 * in it is its own choice now, so a look from before that is made explicit
 * first, as it stood. From the welcome, the first becomes theirs (`mine`).
 * Returns how many were added.
 */
export async function addAll (files: File[], main: HTMLElement, mine = false, label?: string): Promise<number> {
  if (!look().sets) setLook({ sets: setsNow() });
  // A new character is a new person: asked their name once, after the first picture.
  let called = mine ? '' : label;
  const status = main.querySelector<HTMLElement>('.char-status');
  const say = (t: string): void => { if (status) status.textContent = t; };
  const pictures = files.filter((f) => f.type.startsWith('image/'));
  if (!pictures.length) { say('That is not a picture. Try a PNG or a JPEG.'); return 0; }
  let added = 0;
  let failed = '';
  for (const [i, file] of pictures.entries()) {
    say(pictures.length > 1 ? `Getting ${i + 1} of ${pictures.length} ready...` : 'Getting it ready...');
    try {
      const photo = await photoOf(file);
      let cut: Cut | null = null;
      try { cut = await cutOut(file); } catch { /* nothing left once cut: offer the photo only */ }
      // When the cut found the person, it knows where their face is, which
      // beats guessing the middle of the photo. Same scale, so only the trim
      // needs adding back.
      if (cut && cut.cleared > 0.05) {
        photo.cx = cut.cx + (cut.ox ?? 0);
        photo.cy = cut.cy + (cut.oy ?? 0);
        photo.d = cut.d;
      }
      say('');
      const picked = await choose(cut, photo);
      if (!picked) continue;
      if (called === undefined) {
        const answer = await whoIs(picked);
        if (answer === null) continue;
        called = answer;
      }
      const id = `c-${crypto.randomUUID()}`;
      const isPhoto = (picked as Cut & { photo?: boolean }).photo === true;
      // No name means theirs; anyone else's is given their name.
      await saveOwn({
        id, label: called ?? '', added: Date.now(), photo: isPhoto,
        blob: picked.blob, w: picked.w, h: picked.h, cx: picked.cx, cy: picked.cy, d: picked.d
      });
      if (mine && !added) setLook({ pose: id });
      added++;
    } catch (err) {
      failed = err instanceof Error ? err.message : 'Could not use that picture.';
    }
  }
  if (added && !mine) refresh();
  // After the redraw, so the message is on the new page.
  const now = document.querySelector<HTMLElement>('.char-status');
  if (now) now.textContent = failed ? (added ? `${added} added. One could not be used: ${failed}` : failed) : '';
  return added;
}

let pasteTarget: HTMLElement | null = null;
/** Whose picture a paste adds: a person's, after their Add a picture was tapped; otherwise a new character. */
let pasteFor: string | undefined;

// One listener for the whole page, pointed at whichever Character tab is open.
window.addEventListener('paste', (e) => {
  if (!pasteTarget || !document.body.contains(pasteTarget)) return;
  if ((e.target as HTMLElement | null)?.closest?.('input, textarea')) return;
  const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'));
  if (!files.length) return;
  e.preventDefault();
  const label = pasteFor;
  pasteFor = undefined;
  void addAll(files, pasteTarget, false, label);
});

export function wireCharacterTab (main: HTMLElement): void {
  pasteTarget = main;
  pasteFor = undefined;

  const name = main.querySelector<HTMLInputElement>('.name')!;
  name.addEventListener('input', () => { main.querySelector('.me-hello b')!.textContent = name.value.trim() || 'there'; });
  name.addEventListener('change', () => { setLook({ name: name.value.trim() }); refresh(); });

  // A new character, or another picture of someone: chosen, dropped, or pasted.
  main.querySelectorAll<HTMLElement>('.char--add').forEach((tile) => {
    const label = tile.classList.contains('char--new') ? undefined : tile.dataset.addTo ?? '';
    const add = (files: File[]): void => { void addAll(files, main, false, label); };
    tile.querySelector<HTMLInputElement>('.char-file')?.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      add([...(input.files ?? [])]);
      input.value = '';
    });
    tile.addEventListener('dragover', (e) => { e.preventDefault(); tile.dataset.over = 'yes'; });
    tile.addEventListener('dragleave', () => { delete tile.dataset.over; });
    tile.addEventListener('drop', (e) => {
      e.preventDefault();
      delete tile.dataset.over;
      add([...(e.dataTransfer?.files ?? [])]);
    });
    // Inside Sukhi Play there is no file browser: a tap says whose the next paste is.
    if (inSukhiPlay) {
      tile.addEventListener('click', () => {
        pasteFor = label;
        const status = main.querySelector<HTMLElement>('.char-status');
        if (status) status.textContent = label === undefined ? `Now copy a picture and press ${key} for the new character.` : `Now copy a picture and press ${key} to add it.`;
      });
    }
  });

  main.querySelectorAll<HTMLInputElement>('[data-person-on]').forEach((box) => box.addEventListener('change', () => {
    setOn(box.dataset.personOn!, box.checked);
    // Their own character goes with them: the first one left instead.
    if (!poses().some((p) => p.id === look().pose)) setLook({ pose: poses()[0].id });
    refresh();
  }));

  main.querySelectorAll<HTMLInputElement>('[data-rename-person]').forEach((input) => input.addEventListener('change', async () => {
    // Every picture of theirs takes the new name. As your own name, they are yours.
    const key = input.dataset.renamePerson!;
    const value = input.value.trim() === look().name.trim() ? '' : input.value.trim();
    for (const p of ownPoses().filter((x) => personOf(x) === key)) await renameOwn(p.id, value);
    refresh();
  }));

  main.querySelectorAll<HTMLButtonElement>('[data-choose]').forEach((b) =>
    b.addEventListener('click', () => { setLook({ pose: b.dataset.choose! }); refresh(); }));

  main.querySelectorAll<HTMLButtonElement>('[data-nudge]').forEach((b) => b.addEventListener('click', async () => {
    await nudgeOwn(b.dataset.nudge!, { dx: Number(b.dataset.dx || 0), dy: Number(b.dataset.dy || 0), zoom: Number(b.dataset.zoom || 0) });
    refresh();
  }));

  main.querySelectorAll<HTMLButtonElement>('[data-drop]').forEach((b) => b.addEventListener('click', async () => {
    const who = pose(b.dataset.drop!);
    const theirs = look().pose === who.id;
    const left = poses().filter((p) => p.id !== who.id);
    const next = left[0];
    const called = unnamedLabel(who.label) ? 'this character' : esc(who.label);
    const yes = await confirmBox({
      title: `Remove ${called}?`,
      art: faceImg(who.id),
      body: `<ul>
          <li>It comes off your character list, and off any sheet it was on.</li>
          ${theirs ? `<li>Your character becomes ${next ? esc(next.label || next.who || 'the next one') : 'Jazz'} instead.</li>` : ''}
          ${!left.length ? '<li>It is the last one, so Jazz\'s characters come back.</li>' : ''}
          <li>Anything you already printed stays as it is.</li>
        </ul>
        <p>This cannot be undone. To have it back, add the picture again.</p>`,
      yes: 'Remove'
    });
    if (!yes) return;
    await removeOwn(who.id);
    refresh();
  }));

  main.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const text = PROMPTS[b.dataset.copy!] ?? '';
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
