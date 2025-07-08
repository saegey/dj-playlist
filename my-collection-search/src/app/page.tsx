"use client";

import { useEffect, useState, ChangeEvent, useCallback, useMemo } from "react";
import { MeiliSearch } from "meilisearch";
import {
  Box,
  Flex,
  Input,
  Text,
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
import TrackResult from "@/components/TrackResult";

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

  // Playlist management state
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [editTrack, setEditTrack] = useState<Track | null>(null);
  const { onOpen, onClose } = useDisclosure();

  // Filter state
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeFilterType, setActiveFilterType] = useState<'genre' | 'style' | 'artist' | null>(null);

  // Fetch playlists from backend
  const fetchPlaylists = async () => {
    setLoadingPlaylists(true);
    try {
      const res = await fetch("/api/playlists");
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      }
    } finally {
      setLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  // Create a new playlist
  const handleCreatePlaylist = async () => {
    if (!playlistName.trim() || playlist.length === 0) return;
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: playlistName, tracks: playlist }),
    });
    if (res.ok) {
      setPlaylistName("");
      fetchPlaylists();
    } else {
      alert("Failed to create playlist");
    }
  };

  // Load a playlist (replace current playlist)
  const handleLoadPlaylist = (tracks: any[]) => {
    setPlaylist(tracks);
  };

  // Delete a playlist
  const handleDeletePlaylist = async (id: number) => {
    if (!window.confirm("Delete this playlist?")) return;
    const res = await fetch(`/api/playlists?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchPlaylists();
    } else {
      alert("Failed to delete playlist");
    }
  };

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

  // Memoize MeiliSearch client
  const client = useMemo(() => new MeiliSearch({
    host: "http://127.0.0.1:7700",
    apiKey: "masterKey",
  }), []);

  // Recommend similar tracks based on genre, style, or artist
  const recommendSimilar = useCallback(async (track: Track) => {
    const index = client.index<Track>("tracks");
    const filter = [];
    // if (track.genres && track.genres.length > 0) {
    //   filter.push(`genres = \"${track.genres[0]}\"`);
    // } else 
    if (track.styles && track.styles.length > 0) {
      filter.push(`styles = \"${track.styles[0]}\"`);
    } else if (track.artist) {
      filter.push(`artist = \"${track.artist}\"`);
    }
    // Exclude the current track
    filter.push(`track_id != \"${track.track_id}\"`);
    const res = await index.search("", {
      filter,
      limit: 100,
    });
    setResults(res.hits);
    // setQuery(""); // Clear search box to show recommendations
  }, [client, setResults]);

  // Show recommended tracks on page load (random or trending)
  useEffect(() => {
    if (!query) {
      // Show 10 random tracks as recommendations
      (async () => {
        const index = client.index<Track>("tracks");
        // Use a blank query and a random offset for variety
        const stats = await index.getStats();
        const total = stats.numberOfDocuments || 0;
        const randomOffset = total > 10 ? Math.floor(Math.random() * (total - 10)) : 0;
        const res = await index.search("", { limit: 10, offset: randomOffset });
        setResults(res.hits);
        setEstimatedResults(total);
        setOffset(10);
        setHasMore(total > 10);
      })();
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

  // Show more tracks by the same artist
  const moreFromArtist = useCallback(async (artist: string) => {
    const index = client.index<Track>("tracks");
    const res = await index.search("", {
      filter: [`artist = \"${artist}\"`],
      limit: 20,
    });
    setResults(res.hits);
    setQuery("");
    setActiveFilter(artist);
    setActiveFilterType('artist');
    setOffset(20);
    setHasMore(res.hits.length === 20);
  }, [client]);

  // Show tracks by genre or style
  const filterByTag = useCallback(async (tag: string, type: 'genre' | 'style') => {
    const index = client.index<Track>("tracks");
    const filter = type === 'genre' ? [`genres = \"${tag}\"`] : [`styles = \"${tag}\"`];
    const res = await index.search("", { filter, limit: 20 });
    setResults(res.hits);
    setQuery("");
    setActiveFilter(tag);
    setActiveFilterType(type);
    setOffset(20);
    setHasMore(res.hits.length === 20);
  }, [client]);

  // Clear filter
  const clearFilter = () => {
    setActiveFilter(null);
    setActiveFilterType(null);
    setQuery("");
    setOffset(0);
    setHasMore(false);
    // Show recommendations again
    (async () => {
      const index = client.index<Track>("tracks");
      const stats = await index.getStats();
      const total = stats.numberOfDocuments || 0;
      const randomOffset = total > 10 ? Math.floor(Math.random() * (total - 10)) : 0;
      const res = await index.search("", { limit: 10, offset: randomOffset });
      setResults(res.hits);
      setEstimatedResults(total);
      setOffset(10);
      setHasMore(total > 10);
    })();
  };

  const loadMore = async () => {
    const index = client.index<Track>("tracks");
    let res;
    if (activeFilter && activeFilterType) {
      let filter;
      if (activeFilterType === 'genre') filter = [`genres = \"${activeFilter}\"`];
      else if (activeFilterType === 'style') filter = [`styles = \"${activeFilter}\"`];
      else if (activeFilterType === 'artist') filter = [`artist = \"${activeFilter}\"`];
      res = await index.search("", { filter, limit, offset });
    } else {
      res = await index.search(query, { limit, offset });
    }
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

  // Export playlist as JSON file
  const exportPlaylist = () => {
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

  // Save playlist to backend (update or create)
  const savePlaylist = async () => {
    if (!playlistName.trim() || playlist.length === 0) {
      alert("Please enter a playlist name and add tracks.");
      return;
    }
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: playlistName, tracks: playlist }),
    });
    if (res.ok) {
      fetchPlaylists();
      alert("Playlist saved!");
    } else {
      alert("Failed to save playlist");
    }
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
        {/* Playlist Management Section */}
        <Box width="20%" minWidth="220px" mr={4}>
          <Text fontWeight="bold" mb={2}>
            Manage Playlists
          </Text>
          <Flex mb={2} gap={2}>
            <Input
              size="sm"
              placeholder="New playlist name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
            />
            <Button
              size="sm"
              colorScheme="blue"
              onClick={handleCreatePlaylist}
              isDisabled={!playlistName.trim() || playlist.length === 0}
            >
              Save
            </Button>
          </Flex>
          <Box
            maxHeight="300px"
            overflowY="auto"
            borderWidth="1px"
            borderRadius="md"
            p={2}
            bg="gray.50"
          >
            {loadingPlaylists ? (
              <Text fontSize="sm">Loading...</Text>
            ) : playlists.length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                No saved playlists.
              </Text>
            ) : (
              playlists.map((pl: any) => (
                <Flex key={pl.id} align="center" justify="space-between" mb={1}>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="bold" isTruncated>
                      {pl.name}
                    </Text>
                  </Box>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    // variant="outline"
                    mr={1}
                    onClick={() => handleLoadPlaylist(pl.tracks)}
                  >
                    Load
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="gray"
                    // variant="ghost"
                    onClick={() => handleDeletePlaylist(pl.id)}
                  >
                    Delete
                  </Button>
                </Flex>
              ))
            )}
          </Box>
        </Box>
        <Box width="40%">
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
            {activeFilter && activeFilterType && (
              <>
                <Text as="span" color="purple.600" ml={2}>
                  Filtered by {activeFilterType.charAt(0).toUpperCase() + activeFilterType.slice(1)}: <b>{activeFilter}</b>
                </Text>
                <Button size="xs" ml={2} onClick={clearFilter} colorScheme="gray" variant="outline">
                  Clear Filter
                </Button>
              </>
            )}
          </Text>
          {results.map((track) => (
            <TrackResult
              key={track.track_id}
              track={track}
              allowMinimize={false}
              buttons={
                <>
                  <Button
                    colorScheme="blue"
                    onClick={() => addToPlaylist(track)}
                    size="sm"
                  >
                    Add
                  </Button>
                  <Button
                    colorScheme="gray"
                    onClick={() => handleEditClick(track)}
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    colorScheme="purple"
                    onClick={() => recommendSimilar(track)}
                    size="sm"
                  >
                    More Like This
                  </Button>
                  <Button
                    colorScheme="teal"
                    onClick={() => moreFromArtist(track.artist)}
                    size="sm"
                  >
                    More from Artist
                  </Button>
                </>
              }
              footer={
                <Flex gap={2} mt={1} wrap="wrap">
                  {track.genres && track.genres.map((g) => (
                    <Button
                      key={g}
                      size="xs"
                      colorScheme="pink"
                      variant="outline"
                      onClick={() => filterByTag(g, 'genre')}
                    >
                      {g}
                    </Button>
                  ))}
                  {track.styles && track.styles.map((s) => (
                    <Button
                      key={s}
                      size="xs"
                      colorScheme="orange"
                      variant="outline"
                      onClick={() => filterByTag(s, 'style')}
                    >
                      {s}
                    </Button>
                  ))}
                </Flex>
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
          width="40%"
          overflowY="auto"
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
            <Flex gap={2} alignItems="center">
              <Button
                colorScheme="blue"
                size="sm"
                onClick={savePlaylist}
                isDisabled={playlist.length === 0}
              >
                Save
              </Button>
              <Button
                colorScheme="gray"
                size="sm"
                onClick={exportPlaylist}
                isDisabled={playlist.length === 0}
              >
                Export
              </Button>
            </Flex>
          </Flex>
          {playlist.length === 0 ? (
            <Text color="gray.500">No tracks in playlist yet.</Text>
          ) : (
            playlist.map((track, idx) => (
              <TrackResult
                key={track.track_id}
                track={track}
                minimized
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
        size={"2xl"}
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
