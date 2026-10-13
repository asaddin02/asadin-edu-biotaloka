// Everything a learner creates stays in this browser. Nothing here is sent to a server.
import { read, write, remove, KEYS } from './storage.js';

const MAX_COLLECTION = 200;
const MAX_NOTES = 200;
const MAX_NOTE_LENGTH = 10000;
const MAX_SEEN = 1000;
const MAX_EXPERIMENTS = 100;

const validKey = key => Number.isSafeInteger(Number(key)) || /^inat-\d+$/.test(String(key));

/* ---------- Collection ---------- */
function loadCollection() {
  const raw = read(KEYS.collection, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(x => x && validKey(x.key) && typeof x.name === 'string')
    .map(x => ({
      key: /^inat-/.test(String(x.key)) ? String(x.key) : Number(x.key),
      name: x.name.slice(0, 200),
      common: typeof x.common === 'string' ? x.common.slice(0, 200) : '',
      kingdom: typeof x.kingdom === 'string' ? x.kingdom.slice(0, 40) : '',
      photo: typeof x.photo === 'string' && /^https:\/\//.test(x.photo) ? x.photo : '',
    }))
    .slice(-MAX_COLLECTION);
}
let collection = loadCollection();
export const getCollection = () => collection;
export const isSaved = key => collection.some(x => String(x.key) === String(key));
/** Returns the new saved state, or null when the browser refused storage. */
export function toggleSaved(item) {
  const next = isSaved(item.key)
    ? collection.filter(x => String(x.key) !== String(item.key))
    : [
        ...collection,
        {
          key: item.key,
          name: item.name,
          common: item.common || '',
          kingdom: item.kingdom || '',
          photo: item.photo || '',
        },
      ].slice(-MAX_COLLECTION);
  if (!write(KEYS.collection, next)) return null;
  collection = next;
  return isSaved(item.key);
}

/* ---------- Notes ---------- */
function loadNotes() {
  const raw = read(KEYS.notes, {});
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}
let notes = loadNotes();
export const getNote = key => (typeof notes[key]?.text === 'string' ? notes[key].text : '');
export const allNotes = () =>
  Object.entries(notes)
    .filter(([, v]) => v && typeof v.text === 'string' && v.text.trim())
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => (b.updated || 0) - (a.updated || 0));
export function setNote(key, text, meta = {}) {
  const value = String(text || '').slice(0, MAX_NOTE_LENGTH);
  if (!value.trim()) delete notes[key];
  else
    notes[key] = {
      text: value,
      updated: Date.now(),
      label: String(meta.label || notes[key]?.label || '').slice(0, 160),
      href: String(meta.href || notes[key]?.href || '').slice(0, 400),
    };
  const keys = Object.keys(notes);
  if (keys.length > MAX_NOTES) {
    keys
      .sort((a, b) => (notes[a].updated || 0) - (notes[b].updated || 0))
      .slice(0, keys.length - MAX_NOTES)
      .forEach(k => delete notes[k]);
  }
  return write(KEYS.notes, notes);
}
export function deleteNote(key) {
  delete notes[key];
  write(KEYS.notes, notes);
}

/* ---------- Experiments ---------- */
let experiments = (() => {
  const raw = read(KEYS.experiments, []);
  return Array.isArray(raw) ? raw.filter(e => e && typeof e.mode === 'string').slice(-MAX_EXPERIMENTS) : [];
})();
export const getExperiments = () => experiments;
export function addExperiment(entry) {
  experiments = [...experiments, { ...entry, time: Date.now() }].slice(-MAX_EXPERIMENTS);
  write(KEYS.experiments, experiments);
  return experiments;
}
export function clearExperiments() {
  experiments = [];
  write(KEYS.experiments, experiments);
}

/* ---------- Progress & badges ---------- */
function loadProgress() {
  const raw = read(KEYS.progress, {});
  const p = raw && typeof raw === 'object' ? raw : {};
  return {
    seen: p.seen && typeof p.seen === 'object' ? p.seen : {},
    quizzes: p.quizzes && typeof p.quizzes === 'object' ? p.quizzes : {},
    topics: p.topics && typeof p.topics === 'object' ? p.topics : {},
    labs: p.labs && typeof p.labs === 'object' ? p.labs : {},
    visits: p.visits && typeof p.visits === 'object' ? p.visits : {},
    badges: p.badges && typeof p.badges === 'object' ? p.badges : {},
  };
}
let progress = loadProgress();
export const getProgress = () => progress;

