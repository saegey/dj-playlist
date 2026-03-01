"use client";

import React from "react";

type LocalPlaybackControls = {
  play: (filename: string) => Promise<unknown>;
  pause: () => Promise<unknown>;
  resume: () => Promise<unknown>;
};

type MpdStatusLike = {
  position: number;
  duration: number;
  state: "idle" | "playing" | "paused" | "stopped";
};

type TrackLike = {
  track_id?: string | null;
  local_audio_url?: string | null;
} | null;

type UseLocalDacPlaybackSyncArgs = {
  mode: "browser" | "local-dac";
  currentTrack: TrackLike;
  isPlaying: boolean;
  mpdStatus: MpdStatusLike;
  localPlayback: LocalPlaybackControls;
};

export function useLocalDacPlaybackSync({
  mode,
  currentTrack,
  isPlaying,
  mpdStatus,
  localPlayback,
}: UseLocalDacPlaybackSyncArgs) {
  const prevTrackIdRef = React.useRef<string | null>(null);
  const prevPlayingRef = React.useRef<boolean>(false);
  const isInitializedRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (mode !== "local-dac") return;

    const audioElement = document.querySelector(
      "#playlist-audio"
    ) as HTMLAudioElement;
    if (!audioElement) return;

    if (
      mpdStatus.position > 0 &&
      Math.abs(audioElement.currentTime - mpdStatus.position) > 1
    ) {
      audioElement.currentTime = mpdStatus.position;
    }

    if (
      mpdStatus.duration > 0 &&
      audioElement.duration !== mpdStatus.duration
    ) {
      console.log("[DAC Mode] MPD duration:", mpdStatus.duration);
    }
  }, [mode, mpdStatus.position, mpdStatus.duration]);

  React.useEffect(() => {
    if (mode !== "local-dac") return;

    const currentTrackId = currentTrack?.track_id || null;
    const wasPlaying = prevPlayingRef.current;
    const trackChanged = prevTrackIdRef.current !== currentTrackId;

    if (!isInitializedRef.current) {
      prevTrackIdRef.current = currentTrackId;
      prevPlayingRef.current = isPlaying;
      isInitializedRef.current = true;
      return;
    }

    if (trackChanged && isPlaying && currentTrack?.local_audio_url) {
      console.log("[DAC Mode] Track changed, restarting playback");
      localPlayback.play(currentTrack.local_audio_url).catch((err) => {
        console.error("[DAC Mode] Failed to play new track:", err);
      });
    } else if (wasPlaying && !isPlaying) {
      console.log("[DAC Mode] Playback paused, pausing DAC");
      localPlayback.pause().catch((err) => {
        console.error("[DAC Mode] Failed to pause DAC:", err);
      });
    } else if (!wasPlaying && isPlaying && currentTrack?.local_audio_url) {
      if (mpdStatus.state === "paused") {
        console.log("[DAC Mode] Resuming paused DAC playback");
        localPlayback.resume().catch((err) => {
          console.error("[DAC Mode] Failed to resume DAC:", err);
        });
      } else {
        console.log("[DAC Mode] Starting DAC playback");
        localPlayback.play(currentTrack.local_audio_url).catch((err) => {
          console.error("[DAC Mode] Failed to start DAC:", err);
        });
      }
    }

    prevTrackIdRef.current = currentTrackId;
    prevPlayingRef.current = isPlaying;
  }, [
    mode,
    isPlaying,
    currentTrack?.track_id,
    currentTrack?.local_audio_url,
    mpdStatus.state,
    localPlayback.play,
    localPlayback.pause,
    localPlayback.resume,
    localPlayback,
  ]);
}
