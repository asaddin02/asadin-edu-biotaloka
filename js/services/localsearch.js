// Offline search over Biotaloka's own knowledge: lessons, glossary terms, branches of biology and
// levels of organisation. Species names are searched by the providers (see suggest.js).
import { pick, lang } from '../core/prefs.js';
import { TOPICS, FIELDS, loadTopics } from '../data/topics/index.js';
import { BRANCHES, ORGANIZATION } from '../data/biomap.js';

export const normalize = text =>
  String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

let glossaryPromise = null;
const loadGlossary = () =>
  (glossaryPromise ||= import('../data/glossary.js').then(
    m => m.glossary,
    error => {
      glossaryPromise = null;
      throw error;
    }
  ));

/** Score how well `needle` matches the main names and the secondary text of an entry. */
function score(needle, names, extra = []) {
  let best = 0;
  for (const raw of names) {
    const n = normalize(raw);
    if (!n) continue;
    if (n === needle) best = Math.max(best, 100);
    else if (n.startsWith(needle)) best = Math.max(best, 80);
    else if (n.split(' ').some(w => w.startsWith(needle))) best = Math.max(best, 65);
    else if (needle.length >= 3 && n.includes(needle)) best = Math.max(best, 45);
  }
  if (!best && needle.length >= 4 && extra.some(t => normalize(t).includes(needle))) best = 15;
  return best;
}

const both = pair => (Array.isArray(pair) ? pair : [pair]);

/**
 * Lessons, terms, branches and levels matching `q`, best first.
 * Each result: { type, id, icon, title, sub, href, score }.
 */
export async function searchKnowledge(q, { limit = 8, minScore = 1 } = {}) {
  const needle = normalize(q);
  if (needle.length < 2) return [];
  const out = [];
  for (const t of TOPICS) {
    const field = FIELDS.find(f => f.id === t.field);
    const sc = score(needle, [...both(t.title), t.id.replace(/-/g, ' ')], [...both(t.summary)]);
    if (sc)
      out.push({
        type: 'topic',
        id: t.id,
        icon: t.icon,
        title: pick(t.title),
        sub: field ? pick(field.name) : '',
        href: `/learn/${t.id}`,
        score: sc + 5,
      });
  }
  for (const b of BRANCHES) {
    const sc = score(needle, both(b.name), both(b.desc));
    if (sc)
      out.push({
        type: 'branch',
        id: b.id,
        icon: '🧭',
        title: pick(b.name),
        sub: pick(b.desc),
        href: `/peta#cabang-${b.id}`,
        score: sc,
      });
  }
  for (const o of ORGANIZATION) {
    const sc = score(needle, both(o.name));
    if (sc)
      out.push({
        type: 'level',
        id: o.id,
        icon: o.icon,
        title: pick(o.name),
        sub: pick(o.desc),
        href: `/peta#tingkat-${o.id}`,
        score: sc - 5,
      });
  }
  try {
    const glossary = await loadGlossary();
    for (const g of glossary) {
      const sc = score(needle, [...both(g.term), g.id, ...(g.aliases || [])], both(g.def));
      if (sc)
        out.push({
          type: 'term',
          id: g.id,
          icon: '📖',
          title: pick(g.term),
          sub: pick(g.def),
          href: `/kamus?q=${encodeURIComponent(g.id)}`,
          score: sc,
        });
    }
  } catch {
    /* The glossary is optional for search. */
  }
  return out
    .filter(x => x.score >= minScore)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

/** Lessons whose text (in the current language, any level) mentions `q`. Loads every lesson. */
export async function lessonsMentioning(q, { exclude = [], limit = 6 } = {}) {
  const needle = normalize(q);
  if (needle.length < 3) return [];
  const topics = await loadTopics();
  const i = lang === 'en' ? 1 : 0;
  const plain = text => normalize(String(text || '').replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, '$2 $1'));
  return topics
    .filter(t => !exclude.includes(t.id))
    .map(t => {
      const text = ` ${Object.values(t.body)
        .map(v => plain(v[i]))
        .join(' ')} `;
      // Short words must match whole words ("sel" ≠ "seleksi"); longer ones may start a word.
      const hits = text.split(needle.length < 5 ? ` ${needle} ` : ` ${needle}`).length - 1;
      return { t, hits };
    })
    .filter(x => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit)
    .map(({ t }) => ({
      type: 'mention',
      id: t.id,
      icon: t.icon,
      title: pick(t.title),
      sub: pick(t.summary),
      href: `/learn/${t.id}`,
    }));
}
