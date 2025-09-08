"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Track } from "@/types/track";
import { AppleMusicResult } from "@/types/apple";
import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import { useUsername } from "@/providers/UsernameProvider";
import { useTracksQuery } from "@/hooks/useTracksQuery";
import type { TrackEditFormProps } from "@/components/TrackEditForm";
import { fetchAppleMusicAISearch } from "@/services/aiService";
import { fetchMissingAppleTracks } from "@/services/trackService";

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
  // discogs cache
  discogsByTrack: Record<string, DiscogsLookupResult | null>;
};

type MissingAppleActions = {
  setOverrideTrackId: (id: string | null) => void;
  setOverrideQuery: (q: string) => void;
  goTo: (globalIndex: number) => void; // 0-based
  prev: () => void;
  next: () => void;
  saveTrack: (
    data: Partial<Track> & { track_id: string; username?: string }
  ) => Promise<void>;
  searchAppleFor: (track: Track) => Promise<void>;
  lookupDiscogs: (trackId?: string) => Promise<DiscogsLookupResult | null>;
};

const MissingAppleContext = createContext<
  (MissingAppleState & MissingAppleActions) | null
>(null);

// Types for the Discogs lookup endpoint
export type DiscogsVideo = {
  uri?: string;
  url?: string;
  title?: string;
  duration?: number | string;
  description?: string;
};
export type DiscogsLookupRelease = {
  id: string | number;
  title: string;
  artists?: { name: string }[];
  artists_sort?: string;
  year?: number | null;
  styles?: string[];
  genres?: string[];
  uri?: string | null;
  thumb?: string | null;
  videos?: DiscogsVideo[]; // Discogs exports often use 'videos'
  video?: DiscogsVideo[]; // being defensive if singular is used in some dumps
};
type DiscogsLookupTrack = {
  position: string;
  title: string;
  duration: string;
  artists?: { name: string }[];
};
export type DiscogsLookupResult = {
  releaseId: string;
  filePath: string;
  release: DiscogsLookupRelease; // returned as full release in the endpoint
  matchedTrack: DiscogsLookupTrack | null;
};

export function MissingAppleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { friends: usernames } = useFriendsQuery({ showCurrentUser: true });
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
  // discogs cache
  const [discogsByTrack, setDiscogsByTrack] = useState<
    Record<string, DiscogsLookupResult | null>
  >({});

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
        const { tracks, total } = await fetchMissingAppleTracks({
          page,
          pageSize,
          username: selectedUsername ?? undefined,
        });
        setTracks(tracks);
        setTotal(total);
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
    try {
      const { results } = await fetchAppleMusicAISearch({
        title: track.title,
        artist: track.artist,
        album: track.album,
        isrc: track.isrc || undefined,
      });
      const arr: AppleMusicResult[] = Array.isArray(results) ? results : [];
      setAppleResults((prev) => ({
        ...prev,
        [track.track_id]: arr.length > 0 ? arr : null,
      }));
    } catch {
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

  const prev = useCallback(
    () => goTo(currentGlobalIndex - 1),
    [currentGlobalIndex, goTo]
  );
  const next = useCallback(
    () => goTo(currentGlobalIndex + 1),
    [currentGlobalIndex, goTo]
  );
  const { saveTrack: mutateSaveTrack } = useTracksQuery();

  const saveTrack = useCallback(
    async (data: Partial<Track> & { track_id: string; username?: string }) => {
      try {
        const payload: TrackEditFormProps = {
          track_id: data.track_id,
          username: data.username ?? selectedUsername ?? "",
          title: data.title,
          artist: data.artist,
          album: data.album,
          local_tags:
            typeof data.local_tags === "string" ? data.local_tags : undefined,
          notes: typeof data.notes === "string" ? data.notes : undefined,
          bpm:
            typeof (data as { bpm?: unknown }).bpm === "number"
              ? (data as { bpm?: number }).bpm
              : undefined,
          key:
            typeof (data as { key?: unknown }).key === "string"
              ? (data as { key?: string }).key
              : undefined,
          danceability:
            typeof (data as { danceability?: unknown }).danceability ===
            "number"
              ? (data as { danceability?: number }).danceability
              : undefined,
          apple_music_url: data.apple_music_url,
          spotify_url: data.spotify_url,
          youtube_url: data.youtube_url,
          soundcloud_url: data.soundcloud_url,
          star_rating:
            typeof (data as { star_rating?: unknown }).star_rating === "number"
              ? (data as { star_rating?: number }).star_rating
              : undefined,
          duration_seconds:
            typeof (data as { duration_seconds?: unknown }).duration_seconds ===
            "number"
              ? (data as { duration_seconds?: number }).duration_seconds
              : undefined,
        };
        await mutateSaveTrack(payload);
        if (typeof total === "number") goTo(currentGlobalIndex + 1);
      } catch {
        alert("Failed to update track");
      }
    },
    [mutateSaveTrack, selectedUsername, total, currentGlobalIndex, goTo]
  );

  const lookupDiscogs = useCallback(
    async (trackId?: string): Promise<DiscogsLookupResult | null> => {
      const id = trackId ?? tracks[currentIndex]?.track_id;
      if (!id) return null;

      if (Object.prototype.hasOwnProperty.call(discogsByTrack, id)) {
        return discogsByTrack[id];
      }

      const params = new URLSearchParams({ track_id: id });
      if (selectedUsername) params.set("username", selectedUsername);
      const res = await fetch(`/api/ai/discogs?${params.toString()}`);
      if (!res.ok) {
        setDiscogsByTrack((prev) => ({ ...prev, [id]: null }));
        return null;
      }
      const data: DiscogsLookupResult = await res.json();
      setDiscogsByTrack((prev) => ({ ...prev, [id]: data }));
      return data;
    },
    [tracks, currentIndex, selectedUsername, discogsByTrack]
  );

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
      discogsByTrack,
      // actions
      setOverrideTrackId,
      setOverrideQuery,
      goTo,
      prev,
      next,
      saveTrack,
      searchAppleFor,
      lookupDiscogs,
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
      discogsByTrack,
      goTo,
      prev,
      next,
      saveTrack,
      searchAppleFor,
      lookupDiscogs,
    ]
  );

  return (
    <MissingAppleContext.Provider value={value}>
      {children}
    </MissingAppleContext.Provider>
  );
}

export function useMissingApple() {
  const ctx = useContext(MissingAppleContext);
  if (!ctx)
    throw new Error("useMissingApple must be used within MissingAppleProvider");
  return ctx;
}
