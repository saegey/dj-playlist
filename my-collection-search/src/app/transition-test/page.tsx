"use client";

import { useState } from "react";
import { Box, Heading, Text, Button, VStack, Input, Spinner } from "@chakra-ui/react";
import { TransitionTester } from "@/components/TransitionTester/TransitionTester";
import type { Track } from "@/types/track";
import { fetchTracksByIds } from "@/services/trackService";
import PageContainer from "@/components/layout/PageContainer";

export default function TransitionTestPage() {
  const [showTester, setShowTester] = useState(false);
  const [trackA, setTrackA] = useState<Track | null>(null);
  const [trackB, setTrackB] = useState<Track | null>(null);
  const [trackIdA, setTrackIdA] = useState("");
  const [trackIdB, setTrackIdB] = useState("");
  const [friendId, setFriendId] = useState(1); // Will auto-detect from first track
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTracks = async () => {
    if (!trackIdA || !trackIdB) {
      setError("Please enter both track IDs");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tracks = await fetchTracksByIds([
        { track_id: trackIdA, friend_id: friendId },
        { track_id: trackIdB, friend_id: friendId },
      ]);

      if (tracks.length !== 2) {
        setError("Could not find one or both tracks");
        return;
      }

      // Verify tracks have audio
      if (!tracks[0].local_audio_url && !tracks[1].local_audio_url) {
        setError("Warning: Tracks don't have audio files. Make sure to download audio first.");
      }

      setTrackA(tracks[0]);
      setTrackB(tracks[1]);
      setShowTester(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tracks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer size="standard" py={8}>
      <VStack align="stretch" gap={6}>
        <Box>
          <Heading size="xl" mb={2}>
            DJ Transition Tester
          </Heading>
          <Text color="gray.400">
            Test how two tracks blend together before adding them to your playlist
          </Text>
        </Box>

        {!showTester ? (
          <Box bg="gray.800" p={8} borderRadius="lg">
            <VStack gap={4} align="stretch">
              <Text color="white" fontSize="lg" fontWeight="bold">
                Enter Track IDs to Test
              </Text>

              <Box>
                <Text color="gray.400" fontSize="sm" mb={2}>
                  Deck A Track ID
                </Text>
                <Input
                  value={trackIdA}
                  onChange={(e) => setTrackIdA(e.target.value)}
                  placeholder="Enter track_id for Deck A"
                  bg="gray.700"
                  color="white"
                />
              </Box>

              <Box>
                <Text color="gray.400" fontSize="sm" mb={2}>
                  Deck B Track ID
                </Text>
                <Input
                  value={trackIdB}
                  onChange={(e) => setTrackIdB(e.target.value)}
                  placeholder="Enter track_id for Deck B"
                  bg="gray.700"
                  color="white"
                />
              </Box>

              <Box>
                <Text color="gray.400" fontSize="sm" mb={2}>
                  Friend ID (optional - usually 1)
                </Text>
                <Input
                  type="number"
                  value={friendId}
                  onChange={(e) => setFriendId(parseInt(e.target.value) || 1)}
                  placeholder="Friend ID"
                  bg="gray.700"
                  color="white"
                />
              </Box>

              {error && (
                <Box bg="red.900" p={3} borderRadius="md" borderWidth={1} borderColor="red.500">
                  <Text color="red.200" fontSize="sm">{error}</Text>
                </Box>
              )}

              <Button
                colorScheme="purple"
                size="lg"
                onClick={loadTracks}
                disabled={loading || !trackIdA || !trackIdB}
              >
                {loading ? <Spinner size="sm" /> : "Load Tracks & Test Transition"}
              </Button>

              <Box bg="blue.900" p={4} borderRadius="md">
                <Text fontSize="sm" color="blue.200">
                  💡 <strong>Tip:</strong> You can find track IDs in your search results or playlists.
                  Make sure both tracks have audio files downloaded (check for local_audio_url).
                </Text>
              </Box>
            </VStack>
          </Box>
        ) : trackA && trackB ? (
          <>
            <Button
              onClick={() => {
                setShowTester(false);
                setTrackA(null);
                setTrackB(null);
                setTrackIdA("");
                setTrackIdB("");
              }}
              size="sm"
              variant="outline"
              alignSelf="flex-start"
            >
              ← Back to Track Selection
            </Button>
            <TransitionTester trackA={trackA} trackB={trackB} />
          </>
        ) : null}

        {/* Instructions */}
        <Box bg="gray.800" p={6} borderRadius="lg">
          <Heading size="md" mb={4} color="white">
            How to Use
          </Heading>
          <VStack align="stretch" gap={2} color="gray.300">
            <Text>
              <strong>1.</strong> Find two tracks in your collection (search or browse playlists)
            </Text>
            <Text>
              <strong>2.</strong> Make sure both tracks have audio downloaded (local_audio_url field)
            </Text>
            <Text>
              <strong>3.</strong> Copy their track_id values and paste above
            </Text>
            <Text>
              <strong>4.</strong> Click "Load Tracks & Test Transition"
            </Text>
            <Text>
              <strong>5.</strong> Use the dual-deck player to test your transition!
            </Text>
          </VStack>
        </Box>
      </VStack>
    </PageContainer>
  );
}
