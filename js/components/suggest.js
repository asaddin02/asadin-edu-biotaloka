// Accessible search-as-you-type (ARIA combobox) backed by iNaturalist name autocomplete.
import { $, esc } from '../core/dom.js';
import { navigate } from '../core/router.js';
import { S } from '../core/prefs.js';
import { API } from '../services/api.js';
import { licenseAllowed } from '../services/media.js';
import { rankLabel } from '../i18n/ui.js';
import { icon } from './icons.js';
import { searchKnowledge } from '../services/localsearch.js';

const s = S({
  none: ['Tidak ada saran. Tekan Enter untuk mencari.', 'No suggestions. Press Enter to search.'],
  group: ['Kelompok', 'Group'],
  hint: ['Saran nama', 'Name suggestions'],
  topic: ['Materi', 'Lesson'],
  term: ['Istilah', 'Term'],
  branch: ['Cabang biologi', 'Branch of biology'],
  level: ['Tingkat organisasi', 'Level of organisation'],
});

let seq = 0;
let timer = null;

export function suggestField({
  id,
  name = 'q',
  value = '',
  placeholder = '',
  label = '',
  mode = 'navigate',
  rank = '',
  autofocus = false,
}) {
  return `<div class="suggest" data-suggest-root>
    <input id="${esc(id)}" name="${esc(name)}" value="${esc(value)}" placeholder="${esc(placeholder)}" aria-label="${esc(label || placeholder)}"
      autocomplete="off" spellcheck="false" maxlength="120" role="combobox" aria-autocomplete="list" aria-expanded="false"
      aria-controls="${esc(id)}-list" data-suggest="${esc(mode)}" data-suggest-rank="${esc(rank)}"${autofocus ? ' autofocus' : ''}>
    <ul id="${esc(id)}-list" class="suggest-list" role="listbox" aria-label="${s.hint}" hidden></ul>
  </div>`;
}

const listFor = input => document.getElementById(input.getAttribute('aria-controls'));

function close(input) {
  const list = listFor(input);
  if (list) {
    list.hidden = true;
    list.innerHTML = '';
  }
  input.setAttribute('aria-expanded', 'false');
  input.removeAttribute('aria-activedescendant');
}

export function closeAllSuggestions(except) {
  seq++;
  clearTimeout(timer);
  document.querySelectorAll('[data-suggest]').forEach(input => input !== except && close(input));
}

function thumb(t) {
  const p = t.default_photo;
  return p && licenseAllowed(p.license_code) && p.square_url
    ? `<img src="${esc(p.square_url)}" alt="" width="40" height="40" loading="lazy">`
    : `<span class="suggest-icon" aria-hidden="true">${icon(t.rank === 'species' ? 'leaf' : 'tree')}</span>`;
}

function localOption(id, x, i) {
  return `<li id="${id}-opt-${i}" role="option" aria-selected="false" data-index="${i}" data-href="${esc(x.href)}" class="suggest-local">
    <span class="suggest-icon" aria-hidden="true">${x.icon}</span><span class="suggest-text"><strong>${esc(x.title)}</strong><em>${esc(x.sub)}</em></span>
    <span class="suggest-rank is-group">${esc(s[x.type])}</span></li>`;
}

function render(input, results, local = []) {
  const list = listFor(input);
  if (!list) return;
  const id = input.id;
  const own = local.map((x, i) => localOption(id, x, i)).join('');
  const offset = local.length;
  list.innerHTML =
    results.length || local.length
      ? own +
        results
          .map((t, j) => {
            const i = j + offset;
            const common = t.preferred_common_name;
            const isSpecies = ['species', 'subspecies', 'variety', 'form', 'hybrid', 'complex'].includes(
              t.rank
            );
            return `<li id="${id}-opt-${i}" role="option" aria-selected="false" data-index="${i}" data-id="${Number(t.id)}" data-rank="${esc(t.rank)}" data-name="${esc(t.name)}" data-common="${esc(common || '')}">
            ${thumb(t)}<span class="suggest-text"><strong>${esc(common || t.name)}</strong><em>${esc(t.name)}</em></span>
            <span class="suggest-rank${isSpecies ? '' : ' is-group'}">${esc(isSpecies ? rankLabel(t.rank) : `${s.group} · ${rankLabel(t.rank)}`)}</span></li>`;
          })
          .join('')
      : `<li class="suggest-empty" role="presentation">${s.none}</li>`;
  list.hidden = false;
  input.setAttribute('aria-expanded', 'true');
}

