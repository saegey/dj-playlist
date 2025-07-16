"use client";

import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  Flex,
  Dialog,
  Portal,
  FileUpload,
  Stack,
  CloseButton,
} from "@chakra-ui/react";
import { MeiliSearch } from "meilisearch";
import { toaster } from "@/components/ui/toaster"; // your v3-style toaster
import { Track } from "@/types/track";
import { FiUpload } from "react-icons/fi";

type PlaylistItem = { "Track ID": number };
type TrackEntry = {
  Name?: string;
  Artist?: string;
  Album?: string;
  "Total Time"?: number;
};

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
  const [step, setStep] = useState<"idle" | "parsed" | "review">("idle");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tracks, setTracks] = useState<ImportedTrack[]>([]);
  const [matched, setMatched] = useState<MatchedTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialRef = useRef<HTMLInputElement>(null);

  const notify = (opts: { title: string; type: "success" | "error" }) =>
    toaster.create({ title: opts.title, type: opts.type });

  const parseXml = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const plist = await import("plist");
      const text = await file.text();
      const parsed = plist.parse(text) as {
        Tracks?: Record<string, unknown>;
        Playlists?: Array<Record<string, unknown>>;
      };

      if (!parsed?.Tracks || !Array.isArray(parsed?.Playlists)) {
        throw new Error("Tracks or Playlists not found in XML");
      }

      const trackMap = new Map(Object.entries(parsed.Tracks));
      const playlist = parsed.Playlists[0];
      if (!Array.isArray(playlist["Playlist Items"])) {
        throw new Error("Playlist items missing");
      }

      const imp: ImportedTrack[] = (
        playlist["Playlist Items"] as PlaylistItem[]
      )
        .map((item) => {
          const e = trackMap.get(String(item["Track ID"])) as
            | TrackEntry
            | undefined;
          return {
            name: e?.Name || "",
            artist: e?.Artist || "",
            album: e?.Album || "",
            duration:
              typeof e?.["Total Time"] === "number"
                ? Math.round(e["Total Time"]! / 1000)
                : undefined,
          };
        })
        .filter((t) => t.name);

      setTracks(imp);
      setStep("parsed");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const matchTracks = async () => {
    setLoading(true);
    const res: MatchedTrack[] = [];
    try {
      const index = client.index<Track>("tracks");
      for (const t of tracks) {
        let r = await index.search(`${t.name} ${t.artist}`, { limit: 1 });
        if (!r.hits.length) r = await index.search(t.name, { limit: 1 });
        res.push(r.hits[0] || null);
      }
      setMatched(res);
      setStep("review");
    } catch (err: unknown) {
      setError(
        "Match failed: " +
          (err instanceof Error ? err.message : "An unknown error occurred")
      );
      setStep("parsed");
    } finally {
      setLoading(false);
    }
  };

  const savePlaylist = async () => {
    if (!name.trim() || !matched.length) {
      notify({ title: "Enter name and match tracks", type: "error" });
      return;
    }
    const ids = matched.filter(Boolean).map((t) => t!.track_id);
    if (!ids.length) {
      notify({ title: "No matched tracks", type: "error" });
      return;
    }
    const resp = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, tracks: ids }),
    });
    if (resp.ok) {
      notify({ title: "Playlist saved!", type: "success" });
      setStep("idle");
      setTracks([]);
      setMatched([]);
      setName("");
      setFile(null);
      fetchPlaylists();
      onClose();
    } else {
      notify({ title: "Save failed", type: "error" });
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => (open ? null : onClose())}
      initialFocusEl={() => initialRef.current}
      role="dialog"
      size="lg"
      motionPreset="slide-in-bottom"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {step === "idle" && "Import Apple Music XML"}
                {step === "parsed" && "Parsed Tracks"}
                {step === "review" && "Review Matches"}
              </Dialog.Title>

              <Dialog.CloseTrigger asChild>
                <CloseButton
                  // ref={cancelRef}
                  size="sm"
                  onClick={() => onClose()}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              {/* idle */}
              {step === "idle" && (
                <Stack>
                  {/* <Input
                    ref={initialRef}
                    type="file"
                    accept=".xml"
                    mb={2}
                    size="sm"
                    onChange={e => { setFile(e.target.files?.[0] || null); }}
                  /> */}

                  <FileUpload.Root
                    accept={[".xml", "text/xml"]}
                    onFileChange={(files) => {
                      // Chakra UI v3 FileUpload: files.acceptedFiles is the correct property
                      const file = files.acceptedFiles?.[0] || null;
                      setFile(file);
                    }}
                  >
                    <FileUpload.HiddenInput />
                    <FileUpload.Trigger asChild>
                      <Button variant="outline" size="sm">
                        <FiUpload /> Upload file
                      </Button>
                    </FileUpload.Trigger>
                    <FileUpload.List />
                  </FileUpload.Root>
                  <Box>
                    <label htmlFor="playlist-name-input">
                      <Text
                        as="span"
                        fontSize="sm"
                        fontWeight="medium"
                        mb={1}
                        display="block"
                      >
                        Playlist name
                      </Text>
                    </label>
                    <Input
                      id="playlist-name-input"
                      size="sm"
                      placeholder="Playlist name"
                      mb={2}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Box>
                  <Box>
                    <Button
                      size="sm"
                      colorPalette="blue"
                      onClick={parseXml}
                      disabled={!file || !name.trim() || loading}
                      loading={loading}
                    >
                      Parse Tracks
                    </Button>
                  </Box>
                  {loading && <Text fontSize="xs">Parsing…</Text>}
                  {error && (
                    <Text color="red.500" fontSize="xs">
                      {error}
                    </Text>
                  )}
                </Stack>
              )}
              {/* parsed */}
              {step === "parsed" && (
                <Box>
                  <Text fontSize="xs" color="gray.600">
                    Parsed {tracks.length} tracks
                  </Text>
                  <Box
                    maxH="300px"
                    overflowY="auto"
                    bg="white"
                    p={2}
                    borderWidth="1px"
                    borderRadius="md"
                    mb={2}
                  >
                    {tracks.map((t, i) => (
                      <Flex
                        key={i}
                        fontSize="xs"
                        py={1}
                        borderBottom="1px solid #eee"
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
                        {t.duration != null && (
                          <Box flex={1} color="#888">
                            {t.duration}s
                          </Box>
                        )}
                      </Flex>
                    ))}
                  </Box>
                  <Button
                    size="sm"
                    colorPalette="blue"
                    onClick={matchTracks}
                    loading={loading}
                  >
                    Match Tracks
                  </Button>
                  {error && (
                    <Text color="red.500" fontSize="xs">
                      {error}
                    </Text>
                  )}
                </Box>
              )}
              {/* review */}
              {step === "review" && (
                <Box>
                  <Text fontSize="sm" mb={2}>
                    Review and adjust matches
                  </Text>
                  <Box
                    maxH="400px"
                    overflowY="auto"
                    bg="white"
                    p={2}
                    borderWidth="1px"
                    borderRadius="md"
                  >
                    {tracks.map((imp, idx) => (
                      <Flex
                        key={idx}
                        align="center"
                        py={1}
                        borderBottom="1px solid #eee"
                        gap={2}
                      >
                        <Box flex={2} fontSize="xs">
                          <b>{imp.name}</b>
                          <br />
                          <Text as="span" color="#888">
                            by {imp.artist}
                          </Text>
                          <br />
                          <Text as="span" color="#888">
                            {imp.album}
                          </Text>
                        </Box>
                        <Box flex={3} fontSize="xs">
                          {matched[idx] ? (
                            <Box>
                              <b>{matched[idx]!.title}</b> by{" "}
                              {matched[idx]!.artist}
                              <br />
                              <Text as="span" color="#888">
                                {matched[idx]!.album}
                              </Text>
                              <Button
                                size="xs"
                                ml={2}
                                colorPalette="red"
                                variant="outline"
                                onClick={() => {
                                  setMatched((prev) =>
                                    prev.map((m, i) => (i === idx ? null : m))
                                  );
                                }}
                              >
                                Clear
                              </Button>
                            </Box>
                          ) : (
                            <Text color="red">No match</Text>
                          )}
                        </Box>
                        <Box flex={2}>
                          <Input
                            size="xs"
                            placeholder="Search..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const q = (e.target as HTMLInputElement).value;
                                setLoading(true);
                                client
                                  .index<Track>("tracks")
                                  .search(q, { limit: 1 })
                                  .then((r) => {
                                    setMatched((prev) =>
                                      prev.map((m, i) =>
                                        i === idx ? r.hits[0] || null : m
                                      )
                                    );
                                  })
                                  .catch((err) =>
                                    setError("Search error: " + err.message)
                                  )
                                  .finally(() => setLoading(false));
                              }
                            }}
                          />
                        </Box>
                      </Flex>
                    ))}
                  </Box>
                </Box>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button size="sm" colorPalette="gray" onClick={onClose}>
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              {step === "idle" && null}
              {step === "parsed" && (
                <Button
                  ml={2}
                  size="sm"
                  colorPalette="blue"
                  onClick={matchTracks}
                >
                  Match Tracks
                </Button>
              )}
              {step === "review" && (
                <Button
                  ml={2}
                  size="sm"
                  colorPalette="purple"
                  onClick={savePlaylist}
                  loading={loading}
                >
                  Save Playlist
                </Button>
              )}
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
