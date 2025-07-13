"use client";

import { Track } from "@/types/track";
import {
  Box,
  Button,
  Input,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Flex,
} from "@chakra-ui/react";
import { MeiliSearch } from "meilisearch";
import { useState } from "react";

type ImportedTrack = {
  name: string;
  artist: string;
  album: string;
  duration?: number;
};
type MatchedTrack = Track | null;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client: MeiliSearch;
  fetchPlaylists: () => void;
}

export default function AppleMusicXmlImport({
  isOpen,
  onClose,
  client,
  fetchPlaylists,
}: Props) {
  const [xmlImportName, setXmlImportName] = useState("");
  const [xmlImportFile, setXmlImportFile] = useState<File | null>(null);
  const [xmlImportTracks, setXmlImportTracks] = useState<ImportedTrack[]>([]);
  const [xmlImportError, setXmlImportError] = useState<string | null>(null);
  const [xmlImportLoading, setXmlImportLoading] = useState(false);
  const [xmlImportStep, setXmlImportStep] = useState<
    "idle" | "parsed" | "review"
  >("idle");
  const [xmlMatchedTracks, setXmlMatchedTracks] = useState<MatchedTrack[]>([]);

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
      const plist = await import("plist");
      const text = await xmlImportFile.text();
      const parsed: any = plist.parse(text);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        !parsed.Tracks ||
        !parsed.Playlists ||
        !Array.isArray(parsed.Playlists)
      ) {
        throw new Error("Could not locate Tracks or Playlists in your XML");
      }

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

      const rawPlaylists = parsed.Playlists as any[];
      const playlist = rawPlaylists[0];
      if (
        !playlist ||
        typeof playlist !== "object" ||
        !Array.isArray(playlist["Playlist Items"])
      ) {
        throw new Error("No Playlist Items found in the chosen playlist");
      }

      const imported: ImportedTrack[] = [];
      for (const item of playlist["Playlist Items"]) {
        const rawId = item["Track ID"];
        const id = String(rawId);
        const entry = trackMap.get(id);
        if (!entry) continue;
        imported.push({
          name: entry.Name || "",
          artist: entry.Artist || "",
          album: entry.Album || "",
          duration:
            typeof entry["Total Time"] === "number"
              ? Math.round(entry["Total Time"] / 1000)
              : undefined,
        });
      }
      setXmlImportTracks(imported);
      setXmlImportStep("parsed");
    } catch (err: any) {
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
      onClose();
    } else {
      alert("Failed to save imported playlist");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Import Apple Music XML Playlist</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
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
              {xmlImportLoading && <Text fontSize="xs">Parsing XML...</Text>}
              {xmlImportError && (
                <Text color="red.500" fontSize="xs">
                  {xmlImportError}
                </Text>
              )}
            </Box>
          )}
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
              {xmlImportError && (
                <Text color="red.500" fontSize="xs">
                  {xmlImportError}
                </Text>
              )}
            </Box>
          )}
          {xmlImportStep === "review" && (
            <Box>
              <Text mb={2} fontSize="sm">
                Review and confirm matched tracks. You can search for a better
                match if needed.
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
                      <span style={{ color: "#888" }}>by {imp.artist}</span>
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
              <Button size="sm" ml={2} mt={2} onClick={onClose}>
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
  );
}
