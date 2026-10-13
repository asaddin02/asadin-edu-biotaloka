// Read-aloud with the browser's built-in speech synthesis. Nothing is sent to Biotaloka.
import { lang, level } from '../core/prefs.js';

export const canSpeak = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

let active = null;
let onFinish = null;

function voiceFor(code) {
  const voices = speechSynthesis.getVoices();
  return voices.find(v => v.lang?.toLowerCase().replace('_', '-').startsWith(code)) || null;
}

/** Split long text into sentences; some engines stop after ~15 seconds of a single utterance. */
function chunks(text) {
  const sentences = String(text)
    .replace(/\s+/g, ' ')
    .match(/[^.!?…]+[.!?…]*\s*/g) || [text];
  const out = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > 220 && current) {
      out.push(current.trim());
      current = '';
    }
    current += s;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

export function isSpeaking(id) {
  return active === id;
}

export function speak(text, id, done) {
  if (!canSpeak()) return false;
  stopSpeaking();
  const code = lang === 'id' ? 'id' : 'en';
  const voice = voiceFor(code);
  const parts = chunks(text);
  active = id;
  onFinish = done;
  parts.forEach((part, index) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = code === 'id' ? 'id-ID' : 'en-US';
    if (voice) u.voice = voice;
    u.rate = level === 'sd' ? 0.9 : 1;
    if (index === parts.length - 1) {
      u.onend = () => finish(id);
      u.onerror = () => finish(id);
    }
    speechSynthesis.speak(u);
  });
  return true;
}

function finish(id) {
  if (active !== id) return;
  active = null;
  const fn = onFinish;
  onFinish = null;
  fn?.();
}

export function stopSpeaking() {
  if (!canSpeak()) return;
  const fn = onFinish;
  active = null;
  onFinish = null;
  speechSynthesis.cancel();
  fn?.();
}
