/**
 * How the studio looks, which is Jazz's to decide.
 *
 * Her name, colours, lettering, pattern, her character, and her logo, kept on
 * this device and applied to everything: every room, and every sheet she
 * prints.
 *
 * She wanted darker colours and nothing girly, so the sets start dark and
 * there are a lot of them. Any colour can be changed from any tool, not only
 * from Make it yours, because going somewhere else to try a colour and coming
 * back is exactly the kind of thing that stops a ten-year-old trying things.
 */
import type { PatternName } from './patterns';
import type { PoseId } from './character';
import { showBackdrop } from './backdrops';

export type Lettering = 'rounded' | 'block' | 'marker' | 'hand' | 'typewriter' | 'mono' | 'classic';
export type Backdrop = 'plain' | 'stars' | 'glow' | 'waves' | 'bubbles';
export type LogoStyle = 'badge' | 'stamp' | 'ribbon' | 'monogram';

export interface Brand {
  name: string;
  tagline: string;
  style: LogoStyle;
  /** Her character in the logo, or her initial. */
  me: boolean;
  /** Which character is in the logo, when it is not the one in Make it yours. */
  pose?: PoseId;
}

export interface Look {
  name: string;
  paper: string;
  ink: string;
  accent: string;
  accent2: string;
  scheme: string;
  lettering: Lettering;
  pattern: PatternName;
  /**
   * Their character: the one that says hello on Home, and the one each tool
   * starts with. A sheet can use another; that choice stays in the tool.
   */
  pose: PoseId;
  backdrop: Backdrop;
  brand: Brand;
  /**
   * Which ready-made characters are in the list, besides any a family added:
   * Jazz's and Sukhi's. Absent in a look from before Sukhi, when it is worked
   * out from keepJazz (see character.ts).
   */
  sets?: { jazz: boolean; sukhi: boolean };
  /** From before Sukhi: once a family had added their own, whether Jazz stayed in the list too. */
  keepJazz: boolean;
  /** Whether the welcome, which asks their name and character, has been seen. */
  welcomed: boolean;
}

export interface Scheme {
  id: string;
  label: string;
  paper: string;
  ink: string;
  accent: string;
  accent2: string;
}

/** Dark first, as she asked. Two light ones at the end for daylight and printing. */
export const SCHEMES: Scheme[] = [
  { id: 'midnight', label: 'Midnight', paper: '#0F172A', ink: '#EAF0FF', accent: '#4F8CFF', accent2: '#FFC857' },
  { id: 'forest', label: 'Forest', paper: '#0F2A1F', ink: '#E9F5EE', accent: '#3DDC84', accent2: '#F2C14E' },
  { id: 'graphite', label: 'Graphite', paper: '#1B1D22', ink: '#F1F1F1', accent: '#C8F560', accent2: '#7DD3FC' },
  { id: 'ocean', label: 'Deep ocean', paper: '#0B2530', ink: '#E3F6F8', accent: '#2EC4B6', accent2: '#FF9F1C' },
  { id: 'storm', label: 'Storm', paper: '#262B36', ink: '#EEF1F6', accent: '#9AA8FF', accent2: '#5EEAD4' },
  { id: 'ember', label: 'Ember', paper: '#1E1414', ink: '#FBEFE7', accent: '#FF7A3D', accent2: '#FFD166' },
  { id: 'galaxy', label: 'Galaxy', paper: '#15102B', ink: '#EEEAFE', accent: '#7C5CFF', accent2: '#22D3EE' },
  { id: 'stealth', label: 'Stealth', paper: '#0A0A0A', ink: '#F5F5F5', accent: '#39FF88', accent2: '#A3A3A3' },
  { id: 'royal', label: 'Royal', paper: '#14213D', ink: '#F4F1E8', accent: '#FCA311', accent2: '#E5E5E5' },
  { id: 'moss', label: 'Moss and copper', paper: '#1F2A1B', ink: '#EFF3E6', accent: '#C97B4A', accent2: '#9CC47A' },
  { id: 'arctic', label: 'Arctic', paper: '#EEF3F7', ink: '#16212E', accent: '#2563EB', accent2: '#0EA5A4' },
  { id: 'sand', label: 'Sand', paper: '#F4EFE6', ink: '#2B2620', accent: '#1F7A5A', accent2: '#E07A3F' }
];

/** Loose colours to pick a main or second colour from, beyond the sets. */
export const PALETTE = [
  '#4F8CFF', '#2563EB', '#1E3A8A', '#22D3EE', '#2EC4B6', '#0EA5A4',
  '#3DDC84', '#39FF88', '#C8F560', '#9CC47A', '#1F7A5A', '#FFC857',
  '#FCA311', '#FF9F1C', '#FF7A3D', '#E4572E', '#D62828', '#9B2226',
  '#7C5CFF', '#9AA8FF', '#5EEAD4', '#C97B4A', '#A3A3A3', '#F5F5F5'
];

