// Cards shared by gallery, tree, collection and learning pages.
import { esc } from '../core/dom.js';
import { fmt, pick, S } from '../core/prefs.js';
import { ui, rankLabel } from '../i18n/ui.js';
import { photosOf, photoMarkup, curatedPhoto } from '../services/media.js';
import { scientificName } from '../services/api.js';
import { icon } from './icons.js';

const s = S({
  observations: ['observasi', 'observations'],
  inIndonesia: ['temuan di Indonesia', 'records in Indonesia'],
  nearby: ['temuan di sekitar', 'records nearby'],
  imageMissing: ['Foto berlisensi belum tersedia', 'No openly licensed photo yet'],
  imageFailed: ['Foto gagal dimuat', 'The photo could not load'],
  endemic: ['Hanya di Indonesia', 'Only in Indonesia'],
  meet: ['Kenali', 'Meet'],
});

const ICONIC = {
  Mammalia: '🐘',
  Aves: '🐦',
  Reptilia: '🦎',
  Amphibia: '🐸',
  Actinopterygii: '🐟',
  Insecta: '🦋',
  Arachnida: '🕷️',
  Mollusca: '🐚',
  Plantae: '🌿',
  Fungi: '🍄',
  Protozoa: '🔬',
  Chromista: '🟤',
  Animalia: '🐾',
  Bacteria: '🦠',
  Archaea: '♨️',
};
const ICONIC_LABEL = {
  Mammalia: ['Mamalia', 'Mammal'],
  Aves: ['Burung', 'Bird'],
  Reptilia: ['Reptil', 'Reptile'],
  Amphibia: ['Amfibi', 'Amphibian'],
  Actinopterygii: ['Ikan', 'Fish'],
  Insecta: ['Serangga', 'Insect'],
  Arachnida: ['Araknida', 'Arachnid'],
  Mollusca: ['Moluska', 'Mollusc'],
  Plantae: ['Tumbuhan', 'Plant'],
  Fungi: ['Jamur', 'Fungus'],
  Protozoa: ['Protozoa', 'Protozoan'],
  Chromista: ['Kromista', 'Chromist'],
  Animalia: ['Hewan', 'Animal'],
  Bacteria: ['Bakteri', 'Bacterium'],
  Archaea: ['Arkea', 'Archaeon'],
};
export const iconicIcon = name => ICONIC[name] || '◎';
export const iconicLabel = name => (ICONIC_LABEL[name] ? pick(ICONIC_LABEL[name]) : name || ui.species);

function placeholder(emoji) {
  return `<div class="photo-placeholder"><span aria-hidden="true">${emoji}</span><small>${s.imageMissing}</small></div>`;
}

/** iNaturalist taxon card (gallery, nearby, suggestions). */
export function visualCard(taxon, { count = null, countLabel = 'observations' } = {}) {
  const photo = photosOf(taxon)[0];
  const common = taxon.preferred_common_name;
  const isSpecies = ['species', 'subspecies', 'variety', 'form', 'hybrid'].includes(taxon.rank);
  const href = isSpecies
    ? `/species/inat-${Number(taxon.id)}`
    : `/search?taxon=${Number(taxon.id)}&tname=${encodeURIComponent(common || taxon.name)}`;
  const n = count ?? taxon.observations_count ?? 0;
  const label =
    countLabel === 'indonesia' ? s.inIndonesia : countLabel === 'nearby' ? s.nearby : s.observations;
  return `<article class="discovery-card" data-taxon="${Number(taxon.id)}">
    <a href="${href}" class="discovery-link">
      <div class="media-frame${photo ? '' : ' no-photo'}">${photo ? photoMarkup(photo, common || taxon.name) : placeholder(iconicIcon(taxon.iconic_taxon_name))}
        <span class="media-badge">${iconicIcon(taxon.iconic_taxon_name)} ${esc(iconicLabel(taxon.iconic_taxon_name))}</span><span class="image-error-text">${s.imageFailed}</span></div>
      <div class="discovery-body"><h3>${esc(common || taxon.name)}</h3><p class="latin">${esc(taxon.name)}</p>
        <div class="discovery-meta"><span><i class="live-dot"></i> ${fmt(n)} ${label}</span>${isSpecies ? '' : `<span class="badge">${esc(rankLabel(taxon.rank))}</span>`}</div></div>
    </a>${photo ? `<a class="image-license" href="${esc(photo.source)}" target="_blank" rel="noopener noreferrer">${esc(String(photo.license).toUpperCase())} ↗</a>` : ''}
  </article>`;
}

/** GBIF record card (index, tree genus pages, collection). */
export function taxonCard(x, { href, subtitle = '', photo = '' } = {}) {
  const name =
    x.nameType === 'INFORMAL'
      ? x.scientificName || x.canonicalName
      : x.canonicalName || x.scientificName || ui.unknown;
  const url =
    href ||
    (x.rank === 'SPECIES' || x.rank === 'SUBSPECIES' ? `/species/${esc(x.key)}` : `/tree/${esc(x.key)}`);
  return `<a class="card taxon-card${photo ? ' has-photo' : ''}" data-scientific="${esc(scientificName(x))}" href="${url}">${photo}
    <span class="badge">${esc(rankLabel(x.rank))}</span>${x.nameType === 'INFORMAL' ? ` <span class="badge warn">${ui.informal}</span>` : ''}
    <h3>${esc(name)}</h3>${subtitle ? `<p class="card-sub">${esc(subtitle)}</p>` : x.vernacularName ? `<p class="card-sub">${esc(x.vernacularName)}</p>` : ''}
    <div class="card-link"><span>${esc(x.family || x.kingdom || ui.open)}</span>${icon('arrow')}</div></a>`;
}

/** Curated species card from js/data/species.js. */
export function curatedCard(sp, { showFact = false } = {}) {
  const photo = curatedPhoto(sp.photo);
  return `<article class="discovery-card curated-card">
    <a href="/species/${esc(sp.id)}" class="discovery-link">
      <div class="media-frame${photo ? '' : ' no-photo'}">${photo ? photoMarkup(photo, pick(sp.name)) : placeholder('◎')}
        ${sp.end ? `<span class="media-badge endemic">🇮🇩 ${s.endemic}</span>` : ''}<span class="image-error-text">${s.imageFailed}</span></div>
      <div class="discovery-body"><h3>${esc(pick(sp.name))}</h3><p class="latin">${esc(sp.sci)}</p>${showFact ? `<p class="card-fact">${esc(pick(sp.fun).replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, k, l) => l || k))}</p>` : ''}</div>
    </a>${photo ? `<a class="image-license" href="${esc(photo.source)}" target="_blank" rel="noopener noreferrer">${esc(String(photo.license).toUpperCase())} ↗</a>` : ''}
  </article>`;
}

export const refresh = root => root?.dispatchEvent(new Event('biotaxa:enhance', { bubbles: true }));
