/**
 * Jazz's Studio.
 *
 * Six rooms: stationery to design and print, wraps for things made from
 * boxes, her brand, playthings to try, a shelf of what she made, and the room
 * where she decides how it all looks.
 * A hash router moves between them, so the back button and a bookmark both
 * work, and so it runs from a file or a private scheme as happily as from a
 * server.
 */
import './style.css';
import { apply, look } from './look';
import { defs, type PatternName } from './patterns';
import { img, peekImg, either, loadOwn, setKeepJazz, type PoseId } from './character';
import { ICONS } from './icons';
import { esc, onRefresh } from './ui';
import { stationeryRoom } from './rooms/stationery';
import { boxRoom } from './rooms/box';
import { brandRoom } from './rooms/brand';
import { playRoom, PLAYTHINGS } from './rooms/play';
import { GROUPS } from './sheets';
import { makesRoom } from './rooms/makes';
import { yoursRoom } from './rooms/yours';
import { install, installed } from './install';
import sukhiMark from './assets/sukhi.png';
import { inSukhiPlay } from './ui';
import { openKeep } from './rooms/keep';

const app = document.getElementById('app')!;

type Room = 'home' | 'stationery' | 'box' | 'brand' | 'play' | 'makes' | 'yours';

const ROOMS: Record<Exclude<Room, 'home'>, { title: string; icon: string; blurb: string; pose: PoseId; pattern: PatternName }> = {
  stationery: { title: 'Stationery', icon: ICONS.sticker, blurb: 'Stickers, labels, your diary, planners and more', pose: 'draw', pattern: 'zigzag' },
  box: { title: 'Make from a box', icon: ICONS.box, blurb: 'Wraps that fit your rolls, boxes and cartons', pose: 'hello', pattern: 'stripes' },
  brand: { title: 'My brand', icon: ICONS.star, blurb: 'Your own logo, and business cards', pose: 'cool', pattern: 'triangles' },
  play: { title: 'Play', icon: ICONS.play, blurb: 'Name posters, secret codes, story sparks, doodles', pose: 'idea', pattern: 'bolts' },
  makes: { title: 'My makes', icon: ICONS.camera, blurb: 'Photos of everything you have made', pose: 'wink', pattern: 'confetti' },
  yours: { title: 'Make it yours', icon: ICONS.palette, blurb: 'Your character, your name, your colours', pose: 'portrait', pattern: 'waves' }
};

function route (): { room: Room; sub: string } {
  const [r, sub = ''] = location.hash.replace(/^#\/?/, '').split('/');
  return { room: r in ROOMS ? r as Room : 'home', sub };
}

function render (keepScroll = false): void {
  const { room, sub } = route();
  const y = window.scrollY;
  // Start again can change this; the character list reads it every time.
  setKeepJazz(look().keepJazz);
  // A page inside a room: a plaything, or one sheet of stationery.
  const group = room === 'stationery'
    ? GROUPS.find((g) => g.id === sub) ?? GROUPS.find((g) => g.kinds.some((k) => k.id === sub))
    : undefined;
  const thing = room === 'play' ? PLAYTHINGS.find((t) => t.id === sub)
    : group ? { title: group.label } : undefined;
  // The studio's own name, which does not change with hers.
  document.title = room === 'home' ? BRAND : `${thing?.title ?? ROOMS[room].title} · ${BRAND}`;
  app.dataset.room = room;
  app.innerHTML = top(room, thing?.title) + '<main class="room"></main>' + foot();
  app.querySelector('.keep-btn')?.addEventListener('click', openKeep);
  const main = app.querySelector('main')!;
  if (room === 'home') home(main);
  else if (room === 'stationery') stationeryRoom(main, sub);
  else if (room === 'box') boxRoom(main);
  else if (room === 'brand') brandRoom(main);
  else if (room === 'play') playRoom(main, sub);
  else if (room === 'makes') void makesRoom(main);
  else yoursRoom(main, sub);
  window.scrollTo(0, keepScroll ? y : 0);
}

/**
 * The studio's brand, the same on every page and whatever she changes: its own
 * icon (the app's, Jazz drawing) and its own name. Her name and character are
 * hers to change; this is what the thing is called.
 */
const BRAND = "Jazz's Studio";

const brandMark = (): string =>
  `<a class="brand" href="#/" aria-label="${BRAND}, home"><img src="./brand-mark.png" alt="" width="40" height="40"><span>${BRAND}</span></a>`;

/**
 * Sukhi Play's brand, at the foot of every page, because the studio is part of
 * it: the Sukhi mark, and the way to sukhiplay.com. Inside Sukhi Play a link
 * cannot leave the locked screen, so there it is the words alone.
 */
function foot (): string {
  const link = (text: string): string => inSukhiPlay
    ? `<b>${text}</b>`
    : `<a href="https://sukhiplay.com" target="_blank" rel="noopener">${text}</a>`;
  return `<footer class="foot"><img src="${sukhiMark}" alt="" width="28" height="28">` +
    `<span>Part of ${link('Sukhi Play')}</span><span class="foot-dot" aria-hidden="true">·</span>${link('sukhiplay.com')}</footer>`;
}

function top (r: Room, thing?: string): string {
  // Only when there is something to install: not on a home screen already,
  // and not inside Sukhi Play.
  const keep = installed() ? ''
    : `<button type="button" class="keep-btn" title="Keep it on this device">${ICONS.install}<span>Keep it on this device</span></button>`;
  if (r === 'home') return `<header class="top">${brandMark()}${keep}</header>`;
  // Inside a room's page, Back goes to the room; otherwise home.
  const back = thing ? `#/${r}` : '#/';
  return `<header class="top">${brandMark()}<span class="top-rule" aria-hidden="true"></span>` +
    `<a class="home-btn" href="${back}">${ICONS.back}<span>${thing ? ROOMS[r].title : 'Home'}</span></a>` +
    `<h1 class="room-title">${ROOMS[r].icon}<span>${thing ?? ROOMS[r].title}</span></h1>${keep}</header>`;
}

function home (main: HTMLElement): void {
  const l = look();
  const tiles = (Object.keys(ROOMS) as Array<Exclude<Room, 'home'>>).map((r, i) => {
    const t = ROOMS[r];
    return `<a class="tile" href="#/${r}" style="--tilt:${[-1.2, 1, -0.6, 0.9, -1, 0.7][i]}deg;--i:${i}">` +
      `<svg class="tile-art" viewBox="0 0 100 40" preserveAspectRatio="xMidYMid slice" aria-hidden="true">` +
      `<defs>${defs(`t-${r}`, t.pattern, l, 0.9)}</defs><rect width="100" height="40" fill="url(#t-${r})"/></svg>` +
      `<span class="tile-peek">${peekImg(either(t.pose, i))}</span>` +
      `<span class="tile-icon">${t.icon}</span>` +
      `<span class="tile-title">${t.title}</span><span class="tile-blurb">${t.blurb}</span></a>`;
  }).join('');
  main.innerHTML = `<section class="hello">
      <div class="hello-me">${img(l.pose, 'hello-img')}</div>
      <div class="hello-words"><h2>Hi ${esc(l.name)}</h2><p>What shall we make today?</p></div>
    </section>
    <section class="tiles">${tiles}</section>`;
}

install();
apply();
onRefresh(() => render(true));
window.addEventListener('hashchange', () => render());
// A family's own characters are in IndexedDB; read them before the first
// screen so it does not open on Jazz and then change.
setKeepJazz(look().keepJazz);
loadOwn().finally(render);
