"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Track } from "@/types/track";

type ReplacePlaylistOptions = {
  preserveCurrent?: boolean;
  startIndex?: number;
  startTrackId?: string;
  autoplay?: boolean;
};

type PlaylistPlayerContextValue = {
  isPlaying: boolean;
  currentTrackIndex: number | null;
  currentTrack: Track | null;
  playlist: Track[];
  playlistLength: number;
  // Playback position
  seek: (time: number) => void;

  play: () => void;
  pause: () => void;
  stop: () => void;
  playNext: () => void;
  playPrev: () => void;
  playTrack: (index: number) => void;

  replacePlaylist: (next: Track[], opts?: ReplacePlaylistOptions) => void;
  appendToQueue: (items: Track[] | Track) => void;
  enqueueNext: (items: Track[] | Track) => void;
  clearQueue: () => void;
  moveTrackInQueue: (fromIndex: number, toIndex: number) => void;
  removeFromQueue: (index: number) => void;

  volume: number;
  setVolume: (v: number) => void;

  audioElement: React.ReactNode;
};

type PlaylistPlayerTimeContextValue = {
  currentTime: number;
  duration: number;
};

const PlaylistPlayerContext = createContext<PlaylistPlayerContextValue | null>(
  null
);

const PlaylistPlayerTimeContext =
  createContext<PlaylistPlayerTimeContextValue | null>(null);

