// Strings mirrored from FormationsTimer.UI/Resources/Localization/AppStrings*.resx,
// extended with the keys the PWA-only features need.

const STRINGS = {
  en: {
    appTitle: 'Formation Timer',
    homeTabTitle: 'Home',
    settingsTabTitle: 'Settings',
    historyTabTitle: 'History',

    homeHeaderTitle: 'Rehearsal timer',
    homeDurationLabel: 'Configured rehearsal time',
    currentStageLabel: 'Current stage',
    nextActionLabel: 'Next action',

    settingsTitle: 'Settings',
    settingsSubtitle: 'Set the rehearsal time used by the timer.',
    rehearsalDurationLabel: 'Rehearsal time',
    maxMinutesLabel: 'Max minutes',
    stepLimitsTitle: 'Step time limits',
    stepLimitsSubtitle: 'Leave a field empty to disable the limit. Use the format mm:ss.',
    stepLimitInputLabel: 'Optional maximum time',
    timestampTitle: 'Timestamps',

    checkpointStartRehearsal: 'Start rehearsal',
    checkpointEnterFloor: 'Start run / Enter floor',
    checkpointMusicStart: 'Music start',
    checkpointMainSectionStart: 'Main section start',
    checkpointMainSectionEnd: 'Main section end',
    checkpointMusicEnd: 'Music end',
    checkpointLeaveFloor: 'Leave floor',
    checkpointEndRehearsal: 'End rehearsal',

    segmentMarchOn: 'March on',
    segmentEntry: 'Entry',
    segmentMainSection: 'Main section',
    segmentExit: 'Exit',
    segmentWalkOff: 'Walk-off',

    durationValidationMessage: 'Enter a valid number of minutes.',
    rehearsalDurationValueFormat: '{0} min',
    startTimerButton: 'Start timer',
    resetTimerButton: 'Reset timer',
    markCheckpointButtonFormat: 'Mark {0}',

    homeStageReady: 'Ready to start',
    homeStageWaitingFormat: 'Waiting for {0}',
    homeStageActiveFormat: '{0} in progress',
    homeStageComplete: 'Run complete',
    homeNextActionFirstFormat: 'First marker: {0}',
    homeNextActionFormat: 'Next marker: {0}',
    homeNextActionReset: 'All timestamps are set. Press the button to reset the timer.',

    timestampPendingValue: '--:--.-',
    timestampNotCapturedDetail: 'Not captured yet',
    timestampRunningDetailFormat: 'Running since {0}',
    timestampCapturedDetailFormat: 'Set at {0}',
    stepLimitValidationMessage: 'Use mm:ss or leave the field empty.',

    // PWA additions
    undoButton: 'Undo marker',
    resetButton: 'Reset',
    resetConfirm: 'Really reset?',
    overtimeBadge: 'Overtime',
    limitBadgeFormat: 'Limit {0}',
    remainingCaption: 'Remaining',
    keyboardHint: 'Space or Enter sets the next marker · U undoes it · R resets.',

    behaviourTitle: 'During a run',
    soundLabel: 'Sound cue when a limit is exceeded',
    vibrationLabel: 'Vibrate on every marker',
    keepAwakeLabel: 'Keep the screen awake',
    keepAwakeUnavailable: 'Not supported by this browser.',

    appearanceTitle: 'App',
    languageLabel: 'Language',
    languageAuto: 'Automatic',
    themeLabel: 'Appearance',
    themeAuto: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    installButton: 'Install app',

    historyTitle: 'Past runs',
    historySubtitle: 'The last 20 completed runs are kept on this device.',
    historyEmpty: 'No completed run yet.',
    historyClear: 'Clear history',
    historyClearConfirm: 'Really clear?',
    historyTotalFormat: 'Total {0}',
    exportButton: 'Export',
    exportCopied: 'Copied to clipboard',
    exportFailed: 'Could not copy',
    updateAvailable: 'A new version is available.',
    reloadButton: 'Reload',
  },

  de: {
    appTitle: 'Formations-Timer',
    homeTabTitle: 'Start',
    settingsTabTitle: 'Einstellungen',
    historyTabTitle: 'Verlauf',

    homeHeaderTitle: 'Stellproben-Timer',
    homeDurationLabel: 'Eingestellte Stellprobenzeit',
    currentStageLabel: 'Aktuelle Phase',
    nextActionLabel: 'Nächste Aktion',

    settingsTitle: 'Einstellungen',
    settingsSubtitle: 'Hier wird die Stellprobenzeit für den Timer gesetzt.',
    rehearsalDurationLabel: 'Stellprobenzeit',
    maxMinutesLabel: 'Maximale Minuten',
    stepLimitsTitle: 'Schritt-Zeitlimits',
    stepLimitsSubtitle: 'Leer lassen, um kein Limit zu setzen. Verwende das Format mm:ss.',
    stepLimitInputLabel: 'Optionale Maximalzeit',
    timestampTitle: 'Zeitstempel',

    checkpointStartRehearsal: 'Start Stellprobe',
    checkpointEnterFloor: 'Start Durchgang / Parkett betreten',
    checkpointMusicStart: 'Musikstart',
    checkpointMainSectionStart: 'Hauptteil-Beginn',
    checkpointMainSectionEnd: 'Hauptteil Ende',
    checkpointMusicEnd: 'Musikende',
    checkpointLeaveFloor: 'Parkett verlassen',
    checkpointEndRehearsal: 'Ende Stellprobe',

    segmentMarchOn: 'Aufmarsch',
    segmentEntry: 'Einmarsch',
    segmentMainSection: 'Hauptteil',
    segmentExit: 'Ausmarsch',
    segmentWalkOff: 'Abmarsch',

    durationValidationMessage: 'Bitte eine gültige Anzahl Minuten eingeben.',
    rehearsalDurationValueFormat: '{0} min',
    startTimerButton: 'Timer starten',
    resetTimerButton: 'Timer zurücksetzen',
    markCheckpointButtonFormat: '{0} markieren',

    homeStageReady: 'Bereit zum Start',
    homeStageWaitingFormat: 'Wartet auf {0}',
    homeStageActiveFormat: '{0} läuft',
    homeStageComplete: 'Durchlauf beendet',
    homeNextActionFirstFormat: 'Erste Markierung: {0}',
    homeNextActionFormat: 'Nächste Markierung: {0}',
    homeNextActionReset: 'Alle Zeitstempel sind gesetzt. Mit dem Button setzt du den Timer zurück.',

    timestampPendingValue: '--:--.-',
    timestampNotCapturedDetail: 'Noch nicht gesetzt',
    timestampRunningDetailFormat: 'Läuft seit {0}',
    timestampCapturedDetailFormat: 'Gesetzt um {0}',
    stepLimitValidationMessage: 'Bitte mm:ss verwenden oder das Feld leer lassen.',

    // PWA-Ergänzungen
    undoButton: 'Markierung zurück',
    resetButton: 'Zurücksetzen',
    resetConfirm: 'Wirklich zurücksetzen?',
    overtimeBadge: 'Überzogen',
    limitBadgeFormat: 'Limit {0}',
    remainingCaption: 'Verbleibend',
    keyboardHint: 'Leertaste oder Enter setzt die nächste Markierung · U nimmt zurück · R setzt zurück.',

    behaviourTitle: 'Während des Durchlaufs',
    soundLabel: 'Signalton, wenn ein Limit überschritten wird',
    vibrationLabel: 'Bei jeder Markierung vibrieren',
    keepAwakeLabel: 'Bildschirm anlassen',
    keepAwakeUnavailable: 'Von diesem Browser nicht unterstützt.',

    appearanceTitle: 'App',
    languageLabel: 'Sprache',
    languageAuto: 'Automatisch',
    themeLabel: 'Darstellung',
    themeAuto: 'System',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    installButton: 'App installieren',

    historyTitle: 'Frühere Durchläufe',
    historySubtitle: 'Die letzten 20 beendeten Durchläufe bleiben auf diesem Gerät.',
    historyEmpty: 'Noch kein Durchlauf beendet.',
    historyClear: 'Verlauf löschen',
    historyClearConfirm: 'Wirklich löschen?',
    historyTotalFormat: 'Gesamt {0}',
    exportButton: 'Exportieren',
    exportCopied: 'In die Zwischenablage kopiert',
    exportFailed: 'Kopieren nicht möglich',
    updateAvailable: 'Eine neue Version ist verfügbar.',
    reloadButton: 'Neu laden',
  },
};

