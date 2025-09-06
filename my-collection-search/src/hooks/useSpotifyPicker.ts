import { useCallback, useState } from "react";

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
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SpotifySearchTrack[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const search = useCallback(async ({ title, artist }: Query) => {
    setLoading(true);
    setResults([]);
    setIsOpen(true);
    try {
      const res = await fetch("/api/ai/spotify-track-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, artist }),
      });
      if (res.status === 401) {
        // Redirect to Spotify authorization
        window.location.href =
          "/api/spotify/login?state=" + encodeURIComponent(window.location.pathname);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        // Optional: handle error with a toast
      }
    } catch {
      // Optional: handle error
    } finally {
      setLoading(false);
    }
  }, []);

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
