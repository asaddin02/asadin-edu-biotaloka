import { $$, esc, link } from '../core/dom.js';
import { S, pick, fmt, lang, atLeast } from '../core/prefs.js';
import { trackVisit } from '../core/userdata.js';
import { API } from '../services/api.js';
import { PERIODS, PREHISTORIC } from '../data/prehistoric.js';
import { pageHead, notice, routeURL } from '../components/common.js';

const s = S({
  title: ['Kehidupan purba', 'Prehistoric life'],
  heading: ['Menjelajah 3,5 miliar tahun kehidupan.', 'Explore 3.5 billion years of life.'],
  sub: [
    'Dari bakteri pembangun stromatolit hingga manusia Flores. Klik penanda di garis waktu untuk melompat ke kartunya.',
    'From stromatolite-building bacteria to the Flores people. Click a marker on the timeline to jump to its card.',
  ],
  timeline: ['Garis waktu bumi', 'Earth’s timeline'],
  mya: ['juta tahun lalu', 'million years ago'],
  bya: ['miliar tahun lalu', 'billion years ago'],
  kya: ['ribu tahun lalu', 'thousand years ago'],
  now: ['kini', 'today'],
  lived: ['Hidup sekitar', 'Lived about'],
  still: ['sampai sekarang', 'to the present'],
  pbdb: ['Rentang catatan fosil di PBDB', 'Fossil-record range in PBDB'],
  pbdbLoading: ['memuat data PBDB…', 'loading PBDB data…'],
  pbdbNone: ['belum tersedia', 'not available'],
  found: ['Fosil ditemukan di', 'Fossils found in'],
  indonesia: ['Ada di Indonesia', 'Found in Indonesia'],
  onlyIndo: ['Hanya yang ada di Indonesia', 'Only those found in Indonesia'],
  all: ['Tampilkan semua', 'Show all'],
  recent: ['Punah di masa modern', 'Lost in modern times'],
  recentText: [
    'Kepunahan juga terjadi sekarang, sering karena ulah manusia. Belajar dari mereka membantu kita menjaga spesies yang masih ada.',
    'Extinction still happens, often because of people. Learning from these losses helps protect the species we still have.',
  ],
  wiki: ['Wikipedia', 'Wikipedia'],
  openSpecies: ['Halaman spesies', 'Species page'],
  pbdbNote: [
    'Rentang PBDB berasal dari catatan fosil yang terdaftar dan dapat lebih lebar daripada perkiraan umum karena ketidakpastian penanggalan batuan.',
    'PBDB ranges come from registered fossil records and can be wider than common estimates because of rock-dating uncertainty.',
  ],
  precambrian: ['Prakambrium: lebih dari 85% sejarah bumi', 'Precambrian: over 85% of Earth’s history'],
});

export const title = () => s.title;

/** Readable label colour for a period swatch (WCAG relative luminance). */
function labelColor(hex) {
  const [r, g, b] = [1, 3, 5]
    .map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (lum + 0.05) / 0.05 >= 1.05 / (lum + 0.05) ? '#06121a' : '#ffffff';
}

function age(ma) {
  if (ma === 0) return s.now;
  if (ma >= 1000) return `${fmt(Number((ma / 1000).toFixed(1)))} ${s.bya}`;
  if (ma >= 1) return `${fmt(Number(ma.toFixed(ma >= 10 ? 0 : 1)))} ${s.mya}`;
  return `${fmt(Math.round(ma * 1000))} ${s.kya}`;
}
function range([from, to]) {
  if (to === 0) return `± ${age(from)} ${s.still}`;
  if (from === to) return `± ${age(from)}`;
  const unit = from >= 1 && to >= 1 ? s.mya : from < 1 && to < 1 ? s.kya : null;
  if (unit === s.mya && from < 1000)
    return `± ${fmt(Number(from.toFixed(from >= 10 ? 0 : 1)))}–${fmt(Number(to.toFixed(to >= 10 ? 0 : 1)))} ${s.mya}`;
  if (unit === s.kya) return `± ${fmt(Math.round(from * 1000))}–${fmt(Math.round(to * 1000))} ${s.kya}`;
  return `± ${age(from)} – ${age(to)}`;
}

function timeline(items) {
  const start = 538.8;
  const pos = ma => ((start - Math.min(ma, start)) / start) * 100;
  const phan = PERIODS.filter(p => p.id !== 'prakambrium');
  return `<section class="geo-timeline" aria-label="${s.timeline}"><h2 class="list-title">${s.timeline}</h2>
    <div class="timeline-scroll"><div class="timeline">
      <div class="timeline-markers">${items
        .filter(x => x.est)
        .map(
          x =>
            `<a class="timeline-marker" href="#fosil-${x.id}" style="left:${pos((x.est[0] + x.est[1]) / 2)}%" title="${esc(pick(x.name))}" aria-label="${esc(pick(x.name))}">${x.icon}</a>`
        )
        .join('')}</div>
      <div class="timeline-bar">${phan.map(p => `<span class="period" style="width:${((p.from - p.to) / start) * 100}%;background:${p.color};color:${labelColor(p.color)}" title="${esc(pick(p.name))}"><b>${esc(pick(p.name))}</b></span>`).join('')}</div>
      <div class="timeline-scale"><span>539 ${s.mya}</span><span>252</span><span>66</span><span>${s.now}</span></div>
    </div></div>
    <p class="muted small">⏳ ${s.precambrian}</p></section>`;
}

