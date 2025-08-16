"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Track } from "@/types/track";
import { AppleMusicResult } from "@/types/apple";
import { useFriends } from "@/hooks/useFriends";
import { useUsername } from "@/providers/UsernameProvider";

type AppleResultsMap = Record<string, AppleMusicResult[] | null | undefined>;

type MissingAppleState = {
  // data
  tracks: Track[];
  total: number;
  loading: boolean;
  // paging and selection (0-based global index across all)
  page: number; // 1-based for API
  pageSize: number; // fixed at 1 per current design
  currentIndex: number; // 0-based within page (0 when pageSize=1)
  currentGlobalIndex: number; // derived
  // filters
  usernames: string[];
  selectedUsername?: string | null;
  // apple search results
  appleResults: AppleResultsMap;
  // override search
  overrideTrackId: string | null;
  overrideQuery: string;
};

type MissingAppleActions = {
  setOverrideTrackId: (id: string | null) => void;
  setOverrideQuery: (q: string) => void;
  goTo: (globalIndex: number) => void; // 0-based
  prev: () => void;
  next: () => void;
  saveTrack: (data: Partial<Track> & { track_id: string; username?: string }) => Promise<void>;
  searchAppleFor: (track: Track) => Promise<void>;
};

const MissingAppleContext = createContext<(MissingAppleState & MissingAppleActions) | null>(null);

export function MissingAppleProvider({ children }: { children: React.ReactNode }) {
  const { friends: usernames } = useFriends({ showCurrentUser: true });
  const { username: selectedUsername } = useUsername();

  // core state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const [page, setPage] = useState<number>(1);
  const pageSize = 1;
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // override
  const [overrideTrackId, setOverrideTrackId] = useState<string | null>(null);
  const [overrideQuery, setOverrideQuery] = useState<string>("");

  // apple results cache
  const [appleResults, setAppleResults] = useState<AppleResultsMap>({});

  // derived
  const currentGlobalIndex = useMemo(
    () => (page - 1) * pageSize + currentIndex,
    [page, pageSize, currentIndex]
  );

  // fetch tracks when username or page changes
  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        let url = `/api/tracks/missing-apple-music?page=${page}&pageSize=${pageSize}`;
        if (selectedUsername) url += `&username=${encodeURIComponent(selectedUsername)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setTracks(data);
            setTotal(data.length);
          } else if (data && Array.isArray(data.tracks)) {
            setTracks(data.tracks);
            setTotal(typeof data.total === "number" ? data.total : data.tracks.length);
          } else {
            setTracks([]);
            setTotal(0);
          }
        } else {
          setTracks([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, [selectedUsername, page]);

  // reset paging when username changes
  useEffect(() => {
    setPage(1);
    setCurrentIndex(0);
    setAppleResults({});
  }, [selectedUsername]);

  const searchAppleFor = useCallback(async (track: Track) => {
    const res = await fetch("/api/ai/apple-music-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: track.title,
        artist: track.artist,
        album: track.album,
        isrc: track.isrc || undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const results: AppleMusicResult[] = Array.isArray(data.results)
        ? data.results
        : data.results
        ? [data.results[0]]
        : [];
      setAppleResults((prev) => ({
        ...prev,
        [track.track_id]: results.length > 0 ? results : null,
      }));
    } else {
      setAppleResults((prev) => ({ ...prev, [track.track_id]: null }));
    }
  }, []);

  // auto-search for current track
  useEffect(() => {
    setAppleResults({});
    if (tracks.length > 0 && tracks[currentIndex]) {
      void searchAppleFor(tracks[currentIndex]);
    }
  }, [tracks, currentIndex, searchAppleFor]);

  const goTo = useCallback(
    (gi: number) => {
      if (gi < 0) gi = 0;
      if (total > 0) gi = Math.min(total - 1, gi);
      const newPage = Math.floor(gi / pageSize) + 1;
      const newIndex = gi % pageSize;
      if (newPage !== page) setPage(newPage);
      setCurrentIndex(newIndex);
    },
    [page, pageSize, total]
  );

  const prev = useCallback(() => goTo(currentGlobalIndex - 1), [currentGlobalIndex, goTo]);
  const next = useCallback(() => goTo(currentGlobalIndex + 1), [currentGlobalIndex, goTo]);

  const saveTrack = useCallback(async (data: Partial<Track> & { track_id: string; username?: string }) => {
    const res = await fetch("/api/tracks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        username: data.username ?? selectedUsername ?? "",
      }),
    });
    if (res.ok) {
      setTracks((prev) => prev.map((t) => (t.track_id === data.track_id ? { ...t, ...data } : t)));
      // advance
      if (typeof total === "number") goTo(currentGlobalIndex + 1);
    } else {
      alert("Failed to update track");
    }
  }, [selectedUsername, total, currentGlobalIndex, goTo]);

  const value = useMemo(
    () => ({
      // state
      tracks,
      total,
      loading,
      page,
      pageSize,
      currentIndex,
      currentGlobalIndex,
      usernames,
      selectedUsername,
      appleResults,
      overrideTrackId,
      overrideQuery,
      // actions
      setOverrideTrackId,
      setOverrideQuery,
      goTo,
      prev,
      next,
      saveTrack,
      searchAppleFor,
    }),
    [
      tracks,
      total,
      loading,
      page,
      pageSize,
      currentIndex,
      currentGlobalIndex,
      usernames,
      selectedUsername,
      appleResults,
      overrideTrackId,
      overrideQuery,
      goTo,
      prev,
      next,
      saveTrack,
      searchAppleFor,
    ]
  );

  return <MissingAppleContext.Provider value={value}>{children}</MissingAppleContext.Provider>;
}

export function useMissingApple() {
  const ctx = useContext(MissingAppleContext);
  if (!ctx) throw new Error("useMissingApple must be used within MissingAppleProvider");
  return ctx;
}
