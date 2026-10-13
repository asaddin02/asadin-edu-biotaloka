// "Peta Biologi": how Biotaloka's lessons fit together, from molecules to the biosphere,
// plus an honest, computed statement of what the current content covers.
import { $, esc } from '../core/dom.js';
import { S, pick, level, LEVELS, fmt } from '../core/prefs.js';
import { ui } from '../i18n/ui.js';
import { TOPICS, FIELDS, findTopic, topicsInField, loadTopics, LAYERS } from '../data/topics/index.js';
import { ORGANIZATION, BRANCHES } from '../data/biomap.js';
import { pageHead, sectionNav, notice, errorState } from '../components/common.js';
import { rich } from '../components/richtext.js';

const s = S({
  title: ['Peta Biologi', 'Map of Biology'],
  sub: [
    'Biologi mempelajari kehidupan dari molekul sampai seluruh bumi. Peta ini menunjukkan bagaimana semua materi Biotaloka saling terhubung.',
    'Biology studies life from molecules to the whole planet. This map shows how every Biotaloka lesson fits together.',
  ],
  orgTitle: ['Tingkat organisasi kehidupan', 'Levels of biological organisation'],
  orgIntro: [
    'Setiap tingkat tersusun atas tingkat di bawahnya dan memiliki sifat baru yang tidak dimiliki bagian-bagiannya.',
    'Each level is built from the one below and has new properties that its parts do not have on their own.',
  ],
  orgNotes: [
    `- Kehidupan dimulai pada tingkat **sel**. Molekul dan organel adalah bagian dari sel, tetapi tidak hidup sendiri.
- Pada makhluk bersel satu (bakteri, amoeba), satu sel sudah merupakan satu **organisme**.
- **Virus** tidak masuk tangga ini karena tidak tersusun atas sel dan hanya bisa memperbanyak diri di dalam sel inang.
- Tumbuhan juga memiliki jaringan, organ (akar, batang, daun), dan sistem organ (sistem akar dan sistem tunas).`,
    `- Life begins at the **cell** level. Molecules and organelles are parts of cells but are not alive on their own.
- In single-celled organisms (bacteria, amoebas), one cell is a whole **organism**.
- **Viruses** are not on this ladder: they are not made of cells and can only multiply inside a host cell.
- Plants also have tissues, organs (roots, stems, leaves) and organ systems (the root and shoot systems).`,
  ],
  moreLessons: ['Materi lainnya', 'More lessons'],
  exploreLessons: ['Pilih materi belajar', 'Choose a lesson'],
  example: ['Contoh', 'Example'],
  lessons: ['Materi', 'Lessons'],
  overview: ['Materi ringkasan', 'Overview lesson'],
  fieldsTitle: ['Bidang biologi di Biotaloka', 'Fields of biology in Biotaloka'],
  fieldsIntro: [
    'Materi dikelompokkan menjadi delapan bidang. Titik menunjukkan jenjang yang disarankan; setiap materi tetap bisa dibaca di semua versi yang tersedia.',
    'Lessons are grouped into eight fields. Dots show the recommended levels; every lesson can still be read in each version it has.',
  ],
  branchesTitle: ['Cabang ilmu biologi', 'Branches of biology'],
  branchesIntro: [
    'Biologi memiliki banyak cabang ilmu. Berikut tempat setiap cabang dibahas di Biotaloka.',
    'Biology has many branches. Here is where Biotaloka covers each one.',
  ],
  partial: ['Baru dasar-dasarnya', 'Basics only'],
  partialNote: [
    'Belum ada materi khusus. Konsep dasarnya dibahas di materi berikut.',
    'No dedicated lesson yet. Its basic ideas appear in these lessons.',
  ],
  openTree: ['Jelajahi di pohon kehidupan', 'Explore in the tree of life'],
  coverageTitle: ['Cakupan Biotaloka saat ini', 'Current documented coverage'],
  coverageIntro: [
    'Angka berikut dihitung langsung dari konten di aplikasi ini, bukan perkiraan.',
    'These numbers are counted directly from the content in this app, not estimated.',
  ],
  coverageLoading: ['Menghitung cakupan…', 'Counting coverage…'],
  lessonsPerLevel: ['Materi yang punya versi jenjang ini', 'Lessons with a version for this level'],
  quizPerLevel: ['Soal kuis untuk jenjang ini', 'Quiz questions for this level'],
  terms: ['Istilah kamus', 'Glossary terms'],
  curated: ['Kartu spesies kurasi', 'Curated species cards'],
  curatedGroups: ['Kartu kurasi per kelompok', 'Curated cards by group'],
  prehistoric: ['Makhluk purba', 'Prehistoric organisms'],
  honest: [
    'Data spesies di Jelajahi dan Pohon kehidupan diambil langsung dari GBIF dan iNaturalist, sehingga jumlahnya mengikuti katalog tersebut. Katalog itu pun belum memuat semua spesies di bumi, karena banyak spesies belum ditemukan atau dideskripsikan. Kartu kurasi adalah contoh perwakilan yang ditulis dengan bahasa sederhana, bukan daftar lengkap.',
    'Species data in Explore and the Tree of life come straight from GBIF and iNaturalist, so the numbers follow those catalogues. Even they do not list every species on Earth, because many species have not yet been discovered or described. Curated cards are plain-language representatives, not a complete list.',
  ],
  level: ['Jenjang', 'Level'],
  count: ['Jumlah', 'Count'],
});

