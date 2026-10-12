// Deployment settings. Edit this file when publishing your own copy of BioTaxa.
export const config = {
  version: '3.0.0',

  // Media licensing policy.
  // true  → photos licensed CC BY-NC / BY-NC-SA / BY-NC-ND are shown (review the use context; free access alone does not guarantee NC compliance).
  // false → only CC0, CC BY and CC BY-SA photos are shown. Set this to false BEFORE adding ads,
  //         subscriptions, paid features or any other commercial use. See docs/LICENSING.md.
  allowNonCommercialMedia: true,

  // Optional links shown in the interface. Leave empty to hide them.
  repositoryURL: 'https://github.com/asaddin02/asadin-edu-biotaxa',
  feedbackURL: 'https://github.com/asaddin02/asadin-edu-biotaxa/issues/new/choose',
  // Verified HTTPS donation page owned by the project. Empty = monetary donations unavailable.
  donateURL: '',
  // Optional regional channels. Only configured HTTPS links appear; no geolocation required.
  // Local: your approved Indonesian provider page. International: e.g. your Ko-fi page.
  donateLocalURL: 'https://saweria.co/asadin02',
  donateInternationalURL: 'https://ko-fi.com/asadin02',

  // iNaturalist place used for the "Indonesia" gallery scope and for Indonesian common names.
  indonesiaPlaceId: 6966,

  pageSize: 24,

  endpoints: {
    gbif: 'https://api.gbif.org/v1',
    inat: 'https://api.inaturalist.org/v1',
    pbdb: 'https://paleobiodb.org/data1.2',
    gbifMaps: 'https://api.gbif.org/v2/map',
  },

  // When BioTaxa is served by server/server.mjs, requests are routed through its caching proxy.
  proxy: {
    health: '/api/health',
    gbif: '/api/gbif/v1',
    inat: '/api/inat/v1',
  },
};
