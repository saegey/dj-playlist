import { useState, useCallback, useEffect } from "react";
import type { Track } from "@/types/track";

export interface PlaylistInfo {
  id?: number;
  name: string;
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<any[]>([]); // TODO: type playlists
  const [playlistName, setPlaylistName] = useState("");
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo>({ name: "" });
  const [playlist, setPlaylist] = useState<Track[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("playlist");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // Fetch playlists from backend
  const fetchPlaylists = useCallback(async () => {
    setLoadingPlaylists(true);
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
  const handleLoadPlaylist = useCallback(async (trackIds: Array<string>) => {
    if (!trackIds || trackIds.length === 0) {
      setPlaylist([]);
      setPlaylistInfo({ name: "" });
      return;
    }
    try {
      // Fetch full track objects from backend by IDs
      const res = await fetch("/api/tracks/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_ids: trackIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylist(data);
        // Try to find the playlist name from loaded playlists
        const loaded = playlists.find(
          (pl: any) =>
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
      alert("Error loading playlist tracks");
    }
  }, [playlists]);

  // Save playlist to backend (update or create)
  const savePlaylist = useCallback(async () => {
    if (!playlistName.trim() || playlist.length === 0) {
      alert("Please enter a playlist name and add tracks.");
      return;
    }
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: playlistName,
        tracks: playlist.map((t) => t.track_id),
      }),
    });
    if (res.ok) {
      fetchPlaylists();
      alert("Playlist saved!");
    } else {
      alert("Failed to save playlist");
    }
  }, [playlistName, playlist, fetchPlaylists]);

  // Export playlist as JSON file
  const exportPlaylist = useCallback(() => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(playlist, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    const filename = playlistInfo.name
      ? `${playlistInfo.name}.json`
      : "playlist.json";
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [playlist, playlistInfo]);

  // Clear playlist
  const clearPlaylist = useCallback(() => {
    setPlaylist([]);
  }, []);

  // Remove track from playlist
  const removeFromPlaylist = useCallback((trackId: string) => {
    setPlaylist((prev) => prev.filter((t) => t.track_id !== trackId));
  }, []);

  // Add track to playlist
  const addToPlaylist = useCallback((track: Track) => {
    setPlaylist((prev) => {
      if (!prev.some((t) => t.track_id === track.track_id)) {
        return [...prev, track];
      }
      return prev;
    });
  }, []);

  // Move track in playlist
  const moveTrack = useCallback((fromIdx: number, toIdx: number) => {
    setPlaylist((prev) => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const updated = [...prev];
      const [removed] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, removed);
      return updated;
    });
  }, []);

  // Persist playlist to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("playlist", JSON.stringify(playlist));
    }
  }, [playlist]);

  return {
    playlists,
    setPlaylists,
    playlistName,
    setPlaylistName,
    loadingPlaylists,
    playlistInfo,
    setPlaylistInfo,
    playlist,
    setPlaylist,
    fetchPlaylists,
    handleCreatePlaylist,
    handleLoadPlaylist,
    savePlaylist,
    exportPlaylist,
    clearPlaylist,
    removeFromPlaylist,
    addToPlaylist,
    moveTrack,
  };
}
