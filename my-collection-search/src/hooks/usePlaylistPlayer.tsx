import { useCallback, useEffect, useRef, useState } from "react";
import type { Track } from "@/types/track";

export function usePlaylistPlayer(playlist: Track[] = []) {
  const playlistRef = useRef<Track[]>(playlist);
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset when playlist content (not just reference) changes
  const prevPlaylistHashRef = useRef<string | null>(null);
  useEffect(() => {
    const playlistHash = JSON.stringify(
      (playlist ?? []).map((t) => t.track_id)
    );
    if (
      prevPlaylistHashRef.current &&
      prevPlaylistHashRef.current !== playlistHash
    ) {
      setCurrentTrackIndex(null);
      setIsPlaying(false);
    }
    prevPlaylistHashRef.current = playlistHash;
  }, [playlist]);

  const play = useCallback(() => {
    const pl = playlistRef.current;
    if (pl.length === 0) return;
    setIsPlaying(true);
    if (currentTrackIndex === null || currentTrackIndex >= pl.length) {
      setCurrentTrackIndex(0);
    }
  }, [currentTrackIndex]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTrackIndex(null);
  }, []);

  const playNext = useCallback(() => {
    const pl = playlistRef.current;
    if (pl.length === 0 || currentTrackIndex === null) return;

    if (currentTrackIndex < pl.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
      setIsPlaying(true);
    } else {
      stop(); // Reached end
    }
  }, [currentTrackIndex, stop]);

  const playPrev = useCallback(() => {
    const pl = playlistRef.current;
    if (pl.length === 0 || currentTrackIndex === null) return;

    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      setIsPlaying(true);
    }
  }, [currentTrackIndex]);

  const playTrack = useCallback((idx: number) => {
    const pl = playlistRef.current;
    if (idx >= 0 && idx < pl.length) {
      setCurrentTrackIndex(idx);
      setIsPlaying(true);
    }
  }, []);

  // Effect: handle play/pause state
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

  // Effect: change audio src when track or playlist changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrackIndex !== null && playlist[currentTrackIndex]) {
      const track = playlist[currentTrackIndex];
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
  }, [currentTrackIndex, playlist, isPlaying]);

  // Effect: auto-play next when current track ends
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
    stop,
    playNext,
    playPrev,
    playTrack,
    audioElement,
  };
}
