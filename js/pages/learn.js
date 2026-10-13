import { esc } from '../core/dom.js';
import { S, pick, level, role, LEVELS, fmt } from '../core/prefs.js';
import { getProgress, trackTopic, BADGES } from '../core/userdata.js';
import { ui } from '../i18n/ui.js';
import { TOPICS, FIELDS, findTopic, loadTopic, topicsInField, PHASES, LAYERS } from '../data/topics/index.js';
import { findSpecies } from '../data/species.js';
import { pageHead, listenButton, notice, routeURL, sectionNav, loading } from '../components/common.js';
import { rich } from '../components/richtext.js';
import { curatedCard } from '../components/cards.js';
import { quizMarkup, bindQuiz, questionsForLevel } from '../components/quiz.js';
import { icon } from '../components/icons.js';
import { catalogTools, catalogGroups, bindCatalog } from '../components/catalog.js';
import { modeLabel } from '../components/layout.js';

const s = S({
  title: ['Belajar', 'Learn'],
  heading: ['Belajar dengan caramu.', 'Learn your way.'],
  sub: [
    'Materi, kuis, dan kegiatan menyesuaikan mode belajarmu.',
    'Lessons, quizzes and activities adapt to your learning mode.',
  ],
  forYou: ['Materi untuk jenjangmu', 'Lessons for your level'],
  allTopics: ['Semua materi', 'All lessons'],
  showAll: ['Tampilkan semua materi', 'Show all lessons'],
  showMine: ['Hanya materi jenjangku', 'Only my level'],
  lessonCount: ['{n} materi', '{n} lessons'],
  read: ['Sudah dibaca', 'Read'],
  best: ['Nilai kuis terbaik', 'Best quiz score'],
  activities: ['Kegiatan', 'Activities'],
  quiz: ['Kuis & tebak foto', 'Quizzes & photo game'],
  quizText: ['Uji pemahaman dan kumpulkan lencana.', 'Check your understanding and earn badges.'],
  compare: ['Bandingkan dua spesies', 'Compare two species'],
  compareText: ['Temukan persamaan dan perbedaan.', 'Find similarities and differences.'],
  nearby: ['Di sekitarku', 'Near me'],
  nearbyText: ['Makhluk hidup yang pernah diamati di dekatmu.', 'Living things observed near you.'],
  purba: ['Kehidupan purba', 'Prehistoric life'],
  purbaText: ['Garis waktu bumi dan fosil Indonesia.', 'Earth’s timeline and Indonesian fossils.'],
  glossary: ['Kamus istilah', 'Glossary'],
  glossaryText: [
    'Istilah biologi yang dijelaskan dengan bahasa mudah.',
    'Biology terms explained in plain words.',
  ],
  lab: ['Laboratorium virtual', 'Virtual laboratory'],
  labText: ['Simulasi untuk menguji hipotesis.', 'Simulations to test hypotheses.'],
  teacher: ['Mode Guru', 'Teacher mode'],
  teacherText: [
    'Modul ajar, kunci jawaban, dan tugas lewat tautan.',
    'Lesson plans, answer keys and link-based assignments.',
  ],
  passport: ['Paspor Penjelajah', 'Explorer passport'],
  passportText: ['{n} dari {t} lencana terkumpul.', '{n} of {t} badges earned.'],
  biomap: ['Peta Biologi', 'Map of Biology'],
  biomapText: [
    'Dari molekul sampai biosfer, beserta cabang-cabang ilmu biologi.',
    'From molecules to the biosphere, plus the branches of biology.',
  ],
  yourMode: ['Mode belajarmu', 'Your learning mode'],
  change: ['Ganti', 'Change'],
  // Topic page
  version: ['Baca versi', 'Read the version for'],
  keyPoints: ['Ingat ini', 'Key ideas'],
  keySpecies: ['Kenali makhluk hidupnya', 'Meet the organisms'],
  activity: ['Coba kegiatan ini', 'Try this activity'],
  tryLab: ['Coba di laboratorium', 'Try it in the laboratory'],
  quizTitle: ['Kuis materi', 'Lesson quiz'],
  notesTitle: ['Catatanku', 'My notes'],
  related: ['Materi terkait', 'Related lessons'],
  field: ['Bidang', 'Field'],
  teacherNotes: ['Catatan guru', 'Teacher notes'],
  goals: ['Tujuan pembelajaran', 'Learning objectives'],
  time: ['Alokasi waktu', 'Time allocation'],
  steps: ['Langkah kegiatan', 'Lesson steps'],
  assess: ['Asesmen', 'Assessment'],
  misconceptions: ['Miskonsepsi yang sering muncul', 'Common misconceptions'],
  wrongIdea: ['Anggapan keliru', 'Misconception'],
  rightIdea: ['Konsep yang benar', 'Accurate idea'],
  ladder: ['Diferensiasi per jenjang', 'Differentiation by level'],
  ladderNote: [
    'Materi yang sama ditulis dalam empat lapisan. Gunakan tabel ini untuk memilih versi yang cocok bagi kelas atau siswa tertentu.',
    'The same lesson is written in four layers. Use this table to pick the version that suits a class or learner.',
  ],
  layerLevel: ['Jenjang', 'Level'],
  layerGoal: ['Tujuan', 'Objective'],
  layerKey: ['Poin kunci', 'Key ideas'],
  phase: ['Kaitan kurikulum (indikatif)', 'Curriculum link (indicative)'],
  phaseNote: [
    'Pemetaan ini bersifat indikatif. Cocokkan dengan Capaian Pembelajaran terbaru yang berlaku di sekolah Anda.',
    'This mapping is indicative. Check it against the current learning outcomes used by your school.',
  ],
  answerKey: ['Kunci jawaban', 'Answer key'],
  readMore: ['Bacaan lanjutan', 'Further reading'],
  printPlan: ['Cetak modul ajar', 'Print lesson plan'],
  prevTopic: ['Materi sebelumnya', 'Previous lesson'],
  nextTopic: ['Materi berikutnya', 'Next lesson'],
  notFound: ['Materi tidak ditemukan.', 'Lesson not found.'],
});

