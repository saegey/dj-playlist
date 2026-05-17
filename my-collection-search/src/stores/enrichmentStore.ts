import { create } from "zustand";

export interface EnrichmentQueueItem {
  trackId: string;
  friendId: number;
}

export interface EnrichmentTypes {
  llm: boolean;
  appleMusic: boolean;
  youtube: boolean;
  fetchAudio: boolean;
}

interface EnrichmentResult {
  saved?: boolean;
  skipped?: boolean;
  error?: string;
}

interface EnrichmentStore {
  queue: EnrichmentQueueItem[];
  enrichmentTypes: EnrichmentTypes;
  results: Record<string, EnrichmentResult>;
  setQueue: (queue: EnrichmentQueueItem[]) => void;
  setEnrichmentTypes: (types: Partial<EnrichmentTypes>) => void;
  markResult: (key: string, result: EnrichmentResult) => void;
  reset: () => void;
}

export const useEnrichmentStore = create<EnrichmentStore>((set) => ({
  queue: [],
  enrichmentTypes: { llm: true, appleMusic: true, youtube: true, fetchAudio: false },
  results: {},
  setQueue: (queue) => set({ queue, results: {} }),
  setEnrichmentTypes: (types) =>
    set((state) => ({ enrichmentTypes: { ...state.enrichmentTypes, ...types } })),
  markResult: (key, result) =>
    set((state) => ({ results: { ...state.results, [key]: result } })),
  reset: () => set({ queue: [], results: {} }),
}));
