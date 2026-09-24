/**
 * Story sparks: a story page to write and draw on.
 *
 * A story is made of three parts, who, what happens and where, each chosen
 * from a list or spun at random, so the funny ones are funny by accident,
 * which is the best kind. Her own people (Jazz, Sukhi, her friends) can be
 * who. Or, instead of a story, a question about her. The page it prints has
 * the idea at the top, a box to draw it in with the hero standing in the
 * corner, and lines to write on.
 */
import { fontOf, light, type Look } from '../look';
import { defs } from '../patterns';
import { figure, type PoseId } from '../character';
import { fit } from '../brand';
import { esc } from '../sheets';

export const WHO = [
  'A cat who runs a bakery', 'A robot who is scared of the dark', 'A dragon who collects stamps',
  'A pencil that draws by itself', 'A very small giant', 'A lost penguin', 'Your future self',
  'A detective who is also a dog', 'A ghost who is bad at being scary', 'Your character',
  'A shy superhero', 'A talking backpack', 'A queen who hates crowns', 'A snail in a hurry'
];

export const WHAT = [
  'finds a secret door', 'wins a competition nobody entered', 'swaps places with you for a day',
  'has to keep a huge secret', 'opens a shop', 'gets stuck inside a video game', 'discovers a new colour',
  'builds something amazing out of a cardboard box', 'loses their voice before a big show',
  'finds a map inside a library book', 'wakes up able to fly', 'has to look after a baby dinosaur',
  'accidentally becomes famous', 'invents a machine that does homework'
];

export const WHERE = [
  'at school', 'on the moon', 'in a museum at night', 'under the sea', 'inside a snow globe',
  'on a train that never stops', 'in your bedroom', 'in a city made of stationery', 'at a birthday party',
  'in a forest that hums', 'on the top floor of a very tall tree', 'in the back of a wardrobe'
];

export const QUESTIONS = [
  'If you could invent a new holiday, what would it be and how would people celebrate it?',
  'What would your perfect Saturday look like, from waking up to going to sleep?',
  'Describe your dream bedroom. Leave nothing out.',
  'You get one superpower, but only for a day. Which one, and what do you do?',
  'Write a letter to yourself in ten years.',
  'What was the best thing that happened this week, and why?',
  'Design a new flavour of crisps. What is it called and who would buy it?',
  'If your pencil case could talk, what would it complain about?',
  'What is something you are really good at that nobody knows about?',
  'You are in charge of the school for a day. What changes?',
  'Describe a place you have never been but would love to go.',
  'What would you put in a time capsule to open when you are grown up?',
  'Invent an animal. What does it eat, where does it live, and what is it called?',
  'What makes a really good friend?'
];

export const pick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

/**
 * The story page: the idea at the top, a box to draw in with the hero
 * standing in its corner (when the hero is one of her people), and lines.
 */
export function storySheet (idea: string, title: string, hero: PoseId | null, look: Look): string {
  const ink = light(look.ink) > 0.6 ? look.paper : look.ink;
  const head = title.trim() || 'My story';
  // The idea over as many as three lines, as large as fits.
  const words = idea.split(/\s+/);
  let size = 7;
  let lines: string[] = [];
  for (; size >= 4.2; size -= 0.2) {
    const per = Math.floor(170 / (size * 0.52));
    lines = [];
    for (const w of words) {
      const last = lines[lines.length - 1];
      if (last !== undefined && `${last} ${w}`.length <= per) lines[lines.length - 1] = `${last} ${w}`;
      else lines.push(w);
    }
    if (lines.length <= 3) break;
  }
  let body = `<rect x="10" y="10" width="190" height="10" rx="3" fill="url(#sp)"/>` +
    `<text x="15" y="33" font-size="${fit(head, 120, 11)}" font-weight="900" fill="${ink}">${esc(head)}</text>` +
    `<text x="140" y="33" font-size="4.5" fill="${ink}" opacity=".7">Date</text><path d="M151 33.5 H195" stroke="${ink}" stroke-width=".4" opacity=".5"/>` +
    `<rect x="15" y="40" width="180" height="${10 + lines.length * size * 1.25}" rx="4" fill="${look.accent}" opacity=".12"/>` +
    lines.map((l, i) => `<text x="20" y="${47 + size * 0.8 + i * size * 1.25}" font-size="${size.toFixed(2)}" font-weight="800" fill="${ink}">${esc(l)}</text>`).join('');
  const boxTop = 56 + lines.length * size * 1.25;
  // The drawing box, with the hero at the bottom left, as if they had walked in.
  body += `<rect x="15" y="${boxTop}" width="180" height="92" rx="4" fill="#fff" stroke="${look.accent}" stroke-width=".6" stroke-dasharray="2.4 1.6"/>` +
    `<text x="190" y="${boxTop + 7}" text-anchor="end" font-size="3.8" fill="${look.accent}" font-weight="700">Draw it here</text>`;
  if (hero) body += figure(hero, 18, boxTop + 30, 48, 60);
  for (let y = boxTop + 104; y <= 280; y += 9) body += `<path d="M15 ${y} H195" stroke="${look.accent}" stroke-width=".35" opacity=".55"/>`;
  return `<svg class="sheet-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" role="img" aria-label="Story page" style="font-family:${fontOf(look)}">` +
    `<defs>${defs('sp', look.pattern, look, 0.8)}</defs><rect width="210" height="297" fill="#fff"/>${body}</svg>`;
}
