// components/settings/ActionsGrid.tsx
"use client";
import { useState } from "react";
import { Button, Flex, Menu, Text, Box } from "@chakra-ui/react";
import { FiBriefcase, FiMoreVertical } from "react-icons/fi";
import { SiDiscogs } from "react-icons/si";
import { toaster } from "@/components/ui/toaster";
import {
  useSyncDiscogs, useVerifyManifests, useCleanupManifests, useDeleteReleases,
} from "@/hooks/useDiscogsQuery";
import { useBackupsQuery } from "@/hooks/useBackupsQuery";
import ManifestVerificationDialog from "@/components/settings/dialogs/ManifestVerificationDialog";
import RemovedReleasesDialog from "@/components/settings/dialogs/RemovedReleasesDialog";
import type { VerificationResult } from "@/services/internalApi/discogs";

type ActionsGridProps = {
  showTitle?: boolean;
};

export default function ActionsGrid({ showTitle = true }: ActionsGridProps) {
  const [removedReleasesOpen, setRemovedReleasesOpen] = useState(false);
  const [removedReleases, setRemovedReleases] = useState<string[]>([]);
  const [removedUsername, setRemovedUsername] = useState<string>("");  const deleteReleases = useDeleteReleases();
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
  const { addBackup, addBackupLoading } = useBackupsQuery();

  const [verificationOpen, setVerificationOpen] = useState(false);
  const [verificationResults, setVerificationResults] = useState<
    VerificationResult[]
  >([]);

  const disableAll =
    discogsSync.isPending || addBackupLoading || verifyManifests.isPending;

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
    <Box mb={4}>
      <Flex align="center" justify="space-between" mb={4}>
        {showTitle ? (
          <Text fontWeight="bold" fontSize="lg">
            Settings
          </Text>
        ) : (
          <Box />
        )}
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button size="sm" variant="outline" disabled={disableAll}>
              <FiMoreVertical />
              <Box ml={2}>Actions</Box>
            </Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item
                value="sync-discogs"
                onClick={handleSyncClick}
                disabled={disableAll || discogsSync.isPending || verifyManifests.isPending}
              >
                <SiDiscogs /> Sync Discogs
              </Menu.Item>
              <Menu.Separator />

              <Menu.Item
                value="backup"
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
                disabled={disableAll || addBackup.isPending}
              >
                <FiBriefcase /> Backup Database
              </Menu.Item>

              <Menu.Separator />
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </Flex>

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
