/**
 * Invite cards: eight to an A4 page, the size of a business card, to cut out
 * and give to friends. Each is a ticket, with a QR code a phone or tablet camera opens the
 * studio's page from, with her character's face in the middle of it, her
 * words across the top, the address written out for anyone without a camera,
 * and who it is from.
 *
 * The code goes to sukhiplay.com/studio, the studio's page, rather than
 * straight into the studio: a friend's grown-up sees what it is, that it is
 * free and asks for nothing, and how to keep it on the home screen, and opens
 * it from there. The code is made on the device (qr.ts), at the level that
 * still reads with a face over the middle.
 */
import { fontOf, type Look } from '../look';
import { defs } from '../patterns';
import { face, type PoseId } from '../character';
import { fit } from '../brand';
import { qr, qrSvg } from '../qr';
import { esc, inkOf, CUT } from '../sheets';

/** Where every card leads. */
export const INVITE_LINK = 'https://sukhiplay.com/studio/';
const SHOWN = 'sukhiplay.com/studio';

/** The one code every card shares; worked out once. */
let code: ReturnType<typeof qr> | null = null;

/**
 * Her words in up to three lines, as big as will fit the width: the biggest
 * size at which no line runs over. Letters are taken as a little over half
 * as wide as they are tall, which heavy lettering is.
 */
function wrap (text: string, width: number, big: number, small: number): { lines: string[]; size: number } {
  const words = text.split(/\s+/).filter(Boolean);
  for (let size = big; size >= small; size -= 0.2) {
    const per = Math.floor(width / (size * 0.58));
    const lines: string[] = [];
    for (const w of words) {
      const last = lines[lines.length - 1];
      if (last !== undefined && (last + ' ' + w).length <= per) lines[lines.length - 1] = `${last} ${w}`;
      else lines.push(w);
    }
    if (lines.length <= 3 && lines.every((l) => l.length <= per)) return { lines, size };
  }
  return { lines: [text], size: fit(text, width, small) };
}

/**
 * The card is a ticket: a stub on the left in her pattern, holding the code
 * on a white tile (a code needs white around it to read), a perforation with
 * a notch cut top and bottom, and the invitation on the right.
 */
export function inviteSheet (words: string, pose: PoseId, from: string, look: Look): string {
  code ??= qr(INVITE_LINK, 'H');
  const ink = inkOf(look);
  const say = words.trim() || 'Come and make things with me!';
  const who = from.trim();
  const head = wrap(say, 34, 6.2, 3.6);
  let body = '';
  for (let i = 0; i < 8; i++) {
    const x = 17.5 + (i % 2) * 90;
    const y = 18 + Math.floor(i / 2) * 66;
    const cut = x + 41; // the perforation
    const n = 2.6; // the notches' radius
    const outline = `M${x + 4} ${y} H${cut - n} A${n} ${n} 0 0 0 ${cut + n} ${y} H${x + 81} A4 4 0 0 1 ${x + 85} ${y + 4} ` +
      `V${y + 51} A4 4 0 0 1 ${x + 81} ${y + 55} H${cut + n} A${n} ${n} 0 0 0 ${cut - n} ${y + 55} H${x + 4} ` +
      `A4 4 0 0 1 ${x} ${y + 51} V${y + 4} A4 4 0 0 1 ${x + 4} ${y}Z`;
    const clip = `ic${i}`;
    body += `<clipPath id="${clip}"><path d="${outline}"/></clipPath>` +
      `<path d="${outline}" fill="#fff"/>` +
      // The stub, in her pattern.
      `<rect x="${x}" y="${y}" width="41" height="55" fill="url(#${i % 2 ? 'ip2' : 'ip1'})" clip-path="url(#${clip})"/>` +
      `<path d="M${cut} ${y + n + 1.2} V${y + 55 - n - 1.2}" stroke="${ink}" stroke-width=".35" stroke-dasharray="1.2 1.2" opacity=".45"/>` +
      `<path d="${outline}" fill="none" stroke="${look.accent}" stroke-width=".5"/>`;
    // "Scan me" and the code, her face in the middle of it.
    const q = 33;
    const qx = x + 4;
    const qy = y + 16.5;
    const r = q * (code.size / (code.size + 8)) * 0.15;
    body += `<rect x="${x + 8.5}" y="${y + 5}" width="24" height="7.6" rx="3.8" fill="${look.paper}"/>` +
      `<text x="${x + 20.5}" y="${y + 10.1}" text-anchor="middle" font-size="4.2" font-weight="900" fill="${look.ink}" letter-spacing=".3">Scan me</text>` +
      `<rect x="${qx - 1}" y="${qy - 1}" width="${q + 2}" height="${q + 2}" rx="3" fill="#fff"/>` +
      qrSvg(code, qx, qy, q, '#111', 0.3) +
      `<circle cx="${qx + q / 2}" cy="${qy + q / 2}" r="${r + 0.6}" fill="#fff"/>` +
      `<circle cx="${qx + q / 2}" cy="${qy + q / 2}" r="${r}" fill="${look.accent2}"/>` +
      face(pose, qx + q / 2, qy + q / 2 - r * 0.04, r * 0.98, `if${i}`);
    // The invitation.
    const tx = x + 45;
    const lh = head.size * 1.12;
    const top = y + 17 + (3 - head.lines.length) * lh * 0.35;
    body += `<text x="${tx}" y="${y + 9}" font-size="2.9" font-weight="900" fill="${look.accent}" letter-spacing=".5">YOU'RE INVITED</text>` +
      head.lines.map((line, j) => `<text x="${tx}" y="${(top + j * lh).toFixed(2)}" font-size="${head.size.toFixed(2)}" font-weight="900" fill="${ink}">${esc(line)}</text>`).join('') +
      `<path d="M${tx} ${y + 39} H${x + 81}" stroke="${look.accent}" stroke-width=".4" opacity=".5"/>` +
      `<text x="${tx}" y="${y + 43.6}" font-size="2.6" fill="${ink}" opacity=".75">Free, no sign-up. Or go to</text>` +
      `<text x="${tx}" y="${y + 47.4}" font-size="${fit(SHOWN, 36, 3.2)}" font-weight="900" fill="${look.accent}">${SHOWN}</text>` +
      (who ? `<text x="${x + 81}" y="${y + 52.4}" text-anchor="end" font-size="${fit(`from ${who}`, 30, 3.4)}" font-weight="800" fill="${ink}" opacity=".85">from ${esc(who)}</text>` : '') +
      `<path d="${outline}" transform="translate(${x + 42.5} ${y + 27.5}) scale(1.035 1.055) translate(${-(x + 42.5)} ${-(y + 27.5)})" ${CUT} stroke="${ink}" opacity=".3"/>`;
  }
  return `<svg class="sheet-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" role="img" aria-label="Invite cards" style="font-family:${fontOf(look)}">` +
    `<defs>${defs('ip1', look.pattern, look, 0.6)}${defs('ip2', look.pattern, { ...look, accent: look.accent2, accent2: look.accent }, 0.6)}</defs>` +
    `<rect width="210" height="297" fill="#fff"/>${body}</svg>`;
}
