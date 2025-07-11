"use client";

import { MeiliSearch } from "meilisearch";
import {
  Box,
  Flex,
  Input,
  Text,
  Button,
  useDisclosure,
  MenuItem,
  Icon,
} from "@chakra-ui/react";
import { FiArrowDown, FiArrowUp, FiEdit, FiTrash2 } from "react-icons/fi";
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
// --- Playlist Count State ---
import { useState, useCallback, useEffect, useMemo } from "react";
// Use dynamic import for fast-xml-parser in browser only

// --- Apple Music XML Import Types ---
type ImportedTrack = {
  name: string;
  artist: string;
  album: string;
  duration?: number;
};
type MatchedTrack = Track | null;

// (All XML import state and handlers are now inside the SearchPage component below)

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
  youtube_url?: string;
  album_thumbnail?: string;
  local_tags?: string;
  bpm?: string | null;
  key?: string | null;
  danceability?: number | null;
  mood_happy?: number | null;
  mood_sad?: number | null;
  mood_relaxed?: number | null;
  mood_aggressive?: number | null;
  notes?: string;
  local_audio_url?: string;
  star_rating?: number;
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
  // --- Apple Music XML Import Modal State ---
  const [xmlImportModalOpen, setXmlImportModalOpen] = useState(false);
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
  const [activeFilterType, setActiveFilterType] = useState<
    "genre" | "style" | "artist" | null
  >(null);

  // Holds playlist counts for current results
  // Use Record<string, number> for type safety and clarity
  const [playlistCounts, setPlaylistCounts] = useState<Record<string, number>>(
    {}
  );

  // Helper to fetch playlist counts for a list of track IDs
  const fetchPlaylistCounts = useCallback(async (trackIds: string[]) => {
    if (!trackIds || trackIds.length === 0) return;
    try {
      const res = await fetch("/api/tracks/playlist_counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_ids: trackIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylistCounts((prev) => ({ ...prev, ...data }));
      }
    } catch (e) {
      // Ignore errors for now
    }
  }, []);

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
      body: JSON.stringify({
        name: playlistName,
        tracks: playlist.map((t) => t.track_id),
      }),
    });
    if (res.ok) {
      setPlaylistName("");
      fetchPlaylists();
    } else {
      alert("Failed to create playlist");
    }
  };

  // Load a playlist (replace current playlist)
  const handleLoadPlaylist = async (trackIds: Array<string>) => {
    if (!trackIds || trackIds.length === 0) {
      setPlaylist([]);
      return;
    }
    try {
      // Fetch full track objects from backend by IDs
      const res = await fetch("/api/tracks/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_ids: trackIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylist(data);
      } else {
        alert("Failed to load playlist tracks");
      }
    } catch (e) {
      alert("Error loading playlist tracks");
    }
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
      // Refresh search results after update
      const index = client.index<Track>("tracks");
      let refreshed;
      if (query) {
        refreshed = await index.search(query, { limit, offset: 0 });
      } else {
        const stats = await index.getStats();
        const total = stats.numberOfDocuments || 0;
        const randomOffset = total > 10 ? Math.floor(Math.random() * (total - 10)) : 0;
        refreshed = await index.search("", { limit: 10, offset: randomOffset });
      }
      setResults(refreshed.hits);
      setEditTrack(null);
      onClose();
    } else {
      alert("Failed to update track");
    }
  };

  // Memoize MeiliSearch client
  const client = useMemo(
    () =>
      new MeiliSearch({
        host: "http://127.0.0.1:7700",
        apiKey: "masterKey",
      }),
    []
  );

  // Recommend similar tracks based on genre, style, or artist
  const recommendSimilar = useCallback(
    async (track: Track) => {
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
    },
    [client, setResults]
  );

  // Show recommended tracks on page load (random or trending)
  useEffect(() => {
    if (!query) {
      // Show 10 random tracks as recommendations
      (async () => {
        const index = client.index<Track>("tracks");
        // Use a blank query and a random offset for variety
        const stats = await index.getStats();
        const total = stats.numberOfDocuments || 0;
        const randomOffset =
          total > 10 ? Math.floor(Math.random() * (total - 10)) : 0;
        const res = await index.search("", { limit: 10, offset: randomOffset });
        setResults(res.hits);
        setEstimatedResults(total);
        setOffset(10);
        setHasMore(total > 10);
        // Fetch playlist counts for these tracks
        fetchPlaylistCounts(res.hits.map((t) => t.track_id));
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
      // Fetch playlist counts for these tracks
      fetchPlaylistCounts(res.hits.map((t) => t.track_id));
    };
    search();
  }, [query, fetchPlaylistCounts, client]);

  // Show more tracks by the same artist
  // const moreFromArtist = useCallback(async (artist: string) => {
  //   const index = client.index<Track>("tracks");
  //   const res = await index.search("", {
  //     filter: [`artist = \"${artist}\"`],
  //     limit: 20,
  //   });
  //   setResults(res.hits);
  //   setQuery("");
  //   setActiveFilter(artist);
  //   setActiveFilterType('artist');
  //   setOffset(20);
  //   setHasMore(res.hits.length === 20);
  // }, [client]);

  // Show tracks by genre or style
  const filterByTag = useCallback(
    async (tag: string, type: "genre" | "style") => {
      const index = client.index<Track>("tracks");
      const filter =
        type === "genre" ? [`genres = \"${tag}\"`] : [`styles = \"${tag}\"`];
      const res = await index.search("", { filter, limit: 20 });
      setResults(res.hits);
      setQuery("");
      setActiveFilter(tag);
      setActiveFilterType(type);
      setOffset(20);
      setHasMore(res.hits.length === 20);
    },
    [client]
  );

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
      const randomOffset =
        total > 10 ? Math.floor(Math.random() * (total - 10)) : 0;
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
      if (activeFilterType === "genre")
        filter = [`genres = \"${activeFilter}\"`];
      else if (activeFilterType === "style")
        filter = [`styles = \"${activeFilter}\"`];
      else if (activeFilterType === "artist")
        filter = [`artist = \"${activeFilter}\"`];
      res = await index.search("", { filter, limit, offset });
    } else {
      res = await index.search(query, { limit, offset });
    }
    setResults((prev) => {
      // Fetch playlist counts for new tracks only
      const newTracks = res.hits.filter((t) => !(t.track_id in playlistCounts));
      if (newTracks.length > 0)
        fetchPlaylistCounts(newTracks.map((t) => t.track_id));
      return [...prev, ...res.hits];
    });
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
      body: JSON.stringify({
        name: playlistName,
        tracks: playlist.map((t) => t.track_id),
      }),
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

  // --- Apple Music XML Import State ---
  const [xmlImportName, setXmlImportName] = useState("");
  const [xmlImportFile, setXmlImportFile] = useState<File | null>(null);
  const [xmlImportTracks, setXmlImportTracks] = useState<any[]>([]); // Parsed tracks from XML
  const [xmlImportError, setXmlImportError] = useState<string | null>(null);
  const [xmlImportLoading, setXmlImportLoading] = useState(false);
  const [xmlImportStep, setXmlImportStep] = useState<
    "idle" | "parsed" | "review"
  >("idle");
  const [xmlMatchedTracks, setXmlMatchedTracks] = useState<MatchedTrack[]>([]);

  // Handle XML file selection
  const handleXmlFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setXmlImportFile(e.target.files[0]);
      setXmlImportError(null);
    }
  };

  // Parse Apple Music XML in browser and extract tracks
