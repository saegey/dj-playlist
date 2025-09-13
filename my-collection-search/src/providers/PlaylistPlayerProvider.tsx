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
  currentTime: number;
  duration: number;
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

const PlaylistPlayerContext = createContext<PlaylistPlayerContextValue | null>(
  null
);

export function PlaylistPlayerProvider({
  children,
  initial = [],
}: {
  children: React.ReactNode;
  initial?: Track[];
}) {
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
    if (fromIndex < 0 || fromIndex >= playlist.length || 
        toIndex < 0 || toIndex >= playlist.length || 
        fromIndex === toIndex) {
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

  // Time/duration listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
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
      currentTime,
      duration,
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
    currentTrack, // included in deps
    plVersion, // include plVersion so playlist updates trigger
    currentTime,
    duration,
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

  return (
    <PlaylistPlayerContext.Provider value={value}>
      {children}
      {audioElement}
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
