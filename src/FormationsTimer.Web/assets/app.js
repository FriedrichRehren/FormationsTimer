import {
  CHECKPOINTS,
  CHECKPOINT_COUNT,
  CONFIGURABLE_CHECKPOINTS,
  getNextCheckpoint,
} from './timeline.js';
import {
  checkpointName,
  detectLanguage,
  format,
  getLanguage,
  segmentName,
  setLanguage,
  t,
} from './i18n.js';

// ── Storage ───────────────────────────────────────────────────────
const STORAGE_KEYS = {
  settings: 'formationstimer.settings',
  run: 'formationstimer.run',
  history: 'formationstimer.history',
};

const DEFAULT_SETTINGS = {
  minutes: '15',
  limits: {},
  sound: true,
  vibrate: true,
  keepAwake: true,
  language: 'auto',
  theme: 'auto',
};

const MINUTE_PRESETS = [10, 15, 20, 30];
const HISTORY_LIMIT = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * 98;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — the app keeps working in memory */
  }
}

const settings = readJson(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
/** @type {{startedAt: number|null, captured: number[]}} */
const run = readJson(STORAGE_KEYS.run, { startedAt: null, captured: [] });
/** @type {Array<object>} */
let history = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) ?? '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
})();

if (!run.startedAt || !Array.isArray(run.captured) || run.captured.length === 0) {
  run.startedAt = null;
  run.captured = [];
}

// Language first: everything built below reads translated strings.
setLanguage(settings.language === 'auto' ? detectLanguage() : settings.language);

const saveSettings = () => writeJson(STORAGE_KEYS.settings, settings);
const saveRun = () => writeJson(STORAGE_KEYS.run, run);
const saveHistory = () => writeJson(STORAGE_KEYS.history, history);

// ── Parsing & formatting (mirrors FormationTimerViewModel) ────────
/** Matches TimeSpan.TryParseExact with m:ss / mm:ss / h:mm:ss, each with an optional tenth. */
const STEP_LIMIT_PATTERN = /^(?:(\d):)?(\d{1,2}):([0-5]\d)(?:\.(\d))?$/;

/** @returns {{valid: boolean, ms: number|null}} — `ms === null` means "no limit". */
function parseStepLimit(value) {
  const text = (value ?? '').trim();
  if (text === '') {
    return { valid: true, ms: null };
  }

  const match = STEP_LIMIT_PATTERN.exec(text);
  if (!match) {
    return { valid: false, ms: null };
  }

  const [, hours, minutes, seconds, tenths] = match;
  // Without an hour part the minutes may exceed 59; with one they may not.
  if (hours !== undefined && Number(minutes) > 59) {
    return { valid: false, ms: null };
  }

  const ms =
    Number(hours ?? 0) * 3_600_000 +
    Number(minutes) * 60_000 +
    Number(seconds) * 1000 +
    Number(tenths ?? 0) * 100;
  return { valid: true, ms };
}

/** @returns {number|null} configured duration in ms, or null when invalid. */
function parseMinutes(value) {
  const text = (value ?? '').trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }
  const minutes = Number(text);
  return minutes > 0 ? minutes * 60_000 : null;
}

function formatTenths(ms) {
  const total = Math.abs(ms);
  const tenths = Math.floor(total / 100);
  const hours = Math.floor(total / 3_600_000);
  const minutes = Math.floor(total / 60_000) % 60;
  const seconds = Math.floor(total / 1000) % 60;
  const fraction = tenths % 10;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours >= 1 ? `${hours}:${mm}:${ss}.${fraction}` : `${mm}:${ss}.${fraction}`;
}

