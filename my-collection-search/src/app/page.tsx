"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { MeiliSearch } from "meilisearch";
import {
  Box,
  Flex,
  Input,
  Link,
  Text,
  Image,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/modal";
import dynamic from "next/dynamic";

const TrackEditForm = dynamic(() => import("../components/TrackEditForm"), {
  ssr: false,
});

export type Track = {
  track_id: string;
  title: string;
  artist: string;
  album: string;
  year: string | number;
  styles?: string[];
  genres?: string[];
  duration: string;
  duration_seconds?: number;
  position: number;
  discogs_url: string;
  apple_music_url: string;
  album_thumbnail?: string;
  local_tags?: string;
  bpm?: string | null;
  key?: string | null;
  notes?: string;
};

type TrackResultProps = {
  track: Track;
  buttons?: React.ReactNode;
};

function parseDurationToSeconds(duration: string): number {
  if (!duration) return 0;
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
}

function TrackResult({ track, buttons }: TrackResultProps) {
  return (
    <Box borderWidth="1px" borderRadius="md" p={3} mb={2}>
      <Flex alignItems="center" gap={3} width="100%" minHeight="180px">
        <Image
          src={track.album_thumbnail}
          alt={track.title}
          boxSize="50px"
          objectFit="cover"
          borderRadius="md"
        />
        <Flex direction="column" flex={1}>
          <Box>
            <Text as="strong">{track.title}</Text> — {track.artist}
          </Box>
          <Text fontSize="sm">
            {track.album} ({track.year})
          </Text>
          <Text fontSize="sm">Track ID: {track.track_id}</Text>
          <Text fontSize="sm">Position: {track.position}</Text>
          <Text fontSize="sm">
            Duration:{" "}
            {track.duration
              ? track.duration
              : typeof track.duration_seconds === "number"
              ? formatSeconds(track.duration_seconds)
              : ""}
          </Text>
          <Text fontSize="sm">Styles: {track.styles?.join(", ")}</Text>
          <Text fontSize="sm">Genres: {track.genres?.join(", ")}</Text>
          <Text fontSize="sm">Local Tags: {track.local_tags}</Text>
          <Text fontSize="sm">BPM: {track.bpm}</Text>
          <Text fontSize="sm">Key: {track.key}</Text>
          <Text fontSize="sm">Notes: {track.notes}</Text>
          <Flex alignItems="center" gap={2} mt={1}>
            <Link
              href={track.discogs_url}
              color="blue.500"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discogs
            </Link>
            {track.apple_music_url && (
              <Link
                href={track.apple_music_url}
                color="blue.500"
                target="_blank"
                rel="noopener noreferrer"
              >
                Apple Music
              </Link>
            )}
          </Flex>
          <br />
          <Flex alignItems="flex-end" flexShrink={0} gap={2}>
            {buttons}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Track[]>([]);
  const [playlist, setPlaylist] = useState<Track[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("playlist");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const limit = 20;
  const [estimatedResults, setEstimatedResults] = useState<number>(0);
  
  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const { onOpen, onClose } = useDisclosure();

  const handleEditClick = (track: Track) => {
    setEditTrack(track);
    onOpen();
  };

  const handleSaveTrack = async (data: any) => {
    const res = await fetch("/api/tracks/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setResults((prev) =>
        prev.map((t) => (t.track_id === data.track_id ? { ...t, ...data } : t))
      );
      setEditTrack(null);
      onClose();
    } else {
      alert("Failed to update track");
    }
  };

  const client = new MeiliSearch({
    host: "http://127.0.0.1:7700",
    apiKey: "masterKey",
  });

  useEffect(() => {
    if (!query) {
      setResults([]);
      setOffset(0);
      setHasMore(false);
      return;
    }
    const search = async () => {
      const index = client.index<Track>("tracks");
      const res = await index.search(query, { limit, offset: 0 });
      setResults(res.hits);
      setOffset(limit);
      setHasMore(res.hits.length === limit);
      setEstimatedResults(res.estimatedTotalHits || 0);
    };
    search();
  }, [query]);

  const loadMore = async () => {
    const index = client.index<Track>("tracks");
    const res = await index.search(query, { limit, offset });
    setResults((prev) => [...prev, ...res.hits]);
    setOffset(offset + limit);
    setHasMore(res.hits.length === limit);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("playlist", JSON.stringify(playlist));
    }
  }, [playlist]);

  const addToPlaylist = (track: Track) => {
    if (!playlist.some((t) => t.track_id === track.track_id)) {
      setPlaylist((prev) => [...prev, track]);
    }
  };

  const removeFromPlaylist = (trackId: string) => {
    setPlaylist((prev) => prev.filter((t) => t.track_id !== trackId));
  };

  const savePlaylist = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(playlist, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "playlist.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const moveTrack = (fromIdx: number, toIdx: number) => {
    setPlaylist((prev) => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const updated = [...prev];
      const [removed] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, removed);
      return updated;
    });
  };

  const totalPlaytimeSeconds = playlist.reduce((sum, track) => {
    if (!track.duration) {
      return (
        sum +
        (typeof track.duration_seconds === "number"
          ? track.duration_seconds
          : 0)
      );
    }
    return sum + parseDurationToSeconds(track.duration);
  }, 0);

  const totalPlaytimeFormatted = formatSeconds(totalPlaytimeSeconds);

  return (
    <>
      <Flex p={4} gap={4} direction="row">
        <Box width="50%">
          <Input
            type="text"
            placeholder="Search tracks..."
            value={query}
            onChange={handleInputChange}
            width="100%"
            mb={3}
          />
          <Text fontSize="sm" color="gray.500" mb={2}>
            {estimatedResults.toLocaleString()} results found
          </Text>
          {results.map((track) => (
            <TrackResult
              key={track.track_id}
              track={track}
              buttons={
                <>
                  <Button
                    colorScheme="green"
                    onClick={() => addToPlaylist(track)}
                    size="sm"
                    variant="ghost"
                  >
                    + Add
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={() => handleEditClick(track)}
                    size="sm"
                    variant="ghost"
                  >
                    Edit
                  </Button>
                </>
              }
            />
          ))}

          {hasMore && (
            <Box textAlign="center" mt={4}>
              <Button onClick={loadMore}>Load More</Button>
            </Box>
          )}
        </Box>
        <Box
          borderWidth="2px"
          borderRadius="lg"
          p={4}
          width="50%"
          // maxHeight="80vh"
          overflowY="auto"
          // position="sticky"
          // top="24px"
        >
          <Flex alignItems="center" justifyContent="space-between" mb={3}>
            <Box>
              <Text fontSize="xl" fontWeight="bold">
                Playlist ({playlist.length})
              </Text>
              <Text fontSize="sm" color="gray.500">
                Total Playtime: {totalPlaytimeFormatted}
              </Text>
            </Box>
            <Link
              as="button"
              color="blue.600"
              fontWeight="bold"
              onClick={playlist.length === 0 ? undefined : savePlaylist}
              aria-disabled={playlist.length === 0}
              style={
                playlist.length === 0
                  ? { pointerEvents: "none", opacity: 0.5 }
                  : {}
              }
            >
              Save
            </Link>
          </Flex>
          {playlist.length === 0 ? (
            <Text color="gray.500">No tracks in playlist yet.</Text>
          ) : (
            playlist.map((track, idx) => (
              <TrackResult
                key={track.track_id}
                track={track}
                buttons={
                  <Flex alignItems="center" gap={1}>
                    <Button
                      onClick={() => moveTrack(idx, idx - 1)}
                      disabled={idx === 0}
                      size="xs"
                      variant="ghost"
                    >
                      ↑
                    </Button>
                    <Button
                      onClick={() => moveTrack(idx, idx + 1)}
                      disabled={idx === playlist.length - 1}
                      size="xs"
                      variant="ghost"
                    >
                      ↓
                    </Button>
                    <Button
                      colorScheme="red"
                      onClick={() => removeFromPlaylist(track.track_id)}
                      ml={2}
                      size="sm"
                      variant="ghost"
                    >
                      Remove
                    </Button>
                  </Flex>
                }
              />
            ))
          )}
        </Box>
      </Flex>
      <Modal
        isOpen={!!editTrack}
        onClose={() => {
          setEditTrack(null);
          onClose();
        }}
      >
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg="white">
          <ModalHeader>Edit Track</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editTrack && (
              <TrackEditForm track={editTrack} onSave={handleSaveTrack} />
            )}
          </ModalBody>
          {/* <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant='ghost'>Secondary Action</Button>
          </ModalFooter> */}
        </ModalContent>
      </Modal>
    </>
  );
}
