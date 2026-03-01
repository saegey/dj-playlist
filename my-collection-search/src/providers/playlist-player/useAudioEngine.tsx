"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Track } from "@/types/track";

type UseAudioEngineArgs = {
  audioRef: RefObject<HTMLAudioElement | null>;
  playlistRef: RefObject<Track[]>;
  currentTrackIndex: number | null;
  isPlaying: boolean;
  plVersion: number;
  volume: number;
  onEnded: () => void;
};

export function useAudioEngine({
  audioRef,
  playlistRef,
  currentTrackIndex,
  isPlaying,
  plVersion,
  volume,
  onEnded,
}: UseAudioEngineArgs) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const pendingSeekRef = useRef<number | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const pl = playlistRef.current;
    if (isPlaying && currentTrackIndex !== null && pl[currentTrackIndex]) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [audioRef, currentTrackIndex, isPlaying, plVersion, playlistRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const pl = playlistRef.current;
    const track = currentTrackIndex !== null ? pl[currentTrackIndex] : null;

    if (!track) {
      audio.pause();
      setDuration(audio.duration || 0);
      return;
    }

    if (lastTrackIdRef.current !== track.track_id) {
      audio.src = `/api/audio?filename=${encodeURIComponent(track.local_audio_url ?? "")}`;
      lastTrackIdRef.current = track.track_id;
      setCurrentTime(0);
      setDuration(0);
    }

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [audioRef, currentTrackIndex, isPlaying, plVersion, playlistRef]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [audioRef, plVersion, volume]);

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
  }, [audioRef, currentTrackIndex, plVersion]);

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
    [audioRef, duration]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => onEnded();
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [audioRef, onEnded]);

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
    [audioRef]
  );

  return {
    currentTime,
    duration,
    pendingSeekRef,
    seek,
    audioElement,
  };
}