function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString(getLanguage(), {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString(getLanguage(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// ── Derived run state ─────────────────────────────────────────────
const configuredDuration = () => parseMinutes(settings.minutes) ?? 15 * 60_000;
const isStarted = () => run.startedAt !== null;
const isComplete = () => run.captured.length === CHECKPOINT_COUNT;
const limitFor = (type) => parseStepLimit(settings.limits[type]).ms;

/** Start of the step that ends at `index` — the previous marker, or the run start. */
function stepStartedAt(index) {
  if (run.startedAt === null) {
    return null;
  }
  return index <= 0 ? run.startedAt : run.captured[index - 1] ?? run.startedAt;
}

function elapsedForStep(index, now) {
  const start = stepStartedAt(index);
  if (start === null) {
    return null;
  }
  const captured = run.captured[index];
  if (captured !== undefined) {
    return captured - start;
  }
  return index === run.captured.length ? now - start : null;
}

// ── DOM ───────────────────────────────────────────────────────────
const el = (id) => document.getElementById(id);

const dom = {
  views: document.querySelector('.views'),
  dial: el('dial'),
  ringProgress: el('ringProgress'),
  remaining: el('remaining'),
  overtimeBadge: el('overtimeBadge'),
  configuredDuration: el('configuredDuration'),
  currentStage: el('currentStage'),
  nextAction: el('nextAction'),
  primaryAction: el('primaryAction'),
  undoButton: el('undoButton'),
  exportButton: el('exportButton'),
  resetButton: el('resetButton'),
  timestampList: el('timestampList'),
  minutesInput: el('minutesInput'),
  minutePresets: el('minutePresets'),
  durationEcho: el('durationEcho'),
  durationError: el('durationError'),
  limitFields: el('limitFields'),
  soundToggle: el('soundToggle'),
  vibrateToggle: el('vibrateToggle'),
  wakeLockToggle: el('wakeLockToggle'),
  wakeLockHint: el('wakeLockHint'),
  languageSelect: el('languageSelect'),
  themeSelect: el('themeSelect'),
  installButton: el('installButton'),
  historyList: el('historyList'),
  historyEmpty: el('historyEmpty'),
  clearHistoryButton: el('clearHistoryButton'),
  toast: el('toast'),
  toastText: el('toastText'),
  toastAction: el('toastAction'),
  themeColorMeta: el('themeColorMeta'),
};

/** Row elements, one per checkpoint, built once and updated in place. */
const rows = CHECKPOINTS.map((checkpoint) => {
  const item = document.createElement('li');
  item.className = 'timestamp';

  const title = document.createElement('span');
  title.className = 'timestamp-title';

  const value = document.createElement('span');
  value.className = 'timestamp-value';

  const detail = document.createElement('span');
  detail.className = 'timestamp-detail';

  const detailText = document.createElement('span');
  const badge = document.createElement('span');
  badge.className = 'badge badge--neutral';
  badge.hidden = true;

  detail.append(detailText, badge);
  item.append(title, value, detail);
  dom.timestampList.append(item);

  return { checkpoint, item, title, value, detailText, badge };
});

/** Limit inputs in the settings view, one per configurable checkpoint. */
const limitFields = CONFIGURABLE_CHECKPOINTS.map((checkpoint) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'limit-field';

  const title = document.createElement('span');
  title.className = 'limit-field-title';

  const label = document.createElement('label');
  label.className = 'caption';
  label.htmlFor = `limit-${checkpoint.type}`;

  const input = document.createElement('input');
  input.className = 'input';
  input.id = `limit-${checkpoint.type}`;
  input.type = 'text';
  input.autocomplete = 'off';
  input.placeholder = 'mm:ss';
  input.value = settings.limits[checkpoint.type] ?? '';

  const error = document.createElement('p');
  error.className = 'warning';
  error.hidden = true;

  input.addEventListener('input', () => {
    settings.limits[checkpoint.type] = input.value;
    saveSettings();
    renderLimitValidation();
    renderTimer(Date.now());
  });

  wrapper.append(title, label, input, error);
  dom.limitFields.append(wrapper);

  return { checkpoint, title, label, input, error };
});

MINUTE_PRESETS.forEach((minutes) => {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.dataset.minutes = String(minutes);
  chip.textContent = format(t('rehearsalDurationValueFormat'), minutes);
  chip.addEventListener('click', () => {
    settings.minutes = String(minutes);
    dom.minutesInput.value = settings.minutes;
    saveSettings();
    renderSettings();
    renderTimer(Date.now());
  });
  dom.minutePresets.append(chip);
});

// ── Feedback: sound, vibration, wake lock ─────────────────────────
let audioContext = null;

function unlockAudio() {
  if (!settings.sound) {
    return null;
  }
  const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioCtor) {
    return null;
  }
  audioContext ??= new AudioCtor();
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function beep(times = 1) {
  const context = unlockAudio();
  if (!context) {
    return;
  }
  for (let index = 0; index < times; index += 1) {
    const startAt = context.currentTime + index * 0.22;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.35, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.2);
  }
}

function vibrate(pattern) {
  if (settings.vibrate && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern);
  }
}

let wakeLock = null;

async function acquireWakeLock() {
  if (!settings.keepAwake || !('wakeLock' in navigator) || wakeLock) {
    return;
  }
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null;
  }
}

