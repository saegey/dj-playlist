import React from "react";
import {
  Dialog,
  Portal,
  Button,
  Spinner,
  VStack,
  Text,
  CloseButton,
} from "@chakra-ui/react";

interface AddFriendDialogProps {
  open: boolean;
  onClose: () => void;
  progressMessages: string[];
  loading: boolean;
}

const AddFriendDialog: React.FC<AddFriendDialogProps> = ({
  open,
  onClose,
  progressMessages,
  loading,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={(d) => { if (!d.open) onClose(); }}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Adding Friend</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={onClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="start" gap={2} maxH="200px" overflowY="auto">
                {progressMessages.length === 0 && (
                  <Text color="gray.400">Starting...</Text>
                )}
                {progressMessages.map((msg, i) => (
                  <Text key={i} fontSize="sm">{msg}</Text>
                ))}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              {loading && <Spinner size="sm" color="blue.500" />}
              <Button onClick={onClose} ml={2} disabled={loading}>
                Close
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default AddFriendDialog;
