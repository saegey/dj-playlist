import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useContext,
  createContext,
  ReactNode,
} from "react";
import type { Playlist, Track } from "@/types/track";
import { importPlaylist } from "@/services/playlistService";
import { fetchTracksByIds } from "@/services/trackService";
import { useRecommendations, type TrackWithEmbedding as TrackWithEmbeddingFromHook } from "@/hooks/useRecommendations";
import { usePlaylistsQuery } from "@/hooks/usePlaylistsQuery";
import { useCreatePlaylistMutation } from "@/hooks/usePlaylistMutations";
import { reconcileDisplayPlaylist, idKey, moveTrackReorder } from "@/utils/playlist";

export interface PlaylistInfo {
  id?: number;
  name: string;
}

// Extend Track type to include embedding
export interface TrackWithEmbedding extends Track {
  _vectors?: {
    default: Array<number>;
  };
}

// Context types
interface PlaylistsContextType {
  optimalOrderType: "original" | "greedy" | "genetic";
  setOptimalOrderType: React.Dispatch<
    React.SetStateAction<"original" | "greedy" | "genetic">
  >;
  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
  playlistName: string;
  setPlaylistName: React.Dispatch<React.SetStateAction<string>>;
  loadingPlaylists: { id: number } | boolean;
  playlistInfo: PlaylistInfo;
  setPlaylistInfo: React.Dispatch<React.SetStateAction<PlaylistInfo>>;
  playlist: TrackWithEmbedding[];
  setPlaylist: React.Dispatch<React.SetStateAction<TrackWithEmbedding[]>>;
  displayPlaylist: TrackWithEmbedding[];
  setDisplayPlaylist: React.Dispatch<
    React.SetStateAction<TrackWithEmbedding[]>
  >;
  fetchPlaylists: () => Promise<void>;
  handleCreatePlaylist: () => Promise<void>;
  handleLoadPlaylist: (trackIds: Array<string>, id: number) => Promise<void>;
  savePlaylist: () => Promise<void>;
  exportPlaylist: () => void;
  clearPlaylist: () => void;
  removeFromPlaylist: (trackId: string) => void;
  addToPlaylist: (track: TrackWithEmbedding) => void;
  moveTrack: (fromIdx: number, toIdx: number) => void;
  playlistAvgEmbedding: number[] | null;
  getRecommendations: (k?: number) => Promise<Track[]>;
}

const PlaylistsContext = createContext<PlaylistsContextType | undefined>(
  undefined
);

