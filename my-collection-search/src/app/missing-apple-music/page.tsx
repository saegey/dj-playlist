"use client";

import React, { useEffect, useState } from "react";
import { useFriends } from "@/hooks/useFriends";
import { Track } from "../../types/track";
import {
  Box,
  Flex,
  Text,
  Button,
  Spinner,
  Image,
  Input,
  HStack,
  Container,
} from "@chakra-ui/react";
import { useUsernameSelect } from "@/hooks/useUsernameSelect";
import TrackResult from "../../components/TrackResult";
import TopMenuBar from "@/components/MenuBar";
import { TrackEditFormProps } from "../../components/TrackEditForm";
import { useSelectedUsername } from "@/hooks/useSelectedUsername";

interface AppleMusicResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  url: string;
  artwork?: string;
  duration?: number;
  isrc?: string;
}

export default function MissingAppleMusicPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { friends: usernames } = useFriends({showCurrentUser: true});
  const [selectedUsername, setSelectedUsername] = useSelectedUsername();
  const [currentIndex, setCurrentIndex] = useState(0);

  const [appleResults, setAppleResults] = useState<
    Record<string, AppleMusicResult | null | undefined>
  >({});
  const [overrideTrackId, setOverrideTrackId] = useState<string | null>(null);
  const [overrideQuery, setOverrideQuery] = useState<string>("");

  // Friends are loaded via useFriends hook

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Fetch tracks when username or page changes
  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      let url = `/api/tracks/missing-apple-music?page=${page}&pageSize=${pageSize}`;
      if (selectedUsername)
        url += `&username=${encodeURIComponent(selectedUsername)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTracks(data);
          setTotal(data.length);
        } else if (data && Array.isArray(data.tracks)) {
          setTracks(data.tracks);
          setTotal(
            typeof data.total === "number" ? data.total : data.tracks.length
          );
        } else {
          setTracks([]);
          setTotal(0);
        }
      }
      setLoading(false);
    };
    fetchTracks();
  }, [selectedUsername, page]);

  // Reset to first page if username changes
  useEffect(() => {
    setPage(1);
    setCurrentIndex(0);
  }, [selectedUsername]);

  // Auto-search Apple Music for each track
  useEffect(() => {
    // Only search for the currently displayed track
    const searchAppleMusic = async (track: Track) => {
      const res = await fetch("/api/ai/apple-music-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: track.title,
          artist: track.artist,
          album: track.album,
          isrc: track.isrc || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results) && data.results.length === 0) {
          setAppleResults((prev) => ({ ...prev, [track.track_id]: null }));
        } else {
          setAppleResults((prev) => ({
            ...prev,
            [track.track_id]: data.results && data.results[0],
          }));
        }
      } else {
        setAppleResults((prev) => ({ ...prev, [track.track_id]: null }));
      }
    };
    setAppleResults({});
    if (
      tracks.length > 0 &&
      tracks[currentIndex] &&
      tracks[currentIndex].track_id
    ) {
      searchAppleMusic(tracks[currentIndex]);
    }
  }, [tracks, currentIndex]);

  const handleSaveTrack = async (data: TrackEditFormProps) => {
    // PATCH to update endpoint
    const res = await fetch("/api/tracks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setTracks((prev) =>
        prev.map((t) => (t.track_id === data.track_id ? { ...t, ...data } : t))
      );
      // If last track on page, fetch next page
      if (currentIndex === tracks.length - 1 && tracks.length === pageSize) {
        setPage((p) => p + 1);
        setCurrentIndex(0);
      } else {
        // Move to next track if not last
        setCurrentIndex((i) => (i < tracks.length - 1 ? i + 1 : i));
      }
    } else {
      alert("Failed to update track");
    }
  };

  const UsernameSelect = useUsernameSelect({
    usernames,
    selectedUsername,
    setSelectedUsername,
    size: ["sm", "md", "md"],
    variant: "subtle",
    width: "320px",
  });

  return (
    <>
      <TopMenuBar current="/missing-apple-music" />
      <Container maxW={["8xl", "2xl", "2xl"]}>
        <HStack mb={4} align="flex-end">
          {UsernameSelect}
        </HStack>
        {typeof total === "number" && (
          <Text fontSize="md" color="gray.600" mb={4}>
            {total} track{total === 1 ? "" : "s"} missing a music URL (Apple
            Music, SoundCloud, YouTube)
          </Text>
        )}
        {loading ? (
          <Spinner />
        ) : tracks.length === 0 ? (
          <Text color="gray.500">All tracks have Apple Music URLs!</Text>
        ) : (
          <SingleTrackUI
            tracks={tracks}
            currentIndex={currentIndex}
            appleResults={appleResults}
            overrideTrackId={overrideTrackId}
            overrideQuery={overrideQuery}
            setOverrideTrackId={setOverrideTrackId}
            setOverrideQuery={setOverrideQuery}
            handleSaveTrack={(data) =>
              handleSaveTrack({
                ...data,
                username: data.username ?? selectedUsername ?? "",
              })
            }
            setCurrentIndex={setCurrentIndex}
          />
        )}
      </Container>
    </>
  );
}

// --- SingleTrackUI helper and props type ---
type SingleTrackUIProps = {
  tracks: Track[];
  currentIndex: number;
  appleResults: Record<string, AppleMusicResult | null | undefined>;
  overrideTrackId: string | null;
  overrideQuery: string;
  setOverrideTrackId: (id: string | null) => void;
  setOverrideQuery: (q: string) => void;
  handleSaveTrack: (
    data: Partial<Track> & { track_id: string }
  ) => Promise<void>;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
};

function SingleTrackUI({
  tracks,
  currentIndex,
  appleResults,
  overrideTrackId,
  overrideQuery,
  setOverrideTrackId,
  setOverrideQuery,
  handleSaveTrack,
  setCurrentIndex,
}: SingleTrackUIProps) {
  const track = tracks[currentIndex];
  const [overrideResults, setOverrideResults] = React.useState<
    AppleMusicResult[] | null
  >(null);
  const [saving, setSaving] = React.useState(false);
  // Reset overrideResults when override mode or track changes
  React.useEffect(() => {
    setOverrideResults(null);
  }, [overrideTrackId, currentIndex]);

  if (!track) return null;
  const apple = appleResults[track.track_id];
  const isOverride = overrideTrackId === track.track_id;

  const handleSave = async (url: string) => {
    setSaving(true);
    await handleSaveTrack({ ...track, apple_music_url: url });
    setSaving(false);
  };

  return (
    <Box borderWidth="1px" borderRadius="md" p={3} mb={4} boxShadow="sm">
      <Flex align="center" gap={4} flexDirection={"column"}>
        <TrackResult track={track} allowMinimize={false} />

        <Box minW="180px" textAlign="center">
          {isOverride ? (
            overrideResults === null ? (
              <Text color="gray.500" fontSize="sm">
                Enter a query and search
              </Text>
            ) : overrideResults.length === 0 ? (
              <Text color="red.500" fontSize="sm">
                No match
              </Text>
            ) : (
              <Box>
                <Image
                  src={overrideResults[0].artwork?.replace(
                    "{w}x{h}bb",
                    "200x200bb"
                  )}
                  alt={overrideResults[0].title}
                  boxSize="80px"
                  borderRadius="md"
                  mx="auto"
                  mb={1}
                />
                <Text fontWeight="bold" fontSize="sm">
                  {overrideResults[0].title}
                </Text>
                <Text fontSize="xs">{overrideResults[0].artist}</Text>
                <Text fontSize="xs" color="gray.500">
                  {overrideResults[0].album}
                </Text>
                <Button
                  colorScheme="green"
                  size="xs"
                  mt={1}
                  onClick={() => handleSave(overrideResults[0].url)}
                  loading={saving}
                >
                  Save URL
                </Button>
              </Box>
            )
          ) : apple === undefined ? (
            <Spinner size="sm" />
          ) : apple === null ? (
            <Text color="red.500" fontSize="sm">
              No match
            </Text>
          ) : (
            <Box>
              <Image
                src={apple.artwork?.replace("{w}x{h}bb", "200x200bb")}
                alt={apple.title}
                boxSize="80px"
                borderRadius="md"
                mx="auto"
                mb={1}
              />
              <Text fontWeight="bold" fontSize="sm">
                {apple.title}
              </Text>
              <Text fontSize="xs">{apple.artist}</Text>
              <Text fontSize="xs" color="gray.500">
                {apple.album}
              </Text>
              <Button
                colorScheme="green"
                size="xs"
                mt={1}
                onClick={() => handleSave(apple.url)}
                loading={saving}
              >
                Save URL
              </Button>
            </Box>
          )}
          <Button
            size="xs"
            mt={2}
            variant="outline"
            colorScheme="purple"
            onClick={() => {
              setOverrideTrackId(track.track_id);
              setOverrideQuery(`${track.title} ${track.artist}`);
            }}
          >
            {isOverride ? "Manual Search" : "Override Search"}
          </Button>
        </Box>
      </Flex>
      {isOverride && (
        <Box mt={2} p={2} bg="gray.50" borderRadius="md">
          <HStack>
            <Input
              value={overrideQuery}
              onChange={(e) => setOverrideQuery(e.target.value)}
              placeholder="Search Apple Music..."
              size="sm"
              flex={1}
            />
            <Button
              size="sm"
              colorScheme="blue"
              onClick={async () => {
                // Manual search
                const res = await fetch("/api/ai/apple-music-search", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title: overrideQuery }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setOverrideResults(
                    Array.isArray(data.results)
                      ? data.results
                      : data.results
                      ? [data.results[0]]
                      : []
                  );
                } else {
                  setOverrideResults([]);
                }
              }}
            >
              Search
            </Button>
            <Button
              size="sm"
              colorScheme="gray"
              onClick={() => setOverrideTrackId(null)}
            >
              Cancel
            </Button>
          </HStack>
        </Box>
      )}
      <Flex justify="space-between" mt={4}>
        <Button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          size="sm"
        >
          Previous
        </Button>
        <Text fontSize="sm" color="gray.500">
          Track {currentIndex + 1} of {tracks.length}
        </Text>
        <Button
          onClick={() =>
            setCurrentIndex((i) => Math.min(tracks.length - 1, i + 1))
          }
          disabled={currentIndex === tracks.length - 1}
          size="sm"
        >
          Next
        </Button>
      </Flex>
    </Box>
  );
}
