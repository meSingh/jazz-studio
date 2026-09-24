/**
 * Registers the offline worker, where there is one to register.
 *
 * Only on https (and localhost). Inside Sukhi Play the studio is served over a
 * private scheme from files on a disk: there is nothing to go offline from,
 * and a browser would refuse the registration anyway. Nothing waits on this; a
 * failed registration costs offline use on a second visit, never the first.
 */
export function install (): void {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  window.addEventListener('load', () => {
    // Relative to the page, so it takes the studio's scope wherever it is
    // mounted: the root in development, /playground/studio/ in public.
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
      /* offline use is a bonus, not a requirement */
    });
  });
}
