"use client";

import { useMemo, useCallback } from "react";
import type { IconType } from "react-icons";
import { FiVolume2, FiVolume1, FiVolumeX } from "react-icons/fi";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import { toaster } from "@/components/ui/toaster";
import { usePlaybackMode, useLocalPlayback } from "@/hooks/usePlaybackMode";
import { useMPDStatus } from "@/hooks/useMPDStatus";

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
    playlist,
    volume,
    setVolume,
    isAirPlayAvailable,
    isAirPlayActive,
    showAirPlayPicker,
  } = usePlaylistPlayer();

  const { mode, setMode } = usePlaybackMode();
  const localPlayback = useLocalPlayback();
  const mpdStatus = useMPDStatus(mode === "local-dac");

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
      if (mode === "local-dac") {
        try {
          await localPlayback.seek(time);
          console.log("[DAC Mode] Seeked to", time);
        } catch (error) {
          console.error("[DAC Mode] Seek failed:", error);
        }
      } else {
        seek(time);
      }
    },
    [mode, localPlayback, seek]
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
    mode,
    setMode,
    localPlayback,
    mpdStatus,
    currentArtwork,
    safeLen,
    canPrev,
    canNext,
    VolumeIcon,
    handlePlay,
    handlePause,
    handleSeek,
    handleAirPlayClick,
  };
}