export const BADGES = [
  {
    id: 'first-step',
    icon: '👣',
    name: ['Langkah Pertama', 'First Step'],
    how: ['Buka satu halaman spesies.', 'Open one species page.'],
    test: p => count(p.seen) >= 1,
  },
  {
    id: 'explorer-10',
    icon: '🧭',
    name: ['Penjelajah', 'Explorer'],
    how: ['Kenali 10 spesies berbeda.', 'Meet 10 different species.'],
    test: p => count(p.seen) >= 10,
  },
  {
    id: 'explorer-50',
    icon: '🗺️',
    name: ['Penjelajah Ulung', 'Master Explorer'],
    how: ['Kenali 50 spesies berbeda.', 'Meet 50 different species.'],
    test: p => count(p.seen) >= 50,
  },
  {
    id: 'five-kingdoms',
    icon: '🌈',
    name: ['Pelangi Kehidupan', 'Rainbow of Life'],
    how: [
      'Kenali spesies dari hewan, tumbuhan, jamur, dan mikroba.',
      'Meet an animal, a plant, a fungus and a microbe.',
    ],
    test: p => {
      const k = new Set(Object.values(p.seen).map(s => s.kingdom));
      return (
        k.has('Animalia') &&
        k.has('Plantae') &&
        k.has('Fungi') &&
        ['Bacteria', 'Archaea', 'Protozoa', 'Chromista'].some(x => k.has(x))
      );
    },
  },
  {
    id: 'collector',
    icon: '📌',
    name: ['Kolektor', 'Collector'],
    how: ['Simpan 5 spesies ke koleksi.', 'Save 5 species to your collection.'],
    test: (p, extra) => extra.saved >= 5,
  },
  {
    id: 'quiz-first',
    icon: '❓',
    name: ['Berani Menjawab', 'Brave Answerer'],
    how: ['Selesaikan satu kuis.', 'Finish one quiz.'],
    test: p => count(p.quizzes) >= 1,
  },
  {
    id: 'quiz-star',
    icon: '⭐',
    name: ['Bintang Kuis', 'Quiz Star'],
    how: ['Dapatkan nilai 80% atau lebih pada kuis.', 'Score 80% or more on a quiz.'],
    test: p => Object.values(p.quizzes).some(q => q.best >= 0.8),
  },
  {
    id: 'reader',
    icon: '📚',
    name: ['Kutu Buku', 'Bookworm'],
    how: ['Baca 5 materi.', 'Read 5 lessons.'],
    test: p => count(p.topics) >= 5,
  },
  {
    id: 'scientist',
    icon: '🧪',
    name: ['Ilmuwan Muda', 'Young Scientist'],
    how: ['Coba 3 laboratorium berbeda.', 'Try 3 different labs.'],
    test: p => count(p.labs) >= 3,
  },
  {
    id: 'time-traveler',
    icon: '🦖',
    name: ['Penjelajah Waktu', 'Time Traveller'],
    how: ['Kunjungi halaman Kehidupan Purba.', 'Visit Prehistoric Life.'],
    test: p => !!p.visits.purba,
  },
  {
    id: 'neighbor',
    icon: '🏡',
    name: ['Tetangga Alam', 'Nature Neighbour'],
    how: ['Cari makhluk hidup di sekitarmu.', 'Look for living things near you.'],
    test: p => !!p.visits.nearby,
  },
  {
    id: 'comparer',
    icon: '⚖️',
    name: ['Si Pembanding', 'The Comparer'],
    how: ['Bandingkan dua spesies.', 'Compare two species.'],
    test: p => !!p.visits.compare,
  },
];
function count(obj) {
  return Object.keys(obj || {}).length;
}

const badgeListeners = new Set();
export const onBadge = fn => badgeListeners.add(fn);

function commit() {
  const extra = { saved: collection.length };
  const earned = [];
  for (const badge of BADGES) {
    if (!progress.badges[badge.id] && badge.test(progress, extra)) {
      progress.badges[badge.id] = Date.now();
      earned.push(badge);
    }
  }
  write(KEYS.progress, progress);
  earned.forEach(b => badgeListeners.forEach(fn => fn(b)));
}

export function trackSpecies({ key, name, kingdom }) {
  if (!validKey(key)) return;
  progress.seen[String(key)] = {
    name: String(name || '').slice(0, 120),
    kingdom: String(kingdom || ''),
    t: Date.now(),
  };
  const keys = Object.keys(progress.seen);
  if (keys.length > MAX_SEEN)
    keys
      .sort((a, b) => progress.seen[a].t - progress.seen[b].t)
      .slice(0, keys.length - MAX_SEEN)
      .forEach(k => delete progress.seen[k]);
  commit();
}
export function trackQuiz(id, score) {
  const prev = progress.quizzes[id]?.best || 0;
  progress.quizzes[id] = { best: Math.max(prev, score), last: score, t: Date.now() };
  commit();
}
export function trackTopic(id) {
  if (progress.topics[id]) return;
  progress.topics[id] = Date.now();
  commit();
}
export function trackLab(id) {
  if (progress.labs[id]) return;
  progress.labs[id] = Date.now();
  commit();
}
export function trackVisit(id) {
  if (progress.visits[id]) return;
  progress.visits[id] = Date.now();
  commit();
}
export const recheckBadges = commit;

/* ---------- Export / import / reset ---------- */
export function exportAll() {
  return {
    app: 'Biotaloka',
    version: 1,
    exported: new Date().toISOString(),
    collection,
    notes,
    progress,
    experiments,
  };
}
// Backups exported before the site was renamed carry the old app id; accept them so progress can move over.
const APP_IDS = ['Biotaloka', 'BioTaxa'];
export function importAll(data) {
  if (!data || !APP_IDS.includes(data.app)) return false;
  if (Array.isArray(data.collection)) write(KEYS.collection, data.collection);
  if (data.notes && typeof data.notes === 'object') write(KEYS.notes, data.notes);
  if (data.progress && typeof data.progress === 'object') write(KEYS.progress, data.progress);
  if (Array.isArray(data.experiments)) write(KEYS.experiments, data.experiments);
  collection = loadCollection();
  notes = loadNotes();
  progress = loadProgress();
  experiments = read(KEYS.experiments, []);
  return true;
}
export function resetAll() {
  [KEYS.collection, KEYS.notes, KEYS.progress, KEYS.experiments, KEYS.labState].forEach(remove);
  collection = [];
  notes = {};
  progress = loadProgress();
  experiments = [];
}
