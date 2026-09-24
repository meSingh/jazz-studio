/**
 * Keeping the studio on a device: the offline worker, and the help for
 * adding it to a home screen.
 *
 * Registers the offline worker, where there is one to register.
 *
 * Only on https (and localhost). Inside Sukhi Play the studio is served over a
 * private scheme from files on a disk: there is nothing to go offline from,
 * and a browser would refuse the registration anyway. Nothing waits on this; a
 * failed registration costs offline use on a second visit, never the first.
 */
export function install (): void {
  if (!('serviceWorker' in navigator)) return;
  // Not in development. The worker serves files from its cache first, which
  // is right for a build (every file name carries a hash of its contents) and
  // wrong for the dev server, whose file names never change: it went on
  // serving yesterday's code. Any worker a dev session left behind goes too.
  if (!import.meta.env.PROD) {
    void navigator.serviceWorker.getRegistrations().then((all) => all.forEach((r) => void r.unregister()));
    return;
  }
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  window.addEventListener('load', () => {
    // Relative to the page, so it takes the studio's scope wherever it is
    // mounted: the root in development, /playground/studio/ in public.
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      /* offline use is a bonus, not a requirement */
    });
  });
}

// ------------------------------------------------------------ home screen

/**
 * The browser's own install prompt, when it offers one.
 *
 * Chrome and Edge fire beforeinstallprompt once they decide the studio can be
 * installed, and the event is the only handle on their install dialog: kept,
 * a button can open that dialog later. Safari never fires it; on an iPhone
 * the only way is the Share menu, which is why the panel always carries the
 * written steps too. Same approach as Sukhi Colouring.
 */
interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPrompt | null = null;
const listeners = new Set<() => void>();

window.addEventListener('beforeinstallprompt', (e) => {
  // No mini-infobar at the bottom of the screen, where a child's hand is.
  e.preventDefault();
  deferred = e as InstallPrompt;
  for (const fn of listeners) fn();
});

window.addEventListener('appinstalled', () => {
  deferred = null;
  for (const fn of listeners) fn();
});

/** Called whenever canPrompt() or installed() may have changed. */
export function onInstallChange (fn: () => void): void { listeners.add(fn); }

/** True when the browser has offered its own install dialog. */
export function canPrompt (): boolean { return deferred !== null; }

/** Opens the browser's install dialog. Resolves true when it was accepted. */
export async function promptInstall (): Promise<boolean> {
  const e = deferred;
  if (!e) return false;
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  return outcome === 'accepted';
}

/**
 * True when there is nothing to install: opened from a home screen already,
 * or inside Sukhi Play, where it is already an app.
 */
export function installed (): boolean {
  if (location.protocol !== 'https:' && location.protocol !== 'http:') return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return true;
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export type Device = 'ios' | 'android' | 'computer';

/** Which set of steps to put first. A guess, and the others stay visible. */
export function device (): Device {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; the touch screen gives it away.
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'computer';
}
