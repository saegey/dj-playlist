import React from "react";
import { Dialog, Portal, CloseButton, Button } from "@chakra-ui/react";

interface DeletePlaylistDialogProps {
  open: boolean;
  playlistId: number | null;
  onClose: () => void;
  fetchPlaylists: () => void;
  notify: (opts: { title: string; type: string }) => void;
}

export default function DeletePlaylistDialog({ open, playlistId, onClose, fetchPlaylists, notify }: DeletePlaylistDialogProps) {
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const confirmDeletePlaylist = async () => {
    if (playlistId == null) return;
    try {
      await fetch(`/api/playlists?id=${playlistId}`, {
        method: "DELETE",
      });
      notify({ title: "Playlist deleted.", type: "success" });
      fetchPlaylists();
    } catch {
      notify({ title: "Failed to delete playlist.", type: "error" });
    } finally {
      onClose();
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      role="alertdialog"
      initialFocusEl={() => cancelRef.current}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Delete Playlist</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  ref={cancelRef}
                  size="sm"
                  onClick={onClose}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              Are you sure? This action cannot be undone.
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                colorPalette="red"
                ml={3}
                onClick={confirmDeletePlaylist}
              >
                Delete
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
