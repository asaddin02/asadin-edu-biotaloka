# Biotaloka production image: the static app plus the caching API proxy (server/server.mjs).
# The server has no npm dependencies, so nothing is installed at build time.
#
#   docker build -t biotaloka .
#   docker run -d -p 8080:8080 --name biotaloka biotaloka
#
# Behind a reverse proxy (nginx, Caddy, a PaaS router) also pass -e TRUST_PROXY=1, and -e HSTS=1 when it
# terminates HTTPS. See README.md for every setting.
FROM node:24-alpine

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

WORKDIR /app

# Files stay owned by root and read-only for the unprivileged user that runs the server.
COPY package.json LICENSE LICENSE-CONTENT.md index.html manifest.webmanifest robots.txt sw.js ./
COPY css ./css
COPY js ./js
COPY assets ./assets
COPY server ./server

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8080) + '/api/health').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"

CMD ["node", "server/server.mjs"]
