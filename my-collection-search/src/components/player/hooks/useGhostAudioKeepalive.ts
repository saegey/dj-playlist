"use client";

import React from "react";

type UseGhostAudioKeepaliveArgs = {
  mode: "browser" | "local-dac";
  isPlaying: boolean;
  volume: number;
};

export function useGhostAudioKeepalive({
  mode,
  isPlaying,
  volume,
}: UseGhostAudioKeepaliveArgs) {
  React.useEffect(() => {
    const audioElement = document.querySelector(
      "#playlist-audio"
    ) as HTMLAudioElement;
    if (!audioElement) return;

    if (mode === "local-dac") {
      audioElement.muted = false;
      audioElement.volume = 0.002;
      console.log(
        "[DAC Mode] Ghost audio set to 0.2% volume for media controls"
      );
    } else {
      audioElement.muted = false;
      audioElement.volume = volume;
    }
  }, [mode, volume]);

  React.useEffect(() => {
    if (mode !== "local-dac") return;

    const audioElement = document.querySelector(
      "#playlist-audio"
    ) as HTMLAudioElement;
    if (!audioElement) return;

    const ensureGhostAudioState = () => {
      if (audioElement.muted || audioElement.volume !== 0.002) {
        audioElement.muted = false;
        audioElement.volume = 0.002;
      }

      const state = {
        paused: audioElement.paused,
        readyState: audioElement.readyState,
        volume: audioElement.volume,
        muted: audioElement.muted,
        src: audioElement.src ? "loaded" : "none",
        currentTime: audioElement.currentTime,
        isPlaying,
        duration: audioElement.duration,
      };
      console.log("[DAC Mode] Ghost audio state:", state);

      if (isPlaying && audioElement.paused && audioElement.readyState >= 2) {
        console.log("[DAC Mode] Starting ghost audio for media controls");
        audioElement
          .play()
          .then(() => {
            console.log("[DAC Mode] Ghost audio play() succeeded");
            if ("mediaSession" in navigator) {
              navigator.mediaSession.playbackState = "playing";
              console.log(
                "[DAC Mode] Forced MediaSession to playing (Safari fix)"
              );
            }
          })
          .catch((err) => {
            console.error("[DAC Mode] Failed to play ghost audio:", err);
          });
      } else if (!isPlaying && !audioElement.paused) {
        console.log("[DAC Mode] Pausing ghost audio");
        audioElement.pause();
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "paused";
          console.log("[DAC Mode] Forced MediaSession to paused (Safari fix)");
        }
      }
    };

    const onAudioPlaying = () => {
      if ("mediaSession" in navigator && mode === "local-dac") {
        navigator.mediaSession.playbackState = "playing";
        console.log("[DAC Mode] Audio playing event - MediaSession set to playing");
      }
    };

    const onAudioPause = () => {
      if ("mediaSession" in navigator && mode === "local-dac") {
        navigator.mediaSession.playbackState = "paused";
        console.log("[DAC Mode] Audio pause event - MediaSession set to paused");
      }
    };

    audioElement.addEventListener("volumechange", ensureGhostAudioState);
    audioElement.addEventListener("pause", ensureGhostAudioState);
    audioElement.addEventListener("play", ensureGhostAudioState);

    audioElement.addEventListener("playing", onAudioPlaying);
    audioElement.addEventListener("pause", onAudioPause);

    ensureGhostAudioState();

    const interval = setInterval(ensureGhostAudioState, 500);

    return () => {
      audioElement.removeEventListener("volumechange", ensureGhostAudioState);
      audioElement.removeEventListener("pause", ensureGhostAudioState);
      audioElement.removeEventListener("play", ensureGhostAudioState);
      audioElement.removeEventListener("playing", onAudioPlaying);
      audioElement.removeEventListener("pause", onAudioPause);
      clearInterval(interval);
    };
  }, [mode, isPlaying]);
}