async function releaseWakeLock() {
  const lock = wakeLock;
  wakeLock = null;
  try {
    await lock?.release();
  } catch {
    /* already gone */
  }
}

function syncWakeLock() {
  if (isStarted() && !isComplete() && settings.keepAwake) {
    acquireWakeLock();
  } else {
    releaseWakeLock();
  }
}

// ── Alerts ────────────────────────────────────────────────────────
const alertedSteps = new Set();
let overtimeAlerted = false;

/** Suppresses a burst of alerts for steps that were already over when we restored the run. */
function primeAlerts(now) {
  alertedSteps.clear();
  overtimeAlerted = false;

  CHECKPOINTS.forEach((checkpoint, index) => {
    const limit = limitFor(checkpoint.type);
    const elapsed = elapsedForStep(index, now);
    if (limit !== null && elapsed !== null && elapsed > limit) {
      alertedSteps.add(checkpoint.type);
    }
  });

  overtimeAlerted = remainingMs(now) < 0;
}

function remainingMs(now) {
  if (run.startedAt === null) {
    return configuredDuration();
  }
  const reference = isComplete() ? run.captured[run.captured.length - 1] : now;
  return configuredDuration() - (reference - run.startedAt);
}

function checkAlerts(now) {
  if (!isStarted() || isComplete()) {
    return;
  }

  const index = run.captured.length;
  const checkpoint = getNextCheckpoint(index);
  if (checkpoint) {
    const limit = limitFor(checkpoint.type);
    const elapsed = elapsedForStep(index, now);
    if (limit !== null && elapsed !== null && elapsed > limit && !alertedSteps.has(checkpoint.type)) {
      alertedSteps.add(checkpoint.type);
      beep(1);
      vibrate([90, 60, 90]);
    }
  }

  if (remainingMs(now) < 0 && !overtimeAlerted) {
    overtimeAlerted = true;
    beep(2);
    vibrate([140, 80, 140]);
  }
}

// ── Actions ───────────────────────────────────────────────────────
function triggerPrimaryAction() {
  unlockAudio();
  const now = Date.now();

  if (isComplete()) {
    resetRun();
    return;
  }

  if (!isStarted()) {
    run.startedAt = now;
    run.captured = [now];
  } else {
    run.captured.push(now);
    if (isComplete()) {
      archiveRun();
    }
  }

  vibrate(30);
  saveRun();
  primeAlerts(now);
  syncWakeLock();
  renderTimer(now);
}

function undoLastCheckpoint() {
  if (!isStarted()) {
    return;
  }

  run.captured.pop();
  if (run.captured.length === 0) {
    run.startedAt = null;
  }

  vibrate(20);
  saveRun();
  const now = Date.now();
  primeAlerts(now);
  syncWakeLock();
  renderTimer(now);
}

