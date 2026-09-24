/**
 * Make it yours: every choice about how the studio looks, in one place.
 *
 * The colour strip is in every tool too; this is the long version, with the
 * things that are not about one sheet: her name, which pose greets her,
 * which one goes on her stationery, her lettering and the studio background.
 */
import { look, setLook, useScheme, reset, SCHEMES, LETTERING, BACKDROPS, type Lettering, type Backdrop } from '../look';
import type { PoseId } from '../character';
import { esc, field, heading, colourBar, wireColours, patternPicker, wirePatterns, posePicker, wireChoice, refresh } from '../ui';

export function yoursRoom (main: HTMLElement): void {
  const l = look();
  const colour = (key: 'paper' | 'ink' | 'accent' | 'accent2', label: string): string =>
    `<label class="colour"><input type="color" data-colour="${key}" value="${l[key]}"><span>${label}</span></label>`;
  main.innerHTML = `<div class="yours">
    <section class="card card--wide">
      ${heading('Your character')}
      <p class="hint">Who says hello when you open the studio</p>
      ${posePicker(l.greeter, false, 'greeter')}
      <p class="hint">Who goes on your stickers, labels and diary</p>
      ${posePicker(l.pose, false, 'main-pose')}
    </section>
    <section class="card">
      ${heading('Your name')}
      ${field('What should the studio call you?', `<input class="name" maxlength="20" value="${esc(l.name)}">`)}
    </section>
    <section class="card">
      ${heading('Your lettering')}
      <div class="letterings" role="radiogroup" aria-label="Lettering">${(Object.keys(LETTERING) as Lettering[]).map((k) =>
        `<button type="button" class="lettering" role="radio" data-lettering="${k}" aria-checked="${k === l.lettering}" style="font-family:${LETTERING[k].stack.replace(/"/g, "'")};font-weight:${LETTERING[k].weight}">` +
        `<span class="lettering-sample">${esc(l.name)}</span><span class="lettering-name">${LETTERING[k].label}</span></button>`).join('')}</div>
    </section>
    <section class="card card--wide">
      ${heading('Your colours')}
      <div class="schemes" role="radiogroup" aria-label="Colour sets">${SCHEMES.map((s) =>
        `<button type="button" class="scheme" role="radio" data-set="${s.id}" aria-checked="${s.id === l.scheme}" style="--p:${s.paper};--i:${s.ink}">` +
        `<span class="scheme-card"><i style="background:${s.accent}"></i><i style="background:${s.accent2}"></i><b>Aa</b></span>` +
        `<span>${s.label}</span></button>`).join('')}</div>
      <p class="hint">Or pick any colour</p>
      ${colourBar(false)}
      <div class="colours">
        ${colour('paper', 'Background')}${colour('ink', 'Writing')}${colour('accent', 'Main')}${colour('accent2', 'Second')}
      </div>
    </section>
    <section class="card">
      ${heading('Favourite pattern')}
      ${patternPicker()}
    </section>
    <section class="card">
      ${heading('Studio background')}
      <div class="chips" role="radiogroup" aria-label="Background">${BACKDROPS.map((b) =>
        `<button type="button" class="chip" role="radio" data-backdrop="${b.id}" aria-checked="${b.id === l.backdrop}">${b.label}</button>`).join('')}</div>
      ${heading('Start again')}
      <button type="button" class="quiet reset"><span>Put everything back how it started</span></button>
    </section>
  </div>`;

  const name = main.querySelector<HTMLInputElement>('.name')!;
  name.addEventListener('change', () => { setLook({ name: name.value.trim() || 'Jazz' }); refresh(); });
  wireChoice(main, 'greeter', (p) => { setLook({ greeter: p as PoseId }); refresh(); });
  wireChoice(main, 'main-pose', (p) => { setLook({ pose: p as PoseId }); refresh(); });
  wireChoice(main, 'set', (id) => { useScheme(id); refresh(); });
  wireChoice(main, 'lettering', (k) => { setLook({ lettering: k as Lettering }); refresh(); });
  wireChoice(main, 'backdrop', (b) => { setLook({ backdrop: b as Backdrop }); refresh(); });
  wireColours(main);
  wirePatterns(main);
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
