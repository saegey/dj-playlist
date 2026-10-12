// Shared key-extraction logic for every pipeline stage that reads Essentia's
// `tonal` output (#524): download-worker's analyze job, the manual upload
// route, and the audio-analysis SSE/upload UI. Keeping it in one place means
// all four extract and log key confidence/disagreement the same way.

export type EssentiaKeyEstimate = {
  key?: string;
  scale?: string;
  strength?: number;
};

export type EssentiaTonal = {
  key_edma?: EssentiaKeyEstimate;
  key_krumhansl?: EssentiaKeyEstimate;
  key_temperley?: EssentiaKeyEstimate;
  /** From chord detection, not a key profile — flat fields, no strength (#524). */
  chords_key?: string;
  chords_scale?: string;
};

export type KeyAnalysis = {
  key: string | null;
  /** `key_edma.strength`, rounded to 3 decimals, or null when absent. */
  key_confidence: number | null;
};

/**
 * Below this, the EDMA estimate is weak enough to flag in the UI rather than
 * present as fact (#524). Essentia's own key-detection examples treat
 * ~0.6 as the line between a usable and a dubious estimate.
 */
export const KEY_CONFIDENCE_LOW_THRESHOLD = 0.6;

/** Whether a stored key's confidence is low enough to flag as uncertain. */
export function isKeyConfidenceLow(keyConfidence: number | null | undefined): boolean {
  return typeof keyConfidence === "number" && keyConfidence < KEY_CONFIDENCE_LOW_THRESHOLD;
}

function formatKey(estimate: EssentiaKeyEstimate | undefined): string | null {
  if (!estimate?.key || !estimate?.scale) return null;
  return `${estimate.key} ${estimate.scale}`;
}

/** The value stored as `key`/`key_confidence`: the EDMA profile's estimate and strength. */
export function extractKeyAnalysis(tonal: EssentiaTonal | undefined): KeyAnalysis {
  const strength = tonal?.key_edma?.strength;
  return {
    key: formatKey(tonal?.key_edma),
    key_confidence: typeof strength === "number" ? Math.round(strength * 1000) / 1000 : null,
  };
}

/**
 * Logs (never throws) when another key estimate disagrees with the EDMA
 * estimate actually stored. On the track that prompted #524, the three key
 * profiles (edma/krumhansl/temperley) all agreed with each other — the
 * actual F-major/C-major split was against `chords_key`, a differently
 * derived estimate from chord detection rather than a key profile. A silent
 * disagreement here is exactly what made that bug invisible, so this checks
 * every independent estimate Essentia computed, not just the three profiles.
 */
export function logKeyProfileDisagreement(
  tonal: EssentiaTonal | undefined,
  context: { track_id: string; friend_id: number },
  log: (message: string) => void = console.warn
): void {
  const edma = formatKey(tonal?.key_edma);
  if (!edma) return;

  const disagreements: string[] = [];
  const krumhansl = formatKey(tonal?.key_krumhansl);
  const temperley = formatKey(tonal?.key_temperley);
  const chords =
    tonal?.chords_key && tonal?.chords_scale ? `${tonal.chords_key} ${tonal.chords_scale}` : null;
  if (krumhansl && krumhansl !== edma) disagreements.push(`krumhansl=${krumhansl}`);
  if (temperley && temperley !== edma) disagreements.push(`temperley=${temperley}`);
  if (chords && chords !== edma) disagreements.push(`chords=${chords}`);

  if (disagreements.length > 0) {
    log(
      `Key profile disagreement for track ${context.track_id} (friend ${context.friend_id}): ` +
        `stored edma=${edma} vs ${disagreements.join(", ")}`
    );
  }
}