const handleParseXml = async () => {
  if (!xmlImportFile) return;
  setXmlImportLoading(true);
  setXmlImportError(null);

  try {
    // 1) load & parse with the plist package
    const plist = await import("plist");
    const text = await xmlImportFile.text();
    const parsed: any = plist.parse(text);

    // sanity checks
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.Tracks ||
      !parsed.Playlists ||
      !Array.isArray(parsed.Playlists)
    ) {
      throw new Error("Could not locate Tracks or Playlists in your XML");
    }

    // 2) flatten your Tracks into a map: trackId → entry
    type AppleTrack = Record<string, any> & {
      Name?: string;
      Artist?: string;
      Album?: string;
      "Total Time"?: number;
    };
    const tracksObj: Record<string, AppleTrack> = parsed.Tracks;
    const trackMap = new Map<string, AppleTrack>();
    for (const [id, entry] of Object.entries(tracksObj)) {
      trackMap.set(id, entry);
    }

    // 3) pick your playlist (e.g. first one; or find by name: .find(pl => pl.Name === someName))
    const rawPlaylists = parsed.Playlists as any[];
    const playlist = rawPlaylists[0]; 
    if (
      !playlist ||
      typeof playlist !== "object" ||
      !Array.isArray(playlist["Playlist Items"])
    ) {
      throw new Error("No Playlist Items found in the chosen playlist");
    }

    // 4) iterate in exact XML order, build ImportedTrack[]
    type ImportedTrack = {
      name: string;
      artist: string;
      album: string;
      duration?: number;
    };
    const imported: ImportedTrack[] = [];

    for (const item of playlist["Playlist Items"]) {
      // each item is a { "Track ID": number }
      const rawId = item["Track ID"];
      const id = String(rawId);

      const entry = trackMap.get(id);
      if (!entry) {
        console.warn(`Track ID ${id} not in Tracks section`);
        continue;
      }

      imported.push({
        name:   entry.Name || "",
        artist: entry.Artist || "",
        album:  entry.Album || "",
        duration: typeof entry["Total Time"] === "number"
          ? Math.round(entry["Total Time"] / 1000)
          : undefined,
      });
    }

    // 5) hand it off to state
    setXmlImportTracks(imported);
    setXmlImportStep("parsed");

  } catch (err: any) {
    console.error(err);
    setXmlImportError(err.message || "Failed to parse XML");
    setXmlImportTracks([]);
    setXmlImportStep("idle");
  } finally {
    setXmlImportLoading(false);
  }
};
  // Match imported tracks to DB (MeiliSearch)
  const matchImportedTracks = async () => {
    setXmlImportLoading(true);
    try {
      const index = client.index<Track>("tracks");
      const matches: MatchedTrack[] = [];
      for (const t of xmlImportTracks) {
        const q = `${t.name} ${t.artist}`;
        let res = await index.search(q, { limit: 1 });
        if (!res.hits.length && t.name) {
          res = await index.search(t.name, { limit: 1 });
        }
        matches.push(res.hits[0] || null);
      }
      setXmlMatchedTracks(matches);
      setXmlImportStep("review");
    } catch (err: any) {
      setXmlImportError("Error matching tracks: " + err.message);
      setXmlImportStep("parsed");
    } finally {
      setXmlImportLoading(false);
    }
  };

  // Allow user to manually search for a match for a given imported track
  const handleManualMatch = async (idx: number, searchTerm: string) => {
    setXmlImportLoading(true);
    try {
      const index = client.index<Track>("tracks");
      const res = await index.search(searchTerm, { limit: 5 });
      if (res.hits.length > 0) {
        setXmlMatchedTracks((prev) => {
          const updated = [...prev];
          updated[idx] = res.hits[0];
          return updated;
        });
      }
    } catch (err: any) {
      setXmlImportError("Manual match error: " + err.message);
    } finally {
      setXmlImportLoading(false);
    }
  };

  // Save imported playlist with matched tracks
  const handleSaveImportedPlaylist = async () => {
    if (!xmlImportName.trim() || xmlMatchedTracks.length === 0) {
      alert("Please enter a playlist name and match all tracks.");
      return;
    }
    const trackIds = xmlMatchedTracks.filter(Boolean).map((t) => t!.track_id);
    if (trackIds.length === 0) {
      alert("No matched tracks to save.");
      return;
    }
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: xmlImportName,
        tracks: trackIds,
      }),
    });
    if (res.ok) {
      alert("Imported playlist saved!");
      setXmlImportStep("idle");
      setXmlImportTracks([]);
      setXmlMatchedTracks([]);
      setXmlImportName("");
      setXmlImportFile(null);
      fetchPlaylists();
    } else {
      alert("Failed to save imported playlist");
    }
  };

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
                    mr={1}
                    onClick={() => handleLoadPlaylist(pl.tracks)}
                  >
                    Load
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="gray"
                    onClick={() => handleDeletePlaylist(pl.id)}
                  >
                    Delete
                  </Button>
                </Flex>
              ))
            )}
          </Box>

          {/* --- Apple Music XML Import UI --- */}
          {/** Apple Music XML Import UI is now inside SearchPage and uses component state/handlers **/}
          <Button
            mt={6}
            colorScheme="purple"
            size="sm"
            width="100%"
            onClick={() => {
              setXmlImportModalOpen(true);
              setXmlImportStep("idle");
              setXmlImportName("");
              setXmlImportFile(null);
              setXmlImportTracks([]);
              setXmlMatchedTracks([]);
              setXmlImportError(null);
            }}
          >
            Import Apple Music XML
          </Button>

          {/* --- Apple Music XML Import Modal --- */}
          <Modal
            isOpen={
              xmlImportModalOpen ||
              xmlImportStep === "parsed" ||
              xmlImportStep === "review"
            }
            onClose={() => {
              setXmlImportModalOpen(false);
              setXmlImportStep("idle");
              setXmlImportName("");
              setXmlImportFile(null);
              setXmlImportTracks([]);
              setXmlMatchedTracks([]);
              setXmlImportError(null);
            }}
            size="3xl"
          >
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Import Apple Music XML Playlist</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {/* Step 1: Upload XML and enter playlist name */}
                {xmlImportStep === "idle" && (
                  <Box>
                    <Input
                      type="file"
                      accept=".xml"
                      size="sm"
                      onChange={handleXmlFileChange}
                      mb={2}
                    />
                    <Input
                      size="sm"
                      placeholder="Imported playlist name"
                      value={xmlImportName}
                      onChange={(e) => setXmlImportName(e.target.value)}
                      mb={2}
                    />
                    <Button
                      size="sm"
                      colorScheme="purple"
                      onClick={handleParseXml}
                      isDisabled={
                        !xmlImportFile || !xmlImportName || xmlImportLoading
                      }
                      mb={2}
                    >
                      Parse Tracks
                    </Button>
                    {xmlImportLoading && (
                      <Text fontSize="xs">Parsing XML...</Text>
                    )}
                    {xmlImportError && (
                      <Text color="red.500" fontSize="xs">
                        {xmlImportError}
                      </Text>
                    )}
                  </Box>
                )}
                {/* Step 2: Parsed, show preview and match button */}
                {xmlImportStep === "parsed" && (
                  <Box>
                    <Text fontSize="xs" color="gray.600" mb={1}>
                      Parsed {xmlImportTracks.length} tracks from XML.
                    </Text>
                    <Box
                      maxHeight="300px"
                      overflowY="auto"
                      borderWidth="1px"
                      borderRadius="md"
                      p={2}
                      bg="white"
                      mb={2}
                    >
                      {xmlImportTracks.length === 0 ? (
                        <Text fontSize="xs" color="gray.400">
                          No tracks parsed.
                        </Text>
                      ) : (
                        xmlImportTracks.map((t, i) => (
                          <Flex
                            key={i}
                            fontSize="xs"
                            borderBottom="1px solid #eee"
                            py={1}
                            align="center"
                            gap={2}
                          >
                            <Box flex={2}>
                              <b>{t.name}</b>
                            </Box>
                            <Box flex={2} color="#888">
                              {t.artist}
                            </Box>
                            <Box flex={2} color="#888">
                              {t.album}
                            </Box>
                            {typeof t.duration === "number" && (
                              <Box flex={1} color="#888">
                                {t.duration}s
                              </Box>
                            )}
                          </Flex>
                        ))
                      )}
                    </Box>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={matchImportedTracks}
                      isLoading={xmlImportLoading}
                      mt={2}
                    >
                      Match Tracks
                    </Button>
                    {/* <Button
                      size="sm"
                      ml={2}
                      mt={2}
                      onClick={() => setXmlImportModalOpen(false)}
                    >
                      Cancel
                    </Button> */}
                    {xmlImportError && (
                      <Text color="red.500" fontSize="xs">
                        {xmlImportError}
                      </Text>
                    )}
                  </Box>
                )}
                {/* Step 3: Review and confirm matches */}
                {xmlImportStep === "review" && (
                  <Box>
                    <Text mb={2} fontSize="sm">
                      Review and confirm matched tracks. You can search for a
                      better match if needed.
                    </Text>
                    <Box
                      maxHeight="400px"
                      overflowY="auto"
                      borderWidth="1px"
                      borderRadius="md"
                      p={2}
                      bg="white"
                    >
                      {xmlImportTracks.map((imp, idx) => (
                        <Flex
                          key={idx}
                          align="center"
                          borderBottom="1px solid #eee"
                          py={1}
                          gap={2}
                        >
                          <Box flex={2} fontSize="xs">
                            <b>{imp.name}</b>{" "}
                            <span style={{ color: "#888" }}>
                              by {imp.artist}
                            </span>
                            <br />
                            <span style={{ color: "#888" }}>{imp.album}</span>
                          </Box>
                          <Box flex={3} fontSize="xs">
                            {xmlMatchedTracks[idx] ? (
                              <span>
                                <b>{xmlMatchedTracks[idx]?.title}</b>{" "}
                                <span style={{ color: "#3182ce" }}>
                                  by {xmlMatchedTracks[idx]?.artist}
                                </span>
                                <br />
                                <span style={{ color: "#888" }}>
                                  {xmlMatchedTracks[idx]?.album}
                                </span>
                                <Button
                                  size="xs"
                                  ml={2}
                                  colorScheme="red"
                                  variant="outline"
                                  onClick={() => {
                                    setXmlMatchedTracks((prev) => {
                                      const updated = [...prev];
                                      updated[idx] = null;
                                      return updated;
                                    });
                                  }}
                                >
                                  Clear Match
                                </Button>
                              </span>
                            ) : (
                              <span style={{ color: "red" }}>No match</span>
                            )}
                          </Box>
                          <Box flex={2}>
                            <Input
                              size="xs"
                              placeholder="Search manually..."
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleManualMatch(
                                    idx,
                                    (e.target as HTMLInputElement).value
                                  );
                                }
                              }}
                            />
                          </Box>
                        </Flex>
                      ))}
                    </Box>
                    <Button
                      colorScheme="blue"
                      size="sm"
                      mt={2}
                      onClick={handleSaveImportedPlaylist}
                      isLoading={xmlImportLoading}
                    >
                      Save Playlist
                    </Button>
                    <Button
                      size="sm"
                      ml={2}
                      mt={2}
                      onClick={() => setXmlImportModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    {xmlImportError && (
                      <Text color="red.500" fontSize="xs">
                        {xmlImportError}
                      </Text>
                    )}
                  </Box>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>
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
                  Filtered by{" "}
                  {activeFilterType.charAt(0).toUpperCase() +
                    activeFilterType.slice(1)}
                  : <b>{activeFilter}</b>
                </Text>
                <Button
                  size="xs"
                  ml={2}
                  onClick={clearFilter}
                  colorScheme="gray"
                  variant="outline"
                >
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
              playlistCount={playlistCounts[track.track_id]}
              buttons={[
                <MenuItem
                  key="add"
                  onClick={() => addToPlaylist(track)}
                  color="#3182ce"
                >
                  Add to Playlist
                </MenuItem>,
                <MenuItem
                  key="edit"
                  onClick={() => handleEditClick(track)}
                  color="#4A5568"
                >
                  Edit Track
                </MenuItem>,
              ]}
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
              <Button
                colorScheme="red"
                size="sm"
                onClick={() => setPlaylist([])}
                isDisabled={playlist.length === 0}
              >
                Clear
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
                playlistCount={playlistCounts[track.track_id]}
                // buttons={
                //   <Flex alignItems="center" gap={1}>
                //     <Button
                //       onClick={() => moveTrack(idx, idx - 1)}
                //       disabled={idx === 0}
                //       size="xs"
                //       variant="ghost"
                //     >
                //       ↑
                //     </Button>
                //     <Button
                //       onClick={() => moveTrack(idx, idx + 1)}
                //       disabled={idx === playlist.length - 1}
                //       size="xs"
                //       variant="ghost"
                //     >
                //       ↓
                //     </Button>

                //   </Flex>
                // }
                buttons={[
                  <MenuItem
                    key="up"
                    onClick={() => moveTrack(idx, idx - 1)}
                    disabled={idx === 0}
                    icon={<Icon as={FiArrowUp} color="#3182ce" boxSize={4} />}
                    color="#3182ce"
                  >
                    Move Up
                  </MenuItem>,
                  <MenuItem
                    key="down"
                    onClick={() => moveTrack(idx, idx + 1)}
                    disabled={idx === playlist.length - 1}
                    icon={<Icon as={FiArrowDown} color="#4A5568" boxSize={4} />}
                    color="#4A5568"
                  >
                    Move Down
                  </MenuItem>,
                  <MenuItem
                    key="edit"
                    onClick={() => setEditTrack(track)}
                    icon={<Icon as={FiEdit} color="black" boxSize={4} />}
                    color="black"
                  >
                    Edit
                  </MenuItem>,
                  <MenuItem
                    key="remove"
                    onClick={() => removeFromPlaylist(track.track_id)}
                    icon={<Icon as={FiTrash2} color="red.500" boxSize={4} />}
                    color="red.500"
                  >
                    Remove
                  </MenuItem>,
                ]}
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
