// components/settings/dialogs/SpotifySyncDialog.tsx
"use client";
import { useState } from "react";
import { Dialog, Button, Text, Input, CloseButton } from "@chakra-ui/react";
import { useSettingsDialogs } from "@/providers/SettingsDialogProvider";
import { useDownloadSpotify } from "@/hooks/useSpotifyQuery";
import { toaster } from "@/components/ui/toaster";

export default function SpotifySyncDialog() {
  const { spotifySyncOpen, setSpotifySyncOpen } = useSettingsDialogs();
  const [username, setUsername] = useState("");
  const download = useDownloadSpotify();

  return (
    <Dialog.Root
      open={spotifySyncOpen}
      onOpenChange={(d) => setSpotifySyncOpen(d.open)}
    >
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Sync Spotify Library</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Text mb={2}>
              Enter your Spotify username to sync and export your library.
            </Text>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Spotify username"
              autoFocus
            />
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.ActionTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.ActionTrigger>
            <Button
              colorScheme="teal"
              loading={download.isPending}
              disabled={!username.trim() || download.isPending}
              onClick={() =>
                download.mutate(
                  { username: username.trim() },
                  {
                    onSuccess: (payload) => {
                      if (!payload) return; // redirected to login
                      toaster.create({
                        title: "Spotify Sync Complete",
                        type: "success",
                        description: `Synced ${payload.total ?? "your"} items`,
                      });
                      setSpotifySyncOpen(false);
                    },
                    onError: (e) =>
                      toaster.create({
                        title: "Spotify Download Failed",
                        type: "error",
                        description: e.message,
                      }),
                  }
                )
              }
            >
              Download
            </Button>
          </Dialog.Footer>
          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
