// components/settings/FriendsDiscogsSection.tsx
"use client";

import React, { useRef, useState } from "react";
import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Input,
  Button,
  Skeleton,
} from "@chakra-ui/react";
import { FiRefreshCcw, FiTrash } from "react-icons/fi";

import { useFriendsQuery } from "@/hooks/useFriendsQuery";
import {
  useSyncDiscogs,
  useVerifyManifests,
  useCleanupManifests,
  useDeleteReleases,
} from "@/hooks/useDiscogsQuery";
import { useFriendsSync } from "@/hooks/useFriendsSync"; // streams + opens RemoveFriendDialog
import ManifestVerificationDialog from "@/components/settings/dialogs/ManifestVerificationDialog";
import RemovedReleasesDialog from "@/components/settings/dialogs/RemovedReleasesDialog";
import type { VerificationResult } from "@/services/internalApi/discogs";
import { toaster } from "@/components/ui/toaster";

export default function FriendsDiscogsSection() {
  const [newFriend, setNewFriend] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationResults, setVerificationResults] = useState<
    VerificationResult[]
  >([]);
  const [pendingUsername, setPendingUsername] = useState<string | undefined>();
  const [removedReleasesOpen, setRemovedReleasesOpen] = useState(false);
  const [removedReleases, setRemovedReleases] = useState<string[]>([]);
  const [removedUsername, setRemovedUsername] = useState<string>("");

  // Friends list + add/remove (React Query)
  const {
    friends,
    friendsLoading,
    addFriend,
    removeFriendPending, // (available if you want a global disable)
    addFriendPending,
  } = useFriendsQuery();

  // Discogs per-friend sync (streamed output handled by dialog/context)
  const discogsSync = useSyncDiscogs((data) => {
    // Called when removed releases are detected during sync
    if (data.removedIds.length > 0) {
      setRemovedReleases(data.removedIds);
      setRemovedUsername(data.username);
      setRemovedReleasesOpen(true);
    }
  });
  const verifyManifests = useVerifyManifests();
  const cleanupManifests = useCleanupManifests();
  const deleteReleases = useDeleteReleases();

  // Removal with streamed progress + dialog
  const { handleRemoveFriend } = useFriendsSync();

  const startAddFriend = async () => {
    const u = newFriend.trim();
    if (!u) return;
    await addFriend(u);
    setNewFriend("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSyncClick = async (username: string) => {
    setPendingUsername(username);
    try {
      const result = await verifyManifests.mutateAsync();
      setVerificationResults(result.results);
      setVerificationOpen(true);
    } catch (err) {
      toaster.create({
        title: "Verification Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "error",
      });
    }
  };

  const handleCleanupAndContinue = async () => {
    try {
      const result = await cleanupManifests.mutateAsync();
      toaster.create({
        title: "Manifest Cleaned",
        description: `Removed ${result.summary.totalRemoved} invalid entries`,
        type: "success",
      });
      setVerificationOpen(false);
      // Proceed with sync
      if (pendingUsername) {
        discogsSync.mutate({ username: pendingUsername });
      }
    } catch (err) {
      toaster.create({
        title: "Cleanup Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "error",
      });
    }
  };

  const handleContinueWithoutCleanup = () => {
    setVerificationOpen(false);
    if (pendingUsername) {
      discogsSync.mutate({ username: pendingUsername });
    }
  };

  const handleDeleteRemovedReleases = async () => {
    try {
      const result = await deleteReleases.mutateAsync({
        username: removedUsername,
        releaseIds: removedReleases,
      });
      toaster.create({
        title: "Releases Deleted",
        description: `Deleted ${result.deletedFromDb} tracks from database and search index. Sync continuing in background...`,
        type: "success",
        duration: 5000,
      });
      setRemovedReleasesOpen(false);
    } catch (err) {
      toaster.create({
        title: "Delete Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        type: "error",
      });
    }
  };

  const handleSkipDeleteRemovedReleases = () => {
    setRemovedReleasesOpen(false);
    toaster.create({
      title: "Skipped Deletion",
      description: "Files kept on disk. Sync continuing in background...",
      type: "info",
      duration: 5000,
    });
  };

  const disableAdd = addFriendPending;

  return (
    <Box mt={10} mb={8} p={4} borderWidth={1} borderRadius="md">
      <Heading size="md" mb={2}>
        Friends&apos; Discogs Collections
      </Heading>
      <Text mb={2}>
        Add friends&apos; Discogs usernames to sync or browse their collections
        for playlist collaboration or borrowing albums.
      </Text>

      <HStack mb={4}>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Add friend's username"
          value={newFriend}
          onChange={(e) => setNewFriend(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newFriend.trim() && !disableAdd) {
              startAddFriend();
            }
          }}
        />
        <Button
          colorScheme="green"
          onClick={startAddFriend}
          disabled={!newFriend.trim() || disableAdd}
          loading={addFriendPending}
        >
          Add
        </Button>
      </HStack>

      <VStack align="stretch">
        {friendsLoading ? (
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
          friends.map((friend) => (
            <HStack
              key={friend.username}
              width="100%"
              justifyContent="space-between"
            >
              <Text fontWeight="medium">{friend.username}</Text>
              <HStack justifyContent="flex-end" flexGrow={1}>
                <Button
                  size="xs"
                  colorScheme="blue"
                  onClick={() => handleSyncClick(friend.username)}
                  loading={
                    discogsSync.isPending || verifyManifests.isPending
                  }
                  disabled={
                    discogsSync.isPending || verifyManifests.isPending
                  }
                  title="Sync Discogs"
                >
                  <FiRefreshCcw />
                </Button>
                <Button
                  size="xs"
                  colorPalette="red"
                  onClick={() => handleRemoveFriend(friend.username)} // opens dialog + streams
                  title="Remove friend"
                  disabled={removeFriendPending}
                >
                  <FiTrash />
                </Button>
              </HStack>
            </HStack>
          ))
        )}
      </VStack>

      <ManifestVerificationDialog
        open={verificationOpen}
        onOpenChange={setVerificationOpen}
        results={verificationResults}
        onCleanup={handleCleanupAndContinue}
        onContinue={handleContinueWithoutCleanup}
        cleanupPending={cleanupManifests.isPending}
      />

      <RemovedReleasesDialog
        open={removedReleasesOpen}
        onOpenChange={setRemovedReleasesOpen}
        username={removedUsername}
        removedIds={removedReleases}
        onDelete={handleDeleteRemovedReleases}
        onSkip={handleSkipDeleteRemovedReleases}
        deletePending={deleteReleases.isPending}
      />
    </Box>
  );
}
