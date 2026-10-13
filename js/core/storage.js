// localStorage can be unavailable (private mode, blocked site data). Every access is guarded.
export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* nothing to remove */
  }
}

export const KEYS = {
  lang: 'biotaloka-language',
  level: 'biotaloka-level',
  role: 'biotaloka-role',
  collection: 'biotaloka-collection',
  notes: 'biotaloka-notes',
  progress: 'biotaloka-progress',
  experiments: 'biotaloka-experiments',
  scope: 'biotaloka-scope',
  labState: 'biotaloka-lab-state',
};