function card(x) {
  // Stegodon is a genus on iNaturalist; the others are species or subspecies pages.
  const species = !x.inat
    ? ''
    : x.id === 'stegodon'
      ? routeURL('search', { taxon: x.inat, tname: pick(x.name) })
      : `/species/inat-${x.inat}`;
  const wikiHost = lang === 'id' ? 'id' : 'en';
  return `<article class="fossil-card card" id="fosil-${x.id}"><div class="fossil-top"><span class="fossil-icon" aria-hidden="true">${x.icon}</span><div><h3>${esc(pick(x.name))}</h3><p class="card-sub strong">${esc(pick(x.group))}</p></div>${x.indo ? `<span class="badge indo">🇮🇩 ${s.indonesia}</span>` : ''}</div>
    <p>${esc(pick(x.desc))}</p>
    <dl class="kv">
      <div><dt>${s.lived}</dt><dd>${x.recent ? esc(pick(x.recent)) : esc(range(x.est))}</dd></div>
      ${x.pbdb && atLeast('smp') ? `<div><dt>${s.pbdb}</dt><dd data-pbdb="${esc(x.pbdb)}">${s.pbdbLoading}</dd></div>` : ''}
      <div><dt>${s.found}</dt><dd>${esc(pick(x.found))}</dd></div>
    </dl>
    <div class="chips">${link(`https://${wikiHost}.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(x.wiki)}`, s.wiki, { cls: 'chip' })}${x.pbdb ? link(`https://paleobiodb.org/classic/checkTaxonInfo?taxon_name=${encodeURIComponent(x.pbdb)}`, 'PBDB', { cls: 'chip' }) : ''}${species ? `<a class="chip" href="${species}">${s.openSpecies} →</a>` : ''}</div></article>`;
}

export async function render(ctx) {
  const onlyIndo = ctx.params.get('indo') === '1';
  const items = PREHISTORIC.filter(x => !onlyIndo || x.indo);
  const ancient = items.filter(x => !x.recent);
  const recent = items.filter(x => x.recent);
  const byPeriod = PERIODS.map(p => ({
    p,
    list: ancient.filter(x => x.period === p.id).sort((a, b) => b.est[0] - a.est[0]),
  })).filter(g => g.list.length);

  ctx.main.innerHTML = `${pageHead(s.heading, s.sub, 'BIOTAXA / PURBA')}
    <div class="segmented" role="group"><a href="/purba" class="${onlyIndo ? '' : 'selected'}">${s.all}</a><a href="/purba?indo=1" class="${onlyIndo ? 'selected' : ''}">🇮🇩 ${s.onlyIndo}</a></div>
    ${timeline(ancient)}
    ${byPeriod
      .map(
        ({ p, list }) =>
          `<section class="period-section"><h2 class="period-title"><span class="period-swatch" style="background:${p.color}"></span>${esc(pick(p.name))} <small>${esc(age(p.from))} – ${esc(age(p.to))}</small></h2><div class="fossil-grid">${list.map(card).join('')}</div></section>`
      )
      .join('')}
    ${recent.length ? `<section class="period-section recent"><h2 class="period-title">🕯️ ${s.recent}</h2><p class="muted">${s.recentText}</p><div class="fossil-grid">${recent.map(card).join('')}</div></section>` : ''}
    ${atLeast('smp') ? notice(s.pbdbNote) : ''}`;

  ctx.on('click', '.timeline-marker', (event, a) => {
    event.preventDefault();
    const target = document.getElementById(a.getAttribute('href').slice(1));
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target?.classList.add('flash');
    setTimeout(() => target?.classList.remove('flash'), 1600);
  });
  trackVisit('purba');

  if (!atLeast('smp')) return;
  const names = items.filter(x => x.pbdb).map(x => x.pbdb);
  try {
    const records = await API.fossils(names);
    if (!ctx.isCurrent()) return;
    const byName = new Map(records.map(r => [String(r.nam).toLowerCase(), r]));
    $$('[data-pbdb]').forEach(dd => {
      const r = byName.get(dd.dataset.pbdb.toLowerCase());
      dd.textContent =
        r && r.fea != null ? `${fmt(Number(r.fea))}–${fmt(Number(r.lla))} ${s.mya}` : s.pbdbNone;
    });
  } catch {
    $$('[data-pbdb]').forEach(dd => (dd.textContent = s.pbdbNone));
  }
}
