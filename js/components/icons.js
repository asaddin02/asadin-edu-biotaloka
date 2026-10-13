// Stroke icons (24×24). Decorative unless a label is given.
const paths = {
  home: '<path d="m3 10 9-7 9 7v10H4V10m5 10v-7h6v7"/>',
  tree: '<path d="M12 3v8M5 20v-6h14v6M12 11v9"/><circle cx="12" cy="4" r="2"/><circle cx="5" cy="20" r="1"/><circle cx="19" cy="20" r="1"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  lab: '<path d="M9 3h6m-5 0v7L4 20h16l-6-10V3M7 15h10"/>',
  saved: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
  learn:
    '<path d="M3 6.5 12 3l9 3.5-9 3.5-9-3.5Z"/><path d="M6.5 8v5.5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3V8M21 6.5V12"/>',
  quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6v.6M12 17h.01"/>',
  compare: '<path d="M12 3v18M5 7h14M5 7l-3 7a3.5 3.5 0 0 0 6 0L5 7Zm14 0-3 7a3.5 3.5 0 0 0 6 0l-3-7Z"/>',
  nearby:
    '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  fossil:
    '<path d="M4 20c4-1 6-3 7-6 1.2-3.4 4-6 9-6"/><path d="M8 17.5 6.5 15M11 14.5l-2-1.8M13 11l-2.2-1M16.5 9l-.8-2.3"/><circle cx="19.5" cy="7.5" r="1"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
  teacher: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4M7 9h6M7 12h4"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  print:
    '<path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z"/>',
  download: '<path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 17v3h16v-3"/>',
  upload: '<path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M4 17v3h16v-3"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3.5-3.5a4 4 0 0 0-5.7-5.7L12 6.3"/><path d="M14 10a4 4 0 0 0-5.7 0l-3.5 3.5a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>',
  leaf: '<path d="M5 19c0-9 5-14 15-15-1 10-6 15-15 15Z"/><path d="M5 19 13 11"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4V8Z"/><circle cx="12" cy="13" r="3.5"/>',
  arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
  back: '<path d="M19 12H5m0 0 6-6m-6 6 6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  sparkle:
    '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  share:
    '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};

export function icon(name, label = '') {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${paths[name] || paths.leaf}</svg>`;
}

export const brandImage = (cls = 'brand-symbol') =>
  `<img class="${cls}" src="/assets/brand/biotaloka-mark.png" alt="" width="64" height="64">`;
