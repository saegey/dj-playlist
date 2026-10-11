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
 * Logs (never throws) when the Krumhansl or Temperley profiles disagree with
 * the EDMA estimate actually stored — e.g. the F-major/C-major confusion
 * that prompted #524. A silent disagreement here is exactly what made that
 * bug invisible: two of the three computed estimates were discarded outright.
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
  if (krumhansl && krumhansl !== edma) disagreements.push(`krumhansl=${krumhansl}`);
  if (temperley && temperley !== edma) disagreements.push(`temperley=${temperley}`);

  if (disagreements.length > 0) {
    log(
      `Key profile disagreement for track ${context.track_id} (friend ${context.friend_id}): ` +
        `stored edma=${edma} vs ${disagreements.join(", ")}`
    );
  }
}
