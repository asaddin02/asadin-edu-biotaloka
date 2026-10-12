// Header, footer, learning-mode dialog and connectivity banner.
import { config } from '../config.js';
import { $, esc, link } from '../core/dom.js';
import { lang, level, role, LEVELS, S } from '../core/prefs.js';
import { ui } from '../i18n/ui.js';
import { brandImage, icon } from './icons.js';

const NAV = [
  { page: 'home', icon: 'home', label: () => ui.home },
  { page: 'search', icon: 'search', label: () => ui.explore },
  { page: 'tree', icon: 'tree', label: () => ui.treeShort, long: () => ui.tree },
  { page: 'learn', icon: 'learn', label: () => ui.learn },
  { page: 'lab', icon: 'lab', label: () => ui.labShort, long: () => ui.lab, desktop: true },
  { page: 'saved', icon: 'saved', label: () => ui.saved },
];
// Pages that highlight a parent navigation item.
const PARENT = {
  species: 'search',
  nearby: 'learn',
  peta: 'learn',
  compare: 'learn',
  quiz: 'learn',
  purba: 'learn',
  kamus: 'learn',
  guru: 'learn',
  tugas: 'learn',
};
const MODE_ICON = { sd: '🎒', smp: '🔍', sma: '🧬', kuliah: '🎓', teacher: '👩‍🏫' };

const s = S({
  modeTitle: ['Siapa yang sedang belajar?', 'Who is learning today?'],
  current: ['Mode sekarang', 'Current mode'],
  save: ['Selesai', 'Done'],
  saved: [
    'Pilihan tersimpan otomatis. Bisa diubah kapan saja.',
    'Your choice is saved automatically. Change it anytime.',
  ],
  footerLinks: ['Tautan', 'Links'],
  privacy: ['Privasi', 'Privacy'],
  version: ['Versi', 'Version'],
});

export function modeLabel() {
  return role === 'teacher' ? `${ui.teacher} · ${ui[level]}` : ui[level];
}

export function renderHeader(page) {
  const active = PARENT[page] || page;
  const header = $('#header');
  header.innerHTML = `<div class="header-inner">
    <a class="brand" href="/" aria-label="BioTaxa · ${esc(ui.home)}">${brandImage()}<span>BioTaxa<small>ASADIN EDU</small></span></a>
    <nav class="nav" aria-label="${ui.mainNav}">${NAV.map(
      n =>
        `<a href="${n.page === 'home' ? '/' : `/${n.page}`}" class="${active === n.page ? 'active' : ''}${n.desktop ? ' desktop-only' : ''}"${active === n.page ? ' aria-current="page"' : ''}>${icon(n.icon)}<span class="nav-short">${esc(n.label())}</span><span class="nav-long">${esc((n.long || n.label)())}</span></a>`
    ).join('')}</nav>
    <div class="header-tools">
      <button type="button" class="mode-chip" data-open-mode aria-haspopup="dialog" aria-label="${esc(ui.mode)}: ${esc(modeLabel())}">
        <span aria-hidden="true">${role === 'teacher' ? MODE_ICON.teacher : MODE_ICON[level]}</span><span class="mode-chip-text">${esc(modeLabel())}</span>
      </button>
      <div class="lang" role="group" aria-label="${ui.language}">
        <button type="button" data-lang="id" class="${lang === 'id' ? 'active' : ''}" aria-pressed="${lang === 'id'}">ID</button>
        <button type="button" data-lang="en" class="${lang === 'en' ? 'active' : ''}" aria-pressed="${lang === 'en'}">EN</button>
      </div>
    </div>
  </div>`;
}