export function handleSuggestInput(input) {
  clearTimeout(timer);
  const mySeq = ++seq;
  const q = input.value.trim();
  if (q.length < 2) {
    close(input);
    return;
  }
  // Two letters match too many lessons and terms; organism names still suggest from two.
  const navigating = input.dataset.suggest === 'navigate' && q.length >= 3;
  timer = setTimeout(async () => {
    // Lessons and terms come from Biotaloka itself, so they still appear offline.
    const [remote, local] = await Promise.allSettled([
      API.autocomplete(q, { rank: input.dataset.suggestRank || '', perPage: 8 }),
      navigating ? searchKnowledge(q, { limit: 3, minScore: 60 }) : Promise.resolve([]),
    ]);
    if (mySeq !== seq || document.activeElement !== input) return;
    const names = remote.status === 'fulfilled' ? remote.value.results || [] : [];
    const own = local.status === 'fulfilled' ? local.value : [];
    if (remote.status === 'rejected' && !own.length) close(input);
    else render(input, names, own);
  }, 350);
}

function options(input) {
  return [...(listFor(input)?.querySelectorAll('[role=option]') || [])];
}

function highlight(input, index) {
  const opts = options(input);
  opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === index)));
  if (opts[index]) {
    input.setAttribute('aria-activedescendant', opts[index].id);
    opts[index].scrollIntoView({ block: 'nearest' });
  } else input.removeAttribute('aria-activedescendant');
}

export function choose(input, option) {
  if (option.dataset.href) {
    close(input);
    seq++;
    navigate(option.dataset.href);
    return;
  }
  const item = {
    id: Number(option.dataset.id),
    rank: option.dataset.rank,
    name: option.dataset.name,
    common: option.dataset.common,
  };
  close(input);
  seq++;
  if (input.dataset.suggest === 'navigate') {
    const isSpecies = ['species', 'subspecies', 'variety', 'form', 'hybrid'].includes(item.rank);
    navigate(
      isSpecies
        ? `/species/inat-${item.id}`
        : `/search?${new URLSearchParams({ taxon: item.id, tname: item.common || item.name })}`
    );
  } else {
    input.value = item.common || item.name;
    input.dispatchEvent(new CustomEvent('suggest-pick', { bubbles: true, detail: item }));
  }
}

/** Returns true when the key event was consumed. */
export function handleSuggestKey(event) {
  const input = event.target;
  const list = listFor(input);
  const opts = options(input);
  const open = list && !list.hidden;
  const current = opts.findIndex(o => o.getAttribute('aria-selected') === 'true');
  if (event.key === 'ArrowDown') {
    if (!open) handleSuggestInput(input);
    else highlight(input, Math.min(opts.length - 1, current + 1));
    return true;
  }
  if (event.key === 'ArrowUp' && open) {
    highlight(input, Math.max(0, current - 1));
    return true;
  }
  if (event.key === 'Tab' || event.key === 'Escape') {
    seq++;
    clearTimeout(timer);
    close(input);
    return event.key === 'Escape' && open;
  }
  if (event.key === 'Enter' && open && current >= 0) {
    choose(input, opts[current]);
    return true;
  }
  if (event.key === 'Enter') {
    close(input);
    seq++;
    clearTimeout(timer);
  }
  return false;
}

export function handleSuggestClick(event) {
  const option = event.target.closest('.suggest-list [role=option]');
  if (!option) return false;
  const input = $(`[aria-controls="${option.parentElement.id}"]`);
  if (input) choose(input, option);
  return true;
}
