import { $, esc, download, toast } from '../core/dom.js';
import { S, pick, fmt, fmtDate } from '../core/prefs.js';
import {
  getCollection,
  getProgress,
  allNotes,
  deleteNote,
  BADGES,
  exportAll,
  importAll,
  resetAll,
  recheckBadges,
  getExperiments,
} from '../core/userdata.js';
import { pageHead, emptyState, routeURL } from '../components/common.js';
import { taxonCard, refresh } from '../components/cards.js';
import { icon, brandImage } from '../components/icons.js';

const s = S({
  title: ['Koleksi', 'Collection'],
  heading: ['Penemuan kecil, koleksi pribadi.', 'Little discoveries, your own collection.'],
  sub: [
    'Semua tersimpan di peramban ini saja. Tidak ada akun dan tidak ada data yang dikirim ke server Biotaloka.',
    'Everything stays in this browser. No account and no data sent to a Biotaloka server.',
  ],
  tabs: ['Bagian koleksi', 'Collection sections'],
  collection: ['Spesies', 'Species'],
  passport: ['Paspor Penjelajah', 'Explorer passport'],
  notes: ['Catatan', 'Notes'],
  data: ['Data saya', 'My data'],
  empty: ['Koleksimu menunggu penemuan pertama.', 'Your collection awaits its first discovery.'],
  emptyHint: [
    'Tekan “Simpan ke koleksi” di halaman spesies mana pun.',
    'Press “Save to collection” on any species page.',
  ],
  stats: ['Jejak penjelajahanmu', 'Your exploring so far'],
  seen: ['spesies dikenali', 'species met'],
  kingdoms: ['kingdom dijelajahi', 'kingdoms explored'],
  quizzes: ['kuis diselesaikan', 'quizzes finished'],
  topics: ['materi dibaca', 'lessons read'],
  labs: ['lab dicoba', 'labs tried'],
  experiments: ['catatan eksperimen', 'experiment records'],
  badges: ['Lencana', 'Badges'],
  locked: ['Belum terbuka', 'Locked'],
  earnedOn: ['Didapat', 'Earned'],
  recent: ['Baru saja dikenali', 'Recently met'],
  certificate: ['Sertifikat Penjelajah', 'Explorer certificate'],
  certName: ['Nama penjelajah', 'Explorer’s name'],
  certPrint: ['Cetak sertifikat', 'Print certificate'],
  certText: [
    'telah mengenali {n} spesies dan mengumpulkan {b} lencana di Biotaloka.',
    'has met {n} species and earned {b} badges on Biotaloka.',
  ],
  notesEmpty: [
    'Belum ada catatan. Catatan dari lembar kerja, materi, dan lab akan muncul di sini.',
    'No notes yet. Notes from worksheets, lessons and labs will appear here.',
  ],
  open: ['Buka', 'Open'],
  delete: ['Hapus', 'Delete'],
  deleted: ['Catatan dihapus.', 'Note deleted.'],
  exportTitle: ['Pindahkan ke perangkat lain', 'Move to another device'],
  exportText: [
    'Unduh berkas cadangan (JSON), lalu impor di perangkat lain. Berkas berisi koleksi, catatan, progres, dan buku eksperimen.',
    'Download a backup file (JSON) and import it on another device. It holds your collection, notes, progress and experiment notebook.',
  ],
  export: ['Unduh cadangan', 'Download backup'],
  import: ['Impor cadangan', 'Import backup'],
  imported: ['Data berhasil diimpor.', 'Data imported.'],
  importFail: ['Berkas tidak dikenali sebagai cadangan Biotaloka.', 'This file is not a Biotaloka backup.'],
  resetTitle: ['Hapus semua data', 'Delete all data'],
  resetText: [
    'Menghapus koleksi, catatan, progres, lencana, dan buku eksperimen dari peramban ini. Tindakan ini tidak bisa dibatalkan.',
    'Deletes your collection, notes, progress, badges and experiment notebook from this browser. This cannot be undone.',
  ],
  reset: ['Hapus semua', 'Delete everything'],
  confirm: [
    'Yakin ingin menghapus semua data Biotaloka di peramban ini?',
    'Delete all Biotaloka data in this browser?',
  ],
  resetDone: ['Semua data dihapus.', 'All data deleted.'],
});

export const title = () => s.title;
const TABS = ['collection', 'passport', 'notes', 'data'];

function collectionTab() {
  const list = getCollection();
  return list.length
    ? `<div class="taxon-grid">${list
        .map(x =>
          taxonCard(
            {
              key: x.key,
              canonicalName: x.name,
              scientificName: x.name,
              rank: 'SPECIES',
              kingdom: x.kingdom,
            },
            {
              subtitle: x.common,
              photo: x.photo
                ? `<div class="media-frame index-photo"><img src="${esc(x.photo)}" alt="" loading="lazy" width="640" height="480"></div>`
                : '',
            }
          )
        )
        .join('')}</div>`
    : emptyState(s.empty, s.emptyHint);
}

