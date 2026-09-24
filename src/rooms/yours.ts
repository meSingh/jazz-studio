/**
 * Make it yours, in three tabs:
 *
 *   Character and name   who they are in the studio, the two things that make
 *                        it theirs (see characters.ts)
 *   Look of the studio   colours, lettering and background, as three equal
 *                        parts rather than colours with two footnotes
 *   Start again          on its own, because it is a big decision: what goes
 *                        back, what is kept, and a question before anything
 *
 * Everything that belongs to one sheet (which character goes on it, its
 * pattern) is in that sheet's tool, where it is used. The tabs are addresses
 * (#/yours/look and so on), so Back works and a grown-up can be sent straight
 * to one.
 */
import { look, setLook, useScheme, reset, SCHEMES, LETTERING, BACKDROPS, type Backdrop, type Lettering } from '../look';
import { ICONS } from '../icons';
import { esc, heading, colourBar, wireColours, wireChoice, refresh, confirmBox } from '../ui';
import { characterTab, wireCharacterTab } from './characters';
import { backdropPreview } from '../backdrops';

export const TABS = [
  { id: 'character', label: 'Character and name' },
  { id: 'look', label: 'Look of the studio' },
  { id: 'again', label: 'Start again' }
] as const;

export function yoursRoom (main: HTMLElement, sub: string): void {
  const tab = TABS.find((t) => t.id === sub)?.id ?? 'character';
  const nav = `<nav class="tabs" aria-label="Make it yours">${TABS.map((t) =>
    `<a class="tab${t.id === 'again' ? ' tab--again' : ''}" href="#/yours/${t.id}" ${t.id === tab ? 'aria-current="page"' : ''}>${t.label}</a>`).join('')}</nav>`;

  if (tab === 'character') {
    main.innerHTML = nav + characterTab();
    wireCharacterTab(main);
  } else if (tab === 'look') {
    lookTab(main, nav);
  } else {
    againTab(main, nav);
  }
}

function lookTab (main: HTMLElement, nav: string): void {
  const l = look();
  const colour = (key: 'paper' | 'ink' | 'accent' | 'accent2', label: string): string =>
    `<label class="colour"><input type="color" data-colour="${key}" value="${l[key]}"><span>${label}</span></label>`;
  main.innerHTML = `${nav}<div class="looks">
    <section class="card look-part">
      ${heading('Colours')}
      <p class="hint">A set to start from, then any colour you like.</p>
      <div class="schemes" role="radiogroup" aria-label="Colour sets">${SCHEMES.map((s) =>
        `<button type="button" class="scheme" role="radio" data-set="${s.id}" aria-checked="${s.id === l.scheme}" style="--p:${s.paper};--i:${s.ink}">` +
        `<span class="scheme-card"><i style="background:${s.accent}"></i><i style="background:${s.accent2}"></i><b>Aa</b></span>` +
        `<span>${s.label}</span></button>`).join('')}</div>
      ${colourBar(false, false)}
      <div class="colours">
        ${colour('paper', 'Background')}${colour('ink', 'Writing')}${colour('accent', 'Main')}${colour('accent2', 'Second')}
      </div>
    </section>

    <section class="card look-part">
      ${heading('Lettering')}
      <p class="hint">How your name and your words look, on the screen and on everything you print.</p>
      <div class="letterings" role="radiogroup" aria-label="Lettering">${(Object.keys(LETTERING) as Lettering[]).map((k) =>
        `<button type="button" class="lettering" role="radio" data-lettering="${k}" aria-checked="${k === l.lettering}" style="font-family:${LETTERING[k].stack.replace(/"/g, "'")};font-weight:${LETTERING[k].weight}">` +
        `<span class="lettering-sample">${esc(l.name)}</span><span class="lettering-name">${LETTERING[k].label}</span></button>`).join('')}</div>
    </section>

    <section class="card look-part">
      ${heading('Background')}
      <p class="hint">What is behind everything in the studio.</p>
      <div class="backdrops" role="radiogroup" aria-label="Background">${BACKDROPS.map((b) =>
        `<button type="button" class="backdrop" role="radio" data-backdrop="${b.id}" aria-checked="${b.id === l.backdrop}">` +
        `<span class="backdrop-view">${backdropPreview(b.id, l)}</span><span>${b.label}</span></button>`).join('')}</div>
    </section>
  </div>`;

  wireChoice(main, 'set', (id) => { useScheme(id); refresh(); });
  wireChoice(main, 'lettering', (k) => { setLook({ lettering: k as Lettering }); refresh(); });
  wireChoice(main, 'backdrop', (b) => { setLook({ backdrop: b as Backdrop }); refresh(); });
  wireColours(main);
  main.querySelectorAll<HTMLInputElement>('[data-colour]').forEach((input) => {
    input.addEventListener('input', () => setLook({ [input.dataset.colour!]: input.value, scheme: 'own' }));
    input.addEventListener('change', refresh);
  });
}

/** What Start again puts back, and what it leaves alone. Said here and in the question. */
const GOES_BACK = [
  'Your name, back to Jazz',
  'Which character is yours',
  'The studio\'s colours, lettering and background',
  'Your logo: its name, words and style'
];
const KEPT = [
  'Everything in My makes, and your doodles',
  'Your own characters',
  'What you last made in each tool'
];

function againTab (main: HTMLElement, nav: string): void {
  main.innerHTML = `${nav}<section class="card card--narrow again">
    <div class="again-art">${ICONS.reset}</div>
    <h2>Start again</h2>
    <p>Puts the studio back how it was the first time it opened. Worth thinking about first: there is no undo.</p>
    <div class="again-lists">
      <div><h3>Goes back to the start</h3><ul>${GOES_BACK.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      <div><h3>Is kept</h3><ul>${KEPT.map((x) => `<li>${x}</li>`).join('')}</ul></div>
    </div>
    <button type="button" class="go go--danger again-go">${ICONS.reset}<span>Start again</span></button>
  </section>`;

  main.querySelector('.again-go')!.addEventListener('click', async () => {
    const yes = await confirmBox({
      title: 'Start again?',
      art: `<span class="ask-icon">${ICONS.reset}</span>`,
      body: `<p>These go back to how they started:</p><ul>${GOES_BACK.map((x) => `<li>${x}</li>`).join('')}</ul>
        <p>Your makes, doodles and your own characters are kept. There is no undo.</p>`,
      yes: 'Start again'
    });
    if (!yes) return;
    reset();
    location.hash = '#/';
  });
}
