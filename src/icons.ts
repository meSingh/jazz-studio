/** Drawn icons, in the current text colour. No emoji anywhere in the interface. */

const icon = (body: string): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  home: icon('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>'),
  sticker: icon('<path d="M20 12a8 8 0 1 1-8-8h8z"/><path d="M20 4v6a4 4 0 0 1-4 4h-2"/><path d="M14 14v-2a4 4 0 0 1 4-4"/>'),
  box: icon('<path d="M3 8l9-4 9 4-9 4z"/><path d="M3 8v9l9 4 9-4V8"/><path d="M12 12v9"/>'),
  camera: icon('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  palette: icon('<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>'),
  print: icon('<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>'),
  back: icon('<path d="M15 5l-7 7 7 7"/>'),
  plus: icon('<path d="M12 5v14M5 12h14"/>'),
  bin: icon('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>'),
  copy: icon('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  spin: icon('<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>'),
  rubber: icon('<path d="M4 16l9-9 6 6-7 7H7z"/><path d="M9 11l6 6"/><path d="M12 20h8"/>'),
  undo: icon('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
  star: icon('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
  play: icon('<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>'),
  up: icon('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  down: icon('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  bigger: icon('<circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6M16 16l4 4"/>'),
  smaller: icon('<circle cx="11" cy="11" r="7"/><path d="M8 11h6M16 16l4 4"/>'),
  person: icon('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 4.5-7 8-7s7 2 8 7"/>'),
  install: icon('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 7v7M9 11l3 3 3-3"/>'),
  close: icon('<path d="M6 6l12 12M18 6 6 18"/>'),
  scissors: icon('<circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="M8.5 8.5 20 18M8.5 15.5 20 6"/>')
};
