# Static site — no build tooling, the prep stage only stamps the cache version.
FROM alpine:3.22 AS prep

ARG BUILD_ID=dev

WORKDIR /site

# Copied file by file on purpose: nothing that is not part of the site
# (tools/, README.md, Dockerfile, nginx config) can end up in the image.
COPY index.html manifest.webmanifest sw.js ./
COPY assets ./assets
COPY icons ./icons

# Every deploy gets its own cache name, so the service worker replaces its
# precache and installed clients see the update toast.
RUN sed -i "s/^const CACHE_VERSION = 'dev';$/const CACHE_VERSION = '${BUILD_ID}';/" sw.js \
    && grep -q "^const CACHE_VERSION = '${BUILD_ID}';$" sw.js

FROM nginx:1.29-alpine-slim

COPY headers.conf /etc/nginx/headers.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=prep /site /usr/share/nginx/html

RUN nginx -t

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --spider http://127.0.0.1/healthz || exit 1