export const LAB_NAMES = {
  photosynthesis: ['Fotosintesis', 'Photosynthesis'],
  food: ['Aliran energi', 'Energy flow'],
  osmosis: ['Osmosis', 'Osmosis'],
  mendel: ['Pewarisan sifat', 'Heredity'],
  selection: ['Seleksi alam', 'Natural selection'],
  scale: ['Skala kehidupan', 'Scale of life'],
  lever: ['Tuas & capit', 'Levers & pincers'],
  genetic: ['Kode genetik', 'Genetic code'],
  enzyme: ['Kerja enzim', 'Enzyme activity'],
};

export const title = route => (route?.id && findTopic(route.id) ? pick(findTopic(route.id).title) : s.title);

const layerLabel = l => `${ui[l]} · ${pick(LAYERS[l])}`;

function topicCard(topic, progress) {
  const best = progress.quizzes[`topic-${topic.id}`]?.best;
  return `<a class="topic-card" data-topic="${topic.id}" href="/learn/${topic.id}"><span class="topic-icon" aria-hidden="true">${topic.icon}</span>
    <span class="topic-text"><strong>${esc(pick(topic.title))}</strong><small>${esc(pick(topic.summary))}</small>
    <span class="topic-meta">${topic.levels.map(l => `<span class="level-dot${l === level ? ' current' : ''}">${esc(ui[l])}</span>`).join('')}${progress.topics[topic.id] ? `<span class="done">✓ ${s.read}</span>` : ''}${best != null ? `<span class="done">⭐ ${fmt(Math.round(best * 100))}%</span>` : ''}</span></span></a>`;
}

function activityCard(href, iconName, title, text, tone) {
  return `<a class="action-card tone-${tone}" href="${href}"><span class="action-icon">${icon(iconName)}</span><span><strong>${esc(title)}</strong><small>${esc(text)}</small></span></a>`;
}