export function PlaylistPlayerProvider({
  children,
  initial = [],
}: {
  children: React.ReactNode;
  initial?: Track[];
}) {
  const STORAGE_KEY = "mcs:player";
  type MediaSessionLike = {
    metadata: MediaMetadata | null;
    playbackState?: "none" | "paused" | "playing";
    setActionHandler?: (
      action:
        | "play"
        | "pause"
        | "previoustrack"
        | "nexttrack"
        | "stop"
        | "seekbackward"
        | "seekforward"
        | "seekto",
      handler:
        | ((details?: { seekOffset?: number; seekTime?: number }) => void)
        | null
    ) => void;
    setPositionState?: (state: {
      duration: number;
      playbackRate?: number;
      position?: number;
    }) => void;
  };
  const getMediaSession = React.useCallback((): MediaSessionLike | null => {
    if (typeof navigator === "undefined") return null;
    const nav = navigator as unknown as { mediaSession?: MediaSessionLike };
    return nav.mediaSession ?? null;
  }, []);
  const playlistRef = useRef<Track[]>(initial);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [plVersion, setPlVersion] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const pendingSeekRef = useRef<number | null>(null);
  const lastSavedSecondRef = useRef<number | null>(null);

  const play = useCallback(() => {
    const pl = playlistRef.current;
    if (!pl.length) return;
    setIsPlaying(true);
    setCurrentTrackIndex((idx) => (idx === null || idx >= pl.length ? 0 : idx));
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    audioRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTrackIndex(null);
  }, []);

  const playNext = useCallback(() => {
    const pl = playlistRef.current;
    setCurrentTrackIndex((idx) => {
      if (idx === null || !pl.length) return idx;
      if (idx < pl.length - 1) {
        setIsPlaying(true);
        return idx + 1;
      }
      setIsPlaying(false);
      return null;
    });
  }, []);

  const playPrev = useCallback(() => {
    setCurrentTrackIndex((idx) => {
      const pl = playlistRef.current;
      if (idx === null || !pl.length) return idx;
      if (idx > 0) {
        setIsPlaying(true);
        return idx - 1;
      }
      return idx;
    });
  }, []);

  const playTrack = useCallback((index: number) => {
    const pl = playlistRef.current;
    if (index >= 0 && index < pl.length) {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  }, []);

  const replacePlaylist = useCallback(
    (next: Track[], opts: ReplacePlaylistOptions = {}) => {
      const {
        preserveCurrent = true,
        startIndex,
        startTrackId,
        autoplay,
      } = opts;

      playlistRef.current = Array.isArray(next) ? next.slice() : [];
      setPlVersion((v) => v + 1);

      let newIndex: number | null = null;
      const pl = playlistRef.current;

      if (typeof startIndex === "number") {
        newIndex =
          startIndex >= 0 && startIndex < pl.length ? startIndex : null;
      } else if (typeof startTrackId === "string") {
        const idx = pl.findIndex((t) => t.track_id === startTrackId);
        newIndex = idx !== -1 ? idx : pl.length ? 0 : null;
      } else if (preserveCurrent && currentTrackIndex !== null) {
        const prev = pl[currentTrackIndex];
        if (prev) {
          const idx = pl.findIndex((t) => t.track_id === prev.track_id);
          newIndex = idx !== -1 ? idx : pl.length ? 0 : null;
        } else {
          newIndex = pl.length ? 0 : null;
        }
      } else {
        newIndex = pl.length ? 0 : null;
      }

      setCurrentTrackIndex(newIndex);

      if (typeof autoplay === "boolean") {
        setIsPlaying(autoplay && newIndex !== null);
      } else {
        setIsPlaying((was) => (newIndex !== null ? was : false));
      }
    },
    [currentTrackIndex]
  );

  const appendToQueue = useCallback((items: Track[] | Track) => {
    console.log("appendToQueue", items);
    const toAdd = Array.isArray(items) ? items : [items];
    if (!toAdd.length) return;
    playlistRef.current = [...playlistRef.current, ...toAdd];
    setPlVersion((v) => v + 1);
  }, []);

  const enqueueNext = useCallback(
    (items: Track[] | Track) => {
      const toAdd = Array.isArray(items) ? items : [items];
      if (!toAdd.length) return;

      const idx = currentTrackIndex ?? -1;
      if (idx < 0) {
        replacePlaylist(toAdd, { startIndex: 0, autoplay: true });
        return;
      }
      const head = playlistRef.current.slice(0, idx + 1);
      const tail = playlistRef.current.slice(idx + 1);
      playlistRef.current = [...head, ...toAdd, ...tail];
      setPlVersion((v) => v + 1);
    },
    [currentTrackIndex, replacePlaylist]
  );

  const clearQueue = useCallback(() => {
    playlistRef.current = [];
    setPlVersion((v) => v + 1);
    setCurrentTrackIndex(null);
    setIsPlaying(false);
  }, []);

  const moveTrackInQueue = useCallback((fromIndex: number, toIndex: number) => {
    const playlist = playlistRef.current;
    if (
      fromIndex < 0 ||
      fromIndex >= playlist.length ||
      toIndex < 0 ||
      toIndex >= playlist.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const newPlaylist = [...playlist];
    const [movedTrack] = newPlaylist.splice(fromIndex, 1);
    newPlaylist.splice(toIndex, 0, movedTrack);

    playlistRef.current = newPlaylist;
    setPlVersion((v) => v + 1);

    // Adjust current track index if needed
    setCurrentTrackIndex((currentIdx) => {
      if (currentIdx === null) return null;

      if (currentIdx === fromIndex) {
        // The currently playing track was moved
        return toIndex;
      } else if (fromIndex < currentIdx && toIndex >= currentIdx) {
        // Track moved from before current to after current
        return currentIdx - 1;
      } else if (fromIndex > currentIdx && toIndex <= currentIdx) {
        // Track moved from after current to before current
        return currentIdx + 1;
      }
      // Current track index doesn't need adjustment
      return currentIdx;
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    const playlist = playlistRef.current;
    if (index < 0 || index >= playlist.length) {
      return;
    }

    const newPlaylist = [...playlist];
    newPlaylist.splice(index, 1);

    playlistRef.current = newPlaylist;
    setPlVersion((v) => v + 1);

    // Adjust current track index if needed
    setCurrentTrackIndex((currentIdx) => {
      if (currentIdx === null) return null;

      if (currentIdx === index) {
        // The currently playing track was removed
        // If there are tracks after this one, play the next one (same index)
        // If this was the last track, play the previous one (index - 1)
        // If this was the only track, stop playing
        if (newPlaylist.length === 0) {
          setIsPlaying(false);
          return null;
        } else if (index < newPlaylist.length) {
          // Play the track that took this position
          return index;
        } else {
          // This was the last track, play the new last track
          return newPlaylist.length - 1;
        }
      } else if (currentIdx > index) {
        // Currently playing track index needs to shift down
        return currentIdx - 1;
      }
      // Current track index doesn't need adjustment
      return currentIdx;
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  // Keep currentTrack state in sync with index/playlist
  useEffect(() => {
    if (currentTrackIndex !== null && playlistRef.current[currentTrackIndex]) {
      setCurrentTrack(playlistRef.current[currentTrackIndex]);
    } else {
      setCurrentTrack(null);
    }
  }, [currentTrackIndex, plVersion]);

  // Effect: play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const pl = playlistRef.current;
    if (isPlaying && currentTrackIndex !== null && pl[currentTrackIndex]) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrackIndex, plVersion]);

  // Effect: change src
  const lastTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const pl = playlistRef.current;
    const track = currentTrackIndex !== null ? pl[currentTrackIndex] : null;

    if (!track) {
      audio.pause();
      // don't blank src here; keep it so pause retains position
      setDuration(audio.duration || 0);
      return;
    }

    // Only swap src when the track changes
    if (lastTrackIdRef.current !== track.track_id) {
      audio.src = `/api/audio?filename=${track.local_audio_url}`;
      lastTrackIdRef.current = track.track_id;
      // reset timing until metadata loads
      setCurrentTime(0);
      setDuration(0);
    }

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [currentTrackIndex, isPlaying, plVersion]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, plVersion]);

  // Time/duration listeners (also apply pending seek once metadata is available)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      if (
        pendingSeekRef.current != null &&
        Number.isFinite(pendingSeekRef.current)
      ) {
        const dur = audio.duration || 0;
        const clamped = Math.max(0, Math.min(dur || 0, pendingSeekRef.current));
        try {
          audio.currentTime = clamped;
          setCurrentTime(clamped);
        } catch {}
        pendingSeekRef.current = null;
      }
    };
    const onDurationChange = () => setDuration(audio.duration || 0);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
    };
  }, [plVersion, currentTrackIndex]);

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const dur =
        Number.isFinite(duration) && duration > 0
          ? duration
          : audio.duration || 0;
      const clamped = Math.max(0, Math.min(dur || 0, time));
      try {
        audio.currentTime = clamped;
        setCurrentTime(clamped);
      } catch {}
    },
    [duration]
  );

  // Auto-next
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => playNext();
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [playNext]);

  const audioElement = useMemo(
    () => (
      <audio
        id="playlist-audio"
        ref={audioRef}
        preload="auto"
        controls
        style={{ display: "none" }}
      />
    ),
    []
  );

  // --- Persistence: hydrate from localStorage on mount ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as {
        playlist?: Track[];
        currentTrackIndex?: number | null;
        isPlaying?: boolean;
        volume?: number;
        currentTime?: number;
      };

      if (Array.isArray(data.playlist)) {
        playlistRef.current = data.playlist as Track[];
        setPlVersion((v) => v + 1);
      }
      if (
        typeof data.currentTrackIndex === "number" ||
        data.currentTrackIndex === null
      ) {
        setCurrentTrackIndex(data.currentTrackIndex ?? null);
      }
      if (typeof data.isPlaying === "boolean") {
        setIsPlaying(data.isPlaying);
      }
      if (typeof data.volume === "number") {
        const vol = Math.max(0, Math.min(1, data.volume));
        setVolumeState(vol);
        if (audioRef.current) audioRef.current.volume = vol;
      }
      if (typeof data.currentTime === "number") {
        pendingSeekRef.current = data.currentTime;
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Helper to persist full state
  const persistState = useCallback(
    (override?: Partial<{ currentTime: number }>) => {
      try {
        const payload = {
          playlist: playlistRef.current,
          currentTrackIndex,
          isPlaying,
          volume,
          currentTime: override?.currentTime ?? currentTime,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // ignore storage errors
      }
    },
    [currentTrackIndex, isPlaying, volume, currentTime]
  );

  // Persist when structural state changes
  useEffect(() => {
    persistState();
  }, [plVersion, currentTrackIndex, isPlaying, volume, persistState]);

  // Persist playback position approximately once per second
  useEffect(() => {
    const sec = Math.floor(currentTime || 0);
    if (lastSavedSecondRef.current === sec) return;
    lastSavedSecondRef.current = sec;
    persistState({ currentTime });
  }, [currentTime, persistState]);

  // Main context value excludes time-sensitive values to prevent constant re-renders
  const value = useMemo<PlaylistPlayerContextValue>(() => {
    // Reference plVersion so dependency is meaningful and value recomputes when playlist changes
    void plVersion;
    const pl = playlistRef.current;
    return {
      isPlaying,
      currentTrackIndex,
      currentTrack, // use state here
      playlist: pl,
      playlistLength: pl.length,
      seek,

      play,
      pause,
      stop,
      playNext,
      playPrev,
      playTrack,

      replacePlaylist,
      appendToQueue,
      enqueueNext,
      clearQueue,
      moveTrackInQueue,
      removeFromQueue,

      volume,
      setVolume,

      audioElement,
    };
  }, [
    isPlaying,
    currentTrackIndex,
    currentTrack,
    plVersion,
    seek,
    play,
    pause,
    stop,
    playNext,
    playPrev,
    playTrack,
    replacePlaylist,
    appendToQueue,
    enqueueNext,
    clearQueue,
    moveTrackInQueue,
    removeFromQueue,
    volume,
    setVolume,
    audioElement,
  ]);

  // Time-sensitive context value updates frequently
  const timeValue = useMemo<PlaylistPlayerTimeContextValue>(
    () => ({
      currentTime,
      duration,
    }),
    [currentTime, duration]
  );

  // Media Session API: expose metadata and bind hardware media keys
  useEffect(() => {
    const mediaSession = getMediaSession();
    if (!mediaSession) return;

    // Update metadata for lock screen / system UI
    try {
      if (currentTrack) {
        mediaSession.metadata = new window.MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album,
          artwork: currentTrack.album_thumbnail
            ? [
                {
                  src: currentTrack.album_thumbnail,
                  sizes: "96x96",
                  type: "image/png",
                },
              ]
            : undefined,
        });
      } else {
        mediaSession.metadata = null;
      }
    } catch {}

    const getNow = () => audioRef.current?.currentTime ?? 0;

    // Action handlers
    try {
      mediaSession.setActionHandler?.("play", play);
      mediaSession.setActionHandler?.("pause", pause);
      mediaSession.setActionHandler?.("previoustrack", playPrev);
      mediaSession.setActionHandler?.("nexttrack", playNext);
      mediaSession.setActionHandler?.("stop", stop);
      mediaSession.setActionHandler?.(
        "seekbackward",
        (details?: { seekOffset?: number }) => {
          const offset =
            typeof details?.seekOffset === "number" ? details.seekOffset : 10;
          seek(getNow() - offset);
        }
      );
      mediaSession.setActionHandler?.(
        "seekforward",
        (details?: { seekOffset?: number }) => {
          const offset =
            typeof details?.seekOffset === "number" ? details.seekOffset : 10;
          seek(getNow() + offset);
        }
      );
      mediaSession.setActionHandler?.(
        "seekto",
        (details?: { seekTime?: number }) => {
          if (typeof details?.seekTime === "number") {
            seek(details.seekTime);
          }
        }
      );
    } catch {}

    return () => {
      try {
        mediaSession.setActionHandler?.("play", null);
        mediaSession.setActionHandler?.("pause", null);
        mediaSession.setActionHandler?.("previoustrack", null);
        mediaSession.setActionHandler?.("nexttrack", null);
        mediaSession.setActionHandler?.("stop", null);
        mediaSession.setActionHandler?.("seekbackward", null);
        mediaSession.setActionHandler?.("seekforward", null);
        mediaSession.setActionHandler?.("seekto", null);
      } catch {}
    };
  }, [
    currentTrack,
    play,
    pause,
    playPrev,
    playNext,
    stop,
    seek,
    getMediaSession,
  ]);

  // Reflect playback state to OS controls
  useEffect(() => {
    const mediaSession = getMediaSession();
    if (!mediaSession) return;
    try {
      mediaSession.playbackState = isPlaying ? "playing" : "paused";
    } catch {}
  }, [isPlaying, getMediaSession]);

  // Keep OS position state in sync
  useEffect(() => {
    const mediaSession = getMediaSession();
    if (!mediaSession || typeof mediaSession.setPositionState !== "function")
      return;
    try {
      if (Number.isFinite(duration) && duration > 0) {
        mediaSession.setPositionState({
          duration,
          playbackRate: 1.0,
          position: currentTime || 0,
        });
      }
    } catch {}
  }, [currentTime, duration, getMediaSession]);

  return (
    <PlaylistPlayerContext.Provider value={value}>
      <PlaylistPlayerTimeContext.Provider value={timeValue}>
        {children}
        {audioElement}
      </PlaylistPlayerTimeContext.Provider>
    </PlaylistPlayerContext.Provider>
  );
}

export function usePlaylistPlayer() {
  const ctx = useContext(PlaylistPlayerContext);
  if (!ctx)
    throw new Error(
      "usePlaylistPlayer must be used within PlaylistPlayerProvider"
    );
  return ctx;
}

export function usePlaylistPlayerTime() {
  const ctx = useContext(PlaylistPlayerTimeContext);
  if (!ctx)
    throw new Error(
      "usePlaylistPlayerTime must be used within PlaylistPlayerProvider"
    );
  return ctx;
}
