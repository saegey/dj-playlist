import React from "react";
import {
  Dialog,
  Portal,
  CloseButton,
  Button,
  Input,
  Text,
} from "@chakra-ui/react";

interface NamePlaylistDialogProps {
  open: boolean;
  name: string;
  setName: (name: string) => void;
  trackCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export default function NamePlaylistDialog({
  open,
  name,
  setName,
  trackCount,
  onConfirm,
  onCancel,
  confirmLabel = "Import",
}: NamePlaylistDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(d) => !d.open && onCancel()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Name Playlist</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={onCancel} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Playlist name"
                mb={2}
              />
              {typeof trackCount === "number" && (
                <Text fontSize="sm" color="gray.500">
                  {trackCount} tracks will be saved.
                </Text>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                onClick={onConfirm}
                colorPalette="blue"
                disabled={!name.trim()}
              >
                {confirmLabel}
              </Button>
              <Button ml={2} variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