export const title = () => s.title;

const topicChip = t =>
  `<a class="chip topic-chip" href="/learn/${t.id}"><span aria-hidden="true">${t.icon}</span> ${esc(pick(t.title))}</a>`;

function organisationLadder() {
  const overview = findTopic('organisasi');
  return `<ol class="org-ladder">${ORGANIZATION.map((o, i) => {
    const lessons = TOPICS.filter(t => t.org?.includes(o.id));
    return `<li class="org-step" id="tingkat-${o.id}"><span class="org-index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="org-icon" aria-hidden="true">${o.icon}</span>
      <div class="org-text"><h3>${esc(pick(o.name))}</h3><p>${esc(pick(o.desc))}</p><p class="muted small"><strong>${s.example}:</strong> ${esc(pick(o.example))}</p>
      ${lessons.length ? `<div class="chip-row" aria-label="${s.lessons}">${lessons.slice(0, 3).map(topicChip).join('')}</div>${lessons.length > 3 ? `<details class="org-more"><summary>${s.moreLessons} (${fmt(lessons.length - 3)})</summary><div class="chip-row">${lessons.slice(3).map(topicChip).join('')}</div></details>` : ''}` : ''}</div></li>`;
  }).join(
    ''
  )}</ol>${overview ? `<p><a class="btn secondary" href="/learn/${overview.id}">${overview.icon} ${s.overview}: ${esc(pick(overview.title))}</a></p>` : ''}`;
}

function fieldList() {
  return `<div class="field-map">${FIELDS.map(
    f => `<section class="card field-card" id="bidang-${f.id}"><h3><span aria-hidden="true">${f.icon}</span> ${esc(pick(f.name))}</h3><p class="muted small">${esc(pick(f.desc))}</p>
      <ul class="field-topics">${topicsInField(f.id)
        .map(
          t =>
            `<li><a href="/learn/${t.id}"><span aria-hidden="true">${t.icon}</span> ${esc(pick(t.title))}</a><span class="topic-meta">${t.levels.map(l => `<span class="level-dot${l === level ? ' current' : ''}">${esc(ui[l])}</span>`).join('')}</span></li>`
        )
        .join('')}</ul></section>`
  ).join('')}</div>`;
}

