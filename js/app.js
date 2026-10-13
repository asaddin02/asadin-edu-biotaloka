// Biotaloka entry point: global behaviour shared by every page.
import { $, $$, toast } from './core/dom.js';
import { applyDocument, onPrefs, update, level, lang } from './core/prefs.js';
import { configureRouter, currentURL, render, startRouter } from './core/router.js';
import { getNote, setNote, onBadge } from './core/userdata.js';
import {
  renderHeader,
  renderFooter,
  openModeDialog,
  refreshModeDialog,
  setConnectivity,
} from './components/layout.js';
import { errorState, emptyState } from './components/common.js';
import { icon } from './components/icons.js';
import { openTerm, closeTerm } from './components/richtext.js';
import {
  handleSuggestInput,
  handleSuggestKey,
  handleSuggestClick,
  closeAllSuggestions,
} from './components/suggest.js';
import { ui } from './i18n/ui.js';
import { initAPI } from './services/api.js';
import { bindImageFallbacks } from './services/media.js';
import { canSpeak, speak, stopSpeaking, isSpeaking } from './services/speech.js';

applyDocument();

/* ---------- Page lifecycle ---------- */
configureRouter({
  before(route) {
    flushNotes();
    stopSpeaking();
    closeTerm({ restoreFocus: false });
    closeAllSuggestions();
    renderHeader(route.page);
  },
  after(route, main) {
    enhance(main);
    if (route.anchor) document.getElementById(route.anchor)?.scrollIntoView();
  },
  error(route, error, notFound) {
    const main = $('#main');
    if (notFound) {
      main.innerHTML = `${emptyState(ui.notFound, '')}<p class="center"><a class="btn" href="/">${ui.backHome}</a></p>`;
      return;
    }
    const target = $('#results') || main;
    target.innerHTML = errorState();
  },
});

/** Behaviour added to freshly rendered content. Pages call it again after partial updates. */
export function enhance(root = document) {
  bindImageFallbacks(root);
  if (canSpeak()) $$('[data-speak]', root).forEach(b => (b.hidden = false));
  $$('textarea[data-note-key], input[data-note-key]', root).forEach(area => {
    if (!area.dataset.noteLoaded) {
      area.value = getNote(area.dataset.noteKey);
      area.dataset.noteLoaded = 'true';
    }
  });
}
window.addEventListener('biotaloka:enhance', event =>
  enhance(event.target instanceof Element ? event.target : document)
);

/* ---------- Notes save automatically ---------- */
const pendingNotes = new Map();
function writeNote(area) {
  const key = area.dataset.noteKey;
  clearTimeout(pendingNotes.get(key)?.timer);
  pendingNotes.delete(key);
  const ok = setNote(key, area.value, {
    label: area.dataset.noteLabel || document.title,
    href: currentURL(),
  });
  const status = area.closest('section, .field, li, .card')?.querySelector('[data-note-status]');
  if (status) status.textContent = ok ? `✓ ${ui.notesSaved}` : ui.storageFail;
}
function saveNote(area) {
  const key = area.dataset.noteKey;
  clearTimeout(pendingNotes.get(key)?.timer);
  pendingNotes.set(key, { area, timer: setTimeout(() => writeNote(area), 400) });
}
/** Never lose typing when the learner leaves quickly. */
function flushNotes() {
  for (const { area } of [...pendingNotes.values()]) writeNote(area);
}
window.addEventListener('pagehide', flushNotes);
window.addEventListener('beforeunload', flushNotes);
document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flushNotes());

/* ---------- Read aloud ---------- */
function toggleSpeech(button) {
  const id = button.dataset.speakId || button.dataset.speak;
  if (isSpeaking(id)) {
    stopSpeaking();
    return;
  }
  const target = $(button.dataset.speak);
  if (!target) return;
  const text = target.innerText.replace(/\s+/g, ' ').trim();
  const label = button.querySelector('span');
  const setIcon = name => {
    const svg = button.querySelector('svg');
    if (svg) svg.outerHTML = icon(name);
  };
  const reset = () => {
    button.classList.remove('speaking');
    button.setAttribute('aria-pressed', 'false');
    if (label) label.textContent = ui.listen;
    setIcon('speaker');
  };
  if (speak(text, id, reset)) {
    button.classList.add('speaking');
    button.setAttribute('aria-pressed', 'true');
    if (label) label.textContent = ui.stop;
    setIcon('stop');
  }
}

/* ---------- Printing keeps typed answers ---------- */
function printPage() {
  $$('.print-only').forEach(n => n.remove());
  $$('main textarea, main input[type=text]').forEach(field => {
    const p = document.createElement('p');
    p.className = 'print-only print-answer';
    p.textContent = field.value || '\n\n\n';
    field.after(p);
  });
  window.print();
}

