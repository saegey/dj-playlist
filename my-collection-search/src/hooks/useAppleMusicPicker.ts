import { useCallback, useState } from "react";
import type { AppleMusicResult } from "@/types/track";

type Query = { title: string; artist: string };

export function useAppleMusicPicker(opts?: {
  onSelect?: (song: AppleMusicResult) => void | Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AppleMusicResult[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const search = useCallback(async ({ title, artist }: Query) => {
    setLoading(true);
    setResults([]);
    setIsOpen(true);
    try {
      const res = await fetch("/api/ai/apple-music-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, artist }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        // Optional: surface error via toast
      }
  } catch {
      // Optional: surface error via toast
    }
    setLoading(false);
  }, []);

  const select = useCallback(
    async (song: AppleMusicResult) => {
      try {
        await opts?.onSelect?.(song);
      } finally {
        setIsOpen(false);
      }
    },
    [opts]
  );

  return { isOpen, open, close, loading, results, search, select };
}