export function PlaylistsProvider({ children }: { children: ReactNode }) {
  const [optimalOrderType, setOptimalOrderType] = useState<
    "original" | "greedy" | "genetic"
  >("original");
  const { playlists, refetch } = usePlaylistsQuery({ enabled: true, staleTime: 30_000 });
  const setPlaylists = useCallback<React.Dispatch<React.SetStateAction<Playlist[]>>>(
    () => {},
    []
  );
  const [playlistName, setPlaylistName] = useState("");
  const [loadingPlaylists, setLoadingPlaylists] = useState<
    { id: number } | false
  >(false);
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo>({ name: "" });
  const [playlist, setPlaylist] = useState<TrackWithEmbedding[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("playlist");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [displayPlaylist, setDisplayPlaylist] = useState<TrackWithEmbedding[]>(
    []
  );
  const getRecommendationsRaw = useRecommendations();

  // Identity helper now imported from utils

  // Memoized average embedding for playlist
  const playlistAvgEmbedding = useMemo(() => {
    if (!playlist.length) return null;
    const playlistEmbs = playlist
      .map((t) => t._vectors?.default || "[]")
      .filter((emb): emb is number[] => Array.isArray(emb) && emb.length > 0);
    if (!playlistEmbs.length) return null;
    return playlistEmbs[0].map(
      (_: number, i: number) =>
        playlistEmbs.reduce((sum, emb) => sum + emb[i], 0) / playlistEmbs.length
    );
  }, [playlist]);

  const fetchPlaylists = useCallback(async () => {
    await refetch();
    setLoadingPlaylists(false);
  }, [refetch]);

  // Reconcile displayPlaylist with playlist whenever they drift
  useEffect(() => {
    setDisplayPlaylist((cur) => reconcileDisplayPlaylist(playlist, cur));
  }, [playlist]);

  // Create a new playlist
  const { mutateAsync: createPlaylist } = useCreatePlaylistMutation();
  const handleCreatePlaylist = useCallback(async () => {
    if (!playlistName.trim() || playlist.length === 0) return;
    try {
      await createPlaylist({
        name: playlistName,
        tracks: playlist.map((t) => t.track_id),
      });
      setPlaylistName("");
      setPlaylistInfo({ name: playlistName });
  } catch {
      alert("Failed to create playlist");
    }
  }, [playlistName, playlist, createPlaylist]);

  // Load a playlist (replace current playlist)
  const handleLoadPlaylist = useCallback(
    async (trackIds: Array<string>, id: number) => {
      setOptimalOrderType("original");

      if (!trackIds || trackIds.length === 0) {
        setPlaylist([]);
        setPlaylistInfo({ name: "" });
        return;
      }
      try {
        setLoadingPlaylists({ id });
        // Fetch full track objects from backend by IDs
        try {
          const data = await fetchTracksByIds(trackIds);
          setPlaylist(data);
          setDisplayPlaylist(data);
          // Try to find the playlist name from loaded playlists
          const loaded = playlists.find(
            (pl: Playlist) =>
              Array.isArray(pl.tracks) &&
              pl.tracks.length === trackIds.length &&
              pl.tracks.every((id: string, i: number) => id === trackIds[i])
          );
          if (loaded) {
            setPlaylistInfo({ id: loaded.id, name: loaded.name });
          } else {
            setPlaylistInfo({ name: "" });
          }
        } catch (err) {
          console.error(err);
          alert("Failed to load playlist tracks");
        }
      } catch (e) {
        console.error("Error loading playlist tracks:", e);
        alert("Error loading playlist tracks");
      }
      setLoadingPlaylists(false);
    },
    [playlists]
  );

  // Save playlist to backend (update or create)
  const savePlaylist = useCallback(async () => {
    const res = await importPlaylist(
      playlistName,
      displayPlaylist.map((t) => t.track_id)
    );
    if (!res.ok) throw new Error("Failed to save playlist");
  }, [playlistName, displayPlaylist]);

  // Export playlist as JSON file
  const exportPlaylist = useCallback(() => {
    const base = displayPlaylist.length > 0 ? displayPlaylist : playlist;
    // Exclude heavy embedding vectors from export via JSON replacer
    const json = JSON.stringify(
      base,
      (key, value) => (key === "_vectors" ? undefined : value),
      2
    );
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(json);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    const filename = playlistInfo.name
      ? `${playlistInfo.name}.json`
      : "playlist.json";
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [playlist, playlistInfo, displayPlaylist]);

  // Clear playlist
  const clearPlaylist = useCallback(() => {
    setPlaylist([]);
    setDisplayPlaylist([]);
    // Remove persisted playlist to avoid repopulation
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("playlist");
      } catch {}
    }
  }, []);

  // Remove track from playlist
  const removeFromPlaylist = useCallback((trackId: string) => {
    setDisplayPlaylist((prev) => prev.filter((t) => t.track_id !== trackId));
    setPlaylist((prev) => prev.filter((t) => t.track_id !== trackId));
  }, []);

  // Add track to playlist
  const addToPlaylist = useCallback((track: TrackWithEmbedding) => {
    type WithUser = { username?: string };
    const sameIdentity = (
      a: TrackWithEmbedding & WithUser,
      b: TrackWithEmbedding & WithUser
    ) => a.track_id === b.track_id && a.username === b.username;

    setDisplayPlaylist((prev) => {
      if (
        !prev.some((t) =>
          sameIdentity(
            t as TrackWithEmbedding & WithUser,
            track as TrackWithEmbedding & WithUser
          )
        )
      ) {
        return [...prev, track];
      }
      return prev;
    });
    setPlaylist((prev) => {
      if (
        !prev.some((t) =>
          sameIdentity(
            t as TrackWithEmbedding & WithUser,
            track as TrackWithEmbedding & WithUser
          )
        )
      ) {
        return [...prev, track];
      }
      return prev;
    });
  }, []);
  // Move track in playlist
  const moveTrack = useCallback((fromIdx: number, toIdx: number) => {
    setDisplayPlaylist((prev) => {
      const updated = moveTrackReorder(prev, fromIdx, toIdx);
      const order = new Map(updated.map((t, i) => [idKey(t), i]));
      setPlaylist((cur) => {
        const inDisplay = cur.filter((t) => order.has(idKey(t)));
        const notInDisplay = cur.filter((t) => !order.has(idKey(t)));
        inDisplay.sort((a, b) => order.get(idKey(a))! - order.get(idKey(b))!);
        return [...inDisplay, ...notInDisplay];
      });
      return updated;
    });
  }, []);

  // Expose a wrapper that fixes playlist arg from context for consumers expecting previous shape
  const getRecommendations = useCallback(
    async (k: number = 25) =>
      getRecommendationsRaw(k, playlist as TrackWithEmbeddingFromHook[]),
    [getRecommendationsRaw, playlist]
  );

  // Persist playlist to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("playlist", JSON.stringify(playlist));
    }
  }, [playlist]);

  const value: PlaylistsContextType = {
    optimalOrderType,
    setOptimalOrderType,
    playlists,
    setPlaylists,
    playlistName,
    setPlaylistName,
  loadingPlaylists,
    playlistInfo,
    setPlaylistInfo,
    playlist,
    setPlaylist,
    displayPlaylist,
    setDisplayPlaylist,
  fetchPlaylists,
    handleCreatePlaylist,
    handleLoadPlaylist,
    savePlaylist,
    exportPlaylist,
    clearPlaylist,
    removeFromPlaylist,
    addToPlaylist,
    moveTrack,
    playlistAvgEmbedding,
    getRecommendations,
  };

  return React.createElement(PlaylistsContext.Provider, { value }, children);
}

// Hook to use the playlists context
export function usePlaylists() {
  const ctx = useContext(PlaylistsContext);
  if (!ctx) {
    throw new Error("usePlaylists must be used within a PlaylistsProvider");
  }
  return ctx;
}

export default PlaylistsProvider;
