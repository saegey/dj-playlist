"use client";

import PlayerControlsView from "@/components/player/PlayerControlsView";
import { usePlayerControlsController } from "@/components/player/usePlayerControlsController";
import { useLocalDacPlaybackSync } from "@/components/player/hooks/useLocalDacPlaybackSync";
import { useGhostAudioKeepalive } from "@/components/player/hooks/useGhostAudioKeepalive";
import { useLocalDacMediaSession } from "@/components/player/hooks/useLocalDacMediaSession";

interface PlayerControlsProps {
  /** Whether to show the queue button */
  showQueueButton?: boolean;
  /** Queue button click handler */
  onQueueToggle?: () => void;
  /** Whether queue is open (for button highlighting) */
  isQueueOpen?: boolean;
  /** Compact mode for drawer display */
  compact?: boolean;
  /** Whether to show volume controls */
  showVolumeControls?: boolean;
}

export default function PlayerControls({
  showQueueButton = true,
  onQueueToggle,
  isQueueOpen = false,
  compact = false,
  showVolumeControls = true,
}: PlayerControlsProps) {
  const {
    isPlaying,
    currentTrack,
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
  } = usePlayerControlsController();

  useLocalDacPlaybackSync({
    mode,
    currentTrack,
    isPlaying,
    mpdStatus,
    localPlayback,
  });

  useGhostAudioKeepalive({
    mode,
    isPlaying,
    volume,
  });

  useLocalDacMediaSession({
    mode,
    currentTrack,
    currentArtwork,
    isPlaying,
    canPrev,
    canNext,
    playPrev,
    playNext,
    handlePlay,
    handlePause,
    handleSeek,
    mpdStatus,
  });

  return (
    <PlayerControlsView
      showQueueButton={showQueueButton}
      onQueueToggle={onQueueToggle}
      isQueueOpen={isQueueOpen}
      compact={compact}
      showVolumeControls={showVolumeControls}
      isPlaying={isPlaying}
      currentTrack={currentTrack}
      safeLen={safeLen}
      canPrev={canPrev}
      canNext={canNext}
      playPrev={playPrev}
      playNext={playNext}
      mode={mode}
      setMode={setMode}
      volume={volume}
      setVolume={setVolume}
      VolumeIcon={VolumeIcon}
      isAirPlayAvailable={isAirPlayAvailable}
      isAirPlayActive={isAirPlayActive}
      onAirPlayClick={handleAirPlayClick}
      onPlay={handlePlay}
      onPause={handlePause}
      onSeek={handleSeek}
    />
  );
}
