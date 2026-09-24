/**
 * Invite cards: eight to an A4 page, the size of a business card, to cut out
 * and give to friends. Each has a QR code a phone or tablet camera opens the
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

export function inviteSheet (words: string, pose: PoseId, from: string, look: Look): string {
  code ??= qr(INVITE_LINK, 'H');
  const ink = inkOf(look);
  const say = words.trim() || 'Come and make things with me!';
  const who = from.trim();
  let body = '';
  for (let i = 0; i < 8; i++) {
    const x = 17.5 + (i % 2) * 90;
    const y = 18 + Math.floor(i / 2) * 66;
    const clip = `ic${i}`;
    // The card, with a band of her pattern across the top and her words on it.
    body += `<clipPath id="${clip}"><rect x="${x}" y="${y}" width="85" height="55" rx="4"/></clipPath>` +
      `<rect x="${x}" y="${y}" width="85" height="55" rx="4" fill="#fff" stroke="${look.accent}" stroke-width=".6"/>` +
      `<rect x="${x}" y="${y}" width="85" height="13" fill="url(#${i % 2 ? 'ip2' : 'ip1'})" clip-path="url(#${clip})"/>` +
      `<rect x="${x + 5}" y="${y + 3}" width="75" height="7" rx="3.5" fill="${look.paper}"/>` +
      `<text x="${x + 42.5}" y="${y + 7.9}" text-anchor="middle" font-size="${fit(say, 70, 4.4)}" font-weight="900" fill="${look.ink}">${esc(say)}</text>`;
    // The code, with her face in the middle where the code can spare it.
    const q = 38;
    const qx = x + 3;
    const qy = y + 15;
    const r = q * (code.size / (code.size + 8)) * 0.15;
    body += qrSvg(code, qx, qy, q, '#111', 0.3) +
      `<circle cx="${qx + q / 2}" cy="${qy + q / 2}" r="${r + 0.6}" fill="#fff"/>` +
      `<circle cx="${qx + q / 2}" cy="${qy + q / 2}" r="${r}" fill="${look.accent2}"/>` +
      face(pose, qx + q / 2, qy + q / 2 - r * 0.04, r * 0.98, `if${i}`);
    // What to do with it, for whoever it is given to.
    const tx = x + 44;
    body += `<text x="${tx}" y="${y + 24}" font-size="6.2" font-weight="900" fill="${look.accent}">Scan me</text>` +
      `<text x="${tx}" y="${y + 29}" font-size="2.7" fill="${ink}" opacity=".8">with a phone or tablet</text>` +
      `<text x="${tx}" y="${y + 32.4}" font-size="2.7" fill="${ink}" opacity=".8">camera, or go to</text>` +
      `<text x="${tx}" y="${y + 37.2}" font-size="${fit(SHOWN, 36, 3.4)}" font-weight="900" fill="${ink}">${SHOWN}</text>` +
      `<text x="${tx}" y="${y + 41.4}" font-size="2.5" fill="${ink}" opacity=".7">Free, and no sign-up</text>` +
      (who ? `<text x="${tx}" y="${y + 49.5}" font-size="${fit(`From ${who}`, 37, 4.6)}" font-weight="900" fill="${look.accent}">From ${esc(who)}</text>` : '') +
      `<rect x="${x - 1.5}" y="${y - 1.5}" width="88" height="58" rx="5" ${CUT} stroke="${ink}" opacity=".35"/>`;
  }
  return `<svg class="sheet-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" role="img" aria-label="Invite cards" style="font-family:${fontOf(look)}">` +
    `<defs>${defs('ip1', look.pattern, look, 0.6)}${defs('ip2', look.pattern, { ...look, accent: look.accent2, accent2: look.accent }, 0.6)}</defs>` +
    `<rect width="210" height="297" fill="#fff"/>${body}</svg>`;
}
