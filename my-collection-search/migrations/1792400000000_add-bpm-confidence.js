/**
 * Essentia's `rhythm` section reports a beat-histogram alongside the single
 * `bpm` value: how much of the detected beat-interval mass supports the
 * winning tempo (`bpm_histogram_first_peak_weight`) and how much supports the
 * runner-up (`bpm_histogram_second_peak_weight`). Only `bpm` was ever
 * stored, so an ambiguous estimate looked identical to a confident one (#531,
 * same shape as key_confidence in #524).
 *
 * bpm_confidence stores the margin between the first and second peak weights
 * (0-1), so a contested tempo can be flagged instead of presented as fact.
 * Nullable: tracks analysed before this column have no value until the
 * backfill-bpm-confidence script reads it from the saved analysis JSON.
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumns("tracks", {
    bpm_confidence: { type: "real", notNull: false },
  });
};

export const down = (pgm) => {
  pgm.dropColumns("tracks", ["bpm_confidence"]);
};
