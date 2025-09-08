import { useCallback, useMemo, useState } from "react";
import { useSpotifyTrackSearchQuery } from "@/hooks/useSpotifyTrackSearchQuery";
import type { SpotifyTrackSearchItem } from "@/services/aiService";

export type SpotifySearchTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  url: string;
  artwork: string;
  duration: number; // ms
};

type Query = { title: string; artist: string };

export function useSpotifyPicker(opts?: {
  onSelect?: (track: SpotifySearchTrack) => void | Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  // loading derived from React Query
  const [args, setArgs] = useState<Query | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const enabled = useMemo(
    () => isOpen && !!args?.title && !!args?.artist,
    [isOpen, args?.title, args?.artist]
  );

  const { data, isPending, refetch } = useSpotifyTrackSearchQuery(
    { title: args?.title ?? "", artist: args?.artist ?? "" },
    enabled
  );

  const results: SpotifySearchTrack[] = useMemo(() => {
    const items = (data?.results ?? []) as SpotifyTrackSearchItem[];
    // Adapter: SpotifyTrackSearchItem has the same shape
    return items as unknown as SpotifySearchTrack[];
  }, [data?.results]);

  const loading = isPending;

  const search = useCallback(
    async ({ title, artist }: Query) => {
      setIsOpen(true);
      setArgs({ title, artist });
      refetch();
    },
    [refetch]
  );

  const select = useCallback(
    async (track: SpotifySearchTrack) => {
      try {
        await opts?.onSelect?.(track);
      } finally {
        setIsOpen(false);
      }
    },
    [opts]
  );

  return { isOpen, open, close, loading, results, search, select };
}
