/**
 * Static checks for the PWA. Run from anywhere:
 *
 *     node src/FormationsTimer.Web/tools/check.mjs
 *
 * These target the failure modes that break a PWA silently — a typo in the
 * precache list makes the service worker fail to install, and a file that
 * exists on disk but is missing from the Dockerfile is simply gone in
 * production. Both look fine in a local browser.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const failures = [];
const checks = [];

function check(name, run) {
  try {
    const detail = run();
    checks.push(`  ok    ${name}${detail ? ` (${detail})` : ''}`);
  } catch (error) {
    checks.push(`  FAIL  ${name}`);
    failures.push(`${name}: ${error.message}`);
  }
}

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/** Turns a service worker precache URL into a repo-relative path. */
function precachePath(url) {
  const stripped = url.replace(/^\.\//, '');
  return stripped === '' ? 'index.html' : stripped;
}

const swSource = read('sw.js');
const manifestSource = read('manifest.webmanifest');
const indexSource = read('index.html');

const precacheUrls = [
  ...(swSource.match(/const PRECACHE_URLS = \[([\s\S]*?)\];/)?.[1] ?? '').matchAll(/'([^']+)'/g),
].map((match) => match[1]);

const manifest = JSON.parse(manifestSource);

// ── 1. Everything the service worker precaches must exist ─────────
check('precache list is non-empty', () => {
  assert(precacheUrls.length > 0, 'could not parse PRECACHE_URLS from sw.js');
  return `${precacheUrls.length} entries`;
});

check('precached files exist', () => {
  const missing = precacheUrls.filter((url) => !existsSync(join(ROOT, precachePath(url))));
  assert(missing.length === 0, `missing: ${missing.join(', ')}`);
});

// ── 2. …and reaches the image ─────────────────────────────────────
// The Dockerfile copies explicitly, so a new top-level file is easy to forget.
check('precached files are copied by the Dockerfile', () => {
  const dockerfile = read('Dockerfile');
  // Sources of every plain COPY, i.e. all arguments except the destination.
  const copied = [...dockerfile.matchAll(/^COPY (?!--from)(.+)$/gm)].flatMap((match) =>
    match[1].trim().split(/\s+/).slice(0, -1),
  );

  const missing = precacheUrls
    .map(precachePath)
    .filter((path) => !copied.some((entry) => path === entry || path.startsWith(`${entry}/`)));

  assert(missing.length === 0, `not copied into the image: ${missing.join(', ')}`);
});

// ── 3. The cache version must be substitutable ────────────────────
check('cache version placeholder is intact', () => {
  assert(
    /^const CACHE_VERSION = 'dev';$/m.test(swSource),
    "sw.js must contain the exact line \"const CACHE_VERSION = 'dev';\" — the Dockerfile rewrites it",
  );
});

// ── 4. Manifest sanity ────────────────────────────────────────────
check('manifest icons exist', () => {
  const missing = manifest.icons
    .map((icon) => icon.src)
    .filter((src) => !existsSync(join(ROOT, src)));
  assert(missing.length === 0, `missing: ${missing.join(', ')}`);
  return `${manifest.icons.length} icons`;
});

check('manifest is installable', () => {
  assert(manifest.name, 'name is missing');
  assert(manifest.start_url, 'start_url is missing');
  assert(manifest.display === 'standalone', 'display should be "standalone"');

  const pngSizes = manifest.icons
    .filter((icon) => icon.type === 'image/png')
    .map((icon) => icon.sizes);
  assert(pngSizes.includes('192x192'), 'a 192x192 PNG icon is required');
  assert(pngSizes.includes('512x512'), 'a 512x512 PNG icon is required');
  assert(
    manifest.icons.some((icon) => icon.purpose === 'maskable'),
    'a maskable icon is required for a clean Android home screen icon',
  );
});

// ── 5. What index.html references must be precached ───────────────
check('assets referenced by index.html are precached', () => {
  const referenced = [
    ...indexSource.matchAll(/(?:href|src)="(?!https?:|data:|#)([^"]+)"/g),
  ].map((match) => match[1]);

  const precached = new Set(precacheUrls.map(precachePath));
  const missing = referenced.filter((path) => !precached.has(path));

  assert(missing.length === 0, `referenced but not precached: ${missing.join(', ')}`);
  return `${referenced.length} references`;
});

// ── 6. The JavaScript has to parse ────────────────────────────────
check('JavaScript parses', () => {
  const files = ['sw.js', 'assets/app.js', 'assets/i18n.js', 'assets/timeline.js'];
  for (const file of files) {
    execFileSync(process.execPath, ['--check', join(ROOT, file)], { stdio: 'pipe' });
  }
  return `${files.length} files`;
});

// ── 7. Every translation key exists in both languages ─────────────
check('translations are complete', () => {
  const source = read('assets/i18n.js');
  const blocks = [...source.matchAll(/^  (en|de): \{$/gm)];
  assert(blocks.length === 2, 'expected an "en" and a "de" block in i18n.js');

  const keysOf = (language) => {
    const start = source.indexOf(`  ${language}: {`);
    const end = source.indexOf('\n  },', start);
    const body = source.slice(start, end);
    return new Set([...body.matchAll(/^    ([A-Za-z0-9_]+):/gm)].map((match) => match[1]));
  };

  const en = keysOf('en');
  const de = keysOf('de');
  const missingInDe = [...en].filter((key) => !de.has(key));
  const missingInEn = [...de].filter((key) => !en.has(key));

  assert(
    missingInDe.length === 0 && missingInEn.length === 0,
    `missing in de: ${missingInDe.join(', ') || '—'}; missing in en: ${missingInEn.join(', ') || '—'}`,
  );
  return `${en.size} keys`;
});

// ── Report ────────────────────────────────────────────────────────
console.log(checks.join('\n'));

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:\n`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log('\nAll checks passed.');
