/**
 * Prints she can use again: a sheet's settings, kept in My makes.
 *
 * After she prints something the studio asks whether to keep it, and what to
 * call it. What is kept is not the printout but everything that made it: which
 * sheet, her words, which character, and its colours, lettering and pattern as
 * they were. Opening it puts the tool back exactly like that, so she can change
 * a word and print it again rather than starting over. Settings are a few
 * hundred bytes; a PDF could not be changed, and would be a thousand times the
 * size.
 *
 * Each tool that prints says here how to draw one of its prints and how to put
 * itself back to one (`register`), and while it is on the screen, what it is
 * showing now (`showing`). My makes draws the shelf from the same functions,
 * so a kept print looks like what came out of the printer.
 */
import type { Look, Brand } from './look';
import { all, save, type Make } from './makes';
import { esc, inSukhiPlay, type Design } from './ui';
import { ICONS } from './icons';

/** Everything a print needs to be drawn again or opened again. */
export interface Kept {
  /** Which tool it came from (see `register`). */
  tool: string;
  /** That tool's own settings for this print. */
  settings: Record<string, unknown>;
  /** Its colours, lettering and pattern as they were: the studio's look may have changed since. */
  design: Design;
  /** For a print with the logo on it, the logo as it was. */
  brand?: Brand;
}

export interface Tool {
  /** The print, drawn with this design (the studio's look with the kept one over it). */
  draw: (k: Kept, look: Look) => string;
  /** Puts the tool back to this print and goes there. */
  open: (k: Kept) => void;
  /** What to call it if she does not choose a name. */
  name: (k: Kept) => string;
}

const TOOLS = new Map<string, Tool>();

export function register (id: string, tool: Tool): void {
  TOOLS.set(id, tool);
}

export const toolFor = (k: Kept): Tool | undefined => TOOLS.get(k.tool);

/** Just the parts of a look that belong to a sheet. */
export function designOf (l: Look): Design {
  return { paper: l.paper, ink: l.ink, accent: l.accent, accent2: l.accent2, scheme: l.scheme, lettering: l.lettering, pattern: l.pattern };
}

let current: (() => Kept) | null = null;

/** What the tool on the screen would keep now. Each tool sets this as it draws; leaving a tool clears it. */
export function showing (what: (() => Kept) | null): void {
  current = what;
}

export const nowShowing = (): Kept | null => current?.() ?? null;

/** Kept prints are compared by what they would print, not by name or date. */
const same = (a: Kept, b: Kept): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * After a print: asks whether to keep it, unless this exact print is kept
 * already (she opened one from My makes and printed it again as it was).
 */
export async function offerToKeep (): Promise<void> {
  const k = nowShowing();
  if (!k) return;
  let kept: Make[] = [];
  try { kept = await all(); } catch { return; /* nowhere to keep it */ }
  if (kept.some((m) => m.print && same(m.print, k))) return;
  await keepDialog(k, 'Keep it in My makes?', 'Then you can print it again, or change it first, without starting over.');
}

/** The Keep button beside Print: the same question, without printing. */
export async function keepNow (): Promise<void> {
  const k = nowShowing();
  if (k) await keepDialog(k, 'Keep it in My makes?', 'Give it a name, and it will be in My makes, ready to print or change.');
}

function keepDialog (k: Kept, title: string, body: string): Promise<void> {
  return new Promise((resolve) => {
    document.querySelector('dialog.ask')?.remove();
    const d = document.createElement('dialog');
    d.className = 'ask keep-print';
    d.setAttribute('aria-labelledby', 'keep-print-title');
    const suggested = toolFor(k)?.name(k) ?? 'My print';
    d.innerHTML = `<div class="ask-art"><span class="ask-icon ask-icon--keep">${ICONS.star}</span></div>
      <h2 id="keep-print-title">${title}</h2>
      <div class="ask-body"><p>${body}</p>
        <label class="field"><span>Call it</span><input class="kp-name" maxlength="60" value="${esc(suggested)}"></label>
      </div>
      <div class="ask-buttons">
        <button type="button" class="go go--ghost ask-no">Not now</button>
        <button type="button" class="go ask-yes">${ICONS.plus}<span>Keep it</span></button>
      </div>
      <p class="kp-done" role="status"></p>`;
    document.body.append(d);
    const input = d.querySelector<HTMLInputElement>('.kp-name')!;
    let finished = false;
    const close = (): void => {
      if (finished) return;
      finished = true;
      d.close();
      d.remove();
      resolve();
    };
    const keep = async (): Promise<void> => {
      const title = input.value.trim() || suggested;
      try {
        await save({ id: crypto.randomUUID(), title, note: '', made: Date.now(), photo: null, print: k });
        d.querySelector('.kp-done')!.textContent = 'Kept. It is in My makes.';
        setTimeout(close, 900);
      } catch {
        d.querySelector('.kp-done')!.textContent = 'It could not be kept on this device.';
      }
    };
    d.querySelector('.ask-no')!.addEventListener('click', close);
    d.querySelector('.ask-yes')!.addEventListener('click', () => void keep());
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); void keep(); } });
    d.addEventListener('cancel', close);
    d.addEventListener('click', (e) => { if (e.target === d) close(); });
    d.showModal();
    input.select();
  });
}

/*
 * When to ask. In a browser, when its print window closes, which is also
 * what a Cancel does: she can say Not now. In Sukhi Play there is no print
 * window, and it says when the page has gone to the printer. Once for each
 * print, whichever says so first.
 */
let asked = 0;
function printed (): void {
  if (Date.now() - asked < 3000) return;
  asked = Date.now();
  void offerToKeep();
}
window.addEventListener('afterprint', () => { if (!inSukhiPlay) printed(); });
window.addEventListener('sukhiplay:print', (e) => {
  if ((e as CustomEvent<{ ok: boolean }>).detail?.ok) printed();
});
document.addEventListener('click', (e) => {
  if ((e.target as Element | null)?.closest?.('.keep-it')) void keepNow();
});
