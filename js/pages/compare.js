import { $, esc } from '../core/dom.js';
import { navigate } from '../core/router.js';
import { S, pick, fmt } from '../core/prefs.js';
import { trackVisit } from '../core/userdata.js';
import { rankLabel } from '../i18n/ui.js';
import { API } from '../services/api.js';
import { photosOf, photoMarkup } from '../services/media.js';
import { describeStatus } from '../services/conservation.js';
import { findSpecies, DIETS, HABITATS } from '../data/species.js';
import { GROUPS } from '../data/groups.js';
import { pageHead, loading, errorState, routeURL } from '../components/common.js';
import { suggestField } from '../components/suggest.js';
import { refresh, iconicLabel } from '../components/cards.js';

const s = S({
  title: ['Bandingkan', 'Compare'],
  heading: ['Seberapa dekat kekerabatan mereka?', 'How closely related are they?'],
  sub: [
    'Pilih dua makhluk hidup untuk melihat persamaan, perbedaan, dan cabang pohon kehidupan yang mereka bagi.',
    'Choose two living things to see their similarities, differences and the branch of the tree of life they share.',
  ],
  first: ['Makhluk hidup pertama', 'First organism'],
  second: ['Makhluk hidup kedua', 'Second organism'],
  pick: ['Ketik nama, lalu pilih dari saran', 'Type a name, then pick a suggestion'],
  ideas: ['Coba pasangan ini', 'Try these pairs'],
  shared: ['Kerabat terdekat mereka ada di tingkat', 'Their closest shared group is at the level of'],
  sameSpecies: ['Keduanya adalah spesies yang sama.', 'They are the same species.'],
  ladder: ['Tangga klasifikasi', 'Classification ladder'],
  same: ['sama', 'same'],
  different: ['berbeda', 'different'],
  similarities: ['Persamaan', 'Similarities'],
  differences: ['Perbedaan', 'Differences'],
  both: ['Keduanya termasuk {group} ({rank}).', 'Both belong to {group} ({rank}).'],
  bothDiet: ['Keduanya {diet}.', 'Both are: {diet}.'],
  diffDiet: ['Cara makan: {a} vs {b}.', 'Diet: {a} vs {b}.'],
  diffGroup: ['{a} termasuk {ga}, sedangkan {b} termasuk {gb}.', '{a} is a {ga}, while {b} is a {gb}.'],
  splitAt: ['Mulai berbeda di tingkat {rank}: {x} dan {y}.', 'They split at the {rank} level: {x} and {y}.'],
  sharedHabitat: ['Sama-sama dapat dijumpai di {h}.', 'Both can be found in: {h}.'],
  name: ['Nama', 'Name'],
  scientific: ['Nama ilmiah', 'Scientific name'],
  group: ['Kelompok', 'Group'],
  status: ['Status konservasi', 'Conservation status'],
  diet: ['Cara makan', 'Diet'],
  habitat: ['Habitat', 'Habitat'],
  size: ['Ukuran', 'Size'],
  observations: ['Observasi di iNaturalist', 'iNaturalist observations'],
  open: ['Buka halaman spesies', 'Open species page'],
  unknownCurated: ['Belum ada kartu kurasi', 'No curated card yet'],
  swap: ['Tukar', 'Swap'],
  reset: ['Pilih ulang', 'Choose again'],
});

export const title = () => s.title;

const PAIRS = [
  [41967, 118552, ['Harimau & kucing', 'Tiger & cat']],
  [569678, 43584, ['Orangutan & manusia', 'Orangutan & human']],
  [41553, 52188, ['Paus biru & hiu paus', 'Blue whale & whale shark']],
  [40902, 13851, ['Kalong & burung gereja', 'Flying fox & sparrow']],
  [39449, 26068, ['Komodo & buaya muara', 'Komodo & saltwater crocodile']],
  [61381, 48448, ['Padi & jagung', 'Rice & maize']],
  [48715, 123330, ['Jamur lalat & ragi', 'Fly agaric & yeast']],
  [491869, 33376, ['Sanca & cicak', 'Python & house gecko']],
];
const MAIN_RANKS = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];

