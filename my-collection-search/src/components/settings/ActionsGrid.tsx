// components/settings/ActionsGrid.tsx
"use client";
import { Button, SimpleGrid } from "@chakra-ui/react";
import { FiDatabase, FiBriefcase } from "react-icons/fi";
import { SiDiscogs, SiSpotify } from "react-icons/si";
import { toaster } from "@/components/ui/toaster";
import { useUpdateDiscogsIndex, useSyncDiscogs } from "@/hooks/useDiscogsQuery";
import { useIngestSpotifyIndex } from "@/hooks/useSpotifyQuery";
import { useBackupsQuery } from "@/hooks/useBackupsQuery";
import { useSettingsDialogs } from "@/providers/SettingsDialogProvider";

export default function ActionsGrid() {
  const discogsIndex = useUpdateDiscogsIndex();
  const discogsSync = useSyncDiscogs();
  const spotifyIndex = useIngestSpotifyIndex();
  const { addBackup, addBackupLoading } = useBackupsQuery();
  const { setSpotifySyncOpen } = useSettingsDialogs();

  const disableAll =
    discogsIndex.isPending || discogsSync.isPending || addBackupLoading;

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
          )
        }
        loading={discogsSync.isPending}
        disabled={discogsIndex.isPending}
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
    </SimpleGrid>
  );
}