function branchList() {
  return `<div class="branch-grid">${BRANCHES.map(b => {
    const lessons = b.topics.map(findTopic).filter(Boolean);
    const tree = b.tree === 'root' ? '/tree' : b.tree ? `/tree/${Number(b.tree)}` : '';
    return `<article class="card branch-card" id="cabang-${b.id}"><h3>${esc(pick(b.name))}${b.partial ? ` <span class="badge muted-badge">${s.partial}</span>` : ''}</h3><p>${esc(pick(b.desc))}</p>
      ${b.partial ? `<p class="muted small">${s.partialNote}</p>` : ''}
      <div class="chip-row">${lessons.map(topicChip).join('')}</div>
      ${tree ? `<a class="text-link" href="${tree}">${s.openTree} →</a>` : ''}</article>`;
  }).join('')}</div>`;
}

async function coverage(ctx) {
  const box = $('#coverage-body');
  try {
    const [topics, { glossary }, species, { PREHISTORIC }] = await Promise.all([
      loadTopics(),
      import('../data/glossary.js'),
      import('../data/species.js'),
      import('../data/prehistoric.js'),
    ]);
    if (!ctx.isCurrent() || !box) return;
    const rows = LEVELS.map(l => {
      const lessons = topics.filter(t => t.body[l]).length;
      const questions = topics.reduce((n, t) => n + t.quiz.filter(q => !q.lv || q.lv.includes(l)).length, 0);
      return `<tr${l === level ? ' class="current"' : ''}><th scope="row">${esc(ui[l])} · ${esc(pick(LAYERS[l]))}</th><td>${fmt(lessons)} / ${fmt(topics.length)}</td><td>${fmt(questions)}</td></tr>`;
    }).join('');
    const groups = Object.entries(species.GROUPS)
      .map(([id, g]) => [g, species.SPECIES.filter(x => x.g === id).length])
      .filter(([, n]) => n);
    box.innerHTML = `<div class="table-scroll"><table class="coverage-table"><caption class="sr-only">${s.coverageTitle}</caption><thead><tr><th scope="col">${s.level}</th><th scope="col">${s.lessonsPerLevel}</th><th scope="col">${s.quizPerLevel}</th></tr></thead><tbody>${rows}</tbody></table></div>
      <dl class="stat-list"><div><dt>${s.terms}</dt><dd>${fmt(glossary.length)}</dd></div><div><dt>${s.curated}</dt><dd>${fmt(species.SPECIES.length)}</dd></div><div><dt>${s.prehistoric}</dt><dd>${fmt(PREHISTORIC.length)}</dd></div></dl>
      <h3>${s.curatedGroups}</h3><ul class="group-counts">${groups.map(([g, n]) => `<li><span aria-hidden="true">${g.icon}</span> ${esc(pick(g.name))} <strong>${fmt(n)}</strong></li>`).join('')}</ul>`;
  } catch {
    if (ctx.isCurrent() && box) box.innerHTML = errorState();
  }
}

export async function render(ctx) {
  ctx.main.innerHTML = `${pageHead(s.title, s.sub, 'BIOTALOKA / PETA')}
    <div class="biomap-workspace"><aside class="biomap-navigation">${sectionNav([
      ['tingkat', s.orgTitle],
      ['bidang', s.fieldsTitle],
      ['cabang', s.branchesTitle],
      ['cakupan', s.coverageTitle],
    ])}<a class="btn secondary" href="/learn">${s.exploreLessons} →</a></aside><div class="biomap-content">
    <section class="section" id="tingkat"><div class="section-head"><h2>${s.orgTitle}</h2></div><p class="muted">${s.orgIntro}</p>${organisationLadder()}
      ${notice(rich(s.orgNotes, { cls: 'compact' }))}</section>
    <section class="section" id="bidang"><div class="section-head"><h2>${s.fieldsTitle}</h2></div><p class="muted">${s.fieldsIntro}</p>${fieldList()}</section>
    <section class="section" id="cabang"><div class="section-head"><h2>${s.branchesTitle}</h2></div><p class="muted">${s.branchesIntro}</p>${branchList()}</section>
    <section class="section" id="cakupan"><div class="section-head"><h2>${s.coverageTitle}</h2></div><p class="muted">${s.coverageIntro}</p>
      <div id="coverage-body" aria-live="polite"><p class="muted">${s.coverageLoading}</p></div>${notice(s.honest)}</section></div></div>`;
  await coverage(ctx);
}
