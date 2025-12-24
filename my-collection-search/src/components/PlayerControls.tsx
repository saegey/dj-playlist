"use client";

import React, { useMemo } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
  VStack,
  Slider,
  Icon,
} from "@chakra-ui/react";
import {
  FiPause,
  FiPlay,
  FiSkipBack,
  FiSkipForward,
  FiVolume2,
  FiVolume1,
  FiVolumeX,
  FiList,
} from "react-icons/fi";
import { Track } from "@/types/track";
import { usePlaylistPlayer } from "@/providers/PlaylistPlayerProvider";
import ProgressSlider from "@/components/player/ProgressSlider";
import CompactProgressSlider from "@/components/player/CompactProgressSlider";
import Artwork from "@/components/player/Artwork";
import ArtistLink from "./ArtistLink";
import AlbumLink from "./AlbumLink";
import PlaybackModeSelector from "@/components/PlaybackModeSelector";
import { usePlaybackMode, useLocalPlayback } from "@/hooks/usePlaybackMode";
import { useMPDStatus } from "@/hooks/useMPDStatus";

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
  } = usePlaylistPlayer();

  const { mode, setMode } = usePlaybackMode();
  const localPlayback = useLocalPlayback();
  const prevTrackIdRef = React.useRef<string | null>(null);
  const prevPlayingRef = React.useRef<boolean>(false);
  const isInitializedRef = React.useRef<boolean>(false);

  // Poll MPD status when in DAC mode
  const mpdStatus = useMPDStatus(mode === 'local-dac');

  // Sync MPD position to browser audio element for UI consistency
  React.useEffect(() => {
    if (mode !== 'local-dac') return;

    const audioElement = document.querySelector('#playlist-audio') as HTMLAudioElement;
    if (!audioElement) return;

    // Update audio element's currentTime to match MPD position
    // This will trigger the timeupdate event and update the UI
    if (mpdStatus.position > 0 && Math.abs(audioElement.currentTime - mpdStatus.position) > 1) {
      audioElement.currentTime = mpdStatus.position;
    }

    // Update duration if needed
    if (mpdStatus.duration > 0 && audioElement.duration !== mpdStatus.duration) {
      // Can't directly set duration, but it will be read from metadata
      console.log('[DAC Mode] MPD duration:', mpdStatus.duration);
    }
  }, [mode, mpdStatus.position, mpdStatus.duration]);

  // Sync DAC playback with player state
  React.useEffect(() => {
    if (mode !== 'local-dac') return;

    const currentTrackId = currentTrack?.track_id || null;
    const wasPlaying = prevPlayingRef.current;
    const trackChanged = prevTrackIdRef.current !== currentTrackId;

    // Skip first render - just initialize refs
    if (!isInitializedRef.current) {
      prevTrackIdRef.current = currentTrackId;
      prevPlayingRef.current = isPlaying;
      isInitializedRef.current = true;
      return;
    }

    // Track change detected while playing - stop old track and start new one
    if (trackChanged && isPlaying && currentTrack?.local_audio_url) {
      console.log('[DAC Mode] Track changed, restarting playback');
      localPlayback.play(currentTrack.local_audio_url).catch(err => {
        console.error('[DAC Mode] Failed to play new track:', err);
      });
    }
    // Playback paused - pause DAC (preserves position)
    else if (wasPlaying && !isPlaying) {
      console.log('[DAC Mode] Playback paused, pausing DAC');
      localPlayback.pause().catch(err => {
        console.error('[DAC Mode] Failed to pause DAC:', err);
      });
    }
    // Playback started - resume if paused, otherwise play from beginning
    else if (!wasPlaying && isPlaying && currentTrack?.local_audio_url) {
      if (mpdStatus.state === 'paused') {
        console.log('[DAC Mode] Resuming paused DAC playback');
        localPlayback.resume().catch(err => {
          console.error('[DAC Mode] Failed to resume DAC:', err);
        });
      } else {
        console.log('[DAC Mode] Starting DAC playback');
        localPlayback.play(currentTrack.local_audio_url).catch(err => {
          console.error('[DAC Mode] Failed to start DAC:', err);
        });
      }
    }

    prevTrackIdRef.current = currentTrackId;
    prevPlayingRef.current = isPlaying;
  }, [mode, isPlaying, currentTrack?.track_id, currentTrack?.local_audio_url, mpdStatus.state, localPlayback.play, localPlayback.pause, localPlayback.resume]); // Stable function references

  // Keep browser audio muted when in DAC mode
  // The "ghost" HTML5 audio keeps playing silently to:
  // 1. Maintain position sync even when tab is inactive
  // 2. Enable media controls (play/pause/seek) via explicit MediaSession updates
  // 3. Prevent browser from stopping playback on inactive tab
  React.useEffect(() => {
    const audioElement = document.querySelector('#playlist-audio') as HTMLAudioElement;
    if (!audioElement) return;

    if (mode === 'local-dac') {
      // Fully mute browser audio - MediaSession updates handle controls
      audioElement.muted = true;
      audioElement.volume = 0;
      console.log('[DAC Mode] Ghost audio fully muted - using explicit MediaSession updates');
    } else {
      // Restore browser playback in browser mode
      audioElement.muted = false;
      audioElement.volume = volume;
    }
  }, [mode, volume]);

  // Ensure ghost audio stays at low volume and playing for media controls
  React.useEffect(() => {
    if (mode !== 'local-dac') return;

    const audioElement = document.querySelector('#playlist-audio') as HTMLAudioElement;
    if (!audioElement) return;

    const ensureGhostAudioState = () => {
      // Keep audio fully muted - explicit MediaSession updates handle controls
      if (!audioElement.muted || audioElement.volume !== 0) {
        audioElement.muted = true;
        audioElement.volume = 0;
      }

      // Debug current state
      const state = {
        paused: audioElement.paused,
        readyState: audioElement.readyState,
        volume: audioElement.volume,
        muted: audioElement.muted,
        src: audioElement.src ? 'loaded' : 'none',
        currentTime: audioElement.currentTime,
        isPlaying: isPlaying,
        duration: audioElement.duration,
      };
      console.log('[DAC Mode] Ghost audio state:', state);

      // CRITICAL: Keep it playing for media controls to work
      // Media controls only work if audio is actively playing
      if (isPlaying && audioElement.paused && audioElement.readyState >= 2) {
        console.log('[DAC Mode] Starting ghost audio for media controls');
        audioElement.play().then(() => {
          console.log('[DAC Mode] Ghost audio play() succeeded');
          // Safari requires explicit MediaSession state update after play
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
            console.log('[DAC Mode] Forced MediaSession to playing (Safari fix)');
          }
        }).catch(err => {
          console.error('[DAC Mode] Failed to play ghost audio:', err);
        });
      } else if (!isPlaying && !audioElement.paused) {
        // When paused, pause the ghost audio too
        console.log('[DAC Mode] Pausing ghost audio');
        audioElement.pause();
        // Safari requires explicit MediaSession state update after pause
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
          console.log('[DAC Mode] Forced MediaSession to paused (Safari fix)');
        }
      }
    };

    // Safari-specific: Update MediaSession when audio element state changes
    const onAudioPlaying = () => {
      if ('mediaSession' in navigator && mode === 'local-dac') {
        navigator.mediaSession.playbackState = 'playing';
        console.log('[DAC Mode] Audio playing event - MediaSession set to playing');
      }
    };

    const onAudioPause = () => {
      if ('mediaSession' in navigator && mode === 'local-dac') {
        navigator.mediaSession.playbackState = 'paused';
        console.log('[DAC Mode] Audio pause event - MediaSession set to paused');
      }
    };

    // Listen for volume changes and pause events
    audioElement.addEventListener('volumechange', ensureGhostAudioState);
    audioElement.addEventListener('pause', ensureGhostAudioState);
    audioElement.addEventListener('play', ensureGhostAudioState);

    // Safari fix: Listen to actual playing/pause events
    audioElement.addEventListener('playing', onAudioPlaying);
    audioElement.addEventListener('pause', onAudioPause);

    // Initial setup
    ensureGhostAudioState();

    // Check more frequently (every 500ms) to ensure it stays in sync
    const interval = setInterval(ensureGhostAudioState, 500);

    return () => {
      audioElement.removeEventListener('volumechange', ensureGhostAudioState);
      audioElement.removeEventListener('pause', ensureGhostAudioState);
      audioElement.removeEventListener('play', ensureGhostAudioState);
      audioElement.removeEventListener('playing', onAudioPlaying);
      audioElement.removeEventListener('pause', onAudioPause);
      clearInterval(interval);
    };
  }, [mode, isPlaying]);

  const VolumeIcon = useMemo(() => {
    if (volume === 0) return FiVolumeX;
    if (volume < 0.5) return FiVolume1;
    return FiVolume2;
  }, [volume]);

  const safeLen = playlist.length;
  const safeIndex = currentTrackIndex;
  const canPrev = safeIndex !== null && safeIndex > 0;
  const canNext = safeIndex !== null && safeIndex < safeLen - 1;

  // Handle play/pause - just update UI state, sync effect handles DAC
  const handlePlay = () => {
    browserPlay();
  };

  const handlePause = () => {
    browserPause();
  };

  // Handle seek - call MPD in DAC mode, otherwise use browser seek
  const handleSeek = async (time: number) => {
    if (mode === 'local-dac') {
      try {
        await localPlayback.seek(time);
        console.log('[DAC Mode] Seeked to', time);
      } catch (error) {
        console.error('[DAC Mode] Seek failed:', error);
      }
    } else {
      seek(time);
    }
  };

  // Update MediaSession API for media controls (lock screen, keyboard shortcuts)
  React.useEffect(() => {
    console.log('[MediaSession] Effect triggered - mode:', mode, 'currentTrack:', currentTrack?.title);

    if (mode !== 'local-dac') {
      // Clear MediaSession when not in DAC mode
      if ('mediaSession' in navigator) {
        console.log('[MediaSession] Clearing (not in DAC mode)');
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
      return;
    }

    if (!currentTrack) {
      console.log('[MediaSession] No current track');
      return;
    }

    if (!('mediaSession' in navigator)) {
      console.error('[MediaSession] MediaSession API not available in this browser');
      return;
    }

    console.log('[MediaSession] Setting up controls...');

    // Update metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album || undefined,
      artwork: currentTrack.album_thumbnail ? [
        { src: currentTrack.album_thumbnail, sizes: '512x512', type: 'image/jpeg' }
      ] : undefined,
    });

    // Update playback state - CRITICAL for media controls to work
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    console.log('[MediaSession] Playback state set to:', isPlaying ? 'playing' : 'paused');

    // Update position state - helps browser understand media is active
    if (mpdStatus.duration > 0) {
      navigator.mediaSession.setPositionState({
        duration: mpdStatus.duration,
        playbackRate: 1,
        position: mpdStatus.position,
      });
      console.log('[MediaSession] Position state set:', mpdStatus.position, '/', mpdStatus.duration);
    }

    // Set up action handlers
    console.log('[MediaSession] Setting up action handlers...');

    navigator.mediaSession.setActionHandler('play', () => {
      console.log('[MediaSession] ✓ Play button pressed');
      handlePlay();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      console.log('[MediaSession] ✓ Pause button pressed');
      handlePause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      console.log('[MediaSession] ✓ Previous button pressed');
      if (canPrev) playPrev();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      console.log('[MediaSession] ✓ Next button pressed');
      if (canNext) playNext();
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        console.log('[MediaSession] ✓ Seek to', details.seekTime);
        handleSeek(details.seekTime);
      }
    });

    console.log('[MediaSession] ✓ All handlers registered - Track:', currentTrack.title);

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
    };
  }, [mode, currentTrack, isPlaying, canPrev, canNext, playPrev, playNext, mpdStatus.duration, mpdStatus.position]);

  return (
    <Box>
      {/* Playhead slider - only show if not compact */}
      {!compact && <ProgressSlider seek={handleSeek} />}

      {/* Mobile track info - only in compact mode */}
      {compact && (
        <Flex mb={2}>
          <VStack
            align="start"
            gap={1}
            flex="1"
            minW={0}
            display={{ base: "flex", md: "none" }}
          >
            <Text fontWeight="semibold" fontSize="sm" maxW="100%">
              {currentTrack ? currentTrack.title : "No track playing"}
            </Text>
            <Text color="fg.muted" fontSize="xs" maxW="100%">
              {currentTrack ? currentTrack.artist : "—"}
            </Text>
          </VStack>
        </Flex>
      )}

      {/* Main controls */}
      <Flex
        align="center"
        gap={{ base: 3, md: 4 }}
        justify="space-between"
        minH={compact ? "48px" : "64px"}
      >
        {/* Left: Artwork + track info */}
        <HStack minW={0} gap={3} flex="1">
          <AlbumLink
            releaseId={currentTrack?.release_id}
            friendId={currentTrack?.friend_id}
          >
            <Artwork
              src={(currentTrack as Track)?.album_thumbnail}
              alt={
                currentTrack
                  ? `${currentTrack.artist} - ${currentTrack.title}`
                  : "Artwork"
              }
              size={compact ? "40px" : "48px"}
            />
          </AlbumLink>
          <VStack
            align="start"
            minW={0}
            display={compact ? "none" : { base: "none", md: "flex" }}
          >
            <Text
              fontWeight="semibold"
              fontSize={{ base: "sm", md: "md" }}
              maxW="40vw"
            >
              {currentTrack ? currentTrack.title : "No track playing"}
            </Text>
            <Text color="fg.muted" fontSize="xs" maxW="40vw">
              {currentTrack ? (
                <ArtistLink
                  artist={currentTrack.artist}
                  friendId={currentTrack.friend_id}
                >
                  {currentTrack.artist}
                </ArtistLink>
              ) : (
                "—"
              )}
            </Text>
          </VStack>
        </HStack>

        {/* Center: transport controls */}
        <HStack gap={{ base: 1, md: 2 }}>
          <IconButton
            aria-label="Previous"
            size="sm"
            variant="ghost"
            onClick={playPrev}
            disabled={!canPrev}
          >
            <FiSkipBack />
          </IconButton>

          {isPlaying ? (
            <Button
              aria-label="Pause"
              size="sm"
              variant="solid"
              colorScheme="red"
              onClick={handlePause}
            >
              <FiPause />
            </Button>
          ) : (
            <Button
              aria-label="Play"
              size="sm"
              variant="solid"
              colorScheme="green"
              onClick={handlePlay}
              disabled={safeLen === 0}
            >
              <FiPlay />
            </Button>
          )}

          <IconButton
            aria-label="Next"
            size="sm"
            variant="ghost"
            onClick={playNext}
            disabled={!canNext}
          >
            <FiSkipForward />
          </IconButton>
        </HStack>

        {/* Right: extras (playback mode, volume, queue) */}
        <HStack gap={1} justify="flex-end" flex="1">
          {/* Playback Mode Selector - visible on all screens */}
          {/* Mobile: compact icons only, Desktop: full with text */}
          <Box display={{ base: "block", md: "none" }}>
            <PlaybackModeSelector
              value={mode}
              onChange={setMode}
              disabled={isPlaying}
              compact={true}
            />
          </Box>
          <Box display={{ base: "none", md: "block" }}>
            <PlaybackModeSelector
              value={mode}
              onChange={setMode}
              disabled={isPlaying}
              compact={false}
            />
          </Box>

          {showVolumeControls && mode === 'browser' && (
            <Box display={{ base: "none", md: "block" }}>
              <HStack align="center" gap={3}>
                <Icon
                  aria-label={volume === 0 ? "Unmute" : "Mute"}
                  size="sm"
                  onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                  cursor="pointer"
                >
                  <VolumeIcon />
                </Icon>
                <Slider.Root
                  width="200px"
                  value={[volume * 100]}
                  onValueChange={(e) => {
                    setVolume(e.value[0] / 100);
                  }}
                >
                  <Slider.Control>
                    <Slider.Track>
                      <Slider.Range />
                    </Slider.Track>
                    <Slider.Thumbs rounded="l1" />
                  </Slider.Control>
                </Slider.Root>
              </HStack>
            </Box>
          )}

          {showQueueButton && onQueueToggle && (
            <IconButton
              aria-label="Queue"
              size="sm"
              variant="ghost"
              title="Queue"
              onClick={onQueueToggle}
              colorPalette={isQueueOpen ? "blue" : undefined}
            >
              <FiList />
            </IconButton>
          )}
        </HStack>
      </Flex>

      {/* Progress bar for compact mode */}
      {compact && (
        <Box mt={2}>
          <CompactProgressSlider seek={handleSeek} />
        </Box>
      )}
    </Box>
  );
}