function pickerMarkup(a, b, taxa) {
  const slot = (id, label, value) =>
    `<div class="compare-slot"><label for="${id}">${label}</label>${suggestField({ id, name: id, value, placeholder: s.pick, label, mode: 'pick', rank: 'species' })}</div>`;
  return `<form class="compare-pickers" id="compare-form">${slot('pick-a', s.first, taxa.a?.preferred_common_name || taxa.a?.name || '')}<span class="versus" aria-hidden="true">VS</span>${slot('pick-b', s.second, taxa.b?.preferred_common_name || taxa.b?.name || '')}</form>
    ${a && b ? `<div class="actions center"><a class="btn ghost small" href="${routeURL('compare', { a: b, b: a })}">⇄ ${s.swap}</a><a class="btn ghost small" href="/compare">${s.reset}</a></div>` : ''}`;
}

function ideas() {
  return `<section class="section"><h2>${s.ideas}</h2><div class="chips">${PAIRS.map(([x, y, label]) => `<a class="chip big" href="${routeURL('compare', { a: x, b: y })}">${esc(pick(label))}</a>`).join('')}</div></section>`;
}

function groupName(anc) {
  const info = GROUPS[anc.name];
  return info
    ? `${pick(info.name)} · ${anc.name}`
    : anc.preferred_common_name
      ? `${anc.preferred_common_name} · ${anc.name}`
      : anc.name;
}

function comparison(a, b) {
  const ca = findSpecies({ inat: a.id, sci: a.name });
  const cb = findSpecies({ inat: b.id, sci: b.name });
  const lineA = [...(a.ancestors || []), a];
  const lineB = [...(b.ancestors || []), b];
  const idsB = new Set(lineB.map(x => x.id));
  const shared = [...lineA].reverse().find(x => idsB.has(x.id));
  const nameA = a.preferred_common_name || a.name;
  const nameB = b.preferred_common_name || b.name;
  const similarities = [];
  const differences = [];
  if (a.id === b.id) similarities.push(s.sameSpecies);
  else if (shared)
    similarities.push(s.both.replace('{group}', groupName(shared)).replace('{rank}', rankLabel(shared.rank)));
  if (ca && cb) {
    if (ca.diet === cb.diet)
      similarities.push(s.bothDiet.replace('{diet}', pick(DIETS[ca.diet].name).toLowerCase()));
    else
      differences.push(
        s.diffDiet.replace('{a}', pick(DIETS[ca.diet].name)).replace('{b}', pick(DIETS[cb.diet].name))
      );
    const hab = ca.hab.filter(h => cb.hab.includes(h)).map(h => pick(HABITATS[h]).toLowerCase());
    if (hab.length) similarities.push(s.sharedHabitat.replace('{h}', hab.join(', ')));
  }
  // The first main rank below the shared group where the two lineages part ways.
  const splitRank = MAIN_RANKS.find(rank => {
    const x = lineA.find(n => n.rank === rank);
    const y = lineB.find(n => n.rank === rank);
    return x && y && x.id !== y.id;
  });
  if (splitRank && a.id !== b.id) {
    const x = lineA.find(n => n.rank === splitRank);
    const y = lineB.find(n => n.rank === splitRank);
    differences.push(
      s.splitAt.replace('{rank}', rankLabel(splitRank)).replace('{x}', x.name).replace('{y}', y.name)
    );
  }
  if (a.iconic_taxon_name !== b.iconic_taxon_name)
    differences.push(
      s.diffGroup
        .replace('{a}', nameA)
        .replace('{ga}', iconicLabel(a.iconic_taxon_name).toLowerCase())
        .replace('{b}', nameB)
        .replace('{gb}', iconicLabel(b.iconic_taxon_name).toLowerCase())
    );

  const rankRow = rank => {
    const x = lineA.find(n => n.rank === rank);
    const y = lineB.find(n => n.rank === rank);
    const same = x && y && x.id === y.id;
    return `<tr class="${same ? 'shared' : ''}"><th scope="row">${esc(rankLabel(rank))}</th><td>${x ? esc(x.name) : '—'}</td><td class="match">${x && y ? (same ? `✓ ${s.same}` : `≠ ${s.different}`) : ''}</td><td>${y ? esc(y.name) : '—'}</td></tr>`;
  };
  const photo = t => {
    const p = photosOf(t)[0];
    return `<div class="media-frame compare-photo">${p ? photoMarkup(p, t.preferred_common_name || t.name) : ''}</div>`;
  };
  const status = t => {
    const st = describeStatus(t.conservation_status);
    return st ? `${st.icon} ${esc(st.name)}` : '—';
  };
  const cur = (c, k) =>
    c && c[k]
      ? esc(pick(c[k]).replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, key, label) => label || key))
      : `<span class="muted">${s.unknownCurated}</span>`;
  const row = (label, fa, fb) => `<tr><th scope="row">${label}</th><td>${fa}</td><td>${fb}</td></tr>`;

  return `<section class="compare-summary card">
      <p class="shared-line">${shared && a.id !== b.id ? `${s.shared} <strong>${esc(rankLabel(shared.rank))}: ${esc(groupName(shared))}</strong>` : a.id === b.id ? s.sameSpecies : ''}</p>
      <div class="compare-lists"><div><h3>✅ ${s.similarities}</h3><ul>${similarities.map(x => `<li>${esc(x)}</li>`).join('') || '<li>—</li>'}</ul></div><div><h3>↔️ ${s.differences}</h3><ul>${differences.map(x => `<li>${esc(x)}</li>`).join('') || '<li>—</li>'}</ul></div></div>
    </section>
    <div class="table-wrap"><table class="compare-table"><thead><tr><th></th><th>${photo(a)}<a href="/species/inat-${Number(a.id)}">${esc(nameA)}</a></th><th>${photo(b)}<a href="/species/inat-${Number(b.id)}">${esc(nameB)}</a></th></tr></thead><tbody>
      ${row(s.scientific, `<em>${esc(a.name)}</em>`, `<em>${esc(b.name)}</em>`)}
      ${row(s.group, esc(iconicLabel(a.iconic_taxon_name)), esc(iconicLabel(b.iconic_taxon_name)))}
      ${row(s.diet, ca ? esc(pick(DIETS[ca.diet]?.name || '')) : `<span class="muted">${s.unknownCurated}</span>`, cb ? esc(pick(DIETS[cb.diet]?.name || '')) : `<span class="muted">${s.unknownCurated}</span>`)}
      ${row(s.habitat, cur(ca, 'home'), cur(cb, 'home'))}
      ${row(s.size, cur(ca, 'size'), cur(cb, 'size'))}
      ${row(s.status, status(a), status(b))}
      ${row(s.observations, fmt(a.observations_count || 0), fmt(b.observations_count || 0))}
    </tbody></table></div>
    <h2 class="list-title">${s.ladder}</h2>
    <div class="table-wrap"><table class="ladder-table"><thead><tr><th></th><th>${esc(nameA)}</th><th></th><th>${esc(nameB)}</th></tr></thead><tbody>${MAIN_RANKS.map(rankRow).join('')}</tbody></table></div>`;
}

