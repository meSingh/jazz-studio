/**
 * My brand: Jazz's own logo, and the things that carry it.
 *
 * She asked for more branding on her diary. This is where the brand comes
 * from: a name, a line under it, a style, and her face or her initial. The
 * logo it makes goes on her diary cover, letter paper and business cards.
 */
import { look, setLook, type LogoStyle } from '../look';
import { logoSvg, LOGO_STYLES } from '../brand';
import { BRAND_KINDS } from '../sheets';
import { esc, field, heading, wireChoice, posePicker, remembered, refresh } from '../ui';
import { bench, type BenchState } from './bench';

const state = remembered<BenchState>('jazz-studio-brand-bench', { kind: 'cards', me: true, pose: 'portrait', words: {} });

export function brandRoom (main: HTMLElement): void {
  const l = look();
  const b = l.brand;
  const top = `<section class="brand-maker">
    <div class="brand-preview">${logoSvg(l, 'brand-logo')}</div>
    <div class="brand-controls">
      ${heading('Your logo')}
      <div class="chips" role="radiogroup" aria-label="Logo style">${LOGO_STYLES.map((s) =>
        `<button type="button" class="chip" role="radio" data-logo="${s.id}" aria-checked="${s.id === b.style}">${s.label}</button>`).join('')}</div>
      <div class="brand-fields">
        ${field('Name', `<input class="b-name" maxlength="24" value="${esc(b.name)}">`)}
        ${field('The line under it', `<input class="b-tag" maxlength="36" value="${esc(b.tagline)}">`)}
      </div>
      <div class="chips" role="radiogroup" aria-label="In the middle">
        <button type="button" class="chip" role="radio" data-middle="me" aria-checked="${b.me}">Me in the middle</button>
        <button type="button" class="chip" role="radio" data-middle="letter" aria-checked="${!b.me}">My initial</button>
      </div>
      ${b.me ? posePicker(b.pose ?? l.pose, false, 'logo-pose') : ''}
      <p class="hint">Your logo goes on your diary cover, letter paper and business cards.</p>
    </div>
  </section>`;
  bench(main, BRAND_KINDS, state, top);

  wireChoice(main, 'logo', (s) => { setLook({ brand: { ...look().brand, style: s as LogoStyle } }); refresh(); });
  wireChoice(main, 'middle', (m) => { setLook({ brand: { ...look().brand, me: m === 'me' } }); refresh(); });
  wireChoice(main, 'logo-pose', (p) => { setLook({ brand: { ...look().brand, pose: p } }); refresh(); });
  const text = (sel: string, key: 'name' | 'tagline'): void => {
    const input = main.querySelector<HTMLInputElement>(sel)!;
    input.addEventListener('change', () => { setLook({ brand: { ...look().brand, [key]: input.value.trim() } }); refresh(); });
    // The logo follows as she types; the sheet catches up when she finishes.
    input.addEventListener('input', () => {
      setLook({ brand: { ...look().brand, [key]: input.value } });
      main.querySelector('.brand-preview')!.innerHTML = logoSvg(look(), 'brand-logo');
    });
  };
  text('.b-name', 'name');
  text('.b-tag', 'tagline');
}
