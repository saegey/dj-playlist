"use client";

import React from "react";

type MpdStatusLike = {
  position: number;
  duration: number;
};

type TrackLike = {
  title: string;
  artist: string;
  album?: string | null;
} | null;

type UseLocalDacMediaSessionArgs = {
  mode: "browser" | "local-dac";
  currentTrack: TrackLike;
  currentArtwork: string;
  isPlaying: boolean;
  canPrev: boolean;
  canNext: boolean;
  playPrev: () => void;
  playNext: () => void;
  handlePlay: () => void;
  handlePause: () => void;
  handleSeek: (time: number) => Promise<void>;
  mpdStatus: MpdStatusLike;
};

export function useLocalDacMediaSession({
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
}: UseLocalDacMediaSessionArgs) {
  React.useEffect(() => {
    console.log(
      "[MediaSession] Effect triggered - mode:",
      mode,
      "currentTrack:",
      currentTrack?.title
    );

    if (mode !== "local-dac") {
      if ("mediaSession" in navigator) {
        console.log("[MediaSession] Clearing (not in DAC mode)");
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = "none";
      }
      return;
    }

    if (!currentTrack) {
      console.log("[MediaSession] No current track");
      return;
    }

    if (!("mediaSession" in navigator)) {
      console.error(
        "[MediaSession] MediaSession API not available in this browser"
      );
      return;
    }

    console.log("[MediaSession] Setting up controls...");

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album || undefined,
      artwork: currentArtwork
        ? [
            {
              src: currentArtwork,
              sizes: "512x512",
              type: "image/jpeg",
            },
          ]
        : undefined,
    });

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    console.log(
      "[MediaSession] Playback state set to:",
      isPlaying ? "playing" : "paused"
    );

    if (mpdStatus.duration > 0) {
      navigator.mediaSession.setPositionState({
        duration: mpdStatus.duration,
        playbackRate: 1,
        position: mpdStatus.position,
      });
      console.log(
        "[MediaSession] Position state set:",
        mpdStatus.position,
        "/",
        mpdStatus.duration
      );
    }

    console.log("[MediaSession] Setting up action handlers...");

    navigator.mediaSession.setActionHandler("play", () => {
      console.log("[MediaSession] ✓ Play button pressed");
      handlePlay();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      console.log("[MediaSession] ✓ Pause button pressed");
      handlePause();
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      console.log("[MediaSession] ✓ Previous button pressed");
      if (canPrev) playPrev();
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      console.log("[MediaSession] ✓ Next button pressed");
      if (canNext) playNext();
    });

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined) {
        console.log("[MediaSession] ✓ Seek to", details.seekTime);
        handleSeek(details.seekTime);
      }
    });

    console.log(
      "[MediaSession] ✓ All handlers registered - Track:",
      currentTrack.title
    );

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = "none";
      }
    };
  }, [
    mode,
    currentTrack,
    isPlaying,
    canPrev,
    canNext,
    playPrev,
    playNext,
    mpdStatus.duration,
    mpdStatus.position,
    handlePlay,
    handlePause,
    handleSeek,
    currentArtwork,
  ]);
}
