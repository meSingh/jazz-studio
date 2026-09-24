/**
 * Story sparks: something to write about when the diary page is blank.
 *
 * Half the time a story made of three parts (who, what, where), half the time
 * a question about her. Put together at random, so the funny ones are funny
 * by accident, which is the best kind.
 */

const WHO = [
  'A cat who runs a bakery', 'A robot who is scared of the dark', 'A dragon who collects stamps',
  'A pencil that draws by itself', 'A very small giant', 'A lost penguin', 'Your future self',
  'A detective who is also a dog', 'A ghost who is bad at being scary', 'Your character',
  'A shy superhero', 'A talking backpack', 'A queen who hates crowns', 'A snail in a hurry'
];

const WHAT = [
  'finds a secret door', 'wins a competition nobody entered', 'swaps places with you for a day',
  'has to keep a huge secret', 'opens a shop', 'gets stuck inside a video game', 'discovers a new colour',
  'builds something amazing out of a cardboard box', 'loses their voice before a big show',
  'finds a map inside a library book', 'wakes up able to fly', 'has to look after a baby dinosaur',
  'accidentally becomes famous', 'invents a machine that does homework'
];

const WHERE = [
  'at school', 'on the moon', 'in a museum at night', 'under the sea', 'inside a snow globe',
  'on a train that never stops', 'in your bedroom', 'in a city made of stationery', 'at a birthday party',
  'in a forest that hums', 'on the top floor of a very tall tree', 'in the back of a wardrobe'
];

const QUESTIONS = [
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

const pick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

export function spark (): string {
  if (Math.random() < 0.5) return pick(QUESTIONS);
  return `${pick(WHO)} ${pick(WHAT)} ${pick(WHERE)}.`;
}
