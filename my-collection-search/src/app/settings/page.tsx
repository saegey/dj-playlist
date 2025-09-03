"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  Alert,
  VStack,
  Code,
  Input,
  Collapsible,
  SimpleGrid,
  CloseButton,
  Dialog,
  Portal,
} from "@chakra-ui/react";

import { toaster, Toaster } from "@/components/ui/toaster";
import TopMenuBar from "@/components/MenuBar";
import { FiBriefcase, FiDatabase } from "react-icons/fi";
import FriendsDiscogsSection from "@/components/FriendsDiscogsSection";
import DatabaseBackups from "@/components/DatabaseBackups";
import DatabaseRestore from "@/components/DatabaseRestore";
import { SiDiscogs, SiSpotify } from "react-icons/si";
import { useFriends } from "@/hooks/useFriends";

type SyncResult = {
  message?: string;
  newReleases: string[];
  alreadyHave: string[];
  total?: number;
  totalCollection?: number;
  newCount?: number;
  errors?: { releaseId: string; error: string }[];
};
type IndexResult = { message?: string };

export default function DiscogsSyncPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [spotifyUsername, setSpotifyUsername] = useState("");
  const [syncingSpotify, setSyncingSpotify] = useState(false);
  const [updatingSpotifyIndex, setUpdatingSpotifyIndex] = useState(false);
  const [showSyncAlert, setShowSyncAlert] = useState(false);
  const [spotifySyncStatus, setSpotifySyncStatus] = useState<SyncResult | null>(
    null
  );

  const [showNewReleases, setShowNewReleases] = useState(false);
  const {
    friends,
    loading: friendsLoading,
    addFriend,
    removeFriend,
  } = useFriends();
  const [newFriend, setNewFriend] = useState("");
  const [syncing, setSyncing] = useState<{ [username: string]: boolean }>({});
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncStreamLines, setSyncStreamLines] = useState<string[]>([]);
  const [syncStreamDone, setSyncStreamDone] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    setInitialLoad(false);
  }, []);

  const handleSync = async (username?: string) => {
    const key = username || "me";
    setSyncing((prev) => ({ ...prev, [key]: true }));
    setResult(null);
    setError(null);
    setSyncStreamLines([]);
    setSyncStreamDone(false);
    setSyncDialogOpen(true);
    try {
      const url = username
        ? `/api/discogs?username=${encodeURIComponent(username)}`
        : "/api/discogs";
      const res = await fetch(url, { method: "GET" });
      if (!res.body) throw new Error("No response body for streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          setSyncStreamLines((prev) => [...prev, ...lines.filter(Boolean)]);
        }
        done = streamDone;
      }
      if (buffer) setSyncStreamLines((prev) => [...prev, buffer]);
      setSyncStreamDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSyncStreamDone(true);
    } finally {
      setSyncing((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleRemoveFriend = async (username: string) => {
    await removeFriend(username);
  };

  const [indexing, setIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState<IndexResult | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);

  const handleUpdateIndex = async () => {
    setIndexing(true);
    setIndexResult(null);
    setIndexError(null);
    try {
      const res = await fetch("/api/discogs/update-index", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setIndexResult(data);
    } catch (e) {
      setIndexError(e instanceof Error ? e.message : String(e));
    } finally {
      setIndexing(false);
    }
  };

  const [backingUp, setBackingUp] = useState(false);
  const [backupResult, setBackupResult] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  const handleBackup = async () => {
    setBackingUp(true);
    setBackupResult(null);
    setBackupError(null);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setBackupResult(data.message || "Backup complete");
    } catch (e) {
      setBackupError(e instanceof Error ? e.message : String(e));
    } finally {
      setBackingUp(false);
    }
  };

  // Chakra UI color mode value must be called unconditionally

  return (
    <>
      <Toaster />
      <TopMenuBar current={"/settings"} />
      {/* Streaming Sync Dialog */}
      <Dialog.Root
        open={syncDialogOpen}
        onOpenChange={(d) => setSyncDialogOpen(d.open)}
      >
        <Dialog.Positioner>
          <Dialog.Content maxW="600px">
            <Dialog.Header>
              <Dialog.Title>Discogs Sync Progress</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box
                maxH="350px"
                overflowY="auto"
                bg="gray.50"
                p={2}
                borderRadius="md"
                fontFamily="mono"
                fontSize="sm"
              >
                {syncStreamLines.length === 0 && (
                  <Text color="gray.400">Waiting for sync output...</Text>
                )}
                {syncStreamLines.map((line, i) => (
                  <Text key={i} whiteSpace="pre-wrap">
                    {line}
                  </Text>
                ))}
              </Box>
              {error && (
                <Alert.Root status="error" mt={3}>
                  <Alert.Indicator />
                  <Alert.Title>Error</Alert.Title>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Root>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                onClick={() => setSyncDialogOpen(false)}
                disabled={!syncStreamDone}
              >
                Close
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
      <Box maxW="700px" mx="auto" p={8}>
        <Heading mb={6} size="lg">
          Vinyl Playlist Maker Pro Edition Settings
        </Heading>
        {/* Sync Results Alert at the top, below the menu bar */}
        {result && showSyncAlert && (
          <Box maxW="700px" mx="auto" mt={4} mb={4}>
            <Alert.Root status="success">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Sync Results</Alert.Title>
                <Alert.Description>
                  <VStack align="start" gap={1}>
                    <Text>
                      <b>New releases downloaded:</b>{" "}
                      {result.newReleases.length}
                    </Text>
                    <Text>
                      <b>Already present:</b> {result.alreadyHave.length}
                    </Text>
                    <Text>
                      <b>Total releases processed:</b>{" "}
                      {result.total ||
                        result.totalCollection ||
                        result.newReleases.length + result.alreadyHave.length}
                    </Text>
                    {result.errors && result.errors.length > 0 && (
                      <Box color="orange.600" mt={2}>
                        <b>Errors:</b>
                        <VStack align="start" mt={1}>
                          {result.errors.map(
                            (
                              e: { releaseId: string; error: string },
                              i: number
                            ) => (
                              <Text key={i} fontSize="sm">
                                Release {e.releaseId}: {e.error}
                              </Text>
                            )
                          )}
                        </VStack>
                      </Box>
                    )}
                    {result.newReleases.length > 0 && (
                      <Box mt={2}>
                        <Collapsible.Root
                          open={showNewReleases}
                          onOpenChange={(details) =>
                            setShowNewReleases(details.open)
                          }
                        >
                          <Collapsible.Trigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowNewReleases((v) => !v)}
                              mb={2}
                            >
                              {showNewReleases
                                ? "Hide new release IDs"
                                : "Show new release IDs"}
                            </Button>
                          </Collapsible.Trigger>
                          <Collapsible.Content>
                            <Code
                              display="block"
                              whiteSpace="pre"
                              p={2}
                              mt={2}
                              fontSize="sm"
                            >
                              {JSON.stringify(result.newReleases, null, 2)}
                            </Code>
                          </Collapsible.Content>
                        </Collapsible.Root>
                      </Box>
                    )}
                  </VStack>
                </Alert.Description>
              </Alert.Content>
              <CloseButton
                pos="relative"
                top="-2"
                insetEnd="-2"
                onClick={() => setShowSyncAlert(false)}
              />
            </Alert.Root>
          </Box>
        )}
        {indexError && (
          <Alert.Root status="error" title="Error" mb={4}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Index Error Results</Alert.Title>
              <Alert.Description>{indexError}</Alert.Description>
            </Alert.Content>
            <CloseButton
              pos="relative"
              top="-2"
              insetEnd="-2"
              onClick={() => setIndexError(null)}
            />
          </Alert.Root>
        )}

        {indexResult && (
          <Alert.Root status="success" title="Success" mb={4}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Index Update Results</Alert.Title>
              <Alert.Description>{indexResult.message}</Alert.Description>
            </Alert.Content>
            <CloseButton
              pos="relative"
              top="-2"
              insetEnd="-2"
              onClick={() => setIndexResult(null)}
            />
          </Alert.Root>
        )}

        {spotifySyncStatus && (
          <Alert.Root status="success" title="Success" mb={4}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Spotify Sync Status</Alert.Title>
              <Alert.Description>
                {JSON.stringify(
                  { ...spotifySyncStatus, alreadyHave: undefined },
                  null,
                  2
                )}
              </Alert.Description>
            </Alert.Content>
            <CloseButton
              pos="relative"
              top="-2"
              insetEnd="-2"
              onClick={() => setSpotifySyncStatus(null)}
            />
          </Alert.Root>
        )}

        {error && (
          <Alert.Root status="error" title="Error">
            <Alert.Indicator />
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        )}

        {backupError && (
          <Alert.Root status="error" title="Backup Error">
            <Alert.Indicator />
            <Alert.Title>Backup Error</Alert.Title>
            <Alert.Description>{backupError}</Alert.Description>
          </Alert.Root>
        )}
        {backupResult && (
          <Alert.Root status="success" title="Backup Complete" mb={4}>
            <Alert.Indicator />
            <Alert.Title>Backup Complete</Alert.Title>
            <Alert.Description>{backupResult}</Alert.Description>
            <CloseButton
              pos="relative"
              top="-2"
              insetEnd="-2"
              onClick={() => setBackupResult(null)}
            />
          </Alert.Root>
        )}
        <SimpleGrid gap={4} columns={{ base: 1, md: 3 }}>
          <Button
            colorScheme="green"
            onClick={async () => {
              setUpdatingSpotifyIndex(true);
              try {
                const res = await fetch("/api/spotify/index", {
                  method: "POST",
                });
                const data = await res.json();
                if (!res.ok)
                  throw new Error(
                    data.error || "Failed to update Spotify index"
                  );
                toaster.create({
                  title: "Spotify Index Updated",
                  type: "success",
                  description: data.message || "Spotify index update complete",
                });
              } catch (e) {
                toaster.create({
                  title: "Spotify Index Update Failed",
                  type: "error",
                  description: e instanceof Error ? e.message : String(e),
                });
              } finally {
                setUpdatingSpotifyIndex(false);
              }
            }}
            loading={updatingSpotifyIndex}
            disabled={updatingSpotifyIndex || indexing || backingUp}
          >
            <FiDatabase /> Ingest Spotify Data
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleUpdateIndex}
            loading={indexing}
            disabled={indexing || Object.values(syncing).some(Boolean)}
          >
            <FiDatabase />
            Ingest Discogs Data
          </Button>
          <Button
            colorScheme="blue"
            onClick={() => handleSync()}
            loading={!!syncing["me"]}
            disabled={!!syncing["me"] || indexing}
          >
            <SiDiscogs />
            Sync Discogs
          </Button>

          <Button
            colorScheme="orange"
            onClick={handleBackup}
            loading={backingUp}
            disabled={
              backingUp || Object.values(syncing).some(Boolean) || indexing
            }
          >
            <FiBriefcase />
            Backup Database
          </Button>
          <Dialog.Root
            open={dialogOpen}
            onOpenChange={(details) => setDialogOpen(details.open)}
          >
            <Dialog.Trigger asChild>
              <Button colorScheme="teal" disabled={indexing || backingUp}>
                <SiSpotify />
                Sync Spotify
              </Button>
            </Dialog.Trigger>
            <Portal>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content>
                  <Dialog.Header>
                    <Dialog.Title>Sync Spotify Library</Dialog.Title>
                  </Dialog.Header>
                  <Dialog.Body>
                    <Text mb={2}>
                      Enter your Spotify username to sync and export your
                      library.
                    </Text>
                    <Input
                      placeholder="Spotify username"
                      value={spotifyUsername}
                      onChange={(e) => setSpotifyUsername(e.target.value)}
                      autoFocus
                    />
                  </Dialog.Body>
                  <Dialog.Footer>
                    <Dialog.ActionTrigger asChild>
                      <Button variant="outline">Cancel</Button>
                    </Dialog.ActionTrigger>
                    <Button
                      colorScheme="teal"
                      loading={syncingSpotify}
                      disabled={!spotifyUsername.trim() || syncingSpotify}
                      onClick={async () => {
                        setSyncingSpotify(true);
                        try {
                          const res = await fetch(
                            `/api/spotify/download?spotify_username=${encodeURIComponent(
                              spotifyUsername
                            )}`
                          );
                          if (res.status === 401) {
                            window.location.href = "/api/spotify/login";
                            return;
                          }
                          if (!res.ok)
                            throw new Error(
                              "Failed to download Spotify library"
                            );
                          setSpotifySyncStatus(await res.json());
                          setDialogOpen(false);
                        } catch (e) {
                          toaster.create({
                            title: "Spotify Download Failed",
                            type: "error",
                            description:
                              e instanceof Error ? e.message : String(e),
                          });
                        } finally {
                          setSyncingSpotify(false);
                        }
                      }}
                    >
                      Download
                    </Button>
                  </Dialog.Footer>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton size="sm" />
                  </Dialog.CloseTrigger>
                </Dialog.Content>
              </Dialog.Positioner>
            </Portal>
          </Dialog.Root>
        </SimpleGrid>

        <FriendsDiscogsSection
          friends={friends}
          friendsLoading={friendsLoading}
          newFriend={newFriend}
          setNewFriend={setNewFriend}
          handleAddFriend={async (onProgress?: (msg: string) => void) => {
            if (!newFriend.trim()) return;
            await addFriend(newFriend.trim(), onProgress);
            setNewFriend("");
          }}
          handleRemoveFriend={handleRemoveFriend}
          handleSync={handleSync}
          syncing={syncing}
          indexing={indexing}
          initialLoad={initialLoad}
        />

        <DatabaseBackups />

        <DatabaseRestore />
      </Box>
    </>
  );
}
