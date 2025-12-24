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

    // Track change detected while playing - stop old track and start new one
    if (trackChanged && isPlaying && currentTrack?.local_audio_url) {
      console.log('[DAC Mode] Track changed, restarting playback');
      localPlayback.play(currentTrack.local_audio_url).catch(err => {
        console.error('[DAC Mode] Failed to play new track:', err);
      });
    }
    // Playback stopped - stop DAC
    else if (wasPlaying && !isPlaying) {
      console.log('[DAC Mode] Playback stopped, stopping DAC');
      localPlayback.stop().catch(err => {
        console.error('[DAC Mode] Failed to stop DAC:', err);
      });
    }
    // Playback started - start DAC
    else if (!wasPlaying && isPlaying && currentTrack?.local_audio_url) {
      console.log('[DAC Mode] Playback started via state change');
      localPlayback.play(currentTrack.local_audio_url).catch(err => {
        console.error('[DAC Mode] Failed to start DAC:', err);
      });
    }

    prevTrackIdRef.current = currentTrackId;
    prevPlayingRef.current = isPlaying;
  }, [mode, isPlaying, currentTrack?.track_id, currentTrack?.local_audio_url, localPlayback]);

  // Keep browser audio muted when in DAC mode
  React.useEffect(() => {
    const audioElement = document.querySelector('#playlist-audio') as HTMLAudioElement;
    if (!audioElement) return;

    if (mode === 'local-dac') {
      // Force browser audio to stay muted and paused in DAC mode
      audioElement.volume = 0;
      audioElement.muted = true;
      audioElement.pause();
    } else {
      // Restore browser playback in browser mode
      audioElement.muted = false;
      audioElement.volume = volume;
    }
  }, [mode, volume]);

  // Ensure browser stays muted in DAC mode
  React.useEffect(() => {
    if (mode !== 'local-dac') return;

    const audioElement = document.querySelector('#playlist-audio') as HTMLAudioElement;
    if (!audioElement) return;

    const ensureMuted = (e: Event) => {
      if (mode === 'local-dac') {
        // Only log and mute, don't pause
        // Let the audio element play silently for UI state consistency
        if (audioElement.volume > 0 || !audioElement.muted) {
          console.log('[DAC Mode] Forcing mute on event:', e.type);
          audioElement.volume = 0;
          audioElement.muted = true;
        }
      }
    };

    // Listen for volume changes to keep it muted
    audioElement.addEventListener('volumechange', ensureMuted);
    audioElement.addEventListener('loadeddata', ensureMuted);

    // Initial mute
    audioElement.volume = 0;
    audioElement.muted = true;
    console.log('[DAC Mode] Browser audio muted for DAC playback');

    return () => {
      audioElement.removeEventListener('volumechange', ensureMuted);
      audioElement.removeEventListener('loadeddata', ensureMuted);
    };
  }, [mode]);

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
          {/* Playback Mode Selector */}
          <Box display={{ base: "none", lg: "block" }}>
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
