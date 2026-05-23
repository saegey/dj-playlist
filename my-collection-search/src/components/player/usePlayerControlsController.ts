"use client";

import { useMemo, useCallback } from "react";
import type { IconType } from "react-icons";
import { FiVolume2, FiVolume1, FiVolumeX } from "react-icons/fi";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { toaster } from "@/components/ui/toaster";

export function usePlayerControlsController() {
  const {
    isPlaying,
    currentTrackIndex,
    currentTrack,
    seek,
    play: browserPlay,
    pause: browserPause,
    playNext,
    playPrev,
    clearQueue,
    playlist,
    volume,
    setVolume,
    isAirPlayAvailable,
    isAirPlayActive,
    showAirPlayPicker,
  } = usePlaylistPlayer();

  const currentArtwork =
    currentTrack?.audio_file_album_art_url ||
    currentTrack?.album_thumbnail ||
    "/images/placeholder-artwork.png";

  const safeLen = playlist.length;
  const safeIndex = currentTrackIndex;
  const canPrev = safeIndex !== null && safeIndex > 0;
  const canNext = safeIndex !== null && safeIndex < safeLen - 1;

  const VolumeIcon = useMemo<IconType>(() => {
    if (volume === 0) return FiVolumeX;
    if (volume < 0.5) return FiVolume1;
    return FiVolume2;
  }, [volume]);

  const handlePlay = useCallback(() => {
    browserPlay();
  }, [browserPlay]);

  const handlePause = useCallback(() => {
    browserPause();
  }, [browserPause]);

  const handleSeek = useCallback(
    async (time: number) => {
      seek(time);
    },
    [seek]
  );

  const handleAirPlayClick = useCallback(() => {
    const opened = showAirPlayPicker();
    if (!opened) {
      toaster.create({
        title: "AirPlay picker unavailable",
        description: "Safari did not expose AirPlay for this media session.",
        type: "warning",
      });
    }
  }, [showAirPlayPicker]);

  const handleClosePlayer = useCallback(async () => {
    browserPause();
    clearQueue();
  }, [browserPause, clearQueue]);

  return {
    isPlaying,
    currentTrack,
    playlist,
    volume,
    setVolume,
    isAirPlayAvailable,
    isAirPlayActive,
    playNext,
    playPrev,
    currentArtwork,
    safeLen,
    canPrev,
    canNext,
    VolumeIcon,
    handlePlay,
    handlePause,
    handleSeek,
    handleAirPlayClick,
    handleClosePlayer,
  };
}