export const LETTERING: Record<Lettering, { label: string; stack: string; weight: number }> = {
  // System faces only. Nothing is fetched, so nothing can fail to arrive.
  rounded: { label: 'Rounded', stack: 'ui-rounded, "SF Pro Rounded", "Nunito", "Segoe UI", system-ui, sans-serif', weight: 800 },
  block: { label: 'Block', stack: '"Arial Black", "Helvetica Neue", Impact, "Segoe UI Black", sans-serif', weight: 900 },
  marker: { label: 'Marker', stack: '"Marker Felt", "Chalkboard SE", "Segoe Print", "Comic Sans MS", cursive', weight: 700 },
  hand: { label: 'Handwritten', stack: '"Bradley Hand", "Segoe Script", "Noteworthy", "Comic Sans MS", cursive', weight: 700 },
  typewriter: { label: 'Typewriter', stack: '"American Typewriter", "Courier New", Courier, monospace', weight: 700 },
  mono: { label: 'Techy', stack: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', weight: 700 },
  classic: { label: 'Storybook', stack: '"Iowan Old Style", Palatino, "Book Antiqua", Georgia, serif', weight: 700 }
};

export const BACKDROPS: Array<{ id: Backdrop; label: string }> = [
  { id: 'plain', label: 'Plain' },
  { id: 'stars', label: 'Stars' },
  { id: 'glow', label: 'Glow' },
  { id: 'waves', label: 'Waves' },
  { id: 'bubbles', label: 'Bubbles' }
];

const KEY = 'jazz-studio-look';

/**
 * A new studio: Arctic, with the Glow background, which is what Jazz chose.
 * No name until the welcome asks for one, so nobody else is greeted as Jazz.
 */
const start = (): Look => {
  const s = SCHEMES.find((x) => x.id === 'arctic')!;
  return {
    name: '',
    paper: s.paper, ink: s.ink, accent: s.accent, accent2: s.accent2, scheme: s.id,
    lettering: 'rounded',
    pattern: 'zigzag',
    pose: 'hello',
    backdrop: 'glow',
    keepJazz: false,
    welcomed: false,
    brand: { name: 'My Studio', tagline: 'Artist · Maker · Writer', style: 'badge', me: true }
  };
};

/** "Jazz's", or "My" for someone who has not said their name: for "…'s Diary" and the like. */
export const whose = (name: string): string => (name.trim() ? `${name.trim()}'s` : 'My');

let current: Look = load();

function load (): Look {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Look>;
      const base = start();
      // A look saved before the welcome existed belongs to someone already
      // using the studio, Jazz first among them: they are not asked again.
      // Before names could be left out, a missing one meant Jazz.
      const older = { welcomed: true, name: 'Jazz', brand: { ...base.brand, name: 'Jazz Studio' } };
      const was = 'welcomed' in saved ? base : { ...base, ...older };
      const merged = { ...was, ...saved, brand: { ...was.brand, ...(saved.brand ?? {}) } };
      // A lettering from an older version that no longer exists falls back.
      if (!(merged.lettering in LETTERING)) merged.lettering = base.lettering;
      // A background that has since been replaced falls back to stars.
      if (!BACKDROPS.some((b) => b.id === merged.backdrop)) merged.backdrop = base.backdrop;
      return merged;
    }
  } catch { /* private window or storage switched off: start fresh */ }
  return start();
}

export function look (): Look { return current; }

/** A look's lettering as a CSS font stack, for an SVG's style attribute. */
export const fontOf = (l: Look): string => LETTERING[l.lettering].stack.replace(/"/g, "'");

export function setLook (change: Partial<Look>): void {
  current = { ...current, ...change, brand: { ...current.brand, ...(change.brand ?? {}) } };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* keep it for this visit */ }
  apply();
}

export function useScheme (id: string): void {
  const s = SCHEMES.find((x) => x.id === id);
  if (s) setLook({ paper: s.paper, ink: s.ink, accent: s.accent, accent2: s.accent2, scheme: s.id });
}

export function reset (): void {
  current = start();
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
  apply();
}

/** Puts the look on the page as CSS variables, which is all the styling reads. */
export function apply (): void {
  const r = document.documentElement.style;
  const dark = light(current.paper) < 0.4;
  const l = LETTERING[current.lettering];
  r.setProperty('--paper', current.paper);
  r.setProperty('--ink', current.ink);
  r.setProperty('--accent', current.accent);
  r.setProperty('--accent2', current.accent2);
  r.setProperty('--lettering', l.stack);
  r.setProperty('--heavy', String(l.weight));
  // Cards sit a little lighter than the page, whichever way round she picked.
  r.setProperty('--card', mix(current.paper, '#FFFFFF', dark ? 0.07 : 0.6));
  r.setProperty('--card2', mix(current.paper, '#FFFFFF', dark ? 0.13 : 0.85));
  r.setProperty('--on-accent', light(current.accent) > 0.6 ? '#111111' : '#FFFFFF');
  r.setProperty('--on-accent2', light(current.accent2) > 0.6 ? '#111111' : '#FFFFFF');
  document.documentElement.dataset.dark = dark ? 'yes' : 'no';
  document.documentElement.dataset.backdrop = current.backdrop;
  showBackdrop(current.backdrop, current);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', current.paper);
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