function resetRun() {
  run.startedAt = null;
  run.captured = [];
  saveRun();
  const now = Date.now();
  primeAlerts(now);
  syncWakeLock();
  renderTimer(now);
}

function archiveRun() {
  const total = run.captured[run.captured.length - 1] - run.startedAt;
  const entry = {
    startedAt: run.startedAt,
    finishedAt: run.captured[run.captured.length - 1],
    configuredMs: configuredDuration(),
    totalMs: total,
    steps: CHECKPOINTS.map((checkpoint, index) => {
      const elapsed = run.captured[index] - stepStartedAt(index);
      const limit = limitFor(checkpoint.type);
      return {
        type: checkpoint.type,
        elapsedMs: elapsed,
        limitMs: limit,
        over: limit !== null && elapsed > limit,
      };
    }),
  };

  // Undoing and re-marking the last checkpoint updates the entry instead of adding a second one.
  const others = history.filter((item) => item.startedAt !== entry.startedAt);
  history = [entry, ...others].slice(0, HISTORY_LIMIT);
  saveHistory();
  renderHistory();
}

/** Plain-text summary of a finished or in-progress run. */
function buildRunReport(entry) {
  const lines = [
    `${t('appTitle')} — ${formatDateTime(entry.finishedAt)}`,
    `${format(t('historyTotalFormat'), formatTenths(entry.totalMs))} / ${format(
      t('rehearsalDurationValueFormat'),
      Math.round(entry.configuredMs / 60_000),
    )}`,
    '',
  ];

  for (const step of entry.steps) {
    const marker = step.over ? ' !' : '';
    lines.push(`${checkpointName(step.type)}\t${formatTenths(step.elapsedMs)}${marker}`);
  }

  return lines.join('\n');
}

function currentRunAsEntry() {
  if (!isStarted()) {
    return null;
  }

  const captured = run.captured;
  return {
    finishedAt: captured[captured.length - 1],
    configuredMs: configuredDuration(),
    totalMs: captured[captured.length - 1] - run.startedAt,
    steps: captured.map((timestamp, index) => {
      const elapsed = timestamp - stepStartedAt(index);
      const limit = limitFor(CHECKPOINTS[index].type);
      return {
        type: CHECKPOINTS[index].type,
        elapsedMs: elapsed,
        limitMs: limit,
        over: limit !== null && elapsed > limit,
      };
    }),
  };
}

async function exportReport(report) {
  if (navigator.share) {
    try {
      await navigator.share({ title: t('appTitle'), text: report });
      return;
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }
    }
  }

  try {
    await navigator.clipboard.writeText(report);
    showToast(t('exportCopied'));
  } catch {
    showToast(t('exportFailed'));
  }
}

// ── Rendering ─────────────────────────────────────────────────────
function renderTimer(now) {
  const duration = configuredDuration();
  const remaining = remainingMs(now);
  const isOvertime = remaining < 0;

  dom.configuredDuration.textContent = format(
    t('rehearsalDurationValueFormat'),
    Math.round(duration / 60_000),
  );

  dom.remaining.textContent = isOvertime
    ? `-${formatTenths(Math.abs(remaining))}`
    : formatTenths(remaining);
  dom.dial.classList.toggle('is-overtime', isOvertime);
  dom.overtimeBadge.hidden = !isOvertime;

  const progress = duration > 0 ? Math.min(1, Math.max(0, 1 - remaining / duration)) : 0;
  dom.ringProgress.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - progress));

  renderStatus();
  renderRows(now);

  dom.undoButton.disabled = !isStarted();
  dom.exportButton.disabled = !isStarted();
}

