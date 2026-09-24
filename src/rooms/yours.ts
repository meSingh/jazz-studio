/**
 * Make it yours: who their character is, their name, and how the studio looks.
 *
 * Three tabs, so a parent and a child each see one thing at a time, with the
 * character first because it is what makes the studio theirs. Everything that
 * belongs to one sheet (which character goes on it, its pattern, its colours
 * and its lettering) is in that sheet's tool, where it is used, not here.
 *
 * The tabs are addresses (#/yours/name and so on), so Back works and a
 * grown-up can be sent straight to one.
 */
import { look, setLook, useScheme, reset, SCHEMES, BACKDROPS, type Backdrop } from '../look';
import { esc, field, heading, colourBar, wireColours, wireChoice, refresh } from '../ui';
import { characterTab, wireCharacterTab } from './characters';

export const TABS = [
  { id: 'character', label: 'Character' },
  { id: 'name', label: 'Name' },
  { id: 'look', label: 'Colours and background' }
] as const;

export function yoursRoom (main: HTMLElement, sub: string): void {
  const tab = TABS.find((t) => t.id === sub)?.id ?? 'character';
  const nav = `<nav class="tabs" aria-label="Make it yours">${TABS.map((t) =>
    `<a class="tab" href="#/yours/${t.id}" ${t.id === tab ? 'aria-current="page"' : ''}>${t.label}</a>`).join('')}</nav>`;

  if (tab === 'character') {
    main.innerHTML = nav + characterTab();
    wireCharacterTab(main);
  } else if (tab === 'name') {
    nameTab(main, nav);
  } else {
    lookTab(main, nav);
  }
}

function nameTab (main: HTMLElement, nav: string): void {
  const l = look();
  main.innerHTML = `${nav}<section class="card card--narrow">
    ${heading('Your name')}
    ${field('What should the studio call you?', `<input class="name" maxlength="20" value="${esc(l.name)}">`)}
    <p class="hint">It says hello with it, and puts it on your stickers, labels and diary.</p>
    <p class="name-preview">Hi <b>${esc(l.name)}</b></p>
  </section>`;
  const name = main.querySelector<HTMLInputElement>('.name')!;
  name.addEventListener('input', () => { main.querySelector('.name-preview b')!.textContent = name.value || 'Jazz'; });
  name.addEventListener('change', () => { setLook({ name: name.value.trim() || 'Jazz' }); refresh(); });
}

function lookTab (main: HTMLElement, nav: string): void {
  const l = look();
  const colour = (key: 'paper' | 'ink' | 'accent' | 'accent2', label: string): string =>
    `<label class="colour"><input type="color" data-colour="${key}" value="${l[key]}"><span>${label}</span></label>`;
  main.innerHTML = `${nav}<div class="yours">
    <section class="card card--wide">
      ${heading('The studio\'s colours')}
      <div class="schemes" role="radiogroup" aria-label="Colour sets">${SCHEMES.map((s) =>
        `<button type="button" class="scheme" role="radio" data-set="${s.id}" aria-checked="${s.id === l.scheme}" style="--p:${s.paper};--i:${s.ink}">` +
        `<span class="scheme-card"><i style="background:${s.accent}"></i><i style="background:${s.accent2}"></i><b>Aa</b></span>` +
        `<span>${s.label}</span></button>`).join('')}</div>
      <p class="hint">Or pick any colour, and the lettering</p>
      ${colourBar(false)}
      <div class="colours">
        ${colour('paper', 'Background')}${colour('ink', 'Writing')}${colour('accent', 'Main')}${colour('accent2', 'Second')}
      </div>
    </section>
    <section class="card">
      ${heading('Studio background')}
      <div class="chips" role="radiogroup" aria-label="Background">${BACKDROPS.map((b) =>
        `<button type="button" class="chip" role="radio" data-backdrop="${b.id}" aria-checked="${b.id === l.backdrop}">${b.label}</button>`).join('')}</div>
    </section>
    <section class="card">
      ${heading('Start again')}
      <p class="hint">Colours, name and character back to how they started. Your makes and your own characters are kept.</p>
      <button type="button" class="quiet reset"><span>Put everything back how it started</span></button>
    </section>
  </div>`;

  wireChoice(main, 'set', (id) => { useScheme(id); refresh(); });
  wireChoice(main, 'backdrop', (b) => { setLook({ backdrop: b as Backdrop }); refresh(); });
  wireColours(main);
  main.querySelectorAll<HTMLInputElement>('[data-colour]').forEach((input) => {
    input.addEventListener('input', () => setLook({ [input.dataset.colour!]: input.value, scheme: 'own' }));
    input.addEventListener('change', refresh);
  });
  const again = main.querySelector<HTMLButtonElement>('.reset')!;
  again.addEventListener('click', () => {
    // Two taps, so a whole set of choices is never lost to one slip.
    if (again.dataset.sure !== 'yes') {
      again.dataset.sure = 'yes';
      again.querySelector('span')!.textContent = 'Tap again to put everything back';
      return;
    }
    reset();
    refresh();
  });
}