function hub(ctx) {
  const progress = getProgress();
  const showAll = ctx.params.get('all') === '1';
  const visible = t => showAll || t.levels.includes(level);
  const earned = Object.keys(progress.badges).length;
  const topics = TOPICS.filter(visible);
  ctx.main.innerHTML = `${pageHead(s.heading, s.sub, 'BIOTALOKA / LEARN')}
    <div class="mode-banner"><span>${s.yourMode}: <strong>${esc(modeLabel())}</strong></span><div class="actions"><a class="text-link" href="${routeURL('learn', Object.fromEntries(ctx.params))}#learning-tools" data-jump="learning-tools">${s.activities} ↓</a><button type="button" class="btn small secondary" data-open-mode>${s.change}</button></div></div>
    <div class="learn-workspace"><section class="section lesson-catalog"><div class="section-head"><h2>${showAll ? s.allTopics : s.forYou}</h2><a class="text-link" data-catalog-scope="${showAll ? '' : '1'}" href="${routeURL('learn', showAll ? {} : { all: 1 })}">${showAll ? s.showMine : s.showAll} →</a></div>
      ${catalogTools()}${catalogGroups(topics, t => topicCard(t, progress))}</section>
    <section class="section learning-tools" id="learning-tools"><div class="section-head"><h2>${s.activities}</h2></div><div class="action-grid">
      ${activityCard('/peta', 'tree', s.biomap, s.biomapText, 'mint')}
      ${activityCard('/quiz', 'quiz', s.quiz, s.quizText, 'lime')}
      ${activityCard('/compare', 'compare', s.compare, s.compareText, 'lilac')}
      ${activityCard('/nearby', 'nearby', s.nearby, s.nearbyText, 'sky')}
      ${activityCard('/purba', 'fossil', s.purba, s.purbaText, 'apricot')}
      ${activityCard('/kamus', 'book', s.glossary, s.glossaryText, 'mint')}
      ${activityCard('/lab', 'lab', s.lab, s.labText, 'blue')}
      ${activityCard('/guru', 'teacher', s.teacher, s.teacherText, role === 'teacher' ? 'lime' : 'grey')}
      ${activityCard('/saved?tab=passport', 'star', s.passport, s.passportText.replace('{n}', fmt(earned)).replace('{t}', fmt(BADGES.length)), 'apricot')}
    </div></section></div>`;
  bindCatalog(ctx, topics);
}

/** The entry for a level, falling back to the nearest level that has one. */
function at(map, lv) {
  if (!map) return null;
  if (map[lv] !== undefined) return map[lv];
  const i = LEVELS.indexOf(lv);
  for (let d = 1; d < LEVELS.length; d++)
    for (const l of [LEVELS[i - d], LEVELS[i + d]]) if (l && map[l] !== undefined) return map[l];
  return null;
}

function relatedTopics(topic) {
  const ids = topic.related?.length
    ? topic.related
    : topicsInField(topic.field)
        .map(t => t.id)
        .filter(id => id !== topic.id)
        .slice(0, 4);
  return ids.map(findTopic).filter(Boolean);
}

function misconceptionList(items) {
  return `<ul class="misconception-list">${items
    .map(
      m =>
        `<li><p class="wrong-idea"><strong>✗ ${s.wrongIdea}:</strong> ${esc(pick(m.wrong))}</p><p class="right-idea"><strong>✓ ${s.rightIdea}:</strong> ${esc(pick(m.right))}</p></li>`
    )
    .join('')}</ul>`;
}