function renderStatus() {
  if (!isStarted()) {
    dom.currentStage.textContent = t('homeStageReady');
    dom.nextAction.textContent = format(
      t('homeNextActionFirstFormat'),
      checkpointName(CHECKPOINTS[0].type),
    );
    dom.primaryAction.textContent = t('startTimerButton');
    return;
  }

  if (isComplete()) {
    dom.currentStage.textContent = t('homeStageComplete');
    dom.nextAction.textContent = t('homeNextActionReset');
    dom.primaryAction.textContent = t('resetTimerButton');
    return;
  }

  const next = getNextCheckpoint(run.captured.length);
  dom.currentStage.textContent = next.segmentBefore
    ? format(t('homeStageActiveFormat'), segmentName(next.segmentBefore))
    : format(t('homeStageWaitingFormat'), checkpointName(next.type));
  dom.nextAction.textContent = format(t('homeNextActionFormat'), checkpointName(next.type));
  dom.primaryAction.textContent = format(
    t('markCheckpointButtonFormat'),
    checkpointName(next.type),
  );
}

function renderRows(now) {
  rows.forEach((row, index) => {
    row.title.textContent = checkpointName(row.checkpoint.type);

    const limit = limitFor(row.checkpoint.type);
    row.badge.hidden = limit === null;
    if (limit !== null) {
      row.badge.textContent = format(t('limitBadgeFormat'), formatTenths(limit));
    }

    const captured = run.captured[index];
    const isCurrent = isStarted() && !isComplete() && index === run.captured.length;
    const elapsed = elapsedForStep(index, now);

    if (elapsed === null) {
      row.value.textContent = t('timestampPendingValue');
      row.detailText.textContent = t('timestampNotCapturedDetail');
    } else {
      row.value.textContent = formatTenths(elapsed);
      row.detailText.textContent =
        captured !== undefined
          ? format(t('timestampCapturedDetailFormat'), formatClock(captured))
          : format(t('timestampRunningDetailFormat'), formatClock(stepStartedAt(index)));
    }

    const isOver = limit !== null && elapsed !== null && elapsed > limit;
    row.item.classList.toggle('is-current', isCurrent);
    row.item.classList.toggle('is-done', captured !== undefined);
    row.item.classList.toggle('is-over', isOver);
    row.badge.classList.toggle('badge--warning', isOver);
    row.badge.classList.toggle('badge--neutral', !isOver);
  });
}

function renderSettings() {
  dom.minutesInput.value = settings.minutes;

  const duration = parseMinutes(settings.minutes);
  dom.durationError.hidden = duration !== null;
  dom.minutesInput.classList.toggle('is-invalid', duration === null);
  dom.durationEcho.textContent = format(
    t('rehearsalDurationValueFormat'),
    Math.round((duration ?? configuredDuration()) / 60_000),
  );

  for (const chip of dom.minutePresets.children) {
    chip.textContent = format(t('rehearsalDurationValueFormat'), chip.dataset.minutes);
    chip.classList.toggle('is-active', chip.dataset.minutes === String(settings.minutes).trim());
  }

  for (const field of limitFields) {
    field.title.textContent = checkpointName(field.checkpoint.type);
    field.label.textContent = t('stepLimitInputLabel');
  }
  renderLimitValidation();

  dom.soundToggle.checked = settings.sound;
  dom.vibrateToggle.checked = settings.vibrate;
  dom.wakeLockToggle.checked = settings.keepAwake;
  dom.wakeLockToggle.disabled = !('wakeLock' in navigator);
  dom.wakeLockHint.hidden = 'wakeLock' in navigator;
  dom.languageSelect.value = settings.language;
  dom.themeSelect.value = settings.theme;
}

function renderLimitValidation() {
  for (const field of limitFields) {
    const { valid } = parseStepLimit(settings.limits[field.checkpoint.type]);
    field.error.hidden = valid;
    field.error.textContent = t('stepLimitValidationMessage');
    field.input.classList.toggle('is-invalid', !valid);
  }
}

