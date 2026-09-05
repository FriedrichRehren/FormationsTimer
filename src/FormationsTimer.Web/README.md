# Formations Timer — PWA

Installable web version of the .NET MAUI app in `../FormationsTimer.UI`. Same
checkpoint timeline, same wording, same warm palette — but it runs in any
browser, installs to the home screen and works offline.

No build step, no dependencies: plain HTML, CSS and ES modules.

## Run locally

A service worker needs a real origin, so open it through a server rather than
`file://` (`localhost` counts as a secure context):

```bash
python -m http.server 5188 --directory src/FormationsTimer.Web
```

Then open <http://localhost:5188>.

## Deploy

Every push is checked and the image is built and smoke-tested, but nothing is
published. A `v*` tag pushes the image to GHCR and Docker Hub and triggers the
deploy webhook. See [CI/CD](#cicd) below.

The cache version does **not** have to be bumped by hand: the image build
replaces `CACHE_VERSION = 'dev'` in `sw.js` with the commit SHA, so every deploy
invalidates the precache and installed clients get the update toast. Locally the
value stays `dev` — use "Update on reload" in the browser's Application panel
while developing.

Everything uses relative paths, so serving from a subfolder
(`https://example.com/formationstimer/`) works without changes.

## CI/CD

### One-time setup

1. Store `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` as repository secrets
   (*Settings → Secrets and variables → Actions*). Without them the image is
   published to GHCR only; the run says so in its summary rather than failing.

2. After the first release, the package `formationstimer-web` appears
   under the repository. Either make it public
   (*Package settings → Change visibility*) or log the deployment host in to
   GHCR with a PAT that has `read:packages`.

3. The stack itself is **not** deployed from this repository. It lives in the
   deployment repository `dockops` under
   `apps/internal/formations-timer/compose.yaml` and is rolled out by Dockhand.
   The `compose.yaml` next to this README is kept for local runs only. The
   container publishes no port; it joins Traefik's external network and is
   routed by its labels. TLS is not optional — browsers refuse to register a
   service worker over plain HTTP.

4. Enable the webhook for that stack in Dockhand, set a webhook secret, and
   turn on **force redeploy**. Dockhand compares the Git repository against its
   last checkout and skips the deployment when nothing changed — and the
   compose file does not change when a new image is published, so without force
   redeploy the webhook answers `{"success":true,"skipped":true}` and nothing
   is deployed.

   Store the two values as repository secrets (*Settings → Secrets and
   variables → Actions*):

   | Secret | Value |
   | --- | --- |
   | `DEPLOY_WEBHOOK_URL` | `https://<dockhand-host>/api/git/stacks/<id>/webhook` |
   | `DEPLOY_WEBHOOK_SECRET` | the webhook secret configured on the stack |

   The workflow sends the secret as an `X-Gitlab-Token` header rather than
   appending it as a `?secret=` query parameter, which the endpoint also
   accepts: Traefik logs full request URLs, so a token in the URL would end up
   in the access log on the server. Without `DEPLOY_WEBHOOK_URL` the workflow
   still publishes the image and just skips the deploy; with the URL but no
   secret it fails rather than firing an unauthenticated request.

   Polling the repository instead of using the webhook does not work here: the
   compose file does not change when a new image is published, so a release
   without a commit to `dockops` would never be noticed.

5. Verify once that updates actually land, on the deployment host:

   ```bash
   docker inspect --format '{{index .RepoDigests 0}}' formationstimer
   ```

   The digest has to match the one from the release run's summary. If it does
   not change after a release, the re-pull option is off.

### What runs when

| Trigger | Runs |
| --- | --- |
| push, pull request | Checks, `nginx -t`, image build (amd64 only, kept local), smoke test — plus all four MAUI platforms |
| tag `v*` | The same, plus multi-arch push to both registries, the deploy webhook and a GitHub Release |

So a broken Dockerfile, a broken nginx config or a broken precache list fails on
the push that caused it — but only a tag ever reaches the server.

| Step | Catches |
| --- | --- |
| `tools/check.mjs` | files in the precache list that do not exist, files missing from the `Dockerfile`'s `COPY`, a broken `CACHE_VERSION` placeholder, an uninstallable manifest, assets referenced by `index.html` but not precached, JavaScript syntax errors, translation keys missing in one language |
| `nginx -t` | a broken server config before it reaches the server |
| Smoke test | container does not start, `/healthz` unreachable, wrong `Content-Type` on `/` or `/sw.js`, cache version not stamped |

These are the failures that a local browser hides: a typo in the precache list
makes the service worker fail to install, and a wrong MIME type combined with
`nosniff` yields a blank page — both while `index.html` looks perfectly fine
when opened directly.

### Rollback

Every release is tagged `1.2.3`, `1.2`, `sha-<short>` and `latest`. Set
`FORMATIONSTIMER_TAG` to a known-good version in the stack's environment
variables and update it; nothing has to be rebuilt.

### Caching

`nginx.conf` sends `Cache-Control: no-cache` for everything. That is deliberate:
no file name carries a content hash, so a long `max-age` would let the browser
hand a stale `app.js` to the service worker's precache and strand clients on a
mix of old and new code. `no-cache` still stores responses — repeat visits cost
one 304 per file, and after the first visit the service worker answers locally
anyway.

## Layout

| File | Purpose |
| --- | --- |
| `index.html` | Markup for the three views (timer, history, settings) |
| `assets/timeline.js` | The checkpoint timeline — mirrors `UI/Domain` |
| `assets/i18n.js` | German and English strings — mirrors `AppStrings*.resx` |
| `assets/app.js` | State machine, rendering, persistence, feedback |
| `assets/styles.css` | Design tokens from `Colors.xaml` plus a dark variant |
| `sw.js` | Offline precache |
| `Dockerfile` | nginx image; stamps the cache version with the commit SHA |
| `nginx.conf`, `headers.conf` | MIME types, cache and security headers |
| `compose.yaml`, `.env.example` | Stack definition for local runs; the deployed copy lives in `dockops` |
| `tools/check.mjs` | CI checks, also runnable locally |
| `tools/generate-icons.py` | Rasterises `icons/icon.svg` into the manifest PNGs (needs Pillow) |

Run the checks before pushing:

```bash
node src/FormationsTimer.Web/tools/check.mjs
```

## Behaviour carried over from the MAUI app

* The same eight checkpoints in the same order, with the same segment names
  between them.
* One big button that starts the run, marks the next checkpoint and — once all
  eight are set — resets.
* Countdown from the configured rehearsal time, negative and highlighted when
  the run goes over.
* Per-step elapsed times, optional `mm:ss` limits with the same lenient parsing
  (`m:ss`, `mm:ss`, `h:mm:ss`, each with an optional tenth) and the same
  validation messages.
* Space triggers the primary action, as `SpaceKeyBehavior` does on desktop.
* Two-column layout on wide screens, matching the landscape split.

## What the PWA adds

* **Crash-safe runs** — the active run and all settings live in `localStorage`,
  so closing the tab, reloading or losing the app mid-rehearsal costs nothing.
* **Undo** — a mis-tapped marker no longer ruins a run. `U` on the keyboard.
* **Screen wake lock** — the display stays on while a run is in progress.
* **Alerts** — a sound cue and vibration when a step exceeds its limit or the
  rehearsal time runs out, each firing once.
* **History** — the last 20 completed runs, with over-limit steps marked.
* **Export** — any run as plain text via the share sheet or the clipboard.
* **Dark mode** and a manual light/dark override.
* **Language switch** (German/English, auto-detected by default).
* **Progress ring** around the countdown.
* **Duration presets** (10/15/20/30 min) next to the minutes field.
* **Offline** — fully usable with no network after the first visit.
