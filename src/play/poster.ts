/**
 * A poster of her name: huge letters filled with her pattern, with her
 * character standing underneath. A4, for a bedroom door or a wall.
 */
import { light, type Look } from '../look';
import { defs } from '../patterns';
import { figure, type PoseId } from '../character';
import { fit } from '../brand';

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export function posterSheet (name: string, line: string, pose: PoseId, dark: boolean, look: Look): string {
  const text = (name.trim() || look.name).toUpperCase();
  const bg = dark ? look.paper : '#FFFFFF';
  const fg = light(bg) > 0.6 ? (light(look.ink) > 0.6 ? look.paper : look.ink) : look.ink;
  // Heavy capitals run nearly as wide as they are tall, far wider than the
  // average letter fit() assumes, so size them from their own width.
  const size = Math.min(96, 168 / (text.length * 0.8));
  const y = 40 + size * 0.78;
  const sub = line.trim();
  const body = `<rect x="10" y="10" width="190" height="277" rx="8" fill="url(#pp)"/>` +
    `<rect x="18" y="18" width="174" height="261" rx="5" fill="${bg}"/>` +
    // A solid copy behind, nudged, so the letters stand off the page.
    `<text x="107.5" y="${y + 2.5}" text-anchor="middle" font-size="${size}" font-weight="900" fill="${look.accent2}">${esc(text)}</text>` +
    `<text x="105" y="${y}" text-anchor="middle" font-size="${size}" font-weight="900" fill="url(#pl)" stroke="${fg}" stroke-width="1.4" paint-order="stroke" stroke-linejoin="round">${esc(text)}</text>` +
    (sub ? `<text x="105" y="${y + 16}" text-anchor="middle" font-size="${fit(sub, 150, 9)}" font-weight="800" fill="${look.accent}">${esc(sub)}</text>` : '') +
    `<circle cx="105" cy="206" r="62" fill="${look.accent}" opacity=".16"/>` +
    figure(pose, 30, y + (sub ? 24 : 12), 150, 272 - y - (sub ? 24 : 12));
  return `<svg class="sheet-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" role="img" aria-label="Name poster" style="font-family:var(--lettering)">` +
    `<defs>${defs('pp', look.pattern, look, 1)}${defs('pl', look.pattern, look, 1.6)}</defs>` +
    `<rect width="210" height="297" fill="#fff"/>${body}</svg>`;
}