export async function render(ctx) {
  const { params, main } = ctx;
  const a = /^\d+$/.test(params.get('a') || '') ? Number(params.get('a')) : null;
  const b = /^\d+$/.test(params.get('b') || '') ? Number(params.get('b')) : null;
  main.innerHTML = `${pageHead(s.heading, s.sub, 'BIOTAXA / COMPARE')}<div id="pickers">${pickerMarkup(a, b, {})}</div><div id="compare-result">${a && b ? loading() : ''}</div>${a && b ? '' : ideas()}`;

  ctx.on('submit', '#compare-form', event => event.preventDefault());
  ctx.on('suggest-pick', '[data-suggest="pick"]', (event, input) => {
    const next = { a, b };
    next[input.id === 'pick-a' ? 'a' : 'b'] = event.detail.id;
    if (next.a && next.b) navigate(routeURL('compare', next));
    else history.replaceState(null, '', routeURL('compare', next));
    if (input.id === 'pick-a' && !next.b) $('#pick-b')?.focus();
  });

  if (!(a && b)) {
    if (a) {
      const taxon = await API.inatTaxon(a).catch(() => null);
      if (ctx.isCurrent() && taxon) $('#pickers').innerHTML = pickerMarkup(a, null, { a: taxon });
      $('#pick-b')?.focus();
    }
    return;
  }
  try {
    const [ta, tb] = await Promise.all([API.inatTaxon(a), API.inatTaxon(b)]);
    if (!ctx.isCurrent()) return;
    if (!ta || !tb) throw new Error('Taxon missing');
    $('#pickers').innerHTML = pickerMarkup(a, b, { a: ta, b: tb });
    const result = $('#compare-result');
    result.innerHTML = comparison(ta, tb);
    refresh(result);
    trackVisit('compare');
  } catch (error) {
    if (ctx.isCurrent()) $('#compare-result').innerHTML = errorState();
    console.warn('BioTaxa compare failed:', error);
  }
}
