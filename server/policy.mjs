// Security headers and API proxy rules shared by server/server.mjs, the Cloudflare Pages Function
// (functions/api/[[path]].js) and the static site build (scripts/build-site.mjs), so every way of
// hosting Biotaloka sends the same policy. No Node-only APIs: this module also runs on Cloudflare.

export const REPOSITORY = 'https://github.com/asaddin02/asadin-edu-biotaloka';
export const DEFAULT_USER_AGENT = `Biotaloka/3 (open-source education atlas; +${REPOSITORY})`;

export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://static.inaturalist.org https://inaturalist-open-data.s3.amazonaws.com https://*.inaturalist.org https://tile.openstreetmap.org https://api.gbif.org https://upload.wikimedia.org",
  "connect-src 'self' https://api.gbif.org https://api.inaturalist.org https://*.wikipedia.org https://paleobiodb.org",
  "font-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

export const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), camera=(), microphone=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
};

/** Read-only endpoints the proxies may forward, and how long a response stays fresh (ms). */
export const UPSTREAM = {
  gbif: {
    base: 'https://api.gbif.org/v1/',
    allow: [/^species(\/|$)/, /^occurrence\/search$/],
    ttl: () => 3600e3,
  },
  inat: {
    base: 'https://api.inaturalist.org/v1/',
    allow: [
      /^taxa(\/[\d,]+)?$/,
      /^taxa\/autocomplete$/,
      /^observations$/,
      /^observations\/species_counts$/,
      /^places\/autocomplete$/,
    ],
    ttl: path => (path.startsWith('observations') ? 900e3 : 3600e3),
  },
};

/**
 * Maps "gbif/v1/species/1" or "inat/v1/taxa/2" (the part after /api/) to its upstream.
 * Returns { provider, path, error } where error is an HTTP status when the request is refused.
 */
export function route(apiPath) {
  const match = apiPath.match(/^(gbif|inat)\/v1\/(.+)$/);
  if (!match) return { error: 404 };
  const [, provider, path] = match;
  if (!UPSTREAM[provider].allow.some(re => re.test(path))) return { provider, path, error: 403 };
  return { provider, path };
}
