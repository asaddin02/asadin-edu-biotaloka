import { $, esc } from '../core/dom.js';
import { S, pick, level, fmt, fmtDate } from '../core/prefs.js';
import { read, write, KEYS } from '../core/storage.js';
import { addExperiment, clearExperiments, getExperiments, trackLab } from '../core/userdata.js';
import { ui } from '../i18n/ui.js';
import { pageHead, routeURL } from '../components/common.js';
import { rich } from '../components/richtext.js';
import { refresh } from '../components/cards.js';
import { icon } from '../components/icons.js';
import photosynthesis from '../labs/photosynthesis.js';
import food from '../labs/food.js';
import osmosis from '../labs/osmosis.js';
import mendel from '../labs/mendel.js';
import selection from '../labs/selection.js';
import scale from '../labs/scale.js';
import lever from '../labs/lever.js';
import enzyme from '../labs/enzyme.js';
import genetic from '../labs/genetic.js';

const LABS = [photosynthesis, food, osmosis, enzyme, mendel, genetic, selection, scale, lever];

const s = S({
  title: ['Laboratorium', 'Laboratory'],
  heading: ['Rasa ingin tahu, bertemu eksperimen.', 'Where curiosity meets experiments.'],
  intro: [
    'Laboratorium virtual untuk membuat hipotesis, mengubah variabel, dan membaca bukti.',
    'A virtual laboratory for making hypotheses, changing variables and reading evidence.',
  ],
  model: ['SIMULASI PEMBELAJARAN', 'EDUCATIONAL SIMULATION'],
  recommended: ['Disarankan untuk jenjangmu', 'Recommended for your level'],
  about: ['Tentang model ini', 'About this model'],
  predict: ['Coba prediksi', 'Make a prediction'],
  prediction: ['Prediksi & penjelasanku', 'My prediction & explanation'],
  log: ['Buku eksperimen', 'Experiment notebook'],
  logIntro: [
    'Catat pengaturan, prediksi, hasil model, dan kesimpulanmu. Ubah satu variabel pada satu waktu.',
    'Record settings, predictions, model results and conclusions. Change one variable at a time.',
  ],
  record: ['Catat hasil model', 'Record model result'],
  clear: ['Kosongkan', 'Clear'],
  print: ['Cetak lembar eksperimen', 'Print experiment sheet'],
  settings: ['Pengaturan', 'Settings'],
  result: ['Hasil model', 'Model result'],
  when: ['Waktu', 'Time'],
  empty: [
    'Belum ada catatan. Ubah pengaturan lalu tekan “Catat hasil model”.',
    'No records yet. Change the settings, then press “Record model result”.',
  ],
  saved: ['Buku eksperimen tersimpan di peramban ini.', 'The notebook is saved in this browser.'],
  explore: ['Lihat contoh spesies', 'See example species'],
  refs: ['Rujukan', 'References'],
});

export const title = () => s.title;

let active = null;
let values = {};

function ordered() {
  return [...LABS].sort((a, b) => Number(b.levels.includes(level)) - Number(a.levels.includes(level)));
}

function loadValues(lab) {
  const saved = read(KEYS.labState, {})?.[lab.id] || {};
  const base = Object.fromEntries((lab.controls || []).map(c => [c.id, c.value]));
  return { ...base, ...(lab.defaults || {}), ...saved };
}
function saveValues() {
  const all = read(KEYS.labState, {}) || {};
  all[active.id] = values;
  write(KEYS.labState, all);
}

function control(c) {
  const value = values[c.id];
  const shown = active.formatValue ? active.formatValue(c.id, value) : fmt(value);
  return `<div class="control"><label for="${c.id}">${esc(c.label())}<output for="${c.id}" id="${c.id}-value">${esc(shown)}</output></label><input type="range" id="${c.id}" data-lab-control min="${c.min}" max="${c.max}" step="${c.step}" value="${value}"></div>`;
}

function outputHTML() {
  return active.output(active.compute(values), values);
}

function renderOutput() {
  const out = $('#lab-output');
  if (out) out.innerHTML = outputHTML();
  const extra = $('#lab-extra');
  if (extra && active.extra) extra.innerHTML = active.extra(values);
  (active.controls || []).forEach(c => {
    const o = $(`#${c.id}-value`);
    if (o) o.textContent = active.formatValue ? active.formatValue(c.id, values[c.id]) : fmt(values[c.id]);
  });
}

