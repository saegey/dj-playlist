// components/settings/ActionsGrid.tsx
"use client";
import { Button, SimpleGrid } from "@chakra-ui/react";
import { FiDatabase, FiBriefcase } from "react-icons/fi";
import { SiDiscogs, SiSpotify } from "react-icons/si";
import { toaster } from "@/components/ui/toaster";
import { useUpdateDiscogsIndex, useSyncDiscogs } from "@/hooks/useDiscogsQuery";
import { useIngestSpotifyIndex } from "@/hooks/useSpotifyQuery";
import { useBackupDatabase } from "@/hooks/useBackupsQuery";
import { useSettingsDialogs } from "@/providers/SettingsDialogProvider";

export default function ActionsGrid() {
  const discogsIndex = useUpdateDiscogsIndex();
  const discogsSync = useSyncDiscogs();
  const spotifyIndex = useIngestSpotifyIndex();
  const backup = useBackupDatabase();
  const { setSpotifySyncOpen } = useSettingsDialogs();

  const disableAll =
    discogsIndex.isPending || discogsSync.isPending || backup.isPending;

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
        onClick={() =>
          discogsSync.mutate(
            { username: undefined },
            {
              onSuccess: (summary) => {
                if (summary) {
                  toaster.create({
                    title: "Discogs Sync Finished",
                    type: "success",
                    description: `New: ${
                      summary.newReleases?.length ?? 0
                    } | Already: ${summary.alreadyHave?.length ?? 0}`,
                  });
                }
              },
              onError: (e) =>
                toaster.create({
                  title: "Discogs Sync Failed",
                  type: "error",
                  description: e.message,
                }),
            }
          )
        }
        loading={discogsSync.isPending}
        disabled={discogsIndex.isPending}
      >
        <SiDiscogs /> Sync Discogs
      </Button>

      <Button
        onClick={() =>
          backup.mutate(undefined, {
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
        loading={backup.isPending}
        disabled={disableAll}
      >
        <FiBriefcase /> Backup Database
      </Button>

      <Button onClick={() => setSpotifySyncOpen(true)} disabled={disableAll}>
        <SiSpotify /> Sync Spotify
      </Button>
    </SimpleGrid>
  );
}
