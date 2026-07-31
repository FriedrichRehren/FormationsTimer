// Mirrors FormationsTimer.UI/Domain — the checkpoint timeline of a rehearsal run.

/** @typedef {'startRehearsal'|'enterFloor'|'musicStart'|'mainSectionStart'|'mainSectionEnd'|'musicEnd'|'leaveFloor'|'endRehearsal'} CheckpointType */
/** @typedef {'marchOn'|'entry'|'mainSection'|'exit'|'walkOff'} SegmentType */

/**
 * Ordered checkpoints. `segmentBefore` is the segment that is running while we
 * wait for this checkpoint; `limitConfigurable` marks steps that can carry an
 * optional maximum duration.
 */
export const CHECKPOINTS = [
  { type: 'startRehearsal', limitConfigurable: false, segmentBefore: null },
  { type: 'enterFloor', limitConfigurable: false, segmentBefore: null },
  { type: 'musicStart', limitConfigurable: true, segmentBefore: 'marchOn' },
  { type: 'mainSectionStart', limitConfigurable: true, segmentBefore: 'entry' },
  { type: 'mainSectionEnd', limitConfigurable: true, segmentBefore: 'mainSection' },
  { type: 'musicEnd', limitConfigurable: true, segmentBefore: 'exit' },
  { type: 'leaveFloor', limitConfigurable: true, segmentBefore: 'walkOff' },
  { type: 'endRehearsal', limitConfigurable: false, segmentBefore: null },
];

/**
 * The two durations a run is judged by, each simply the difference between two
 * checkpoints. They overlap the steps and each other, which is fine: they are
 * derived on the fly, not part of the sequence.
 */
export const SPANS = [
  { type: 'musicTotal', from: 'musicStart', to: 'musicEnd' },
  { type: 'mainSection', from: 'mainSectionStart', to: 'mainSectionEnd' },
];

export const CHECKPOINT_COUNT = CHECKPOINTS.length;

export const CONFIGURABLE_CHECKPOINTS = CHECKPOINTS.filter((c) => c.limitConfigurable);

const INDEX_BY_TYPE = new Map(CHECKPOINTS.map((checkpoint, index) => [checkpoint.type, index]));

export function getIndex(type) {
  return INDEX_BY_TYPE.get(type) ?? -1;
}

export function getNextCheckpoint(capturedCount) {
  return CHECKPOINTS[capturedCount] ?? null;
}
