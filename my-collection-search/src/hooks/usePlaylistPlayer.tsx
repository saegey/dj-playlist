import React, { useCallback, useState, useRef, useEffect } from "react";
import type { Track } from "@/types/track";

export function usePlaylistPlayer(playlist: Track[]) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Start playing from the beginning or resume
  const play = useCallback(() => {
    if (playlist.length === 0) return;
    setIsPlaying(true);
    if (currentTrackIndex === null || currentTrackIndex >= playlist.length) {
      setCurrentTrackIndex(0);
    }
  }, [playlist, currentTrackIndex]);

  // Pause playback
  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Play next track
  const playNext = useCallback(() => {
    if (playlist.length === 0) return;
    if (currentTrackIndex === null) return;
    if (currentTrackIndex < playlist.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      setCurrentTrackIndex(null);
    }
  }, [playlist, currentTrackIndex]);

  // Play previous track
  const playPrev = useCallback(() => {
    if (playlist.length === 0) return;
    if (currentTrackIndex === null) return;
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      setIsPlaying(true);
    }
  }, [playlist, currentTrackIndex]);

  // Play a specific track
  const playTrack = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= playlist.length) return;
      setCurrentTrackIndex(idx);
      setIsPlaying(true);
    },
    [playlist]
  );

  // Reset player
  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTrackIndex(null);
  }, []);

  // Effect: Play/pause audio element when state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (
      isPlaying &&
      currentTrackIndex !== null &&
      playlist[currentTrackIndex]
    ) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrackIndex, playlist]);

  // Effect: Change audio src when track changes or playlist changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (currentTrackIndex !== null && playlist[currentTrackIndex]) {
      const track = playlist[currentTrackIndex];
      const newSrc = `/api/audio?filename=${track.local_audio_url}` || "";
      if (audio.src !== newSrc) {
        audio.src = newSrc;
      }
      if (isPlaying && newSrc) {
        audio.play().catch(() => {});
      }
    } else {
      // No track selected or playlist empty
      audio.src = "";
      audio.pause();
    }
  }, [currentTrackIndex, playlist, isPlaying]);

  // Effect: Autoplay next track when current ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => {
      playNext();
    };
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
    };
  }, [playNext]);

  // The audio element to render in your component
  const audioElement = (
    <audio ref={audioRef} preload="auto" controls style={{ width: "100%" }} />
  );

  return {
    isPlaying,
    currentTrackIndex,
    currentTrack:
      currentTrackIndex !== null ? playlist[currentTrackIndex] : null,
    play,
    pause,
    playNext,
    playPrev,
    playTrack,
    stop,
    audioElement,
  };
}
