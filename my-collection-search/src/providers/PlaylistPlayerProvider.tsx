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
  /** Keep playing same track_id if possible */
  preserveCurrent?: boolean;
  /** Start playback at this zero-based index */
  startIndex?: number;
  /** Start playback at first occurrence of this track_id */
  startTrackId?: string;
  /** Start playing automatically (default: keep current state) */
  autoplay?: boolean;
};

type PlaylistPlayerContextValue = {
  // state
  isPlaying: boolean;
  currentTrackIndex: number | null;
  currentTrack: Track | null;
  playlist: Track[];
  playlistLength: number;

  // controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  playNext: () => void;
  playPrev: () => void;
  playTrack: (index: number) => void;

  // queue mgmt
  replacePlaylist: (next: Track[], opts?: ReplacePlaylistOptions) => void;
  appendToQueue: (items: Track[] | Track) => void;
  enqueueNext: (items: Track[] | Track) => void;
  clearQueue: () => void;

  // element
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
  /** optional initial playlist */
  initial?: Track[];
}) {
  const playlistRef = useRef<Track[]>(initial);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(
    null
  );

  const [isPlaying, setIsPlaying] = useState(false);
  // bump this when playlist changes to retrigger effects safely
  const [plVersion, setPlVersion] = useState(0);

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
      // end of list
      setIsPlaying(false);
      return null;
    });
  }, []);

  useEffect(() => {
    if (currentTrackIndex !== null && playlistRef.current[currentTrackIndex]) {
      setCurrentTrack(playlistRef.current[currentTrackIndex]);
    } else {
      setCurrentTrack(null);
    }
  }, [currentTrackIndex, plVersion]);

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

      // compute new index
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
        // keep current isPlaying unless list became empty
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
        // nothing playing → just replace and start
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

  // Effect: play/pause based on state + current track
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

  // Effect: change audio src when track or playlist changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const pl = playlistRef.current;
    if (currentTrackIndex !== null && pl[currentTrackIndex]) {
      const track = pl[currentTrackIndex];
      const newSrc = `/api/audio?filename=${track.local_audio_url}`;
      if (audio.src !== newSrc) {
        audio.src = newSrc;
      }
      if (isPlaying) {
        audio.play().catch(() => {});
      }
    } else {
      audio.pause();
      audio.src = "";
    }
  }, [currentTrackIndex, isPlaying, plVersion]);

  // auto-next at end
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
        ref={audioRef}
        preload="auto"
        controls
        style={{ display: "none" }}
      />
    ),
    []
  );

  const value = useMemo<PlaylistPlayerContextValue>(() => {
    const pl = playlistRef.current;
    return {
      isPlaying,
      currentTrackIndex,
      currentTrack:
        currentTrackIndex !== null ? pl[currentTrackIndex] ?? null : null,
      playlist: pl,
      playlistLength: pl.length,

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

      audioElement,
    };
  }, [
    isPlaying,
    currentTrackIndex,
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
    audioElement,
  ]);

  return (
    <PlaylistPlayerContext.Provider value={value}>
      {children}
      {/* keep the audio element mounted once at root */}
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
