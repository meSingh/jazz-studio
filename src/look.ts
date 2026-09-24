/**
 * How the studio looks, which is Jazz's to decide.
 *
 * Her name, her colours and her lettering, kept on this device and applied to
 * everything: the screens, and every sheet she prints. The presets are only a
 * place to start from. The point of the "Make it yours" screen is that she
 * changes them, and whatever she picks there is the data the next version of
 * this studio is designed around.
 */

export interface Look {
  name: string;
  /** Four colours: the page, the ink, and two to play with. */
  paper: string;
  ink: string;
  accent: string;
  accent2: string;
  lettering: Lettering;
  scheme: string;
}

export type Lettering = 'rounded' | 'marker' | 'classic';

export interface Scheme {
  id: string;
  label: string;
  paper: string;
  ink: string;
  accent: string;
  accent2: string;
}

/**
 * Places to start. Named for how they feel rather than what colours they are,
 * because "Berry jam" is a thing a ten-year-old picks and "#B83A6B" is not.
 */
export const SCHEMES: Scheme[] = [
  { id: 'scrapbook', label: 'Scrapbook', paper: '#FBF4E6', ink: '#3B2F2A', accent: '#E0704F', accent2: '#7FA67E' },
  { id: 'berry', label: 'Berry jam', paper: '#FFF1F4', ink: '#3A1830', accent: '#C23B6E', accent2: '#8C5BD6' },
  { id: 'seaside', label: 'Seaside', paper: '#EEF8FA', ink: '#123B4A', accent: '#1F8FA8', accent2: '#F2A541' },
  { id: 'meadow', label: 'Meadow', paper: '#F3F8EC', ink: '#253320', accent: '#5C9A3B', accent2: '#E7B93E' },
  { id: 'midnight', label: 'Midnight', paper: '#1E1B33', ink: '#F4EFFF', accent: '#FFB86B', accent2: '#7FD6C2' },
  { id: 'candy', label: 'Candy floss', paper: '#FFF6FB', ink: '#402A4A', accent: '#FF8FC0', accent2: '#7BC7FF' }
];

export const LETTERING: Record<Lettering, { label: string; stack: string }> = {
  // System faces only. Nothing is fetched, so nothing can fail to arrive.
  rounded: { label: 'Rounded', stack: 'ui-rounded, "SF Pro Rounded", "Nunito", "Segoe UI", system-ui, sans-serif' },
  marker: { label: 'Marker', stack: '"Marker Felt", "Chalkboard SE", "Segoe Print", "Comic Sans MS", cursive' },
  classic: { label: 'Storybook', stack: '"Iowan Old Style", "Palatino", "Book Antiqua", Georgia, serif' }
};

const KEY = 'jazz-studio-look';

const start = (): Look => ({ name: 'Jazz', ...SCHEMES[0], scheme: SCHEMES[0].id, lettering: 'rounded' });

let current: Look = load();

function load (): Look {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...start(), ...JSON.parse(raw) };
  } catch { /* private window or storage switched off: start fresh */ }
  return start();
}

export function look (): Look { return current; }

export function setLook (change: Partial<Look>): void {
  current = { ...current, ...change };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* keep it for this visit */ }
  apply();
}

export function useScheme (id: string): void {
  const s = SCHEMES.find((x) => x.id === id);
  if (s) setLook({ paper: s.paper, ink: s.ink, accent: s.accent, accent2: s.accent2, scheme: s.id });
}

/** Puts the look on the page as CSS variables, which is all the styling reads. */
export function apply (): void {
  const r = document.documentElement.style;
  const dark = light(current.paper) < 0.35;
  r.setProperty('--paper', current.paper);
  r.setProperty('--ink', current.ink);
  r.setProperty('--accent', current.accent);
  r.setProperty('--accent2', current.accent2);
  r.setProperty('--lettering', LETTERING[current.lettering].stack);
  // Cards sit a little lighter than the page, whichever way round she picked.
  r.setProperty('--card', mix(current.paper, '#FFFFFF', dark ? 0.1 : 0.6));
  r.setProperty('--on-accent', light(current.accent) > 0.6 ? current.ink : '#FFFFFF');
  document.documentElement.dataset.dark = dark ? 'yes' : 'no';
}

function rgb (hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Rough lightness, 0 to 1. Good enough to choose between light and dark text. */
export function light (hex: string): number {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function mix (a: string, b: string, t: number): string {
  const x = rgb(a); const y = rgb(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