function layerTable(topic) {
  const rows = LEVELS.filter(l => topic.body[l]);
  return `<div class="table-scroll"><table class="layer-table"><caption class="sr-only">${s.ladder}</caption><thead><tr><th scope="col">${s.layerLevel}</th><th scope="col">${s.layerGoal}</th><th scope="col">${s.layerKey}</th></tr></thead><tbody>${rows
    .map(l => {
      const goal = topic.teacher?.goals?.[l];
      const key = topic.key?.[l];
      return `<tr><th scope="row"><a href="${routeURL(`learn/${topic.id}`, l === level ? {} : { v: l })}">${esc(layerLabel(l))}</a></th><td data-label="${esc(s.layerGoal)}">${goal ? esc(pick(goal)) : '—'}</td><td data-label="${esc(s.layerKey)}">${key ? rich(pick(key), { cls: 'compact' }) : '—'}</td></tr>`;
    })
    .join('')}</tbody></table></div>`;
}

function topicPage(ctx, topic) {
  const version = LEVELS.includes(ctx.params.get('v')) ? ctx.params.get('v') : level;
  const body = at(topic.body, version);
  const key = at(topic.key, version);
  const activity = at(topic.activity, version);
  const goals = at(topic.teacher?.goals, version);
  const questions = questionsForLevel(topic.quiz);
  const species = (topic.species || []).map(sci => findSpecies({ sci })).filter(Boolean);
  const index = TOPICS.findIndex(t => t.id === topic.id);
  const prev = TOPICS[index - 1];
  const next = TOPICS[index + 1];
  const field = FIELDS.find(f => f.id === topic.field);
  const related = relatedTopics(topic);
  const reads = (topic.read || []).filter(r => !r.lv || LEVELS.indexOf(version) >= LEVELS.indexOf(r.lv) - 1);
  const teacherOpen = role === 'teacher';
  const misconceptions = topic.teacher?.misconceptions || [];

  ctx.main.innerHTML = `<nav class="breadcrumbs" aria-label="${s.title}"><a href="/learn">${s.title}</a><span aria-hidden="true">›</span>${field ? `<a href="/learn?all=1#bidang-${field.id}">${esc(pick(field.name))}</a><span aria-hidden="true">›</span>` : ''}<a href="/learn/${topic.id}" aria-current="page">${esc(pick(topic.title))}</a></nav>
    <header class="page-head topic-head"><span class="topic-hero-icon" aria-hidden="true">${topic.icon}</span><span class="eyebrow">${esc(pick(PHASES[version]))}</span><h1>${esc(pick(topic.title))}</h1><p>${esc(pick(topic.summary))}</p></header>
    <div class="version-switch" role="group" aria-label="${s.version}"><span>${s.version}:</span>${LEVELS.filter(
      l => topic.body[l]
    )
      .map(
        l =>
          `<a href="${routeURL(`learn/${topic.id}`, l === level ? {} : { v: l })}" class="${l === version ? 'selected' : ''}"${l === version ? ' aria-current="true"' : ''}>${esc(ui[l])} <small>${esc(pick(LAYERS[l]))}</small></a>`
      )
      .join('')}</div>
    ${sectionNav([
      ['topic-read', s.title],
      ['quiz', s.quizTitle],
      ['topic-notes', s.notesTitle],
    ])}
    <div class="topic-layout">
      <article class="topic-body" id="topic-read"><div class="topic-tools">${listenButton('#topic-text', `topic-${topic.id}`)}</div><div id="topic-text">${rich(pick(body))}</div>
        ${key ? `<aside class="key-points" aria-labelledby="key-title"><h2 id="key-title">📌 ${s.keyPoints}</h2>${rich(pick(key))}</aside>` : ''}</article>
      <aside class="topic-side">
        ${activity ? `<section class="card activity-card"><h2>🔎 ${s.activity}</h2>${rich(pick(activity))}</section>` : ''}
        ${topic.lab ? `<a class="action-card tone-blue" href="/lab/${topic.lab}"><span class="action-icon">${icon('lab')}</span><span><strong>${s.tryLab}</strong><small>${esc(pick(LAB_NAMES[topic.lab]))}</small></span></a>` : ''}
        ${related.length ? `<section class="card related-card"><h2>${s.related}</h2><ul class="related-list">${related.map(t => `<li><a href="/learn/${t.id}"><span aria-hidden="true">${t.icon}</span> ${esc(pick(t.title))}</a></li>`).join('')}</ul></section>` : ''}
      </aside>
    </div>
    ${species.length ? `<section class="section"><div class="section-head"><h2>${s.keySpecies}</h2></div><div class="discovery-grid">${species.map(sp => curatedCard(sp, { showFact: version === 'sd' })).join('')}</div></section>` : ''}
    <section class="section" id="quiz"><div class="section-head"><h2>❓ ${s.quizTitle}</h2></div>${quizMarkup(`topic-${topic.id}`, questions, { seed: index + 7 })}</section>
    <section class="worksheet"><h2>${s.notesTitle}</h2><label class="sr-only" for="topic-notes">${ui.notes}</label><textarea id="topic-notes" data-note-key="topic-${topic.id}" data-note-label="${esc(pick(topic.title))}" placeholder="${ui.notesHint}"></textarea><small data-note-status>${ui.notesSaved}</small></section>
    <details class="teacher-notes"${teacherOpen ? ' open' : ''}><summary>${icon('teacher')} ${s.teacherNotes}</summary>
      <div class="teacher-grid">
        <section><h3>${s.phase}</h3><p>${esc(pick(PHASES[version]))}</p><p class="muted small">${s.phaseNote}</p></section>
        ${goals ? `<section><h3>${s.goals}</h3><p>${esc(pick(goals))}</p></section>` : ''}
        ${topic.teacher?.time ? `<section><h3>${s.time}</h3><p>${esc(pick(topic.teacher.time))}</p></section>` : ''}
        ${topic.teacher?.steps ? `<section class="wide"><h3>${s.steps}</h3><ol>${topic.teacher.steps.map(x => `<li>${esc(pick(x))}</li>`).join('')}</ol></section>` : ''}
        ${topic.teacher?.assess ? `<section><h3>${s.assess}</h3><ul>${topic.teacher.assess.map(x => `<li>${esc(pick(x))}</li>`).join('')}</ul></section>` : ''}
        ${misconceptions.length ? `<section class="wide"><h3>${s.misconceptions}</h3>${misconceptionList(misconceptions)}</section>` : ''}
        <section class="wide"><h3>${s.ladder}</h3><p class="muted small">${s.ladderNote}</p>${layerTable(topic)}</section>
        <section class="wide"><h3>${s.answerKey}</h3><ol class="answer-key">${questions.map(q => `<li>${esc(pick(q.q))} <strong>→ ${esc(pick(q.a[q.c]))}</strong></li>`).join('')}</ol></section>
      </div>
      <div class="actions"><button type="button" class="btn secondary" data-print>${icon('print')} ${s.printPlan}</button><a class="btn ghost" href="/guru?topic=${topic.id}">${icon('teacher')} ${ui.teacherLong}</a></div>
    </details>
    ${reads.length ? `<section class="section"><h2>${s.readMore}</h2><ul class="source-list">${reads.map(r => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.label)} ↗</a></li>`).join('')}</ul></section>` : ''}
    <nav class="topic-nav" aria-label="${s.title}">${prev ? `<a class="btn secondary" href="/learn/${prev.id}">← ${esc(pick(prev.title))}</a>` : '<span></span>'}${next ? `<a class="btn secondary" href="/learn/${next.id}">${esc(pick(next.title))} →</a>` : ''}</nav>`;
  bindQuiz(ctx.on);
  trackTopic(topic.id);
}

export async function render(ctx) {
  if (!ctx.id) return hub(ctx);
  if (!findTopic(ctx.id)) {
    ctx.main.innerHTML = notice(s.notFound) + `<p><a class="btn" href="/learn">← ${s.title}</a></p>`;
    return;
  }
  ctx.main.innerHTML = loading();
  const topic = await loadTopic(ctx.id);
  if (!ctx.isCurrent()) return;
  topicPage(ctx, topic);
}
