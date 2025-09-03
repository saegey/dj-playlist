// hooks/useDiscogsQuery.ts
"use client";
import { useMutation } from "@tanstack/react-query";
import { useSettingsDialogs } from "@/providers/SettingsDialogProvider";
import { useSyncStreams } from "@/providers/SyncStreamsProvider";
import {
  updateDiscogsIndex,
  syncDiscogsStream,
  type SyncResult,
  type IndexResult,
} from "@/services/internalApi/discogs";

/** 1) Normal mutation (index update) */
export function useUpdateDiscogsIndex() {
  return useMutation<IndexResult, Error, void>({
    mutationFn: () => updateDiscogsIndex(),
  });
}

/** 2) Streaming mutation for sync */
export function useSyncDiscogs() {
  const { setDiscogsSyncOpen } = useSettingsDialogs();
  const { resetDiscogs, pushDiscogsLine, setDiscogsDone, setDiscogsError } =
    useSyncStreams();

  return useMutation<SyncResult | null, Error, { username?: string }>({
    mutationFn: async ({ username }) => {
      resetDiscogs();
      setDiscogsSyncOpen(true);

      let summary: SyncResult | null = null;

      try {
        await syncDiscogsStream(username, (line: string) => {
          pushDiscogsLine(line);
          // detect JSON summary on any line
          try {
            const obj = JSON.parse(line);
            if (obj && (obj.newReleases || obj.alreadyHave))
              summary = obj as SyncResult;
          } catch {}
        });
        setDiscogsDone(true);
        return summary;
      } catch (e: unknown) {
        setDiscogsError(e instanceof Error ? e.message : String(e));
        setDiscogsDone(true);
        throw e;
      }
    },
  });
}