export const AVAILABLE_LANGUAGES = Object.keys(STRINGS);

let current = 'en';

export function detectLanguage() {
  for (const tag of navigator.languages ?? [navigator.language ?? 'en']) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (base in STRINGS) {
      return base;
    }
  }
  return 'en';
}

export function setLanguage(language) {
  current = language in STRINGS ? language : 'en';
  document.documentElement.lang = current;
  return current;
}

export function getLanguage() {
  return current;
}

export function t(key) {
  return STRINGS[current][key] ?? STRINGS.en[key] ?? key;
}

/** Replaces {0}, {1}, … the way string.Format does. */
export function format(template, ...values) {
  return String(template).replace(/\{(\d+)\}/g, (match, index) => {
    const value = values[Number(index)];
    return value === undefined ? match : String(value);
  });
}

const CHECKPOINT_KEYS = {
  startRehearsal: 'checkpointStartRehearsal',
  enterFloor: 'checkpointEnterFloor',
  musicStart: 'checkpointMusicStart',
  mainSectionStart: 'checkpointMainSectionStart',
  mainSectionEnd: 'checkpointMainSectionEnd',
  musicEnd: 'checkpointMusicEnd',
  leaveFloor: 'checkpointLeaveFloor',
  endRehearsal: 'checkpointEndRehearsal',
};

const SEGMENT_KEYS = {
  marchOn: 'segmentMarchOn',
  entry: 'segmentEntry',
  mainSection: 'segmentMainSection',
  exit: 'segmentExit',
  walkOff: 'segmentWalkOff',
};

export function checkpointName(type) {
  return t(CHECKPOINT_KEYS[type]);
}

export function segmentName(type) {
  return t(SEGMENT_KEYS[type]);
}