function renderHistory() {
  dom.historyList.replaceChildren();
  dom.historyEmpty.hidden = history.length > 0;
  dom.clearHistoryButton.hidden = history.length === 0;

  for (const entry of history) {
    const card = document.createElement('article');
    card.className = 'card';

    const head = document.createElement('div');
    head.className = 'run-head';

    const when = document.createElement('span');
    when.className = 'detail';
    when.textContent = formatDateTime(entry.finishedAt);

    const total = document.createElement('span');
    total.className = 'run-total';
    total.textContent = format(t('historyTotalFormat'), formatTenths(entry.totalMs));
    if (entry.totalMs > entry.configuredMs) {
      total.style.color = 'var(--warning)';
    }

    head.append(when, total);

    const steps = document.createElement('ul');
    steps.className = 'run-steps';
    for (const step of entry.steps) {
      const item = document.createElement('li');
      item.className = step.over ? 'run-step is-over' : 'run-step';
      const name = document.createElement('span');
      name.textContent = checkpointName(step.type);
      const value = document.createElement('span');
      value.textContent = formatTenths(step.elapsedMs);
      item.append(name, value);
      steps.append(item);
    }

    const exportButton = document.createElement('button');
    exportButton.type = 'button';
    exportButton.className = 'btn btn--ghost';
    exportButton.textContent = t('exportButton');
    exportButton.addEventListener('click', () => exportReport(buildRunReport(entry)));

    card.append(head, steps, exportButton);
    dom.historyList.append(card);
  }
}

function renderStaticText() {
  document.title = t('appTitle');
  for (const node of document.querySelectorAll('[data-i18n]')) {
    node.textContent = t(node.dataset.i18n);
  }
}

function renderAll(now = Date.now()) {
  renderStaticText();
  renderSettings();
  renderTimer(now);
  renderHistory();
}

// ── Theme ─────────────────────────────────────────────────────────
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme() {
  if (settings.theme === 'auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.dataset.theme = settings.theme;
  }

  const isDark = settings.theme === 'dark' || (settings.theme === 'auto' && darkQuery.matches);
  dom.themeColorMeta.content = isDark ? '#151311' : '#F5EDE2';
}

darkQuery.addEventListener('change', applyTheme);

// ── Toast ─────────────────────────────────────────────────────────
let toastTimer = 0;

function showToast(text, actionLabel = null, onAction = null, duration = 3200) {
  window.clearTimeout(toastTimer);
  dom.toastText.textContent = text;
  dom.toastAction.hidden = actionLabel === null;
  dom.toastAction.textContent = actionLabel ?? '';
  dom.toastAction.onclick = onAction;
  dom.toast.hidden = false;

  if (duration > 0) {
    toastTimer = window.setTimeout(() => {
      dom.toast.hidden = true;
    }, duration);
  }
}

// ── Views ─────────────────────────────────────────────────────────
function showView(name) {
  for (const view of document.querySelectorAll('.view')) {
    view.hidden = view.id !== `view-${name}`;
  }
  for (const tab of document.querySelectorAll('.tab')) {
    const active = tab.dataset.view === name;
    tab.classList.toggle('is-active', active);
    if (active) {
      tab.setAttribute('aria-current', 'page');
    } else {
      tab.removeAttribute('aria-current');
    }
  }
  dom.views?.scrollTo?.(0, 0);
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => showView(tab.dataset.view));
}

// ── Confirm-on-second-click helper ────────────────────────────────
function makeConfirmable(button, labelKey, confirmKey, action) {
  let armed = false;
  let timer = 0;

  const disarm = () => {
    armed = false;
    window.clearTimeout(timer);
    button.textContent = t(labelKey);
    button.classList.remove('btn--danger');
  };

  // Rendered by hand instead of via data-i18n, so the armed label survives re-renders.
  button.removeAttribute('data-i18n');
  button.textContent = t(labelKey);

  button.addEventListener('click', () => {
    if (armed) {
      disarm();
      action();
      return;
    }
    armed = true;
    button.textContent = t(confirmKey);
    button.classList.add('btn--danger');
    timer = window.setTimeout(disarm, 3000);
  });

  return disarm;
}

