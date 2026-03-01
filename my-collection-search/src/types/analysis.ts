export interface AnalysisResult {
  rhythm?: {
    bpm?: number;
    danceability?: number;
  };
  tonal?: {
    key_edma?: {
      key?: string;
      scale?: string;
    };
  };
  metadata?: {
    audio_properties?: {
      length?: number;
    };
  };
  [key: string]: unknown;
}
