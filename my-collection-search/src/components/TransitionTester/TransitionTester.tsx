import { useEffect, useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Slider,
  Button,
  Spinner,
} from "@chakra-ui/react";
import type { Track } from "@/types/track";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { Deck } from "./Deck";

interface TransitionTesterProps {
  trackA: Track;
  trackB: Track;
}

export function TransitionTester({ trackA, trackB }: TransitionTesterProps) {
  const {
    deckA,
    deckB,
    crossfade,
    loadTrack,
    play,
    pause,
    stop,
    setVolume,
    setCrossfade,
    setPlaybackRate,
    seek,
  } = useAudioEngine();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTracks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Convert local_audio_url to API route format
        const getAudioUrl = (track: Track) => {
          if (track.local_audio_url) {
            // Extract filename from path like "/app/audio/track-123.m4a"
            const filename = track.local_audio_url.split("/").pop() || "";
            return `/api/audio?filename=${encodeURIComponent(filename)}`;
          }
          // Fallback to track_id
          return `/api/audio?filename=${encodeURIComponent(track.track_id)}.m4a`;
        };

        const audioUrlA = getAudioUrl(trackA);
        const audioUrlB = getAudioUrl(trackB);

        console.log("Loading audio files:", { audioUrlA, audioUrlB });

        // Check if files are accessible
        const checkUrl = async (url: string, label: string) => {
          try {
            const response = await fetch(url, { method: "HEAD" });
            if (!response.ok) {
              throw new Error(`${label}: HTTP ${response.status} - ${url}`);
            }
            console.log(`${label} accessible:`, url);
          } catch (err) {
            throw new Error(`${label} not accessible: ${url} - ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        };

        await checkUrl(audioUrlA, "Deck A audio");
        await checkUrl(audioUrlB, "Deck B audio");

        await Promise.all([
          loadTrack("A", audioUrlA),
          loadTrack("B", audioUrlB),
        ]);

        console.log("Audio loaded successfully");
      } catch (err) {
        console.error("Audio loading error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load audio files"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadTracks();
  }, [trackA, trackB, loadTrack]);

  const syncBPM = () => {
    // Sync Deck B to Deck A's BPM
    if (trackA.bpm && trackB.bpm) {
      const bpmA = parseFloat(trackA.bpm);
      const bpmB = parseFloat(trackB.bpm);
      const syncRate = bpmA / bpmB;
      setPlaybackRate("B", syncRate);
    }
  };

  if (isLoading) {
    return (
      <Box
        bg="gray.900"
        borderRadius="lg"
        p={8}
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="400px"
      >
        <VStack gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="white">Loading audio tracks...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        bg="red.900"
        borderRadius="lg"
        p={6}
        borderWidth={2}
        borderColor="red.500"
      >
        <VStack align="start" gap={2}>
          <Text fontSize="lg" fontWeight="bold" color="red.200">
            ⚠️ Error loading tracks
          </Text>
          <Text color="red.300">{error}</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box bg="gray.900" borderRadius="lg" p={6}>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" mb={2}>
          <Text fontSize="2xl" fontWeight="bold" color="white">
            🎧 Transition Tester
          </Text>
          <Button
            onClick={syncBPM}
            colorScheme="purple"
            size="sm"
            disabled={!trackA.bpm || !trackB.bpm}
          >
            Sync BPM (A → B)
          </Button>
        </HStack>

        {/* Deck A */}
        <Deck
          label="A"
          track={trackA}
          status={deckA}
          onPlay={() => play("A")}
          onPause={() => pause("A")}
          onStop={() => stop("A")}
          onVolumeChange={(v) => setVolume("A", v)}
          onPlaybackRateChange={(r) => setPlaybackRate("A", r)}
          onSeek={(t) => seek("A", t)}
        />

        {/* Crossfader */}
        <Box
          bg="gray.800"
          borderRadius="md"
          p={6}
          borderWidth={2}
          borderColor="purple.500"
        >
          <VStack gap={3}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color="gray.400">
                Crossfader
              </Text>
              <Text fontSize="sm" color="white">
                {crossfade < 0.45
                  ? "← Deck A"
                  : crossfade > 0.55
                  ? "Deck B →"
                  : "Center"}
              </Text>
            </HStack>
            <Slider.Root
              value={[crossfade * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={(e) => setCrossfade(e.value[0] / 100)}
            >
              <Slider.Control>
                <Slider.Track bg="gray.700">
                  <Slider.Range bg="purple.500" />
                </Slider.Track>
                <Slider.Thumbs />
              </Slider.Control>
            </Slider.Root>
            <HStack justify="space-between" w="full" fontSize="xs" color="gray.500">
              <Text>A (100%)</Text>
              <Text>Mix (50/50)</Text>
              <Text>B (100%)</Text>
            </HStack>
          </VStack>
        </Box>

        {/* Deck B */}
        <Deck
          label="B"
          track={trackB}
          status={deckB}
          onPlay={() => play("B")}
          onPause={() => pause("B")}
          onStop={() => stop("B")}
          onVolumeChange={(v) => setVolume("B", v)}
          onPlaybackRateChange={(r) => setPlaybackRate("B", r)}
          onSeek={(t) => seek("B", t)}
        />

        {/* Tips */}
        <Box bg="blue.900" borderRadius="md" p={4}>
          <Text fontSize="sm" color="blue.200">
            💡 <strong>Tips:</strong> Use the crossfader to blend between decks.
            Adjust pitch/tempo to match BPM, or use "Sync BPM" for automatic
            matching. Start Deck A, bring up the crossfader, then start Deck B
            to test your transition.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}
