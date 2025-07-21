"use client";

import { useState, useEffect } from "react";
type Friend = {
  username: string;
};

// You could load this from a config, DB, or user profile in a real app
const DEFAULT_FRIENDS: Friend[] = [
  { username: "Cdsmooth" },
  { username: "starlustre" },
  // Example: { username: 'friend1' },
];
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
  Spinner,
} from "@chakra-ui/react";
import TopMenuBar from "@/components/MenuBar";

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
  const [backups, setBackups] = useState<string[]>([]);
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
        setBackups(data.files || []);
      } catch (e) {
        setBackupListError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoadingBackups(false);
      }
    };
    fetchBackups();
  }, []);
  const [showNewReleases, setShowNewReleases] = useState(false);
  const [friends, setFriends] = useState<Friend[]>(DEFAULT_FRIENDS);
  const [newFriend, setNewFriend] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async (username?: string) => {
    setSyncing(true);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  };
  const handleAddFriend = () => {
    const username = newFriend.trim();
    if (username && !friends.some((f) => f.username === username)) {
      setFriends([...friends, { username }]);
      setNewFriend("");
    }
  };

  const handleRemoveFriend = (username: string) => {
    setFriends(friends.filter((f) => f.username !== username));
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
      <TopMenuBar current={"/discogs"} />
      <Box maxW="700px" mx="auto" p={8}>
        <Heading mb={6} size="lg">
          Vinyl Playlist Maker Pro Edition Settings
        </Heading>
        <HStack mb={6}>
          <Button
            colorScheme="blue"
            onClick={() => handleSync()}
            loading={syncing}
            disabled={syncing || indexing}
          >
            Sync My Collection
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleUpdateIndex}
            loading={indexing}
            disabled={indexing || syncing}
          >
            Update Index
          </Button>
          <Button
            colorScheme="orange"
            onClick={handleBackup}
            loading={backingUp}
            disabled={backingUp || syncing || indexing}
          >
            Backup Database
          </Button>
        </HStack>

        <Box mt={10} mb={8} p={4} borderWidth={1} borderRadius="md">
          <Heading size="md" mb={2}>Existing Database Backups</Heading>
          {loadingBackups ? (
            <Spinner />
          ) : backupListError ? (
            <Box color="red.500" mb={2}>
              <b>Error:</b> {backupListError}
            </Box>
          ) : backups.length === 0 ? (
            <Text>No backups found in the directory.</Text>
          ) : (
            <VStack align="stretch" gap={3}>
              {backups.map((file) => (
                <HStack key={file} justify="space-between">
                  <Text fontSize="sm">{file}</Text>
                  <a
                    href={`/api/backups/${encodeURIComponent(file)}`}
                    download
                    style={{ textDecoration: "none" }}
                  >
                    <Button colorScheme="blue" size="sm">Download</Button>
                  </a>
                </HStack>
              ))}
            </VStack>
          )}
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
          {friends.length === 0 && (
            <Text color="gray.400">No friends added yet.</Text>
          )}
          {friends.map((friend) => (
            <HStack key={friend.username}>
              <Text fontWeight="medium">{friend.username}</Text>
              <Button
                size="xs"
                colorScheme="blue"
                onClick={() => handleSync(friend.username)}
                loading={syncing}
                disabled={syncing || indexing}
              >
                Sync
              </Button>
              <Button
                size="xs"
                colorScheme="red"
                variant="outline"
                onClick={() => handleRemoveFriend(friend.username)}
              >
                Remove
              </Button>
            </HStack>
          ))}
        </VStack>
      </Box>

        {indexError && (
          <Alert.Root status="error" title="Error">
          <Box borderBottom="1px solid" borderColor="gray.200" mb={2} />
            <Alert.Title>Index Error</Alert.Title>
            <Alert.Description>{indexError}</Alert.Description>
          </Alert.Root>
        )}

        {indexResult && (
          <Box mt={6} p={4} borderWidth={1} borderRadius="md">
            <Heading size="md" mb={2}>
              Index Update Results
            </Heading>
            <Text>{indexResult.message}</Text>
          </Box>
        )}

        {error && (
          <Alert.Root status="error" title="Error">
            <Alert.Indicator />
            <Alert.Title>Error</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Root>
        )}

        {result && (
          <Box mt={6} p={4} borderWidth={1} borderRadius="md">
            <Heading size="md" mb={2}>
              Sync Results
            </Heading>
            <VStack align="start">
              <Text>
                <b>New releases downloaded:</b> {result.newReleases.length}
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
            </VStack>
            {result.errors && result.errors.length > 0 && (
              <Box color="orange.600" mt={4}>
                <b>Errors:</b>
                <VStack align="start" mt={1}>
                  {result.errors.map(
                    (e: { releaseId: string; error: string }, i: number) => (
                      <Text key={i} fontSize="sm">
                        Release {e.releaseId}: {e.error}
                      </Text>
                    )
                  )}
                </VStack>
              </Box>
            )}
            {result.newReleases.length > 0 && (
              <Collapsible.Root
                open={showNewReleases}
                onOpenChange={(details) => setShowNewReleases(details.open)}
              >
                <Box mt={4}>
                  <Box borderBottom="1px" borderColor="gray.200" mb={2} />
                  <Collapsible.Trigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewReleases((v) => !v)}
                      mb={2}
                    >
                      {showNewReleases ? "Hide new release IDs" : "Show new release IDs"}
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
                </Box>
              </Collapsible.Root>
            )}
          </Box>
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

        <Box mt={10} mb={8} p={4} borderWidth={1} borderRadius="md">
          <Heading size="md" mb={2}>Restore Database from SQL File</Heading>
          <Text mb={2}>Upload a SQL backup file to restore your database. This will overwrite all current data.</Text>
          <HStack mb={4}>
            <Input
              type="file"
              accept=".sql"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setRestoreFile(e.target.files[0]);
                }
              }}
              disabled={restoring}
            />
            <Button
              colorScheme="red"
              onClick={handleRestore}
              disabled={!restoreFile || restoring}
              loading={restoring}
            >
              Restore Database
            </Button>
          </HStack>
          {restoreError && (
            <Alert.Root status="error" title="Restore Error">
              <Alert.Indicator />
              <Alert.Title>Restore Error</Alert.Title>
              <Alert.Description>{restoreError}</Alert.Description>
            </Alert.Root>
          )}
          {restoreResult && (
            <Alert.Root status="success" title="Restore Complete">
              <Alert.Indicator />
              <Alert.Title>Restore Complete</Alert.Title>
              <Alert.Description>{restoreResult}</Alert.Description>
            </Alert.Root>
          )}
        </Box>
      </Box>
    </>
  );
}