function passportTab() {
  recheckBadges();
  const p = getProgress();
  const seen = Object.entries(p.seen).sort((a, b) => b[1].t - a[1].t);
  const kingdoms = new Set(seen.map(([, v]) => v.kingdom).filter(Boolean));
  const earned = BADGES.filter(b => p.badges[b.id]);
  const stat = (n, label) => `<div class="stat"><strong>${fmt(n)}</strong><span>${label}</span></div>`;
  return `<section><h2>${s.stats}</h2><div class="stats">${stat(seen.length, s.seen)}${stat(kingdoms.size, s.kingdoms)}${stat(Object.keys(p.quizzes).length, s.quizzes)}${stat(Object.keys(p.topics).length, s.topics)}${stat(Object.keys(p.labs).length, s.labs)}${stat(getExperiments().length, s.experiments)}</div></section>
    <section class="section"><h2>${s.badges} · ${fmt(earned.length)}/${fmt(BADGES.length)}</h2><div class="badge-grid">${BADGES.map(
      b => {
        const when = p.badges[b.id];
        return `<div class="badge-card${when ? ' earned' : ''}"><span class="badge-icon" aria-hidden="true">${when ? b.icon : '🔒'}</span><strong>${esc(pick(b.name))}</strong><small>${esc(pick(b.how))}</small>${when ? `<small class="done">${s.earnedOn}: ${fmtDate(when)}</small>` : `<small class="muted">${s.locked}</small>`}</div>`;
      }
    ).join('')}</div></section>
    ${
      seen.length
        ? `<section class="section"><h2>${s.recent}</h2><div class="chips">${seen
            .slice(0, 16)
            .map(([key, v]) => `<a class="chip" href="/species/${esc(key)}"><em>${esc(v.name)}</em></a>`)
            .join('')}</div></section>`
        : ''
    }
    <section class="certificate card" id="certificate">${brandImage('cert-brand')}<span class="eyebrow">BIOTALOKA · ASADIN EDU</span><h2>${s.certificate}</h2>
      <label class="field"><span>${s.certName}</span><input type="text" id="cert-name" maxlength="60" autocomplete="name"></label>
      <p class="cert-text">${esc(s.certText.replace('{n}', fmt(seen.length)).replace('{b}', fmt(earned.length)))}</p>
      <p class="cert-badges" aria-hidden="true">${earned.map(b => b.icon).join(' ')}</p><p class="muted small">${fmtDate(new Date())}</p>
      <div class="actions"><button type="button" class="btn" data-print>${icon('print')} ${s.certPrint}</button></div></section>`;
}

function notesTab() {
  const notes = allNotes();
  return notes.length
    ? `<ul class="note-list">${notes
        .map(
          n =>
            `<li class="card note-item"><div><strong>${esc(n.label || n.key)}</strong><small class="muted">${fmtDate(n.updated, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></div><p>${esc(n.text.slice(0, 400))}${n.text.length > 400 ? '…' : ''}</p><div class="actions">${n.href && /^#?\//.test(n.href) ? `<a class="btn small secondary" href="${esc(n.href)}">${s.open}</a>` : ''}<button type="button" class="btn small ghost" data-delete-note="${esc(n.key)}">${icon('trash')} ${s.delete}</button></div></li>`
        )
        .join('')}</ul>`
    : emptyState(s.notesEmpty, '');
}

function dataTab() {
  return `<section class="card"><h2>${s.exportTitle}</h2><p>${s.exportText}</p><div class="actions"><button type="button" class="btn" data-export>${icon('download')} ${s.export}</button><label class="btn secondary file-button">${icon('upload')} ${s.import}<input type="file" accept="application/json,.json" data-import hidden></label></div></section>
    <section class="card danger-zone"><h2>${s.resetTitle}</h2><p>${s.resetText}</p><button type="button" class="btn danger" data-reset>${icon('trash')} ${s.reset}</button></section>`;
}

export async function render(ctx) {
  const tab = TABS.includes(ctx.params.get('tab')) ? ctx.params.get('tab') : 'collection';
  const labels = { collection: s.collection, passport: s.passport, notes: s.notes, data: s.data };
  const body = { collection: collectionTab, passport: passportTab, notes: notesTab, data: dataTab }[tab]();
  ctx.main.innerHTML = `${pageHead(s.heading, s.sub, 'BIOTALOKA / KOLEKSI')}
    <div class="saved-workspace"><nav class="segmented tabs-nav" aria-label="${s.tabs}">${TABS.map(t => `<a href="${routeURL('saved', t === 'collection' ? {} : { tab: t })}" class="${t === tab ? 'selected' : ''}"${t === tab ? ' aria-current="page"' : ''}>${labels[t]}</a>`).join('')}</nav>
    <div id="saved-body">${body}</div></div>`;
  refresh(ctx.main);

  ctx.on('click', '[data-delete-note]', (e, b) => {
    deleteNote(b.dataset.deleteNote);
    b.closest('li')?.remove();
    toast(s.deleted);
  });
  ctx.on('click', '[data-export]', () =>
    download(
      `biotaloka-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(exportAll(), null, 2),
      'application/json'
    )
  );
  ctx.on('change', '[data-import]', async (e, input) => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const ok = importAll(JSON.parse(await file.text()));
      toast(ok ? s.imported : s.importFail);
    } catch {
      toast(s.importFail);
    }
    input.value = '';
  });
  ctx.on('click', '[data-reset]', () => {
    if (!window.confirm(s.confirm)) return;
    resetAll();
    toast(s.resetDone);
    $('#saved-body').innerHTML = dataTab();
  });
}
