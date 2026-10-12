/**
 * Essentia's MusicExtractor computes key three ways — key_krumhansl,
 * key_temperley and key_edma — and reports a 0-1 `strength` for each. Only
 * key_edma's key/scale were ever stored (as `key`); its strength was
 * discarded, so a low-confidence, ambiguous estimate looked identical to a
 * confident one (#524).
 *
 * key_confidence stores that strength alongside `key`, so a weak estimate
 * can be flagged instead of presented as fact.
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumns("tracks", {
    key_confidence: { type: "real", notNull: false },
  });
};

export const down = (pgm) => {
  pgm.dropColumns("tracks", ["key_confidence"]);
};
