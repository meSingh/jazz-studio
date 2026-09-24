/**
 * My brand: a logo for each person, and the things that carry it.
 *
 * She asked for more branding on her diary. Every person has a brand: Jazz,
 * Sukhi, a friend, or you, each with a name, a line under it, a style, and
 * their picture or their initial. A diary with Sukhi on it carries Sukhi's
 * brand, and the diary says so and links here, to his; this is where a brand
 * is decided. Business cards and logo stickers are made from the brand chosen
 * at the top.
 */
import { look, type LogoStyle } from '../look';
import { logoSvg, LOGO_STYLES } from '../brand';
import { BRAND_KINDS, sheet } from '../sheets';
import { people, brandFor, setBrand, brandKeyFor, faceImg } from '../character';
import { esc, field, heading, wireChoice, posePicker, remembered, refresh } from '../ui';
import { bench, designFor, reopen, type BenchState, type SheetSettings } from './bench';
import { register } from '../prints';

const state = remembered<BenchState & { who?: string }>('jazz-studio-brand-bench', { kind: 'cards', me: true, pose: 'portrait', words: {} });

export function brandRoom (main: HTMLElement, sub = ''): void {
  // From a diary's "go to My brand": that person's brand.
  if (sub) state.set({ who: decodeURIComponent(sub) });
  const groups = people(look());
  const key = state.get().who ?? brandKeyFor(look().pose);
  const b = brandFor(key);
  // The logo is shown in the design of the sheet it is being made for.
  const l = { ...designFor(state, state.get().kind).get(), brand: b };
  const top = `<section class="brand-maker">
    <div class="brand-preview">${logoSvg(l, 'brand-logo')}</div>
    <div class="brand-controls">
      ${groups.length > 1 ? heading('Whose brand') + `<div class="chips whose" role="radiogroup" aria-label="Whose brand">${groups.map((g) =>
        `<button type="button" class="chip chip--who" role="radio" data-whose="${esc(g.key)}" aria-checked="${g.key === key}">${faceImg(g.poses[0].id, 'chip-face')}<span>${esc(g.name)}</span></button>`).join('')}</div>` : ''}
      ${heading('Logo')}
      <div class="chips" role="radiogroup" aria-label="Logo style">${LOGO_STYLES.map((s) =>
        `<button type="button" class="chip" role="radio" data-logo="${s.id}" aria-checked="${s.id === b.style}">${s.label}</button>`).join('')}</div>
      <div class="brand-fields">
        ${field('Name', `<input class="b-name" maxlength="24" value="${esc(b.name)}">`)}
        ${field('The line under it', `<input class="b-tag" maxlength="36" value="${esc(b.tagline)}">`)}
      </div>
      <div class="chips" role="radiogroup" aria-label="In the middle">
        <button type="button" class="chip" role="radio" data-middle="me" aria-checked="${b.me}">Picture in the middle</button>
        <button type="button" class="chip" role="radio" data-middle="letter" aria-checked="${!b.me}">Initial</button>
      </div>
      ${b.me ? posePicker(b.pose ?? l.pose, false, 'logo-pose') : ''}
      <p class="hint">This brand goes on the diary covers and pages with ${esc(groups.find((g) => g.key === key)?.name ?? 'them')} on, and on these cards and stickers.</p>
    </div>
  </section>`;
  bench(main, BRAND_KINDS, state, 'brand', top, {}, key);

  wireChoice(main, 'whose', (w) => { state.set({ who: w }); refresh(); });
  wireChoice(main, 'logo', (s) => { setBrand(key, { style: s as LogoStyle }); refresh(); });
  wireChoice(main, 'middle', (m) => { setBrand(key, { me: m === 'me' }); refresh(); });
  wireChoice(main, 'logo-pose', (p) => { setBrand(key, { pose: p }); refresh(); });
  const text = (sel: string, k: 'name' | 'tagline'): void => {
    const input = main.querySelector<HTMLInputElement>(sel)!;
    input.addEventListener('change', () => { setBrand(key, { [k]: input.value.trim() }); refresh(); });
    // The logo follows as she types; the sheet catches up when she finishes.
    input.addEventListener('input', () => {
      setBrand(key, { [k]: input.value });
      main.querySelector('.brand-preview')!.innerHTML = logoSvg({ ...designFor(state, state.get().kind).get(), brand: brandFor(key) }, 'brand-logo');
    });
  };
  text('.b-name', 'name');
  text('.b-tag', 'tagline');
}

/*
 * A kept card or logo sheet. It keeps the brand as it was, and opening it
 * brings that brand back for that person: the brand is what she was making.
 */
register('brand', {
  draw: (k, l) => {
    const s = k.settings as unknown as SheetSettings & { who?: string };
    return sheet(s.kind, { pattern: l.pattern, words: s.words, me: s.me, pose: s.pose, names: s.names, extra: s.extra, brandKey: s.who }, l);
  },
  open: (k) => {
    const s = k.settings as unknown as SheetSettings & { who?: string };
    reopen(state, s, k.design);
    if (s.who) {
      state.set({ who: s.who });
      if (k.brand) setBrand(s.who, k.brand);
    }
    location.hash = '#/brand';
  },
  name: (k) => {
    const s = k.settings as unknown as SheetSettings;
    const label = BRAND_KINDS.find((x) => x.id === s.kind)?.label ?? 'My brand';
    return k.brand?.name ? `${label}: ${k.brand.name}` : label;
  }
});