/* ---------- Global events ---------- */
document.addEventListener('click', event => {
  if (handleSuggestClick(event)) return;
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  // Skipping moves focus only; the fragment must not end up in the address bar.
  if (target.closest('a.skip')) {
    event.preventDefault();
    $('#main')?.focus();
    return;
  }
  if (!target.closest('[data-suggest-root]')) closeAllSuggestions();
  const termPop = $('#term-pop');
  if (termPop && !termPop.hidden && !target.closest('#term-pop') && !target.closest('.term'))
    closeTerm({ restoreFocus: false });

  const jump = target.closest('[data-jump]');
  if (jump) {
    event.preventDefault();
    const section = document.getElementById(jump.dataset.jump);
    if (section) {
      section.scrollIntoView({
        block: 'start',
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
      if (!section.hasAttribute('tabindex')) section.setAttribute('tabindex', '-1');
      section.focus({ preventScroll: true });
    }
    return;
  }
  const button = target.closest('button');
  if (!button) return;
  if (button.dataset.lang) update({ lang: button.dataset.lang });
  else if (button.hasAttribute('data-open-mode')) openModeDialog();
  else if (button.dataset.setMode) {
    const dialog = button.closest('dialog');
    const value = button.dataset.setMode;
    const changed =
      value === 'teacher' ? update({ role: 'teacher', level }) : update({ role: 'student', level: value });
    if (changed) toast(ui.modeSaved);
    if (dialog && value !== 'teacher') dialog.close();
    else if (!dialog && value === 'teacher') openModeDialog();
  } else if (button.hasAttribute('data-close-dialog')) button.closest('dialog')?.close();
  else if (button.hasAttribute('data-retry')) render();
  else if (button.dataset.speak) toggleSpeech(button);
  else if (button.classList.contains('term')) openTerm(button);
  else if (button.hasAttribute('data-term-close')) closeTerm();
  else if (button.hasAttribute('data-print')) printPage();
});

document.addEventListener('change', event => {
  const t = event.target;
  if (t.matches?.('[data-teacher-level]')) update({ level: t.value, role: 'teacher' });
});

document.addEventListener('input', event => {
  const t = event.target;
  if (t.matches?.('[data-suggest]')) handleSuggestInput(t);
  if (t.matches?.('textarea[data-note-key], input[data-note-key]')) saveNote(t);
});

document.addEventListener('keydown', event => {
  const t = event.target;
  if (t.matches?.('[data-suggest]') && handleSuggestKey(event)) {
    event.preventDefault();
    return;
  }
  if (event.key === 'Escape') {
    closeTerm();
    closeAllSuggestions();
  }
});

// Close dialogs by clicking on the backdrop.
document.addEventListener('mousedown', event => {
  const dialog = event.target;
  if (dialog instanceof HTMLDialogElement && dialog.open) {
    const r = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= r.left &&
      event.clientX <= r.right &&
      event.clientY >= r.top &&
      event.clientY <= r.bottom;
    if (!inside) dialog.close();
  }
});

onPrefs(() => {
  renderFooter();
  refreshModeDialog();
  render();
});

onBadge(badge =>
  toast(`${badge.icon} ${ui.badgeEarned}: ${badge.name[lang === 'en' ? 1 : 0]}`, { tone: 'success' })
);

/* ---------- Connectivity & updates ---------- */
window.addEventListener('online', () => {
  setConnectivity(true);
  toast(ui.backOnline);
});
window.addEventListener('offline', () => setConnectivity(false));

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  // Automated tests intercept network requests, which a service worker would bypass.
  let forced = false;
  try {
    forced = localStorage.getItem('biotaloka-force-sw') === '1';
  } catch {
    /* storage unavailable: not forced */
  }
  if (navigator.webdriver && !forced) return;
  navigator.serviceWorker
    .register('/sw.js', { updateViaCache: 'none' })
    .then(registration => {
      // An update can already be waiting when a returning visitor opens the app.
      if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration.waiting);
      const watch = worker => {
        if (!worker) return;
        const check = () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(worker);
        };
        worker.addEventListener('statechange', check);
        check();
      };
      watch(registration.installing);
      registration.addEventListener('updatefound', () => watch(registration.installing));
    })
    .catch(() => {
      /* offline support is optional */
    });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (window.__biotalokaUpdating) location.reload();
  });
}
function showUpdate(worker) {
  const bar = $('#update-status');
  if (!bar) return;
  bar.innerHTML = `<span>${ui.updateReady}</span> <button type="button" class="btn small">${ui.reload}</button>`;
  bar.hidden = false;
  bar.querySelector('button').addEventListener('click', () => {
    window.__biotalokaUpdating = true;
    worker.postMessage({ type: 'SKIP_WAITING' });
  });
}

/* ---------- Start ---------- */
startRouter();
renderFooter();
setConnectivity(navigator.onLine !== false);
initAPI().finally(() => {
  render();
  registerServiceWorker();
});