// ── Event wiring ──────────────────────────────────────────────────
dom.primaryAction.addEventListener('click', triggerPrimaryAction);
dom.undoButton.addEventListener('click', undoLastCheckpoint);
dom.exportButton.addEventListener('click', () => {
  const entry = currentRunAsEntry();
  if (entry) {
    exportReport(buildRunReport(entry));
  }
});

const disarmReset = makeConfirmable(dom.resetButton, 'resetButton', 'resetConfirm', resetRun);
const disarmClearHistory = makeConfirmable(
  dom.clearHistoryButton,
  'historyClear',
  'historyClearConfirm',
  () => {
    history = [];
    saveHistory();
    renderHistory();
  },
);

dom.minutesInput.addEventListener('input', () => {
  settings.minutes = dom.minutesInput.value;
  saveSettings();
  renderSettings();
  renderTimer(Date.now());
});

dom.soundToggle.addEventListener('change', () => {
  settings.sound = dom.soundToggle.checked;
  saveSettings();
  if (settings.sound) {
    unlockAudio();
    beep(1);
  }
});

dom.vibrateToggle.addEventListener('change', () => {
  settings.vibrate = dom.vibrateToggle.checked;
  saveSettings();
  vibrate(30);
});

dom.wakeLockToggle.addEventListener('change', () => {
  settings.keepAwake = dom.wakeLockToggle.checked;
  saveSettings();
  syncWakeLock();
});

dom.languageSelect.addEventListener('change', () => {
  settings.language = dom.languageSelect.value;
  saveSettings();
  setLanguage(settings.language === 'auto' ? detectLanguage() : settings.language);
  renderAll();
  disarmReset();
  disarmClearHistory();
});

dom.themeSelect.addEventListener('change', () => {
  settings.theme = dom.themeSelect.value;
  saveSettings();
  applyTheme();
});

document.addEventListener('keydown', (event) => {
  const target = event.target;

  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (target instanceof HTMLElement && target.matches('input, select, textarea')) {
    return;
  }

  if (event.key === ' ' || event.key === 'Enter') {
    // A focused button handles Space/Enter itself.
    if (target instanceof HTMLElement && target.matches('button')) {
      return;
    }
    event.preventDefault();
    triggerPrimaryAction();
  } else if (event.key === 'u' || event.key === 'U') {
    undoLastCheckpoint();
  } else if (event.key === 'r' || event.key === 'R') {
    // Goes through the same two-step confirmation as the button.
    dom.resetButton.click();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    syncWakeLock();
    renderTimer(Date.now());
  }
});

// ── Install prompt ────────────────────────────────────────────────
let installPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  dom.installButton.hidden = false;
});

dom.installButton.addEventListener('click', async () => {
  if (!installPrompt) {
    return;
  }
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  dom.installButton.hidden = true;
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  dom.installButton.hidden = true;
});

// ── Tick loop ─────────────────────────────────────────────────────
// Driven by an interval rather than requestAnimationFrame so that limit alerts
// still fire while the tab is in the background. All times come from Date.now(),
// so interval jitter never accumulates.
let lastRenderedTenth = -1;

function tick() {
  if (!isStarted() || isComplete()) {
    return;
  }

  const now = Date.now();
  const tenth = Math.floor(now / 100);
  if (tenth === lastRenderedTenth) {
    return;
  }

  lastRenderedTenth = tenth;
  renderTimer(now);
  checkAlerts(now);
}

// ── Service worker ────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('sw.js');
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        installing?.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            showToast(t('updateAvailable'), t('reloadButton'), () => window.location.reload(), 0);
          }
        });
      });
    } catch {
      /* offline support is optional */
    }
  });
}

// ── Boot ──────────────────────────────────────────────────────────
applyTheme();
primeAlerts(Date.now());
renderAll();
syncWakeLock();
window.setInterval(tick, 50);
