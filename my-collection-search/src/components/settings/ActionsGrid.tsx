// components/settings/ActionsGrid.tsx
"use client";
import { useState } from "react";
import { Button, SimpleGrid } from "@chakra-ui/react";
import { FiDatabase, FiBriefcase } from "react-icons/fi";
import { SiDiscogs, SiSpotify } from "react-icons/si";
import { toaster } from "@/components/ui/toaster";
import {
  useUpdateDiscogsIndex,
  useSyncDiscogs,
  useVerifyManifests,
  useCleanupManifests,
  useDeleteReleases,
} from "@/hooks/useDiscogsQuery";
import { useIngestSpotifyIndex } from "@/hooks/useSpotifyQuery";
import { useBackupsQuery } from "@/hooks/useBackupsQuery";
import { useSettingsDialogs } from "@/providers/SettingsDialogProvider";
import ManifestVerificationDialog from "@/components/settings/dialogs/ManifestVerificationDialog";
import RemovedReleasesDialog from "@/components/settings/dialogs/RemovedReleasesDialog";
import type { VerificationResult } from "@/services/internalApi/discogs";

export default function ActionsGrid() {
  const [removedReleasesOpen, setRemovedReleasesOpen] = useState(false);
  const [removedReleases, setRemovedReleases] = useState<string[]>([]);
  const [removedUsername, setRemovedUsername] = useState<string>("");

  const discogsIndex = useUpdateDiscogsIndex();
  const deleteReleases = useDeleteReleases();
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
  const spotifyIndex = useIngestSpotifyIndex();
  const { addBackup, addBackupLoading } = useBackupsQuery();
  const { setSpotifySyncOpen } = useSettingsDialogs();

  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationResults, setVerificationResults] = useState<
    VerificationResult[]
  >([]);

  const disableAll =
    discogsIndex.isPending ||
    discogsSync.isPending ||
    addBackupLoading ||
    verifyManifests.isPending;

  const handleSyncClick = async () => {
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
      discogsSync.mutate(
        { username: undefined },
        {
          onSuccess: () => {
            toaster.create({
              title: "Discogs Sync Finished",
              type: "success",
              description: `Discogs Sync Finished`,
            });
          },
          onError: (e) =>
            toaster.create({
              title: "Discogs Sync Failed",
              type: "error",
              description: e.message,
            }),
        }
      );
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
    discogsSync.mutate(
      { username: undefined },
      {
        onSuccess: () => {
          toaster.create({
            title: "Discogs Sync Complete",
            type: "success",
            description: `Sync and auto-ingest completed successfully`,
            duration: 5000,
          });
        },
        onError: (e) =>
          toaster.create({
            title: "Discogs Sync Failed",
            type: "error",
            description: e.message,
          }),
      }
    );
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

  return (
    <SimpleGrid gap={4} columns={{ base: 1, md: 3 }}>
      <Button
        onClick={() =>
          spotifyIndex.mutate(undefined, {
            onSuccess: (data) =>
              toaster.create({
                title: "Spotify Index Updated",
                type: "success",
                description: data?.message || "Done",
              }),
            onError: (e) =>
              toaster.create({
                title: "Spotify Index Update Failed",
                type: "error",
                description: e.message,
              }),
          })
        }
        loading={spotifyIndex.isPending}
        disabled={disableAll}
      >
        <FiDatabase /> Ingest Spotify Data
      </Button>

      <Button
        onClick={() =>
          discogsIndex.mutate(undefined, {
            onSuccess: (data) =>
              toaster.create({
                title: "Discogs Ingest Complete",
                type: "success",
                description: data?.message || "Done",
              }),
            onError: (e) =>
              toaster.create({
                title: "Discogs Ingest Failed",
                type: "error",
                description: e.message,
              }),
          })
        }
        loading={discogsIndex.isPending}
        disabled={disableAll}
      >
        <FiDatabase /> Ingest Discogs Data
      </Button>

      <Button
        onClick={handleSyncClick}
        loading={discogsSync.isPending || verifyManifests.isPending}
        disabled={disableAll}
      >
        <SiDiscogs /> Sync Discogs
      </Button>

      <Button
        onClick={() =>
          addBackup.mutate(undefined, {
            onSuccess: (res) =>
              toaster.create({
                title: "Backup Complete",
                type: "success",
                description: res.message,
              }),
            onError: (e) =>
              toaster.create({
                title: "Backup Failed",
                type: "error",
                description: e.message,
              }),
          })
        }
        loading={addBackup.isPending}
        disabled={disableAll}
      >
        <FiBriefcase /> Backup Database
      </Button>

      <Button onClick={() => setSpotifySyncOpen(true)} disabled={disableAll}>
        <SiSpotify /> Sync Spotify
      </Button>

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
    </SimpleGrid>
  );
}
