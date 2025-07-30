"use client";

import { useState, useEffect } from "react";
import { useFriends } from "@/hooks/useFriends";
import {
  Box,
  Button,
  Heading,
  Text,
  Alert,
  VStack,
  HStack,
  Code,
  Input,
  Collapsible,
  SimpleGrid,
  CloseButton,
  FileUpload,
  Skeleton,
} from "@chakra-ui/react";
import { HiUpload } from "react-icons/hi";
import { toaster, Toaster } from "@/components/ui/toaster";
import TopMenuBar from "@/components/MenuBar";
import { FiDownload } from "react-icons/fi";

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
  const [showSyncAlert, setShowSyncAlert] = useState(false);
  // Backfill embeddings state
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<null | {
    updated: number;
    failed: string[];
    error?: string;
  }>(null);
  const [backfillError, setBackfillError] = useState<string | null>(null);

  const handleBackfillEmbeddings = async () => {
    setBackfilling(true);
    setBackfillResult(null);
    setBackfillError(null);
    try {
      const res = await fetch("/api/tracks/backfill-embeddings", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setBackfillResult(data);
      toaster.create({
        title: "Backfill complete",
        type: "success",
        description: `Updated: ${data.updated}, Failed: ${data.failed.length}`,
      });
    } catch (e) {
      setBackfillError(e instanceof Error ? e.message : String(e));
      toaster.create({
        title: "Backfill failed",
        type: "error",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBackfilling(false);
    }
  };
  const [backups, setBackups] = useState<string[]>([]);
  const [showAllBackups, setShowAllBackups] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [backupListError, setBackupListError] = useState<string | null>(null);

  // Fetch backups on mount
  useEffect(() => {
    const fetchBackups = async () => {
      setLoadingBackups(true);
      setBackupListError(null);
      try {
        const res = await fetch("/api/backups");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unknown error");
        setBackups(
          data.files.filter(
            (file: string) => file !== "restore.sql" && file !== "clean.sql"
          ) || []
        );
      } catch (e) {
        setBackupListError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoadingBackups(false);
      }
    };
    fetchBackups();
  }, []);
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
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    setInitialLoad(false);
  }, []);

  const handleSync = async (username?: string) => {
    const key = username || "me";
    setSyncing((prev) => ({ ...prev, [key]: true }));
    setResult(null);
    setError(null);
    try {
      const url = username
        ? `/api/discogs?username=${encodeURIComponent(username)}`
        : "/api/discogs";
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResult(data);
      setShowSyncAlert(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing((prev) => ({ ...prev, [key]: false }));
    }
  };
  const handleAddFriend = async () => {
    const username = newFriend.trim();
    if (username && !friends.includes(username)) {
      await addFriend(username);
      setNewFriend("");
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

  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoring(true);
    setRestoreResult(null);
    setRestoreError(null);
    try {
      const formData = new FormData();
      formData.append("file", restoreFile);
      const res = await fetch("/api/restore", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setRestoreResult(data.message || "Restore complete");
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : String(e));
    } finally {
      setRestoring(false);
    }
  };

  // Chakra UI color mode value must be called unconditionally

  return (
    <>
      <Toaster />
      <TopMenuBar current={"/discogs"} />
      <Box maxW="700px" mx="auto" p={8}>
        <Heading mb={6} size="lg">
          Vinyl Playlist Maker Pro Edition Settings
        </Heading>
        {restoreError && (
          <>
            <Alert.Root status="error" title="Error" mb={4}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Restore Error</Alert.Title>
                <Alert.Description>{restoreError}</Alert.Description>
              </Alert.Content>
              <CloseButton
                pos="relative"
                top="-2"
                insetEnd="-2"
                onClick={() => setRestoreError(null)}
              />
            </Alert.Root>
          </>
        )}
        {restoreResult && (
          <>
            <Alert.Root status="success" title="Restore Complete" mb={4}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Restore Complete</Alert.Title>
                <Alert.Description>{restoreResult}</Alert.Description>
              </Alert.Content>
              <CloseButton
                pos="relative"
                top="-2"
                insetEnd="-2"
                onClick={() => setRestoreResult(null)}
              />
            </Alert.Root>
          </>
        )}
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
          <Alert.Root status="success" title="Backup Complete">
            <Alert.Indicator />
            <Alert.Title>Backup Complete</Alert.Title>
            <Alert.Description>{backupResult}</Alert.Description>
          </Alert.Root>
        )}
        <SimpleGrid gap={4} columns={{ base: 1, md: 3 }}>
          <Button
            colorScheme="blue"
            onClick={() => handleSync()}
            loading={!!syncing["me"]}
            disabled={!!syncing["me"] || indexing}
          >
            Sync My Collection
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleUpdateIndex}
            loading={indexing}
            disabled={indexing || Object.values(syncing).some(Boolean)}
          >
            Update Index
          </Button>
          <Button
            colorScheme="orange"
            onClick={handleBackup}
            loading={backingUp}
            disabled={
              backingUp || Object.values(syncing).some(Boolean) || indexing
            }
          >
            Backup Database
          </Button>
          <Button
            colorScheme="pink"
            onClick={handleBackfillEmbeddings}
            loading={backfilling}
            disabled={
              backfilling ||
              Object.values(syncing).some(Boolean) ||
              indexing ||
              backingUp
            }
            title="Recompute all track embeddings and update MeiliSearch"
          >
            Backfill Embeddings
          </Button>
        </SimpleGrid>
        {backfillError && (
          <Alert.Root status="error" title="Backfill Error">
            <Alert.Indicator />
            <Alert.Title>Backfill Error</Alert.Title>
            <Alert.Description>{backfillError}</Alert.Description>
          </Alert.Root>
        )}
        {backfillResult && (
          <Box mt={6} p={4} borderWidth={1} borderRadius="md">
            <Heading size="md" mb={2}>
              Embedding Backfill Results
            </Heading>
            <Text>Updated: {backfillResult.updated}</Text>
            <Text>Failed: {backfillResult.failed.length}</Text>
            {backfillResult.failed.length > 0 && (
              <Box mt={2} color="orange.600">
                <b>Failed track IDs:</b>
                <Code
                  display="block"
                  whiteSpace="pre"
                  p={2}
                  mt={2}
                  fontSize="sm"
                >
                  {JSON.stringify(backfillResult.failed, null, 2)}
                </Code>
              </Box>
            )}
          </Box>
        )}

        <Box mt={10} mb={8} p={4} borderWidth={1} borderRadius="md">
          {/* Friends section and all alerts/results should be inside the main Box */}
          <Heading size="md" mb={2}>
            Friends&apos; Discogs Collections
          </Heading>
          <Text mb={2}>
            Add friends&apos; Discogs usernames to sync or browse their
            collections for playlist collaboration or borrowing albums.
          </Text>
          <HStack mb={4}>
            <Input
              type="text"
              placeholder="Add friend's username"
              value={newFriend}
              onChange={(e) => setNewFriend(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddFriend();
              }}
            />
            <Button
              colorScheme="green"
              onClick={handleAddFriend}
              disabled={!newFriend.trim()}
            >
              Add
            </Button>
          </HStack>
          <VStack align="stretch">
            {initialLoad || friendsLoading ? (
              [...Array(3)].map((_, i) => (
                <HStack key={i} width="100%" justifyContent="space-between">
                  <Skeleton height="20px" width="40%" />
                  <HStack width="100%" justifyContent="flex-end" gap={2}>
                    <Skeleton height="28px" width="48px" />
                    <Skeleton height="28px" width="64px" />
                  </HStack>
                </HStack>
              ))
            ) : friends.length === 0 ? (
              <Text color="gray.400">No friends added yet.</Text>
            ) : (
              friends.map((username) => (
                <HStack
                  key={username}
                  width="100%"
                  justifyContent="space-between"
                >
                  <Text fontWeight="medium">{username}</Text>
                  <HStack justifyContent="flex-end" width="100%">
                    <Button
                      size="xs"
                      colorScheme="blue"
                      onClick={() => handleSync(username)}
                      loading={!!syncing[username]}
                      disabled={!!syncing[username] || indexing}
                    >
                      Sync
                    </Button>
                    <Button
                      size="xs"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleRemoveFriend(username)}
                    >
                      Remove
                    </Button>
                  </HStack>
                </HStack>
              ))
            )}
          </VStack>
        </Box>

        <Box mt={10} mb={8} p={4} borderWidth={1} borderRadius="md">
          <Heading size="md" mb={2}>
            Database Backups
          </Heading>
          {initialLoad || loadingBackups ? (
            <VStack align="stretch" gap={3}>
              {[...Array(5)].map((_, i) => (
                <HStack key={i} justify="space-between">
                  <Skeleton height="20px" width="60%" />
                  <Skeleton height="28px" width="40px" />
                </HStack>
              ))}
            </VStack>
          ) : backupListError ? (
            <Box color="red.500" mb={2}>
              <b>Error:</b> {backupListError}
            </Box>
          ) : backups.length === 0 ? (
            <Text>No backups found in the directory.</Text>
          ) : (
            <>
              <VStack align="stretch" gap={3}>
                {(showAllBackups ? backups : backups.slice(0, 5)).map(
                  (file) => (
                    <HStack key={file} justify="space-between">
                      <Text fontSize="sm">{file}</Text>
                      <a
                        href={`/api/backups/${encodeURIComponent(file)}`}
                        download
                        style={{ textDecoration: "none" }}
                      >
                        <Button colorScheme="blue" size="xs">
                          <FiDownload />
                        </Button>
                      </a>
                    </HStack>
                  )
                )}
              </VStack>
              {backups.length > 5 && (
                <Button
                  mt={3}
                  size="sm"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={() => setShowAllBackups((v) => !v)}
                  alignSelf="flex-start"
                >
                  {showAllBackups
                    ? "Show Less"
                    : `Show All (${backups.length})`}
                </Button>
              )}
            </>
          )}
        </Box>

        <Box mt={10} mb={8} p={4} borderWidth={1} borderRadius="md">
          <Heading size="md" mb={2}>
            Restore Database from SQL File
          </Heading>
          <Text mb={2}>
            Upload a SQL backup file to restore your database. This will
            overwrite all current data.
          </Text>
          <HStack mb={4}>
            <FileUpload.Root
              accept=".sql"
              onChange={(event) => {
                const input = event.target as HTMLInputElement;
                const fileList = input.files;
                if (fileList && fileList[0]) setRestoreFile(fileList[0]);
              }}
              disabled={restoring}
            >
              <FileUpload.HiddenInput />
              <FileUpload.Trigger asChild>
                <Button variant="outline" size="sm">
                  <HiUpload /> Upload file
                </Button>
              </FileUpload.Trigger>
              <FileUpload.List />
            </FileUpload.Root>
            <Button
              colorScheme="red"
              onClick={handleRestore}
              disabled={!restoreFile || restoring}
              loading={restoring}
            >
              Restore Database
            </Button>
          </HStack>
        </Box>
      </Box>
    </>
  );
}