function renderLog() {
  const node = $('#experiment-log');
  if (!node) return;
  const list = getExperiments();
  node.innerHTML = list.length
    ? `<div class="table-wrap"><table><thead><tr><th>#</th><th>${s.model}</th><th>${s.settings}</th><th>${s.result}</th><th>${s.prediction}</th></tr></thead><tbody>${list
        .map((e, i) => {
          const lab = LABS.find(l => l.id === e.mode);
          return `<tr><td>${i + 1}<br><small>${fmtDate(e.time, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></td><td>${esc(lab ? pick(lab.title) : e.mode)}</td><td>${esc(e.settings || '')}</td><td>${esc(e.result || '')}</td><td>${esc(e.note || '')}</td></tr>`;
        })
        .join('')}</tbody></table></div>`
    : `<p class="muted">${s.empty}</p>`;
}

function settingsText() {
  const parts = (active.controls || []).map(
    c => `${c.label()}: ${active.formatValue ? active.formatValue(c.id, values[c.id]) : fmt(values[c.id])}`
  );
  for (const [k, v] of Object.entries(active.defaults || {})) parts.push(`${k}: ${values[k] ?? v}`);
  return parts.join(' · ');
}

function renderLab(ctx) {
  const lab = active;
  const main = ctx.main;
  const labs = ordered();
  main.innerHTML = `${pageHead(s.heading, s.intro, 'BIOTALOKA / LAB')}
    <div class="lab-workspace"><div class="lab-tabs" role="group" aria-label="${s.title}">${labs
      .map(
        l =>
          `<button type="button" data-lab="${l.id}" class="${l.id === lab.id ? 'active' : ''}${l.levels.includes(level) ? ' recommended' : ''}" aria-pressed="${l.id === lab.id}"><span aria-hidden="true">${l.icon}</span> ${esc(pick(l.title))}</button>`
      )
      .join('')}</div>
    <div class="lab-content"><section class="lab-grid">
      <div class="card lab-card"><span class="eyebrow">${s.model}</span><h2>${lab.icon} ${esc(pick(lab.title))}</h2>
        <div class="lab-experiment${lab.id === 'genetic' ? ' lab-experiment-sequence' : ''}"><div id="lab-panel">${lab.panel ? lab.panel(values) : ''}${(lab.controls || []).map(control).join('')}</div>
        <div id="lab-output" aria-live="polite">${outputHTML()}</div></div></div>
      <div class="card lab-guide"><div><h3>${s.about}</h3>${rich(pick(lab.intro))}
        ${lab.refs ? `<p class="source-meta">${s.refs}: ${lab.refs.map(r => `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.label)} ↗</a>`).join(' · ')}</p>` : ''}
        ${lab.chips ? `<div class="chips">${lab.chips.map(c => `<a class="chip" href="${routeURL('search', { q: c })}"><em>${esc(c)}</em> ↗</a>`).join('')}</div>` : ''}
        </div><div><h3>${s.predict}</h3><p>${esc(pick(lab.question))}</p>
        <label for="prediction">${s.prediction}</label><textarea id="prediction" data-note-key="lab-${lab.id}" data-note-label="${esc(pick(lab.title))}" placeholder="${ui.notesHint}"></textarea><small data-note-status>${ui.notesSaved}</small></div></div>
    </section>
    ${lab.extra ? `<div id="lab-extra">${lab.extra(values)}</div>` : ''}
    <section class="worksheet"><h2>${s.log}</h2><p>${s.logIntro}</p>
      <div class="actions"><button type="button" class="btn" data-record>${s.record}</button><button type="button" class="btn secondary" data-clear-log>${s.clear}</button><button type="button" class="btn secondary" data-print>${icon('print')} ${s.print}</button></div>
      <div id="experiment-log"></div><small>${s.saved}</small></section></div></div>`;
  renderLog();
  refresh(main);
  trackLab(lab.id);
  const tabs = main.querySelector('.lab-tabs');
  const selected = tabs.querySelector('[aria-pressed="true"]');
  if (tabs.scrollWidth > tabs.clientWidth) {
    tabs.scrollLeft += selected.getBoundingClientRect().left - tabs.getBoundingClientRect().left;
  }
}

export async function render(ctx) {
  active = LABS.find(l => l.id === ctx.id) || ordered()[0];
  values = loadValues(active);
  renderLab(ctx);

  const rerender = () => {
    renderOutput();
    refresh($('#main'));
  };
  const bound = new Set();
  const bindLab = lab => {
    if (!lab.bind || bound.has(lab.id)) return;
    bound.add(lab.id);
    lab.bind(
      (type, selector, fn) => ctx.on(type, selector, (e, t) => active.id === lab.id && fn(e, t)),
      rerender,
      new Proxy({}, { get: (_, k) => values[k] })
    );
  };
  bindLab(active);

  ctx.on('click', '[data-lab]', (e, b) => {
    const next = LABS.find(l => l.id === b.dataset.lab);
    if (!next || next === active) return;
    active = next;
    values = loadValues(active);
    history.replaceState(null, '', `/lab/${active.id}`);
    renderLab(ctx);
    bindLab(active);
    $(`[data-lab="${active.id}"]`)?.focus({ preventScroll: true });
  });
  ctx.on('input', '[data-lab-control]', (e, input) => {
    values[input.id] = Number(input.value);
    saveValues();
    renderOutput();
  });
  ctx.on('change', '[data-lab-select]', (e, input) => {
    const key = input.dataset.labSelect;
    const text = input.type === 'radio' || input.tagName === 'TEXTAREA' || input.type === 'text';
    values[key] = text ? input.value : /^\d+$/.test(input.value) ? Number(input.value) : input.value;
    // A lab may keep related settings in step, e.g. an example choice and its sequence.
    active.onSelect?.(key, values);
    saveValues();
    const panel = $('#lab-panel');
    if (panel && active.panel && input.dataset.labSelect !== 'n') {
      panel.innerHTML = active.panel(values) + (active.controls || []).map(control).join('');
    }
    rerender();
  });
  ctx.on('click', '[data-record]', () => {
    addExperiment({
      mode: active.id,
      settings: settingsText(),
      result: active.summary(active.compute(values), values),
      note: ($('#prediction')?.value || '').slice(0, 2000),
    });
    renderLog();
  });
  ctx.on('click', '[data-clear-log]', () => {
    clearExperiments();
    renderLog();
  });
}
