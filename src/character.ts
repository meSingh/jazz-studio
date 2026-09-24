/**
 * Box buddy: a stand-in, keeping the spot warm for Jazz's own character.
 *
 * The real one is hers to invent, so this one is deliberately not a person.
 * It is a cardboard box with a bow and a pencil, because the studio is about
 * making things out of exactly that. When she has drawn her character on
 * paper, the drawing goes through the same tracing that turns drawings into
 * colouring pictures, and replaces this function's output.
 */
import type { Look } from './look';

export function buddy (look: Look, label = 'Box buddy'): string {
  const { accent, accent2, ink } = look;
  const card = '#D6A66B';
  const shade = '#B9854B';
  return `<svg viewBox="0 0 120 150" role="img" aria-label="${label}" class="buddy-svg">
  <ellipse cx="60" cy="143" rx="36" ry="5" fill="${ink}" opacity=".12"/>
  <path d="M24 38 L10 22 L50 22 L58 38Z" fill="${shade}"/>
  <path d="M96 38 L110 22 L70 22 L62 38Z" fill="${shade}"/>
  <rect x="22" y="36" width="76" height="92" rx="7" fill="${card}"/>
  <path d="M22 50 H98" stroke="${shade}" stroke-width="2" opacity=".6"/>
  <rect x="64" y="40" width="30" height="9" rx="2" fill="${accent2}" opacity=".75" transform="rotate(-8 79 44)"/>
  <g transform="translate(40 22)">
    <path d="M0 0 L-12 -8 L-12 8Z" fill="${accent}"/>
    <path d="M0 0 L12 -8 L12 8Z" fill="${accent}"/>
    <circle r="4" fill="${accent}"/>
  </g>
  <ellipse cx="46" cy="78" rx="4.5" ry="6" fill="${ink}"/>
  <ellipse cx="74" cy="78" rx="4.5" ry="6" fill="${ink}"/>
  <circle cx="47.5" cy="76" r="1.5" fill="#fff"/>
  <circle cx="75.5" cy="76" r="1.5" fill="#fff"/>
  <circle cx="38" cy="90" r="5" fill="${accent}" opacity=".45"/>
  <circle cx="82" cy="90" r="5" fill="${accent}" opacity=".45"/>
  <path d="M52 92 Q60 100 68 92" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
  <path d="M22 96 Q10 100 8 112" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M98 96 Q110 94 112 84" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>
  <g transform="rotate(-35 112 80)">
    <rect x="108" y="52" width="8" height="30" rx="1.5" fill="${accent2}"/>
    <path d="M108 82 L112 92 L116 82Z" fill="#F3D9B1"/>
    <path d="M110.6 88 L112 92 L113.4 88Z" fill="${ink}"/>
  </g>
  <rect x="36" y="126" width="14" height="12" rx="4" fill="${ink}"/>
  <rect x="70" y="126" width="14" height="12" rx="4" fill="${ink}"/>
</svg>`;
}