export function renderFooter() {
  const extra = [
    config.repositoryURL ? `<li>${link(config.repositoryURL, ui.sourceCode)}</li>` : '',
    `<li><a href="/dukung">${ui.donate}</a></li>`,
  ].join('');
  $('#footer').innerHTML = `<div class="footer-main">
      <a class="brand" href="/">${brandImage()}<span>BioTaxa<small>ASADIN EDU</small></span></a>
      <p>${ui.footer}</p><span class="footer-note">${ui.footerSub}</span>
    </div>
    <nav class="footer-links" aria-label="${s.footerLinks}"><ul>
      <li><a href="/learn">${ui.learn}</a></li>
      <li><a href="/kamus">${ui.glossary}</a></li>
      <li><a href="/guru">${ui.teacherLong}</a></li>
      <li><a href="/about">${ui.about}</a></li>
      <li><a href="/about#privasi">${s.privacy}</a></li>${extra}
    </ul></nav>
    <div class="footer-discover"><span class="eyebrow">${ui.footerCurious}</span><p>${ui.footerTagline}</p></div>
    <div class="footer-bottom"><span>© BioTaxa · Asadin Edu · ${s.version} ${esc(config.version)}</span><span>${ui.licenseLine}</span></div>`;
}

export function modeOptions({ compact = false } = {}) {
  const options = [
    ...LEVELS.map(l => ({
      value: l,
      role: 'student',
      icon: MODE_ICON[l],
      title: ui[`${l}Long`],
      hint: ui[`${l}Hint`],
    })),
    {
      value: 'teacher',
      role: 'teacher',
      icon: MODE_ICON.teacher,
      title: ui.teacherLong,
      hint: ui.teacherHint,
    },
  ];
  return `<div class="mode-options${compact ? ' compact' : ''}" role="radiogroup" aria-label="${ui.chooseMode}">${options
    .map(o => {
      const checked = o.role === 'teacher' ? role === 'teacher' : role === 'student' && level === o.value;
      return `<button type="button" role="radio" aria-checked="${checked}" class="mode-option${checked ? ' selected' : ''}" data-set-mode="${o.value}">
        <span class="mode-icon" aria-hidden="true">${o.icon}</span><strong>${esc(o.title)}</strong>${compact ? '' : `<small>${esc(o.hint)}</small>`}</button>`;
    })
    .join('')}</div>`;
}

export function teacherLevelPicker() {
  return `<fieldset class="teacher-level"><legend>${ui.teachLevel}</legend><div class="teacher-level-options">${LEVELS.map(
    l =>
      `<label class="teacher-level-choice"><input type="radio" name="teacher-level" data-teacher-level value="${l}"${l === level ? ' checked' : ''}><span><strong>${esc(ui[l])}</strong><small>${esc(ui[`${l}Long`].split(' · ')[0])}</small></span></label>`
  ).join('')}</div></fieldset>`;
}

export function openModeDialog() {
  let dialog = $('#mode-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'mode-dialog';
    dialog.className = 'sheet-dialog';
    dialog.setAttribute('aria-labelledby', 'mode-title');
    dialog.addEventListener('close', () => $('[data-open-mode]')?.focus({ preventScroll: true }));
    document.body.append(dialog);
  }
  dialog.innerHTML = `<div class="sheet-head"><h2 id="mode-title">${s.modeTitle}</h2><button type="button" class="icon-button" data-close-dialog aria-label="${ui.close}">×</button></div>
    <p class="muted">${ui.modeIntro}</p>${modeOptions()}<div data-teacher-picker${role === 'teacher' ? '' : ' hidden'}>${teacherLevelPicker()}</div>
    <div class="mode-dialog-footer"><p>${s.saved}</p><button type="button" class="btn" data-close-dialog>${s.save}</button></div>`;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('[aria-checked="true"]')?.focus();
}

export function refreshModeDialog() {
  const dialog = $('#mode-dialog');
  if (!dialog?.open) return;
  // Keep the selected control and keyboard focus alive while preferences change.
  dialog.querySelectorAll('[data-set-mode]').forEach(button => {
    const checked =
      role === 'teacher' ? button.dataset.setMode === 'teacher' : button.dataset.setMode === level;
    button.setAttribute('aria-checked', String(checked));
    button.classList.toggle('selected', checked);
  });
  dialog.querySelector('[data-teacher-picker]').hidden = role !== 'teacher';
  dialog.querySelectorAll('[data-teacher-level]').forEach(input => {
    input.checked = input.value === level;
  });
}

export function setConnectivity(online) {
  const bar = $('#net-status');
  if (!bar) return;
  bar.hidden = online;
  bar.textContent = online ? '' : ui.offline;
}
