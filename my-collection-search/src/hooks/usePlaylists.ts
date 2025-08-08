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
import { useMeili } from "@/providers/MeiliProvider";
import { useUsername } from "@/providers/UsernameProvider";

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
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
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
  const { client: meiliClient, ready } = useMeili();
  const { username: selectedUsername } = useUsername();

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

  // Fetch playlists from backend
  const fetchPlaylists = useCallback(async () => {
    try {
      const res = await fetch("/api/playlists");
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      }
    } finally {
      setLoadingPlaylists(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  // Create a new playlist
  const handleCreatePlaylist = useCallback(async () => {
    if (!playlistName.trim() || playlist.length === 0) return;
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: playlistName,
        tracks: playlist.map((t) => t.track_id),
      }),
    });
    if (res.ok) {
      setPlaylistName("");
      setPlaylistInfo({ name: playlistName });
      fetchPlaylists();
    } else {
      alert("Failed to create playlist");
    }
  }, [playlistName, playlist, fetchPlaylists]);

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
        const res = await fetch("/api/tracks/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track_ids: trackIds }),
        });
        if (res.ok) {
          const data = await res.json();
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
        } else {
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
    if (res.ok) {
      fetchPlaylists();
    } else {
      throw new Error("Failed to save playlist");
    }
  }, [playlistName, playlist, fetchPlaylists]);

  // Export playlist as JSON file
  const exportPlaylist = useCallback(() => {
    const playlistToExport =
      displayPlaylist.length > 0 ? displayPlaylist : playlist;
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(playlistToExport, null, 2));
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
  }, []);

  // Remove track from playlist
  const removeFromPlaylist = useCallback((trackId: string) => {
    setDisplayPlaylist((prev) => prev.filter((t) => t.track_id !== trackId));
    setPlaylist((prev) => prev.filter((t) => t.track_id !== trackId));
  }, []);

  // Add track to playlist
  const addToPlaylist = useCallback((track: TrackWithEmbedding) => {
    setDisplayPlaylist((prev) => {
      if (!prev.some((t) => t.track_id === track.track_id)) {
        return [...prev, track];
      }
      return prev;
    });
    setPlaylist((prev) => {
      if (!prev.some((t) => t.track_id === track.track_id)) {
        return [...prev, track];
      }
      return prev;
    });
  }, []);

  // Move track in playlist
  const moveTrack = useCallback((fromIdx: number, toIdx: number) => {
    setDisplayPlaylist((prev) => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const updated = [...prev];
      const [removed] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, removed);
      return updated;
    });
  }, []);

  // Get recommendations from MeiliSearch based on playlist average embedding
  const getRecommendations = useCallback(
    async (k: number = 25) => {
      if (!playlistAvgEmbedding || !playlistAvgEmbedding.length) return [];
      console.log("Fetching recommendations for playlist", {
        playlistAvgEmbedding,
        k,
        playlist,
      });
      try {
        if (!ready || !meiliClient) return [];
        const index = meiliClient.index("tracks");
        const playlistIds = playlist.map((t) => t.track_id);
        // const playlistArtists = playlist.map((t) => `'${t.artist.replace(/'/g, "''")}'`);
        let filter = `NOT track_id IN [${playlistIds.join(",")}]`;
        if (selectedUsername) {
          filter += ` AND username = '${selectedUsername}'`;
        }
        console.log("selectedUsername", selectedUsername);
        // if (playlistArtists.length > 0) {
        //   filter += ` AND NOT artist IN [${playlistArtists.join(",")}]`;
        // }
        // console.log(playlistAvgEmbedding);
        const results = await index.search(undefined, {
          vector: playlistAvgEmbedding,
          limit: k,
          filter,
        });
        return (results.hits as Track[]) || [];
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        return [];
      }
    },
    [playlistAvgEmbedding, playlist, meiliClient, ready, selectedUsername]
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
