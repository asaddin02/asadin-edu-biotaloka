// Tiny, safe markup for curated text:
//   paragraphs separated by a blank line, "- " bullet lines, **bold**, *italic*,
//   [[term]] or [[term|shown words]] linking to the glossary.
import { $, esc } from '../core/dom.js';
import { pick, atLeast } from '../core/prefs.js';
import { ui } from '../i18n/ui.js';

function inline(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, key, label) => {
      const k = key.trim().toLowerCase();
      return `<button type="button" class="term" data-term="${esc(k)}" aria-haspopup="dialog">${label || key}</button>`;
    });
}

const BULLET = /^\s*-\s+/;
const NUMBERED = /^\s*(\d+)[.)]\s+/;

/**
 * A block may mix a lead-in line with list lines ("Signs of life:\n- Breathing\n- Growing"):
 * consecutive "- " lines become a list, "1. " lines a numbered list, other lines a paragraph.
 */
export function rich(text, { cls = 'prose' } = {}) {
  const blocks = String(text || '')
    .trim()
    .split(/\n{2,}/);
  return blocks
    .map(block => {
      const out = [];
      let para = [];
      let list = null;
      const flushPara = () => {
        if (para.length) out.push(`<p class="${cls}">${inline(para.join(' '))}</p>`);
        para = [];
      };
      const flushList = () => {
        if (!list) return;
        const start = list.start > 1 ? ` start="${list.start}"` : '';
        out.push(
          `<${list.tag} class="${cls}-list"${start}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`
        );
        list = null;
      };
      for (const line of block.split('\n')) {
        const numbered = line.match(NUMBERED);
        const tag = BULLET.test(line) ? 'ul' : numbered ? 'ol' : null;
        if (!tag) {
          flushList();
          para.push(line);
          continue;
        }
        flushPara();
        if (list && list.tag !== tag) flushList();
        list ||= { tag, items: [], start: numbered ? Number(numbered[1]) : 1 };
        list.items.push(line.replace(tag === 'ul' ? BULLET : NUMBERED, ''));
      }
      flushPara();
      flushList();
      return out.join('');
    })
    .join('');
}

/** Plain text version for read-aloud and printing. */
export const richPlain = text =>
  String(text || '')
    .replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, k, l) => l || k)
    .replace(/\*/g, '');

/* ---------- Glossary popover ---------- */
let glossaryModule = null;
const loadGlossary = () => (glossaryModule ||= import('../data/glossary.js'));

export async function findTerm(key) {
  const { glossary } = await loadGlossary();
  const k = String(key).toLowerCase();
  return glossary.find(g => g.id === k || (g.aliases || []).some(a => a.toLowerCase() === k)) || null;
}

let lastTrigger = null;
export async function openTerm(button) {
  const entry = await findTerm(button.dataset.term);
  let pop = $('#term-pop');
  if (!pop) {
    pop = document.createElement('div');
    pop.id = 'term-pop';
    pop.className = 'term-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'false');
    document.body.append(pop);
  }
  lastTrigger = button;
  const title = entry ? pick(entry.term) : button.textContent;
  const body = entry ? pick(entry.def) : '';
  const advanced = entry?.adv && atLeast('sma') ? `<p class="term-adv">${esc(pick(entry.adv))}</p>` : '';
  pop.setAttribute('aria-label', title);
  pop.innerHTML = `<div class="term-pop-head"><strong>${esc(title)}</strong><button type="button" class="icon-button" data-term-close aria-label="${ui.close}">×</button></div>${
    body
      ? `<p>${esc(body)}</p>${advanced}<a href="/kamus?q=${encodeURIComponent(entry.id)}">${ui.seeGlossary} →</a>`
      : `<p>${ui.unknown}</p>`
  }`;
  pop.hidden = false;
  const r = button.getBoundingClientRect();
  const width = Math.min(340, innerWidth - 24);
  pop.style.width = `${width}px`;
  pop.style.left = `${Math.max(12, Math.min(r.left + scrollX, scrollX + innerWidth - width - 12))}px`;
  pop.style.top = `${r.bottom + scrollY + 8}px`;
  button.setAttribute('aria-expanded', 'true');
  pop.querySelector('[data-term-close]').focus();
}

export function closeTerm({ restoreFocus = true } = {}) {
  const pop = $('#term-pop');
  if (!pop || pop.hidden) return;
  pop.hidden = true;
  if (lastTrigger?.isConnected) {
    lastTrigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) lastTrigger.focus();
  }
  lastTrigger = null;
}
