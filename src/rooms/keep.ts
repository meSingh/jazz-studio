/**
 * The "Keep it on this device" panel: how to add the studio to a home screen.
 *
 * Opened from a button in the top bar, which is only there when there is
 * something to install: not once it is on a home screen, and not inside Sukhi
 * Play. Built like Sukhi Colouring's: an Install button when the browser will
 * do it in one tap, and written steps for every device, theirs first.
 *
 * One thing this panel says that Sukhi Colouring's does not need to: on an
 * iPhone or iPad the home screen app keeps its own copy of everything, apart
 * from Safari's. A character added in Safari is not in the app. So it asks
 * them to make their changes in the app once it is there.
 */
import { canPrompt, promptInstall, device, type Device } from '../install';
import { ICONS } from '../icons';

const STEPS: Array<[Device, string, string]> = [
  ['ios', 'iPhone and iPad', 'Open this page in Safari, tap Share, then Add to Home Screen.'],
  ['android', 'Android', 'In Chrome, open the menu, then Add to Home screen.'],
  ['computer', 'Computer', 'In Chrome or Edge, click the install icon at the end of the address bar.']
];

export function openKeep (): void {
  document.querySelector('dialog.keep')?.remove();
  const mine = device();
  const rows = [...STEPS].sort((a, b) => Number(b[0] === mine) - Number(a[0] === mine));
  const dialog = document.createElement('dialog');
  dialog.className = 'keep';
  dialog.setAttribute('aria-labelledby', 'keep-title');
  dialog.innerHTML = `<button type="button" class="keep-close" aria-label="Close">${ICONS.close}</button>
    <div class="keep-art">${ICONS.install}</div>
    <h2 id="keep-title">Keep it on this device</h2>
    <p>Add the studio to your home screen and it opens like any other app, full screen, with no internet needed.</p>
    ${canPrompt() ? '<button type="button" class="go keep-go">Install</button>' : ''}
    <ul class="keep-steps">${rows.map(([key, name, how]) =>
      `<li${key === mine ? ' data-yours="1"' : ''}><b>${name}</b><span>${how}</span></li>`).join('')}</ul>
    <p class="keep-note"><b>Then make your changes in the app.</b> Your character, colours and makes are kept where you make them, and on an iPhone or iPad the app and Safari keep separate copies.</p>
    <p class="keep-done" role="status"></p>`;
  document.body.append(dialog);
  dialog.showModal();

  const close = (): void => { dialog.close(); dialog.remove(); };
  dialog.querySelector('.keep-close')!.addEventListener('click', close);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  dialog.addEventListener('cancel', () => dialog.remove());
  dialog.querySelector('.keep-go')?.addEventListener('click', async (e) => {
    const accepted = await promptInstall();
    if (accepted) {
      dialog.querySelector('.keep-done')!.textContent = 'Added. You will find it on your home screen.';
    }
    // The browser offers its prompt once; after a no, the button would do nothing.
    (e.target as HTMLElement).remove();
  });
}
