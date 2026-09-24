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
import { img, type PoseId } from './character';
import { ICONS } from './icons';
import { esc, onRefresh, inSukhiPlay } from './ui';
import { stationeryRoom } from './rooms/stationery';
import { boxRoom } from './rooms/box';
import { brandRoom } from './rooms/brand';
import { playRoom, PLAYTHINGS } from './rooms/play';
import { makesRoom } from './rooms/makes';
import { yoursRoom } from './rooms/yours';
import { install } from './install';

const app = document.getElementById('app')!;

type Room = 'home' | 'stationery' | 'box' | 'brand' | 'play' | 'makes' | 'yours';

const ROOMS: Record<Exclude<Room, 'home'>, { title: string; icon: string; blurb: string; pose: PoseId; pattern: PatternName }> = {
  stationery: { title: 'Stationery', icon: ICONS.sticker, blurb: 'Stickers, labels, your diary, planners and more', pose: 'draw', pattern: 'zigzag' },
  box: { title: 'Make from a box', icon: ICONS.box, blurb: 'Wraps that fit your rolls, boxes and cartons', pose: 'hello', pattern: 'stripes' },
  brand: { title: 'My brand', icon: ICONS.star, blurb: 'Your own logo, and business cards', pose: 'cool', pattern: 'triangles' },
  play: { title: 'Play', icon: ICONS.play, blurb: 'Name posters, secret codes, story sparks, doodles', pose: 'idea', pattern: 'bolts' },
  makes: { title: 'My makes', icon: ICONS.camera, blurb: 'Photos of everything you have made', pose: 'wink', pattern: 'confetti' },
  yours: { title: 'Make it yours', icon: ICONS.palette, blurb: 'Your colours, lettering and character', pose: 'portrait', pattern: 'waves' }
};

function route (): { room: Room; sub: string } {
  const [r, sub = ''] = location.hash.replace(/^#\/?/, '').split('/');
  return { room: r in ROOMS ? r as Room : 'home', sub };
}

function render (keepScroll = false): void {
  const { room, sub } = route();
  const y = window.scrollY;
  const name = look().name;
  const thing = room === 'play' ? PLAYTHINGS.find((t) => t.id === sub) : undefined;
  document.title = room === 'home' ? `${name}'s Studio` : `${thing?.title ?? ROOMS[room].title} · ${name}'s Studio`;
  app.dataset.room = room;
  app.innerHTML = top(room, thing?.title) + '<main class="room"></main>';
  const main = app.querySelector('main')!;
  if (room === 'home') home(main);
  else if (room === 'stationery') stationeryRoom(main);
  else if (room === 'box') boxRoom(main);
  else if (room === 'brand') brandRoom(main);
  else if (room === 'play') playRoom(main, sub);
  else if (room === 'makes') void makesRoom(main);
  else yoursRoom(main);
  window.scrollTo(0, keepScroll ? y : 0);
}

function top (r: Room, thing?: string): string {
  const name = esc(look().name);
  if (r === 'home') return `<header class="top"><span class="brand-tag">${name}'s Studio</span></header>`;
  const back = thing ? '#/play' : '#/';
  return `<header class="top"><a class="home-btn" href="${back}">${ICONS.back}<span>${thing ? 'Play' : 'Home'}</span></a>` +
    `<h1 class="room-title">${ROOMS[r].icon}<span>${thing ?? ROOMS[r].title}</span></h1></header>`;
}

function home (main: HTMLElement): void {
  const l = look();
  const tiles = (Object.keys(ROOMS) as Array<Exclude<Room, 'home'>>).map((r, i) => {
    const t = ROOMS[r];
    return `<a class="tile" href="#/${r}" style="--tilt:${[-1.2, 1, -0.6, 0.9, -1, 0.7][i]}deg;--i:${i}">` +
      `<svg class="tile-art" viewBox="0 0 100 40" preserveAspectRatio="xMidYMid slice" aria-hidden="true">` +
      `<defs>${defs(`t-${r}`, t.pattern, l, 0.9)}</defs><rect width="100" height="40" fill="url(#t-${r})"/></svg>` +
      `<span class="tile-peek">${img(t.pose, 'peek-img')}</span>` +
      `<span class="tile-icon">${t.icon}</span>` +
      `<span class="tile-title">${t.title}</span><span class="tile-blurb">${t.blurb}</span></a>`;
  }).join('');
  main.innerHTML = `<section class="hello">
      <div class="hello-me">${img(l.greeter, 'hello-img')}</div>
      <div class="hello-words"><h2>Hi ${esc(l.name)}</h2><p>What shall we make today?</p></div>
    </section>
    <section class="tiles">${tiles}</section>
    ${inSukhiPlay ? '' : '<p class="part">Part of <a href="https://sukhiplay.com" target="_blank" rel="noopener">Sukhi Play</a></p>'}`;
}

install();
apply();
onRefresh(() => render(true));
window.addEventListener('hashchange', () => render());
render();
